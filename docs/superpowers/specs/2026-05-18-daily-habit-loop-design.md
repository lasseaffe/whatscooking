# Daily Habit Loop — Sprint A Design Spec
**Date:** 2026-05-18  
**Project:** What's Cooking (`C:\Users\lasse\Desktop\whatscooking`)  
**Scope:** Cook log (food journal), post-cook capture sheet, meal plan execution persistence, recipe page cook history, journal page

---

## Problem

The app tracks *that* you cooked (heatmap dot, streak counter) but not *how it went*. Meal plan "mark cooked" resets on refresh. There is no journal. The daily cooking loop has no satisfying close — you cook, the app forgets.

---

## Goals

1. Every cook is permanently logged with optional richness (rating, note, photo, "next time")
2. The post-cook moment feels deliberate — a brief reflection sheet, not silent fire-and-forget
3. Logged cooks are readable in two places: on the recipe page (this dish's history) and in a global journal
4. Meal plan entries visually persist their "cooked" state across refreshes

---

## Out of Scope

- Push notifications (deferred to a later sprint)
- Multi-photo per cook (single photo_url is sufficient; can widen to array later)
- Social sharing of journal entries (Sprint C)
- Editing historical entries beyond the initial sheet (can add later)

---

## Data Layer

### New table: `cook_log`

**Migration:** `supabase/migrations/20260518c_cook_log.sql`

```sql
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

### Supabase Storage

Bucket: `cook-photos`  
Access: private (served via signed URL or user-scoped public path)  
Path pattern: `{user_id}/{log_id}.{ext}`

---

## API Layer

### `POST /api/cook-log`
Creates a new cook log entry. Called from cooking mode and recipe page.

**Body:** `{ recipe_id?: string; recipe_title: string; source: 'cooking_mode' | 'recipe_page' }`  
**Returns:** `{ id: string; cooked_at: string }`  
Also emits `streak_events` row (`action_id: 'recipe_cooked'`) — same as the plan cook-entry route does today.

### `PATCH /api/cook-log/[id]`
Updates an existing entry with post-cook sheet data.

**Body:** `{ rating?: number; notes?: string; next_time?: string; photo_url?: string }`  
**Returns:** `{ id: string }`

### `POST /api/cook-log/upload-photo`
Uploads a photo to Supabase Storage and returns the public URL.

**Body:** `multipart/form-data` with `file` field  
**Returns:** `{ url: string }`  
Validates: image only, max 5MB.

### Extend `POST /api/plans/[id]/cook-entry`
Add `cook_log` insert alongside the existing pantry deduction + streak emit.  
**Response change:** add `logId: string` to the returned JSON so the client can open the post-cook sheet pre-wired.

---

## Components

### `CookLogSheet` — `src/components/cook-log-sheet.tsx`
Client component. Bottom drawer that slides up after any "mark cooked" action.

**Props:**
```ts
interface CookLogSheetProps {
  logId: string;
  recipeTitle: string;
  open: boolean;
  onClose: () => void;
}
```

**Animation:** `AnimatePresence` + `motion.div` entering from `y: 60, opacity: 0` → `y: 0, opacity: 1` using `springGentle` from `@/lib/motion`. Full-width, max-height 85vh, rounded top corners, dark walnut background (`#1C1209`), border-top `rgba(58,36,22,0.8)`.

**Fields (in order):**
1. **Star rating** — 5 tappable `motion.button` stars. Required before Save is enabled. Active star: `#F4A261`. Empty: `rgba(58,36,22,0.6)`.
2. **Note** — `textarea`, 3 rows, placeholder "How did it turn out?", optional.
3. **Photo** — file input styled as a dashed upload zone. On select: calls `/api/cook-log/upload-photo`, shows thumbnail preview on success. Optional.
4. **Next time** — `textarea`, 2 rows, placeholder "What would you change next time?", optional. Rendered with a subtle label "Next time" in muted text above it.

**Actions:**
- **Save** — PATCHes `/api/cook-log/[id]` with all filled fields. Disabled until rating is set. On success: closes sheet, shows a brief toast "Cook logged".
- **Skip** — closes sheet without PATCHing. The bare `cook_log` row (with just `cooked_at`) already exists from the initial POST.

**Trigger points:**
- Plan `EntryRow` — after successful `cook-entry` response, receives `logId`, opens sheet
- Cooking mode — "Done cooking" button in nav bar POSTs to `/api/cook-log` then opens sheet
- Recipe page — "Log a cook" button POSTs then opens sheet

---

### `CookHistory` — `src/app/(app)/recipes/[id]/cook-history.tsx`
Server component. Fetches `cook_log` rows where `recipe_id = X AND user_id = current`.

**Renders:** chronological list (newest first), max 5 entries. Each entry: date, star row, note snippet (truncated at 80 chars), photo thumbnail (40×40px rounded) if present.

**Placement:** recipe detail page, below description, above ingredients section.

**Empty state:** renders nothing (returns null) — no empty state needed here.

**"See all" link:** appears if `count > 5`, links to `/journal?recipe={id}`.

---

### Journal page — `src/app/(app)/journal/page.tsx`
Server component. Fetches last 50 `cook_log` entries for the user, ordered by `cooked_at desc`.

**URL param:** `?recipe={id}` filters to a single recipe's history.

**Layout:**
- Page header: "My Kitchen Journal" (Fraunces, `#EFE3CE`) + entry count
- Entries grouped by month with sticky month label headers (`#5A3A28`, small caps)
- Each entry card: photo (if present, full-width rounded image top), recipe title, date, star rating, note, "Next time:" section if `next_time` is set
- Clicking an entry opens a full-screen modal (`JournalEntryModal`) with large photo, full notes, and an "Edit" button that re-opens `CookLogSheet`

**Navigation:** added to app nav alongside existing pages.

---

### `JournalEntryModal` — `src/app/(app)/journal/journal-entry-modal.tsx`
Client component. Full-screen overlay for reading a single journal entry.

**Content:** large photo (if present), recipe title linking to `/recipes/[id]`, full notes, "Next time" section, rating stars, date.  
**Edit button:** re-opens `CookLogSheet` with the existing `logId`.

---

### Dashboard widget update — `src/app/(app)/dashboard/cooking-history-widget.tsx`
Add a "latest cook" row above the 30-day heatmap.

Queries: `SELECT * FROM cook_log WHERE user_id = X ORDER BY cooked_at DESC LIMIT 1`

**Renders:** photo thumbnail (if present) + recipe title + date + star rating. Clicking links to `/journal`. Hidden if no logs exist.

---

### Meal plan `EntryRow` persistence — `src/app/(app)/plans/[id]/plan-builder.tsx`

**On mount:** each `EntryRow` fetches `/api/cook-log/check?recipe_id={id}&date={today}` (new lightweight GET) to hydrate initial cooked state. If a log entry exists for today, renders as permanently green without waiting for user action.

**Visual change after marking cooked:**
- Card gets a green left border (`4px solid #4A8C5C`)
- Fire button replaced with "Cooked today ✓" text label in `#4A8C5C`
- `CookLogSheet` opens automatically with the returned `logId`

### `GET /api/cook-log/check`
**Query params:** `recipe_id`, `date` (ISO date string)  
**Returns:** `{ logged: boolean; logId: string | null }`  
Used by `EntryRow` on mount to hydrate persisted state.

---

## File Summary

| File | Status |
|---|---|
| `supabase/migrations/20260518c_cook_log.sql` | New |
| `src/app/api/cook-log/route.ts` | New (POST) |
| `src/app/api/cook-log/[id]/route.ts` | New (PATCH) |
| `src/app/api/cook-log/upload-photo/route.ts` | New (POST) |
| `src/app/api/cook-log/check/route.ts` | New (GET) |
| `src/app/api/plans/[id]/cook-entry/route.ts` | Extend (add log insert + return logId) |
| `src/components/cook-log-sheet.tsx` | New |
| `src/app/(app)/recipes/[id]/cook-history.tsx` | New |
| `src/app/(app)/recipes/[id]/page.tsx` | Extend (mount CookHistory, Log a cook button) |
| `src/app/(app)/journal/page.tsx` | New |
| `src/app/(app)/journal/journal-entry-modal.tsx` | New |
| `src/app/(app)/plans/[id]/plan-builder.tsx` | Extend (persistence + CookLogSheet trigger) |
| `src/app/(app)/dashboard/cooking-history-widget.tsx` | Extend (latest cook row) |
| `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx` | Extend (Done cooking → POST + CookLogSheet) |

---

## Connectivity Checklist

- [x] `cook_log` writes also emit `streak_events` (cross-tool: HolyFlex reads these)
- [x] All three surfaces (plan, cooking mode, recipe page) write to the same `cook_log` table
- [x] Dashboard widget reads from `cook_log` (not just `streak_events`)
- [x] Recipe page reads from `cook_log` (per-recipe history)
- [ ] Push notification trigger on cook log write — deferred to push sprint
- [ ] Social sharing of cook log entries — deferred to Sprint C

---

## Verification Checklist

1. Mark a plan entry as cooked → post-cook sheet slides up → fill in rating + note + photo → Save → sheet closes → entry shows green "Cooked today ✓" on refresh
2. Enter cooking mode on any recipe → tap "Done cooking" in nav → sheet slides up → Skip → `cook_log` row exists with just `cooked_at`
3. Visit `/recipes/[id]` → tap "Log a cook" → fill sheet → Save → scroll down past description → cook history entry appears
4. Visit `/journal` → see all cook log entries grouped by month → click entry → modal opens with full notes + photo
5. Visit `/dashboard` → cooking history widget shows most recent cook at top
6. Cook same recipe twice → recipe page shows both entries in history
