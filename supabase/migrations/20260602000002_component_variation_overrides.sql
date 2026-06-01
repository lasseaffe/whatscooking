-- Add variation_overrides JSONB for quick-twist community variations
-- The existing is_variation, parent_id, variation_type, variation_notes columns are used as-is.

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS variation_overrides JSONB;

COMMENT ON COLUMN recipes.variation_overrides IS
  'For quick-twist component variations only: diff vs parent. Schema: {added_ingredients:[{amount,unit,name}], removed_ingredients:[name], step_notes:string}. Full recipe variations leave this null.';
