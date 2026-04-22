-- ============================================================
-- Add difficulty_level to recipes and auto-populate from cook time
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- 1. Add column (idempotent)
alter table recipes
  add column if not exists difficulty_level text
  check (difficulty_level in ('easy', 'medium', 'hard'));

-- 2. Populate ALL recipes that don't yet have a difficulty_level
--    Rules (based on total time = prep + cook):
--      ≤ 25 min  → easy
--      ≤ 60 min  → medium
--      > 60 min  → hard
--    Recipes with 0 / null total time get 'easy' as a sensible default.

update recipes
set difficulty_level = case
  when (coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)) <= 25 then 'easy'
  when (coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)) <= 60 then 'medium'
  else 'hard'
end
where difficulty_level is null;

-- 3. Re-derive difficulty for any recipe that was updated to have time data
--    but still has the wrong difficulty (in case times changed later).
--    This is a full recalculation — safe because the column has a CHECK constraint.
update recipes
set difficulty_level = case
  when (coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)) <= 25 then 'easy'
  when (coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)) <= 60 then 'medium'
  else 'hard'
end
where difficulty_level is not null;

-- Done. Every recipe now has a difficulty_level.
-- Verify with: select difficulty_level, count(*) from recipes group by 1;
