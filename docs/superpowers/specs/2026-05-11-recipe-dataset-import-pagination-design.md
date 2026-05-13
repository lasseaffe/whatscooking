# Recipe Dataset Import + Pagination — Design Spec
**Date:** 2026-05-11  
**Status:** Approved

---

## Problem Statement

1. The "All Recipes" grid is hard-capped at 500 rows, but the goal is 10k+ recipes.
2. Two large datasets are already downloaded locally but not imported into Supabase.
3. Many recipe grid cards linked to `/meals/[id]` (404) — fixed separately.
4. Recipe pages are fully built but were unreachable; now accessible via correct routing.

---

## Scope

- Import ~30k curated recipes from two local CSV datasets into Supabase
- Add server-side paginated API route for the recipe grid
- Move grid filtering server-side (currently filters 500 in memory — broken at scale)
- Guard against unnecessary live scraping for dataset-imported recipes
- No changes to the recipe detail page (`/recipes/[id]`) — it is complete

---

## Section 1 — Data Ingestion Pipeline

### Datasets

| File | Rows | Size | Has nutrition | Has images |
|---|---|---|---|---|
| `datasets/foodcom/RAW_recipes.csv` | 267,783 | 281 MB | Yes (7-value array) | No |
| `datasets/recipenlg/RecipeNLG_dataset.csv` | 2,231,149 | 2.2 GB | No | No (has source_url) |

### Script

**File:** `scripts/import_datasets.py`

Reads both CSVs, applies quality filters, maps to the Supabase `recipes` schema, and batch-upserts in chunks of 500 rows. Safe to re-run (idempotent via `source_url` conflict key).

### Quality Filters

**Food.com:**
- `n_ingredients >= 5`
- `n_steps >= 3`
- `description` is non-empty
- `5 <= minutes <= 240`
- Skip rows where `steps` or `ingredients` fail Python `ast.literal_eval`

**RecipeNLG:**
- Parsed `ingredients` list length >= 4
- Parsed `directions` list length >= 2
- `title` length >= 5 characters
- Skip rows with malformed JSON in ingredients/directions fields

**Target import count:** ~15k from Food.com + ~15k from RecipeNLG = ~30k total

### Schema Mapping

**Food.com → `recipes` table:**

| CSV field | recipes column | Transform |
|---|---|---|
| `name` | `title` | Strip whitespace, title-case |
| `minutes` | `cook_time_minutes` | Integer |
| `description` | `description` | Strip |
| `steps` | `instructions` | `ast.literal_eval` → JSON array of strings |
| `ingredients` | `ingredients` | `ast.literal_eval` → `[{"name": "..."}]` array |
| `nutrition[0]` | `calories` | First element of nutrition array (kcal) |
| `tags` | `cuisine_type`, `dietary_tags`, `dish_types` | See tag mapping below |
| `id` | `source_url` | `https://www.food.com/recipe/{id}` |
| — | `source_name` | `"Food.com"` (static) |
| `submitted` | `created_at` | ISO date string |

**Food.com tag mapping:**
- Cuisine tags (e.g. `mexican`, `italian`, `chinese`) → `cuisine_type` (first match)
- Diet tags (`vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `keto`) → `dietary_tags`
- Course tags (`appetizer`, `breakfast`, `dinner`, `dessert`, `snack`, etc.) → `dish_types`

**RecipeNLG → `recipes` table:**

| CSV field | recipes column | Transform |
|---|---|---|
| `title` | `title` | Strip |
| `ingredients` | `ingredients` | `ast.literal_eval` → `[{"name": "..."}]` |
| `directions` | `instructions` | `ast.literal_eval` → JSON array of strings |
| `link` | `source_url` | Raw URL |
| `source` | `source_name` | Raw string |
| — | `calories` | `null` (no nutrition data) |

### Deduplication

- Add a `UNIQUE` constraint on `recipes.source_url` (Supabase migration)
- Script uses `upsert` with `on_conflict="source_url"` and `ignore_duplicates=True`
- Title-based secondary dedup within each dataset batch (skip if title seen in current run)

### Image Strategy

Imported recipes have `image_url = null`. The existing `RecipeImage` component handles this transparently:
1. Tries `image_url` (null → skip)
2. Falls back to Unsplash category image (matched to `cuisine_type` / `dietary_tags`)
3. Falls back to styled icon placeholder

No additional image work required at import time.

---

## Section 2 — Pagination Architecture

### New API Route

**File:** `src/app/api/recipes/list/route.ts`

```
GET /api/recipes/list
  ?page=0          — zero-indexed page number
  &limit=50        — recipes per page (default 50, max 100)
  &search=         — full-text search on title + description
  &cuisine=        — cuisine_type filter
  &tags=           — comma-separated dietary_tags filter
  &difficulty=     — difficulty_level filter
  &maxTime=        — max total time (prep + cook) in minutes
```

Returns:
```json
{
  "recipes": [...],
  "total": 30000,
  "page": 0,
  "hasMore": true
}
```

Server-side filtering via Supabase `.ilike()`, `.contains()`, `.lte()`. This replaces the current in-memory filtering that only works on the initial 500 rows.

### Discover Page Changes

**File:** `src/app/(app)/discover/page.tsx`
- Change `.limit(500)` → `.limit(50)` for `gridRecipes`
- Add `.count("exact")` to get total row count
- Pass `initialTotal` to `DiscoverFeedClient`

### AllRecipesClient Changes

**File:** `src/app/(app)/recipes/all-recipes-client.tsx`
- Remove in-memory filter logic (search, tags, difficulty)
- Add `page` state (starts at 0)
- Search/filter changes trigger a new fetch to `/api/recipes/list` with `page=0`
- "Load More" button appends next page (`page + 1`) to the existing list
- Debounce search input (300ms) before firing API call
- Show total count from API response ("Showing 50 of 30,000 recipes")

### Load More UX

- Button label: "Load more recipes" with a count ("Load 50 more")
- Loading state: skeleton cards (3 rows of 5) while fetching
- When `hasMore` is false: replace button with "All recipes shown" message
- Filter/search changes reset to page 0 and replace the list (not append)

---

## Section 3 — Recipe Pages for Imported Recipes

### No Page Changes Required

`/recipes/[id]/page.tsx` is complete and renders correctly for any recipe with populated `ingredients` and `instructions`. Quality filters at import time guarantee both fields are non-empty.

### Scrape Guard

Current behavior: if `ingredients.length < 3 || instructions.length < 2`, the page calls `extractAndSaveRecipe()` (live scrape). Dataset recipes will always pass this check, but as an explicit guard, skip extraction when `source_name IN ('Food.com', 'RecipeNLG')`.

**File:** `src/app/(app)/recipes/[id]/page.tsx` — add `source_name` to the initial select, add guard condition.

### What Imported Recipe Pages Show

| Field | Food.com | RecipeNLG |
|---|---|---|
| Title | ✓ | ✓ |
| Description | ✓ | ✗ (null) |
| Cook time | ✓ | ✗ (null) |
| Calories | ✓ | ✗ (null) |
| Servings | ✗ (null) | ✗ (null) |
| Ingredients | ✓ (full list) | ✓ (full list) |
| Instructions | ✓ (full steps) | ✓ (full steps) |
| Cuisine | ✓ (from tags) | ✗ (null) |
| Dietary tags | ✓ (from tags) | ✗ (null) |
| Image | Unsplash fallback | Unsplash fallback |
| Cooking Mode | ✓ | ✓ |
| Ratings/Comments | Empty until users interact | Empty until users interact |

---

## Migration Required

One Supabase migration:
```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_name text;
CREATE UNIQUE INDEX IF NOT EXISTS recipes_source_url_unique 
  ON recipes (source_url) 
  WHERE source_url IS NOT NULL;
```

(`source_url` column already exists; `source_name` may already exist — check before running.)

---

## Files Created / Modified

| File | Action |
|---|---|
| `scripts/import_datasets.py` | Create — ingestion script |
| `src/app/api/recipes/list/route.ts` | Create — paginated list API |
| `src/app/(app)/discover/page.tsx` | Modify — remove limit(500), pass total |
| `src/app/(app)/recipes/all-recipes-client.tsx` | Modify — server-side filters, Load More |
| `src/app/(app)/recipes/[id]/page.tsx` | Modify — add scrape guard for dataset recipes |
| `supabase/migrations/YYYYMMDD_recipe_source_unique.sql` | Create — unique index on source_url |

---

## Out of Scope

- Per-recipe image scraping (Unsplash fallback is sufficient)
- Protein/carbs/fat for Food.com (nutrition array is %DV not grams)
- Difficulty level inference (can be added as a future enhancement)
- RecipeNLG cuisine/tag inference (title-based NLP — future enhancement)
- Infinite scroll (upgrade path from Load More button)
