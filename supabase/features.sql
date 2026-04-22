-- ============================================================
-- What's Cooking — Feature Additions
-- Run AFTER schema.sql and seed.sql
-- ============================================================

-- ── Extend recipes for user-created recipes ──────────────────
alter table recipes add column if not exists created_by uuid references profiles(id);
alter table recipes add column if not exists is_published boolean not null default false;
alter table recipes drop constraint if exists recipes_source_check;
-- include 'social' which is used by existing seeded rows
alter table recipes add constraint recipes_source_check
  check (source in ('spoonacular','ai','curated','user','social'));

-- ── Recipe Ratings (multi-factor, one per user per recipe) ───
create table if not exists recipe_ratings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  recipe_id        uuid not null references recipes(id) on delete cascade,
  taste            int check (taste between 1 and 5),
  difficulty       int check (difficulty between 1 and 5), -- 1 = very easy, 5 = very hard
  prep_time_rating int check (prep_time_rating between 1 and 5), -- 1 = way longer than listed
  value_for_effort int check (value_for_effort between 1 and 5),
  presentation     int check (presentation between 1 and 5),
  would_make_again boolean,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (user_id, recipe_id)
);
drop trigger if exists recipe_ratings_updated_at on recipe_ratings;
create trigger recipe_ratings_updated_at
  before update on recipe_ratings
  for each row execute function set_updated_at();
create index if not exists recipe_ratings_recipe_id_idx on recipe_ratings(recipe_id);

-- ── Recipe Comments ───────────────────────────────────────────
create table if not exists recipe_comments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  recipe_id    uuid not null references recipes(id) on delete cascade,
  content      text not null,
  -- tag shown next to username; null = none
  interest_tag text check (interest_tag in (
    'not_tried_yet','interested','tried_it','loving_it','my_go_to',
    'favorited','original_creator'
  )),
  show_tag     boolean not null default true,
  created_at   timestamptz default now()
);
create index if not exists recipe_comments_recipe_id_idx on recipe_comments(recipe_id);

-- ── Recipe Saves (bookmarks) ──────────────────────────────────
create table if not exists recipe_saves (
  user_id    uuid not null references profiles(id) on delete cascade,
  recipe_id  uuid not null references recipes(id) on delete cascade,
  saved_at   timestamptz default now(),
  primary key (user_id, recipe_id)
);
create index if not exists recipe_saves_user_id_idx on recipe_saves(user_id);

-- ── Calorie Goals ─────────────────────────────────────────────
create table if not exists calorie_goals (
  user_id            uuid primary key references profiles(id) on delete cascade,
  goal_type          text not null default 'maintain'
    check (goal_type in ('lose_weight','maintain','gain_weight')),
  target_calories    int,          -- daily kcal target
  target_weight_kg   numeric,
  current_weight_kg  numeric,
  height_cm          numeric,
  activity_level     text default 'moderate'
    check (activity_level in ('sedentary','light','moderate','active','very_active')),
  notes              text,
  updated_at         timestamptz default now()
);

-- ── Weight Logs ───────────────────────────────────────────────
create table if not exists weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  weight_kg  numeric not null,
  note       text,
  logged_at  date not null default current_date,
  created_at timestamptz default now(),
  unique (user_id, logged_at)  -- one entry per day
);
create index if not exists weight_logs_user_id_idx on weight_logs(user_id, logged_at);

-- ── Daily Calorie Entries ─────────────────────────────────────
create table if not exists calorie_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  logged_at   date not null default current_date,
  meal_type   text check (meal_type in ('breakfast','lunch','dinner','snack')),
  description text not null,
  calories    int not null,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  created_at  timestamptz default now()
);
create index if not exists calorie_entries_user_date_idx on calorie_entries(user_id, logged_at);

-- ── RLS for new tables ────────────────────────────────────────
alter table recipe_ratings enable row level security;
alter table recipe_comments enable row level security;
alter table recipe_saves enable row level security;
alter table calorie_goals enable row level security;
alter table weight_logs enable row level security;
alter table calorie_entries enable row level security;

-- ratings: public read, own write
create policy "Anyone can read ratings"
  on recipe_ratings for select using (true);
create policy "Users manage own ratings"
  on recipe_ratings for all using (auth.uid() = user_id);

-- comments: public read, own write
create policy "Anyone can read comments"
  on recipe_comments for select using (true);
create policy "Users manage own comments"
  on recipe_comments for all using (auth.uid() = user_id);

-- saves: own only
create policy "Users manage own saves"
  on recipe_saves for all using (auth.uid() = user_id);

-- calorie data: own only
create policy "Users manage own calorie goal"
  on calorie_goals for all using (auth.uid() = user_id);
create policy "Users manage own weight logs"
  on weight_logs for all using (auth.uid() = user_id);
create policy "Users manage own calorie entries"
  on calorie_entries for all using (auth.uid() = user_id);

-- user recipes: public can read published
create policy "Anyone can read published user recipes"
  on recipes for select using (is_published = true or auth.uid() = created_by or source != 'user');
create policy "Users can manage own recipes"
  on recipes for all using (auth.uid() = created_by);
