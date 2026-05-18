# Daily Habit Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every cooked meal a permanent log entry with rating, notes, photo, and "next time" note — readable on the recipe page and in a global journal, with meal plan entries visually persisting their cooked state across refreshes.

**Architecture:** A new `cook_log` Supabase table is the single write target for three surfaces (plan entry, cooking mode, recipe page). A shared `CookLogSheet` bottom-drawer component handles the post-cook capture UI. Two read surfaces (recipe page `CookHistory` + `/journal` page) query the same table.

**Tech Stack:** Next.js 15 App Router, Supabase (server client + storage), Framer Motion v12, TypeScript, Tailwind CSS, `@/lib/motion` spring config.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260518c_cook_log.sql` | Create | DB table + RLS |
| `src/app/api/cook-log/route.ts` | Create | POST — create log entry |
| `src/app/api/cook-log/[id]/route.ts` | Create | PATCH — update with sheet data |
| `src/app/api/cook-log/upload-photo/route.ts` | Create | POST — upload to Supabase Storage |
| `src/app/api/cook-log/check/route.ts` | Create | GET — has user cooked this recipe today? |
| `src/app/api/plans/[id]/cook-entry/route.ts` | Modify | Also insert cook_log row; return logId |
| `src/components/cook-log-sheet.tsx` | Create | Bottom drawer: rating + note + photo + next_time |
| `src/app/(app)/recipes/[id]/cook-history.tsx` | Create | Server component: this recipe's cook log entries |
| `src/app/(app)/recipes/[id]/page.tsx` | Modify | Mount CookHistory; add "Log a cook" button (client island) |
| `src/app/(app)/recipes/[id]/log-cook-button.tsx` | Create | Client island: "Log a cook" button + CookLogSheet |
| `src/app/(app)/journal/page.tsx` | Create | Journal page: all cook log entries grouped by month |
| `src/app/(app)/journal/journal-entry-modal.tsx` | Create | Client: full-screen entry viewer + edit trigger |
| `src/app/(app)/plans/[id]/plan-builder.tsx` | Modify | Hydrate cooked state on mount; trigger CookLogSheet |
| `src/app/(app)/dashboard/cooking-history-widget.tsx` | Modify | Add latest cook row above heatmap |
| `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx` | Modify | "Done cooking" button → POST + CookLogSheet |
| `src/components/app-nav.tsx` | Modify | Add /journal to nav |
| `src/components/mobile-bottom-nav.tsx` | Modify | Add /journal to more items |

---

## Task 1: DB Migration — cook_log table

**Files:**
- Create: `supabase/migrations/20260518c_cook_log.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260518c_cook_log.sql
create table public.cook_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  recipe_id     uuid references public.recipes(id) on delete set null,
  recipe_title  text not null,
  cooked_at     timestamptz not null default now(),
  rating        smallint check (rating between 1 and 5),
  notes         text,
  next_time     text,
  photo_url     text,
  source        text not null default 'plan'
                check (source in ('plan', 'cooking_mode', 'recipe_page'))
);

create index cook_log_user_date on public.cook_log (user_id, cooked_at desc);
create index cook_log_recipe    on public.cook_log (recipe_id, cooked_at desc);

alter table public.cook_log enable row level security;

create policy "users manage own cook log"
  on public.cook_log
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration to local Supabase**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx supabase db push
```

Expected: migration applies without error. If Supabase CLI isn't linked, paste the SQL directly in Supabase Dashboard → SQL Editor.

- [ ] **Step 3: Verify table exists**

In Supabase Dashboard → Table Editor, confirm `cook_log` table is visible with all columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518c_cook_log.sql
git commit -m "feat(db): add cook_log table with RLS"
```

---

## Task 2: API — POST /api/cook-log

**Files:**
- Create: `src/app/api/cook-log/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/cook-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipe_id, recipe_title, source } = await req.json();
  if (!recipe_title) return NextResponse.json({ error: "recipe_title required" }, { status: 400 });

  const validSources = ["plan", "cooking_mode", "recipe_page"];
  const safeSource = validSources.includes(source) ? source : "recipe_page";

  const { data, error } = await supabase
    .from("cook_log")
    .insert({
      user_id: user.id,
      recipe_id: recipe_id ?? null,
      recipe_title,
      source: safeSource,
    })
    .select("id, cooked_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emit streak event (same pattern as cook-entry route)
  supabase.from("streak_events").insert({
    user_id: user.id,
    action_id: "recipe_cooked",
    day: new Date().toISOString().slice(0, 10),
  }).then(() => {}, () => {});

  return NextResponse.json({ id: data.id, cooked_at: data.cooked_at });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "cook-log"
```

Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cook-log/route.ts
git commit -m "feat(api): add POST /api/cook-log"
```

---

## Task 3: API — PATCH /api/cook-log/[id]

**Files:**
- Create: `src/app/api/cook-log/[id]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/cook-log/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["rating", "notes", "next_time", "photo_url"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Verify ownership via RLS — the update will simply return 0 rows if not owner
  const { data, error } = await supabase
    .from("cook_log")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  return NextResponse.json({ id: data.id });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cook-log/[id]/route.ts
git commit -m "feat(api): add PATCH /api/cook-log/[id]"
```

---

## Task 4: API — POST /api/cook-log/upload-photo

**Files:**
- Create: `src/app/api/cook-log/upload-photo/route.ts`

Note: This requires a `cook-photos` storage bucket in Supabase. Create it manually: Supabase Dashboard → Storage → New bucket → name `cook-photos`, toggle Public OFF.

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/cook-log/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const logId = formData.get("logId") as string | null;
  const fileName = logId ? `${user.id}/${logId}.${ext}` : `${user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("cook-photos")
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("cook-photos")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cook-log/upload-photo/route.ts
git commit -m "feat(api): add POST /api/cook-log/upload-photo"
```

---

## Task 5: API — GET /api/cook-log/check

**Files:**
- Create: `src/app/api/cook-log/check/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/cook-log/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ logged: false, logId: null });

  const { searchParams } = new URL(req.url);
  const recipe_id = searchParams.get("recipe_id");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!recipe_id || !date) {
    return NextResponse.json({ logged: false, logId: null });
  }

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data } = await supabase
    .from("cook_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipe_id)
    .gte("cooked_at", dayStart)
    .lte("cooked_at", dayEnd)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ logged: !!data, logId: data?.id ?? null });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cook-log/check/route.ts
git commit -m "feat(api): add GET /api/cook-log/check"
```

---

## Task 6: Extend cook-entry to insert cook_log + return logId

**Files:**
- Modify: `src/app/api/plans/[id]/cook-entry/route.ts`

- [ ] **Step 1: Read the current file**

Read `src/app/api/plans/[id]/cook-entry/route.ts` to find the exact location of the `streak_events` insert and the `return NextResponse.json({ deducted })` line.

- [ ] **Step 2: Add cook_log insert and update return value**

After the `streak_events` insert (near the bottom of the file), add a cook_log insert that awaits its result to capture the new log's id. Then update the return statement:

Find this block (near end of file):
```typescript
  // XA-4: emit recipe_cooked to shared streak_events table (HolyFlex reads this)
  supabase.from("streak_events").insert({
    user_id: user.id,
    action_id: "recipe_cooked",
    day: new Date().toISOString().slice(0, 10),
  }).then(() => {}, () => {});

  return NextResponse.json({ deducted });
```

Replace with:
```typescript
  // XA-4: emit recipe_cooked to shared streak_events table (HolyFlex reads this)
  supabase.from("streak_events").insert({
    user_id: user.id,
    action_id: "recipe_cooked",
    day: new Date().toISOString().slice(0, 10),
  }).then(() => {}, () => {});

  // Insert cook_log entry so plan entries can open the post-cook sheet
  let logId: string | null = null;
  const resolvedTitle = recipe_title ?? (recipe_id
    ? ((await supabase.from("recipes").select("title").eq("id", recipe_id).single()).data?.title ?? "")
    : "");
  if (resolvedTitle) {
    const { data: logRow } = await supabase
      .from("cook_log")
      .insert({
        user_id: user.id,
        recipe_id: recipe_id ?? null,
        recipe_title: resolvedTitle,
        source: "plan",
      })
      .select("id")
      .single();
    logId = logRow?.id ?? null;
  }

  return NextResponse.json({ deducted, logId });
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "cook-entry"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/plans/[id]/cook-entry/route.ts
git commit -m "feat(api): cook-entry now inserts cook_log and returns logId"
```

---

## Task 7: CookLogSheet component

**Files:**
- Create: `src/components/cook-log-sheet.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/cook-log-sheet.tsx
"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star, Camera, Loader2 } from "lucide-react";
import { springGentle } from "@/lib/motion";

interface CookLogSheetProps {
  logId: string;
  recipeTitle: string;
  open: boolean;
  onClose: () => void;
}

export function CookLogSheet({ logId, recipeTitle, open, onClose }: CookLogSheetProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("logId", logId);
    const res = await fetch("/api/cook-log/upload-photo", { method: "POST", body: form });
    const json = await res.json();
    if (json.url) setPhotoUrl(json.url);
    setUploading(false);
  }

  async function handleSave() {
    if (!rating) return;
    setSaving(true);
    const body: Record<string, unknown> = { rating };
    if (notes.trim()) body.notes = notes.trim();
    if (nextTime.trim()) body.next_time = nextTime.trim();
    if (photoUrl) body.photo_url = photoUrl;
    await fetch(`/api/cook-log/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
            style={{
              background: "#1C1209",
              borderTop: "1px solid rgba(58,36,22,0.8)",
              maxHeight: "85vh",
            }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={springGentle}
          >
            <div className="px-5 pt-5 pb-8 max-w-lg mx-auto flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5A3A28" }}>
                    How did it go?
                  </p>
                  <p className="text-base font-bold mt-0.5" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
                    {recipeTitle}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#5A3A28" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stars */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>Your rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <motion.button
                      key={n}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1"
                    >
                      <Star
                        className="w-7 h-7"
                        style={{
                          color: n <= (hoverRating || rating) ? "#F4A261" : "rgba(58,36,22,0.6)",
                          fill: n <= (hoverRating || rating) ? "#F4A261" : "transparent",
                          transition: "color 0.1s, fill 0.1s",
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it turn out?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{
                    background: "rgba(42,24,8,0.6)",
                    border: "1px solid rgba(58,36,22,0.6)",
                    color: "#EFE3CE",
                  }}
                />
              </div>

              {/* Photo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>Photo (optional)</label>
                {photoUrl ? (
                  <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 140 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Cook photo" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#EFE3CE" }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-6"
                    style={{ border: "1px dashed rgba(58,36,22,0.6)", color: "#5A3A28" }}
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <span className="text-xs">{uploading ? "Uploading…" : "Add a photo"}</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Next time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>Next time (optional)</label>
                <textarea
                  rows={2}
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  placeholder="What would you change next time?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{
                    background: "rgba(42,24,8,0.6)",
                    border: "1px solid rgba(58,36,22,0.6)",
                    color: "#EFE3CE",
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(42,24,8,0.5)", color: "#8A6A4A" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleSave}
                  disabled={!rating || saving || saved}
                  className="flex-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: saved ? "#4A8C5C" : "#C85A2F", color: "#fff" }}
                >
                  {saved ? "Logged ✓" : saving ? "Saving…" : "Save cook"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "cook-log-sheet"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/cook-log-sheet.tsx
git commit -m "feat(ui): add CookLogSheet bottom drawer component"
```

---

## Task 8: Wire CookLogSheet into plan-builder EntryRow

**Files:**
- Modify: `src/app/(app)/plans/[id]/plan-builder.tsx`

- [ ] **Step 1: Read EntryRow in plan-builder**

Read `src/app/(app)/plans/[id]/plan-builder.tsx` lines 940–1100 to understand the full `EntryRow` component structure, specifically where `handleMarkCooked` ends and how the cooked state is currently rendered.

- [ ] **Step 2: Add CookLogSheet import and new state**

Find the import block at the top of `plan-builder.tsx` and add:
```typescript
import { CookLogSheet } from "@/components/cook-log-sheet";
```

Inside `EntryRow`, find:
```typescript
const [cooked, setCooked] = useState(false);
const [cooking, setCooking] = useState(false);
```

Replace with:
```typescript
const [cooked, setCooked] = useState(false);
const [cooking, setCooking] = useState(false);
const [logId, setLogId] = useState<string | null>(null);
const [sheetOpen, setSheetOpen] = useState(false);

// Hydrate cooked state from server on mount
useEffect(() => {
  if (!entry.recipe_id) return;
  const today = new Date().toISOString().slice(0, 10);
  fetch(`/api/cook-log/check?recipe_id=${entry.recipe_id}&date=${today}`)
    .then(r => r.json())
    .then(({ logged, logId: id }: { logged: boolean; logId: string | null }) => {
      if (logged) { setCooked(true); setLogId(id); }
    })
    .catch(() => {});
}, [entry.recipe_id]);
```

- [ ] **Step 3: Update handleMarkCooked to capture logId and open sheet**

Find the existing `handleMarkCooked` function:
```typescript
async function handleMarkCooked(e: React.MouseEvent) {
  e.stopPropagation();
  if (cooked || cooking) return;
  setCooking(true);
  try {
    await fetch(`/api/plans/${planId}/cook-entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: entry.recipe_id, recipe_title: entry.recipe_title }),
    });
    setCooked(true);
  } catch { /* silent — pantry deduction is best-effort */ }
  setCooking(false);
}
```

Replace with:
```typescript
async function handleMarkCooked(e: React.MouseEvent) {
  e.stopPropagation();
  if (cooked || cooking) return;
  setCooking(true);
  try {
    const res = await fetch(`/api/plans/${planId}/cook-entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: entry.recipe_id, recipe_title: entry.recipe_title }),
    });
    const json = await res.json();
    setCooked(true);
    if (json.logId) {
      setLogId(json.logId);
      setSheetOpen(true);
    }
  } catch { /* silent — pantry deduction is best-effort */ }
  setCooking(false);
}
```

- [ ] **Step 4: Update the cooked visual state and add sheet mount**

Find where the fire button / cooked icon is rendered in `EntryRow` (around the `disabled={cooked || cooking}` line). Wrap the relevant card element with a `style` that applies the green left border when cooked, and change the button label:

Find:
```typescript
disabled={cooked || cooking}
title={cooked ? "Cooked — pantry updated" : "Mark as cooked (deducts from pantry)"}
```

Just after that button's closing tag (or the nearest enclosing wrapper element), add the CookLogSheet mount:
```typescript
{logId && (
  <CookLogSheet
    logId={logId}
    recipeTitle={entry.recipe_title}
    open={sheetOpen}
    onClose={() => setSheetOpen(false)}
  />
)}
```

Also add a green left-border style to the EntryRow card container when `cooked` is true. Find the outermost `div` of `EntryRow` (the one with `rounded-xl border`) and update its style:
```typescript
style={{
  borderColor: cooked ? "#4A8C5C" : "#3A2416",
  borderLeftWidth: cooked ? 4 : 1,
  background: "#1C1209",
}}
```

And replace the fire button label when cooked:
```typescript
{cooked ? (
  <span className="text-xs font-semibold" style={{ color: "#4A8C5C" }}>Cooked ✓</span>
) : (
  // existing fire button JSX
)}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "plan-builder"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/plans/\[id\]/plan-builder.tsx
git commit -m "feat(plans): persist cooked state across refreshes + open CookLogSheet"
```

---

## Task 9: LogCookButton — recipe page client island

**Files:**
- Create: `src/app/(app)/recipes/[id]/log-cook-button.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(app)/recipes/[id]/log-cook-button.tsx
"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { CookLogSheet } from "@/components/cook-log-sheet";

interface LogCookButtonProps {
  recipeId: string;
  recipeTitle: string;
}

export function LogCookButton({ recipeId, recipeTitle }: LogCookButtonProps) {
  const [logId, setLogId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    const res = await fetch("/api/cook-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, recipe_title: recipeTitle, source: "recipe_page" }),
    });
    const json = await res.json();
    setLogId(json.id);
    setSheetOpen(true);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "rgba(200,90,47,0.12)", color: "#C85A2F", border: "1px solid rgba(200,90,47,0.25)" }}
      >
        <BookOpen className="w-4 h-4" />
        {loading ? "Starting…" : "Log a cook"}
      </button>

      {logId && (
        <CookLogSheet
          logId={logId}
          recipeTitle={recipeTitle}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/log-cook-button.tsx
git commit -m "feat(recipe): add LogCookButton client island"
```

---

## Task 10: CookHistory server component

**Files:**
- Create: `src/app/(app)/recipes/[id]/cook-history.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(app)/recipes/[id]/cook-history.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star } from "lucide-react";

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="w-3 h-3"
          style={{ color: n <= rating ? "#F4A261" : "rgba(58,36,22,0.5)", fill: n <= rating ? "#F4A261" : "transparent" }}
        />
      ))}
    </div>
  );
}

export async function CookHistory({ recipeId, userId }: { recipeId: string; userId: string }) {
  const supabase = await createClient();

  const { data: entries, count } = await supabase
    .from("cook_log")
    .select("id, cooked_at, rating, notes, photo_url", { count: "exact" })
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .order("cooked_at", { ascending: false })
    .limit(5);

  if (!entries || entries.length === 0) return null;

  return (
    <section className="px-6 lg:px-10 py-6" style={{ borderBottom: "1px solid rgba(42,24,8,0.5)" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
          Your cook history
        </h2>
        {(count ?? 0) > 5 && (
          <Link href={`/journal?recipe=${recipeId}`} className="text-xs font-medium hover:opacity-80" style={{ color: "#C85A2F" }}>
            See all →
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start gap-3">
            {e.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.photo_url} alt="Cook photo" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#5A3A28" }}>
                  {new Date(e.cooked_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <StarRow rating={e.rating} />
              </div>
              {e.notes && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#8A6A4A" }}>
                  {e.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/cook-history.tsx
git commit -m "feat(recipe): add CookHistory server component"
```

---

## Task 11: Wire LogCookButton + CookHistory into recipe page

**Files:**
- Modify: `src/app/(app)/recipes/[id]/page.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/app/(app)/recipes/[id]/page.tsx`, add two imports after the existing component imports:

```typescript
import { CookHistory } from "./cook-history";
import { LogCookButton } from "./log-cook-button";
```

- [ ] **Step 2: Add LogCookButton near the recipe title area**

In the recipe page JSX, find the section that renders the recipe title and metadata (the `<h1>` block). After the existing star rating / review count row (or after the dietary tags row if there is one), add:

```typescript
<LogCookButton recipeId={id} recipeTitle={displayTitle} />
```

- [ ] **Step 3: Mount CookHistory below the description**

Find the `EnhancedDescriptionBlock` or the description paragraph in the JSX. After it (before the ingredients section), add:

```typescript
<CookHistory recipeId={id} userId={user!.id} />
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "recipes/\[id\]"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/page.tsx
git commit -m "feat(recipe): add LogCookButton and CookHistory to recipe page"
```

---

## Task 12: Journal page

**Files:**
- Create: `src/app/(app)/journal/page.tsx`
- Create: `src/app/(app)/journal/journal-entry-modal.tsx`

- [ ] **Step 1: Create the journal entry modal**

```typescript
// src/app/(app)/journal/journal-entry-modal.tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star } from "lucide-react";
import Link from "next/link";
import { springGentle } from "@/lib/motion";
import { CookLogSheet } from "@/components/cook-log-sheet";

interface JournalEntry {
  id: string;
  recipe_id: string | null;
  recipe_title: string;
  cooked_at: string;
  rating: number | null;
  notes: string | null;
  next_time: string | null;
  photo_url: string | null;
}

interface JournalEntryModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className="w-4 h-4" style={{ color: n <= rating ? "#F4A261" : "rgba(58,36,22,0.5)", fill: n <= rating ? "#F4A261" : "transparent" }} />
      ))}
    </div>
  );
}

export function JournalEntryModal({ entry, onClose }: JournalEntryModalProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.7)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-4 z-50 rounded-2xl overflow-y-auto"
            style={{ background: "#1C1209", border: "1px solid rgba(58,36,22,0.6)" }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={springGentle}
          >
            <div className="flex flex-col">
              {entry.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.photo_url} alt={entry.recipe_title} className="w-full object-cover rounded-t-2xl" style={{ maxHeight: 280 }} />
              )}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    {entry.recipe_id ? (
                      <Link href={`/recipes/${entry.recipe_id}`} className="text-lg font-bold hover:opacity-80" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
                        {entry.recipe_title}
                      </Link>
                    ) : (
                      <p className="text-lg font-bold" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>{entry.recipe_title}</p>
                    )}
                    <p className="text-xs" style={{ color: "#5A3A28" }}>
                      {new Date(entry.cooked_at).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <StarRow rating={entry.rating} />
                  </div>
                  <button onClick={onClose} className="p-2 rounded-lg shrink-0" style={{ color: "#5A3A28" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {entry.notes && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#5A3A28" }}>Notes</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#C8A882" }}>{entry.notes}</p>
                  </div>
                )}

                {entry.next_time && (
                  <div className="rounded-xl p-3" style={{ background: "rgba(42,24,8,0.5)", border: "1px solid rgba(58,36,22,0.4)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#5A3A28" }}>Next time</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#C8A882" }}>{entry.next_time}</p>
                  </div>
                )}

                <button
                  onClick={() => setEditOpen(true)}
                  className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(200,90,47,0.12)", color: "#C85A2F", border: "1px solid rgba(200,90,47,0.25)" }}
                >
                  Edit
                </button>
              </div>
            </div>

            <CookLogSheet
              logId={entry.id}
              recipeTitle={entry.recipe_title}
              open={editOpen}
              onClose={() => setEditOpen(false)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Create the journal page**

```typescript
// src/app/(app)/journal/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookOpen, Star } from "lucide-react";
import { JournalPageClient } from "./journal-page-client";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ recipe?: string }>;
}) {
  const { recipe: recipeFilter } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  let query = supabase
    .from("cook_log")
    .select("id, recipe_id, recipe_title, cooked_at, rating, notes, next_time, photo_url")
    .eq("user_id", user.id)
    .order("cooked_at", { ascending: false })
    .limit(50);

  if (recipeFilter) {
    query = query.eq("recipe_id", recipeFilter);
  }

  const { data: entries } = await query;

  return (
    <div className="wc-zone-home max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-5 h-5" style={{ color: "#C85A2F" }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
            My Kitchen Journal
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#5A3A28" }}>
            {entries?.length ?? 0} cook{(entries?.length ?? 0) !== 1 ? "s" : ""} logged
            {recipeFilter ? " for this recipe" : ""}
          </p>
        </div>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(58,36,22,0.4)" }}>
          <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "#3A2416" }} />
          <p className="text-sm font-semibold mb-1" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
            No cooks logged yet
          </p>
          <p className="text-xs" style={{ color: "#5A3A28" }}>
            Mark a meal as cooked from your plan, recipe page, or cooking mode.
          </p>
        </div>
      ) : (
        <JournalPageClient entries={entries} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the journal client component (handles modal + grouping)**

```typescript
// src/app/(app)/journal/journal-page-client.tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { JournalEntryModal } from "./journal-entry-modal";

interface JournalEntry {
  id: string;
  recipe_id: string | null;
  recipe_title: string;
  cooked_at: string;
  rating: number | null;
  notes: string | null;
  next_time: string | null;
  photo_url: string | null;
}

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className="w-3 h-3" style={{ color: n <= rating ? "#F4A261" : "rgba(58,36,22,0.5)", fill: n <= rating ? "#F4A261" : "transparent" }} />
      ))}
    </div>
  );
}

function groupByMonth(entries: JournalEntry[]): { label: string; entries: JournalEntry[] }[] {
  const groups: Map<string, JournalEntry[]> = new Map();
  for (const e of entries) {
    const label = new Date(e.cooked_at).toLocaleDateString("en", { month: "long", year: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(e);
  }
  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}

export function JournalPageClient({ entries }: { entries: JournalEntry[] }) {
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const groups = groupByMonth(entries);

  return (
    <>
      <div className="flex flex-col gap-8">
        {groups.map(({ label, entries: groupEntries }) => (
          <div key={label}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#5A3A28" }}>
              {label}
            </p>
            <div className="flex flex-col gap-3">
              {groupEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="w-full text-left rounded-2xl overflow-hidden transition-opacity hover:opacity-90"
                  style={{ background: "#1C1209", border: "1px solid rgba(58,36,22,0.5)" }}
                >
                  {entry.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.photo_url} alt={entry.recipe_title} className="w-full object-cover" style={{ maxHeight: 180 }} />
                  )}
                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="font-semibold text-sm" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
                      {entry.recipe_title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#5A3A28" }}>
                        {new Date(entry.cooked_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                      <StarRow rating={entry.rating} />
                    </div>
                    {entry.notes && (
                      <p className="text-xs leading-relaxed line-clamp-2 mt-0.5" style={{ color: "#8A6A4A" }}>
                        {entry.notes}
                      </p>
                    )}
                    {entry.next_time && (
                      <p className="text-xs mt-0.5" style={{ color: "#5A3A28" }}>
                        Next time: <span style={{ color: "#8A6A4A" }}>{entry.next_time}</span>
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <JournalEntryModal entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "journal"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/journal/
git commit -m "feat: add /journal page with entry modal and month grouping"
```

---

## Task 13: Add /journal to navigation

**Files:**
- Modify: `src/components/app-nav.tsx`
- Modify: `src/components/mobile-bottom-nav.tsx`

- [ ] **Step 1: Add journal to app-nav**

In `src/components/app-nav.tsx`, find the NAV_ITEMS array. Locate the pantry group item (the one with `href: "/pantry"`) and add `/journal` as a child item inside its `children` array:

```typescript
{ href: "/journal", label: "My Journal", icon: BookOpen, desc: "Your personal cook log" },
```

Note: `BookOpen` should already be imported. If not, add it to the lucide-react import at the top.

- [ ] **Step 2: Add journal to mobile-bottom-nav MORE_ITEMS**

In `src/components/mobile-bottom-nav.tsx`, find the `MORE_ITEMS` array and add:

```typescript
{ href: "/journal", label: "My Journal", icon: BookOpen },
```

Import `BookOpen` from `lucide-react` if not already imported.

- [ ] **Step 3: Commit**

```bash
git add src/components/app-nav.tsx src/components/mobile-bottom-nav.tsx
git commit -m "feat(nav): add /journal to app nav and mobile more menu"
```

---

## Task 14: Update dashboard cooking-history-widget with latest cook

**Files:**
- Modify: `src/app/(app)/dashboard/cooking-history-widget.tsx`

- [ ] **Step 1: Read the current file**

Read `src/app/(app)/dashboard/cooking-history-widget.tsx` to understand the current query and JSX structure.

- [ ] **Step 2: Add latest cook query and render it above the heatmap**

Add a second Supabase query to fetch the latest `cook_log` entry. Add it to the existing `const supabase = await createClient()` block, before the `streak_events` query:

```typescript
const { data: latestCook } = await supabase
  .from("cook_log")
  .select("id, recipe_title, recipe_id, cooked_at, rating, photo_url")
  .eq("user_id", userId)
  .order("cooked_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

Then in the JSX, inside the `<section>` and before the `{/* 30-day heatmap */}` comment, add:

```typescript
{latestCook && (
  <Link
    href="/journal"
    className="flex items-center gap-3 mb-4 p-3 rounded-xl hover:opacity-90 transition-opacity"
    style={{ background: "rgba(42,24,8,0.5)", border: "1px solid rgba(58,36,22,0.4)" }}
  >
    {latestCook.photo_url && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={latestCook.photo_url} alt={latestCook.recipe_title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold truncate" style={{ color: "#EFE3CE" }}>
        {latestCook.recipe_title}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "#5A3A28" }}>
        {new Date(latestCook.cooked_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
        {latestCook.rating ? ` · ${"★".repeat(latestCook.rating)}` : ""}
      </p>
    </div>
  </Link>
)}
```

Also add `Link` to the imports at the top if not already present (it is — `import Link from "next/link"` is already there).

- [ ] **Step 3: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "cooking-history-widget"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/dashboard/cooking-history-widget.tsx
git commit -m "feat(dashboard): show latest cook entry in cooking history widget"
```

---

## Task 15: Wire "Done cooking" into cooking mode

**Files:**
- Modify: `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx`

- [ ] **Step 1: Read the cooking mode nav bar area**

Read `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx` and search for the bottom nav bar section (around the Prev/Next SpringButton area). Note the exact structure and any existing state variables at the top of the component.

- [ ] **Step 2: Add state and handler for cook logging**

At the top of the `CookingModeScreen` component, alongside existing state declarations, add:

```typescript
const [logId, setLogId] = useState<string | null>(null);
const [logSheetOpen, setLogSheetOpen] = useState(false);
const [logging, setLogging] = useState(false);
```

Add the handler function (alongside `next`, `prev`, etc.):

```typescript
async function handleDoneCooking() {
  if (logging) return;
  setLogging(true);
  try {
    const res = await fetch("/api/cook-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipeId ?? undefined,
        recipe_title: recipeTitle,
        source: "cooking_mode",
      }),
    });
    const json = await res.json();
    if (json.id) {
      setLogId(json.id);
      setLogSheetOpen(true);
    }
  } catch { /* best-effort */ }
  setLogging(false);
}
```

Note: `recipeId` and `recipeTitle` should already be available as props on the component. Verify their exact prop names by reading the component signature.

- [ ] **Step 3: Add the "Done cooking" button to the nav bar**

In the bottom nav bar JSX (near the Prev/Next SpringButton components), add a "Done cooking" button as a secondary action. Place it between/beside the existing nav controls:

```typescript
<SpringButton
  onClick={handleDoneCooking}
  disabled={logging}
  className="px-4 py-2 rounded-xl text-xs font-semibold"
  style={{ background: "rgba(74,140,92,0.15)", color: "#4A8C5C", border: "1px solid rgba(74,140,92,0.3)" }}
>
  {logging ? "Logging…" : "Done cooking"}
</SpringButton>
```

- [ ] **Step 4: Mount CookLogSheet**

At the bottom of the cooking mode component's JSX (before the closing fragment/div), add:

```typescript
{logId && (
  <CookLogSheet
    logId={logId}
    recipeTitle={recipeTitle}
    open={logSheetOpen}
    onClose={() => setLogSheetOpen(false)}
  />
)}
```

Add the import at the top of the file:
```typescript
import { CookLogSheet } from "@/components/cook-log-sheet";
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "cooking-mode-screen"
```

Expected: no errors.

- [ ] **Step 6: Final full TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | tail -5
```

Expected: exit 0, only pre-existing errors (if any) in test files.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/cooking-mode-screen.tsx
git commit -m "feat(cooking-mode): add Done cooking button + CookLogSheet"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `cook_log` table + RLS | Task 1 |
| POST /api/cook-log | Task 2 |
| PATCH /api/cook-log/[id] | Task 3 |
| POST /api/cook-log/upload-photo | Task 4 |
| GET /api/cook-log/check | Task 5 |
| Extend cook-entry → logId | Task 6 |
| CookLogSheet (all fields + animation) | Task 7 |
| Plan entry persistence + green border | Task 8 |
| Recipe page "Log a cook" button | Tasks 9 + 11 |
| CookHistory server component | Tasks 10 + 11 |
| Journal page + month grouping | Task 12 |
| JournalEntryModal + edit | Task 12 |
| /journal in nav | Task 13 |
| Dashboard latest cook row | Task 14 |
| Cooking mode "Done cooking" button | Task 15 |
| streak_events emitted from POST /api/cook-log | Task 2 ✓ |

All spec requirements covered.

**Placeholder scan:** No TBDs, no "implement later", no vague steps. All code blocks are complete.

**Type consistency:** `JournalEntry` interface is defined in `journal-entry-modal.tsx` and `journal-page-client.tsx` separately (both identical inline) — acceptable since they're in the same directory and the type is small. `CookLogSheetProps.logId: string` matches all call sites which set `logId` only after confirming `json.id` is truthy. `StarRow` component defined locally in three files — acceptable duplication given the files are small.
