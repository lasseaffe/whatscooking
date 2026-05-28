# Cuisine & Recipe Cultural Heritage — Design Spec
**Date:** 2026-05-28  
**Project:** What's Cooking (`C:\Users\lasse\Desktop\whatscooking`)  
**Status:** Approved for implementation

---

## Context

What's Cooking has solid cuisine-level metadata (`cuisines.ts`: taglines, descriptions, key dishes) but recipes carry almost no cultural context — only a `cuisine_type` string. Users and the product vision call for richer cultural depth: origin stories, cross-culture bridges (e.g. croissant ← Ottoman Empire), technique heritage, and cultural occasions. The goal is to honor culture and heritage, not treat cuisines as isolated categories.

Wikipedia contains authoritative, freely reusable cultural content for every major cuisine. The plan is to pull it once as static data and combine it with hand-crafted structured fields.

---

## Approach

**Static cuisine enrichment + Wikipedia one-time pull + smart recipe cascade**

1. Extend `src/lib/cuisines.ts` with 6 new cultural fields per cuisine
2. Run a one-time Wikipedia API scraper that populates `historyExtract` + `historySource` for each cuisine
3. Add cultural annotation fields to the `recipes` Supabase table for culturally significant recipes
4. Any recipe whose title appears in a cuisine's `keyDishes` or `crossCultureBridges` is auto-marked as culturally significant and inherits its cultural profile
5. New UI components render this content on both cuisine pages and recipe detail pages

---

## Data Model

### `CuisineInfo` extensions (`src/lib/cuisines.ts`)

```ts
interface CuisineInfo {
  // existing fields unchanged ...

  // NEW cultural fields
  wikiTitle: string                    // Wikipedia page title for scraper (e.g. "French cuisine")
  historyExtract: string               // Wikipedia summary extract, pulled once
  historySource: string                // Wikipedia URL for attribution
  stapleIngredients: CultureItem[]     // icon-driven ingredient bubbles
  coreTechniques: CultureItem[]        // icon-driven technique bubbles
  culturalOccasions: string[]          // pill list (e.g. "☕ Morning café ritual")
  crossCultureBridges: CultureBridge[] // the headline feature
}

interface CultureItem {
  emoji: string
  name: string
  note: string   // short subtitle (e.g. "Cultural core", "Medieval preserve")
}

interface CultureBridge {
  dish: string         // e.g. "Croissant"
  from: string         // source culture (e.g. "Ottoman Empire")
  story: string        // 1–3 sentence prose explanation
  recipeMatch?: string // optional: recipe title to auto-link (exact or fuzzy)
}
```

### Recipes table — new columns (`supabase/migrations/`)

```sql
ALTER TABLE recipes
  ADD COLUMN is_culturally_significant boolean DEFAULT false,
  ADD COLUMN cultural_journey          jsonb,   -- { stops: [{emoji,name,note}], period: string }
  ADD COLUMN heritage_notes            jsonb;   -- { originStory, culturalOccasion, keyIngredientNote }
```

`cultural_journey` drives the banner on the recipe page.  
`heritage_notes` drives the sidebar prose.  
`is_culturally_significant` gates whether the heritage UI renders at all.

---

## Wikipedia Scraper

**File:** `scripts/pull-cuisine-wikipedia.ts`  
**Run:** Once manually (`npx tsx scripts/pull-cuisine-wikipedia.ts`), output patched into `cuisines.ts`

**Process:**
1. For each cuisine in `cuisines.ts` that has a `wikiTitle`, call `https://en.wikipedia.org/api/rest_v1/page/summary/{wikiTitle}`
2. Extract `extract` (plain text summary) and `content_urls.desktop.page` (attribution URL)
3. Write results to `src/lib/cuisine-wikipedia-cache.ts` as:
   ```ts
   export const cuisineWikipediaCache: Record<string, { extract: string; source: string }> = { ... }
   ```
   keyed by cuisine `slug` (e.g. `"french"`)
4. `cuisines.ts` merges `historyExtract` and `historySource` from the cache at module load — no runtime API calls ever

The scraper is a one-time dev tool, not a build step. Cache file is committed to the repo.

---

## Cascade Logic

**File:** `scripts/cascade-cultural-recipes.ts`  
**Run:** Once after cuisines are enriched, then on-demand when cuisines are updated

For each cuisine, collect all `keyDishes` names and all `crossCultureBridges[].recipeMatch` values. Query Supabase for recipes whose `title` matches using `ILIKE '%term%'` (case-insensitive substring). For each match:
- Set `is_culturally_significant = true`
- Build `cultural_journey` from the bridge's cuisine journey nodes
- Build `heritage_notes.originStory` from the bridge's `story` field

This script is idempotent — safe to re-run.

---

## New UI Components

### `HeritageAtlasSection` (`src/components/cuisine/heritage-atlas-section.tsx`)
Renders the full Heritage Atlas block on a cuisine detail page. Sections:
- History (Wikipedia extract + source attribution)
- Staple Ingredients grid (icon bubbles)
- Core Techniques grid (icon bubbles)
- Cultural Occasions (pill strip)
- Cross-Culture Bridges (dedicated dark panel, one entry per bridge with 🌉 icon)

Placed below the existing hero + description on `/cuisines/[slug]/page.tsx`.

Key dishes with a `recipeMatch` are rendered with a `→` indicator linking to that recipe.

### `CultureJourneyBanner` (`src/components/recipe/culture-journey-banner.tsx`)
Renders the horizontal journey map at the top of a recipe detail page.  
Input: `cultural_journey` jsonb from the recipe row.  
Structure: labeled nodes connected by gradient lines (stops: emoji + name + note + year range).  
Only renders if `is_culturally_significant = true`.  
Positioned directly below the recipe title/meta row.

### `RecipeHeritageSidebar` (`src/components/recipe/recipe-heritage-sidebar.tsx`)
Sidebar panel with three prose sections: Origin Story, Cultural Occasion, Key Ingredient Note.  
Input: `heritage_notes` jsonb.  
Placed in a two-column layout on the recipe detail page (right column, ~200px wide).  
Stacks below content on mobile.  
Includes a "→ Explore [Cuisine] Cuisine" link back to the cuisine page.

### Recipe detail page layout change (`src/app/(app)/recipes/[id]/page.tsx`)
- Add `CultureJourneyBanner` between title and existing recipe meta, gated on `is_culturally_significant`
- Wrap existing content in a two-column grid: left = ingredients + instructions, right = `RecipeHeritageSidebar`
- On mobile: single column, sidebar stacks below instructions

---

## Design Tokens

All new components use existing WC design system tokens — no new tokens needed:
- Background: `#0d0b1e` (deep dark panel), `#1e293b` (card surface)
- Heritage accent: `#a78bfa` (purple) for bridges + heritage labels
- Labels: `#f59e0b` (amber) for section headers
- Text: `#e2e8f0` / `#94a3b8` / `#64748b` hierarchy
- Bridge connector: `linear-gradient(90deg, #4c4880, #6d5fad)`

---

## Content Strategy

**Phase 1 — Cuisines (launch scope)**
- Enrich all ~40 cuisines in `cuisines.ts` with `stapleIngredients`, `coreTechniques`, `culturalOccasions`, and `crossCultureBridges`
- Run Wikipedia scraper for all cuisines with a `wikiTitle`
- Prioritise the 10 most recipe-rich cuisines first (French, Italian, Japanese, Mexican, Indian, Chinese, Thai, Greek, Spanish, Middle Eastern)

**Phase 2 — Recipes (cascade)**
- Run cascade script after Phase 1
- Manually review and enrich the ~50 highest-traffic "culturally significant" recipes
- Not every recipe gets cultural content — only those that are `keyDishes` or have a bridge match

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/lib/cuisines.ts` | Add `CultureItem`, `CultureBridge` types + new fields to `CuisineInfo` |
| `src/lib/cuisine-wikipedia-cache.ts` | Create — generated by scraper, committed to repo |
| `supabase/migrations/20260528000000_recipe_cultural_fields.sql` | Create — 3 new columns on `recipes` |
| `src/components/cuisine/heritage-atlas-section.tsx` | Create |
| `src/components/recipe/culture-journey-banner.tsx` | Create |
| `src/components/recipe/recipe-heritage-sidebar.tsx` | Create |
| `src/app/(app)/cuisines/[slug]/page.tsx` | Modify — add `HeritageAtlasSection` |
| `src/app/(app)/recipes/[id]/page.tsx` | Modify — add banner + two-column layout |
| `scripts/pull-cuisine-wikipedia.ts` | Create — one-time scraper |
| `scripts/cascade-cultural-recipes.ts` | Create — one-time cascade script |

---

## Verification

1. **Cuisine page:** Visit `/cuisines/french` — Heritage Atlas section should appear below existing description with Wikipedia extract, ingredient/technique grids, occasions pills, and at least 2 cross-culture bridges. Croissant `→` link should route to the croissant recipe.
2. **Recipe page:** Visit the Croissant recipe — journey banner should appear below title (Ottoman → Vienna → Paris → World). Two-column layout with heritage sidebar on right. Sidebar "→ French Cuisine" link routes to `/cuisines/french`.
3. **Non-significant recipe:** Any recipe without `is_culturally_significant = true` should show the old single-column layout with no banner or sidebar.
4. **Mobile:** Heritage sidebar stacks below instructions, journey banner nodes remain readable.
5. **Scraper:** `npx tsx scripts/pull-cuisine-wikipedia.ts` runs without errors and writes to `cuisine-wikipedia-cache.ts`.
6. **Cascade:** `npx tsx scripts/cascade-cultural-recipes.ts` correctly marks recipes and prints a summary of matched titles.
