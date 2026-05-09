-- supabase/migrations/20260509000000_baby_family_hub.sql

-- ── New tables ──────────────────────────────────────────────

CREATE TABLE household_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_group_id uuid NOT NULL REFERENCES kitchen_groups(id) ON DELETE CASCADE,
  name             text NOT NULL,
  member_type      text NOT NULL CHECK (member_type IN ('baby', 'toddler', 'child', 'adult')),
  date_of_birth    date,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE member_milestones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  milestone_key text NOT NULL CHECK (milestone_key IN (
    'started_solids', 'handles_soft_lumps', 'finger_foods', 'family_table'
  )),
  confirmed_at  timestamptz DEFAULT now(),
  confirmed_by  uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (member_id, milestone_key)
);

CREATE TABLE member_allergens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  allergen_key  text NOT NULL CHECK (allergen_key IN (
    'egg', 'dairy', 'gluten', 'peanut', 'tree_nut', 'soy', 'fish', 'shellfish'
  )),
  introduced_at timestamptz DEFAULT now(),
  introduced_by uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (member_id, allergen_key)
);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX ON household_members (kitchen_group_id);
CREATE INDEX ON household_members (created_by);
CREATE INDEX ON member_milestones (member_id);
CREATE INDEX ON member_allergens  (member_id);

-- ── Extend recipes ───────────────────────────────────────────

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS baby_stages    text[]  DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS allergen_flags text[]  DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS has_baby_variant       boolean DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS baby_variant_recipe_id uuid REFERENCES recipes(id);

-- ── Extend shopping lists ────────────────────────────────────

ALTER TABLE personal_shopping_items ADD COLUMN IF NOT EXISTS for_member_id uuid REFERENCES household_members(id) ON DELETE SET NULL;
ALTER TABLE group_shopping_items    ADD COLUMN IF NOT EXISTS for_member_id uuid REFERENCES household_members(id) ON DELETE SET NULL;

-- ── Extend user_preferences ──────────────────────────────────

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS baby_track_visible boolean DEFAULT false;

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE household_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_milestones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_allergens   ENABLE ROW LEVEL SECURITY;

-- household_members: readable/writable by members of the same kitchen_group
CREATE POLICY "group members can read household_members"
  ON household_members FOR SELECT
  USING (
    kitchen_group_id IN (
      SELECT group_id FROM kitchen_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "group members can insert household_members"
  ON household_members FOR INSERT
  WITH CHECK (
    kitchen_group_id IN (
      SELECT group_id FROM kitchen_group_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "group members can update household_members"
  ON household_members FOR UPDATE
  USING (
    kitchen_group_id IN (
      SELECT group_id FROM kitchen_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "group members can delete household_members"
  ON household_members FOR DELETE
  USING (created_by = auth.uid());

-- member_milestones: same group access via member join
CREATE POLICY "group members can manage member_milestones"
  ON member_milestones FOR ALL
  USING (
    member_id IN (
      SELECT hm.id FROM household_members hm
      JOIN kitchen_group_members kgm ON kgm.group_id = hm.kitchen_group_id
      WHERE kgm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT hm.id FROM household_members hm
      JOIN kitchen_group_members kgm ON kgm.group_id = hm.kitchen_group_id
      WHERE kgm.user_id = auth.uid()
    )
  );

-- member_allergens: same group access via member join
CREATE POLICY "group members can manage member_allergens"
  ON member_allergens FOR ALL
  USING (
    member_id IN (
      SELECT hm.id FROM household_members hm
      JOIN kitchen_group_members kgm ON kgm.group_id = hm.kitchen_group_id
      WHERE kgm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT hm.id FROM household_members hm
      JOIN kitchen_group_members kgm ON kgm.group_id = hm.kitchen_group_id
      WHERE kgm.user_id = auth.uid()
    )
  );
