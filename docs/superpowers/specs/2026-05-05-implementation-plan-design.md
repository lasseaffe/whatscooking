# What's Cooking — Implementation Plan Design Spec
**Date:** 2026-05-05  
**Scope:** 8 feature areas from implementation plan document

---

## Context

This spec consolidates all items from the 5 May 2026 implementation plan document. The app is a sophisticated meal-planning companion with 5 switchable palettes, Supabase backend, dnd-kit drag-and-drop, and Next.js App Router. The changes range from quick UX fixes to structural page merges to new collaborative features.

---

## Area 1 — Recipe Page: Mobile Improvements

**Problem:** On mobile, the layout is cramped, the "Start Cooking" CTA is not sticky, the servings control is misplaced, the time-breakdown bar takes too much space, phase navigation doesn't allow free jumping, and the SOS helper name is generic.

**Files to change:**
- `src/app/(app)/recipes/[id]/page.tsx`
- `src/app/(app)/recipes/[id]/recipe-columns-client.tsx`
- `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx`
- `src/components/time-breakdown-bar.tsx`
- `src/components/sos-cooking-helper.tsx`

**Design:**

### Layout reorder (mobile)
On `< lg` breakpoints, render in this order:
1. Recipe image (full width, ~250px tall)
2. Title, description, calories, servings-served label
3. Servings `+/-` control (immediately below "serves X" label — move `ServingControl` out of the ingredients panel)
4. `TimeBreakdownBar`
5. Ingredients (full width)
6. Instructions (full width, scrollable below ingredients)

On desktop, the existing two-column sticky layout is unchanged.

### Time breakdown bar — mobile compact mode
When viewport `< lg`, render the breakdown as a compact horizontal pill row instead of the full segmented bar. Each phase shows only its emoji + duration (e.g. 🔪 15m). Clicking a pill still scrolls to that step.

### Sticky "Start Cooking" CTA
- On mobile, position the `CookingModeCTA` as `fixed bottom-4 left-1/2 -translate-x-1/2` (center-bottom floating pill).
- It stays visible while scrolling until the user reaches the comments section.
- Use an `IntersectionObserver` on a sentinel `div` placed just above comments: when the sentinel enters viewport, switch the button to `position: static` so it flows back into the page naturally.
- On desktop, keep existing behavior (right-panel placement).

### Phase navigation — free jumping
In `recipe-columns-client.tsx`, the `PhaseStepper` currently auto-advances. Add `onClick` handlers to each phase pill so clicking any phase tab (I Prep / II Cook / III Serve etc.) immediately renders that phase's content. No blocking the jump — allow backward and forward navigation freely.

### SOS Helper rename + cleanup
- Rename "SOS Helper" → **"The Kitchen Oracle"** everywhere (component display text only — not the component filename, to avoid breaking imports).
- Remove the floating `SOSCookingHelper` CTA button from `page.tsx` (line ~259) since the inline per-step SOS is already present in `recipe-columns-client.tsx`. The floating button is redundant.
- Add the hover tooltip (title attribute) to the inline per-step SOS trigger button in `recipe-columns-client.tsx` that currently lacks it.

---

## Area 2 — World Cup / Cuisines: Routing Fixes

**Problem:** `/cuisines/american` returns 404. The expected URL pattern should always be `/cuisines/[continent]/[country]` but currently the `[slug]` route at `/cuisines/[slug]` handles direct-slug cuisines. Some country slugs don't map to cuisine `dbValues`.

**Files to change:**
- `src/app/(app)/cuisines/[slug]/page.tsx`
- `src/lib/cuisines.ts` (or wherever `getCuisineBySlug` and cuisine definitions live)
- `src/app/(app)/cuisines/world-cup-2026/[country]/page.tsx`

**Design:**

### Slug normalization
In `getCuisineBySlug()`, add a fallback: if no cuisine matches directly, try matching against a `aliases` map that maps common country-name slugs → cuisine keys:
```
"american" → "north-american" or map to USA entry
"english" → "british"
```
This handles legacy/bookmarked URLs without a redirect cascade.

### URL pattern standardization
The user's stated pattern is `/cuisines/[continent]/[country]`. For World Cup, this already works at `/cuisines/world-cup-2026/[country]`. For general cuisines, the existing `/cuisines/[slug]` is fine — the "continent/country" pattern only applies to WC 2026 pages.

The fix is: ensure every country card/link on the cuisines hub renders a URL that the `[slug]` route can resolve. Audit `src/app/(app)/cuisines/page.tsx` for any links that generate a slug not in `getCuisineBySlug`'s lookup table, and add those slugs/aliases.

### World Cup country pages
`/cuisines/world-cup-2026/[country]/page.tsx` uses `generateStaticParams()` from `WC2026_NATIONS`. Verify every nation slug in that array maps to real recipe data. Any nation with 0 recipes gets a branded "Coming Soon — recipes in progress" empty state (never a blank page or raw 404).

---

## Area 3 — All Recipes Page: Empty State + Utensil Filter

**Problem:** `/recipes` shows 0 entries. The utensil filter exists in `filter-drawer.tsx` but isn't surfaced in the `all-recipes-client.tsx` UI. Utensil filtering should work both positively (has utensil) and negatively (lacks utensil → adapt/substitute).

**Files to change:**
- `src/app/(app)/recipes/all-recipes-client.tsx`
- `src/app/(app)/recipes/page.tsx` (server component — check DB query)
- `src/components/filter-drawer.tsx`

**Design:**

### Fix empty state
In `src/app/(app)/recipes/page.tsx`, the server component filters out `dish_types` containing "hack" or "premium". Check whether this filter accidentally excludes all recipes (e.g. if `dish_types` is null for all rows). Add a fallback: if the filtered query returns 0 results, re-query without the dish_type exclusion so the page always has content.

Also add a proper branded empty state component: an illustrated plate icon + "No recipes match your filters" copy + "Clear filters" CTA. Never render a blank `div`.

### Utensil filter in All Recipes UI
The `FilterDrawer` already has 11 utensil options defined. Wire them into `all-recipes-client.tsx`:
1. Add `utensilFilters: string[]` to the client's filter state.
2. Pass `utensilFilters` down to `FilterDrawer` and read them back via the drawer's `onApply` callback.
3. In the recipe list rendering, filter displayed recipes by:
   - **Positive mode** (has utensil): show only recipes where `required_utensils` includes the selected utensil.
   - **Negative/Adapt mode** (no utensil): hide recipes requiring that utensil, OR show them with an "Adapt" badge indicating substitution is available (using the existing adapted-ingredients engine).
4. Add a "Utensils" chip to the active-filter chips row so users see and can clear utensil filters.

---

## Area 4 — Meal Plans: Unified Grid/List View

**Problem:** Two separate flows exist — `plans/new/` (template picker → weekly-grid) and `plans/[id]/` (plan-builder list). The user wants grid as the default view everywhere, with list as a toggle, on a single unified page. Drag-and-drop on the grid "big cards" doesn't work. Clicking `+` on empty grid slots should show recipe suggestions. Users should be able to add rows (meal types) and columns (days/weeks).

**Files to change:**
- `src/app/(app)/plans/[id]/page.tsx`
- `src/app/(app)/plans/[id]/plan-builder.tsx`
- `src/app/(app)/plans/new/weekly-grid.tsx`
- `src/app/(app)/plans/new/dnd-builder.tsx` (merge logic into plan-builder)
- `src/app/(app)/plans/plans-client.tsx`

**Design:**

### Unified page
`plans/[id]/page.tsx` becomes the single plan editing surface. It renders:
- A view toggle (grid icon / list icon) in the header — state persisted in `localStorage`.
- **Grid view** (default): the `WeeklyGrid` component from `plans/new/weekly-grid.tsx`, promoted to the primary editing mode. Refactor it to accept `planEntries` from the database and write back changes.
- **List view**: the existing `PlanBuilder` component, unchanged visually.

The `plans/new/` template flow still exists for plan creation but after confirming a template, redirects to `plans/[id]/` (the unified editor) rather than staying in the new-plan flow.

### Drag-and-drop on grid cards
The grid "big cards" need `@dnd-kit` drag sources added. Each occupied slot in `WeeklyGrid` becomes a `<Draggable>` item. Dropping onto another slot calls the existing `meal_entries` update API. Dragging outside the grid (to trash zone) deletes the entry.

### Empty slot click → recipe suggestions
When clicking `+` on an empty grid slot:
1. If the slot has a meal type (e.g. Snack/Dessert), open a slide-over showing recipes filtered by that category.
2. If no meal type, show all recipes with a search input.
3. Clicking a recipe in the slide-over adds it to that slot (creates a `meal_entry`).
4. Optionally type a free-text meal name (no recipe link required).

### Add rows/columns
- **Add column (day):** A `+` button after the last day column appends a new day. For weekly plans, this extends to day 8, 9… (up to 14 for a 2-week plan).
- **Add row (meal type):** A `+` button below the last meal row opens a small input to name the new meal type (pre-fills: Breakfast, Lunch, Dinner, Snack, Appetizer, Dessert). Category is optional — if left blank, the slot shows "Meal" and suggestions show all recipes.

### Meal prep enhancements (bonus ideas to include)
- **Batch cook indicator:** On the grid, if the same recipe appears 3+ times in a week, show a "🍳 Batch cook" badge suggesting making it all at once.
- **Prep day planner:** A "Set prep day" option (defaulting to Sunday) that aggregates all ingredient quantities across the week into a single shopping/prep list.
- **Macro week view:** A weekly macro bar (protein/carbs/fat totals) visible at the top of the grid, pulling from existing calorie-tracker data.

---

## Area 5 — Pantry: Design Fix + Shared Pantry

**Problem:** The pantry UI doesn't match the intended design (as shown in screenshots). No shared pantry feature exists.

**Files to change:**
- `src/app/(app)/pantry/pantry-client.tsx`
- Supabase schema (new `shared_pantries` and `shared_pantry_members` tables)
- `src/app/api/pantry/` routes

**Design:**

### Design fix
Apply the design from the referenced screenshots:
- Category grouping with emoji headers matching `ingredient_categories`
- Card-style item rows (not flat list) with quantity badge, expiry indicator
- Section headers sticky as user scrolls (e.g. "🥩 Proteins", "🥦 Produce")
- Empty category sections hidden by default, shown via `+ Add [category]` quick-add

### Shared pantry feature
**Data model additions:**
```sql
shared_pantries (id, name, created_by, created_at)
shared_pantry_members (pantry_id, user_id, role: 'owner'|'editor'|'viewer', joined_at)
shared_pantry_items (id, pantry_id, name, quantity, unit, category_id, added_by, updated_at)
```

**UX flow:**
1. In pantry settings, a "Shared Pantry" section with "Create shared pantry" or "Join with code" buttons.
2. Creating generates a 6-character invite code (stored on `shared_pantries`).
3. Members see the shared pantry as a second tab alongside "My Pantry".
4. Any member can add/edit/remove items (editor role). Viewer role is read-only.
5. Real-time sync via Supabase Realtime subscriptions on `shared_pantry_items`.
6. PantryScramble works on the shared pantry too (suggests recipes based on combined ingredients).

---

## Area 6 — Navigation Sidebar Reorder

**Problem:** User wants a specific category order with fusion foods and world cup as sub-items under world cuisines (not under "All Recipes").

**Files to change:**
- `src/components/app-nav.tsx`

**Target structure:**
```
DISCOVER
├── Discover (root /discover)
├── Meal Swipe (/swipe)
└── World Cuisines (/cuisines)  ← parent with flyout
    ├── Fusion Foods (/cuisines/fusion)  ← NEW
    └── World Cup 2026 (/cuisines/world-cup-2026)  ← moved here

(All Recipes becomes its own top-level item under Discover, not a parent)
```

**All Recipes** moves to be a direct nav item under Discover (no flyout needed since its children are now under World Cuisines).

The rest of the groups (Plan & Host, Kitchen) remain unchanged.

---

## Area 7 — Page Merges: Landing + Dashboard, Discover Restructure

**Problem:** `localhost:3002`, `/discover`, and `/dashboard` serve overlapping purposes. User wants: root page = marketing hero + dashboard content below; `/discover` = meal swipe + world cuisines + all recipes (no separate `/swipe` page).

**Files to change:**
- `src/app/page.tsx` (root landing)
- `src/app/(app)/discover/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/swipe/page.tsx` (redirect to `/discover`)

**Design:**

### Root page merge
`src/app/page.tsx` keeps its hero video section. Directly below it (after the fold), render the dashboard content: trending recipes grid, cuisine scroll row, "Hot Right Now" section — currently only in the `(app)/dashboard/` route. For non-authed users, show a simplified version (static trending recipes). For authed users, show personalized content.

### Discover restructure
`/discover` becomes the hub for browsing/finding food:
1. **Meal Swipe** section at the top — embed `SwipeClient` as a section (not full-screen; card stack with limited height, maybe 500px, with swipe gestures).
2. **World Cuisines** horizontal scroll below.
3. **All Recipes** grid below that (with filters).

The route `/swipe` adds a `redirect('/discover')` at the top so existing bookmarks don't 404.

`/dashboard` redirects to root `/` since dashboard content now lives there.

---

## Area 8 — Dark Grey Rectangles Removal

**Problem:** Dark grey rectangles visible in the nav/layout area (screenshot referenced but not viewable — likely feature cards or section backgrounds).

**Files to change:**
- `src/app/page.tsx` (lines ~287-299 and ~361-373 — bordered accent blocks)
- Possibly `src/components/app-nav.tsx`

**Design:**
Audit `src/app/page.tsx` for `bg-[#...]` or `background:` inline styles using dark grey (`#333`, `#444`, `#555`, `#666`, `#999`, `#aaa` range). Replace with theme token `var(--bg-secondary)` or `var(--wc-surface-1)` so they respect the active palette instead of being hardcoded grey.

---

## Implementation Order

Execute these in order (dependencies first):

1. **Area 6** — Nav reorder (5 min, no deps)
2. **Area 8** — Dark grey rectangles (10 min, no deps)
3. **Area 3** — All Recipes empty state + utensil filter (1–2 hrs)
4. **Area 2** — Cuisines routing fixes (1–2 hrs)
5. **Area 1** — Recipe page mobile improvements (2–3 hrs)
6. **Area 7** — Page merges (2–3 hrs, depends on discover content being available)
7. **Area 4** — Meal plans unification (3–4 hrs, largest)
8. **Area 5** — Shared pantry (3–4 hrs, requires schema migration)

---

## Verification

- **Mobile layout:** Open each recipe page in Chrome DevTools at 390px width; confirm image → title → servings → time bar → ingredients → instructions order
- **Sticky CTA:** Scroll a recipe page on mobile; confirm CTA stays visible, disappears near comments
- **Phase nav:** Click each phase tab; confirm content switches immediately
- **Cuisines 404:** Visit `/cuisines/american`, `/cuisines/english` — should render cuisine page not 404
- **All Recipes:** Visit `/recipes` — should show recipes; utensil filter chip should appear in FilterDrawer step 6
- **Meal plan grid:** Open a plan, verify grid is default view; click `+` on empty slot; confirm recipe slide-over appears
- **Discover embed:** Visit `/discover`; confirm swipe card stack visible without navigating to `/swipe`
- **Shared pantry:** Create shared pantry, share invite code, join from incognito as second user, add item, verify it appears for both users in real time
