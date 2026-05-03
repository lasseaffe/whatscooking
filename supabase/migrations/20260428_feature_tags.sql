-- ── wc_feature_tags ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_feature_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  label      text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── wc_recipe_feature_tags ───────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_recipe_feature_tags (
  recipe_id   uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES wc_feature_tags(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ai_assigned boolean NOT NULL DEFAULT false,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX IF NOT EXISTS wc_recipe_feature_tags_recipe_idx ON wc_recipe_feature_tags (recipe_id);
CREATE INDEX IF NOT EXISTS wc_recipe_feature_tags_tag_idx    ON wc_recipe_feature_tags (tag_id);

-- ── required_utensils column on recipes ──────────────────────
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS required_utensils text[] NOT NULL DEFAULT '{}';

-- ── Seed tags ────────────────────────────────────────────────
INSERT INTO wc_feature_tags (name, label) VALUES
  ('kids-meals',          'Kids Meals'),
  ('low-effort',          'Low Effort'),
  ('beginner-friendly',   'Beginner Friendly'),
  ('meal-prep',           'Meal Prep'),
  ('low-budget',          'Low Budget'),
  ('quick-meals',         'Quick Meals'),
  ('one-pot',             'One Pot'),
  ('batch-cooking',       'Batch Cooking'),
  ('freezer-friendly',    'Freezer Friendly'),
  ('date-night',          'Date Night'),
  ('comfort-food',        'Comfort Food'),
  ('high-protein',        'High Protein'),
  ('low-calorie',         'Low Calorie'),
  ('no-cook',             'No Cook'),
  ('5-ingredients',       '5 Ingredients'),
  ('vegetarian-friendly', 'Vegetarian Friendly'),
  ('spicy',               'Spicy'),
  ('crowd-pleaser',       'Crowd Pleaser'),
  ('breakfast',           'Breakfast'),
  ('dessert',             'Dessert')
ON CONFLICT (name) DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE wc_feature_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_recipe_feature_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read feature tags"
  ON wc_feature_tags FOR SELECT USING (true);

CREATE POLICY "authenticated users can create tags"
  ON wc_feature_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "anyone can read recipe feature tags"
  ON wc_recipe_feature_tags FOR SELECT USING (true);

CREATE POLICY "authenticated users can assign tags"
  ON wc_recipe_feature_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "assigner can remove tag"
  ON wc_recipe_feature_tags FOR DELETE USING (assigned_by = auth.uid());
