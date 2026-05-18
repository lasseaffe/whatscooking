-- supabase/migrations/20260512_image_prefs.sql

-- 1. Add alternate image URL array to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- 2. Generic image preferences table (recipes, cookbooks, chapters)
CREATE TABLE IF NOT EXISTS image_prefs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type  text NOT NULL CHECK (entity_type IN ('recipe','cookbook','chapter')),
  entity_id    text NOT NULL,
  image_url    text NOT NULL,
  x            float8 NOT NULL DEFAULT 50,
  y            float8 NOT NULL DEFAULT 50,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id, image_url)
);

CREATE INDEX IF NOT EXISTS image_prefs_lookup_idx
  ON image_prefs (user_id, entity_type, entity_id);

-- 3. RLS — each user reads/writes only their own rows
ALTER TABLE image_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own image_prefs"
  ON image_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own image_prefs"
  ON image_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own image_prefs"
  ON image_prefs FOR UPDATE
  USING (auth.uid() = user_id);
