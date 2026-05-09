-- supabase/migrations/20260509_event_planner.sql

-- Extend dinner_parties
alter table dinner_parties
  add column if not exists avatar_url               text,
  add column if not exists avatar_emoji             text,
  add column if not exists spotify_playlist_id      text,
  add column if not exists spotify_access_token     text,
  add column if not exists spotify_refresh_token    text,
  add column if not exists spotify_token_expires_at timestamptz;

-- Editable menu items
create table if not exists event_menu_items (
  id          uuid        default gen_random_uuid() primary key,
  party_id    uuid        references dinner_parties(id) on delete cascade not null,
  name        text        not null,
  description text,
  course      text        not null default 'main',
  recipe_id   uuid        references recipes(id) on delete set null,
  sort_order  int         default 0,
  created_at  timestamptz default now()
);

-- Editable timeline entries
create table if not exists event_timeline_items (
  id         uuid        default gen_random_uuid() primary key,
  party_id   uuid        references dinner_parties(id) on delete cascade not null,
  time_label text        not null,
  activity   text        not null,
  sort_order int         default 0
);

-- Shared shopping list
create table if not exists event_shopping_items (
  id          uuid        default gen_random_uuid() primary key,
  party_id    uuid        references dinner_parties(id) on delete cascade not null,
  name        text        not null,
  quantity    text,
  assigned_to uuid        references auth.users on delete set null,
  checked     boolean     default false,
  checked_by  uuid        references auth.users on delete set null,
  checked_at  timestamptz,
  created_by  uuid        references auth.users not null,
  created_at  timestamptz default now()
);

-- Location vote candidates
create table if not exists event_location_options (
  id         uuid        default gen_random_uuid() primary key,
  party_id   uuid        references dinner_parties(id) on delete cascade not null,
  name       text        not null,
  address    text,
  notes      text,
  is_winner  boolean     default false,
  created_at timestamptz default now()
);

-- One vote per user per option
create table if not exists event_location_votes (
  id         uuid        default gen_random_uuid() primary key,
  option_id  uuid        references event_location_options(id) on delete cascade not null,
  user_id    uuid        references auth.users not null,
  created_at timestamptz default now(),
  unique (option_id, user_id)
);

-- Spotify tracks
create table if not exists event_playlist_tracks (
  id               uuid        default gen_random_uuid() primary key,
  party_id         uuid        references dinner_parties(id) on delete cascade not null,
  submitted_by     uuid        references auth.users not null,
  spotify_uri      text        not null,
  track_name       text,
  artist_name      text,
  album_art_url    text,
  added_to_spotify boolean     default false,
  created_at       timestamptz default now(),
  unique (party_id, spotify_uri)
);

-- RLS
alter table event_menu_items       enable row level security;
alter table event_timeline_items   enable row level security;
alter table event_shopping_items   enable row level security;
alter table event_location_options enable row level security;
alter table event_location_votes   enable row level security;
alter table event_playlist_tracks  enable row level security;

-- Helper: is user a member of this party (host or accepted guest)?
create or replace function is_event_member(p_party_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from dinner_parties where id = p_party_id and host_id = auth.uid()
    union
    select 1 from dinner_party_guests
    where party_id = p_party_id and user_id = auth.uid() and rsvp = 'accepted'
  );
$$;

create or replace function is_event_host(p_party_id uuid)
returns boolean language sql security definer as $$
  select exists (select 1 from dinner_parties where id = p_party_id and host_id = auth.uid());
$$;

-- Menu items
drop policy if exists "host manages menu" on event_menu_items;
drop policy if exists "members read menu" on event_menu_items;
create policy "host manages menu" on event_menu_items
  for all using (is_event_host(party_id));
create policy "members read menu" on event_menu_items
  for select using (is_event_member(party_id));

-- Timeline
drop policy if exists "host manages timeline" on event_timeline_items;
drop policy if exists "members read timeline" on event_timeline_items;
create policy "host manages timeline" on event_timeline_items
  for all using (is_event_host(party_id));
create policy "members read timeline" on event_timeline_items
  for select using (is_event_member(party_id));

-- Shopping
drop policy if exists "host manages shopping" on event_shopping_items;
drop policy if exists "members read shopping" on event_shopping_items;
drop policy if exists "members update shopping" on event_shopping_items;
drop policy if exists "members insert shopping" on event_shopping_items;
create policy "host manages shopping" on event_shopping_items
  for all using (is_event_host(party_id));
create policy "members read shopping" on event_shopping_items
  for select using (is_event_member(party_id));
create policy "members update shopping" on event_shopping_items
  for update using (is_event_member(party_id));
create policy "members insert shopping" on event_shopping_items
  for insert with check (is_event_member(party_id));

-- Location options
drop policy if exists "host manages locations" on event_location_options;
drop policy if exists "members read locations" on event_location_options;
create policy "host manages locations" on event_location_options
  for all using (is_event_host(party_id));
create policy "members read locations" on event_location_options
  for select using (is_event_member(party_id));

-- Votes
drop policy if exists "members vote" on event_location_votes;
drop policy if exists "members read votes" on event_location_votes;
create policy "members vote" on event_location_votes
  for all using (user_id = auth.uid() and is_event_member(
    (select party_id from event_location_options where id = option_id)
  ));
create policy "members read votes" on event_location_votes
  for select using (is_event_member(
    (select party_id from event_location_options where id = option_id)
  ));

-- Tracks
drop policy if exists "host manages tracks" on event_playlist_tracks;
drop policy if exists "members submit tracks" on event_playlist_tracks;
drop policy if exists "members read tracks" on event_playlist_tracks;
create policy "host manages tracks" on event_playlist_tracks
  for all using (is_event_host(party_id));
create policy "members submit tracks" on event_playlist_tracks
  for insert with check (is_event_member(party_id));
create policy "members read tracks" on event_playlist_tracks
  for select using (is_event_member(party_id));

-- Indexes
create index if not exists idx_emi_party  on event_menu_items(party_id, sort_order);
create index if not exists idx_eti_party  on event_timeline_items(party_id, sort_order);
create index if not exists idx_esi_party  on event_shopping_items(party_id, created_at);
create index if not exists idx_elo_party  on event_location_options(party_id);
create index if not exists idx_elv_option on event_location_votes(option_id);
create index if not exists idx_ept_party  on event_playlist_tracks(party_id, created_at);
