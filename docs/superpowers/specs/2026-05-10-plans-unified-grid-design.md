# Plans Page — Unified Grid & Recipe Bank Design

**Date:** 2026-05-10  
**Scope:** What's Cooking — `/plans/new` and `/plans/[id]` views  
**Status:** Approved for implementation

---

## Context

The plans feature currently has two parallel implementations:
- `new/weekly-grid.tsx` — uses native HTML5 drag API
- `[id]/plan-builder.tsx` — uses dnd-kit

This split is why dragging the big Recipe Bank card into the grid silently fails: they live in separate drag contexts. Additionally the existing-plan editor lacks calendar dates, macro footers, day/meal controls, and smart autofill. This spec unifies both views around shared components.

---

## 1. Unified `<WeeklyPlanGrid>` Component

**Replaces:** `weekly-grid.tsx` and the inline grid in `plan-builder.tsx`  
**Location:** `src/components/plans/WeeklyPlanGrid.tsx`

### Column Headers
- Derive real calendar dates from `meal_plans.week_start` (already in schema)
- Format: `Mon\nMay 12`, `Tue\nMay 13`, etc.
- Fallback to `Day 1`, `Day 2` when `week_start` is null
- Week start date picker: small calendar popover in the plan name header area, saves to `meal_plans.week_start`

### Row Headers
- Fixed 4 rows: Breakfast, Lunch, Dinner, Snack (existing icons)
- Each row header has a toggle to hide/show that row across all days

### Cells
- Every cell: `useDroppable` from dnd-kit with `data: { day_number, meal_type }`
- Filled cell: recipe thumbnail + title + remove button (hover)
- Empty cell: dashed border + `+` button → triggers autofill (Section 3)

### Macro Footer Row
- 5th row below Snack, always visible
- Per-day totals: Calories / Protein / Carbs / Fat
- Color coding against `meal_plans.nutritional_goals`:
  - Green: within 10% of goal
  - Amber: below 60% of goal
  - Red: over 120% of goal
- Weekly total column at the far right (or bottom summary bar on mobile)

### Add Day
- `+` button at right edge of header row
- Appends a column, increments `duration_days`, saves to DB
- Max 14 days enforced with tooltip

### DndContext
- Single `DndContext` wraps the entire page (sidebar + grid)
- Sensor: `PointerSensor` with 5px activation distance
- `DragOverlay` renders a floating mini-card while dragging

---

## 2. `<RecipeBank>` Component

**Replaces:** `RecipeBankSidebar` in `plan-builder.tsx` and `RecipeSearchPanel` in `new/`  
**Location:** `src/components/plans/RecipeBank.tsx`

### Layout (top to bottom)

1. **Search bar**
   - Queries `/api/recipes/autocomplete?q=&saved=true` — unified endpoint returning both DB recipes and user's saved recipes
   - Saved recipes get a bookmark badge in results
   - Min 2 chars, debounced 250ms

2. **Filter chips**
   - Populated from `meal_plan.dietary_filters` (e.g. `Vegetarian`, `Quick Cook`)
   - Horizontal scrollable row, toggleable
   - Active chips filter search results client-side against `recipe.dietary_tags`
   - "All" chip clears filters

3. **Smart Recommendations** (shown when search bar is empty)
   - Source: new `/api/recipes/recommend` endpoint
   - Scoring (pure SQL, no AI call):
     - +3 if recipe matches all active dietary filters
     - +2 if recipe is in user's saved recipes
     - +2 if recipe is not already in the plan
     - +1 per macro gap match (e.g. plan day is low protein → high-protein recipes score higher)
   - Returns top 10 scored recipes
   - Label: "Suggested for you" with subtle sparkle icon

4. **Big featured card**
   - First recommendation/result shown large: image, title, tags, time, calories, nav arrows
   - `useDraggable` with `data: { type: 'recipe', recipe }` — fixes current broken drag
   - Framer Motion: scale 1.02 on hover, 1.05 while dragging

5. **Compact result list**
   - Remaining results as grab-handle cards
   - Each also `useDraggable`

### Mobile
- Collapses to a bottom sheet drawer
- Search + filters visible at top of sheet, results scroll inside

---

## 3. Autofill on Empty Cell `+`

**No new backend needed** — reuses `/api/plans/[id]/suggest`

### Flow
1. User taps `+` on an empty cell (e.g. Wednesday Lunch)
2. Cell expands inline to show 3 suggestion cards with skeleton loading (~1s)
3. Request to `/api/plans/[id]/suggest` with `{ day_number, meal_type, existing_titles, dietary_filters, macro_context }`
4. Each suggestion card: title, estimated calories, one tag
5. Actions per card: **Add** (fills cell, closes inline panel) | **Skip** (cycles to next)
6. **"Search instead"** link at bottom opens RecipeBank focused/filtered to that meal type
7. Tap outside dismisses, cell returns to empty `+` state

---

## 4. UX / Navigation Enhancements

### Drag fix (root cause)
- Currently: `new/` uses HTML5 drag, `plan-builder.tsx` uses dnd-kit — separate contexts
- Fix: single `DndContext` at page level, all draggable items use `useDraggable`, all drop targets use `useDroppable`

### Adding days
- `+` at right of header row → appends day column, saves `duration_days` to DB
- Max 14 days with tooltip

### Meal type row toggles
- Row header click toggles visibility of that row (e.g. hide Snack)
- Preference saved to localStorage (not DB — cosmetic preference only)

### Week start date picker
- Calendar popover in plan name header area
- Sets `meal_plans.week_start`, column headers switch to real dates

### Mobile
- Grid: horizontal scroll (existing behavior, keep)
- RecipeBank: bottom sheet drawer

---

## 5. New API Endpoint

**`GET /api/recipes/recommend`**

Query params:
- `plan_id` — to exclude already-used recipes and read dietary filters
- `day_number` — optional, used for macro gap scoring
- `meal_type` — optional, used for time-of-day relevance

Returns: `Recipe[]` scored and sorted, top 10

Implementation: single Supabase query with `ORDER BY` computed score expression. No AI call.

**`/api/recipes/autocomplete`** — extend existing endpoint:
- Add `saved=true` param to also join `user_saved_recipes` table
- Return `{ ...recipe, is_saved: boolean }` on each result

---

## 6. Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/plans/WeeklyPlanGrid.tsx` |
| Create | `src/components/plans/RecipeBank.tsx` |
| Create | `src/app/api/recipes/recommend/route.ts` |
| Modify | `src/app/api/recipes/autocomplete/route.ts` — add `saved` param |
| Modify | `src/app/(app)/plans/new/dnd-builder.tsx` — swap to WeeklyPlanGrid + RecipeBank |
| Modify | `src/app/(app)/plans/[id]/plan-builder.tsx` — swap to WeeklyPlanGrid + RecipeBank |
| Delete | `src/app/(app)/plans/new/weekly-grid.tsx` (absorbed into WeeklyPlanGrid) |
| Delete | `src/app/(app)/plans/new/recipe-search-panel.tsx` (absorbed into RecipeBank) |

---

## 7. Verification

- [ ] Drag big featured card from RecipeBank into any grid cell — should drop and fill
- [ ] Drag compact card from RecipeBank list into grid — should drop and fill
- [ ] Tap `+` on empty cell — 3 AI suggestions appear with Add/Skip/Search actions
- [ ] Set `week_start` via date picker — column headers show real dates
- [ ] Filter chips filter RecipeBank results to matching dietary tags
- [ ] Search bar returns saved recipes with bookmark badge
- [ ] Macro footer row shows per-day totals, color-coded against goals
- [ ] `+` at grid header right edge adds a day column (max 14)
- [ ] Row toggle hides/shows a meal type row
- [ ] Both `/plans/new` and `/plans/[id]` use the same grid and sidebar components
