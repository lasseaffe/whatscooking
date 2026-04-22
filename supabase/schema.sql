-- What's Cooking — Meal Planning Platform
-- Full database schema for Supabase (PostgreSQL)

create extension if not exists "pgcrypto";

-- ============================================================
-- UTILITY FUNCTIONS (must come before triggers that use them)
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- ============================================================
-- PROFILES & PREFERENCES
-- ============================================================

create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique,
  full_name           text,
  avatar_url          text,
  bio                 text,
  dietary_preferences text[] default '{}',
  favorite_cuisines   text[] default '{}',
  created_at          timestamptz default now()
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table if not exists user_preferences (
  user_id              uuid primary key references profiles(id) on delete cascade,
  dietary_preferences  text[] default '{}',
  favorite_cuisines    text[] default '{}',
  difficulty_level     text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  preferred_meal_types text[] default '{}',
  nutritional_goals    jsonb default '{}',
  updated_at           timestamptz default now()
);

-- ============================================================
-- INGREDIENT CATEGORIES (lookup / seed table)
-- ============================================================

create table if not exists ingredient_categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  emoji text,
  color text
);

-- Seed categories
insert into ingredient_categories (name, emoji, color) values
  ('Vegetables',      '🥦', '#22c55e'),
  ('Fruits',          '🍎', '#ef4444'),
  ('Meat & Fish',     '🥩', '#b91c1c'),
  ('Dairy',           '🧀', '#f59e0b'),
  ('Grains & Pasta',  '🌾', '#d97706'),
  ('Legumes',         '🫘', '#92400e'),
  ('Nuts & Seeds',    '🥜', '#a16207'),
  ('Spices & Herbs',  '🌿', '#16a34a'),
  ('Oils & Sauces',   '🫒', '#ca8a04'),
  ('Beverages',       '🥤', '#0ea5e9'),
  ('Baking',          '🧁', '#ec4899'),
  ('Frozen',          '🧊', '#67e8f9'),
  ('Canned Goods',    '🥫', '#dc2626'),
  ('Snacks',          '🍿', '#a855f7'),
  ('Other',           '📦', '#6b7280')
on conflict (name) do nothing;

-- ============================================================
-- PANTRY (user's current ingredients at home)
-- ============================================================

create table if not exists pantry_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  category_id uuid references ingredient_categories(id),
  quantity    text,
  added_at    timestamptz default now()
);

create index if not exists pantry_items_user_id_idx on pantry_items(user_id);

-- ============================================================
-- RECIPES (public cache — Spoonacular + AI generated)
-- ============================================================

create table if not exists recipes (
  id                uuid primary key default gen_random_uuid(),
  external_id       text,
  source            text not null default 'ai' check (source in ('spoonacular', 'ai', 'curated', 'user', 'social')),
  source_name       text,       -- e.g. 'NYT Cooking', 'AllRecipes', 'Instagram @handle'
  source_url        text,       -- link to original post/recipe
  title             text not null,
  description       text,
  image_url         text,
  cuisine_type      text,
  dish_types        text[] default '{}',
  dietary_tags      text[] default '{}',
  ingredients       jsonb not null default '[]',
  instructions      text[] default '{}',
  prep_time_minutes int,
  cook_time_minutes int,
  servings          int,
  calories          int,
  protein_g         numeric,
  carbs_g           numeric,
  fat_g             numeric,
  fiber_g           numeric,
  sugar_g           numeric,
  sodium_mg         numeric,
  created_at        timestamptz default now()
);

create index if not exists recipes_external_id_idx on recipes(external_id);
create index if not exists recipes_source_idx on recipes(source);

-- ============================================================
-- MEAL PLANS
-- ============================================================

create table if not exists meal_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  title             text not null,
  description       text,
  week_start        date,
  meals_per_day     int default 3,
  duration_days     int default 7,
  status            text not null default 'planning' check (status in ('planning','active','completed')),
  is_public         boolean not null default false,
  nutritional_goals jsonb default '{}',
  dietary_filters   text[] default '{}',
  tags              text[] default '{}',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

drop trigger if exists meal_plans_updated_at on meal_plans;
create trigger meal_plans_updated_at
  before update on meal_plans
  for each row execute function set_updated_at();

-- ============================================================
-- MEAL ENTRIES (individual meals within a plan)
-- ============================================================

create table if not exists meal_entries (
  id                uuid primary key default gen_random_uuid(),
  meal_plan_id      uuid not null references meal_plans(id) on delete cascade,
  recipe_id         uuid references recipes(id),
  day_number        int not null default 1,
  meal_type         text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  recipe_title      text not null,
  description       text,
  calories          int,
  protein_g         numeric,
  carbs_g           numeric,
  fat_g             numeric,
  fiber_g           numeric,
  position          int not null default 0,
  created_at        timestamptz default now()
);

create index if not exists meal_entries_meal_plan_id_idx on meal_entries(meal_plan_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table ingredient_categories enable row level security;
alter table pantry_items enable row level security;
alter table recipes enable row level security;
alter table meal_plans enable row level security;
alter table meal_entries enable row level security;

-- Profiles
drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- User preferences
drop policy if exists "Users can manage own preferences" on user_preferences;
create policy "Users can manage own preferences"
  on user_preferences for all using (auth.uid() = user_id);

-- Ingredient categories: public read
drop policy if exists "Anyone can read ingredient categories" on ingredient_categories;
create policy "Anyone can read ingredient categories"
  on ingredient_categories for select using (true);

-- Pantry items: user-scoped
drop policy if exists "Users manage own pantry" on pantry_items;
create policy "Users manage own pantry"
  on pantry_items for all using (auth.uid() = user_id);

-- Recipes: public read, insert by anyone authenticated
drop policy if exists "Anyone can read recipes" on recipes;
drop policy if exists "Authenticated users can insert recipes" on recipes;
create policy "Anyone can read recipes"
  on recipes for select using (true);
create policy "Authenticated users can insert recipes"
  on recipes for insert with check (auth.uid() is not null);

-- Meal plans: owner full access, public plans readable
drop policy if exists "Meal plan owners can do anything" on meal_plans;
drop policy if exists "Public meal plans readable" on meal_plans;
create policy "Meal plan owners can do anything"
  on meal_plans for all using (auth.uid() = user_id);
create policy "Public meal plans readable"
  on meal_plans for select using (is_public = true);

-- Meal entries: access through meal plan ownership
drop policy if exists "Access meal entries via meal plan" on meal_entries;
create policy "Access meal entries via meal plan"
  on meal_entries for all using (
    exists (
      select 1 from meal_plans
      where id = meal_entries.meal_plan_id and user_id = auth.uid()
    )
  );
