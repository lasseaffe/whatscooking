# What's Cooking — UI/UX Audit

> Generated: 2026-04-22 | Blueprint: Modern UI Blueprint (Lovable)
> Design system: dark-first, warm earthy palette (#EFE3CE cream, #C8522A burnt orange, #1C1209 card bg, #3A2416 borders)

---

## Systemic Fixes (One Change = Many Pages Fixed)

| Fix | Impact | Status |
|---|---|---|
| Extract a shared `<RecipeCard>` component | Fixes grid breakpoints, hover, image sizing everywhere | ✅ exists at `src/components/recipe-card.tsx` |
| Define `@layer components { .heading-serif { ... } }` in globals.css | Removes 20+ inline fontFamily declarations | ⬜ |
| Add `<ErrorBoundary>` at route level | Covers all pages | ⬜ |
| Add a `<Skeleton>` component + pattern | Standardizes loading across all data-fetching sections | ⬜ |
| Define spacing scale in CSS vars (`--space-sm/md/lg`) | Fixes arbitrary padding/gap | ⬜ |
| Add `@media (max-width: 640px)` bottom nav | Fixes mobile UX globally | ✅ `src/components/mobile-bottom-nav.tsx` |

---

## HIGH PRIORITY — MVP-Breaking

### 1. Mobile Nav / Layout ✅
- Sidebar hidden on mobile via `hidden sm:contents` wrapper in `layout.tsx`
- Bottom tab bar at `src/components/mobile-bottom-nav.tsx` — 4 primary tabs + "More" bottom sheet
- Main content gets `pb-16 sm:pb-0` to clear the tab bar
- TopBar hidden on mobile (`hidden sm:block`) — accessible via bottom sheet

### 2. Missing `md:` Breakpoints on Grids ⬜
- Grids jump from `sm:grid-cols-2` directly to `lg:grid-cols-4` — tablets get phone layout
- **Affected:** Dashboard (featured recipes), My Recipes, Plans

### 3. No Error Boundaries ⬜
- Supabase query failures silently render a blank page
- No retry buttons anywhere
- **Fix:** `<ErrorBoundary>` wrapper at route level with retry CTA

### 4. Empty States Missing CTAs ⬜
- Generic messages ("No recipes found") with no next steps
- **Worst offenders:** My Recipes (no "Create your first"), Saved (no "Browse recipes"), Pantry (no input visible)

### 5. Loading States Inconsistent ⬜
- Some pages: spinner; some: "Simmering…"; most: nothing
- Content pops in abruptly, no skeleton loaders
- **Fix:** Unified `<Skeleton>` pattern

---

## MEDIUM PRIORITY — UX Friction

### 6. Color Drift ⬜
- Primary orange: `#C8522A` vs `#C85A2F` vs `#C8A030` across pages
- Difficulty badges: raw Tailwind colors (`#16A34A`, `#D97706`, `#DC2626`) not from palette
- **Bug:** Broken hex in Dashboard plan badge: `#C852 2A20` (space in hex → invisible border)

### 7. Typography Has No Scale ⬜
- h1 ranges from `text-4xl` (hero) to `text-base` (my-recipes header)
- `fontFamily: "'Libre Baskerville'..."` repeated as inline style 20+ times
- **Fix:** `@layer components { .heading-serif { font-family: 'Libre Baskerville'... } }`

### 8. Spacing is Arbitrary ⬜
- Padding: `px-4`, `px-6`, `px-8` mixed with no system
- Gaps: `gap-3`, `gap-4`, `gap-5`, `gap-6` inconsistent
- **Fix:** CSS spacing vars `--space-sm/md/lg/xl`

### 9. Horizontal Scrolls Have No Visual Affordance ⬜
- Cuisines snap-scroll, Discover filter pills, Hot Right Now
- None have fade-out gradient indicating more content
- **Fix:** `::after` pseudo-element with fade gradient on scroll containers

### 10. Accordion / Modal Transitions are Instant ⬜
- Dashboard scramble expands with no height animation
- Modals pop in without fade — jarring layout shifts
- **Fix:** CSS `transition: height` or `framer-motion` `AnimatePresence`

### 11. No Focus-Visible Styles ⬜
- Icon-only buttons have no accessible labels
- Color-only status indicators violate WCAG 1.4.1
- Tab order untested

### 12. Filter Drawer Doesn't Trap Focus ⬜
- Discover filter overlay: users can tab outside to background content
- **Fix:** `focus-trap` library or manual `tabIndex` management

---

## LOW PRIORITY — Polish

### 13. Card Hover Uniformity ⬜
- All cards: `hover:-translate-y-1` only — no shadow lift, no image zoom
- Cuisines page does it better (`scale(1.02)` + shadow) but isolated
- **Fix:** Standardize in shared `<RecipeCard>` component

### 14. Page Transitions ⬜
- Route changes are instant
- **Fix:** 100–150ms fade via `framer-motion` or CSS `view-transition-name`

### 15. Swipe Page Has No Onboarding ⬜
- No instruction for swipe mechanic
- No undo for accidental swipes

### 16. Calorie Tracker Needs Visual Progress ⬜
- Data tracked but not visualized
- No trend lines, no progress bar toward goal

### 17. Saved Recipes Has No Sort/Filter ⬜
- No sort by date, cuisine, cook time
- Grows unusable as collection grows

### 18. Menu Scanner Has No Drag-and-Drop ⬜
- Mobile users can't camera-capture directly
- No drag-and-drop upload area

---

## Per-Page Issues

### Dashboard
- Hero video `minHeight: "38vh"` too tall on portrait mobile (>50% viewport)
- Slideshow 4.5s autoplay slow; no visible pause indicator
- `sm:grid-cols-2` for feature cards — mobile shows only 2 above fold
- "Trending this week" all links → `/discover` (no filter by recipe)
- `#C852 2A20` typo in plan status badge border

### Discover
- Search bar `max-w-2xl` creates dead space on 4K screens
- Dish type pills: horizontal scroll with no fade indicator
- Premium masonry: `columns-2` too narrow on mobile <640px
- Hot Right Now emoji decorations overlap text on mobile <768px
- Grid (gap-6) vs list (gap-3) inconsistency
- "Today's Pick" card shifts image left in `sm:flex-row` — inconsistent with grid cards

### Pantry
- Light theme colors hardcoded (`#FFF0E6`, `#FFE4D1`) — jarring in dark app
- Scramble cards use light backgrounds vs dark card bg everywhere else
- Progress bar: 3 different color thresholds with no clear hierarchy
- No success toast after adding ingredient

### Plans
- `h-full` template cards with fixed `h-20` image: height imbalanced
- No drag-to-reorder meals within a day
- Modal has no close button visible without scrolling
- Plan save: timestamp updates silently — no toast confirmation

### Meals
- Meal detail uses light theme colors (`#3D2817`, `#6B5B52`) — inconsistent
- No back button visible in detail page

### My Recipes
- `lg:grid-cols-3` with no `md:` rule — jumps from 1 to 3 columns
- Publish state not shown in card UI (`is_published` exists in DB but not displayed)
- Gradient CTA card inconsistent with other card styles

### Saved
- No sort/filter options
- No bulk select/delete

### Cuisines
- Snap-scroll cards: `width: 38vw` to `72vw` — jumps between sizes
- Continent decorative text `8xl` overflows on mobile
- Card border thickness inconsistency: `1px` default vs `2px` active

### Swipe
- No onboarding / instruction
- No undo for accidental swipe

### Dinner Parties
- Page uses light theme colors (inconsistent)
- `#C85A2F` vs `#C8522A` — different primary button color

### Menu Scanner
- No drag-and-drop area
- No camera option for mobile

---

## Component Issues

### Hot Right Now
- Horizontal scroll: no fade-out gradient indicator

### Suggestion Panel
- No debounce on input (fires on every keystroke)
- No visible "Loading…" feedback between keystrokes

### RecipeImage
- No skeleton during image load (white box until image arrives)
- Fallback `#A69180` doesn't match app muted text `#8A6A4A`

---

## Global Notes

**Accessibility gaps:**
- No skip-to-main link
- No breadcrumb navigation
- Icon-only buttons lack `aria-label`
- Color-only status indicators (badges)

**Mobile gaps:**
- No bottom tab nav
- Touch targets unknown (should be ≥44×44px)
- Horizontal scroll affordance missing throughout

---

## Implementation Order

1. **Mobile bottom nav** — unblocks mobile usability for all pages
2. **Shared `<RecipeCard>`** — fixes breakpoints, hover, image sizing everywhere  
3. **`.heading-serif` CSS class** — quick win, removes 20+ inline styles
4. **Error boundaries** — prevents white-screen failures
5. **Skeleton loaders** — unified loading pattern
6. **Color audit** — fix drift, patch hex typo
7. **Spacing vars** — normalize padding/gap
8. **Horizontal scroll affordance** — fade gradients
9. **Modal/accordion transitions** — AnimatePresence or CSS transitions
10. **Focus-visible + accessibility** — WCAG compliance
