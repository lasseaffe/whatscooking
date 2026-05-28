# What's Cooking — Implementation Changelog

## [Unreleased] — 2026-05-28

### Task 8: RecipeHeritageSidebar Component + Tests

**What:** Added `RecipeHeritageSidebar` — a presentational sidebar component displaying recipe cultural heritage and origin stories.

**Implementation:**
- `src/components/recipe/recipe-heritage-sidebar.tsx` — Renders heritage notes (origin story, cultural occasion, key ingredient note) with dark theme styling. Returns `null` when `notes` is undefined. Includes a back-link to the cuisine page.
- `src/lib/types.ts` — Added `HeritageNotes` interface with three string fields.
- `src/components/recipe/__tests__/recipe-heritage-sidebar.test.tsx` — 6 test cases covering null rendering, label display, content rendering, and cuisine back-link.

**Tests:** All 6 tests pass. No state, no async. Component integrates with `HeritageAtlasSection` from prior commits.

**Styling:** Dark theme (#0d0b1e bg, #a78bfa labels, #f59e0b section headers, #94a3b8 body text).

## [Unreleased] — 2026-05-26

### Fix migration drift + add a drift-check CI guard

**Problem:** Several committed migrations were never applied to the live DB (`oruplzhfmtehsjbnsoms`), which 404'd every plan-detail page: `[id]/page.tsx` selects `meal_plans.person_count` / `track_intake` (from `20260521_social_macros.sql`), the columns didn't exist, the query errored → `notFound()`. The list page (which doesn't select them) kept working, masking it.

**Applied to the DB (via Supabase MCP, idempotent):**
- `20260521_social_macros.sql` — `meal_plans.person_count` + `track_intake`, `profiles.track_intake`, `profile_follows` table (+ its RLS policies). Also hardened the committed file: wrapped the `create policy` statements in `do $$ … exception when duplicate_object` guards so re-runs can't fail.
- `20260521000000_user_themes.sql` — `user_themes` table + RLS (the ledger had a *phantom* applied-row for it but the table never existed).
- `20260526170000_imported_source.sql` — `recipes.original_source` / `original_source_url`, `profiles.show_imported_recipes`. Removed the file's stray `ALTER TYPE recipe_source ADD VALUE` line (no such enum exists — `recipes.source` is `text`).

**New — drift-check workflow (prevents recurrence):**
- `supabase/migrations/20260526160000_migration_drift_helper.sql` — `public.applied_migration_versions()` (security-definer, `service_role`-only) so CI can read the `supabase_migrations` ledger with the existing service key (PostgREST doesn't expose that schema).
- `scripts/check-migration-drift.mjs` — fails if any committed migration's version isn't applied; small ALLOW-list for legacy out-of-band/mis-versioned files. `npm run migrations:check`.
- `.github/workflows/db-drift-check.yml` — runs the check on push to `master` + PRs touching `supabase/migrations/**` (read-only; uses existing `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`).

**Verification:** Browser — all plan-detail pages load again (no 404); the woven builder hydrates from persisted entries and the macro panel reads "PER PERSON" (person_count live). `npm run migrations:check` → ✅ all 26 committed migration versions applied. The check proved itself by catching the unapplied `imported_source` migration during setup. Note: the check is version/ledger-based — it catches "committed but never applied", not a phantom ledger row.

## [Unreleased] — 2026-05-21

### Meal Plan Builder — Persist the woven week (close the rehydration gap + reconnect cook)

**Problem:** The woven week lived only in client state. Reloading a "woven" plan dropped back to the planning view, and "Start cooking" / the shopping list read an empty `meal_entries` (the weave never wrote it). Chose `meal_entries` as the single source of truth (no migration — the table already has `source`/`is_leftover`/`parent_clientid`/`locked`/macros/`position`).

**Changed:**
- `src/app/api/plans/[id]/entries/route.ts` — `PUT` now persists the full entry shape (`source`, `is_leftover`, `locked`, `position`) and maps each entry's ephemeral weave `clientid` → a generated row `uuid`, writing `parent_clientid` as the parent's uuid so leftover→cook-day links survive the atomic delete/insert.
- `src/app/api/plans/[id]/weave/route.ts` — added a `GET` handler that rebuilds the `WeaveResponse` (`entries` + recipe metadata + a pantry-aware recomputed `summary` via `computeSummary`) from `meal_entries`; returns `{ empty: true }` when none. Reuses the existing pantry/recipe-meta logic.
- `src/app/(app)/plans/[id]/use-planner-state.ts` — on mount, when the plan status is `woven`/`cooking`, hydrate the grid from `GET …/weave`; persist the current week to `meal_entries`, skipping the write triggered by hydration. **Weave/reweave persists immediately** (deliberate action, no debounce window — bulletproof), while rapid edits (swap/remove/pin) coalesce through a 600ms debounce. A single `skipNextPersist` ref keeps `runWeave`'s immediate write from being double-written by the `weave`-watching effect. New `persistEntries` helper attaches macros from the weave recipe metadata.

**Verification:** `tsc` clean and `eslint` clean on all three files. Browser-verified end-to-end (port 3002): weave → `PUT /entries 200` (persisted) → **reload hydrates straight to the woven view** (macro band + menu grid) instead of planning; **"Start cooking" shows the woven week** with a populated shopping list. (The later immediate-persist refinement is a 4-line change validated by `tsc`/`eslint`; browser re-verification on `feat/wc-theme-studio` is currently blocked by an unrelated pre-existing 404 on the plan-detail route, whose query selects `person_count, track_intake` columns that are not yet present in the DB.)

### Meal Plan Builder — "Editorial Kitchen" redesign (Part B of builder redesign)

**Problem:** The plan builder (planning Pinboard + woven week) was cramped/dark, led with a wall of filter chips that buried the recipes, showed three empty "No matches" blocks that read as broken, and presented macros + the week grid as flat spreadsheets. Planning→woven was a silent panel collapse.

**Approach:** Picked direction "Editorial Kitchen" after prototyping 3 HTML directions in `_design/builder-redesign/` (A editorial / B calm / C mission-control). UI-only rewire — `usePlannerState` and all API routes unchanged.

**Changed (all in `src/components/plans/` unless noted):**
- `Pinboard.tsx` — editorial hero (search + single **"Tune · N active"** control folding all constraint/inspiration chips + a mono summary line), pinned "shelf", recipe-first gallery; after weave it folds into a slim **"✎ Refine"** bar instead of a silent collapse.
- `PinboardFeed.tsx` — recipe-first gallery (200px editorial cards, `Fraunces` titles); only renders meal sections with results; replaces three stacked "No matches" blocks with **one** inline branded nudge (and a full empty state) that opens Tune via new `onOpenTune` prop.
- `RecipeSearchBar.tsx` — added `variant="hero"|"slim"` for the big hero field vs the slim refine-bar field.
- `ConstraintChipBar.tsx` / `InspirationChips.tsx` — de-stickied + restyled to live inside the Tune panel.
- `PinTray.tsx` — editorial floating build bar ("Weave my week →").
- `WeaveSummary.tsx` — refined mono stat row (pantry / active time / variety) + Reweave + bold "🍳 Start cooking →".
- `MacroSummary.tsx` — four-cell macro **band** with `Fraunces` numerals, `Geist Mono` units, thin progress bars.
- `WeaveGrid.tsx` / `WeaveCell.tsx` — menu-style grid: `Fraunces`-italic meal-row labels, larger warm cells, editorial empty "+ add".
- `src/app/(app)/plans/[id]/plan-builder.tsx` — editorial header + state-aware status pill (olive Planning → saffron Woven).
- `moodboard.config.ts` + `docs/moodboard.log.md` — new "Planner controls (recipe-first)" and "Empty meal results" do/don't pairs; dated log entry.

**Verification:** `tsc` clean on all changed files; `eslint` clean (net-new errors fixed; pre-existing `<a href>`/`any`/`setState-in-effect` patterns left as baseline). Browser-verified live (port 3002): Popular-Plan quick-confirm modal, editorial planning state (hero + Tune + shelf + gallery + build bar), and the woven state (slim Refine bar + stat row + macro band + menu grid) after an in-session weave. `npm run moodboard:check` not run — `scripts/check-moodboard-drift.mjs` is missing from the repo (pre-existing).

**Known gap (out of scope):** woven schedule still isn't persisted to `meal_entries`, so reloading a DB-"woven" plan shows the planning view until re-woven.

### Meal Plan Creation — Kill the double template pick (Part A of builder redesign)

**Problem:** Picking a "Popular Plan" on `/plans` linked to `/plans/new?template=X`, which pre-selected the template but *still* showed the full template carousel below the name field — so the user appeared to choose the same template twice.

**Changed:**
- `src/app/(app)/plans/template-preview-modal.tsx` — now a quick name-confirm: editable prefilled name + creates the plan directly via `POST /api/plans` (template payload) and routes to `/plans/[id]`. Previously just navigated to `/plans/new?template=`. Render-phase reset seeds the name per opened template.
- `src/app/(app)/plans/page.tsx` — Popular Plans now render the (previously unused) `SuggestedTemplates` + `TemplatePreviewModal` (theme-aware, fixes latent light-mode color bug) instead of inline `<Link>` cards.
- `src/app/(app)/plans/new/page.tsx` — removed the template carousel + `?template=` pre-select branch; now the blank/custom path only (name + duration/meals/dietary). Templates live in exactly one place.

**Removed:**
- `src/app/(app)/plans/new/template-card.tsx` — unused after carousel removal.


### Challenge Mode — Live Run Experience

**Problem:** An accepted challenge only surfaced a dim olive-on-near-black banner (nearly invisible), never showed the rules while running, and had no interactive "session" — unlike the immersive Cooking Mode.

**Created:**
- `supabase/migrations/20260520000002_challenge_rules.sql` — adds `rules text[]`, `objective`, `target_seconds`, `strategy_tip` to `challenge_definitions` and `elapsed_seconds` to `challenge_completions`
- `supabase/migrations/20260520000003_challenge_rules_seed.sql` — hand-written rules/objective/target/tip for all 25 challenges (speedrun pars: 5/10/15/20/30 min)
- `src/lib/challenge-run-context.tsx` — `ChallengeRunProvider`: single source of truth for the active run (timer tick + screen wake-lock, pattern from `cooking-mode-context.tsx`)
- `src/app/(app)/challenge/components/challenge-hud.tsx` — persistent **LIVE HUD**, mounted app-wide, follows into Cooking Mode (`z-[150]`)
- `src/app/(app)/challenge/run/page.tsx` + `run-screen.tsx` — immersive fullscreen Challenge Run screen (rules manuscript card, smart timer, strategy tip, completion)

**Changed:**
- `challenge/types.ts`, `utils.ts` — extended `ChallengeDef`/`ChallengeCompletion`/`ActiveChallenge`; added `toActiveChallenge`, `timerView` (count-up vs speedrun countdown w/ tone ramp), `parResult`
- `challenge-hero.tsx`, `challenge-card.tsx` — accept now starts the run via context + routes to `/challenge/run`
- `completion-modal.tsx` — records `elapsed_seconds`, shows par comparison ("Beat par by 0:29 🏆"), spring celebration; `z-[400]`
- `history-log.tsx` — shows run duration ("⏱ 4:31")
- `challenge-client.tsx` — removed inline `ActiveBanner`/completion (HUD owns it now)
- `(app)/layout.tsx` — mounts `ChallengeRunProvider` + `<ChallengeHUD/>`
- `api/challenge/completions/route.ts` — accepts + stores `elapsed_seconds`
- `moodboard.config.ts` + `docs/moodboard.log.md` — new "Active challenge presence" do/don't pair + `challenge-live-pulse` / `challenge-countdown-urgency` motion intents

**Removed:**
- `challenge/components/active-banner.tsx`

**Cross-app:** preserves the existing `challenge_completed` streak event emitted to HolyFlex on completion.

**Verification status:** `tsc` clean on all changed files; `eslint` clean (exit 0); migrations applied to Supabase. Live browser pass pending (dev server). `npm run moodboard:check` could not run — `scripts/check-moodboard-drift.mjs` is missing from the repo (pre-existing).

### Fix — Event detail page broke the production build

**Problem:** `next build` failed type-checking at `events/[id]/page.tsx:87` — `locationOptions` was mapped with an over-narrow `(o: { id: string })` annotation, so spreading `...o` dropped `party_id`/`name`/`address`/etc. and the result didn't satisfy `EventLocationOption[]`.

**Changed:**
- `src/app/(app)/events/[id]/page.tsx` — typed the query with `.returns<EventLocationOption[]>()` and removed the narrowing `{ id: string }` annotations so the full row flows through the vote-count enrichment.

### Fix — Discover background pattern flash

**Changed:**
- `src/app/(app)/discover/discover-feed-client.tsx` — Root wrapper background changed from the opaque floor (`var(--wc-floor, #1F1B19)`) to `transparent`, so the global kitchen-pattern background shows through on the Discover feed instead of being covered once the page mounts. Section cards keep their own backgrounds and cut off the pattern locally.

### Recipe Descriptions — Editorial copy for chunk-001 (300 recipes)

**Created:**
- `scripts/chunks/descriptions-output/chunk-001.txt` — Two-tier (HOOK + BODY) editorial descriptions for all 300 recipes in `scripts/chunks/descriptions/chunk-001.txt`

**Details:**
- Followed the culinary-copywriter brief: 1-sentence hook (≤18 words), 50–75 word body, conservative inference, forbidden-phrase and structural prohibitions enforced
- Cuisine inferred only where the title makes it undeniable (Chinese, Vietnamese, Thai, French, Italian, Russian, etc.); generic American community-cookbook fare framed as "American home kitchens"
- Output is plain UTF-8, no BOM, 300 × (TITLE/HOOK/BODY) blocks separated by `---`
- Generated in 5 batches, concatenated, then repaired a CP1252 double-encoding + BOM artifact from the combine step

---

## [Unreleased] — 2026-05-11

### Onboarding Wizard — Task 15: WhatsCooking Full Onboarding Config

**Created:**
- `src/config/whatscooking.onboarding.config.tsx` — Complete onboarding configuration for WhatsCooking

**Exported Components:**
- `wcOnboardingConfig` — OnboardingConfig object with:
  - **Theme:** Warm brown palette (Accent: #C19A6B, Surface: #2D1E0E, Text: #EFE3CE, Muted: #B08060)
  - **Wizard:** 4 preference steps — CookTypeStep, GoalStep, DietStep, HouseholdStep
  - **Tour:** 11 waypoints spanning Discover → Pantry → Meal Plans → Dinner Party → Scanner → Calorie Tracker → Celebration
  - **Beacons:** 5 advanced feature pointers (Dinner Party, Menu Scanner, Calorie Tracker, Cuisine Passport, Drinks Discovery)

**Key Features:**
- DietStep supports multi-select with "no-limits" toggle behavior
- All other steps single-select for streamlined preference capture
- Tour combines passive demos + interactive do-type actions with celebration callbacks
- Consistent emoji and label-based UI across all steps

---

### Onboarding Wizard — Task 14: WhatsCooking Preference Step Components

**Created:**
- `src/components/onboarding/steps/CookTypeStep.tsx` — 4-option single-select step (Beginner, Home Cook, Enthusiast, Family Chef)
- `src/components/onboarding/steps/GoalStep.tsx` — 4-option single-select step (Use Pantry, Discover, Plan Week, Eat Healthy)
- `src/components/onboarding/steps/DietStep.tsx` — 4-option multi-select step (Plant-based, Gluten-free, Meat Lover, No Limits)
- `src/components/onboarding/steps/HouseholdStep.tsx` — 4-option single-select step (Solo, Couple, Family, Big Household)

**Exported Components:**
- All four components follow `WizardStepProps` interface
- Each renders a 2-column ChoiceCard grid (gap: 9px)
- DietStep features exclusive "no-limits" toggle and multi-select filtering logic
- All steps styled with theme colors and motion presets

**Impact:** Completes the four-screen preference questionnaire for WhatsCooking onboarding, enabling context-aware recipe discovery and meal planning

---

### Onboarding Wizard — Task 11: OverlayTour Orchestrator

**Created:**
- `src/components/onboarding/OverlayTour.tsx` — Master orchestrator for spotlight tour phase

**Exported Components:**
- `OverlayTour` — Manages complete tour lifecycle
  - Renders current waypoint's Spotlight + TooltipBubble
  - Wires ActionGate for `do` type steps with completion handling
  - Shows CelebrationOverlay automatically when waypoint has `celebrationText`
  - Routes celebration-type waypoints directly to CelebrationOverlay without spotlight
  - Props: `config` (OnboardingConfig), `state` (OnboardingState), `onAdvance` (callback), `onActionComplete` (callback)
  - Returns null when not in tour mode or step is out of bounds (safe fallback)

**Control Flow:**
- Celebration-type waypoints bypass spotlight/tooltip and go directly to celebration
- Non-celebration waypoints show spotlight (clickable unless do-type) + tooltip
- Do-type waypoints activate ActionGate listener; on completion, show celebration if text exists
- After celebration, automatically advance to next step
- Step label shows "Step N of M" in tooltip

**Impact:** Completes core tour orchestration layer; integrates all four onboarding primitives (Spotlight, TooltipBubble, ActionGate, CelebrationOverlay) into cohesive user flow

---

### Onboarding Wizard — Task 6: CelebrationOverlay Component

**Created:**
- `src/components/onboarding/CelebrationOverlay.tsx` — Full-screen celebration modal with canvas-based confetti animation

**Exported Components:**
- `CelebrationOverlay` — Fixed-position overlay that celebrates onboarding completion
  - Canvas-rendered confetti particles (80 particles) with gravity, rotation, and multi-color scheme
  - Animated celebration emoji (🎉), heading text, and optional summary bullet points with checkmarks
  - Auto-dismisses after configurable delay (default 2800ms) or on tap anywhere
  - Semi-transparent background overlay dims content beneath
  - Proper z-index layering (10001) to display above all other page content
  - Props: `visible` (boolean), `text` (string), `summary` (optional string[]), `theme` (OnboardingTheme), `onDone` (callback), `autoDismissMs` (optional number)

**Technical Details:**
- Uses `useConfetti` custom hook to manage canvas animation lifecycle
- Particles spawn above viewport and fall with randomized horizontal drift and rotation
- Frame loop cancels cleanly when last particle leaves viewport
- All relative positioning ensures proper overlay coverage on any screen size
- Theme colors applied to text elements; confetti colors hardcoded for visual consistency

**Impact:** Completes final onboarding step with delightful visual feedback; establishes celebration pattern for future wizard completion screens

---

## [Unreleased] — 2026-05-11

### Onboarding Components — Accessibility & Robustness Fixes

**Fixed:**
- `src/components/onboarding/ChoiceCard.tsx` — Added `type="button"` to motion.button to prevent unintended form submission; added `aria-hidden="true"` to `[SELECTED]` terminal badge (decorative, state conveyed by border/background)
- `src/components/onboarding/ProgressBar.tsx` — Clamped progress percentage to 100% with `Math.min()` to prevent progress bar overflow on final step

**Impact:** Improves accessibility tree clarity and prevents edge-case visual overflow

---

## [Unreleased] — 2026-05-11

### Onboarding Wizard — Task 4: ChoiceCard Component

**Created:**
- `src/components/onboarding/ChoiceCard.tsx` — Duolingo-style illustrated tap card for preference selection

**Exported Components:**
- `ChoiceCard` — Motion-animated preference card with emoji icon, label, selection state, and theme-aware styling
  - Supports three motion themes: `snappy`, `smooth`, `terminal`
  - Selected state shows custom background, border, glow shadow, and `[SELECTED]` badge in terminal mode
  - Handles hover (preset-based animation) and tap (0.97 scale) interactions
  - Props: `option` (ChoiceCardOption), `selected` (boolean), `onSelect` (callback), `theme` (OnboardingTheme)

**Exported Types:**
- `ChoiceCardOption` — Card content structure (value, emoji, label, color, selectedBg, selectedBorder)

**Features:**
- Framer Motion variants tied to `MOTION_PRESETS` (motion.ts)
- Terminal mode: JetBrains Mono font, uppercase label, stepped transitions, [SELECTED] badge
- Snappy mode: bold (800 weight) text labels
- Smooth mode: standard (600 weight) text
- Selected state: accent border + glow shadow (16px, 0.2 alpha)
- Touch feedback: scale 0.97 on tap

**Dependencies:**
- `onboarding.types.ts` — OnboardingTheme type
- `onboarding.motion.ts` — MOTION_PRESETS motion definitions

**Commit:** `31718a4`

---

### Pantry — Contrast & Accessibility Fixes

**Fixed (Critical):**
- Error text color: `#991B1B` (2:1 contrast) → `#F87171` (bright red, readable on dark)
  - Form error message (line 635)
  - Photo extraction error message (line 657)
- Waste Not empty state text: `#166534` (2.6:1 contrast) → `#4ADE80` (bright green, readable on dark)

**Fixed (Minor):**
- Expiry dismiss button hover state: `hover:bg-orange-100` (cream) → `hover:bg-[#5A2800]` (dark brown, on-theme)

**Files Changed:**
- `src/app/(app)/pantry/pantry-client.tsx` — 4 lines

**Commit:** `d7d7a14`

---

### Onboarding Wizard — Task 1: TypeScript Interfaces

**Created:**
- `src/components/onboarding/onboarding.types.ts` — Foundation type definitions for entire onboarding system

**Exported Interfaces:**
- `OnboardingTheme` — Visual theme configuration (motion, accent, colors, storage key)
- `WizardStepProps` — Props contract for preference card step components
- `OnboardingWizardStep` — Step definition (id, component, title, multiSelect option)
- `OnboardingWaypoint` — Tour waypoint (type, target, positioning, completion triggers, celebration)
- `OnboardingBeacon` — Beacon markers for contextual hints
- `OnboardingConfig` — Master config object (theme, wizard steps, tour waypoints, beacons)
- `OnboardingState` — Persisted onboarding state (mode, step tracking, answers, dismissals, completions)

**Purpose:**
- Foundation for 22-task onboarding wizard build (Duolingo-inspired)
- All subsequent components depend on these type definitions
- Supports multiple onboarding modes: wizard, tour, beacons, done

**Commit:** `7678a27`

---

### Pantry Client — Orphaned Fragment Removal

**Fixed:**
- Removed unnecessary nested `<>...</>` fragment wrapper in pantry tab content (lines 538–957)
- This was leftover from a previous refactor and served no functional purpose

**Files Changed:**
- `src/app/(app)/pantry/pantry-client.tsx` — removed 2 lines

**Commit:** `db10392`

---

## [Unreleased] — 2026-05-11

### Discover Swipe — Accessibility & UX Fixes

**Fixed:**
- Expanded swipe deck query to include all fields needed by HeroSwiper: `difficulty_level, ingredients, instructions, servings, protein_g, carbs_g, fat_g, dish_types`
- Added missing `type="button"` to difficulty filter chip buttons
- Improved deck count contrast from `#4A3020` to `#8A6A4A` for visibility on dark background
- Added `touchAction: "none"` to card stack container to prevent mobile browser scroll interception
- Disabled pointer events on back card to prevent accidental button activation

**Files Changed:**
- `src/app/(app)/discover/page.tsx` — query expansion
- `src/app/(app)/discover/hero-swiper.tsx` — 4 fixes (button type, contrast, touch-action, pointer-events)

**Commit:** `508db49`

---

### Swipe UI — Task 2: Shared Swipe Card Components

**Created:**
- `src/components/swipe/swipe-cards.tsx` — pure presentational components for swipe interface

**Exported Components:**
- `RecipeCard` — Full-screen recipe card with LIKE/NOPE stamps, image overlay with gradient, difficulty badge, cuisine tags, dietary tags, time, calories info
- `RecipePreviewSheet` — Bottom-sheet modal with full recipe details: expandable ingredients & instructions, nutrition macros, dietary tags, action buttons (Skip/Save/Like), link to full recipe page
- `MatchScreen` — Results screen showing liked recipes in compact card list with save toggles, filtering, swipe-again button, navigation back to discover

**Features:**
- `DIFFICULTY_CONFIG` export for shared difficulty level styling (Easy/Medium/Challenging)
- Consistent styling: warm palette (#C85A2F Ember, #F5EDE4 backgrounds, #3D2817 text)
- LIKE stamp (green #4CAF50) and NOPE stamp (orange) with rotated animations
- Expandable accordion sections for ingredients and instructions (useState toggles)
- Conditional rendering of nutrition badges (protein/carbs/fat) and dietary tags
- Responsive layout with image fallback emoji placeholders
- Interactive buttons with proper event propagation handling (onPointerDown stops propagation)

**Type Dependencies:**
- `SwipeRecipe` type imported from `@/lib/hooks/use-swipe-session` (created in Task 1)

**Commit:** `3f04f7f`

---

## [Unreleased] — 2026-05-10

### Discover Feed — Task 3: TrendingSection Component

**Created:**
- `src/app/(app)/discover/trending-section.tsx` — horizontal scrolling trending recipes component with save counts, prep/cook times, and "+N more" pagination tile

**Features:**
- Displays trending recipes in a compact 90px card layout with image preview
- Shows saved count (with 1k formatting) or total prep+cook time
- Conditional "+N more" tile links to full trending recipes page
- Client-rendered with CSS custom properties for dark theme integration
- Includes alt recipe emoji fallback for missing images

**Commit:** `40ec785`

---

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
