-- ============================================================
-- What's Cooking — Social Features + Recipe Variations
-- Run AFTER features.sql
-- ============================================================

-- Extend recipes with adaptation/variation columns
alter table recipes add column if not exists adaptable_to     text[] default '{}';
alter table recipes add column if not exists is_variation     boolean not null default false;
alter table recipes add column if not exists parent_id        uuid references recipes(id) on delete cascade;
alter table recipes add column if not exists variation_type   text check (variation_type in ('vegetarian','vegan','gluten-free','dairy-free','halal','kosher','nut-free','low-carb','keto'));
alter table recipes add column if not exists variation_notes  text;
alter table recipes add column if not exists ai_generated     boolean not null default false;
alter table recipes add column if not exists creator_approved boolean not null default false;

create index if not exists recipes_parent_id_idx      on recipes(parent_id);
create index if not exists recipes_variation_type_idx on recipes(variation_type);

-- Extend preferences with allergies and restrictions
alter table user_preferences add column if not exists allergies         text[] default '{}';
alter table user_preferences add column if not exists food_restrictions text[] default '{}';
alter table user_preferences add column if not exists show_adaptations  boolean not null default true;
alter table profiles         add column if not exists allergies         text[] default '{}';
alter table profiles         add column if not exists food_restrictions text[] default '{}';

-- Social: follows
create table if not exists user_follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  followed_at  timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);
create index if not exists user_follows_following_idx on user_follows(following_id);

-- Social: recipe likes
create table if not exists recipe_likes (
  user_id   uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  liked_at  timestamptz default now(),
  primary key (user_id, recipe_id)
);
create index if not exists recipe_likes_recipe_idx on recipe_likes(recipe_id);

-- Social: meal plan likes + imports
create table if not exists meal_plan_likes (
  user_id      uuid not null references profiles(id) on delete cascade,
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  liked_at     timestamptz default now(),
  primary key (user_id, meal_plan_id)
);

create table if not exists meal_plan_imports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  source_plan_id uuid not null references meal_plans(id) on delete cascade,
  new_plan_id    uuid references meal_plans(id) on delete set null,
  imported_at    timestamptz default now()
);

-- Social: send recipe to a friend
create table if not exists recipe_recommendations (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  recipe_id   uuid not null references recipes(id) on delete cascade,
  note        text,
  read        boolean not null default false,
  sent_at     timestamptz default now()
);
create index if not exists recipe_recommendations_receiver_idx on recipe_recommendations(receiver_id);

-- Social: activity feed
create table if not exists activity_feed (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  action_type  text not null check (action_type in ('cooked','saved','created','liked','published','imported','recommended')),
  recipe_id    uuid references recipes(id) on delete cascade,
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  metadata     jsonb default '{}',
  created_at   timestamptz default now()
);
create index if not exists activity_feed_user_idx on activity_feed(user_id, created_at desc);

-- RLS
alter table user_follows           enable row level security;
alter table recipe_likes           enable row level security;
alter table meal_plan_likes        enable row level security;
alter table meal_plan_imports      enable row level security;
alter table recipe_recommendations enable row level security;
alter table activity_feed          enable row level security;

create policy "manage own follows"          on user_follows for all using (auth.uid() = follower_id);
create policy "read all follows"            on user_follows for select using (true);
create policy "manage own recipe likes"     on recipe_likes for all using (auth.uid() = user_id);
create policy "read all recipe likes"       on recipe_likes for select using (true);
create policy "manage own plan likes"       on meal_plan_likes for all using (auth.uid() = user_id);
create policy "manage own imports"          on meal_plan_imports for all using (auth.uid() = user_id);
create policy "manage own recommendations"  on recipe_recommendations for all using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "see own and followed activity" on activity_feed for select using (
  auth.uid() = user_id or
  exists (select 1 from user_follows where follower_id = auth.uid() and following_id = activity_feed.user_id)
);
create policy "insert own activity" on activity_feed for insert with check (auth.uid() = user_id);
