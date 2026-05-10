-- =============================================================
-- What's Cooking — Collaborative Kitchen Migration
-- 2026-04-27
--
-- Creates:
--   kitchen_groups            — shared cooking groups
--   kitchen_group_members     — membership + roles
--   kitchen_group_invites     — invite token system
--   personal_shopping_items   — per-user private list
--   group_shopping_items      — shared list (Realtime-enabled)
--   push_subscriptions        — Web Push VAPID registrations
-- =============================================================

-- ─── kitchen_groups ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── kitchen_group_members ───────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_group_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES kitchen_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS kitchen_group_members_group_id_idx ON kitchen_group_members (group_id);
CREATE INDEX IF NOT EXISTS kitchen_group_members_user_id_idx  ON kitchen_group_members (user_id);

-- ─── kitchen_group_invites ───────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_group_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES kitchen_groups(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_uses    int,
  uses        int NOT NULL DEFAULT 0,
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kitchen_group_invites_token_idx    ON kitchen_group_invites (token);
CREATE INDEX IF NOT EXISTS kitchen_group_invites_group_id_idx ON kitchen_group_invites (group_id);

-- ─── personal_shopping_items ─────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_shopping_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  amount       text,
  unit         text,
  recipe_title text,
  checked      boolean NOT NULL DEFAULT false,
  position     int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_shopping_items_user_id_idx ON personal_shopping_items (user_id);

-- ─── group_shopping_items ────────────────────────────────────
-- NOTE: Enable Realtime on this table after applying the migration:
--   Supabase Dashboard → Database → Replication → toggle ON
--   OR: ALTER PUBLICATION supabase_realtime ADD TABLE group_shopping_items;
CREATE TABLE IF NOT EXISTS group_shopping_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES kitchen_groups(id) ON DELETE CASCADE,
  added_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  amount       text,
  unit         text,
  recipe_title text,
  checked      boolean NOT NULL DEFAULT false,
  checked_by   uuid REFERENCES auth.users(id),
  checked_at   timestamptz,
  position     int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_shopping_items_group_id_idx ON group_shopping_items (group_id);
CREATE INDEX IF NOT EXISTS group_shopping_items_added_by_idx ON group_shopping_items (added_by);

-- ─── push_subscriptions ──────────────────────────────────────
-- Stores Web Push VAPID subscriptions (one per browser/device per user)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth_key    text NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

-- =============================================================
-- Row Level Security
-- =============================================================

ALTER TABLE kitchen_groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_group_invites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_shopping_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_shopping_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions        ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the current user a member of this group? ──────
CREATE OR REPLACE FUNCTION is_group_member(gid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kitchen_group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;

-- ── Helper: is the current user owner or admin of this group? ─
CREATE OR REPLACE FUNCTION is_group_admin(gid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kitchen_group_members
    WHERE group_id = gid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- ─── kitchen_groups policies ─────────────────────────────────
DROP POLICY IF EXISTS "members can view their groups"  ON kitchen_groups;
DROP POLICY IF EXISTS "owner can update group"         ON kitchen_groups;
DROP POLICY IF EXISTS "owner can delete group"         ON kitchen_groups;
DROP POLICY IF EXISTS "authenticated users can create" ON kitchen_groups;

CREATE POLICY "members can view their groups"
  ON kitchen_groups FOR SELECT
  USING (is_group_member(id));

CREATE POLICY "owner can update group"
  ON kitchen_groups FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "owner can delete group"
  ON kitchen_groups FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "authenticated users can create"
  ON kitchen_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── kitchen_group_members policies ─────────────────────────
DROP POLICY IF EXISTS "members can view membership"    ON kitchen_group_members;
DROP POLICY IF EXISTS "admins can add members"         ON kitchen_group_members;
DROP POLICY IF EXISTS "admins can remove members"      ON kitchen_group_members;
DROP POLICY IF EXISTS "member can leave"               ON kitchen_group_members;

CREATE POLICY "members can view membership"
  ON kitchen_group_members FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY "admins can add members"
  ON kitchen_group_members FOR INSERT
  WITH CHECK (is_group_admin(group_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "admins can remove members"
  ON kitchen_group_members FOR DELETE
  USING (is_group_admin(group_id));

CREATE POLICY "member can leave"
  ON kitchen_group_members FOR DELETE
  USING (user_id = auth.uid());

-- ─── kitchen_group_invites policies ─────────────────────────
DROP POLICY IF EXISTS "members can view invites"       ON kitchen_group_invites;
DROP POLICY IF EXISTS "admins can create invites"      ON kitchen_group_invites;
DROP POLICY IF EXISTS "admins can delete invites"      ON kitchen_group_invites;

CREATE POLICY "members can view invites"
  ON kitchen_group_invites FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY "admins can create invites"
  ON kitchen_group_invites FOR INSERT
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "admins can delete invites"
  ON kitchen_group_invites FOR DELETE
  USING (is_group_admin(group_id));

-- ─── personal_shopping_items policies ───────────────────────
DROP POLICY IF EXISTS "users own their personal items" ON personal_shopping_items;

CREATE POLICY "users own their personal items"
  ON personal_shopping_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── group_shopping_items policies ──────────────────────────
DROP POLICY IF EXISTS "members can view group list"    ON group_shopping_items;
DROP POLICY IF EXISTS "members can add to group list"  ON group_shopping_items;
DROP POLICY IF EXISTS "members can update items"       ON group_shopping_items;
DROP POLICY IF EXISTS "adder or admin can delete item" ON group_shopping_items;

CREATE POLICY "members can view group list"
  ON group_shopping_items FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY "members can add to group list"
  ON group_shopping_items FOR INSERT
  WITH CHECK (is_group_member(group_id) AND added_by = auth.uid());

CREATE POLICY "members can update items"
  ON group_shopping_items FOR UPDATE
  USING (is_group_member(group_id));

CREATE POLICY "adder or admin can delete item"
  ON group_shopping_items FOR DELETE
  USING (added_by = auth.uid() OR is_group_admin(group_id));

-- ─── push_subscriptions policies ────────────────────────────
DROP POLICY IF EXISTS "users own their subscriptions"  ON push_subscriptions;

CREATE POLICY "users own their subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================
-- updated_at trigger for kitchen_groups
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kitchen_groups_updated_at ON kitchen_groups;
CREATE TRIGGER kitchen_groups_updated_at
  BEFORE UPDATE ON kitchen_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
