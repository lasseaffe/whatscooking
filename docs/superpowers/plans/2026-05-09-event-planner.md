# Event Planner — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the stateless AI event generator into a persistent, collaborative event planning platform with editable menus/timelines, shared shopping lists, location voting, and Spotify playlist integration.

**Architecture:** Extend the existing `dinner_parties` Supabase table with five new child tables. Build Next.js App Router API routes under `/api/events/[id]/` following the same pattern as `/api/dinner-parties/[id]/`. The event hub page at `/events/[id]` is a client component with tabs; each tab section is its own component.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS + Storage), TypeScript, Spotify Web API (OAuth 2.0 authorization code flow), Node.js `crypto` module for AES-256-GCM token encryption.

---

## File Map

**New files to create:**
```
supabase/migrations/20260509_event_planner.sql
src/lib/crypto.ts
src/lib/spotify.ts
src/lib/event-types.ts
src/app/(app)/events/page.tsx
src/app/(app)/events/[id]/page.tsx
src/app/(app)/events/[id]/event-hub.tsx
src/app/(app)/events/[id]/tabs/overview-tab.tsx
src/app/(app)/events/[id]/tabs/guests-tab.tsx
src/app/(app)/events/[id]/tabs/shopping-tab.tsx
src/app/(app)/events/[id]/tabs/location-tab.tsx
src/app/(app)/events/[id]/tabs/playlist-tab.tsx
src/app/(app)/events/[id]/components/avatar-editor.tsx
src/app/(app)/events/[id]/components/menu-item-editor.tsx
src/app/(app)/events/[id]/components/recipe-picker.tsx
src/app/(app)/events/[id]/components/timeline-editor.tsx
src/app/api/events/create/route.ts
src/app/api/events/[id]/route.ts
src/app/api/events/[id]/menu/route.ts
src/app/api/events/[id]/menu/[itemId]/route.ts
src/app/api/events/[id]/timeline/route.ts
src/app/api/events/[id]/timeline/[itemId]/route.ts
src/app/api/events/[id]/guests/route.ts
src/app/api/events/[id]/guests/[guestId]/route.ts
src/app/api/events/[id]/shopping/route.ts
src/app/api/events/[id]/shopping/[itemId]/route.ts
src/app/api/events/[id]/locations/route.ts
src/app/api/events/[id]/locations/[optionId]/route.ts
src/app/api/events/[id]/locations/[optionId]/vote/route.ts
src/app/api/events/[id]/tracks/route.ts
src/app/api/events/spotify/connect/route.ts
src/app/api/events/spotify/callback/route.ts
```

**Files to modify:**
```
src/app/(app)/events/events-client.tsx   — add Save button, wire to /api/events/create
src/app/api/events/plan/route.ts         — no change needed
```

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260509_event_planner.sql`

- [ ] Create the migration file:

```sql
-- supabase/migrations/20260509_event_planner.sql

-- Extend dinner_parties
alter table dinner_parties
  add column if not exists avatar_url               text,
  add column if not exists avatar_emoji             text,
  add column if not exists spotify_playlist_id      text,
  add column if not exists spotify_access_token     text,
  add column if not exists spotify_refresh_token    text,
  add column if not exists spotify_token_expires_at timestamptz;

-- Editable menu items
create table if not exists event_menu_items (
  id          uuid        default gen_random_uuid() primary key,
  party_id    uuid        references dinner_parties(id) on delete cascade not null,
  name        text        not null,
  description text,
  course      text        not null default 'main',
  recipe_id   uuid        references recipes(id) on delete set null,
  sort_order  int         default 0,
  created_at  timestamptz default now()
);

-- Editable timeline entries
create table if not exists event_timeline_items (
  id         uuid        default gen_random_uuid() primary key,
  party_id   uuid        references dinner_parties(id) on delete cascade not null,
  time_label text        not null,
  activity   text        not null,
  sort_order int         default 0
);

-- Shared shopping list
create table if not exists event_shopping_items (
  id          uuid        default gen_random_uuid() primary key,
  party_id    uuid        references dinner_parties(id) on delete cascade not null,
  name        text        not null,
  quantity    text,
  assigned_to uuid        references auth.users on delete set null,
  checked     boolean     default false,
  checked_by  uuid        references auth.users on delete set null,
  checked_at  timestamptz,
  created_by  uuid        references auth.users not null,
  created_at  timestamptz default now()
);

-- Location vote candidates
create table if not exists event_location_options (
  id         uuid        default gen_random_uuid() primary key,
  party_id   uuid        references dinner_parties(id) on delete cascade not null,
  name       text        not null,
  address    text,
  notes      text,
  is_winner  boolean     default false,
  created_at timestamptz default now()
);

-- One vote per user per option
create table if not exists event_location_votes (
  id         uuid        default gen_random_uuid() primary key,
  option_id  uuid        references event_location_options(id) on delete cascade not null,
  user_id    uuid        references auth.users not null,
  created_at timestamptz default now(),
  unique (option_id, user_id)
);

-- Spotify tracks
create table if not exists event_playlist_tracks (
  id               uuid        default gen_random_uuid() primary key,
  party_id         uuid        references dinner_parties(id) on delete cascade not null,
  submitted_by     uuid        references auth.users not null,
  spotify_uri      text        not null,
  track_name       text,
  artist_name      text,
  album_art_url    text,
  added_to_spotify boolean     default false,
  created_at       timestamptz default now(),
  unique (party_id, spotify_uri)
);

-- RLS
alter table event_menu_items       enable row level security;
alter table event_timeline_items   enable row level security;
alter table event_shopping_items   enable row level security;
alter table event_location_options enable row level security;
alter table event_location_votes   enable row level security;
alter table event_playlist_tracks  enable row level security;

-- Helper: is user a member of this party (host or accepted guest)?
create or replace function is_event_member(p_party_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from dinner_parties where id = p_party_id and host_id = auth.uid()
    union
    select 1 from dinner_party_guests
    where party_id = p_party_id and user_id = auth.uid() and rsvp = 'accepted'
  );
$$;

create or replace function is_event_host(p_party_id uuid)
returns boolean language sql security definer as $$
  select exists (select 1 from dinner_parties where id = p_party_id and host_id = auth.uid());
$$;

-- Menu items
create policy "host manages menu" on event_menu_items
  for all using (is_event_host(party_id));
create policy "members read menu" on event_menu_items
  for select using (is_event_member(party_id));

-- Timeline
create policy "host manages timeline" on event_timeline_items
  for all using (is_event_host(party_id));
create policy "members read timeline" on event_timeline_items
  for select using (is_event_member(party_id));

-- Shopping
create policy "host manages shopping" on event_shopping_items
  for all using (is_event_host(party_id));
create policy "members read shopping" on event_shopping_items
  for select using (is_event_member(party_id));
create policy "members update shopping" on event_shopping_items
  for update using (is_event_member(party_id));
create policy "members insert shopping" on event_shopping_items
  for insert with check (is_event_member(party_id));

-- Location options
create policy "host manages locations" on event_location_options
  for all using (is_event_host(party_id));
create policy "members read locations" on event_location_options
  for select using (is_event_member(party_id));

-- Votes
create policy "members vote" on event_location_votes
  for all using (user_id = auth.uid() and is_event_member(
    (select party_id from event_location_options where id = option_id)
  ));
create policy "members read votes" on event_location_votes
  for select using (is_event_member(
    (select party_id from event_location_options where id = option_id)
  ));

-- Tracks
create policy "host manages tracks" on event_playlist_tracks
  for all using (is_event_host(party_id));
create policy "members submit tracks" on event_playlist_tracks
  for insert with check (is_event_member(party_id));
create policy "members read tracks" on event_playlist_tracks
  for select using (is_event_member(party_id));

-- Indexes
create index if not exists idx_emi_party  on event_menu_items(party_id, sort_order);
create index if not exists idx_eti_party  on event_timeline_items(party_id, sort_order);
create index if not exists idx_esi_party  on event_shopping_items(party_id, created_at);
create index if not exists idx_elo_party  on event_location_options(party_id);
create index if not exists idx_elv_option on event_location_votes(option_id);
create index if not exists idx_ept_party  on event_playlist_tracks(party_id, created_at);
```

- [ ] Apply migration in Supabase dashboard SQL editor (or via `supabase db push` if CLI configured)

- [ ] Verify in Supabase table editor that all 6 new tables exist with correct columns

- [ ] Commit:
```bash
git add supabase/migrations/20260509_event_planner.sql
git commit -m "feat: add event planner DB migration (menu, timeline, shopping, locations, votes, tracks)"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/lib/event-types.ts`

- [ ] Create the types file:

```typescript
// src/lib/event-types.ts

export type EventMenuItem = {
  id: string;
  party_id: string;
  name: string;
  description: string | null;
  course: 'appetizer' | 'main' | 'dessert' | 'drink' | 'side';
  recipe_id: string | null;
  sort_order: number;
  created_at: string;
};

export type EventTimelineItem = {
  id: string;
  party_id: string;
  time_label: string;
  activity: string;
  sort_order: number;
};

export type EventShoppingItem = {
  id: string;
  party_id: string;
  name: string;
  quantity: string | null;
  assigned_to: string | null;
  checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  created_by: string;
  created_at: string;
};

export type EventLocationOption = {
  id: string;
  party_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  is_winner: boolean;
  vote_count?: number;
  user_voted?: boolean;
};

export type EventPlaylistTrack = {
  id: string;
  party_id: string;
  submitted_by: string;
  spotify_uri: string;
  track_name: string | null;
  artist_name: string | null;
  album_art_url: string | null;
  added_to_spotify: boolean;
  created_at: string;
  submitter_name?: string;
};

export type DinnerPartyGuest = {
  id: string;
  party_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  rsvp: 'invited' | 'accepted' | 'declined' | 'maybe';
  invited_at: string;
  responded_at: string | null;
};

export type EventDetail = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  location: string | null;
  theme: string | null;
  max_guests: number | null;
  status: string;
  cover_color: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  spotify_playlist_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FullEventData = {
  party: EventDetail;
  guests: DinnerPartyGuest[];
  menuItems: EventMenuItem[];
  timelineItems: EventTimelineItem[];
  shoppingItems: EventShoppingItem[];
  locationOptions: EventLocationOption[];
  tracks: EventPlaylistTrack[];
  userRole: 'host' | 'accepted' | 'invited' | 'maybe';
};
```

- [ ] Commit:
```bash
git add src/lib/event-types.ts
git commit -m "feat: add event planner shared TypeScript types"
```

---

## Task 3: Crypto Utility

**Files:**
- Create: `src/lib/crypto.ts`

- [ ] Add `SPOTIFY_ENCRYPTION_KEY` to `.env.local` (32 random hex bytes):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output → add to .env.local:
# SPOTIFY_ENCRYPTION_KEY=<output>
```

- [ ] Create the crypto utility:

```typescript
// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY = Buffer.from(process.env.SPOTIFY_ENCRYPTION_KEY!, 'hex');
const ALG = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, encHex] = payload.split(':');
  const decipher = createDecipheriv(ALG, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}
```

- [ ] Commit:
```bash
git add src/lib/crypto.ts
git commit -m "feat: add AES-256-GCM crypto utility for Spotify token encryption"
```

---

## Task 4: Spotify Utility

**Files:**
- Create: `src/lib/spotify.ts`

- [ ] Add Spotify env vars to `.env.local`:
```
SPOTIFY_CLIENT_ID=<from Spotify developer dashboard>
SPOTIFY_CLIENT_SECRET=<from Spotify developer dashboard>
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/events/spotify/callback
```

- [ ] Create the Spotify utility:

```typescript
// src/lib/spotify.ts
import { encrypt, decrypt } from './crypto';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'playlist-modify-public playlist-modify-private',
    state,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
  });
  if (!res.ok) throw new Error('Spotify token exchange failed');
  return res.json();
}

export async function refreshToken(encryptedRefresh: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const refresh_token = decrypt(encryptedRefresh);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
  });
  if (!res.ok) throw new Error('Spotify token refresh failed');
  return res.json();
}

export async function createPlaylist(accessToken: string, userId: string, name: string): Promise<string> {
  const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, public: false, collaborative: true, description: 'Created by What\'s Cooking' }),
  });
  if (!res.ok) throw new Error('Failed to create Spotify playlist');
  const data = await res.json();
  return data.id;
}

export async function addTrackToPlaylist(accessToken: string, playlistId: string, uri: string): Promise<void> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri] }),
  });
  if (!res.ok) throw new Error('Failed to add track to playlist');
}

export async function getTrackMetadata(accessToken: string, uri: string): Promise<{
  name: string; artist: string; albumArt: string; uri: string;
}> {
  const trackId = uri.replace('spotify:track:', '').split('/').pop()!;
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch track metadata');
  const data = await res.json();
  return {
    name: data.name,
    artist: data.artists[0]?.name ?? '',
    albumArt: data.album?.images?.[0]?.url ?? '',
    uri: data.uri,
  };
}

export function encryptTokens(accessToken: string, refreshToken: string) {
  return { encryptedAccess: encrypt(accessToken), encryptedRefresh: encrypt(refreshToken) };
}

export function getValidAccessToken(party: {
  spotify_access_token: string | null;
  spotify_token_expires_at: string | null;
}): string | null {
  if (!party.spotify_access_token) return null;
  return decrypt(party.spotify_access_token);
}
```

- [ ] Commit:
```bash
git add src/lib/spotify.ts
git commit -m "feat: add Spotify API utility (OAuth, playlist, track metadata)"
```

---

## Task 5: Event Create API

**Files:**
- Create: `src/app/api/events/create/route.ts`

- [ ] Create the route:

```typescript
// src/app/api/events/create/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { occasion, guests, plan, avatarEmoji } = await req.json();
  // plan is the EventPlan shape from the AI generator

  const { data: party, error: partyError } = await supabase
    .from('dinner_parties')
    .insert({
      host_id: user.id,
      title: plan.theme,
      description: null,
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      theme: occasion,
      avatar_emoji: avatarEmoji ?? '🍽️',
      status: 'planning',
    })
    .select()
    .single();

  if (partyError) return NextResponse.json({ error: partyError.message }, { status: 500 });

  const partyId = party.id;

  // Seed menu items
  const menuRows = plan.recipes.map((r: { name: string; description: string; course: string }, i: number) => ({
    party_id: partyId,
    name: r.name,
    description: r.description,
    course: r.course,
    sort_order: i,
  }));

  // Seed timeline items
  const timelineRows = plan.timeline.map((t: { time: string; activity: string }, i: number) => ({
    party_id: partyId,
    time_label: t.time,
    activity: t.activity,
    sort_order: i,
  }));

  // Seed shopping items from highlights
  const shoppingRows = plan.shopping_highlights.map((item: string) => ({
    party_id: partyId,
    name: item,
    created_by: user.id,
  }));

  await Promise.all([
    supabase.from('event_menu_items').insert(menuRows),
    supabase.from('event_timeline_items').insert(timelineRows),
    supabase.from('event_shopping_items').insert(shoppingRows),
  ]);

  return NextResponse.json({ id: partyId });
}
```

- [ ] Commit:
```bash
git add src/app/api/events/create/route.ts
git commit -m "feat: add POST /api/events/create — saves AI plan to DB"
```

---

## Task 6: Event Detail API

**Files:**
- Create: `src/app/api/events/[id]/route.ts`

- [ ] Create the route:

```typescript
// src/app/api/events/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('id,host_id,title,description,scheduled_at,location,theme,status,cover_color,avatar_url,avatar_emoji,spotify_playlist_id,created_at,updated_at')
    .eq('id', id)
    .single();

  if (!party) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [
    { data: guests },
    { data: menuItems },
    { data: timelineItems },
    { data: shoppingItems },
    { data: locationOptions },
    { data: tracks },
  ] = await Promise.all([
    supabase.from('dinner_party_guests').select('*').eq('party_id', id).order('invited_at'),
    supabase.from('event_menu_items').select('*').eq('party_id', id).order('sort_order'),
    supabase.from('event_timeline_items').select('*').eq('party_id', id).order('sort_order'),
    supabase.from('event_shopping_items').select('*').eq('party_id', id).order('created_at'),
    supabase.from('event_location_options').select('*').eq('party_id', id),
    supabase.from('event_playlist_tracks').select('*').eq('party_id', id).order('created_at'),
  ]);

  // Attach vote counts
  const optionIds = (locationOptions ?? []).map((o: { id: string }) => o.id);
  let votes: { option_id: string; user_id: string }[] = [];
  if (optionIds.length > 0) {
    const { data: voteData } = await supabase
      .from('event_location_votes')
      .select('option_id,user_id')
      .in('option_id', optionIds);
    votes = voteData ?? [];
  }

  const enrichedOptions = (locationOptions ?? []).map((opt: { id: string }) => ({
    ...opt,
    vote_count: votes.filter(v => v.option_id === opt.id).length,
    user_voted: votes.some(v => v.option_id === opt.id && v.user_id === user.id),
  }));

  const guestRecord = (guests ?? []).find((g: { user_id: string | null }) => g.user_id === user.id);
  const userRole = party.host_id === user.id
    ? 'host'
    : guestRecord?.rsvp === 'accepted' ? 'accepted'
    : guestRecord?.rsvp === 'maybe' ? 'maybe'
    : 'invited';

  return NextResponse.json({
    party,
    guests: guests ?? [],
    menuItems: menuItems ?? [],
    timelineItems: timelineItems ?? [],
    shoppingItems: shoppingItems ?? [],
    locationOptions: enrichedOptions,
    tracks: tracks ?? [],
    userRole,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['title', 'scheduled_at', 'avatar_url', 'avatar_emoji', 'description', 'location'];
  const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from('dinner_parties')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Commit:
```bash
git add src/app/api/events/[id]/route.ts
git commit -m "feat: add GET+PATCH /api/events/[id] — full event detail fetch"
```

---

## Task 7: Menu + Timeline APIs

**Files:**
- Create: `src/app/api/events/[id]/menu/route.ts`
- Create: `src/app/api/events/[id]/menu/[itemId]/route.ts`
- Create: `src/app/api/events/[id]/timeline/route.ts`
- Create: `src/app/api/events/[id]/timeline/[itemId]/route.ts`

- [ ] Create menu collection route:

```typescript
// src/app/api/events/[id]/menu/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('event_menu_items')
    .insert({ party_id: id, name: body.name, description: body.description ?? null, course: body.course ?? 'main', recipe_id: body.recipe_id ?? null, sort_order: body.sort_order ?? 0 })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create menu item route:

```typescript
// src/app/api/events/[id]/menu/[itemId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('event_menu_items')
    .update({ name: body.name, description: body.description, course: body.course, recipe_id: body.recipe_id, sort_order: body.sort_order })
    .eq('id', itemId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_menu_items').delete().eq('id', itemId);
  return NextResponse.json({ ok: true });
}
```

- [ ] Create timeline collection route:

```typescript
// src/app/api/events/[id]/timeline/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('event_timeline_items')
    .insert({ party_id: id, time_label: body.time_label, activity: body.activity, sort_order: body.sort_order ?? 0 })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create timeline item route:

```typescript
// src/app/api/events/[id]/timeline/[itemId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('event_timeline_items')
    .update({ time_label: body.time_label, activity: body.activity, sort_order: body.sort_order })
    .eq('id', itemId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_timeline_items').delete().eq('id', itemId);
  return NextResponse.json({ ok: true });
}
```

- [ ] Commit:
```bash
git add src/app/api/events/[id]/menu/ src/app/api/events/[id]/timeline/
git commit -m "feat: add menu and timeline CRUD API routes"
```

---

## Task 8: Guests API

**Files:**
- Create: `src/app/api/events/[id]/guests/route.ts`
- Create: `src/app/api/events/[id]/guests/[guestId]/route.ts`

- [ ] Create guests collection route:

```typescript
// src/app/api/events/[id]/guests/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify requester is host
  const { data: party } = await supabase.from('dinner_parties').select('host_id').eq('id', id).single();
  if (!party || party.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, email, displayName } = await req.json();

  const { data, error } = await supabase
    .from('dinner_party_guests')
    .insert({ party_id: id, user_id: userId ?? null, email: email ?? null, display_name: displayName ?? null, rsvp: 'invited' })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create guest item route:

```typescript
// src/app/api/events/[id]/guests/[guestId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; guestId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { guestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rsvp } = await req.json();
  const { data, error } = await supabase
    .from('dinner_party_guests')
    .update({ rsvp, responded_at: new Date().toISOString() })
    .eq('id', guestId)
    .eq('user_id', user.id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, guestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: party } = await supabase.from('dinner_parties').select('host_id').eq('id', id).single();
  if (!party || party.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await supabase.from('dinner_party_guests').delete().eq('id', guestId);
  return NextResponse.json({ ok: true });
}
```

- [ ] Commit:
```bash
git add src/app/api/events/[id]/guests/
git commit -m "feat: add guests invite/RSVP/remove API routes"
```

---

## Task 9: Shopping API

**Files:**
- Create: `src/app/api/events/[id]/shopping/route.ts`
- Create: `src/app/api/events/[id]/shopping/[itemId]/route.ts`

- [ ] Create shopping collection route:

```typescript
// src/app/api/events/[id]/shopping/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, quantity } = await req.json();
  const { data, error } = await supabase
    .from('event_shopping_items')
    .insert({ party_id: id, name, quantity: quantity ?? null, created_by: user.id })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create shopping item route:

```typescript
// src/app/api/events/[id]/shopping/[itemId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ('checked' in body) {
    patch.checked = body.checked;
    patch.checked_by = body.checked ? user.id : null;
    patch.checked_at = body.checked ? new Date().toISOString() : null;
  }
  if ('assigned_to' in body) patch.assigned_to = body.assigned_to;
  if ('name' in body) patch.name = body.name;
  if ('quantity' in body) patch.quantity = body.quantity;

  const { data, error } = await supabase
    .from('event_shopping_items')
    .update(patch)
    .eq('id', itemId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_shopping_items').delete().eq('id', itemId);
  return NextResponse.json({ ok: true });
}
```

- [ ] Commit:
```bash
git add src/app/api/events/[id]/shopping/
git commit -m "feat: add shopping list CRUD API routes"
```

---

## Task 10: Location + Voting API

**Files:**
- Create: `src/app/api/events/[id]/locations/route.ts`
- Create: `src/app/api/events/[id]/locations/[optionId]/route.ts`
- Create: `src/app/api/events/[id]/locations/[optionId]/vote/route.ts`

- [ ] Create locations collection route:

```typescript
// src/app/api/events/[id]/locations/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, address, notes } = await req.json();
  const { data, error } = await supabase
    .from('event_location_options')
    .insert({ party_id: id, name, address: address ?? null, notes: notes ?? null })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create location option + winner route:

```typescript
// src/app/api/events/[id]/locations/[optionId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; optionId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id, optionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { is_winner } = await req.json();

  if (is_winner) {
    // Clear any existing winner first
    await supabase.from('event_location_options').update({ is_winner: false }).eq('party_id', id);
    // Get location name to update dinner_parties.location
    const { data: opt } = await supabase.from('event_location_options').select('name,address').eq('id', optionId).single();
    if (opt) {
      await supabase.from('dinner_parties').update({ location: opt.address ?? opt.name }).eq('id', id);
    }
  }

  const { data, error } = await supabase
    .from('event_location_options')
    .update({ is_winner })
    .eq('id', optionId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { optionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_location_options').delete().eq('id', optionId);
  return NextResponse.json({ ok: true });
}
```

- [ ] Create vote route:

```typescript
// src/app/api/events/[id]/locations/[optionId]/vote/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ optionId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { optionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('event_location_votes')
    .upsert({ option_id: optionId, user_id: user.id }, { onConflict: 'option_id,user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { optionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_location_votes').delete().eq('option_id', optionId).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] Commit:
```bash
git add src/app/api/events/[id]/locations/
git commit -m "feat: add location options + voting API routes"
```

---

## Task 11: Spotify OAuth + Tracks API

**Files:**
- Create: `src/app/api/events/spotify/connect/route.ts`
- Create: `src/app/api/events/spotify/callback/route.ts`
- Create: `src/app/api/events/[id]/tracks/route.ts`

- [ ] Create Spotify connect route:

```typescript
// src/app/api/events/spotify/connect/route.ts
import { getAuthUrl } from '@/lib/spotify';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId') ?? '';
  // state encodes eventId so callback knows which event to update
  const state = Buffer.from(JSON.stringify({ eventId })).toString('base64');
  return NextResponse.redirect(getAuthUrl(state));
}
```

- [ ] Create Spotify callback route:

```typescript
// src/app/api/events/spotify/callback/route.ts
import { exchangeCode, createPlaylist, encryptTokens } from '@/lib/spotify';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return NextResponse.redirect('/events?error=spotify_denied');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect('/login');

  const { eventId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));

  const tokens = await exchangeCode(code);
  const { encryptedAccess, encryptedRefresh } = encryptTokens(tokens.access_token, tokens.refresh_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Get event title for playlist name
  const { data: party } = await supabase.from('dinner_parties').select('title').eq('id', eventId).single();
  const playlistName = `${party?.title ?? 'Event'} — What's Cooking`;

  // Get Spotify user ID
  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = await meRes.json();
  const playlistId = await createPlaylist(tokens.access_token, me.id, playlistName);

  await supabase.from('dinner_parties').update({
    spotify_access_token: encryptedAccess,
    spotify_refresh_token: encryptedRefresh,
    spotify_token_expires_at: expiresAt,
    spotify_playlist_id: playlistId,
  }).eq('id', eventId).eq('host_id', user.id);

  return NextResponse.redirect(`/events/${eventId}?tab=playlist`);
}
```

- [ ] Create tracks route:

```typescript
// src/app/api/events/[id]/tracks/route.ts
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken, getTrackMetadata, addTrackToPlaylist, refreshToken, encryptTokens } from '@/lib/spotify';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function spotifyUrlToUri(input: string): string {
  // Handle https://open.spotify.com/track/ID or spotify:track:ID
  const match = input.match(/track[/:]([A-Za-z0-9]+)/);
  if (!match) throw new Error('Not a valid Spotify track URL or URI');
  return `spotify:track:${match[1]}`;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { trackInput } = await req.json();

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('spotify_access_token,spotify_refresh_token,spotify_token_expires_at,spotify_playlist_id,host_id')
    .eq('id', id).single();

  if (!party?.spotify_playlist_id) return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });

  // Refresh token if expiring within 5 minutes
  let accessToken = getValidAccessToken(party);
  if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 400 });

  const expiresAt = new Date(party.spotify_token_expires_at).getTime();
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const refreshed = await refreshToken(party.spotify_refresh_token!);
    const { encryptedAccess } = encryptTokens(refreshed.access_token, '');
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase.from('dinner_parties').update({
      spotify_access_token: encryptedAccess,
      spotify_token_expires_at: newExpiry,
    }).eq('id', id);
    accessToken = refreshed.access_token;
  }

  const uri = spotifyUrlToUri(trackInput);
  const meta = await getTrackMetadata(accessToken, uri);
  await addTrackToPlaylist(accessToken, party.spotify_playlist_id, uri);

  const { data: track, error } = await supabase
    .from('event_playlist_tracks')
    .insert({
      party_id: id,
      submitted_by: user.id,
      spotify_uri: uri,
      track_name: meta.name,
      artist_name: meta.artist,
      album_art_url: meta.albumArt,
      added_to_spotify: true,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(track);
}
```

- [ ] Commit:
```bash
git add src/app/api/events/spotify/ src/app/api/events/[id]/tracks/
git commit -m "feat: add Spotify OAuth callback and track submission API"
```

---

## Task 12: Events List Page

**Files:**
- Create: `src/app/(app)/events/page.tsx`

- [ ] Create the events list page:

```typescript
// src/app/(app)/events/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Plus, ChevronRight } from 'lucide-react';

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: hosting } = await supabase
    .from('dinner_parties')
    .select('id,title,scheduled_at,avatar_emoji,avatar_url,status')
    .eq('host_id', user.id)
    .order('scheduled_at');

  const { data: guestRows } = await supabase
    .from('dinner_party_guests')
    .select('party_id,rsvp,dinner_parties(id,title,scheduled_at,avatar_emoji,avatar_url,status)')
    .eq('user_id', user.id);

  const attending = (guestRows ?? []).map((g: {
    rsvp: string;
    dinner_parties: { id: string; title: string; scheduled_at: string; avatar_emoji: string | null; avatar_url: string | null; status: string } | null;
  }) => ({
    ...g.dinner_parties,
    rsvp: g.rsvp,
  })).filter(Boolean);

  const allEvents = [
    ...(hosting ?? []).map(e => ({ ...e, role: 'Hosting' as const })),
    ...attending.map(e => ({ ...e, role: 'Attending' as const })),
  ].sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0907', color: '#EFE3CE' }}>
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(13,9,7,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 className="text-sm font-semibold tracking-widest uppercase" style={{ letterSpacing: '0.14em' }}>My Events</h1>
        <Link href="/events/new"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-semibold"
          style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
          <Plus className="w-4 h-4" /> New
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Calendar className="w-10 h-10 opacity-20" />
            <p className="opacity-50 text-sm">No events yet — plan your first one</p>
            <Link href="/events/new"
              className="px-6 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
              Plan an event
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(200,82,42,0.15)' }}>
                  {event.avatar_url
                    ? <img src={event.avatar_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    : (event.avatar_emoji ?? '🍽️')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: '#EFE3CE' }}>{event.title}</p>
                  <p className="text-xs opacity-50">{new Date(event.scheduled_at!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: event.role === 'Hosting' ? 'rgba(200,82,42,0.2)' : 'rgba(255,255,255,0.08)', color: event.role === 'Hosting' ? '#C8522A' : '#EFE3CE' }}>
                    {event.role}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/page.tsx
git commit -m "feat: add /events list page with hosting/attending split"
```

---

## Task 13: Wire Save Button in Events Client

**Files:**
- Modify: `src/app/(app)/events/events-client.tsx`

- [ ] In `events-client.tsx`, after the plan is displayed add a "Save & Edit Event" button. Find the `Regenerate plan` button block at the bottom of the plan view and add above it:

```typescript
// Add to state at top of EventsClient:
const [saving, setSaving] = useState(false);
const [savedId, setSavedId] = useState<string | null>(null);

// Add this function before return:
async function handleSave() {
  if (!plan || !occasion) return;
  setSaving(true);
  try {
    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occasion,
        guests,
        plan,
        avatarEmoji: selectedOccasion?.emoji ?? '🍽️',
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    window.location.href = `/events/${json.id}`;
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Failed to save');
  }
  setSaving(false);
}
```

- [ ] Add the Save button in the JSX, directly above the `Regenerate plan` button:

```tsx
<button
  onClick={handleSave}
  disabled={saving}
  className="w-full py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-3 mb-3"
  style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)' }}
>
  {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Calendar className="w-5 h-5" /> Save &amp; Edit Event</>}
</button>
```

- [ ] Commit:
```bash
git add src/app/(app)/events/events-client.tsx
git commit -m "feat: add Save & Edit Event button to events client"
```

---

## Task 14: Event Hub Page + Tab Shell

**Files:**
- Create: `src/app/(app)/events/[id]/page.tsx`
- Create: `src/app/(app)/events/[id]/event-hub.tsx`

- [ ] Create the server page:

```typescript
// src/app/(app)/events/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventHub } from './event-hub';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${id}`, {
    headers: { Cookie: (await import('next/headers')).cookies().toString() },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/events');
  const data = await res.json();

  return <EventHub initialData={data} eventId={id} userId={user.id} />;
}
```

- [ ] Create the hub client component:

```typescript
// src/app/(app)/events/[id]/event-hub.tsx
'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { FullEventData } from '@/lib/event-types';
import { OverviewTab } from './tabs/overview-tab';
import { GuestsTab } from './tabs/guests-tab';
import { ShoppingTab } from './tabs/shopping-tab';
import { LocationTab } from './tabs/location-tab';
import { PlaylistTab } from './tabs/playlist-tab';

const TABS = ['Overview', 'Guests', 'Shopping', 'Location', 'Playlist'] as const;
type Tab = typeof TABS[number];

export function EventHub({ initialData, eventId, userId }: {
  initialData: FullEventData;
  eventId: string;
  userId: string;
}) {
  const [data, setData] = useState<FullEventData>(initialData);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  async function reload() {
    const res = await fetch(`/api/events/${eventId}`);
    if (res.ok) setData(await res.json());
  }

  const isHost = data.userRole === 'host';
  const canInteract = data.userRole === 'host' || data.userRole === 'accepted';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0907', color: '#EFE3CE' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(13,9,7,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/events" className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100">
          <ChevronLeft className="w-4 h-4" /> Events
        </Link>
        <div className="flex-1 text-center text-sm font-semibold tracking-widest uppercase truncate px-2">
          {data.party.title}
        </div>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? 'rgba(200,82,42,0.2)' : 'transparent',
              color: activeTab === tab ? '#C8522A' : 'rgba(239,227,206,0.5)',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {activeTab === 'Overview'  && <OverviewTab  data={data} isHost={isHost} eventId={eventId} onReload={reload} />}
        {activeTab === 'Guests'    && <GuestsTab    data={data} isHost={isHost} eventId={eventId} userId={userId} onReload={reload} />}
        {activeTab === 'Shopping'  && <ShoppingTab  data={data} canInteract={canInteract} eventId={eventId} userId={userId} onReload={reload} />}
        {activeTab === 'Location'  && <LocationTab  data={data} isHost={isHost} canInteract={canInteract} eventId={eventId} onReload={reload} />}
        {activeTab === 'Playlist'  && <PlaylistTab  data={data} canInteract={canInteract} eventId={eventId} onReload={reload} />}
      </div>
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/[id]/page.tsx src/app/(app)/events/[id]/event-hub.tsx
git commit -m "feat: add event hub page with tab shell"
```

---

## Task 15: Overview Tab

**Files:**
- Create: `src/app/(app)/events/[id]/tabs/overview-tab.tsx`
- Create: `src/app/(app)/events/[id]/components/avatar-editor.tsx`
- Create: `src/app/(app)/events/[id]/components/menu-item-editor.tsx`
- Create: `src/app/(app)/events/[id]/components/timeline-editor.tsx`

- [ ] Create avatar editor component:

```typescript
// src/app/(app)/events/[id]/components/avatar-editor.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EMOJI_OPTIONS = ['🍽️','🥂','🎂','🥞','🍷','🎬','🎮','🌹','🥗','🍜','🌮','🥘','🍕','🎉','🏡'];

export function AvatarEditor({ eventId, currentEmoji, currentUrl, onSaved }: {
  eventId: string;
  currentEmoji: string | null;
  currentUrl: string | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'emoji' | 'upload'>('emoji');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickEmoji(emoji: string) {
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_emoji: emoji, avatar_url: null }),
    });
    setOpen(false);
    onSaved();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setUploading(true);
    const supabase = createClient();
    const path = `${eventId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('event-avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('event-avatars').getPublicUrl(path);
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: data.publicUrl }),
      });
      onSaved();
      setOpen(false);
    }
    setUploading(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl hover:opacity-80 transition-opacity"
        style={{ background: 'rgba(200,82,42,0.15)' }}>
        {currentUrl ? <img src={currentUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" /> : (currentEmoji ?? '🍽️')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5" style={{ background: '#1A1210' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Event avatar</span>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 opacity-50" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              {(['emoji','upload'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded-xl text-sm capitalize"
                  style={{ background: tab === t ? 'rgba(200,82,42,0.2)' : 'rgba(255,255,255,0.06)', color: tab === t ? '#C8522A' : '#EFE3CE' }}>
                  {t}
                </button>
              ))}
            </div>
            {tab === 'emoji' ? (
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => pickEmoji(e)}
                    className="text-3xl p-2 rounded-xl hover:bg-white/10 transition-colors">{e}</button>
                ))}
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl border border-dashed text-sm flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Choose image (max 5MB)'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] Create menu item editor:

```typescript
// src/app/(app)/events/[id]/components/menu-item-editor.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { EventMenuItem } from '@/lib/event-types';

const COURSES = ['appetizer','main','dessert','drink','side'] as const;

export function MenuItemEditor({ item, eventId, onSaved, onClose }: {
  item: EventMenuItem | null; // null = new item
  eventId: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [course, setCourse] = useState<string>(item?.course ?? 'main');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const url = item
      ? `/api/events/${eventId}/menu/${item.id}`
      : `/api/events/${eventId}/menu`;
    await fetch(url, {
      method: item ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, course }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  async function deleteItem() {
    if (!item) return;
    await fetch(`/api/events/${eventId}/menu/${item.id}`, { method: 'DELETE' });
    onSaved();
    onClose();
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#EFE3CE',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4" style={{ background: '#1A1210' }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{item ? 'Edit item' : 'Add item'}</span>
          <button onClick={onClose}><X className="w-5 h-5 opacity-50" /></button>
        </div>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name"
          className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none" style={inputStyle} />

        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
          rows={2} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none resize-none" style={inputStyle} />

        <div className="flex gap-2 flex-wrap">
          {COURSES.map(c => (
            <button key={c} onClick={() => setCourse(c)}
              className="px-3 py-1 rounded-full text-xs capitalize"
              style={{ background: course === c ? 'rgba(200,82,42,0.3)' : 'rgba(255,255,255,0.06)', color: course === c ? '#C8522A' : '#EFE3CE' }}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {item && (
            <button onClick={deleteItem}
              className="flex-1 py-3 rounded-xl text-sm border"
              style={{ borderColor: 'rgba(255,80,80,0.3)', color: 'rgba(255,100,100,0.8)' }}>
              Delete
            </button>
          )}
          <button onClick={save} disabled={saving || !name.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Create timeline editor:

```typescript
// src/app/(app)/events/[id]/components/timeline-editor.tsx
'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { EventTimelineItem } from '@/lib/event-types';

export function TimelineEditor({ items, eventId, isHost, onReload }: {
  items: EventTimelineItem[];
  eventId: string;
  isHost: boolean;
  onReload: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editActivity, setEditActivity] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newActivity, setNewActivity] = useState('');

  async function saveEdit(id: string) {
    await fetch(`/api/events/${eventId}/timeline/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_label: editLabel, activity: editActivity }),
    });
    setEditingId(null);
    onReload();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/events/${eventId}/timeline/${id}`, { method: 'DELETE' });
    onReload();
  }

  async function addItem() {
    if (!newLabel.trim() || !newActivity.trim()) return;
    await fetch(`/api/events/${eventId}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_label: newLabel, activity: newActivity, sort_order: items.length }),
    });
    setNewLabel(''); setNewActivity(''); setAddingNew(false);
    onReload();
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' };

  return (
    <div className="relative pl-4">
      <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: 'rgba(200,82,42,0.3)' }} />
      {items.map(item => (
        <div key={item.id} className="relative mb-3 pl-5">
          <div className="absolute left-[-3px] top-1.5 w-2 h-2 rounded-full" style={{ background: '#C8522A' }} />
          {editingId === item.id ? (
            <div className="flex flex-col gap-2">
              <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none" style={inputStyle} />
              <input value={editActivity} onChange={e => setEditActivity(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none" style={inputStyle} />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(item.id)}><Check className="w-4 h-4 text-green-400" /></button>
                <button onClick={() => setEditingId(null)}><X className="w-4 h-4 opacity-40" /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold" style={{ color: '#C8522A' }}>{item.time_label}</span>
                <p className="text-sm opacity-70">{item.activity}</p>
              </div>
              {isHost && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditingId(item.id); setEditLabel(item.time_label); setEditActivity(item.activity); }}>
                    <Pencil className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                  </button>
                  <button onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-3.5 h-3.5 opacity-40 hover:opacity-100 text-red-400" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {isHost && (
        addingNew ? (
          <div className="relative pl-5 flex flex-col gap-2 mt-2">
            <div className="absolute left-[-3px] top-1.5 w-2 h-2 rounded-full bg-white/20" />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Time (e.g. 7:00 PM)"
              className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none" style={inputStyle} />
            <input value={newActivity} onChange={e => setNewActivity(e.target.value)} placeholder="Activity"
              className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none" style={inputStyle} />
            <div className="flex gap-2">
              <button onClick={addItem} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(200,82,42,0.3)', color: '#C8522A' }}>Add</button>
              <button onClick={() => setAddingNew(false)} className="text-xs opacity-40">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 text-xs opacity-40 hover:opacity-100 mt-2 pl-5">
            <Plus className="w-3.5 h-3.5" /> Add step
          </button>
        )
      )}
    </div>
  );
}
```

- [ ] Create the overview tab:

```typescript
// src/app/(app)/events/[id]/tabs/overview-tab.tsx
'use client';

import { useState } from 'react';
import { Star, Clock, Pencil, Plus } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';
import { AvatarEditor } from '../components/avatar-editor';
import { MenuItemEditor } from '../components/menu-item-editor';
import { TimelineEditor } from '../components/timeline-editor';

const COURSE_COLORS: Record<string, { bg: string; color: string }> = {
  appetizer: { bg: '#FEF3C7', color: '#92400E' },
  main:       { bg: '#DCFCE7', color: '#166534' },
  dessert:    { bg: '#FCE7F3', color: '#9D174D' },
  drink:      { bg: '#DBEAFE', color: '#1E40AF' },
  side:       { bg: '#F3E8FF', color: '#6B21A8' },
};

export function OverviewTab({ data, isHost, eventId, onReload }: {
  data: FullEventData;
  isHost: boolean;
  eventId: string;
  onReload: () => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.party.title);
  const [menuEditor, setMenuEditor] = useState<{ open: boolean; item: import('@/lib/event-types').EventMenuItem | null }>({ open: false, item: null });

  async function saveTitle() {
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setEditingTitle(false);
    onReload();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <AvatarEditor eventId={eventId} currentEmoji={data.party.avatar_emoji} currentUrl={data.party.avatar_url} onSaved={onReload} />
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
              autoFocus
              className="text-2xl font-bold text-center bg-transparent border-b focus:outline-none"
              style={{ fontStyle: 'italic', fontFamily: "'Libre Baskerville', Georgia, serif", borderColor: '#C8522A', color: '#EFE3CE' }} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold" style={{ fontStyle: 'italic', fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              {data.party.title}
            </h2>
            {isHost && <button onClick={() => setEditingTitle(true)}><Pencil className="w-4 h-4 opacity-40 hover:opacity-100" /></button>}
          </div>
        )}
        <p className="text-sm opacity-50">{data.party.theme} · {new Date(data.party.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Menu */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
            <Star className="w-3.5 h-3.5" /> Menu
          </h3>
          {isHost && (
            <button onClick={() => setMenuEditor({ open: true, item: null })}
              className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {data.menuItems.map(item => {
            const c = COURSE_COLORS[item.course] ?? { bg: '#F5EDE4', color: '#3D2817' };
            return (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0" style={{ background: c.bg, color: c.color }}>
                  {item.course}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: '#EFE3CE' }}>{item.name}</p>
                  {item.description && <p className="text-xs opacity-50">{item.description}</p>}
                </div>
                {isHost && (
                  <button onClick={() => setMenuEditor({ open: true, item })}><Pencil className="w-3.5 h-3.5 opacity-30 hover:opacity-100" /></button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Timeline
        </h3>
        <TimelineEditor items={data.timelineItems} eventId={eventId} isHost={isHost} onReload={onReload} />
      </div>

      {menuEditor.open && (
        <MenuItemEditor item={menuEditor.item} eventId={eventId}
          onSaved={onReload} onClose={() => setMenuEditor({ open: false, item: null })} />
      )}
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/[id]/tabs/overview-tab.tsx src/app/(app)/events/[id]/components/
git commit -m "feat: add overview tab with inline title editing, menu editor, timeline editor"
```

---

## Task 16: Guests Tab

**Files:**
- Create: `src/app/(app)/events/[id]/tabs/guests-tab.tsx`

- [ ] Create the guests tab:

```typescript
// src/app/(app)/events/[id]/tabs/guests-tab.tsx
'use client';

import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

const RSVP_COLORS: Record<string, string> = {
  accepted: '#22c55e',
  declined:  '#ef4444',
  maybe:     '#f59e0b',
  invited:   'rgba(239,227,206,0.4)',
};

export function GuestsTab({ data, isHost, eventId, userId, onReload }: {
  data: FullEventData;
  isHost: boolean;
  eventId: string;
  userId: string;
  onReload: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), displayName: inviteEmail.split('@')[0] }),
    });
    setInviteEmail('');
    setInviting(false);
    onReload();
  }

  async function rsvp(guestId: string, rsvp: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvp }),
    });
    onReload();
  }

  async function removeGuest(guestId: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, { method: 'DELETE' });
    onReload();
  }

  const myGuestRow = data.guests.find(g => g.user_id === userId);

  return (
    <div className="flex flex-col gap-4">
      {/* My RSVP (if guest) */}
      {!isHost && myGuestRow && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(200,82,42,0.08)', border: '1px solid rgba(200,82,42,0.2)' }}>
          <p className="text-xs opacity-50 mb-2 uppercase tracking-widest">Your RSVP</p>
          <div className="flex gap-2">
            {(['accepted','maybe','declined'] as const).map(r => (
              <button key={r} onClick={() => rsvp(myGuestRow.id, r)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: myGuestRow.rsvp === r ? 'rgba(200,82,42,0.3)' : 'rgba(255,255,255,0.06)',
                  color: myGuestRow.rsvp === r ? '#C8522A' : '#EFE3CE',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invite (host only) */}
      {isHost && (
        <div className="flex gap-2">
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="Email or username to invite"
            className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
          <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guest list */}
      <div className="flex flex-col gap-2">
        {data.guests.length === 0 && (
          <p className="text-sm opacity-40 text-center py-8">No guests yet</p>
        )}
        {data.guests.map(guest => (
          <div key={guest.id} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
              {(guest.display_name ?? guest.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{guest.display_name ?? guest.email}</p>
              <p className="text-xs opacity-40">{guest.email}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ color: RSVP_COLORS[guest.rsvp] }}>
              {guest.rsvp}
            </span>
            {isHost && (
              <button onClick={() => removeGuest(guest.id)} className="opacity-30 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/[id]/tabs/guests-tab.tsx
git commit -m "feat: add guests tab with invite, RSVP controls, and remove"
```

---

## Task 17: Shopping Tab

**Files:**
- Create: `src/app/(app)/events/[id]/tabs/shopping-tab.tsx`

- [ ] Create the shopping tab:

```typescript
// src/app/(app)/events/[id]/tabs/shopping-tab.tsx
'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { FullEventData, EventShoppingItem } from '@/lib/event-types';

export function ShoppingTab({ data, canInteract, eventId, userId, onReload }: {
  data: FullEventData;
  canInteract: boolean;
  eventId: string;
  userId: string;
  onReload: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [adding, setAdding] = useState(false);

  const acceptedGuests = data.guests.filter(g => g.rsvp === 'accepted');
  const unchecked = data.shoppingItems.filter(i => !i.checked);
  const checked = data.shoppingItems.filter(i => i.checked);

  async function toggleCheck(item: EventShoppingItem) {
    await fetch(`/api/events/${eventId}/shopping/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !item.checked }),
    });
    onReload();
  }

  async function assign(item: EventShoppingItem, assignedTo: string | null) {
    await fetch(`/api/events/${eventId}/shopping/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: assignedTo }),
    });
    onReload();
  }

  async function addItem() {
    if (!newName.trim()) return;
    setAdding(true);
    await fetch(`/api/events/${eventId}/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), quantity: newQty.trim() || null }),
    });
    setNewName(''); setNewQty('');
    setAdding(false);
    onReload();
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' };

  function ItemRow({ item }: { item: EventShoppingItem }) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', opacity: item.checked ? 0.5 : 1 }}>
        <button onClick={() => canInteract && toggleCheck(item)}
          className="w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors"
          style={{ borderColor: item.checked ? '#22c55e' : 'rgba(255,255,255,0.2)', background: item.checked ? '#22c55e' : 'transparent' }}>
          {item.checked && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ textDecoration: item.checked ? 'line-through' : 'none' }}>{item.name}</p>
          {item.quantity && <p className="text-xs opacity-40">{item.quantity}</p>}
        </div>
        {canInteract && (
          <select value={item.assigned_to ?? ''} onChange={e => assign(item, e.target.value || null)}
            className="text-xs px-2 py-1 rounded-lg border focus:outline-none"
            style={{ ...inputStyle, maxWidth: '120px' }}>
            <option value="">Unassigned</option>
            {acceptedGuests.map(g => (
              <option key={g.id} value={g.user_id ?? ''}>{g.display_name ?? g.email}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canInteract && (
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name"
            className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none" style={inputStyle} />
          <input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Qty"
            className="w-20 px-3 py-3 rounded-xl border text-sm focus:outline-none" style={inputStyle} />
          <button onClick={addItem} disabled={adding || !newName.trim()}
            className="px-4 py-3 rounded-xl disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {unchecked.length === 0 && checked.length === 0 && (
        <p className="text-sm opacity-40 text-center py-8">No shopping items yet</p>
      )}

      <div className="flex flex-col gap-2">
        {unchecked.map(item => <ItemRow key={item.id} item={item} />)}
      </div>

      {checked.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-widest opacity-30">Done ({checked.length})</p>
          <div className="flex flex-col gap-2">
            {checked.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/[id]/tabs/shopping-tab.tsx
git commit -m "feat: add shopping tab with check-off and guest assignment"
```

---

## Task 18: Location Tab

**Files:**
- Create: `src/app/(app)/events/[id]/tabs/location-tab.tsx`

- [ ] Create the location tab:

```typescript
// src/app/(app)/events/[id]/tabs/location-tab.tsx
'use client';

import { useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import type { FullEventData, EventLocationOption } from '@/lib/event-types';

export function LocationTab({ data, isHost, canInteract, eventId, onReload }: {
  data: FullEventData;
  isHost: boolean;
  canInteract: boolean;
  eventId: string;
  onReload: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const totalVotes = data.locationOptions.reduce((sum, o) => sum + (o.vote_count ?? 0), 0);
  const winner = data.locationOptions.find(o => o.is_winner);

  async function addOption() {
    if (!newName.trim()) return;
    await fetch(`/api/events/${eventId}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), address: newAddress.trim() || null, notes: newNotes.trim() || null }),
    });
    setNewName(''); setNewAddress(''); setNewNotes(''); setShowForm(false);
    onReload();
  }

  async function vote(option: EventLocationOption) {
    const method = option.user_voted ? 'DELETE' : 'POST';
    await fetch(`/api/events/${eventId}/locations/${option.id}/vote`, { method });
    onReload();
  }

  async function markWinner(optionId: string) {
    await fetch(`/api/events/${eventId}/locations/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_winner: true }),
    });
    onReload();
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' };

  return (
    <div className="flex flex-col gap-4">
      {winner && (
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(200,82,42,0.12)', border: '1px solid rgba(200,82,42,0.3)' }}>
          <Trophy className="w-5 h-5 shrink-0" style={{ color: '#C8522A' }} />
          <div>
            <p className="text-xs opacity-50 uppercase tracking-widest mb-0.5">Chosen location</p>
            <p className="font-semibold">{winner.name}</p>
            {winner.address && <p className="text-xs opacity-50">{winner.address}</p>}
          </div>
        </div>
      )}

      {data.locationOptions.map(option => {
        const pct = totalVotes > 0 ? ((option.vote_count ?? 0) / totalVotes) * 100 : 0;
        return (
          <div key={option.id} className="p-4 rounded-2xl flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${option.is_winner ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{option.name}</p>
                {option.address && <p className="text-xs opacity-50">{option.address}</p>}
                {option.notes && <p className="text-xs opacity-40 mt-0.5">{option.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs opacity-50">{option.vote_count ?? 0}</span>
                {canInteract && !winner && (
                  <button onClick={() => vote(option)}
                    className="text-xs px-3 py-1.5 rounded-xl transition-all"
                    style={{
                      background: option.user_voted ? 'rgba(200,82,42,0.3)' : 'rgba(255,255,255,0.08)',
                      color: option.user_voted ? '#C8522A' : '#EFE3CE',
                    }}>
                    {option.user_voted ? '▲ Voted' : '▲ Vote'}
                  </button>
                )}
                {isHost && !winner && (
                  <button onClick={() => markWinner(option.id)}
                    className="text-xs px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(200,82,42,0.15)', color: '#C8522A' }}>
                    Pick
                  </button>
                )}
              </div>
            </div>
            {!winner && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#C8522A' }} />
              </div>
            )}
          </div>
        );
      })}

      {isHost && !winner && (
        showForm ? (
          <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Location name *"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none" style={inputStyle} />
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Address (optional)"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none" style={inputStyle} />
            <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes (optional)"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none" style={inputStyle} />
            <div className="flex gap-2">
              <button onClick={addOption} disabled={!newName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>Add</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm opacity-50">Cancel</button>
            </div>
          </div>
        ) : (
          data.locationOptions.length < 5 && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm opacity-50 hover:opacity-100 border border-dashed"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <Plus className="w-4 h-4" /> Add location option
            </button>
          )
        )
      )}

      {data.locationOptions.length === 0 && !showForm && (
        <p className="text-sm opacity-40 text-center py-8">No location options yet</p>
      )}
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/[id]/tabs/location-tab.tsx
git commit -m "feat: add location tab with voting and winner selection"
```

---

## Task 19: Playlist Tab

**Files:**
- Create: `src/app/(app)/events/[id]/tabs/playlist-tab.tsx`

- [ ] Create the playlist tab:

```typescript
// src/app/(app)/events/[id]/tabs/playlist-tab.tsx
'use client';

import { useState } from 'react';
import { Music, ExternalLink, Plus } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

export function PlaylistTab({ data, canInteract, eventId, onReload }: {
  data: FullEventData;
  canInteract: boolean;
  eventId: string;
  onReload: () => void;
}) {
  const [trackInput, setTrackInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSpotify = !!data.party.spotify_playlist_id;

  async function submitTrack() {
    if (!trackInput.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackInput: trackInput.trim() }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? 'Failed to add track');
    } else {
      setTrackInput('');
      onReload();
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasSpotify ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Music className="w-10 h-10 opacity-20" />
          {data.userRole === 'host' ? (
            <>
              <p className="text-sm opacity-60">Connect Spotify to create a shared playlist</p>
              <a href={`/api/events/spotify/connect?eventId=${eventId}`}
                className="px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2"
                style={{ background: '#1DB954', color: '#000' }}>
                Connect Spotify
              </a>
            </>
          ) : (
            <p className="text-sm opacity-50">The host hasn't connected Spotify yet</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest opacity-50">Playlist</h3>
            <a href={`https://open.spotify.com/playlist/${data.party.spotify_playlist_id}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100"
              style={{ color: '#1DB954' }}>
              Open in Spotify <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {canInteract && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input value={trackInput} onChange={e => setTrackInput(e.target.value)}
                  placeholder="Paste Spotify track URL or URI"
                  className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
                <button onClick={submitTrack} disabled={submitting || !trackInput.trim()}
                  className="px-4 py-3 rounded-xl disabled:opacity-40"
                  style={{ background: '#1DB954', color: '#000' }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {data.tracks.length === 0 && (
              <p className="text-sm opacity-40 text-center py-8">No tracks yet — be the first to add one</p>
            )}
            {data.tracks.map(track => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {track.album_art_url ? (
                  <img src={track.album_art_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(29,185,84,0.1)' }}>
                    <Music className="w-5 h-5" style={{ color: '#1DB954' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{track.track_name ?? 'Unknown track'}</p>
                  <p className="text-xs opacity-50 truncate">{track.artist_name}</p>
                </div>
                <a href={`https://open.spotify.com/track/${track.spotify_uri.replace('spotify:track:', '')}`}
                  target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/app/(app)/events/[id]/tabs/playlist-tab.tsx
git commit -m "feat: add playlist tab with Spotify connect and track submission"
```

---

## Task 20: Wire NEXT_PUBLIC_APP_URL + Final Check

**Files:**
- Modify: `.env.local`

- [ ] Add to `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] Start the dev server and navigate to `/events/new`:
```bash
npm run dev
```

- [ ] Generate a plan, click "Save & Edit Event" — verify redirect to `/events/[id]`

- [ ] Verify all 5 tabs render without errors in browser console

- [ ] Test as host: edit title inline, change avatar emoji, add/edit/delete a menu item, add/edit timeline step

- [ ] Test guest tab: invite via email, verify row appears with "invited" badge

- [ ] Test shopping: add item, check it off, assign to guest

- [ ] Test location: add 2 options, vote on one, mark winner — verify voting locks

- [ ] Test Spotify connect flow (requires Spotify app credentials in `.env.local`)

- [ ] Final commit:
```bash
git add .env.local
git commit -m "chore: add NEXT_PUBLIC_APP_URL env var for server-side fetch"
```

---

## Self-Review Checklist

- [x] DB migration covers all 6 tables + RLS helpers
- [x] `event-types.ts` defines all types used across tabs
- [x] `FullEventData.userRole` flows through hub into every tab
- [x] Token refresh logic in `/api/events/[id]/tracks/route.ts` handles 5-min window
- [x] Avatar upload uses Supabase Storage `event-avatars` bucket — **bucket must be created manually in Supabase dashboard before testing**
- [x] `NEXT_PUBLIC_APP_URL` required in server page for fetch — documented in Task 20
- [x] Location voting locked when winner exists (`!winner` guards on vote/pick buttons)
- [x] Shopping items split checked/unchecked with checked at bottom
- [x] All API routes use `export const dynamic = 'force-dynamic'`
- [x] Guest DELETE route uses `id` from params — verified both `id` and `guestId` destructured in Task 8
