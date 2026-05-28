-- Migration: Add cultural heritage columns to recipes table
-- Created: 2026-05-28

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS is_culturally_significant boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cultural_journey jsonb,
  ADD COLUMN IF NOT EXISTS heritage_notes jsonb;

-- Index for filtering culturally significant recipes
CREATE INDEX IF NOT EXISTS idx_recipes_culturally_significant
  ON recipes (is_culturally_significant)
  WHERE is_culturally_significant = true;

COMMENT ON COLUMN recipes.is_culturally_significant IS 'Marks recipes that represent cultural heritage or significant culinary traditions';
COMMENT ON COLUMN recipes.cultural_journey IS 'JSONB payload describing the cultural backstory, origin region, and historical context of the recipe';
COMMENT ON COLUMN recipes.heritage_notes IS 'JSONB payload for curator notes on authenticity, regional variations, and preservation context';
