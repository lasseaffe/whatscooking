-- supabase/migrations/20260509110000_household_fixes.sql
-- Fix critical issues found in code review of 20260509100000_household.sql

-- Fix 1 (CRITICAL): UNIQUE constraint on member_meal_reactions was (member_id, recipe_id, cooked_at)
-- which never fires because cooked_at defaults to now() — every insert got a fresh timestamp.
-- Correct constraint: one reaction per member per recipe.
ALTER TABLE member_meal_reactions
  DROP CONSTRAINT IF EXISTS member_meal_reactions_member_id_recipe_id_cooked_at_key;

ALTER TABLE member_meal_reactions
  ADD CONSTRAINT member_meal_reactions_member_id_recipe_id_key
  UNIQUE (member_id, recipe_id);

-- Fix 2 (CRITICAL): "owner manages members" RLS policy lacked WITH CHECK,
-- causing Postgres to evaluate the USING expression on INSERTs too.
-- owner_user_id is NULL on first insert so the check always failed, blocking all client INSERTs.
DROP POLICY IF EXISTS "owner manages members" ON household_members;

CREATE POLICY "owner manages members"
  ON household_members FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Fix 3 (MODERATE): Add missing indexes for common query patterns.
CREATE INDEX IF NOT EXISTS idx_household_members_owner ON household_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_member_preferences_member ON member_ingredient_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_member_reactions_member ON member_meal_reactions(member_id);

-- Fix 4 (MODERATE): Drop any conflicting policies on household_members from earlier migrations.
DO $$
DECLARE pol_name TEXT;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'household_members'
      AND policyname NOT IN ('owner manages members', 'linked user reads own entry')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON household_members', pol_name);
  END LOOP;
END $$;
