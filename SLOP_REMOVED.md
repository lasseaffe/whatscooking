# What's Cooking — Slop Removal Log

This file tracks every AI-slop pattern stripped during the Copper Editorial sweep. Stop-slop **removes** but does **not** auto-replace — entries below are gaps you can later design into.

**Patterns tracked:**
- gradient slop (purple/violet/glossy multi-color)
- icon-on-every-headline (decorative lucide icons next to section titles)
- fake stats ("Trusted by 10k+", fabricated counts)
- decorative SVG (AI-drawn faces/food/scenery)
- identical card grid (every card structurally same — filler eliminated)
- emoji-as-icon (emoji in interactive elements)
- gradient backdrop on non-hero surfaces

**Entry format (every field required — no ambiguity allowed):**
```
## [YYYY-MM-DD HH:MM] <relative-file-path>:<line-range>
- **Route**: <exact URL path, e.g. /discover, /recipes/[id], /pantry>
- **Section**: <which named section/region on the page — e.g. "hero block above filter chips", "third card in the dinner-party grid", "footer just below the search bar">
- **DOM landmark**: <nearest stable selector — header, main, nav, [data-testid], aria-label, parent component name>
- **Visual position**: <viewport position when present — e.g. "top 30% on desktop ≥1024px", "second row of card grid", "right column inside the cookbook sidebar">
- **Removed (what)**: <verbatim text/markup/asset description that was there>
- **Removed (why)**: <slop pattern label from the list above>
- **Suggested replacement direction**: <honest placeholder | real data binding | leave empty | photography brief | custom illustration brief | reduced to text label>
- **Current state in code**: <empty div | placeholder block | section deleted entirely | reduced to text | className-only change>
```

**Not logged here** (mechanical, no replacement decision needed):
- Color token swaps (cobalt → copper)
- Font swaps (Libre Baskerville → Playfair)
- strokeWidth normalization
- Hardcoded hex → CSS variable

---

<!-- Entries appended below as the sweep progresses -->

> **2026-05-11 status:** the 3 entries below were authored during an aborted sweep that was rolled back when the user requested a proper /huashu-design ritual before committing to a direction. The palette switcher is currently RESTORED in code. These entries are retained as evidence — once a final direction is locked via the design ritual, revisit whether the palette switcher should be killed (single-accent moodboard) or kept (user-customization affordance) and re-execute or delete the entry accordingly.

## [2026-05-11 17:00] src/components/app-nav.tsx:546-551 (pre-strip line range)
- **Route**: applies on every authenticated route (global app nav)
- **Section**: "Palette quick-pick" block inside the expanded nav drawer, sitting between the "Dietary filters" CTA and the light/dark "Theme toggle" pill
- **DOM landmark**: `<div className="wc-dietary-expanded">` wrapping `<PaletteSwitcher compact />`, inside the global `app-nav.tsx` sidebar
- **Visual position**: bottom-left of the desktop expanded nav (≥1024px); shown only when the nav drawer is expanded — appears as a row of 5 round multi-color swatch buttons (cast-iron / copper-clove / heirloom-orchard / sage-stone / midnight-pantry)
- **Removed (what)**: the entire `{/* Palette quick-pick */}` block — a `compact` variant of `PaletteSwitcher` rendering 5 round 32px swatches that let the user override the brand accent at runtime
- **Removed (why)**: single-accent rule (moodboard mandates copper as the only chromatic accent — runtime palette switching contradicts the brand identity)
- **Suggested replacement direction**: leave empty — the nav drawer is dense enough without it. If you later want a personalization affordance in this slot, consider a "Pinned cookbook" shortcut or "Saved searches" pill row instead of a chromatic switcher
- **Current state in code**: section deleted entirely (5 lines + comment removed); `PaletteSwitcher` import also removed from line 14; `palette-switcher.tsx` itself remains in the components directory because `PaletteInitializer` is still mounted in `layout.tsx` to apply the persisted default (copper-clove)

## [2026-05-11 17:05] src/app/(app)/settings/settings-client.tsx:240-246 (pre-strip line range)
- **Route**: /settings
- **Section**: "Colour Palette" — the first `<Section>` block at the very top of the Settings page, above "Light / Dark Mode"
- **DOM landmark**: `<Section icon={<Palette …/>} title="Colour Palette">` rounded card with dark cast-iron background `rgba(26,16,8,0.6)` and 1px border `rgba(58,36,22,0.6)`
- **Visual position**: top of the Settings page main column, full-width card; first thing the user sees when landing on /settings
- **Removed (what)**: an entire rounded card containing the headline "Colour Palette", subtitle copy "Choose a palette that sets the mood for your kitchen. Changes apply instantly everywhere.", and the full vertical `<PaletteSwitcher />` listing all 5 palettes as rows with name + description + 4-swatch preview + active checkmark
- **Removed (why)**: single-accent rule — runtime palette switching contradicts the moodboard's "Copper Editorial" identity. The Settings page becoming a palette playground is exactly the AI-slop "give the user 5 themes to pick from" pattern
- **Suggested replacement direction**: leave empty for now. The first slot on /settings should belong to whatever the user most needs to control — candidates: "Default cuisine preference", "Measurement system (metric/imperial)", "Allergen lockouts", or a "Welcome back, here's what's new in your kitchen" digest card. Worth a design conversation before filling
- **Current state in code**: the `<Section>…</Section>` block (lines 241–246) and the `{/* ── Appearance ── */}` comment are deleted; `PaletteSwitcher` import and `Palette` lucide icon import both removed from line 5-6; the page now opens directly to "Light / Dark Mode"

## [2026-05-11 17:10] src/app/(app)/profile/profile-client.tsx:666-681 (pre-strip line range)
- **Route**: /profile
- **Section**: "Color Palette Card" — top of the right column of the Profile page, sitting above the Theme Toggle card
- **DOM landmark**: `<div className="rounded-2xl border p-4">` containing a small `Palette` lucide icon prefix + "Color Palette" h3 heading + `PaletteSwitcher compact` (the 5-swatch round-button row)
- **Visual position**: right column of the /profile two-column layout, first card from the top on desktop ≥1024px; on mobile this card collapses into the stacked-vertical card list near the top of the page
- **Removed (what)**: a card with title "Color Palette" (preceded by a 16px `Palette` lucide icon in saffron `var(--wc-accent-saffron)`) and the compact `PaletteSwitcher` (5 round 32px multi-color swatches)
- **Removed (why)**: single-accent rule — same reason as the nav and settings versions. Profile-level palette switching is the AI-slop "user customizes the brand" pattern
- **Suggested replacement direction**: leave empty for now. The right column of /profile has natural content slots that would be more useful: "Cooking streak" badge, "Top cuisines explored" mini-chart, "Pinned cookbook" shortcut, or "Recent achievements" feed. The Theme Toggle (light/dark) directly below this card is still valuable — that one stays
- **Current state in code**: the entire `{/* Color Palette Card */}` div block (16 lines) is removed; the `PaletteSwitcher` import on line 122 is deleted; the `Palette` lucide icon is also removed from the lucide-react named import on line 7 because it was only used in this card; the right column now opens directly to "Theme Toggle Card"

---

## [2026-05-11] src/app/page.tsx — Feature grid icon boxes

- **Route**: `/`
- **Section**: "Four courses of software" feature grid
- **DOM landmark**: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">`, each feature cell
- **Visual position**: above the fold after the video hero; 6-cell grid (3 columns on desktop)
- **Removed (what)**: `w-9 h-9` colored box with a Lucide icon (Sparkles, Flame, Heart, BookOpen, Calendar, Users) as the primary visual anchor of each feature card. Background was `color-mix(in srgb, var(--wc-copper) 12%, transparent)`.
- **Removed (why)**: icon-on-every-headline slop — identical card structure across all 6 cells. Every card had the same: icon box → course number → title → description. The icon carried no differentiation.
- **Suggested replacement direction**: typography-only (course number + Playfair title) is now in place and reads cleanly. 120% upgrade: give one card (e.g. AI Meal Planner) a small custom data visualization or screenshot as the anchor instead of an icon.
- **Current state in code**: icon div removed entirely. Course number ornament + title + description remain.

---

## [2026-05-11] src/app/page.tsx — Dirty Soda emoji accent

- **Route**: `/`
- **Section**: "Utah's Dirty Soda Culture" cross-promo teaser
- **DOM landmark**: right-side `shrink-0 hidden sm:flex w-24 h-24` accent block
- **Visual position**: right column of the dirty-soda teaser card, desktop ≥640px
- **Removed (what)**: `🥤` emoji in a `2.5rem` Playfair italic span
- **Removed (why)**: emoji-as-icon slop — decorative placeholder in what should be an editorial accent element
- **Suggested replacement direction**: currently using `<Sparkles>` icon at low opacity as interim. Real upgrade: a small cast-iron line illustration of a soda glass, or keep the box empty (the editorial text carries the section).
- **Current state in code**: Sparkles icon, opacity 0.45, `wc-pal-accent` color.

---

## [2026-05-11] src/components/report-button.tsx:8-12 — Emoji in form option labels

- **Route**: every recipe route where ReportButton is rendered (recipe detail, discover cards)
- **Section**: recipe-report modal, issue-type selection pills
- **DOM landmark**: `const ISSUE_TYPES` array labels
- **Visual position**: sheet modal, presented on report icon tap
- **Removed (what)**: emoji prefixes `🖼️`, `🥗`, `🔗`, `📋`, `💬` from the five issue-type labels
- **Removed (why)**: emoji-as-icon slop in UI form labels
- **Suggested replacement direction**: text-only labels are sufficient. Optional: a Lucide icon per pill at `strokeWidth={1.5}` if you want visual pill differentiation.
- **Current state in code**: plain text labels, no emoji.

---

## [2026-05-11 Session-5] REPLACEMENTS IMPLEMENTED — Slop → Brand-conforming design

### Nav drawer — "Tonight" dinner prompt
- **Replaced:** `{/* Palette quick-pick */}` block (PaletteSwitcher compact) + removed `PaletteSwitcher` import
- **Replacement:** "Tonight" block — Copper `var(--wc-copper)` mono eyebrow label in 9px / `0.15em` tracking; static `FIND SOMETHING →` CTA link to `/discover?meal=dinner` in matching Copper; wrapper matches existing `wc-dietary-expanded` padding contract
- **Decision rationale:** Meal plan tonight-query is complex (week_start + duration_days + entries join); static CTA chosen for now — recipe title hydration is a future enhancement
- **File:** `src/components/app-nav.tsx`

### Settings page — Allergen Lockouts card
- **Replaced:** Colour Palette Section (PaletteSwitcher full listing)
- **Replacement:** `<Section icon={<ShieldAlert>} title="Allergen Lockouts">` — 6 allergen pills (Nuts, Gluten, Shellfish, Dairy, Eggs, Soy); active = Copper bg (`rgba(200,120,42,0.15)`) + Copper border + `✕` suffix; inactive = muted border; state in `useState<string[]>` initialized from `localStorage.getItem('wc-allergen-lockouts')`; toggle saves back via `localStorage.setItem`
- **File:** `src/app/(app)/settings/settings-client.tsx`

### Settings page — Kitchen Defaults card
- **Added:** `<Section icon={<Sliders>} title="Kitchen Defaults">` — metric/imperial segmented toggle (active = Copper bg/border/text, inactive = muted); Default Cuisine `<select>` (20 cuisine options); both persist to localStorage under `wc-measurement` and `wc-default-cuisine`
- **File:** `src/app/(app)/settings/settings-client.tsx`

### Profile page — My Kitchen card
- **Replaced:** "Color Palette" card (PaletteSwitcher compact + Palette icon)
- **Replacement:** "My Kitchen" card — `BookOpen` (Copper, strokeWidth=1.5) + "Pin a cookbook in your library" link to `/cookbooks` with `ArrowRight` arrow; `recently cooked` divider in 9px mono-caps; "No recent cooks yet." empty state
- **Decision rationale:** A is the current empty state; real data (pinned cookbook + cook history) wired when those features ship
- **File:** `src/app/(app)/profile/profile-client.tsx`

### Landing page — Feature grid Cell 01 (mini weekly meal grid)
- **Replaced:** Cell 01 had the same `Course 01 / title / description` structure as all other cells (identical card-grid slop)
- **Replacement:** Conditional render for `i === 0`: 7-column day-of-week headers (M T W T F S S) in 6px mono muted; 2 rows (lunch + dinner) of meal slots with `rgba(200,120,42,opacity)` fills (mock data opacities; empty slots = transparent + 1px `rgba(200,120,42,0.15)` border); no Course label; "AI Meal Planner" title + description below grid
- **Cells i > 0:** standard `Course N` label + title + description (unchanged)
- **File:** `src/app/page.tsx`

### Landing page — Dirty Soda teaser accent icon
- **Replaced:** `<Sparkles>` icon (opacity 0.45) with `<GlassWater>` (opacity 0.6) — same props, same color token `var(--wc-pal-accent, #B07040)`
- **Rationale:** GlassWater directly represents the soda-glass editorial context; Sparkles was a generic "AI feels" placeholder
- **Note:** `Sparkles` is still imported and used in the HolyFlex CTA button in the same file — import retained
- **File:** `src/app/page.tsx`

## [2026-05-11] src/app/(app)/discover/discover-client.tsx:374 — Two-tone gradient chip divider

- **Route**: `/discover`
- **Section**: Travel × What's Cooking cross-promo banner, left image strip
- **DOM landmark**: `div.h-0.5.w-full` between two `bg-cover` image strips
- **Visual position**: thin horizontal rule between two images in the left column of the travel cross-promo card
- **Removed (what)**: `linear-gradient(90deg, #C8522A, #828E6F)` — two-tone copper-to-sage horizontal rule
- **Removed (why)**: gradient slop; also contained the wrong-shade copper hex `#C8522A`
- **Suggested replacement direction**: solid copper rule at 50% opacity (current state). Alternative: remove entirely and let images butt together.
- **Current state in code**: `background: var(--wc-copper, #C8782A); opacity: 0.5`

---

## [2026-05-11] src/app/(app)/cuisines/world-cup-2026/page.tsx:52 — Blue-tint hero gradient

- **Route**: `/cuisines/world-cup-2026`
- **Section**: hero card
- **DOM landmark**: `div.relative.rounded-3xl.overflow-hidden.mb-10.p-8`
- **Visual position**: top of the page, full-width hero card
- **Removed (what)**: `linear-gradient(135deg, #0A0500 0%, #1A0C02 60%, #0D1020 100%)` — the `#0D1020` stop introduced a cold cobalt-blue tint
- **Removed (why)**: off-palette color contamination — WC direction is warm (cream / copper / dark brown). Blue tints break the thermal register.
- **Suggested replacement direction**: `var(--bg-secondary, #171716)` warm near-black (current state). Optional: add a subtle texture overlay.
- **Current state in code**: `background: var(--bg-secondary, #171716)`

---

## [2026-05-11] src/lib/dietary-substitutions.ts:19 — Purple nut-free dietary tag color

- **Route**: globally consumed (discover, recipe detail, pantry, plans, anywhere dietary tags render)
- **Section**: dietary tag pills across the app
- **DOM landmark**: `DIETARY_COLORS["nut-free"]` consumed by tag pill components
- **Visual position**: inline dietary tag pills on recipe cards and recipe detail
- **Removed (what)**: `color: "#7C3AED", bg: "#EDE9FE"` — Tailwind violet-700 + violet-100
- **Removed (why)**: purple/violet explicitly banned from the WC Copper Editorial direction, even in semantic tag contexts
- **Suggested replacement direction**: replaced with copper `#C8782A` / `#FEF0E4`. Alternative for true semantic differentiation without purple: warm ochre `#A16207` / `#FEF9C3`.
- **Current state in code**: `color: "#C8782A", bg: "#FEF0E4"`

---

## [2026-05-11] src/app/(app)/discover/discover-client.tsx:163-166 — Emoji floaters in hero background

- **Route**: `/discover`
- **Section**: hero header background decoration layer
- **DOM landmark**: `div.absolute.inset-0.pointer-events-none.overflow-hidden.select-none[aria-hidden]`
- **Visual position**: absolute overlay behind the hero search area, right side and left corners
- **Removed (what)**: 4 emoji spans at opacity 0.05 with rotation transforms: 🍕 (top-right, 3.5rem), 🥑 (top-right-inner, 2.5rem), 🍊 (bottom-right, 3rem), 🍜 (top-left, 2.5rem)
- **Removed (why)**: emoji-as-decoration slop — floating emoji as background texture is a Canva/AI-default move, carries zero editorial identity
- **Suggested replacement direction**: replaced with copper ruled-line texture at opacity 0.025 (repeating-linear-gradient horizontal rules at 32px interval). Alternative: leave truly blank — the dark gradient is editorial enough.
- **Current state in code**: ruled-line texture div at opacity 0.025
