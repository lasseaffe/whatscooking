# Recipe Detail Modal — Design Spec
_Date: 2026-05-19_

## Context

Clicking an assigned recipe cell in the meal planner WeaveGrid currently navigates to the full `/recipes/[id]` page. That page renders the entire recipe experience including World Cup country flag cards and other unrelated sections, causing visual overlap bugs and a jarring context switch away from the planner. The fix is a self-contained modal that shows recipe details without leaving the planner.

## Goal

Show recipe details (hero image, metadata, ingredients) in a centered modal overlay when the user clicks a filled recipe cell in the WeaveGrid. Read-only. No navigation away from the planner.

## Decisions

- **Modal style:** Centered overlay (max-w-2xl), bottom sheet on mobile
- **Content:** Hero image + cuisine label + title + description + 4-stat pill row + dietary tags + ingredients list
- **Instructions:** Not included
- **Actions:** "View full recipe →" ghost link only — no swap/edit
- **Data fetch:** Fetch full recipe on modal open via existing `/api/recipes/[id]` route

## Component

**New file:** `src/components/plans/RecipeDetailModal.tsx`

```
Props:
  recipe: { id, title, image_url, focal_x, focal_y, cuisine_type, dish_types } | null
  onClose: () => void

Behavior:
  - Renders nothing when recipe === null
  - Mounts a fixed backdrop (bg-black/60, backdrop-blur-sm, z-50)
  - Click backdrop → onClose()
  - Keydown Escape → onClose()
  - Panel: centered, max-w-2xl, max-h-[90vh] overflow-y-auto
  - On mobile: bottom sheet (w-full, rounded-t-2xl, max-h-[90vh])
  - Fetches /api/recipes/[id] on open; shows ingredient skeleton while loading
```

## Visual Design

All colors from existing CSS token system — no new tokens.

| Element | Token / Value |
|---|---|
| Modal background | `--wc-surface-1` (#2C2724) |
| Border | 1px solid `--rc-rim` (#3A3430) |
| Hero image | 240px tall, focal-point cropped via `RecipeImage` component |
| Cuisine label | text-xs uppercase, `--wc-accent-saffron` (#F4A261) |
| Title | Libre Baskerville, `--wc-text` (#EFE3CE), text-xl |
| Description | italic, #7A5A40, text-sm |
| Stat pills | bg `--wc-surface-2` (#3A3430), text `--rc-meta` (#A08060), text-xs |
| Dietary tags | rounded-full, bg `--wc-surface-2`, text `--wc-text`, text-xs |
| Ingredient name | `--wc-text` (#EFE3CE) |
| Ingredient quantity | `--rc-meta` (#A08060) |
| "View full recipe" button | ghost, saffron border + text |
| Close button (✕) | absolute top-3 right-3, muted |

**Ingredients list:** Show first 7, collapse remainder behind "+ N more" inline toggle.

## Integration Point

**File to modify:** `src/components/plans/WeaveGrid.tsx`

- Add `selectedRecipe` state (type: `PickedRecipe | null`, initially `null`)
- On click of a filled cell: set `selectedRecipe` to that cell's recipe data
- Render `<RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />` at the bottom of the component tree
- No changes to `ConstraintPicker.tsx` or `/recipes/[id]/page.tsx`

## Reused Existing Code

- `RecipeImage` component (`src/components/recipe-image.tsx`) — focal-point aware hero crop
- `/api/recipes/[id]` route — existing, returns full recipe with ingredients
- CSS token variables from `globals.css` — no new tokens needed
- `PickedRecipe` interface from `ConstraintPicker.tsx` — reuse as prop type

## Loading State

While fetching recipe data after modal opens:
- Hero image: show immediately (already in WeaveGrid cell data)
- Title, cuisine, description: show immediately (already in cell data)  
- Stat pills (time, calories, rating): skeleton shimmer rows
- Ingredients: skeleton shimmer rows (3 lines)

## Verification

1. Open meal planner at `/plans`
2. Click any filled recipe cell → modal opens over the planner (no navigation)
3. Hero image appears with correct focal-point crop
4. Cuisine label, title, description render in app colors (no white/generic styles)
5. Stat pills load after brief skeleton
6. Ingredients list shows first 7; "+ N more" expands inline
7. "View full recipe →" navigates to `/recipes/[id]` (existing page, correct behavior)
8. Click backdrop → modal closes, planner visible underneath
9. Press Escape → modal closes
10. On mobile: modal renders as bottom sheet, scrollable
11. No country flag cards, no unrelated sections visible anywhere in modal
