-- ══════════════════════════════════════════════════════════════
-- FIX: Dinner party RLS infinite recursion
--      + Ranked score for published recipes
--      + Tournament mode for dinner parties
-- Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════

-- ── 1. BREAK THE CIRCULAR RLS DEPENDENCY ─────────────────────
--
-- The problem:
--   dinner_parties policy → subquery on dinner_party_guests
--   dinner_party_guests policy → subquery on dinner_parties
--   → infinite recursion
--
-- Fix: SECURITY DEFINER functions bypass RLS, breaking the cycle.

-- Helper: is this user the host of a party?
create or replace function is_party_host(party_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from dinner_parties
    where id = party_id and host_id = auth.uid()
  );
$$;

-- Helper: is this user an accepted/invited guest of a party?
create or replace function is_party_guest(party_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from dinner_party_guests
    where dinner_party_guests.party_id = is_party_guest.party_id
      and user_id = auth.uid()
  );
$$;

-- Helper: can this user access a party (host OR guest)?
create or replace function can_access_party(party_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from dinner_parties
    where id = party_id and host_id = auth.uid()
  )
  or exists (
    select 1 from dinner_party_guests
    where dinner_party_guests.party_id = can_access_party.party_id
      and user_id = auth.uid()
  );
$$;

-- Drop old circular policies
drop policy if exists "host full access"             on dinner_parties;
drop policy if exists "guests can read their parties" on dinner_parties;
drop policy if exists "host manages guests"           on dinner_party_guests;
drop policy if exists "guest manages own rsvp"        on dinner_party_guests;
drop policy if exists "guests can read guest list"    on dinner_party_guests;
drop policy if exists "party members can comment"     on dinner_party_comments;

-- Recreate dinner_parties policies (no circular subqueries)
create policy "dp host full access" on dinner_parties
  for all using (host_id = auth.uid());

create policy "dp guests can read" on dinner_parties
  for select using (is_party_guest(id));

-- Recreate dinner_party_guests policies (no circular subqueries)
create policy "dpg host manages" on dinner_party_guests
  for all using (is_party_host(party_id));

create policy "dpg guest manages own rsvp" on dinner_party_guests
  for update using (user_id = auth.uid());

create policy "dpg guests can read guest list" on dinner_party_guests
  for select using (can_access_party(party_id));

create policy "dpg guests can insert self" on dinner_party_guests
  for insert with check (user_id = auth.uid());

-- Recreate comments policy
create policy "dpc party members can comment" on dinner_party_comments
  for all using (can_access_party(party_id));


-- ── 2. TOURNAMENT MODE ────────────────────────────────────────
--
-- Guests can vote on recipes served at a dinner party.
-- Results ranked and shown on the party page.

create table if not exists dinner_party_recipe_votes (
  id        uuid        default gen_random_uuid() primary key,
  party_id  uuid        references dinner_parties(id) on delete cascade not null,
  recipe_id uuid        references recipes(id) on delete cascade not null,
  voter_id  uuid        references auth.users not null,
  score     smallint    not null check (score between 1 and 5),
  note      text,
  voted_at  timestamptz default now(),
  constraint unique_party_recipe_vote unique (party_id, recipe_id, voter_id)
);

alter table dinner_party_recipe_votes enable row level security;

create policy "tournament vote access" on dinner_party_recipe_votes
  for all using (can_access_party(party_id));

create index if not exists idx_dpv_party    on dinner_party_recipe_votes(party_id);
create index if not exists idx_dpv_recipe   on dinner_party_recipe_votes(recipe_id);
create index if not exists idx_dpv_voter    on dinner_party_recipe_votes(voter_id);

-- Add is_tournament flag and tournament_end_at to dinner_parties
alter table dinner_parties
  add column if not exists is_tournament      boolean     default false,
  add column if not exists tournament_open    boolean     default false,
  add column if not exists tournament_recipes uuid[]      default '{}';

-- View: tournament leaderboard per party
create or replace view party_tournament_leaderboard as
select
  v.party_id,
  v.recipe_id,
  r.title                            as recipe_title,
  r.image_url                        as recipe_image,
  count(v.id)                        as vote_count,
  round(avg(v.score)::numeric, 2)    as avg_score,
  sum(v.score)                       as total_score,
  rank() over (
    partition by v.party_id
    order by round(avg(v.score)::numeric, 2) desc, count(v.id) desc
  )                                  as rank
from dinner_party_recipe_votes v
join recipes r on r.id = v.recipe_id
group by v.party_id, v.recipe_id, r.title, r.image_url;


-- ── 3. RANKED SCORE FOR PUBLISHED RECIPES ────────────────────
--
-- A single score reflecting how well-liked a user's published
-- recipes are. Based on: avg taste rating, total ratings, saves.
-- Stored on profiles so it can be displayed in the UI.

alter table profiles
  add column if not exists ranked_score      numeric(6,2) default 0,
  add column if not exists ranked_tier       text         default 'Newcomer',
  add column if not exists ranked_updated_at timestamptz;

-- Function: recalculate ranked score for a user
create or replace function recalculate_ranked_score(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_recipe_count    int;
  v_avg_taste       numeric;
  v_total_ratings   int;
  v_total_saves     int;
  v_score           numeric;
  v_tier            text;
begin
  -- Count published recipes
  select count(*) into v_recipe_count
  from recipes
  where created_by = target_user_id;

  if v_recipe_count = 0 then
    update profiles set ranked_score = 0, ranked_tier = 'Newcomer', ranked_updated_at = now()
    where id = target_user_id;
    return;
  end if;

  -- Average taste rating across all their recipes
  select
    coalesce(avg(rr.taste), 0),
    coalesce(count(rr.id), 0)
  into v_avg_taste, v_total_ratings
  from recipe_ratings rr
  join recipes r on r.id = rr.recipe_id
  where r.created_by = target_user_id;

  -- Total saves of their recipes
  select coalesce(count(*), 0) into v_total_saves
  from recipe_saves rs
  join recipes r on r.id = rs.recipe_id
  where r.created_by = target_user_id;

  -- Score formula:
  --   taste avg (0-5) × 20 → 0-100 base
  --   + log of (ratings + 1) × 8 → depth bonus
  --   + log of (saves + 1) × 6 → popularity bonus
  --   capped at 999
  v_score := least(999,
    (v_avg_taste * 20)
    + (ln(v_total_ratings + 1) * 8)
    + (ln(v_total_saves + 1) * 6)
  );

  -- Tier assignment
  v_tier := case
    when v_score >= 800 then 'Legendary Chef'
    when v_score >= 600 then 'Master Chef'
    when v_score >= 400 then 'Expert Cook'
    when v_score >= 200 then 'Home Chef'
    when v_score >= 80  then 'Apprentice'
    when v_score > 0    then 'Newcomer'
    else 'Newcomer'
  end;

  update profiles
  set ranked_score      = v_score,
      ranked_tier       = v_tier,
      ranked_updated_at = now()
  where id = target_user_id;
end;
$$;

-- Trigger: auto-update ranked score when a recipe is rated
create or replace function trigger_ranked_on_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  v_creator uuid;
begin
  select created_by into v_creator from recipes where id = coalesce(NEW.recipe_id, OLD.recipe_id);
  if v_creator is not null then
    perform recalculate_ranked_score(v_creator);
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_ranked_on_rating on recipe_ratings;
create trigger trg_ranked_on_rating
  after insert or update or delete on recipe_ratings
  for each row execute function trigger_ranked_on_rating();

-- Trigger: auto-update ranked score when a recipe is saved/unsaved
create or replace function trigger_ranked_on_save()
returns trigger
language plpgsql
security definer
as $$
declare
  v_creator uuid;
begin
  select created_by into v_creator from recipes where id = coalesce(NEW.recipe_id, OLD.recipe_id);
  if v_creator is not null then
    perform recalculate_ranked_score(v_creator);
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_ranked_on_save on recipe_saves;
create trigger trg_ranked_on_save
  after insert or delete on recipe_saves
  for each row execute function trigger_ranked_on_save();

-- Backfill ranked scores for all existing users who have published recipes
do $$
declare
  r record;
begin
  for r in select distinct created_by from recipes where created_by is not null loop
    perform recalculate_ranked_score(r.created_by);
  end loop;
end;
$$;
