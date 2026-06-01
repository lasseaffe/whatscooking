-- supabase/migrations/20260531000000_recipe_components.sql

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS is_component    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS component_type  TEXT CHECK (component_type IN (
    'sauce','dressing','marinade','base','paste','spice_blend','condiment','batter'
  ));

CREATE TABLE IF NOT EXISTS recipe_component_links (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  component_recipe_id    UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_group_label TEXT NOT NULL,
  display_order          INT DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_recipe_id, component_recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_rcl_parent    ON recipe_component_links(parent_recipe_id);
CREATE INDEX IF NOT EXISTS idx_rcl_component ON recipe_component_links(component_recipe_id);
