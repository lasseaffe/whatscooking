# Meal Planner — Pinboard + Weave Redesign

**Status:** Design approved · ready for implementation plan
**Owner:** Lasse
**Project:** What's Cooking
**Path affected:** `/plans/[id]` and supporting APIs/DB
**Replaces UX of:** `WeeklyPlanGrid` + `RecipeBank` flow (data model retained)

---

## 1. Why

The current meal planner at `/plans/[id]` has three concrete bugs and one structural problem.

**Bugs:**

1. The empty-cell `+` button in `WeeklyPlanGrid.tsx:362` triggers the LLM autofill endpoint. If it hangs or returns empty, the loader vanishes silently — the user perceives "loads forever, then nothing." The intent of `+` (open picker) and its behaviour (summon AI) are misaligned.
2. Recipe images don't reliably render in cells. The save pipeline often strips `image_url` from `plan_entries`, and cells fall back to a text-only layout that looks broken.
3. The weekly macro breakdown (`weekMacros()` in `plan-grid.tsx:49`) sums nullable fields with `?? 0`, turning unknowns into zeros. Only kcal/protein/carbs/fat are shown — no fiber, sugar, sodium, sat fat, no per-portion view, no goal comparison.

**Structural:**

The grid is a labelling surface — it asks the user to know what they want in each slot before they sit down. The chosen user mood is *exploratory, has time, wants to be inspired*. The current UI doesn't serve that.

## 2. What we're building

A new front door for `/plans/[id]` built on two mental moves the user already makes naturally: **browse and gather, then arrange**. One scrollable page; no tabs between the two halves.

- **Pinboard** — the top half of the page. A filterable recipe feed driven by first-class constraints (diet, time/effort, household fit, pantry, anti-repeat, batch toggle) and a multi-select inspiration layer (cuisine, mood, season, chef). The user pins 3+ recipes that spark joy.
- **Weave** — the bottom half. A "Weave the week" CTA produces a deterministic, server-side arrangement of the pins + smart suggestions into the week grid, optimised for the active constraints. Pinned cells are locked; suggestion cells are visually distinct and can be promoted to pins.
- **Smart-swap rebalance** — swapping a single cell live-re-ranks adjacent suggestion cells without moving them. Auto-reweave-with-undo applies whenever constraints change.

Cook-week (execution / shopping list / day-by-day cards) becomes its own route at `/plans/[id]/cook`, out of scope for this design but referenced as a destination.

## 3. Page architecture

```
/plans/[id]
│
├── Header (sticky)
│   Plan name · constraint summary · "Start cooking →" link when ready
│
├── PINBOARD section
│   • Constraint chip bar (sticky beneath header)
│   • Inspiration chip row (multi-select, additive ranking)
│   • Recipe feed (2-col desktop / 1-col mobile)
│   • Pin tray (sticky bottom while ≥1 pin)
│
├── WEAVE section
│   • "Weave the week" CTA (visible when ≥3 pins)
│   • Once woven: summary strip + week grid + smart-swap behavior
│
└── /plans/[id]/cook — separate route, future work
```

A new `plans.status` field drives default landing scroll position when reopening a plan:

- `planning` → top of Pinboard
- `woven` → scrolled to Weave section
- `cooking` → redirect to `/cook` route

## 4. Pinboard

### 4.1 Constraint chips (first-class, always visible)

- **Diet** — vegan, gluten-free, allergies. Hard filter.
- **Time / effort** — separate weeknight + weekend budgets ("≤30m weeknights", "have Sunday").
- **Household fit** — squad size + kid-friendly toggle.
- **Pantry-aware** — **aggressive mode**: when on, hides recipes that require buying more than N missing ingredients (N = 4 default, user-tunable).
- **Anti-repeat** — strict / moderate / off.
- **Batch logic** — off by default. When on, batch-friendly recipes get a "🍳 cook once → eat twice" badge in the feed and the Weave solver intentionally pairs leftover days.

### 4.2 Inspiration chips (multi-select, additive ranking)

Tagging multiple chips (e.g., "Italian + Cozy + Quick") **re-ranks** the feed without restricting it. Each active chip contributes to an `inspiration_match` score component during ranking. Single chip behaves identically to old single-select but with composability built in.

Categories: cuisine, mood/occasion, season, chef/curator, recipe-driven, constraint-creativity.

### 4.3 Feed cards

Each card shows: image (focal-point cropped), title, time, kcal, **constraint-match badges** that surface why this recipe is being shown ("4/6 in pantry", "vegan ✓", "30 min", "didn't have last week", "🍳 batch-friendly").

Pin button per card. Pinning is reversible and visible via the pin tray.

### 4.4 Pin tray

Sticky bottom strip when ≥1 pin. Shows count + thumbnails (reorderable for priority). Includes the **"Weave the week →"** CTA once the hybrid quality meter (see 4.5) signals enough pins.

### 4.5 Hybrid pin minimum

The Weave runs on **any number of pins** but the CTA exposes a quality meter:

> "3 pins — you're letting the app pick a lot. Pin a few more to shape the week."

The meter turns from yellow to green at ≥ `ceil(slots / 3)` pins for the plan's slot count. Below 3 pins, the CTA is disabled.

## 5. Weave

### 5.1 What the Weave produces

A server-side **deterministic constraint-satisfaction solver** at `POST /api/plans/[id]/weave`. The solver returns proposed `plan_entries` **without persisting**. The client previews and commits via the existing `PUT /api/plans/[id]/entries`.

**Solver phases:**

1. Score each pin for slot-fit (effort-vs-day-shape).
2. Greedy-place pins (heavy → weekend, light → weeknight; Sunday gets batch-friendly pins first if batch is on).
3. Expand batch-friendly pins into `leftover` sub-entries (only when batch enabled). A leftover sub-entry is anchored to its parent pin via `parent_clientid` and inherits `recipe_id`, but is marked `source='leftover'`.
4. Fill remaining slots from a constraint-filtered recipe pool, ranked by:
   - pantry_match × 0.35
   - anti_repeat_fit × 0.30
   - effort_fit × 0.20
   - diet_match × 0.10 (hard filter precedes, then bonus for tag overlap)
   - inspiration_match × 0.05 per active chip
5. Compute summary: pantry % covered, active cooking minutes, variety score, leftover count.

**Determinism:** same input + same pool ordering yields the same output. A `Reweave` button passes an explicit `?seed=<random>` for variation.

### 5.2 Cell archetypes

- **Pinned cell** — solid border, image full-bleed, "📌" badge. Locked from auto-reweave.
- **Suggestion cell** — dotted border, image dimmed slightly, "✨" badge. Promote-to-pin on click.
- **Leftover cell** — translucent fill, "♻" badge, label "Tuesday's curry, reheated". Treated as a **sub-type of its parent pin** — removing a leftover puts active cook time back into the parent's column.

### 5.3 Smart-swap rebalance (borrowed from Approach 3)

- Tap any cell → constraint-aware picker opens, **pre-filtered** to plan diet + meal type + variety gap awareness (highlights options that improve neighbor variety).
- On select → cell updates → **adjacent suggestion cells re-rank in place** with a subtle pulse animation. Pinned cells never auto-change.
- Anti-repeat violations after a swap surface a yellow underline + tooltip ("same protein as Wed — tap to swap").

### 5.4 Auto-reweave on constraint change

Constraint chip tweaks → suggestions re-rank instantly; pins stay; an undo toast appears at the bottom. Manual "Reweave" button remains for explicit regeneration with a new seed.

### 5.5 Summary strip

```
🥕 Pantry: 73% covered (need 14 items)
⏱ Active cooking: 3h 20m   ·   🔁 Variety: high   ·   ♻ 2 leftover
[ ⚙ Tune constraints ]  [ 🔀 Reweave ]  [ 🛒 Shopping list ]
```

## 6. Cell + macro design (fixes #2 and #3)

### 6.1 Cell rendering

Image space is **always reserved**, regardless of data. Three breakpoints:

| Width | Image | Title lines | Meta line |
|---|---|---|---|
| ≥1200px | 80px tall, full bleed | 2 | time · kcal · badge |
| 760–1199px | 56px tall | 2 | time · kcal |
| <760px | 40px square left, text right | 2 | time · kcal stacked |

All cells use a single `RecipeImage` component with:

- `object-fit: cover` + `object-position: ${focal_x}% ${focal_y}%` (uses the existing `20260518_recipe_focal_point` migration, defaults 50/50).
- Warm-tone shimmer while loading.
- Warm-tone cookware glyph for absent images.
- Never a broken-image icon or gray default skeleton (Apple compliance: no generic defaults).

Cells fetch `image_url` + `focal_x` + `focal_y` from `recipes` via a JOIN in the entries query — not per-cell N+1 lookups.

### 6.2 Macros — three-state model

A macro number is in one of three states:

- **Known full** — bold, brand color. All entries in scope contributed.
- **Known partial** — `~` prefix; tooltip lists which meals lacked data.
- **Unknown** — `—` em-dash, muted.

`weekMacros()` is rewritten to:

- Track `slotsKnown / slotsTotal` per macro.
- Treat null as unknown, never zero.
- Emit the three-state view model.

### 6.3 Summary + per-day footer layouts

```
WEEK SUMMARY (above grid)
  ⚡ Energy        1,840 / 14,000 kcal     [████░░░░░░] 13% known
  🥩 Protein           94g
  🌾 Carbs            230g
  🥑 Fat               72g
  [ ▾ More: fiber, sugar, sat fat, sodium · per-portion view ]

PER-DAY FOOTER (under each column)
  Mon  Tue  Wed  Thu  Fri  Sat  Sun
  540  410  720  ─    580  ─    810
  P32  P28  P45  ─    P34  ─    P52
```

### 6.4 Goal mode

When `plans.nutritional_goals` is populated, macro bars in the summary fill against targets ("94g / 140g protein this week — 67%"). When empty, absolute numbers only.

### 6.5 Display-time macro estimator

When a recipe's macro columns are null **and** `macros_estimated` is false **or** version mismatched:

- Page renders cells with em-dashes immediately.
- Fires async `POST /api/recipes/[id]/estimate-macros`, max 6 in flight.
- Endpoint prompts an LLM with the ingredient list, parses JSON, writes columns, flips `macros_estimated = true` + sets `estimator_version`.
- Each resolved row updates its cell in place with an "est." label and a dotted underline.
- Hybrid backfill: new recipes get estimated **eagerly at ingest**; legacy nulls get estimated **lazily on plan view**.

The grid never blocks render on the estimator.

## 7. Recipe picker behaviour (fixes #1)

The `+` button is gone from the woven grid — empty slots in a woven plan don't exist, they're filled by suggestions. The picker is invoked by **tapping any cell**.

Picker contract (`GET /api/recipes/picker`):

- Pre-filtered by plan dietary tags + meal type.
- Ranked by anti-repeat awareness of the current woven entries.
- Returns a "✨ Suggest one for me" secondary CTA — explicit AI autofill, with cancel button, 6s timeout, friendly fallback. Replaces the implicit autofill-on-click that was the source of the original bug.

Replaces today's `/api/recipes/autocomplete` calls for the in-plan picker context. Autocomplete endpoint stays for use elsewhere.

## 8. Data model

### 8.1 New / additive

```
plans
  + status            text not null default 'planning'
                      enum: 'planning' | 'woven' | 'cooking' | 'archived'
  + pinboard_filters  jsonb default '{}'
  + last_woven_at     timestamptz

plan_pins  (new)
  id           uuid pk
  plan_id      uuid fk plans
  recipe_id    uuid fk recipes
  pinned_at    timestamptz default now()
  priority     int default 0
  unique(plan_id, recipe_id)

plan_entries  (additive only)
  + source            text not null default 'pinned'
                      enum: 'pinned' | 'suggestion' | 'leftover' | 'manual'
  + parent_clientid   uuid null
  + locked            boolean default false

recipes  (additive only)
  + macros_estimated     boolean default false
  + macros_estimated_at  timestamptz null
  + estimator_version    text null
  + fiber_g, sugar_g, sat_fat_g, sodium_mg  numeric null
  + batch_friendly       boolean default false
```

RLS for `plan_pins` mirrors existing `plan_entries` owner-scoped policy.

### 8.2 API surface

**New:**

- `POST   /api/plans/[id]/pins` — body `{ recipe_id }`
- `DELETE /api/plans/[id]/pins/[recipeId]`
- `PATCH  /api/plans/[id]/pins/[recipeId]` — body `{ priority }`
- `GET    /api/plans/[id]/pins`
- `POST   /api/plans/[id]/weave` — body `{ reweave?: boolean, seed?: number }`
- `PATCH  /api/plans/[id]` — body `{ pinboard_filters?, status? }`
- `POST   /api/recipes/[id]/estimate-macros`
- `GET    /api/recipes/picker` — query `?meal_type=&plan_id=&exclude_recipe_ids=&q=`

**Untouched (intentionally):**

- `PUT /api/plans/[id]/entries` — the persistence endpoint. Weave proposes; client commits via this.

### 8.3 Solver location

Server-side route at `POST /api/plans/[id]/weave`. The pure solver lives in `src/lib/weave-solver.ts` and is unit-testable in isolation.

## 9. Component map

| Component | New / changed |
|---|---|
| `src/app/(app)/plans/[id]/page.tsx` | Reorganised: renders Header + Pinboard + Weave sections |
| `src/app/(app)/plans/[id]/plan-builder.tsx` | Becomes thinner — just wires data into Pinboard + Weave |
| `src/components/plans/Pinboard.tsx` | NEW — constraint bar + inspiration chips + feed |
| `src/components/plans/ConstraintBar.tsx` | NEW — sticky chip controls |
| `src/components/plans/InspirationChips.tsx` | NEW — multi-select additive chips |
| `src/components/plans/PinTray.tsx` | NEW — sticky bottom strip |
| `src/components/plans/RecipeBank.tsx` | Retired (its responsibilities split into Pinboard + Picker) |
| `src/components/plans/WeeklyPlanGrid.tsx` | Refactored: cell archetypes, smart-swap, no `+` |
| `src/components/plans/MacroSummary.tsx` | NEW — three-state summary + per-day footer |
| `src/components/recipe-image.tsx` | Patched to consume `focal_x` / `focal_y` |
| `src/lib/weave-solver.ts` | NEW — pure deterministic solver |
| `src/app/api/plans/[id]/weave/route.ts` | NEW |
| `src/app/api/plans/[id]/pins/route.ts` | NEW |
| `src/app/api/recipes/picker/route.ts` | NEW |
| `src/app/api/recipes/[id]/estimate-macros/route.ts` | NEW |

## 10. Cross-app + moodboard hooks (CLAUDE.md mandates)

**Ecosystem connectivity:**

- WC dietary prefs already flow to HolyFlex / VenturePath. Pinboard reads the same `user_preferences.dietary` — no duplication.
- WC household members already populate VP squad. Household-fit constraint chip reads from the existing household table.
- Plan completion fires the existing `recipe_cooked` streak event into HolyFlex when a cell in `/cook` is marked done (out of scope here but the data model preserves that).

**Moodboard:**

- New cell archetypes, the constraint chip pattern, and the macro three-state pattern are new editorial primitives. `src/app/moodboard/moodboard.config.ts` must add: cell archetypes, constraint chip pattern, macro display states, leftover badge pattern.
- `docs/moodboard.log.md` gets a dated entry with `### Changed` and `### Ideas / next steps`.
- `npm run moodboard:check` runs clean.

## 11. Out of scope

- `/plans/[id]/cook` — execution view, shopping list, day-by-day cards. Separate spec.
- Density ribbon polish (deferred, prompt provided to user for a later session).
- Budget constraint chip and currency-aware costing.
- Multi-week / rolling plans.
- AR / camera / vision features.

## 12. Risks

- **Estimator quality.** Display-time LLM macro estimation can produce wrong numbers. Mitigations: clear "est." labeling, dotted underline, source ingredient list visible on tap, version field allows mass invalidation.
- **Solver correctness.** A bad ranking weight can produce visibly silly weeks. Mitigation: solver is pure and unit-tested with fixture cases before UI integration.
- **Migration of in-flight plans.** Existing `plan_entries` without `source` default to `'pinned'`. Existing plans get `status='planning'` by default; a one-shot backfill marks any non-empty plan as `'woven'`.
- **Image fix scope.** Image rendering is broken across multiple surfaces, not just plan cells. The single-component fix in `RecipeImage` should resolve it everywhere; verify in Discover and saved-recipes surfaces too.

## 13. Acceptance criteria

A user can:

1. Open a fresh plan and land on Pinboard with constraint + inspiration chips visible.
2. Apply multi-select inspiration chips and watch the feed re-rank.
3. Toggle pantry-aware aggressive mode and watch the feed contract.
4. Pin 5+ recipes; see the pin tray populated; trigger Weave.
5. Receive a deterministic woven week with pinned + suggestion + leftover cells visually distinguished.
6. Tap any cell to open the constraint-aware picker — picker opens **immediately**, no LLM hang.
7. Trigger explicit AI suggestion from inside the picker; see clear loading + cancel + graceful fallback.
8. See every cell render an image (real or fallback glyph) without broken icons.
9. See the macro summary distinguish known / partial / unknown states with em-dashes for unknowns and "est." labels where estimated.
10. Swap a cell and see neighbor suggestion cells re-rank in place with anti-repeat warnings if violated.
