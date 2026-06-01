# What's Cooking — Moodboard Change Log

Newest entry on top. Top 5 entries are rendered in the in-app moodboard Change Log section.

---

## 2026-06-02 — Household nav group, swipe parity, compact recipe peek, flag-forward WC cards

### Changed

- **New "Household" sidebar group** (in `app-nav.tsx` `NAV_GROUPS`, after "My Kitchen"): consolidates the shared/family side of the app — **Family** (Hub, Members, Recipes, Guides), **Household** (shared kitchen, members & groups), and **My Pantry** (+ Shopping List, moved out of "My Kitchen"). "My Kitchen" now holds only personal items (My Recipes, Cookbooks). Mirrored into the mobile "More" sheet. New IA vocabulary: **Household** as the umbrella for family + shared-kitchen + pantry.
- **Swipe feel parity:** the landing-page card now tracks the pointer 1:1 like Discover's deck (drag guarded by a synchronous ref, not stale state) — the swipe gesture is now consistent across landing and `/discover`.
- **Recipe peek card:** the card-tap preview changed from a near-fullscreen bottom sheet (`max-h-[92vh]`) to a **compact centered modal** (`max-w-sm`, `max-h-[80vh]`). Lists ingredients + macros + "Full Recipe Page" CTA; **inline step-by-step instructions removed** (they live on the full recipe page). A "peek, then commit" pattern — quick triage without leaving the deck.
- **Flag-forward World Cup country cards:** `/cuisines/world-cup-2026` listing cards and the country-detail hero now show the nation's **real flag** (flagcdn.com, via new `flagcdnCode()` helper with GB-subdivision fallback) instead of a generic food photo — a nation is represented by its flag, not a random dish.

### Ideas / next steps

- Seed ≥10 real recipes per WC nation so every flag card reads a "10 recipes" count (in progress — content marathon, batched by confederation).
- Consider extracting a shared low-level `useSwipeDeck` primitive so landing + Discover can't drift again (deferred — data shapes differ).
- Household "Kitchen Groups" currently folds into the `/household` hub (no standalone groups page exists yet); promote to its own nav child once a groups UI ships.

## 2026-06-02 — World Cup 2026 reapproach: allegiance-driven "matchday" surface

### Changed

- World Cup hub (`/world-cup-2026`) reframed from a collection-driven **Passport Challenge** to an allegiance-driven **"Your Table"** experience. New IA top-to-bottom: **My Teams** hero → **team picker** (inline when empty, behind a disclosure once teams are followed) → **My Matchdays** feed → **Passport** demoted into a collapsed `<details>` section.
- New "stadium night" sub-surface vocabulary, consistent with the existing WC palette (pitch-green `#0A1A08`, parchment `#EFE3CE`, saffron `#F4A261`, Libre Baskerville serif headings, confederation accent colors): **Matchday Menu** (single-evening: half-time snacks + both nations' signature dishes), **Your matchday / Featured match** row tags, primary-team **star** affordance.
- Team chips use confederation accent as the *fill* when followed (high-contrast dark text on saffron/green), hollow when not — a tactile, kitchen-readable toggle rather than a generic checkbox list.
- Retired the floating today-only `WcMatchdayPanel` from the hub; its watch-party + (soon) photo affordances are absorbed into expandable matchday rows.

### Ideas / next steps

- Wave 2: persistent **Watch Squads** (reuse `kitchen_groups`) + auto-suggested per-match events seeded with the matchday menu; needs a "Watch Squad" vocabulary entry once the UI lands.
- Wave 3: shareable **Matchday Menu card** (OG image) + **"Cooked the World"** leaderboard (built on `wc_match_photos`) + dismissible season nudge on discover/home.
- Menu items still lean on title/cuisine matching against `recipes`; seeding a few canonical sports-snack recipes would lift fidelity above the curated fallbacks.
- Drift: new surfaces use inline hex consistent with the established WC theme (not global tokens) — folded into the existing WC-theme allowance, not the core palette.

## 2026-05-30 — Recipe header: image-left F-shape + ingredients lifted to header

### Changed

- Recipe page header restructured to honor the F-shape reading pattern: the hero image + Start Cooking CTA now anchor the **left** (~44%), and the interactive ingredients panel fills the freed **right** column. Title + metadata move full-width **below** the image/ingredients row.
- Mobile header reflow: full-bleed hero with a **title-on-image overlay** (gradient scrim for legibility on any photo), then meta/description, then the ingredients panel, then a **sticky bottom Cook bar**.
- New shared state seam (`RecipeStateProvider`) keeps servings / unit system / ingredient list in sync between the header ingredients panel and the instructions/phase runner below.

### Ideas / next steps

- ✅ DONE (same day): §12 Recipe Page Template updated to image-left + ingredients-right + title-below (Zone 1) and Focus Card instructions runner (Zone 2), legend rewritten incl. mobile overlay/sticky-cook note.
- ✅ DONE (same day): removed the now-dead body ingredients sidebar in recipe-columns-client.
- Tooling: `scripts/check-moodboard-drift.mjs` now exists (was referenced by `npm run moodboard:check` but missing). Advisory hex-drift scan, warn-only. First run flags 88 inline hexes outside the palette — a backlog to triage into tokens or the script's allow-list over time.

## 2026-05-30 — Cooking Mode "Focus Card" + step-counter unification

### Changed

- New shared step surface `.wc-focus-card` (warm gradient, ember-tinted border, soft shadow) used by BOTH the full-screen Cooking Mode and the inline phase runner, so the two step experiences read as one design. Light/Sabbath variant via `.wc-focus-card[data-palette="light"]`.
- New canonical step indicator: `.wc-step-dots` / `.wc-step-dot` (active = elongated saffron pill, done = sage, upcoming = cocoa) + `.wc-step-count` mono label. This is now the ONLY step counter — removed the duplicate "Step X of Y" that previously rendered in both the mobile top bar AND the step body of full-screen Cooking Mode.
- Step type scaled up for kitchen legibility: full-screen heading `clamp(28→40px)`, body `clamp(16→19px)`.
- Step illustration moved from faint full-bleed ghost to a deliberate right-side anchor behind the Focus Card.
- Duration + chef tip now dock inside the card (`.wc-duration-chip`, `.wc-card-tip`) instead of floating loose.
- Removed the `.cook-next-bar` top gradient glow (flat floor now).
- All new classes reuse existing brand tokens — no new tokens introduced.

### Ideas / next steps

- Recipe header restructure still pending: image-left F-shape anchor + Cook CTA under image + ingredients lifted to the right column (needs a RecipeStateProvider to share servings/units between header ingredients and body instructions). This will require updating §12 Recipe Page Template's spatial contract.
- Mobile header reflow pending: title-on-image overlay + sticky bottom Cook bar.
- Consider migrating the inline runner's richer `ChefTipBox` to the slimmer `.wc-card-tip` pill for full parity.

---

## 2026-05-29 — §12 Recipe Page Template added to moodboard

### Changed

- **New moodboard section §12 "Recipe Page Template"** documents the spatial contract for every recipe detail page with a live, annotated render using real design tokens.
- Three annotated zones with dashed border labels: Zone 1 (editorial header — cuisine label + Fraunces title + italic description + metrics row + time bar + dietary tags + hero image + Cooking Mode CTA), Zone 2 (recipe columns — ingredients 38% with checkboxes/pantry badges/metric toggle, instructions with phase stepper + saffron-highlighted active step), Zone 3 (interactions — save/comment/star rating + comment thread).
- Legend panel below the template lists every element per zone for quick scanning.
- Added `RecipePageTemplate` section to moodboard TOC and page.
- Identity pillar updated to reference §12 as the canonical spatial contract.

### Ideas / next steps

- Add a mobile-breakpoint variant (single column, full-bleed hero) to the template section.
- Add the DrinkProPanel variant (shown only for drink dish types) as a sub-template.

---

## 2026-05-21 — Meal Plan Builder: Editorial Kitchen redesign

### Changed

- **The plan builder is now recipe-first, not control-first.** The old planning surface led with a dense wall of filter chips (Diet / Weeknight / Weekend / Squad / Pantry / Anti-repeat / Batch) stacked on top of a tiny recipe feed. It now leads with an **editorial hero** — a `Fraunces` italic prompt ("Search the library, or follow a craving below."), a large warm search field, and a single **"Tune · N active"** control that folds every constraint + inspiration chip behind one button. A quiet `Geist Mono` summary line shows what's active. New `doDont` pair "Planner controls (recipe-first, not control-first)".
- **Empty meal results no longer read as broken.** The three stacked "No matches — try different filters" blocks are replaced by a recipe-first gallery that only renders meal sections with results, plus **one** small branded nudge ("Nothing new for *lunch & dinner* under your filters → Loosen filters") that opens Tune. New `doDont` pair "Empty meal results".
- **Pinned recipes get an editorial shelf** — overlapping rounded thumbnails + a `Fraunces` "{n} recipes ready" — instead of a cramped count in the chrome.
- **Woven week reads like a menu, not a spreadsheet.** Week Macros became a four-cell **band** with big `Fraunces` numerals + `Geist Mono` units + thin progress bars (energy ember, protein olive, carbs gold, fat persimmon). The day grid uses `Fraunces`-italic meal-row labels (Breakfast / Lunch / Dinner) and larger, warmer recipe cells. The stat row (pantry / active time / variety) is a clean mono read-out with a bold "🍳 Start cooking →".
- **Planning → Woven is an intentional handoff, not a silent collapse.** Once woven, the planning surface folds into a slim **"✎ Refine"** bar (pin thumbnails + search + reweave) that re-expands the gallery on demand; the header status pill shifts olive (Planning) → saffron (Woven).
- **Template selection consolidated.** Popular Plans on `/plans` now open a quick name-confirm that creates the plan and lands directly on the builder; `/plans/new` is the blank/custom path only. (No more picking a template twice.)

### Ideas / next steps

- Persist the woven schedule to `meal_entries` so reloading a "woven" plan rehydrates the grid instead of dropping back to planning (current latent gap — woven state lives in client memory until the cook page).
- Consider a horizontal-scroll affordance hint on the week grid for Days 5–7.
- The pre-existing top breadcrumb header above the builder duplicates the plan title with the editorial header — worth merging into one.

---

## 2026-05-20 — Challenge Mode: Live Run Experience

### Changed

- **An active challenge is now a first-class live session, not a dim banner.** The old olive-on-near-black banner (`#1a2010` / `#3a5020`) — nearly invisible — is replaced by a bold, persistent **LIVE HUD**: persimmon/saffron on `#1F1B19`, a pulsing `●` LIVE dot, a `Geist Mono` ticking timer, expandable rules, and a one-tap ✓ Done. Captured as a new `doDont` pair ("Active challenge presence") in `moodboard.config.ts`.
- **The HUD follows the user app-wide** — including on top of Cooking Mode (`z-[150]` over the cooking overlay at `z-[100]`) — so a constraint challenge (e.g. "Microwave Only") rides along while you actually cook. Mounted once via `ChallengeRunProvider` in `(app)/layout.tsx`.
- **New immersive Challenge Run screen** (`/challenge/run`) mirroring Cooking Mode: `fixed inset-0`, wake-lock, `Fraunces` headline, the objective, rules set as a kitchen-manuscript card (`Libre Baskerville` body, mono persimmon numerals), a collapsible strategy tip, and a category-tinted ambient wash.
- **Smart per-category timer** (new motion intents `challenge-live-pulse` + `challenge-countdown-urgency`): speedruns count *down* to a par time with the timer ramping saffron → amber (`#F2A900`) → red (`#ff6b6b`); everything else counts up. Completion shows a par comparison ("Beat par by 0:29 🏆") and a spring celebration.
- **Challenge content deepened**: every challenge now carries structured `rules[]`, an `objective`, an optional speedrun `target_seconds`, and a `strategy_tip` (schema + reseed migrations). Run duration is recorded (`elapsed_seconds`) and shown in History ("⏱ 4:31").

### New files

- `src/lib/challenge-run-context.tsx` — `ChallengeRunProvider` (active run, elapsed timer, wake-lock)
- `src/app/(app)/challenge/components/challenge-hud.tsx` — persistent LIVE bar
- `src/app/(app)/challenge/run/{page,run-screen}.tsx` — immersive Run screen
- `supabase/migrations/20260520000002_challenge_rules.sql` + `20260520000003_challenge_rules_seed.sql`

### Ideas / next steps

- Surface fastest-time-per-challenge on the leaderboard now that `elapsed_seconds` is recorded.
- Cross-app: expose completed challenges as shareable links in HolyFlex communities (TODO in code).
- Optional: keep a live mini-HUD pinned inside Cooking Mode's own chrome rather than floating over it, for tighter integration.

---

## 2026-05-20 — App-Wide Design Polish + Tactile Elegance Light Mode

### Changed

- **Tactile Elegance palette** replaces Culinary Parchment as the light mode (`html[data-theme="light"]`). Surfaces shift to sun-bleached linen (`#F5EDD6` → `#FFF9F2`), primary accent switches from claret to terracotta (`#C4622D`), secondary accent becomes deep forest green (`#2D5016`), text to charcoal (`#2C2C2C`). Dark mode is unchanged.
- **Context-sensitive background opacity** via `BgModeProvider` + `SetBgMode` client component. Kitchen pattern now fades to 10% on functional pages (recipe detail, all-recipes, pantry), 4% in cooking mode, and stays at 100% on Discover (hero). Pages register their mode by rendering `<SetBgMode mode="…" />`.
- **Recipe card metadata chips** now always include calorie chip (`Flame` icon + `kcal`) when data is available, alongside existing time and difficulty chips. Null-safe: missing data = chip omitted.
- **Meal plan pinboard** given elevated card treatment (`background: rgba(26,18,10,0.6)`, `border`, `box-shadow`, `minHeight: 480`). Now reads as the page's primary hero element, not a collapsible widget.
- **Meal plan CTA** renamed: "Weave the week →" → "Build this week →". Empty WeaveSection copy updated from "weave them into a week" to "build your week".
- **WeaveGrid day labels** now use `var(--wc-plan-day-label)` (#EFE3CE in dark, #2C2C2C in light). Meal-type sub-labels use `var(--wc-plan-day-label-sub)` (#A08060 / #7A6555). Previously both were hardcoded `#8A6A4A` (too dark to read clearly).
- **Empty slot drop zones** now use `var(--wc-plan-slot-empty-border)` and `var(--wc-plan-slot-empty-bg)` tokens with `+ add` label — intentional dashed treatment, not the previous black `+` invisible against dark surfaces.

### New tokens added to globals.css `:root`

```
--wc-overlay-bg-hero: 1
--wc-overlay-bg-functional: 0.10
--wc-overlay-bg-cook: 0.04
--wc-card-grid-meta-opacity: 1
--wc-plan-day-label / --wc-plan-day-label-sub
--wc-plan-slot-empty-border / --wc-plan-slot-empty-bg
--wc-plan-pinboard-flex: 1
--rc-title / --rc-meta / --rc-sub / --rc-bg / --rc-surface / --rc-rim / --rc-accent
```

### New files

- `src/lib/bg-mode-context.tsx` — `BgModeProvider` + `useBgMode` React context
- `src/components/set-bg-mode.tsx` — `<SetBgMode mode="…" />` client sentinel

### Ideas / next steps

- Consider adding calorie ring / macro donut to the recipe card featured view
- Tactile Elegance forest green (`#2D5016`) could be used as the "in-pantry" match indicator in light mode
- Plan builder: add drag-and-drop from pinboard cards directly into WeaveGrid empty slots
- Cooking mode: test the 4% background opacity on mobile (may want 0% for OLED)
