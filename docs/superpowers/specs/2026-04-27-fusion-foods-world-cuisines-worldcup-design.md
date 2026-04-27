# Design Spec: Fusion Foods, World Cuisines Enrichment & World Cup 2026 Fix

**Date:** 2026-04-27  
**Project:** What's Cooking (`/whatscooking`)  
**Scope:** Three coordinated features sharing one implementation cycle.

---

## 1. Fusion Foods — `/cuisines/fusion`

### 1.1 Data layer

**`src/lib/fusion-foods.ts`** — new file, single source of truth for all 50 fusion dishes.

Each entry:
```ts
interface FusionDish {
  id: string;               // e.g. "korean-tacos"
  name: string;
  category: "Asian-Latin Fusion" | "New American Staples" | "European-Asian Fusion" | "Indian-Western Fusion" | "Middle Eastern & Global Fusion";
  originStory: string;      // 1-2 sentence culinary bridge narrative
  ingredients: string[];
  instructions: string[];
  image: string;            // Unsplash fallback URL (always populated)
  sourceUrl: string;        // original URL from the 50-item list
  supabaseId?: string;      // populated after scrape script runs
}
```

All 50 dishes from `50_recipes_fusion_foods.md` are hardcoded here as static fallback. The scrape script overwrites `supabaseId` for successfully scraped entries.

**`src/lib/cuisines.ts`** — add one new entry to `CUISINES`:
```ts
{
  slug: "fusion",
  name: "Fusion Foods",
  flag: "🌐",              // not a country flag — use globe emoji as sentinel
  region: "Fusion",        // new region bucket
  tagline: "Where two flavor worlds collide and create a third.",
  description: "...",      // drawn from Culinary_bridges.md intro
  keyDishes: ["Korean Tacos", "Sushi Burrito", "Naan Pizza", "Shakshuka Pizza", "Rasta Pasta"],
  color: "#7C3A8C",
  bg: "#F5EEF8",
  heroImage: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
  dbValues: ["Fusion", "fusion", "Asian-Latin Fusion", "European-Asian Fusion", "Indian-Western Fusion", "Middle Eastern Fusion"],
}
```

### 1.2 Scrape script

**`scripts/seed-fusion-recipes.ts`** — one-time Node.js script (run manually via `npx ts-node`):

1. Iterates all 50 `sourceUrl` entries from `fusion-foods.ts`
2. For each URL: fetch HTML → extract title, ingredients, instructions, image via `extract-recipe` lib (already exists at `src/lib/extract-recipe.ts`)
3. Upsert into `recipes` table with `cuisine_type = "Fusion"`, `source_url`, `title`, `ingredients`, `instructions`, `image_url`
4. On success: write returned `id` back to the static `FusionDish.supabaseId`
5. On failure (paywall, blocked, parse error): log and skip — static data is the fallback
6. Print summary: N scraped, M failed, static fallback covers M

Script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.

### 1.3 Page — `/cuisines/fusion`

**File:** `src/app/(app)/cuisines/fusion/page.tsx` (server component)  
**Client interactivity:** `src/app/(app)/cuisines/fusion/fusion-client.tsx`

**Layout (top to bottom):**

1. **Hero banner** — dark gradient card matching existing cuisine page hero style. Text: "Fusion Foods" heading + 2-sentence description. Background: mosaic of 4 small food images (2×2 grid, each `object-cover`).

2. **Category filter pills** (client) — horizontal scrollable row of pills: All · Asian-Latin · New American · European-Asian · Indian-Western · Middle Eastern & Global. Clicking filters the grid client-side (no re-fetch).

3. **Recipe grid** — 3-col desktop / 2-col tablet / 1-col mobile. Each card:
   - Photo (scraped image if `supabaseId` exists, else static Unsplash fallback)
   - Dish name (bold)
   - Origin badge: e.g. `🇰🇷 × 🇲🇽` with label "Korea × Mexico"
   - Ingredient count pill
   - Category tag
   - "View Recipe →" button → opens recipe modal

4. **Recipe modal** (client) — slide-up sheet with: full ingredient list, step-by-step instructions, source attribution link, "Add to Pantry" shortcut.

5. **Culinary Bridges section** — titled "The Great Culinary Crossroads". Horizontal snap-scroll row of 7 location cards (Georgia, Philippines, Maghreb, Peru, Malta, Uzbekistan, Mauritius/Réunion). Each card: location name, bridge metaphor (e.g. "Eastern Europe ↔ Middle East ↔ Central Asia"), key hybrid dish, 2-sentence description. Matches existing `cuisine-snap-row` CSS pattern.

### 1.4 Link from Cuisine Atlas

In `src/app/(app)/cuisines/page.tsx`, add a featured fusion banner **above** the `<CuisinesTabs>` component. Full-width card with gradient background, "Fusion Foods" title, tagline, and `Link href="/cuisines/fusion"`. Visually distinct from the continent section headers — uses the purple `#7C3A8C` accent.

**`CUISINE_REGIONS` guard:** `CUISINE_REGIONS` is derived as `[...new Set(CUISINES.map(c => c.region))]`. Adding `region: "Fusion"` to the CUISINES array would create an orphan section in the By Country tab. Guard against this in the page: `const continents = CUISINE_REGIONS.filter(r => r !== "Fusion")`. Fusion lives only at its dedicated URL, not in the main grid.

---

## 2. World Cuisines — Richer Country Descriptions

### 2.1 `src/lib/cuisines.ts` description expansions

Every existing `description` field gets expanded to 3–4 sentences using `world_cuisines_flavor_profiles.md` cluster summaries. No structural changes — same `CuisineInfo` interface, same rendering pipeline.

New content per cluster:
- **Mediterranean:** Add the "Holy Trinity" (olive oil, wheat, wine) framing + fresh/herb-forward characterization
- **Balkan:** Add Ottoman-Slavic crossroads, smoky/meat-centric, phyllo + salty cheese note  
- **Nordic:** Add preservation focus, clean flavors, cold-water fish, rye tradition
- **Central European:** Add hearty/comforting framing, Schnitzels/dumplings/sauerkraut
- **West African:** Add "Spice and Starch" + palm oil + umami-rich soups + "swallows"
- **East African/Horn:** Add grain-heavy, berbere, injera characterization
- **East Asian cluster:** Add rice/fermentation belt, soy/miso/ginger, balance philosophy
- **South Asian:** Add spice powerhouse, complex dry-spice layering, ghee, pulses
- **Southeast Asian Mainland:** Add fish sauce, lemongrass, galangal, lime freshness
- **Central Asian:** Add Silk Road palette, lamb-centric, plov, hand-pulled noodles
- **Gulf:** Add spiced rice dishes (Machboos), dates, spice trade route influence
- **Andean:** Add high-altitude soul food, potato varieties, quinoa, corn
- **Southern Cone:** Add cattle ranching culture, open-fire asado, European pastry influence
- **Tropical Latin/Caribbean:** Add African/Indigenous/Spanish roots, plantains, jerk/creole

### 2.2 `CULINARY_REGIONS` description updates

Update the 6 region descriptions in `CULINARY_REGIONS` to match the richer cluster summaries from the flavor profiles doc.

---

## 3. World Cup 2026 — Country Correction

### 3.1 Source of truth

`worldcup_10_recipes_each_country.md` is the authoritative list. Final 48-nation roster by confederation:

| Conf | Nations |
|------|---------|
| **Host** | United States, Canada, Mexico |
| **CONMEBOL** | Argentina, Brazil, Uruguay, Colombia, Ecuador, Paraguay |
| **UEFA** | England, France, Germany, Spain, Portugal, Netherlands, Belgium, Croatia, Switzerland, Austria, Norway, Scotland, Sweden, Turkey, Czechia, Bosnia & Herzegovina |
| **CAF** | Morocco, Senegal, Egypt, Algeria, Tunisia, Nigeria, South Africa, Côte d'Ivoire, Ghana, Cabo Verde, Congo DR |
| **AFC** | Japan, South Korea, Australia, Iran, Saudi Arabia, Qatar, Iraq, Uzbekistan, Jordan |
| **CONCACAF** | Panama, Haiti, Curaçao |
| **OFC** | New Zealand |

### 3.2 Removals from current `WC2026_NATIONS`

Remove: Italy, Palestine, Chile, El Salvador, Jamaica, Romania, Hungary, Slovakia, Ukraine, Slovenia, Denmark, Poland, Mali, Zambia, Tanzania, Cameroon.

### 3.3 Additions to `WC2026_NATIONS`

Add with correct `iso2`, `flag`, `cuisine`, `slug`, `group`:
- Croatia, Norway, Scotland, Sweden, Turkey, Czechia, Bosnia & Herzegovina (UEFA)
- Algeria, Tunisia, Côte d'Ivoire, Ghana, Cabo Verde, Congo DR (CAF)
- Iraq, Jordan (AFC)
- New Zealand (OFC)
- Ecuador, Haiti, Curaçao (CONMEBOL/CONCACAF)

New confederation: `"OFC"` with color `#208090`.

### 3.4 Signature dishes per nation

Each nation entry gets a `dishes: string[]` field (10 items from the markdown source). These render in a tooltip/expanded panel when clicking the flag card. The `WcFlagCard` component gets an optional `dishes` prop that shows a popover on click with the dish list.

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/fusion-foods.ts` | Create — 50 fusion dish static data |
| `src/lib/cuisines.ts` | Edit — add fusion entry, expand descriptions, update CULINARY_REGIONS |
| `src/app/(app)/cuisines/fusion/page.tsx` | Create — server component |
| `src/app/(app)/cuisines/fusion/fusion-client.tsx` | Create — filter + modal client component |
| `src/app/(app)/cuisines/page.tsx` | Edit — add fusion banner above tabs |
| `src/app/(app)/world-cup-2026/page.tsx` | Edit — fix WC2026_NATIONS array, add dishes field |
| `src/components/wc-flag-card.tsx` | Edit — add dishes prop + popover |
| `scripts/seed-fusion-recipes.ts` | Create — one-time scrape script |

---

## Out of Scope

- Fusion recipes appearing in pantry matching or meal plans (Phase 3)
- Culinary Bridges as separate navigable pages
- World Cup bracket/match data
