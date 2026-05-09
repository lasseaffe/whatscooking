# Event Planner — Full Feature Design Spec
**Date:** 2026-05-09  
**Status:** Approved for implementation

---

## 1. Overview

Transform the current stateless AI event generator into a fully collaborative, persistent event planning platform within What's Cooking. Events are saved to Supabase, guests must have WC accounts, and all collaborative features (shared shopping list, location voting, Spotify playlist, menu editing) operate in real time.

---

## 2. Data Model

### Extend `dinner_parties`
```sql
alter table dinner_parties
  add column avatar_url        text,         -- uploaded image (Supabase Storage)
  add column avatar_emoji      text,         -- emoji fallback (default from occasion)
  add column spotify_playlist_id   text,     -- Spotify playlist ID after creation
  add column spotify_access_token  text,     -- encrypted OAuth access token
  add column spotify_refresh_token text,     -- encrypted OAuth refresh token
  add column spotify_token_expires_at timestamptz;
```

### New Tables

```sql
-- Editable menu items (replaces static AI recipes)
create table event_menu_items (
  id           uuid default gen_random_uuid() primary key,
  party_id     uuid references dinner_parties(id) on delete cascade not null,
  name         text not null,
  description  text,
  course       text not null, -- appetizer | main | dessert | drink | side
  recipe_id    uuid references recipes(id) on delete set null, -- WC recipe link
  sort_order   int  default 0,
  created_at   timestamptz default now()
);

-- Editable timeline entries
create table event_timeline_items (
  id         uuid default gen_random_uuid() primary key,
  party_id   uuid references dinner_parties(id) on delete cascade not null,
  time_label text not null,   -- "10:00 AM", "Day before", etc.
  activity   text not null,
  sort_order int  default 0
);

-- Collaborative shopping list
create table event_shopping_items (
  id          uuid default gen_random_uuid() primary key,
  party_id    uuid references dinner_parties(id) on delete cascade not null,
  name        text not null,
  quantity    text,
  assigned_to uuid references auth.users on delete set null,
  checked     boolean default false,
  checked_by  uuid references auth.users on delete set null,
  checked_at  timestamptz,
  created_by  uuid references auth.users not null,
  created_at  timestamptz default now()
);

-- Location vote candidates
create table event_location_options (
  id         uuid default gen_random_uuid() primary key,
  party_id   uuid references dinner_parties(id) on delete cascade not null,
  name       text not null,
  address    text,
  notes      text,
  is_winner  boolean default false,
  created_at timestamptz default now()
);

-- One vote per user per location option
create table event_location_votes (
  id          uuid default gen_random_uuid() primary key,
  option_id   uuid references event_location_options(id) on delete cascade not null,
  user_id     uuid references auth.users not null,
  created_at  timestamptz default now(),
  unique (option_id, user_id)
);

-- Spotify tracks submitted by guests
create table event_playlist_tracks (
  id           uuid default gen_random_uuid() primary key,
  party_id     uuid references dinner_parties(id) on delete cascade not null,
  submitted_by uuid references auth.users not null,
  spotify_uri  text not null,
  track_name   text,
  artist_name  text,
  album_art_url text,
  added_to_spotify boolean default false,
  created_at   timestamptz default now(),
  unique (party_id, spotify_uri)
);
```

### RLS Policies
All new tables follow the same pattern as existing `dinner_party_*` tables:
- Host: full access via `party_id in (select id from dinner_parties where host_id = auth.uid())`
- Accepted guests: read + limited write (check items, vote, submit tracks)
- Invited/maybe guests: read only

---

## 3. Routes & Navigation

```
/events                    List: events hosting + events attending, sorted by date. Empty state: "No events yet — plan your first one" with CTA to /events/new.
/events/new                Create flow: AI generator → save → redirect to /events/[id]
/events/[id]               Hub page with tabbed sections
/events/[id]/shopping      Full-page shopping list
/events/[id]/playlist      Playlist + track submission
/events/[id]/location      Location options + voting
```

### Event Hub `/events/[id]` Tabs
1. **Overview** — header (name, avatar, date, guests summary), menu, timeline, decorations/activities, ambiance
2. **Guests** — invite, RSVP status, remove (host only)
3. **Shopping** — shared shopping list
4. **Playlist** — Spotify integration + track list
5. **Location** — vote options + results

### Permission Boundaries
| Action | Host | Accepted Guest | Invited/Maybe | Unauthenticated |
|---|---|---|---|---|
| View event | ✓ | ✓ | ✓ | 403 |
| Edit name/avatar/date | ✓ | ✗ | ✗ | 403 |
| Edit menu/timeline | ✓ | ✗ | ✗ | 403 |
| Invite/remove guests | ✓ | ✗ | ✗ | 403 |
| RSVP | ✓ | ✓ | ✓ | 403 |
| Check shopping items | ✓ | ✓ | ✗ | 403 |
| Add shopping items | ✓ | ✓ | ✗ | 403 |
| Vote on location | ✓ | ✓ | ✗ | 403 |
| Mark location winner | ✓ | ✗ | ✗ | 403 |
| Submit playlist tracks | ✓ | ✓ | ✗ | 403 |

---

## 4. Feature Specifications

### 4.1 Event Creation Flow
1. User picks occasion type + guests + dietary + notes (existing UI)
2. AI generates plan (existing API)
3. New "Save & Edit Event" CTA replaces read-only display
4. On save: insert `dinner_parties` row, insert `event_menu_items`, `event_timeline_items`, `event_shopping_items` (from `shopping_highlights`)
5. Redirect to `/events/[id]`

### 4.2 Inline Editing (Host Only)
- **Event name**: click to edit, blur to save (optimistic update + Supabase patch)
- **Avatar**: click avatar area → modal with two tabs: (a) emoji picker grid, (b) image upload → Supabase Storage bucket `event-avatars`, max 5MB, public URL stored in `avatar_url`
- **Date/time**: click date → date+time picker popover
- **Guest count**: derived from accepted guests; not directly editable

### 4.3 Menu Editing
- Each `event_menu_items` row renders as a card with an edit (pencil) icon (host only)
- Edit modal fields: name, description, course (select), + "Use saved recipe" and "Browse all recipes" buttons
- "Use saved recipe": searches `saved_recipes` join `recipes` for the logged-in user
- "Browse all recipes": full-text search on `recipes` table
- Selecting a recipe: maps `recipes.name` → name, `recipes.description` → description, infers course from recipe tags
- Host can add blank items and delete existing ones
- Sort order: drag handle or up/down arrows

### 4.4 Timeline Editing
- Each `event_timeline_items` row: time label (free text) + activity text
- Inline add row at bottom; click any row to edit; trash icon to delete
- Sort by `sort_order`; up/down arrows to reorder

### 4.5 Guest Management
- Invite input: search WC users by username or email → select → inserts into `dinner_party_guests` with `rsvp = 'invited'`
- Guest list shows: avatar, name, RSVP badge (accepted/maybe/declined/invited)
- Host can remove any guest (delete row)
- Each guest sees RSVP controls on their view: Accept / Maybe / Decline buttons

### 4.6 Shared Shopping List
- Items loaded from `event_shopping_items` ordered by `created_at`
- AI pre-populates from `shopping_highlights` at save time (expanded to proper item names)
- Each item: checkbox (toggles `checked`), item name, quantity, assignee dropdown (accepted guests + host + "Unassigned")
- Any accepted guest can check/uncheck and reassign
- Host can add items (input at bottom) and delete any item
- Checked items move to bottom of list with strikethrough style
- No real-time requirement — optimistic updates + refetch on focus is sufficient

### 4.7 Location Voting
- Host adds 1–5 location options: name (required) + address + notes
- Voting opens once ≥ 2 options exist
- Each accepted guest (including host) sees upvote buttons per option
- Vote counts shown as filled progress bars
- Host gets "Mark as winner" button on any option → sets `is_winner = true`, locks voting, updates `dinner_parties.location`
- After winner set: voting UI replaced with winner announcement card

### 4.8 Spotify Playlist
**OAuth Flow:**
1. Host clicks "Connect Spotify" → server-side redirect to Spotify authorization URL with scopes: `playlist-modify-public`, `playlist-modify-private`
2. Callback at `/api/events/spotify/callback` → exchange code for tokens → encrypt with AES-256-GCM using `SPOTIFY_ENCRYPTION_KEY` env var (via `lib/crypto.ts`) → store in `dinner_parties`
3. Server creates a collaborative Spotify playlist named `"[Event Name] — What's Cooking"` → store `spotify_playlist_id`

**Track Submission:**
1. Any accepted guest pastes a Spotify track URL or URI into the submission input
2. Server resolves to track URI, calls Spotify API to fetch metadata (name, artist, album art) using host's token
3. Inserts into `event_playlist_tracks`; calls Spotify `POST /playlists/{id}/tracks` to add to the real playlist
4. Track appears in the list with album art, name, artist, submitter name

**Token Refresh:** Server-side middleware refreshes host's token automatically before any Spotify API call if `spotify_token_expires_at` is within 5 minutes.

**Guest view of Spotify section (host not connected):** "The host hasn't connected Spotify yet" message with no submission form.

### 4.9 My Events Entry Point
- A card/section on `/discover` (or dashboard) showing the user's next 3 upcoming events
- Card shows: event avatar, name, date, role (Hosting / Attending), RSVP badge if attending
- "See all events" links to `/events`

---

## 5. API Routes

```
POST   /api/events/create              Save AI-generated plan to DB
GET    /api/events/[id]                Fetch full event + all sub-tables
PATCH  /api/events/[id]                Update event fields (name, avatar, date, etc.)
POST   /api/events/[id]/menu           Add menu item
PATCH  /api/events/[id]/menu/[itemId]  Update menu item
DELETE /api/events/[id]/menu/[itemId]  Delete menu item
POST   /api/events/[id]/timeline       Add timeline item
PATCH  /api/events/[id]/timeline/[id]  Update timeline item
DELETE /api/events/[id]/timeline/[id]  Delete timeline item
POST   /api/events/[id]/guests         Invite guest
PATCH  /api/events/[id]/guests/[id]    Update RSVP
DELETE /api/events/[id]/guests/[id]    Remove guest
POST   /api/events/[id]/shopping       Add shopping item
PATCH  /api/events/[id]/shopping/[id]  Update item (check, assign)
DELETE /api/events/[id]/shopping/[id]  Delete shopping item
POST   /api/events/[id]/locations      Add location option
POST   /api/events/[id]/locations/[id]/vote    Vote on location
DELETE /api/events/[id]/locations/[id]/vote    Unvote
PATCH  /api/events/[id]/locations/[id]/winner  Mark winner
GET    /api/events/spotify/connect     Start Spotify OAuth
GET    /api/events/spotify/callback    OAuth callback
POST   /api/events/[id]/tracks         Submit track (resolves + adds to Spotify playlist)
```

---

## 6. WC Recipe Integration Detail

When host opens "Browse saved recipes" in the menu item editor:
- Query: `select r.* from saved_recipes sr join recipes r on r.id = sr.recipe_id where sr.user_id = auth.uid()`
- Results shown as a searchable list with recipe image thumbnail
- Course inference: if recipe has tag `breakfast|brunch` → main; `dessert|sweet` → dessert; `drink|cocktail|mocktail` → drink; else → main
- Selecting populates the modal; host can still override any field before saving

---

## 7. Out of Scope (Future)

- Real-time collaborative editing (Supabase Realtime subscriptions) — polling on focus is sufficient for v1
- Push notifications for RSVP changes or new tracks
- Calendar export (iCal)
- Budget tracking per event
- Photo gallery / memories section post-event
