# Landing Page Enhancements — Design Spec
Date: 2026-05-11

## Overview

Three independent improvements to `src/app/page.tsx`:

1. **Recipe Report Button** — flag icon on Trending Right Now cards → queue.json → admin panel → Playwright fix
2. **Feature Card Hover Expansion** — per-feature animated mini-demo on the "Four courses" grid
3. **Button Text Fix** — remove mojibake arrow from "Browse all recipes" CTA

---

## 1. Recipe Report Button

### User-facing component

A `Flag` icon (Lucide, 14px) in the top-right of each recipe card in the "Trending Right Now" grid.

- Hidden at rest (`opacity-0`), fades in on card `group-hover` (`opacity-100`)
- Clicking opens a small popover (not a full modal) — `position: absolute` div inside the card's `relative` container, top-right aligned below the flag icon
- Popover contains:
  - Dropdown: `wrong_image | wrong_title | wrong_cuisine | spam | other`
  - Optional detail textarea (max 200 chars, placeholder "More details…")
  - "Report" submit button (WC copper `#C8782A`)
- On submit: `POST /api/recipe-reports`
- On success: show inline "Reported ✓" for 1.5s then close

### API route: `POST /api/recipe-reports`

File: `src/app/api/recipe-reports/route.ts`

- Reads `pipeline/issues/queue.json` (creates file + directory if absent)
- Appends new entry, writes back
- Returns `{ ok: true, id }`

Report entry shape:
```json
{
  "id": "uuid-v4",
  "recipeId": "string",
  "recipeTitle": "string",
  "sourceUrl": "string | null",
  "imageUrl": "string | null",
  "issueType": "wrong_image | wrong_title | wrong_cuisine | spam | other",
  "detail": "string",
  "status": "pending",
  "reportedAt": "ISO timestamp",
  "resolvedAt": null,
  "fix": null
}
```

### Queue library

File: `scripts/lib/recipe-queue.mjs`

Mirrors `venturepath/scripts/lib/queue.js`:
- `readQueue()` — returns all entries from `pipeline/issues/queue.json`
- `appendIssue(issue)` — generates UUID, appends, returns entry
- `updateIssue(id, patch)` — mutates status/fix fields
- `archiveResolved()` — moves resolved entries to `pipeline/issues/archive.json`

Queue path: `pipeline/issues/queue.json`
Archive path: `pipeline/issues/archive.json`

---

## 2. Admin Panel

### Page: `/admin/reports`

File: `src/app/admin/reports/page.tsx`

Simple protection: checks `?key=` query param against `ADMIN_KEY` env var. If missing/wrong → 403 page.

UI:
- Header: "Recipe Reports" + total count badge
- Filter toggle: "Unresolved only"
- Type filter pills: All | wrong_image | wrong_title | wrong_cuisine | spam | other
- Reports grouped by recipe title
- Each report card shows: recipe title, issue type badge, date, detail text, source URL link (if present)
- Per-report actions:
  - **"Run Fix"** — calls `POST /api/admin/recipe-fix` `{ reportId, recipeId, action: 'run_fix' }`, spawns fix script as child process, polls status
  - **"Mark Resolved"** — sets status to `resolved` without running fix
  - **"Skip"** — sets status to `skipped`

Fix progress polling: `GET /api/admin/recipe-fix-status?id=<reportId>` — reads queue.json and returns current status + fix result.

### API routes

`src/app/api/admin/recipe-fix/route.ts`
- Validates `ADMIN_KEY` header
- Spawns `node scripts/fix-recipe.mjs --id <reportId>` as detached child process
- Returns `{ ok: true }` immediately

`src/app/api/admin/recipe-fix-status/route.ts`
- Reads queue.json, finds entry by id
- Returns `{ status, fix }` fields

---

## 3. Playwright Fix Script

File: `scripts/fix-recipe.mjs`

Invoked: `node scripts/fix-recipe.mjs --id <reportId>`

### Flow

1. Parse `--id` arg, read queue, find entry → error if not found
2. `updateIssue(id, { status: 'in_progress' })`
3. Launch headless Chromium (`playwright-core`)
4. Determine target URL:
   - If `sourceUrl` present → navigate to source
   - Else → navigate to `http://localhost:3002/recipes/<recipeId>`
5. **Screenshot**: `page.screenshot({ path: 'public/data/recipe-fixes/<recipeId>.jpg', type: 'jpeg', quality: 85 })`
6. **Scrape**:
   - Extract `og:image`, `og:title`, `og:description` meta tags
   - Try JSON-LD `@type: Recipe` schema for `cookTime`, `recipeCategory`, `image`
7. **Patch Supabase**: update `recipes` row with any improved fields found (`image_url`, `title`, `cuisine_type`)
   - Uses `@supabase/supabase-js` with service role key from env
8. `updateIssue(id, { status: 'resolved', resolvedAt: ISO, fix: { screenshotPath, patchedFields, appliedAt } })`
9. `archiveResolved()`

### Error handling

- If Playwright fails to launch: mark `status: 'skipped'`, write error to `fix.error`
- If source URL returns 4xx/5xx: screenshot WC recipe page as fallback, skip scrape
- If no improved fields found from scrape: still mark resolved (screenshot is the deliverable)

---

## 4. Feature Card Hover Expansion

### Mechanism

Cards in the "Four courses" grid become `group` containers with:
- `grid-template-rows` transition: `0fr` → `1fr` for the demo area (CSS-only reveal, no JS)
- Expand height via `max-h-0 group-hover:max-h-48 overflow-hidden transition-all duration-500`

### Per-feature animation components

Each is a small self-contained TSX component using CSS keyframes only (no external animation libraries).

| # | Feature | Component | Animation |
|---|---|---|---|
| 1 | AI Meal Planner | `MealPlannerDemo` | 7-col week grid, cells fill left-to-right with copper color, staggered 80ms delay per cell |
| 2 | Discover & Trending | `DiscoverDemo` | Horizontal strip of recipe name chips scrolling continuously |
| 3 | Meal Swipe | `MealSwipeDemo` | Single card slides left with ✕, resets, slides right with ♥, loops |
| 4 | Social Recipe Import | `ImportDemo` | URL text types into input char-by-char, then 3 ingredient lines appear below |
| 5 | Events & Occasions | `EventsDemo` | Calendar grid, cells highlight in sequence diagonally |
| 6 | Smart Pantry | `PantryDemo` | 4 pantry item rows tick off one by one with checkmarks |
| 7 | Collaborative Cooking | `CollabDemo` | Two cursor dots converge on a shared card from opposite sides |
| 8 | Smart Recommendations | `RecsDemo` | 5 stars fill left-to-right with gold color |

Each component:
- ~40–80 lines max
- Uses `animation: featureName-anim Xs ease-in-out infinite`
- Keyframes defined with `@keyframes` in a `<style>` tag or Tailwind `animate-` class extension
- No external deps

### CTA link

Below each demo: small `"Try it"` link in WC copper, pointing to the feature's route (`/plans`, `/discover`, `/recipes`, etc.)

### Feature route map

| Feature | Route |
|---|---|
| AI Meal Planner | `/plans` |
| Discover & Trending | `/discover` |
| Meal Swipe | `/discover` |
| Social Recipe Import | `/my-recipes/new` |
| Events & Occasions | `/events` |
| Smart Pantry | `/pantry` |
| Collaborative Cooking | `/plans` |
| Smart Recommendations | `/discover` |

---

## 5. Button Fix

In `src/app/page.tsx` line 449:

```tsx
// Before
Browse all recipes â†'

// After
Browse all recipes
```

Also audit the full file for any other raw arrow/special characters rendering as mojibake and fix inline.

---

## Files to Create / Modify

| Action | Path |
|---|---|
| Modify | `src/app/page.tsx` — add ReportButton, feature card expansion, button fix |
| Create | `src/app/api/recipe-reports/route.ts` |
| Create | `src/app/api/admin/recipe-fix/route.ts` |
| Create | `src/app/api/admin/recipe-fix-status/route.ts` |
| Create | `src/app/admin/reports/page.tsx` |
| Create | `src/components/landing/ReportButton.tsx` |
| Create | `src/components/landing/feature-demos/MealPlannerDemo.tsx` |
| Create | `src/components/landing/feature-demos/DiscoverDemo.tsx` |
| Create | `src/components/landing/feature-demos/MealSwipeDemo.tsx` |
| Create | `src/components/landing/feature-demos/ImportDemo.tsx` |
| Create | `src/components/landing/feature-demos/EventsDemo.tsx` |
| Create | `src/components/landing/feature-demos/PantryDemo.tsx` |
| Create | `src/components/landing/feature-demos/CollabDemo.tsx` |
| Create | `src/components/landing/feature-demos/RecsDemo.tsx` |
| Create | `scripts/lib/recipe-queue.mjs` |
| Create | `scripts/fix-recipe.mjs` |
| Create | `pipeline/issues/.gitkeep` (queue.json generated at runtime) |

---

## Environment Variables Required

Add to `.env.local`:
```
ADMIN_KEY=<any secret string>
```

Used by admin API routes to reject unauthorized requests.

## Dependencies

`playwright` (^1.59.1) already in `package.json` — no new install needed.
Use `import { chromium } from 'playwright'` in `fix-recipe.mjs`.

---

## Out of Scope

- Authentication on admin page beyond `?key=` param (can be upgraded later)
- LLM-assisted fixes (VP uses Ollama; WC has no local LLM infra)
- Report button on non-landing recipe cards (discover feed, all-recipes page) — separate task
