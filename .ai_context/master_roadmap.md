# What's Cooking: Master Roadmap & Task Manifest

This is the living source of truth for all planned, in-progress, and completed features. 
**Status Key**: 🟢 Completed | 🟡 In-Progress | ⚪ Planned

---

## Phase I: Discovery & Inspiration
- [ ] [cite_start]⚪ **Pantry-First Search**: Logic for "Match Percentage" ranking. [cite: 49, 50]
- [ ] [cite_start]⚪ **AI Trend Discovery**: Social scraper for viral recipe extraction. [cite: 52, 53]
- [ ] [cite_start]⚪ **Hot Right Now**: Horizontal scroll with Sage Green (#828E6F) pulses. [cite: 58]

## Phase II: Organization & Preparation
- [ ] [cite_start]⚪ **OCR Recipe Extractor**: Image-to-JSON parsing with confidence scores. [cite: 62, 70]
- [ ] [cite_start]⚪ **Household Pantry Sync**: WebSocket implementation for real-time inventory. [cite: 65, 72]
- [ ] [cite_start]⚪ **Budget Target Dashboard**: CostEstimator service & Walnut/Toffee ticker. [cite: 14, 16, 21]

## Phase III: Execution & Cooking
- [x] 🟢 **Subway Roadmap**: Vertical timeline with interactive nodes. [cite: 77, 83] — `src/components/subway-roadmap.tsx`
- [x] 🟢 **SOS Cooking Recovery Bot**: Panic Dial UI & disaster-fix lookup tables. [cite: 5, 8, 10] — `src/components/sos-cooking-helper.tsx`
- [x] 🟢 **Living Cookbook (UGC Ticker)**: 8-second interval rotating user tips. [cite: 78, 84] — `src/components/living-cookbook-ticker.tsx`
- [ ] ⚪ **Cooking Tip Inline Cards**: Step-level technique detection with expandable tip cards. — `src/components/cooking-tip.tsx` (built, needs polish)

## Phase IV: Consumption & Presentation
- [x] 🟢 **Table Stylist**: Plating filter (Casual, Intimate, Festive). [cite: 88, 93] — `src/components/table-stylist.tsx`
- [ ] ⚪ **Occasion Blueprint**: EventScaler logic (Surface Area vs. Count). [cite: 39, 41]
- [ ] ⚪ **Napkin Guide**: 3-step SVG folding animations. [cite: 95]

## Phase V: Restoration & Zero-Waste
- [ ] ⚪ **Cleanup Concierge**: CareTracker for Hand-Wash vs. Dishwasher items. [cite: 23, 25, 98]
- [x] 🟢 **Zero-Waste Storage**: AI-calculated shelf life & reheating methods. [cite: 100, 105] — `src/components/zero-waste-guide.tsx`
- [ ] ⚪ **Kitchen Reset Button**: Micro-interaction confetti ritual. [cite: 107]

## Cross-Cutting / Infrastructure
- [x] 🟢 **Dark Moody Palette**: Full dark theme applied across all pages (Terracotta #C8522A, Parchment #EFE3CE, Coffee #1C1209)
- [x] 🟢 **Premium Recipe System**: Stub-to-full pipeline via `/api/recipes/[id]/extract`, persists to DB
- [x] 🟢 **Dietary Adaptation Engine**: `adapted-ingredients.tsx` with substitution confidence scores
- [x] 🟢 **Hot Right Now**: Horizontal scroll strip — `src/components/hot-right-now.tsx`
- [x] 🟢 **Social Recipe Import**: Instagram/TikTok URL → structured recipe extraction
- [x] 🟢 **Language Switcher**: Multi-language UI — `src/components/language-switcher.tsx`
- [x] 🟢 **Recipe Ratings & Comments**: Full CRUD interactions — `recipe-interactions.tsx`
- [x] 🟢 **Time Breakdown Bar**: Prep/cook visual bar — `src/components/time-breakdown-bar.tsx`
- [x] 🟢 **Light/Dark Mode Toggle**: `ThemeProvider` context + `ThemeToggle` component + CSS `[data-theme="light"]` overrides + flash-prevention inline script. Available in app sidebar and landing page nav.
- [ ] ⚪ **Pantry-First Search**: Match Percentage ranking logic
- [ ] ⚪ **Budget Target Dashboard**: Cost estimator & Toffee (#B07A52) over-budget alerts
- [ ] ⚪ **OCR Recipe Extractor**: Image-to-JSON parsing with confidence scores
- [ ] ⚪ **Household Pantry Sync**: WebSocket real-time inventory

---

## UI Overhaul — Completed Work Orders (2026-04-20)
- [x] 🟢 **Home Grid & Recipe Cards** — `src/components/recipe-card.tsx`: full-bleed aspect-ratio card, gradient scrim, save icon overlay with `.save-icon-pulse`, `.recipe-card-hover`/`.recipe-card-meta-overlay` classes. `discover-client.tsx`: 4/2/1-col grid (`lg:grid-cols-4 gap-6`), single `.cuisine-scroll-row` filter row with fade mask + "More Filters" button toggling `.filter-drawer-overlay`/`.filter-drawer-panel` drawer.
- [x] 🟢 **Sidebar Navigation** — `src/components/app-nav.tsx`: inactive items `opacity: 0.5`, active `opacity: 1`; icons 24x24 (larger than label); gap spacer added in `layout.tsx`.
- [x] 🟢 **Recipe Detail Two-Column Layout** — `page.tsx`: sticky left 35% (hero + key stats pills + time breakdown) + scrollable right 65%; wrapped in `CookingModeWrapper`. `recipe-columns-client.tsx`: right panel split into sticky ingredients column (38%) + scrollable instructions column. Interactive ingredient checkboxes using `.ingredient-checked` (useState, no DB). Numbered step-by-step instructions with inline `.pro-tip-block` on keyword-detected steps.
- [x] 🟢 **Cooking Mode Toggle** — `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx`: fixed floating button, `navigator.wakeLock?.request('screen')`, adds `cooking-mode-active` class, re-acquires wake lock on visibility change.

## UI Overhaul — Phase 1–3 Work Orders (2026-04-20 batch 2)
- [x] 🟢 **Global Color Tokens** — `globals.css`: --wc-floor #1F1B19, --wc-surface-1 #2C2724, --wc-surface-2 #3A3430, --wc-accent-saffron #F4A261. Soft Light tokens for light mode. .wc-card-hover spring animation class. Surface utility classes .wc-level-0/1/2.
- [x] 🟢 **Sidebar Restructure** — `app-nav.tsx`: desc text permanently hidden, 3 nav groups (Discovery/Planning/Kitchen) with Saffron group labels, "Kitchen Management" rename, 3px Saffron active border, opacity 0.6 inactive, sidebar bg --wc-floor.
- [x] 🟢 **Nutrient Tracker 2-Column Layout** — `calorie-tracker-client.tsx`: persistent "What did you eat?" bar, 60/40 two-column grid (macro rings left, weight chart + tips + collapsible goals right), 6px slim kcal bar, CSS token colors throughout.
- [x] 🟢 **Dinner Parties Cover Cards** — `dinner-party-calendar.tsx`: CoverCardView default with hero party card, guest avatars, dynamic accent borders; Cards/Calendar toggle; .wc-card-hover spring on PartyCard.

## Log of Recent Manifest Changes
* [2026-04-14] - File created and populated with features from Implementation Guides.
* [2026-04-14] - Audited actual codebase; marked Subway Roadmap, SOS Helper, Living Cookbook Ticker, Table Stylist, Zero-Waste Guide, Dark Theme, Premium Recipe System, Dietary Adaptation, Hot Right Now, Social Import, Language Switcher, Ratings/Comments, and Time Breakdown Bar as 🟢 completed. Added Light/Dark Mode Toggle as next ⚪ priority.
* [2026-04-14] - 🟢 Implemented Light/Dark Mode Toggle: ThemeProvider (src/lib/theme-context.tsx), ThemeToggle component (src/components/theme-toggle.tsx), CSS light-mode token overrides in globals.css, flash-prevention script in root layout, wired into AppNav sidebar and landing page nav.
* [2026-04-15] - 🟢 Five design work orders completed:
  1. **Sidebar text overflow fix** — `app-nav.tsx`: changed `.wc-item` from `overflow:hidden; white-space:nowrap` to `overflow:visible`; expanded `.wc-item-desc` max-height from `3.2em` to `5rem`; added `word-break:break-word`; nav expanded width increased to 292px.
  2. **Background palette reactivity + rule of thirds** — `globals.css`: all 5 palettes now define `--wc-band-a/b/c` tokens. App layout `<main>` uses a `repeating-linear-gradient` with `--wc-bg-base` / `--wc-bg-surface` (palette-reactive). All palette colours lightened slightly.
  3. **Background decorations** — Created `src/components/background-decorations.tsx`: fixed layer with SVG cooking-motif tile (herb sprigs, fork, leaf, dots), large corner radial glows, botanical sprig SVGs at top-right and bottom-left, cross-hatch texture, dot grid, right-edge vignette, and brand accent stripe. Injected via app layout.
  4. **General design improvements** — All palette darkest/dark/mid/accent/sage tokens lightened by ~8–12 lightness points. Added `--wc-band-*` tokens. Grain opacity bumped from 0.028 to 0.038. Cross-hatch and dot-grid CSS added to globals.css.
  5. **Dietary Filters panel** — `top-bar.tsx`: "Dietary Filters" button no longer navigates to `/settings`; instead opens an inline dropdown panel with quick-add restriction toggles, custom ingredient avoidance input, and an "Adapt Recipes" CTA as the confirmation button. "Adapt Recipes" is removed as a standalone sidebar item.
* [2026-04-22] — Group A+B+C batch:
  - 🟢 **Fix: continentId server/client boundary** — extracted to `src/lib/continent-id.ts`
  - 🟢 **Fix: textarea hydration mismatch** — `suppressHydrationWarning` on comment textarea in `recipe-interactions.tsx`
  - 🟢 **Full-site palette switching** — all `[data-palette]` blocks now remap `--wc-floor`, `--wc-surface-*`, `--wc-accent-*` core tokens in `globals.css`
  - 🟢 **Light mode darkened** — `--wc-floor: #D8D0C4`, inputs/buttons shifted to warm grey
  - 🟢 **Recipe hero image** — `minHeight: 340` in `recipes/[id]/page.tsx` so dietary tags are fully visible
  - 🟢 **Recipe card descriptions** — `recipe.description` shown below title with `line-clamp-2` in `recipe-card.tsx`
  - 🟢 **Discover view toggle** — Grid / List / Gallery; preference persisted in `localStorage("wc-view-mode")`; new `src/components/ui/toggle-group.tsx`