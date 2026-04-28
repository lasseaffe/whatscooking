# Spec A — Navigation & Layout Redesign
_What's Cooking · 2026-04-28_

---

## 1. Sidebar Restructure

### New NAV_GROUPS structure (replaces current in `app-nav.tsx`)

```
Discover
  ├── All Recipes       → /recipes
  ├── Meal Swipe        → /swipe
  ├── World Cuisines    → /cuisines
  └── World Cup 2026    → /world-cup-2026

Plan & Host
  ├── Meal Plans        → /plans
  ├── Dinner & Events   → /events  (merged)
  └── Nutrient Tracker  → /calorie-tracker

Kitchen
  ├── My Pantry         → /pantry
  └── Shopping List     → /shopping-list
```

**Removed from sidebar:** Profile, My Recipes, Saved Recipes, Health group (Nutrient Tracker moves into Plan & Host).

### Dinner Party + Event Planner merge
- `/dinner-parties` redirects permanently (301) to `/events`
- `/events` becomes the single unified page
- `dinner-parties/` route folder and `[id]` detail page are kept as redirect shims only — no content deleted until confirmed safe
- The sidebar entry is labelled **"Dinner & Events"** with the `PartyPopper` icon

### Z-index fix
The sidebar nav currently sits at `z-40`. The dietary filters card and continent picker (on `/cuisines`) render above it. Fix:
- Sidebar `<nav>`: bump to `z-50`
- Flyout panel `.wc-flyout-panel`: stays at `z-9999` (already correct)
- Dietary filters panel (in `top-bar.tsx`): set to `z-40` (below sidebar)
- Continent picker on `/cuisines`: set to `z-40`
- This makes the expanded sidebar the absolute top layer as intended

---

## 2. Top Nav Bar Redesign

### What stays
- **Dietary Filters** button (left) — opens dropdown panel, unchanged behaviour
- **Notifications** bell (far right) — unchanged
- **Profile** avatar icon (links directly to `/profile`)
- **Settings** icon (links to `/settings`)

### What is removed
- Meal Swipe feature button
- Scramble Together feature button
- Premium feature button (the large shiny CTA card)

### What changes
- `min-height` reduced from `88px` to `52px` — thinner bar
- **Premium** becomes a small pill badge (not a full feature card): icon + "Premium" label, no shimmer animation, links to `/premium`
- **Profile** uses `User` icon (already imported) — no change needed, just confirmed as avatar placeholder until real avatars are built
- The `.wc-feature-row` flex layout is replaced by a simpler flex row: `[Dietary Filters pill] [spacer] [Premium pill] [Profile icon] [Settings icon] [Notifications]`
- On mobile the bar remains a single row; dietary filters label truncates gracefully

### Files changed
- `src/components/top-bar.tsx` — primary change
- `src/components/app-nav.tsx` — NAV_GROUPS update + z-index

### Files with redirect only
- `src/app/(app)/dinner-parties/page.tsx` — replace body with `redirect("/events")`
- `src/app/(app)/dinner-parties/[id]/page.tsx` — replace body with `redirect("/events")`

---

## 3. Out of Scope for This Spec
- Any visual changes to `/events` page content (that's a feature concern)
- Mobile bottom nav changes
- Profile page content
