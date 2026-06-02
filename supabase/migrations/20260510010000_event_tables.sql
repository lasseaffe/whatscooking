-- =============================================================
-- Event sub-resource tables
-- Supports: shopping lists, location voting, playlist tracks
-- The core party + guest rows live in dinner_parties / dinner_party_guests
-- =============================================================

-- ── Event menu items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    uuid NOT NULL REFERENCES dinner_parties(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  course      text NOT NULL DEFAULT 'main',
  recipe_id   uuid REFERENCES recipes(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Event timeline items ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_timeline_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    uuid NOT NULL REFERENCES dinner_parties(id) ON DELETE CASCADE,
  time_label  text NOT NULL,
  activity    text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0
);

-- ── Event shopping items ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_shopping_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    uuid NOT NULL REFERENCES dinner_parties(id) ON DELETE CASCADE,
  name        text NOT NULL,
  quantity    text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checked     boolean NOT NULL DEFAULT false,
  checked_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at  timestamptz,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Event location options ────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_location_options (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id  uuid NOT NULL REFERENCES dinner_parties(id) ON DELETE CASCADE,
  name      text NOT NULL,
  address   text,
  notes     text,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Event location votes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_location_votes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES event_location_options(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (option_id, user_id)
);

-- ── Event playlist tracks ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_playlist_tracks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id         uuid NOT NULL REFERENCES dinner_parties(id) ON DELETE CASCADE,
  submitted_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_uri      text NOT NULL,
  track_name       text,
  artist_name      text,
  album_art_url    text,
  added_to_spotify boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE event_menu_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_timeline_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_shopping_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_location_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_location_votes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Allow read for host and guests
DROP POLICY IF EXISTS "event_menu_read"      ON event_menu_items;
DROP POLICY IF EXISTS "event_timeline_read"  ON event_timeline_items;
DROP POLICY IF EXISTS "event_shopping_read"  ON event_shopping_items;
DROP POLICY IF EXISTS "event_location_read"  ON event_location_options;
DROP POLICY IF EXISTS "event_votes_read"     ON event_location_votes;
DROP POLICY IF EXISTS "event_tracks_read"    ON event_playlist_tracks;
DROP POLICY IF EXISTS "event_shopping_write" ON event_shopping_items;
DROP POLICY IF EXISTS "event_location_write" ON event_location_options;
DROP POLICY IF EXISTS "event_votes_write"    ON event_location_votes;
DROP POLICY IF EXISTS "event_tracks_write"   ON event_playlist_tracks;
DROP POLICY IF EXISTS "event_menu_write"     ON event_menu_items;
DROP POLICY IF EXISTS "event_timeline_write" ON event_timeline_items;

CREATE POLICY "event_menu_read"      ON event_menu_items      FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinner_parties      WHERE id = party_id AND host_id = auth.uid())
  OR EXISTS (SELECT 1 FROM dinner_party_guests WHERE party_id = event_menu_items.party_id AND user_id = auth.uid())
);
CREATE POLICY "event_timeline_read"  ON event_timeline_items  FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinner_parties      WHERE id = party_id AND host_id = auth.uid())
  OR EXISTS (SELECT 1 FROM dinner_party_guests WHERE party_id = event_timeline_items.party_id AND user_id = auth.uid())
);
CREATE POLICY "event_shopping_read"  ON event_shopping_items  FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinner_parties      WHERE id = party_id AND host_id = auth.uid())
  OR EXISTS (SELECT 1 FROM dinner_party_guests WHERE party_id = event_shopping_items.party_id AND user_id = auth.uid())
);
CREATE POLICY "event_location_read"  ON event_location_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinner_parties      WHERE id = party_id AND host_id = auth.uid())
  OR EXISTS (SELECT 1 FROM dinner_party_guests WHERE party_id = event_location_options.party_id AND user_id = auth.uid())
);
CREATE POLICY "event_votes_read"     ON event_location_votes  FOR SELECT USING (true);
CREATE POLICY "event_tracks_read"    ON event_playlist_tracks FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinner_parties      WHERE id = party_id AND host_id = auth.uid())
  OR EXISTS (SELECT 1 FROM dinner_party_guests WHERE party_id = event_playlist_tracks.party_id AND user_id = auth.uid())
);

-- Write policies (host or accepted guests via API — enforced in route.ts)
CREATE POLICY "event_shopping_write" ON event_shopping_items  FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "event_location_write" ON event_location_options FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "event_votes_write"    ON event_location_votes  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "event_tracks_write"   ON event_playlist_tracks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "event_menu_write"     ON event_menu_items      FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "event_timeline_write" ON event_timeline_items  FOR ALL USING (auth.uid() IS NOT NULL);
