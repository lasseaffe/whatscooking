-- ══════════════════════════════════════════════════════════════
-- FIX: Dinner party RLS infinite recursion
-- Run this FIRST — no other table dependencies required
-- ══════════════════════════════════════════════════════════════

-- Helper: is this user the host of a party?
create or replace function is_party_host(party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from dinner_parties
    where id = party_id and host_id = auth.uid()
  );
$$;

-- Helper: is this user an invited guest of a party?
create or replace function is_party_guest(party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
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
set search_path = public
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

-- Drop every dinner_parties / dinner_party_guests / dinner_party_comments policy
-- (covers any name used in previous migrations)
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where tablename in ('dinner_parties','dinner_party_guests','dinner_party_comments')
      and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

-- ── dinner_parties ────────────────────────────────────────────
create policy "dp host full access" on dinner_parties
  for all using (host_id = auth.uid());

create policy "dp guests can read" on dinner_parties
  for select using (is_party_guest(id));

-- ── dinner_party_guests ───────────────────────────────────────
create policy "dpg host manages" on dinner_party_guests
  for all using (is_party_host(party_id));

create policy "dpg guest manages own rsvp" on dinner_party_guests
  for update using (user_id = auth.uid());

create policy "dpg guests can read guest list" on dinner_party_guests
  for select using (can_access_party(party_id));

create policy "dpg guests can insert self" on dinner_party_guests
  for insert with check (user_id = auth.uid());

-- ── dinner_party_comments ─────────────────────────────────────
create policy "dpc party members can comment" on dinner_party_comments
  for all using (can_access_party(party_id));

-- ── Tournament columns (no extra table dependency) ────────────
alter table dinner_parties
  add column if not exists is_tournament      boolean  default false,
  add column if not exists tournament_open    boolean  default false,
  add column if not exists tournament_recipes uuid[]   default '{}';

-- Tournament votes table
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

create index if not exists idx_dpv_party  on dinner_party_recipe_votes(party_id);
create index if not exists idx_dpv_recipe on dinner_party_recipe_votes(recipe_id);
create index if not exists idx_dpv_voter  on dinner_party_recipe_votes(voter_id);

-- Tournament leaderboard view
create or replace view party_tournament_leaderboard as
select
  v.party_id,
  v.recipe_id,
  r.title                         as recipe_title,
  r.image_url                     as recipe_image,
  count(v.id)                     as vote_count,
  round(avg(v.score)::numeric, 2) as avg_score,
  sum(v.score)                    as total_score,
  rank() over (
    partition by v.party_id
    order by round(avg(v.score)::numeric, 2) desc, count(v.id) desc
  ) as rank
from dinner_party_recipe_votes v
join recipes r on r.id = v.recipe_id
group by v.party_id, v.recipe_id, r.title, r.image_url;
