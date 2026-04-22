-- ══════════════════════════════════════════════════════════════
-- Swipe Likes + Recipe Difficulty
-- Run after features.sql
-- ══════════════════════════════════════════════════════════════

-- Add difficulty_level column to recipes
alter table recipes
  add column if not exists difficulty_level text
    check (difficulty_level in ('easy', 'medium', 'hard'));

-- Auto-populate from total cook time for existing recipes that have time data
update recipes
  set difficulty_level = case
    when (coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)) <= 25 then 'easy'
    when (coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)) <= 60 then 'medium'
    else 'hard'
  end
where difficulty_level is null
  and (prep_time_minutes is not null or cook_time_minutes is not null);

-- Swipe likes: tracks which recipes a user liked via Meal Swipe
create table if not exists swipe_likes (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  recipe_id  uuid not null references recipes(id) on delete cascade,
  liked_at   timestamptz default now(),
  unique (user_id, recipe_id)
);

alter table swipe_likes enable row level security;

create policy "Users manage own swipe likes"
  on swipe_likes for all using (auth.uid() = user_id);

create index if not exists swipe_likes_user_idx
  on swipe_likes(user_id, liked_at desc);

create index if not exists swipe_likes_recipe_idx
  on swipe_likes(recipe_id);
