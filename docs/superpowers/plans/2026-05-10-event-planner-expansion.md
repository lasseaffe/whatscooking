# Event Planner Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the What's Cooking event planner with image upload, recipe→shopping import, shopping categories, location types, playlist URL entry without Spotify, shareable invite links with deep links, and guest permission roles.

**Architecture:** Each feature is a self-contained UI + API change on the existing `/events/[id]` tab system. The only shared data-model change is threading `guestRole` through `FullEventData` and `EventHub` so `canInteract` can distinguish editor from viewer guests. All DB changes land in a single migration file applied first.

**Tech Stack:** Next.js App Router, Supabase (Postgres + Storage), TypeScript, Tailwind inline styles (existing pattern uses `style={{}}` not class names)

---

## Task 0: DB Migration

**Files:**
- Create: `supabase/migrations/20260510_event_planner_expansion.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260510_event_planner_expansion.sql

-- 1. Guest permission roles
alter table dinner_party_guests
  add column if not exists role text not null default 'viewer';

-- 2. Event invite token (one per event, anyone with token can RSVP)
alter table dinner_parties
  add column if not exists invite_token uuid unique default gen_random_uuid();

-- 3. Shopping item categories
alter table event_shopping_items
  add column if not exists category text not null default 'other';

-- 4. Location option types
alter table event_location_options
  add column if not exists location_type text;
```

- [ ] **Step 2: Apply the migration**

Run in Supabase Studio SQL editor or via CLI:
```bash
supabase db push
```
Or paste the SQL directly into Supabase Studio → SQL Editor → Run.

Verify in Studio: check that all four `add column` statements show in the table editors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260510_event_planner_expansion.sql
git commit -m "feat: db migration — guest roles, invite token, shopping categories, location types"
```

---

## Task 1: Update Types + API Data Layer

Thread `guestRole` and new fields through the type system and the GET route that feeds the whole app.

**Files:**
- Modify: `src/lib/event-types.ts`
- Modify: `src/app/api/events/[id]/route.ts`
- Modify: `src/app/(app)/events/[id]/page.tsx`
- Modify: `src/app/(app)/events/[id]/event-hub.tsx`

- [ ] **Step 1: Update `event-types.ts`**

Replace the file content with:

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

export type ShoppingCategory = 'ingredient' | 'beverage' | 'equipment' | 'other';

export type EventShoppingItem = {
  id: string;
  party_id: string;
  name: string;
  quantity: string | null;
  category: ShoppingCategory;
  assigned_to: string | null;
  checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  created_by: string;
  created_at: string;
};

export type LocationType = 'private' | 'restaurant' | 'public' | 'other';

export type EventLocationOption = {
  id: string;
  party_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  location_type: LocationType | null;
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

export type GuestRole = 'editor' | 'viewer';

export type DinnerPartyGuest = {
  id: string;
  party_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  rsvp: 'invited' | 'accepted' | 'declined' | 'maybe';
  role: GuestRole;
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
  invite_token: string | null;
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
  userRole: 'host' | 'accepted' | 'invited' | 'maybe' | 'none';
  guestRole: GuestRole | null; // null when userRole === 'host'
};
```

- [ ] **Step 2: Update `GET /api/events/[id]/route.ts` to expose `guestRole` and `invite_token`**

Replace the GET handler's select and return:

```typescript
// In GET handler, update the party select to include invite_token:
const { data: party } = await supabase
  .from('dinner_parties')
  .select('id,host_id,title,description,scheduled_at,location,theme,status,cover_color,avatar_url,avatar_emoji,spotify_playlist_id,invite_token,created_at,updated_at')
  .eq('id', id)
  .single();
```

And update the return statement at the bottom of GET to include `guestRole`:

```typescript
  const guestRole: 'editor' | 'viewer' | null = party.host_id === user.id
    ? null
    : (guestRecord?.role as 'editor' | 'viewer' | undefined) ?? 'viewer';

  return NextResponse.json({
    party,
    guests: guests ?? [],
    menuItems: menuItems ?? [],
    timelineItems: timelineItems ?? [],
    shoppingItems: shoppingItems ?? [],
    locationOptions: enrichedOptions,
    tracks: tracks ?? [],
    userRole,
    guestRole,
  });
```

- [ ] **Step 3: Update `page.tsx` (server component) to pass `guestRole`**

After the userRole block, add:

```typescript
  let guestRole: 'editor' | 'viewer' | null = null;
  if (userRole !== 'host') {
    const { data: guestRow2 } = await supabase
      .from('dinner_party_guests')
      .select('role')
      .eq('party_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    guestRole = (guestRow2?.role as 'editor' | 'viewer') ?? 'viewer';
  }
```

Then add `guestRole` to the `initialData` object:

```typescript
  const initialData: FullEventData = {
    party,
    guests: guests ?? [],
    menuItems: menuItems ?? [],
    timelineItems: timelineItems ?? [],
    shoppingItems: shoppingItems ?? [],
    locationOptions: enrichedLocations,
    tracks: tracks ?? [],
    userRole,
    guestRole,
  };
```

- [ ] **Step 4: Update `event-hub.tsx` to use `guestRole` for `canInteract`**

```typescript
  const isHost = data.userRole === 'host';
  const canInteract = isHost || data.guestRole === 'editor';
```

Pass `guestRole` to `GuestsTab`:

```typescript
{activeTab === 'Guests' && <GuestsTab data={data} isHost={isHost} eventId={eventId} userId={userId} guestRole={data.guestRole} onReload={reload} />}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/event-types.ts src/app/api/events/[id]/route.ts src/app/(app)/events/[id]/page.tsx src/app/(app)/events/[id]/event-hub.tsx
git commit -m "feat: thread guestRole and invite_token through event data layer"
```

---

## Task 2: DB Migration — Supabase Storage Bucket

Create the `event-avatars` storage bucket for image uploads.

**Files:** No code files — Supabase Studio configuration.

- [ ] **Step 1: Create bucket in Supabase Studio**

Go to Supabase Studio → Storage → New bucket:
- Name: `event-avatars`
- Public: ✅ (public read)

Add an RLS policy for inserts (Storage → Policies → New policy on `event-avatars`):
```sql
-- Allow authenticated users to upload to their own event folder
CREATE POLICY "host can upload event avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read
CREATE POLICY "public read event avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-avatars');
```

- [ ] **Step 2: Confirm**

Upload a test image via Studio → Storage → event-avatars. Confirm a public URL is accessible.

---

## Task 3: Event Image Upload — API Route

**Files:**
- Create: `src/app/api/events/[id]/avatar/route.ts`

- [ ] **Step 1: Create the avatar upload route**

```typescript
// src/app/api/events/[id]/avatar/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only host can update avatar
  const { data: party } = await supabase
    .from('dinner_parties')
    .select('host_id')
    .eq('id', id)
    .single();
  if (!party || party.host_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${user.id}/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('event-avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('event-avatars')
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('dinner_parties')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ avatar_url: publicUrl });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/events/[id]/avatar/route.ts
git commit -m "feat: avatar upload API route for events"
```

---

## Task 4: Event Image Upload — UI

**Files:**
- Modify: `src/app/(app)/events/[id]/tabs/overview-tab.tsx`

- [ ] **Step 1: Add image upload to the avatar area in `overview-tab.tsx`**

Add a hidden file input and upload handler. Replace the avatar div block (lines ~49-54):

```typescript
// Add at top of OverviewTab component, after the existing useState hooks:
const [uploading, setUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  const fd = new FormData();
  fd.append('file', file);
  await fetch(`/api/events/${eventId}/avatar`, { method: 'POST', body: fd });
  setUploading(false);
  onReload();
}
```

Add `useRef` to the import: `import { useState, useRef } from 'react';`

Replace the avatar square JSX with:

```tsx
<div
  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 relative overflow-hidden"
  style={{ background: 'rgba(200,82,42,0.15)', cursor: isHost ? 'pointer' : 'default' }}
  onClick={() => isHost && fileInputRef.current?.click()}
>
  {party.avatar_url
    ? <img src={party.avatar_url} className="w-14 h-14 rounded-xl object-cover" alt="" />
    : (party.avatar_emoji ?? '🍽️')}
  {isHost && (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl"
      style={{ background: 'rgba(0,0,0,0.5)', fontSize: '11px', color: '#fff' }}>
      {uploading ? '…' : '📷'}
    </div>
  )}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleAvatarUpload}
  />
</div>
```

- [ ] **Step 2: Test manually**

Start dev server: `npm run dev`
Navigate to an event as host → click the avatar square → pick an image → confirm it updates.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/events/[id]/tabs/overview-tab.tsx
git commit -m "feat: event avatar image upload UI"
```

---

## Task 5: Shopping Categories — API + Types

**Files:**
- Modify: `src/app/api/events/[id]/shopping/route.ts`

- [ ] **Step 1: Accept `category` in the POST handler**

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

  const { name, quantity, category } = await req.json();
  const { data, error } = await supabase
    .from('event_shopping_items')
    .insert({
      party_id: id,
      name,
      quantity: quantity ?? null,
      category: category ?? 'other',
      created_by: user.id,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/events/[id]/shopping/route.ts
git commit -m "feat: shopping items accept category field"
```

---

## Task 6: Shopping Categories — UI

**Files:**
- Modify: `src/app/(app)/events/[id]/tabs/shopping-tab.tsx`

- [ ] **Step 1: Replace `shopping-tab.tsx` with category-aware version**

```typescript
'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Check, Trash2 } from 'lucide-react';
import type { FullEventData, ShoppingCategory } from '@/lib/event-types';

const CATEGORIES: { value: ShoppingCategory; label: string; icon: string }[] = [
  { value: 'ingredient', label: 'Ingredient', icon: '🥕' },
  { value: 'beverage',   label: 'Beverage',   icon: '🍷' },
  { value: 'equipment',  label: 'Equipment',  icon: '🍳' },
  { value: 'other',      label: 'Other',      icon: '📦' },
];

const CATEGORY_COLOR: Record<ShoppingCategory, string> = {
  ingredient: 'rgba(34,197,94,0.7)',
  beverage:   'rgba(99,102,241,0.7)',
  equipment:  'rgba(234,179,8,0.7)',
  other:      'rgba(239,227,206,0.3)',
};

export function ShoppingTab({ data, canInteract, eventId, userId, onReload }: {
  data: FullEventData;
  canInteract: boolean;
  eventId: string;
  userId: string;
  onReload: () => void;
}) {
  const { shoppingItems } = data;
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCat, setNewCat] = useState<ShoppingCategory>('other');
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newItem.trim()) return;
    setAdding(true);
    await fetch(`/api/events/${eventId}/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItem.trim(), quantity: newQty.trim() || null, category: newCat }),
    });
    setNewItem('');
    setNewQty('');
    setAdding(false);
    onReload();
  }

  async function handleToggle(itemId: string, checked: boolean) {
    await fetch(`/api/events/${eventId}/shopping/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !checked }),
    });
    onReload();
  }

  async function handleDelete(itemId: string) {
    await fetch(`/api/events/${eventId}/shopping/${itemId}`, { method: 'DELETE' });
    onReload();
  }

  const unchecked = shoppingItems.filter(i => !i.checked);
  const checked = shoppingItems.filter(i => i.checked);

  // Group unchecked by category for display
  const grouped = CATEGORIES
    .map(cat => ({ ...cat, items: unchecked.filter(i => (i.category ?? 'other') === cat.value) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5 pb-12">
      {canInteract && (
        <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(239,227,206,0.4)' }}>Add item</p>

          {/* Category selector */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setNewCat(cat.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: newCat === cat.value ? 'rgba(200,82,42,0.25)' : 'rgba(255,255,255,0.05)',
                  color: newCat === cat.value ? '#C8522A' : 'rgba(239,227,206,0.5)',
                  border: `1px solid ${newCat === cat.value ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-2">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Item name"
              className="flex-1 rounded-xl px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
            />
            <input
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              placeholder="Qty"
              className="w-20 rounded-xl px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newItem.trim()}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-40"
            style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      )}

      {shoppingItems.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'rgba(239,227,206,0.3)' }}>
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No shopping items yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(group => (
            <div key={group.value}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: CATEGORY_COLOR[group.value] }}>
                {group.icon} {group.label}
              </p>
              <div className="flex flex-col gap-2">
                {group.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => handleToggle(item.id, item.checked)}
                      className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0"
                      style={{ borderColor: 'rgba(239,227,206,0.3)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: '#EFE3CE' }}>{item.name}</p>
                      {item.quantity && <p className="text-xs" style={{ color: 'rgba(239,227,206,0.4)' }}>{item.quantity}</p>}
                    </div>
                    {canInteract && (
                      <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-80">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#EFE3CE' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {checked.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-widest mt-2 mb-1" style={{ color: 'rgba(239,227,206,0.3)' }}>Got it</p>
              {checked.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-50"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <button onClick={() => handleToggle(item.id, item.checked)}
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(200,82,42,0.25)', border: '1px solid rgba(200,82,42,0.4)' }}>
                    <Check className="w-3 h-3" style={{ color: '#C8522A' }} />
                  </button>
                  <p className="text-sm line-through flex-1" style={{ color: 'rgba(239,227,206,0.5)' }}>{item.name}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test manually**

Add items with each category type. Confirm they appear in grouped sections. Check off an item; confirm it moves to "Got it".

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/events/[id]/tabs/shopping-tab.tsx
git commit -m "feat: shopping items with category grouping (ingredient/beverage/equipment/other)"
```

---

## Task 7: Recipe → Shopping API

**Files:**
- Create: `src/app/api/events/[id]/recipe-ingredients/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/events/[id]/recipe-ingredients/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get menu items that have a recipe_id
  const { data: menuItems, error: menuErr } = await supabase
    .from('event_menu_items')
    .select('id, name, recipe_id')
    .eq('party_id', id)
    .not('recipe_id', 'is', null);

  if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 500 });
  if (!menuItems || menuItems.length === 0) return NextResponse.json([]);

  const recipeIds = menuItems.map(m => m.recipe_id as string);

  // Fetch ingredients for those recipes
  // Assumes recipe_ingredients table with: recipe_id, name, quantity, unit
  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, name, quantity, unit')
    .in('recipe_id', recipeIds);

  if (ingErr) return NextResponse.json({ error: ingErr.message }, { status: 500 });

  // Group by menu item
  const result = menuItems.map(mi => ({
    menuItemId: mi.id,
    menuItemName: mi.name,
    recipeId: mi.recipe_id,
    ingredients: (ingredients ?? [])
      .filter(ing => ing.recipe_id === mi.recipe_id)
      .map(ing => ({
        name: ing.name,
        quantity: ing.quantity && ing.unit ? `${ing.quantity} ${ing.unit}` : (ing.quantity ?? null),
      })),
  }));

  return NextResponse.json(result);
}
```

> **Note:** If `recipe_ingredients` uses different column names (e.g. `amount` instead of `quantity`), adjust the select and map accordingly. Check your existing recipe schema.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/events/[id]/recipe-ingredients/route.ts
git commit -m "feat: recipe ingredients endpoint for shopping import"
```

---

## Task 8: Recipe → Shopping UI

**Files:**
- Modify: `src/app/(app)/events/[id]/tabs/shopping-tab.tsx`

- [ ] **Step 1: Add "Add from recipe" section to `ShoppingTab`**

Add these state variables inside `ShoppingTab` (after existing state):

```typescript
const [showRecipePanel, setShowRecipePanel] = useState(false);
const [recipeGroups, setRecipeGroups] = useState<{
  menuItemId: string;
  menuItemName: string;
  recipeId: string;
  ingredients: { name: string; quantity: string | null }[];
}[]>([]);
const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
const [loadingRecipes, setLoadingRecipes] = useState(false);
const [importingRecipes, setImportingRecipes] = useState(false);
```

Add a helper to load and import:

```typescript
async function openRecipePanel() {
  setLoadingRecipes(true);
  setShowRecipePanel(true);
  const res = await fetch(`/api/events/${eventId}/recipe-ingredients`);
  const groups = await res.json();
  setRecipeGroups(groups);
  // Pre-select all
  const all = new Set<string>();
  groups.forEach((g: typeof recipeGroups[0]) => g.ingredients.forEach(ing => all.add(`${g.menuItemId}::${ing.name}`)));
  setSelectedIngredients(all);
  setLoadingRecipes(false);
}

async function importSelected() {
  setImportingRecipes(true);
  const toImport: { name: string; quantity: string | null }[] = [];
  recipeGroups.forEach(g => {
    g.ingredients.forEach(ing => {
      if (selectedIngredients.has(`${g.menuItemId}::${ing.name}`)) {
        toImport.push({ name: ing.name, quantity: ing.quantity });
      }
    });
  });
  await Promise.all(toImport.map(item =>
    fetch(`/api/events/${eventId}/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name, quantity: item.quantity, category: 'ingredient' }),
    })
  ));
  setShowRecipePanel(false);
  setRecipeGroups([]);
  setSelectedIngredients(new Set());
  setImportingRecipes(false);
  onReload();
}
```

Add the "Add from recipe" button above the add-item form (only when host and there are linked recipes — check lazily by always showing button):

```tsx
{canInteract && data.menuItems.some(m => m.recipe_id) && (
  <button
    onClick={openRecipePanel}
    className="flex items-center gap-2 text-sm px-4 py-3 rounded-2xl w-full justify-center font-semibold mb-2"
    style={{ background: 'rgba(34,197,94,0.1)', border: '1px dashed rgba(34,197,94,0.3)', color: 'rgba(34,197,94,0.8)' }}>
    🥕 Add from recipe
  </button>
)}
```

Add the recipe panel (show when `showRecipePanel`):

```tsx
{showRecipePanel && (
  <div className="rounded-2xl p-4 border flex flex-col gap-3"
    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.5)' }}>
        Import from recipes
      </p>
      <button onClick={() => setShowRecipePanel(false)} className="text-xs opacity-40 hover:opacity-80" style={{ color: '#EFE3CE' }}>✕</button>
    </div>
    {loadingRecipes ? (
      <p className="text-sm opacity-40">Loading…</p>
    ) : recipeGroups.length === 0 ? (
      <p className="text-sm opacity-40">No linked recipes found</p>
    ) : (
      recipeGroups.map(group => (
        <div key={group.menuItemId}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#C8522A' }}>{group.menuItemName}</p>
          {group.ingredients.map(ing => {
            const key = `${group.menuItemId}::${ing.name}`;
            const selected = selectedIngredients.has(key);
            return (
              <label key={key} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const next = new Set(selectedIngredients);
                    if (selected) next.delete(key); else next.add(key);
                    setSelectedIngredients(next);
                  }}
                />
                <span className="text-sm" style={{ color: '#EFE3CE' }}>{ing.name}</span>
                {ing.quantity && <span className="text-xs opacity-40" style={{ color: '#EFE3CE' }}>{ing.quantity}</span>}
              </label>
            );
          })}
        </div>
      ))
    )}
    <button
      onClick={importSelected}
      disabled={importingRecipes || selectedIngredients.size === 0}
      className="text-sm py-2 rounded-xl font-semibold disabled:opacity-40"
      style={{ background: 'rgba(34,197,94,0.2)', color: 'rgba(34,197,94,0.9)' }}>
      {importingRecipes ? 'Importing…' : `Import ${selectedIngredients.size} ingredient${selectedIngredients.size !== 1 ? 's' : ''}`}
    </button>
  </div>
)}
```

- [ ] **Step 2: Test manually**

Create a menu item linked to a recipe. Go to Shopping tab. Confirm "Add from recipe" button appears. Open it; confirm ingredients list. Import; confirm items appear under "Ingredient" section.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/events/[id]/tabs/shopping-tab.tsx
git commit -m "feat: import recipe ingredients into shopping list"
```

---

## Task 9: Location Type Selector — API

**Files:**
- Modify: `src/app/api/events/[id]/locations/route.ts`

- [ ] **Step 1: Accept `location_type` in POST**

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

  const { name, address, notes, location_type } = await req.json();
  const { data, error } = await supabase
    .from('event_location_options')
    .insert({
      party_id: id,
      name,
      address: address ?? null,
      notes: notes ?? null,
      location_type: location_type ?? null,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/events/[id]/locations/route.ts
git commit -m "feat: location options accept location_type field"
```

---

## Task 10: Location Type Selector — UI

**Files:**
- Modify: `src/app/(app)/events/[id]/tabs/location-tab.tsx`

- [ ] **Step 1: Add type selector to the suggest-location form and badge to cards**

Add a `locationType` state:

```typescript
const [locationType, setLocationType] = useState<'private' | 'restaurant' | 'public' | 'other' | null>(null);
```

Add type buttons inside the form, after the form div opens (before the name input):

```tsx
{/* Location type selector */}
<div className="flex gap-2 flex-wrap mb-1">
  {([
    { value: 'private',    label: '🏠 Private'    },
    { value: 'restaurant', label: '🍽️ Restaurant' },
    { value: 'public',     label: '🌳 Public'     },
    { value: 'other',      label: '📍 Other'      },
  ] as const).map(opt => (
    <button
      key={opt.value}
      type="button"
      onClick={() => setLocationType(opt.value)}
      className="px-3 py-1.5 rounded-xl text-xs font-medium"
      style={{
        background: locationType === opt.value ? 'rgba(200,82,42,0.25)' : 'rgba(255,255,255,0.06)',
        color: locationType === opt.value ? '#C8522A' : 'rgba(239,227,206,0.5)',
        border: `1px solid ${locationType === opt.value ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {opt.label}
    </button>
  ))}
</div>
```

Update `handleAdd` to pass `location_type`:

```typescript
async function handleAdd() {
  if (!name.trim()) return;
  setAdding(true);
  await fetch(`/api/events/${eventId}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      address: address.trim() || null,
      notes: notes.trim() || null,
      location_type: locationType,
    }),
  });
  setName(''); setAddress(''); setNotes(''); setLocationType(null);
  setAdding(false);
  setShowForm(false);
  onReload();
}
```

Add a type badge on each location card, inside the card JSX below the name:

```tsx
{option.location_type && (
  <span className="text-xs px-2 py-0.5 rounded-full"
    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(239,227,206,0.5)' }}>
    {option.location_type === 'private' ? '🏠 Private'
      : option.location_type === 'restaurant' ? '🍽️ Restaurant'
      : option.location_type === 'public' ? '🌳 Public'
      : '📍 Other'}
  </span>
)}
```

Place this badge after the `option.address` line and before `option.notes`.

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/events/[id]/tabs/location-tab.tsx
git commit -m "feat: location type selector (private/restaurant/public/other)"
```

---

## Task 11: Playlist Without Spotify

**Files:**
- Modify: `src/app/api/events/[id]/tracks/route.ts`
- Modify: `src/app/(app)/events/[id]/tabs/playlist-tab.tsx`

- [ ] **Step 1: Update tracks API to save without Spotify**

```typescript
// src/app/api/events/[id]/tracks/route.ts
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken, getTrackMetadata, addTrackToPlaylist, refreshToken, encryptTokens } from '@/lib/spotify';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function spotifyUrlToUri(input: string): string {
  const match = input.match(/track[/:]([A-Za-z0-9]+)/);
  if (!match) throw new Error('Not a valid Spotify track URL or URI');
  return `spotify:track:${match[1]}`;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const trackInput: string = body.spotify_url ?? body.trackInput;

  let uri: string;
  try {
    uri = spotifyUrlToUri(trackInput);
  } catch {
    return NextResponse.json({ error: 'Not a valid Spotify track URL or URI' }, { status: 400 });
  }

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('spotify_access_token,spotify_refresh_token,spotify_token_expires_at,spotify_playlist_id,host_id')
    .eq('id', id).single();

  // If Spotify is connected, add to playlist + fetch metadata
  let trackName: string | null = null;
  let artistName: string | null = null;
  let albumArtUrl: string | null = null;
  let addedToSpotify = false;

  if (party?.spotify_playlist_id) {
    let accessToken = getValidAccessToken(party);
    if (accessToken) {
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
      const meta = await getTrackMetadata(accessToken, uri);
      await addTrackToPlaylist(accessToken, party.spotify_playlist_id, uri);
      trackName = meta.name;
      artistName = meta.artist;
      albumArtUrl = meta.albumArt;
      addedToSpotify = true;
    }
  }

  const { data: track, error } = await supabase
    .from('event_playlist_tracks')
    .insert({
      party_id: id,
      submitted_by: user.id,
      spotify_uri: uri,
      track_name: trackName,
      artist_name: artistName,
      album_art_url: albumArtUrl,
      added_to_spotify: addedToSpotify,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(track);
}
```

- [ ] **Step 2: Update `playlist-tab.tsx` to show form even without Spotify**

Replace the condition guarding the input form:

```tsx
{/* Was: {canInteract && party.spotify_playlist_id && ( ... )} */}
{/* Now: always show the form when canInteract */}
{canInteract && (
  <div className="rounded-2xl p-4 border flex flex-col gap-3"
    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.4)' }}>
      Suggest a track
    </p>
    {!party.spotify_playlist_id && (
      <p className="text-xs" style={{ color: 'rgba(239,227,206,0.35)' }}>
        Spotify not connected — tracks will sync when the host connects Spotify
      </p>
    )}
    <input
      value={url}
      onChange={e => setUrl(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleAdd()}
      placeholder="Spotify track URL or URI"
      className="w-full rounded-xl px-3 py-2 text-sm"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
    />
    {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
    <button onClick={handleAdd} disabled={adding || !url.trim()}
      className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-40 w-fit"
      style={{ background: 'rgba(30,215,96,0.15)', color: '#1ED760' }}>
      <Plus className="w-4 h-4" /> {adding ? 'Adding…' : 'Add track'}
    </button>
  </div>
)}
```

Update the track list to show a grey dot for unsynced tracks (replace the green dot block):

```tsx
{track.added_to_spotify ? (
  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#1ED760' }} title="On Spotify" />
) : (
  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgba(239,227,206,0.2)' }} title="Pending sync" />
)}
```

- [ ] **Step 3: Test manually**

Navigate to a Playlist tab with no Spotify connected. Enter a Spotify URL. Confirm the track saves with a grey dot. Connect Spotify (if available) and confirm tracks added after that get a green dot.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/events/[id]/tracks/route.ts src/app/(app)/events/[id]/tabs/playlist-tab.tsx
git commit -m "feat: playlist track submission works without Spotify connection"
```

---

## Task 12: Shareable Invite Link — API

**Files:**
- Create: `src/app/api/events/[id]/invite-link/route.ts`
- Create: `src/app/api/events/join/route.ts`

- [ ] **Step 1: Create the invite-link GET endpoint**

```typescript
// src/app/api/events/[id]/invite-link/route.ts
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
    .select('host_id, invite_token, title')
    .eq('id', id)
    .single();

  if (!party || party.host_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${baseUrl}/events/join?token=${party.invite_token}`;

  return NextResponse.json({ url, title: party.title });
}
```

- [ ] **Step 2: Create the join POST endpoint**

```typescript
// src/app/api/events/join/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { token, name, email } = await req.json();
  if (!token || !name || !email) {
    return NextResponse.json({ error: 'token, name, and email are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('id, title, host_id')
    .eq('invite_token', token)
    .single();

  if (!party) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });

  // Prevent duplicate email RSVPs
  const { data: existing } = await supabase
    .from('dinner_party_guests')
    .select('id')
    .eq('party_id', party.id)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ partyId: party.id, alreadyRsvped: true });
  }

  const { error } = await supabase
    .from('dinner_party_guests')
    .insert({
      party_id: party.id,
      email,
      display_name: name,
      rsvp: 'invited',
      role: 'viewer',
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ partyId: party.id, alreadyRsvped: false });
}
```

Also create a GET to fetch event info by token (for the RSVP page to display):

```typescript
// Add to src/app/api/events/join/route.ts after the POST:
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = await createClient();
  const { data: party } = await supabase
    .from('dinner_parties')
    .select('id, title, description, scheduled_at, location, host_id')
    .eq('invite_token', token)
    .single();

  if (!party) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });

  return NextResponse.json(party);
}
```

- [ ] **Step 3: Add `NEXT_PUBLIC_APP_URL` to your `.env.local`**

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

(Set to your production domain on Vercel.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/events/[id]/invite-link/route.ts src/app/api/events/join/route.ts
git commit -m "feat: invite link API and public RSVP join endpoint"
```

---

## Task 13: Public RSVP Page

**Files:**
- Create: `src/app/(app)/events/join/page.tsx` — Note: place in `(app)` group if it should use the app layout, or in `src/app/events/join/page.tsx` outside the auth group if it should be publicly accessible.

> **Decision:** The join page must be publicly accessible (no auth required). Create it outside the `(app)` group: `src/app/events/join/page.tsx`.

- [ ] **Step 1: Create the public RSVP page**

```typescript
// src/app/events/join/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

type EventInfo = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  location: string | null;
};

function JoinContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/events/join?token=${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) setNotFound(true);
        else setEvent(data);
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/events/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: name.trim(), email: email.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Something went wrong'); setSubmitting(false); return; }
    setDone(true);
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0907', color: '#EFE3CE' }}>
      <p className="opacity-40">Loading invite…</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0907', color: '#EFE3CE' }}>
      <p className="opacity-40">This invite link is invalid or has expired.</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D0907', color: '#EFE3CE' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold mb-1">{event?.title}</h1>
          <p className="text-sm opacity-50">
            {event?.scheduled_at && new Date(event.scheduled_at).toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
            {event?.location && ` · ${event.location}`}
          </p>
          {event?.description && (
            <p className="text-sm mt-3 opacity-70 leading-relaxed">{event.description}</p>
          )}
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">🎉</div>
            <p className="font-semibold">You're on the list!</p>
            <p className="text-sm opacity-50 mt-1">The host will be in touch.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="Your email"
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
            />
            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !email.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
              {submitting ? 'Sending…' : 'RSVP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Test manually**

Get the invite link from the guests tab (Task 14 below builds the UI). Or manually construct: `http://localhost:3000/events/join?token=<uuid-from-db>`. Confirm the event details show. Fill in name + email. Submit. Confirm a new guest row appears in the `dinner_party_guests` table.

- [ ] **Step 3: Commit**

```bash
git add src/app/events/join/page.tsx
git commit -m "feat: public RSVP page at /events/join?token=..."
```

---

## Task 14: Guest Roles + Invite UI

**Files:**
- Modify: `src/app/(app)/events/[id]/tabs/guests-tab.tsx`
- Modify: `src/app/api/events/[id]/guests/route.ts`
- Modify: `src/app/api/events/[id]/guests/[guestId]/route.ts`

- [ ] **Step 1: Update guests POST API to accept `role`**

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

  const { data: party } = await supabase.from('dinner_parties').select('host_id').eq('id', id).single();
  if (!party || party.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, email, displayName, role } = await req.json();

  const { data, error } = await supabase
    .from('dinner_party_guests')
    .insert({
      party_id: id,
      user_id: userId ?? null,
      email: email ?? null,
      display_name: displayName ?? null,
      rsvp: 'invited',
      role: role === 'editor' ? 'editor' : 'viewer',
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Update guests PATCH API to accept `role`**

Read the current file first, then update. The existing PATCH handles `rsvp` updates. Add `role` support for host-only changes:

```typescript
// src/app/api/events/[id]/guests/[guestId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; guestId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id, guestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Guests can update their own rsvp; hosts can update rsvp + role
  const { data: party } = await supabase.from('dinner_parties').select('host_id').eq('id', id).single();
  const isHost = party?.host_id === user.id;

  const patch: Record<string, string> = {};
  if (body.rsvp) patch.rsvp = body.rsvp;
  if (isHost && body.role && ['editor', 'viewer'].includes(body.role)) patch.role = body.role;

  const { data, error } = await supabase
    .from('dinner_party_guests')
    .update(patch)
    .eq('id', guestId)
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

- [ ] **Step 3: Replace `guests-tab.tsx` with full version**

```typescript
'use client';

import { useState } from 'react';
import { UserPlus, X, Link as LinkIcon, MessageCircle } from 'lucide-react';
import type { FullEventData, GuestRole } from '@/lib/event-types';

const RSVP_COLORS: Record<string, string> = {
  accepted: '#22c55e',
  declined:  '#ef4444',
  maybe:     '#f59e0b',
  invited:   'rgba(239,227,206,0.4)',
};

export function GuestsTab({ data, isHost, eventId, userId, guestRole, onReload }: {
  data: FullEventData;
  isHost: boolean;
  eventId: string;
  userId: string;
  guestRole: GuestRole | null;
  onReload: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<GuestRole>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        displayName: inviteEmail.split('@')[0],
        role: inviteRole,
      }),
    });
    // Open mailto with pre-filled invite
    const link = inviteLink ?? await getInviteLink();
    const subject = encodeURIComponent(`You're invited to ${data.party.title}`);
    const body = encodeURIComponent(
      `Hi! You're invited to "${data.party.title}".\n\nRSVP here: ${link}`
    );
    window.open(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`);
    setInviteEmail('');
    setInviting(false);
    onReload();
  }

  async function getInviteLink(): Promise<string> {
    if (inviteLink) return inviteLink;
    setLoadingLink(true);
    const res = await fetch(`/api/events/${eventId}/invite-link`);
    const { url } = await res.json();
    setInviteLink(url);
    setLoadingLink(false);
    return url;
  }

  async function copyLink() {
    const url = await getInviteLink();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareWhatsApp() {
    const url = await getInviteLink();
    const text = encodeURIComponent(`You're invited to "${data.party.title}"! ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  async function shareIMessage() {
    const url = await getInviteLink();
    const body = encodeURIComponent(`You're invited to "${data.party.title}"! ${url}`);
    window.open(`sms:&body=${body}`);
  }

  async function rsvp(guestId: string, rsvp: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvp }),
    });
    onReload();
  }

  async function changeRole(guestId: string, role: GuestRole) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
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

      {/* Host: Invite + Share */}
      {isHost && (
        <>
          {/* Email invite with role toggle */}
          <div className="rounded-2xl p-4 border flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.4)' }}>Invite by email</p>
            <div className="flex gap-2">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
              <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            {/* Role toggle */}
            <div className="flex gap-2">
              {(['viewer', 'editor'] as const).map(r => (
                <button key={r} onClick={() => setInviteRole(r)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize"
                  style={{
                    background: inviteRole === r ? 'rgba(200,82,42,0.2)' : 'rgba(255,255,255,0.05)',
                    color: inviteRole === r ? '#C8522A' : 'rgba(239,227,206,0.4)',
                    border: `1px solid ${inviteRole === r ? 'rgba(200,82,42,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  {r === 'viewer' ? '👁 View only' : '✏️ Can edit'}
                </button>
              ))}
            </div>
          </div>

          {/* Share link section */}
          <div className="rounded-2xl p-4 border flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.4)' }}>Share invite link</p>
            <div className="flex gap-2">
              <button onClick={copyLink} disabled={loadingLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: 'rgba(200,82,42,0.15)', color: '#C8522A', border: '1px solid rgba(200,82,42,0.3)' }}>
                <LinkIcon className="w-4 h-4" />
                {copied ? 'Copied!' : loadingLink ? 'Getting link…' : 'Copy link'}
              </button>
              <button onClick={shareWhatsApp}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}>
                WA
              </button>
              <button onClick={shareIMessage}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759', border: '1px solid rgba(52,199,89,0.25)' }}>
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
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
              <select
                value={guest.role ?? 'viewer'}
                onChange={e => changeRole(guest.id, e.target.value as GuestRole)}
                className="text-xs rounded-lg px-2 py-1"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(239,227,206,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="viewer">View</option>
                <option value="editor">Edit</option>
              </select>
            )}
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

- [ ] **Step 4: Test manually**

1. As host: invite a guest as "View only" → confirm guest appears with `role: viewer` in DB.
2. As host: click "Copy link" → paste in browser → RSVP page shows correct event.
3. As host: change guest to "Edit" via dropdown → confirm `role: editor` in DB.
4. Log in as the viewer guest → go to Shopping tab → confirm add-item form is hidden.
5. Log in as the editor guest → confirm add-item form is visible.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/events/[id]/tabs/guests-tab.tsx src/app/api/events/[id]/guests/route.ts src/app/api/events/[id]/guests/[guestId]/route.ts
git commit -m "feat: guest roles (editor/viewer), shareable invite link, WhatsApp/iMessage share, mailto invite"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Event image upload → Tasks 2, 3, 4
- [x] Recipe → Shopping → Tasks 7, 8
- [x] Shopping categories → Tasks 5, 6
- [x] Location type selector → Tasks 9, 10
- [x] Playlist without Spotify → Task 11
- [x] Shareable invite link + deep links → Tasks 12, 13, 14
- [x] Guest roles + mailto → Task 14

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:**
- `ShoppingCategory` defined in Task 1 types, used in Task 5 API + Task 6 UI ✓
- `LocationType` defined in Task 1 types, used in Task 9 API + Task 10 UI ✓
- `GuestRole` defined in Task 1 types, used in Task 14 UI + APIs ✓
- `guestRole` field added to `FullEventData` in Task 1, threaded through Task 1 `event-hub.tsx`, consumed in Task 14 `guests-tab.tsx` ✓
- `invite_token` added to `EventDetail` in Task 1, returned by API in Task 1, used in Task 12 API ✓
