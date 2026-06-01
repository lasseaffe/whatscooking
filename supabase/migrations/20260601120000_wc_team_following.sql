-- =============================================================
-- What's Cooking — World Cup 2026: Team Following + Watch Parties
-- 2026-06-01
--
-- Powers the "Pick Your Team, Cook Your Matchday" reapproach:
--   wc_user_teams    — nations a user roots for (allegiance)
--   wc_watch_parties — links a fixture to an event and (optionally) a squad
--
-- Depends on:
--   wc_fixtures        (supabase/wc2026_schema.sql)
--   kitchen_groups     (20260427_collaborative_kitchen.sql) — squads
--   dinner_parties     (20260509040000_event_planner.sql)   — events
--   is_group_member()  helper (20260427_collaborative_kitchen.sql)
-- =============================================================

-- ─── wc_user_teams ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_user_teams (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nation_code varchar(6) NOT NULL,          -- matches wc_fixtures.home_code / away_code (ISO-2; "GB" = England)
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, nation_code)
);

CREATE INDEX IF NOT EXISTS wc_user_teams_user_id_idx ON wc_user_teams (user_id);

ALTER TABLE wc_user_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage their followed teams" ON wc_user_teams;
CREATE POLICY "users manage their followed teams"
  ON wc_user_teams FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── wc_watch_parties ────────────────────────────────────────
-- One row per "watch this fixture" intent. dinner_party_id links the
-- created event; kitchen_group_id (nullable) links a persistent squad.
CREATE TABLE IF NOT EXISTS wc_watch_parties (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id       uuid NOT NULL REFERENCES wc_fixtures(id) ON DELETE CASCADE,
  kitchen_group_id uuid REFERENCES kitchen_groups(id) ON DELETE SET NULL,
  dinner_party_id  uuid REFERENCES dinner_parties(id) ON DELETE SET NULL,
  host_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wc_watch_parties_fixture_id_idx ON wc_watch_parties (fixture_id);
CREATE INDEX IF NOT EXISTS wc_watch_parties_group_id_idx   ON wc_watch_parties (kitchen_group_id);
CREATE INDEX IF NOT EXISTS wc_watch_parties_host_idx       ON wc_watch_parties (host_user_id);

ALTER TABLE wc_watch_parties ENABLE ROW LEVEL SECURITY;

-- Visible to the host and to squadmates when a squad is attached.
DROP POLICY IF EXISTS "host or squad can view watch parties" ON wc_watch_parties;
CREATE POLICY "host or squad can view watch parties"
  ON wc_watch_parties FOR SELECT
  USING (
    host_user_id = auth.uid()
    OR (kitchen_group_id IS NOT NULL AND is_group_member(kitchen_group_id))
  );

DROP POLICY IF EXISTS "host can create watch parties" ON wc_watch_parties;
CREATE POLICY "host can create watch parties"
  ON wc_watch_parties FOR INSERT
  WITH CHECK (host_user_id = auth.uid());

DROP POLICY IF EXISTS "host can update watch parties" ON wc_watch_parties;
CREATE POLICY "host can update watch parties"
  ON wc_watch_parties FOR UPDATE
  USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid());

DROP POLICY IF EXISTS "host can delete watch parties" ON wc_watch_parties;
CREATE POLICY "host can delete watch parties"
  ON wc_watch_parties FOR DELETE
  USING (host_user_id = auth.uid());
