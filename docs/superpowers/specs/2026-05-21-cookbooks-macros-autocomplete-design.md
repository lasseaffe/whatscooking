# Design Spec — Cookbooks Social + Macro Accordion + Autocomplete Fix
**Date:** 2026-05-21  
**Branch:** feat/streaks-today-push  
**Scope:** What's Cooking (`C:\Users\lasse\Desktop\whatscooking`)

---

## Context

Three independent UX problems identified from screenshots:

1. **Cookbooks page** has no social layer — all cookbooks shown as equals, cover placeholders are solid-colour blocks, no way to follow creators.
2. **Meal plan macro summary** shows only week-level totals with no per-day or per-person breakdown.
3. **Recipe search autocomplete** dropdown is clipped by parent overflow in the Pinboard layout.

---

## Feature 1 — Cookbooks Social Layer

### Schema additions

```sql
-- profiles_follows: simple directed follow graph
create table public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);
-- RLS: users manage their own follows; read is public
```

No changes to `cookbooks` table.

### Page layout — Unified Grid with Tab Filters

Replace the current filter row (`All / Free / Paid / Newest / Trending`) with:

```
[Following] [Trending] [Newest] [Free] [Paid]     [+ New Cookbook]
```

- **Following tab** (default when user follows anyone): shows only cookbooks by followed creators, sorted by `updated_at` desc.
- **Trending / Newest / Free / Paid**: show all published cookbooks, same logic as today.
- When user follows nobody, default to **Trending** tab and show a soft "Discover creators to follow" prompt inside the Following tab.

### Cookbook card — follow button

Each card gains a `+ Follow` / `Following ✓` button in the bottom-right of the card body, next to recipe count. Clicking follows/unfollows the cookbook's creator. Optimistic update; rollback on error.

### Cover image fallback — B + A on hover

- **Default (no `cover_image_url`):** gradient using `theme_color` + large emoji derived from the cookbook's primary cuisine tag.
- **On hover:** CSS `transition` cross-fades to a 2×2 collage of the first 4 recipe images from `cookbook_recipes` joined to `recipes.image_url`. Falls back gracefully to gradient if fewer than 4 recipe images exist.

Implementation: render both layers stacked, hover triggers `opacity` transition on the collage layer.

### Files to change
- `src/app/(app)/cookbooks/cookbooks-client.tsx` — tab filters, card grid, follow button
- `src/components/cookbook-cover.tsx` — dual-layer cover (gradient + hover collage)
- New migration: `supabase/migrations/YYYYMMDD_profile_follows.sql`
- New API route: `src/app/api/cookbooks/follow/route.ts` (POST/DELETE)

---

## Feature 2 — Per-Day Per-Person Macro Accordion

### Design

**Always visible:** 4 week-total macro cards (Energy / Protein / Carbs / Fat) above the WeaveGrid. These show totals for the full plan divided by `person_count`. Cards are non-interactive when intake tracking is off.

**Gated accordion:** When any gate below is true, each card becomes clickable. Clicking expands a full-width panel below all 4 cards showing that macro's per-day breakdown as a horizontal bar chart (one row per day, bars sized relative to the week max, value label on right). Grid column headers simultaneously switch to display that macro's per-day value instead of kcal. Clicking again collapses.

**Gate conditions (any one unlocks):**
1. `plan.nutritional_goals` is non-empty (user set calorie/macro targets).
2. `plan.track_intake = true` (per-plan opt-in toggle, shown in plan settings).
3. `profile.track_intake = true` (global setting in user Settings page).

If no gate is met, cards render without chevron, no hover affordance, no clickable state.

**Person count control:** inline `−  2 people  +` stepper rendered in the macro panel header. Stored as `meal_plans.person_count` (integer, default 1). Division happens client-side: `dayTotal / person_count`.

### Schema additions

```sql
-- meal_plans
alter table public.meal_plans
  add column if not exists person_count integer not null default 1,
  add column if not exists track_intake boolean not null default false;

-- profiles
alter table public.profiles
  add column if not exists track_intake boolean not null default false;
```

### Calculation

Per-day totals are derived from the existing `ProposedEntry[]` client-side array by grouping on `day_number` and summing macros for entries where `is_leftover = false`. No new API needed.

```ts
// lib/plans/macros.ts — add:
export function aggregateByDay(entries: ProposedEntry[]): Record<number, MacroTotals> { ... }
```

### Files to change
- `supabase/migrations/YYYYMMDD_plan_person_count.sql`
- `src/lib/plans/macros.ts` — add `aggregateByDay`
- `src/components/plans/MacroSummary.tsx` — accordion UI, person count stepper, gate logic
- `src/app/(app)/plans/[id]/page.tsx` — pass `profile.track_intake` down
- `src/app/(app)/settings/page.tsx` — add global track_intake toggle
- Plan settings UI — add per-plan track_intake toggle (wherever plan metadata is edited)

---

## Feature 3 — Autocomplete Dropdown Fix

### Root cause

`RecipeSearchBar.tsx` renders the results `<ul>` with `position: absolute; top: full`. A parent in the Pinboard layout has `overflow: hidden`, clipping the dropdown before it reaches the viewport edge.

### Fix — React Portal with `getBoundingClientRect`

Render the `<ul>` into `document.body` via `ReactDOM.createPortal`. On open, read the input's bounding rect and set `position: fixed` coordinates:

```tsx
const rect = containerRef.current.getBoundingClientRect();
style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }}
```

Add a `useEffect` cleanup that repositions on scroll/resize while the dropdown is open (passive event listeners, removed on close). Add `max-height: 320px; overflow-y: auto` to the `<ul>` so long result lists scroll rather than extending off-screen.

### Files to change
- `src/components/plans/RecipeSearchBar.tsx` — portal render, rect-based positioning, max-height scroll

---

## Verification

1. **Cookbooks social:** Log in, follow a creator → Following tab shows their cookbooks. Hover a cover → collage animates in. Unfollow → card updates immediately.
2. **Macro accordion:** Create a plan with no goals → macro cards render, no chevron. Set a calorie goal → chevron appears, click Protein → bar chart expands, grid headers show protein values per day. Toggle person count 1→2 → all values halve.
3. **Autocomplete:** In plan builder Pinboard, type "pasta" → results dropdown renders fully visible, scrollable, not clipped. Resize window → dropdown repositions correctly.
