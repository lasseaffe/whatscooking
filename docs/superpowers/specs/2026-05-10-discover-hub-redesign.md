# Discover Hub Redesign

**Date:** 2026-05-10  
**Status:** Approved  

## Summary

Consolidate the standalone `/swipe` (Meal Swipe) page into the `/discover` page and expand Discover into a rich scrollable feed hub. Remove the "Meal Swipe" entry from the sidebar nav. The `/swipe` route is no longer needed.

---

## Layout

Single long-scroll page. No tabs. Sections flow top-to-bottom, each separated by a subtle divider. The page replaces the current `DiscoverHubClient` tab switcher entirely.

**Section order (top → bottom):**

1. Meal Swipe  
2. Trending Now  
3. Cook from Pantry  
4. Quick & Easy  
5. World Cuisines  
6. All Recipes  

---

## Sections

### 1. Meal Swipe

The full swipe mechanic currently in `/swipe/swipe-client.tsx` moves here inline — same drag/pointer logic, same card stack, same action buttons (skip, save, like, info, undo), same filter panel, same match screen when the deck empties.

- Card stack height: same as today (~500px card, 200px in condensed mockup)
- Progress bar, dietary badge, and difficulty filter all stay
- Section header: small saffron uppercase label "Today's Picks" + serif heading "Meal Swipe" + card count pill (e.g. "1 / 30")
- `SwipeClient` logic gets extracted into a shared component (e.g. `SwipeSection`) so it can be embedded without its own page shell

### 2. Trending Now

Horizontal scroll row of recipe cards sorted by total saves (desc).

- Each card: thumbnail (60×90px), recipe title (2 lines max), save count ("♥ 2.4k")
- Show 10 cards; last slot is a "+N more →" tile that links to `/recipes?sort=trending`
- Data: query `recipes` ordered by `saved_count` or computed from `recipe_saves` table — pick whichever is available; fall back to `created_at` desc if neither exists
- Section header: "🔥 Trending Now" + "See all →" link

### 3. Cook from Pantry

Pantry-match section. Only shown when the user is logged in and has ≥1 pantry item.

- Banner: match count ("12 recipes match your pantry"), pantry item count, "Updated just now" label, "View" button → `/pantry`
- Below banner: 2-column row of top 2 matches, each showing recipe name + "X / Y ingredients" fraction
- Each match card links to the recipe detail page
- If user has no pantry items: show a CTA card ("Add items to your pantry to see what you can cook →") linking to `/pantry`
- If user is not logged in: section is hidden entirely

### 4. Quick & Easy

Horizontal scroll row filtered to recipes with `prep_time_minutes + cook_time_minutes ≤ 20`.

- Each card: thumbnail, title, time in saffron ("⚡ 10 min")
- Card width: ~110px; show up to 10 cards
- Section header: "⚡ Quick & Easy" + "Under 20 min" label (no "See all" link — the All Recipes section below handles browsing)
- If fewer than 3 recipes qualify: section is hidden

### 5. World Cuisines

3-column grid of cuisine tiles (existing CUISINES data). Show first 8 cuisines + a "+N more" tile that links to `/cuisines`.

- Each tile: flag emoji + cuisine name, ~56px tall, coloured gradient background per cuisine
- "🌍 World Cuisines" header + "See all →" link to `/cuisines`

### 6. All Recipes

2-column card grid, infinite scroll (or paginated load-more). Reuses `AllRecipesClient` (already exists).

- Header: "🍽️ All Recipes" + total count label
- Default sort: newest first
- No filter bar in this section — filters live inside AllRecipesClient as today

---

## Navigation Changes

- Remove the `/swipe` entry from `NAV_GROUPS` in `app-nav.tsx`
- The `Discover` nav item (`/discover`) remains and is the entry point for everything
- The `/swipe` route + page files can be deleted or left as a redirect to `/discover` (redirect preferred to avoid broken bookmarks)

---

## Data / Server Component

`discover/page.tsx` fetches all data server-side and passes it down:

| Prop | Query |
|---|---|
| `swipeRecipes` | recipes with image, limit 30 (existing) |
| `trendingRecipes` | recipes ordered by save count desc, limit 11 |
| `pantryMatches` | pantry-matched recipes (existing logic in pantry-client), limit 2 + total count |
| `quickRecipes` | recipes where total_time ≤ 20, limit 10 |
| `cuisines` | CUISINES slice (existing) |
| `gridRecipes` | all recipes for AllRecipesClient, limit 300 (existing) |
| `pantryNames` | user's pantry item names for swipe dietary filter (existing) |

All fetches run in `Promise.all`. Trending and quick filters are applied via Supabase query (not client-side filtering).

---

## Component Structure

```
app/(app)/discover/
  page.tsx                  ← server component, all data fetching
  discover-feed-client.tsx  ← replaces discover-hub-client.tsx; renders all sections
  swipe-section.tsx         ← extracted from swipe-client.tsx (drag logic, card, match screen)
  trending-section.tsx      ← new
  pantry-match-section.tsx  ← new
  quick-easy-section.tsx    ← new
```

`AllRecipesClient` and `WorldCuisines` grid stay as-is and are imported into `discover-feed-client.tsx`.

The old `discover-hub-client.tsx` is deleted. The old `swipe/` folder is deleted after a redirect is in place.

---

## Edge Cases

- **Empty swipe deck**: shows existing match/done screen inline, not a redirect
- **No pantry items**: Pantry section shows CTA instead of matches
- **Not logged in**: Pantry section hidden; swipe save actions prompt login
- **Fewer than 3 quick recipes**: Quick & Easy section hidden
- **Slow connection**: each section renders independently; swipe card is visible immediately since it's client-side only

---

## Out of Scope

- Search bar on Discover (separate feature)
- Personalisation / ML ranking (future)
- Skeleton loaders per-section (future)
