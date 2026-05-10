# What's Cooking — Implementation Changelog

## [Unreleased] — 2026-05-10

### Unified Recipe Pipeline — Task 1: Directory Scaffolding & Requirements Update

**Created:**
- `pipeline/lib/__init__.py` — empty module for pipeline library utilities
- `pipeline/strategies/__init__.py` — empty module for multi-strategy scrapers
- `pipeline/logs/.gitkeep` — log directory placeholder
- `tests/__init__.py` — test root module
- `tests/pipeline/__init__.py` — pipeline tests module

**Updated:**
- `pipeline/requirements.txt` — added `pytrends` (Google Trends API), normalized versions to abstract (no pinned `==` except `supabase==2.28.3`)

**Installed:**
- `pytrends==4.9.2` and dependencies (`pandas==3.0.2`, `tzdata==2026.2`)
- `requests` and `pytest` were already satisfied

**Commit:** `d28ba45`

---

## [Unreleased] — 2026-05-09

### Baby & Family Hub — Task 6: Baby Recipe Adaptation Snippet API

**Created:**
- `src/app/api/family/adapt-recipe/route.ts`

**API Route:**
- `POST /api/family/adapt-recipe` — Generate recipe adaptation guidance for a family member
  - Input: `recipe_title` (string), `ingredients` (string[]), `milestone` (MilestoneKey), `member_name` (string), `context` ("recipe_page" | "planner")
  - Validates auth (401 if not authenticated)
  - Validates required fields and milestone validity (400 if invalid)
  - Routes through `ai.chat.completions.create()` to local llama.cpp or Ollama fallback
  - System prompt: pediatric nutrition assistant, WHO/AAP guidelines aligned, emphasizes pediatrician consultation
  - User prompt differs by context:
    - `"planner"`: 2-sentence adaptation for meal prep context
    - `"recipe_page"`: 2-3 sentence preparation note with texture/size/substitution specifics
  - Returns `{ adaptation: string }` on success (200)
  - Returns `{ error: string }` on failure (400/401/500)

**Implementation Notes:**
- Uses `ai` from `src/lib/ai.ts` (smart routing to local models)
- Type-safe: imports `MILESTONE_LABELS`, `MilestoneKey` from `family-types.ts`
- Auth check: Supabase server client to verify user session
- Error handling: wrapped in try/catch with console logging
- Model name placeholder (`gpt-4o-mini`) is overridden by `ai.ts` smart router to llama.cpp

Commit: `4ee5b1b`

---

### Baby & Family Hub — Task 4: API — Milestones & Allergens

**Created:** 
- `src/app/api/family/milestones/route.ts`
- `src/app/api/family/allergens/route.ts`

**API Routes:**
- `POST /api/family/milestones` — Confirm (upsert) a milestone for a household member
  - Validates `member_id` exists and `milestone_key` in `MILESTONE_KEYS`
  - Upserts to `member_milestones` table with `confirmed_by: user.id`
  - Returns `{ milestone: data }` on success (201)
- `DELETE /api/family/milestones` — Un-confirm (remove) a milestone
  - Validates input and deletes matching row
  - Returns `{ ok: true }` on success (200)
- `POST /api/family/allergens` — Introduce (upsert) an allergen for a member
  - Validates `member_id` and `allergen_key` in `ALLERGEN_KEYS`
  - Upserts to `member_allergens` table with `introduced_by: user.id`
  - Returns `{ allergen: data }` on success (201)
- `DELETE /api/family/allergens` — Remove an allergen entry
  - Validates input and deletes matching row
  - Returns `{ ok: true }` on success (200)

**Implementation Notes:**
- Both routes use Supabase `upsert()` with `onConflict` constraints to prevent duplicates
- Auth check: return 401 if user not authenticated
- Input validation: return 400 if payload invalid
- Error handling: wrapped in try/catch with console logging
- Type-safe: uses `MilestoneKey` and `AllergenKey` from `family-types.ts`

Commit: `8f42090`

---

### Baby & Family Hub — Task 2: TypeScript Types

**Created:** `src/lib/family-types.ts`
**Modified:** `src/lib/types.ts`

- Created `family-types.ts` with complete family member type system:
  - `MemberType` union: "baby" | "toddler" | "child" | "adult"
  - `MilestoneKey` & `AllergenKey` unions with full label + description maps
  - `HouseholdMember`, `MemberMilestone`, `MemberAllergen` interfaces
  - Utility functions: `currentMilestone()` (highest confirmed stage), `ageLabel()` (human-readable age)
  - Constants: `MILESTONE_KEYS`, `ALLERGEN_KEYS` arrays for iteration
- Extended `Recipe` interface with baby & family fields:
  - `baby_stages?: string[]` — developmental stages this recipe suits
  - `allergen_flags?: string[]` — allergens present
  - `has_baby_variant?: boolean` — whether a baby-adapted version exists
  - `baby_variant_recipe_id?: string | null` — link to baby variant
- TypeScript clean: no new errors introduced

Commit: `13093dd`

---

## [Unreleased] — 2026-04-27

### Pantry Shopping UX — Task A3: Auto-Categorize Shopping Items

**Created:** `src/lib/shopping-list-categorize.ts`

- `categorizeMissingItems()` async function queries `/api/pantry/categorize` for items lacking category
- Implements localStorage cache (`wc_shopping_cat_cache_v1`) to avoid re-querying identical ingredients
- Patches items in-place: sets `category_id` and `category_name` from API response
- Handles edge cases: empty uncategorized list, API failures (returns items unchanged), cache hits
- TypeScript clean: no new errors introduced

Commit: `0a19206`

---

## [Unreleased] — 2026-04-27

### Pantry Shopping UX — Task A1: ShoppingItem Type Extension

**Created:** `src/lib/shopping-list.ts`

- Extended `ShoppingItem` type with optional `category_id` and `category_name` fields
- All existing localStorage shopping list functions (`loadShoppingList`, `saveShoppingList`, `addToShoppingList`, `toggleShoppingItem`, `removeShoppingItem`, `clearCheckedItems`) remain compatible
- Optional fields ensure backward compatibility with existing localStorage data
- TypeScript clean: no new errors introduced

Commit: `e855fff`

---

## [Unreleased] — 2026-04-27

### Image Monitor System

**5-task implementation. TypeScript clean.**

#### New files
- `src/lib/image-monitor.ts` — core logic: null check, duplicate check, relevance check (inverted index), HEAD ping, auto-fix via Supabase update
- `scripts/monitor-images.ts` — CLI entry point; run with `npm run monitor-images` or `npm run monitor-images:dry`
- `src/app/api/admin/monitor-images/route.ts` — GET route protected by `MONITOR_SECRET` or `CRON_SECRET`
- `vercel.json` — Vercel Cron schedule: daily 03:00 UTC

#### Modified files
- `src/lib/recipe-image.ts` — exported `CATEGORY_PHOTOS` for use by monitor
- `package.json` — added `monitor-images` and `monitor-images:dry` npm scripts

#### Notes
- Duplicate check keeps the first recipe's URL, fixes all subsequent copies
- Relevance check only applies to Unsplash URLs (known photo IDs); external URLs are liveness-checked only
- Known: several Unsplash photo IDs are reused across categories in `CATEGORY_PHOTOS` — may cause occasional false-positive relevance flags; cleanup tracked for future sprint

---

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

## 2026-05-09
### Household Member System — Task 2: TypeScript Types
- Modified: `src/lib/types.ts`
- Added household member type system:
  - `MemberAgeGroup`, `MemberFilterStrictness`, `IngredientSentiment`, `PreferenceSource` unions
  - `HouseholdMember` interface: id, owner_user_id, linked_user_id, display_name, avatar_emoji, age_group, filter_strictness, created_at
  - `MemberIngredientPreference` interface: id, member_id, ingredient_id, ingredient_text, sentiment, source, created_at
  - `MemberReaction` interface: id, member_id, recipe_id, rating (1|2|3), notes, reported_by, cooked_at
  - `HouseholdMemberWithPreferences` composite interface extending HouseholdMember
- TypeScript compiles clean (npx tsc --noEmit)
- Commit: `85456d0`

### Baby & Family Hub — Task 7: Static Guide Content

**Created:** `src/lib/guides-content.ts`

- **8 cornerstone guides exported as static array:** Signs of Readiness, First Foods, Allergens, BLW vs. Spoon Feeding, Mashed & Lumpy Textures, Finger Foods, Foods to Avoid, Eating at Family Table
- **Type system:** `MilestoneRelevance` union (pre_solids | started_solids | started_solids_to_soft_lumps | handles_soft_lumps | finger_foods | family_table | all_stages)
- **`GuideArticle` interface:** slug, title, milestoneRelevance, summary, body (markdown)
- **`MILESTONE_GUIDE_MAP`:** Record mapping milestone keys to relevant guide slugs for quick filtering on guides pages
- **Content quality:** WHO/AAP pediatric nutrition guidelines, emphasis on pediatrician consultation, actionable safety rules, texture progression tables
- TypeScript clean: no external dependencies

Commit: `de2a23e`

---

### feat: add POST /api/events/create
- Created src/app/api/events/create/route.ts
- Inserts into dinner_parties, then seeds event_menu_items, event_timeline_items, event_shopping_items in parallel
- Auth-gated via Supabase getUser()
