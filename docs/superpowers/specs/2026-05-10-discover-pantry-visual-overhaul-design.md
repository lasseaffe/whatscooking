# Discover & Pantry Visual Overhaul

**Date:** 2026-05-10  
**Status:** Approved  
**Scope:** Discover feed hero swiper + Pantry dark theme + tab restructure

---

## Problem

1. The Discover page's meal swiper was migrated from `/mealswipe` to an embedded `SwipeSection` but lost all its mechanics in the process — no drag-to-swipe, no card stack, no LIKE/NOPE stamps, no preview sheet.
2. The Discover swipe section renders as a compact mid-feed card (~420px) that doesn't feel like a hero feature.
3. The Pantry page uses a warm cream background (`#FFFBF7`) that clashes with the dark `#1C1209` theme of the rest of the app.
4. The Pantry has two stacked tab bars (outer: My Pantry / Leftovers / Shared Pantry; inner: Household / My Pantry), creating confusing nested navigation.

---

## Decisions

| Question | Decision |
|---|---|
| Swipe layout in Discover | Hero swiper — fills the viewport, like the old /swipe page |
| Swipe implementation approach | Extract shared `useSwipeSession` hook; HeroSwiper + thin SwipeClient wrapper |
| Pantry tab structure | 3 flat tabs: My Pantry · Leftovers · Shared — no inner nesting |
| Pantry theme | Dark — match `#1C1209` throughout |

---

## Section 1 — `useSwipeSession` hook

**File:** `src/lib/hooks/use-swipe-session.ts`

Extracts all swipe session logic from `SwipeClient` into a reusable hook. Both the Discover hero and the standalone `/swipe` page consume it.

**Inputs:**
- `recipes: Recipe[]`
- `initialSavedIds?: string[]`
- `filters: { restrictions: string[]; customAvoid: string[]; difficultyFilter: "all" | "easy" | "medium" | "hard" }`

**Returns:**
- State: `deck`, `liked`, `skipped`, `done`, `savedIds`, `previewRecipe`, `dragging`, `dragX`, `dragY`, `exiting`, `sessionKey`
- Derived: `currentCard`, `nextCard`, `likeOpacity`, `nopeOpacity`, `filteredRecipes`, `filteredOut`
- Actions: `commitSwipe(dir)`, `onPointerDown`, `onPointerMove`, `onPointerUp`, `handleRestart`, `toggleSave(recipe)`, `cardStyle(isTop)`

The filter logic, drag mechanics, keyboard handler, and save API calls all live here unchanged from `SwipeClient`.

---

## Section 2 — HeroSwiper + shared card components

### `src/components/swipe/swipe-cards.tsx`

Shared presentational components extracted from `SwipeClient` so both hero and standalone page import from the same place:
- `RecipeCard` — the draggable card with LIKE/NOPE stamps, image, cuisine badge, time/calories
- `RecipePreviewSheet` — the bottom-sheet tap preview with ingredients, instructions, macros
- `MatchScreen` — the "Your Matches" end screen

No logic, only presentation.

### `src/app/(app)/discover/hero-swiper.tsx`

Replaces `swipe-section.tsx` in the discover feed.

**Layout:**
- Card height: `calc(100svh - 56px)` — fills the viewport below the nav bar, making the swiper feel like a true hero
- Background: `#1C1209` — no white flash, blends into the discover feed
- Difficulty filter: compact chips row above the card (not a separate expandable panel)
- Progress bar + deck count: small row between filter chips and the card
- Action buttons: identical to current `SwipeClient` (X · Bookmark · ❤️ · Info · Undo)
- `MatchScreen` renders inside the hero area (replaces the card) rather than navigating to a new page

**Props:** `recipes: SwipeRecipe[], initialSavedIds?: string[]`

Internally calls `useDietaryMode()` and passes to `useSwipeSession`.

### `src/app/(app)/swipe/swipe-client.tsx` (refactored)

Becomes a thin shell:
- Imports `useSwipeSession` and shared card components from `swipe-cards.tsx`
- Keeps its own header (back-link to Discover, title "Meal Swipe", filter toggle button)
- Keeps `#FFFBF7` background — the standalone page is intentionally lighter
- Keeps `max-w-sm` constraint — standalone page centers on desktop

---

## Section 3 — Pantry overhaul

**File:** `src/app/(app)/pantry/pantry-client.tsx`

### Tab restructure

Remove `pantryView` state (`"shared" | "mine"`) and the inner Household/My Pantry sub-tab toggle entirely.

New outer tabs (3 flat, no nesting):
- **My Pantry** (`activeTab === "pantry"`) — renders the ingredient add form + grouped items directly. No sub-toggle.
- **Leftovers** (`activeTab === "leftovers"`) — unchanged, renders `<LeftoverStorage />`
- **Shared** (`activeTab === "shared"`) — renders `<SharedPantryTab />`, which already has a real shared pantry implementation (create/join with invite codes, real-time sync).

The `pantryView === "shared"` block (fake "coming soon" invite URL, dietary tags panel, household empty state) is **deleted** — `SharedPantryTab` already handles sharing properly. The `householdTags` / `savingTags` state and `handleToggleTag` function are removed along with it.

### Dark theme token swaps

Applied everywhere within `pantry-client.tsx`:

| Old | New | Usage |
|---|---|---|
| `#FFFBF7` | `#1C1209` | Page background |
| `#F5E6D3` | `#2A1804` | Tab rail background |
| `#fff` (active tab) | `#C85A2F` | Active tab background |
| `#3D2817` (active tab text) | `#fff` | Active tab text |
| `#A69180` (inactive tab) | `#8A6A4A` | Inactive tab text |
| `#fff` / `rgba(255,255,255,0.8)` | `#2A1804` | Card/panel backgrounds |
| `#E8D4C0` / `#F5E6D3` | `#3A2416` | All borders |
| `#3D2817` | `#EFE3CE` | Primary text |
| `#6B5B52` | `#8A6A4A` | Secondary text |
| `#FAF7F2` | `#1C1209` | Input backgrounds |
| `rgba(255,255,255,0.75)` | `#2A1804` | Ingredient pill backgrounds |

The expiry banner, rescue panel, Waste Not widget, Scramble CTA, photo extraction panel, and find-recipes CTA all follow the same token map.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/hooks/use-swipe-session.ts` | **New** — extracted swipe hook |
| `src/components/swipe/swipe-cards.tsx` | **New** — shared RecipeCard, RecipePreviewSheet, MatchScreen |
| `src/app/(app)/discover/hero-swiper.tsx` | **New** — hero swiper for discover feed |
| `src/app/(app)/discover/swipe-section.tsx` | **Delete** — replaced by hero-swiper |
| `src/app/(app)/discover/discover-feed-client.tsx` | **Edit** — import HeroSwiper, remove SwipeSection |
| `src/app/(app)/swipe/swipe-client.tsx` | **Edit** — thin wrapper using shared hook + cards |
| `src/app/(app)/pantry/pantry-client.tsx` | **Edit** — tab restructure + full dark theme |

---

## Out of Scope

- All Recipes grid broken images (data issue, separate task)
- World Cuisines cards in the discover feed (separate task)
- Any changes to `/swipe` page routing or data fetching
