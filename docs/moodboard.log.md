# What's Cooking — Moodboard Change Log

Newest entry on top. Top 5 entries are rendered in the in-app moodboard Change Log section.

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
