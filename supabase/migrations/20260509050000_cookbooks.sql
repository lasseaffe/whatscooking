-- supabase/migrations/20260509_cookbooks.sql

create table if not exists cookbooks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  title           text not null,
  description     text,
  cover_image_url text,
  theme_color     text default '#C85A2F',
  title_font      text default 'serif' check (title_font in ('serif','sans','script')),
  tagline         text,
  price           numeric(10,2) not null default 0.00,
  status          text not null default 'draft' check (status in ('draft','published')),
  slug            text unique not null,
  view_count      int not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists cookbook_chapters (
  id              uuid primary key default gen_random_uuid(),
  cookbook_id     uuid not null references cookbooks(id) on delete cascade,
  title           text not null,
  intro_text      text,
  cover_image_url text,
  position        int not null default 0
);

create table if not exists cookbook_recipes (
  id                     uuid primary key default gen_random_uuid(),
  chapter_id             uuid not null references cookbook_chapters(id) on delete cascade,
  cookbook_id            uuid not null references cookbooks(id) on delete cascade,
  recipe_id              uuid not null references recipes(id) on delete cascade,
  position               int not null default 0,
  chef_note              text check (char_length(chef_note) <= 280),
  creator_meal_photo_url text
);

create table if not exists cookbook_purchases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  cookbook_id  uuid not null references cookbooks(id) on delete cascade,
  purchased_at timestamptz default now(),
  amount_paid  numeric(10,2) not null default 0.00,
  unique(user_id, cookbook_id)
);

create table if not exists cookbook_meal_photos (
  id          uuid primary key default gen_random_uuid(),
  cookbook_id uuid not null references cookbooks(id) on delete cascade,
  recipe_id   uuid not null references recipes(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  photo_url   text not null,
  caption     text,
  is_featured boolean not null default false,
  is_flagged  boolean not null default false,
  reported_at timestamptz,
  created_at  timestamptz default now()
);

-- updated_at trigger reuses the existing set_updated_at() function from schema.sql
drop trigger if exists cookbooks_updated_at on cookbooks;
create trigger cookbooks_updated_at
  before update on cookbooks
  for each row execute function set_updated_at();

-- indexes
create index if not exists idx_cookbooks_user_id on cookbooks(user_id);
create index if not exists idx_cookbooks_status on cookbooks(status);
create index if not exists idx_cookbook_chapters_cookbook_id on cookbook_chapters(cookbook_id);
create index if not exists idx_cookbook_recipes_chapter_id on cookbook_recipes(chapter_id);
create index if not exists idx_cookbook_recipes_cookbook_id on cookbook_recipes(cookbook_id);
create index if not exists idx_cookbook_meal_photos_cookbook_id on cookbook_meal_photos(cookbook_id);

-- RLS
alter table cookbooks enable row level security;
alter table cookbook_chapters enable row level security;
alter table cookbook_recipes enable row level security;
alter table cookbook_purchases enable row level security;
alter table cookbook_meal_photos enable row level security;

-- cookbooks: anyone reads published; owner reads+writes all
drop policy if exists "cookbooks_read_published" on cookbooks;
drop policy if exists "cookbooks_insert_own" on cookbooks;
drop policy if exists "cookbooks_update_own" on cookbooks;
drop policy if exists "cookbooks_delete_own" on cookbooks;
create policy "cookbooks_read_published" on cookbooks
  for select using (status = 'published' or auth.uid() = user_id);
create policy "cookbooks_insert_own" on cookbooks
  for insert with check (auth.uid() = user_id);
create policy "cookbooks_update_own" on cookbooks
  for update using (auth.uid() = user_id);
create policy "cookbooks_delete_own" on cookbooks
  for delete using (auth.uid() = user_id);

-- chapters/recipes: readable if cookbook published or user owns it
drop policy if exists "chapters_read" on cookbook_chapters;
drop policy if exists "chapters_write" on cookbook_chapters;
create policy "chapters_read" on cookbook_chapters
  for select using (
    exists (select 1 from cookbooks c where c.id = cookbook_id and (c.status = 'published' or c.user_id = auth.uid()))
  );
create policy "chapters_write" on cookbook_chapters
  for all using (
    exists (select 1 from cookbooks c where c.id = cookbook_id and c.user_id = auth.uid())
  );

drop policy if exists "cookbook_recipes_read" on cookbook_recipes;
drop policy if exists "cookbook_recipes_write" on cookbook_recipes;
create policy "cookbook_recipes_read" on cookbook_recipes
  for select using (
    exists (select 1 from cookbooks c where c.id = cookbook_id and (c.status = 'published' or c.user_id = auth.uid()))
  );
create policy "cookbook_recipes_write" on cookbook_recipes
  for all using (
    exists (select 1 from cookbooks c where c.id = cookbook_id and c.user_id = auth.uid())
  );

-- purchases: user sees own rows; any authed user can insert
drop policy if exists "purchases_read_own" on cookbook_purchases;
drop policy if exists "purchases_insert" on cookbook_purchases;
create policy "purchases_read_own" on cookbook_purchases
  for select using (auth.uid() = user_id);
create policy "purchases_insert" on cookbook_purchases
  for insert with check (auth.uid() = user_id);

-- meal photos: readable if not flagged (unless owner); authed users insert their own
drop policy if exists "meal_photos_read" on cookbook_meal_photos;
drop policy if exists "meal_photos_insert" on cookbook_meal_photos;
drop policy if exists "meal_photos_update_own_or_cookbook_owner" on cookbook_meal_photos;
drop policy if exists "meal_photos_delete_own" on cookbook_meal_photos;
create policy "meal_photos_read" on cookbook_meal_photos
  for select using (
    (is_flagged = false or exists (select 1 from cookbooks c where c.id = cookbook_id and c.user_id = auth.uid()))
    and exists (select 1 from cookbooks c where c.id = cookbook_id and (c.status = 'published' or c.user_id = auth.uid()))
  );
create policy "meal_photos_insert" on cookbook_meal_photos
  for insert with check (auth.uid() = user_id and auth.uid() is not null);
create policy "meal_photos_update_own_or_cookbook_owner" on cookbook_meal_photos
  for update using (
    auth.uid() = user_id
    or exists (select 1 from cookbooks c where c.id = cookbook_id and c.user_id = auth.uid())
  );
create policy "meal_photos_delete_own" on cookbook_meal_photos
  for delete using (auth.uid() = user_id);
