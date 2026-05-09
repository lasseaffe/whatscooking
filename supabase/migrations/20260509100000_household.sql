-- supabase/migrations/20260509100000_household.sql
-- Household member profiles, per-member reactions, ingredient-level preferences

-- Extend ingredient_categories with parent for inference grouping
ALTER TABLE ingredient_categories
  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES ingredient_categories(id);

-- Age group and strictness enums
DO $$ BEGIN
  CREATE TYPE member_age_group AS ENUM ('baby', 'child', 'teen', 'adult');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_filter_strictness AS ENUM ('allergy', 'dislike', 'soft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ingredient_sentiment AS ENUM ('dislike', 'avoid', 'love');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE preference_source AS ENUM ('reported', 'inferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- household_members already exists (from 20260509000000_baby_family_hub) with a different schema.
-- Add the new columns needed by the household profile feature.
ALTER TABLE household_members
  ADD COLUMN IF NOT EXISTS owner_user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS linked_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_name      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_emoji      TEXT NOT NULL DEFAULT '🧑',
  ADD COLUMN IF NOT EXISTS age_group         member_age_group NOT NULL DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS filter_strictness member_filter_strictness NOT NULL DEFAULT 'dislike';

-- Member ingredient preferences
-- NOTE: ingredient_id is a plain nullable UUID (no FK) — no ingredients table exists yet.
-- ingredient_text is the canonical free-text fallback.
CREATE TABLE IF NOT EXISTS member_ingredient_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  ingredient_id   UUID,
  ingredient_text TEXT NOT NULL,
  sentiment       ingredient_sentiment NOT NULL,
  source          preference_source NOT NULL DEFAULT 'reported',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member meal reactions
CREATE TABLE IF NOT EXISTS member_meal_reactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  recipe_id    UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 3),
  notes        TEXT,
  reported_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cooked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, recipe_id)
);

-- RLS (household_members already has RLS enabled from baby_family_hub migration)
ALTER TABLE member_ingredient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_meal_reactions ENABLE ROW LEVEL SECURITY;

-- household_members: owner sees/manages their own members; linked user sees their own entry
DROP POLICY IF EXISTS "owner manages members" ON household_members;
DROP POLICY IF EXISTS "linked user reads own entry" ON household_members;

-- Drop any conflicting policies from earlier baby_family_hub migration
DO $$
DECLARE pol_name TEXT;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies WHERE tablename = 'household_members' AND policyname != 'owner manages members' AND policyname != 'linked user reads own entry'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON household_members', pol_name);
  END LOOP;
END $$;

CREATE POLICY "owner manages members"
  ON household_members FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "linked user reads own entry"
  ON household_members FOR SELECT
  USING (linked_user_id = auth.uid());

-- member_ingredient_preferences: owner of the member can do all
DROP POLICY IF EXISTS "owner manages preferences" ON member_ingredient_preferences;
CREATE POLICY "owner manages preferences"
  ON member_ingredient_preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.id = member_id AND hm.owner_user_id = auth.uid()
    )
  );

-- member_meal_reactions: reported_by user can insert; owner can do all
DROP POLICY IF EXISTS "owner manages reactions" ON member_meal_reactions;
DROP POLICY IF EXISTS "reporter inserts own reactions" ON member_meal_reactions;

CREATE POLICY "owner manages reactions"
  ON member_meal_reactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.id = member_id AND hm.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "reporter inserts own reactions"
  ON member_meal_reactions FOR INSERT
  WITH CHECK (reported_by = auth.uid());

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_household_members_owner ON household_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_member_preferences_member ON member_ingredient_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_member_reactions_member ON member_meal_reactions(member_id);
