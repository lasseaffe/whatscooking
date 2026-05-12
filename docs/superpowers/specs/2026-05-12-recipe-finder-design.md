# Recipe Finder + Quick & Easy Carousel — Design Spec
**Date:** 2026-05-12  
**Status:** Approved

---

## Overview

Two related improvements to the What's Cooking Discover page:

1. **Quick & Easy Carousel** — upgrade the existing horizontal scroll to a proper prev/next carousel with dot indicators.
2. **Recipe Finder** — an Akinator-style "Help me decide" wizard that narrows 40k recipes to 20 personalised picks and pins them as a carousel section on the page.

---

## 1. Quick & Easy Carousel

### What changes
`src/app/(app)/discover/quick-easy-section.tsx` currently renders a plain `overflow-x-auto` flex row with no navigation controls. It gets upgraded to match the carousel pattern already used in `SuggestionPanel`:

- Prev / Next arrow buttons (hidden at boundaries)
- Dot indicators below the cards
- Smooth spring animation via `framer-motion` (same `animate={{ x }}` pattern as `SuggestionPanel`)
- Visible 4 cards at a time on desktop, 2 on mobile

**No backend changes.** The data fetch in `page.tsx` already limits to 10 quick recipes; that's enough.

---

## 2. Recipe Finder

### Entry point

In `discover-client.tsx`, the existing `HeroFilterCard` is **replaced** by:

- A `🪄 Help me decide` button rendered below the search bar.
- Once finder results exist, the button becomes `✏️ Refine picks` (re-opens drawer with prior answers pre-filled).
- A `✕ Clear` ghost button next to it dismisses the results section.

`HeroFilterCard` is removed — the finder supersedes it. The existing time chips ("Ready in") remain untouched.

### FinderDrawer component

**File:** `src/components/finder-drawer.tsx`

A fixed bottom sheet with a dark overlay (`position: fixed, inset: 0`). Renders above everything (`z-50`). Closes on overlay click or explicit dismiss.

#### Structure (top to bottom inside the sheet)

1. **Drag handle** — 32×4px pill, centered.
2. **Free text input** — prominent, labelled *"What are you in the mood for?"*, placeholder: *"quick vegan pasta, nothing spicy, use what I've got…"*. Typing here does **not** auto-submit — it just stores the raw string for the API call.
3. **Progress bar** — thin 3px bar, fills as questions are answered (25% per question).
4. **Active question card** — one question at a time, animates in. Selecting an answer auto-advances to the next question after a 120ms delay (enough to register the selection visually).
5. **Answered summary** — chips above the active question showing prior answers. Each chip is dismissible (clears that answer and returns to that step).
6. **"Skip remaining →"** link — always visible below the active question. Fires the API with whatever is answered so far.

#### Question set (in order)

| Step | Question | Answer options | DB signal |
|---|---|---|---|
| 1 | What's the vibe? | 😴 Lazy night in · 🍷 Date night · ⚡ Quick fuel · 😋 Comfort food · 🌿 Clean eating · 🤩 Impress guests | vibe cluster (see mapping table) |
| 2 | How much time? | ⚡ Under 15 min · 🕐 30 minutes · 🍖 An hour · 🌅 All day | `prep_time_minutes + cook_time_minutes` ceiling |
| 3 | Any dietary needs? | None · 🌱 Vegan · 🥦 Vegetarian · 🌾 Gluten-free · 🥛 Dairy-free · ☪️ Halal | `dietary_tags` filter |
| 4 | Use pantry items? | 🥬 Yes please · 🛒 I'll shop fresh · ✨ Surprise me | pantry match scoring weight |

After Q4 the drawer automatically fires the API and closes. No explicit submit button needed when all 4 are answered.

#### Free text parsing (client-side, no AI)

Before sending to the API, the raw free text string is parsed with a small keyword matcher in `lib/finder-parse.ts`:

```ts
// Returns Partial<FinderAnswers> derived from text
parseFinderText("quick vegan pasta not spicy")
// → { maxMinutes: 30, dietary: ["vegan"], excludeKeywords: ["spicy"], dishHint: "pasta" }
```

Detected answers **pre-fill** the corresponding wizard questions (user sees them as already-answered chips when the drawer opens). The raw text string is also sent to the API as `freeText` for title/description keyword matching.

**Keyword dictionary covers:** cuisine names, dish types (pasta, curry, soup…), dietary labels (vegan, gluten-free…), time words (quick, fast, speedy → ≤30 min), spice/heat words (spicy, chilli, hot → `excludeKeywords`), and pantry phrase ("use what I've got", "from the fridge" → pantryMode=true).

### FinderResultsSection component

**File:** `src/components/finder-results-section.tsx`

Rendered in `discover-client.tsx` directly below the hero, above `SuggestionPanel`, when `finderResults` state is non-null.

- Same carousel structure as `SuggestionPanel` (prev/next arrows, dot indicators, spring animation).
- Header row: `🪄 Your Picks` label + filter summary chips + recipe count + `✕` dismiss button.
- Carousel shows 4 cards at a time on desktop, 2 on mobile.
- Cards use the existing `RecipeCard` component.

### API — `POST /api/recipes/finder`

**File:** `src/app/api/recipes/finder/route.ts`

#### Request body

```ts
{
  vibe?: "lazy" | "date-night" | "fuel" | "comfort" | "clean" | "impress";
  maxMinutes?: 15 | 30 | 60 | null;          // null = no limit
  dietary?: string[];                         // e.g. ["vegan", "gluten-free"]
  pantryMode?: "pantry" | "shop" | "any";
  freeText?: string;                          // raw string, for title/description ILIKE
  excludeKeywords?: string[];                 // e.g. ["spicy", "chilli"]
  dishHint?: string;                          // e.g. "pasta", parsed from free text
}
```

#### Processing

1. **Hard filters (SQL):**
   - `dietary_tags @> dietary` (if dietary non-empty)
   - Time filter: fetch candidates with `prep_time_minutes <= maxMinutes` as a proxy SQL filter, then hard-filter in JS with `(prep + cook) <= maxMinutes`. PostgREST doesn't support inline arithmetic in WHERE, so the SQL pass over-fetches slightly and JS does the precise cut.
   - Exclude `dish_types` containing "drink", "hack", "premium"
   - If `excludeKeywords` present: `NOT (title ILIKE '%spicy%' OR description ILIKE '%spicy%')` for each keyword

2. **Soft filters → scoring (in JS after fetch):**
   - **Vibe cluster match** — each vibe maps to boosted/suppressed `dish_types` and `cuisine_type` values (see table below). +3 per boosted match, −2 per suppressed match.
   - **Pantry match %** — if `pantryMode === "pantry"`, fetch user's pantry items and compute match %; score += `matchPct / 10`.
   - **Free text / dish hint** — `freeText` sent as ILIKE on title+description at the SQL layer (OR clause, soft — doesn't exclude non-matches, just boosts them via a separate `dishHint` score +2 if title contains hint).
   - **Has image** — +1 if `image_url` is non-null (surface visually richer cards first).

3. **Result:** Sort by score descending. Take top 12 deterministically + shuffle next 20 and take 8, giving 20 total with some freshness. Return with `profile` summary (vibe label + time label) for display in the results section header.

#### Vibe → DB cluster mapping

| Vibe | Boosted dish_types / cuisine_type | Suppressed |
|---|---|---|
| lazy | dinner, pasta, soup, casserole, stew | salad |
| date-night | French, Italian, seafood, steak | fast-food, snack |
| fuel | breakfast, snack, salad, sandwich, bowl | — |
| comfort | soup, pasta, bake, curry, pie, chowder | — |
| clean | salad, vegan, vegetarian, bowl, smoothie | fried, dessert |
| impress | French, fine dining, seafood, tart, soufflé, risotto | — |

#### Persistence

`localStorage` key `wc-finder-answers` stores the last `FinderAnswers` object. On mount, `FinderDrawer` reads this to pre-fill the wizard so "Refine" feels instant.

---

## 3. Files to create / modify

| File | Action | Notes |
|---|---|---|
| `src/components/finder-drawer.tsx` | Create | Bottom sheet wizard component |
| `src/components/finder-results-section.tsx` | Create | Pinned results carousel |
| `src/lib/finder-parse.ts` | Create | Client-side free text keyword parser |
| `src/app/api/recipes/finder/route.ts` | Create | POST endpoint |
| `src/app/(app)/discover/quick-easy-section.tsx` | Modify | Add carousel controls |
| `src/app/(app)/discover/discover-client.tsx` | Modify | Remove `HeroFilterCard`, add finder button + results state |

`HeroFilterCard` (`src/components/hero-filter-card.tsx`) is **not deleted** yet — leave it in place until the finder ships, then remove in the same PR.

---

## 4. Out of scope

- AI/LLM call for free text parsing — keyword matching is sufficient for v1.
- Saving finder results to the database — client-side only.
- Onboarding tooltip for the "Help me decide" button — post-launch.
- Mobile-specific bottom sheet physics (snap points, velocity dismiss) — v1 uses a simple fixed overlay.

---

## 5. Open questions (resolved)

- **Where does the finder live?** Bottom drawer, triggered by hero button. ✓
- **Free text placement?** First thing visible when drawer opens. ✓
- **Wizard style?** One question at a time, auto-advance. ✓
- **Results surface?** Drawer closes → "Your Picks" section pins below hero. ✓
- **AI for free text?** No — client-side keyword matching only. ✓
