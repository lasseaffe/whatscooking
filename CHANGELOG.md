# What's Cooking — Implementation Changelog

## [Unreleased] — 2026-04-27

### World Cup 2026 — Full Live-Event Feature

**9-task implementation. TypeScript clean. Pushed to master.**

#### New files
- `supabase/wc2026_schema.sql` — 3 tables (`wc_fixtures`, `wc_match_photos`, `wc_recipe_tags`) with RLS, indexes, idempotent policies
- `src/components/wc-flag-card.tsx` — 96×72px flag card with real flagcdn.com images, stagger animation, shimmer for stamped nations
- `src/components/wc-matchday-panel.tsx` — fixed-bottom panel, collapsed/expanded, per-match cards, Watch Party + Share Dish buttons, photo upload bottom sheet
- `src/components/wc-badge.tsx` — small "⚽ WC2026" pill badge that deep-links recipe cards to the passport page
- `src/app/api/world-cup/fixtures/route.ts` — GET today's fixtures with date filter
- `src/app/api/world-cup/photos/route.ts` — POST multipart upload to Supabase Storage `wc-photos` bucket
- `scripts/wc2026_recipe_targets.yaml` — machine-readable pipeline targets (48 nations, ≥5 recipes each)
- `RECIPES_NEEDED.md` — human-readable recipe coverage checklist

#### Modified files
- `src/app/(app)/world-cup-2026/page.tsx` — real flag cards, hero progress animation, football SVG pattern, confederation pulse, matchday panel wired in, null-safe unauthenticated access
- `src/components/recipe-card.tsx` — `wcNationCode` prop + WcBadge render
- `src/app/(app)/dinner-parties/new/new-party-form.tsx` — Sports Night occasion, watch party pre-fill via useEffect
- `src/app/(app)/dinner-parties/new/page.tsx` — reads `?theme=worldcup` searchParams, passes to form

#### Key design decisions
- GB-ENG / GB-SCT map to `gb` for flagcdn.com (subdivision codes not supported)
- `wc_recipe_tags` write is admin/service-role only (no public RLS write policy)
- Photo upload validates UUID format + file extension allowlist server-side
- Matchday panel polls every 60s only when expanded (battery-friendly)

---

## [Unreleased] — 2026-04-25

### Summary
Comprehensive implementation pass based on the Master Implementation Plan. All changes follow
the "Premium Elevation" design system with earthy warm tones, saffron/persimmon accents, and
the `--wc-floor / --wc-surface-1 / --wc-surface-2` depth tokens.

---

### ✅ 1. Design System — Premium Elevation Color Tokens
- Confirmed `--wc-floor: #1F1B19`, `--wc-surface-1: #2C2724`, `--wc-surface-2: #3A3430` in `:root`
- Recipe card `--rc-*` tokens already aligned to spec
- Added `--wc-rc-card-bg` alias for darker camel-beige card background
- Updated `rc-card` CSS class: increased image area ratio, added hover description reveal overlay
- Added `.rc-card__desc-reveal` for the hover zoom + description text animation

### ✅ 2. Sidebar Navigation Restructure
- Regrouped NAV_GROUPS: Discovery / Planning & Hosting / Kitchen / Health
- Profile & Settings pinned bottom (combined section, no subtext descriptions)
- Scramble Together removed from sidebar/header — moved to Pantry page
- `Dinner Party` now under "Planning & Hosting (Premium)" group with a crown indicator
- `Nutrient Tracker` now under "Health" group

### ✅ 3. Recipe Cards
- Card background darkened to `--rc-bg: #1F1B19` camel-beige per spec
- Image area increased: `aspectRatio: "3/4"` → taller image portion via scrim adjustment
- Dietary/cuisine tags now always visible (pushed above scrim gradient)
- Hover zoom effect + description reveal implemented via `recipe-card-hover` class (CSS)
- Description text rendered in dedicated extratext box below recipe name

### ✅ 4. Filter Drawer — Progressive Questionnaire
- Dietary filters moved out of top nav into a slide-in drawer on the Discover page
- Drawer follows Category → Dietary → Difficulty → Seasonality order
- `FilterDrawer` component added to `src/components/filter-drawer.tsx`
- Top bar `Scramble Together` button removed

### ✅ 5. Recipe Execution — Phase II (Ingredients)
- `ServingControl` + `UnitToggle` already existed; confirmed wired to `InteractiveIngredients`
- Ingredient checklist auto-collapses when 100% checked (1.4s delay celebration)
- Folding logic: ingredients panel collapses to left when cooking phase starts
- Serving multiplier dynamically scales all ingredient amounts

### ✅ 6. Recipe Execution — Phase III (Cook / Focus Flow)
- Active step auto-scrolls into center via `scrollIntoView({ behavior: "smooth", block: "center" })`
- Active step gets `#3A3430` background tint + elevated box-shadow
- Fixed "Next Step" button at bottom center (sticky positioning)
- SOS Helper is context-aware per step — shown at bottom of each instruction step
- `cooking-mode-active` class triggers high-contrast + larger font

### ✅ 7. Recipe Execution — Phase IV (Table Setting & Serving)
- `TableStylist` component updated with Casual / Intimate / Festive tabs
- Each tab shows occasion-specific table layout visualisation
- Napkin folding guide and plating notes included per tab

### ✅ 8. Recipe Execution — Phase V (Restore & Cleanup)
- `ZeroWasteGuide` / new `RestoreCleanup` section shows storage "Hero Stats"
- Storage duration shown in large font (e.g. "1–3 Days")
- Cleanup Concierge: Dishwasher Safe / Hand Wash Only toggle

### ✅ 9. Cooking Mode
- `cooking-mode-context.tsx` already exists; extended with `highContrast` toggle
- `Wake Lock API` (`navigator.wakeLock.request("screen")`) triggered when cooking mode activates
- Wake lock released on cooking mode exit or page unload

### ✅ 10. World Cup 2026 — Passport Stamp System
- Passport requires minimum 3 completed recipes per country to unlock flag
- Completed recipe stamps appear on atlas click (country detail modal)
- Progress persisted via `recipe_completions` Supabase table (or localStorage fallback)

### ✅ 11. Nutrient Tracker — Smart Search + Macro Rings
- "What did you eat?" search box now queries: (1) recently cooked, (2) current meal plan, (3) saved recipes — in priority order
- Macro rings (Protein / Carbs / Fat) rendered as SVG arc charts
- Health tips section added below macro rings

### ✅ 12. World Cuisines Atlas
- Country cards enlarged with high-quality culturally accurate thumbnails
- Continent backgrounds applied per continent section
- SVG map: countries with ≥1 cooked recipe glow in Saffron (#F4A261)

---

### Files Modified
- `src/app/globals.css` — design token updates, rc-card hover effects
- `src/components/app-nav.tsx` — sidebar restructure, group rename
- `src/components/recipe-card.tsx` — image area, hover reveal, description box
- `src/components/filter-drawer.tsx` — NEW: progressive filter questionnaire drawer
- `src/app/(app)/recipes/[id]/recipe-columns-client.tsx` — Phase III focus flow, wake lock
- `src/app/(app)/recipes/[id]/adapted-ingredients.tsx` — Phase II folding
- `src/components/table-stylist.tsx` — Phase IV tabs + napkin fold guides
- `src/components/zero-waste-guide.tsx` — Phase V hero stats + cleanup toggle
- `src/lib/cooking-mode-context.tsx` — highContrast flag + wake lock (session 2)
- `src/app/(app)/world-cup-2026/page.tsx` — 3-recipe stamp threshold, started/stamped states
- `src/app/api/calorie-entries/suggestions/route.ts` — meal plan items added to smart search priority
- `src/app/(app)/cuisines/page.tsx` — saffron glow + ★ cooked badge on user-cooked cuisines
