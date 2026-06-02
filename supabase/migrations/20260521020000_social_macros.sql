-- supabase/migrations/20260521_social_macros.sql

-- ── Cookbooks: follow graph ──────────────────────────────────────────────────
create table if not exists public.profile_follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.profile_follows enable row level security;

drop policy if exists "users manage own follows" on public.profile_follows;
drop policy if exists "anyone reads follows"     on public.profile_follows;

create policy "users manage own follows"
  on public.profile_follows
  for all
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

create policy "anyone reads follows"
  on public.profile_follows
  for select
  using (true);

-- ── Meal plans: person count + per-plan tracking opt-in ──────────────────────
alter table public.meal_plans
  add column if not exists person_count integer not null default 1,
  add column if not exists track_intake boolean not null default false;

-- ── Profiles: global tracking opt-in ─────────────────────────────────────────
alter table public.profiles
  add column if not exists track_intake boolean not null default false;
