# What's Cooking — UI Overhaul Roadmap
Generated: 2026-04-20

## Design System Reference
- Dark Level 0 (sidebar bg): #1F1B19
- Dark Level 1 (main content): #2C2724
- Dark Level 2 (inputs/elevation): #3A3430
- Saffron accent: #F4A261
- Light bg: #F9F7F4 / Surface: #F0EDE9 / Elevation: #E4E0DB / Text: #2D2926

---

## PHASE 1 — Global Architecture & Sidebar
**Agent: aesthetic-lead**
**Status: DISPATCHED**

### P1.1 Sidebar Restructure (app-nav.tsx)
- Remove desc text under nav items (wc-item-desc) — hide permanently
- Reorganize NAV_ITEMS into 3 labeled groups:
  - Discovery: Recipes (with children)
  - Planning: Meal Plans, Dinner Party
  - Kitchen: My Pantry (rename label to "Kitchen Management"), Nutrient Tracker
- Profile & Settings remain at bottom
- Active item: 3px Saffron (#F4A261) left border, opacity 1; inactive opacity 0.6
- Sidebar bg token: #1F1B19 (--wc-floor updated)

### P1.2 Color Palette Audit (globals.css)
- Update --wc-floor to #1F1B19
- Update --wc-surface-1 to #2C2724
- Update --wc-surface-2 to #3A3430
- Update --wc-accent-saffron to #F4A261 (was #E8A020)
- Update --wc-accent-primary to #F4A261
- Wire sidebar nav background to --wc-floor
- Wire main content background to --wc-surface-1
- Search/input bg to --wc-surface-2
- Light mode: add --wc-light-bg #F9F7F4, --wc-light-surface #F0EDE9, --wc-light-elev #E4E0DB, --wc-light-text #2D2926
- Card hover: scale(1.02) + deepened box-shadow (spring, 0.2s)

### P1.3 Card hover animations (globals.css utility classes)
- .wc-card-hover: transition transform 0.2s cubic-bezier(0.34,1.56,0.64,1), scale 1.02 on hover
- .wc-card-shadow-lift: box-shadow deepens on hover

---

## PHASE 2 — Soft Light Mode
**Agent: aesthetic-lead**
**Status: DISPATCHED**

- Add full light mode CSS variable block under html[data-theme="light"]
- 0.3s transition on background-color and color on body
- Replace hard-coded hex colors in sidebar with token references
- Verify WCAG 2.1 contrast for all text/bg combos

---

## PHASE 3 — Dashboard & View Refactoring

### P3.1 Cuisine Atlas (cuisines/page.tsx + cuisines-tabs.tsx)
**Agent: artisan**
**Status: DISPATCHED**

- Sticky CuisineNav glassmorphism bar: bg #3A3430/80%, blur 10px, 1px white/10 border-bottom
- Items: Europe, Americas, Asia, Africa, Oceania
- Saffron underline on active continent (framer-motion layoutId)
- Horizontal snap-scroll card rows: scroll-snap-type x mandatory, 2.5 cards visible desktop
- Country cards: 2px top-border accent-color, hover box-shadow, slide-up "Popular Dishes" reveal
- scroll-margin-top: 5rem on continent sections

### P3.2 Nutrient Tracker (calorie-tracker-client.tsx)
**Agent: artisan**
**Status: DISPATCHED**

- 2-column grid: 60% (Macro Rings + Add Meal input) / 40% (Weight sparkline + Macro Tips)
- "Nutrition Goals" moved to collapsible accordion
- "What did you eat?" persistent input bar at top
- Slim kcal progress bar (max 8px) above macro rings
- Macro ring colors synced with global palette
- Quick Add button

### P3.3 Dinner Parties (dinner-parties/page.tsx)
**Agent: artisan**
**Status: DISPATCHED**

- Replace calendar with Cover Cards per party
- Each card: menu preview, guest count avatars, RSVP button
- Next upcoming = hero card at top with large bg image
- Past parties: compact photo list
- "Missing: [x] ingredients" badge linking to Pantry

---

## PHASE 4 — Recipe Cards & Detail

### P4.1 Recipe Card Feed (recipe-card.tsx + discover-client.tsx)
**Agent: artisan**
**Status: PLANNED**

- Chef Hat (0–5) rating under title
- Always-visible: Prep Time, Difficulty icons, Meal Plan Match badge
- 2rem Serif title
- Dark gradient scrim at image bottom
- Remove center play button → move to top-right corner
- Slightly wider card gutter

### P4.2 Recipe Detail (recipes/[id]/page.tsx)
**Agent: architect + artisan**
**Status: PLANNED**

- Global Metric/Imperial toggle (Context Provider)
- Accordion ingredients (auto-folds at 100% checked)
- "Add all to shopping list" button
- Interactive Timeline: click phase bar → jump to step
- Chef Tips inline tinted boxes (#3A3430)

---

## PHASE 5 — Profile / Chef Hub
**Agent: artisan**
**Status: PLANNED**

- 2-column: Left 65% (world collection, achievements, quick links) / Right 35% (palette picker, stats)
- SVG world map with Saffron glow on cooked countries
- Passport Stamp system
- Flavor Profile Radar Chart
- Color palette picker: horizontal paint-swatch tiles

---

## PHASE 6 — My Pantry / Leftovers
**Agent: architect**
**Status: PLANNED**

- "Add to Storage" function after recipe completion
- Leftovers & Storage section with shelf-life display

---

## Motion Layer (cross-cutting)
**Agent: motion-designer**
**Status: DISPATCHED**

- Card hover: spring scale(1.02), 200ms cubic-bezier(0.34,1.56,0.64,1)
- Sidebar nav item transitions already present — ensure Saffron left-border animates with transition
- CuisineNav active underline: framer-motion layoutId="cuisine-underline"
- Dinner party card entrance: staggered slide-up (0.05s delay per card)
- Nutrient tracker meal log pop-in: scale 0.8→1, opacity 0→1, spring

---

## Agent File Targets

| Agent | Primary Files |
|-------|--------------|
| aesthetic-lead | src/app/globals.css, src/components/app-nav.tsx |
| artisan | src/app/(app)/cuisines/*, src/app/(app)/calorie-tracker/*, src/app/(app)/dinner-parties/*, src/components/recipe-card.tsx |
| motion-designer | src/app/globals.css (keyframes), src/components/recipe-card.tsx, src/components/app-nav.tsx |
| architect | src/lib/units-context.tsx (new), src/app/(app)/recipes/[id]/* |
