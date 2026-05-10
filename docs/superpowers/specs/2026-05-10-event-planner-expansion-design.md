# Event Planner Expansion — Design Spec
_Date: 2026-05-10_

## Context

The What's Cooking event planner (`/events/[id]`) has a solid foundation: 5 tabs (Overview, Guests, Shopping, Location, Playlist), a full Supabase schema, and a working REST API layer. However, several tabs are only partially connected — the schema has fields like `recipe_id` on menu items and `assigned_to` on shopping items that have no UI. Key social and integration flows are also missing: no shareable invite link, no image upload for the event, no recipe→shopping bridge, and the playlist tab is gated behind Spotify auth even for basic URL entry. This spec closes those gaps.

---

## Scope

Seven focused improvements, each self-contained:

1. **Event image upload** — replace emoji-only avatar with image upload
2. **Recipe → Shopping integration** — pull recipe ingredients into the shopping list
3. **Shopping item categories** — tag items (ingredient, beverage, equipment, etc.)
4. **Location type selector** — Private Home / Restaurant / Public Space / Other
5. **Playlist: URL entry without Spotify** — manual track entry when Spotify not connected
6. **Guest: shareable invite link + WhatsApp/iMessage deep links**
7. **Guest: permission roles (editor vs viewer) + mailto invite**

---

## 1. Event Image Upload

**Where:** `overview-tab.tsx` — clicking the avatar square opens an upload flow.

**How:**
- Clicking the avatar (when host) opens a file input (`accept="image/*"`)
- On select: upload to Supabase Storage bucket `event-avatars` via a new API route `POST /api/events/[id]/avatar`
- API route: uploads to storage, gets public URL, updates `dinner_parties.avatar_url`, returns new URL
- UI updates avatar immediately via `onReload()`
- Keep emoji fallback when no image uploaded

**DB change:** None — `avatar_url` already exists on `dinner_parties`.

**Storage:** New Supabase bucket `event-avatars` with public read policy. RLS: only host can upload to their event's path (`events/{eventId}/*`).

---

## 2. Recipe → Shopping Integration

**Where:** `shopping-tab.tsx` — new "Add from recipe" section above the manual add form.

**How:**
- Host sees a "Add from recipe" button
- Opens a modal/inline panel showing the event's menu items that have a `recipe_id`
- For each linked recipe, fetch ingredients from the `recipes` table (already exists in WC schema)
- User selects which ingredients to import; confirms
- Ingredients are bulk-added to `event_shopping_items` via existing `POST /api/events/[id]/shopping`
- Category auto-set to `ingredient`

**API needed:** `GET /api/events/[id]/recipe-ingredients` — joins `event_menu_items` → `recipes` → `recipe_ingredients`, returns grouped list.

**DB change:** None — `recipe_id` already on `event_menu_items`.

---

## 3. Shopping Item Categories

**Where:** `shopping-tab.tsx` add form + item display.

**How:**
- Add `category` field to `event_shopping_items` table: `'ingredient' | 'beverage' | 'equipment' | 'other'` (default `'other'`)
- In the add form: small pill selector for category (icon + label)
- Items grouped by category in the list view with section headers
- Category shown as a subtle colored dot/tag on each item

**DB migration:** Add `category text not null default 'other'` to `event_shopping_items`.

**API change:** `POST /api/events/[id]/shopping` accepts optional `category` field.

---

## 4. Location Type Selector

**Where:** `location-tab.tsx` — add form gets a type field.

**How:**
- Add `location_type text` to `event_location_options`: `'private' | 'restaurant' | 'public' | 'other'`
- In the suggest-location form: 4-button selector row (🏠 Private · 🍽️ Restaurant · 🌳 Public · 📍 Other)
- Display type as a small badge on each location card
- Keep address + notes fields as-is (no autocomplete API)

**DB migration:** Add `location_type text` column to `event_location_options`.

**API change:** `POST /api/events/[id]/locations` accepts optional `location_type`.

---

## 5. Playlist: Manual URL Entry Without Spotify

**Where:** `playlist-tab.tsx` — currently the track submission form is hidden when `!party.spotify_playlist_id`.

**How:**
- Always show the URL input form for guests/hosts who `canInteract`
- When Spotify not connected: accept URL, store `spotify_uri` and `track_name` (parsed from URL), set `added_to_spotify = false`
- Parse track ID from URL client-side: `open.spotify.com/track/{id}` → store as `spotify:{id}`
- Show tracks in list with a grey dot (not green) if not synced to Spotify
- When host later connects Spotify, a "Sync pending tracks" button appears that adds all unsynced tracks to the playlist

**DB change:** None — `added_to_spotify` boolean already exists.

**API change:** `POST /api/events/[id]/tracks` — if no Spotify credentials, skip the `addTrackToPlaylist` step, still save the record. Fetch track metadata via Spotify public API (no auth needed for basic track lookup) or skip metadata if unavailable.

---

## 6. Guest: Shareable Invite Link + Deep Links

**Where:** `guests-tab.tsx` — new "Share invite" section for hosts.

**How:**

### Invite link
- `dinner_party_guests` gets an `invite_token uuid` column (unique, generated on event creation)
- One token per event (not per guest) — anyone with the link can RSVP
- API: `GET /api/events/[id]/invite-link` → returns `{url: "https://…/events/join?token=xxx"}`
- Public RSVP page: `/events/join?token=xxx` — shows event name, date, host; prompts for name + email; creates guest record with `rsvp: 'invited'`
- Host UI: "Copy invite link" button

### Deep links (WhatsApp + iMessage)
- WhatsApp: `https://wa.me/?text=You're+invited+to+{title}!+{link}`
- iMessage: `sms:&body=You're+invited+to+{title}!+{link}`
- Two icon buttons next to "Copy link"

**DB migration:** Add `invite_token uuid unique default gen_random_uuid()` to `dinner_parties`.

---

## 7. Guest Permission Roles + mailto Invite

### Permission roles
**Where:** `guests-tab.tsx` invite flow + `event-hub.tsx` `canInteract` logic.

**How:**
- `dinner_party_guests` gets `role text not null default 'viewer'` — values: `'editor' | 'viewer'`
- Host invite form: toggle "Can edit" / "View only" when inviting
- `canInteract` in `event-hub.tsx` changes from `userRole !== 'invited' && userRole !== 'declined'` → `isHost || guestRole === 'editor'`
- Host can change a guest's role after invite (dropdown on guest row)

### mailto invite
- Email invite field: clicking "Invite" opens `mailto:{email}?subject=…&body=…` pre-filled with event name, date, invite link
- No server-side email sending needed

**DB migration:** Add `role text not null default 'viewer'` to `dinner_party_guests`.

**API change:** `POST /api/events/[id]/guests` accepts optional `role`. `PATCH /api/events/[id]/guests/[guestId]` accepts `role` update (host only).

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/app/(app)/events/[id]/tabs/overview-tab.tsx` | Add image upload UI |
| `src/app/(app)/events/[id]/tabs/shopping-tab.tsx` | Add category selector + recipe import |
| `src/app/(app)/events/[id]/tabs/location-tab.tsx` | Add location type selector |
| `src/app/(app)/events/[id]/tabs/playlist-tab.tsx` | Allow URL entry without Spotify |
| `src/app/(app)/events/[id]/tabs/guests-tab.tsx` | Add shareable link + deep links + role toggle + mailto |
| `src/app/(app)/events/[id]/event-hub.tsx` | Update `canInteract` logic to use guest role |
| `src/app/(app)/events/join/page.tsx` | **NEW** — public RSVP page |
| `src/lib/event-types.ts` | Add `role`, `invite_token`, `category`, `location_type` fields |
| `src/app/api/events/[id]/avatar/route.ts` | **NEW** — image upload handler |
| `src/app/api/events/[id]/recipe-ingredients/route.ts` | **NEW** — fetch recipe ingredients for shopping import |
| `src/app/api/events/[id]/invite-link/route.ts` | **NEW** — return invite URL |
| `src/app/api/events/join/route.ts` | **NEW** — validate token + create guest record |
| `src/app/api/events/[id]/guests/route.ts` | Accept `role` field |
| `src/app/api/events/[id]/guests/[guestId]/route.ts` | Accept `role` update |
| `src/app/api/events/[id]/shopping/route.ts` | Accept `category` field |
| `src/app/api/events/[id]/locations/route.ts` | Accept `location_type` field |
| `src/app/api/events/[id]/tracks/route.ts` | Allow saving without Spotify; add sync endpoint |
| `supabase/migrations/20260510_event_planner_expansion.sql` | Add all new columns |

---

## DB Migration

```sql
-- Guest roles
alter table dinner_party_guests
  add column if not exists role text not null default 'viewer';

-- Invite token on event
alter table dinner_parties
  add column if not exists invite_token uuid unique default gen_random_uuid();

-- Shopping categories
alter table event_shopping_items
  add column if not exists category text not null default 'other';

-- Location types
alter table event_location_options
  add column if not exists location_type text;
```

---

## Verification

1. **Image upload:** Create event → click avatar → pick image → confirm new photo appears
2. **Recipe → Shopping:** Add a menu item linked to a recipe → Shopping tab → "Add from recipe" → ingredients appear in list
3. **Shopping categories:** Add items with different categories → confirm grouping renders correctly
4. **Location types:** Suggest location with type → badge appears on card
5. **Playlist without Spotify:** Navigate to playlist tab on event with no Spotify → enter a Spotify URL → track appears in list with grey dot
6. **Invite link:** Host clicks "Copy invite link" → paste in browser → RSVP page loads with correct event info → submit name → guest appears in host's guest list
7. **WhatsApp/iMessage:** Click share buttons → correct app opens with pre-filled message
8. **Role permissions:** Invite guest as 'viewer' → log in as guest → Shopping/Location/Playlist add-item forms are hidden
