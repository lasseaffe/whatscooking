-- supabase/wc2026_schema.sql
-- World Cup 2026 — DB migration
-- Run in Supabase dashboard → SQL Editor

-- ── wc_fixtures ──────────────────────────────────────────────
create table if not exists wc_fixtures (
  id          uuid primary key default gen_random_uuid(),
  match_day   int  not null,
  stage       text not null check (stage in ('group','r16','qf','sf','final')),
  match_date  timestamptz not null,
  home_code   varchar(6) not null,
  away_code   varchar(6) not null,
  home_score  int,
  away_score  int,
  venue       text,
  group_label text
);

alter table wc_fixtures enable row level security;
drop policy if exists "Public read fixtures" on wc_fixtures;
create policy "Public read fixtures"
  on wc_fixtures for select using (true);

-- ── wc_match_photos ──────────────────────────────────────────
create table if not exists wc_match_photos (
  id           uuid primary key default gen_random_uuid(),
  fixture_id   uuid references wc_fixtures(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  storage_path text not null,
  caption      text,
  created_at   timestamptz default now()
);

alter table wc_match_photos enable row level security;
drop policy if exists "Public read photos" on wc_match_photos;
create policy "Public read photos"
  on wc_match_photos for select using (true);
drop policy if exists "Auth users insert own photos" on wc_match_photos;
create policy "Auth users insert own photos"
  on wc_match_photos for insert
  with check (auth.uid() = user_id);
drop policy if exists "Users delete own photos" on wc_match_photos;
create policy "Users delete own photos"
  on wc_match_photos for delete
  using (auth.uid() = user_id);
drop policy if exists "Users update own photos" on wc_match_photos;
create policy "Users update own photos"
  on wc_match_photos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── wc_recipe_tags ───────────────────────────────────────────
create table if not exists wc_recipe_tags (
  recipe_id      uuid references recipes(id) on delete cascade,
  nation_code    varchar(6) not null,
  is_event_badge boolean default true,
  primary key (recipe_id, nation_code)
);

alter table wc_recipe_tags enable row level security;
drop policy if exists "Public read recipe tags" on wc_recipe_tags;
create policy "Public read recipe tags"
  on wc_recipe_tags for select using (true);

-- NOTE: Admin writes only via service role API (no public insert/update/delete policies)
-- Prevents unauthorized users from tagging arbitrary recipes with nation codes

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists wc_match_photos_fixture_id_idx on wc_match_photos(fixture_id);
create index if not exists wc_match_photos_user_id_idx on wc_match_photos(user_id);
create index if not exists wc_recipe_tags_nation_code_idx on wc_recipe_tags(nation_code);

-- ── Storage bucket note ───────────────────────────────────────
-- Create bucket "wc-photos" (Public: ON) manually in Supabase dashboard → Storage
-- after running this SQL.

-- ── Seed: example group-stage fixtures ───────────────────────
-- NOTE: XE is a placeholder. Replace with real opponent ISO-2 codes
-- from the official FIFA 2026 schedule once the draw is confirmed.
-- home_code and away_code are char(2) — GB-ENG/GB-SCT use 6-char workaround;
-- for the seed below all codes are 2 chars as per DB constraint.
insert into wc_fixtures (match_day, stage, match_date, home_code, away_code, venue, group_label) values
  (1,  'group', '2026-06-11 21:00:00+00', 'MX', 'XE', 'Estadio Azteca, Mexico City', 'B'),
  (2,  'group', '2026-06-12 00:00:00+00', 'US', 'AR', 'SoFi Stadium, Los Angeles',   'C'),
  (3,  'group', '2026-06-12 19:00:00+00', 'CA', 'XE', 'BMO Field, Toronto',          'D'),
  (4,  'group', '2026-06-13 00:00:00+00', 'MX', 'XE', 'Estadio Azteca, Mexico City', 'A'),
  (5,  'group', '2026-06-13 19:00:00+00', 'US', 'XE', 'MetLife Stadium, New York',   'C'),
  (6,  'group', '2026-06-14 00:00:00+00', 'BR', 'XE', 'Hard Rock Stadium, Miami',    'E')
on conflict do nothing;
