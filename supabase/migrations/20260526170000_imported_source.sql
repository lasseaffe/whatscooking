-- Note: recipes.source is a plain `text` column in this database (there is no
-- `recipe_source` enum), so no type change is needed — 'imported' is stored as text.

-- Track where an imported recipe came from
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS original_source text,
  ADD COLUMN IF NOT EXISTS original_source_url text;

-- User preference: show imported recipes in All tab
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_imported_recipes boolean NOT NULL DEFAULT true;
