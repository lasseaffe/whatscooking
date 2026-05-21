-- user_themes: per-user custom color themes for the Theme Studio.
-- Active theme selection is tracked client-side (localStorage) so no is_active column needed.

create table if not exists user_themes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  tokens      jsonb not null,
  base_mode   text not null default 'dark',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_themes_user_idx on user_themes(user_id);

-- RLS: owners only
alter table user_themes enable row level security;

create policy "users read own themes"
  on user_themes for select
  using (user_id = auth.uid());

create policy "users insert own themes"
  on user_themes for insert
  with check (user_id = auth.uid());

create policy "users update own themes"
  on user_themes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete own themes"
  on user_themes for delete
  using (user_id = auth.uid());
