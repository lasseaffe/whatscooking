# What's Cooking — Landing Page + Dashboard Merge
**Date:** 2026-05-25  
**Status:** Approved for planning

---

## Context

The app has two pages serving overlapping purposes:
- `/` — public marketing landing page (HeroSection, SwiperSection, 8 bento feature cards)
- `/dashboard` — authenticated home page (HeroSection, FeatureShowcase carousel, RecipeShowcase, CookbookShelf)

Both pages have a hero + feature overview structure. The dashboard adds personalised content (cookbooks) and cinematic recipe posters that the landing page lacks. The decision is to merge the best of both into `/`, delete `/dashboard`, and use the freed design space to overhaul the feature showcase into a more powerful product tour.

---

## Page Structure After Merge

```
/ (root — public, pre + post auth)
├── Header            (fixed, existing — no changes)
├── HeroSection       (existing landing hero — Ken Burns + recipe strip — keep as-is)
├── SwiperSection     (existing recipe swiper — keep as-is)
├── FeatureCarousel   (NEW — replaces bento grid — overhauled from dashboard carousel)
├── RecipePosters     (RecipeShowcase moved here + improved with hover-expand)
├── CookbookShelf     (auth-gated — show for logged-in, teaser for logged-out)
└── Footer            (existing — no changes)
```

---

## What Gets Deleted

| Item | Action |
|------|--------|
| `src/app/(app)/dashboard/` | Delete entire route folder |
| `src/components/dashboard/hero-section.tsx` | Delete — inferior to landing hero |
| `src/components/dashboard/feature-showcase.tsx` | Delete — replaced by new FeatureCarousel |
| `src/components/onboarding/DashboardOnboardingGate.tsx` | Move to `(app)/layout.tsx` — runs once on any authenticated route |

## What Gets Moved / Reused

| Item | Action |
|------|--------|
| `src/components/dashboard/recipe-showcase.tsx` | Move to `src/components/landing/recipe-showcase.tsx` + improve |
| `src/components/dashboard/cookbook-shelf.tsx` | Move to `src/components/landing/cookbook-shelf.tsx` + improve |
| `DashboardScramble` component | Reuse inside new FeatureCarousel's first slide |
| Existing `FEATURES` array in `page.tsx` | Reuse as data source for new carousel |

---

## Section Designs

### 1. FeatureCarousel (replaces bento grid)

**Purpose:** Show product features as a navigable tour — more engaging than static grid.

**Layout:**
- Full-bleed section, min-height 90vh
- **30 / 70 split** horizontally
  - Left (30%): feature copy — dark `#0a0503` background
  - Right (70%): live animated Demo component — slightly lighter `#100804` panel

**Left panel content (per slide):**
- Feature number: `01` – `08` in JetBrains Mono, tiny, gold `rgba(244,162,97,0.4)`
- Feature label: Cormorant Garamond italic, ~32px, `rgba(239,227,206,0.9)`
- Description: 2 lines max, 13px, `rgba(239,227,206,0.5)`, line-height 1.7
- CTA link: uppercase, 10px, letter-spacing 3, `rgba(244,162,97,0.8)` → navigates to the feature's route
- DashboardScramble word-effect on slide 1 only (existing component)

**Right panel:**
- Renders the `Demo` component for the active feature (MealPlannerDemo, MealSwipeDemo, etc.)
- Centered with generous padding
- Demo fades + scales in (opacity 0→1, scale 0.97→1, 350ms ease-out) on slide change

**Navigation:**
- Left / right arrow buttons at bottom of left panel (SVG chevrons, 32px)
- Dot strip beneath copy: 8 dots, active dot in `#F4A261`, inactive `rgba(244,162,97,0.2)`
- Slide counter top-right of section: `01 / 08`, JetBrains Mono, 11px
- Keyboard ← → arrow keys navigate
- Auto-advance: NO (user-controlled only)

**Transition:** On slide change — left panel text fades out (150ms) then fades + translates up into new content (200ms). Right panel cross-fades. Total transition: ~350ms.

**Features list (8 slides, reuse existing FEATURES array):**
```
01 AI Meal Planner      → MealPlannerDemo  → /plans
02 Meal Swipe           → MealSwipeDemo    → /discover
03 Discover & Trending  → DiscoverDemo     → /discover
04 Social Recipe Import → ImportDemo       → /my-recipes/new
05 Events & Occasions   → EventsDemo       → /events
06 Smart Pantry         → PantryDemo       → /pantry
07 Collaborative Cooking→ CollabDemo       → /plans
08 Smart Recommendations→ RecsDemo         → /discover
```

---

### 2. RecipePosters (improved)

**Source:** `src/components/dashboard/recipe-showcase.tsx` — the 5 cinematic cultural recipe posters.

**Improvements:**
- **Hover-to-expand:** Cards start at `~280px` wide. On hover → expand to `~400px` with `transition: width 400ms cubic-bezier(0.4,0,0.2,1)`. Overflow hidden on container (horizontal scroll adjusts).
- **Reveal on expand:** Expanded card shows recipe metadata faded in: cook time, cuisine badge, a "View Recipe →" link.
- **Section header:** `"This month's editorial"` in italic Cormorant, left-aligned. Issue label right-aligned.
- **Scroll behavior:** Drag-scroll (mousedown → mousemove) or native overflow-x scroll on touch.

---

### 3. CookbookShelf (auth-gated, improved)

**Source:** `src/components/dashboard/cookbook-shelf.tsx`

**Auth-conditional rendering:**
- **Logged in:** Shows 3 most recent cookbooks (existing fetch logic). Improve card design — add recipe count as a badge, show last-cooked date.
- **Logged out:** Show 3 "ghost" placeholder cards with a frosted-glass overlay containing: `"Your cookbooks live here"` + `"Sign in to continue"` button (→ `/auth/login`).

**Section header:** `"Your Cookbooks"` (when logged in) or `"Build your cookbook"` (when logged out).

**CTA strip:** `"View All Cookbooks"` + `"Create New"` — only shown when logged in.

---

## Route Changes

- `/dashboard` → redirect `301` to `/` (add in `next.config.*` redirects, or via `redirect()` in a shell `page.tsx`)
- Any nav links pointing to `/dashboard` → update to `/`

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Replace FEATURES bento grid with `<FeatureCarousel>`. Add `<RecipePosters>`. Add `<CookbookShelf>`. Import Supabase user for auth gate. |
| `src/components/landing/FeatureCarousel.tsx` | NEW — client component. 30/70 split carousel with slide state, keyboard nav, dot nav. |
| `src/components/landing/recipe-showcase.tsx` | NEW (moved + improved from dashboard). Hover-expand cards. |
| `src/components/landing/cookbook-shelf.tsx` | NEW (moved + improved from dashboard). Auth-conditional render. |
| `src/app/(app)/layout.tsx` | Add `<DashboardOnboardingGate />` here (moved from /dashboard page). |
| `src/app/(app)/dashboard/page.tsx` | Replace with `redirect('/')` or delete + add redirect in next.config |
| `next.config.*` | Add `{ source: '/dashboard', destination: '/', permanent: true }` redirect |

---

## Non-Goals (explicitly out of scope)

- Changing the HeroSection or SwiperSection
- Redesigning the footer
- Changing auth flow or onboarding screens
- New feature demos (use existing Demo components)
- Mobile-specific carousel redesign (responsive but not mobile-first redesign)
