# Dashboard Redesign — Design Spec
**Date:** 2026-05-23  
**Project:** What's Cooking (`localhost:3002`)  
**Status:** Design approved · Ready for implementation

---

## Why

The existing dashboard is a standard feature-card grid with a hero video. It reads as a generic SaaS homepage. The redesign turns the dashboard into a cinematic editorial experience — each scroll section has a distinct identity, and the recipe showcase treats food as art, not a product listing.

---

## Architecture

Four full-width sections, stacked vertically, each filling at least 100vh:

```
┌──────────────────────┐
│  1. HERO             │  100vh · full-bleed · cinematic entry
├──────────────────────┤
│  2. FEATURE SHOWCASE │  100vh · locked horizontal slide carousel
├──────────────────────┤
│  3. RECIPE SHOWCASE  │  ~100vh · 5 artistic recipe posters
├──────────────────────┤
│  4. COOKBOOK         │  ~80vh · editorial cookbook shelf
└──────────────────────┘
```

**File to replace:** `src/app/(app)/dashboard/page.tsx`  
Keep `dirty-soda-slideshow.tsx` and `dashboard-scramble.tsx` as standalone components — they move into the Feature Showcase section.

---

## Section 1 — Hero

**Layout:** Full-bleed 100vh, dark overlay, centred content.

**Visual:**
- Background: looping short video clip or large static photo of food being prepared (editorial, not stock)
- Overlay: `linear-gradient(to bottom, rgba(13,13,12,0.3) 0%, rgba(13,13,12,0.75) 100%)`
- Content centred, max-width 680px

**Content (top → bottom):**
1. `WC` logomark — small, top-left, `--wc-pal-accent` colour
2. Tagline headline — `Fraunces` or `Libre Baskerville`, ~72px, italic, warm white, e.g. *"Every ingredient has a story."*
3. Sub-tagline — Inter 300, 18px, `--fg-tertiary`, 1 short line
4. Two CTAs — primary `Find Recipes` button, ghost `Explore Pantry` button

**Scroll cue:** Animated chevron-down at bottom centre, fades out on scroll.

**Motion:** Ken Burns on the background image/video (20s loop, scale 1.0 → 1.06, slow translate).

---

## Section 2 — Feature Showcase

**Layout:** 100vh, dark background `--bg-base`, locked horizontal slide carousel.

**Behaviour:** Vertical scroll within this section is intercepted and converted to horizontal slide movement (CSS `scroll-snap` or JS-driven). Each slide locks at 100vw. A progress bar at the top shows position (1/9, 2/9 …).

**Slides:** The existing 9 feature entry points, each as a full-screen editorial panel:

| Slide | Feature | Accent colour |
|-------|---------|---------------|
| 1 | AI Planner | `--wc-pal-accent` |
| 2 | Find Recipes | `--rc-accent` |
| 3 | Pantry / Scramble | sage `#828E6F` |
| 4 | Meal Plans | `--wc-pal-dark` |
| 5 | Saved Recipes | `--wc-pal-accent` |
| 6 | My Recipes | `--rc-meta` |
| 7 | Calorie Tracker | terracotta `#C4622D` |
| 8 | World Cup 2026 | gold `#D4A040` |
| 9 | Cookbooks | cream `#F3F1ED` |

Each slide: large editorial title (Fraunces, ~96px), 1-sentence description, prominent CTA button, full-bleed background image with dark scrim. Reuse `hero-filter-card.tsx` pattern.

**Dirty Soda Slideshow:** Integrated as slide 1 or shown as a featured panel above the carousel.

---

## Section 3 — Recipe Showcase

**Layout:** Dark background `#1a1410`, horizontal scroll of 5 poster cards centred in viewport. Padding 60px top/bottom.

**Card dimensions:** `max-width: 340px`, `aspect-ratio: 2/3` (portrait). Cards sit side by side with `gap: 32px`. On desktop, show ~2.5 cards at once so the next poster peeks in. On mobile, show 1 card.

**Scroll behaviour:** Horizontal scroll with `scroll-snap-type: x mandatory`, each card snaps to centre.

**Section header (above cards):**
```
RECIPE SHOWCASE               Issue No. 01
Five dishes. Five worlds.
```
Typography: Inter 200 uppercase tracking, `--fg-tertiary` colour.

### The Five Posters

Each poster is a self-contained HTML-equivalent React component. Design language is shared but identity is distinct.

#### Shared design language
- Font pair: `DM Serif Display` (italic, recipe name) + `Cormorant Garamond` (italic, body) + `Inter` (UI labels)
- Photo zone: top 44–46% of card, `object-fit: cover`, Ken Burns animation (20–24s)
- Photo fade: `linear-gradient` bleeding photo into background colour
- Monogram: SVG `<pattern>` tiled across full card at `opacity: 0.085–0.092`
- Cultural text hover: `.lang` class → `::after` pseudo-element shows `data-en` translation on hover
- Divider: scroll arms + cultural ornament at centre
- Editorial rule: double horizontal lines below photo zone
- Content: provenance (top-left) + serial No. (top-right) + title + sub-label + description + ingredients list + meta row + citation block

#### Poster 1 — Carbonara · No. I
- Background: dark warm charcoal (espresso tones)
- Monogram: *[design from approved v8 — reference `carbonara-poster-v8.html`]*
- Language: Italian hover

#### Poster 2 — Ramen · No. II
- Background: ivory washi paper `#F0E8D6`
- Monogram: **Seigaiha** (青海波) — overlapping half-disc arcs tiled at `width:20 height:20`, crimson `#C41E3A` stroke at `opacity:0.085`
  - Row A: `M0,20 A10,10 0 0,1 20,20 Z`
  - Row B offset: `M-10,10 A10,10 0 0,1 10,10 Z` + `M10,10 A10,10 0 0,1 30,10 Z`
- Divider ornament: Japanese sun mon (two concentric circles, crimson fill)
- Language: Japanese hover
- Provenance: `日本 · 福岡県` / `明治時代より`

#### Poster 3 — Croissant · No. III
- Background: warm beige `#EFE4CE` + pastel washes (dusty rose, sage, lavender)
- Monogram: **Fleur-de-lis trellis** — 28×28 tile, diagonal lines stopping at 10px from centre, Wikipedia CC0 heraldic fleur-de-lis path (Flanker 2006) at `scale(0.069)`, `opacity:0.085`
  - Transform: `translate(14,14) scale(0.069) translate(-79.5,-93)`
  - Fleur path starts: `M 79.5,14.124625 C 76.48906,22.876132...`
- Divider ornament: scroll S-curves with real fleur at centre
- Language: French hover
- Provenance: `Paris · Île-de-France` / `Maison fondée 1838`

#### Poster 4 — Fattoush · No. IV
- Background: deep lapis navy `#0E1D35`
- Monogram: **Khatam** (Islamic 8-pointed star) — 30×30 tile, `<polygon id="khatam">` with 16 alternating outer/inner points (outer r=6, inner r=2.5), saffron `#C8922A`, `opacity:0.09`
  - Points: `0,-6 0.96,-2.31 4.24,-4.24 2.31,-0.96 6,0 2.31,0.96 4.24,4.24 0.96,2.31 0,6 -0.96,2.31 -4.24,4.24 -2.31,0.96 -6,0 -2.31,-0.96 -4.24,-4.24 -0.96,-2.31`
  - Full star at (15,15); quarter-stars at (0,0), (30,0), (0,30), (30,30)
- Divider ornament: same khatam polygon, `rgba(212,150,42,0.72)`
- Language: Arabic hover
- Provenance: `Beirut · بلاد الشام` / `منذ الأزل`

#### Poster 5 — Birria Tacos · No. V
- Background: volcanic near-black `#130A04`
- Monogram: **Aztec nested stepped diamond** — 24×24 tile, two concentric stepped diamond outlines
  - Outer (step=3): `M12,0 L15,0 L15,3 L18,3 L18,6 L21,6 L21,9 L24,9 L24,12 L24,15 L21,15 L21,18 L18,18 L18,21 L15,21 L15,24 L12,24 L9,24 L9,21 L6,21 L6,18 L3,18 L3,15 L0,15 L0,12 L0,9 L3,9 L3,6 L6,6 L6,3 L9,3 L9,0 Z`
  - Inner (step=2): `M12,6 L14,6 L14,8 L16,8 L16,10 L18,10 L18,12 L18,14 L16,14 L16,16 L14,16 L14,18 L12,18 L10,18 L10,16 L8,16 L8,14 L6,14 L6,12 L6,10 L8,10 L8,8 L10,8 L10,6 Z`
  - Fire orange `#C45A0A`, `opacity:0.092`
- Divider ornament: angular 4-pointed star (Aztec cross)
- Language: Spanish hover
- Provenance: `Jalisco · México` / `Desde siempre`

---

## Section 4 — Cookbook Shelf

**Layout:** `~80vh`, background `#0d0d0c` (`--bg-base`), centred content, max-width 1200px.

**Section header:**
```
MY COOKBOOKS                              View All →
Collected recipes, curated your way.
```

**Display:** 3 cookbook cards in a horizontal row (desktop), 1.5 visible on mobile with horizontal scroll.

**Cookbook card design:**
- Dimensions: `220px × 300px`, `border-radius: 4px`
- Background: Supabase `cookbooks` table cover image (if set) or procedurally generated cover using the cookbook's dominant palette from its recipes
- Fallback cover: warm gradient using `--wc-pal-accent` tones + cookbook title in `Fraunces` italic at 32px
- Bottom strip (inside card, bottom 30%): dark scrim `rgba(0,0,0,0.75)`, cookbook title in Inter 300 uppercase tracking, recipe count in `--rc-meta` colour
- Hover: lift `-6px` + `box-shadow: 0 20px 60px rgba(0,0,0,0.5)`, scale `1.02`

**Empty state (no cookbooks yet):**
- Single card with dashed border `rgba(--wc-pal-accent, 0.3)`, `+` icon, "Create your first cookbook" CTA
- Links to `/cookbooks/new`

**Data source:** `SELECT * FROM cookbooks WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 3`  
(reuse existing Supabase query pattern from `src/app/(app)/dashboard/page.tsx`)

**Below cards:** CTA row — `View All Cookbooks` (ghost button) + `Create New` (accent button)

---

## Motion & Animation

| Element | Animation | Duration |
|---------|-----------|----------|
| Photo zones | Ken Burns (`scale` + `translate`) | 20–24s infinite |
| Section entry | `scroll-reveal` fade-up (existing utility) | 0.6s stagger 0.04s |
| Poster hover | `border-color` → `rgba(accent, 0.4)` | 0.3s |
| Cookbook hover | lift + scale + shadow | 0.25s ease |
| Feature slide transition | `scroll-snap` horizontal | native |
| Hero scroll cue | fade pulse + bounce | 2s infinite |

---

## Typography Contract

| Role | Font | Size | Weight |
|------|------|------|--------|
| Poster recipe name | DM Serif Display italic | `clamp(46px,11vw,76px)` | 400 |
| Poster body | Cormorant Garamond italic | 14–15.5px | 300 |
| Poster labels | Inter | 7–8px, letter-spacing 3–5px, uppercase | 200 |
| Hero headline | Fraunces italic | ~72px | 600 |
| Section headers | Inter | 9px, letter-spacing 4px, uppercase | 200 |
| Cookbook title | Fraunces italic | 32px | 400 |

---

## Responsive Breakpoints

| Breakpoint | Recipe posters | Feature slides | Cookbook cards |
|-----------|---------------|----------------|----------------|
| `< 640px` | 1 visible (snap) | full-screen | 1.5 visible |
| `640–1024px` | 2 visible | full-screen | 2 visible |
| `> 1024px` | 2.5 visible | full-screen | 3 visible |

---

## Data Requirements

### Section 3 — Recipe Showcase
- 5 recipes: Carbonara, Ramen, Croissant, Fattoush, Birria Tacos
- Fetched by title slug from `recipes` table, or hardcoded seed IDs
- Fallback: emoji character if image unavailable
- Images: `recipe_images` table or direct Unsplash URLs as seed

### Section 4 — Cookbook Shelf
- `cookbooks` table: `id`, `user_id`, `title`, `cover_image_url`, `recipe_count`, `updated_at`
- Limit 3, ordered by `updated_at DESC`
- No cookbooks → empty state with CTA

---

## Files to Create / Modify

| Path | Action | Notes |
|------|--------|-------|
| `src/app/(app)/dashboard/page.tsx` | Rewrite | Replace with 4-section layout |
| `src/components/dashboard/hero-section.tsx` | Create | Section 1 |
| `src/components/dashboard/feature-showcase.tsx` | Create | Section 2 + integrates dirty-soda-slideshow |
| `src/components/dashboard/recipe-showcase.tsx` | Create | Section 3 orchestrator |
| `src/components/dashboard/recipe-poster.tsx` | Create | Individual poster card (takes poster config prop) |
| `src/components/dashboard/cookbook-shelf.tsx` | Create | Section 4 |
| `src/app/(app)/dashboard/dirty-soda-slideshow.tsx` | Keep | No changes |
| `src/app/(app)/dashboard/dashboard-scramble.tsx` | Keep | Moves into feature-showcase |

---

## Verification

1. `npm run dev` — confirm 4 sections render at `localhost:3002/dashboard`
2. Scroll through all 4 sections — confirm Ken Burns, section transitions, cultural hover tooltips
3. Feature showcase: vertical scroll → horizontal slide, 9 slides snap correctly
4. Recipe showcase: 5 posters visible, monogram patterns render, hover translations work
5. Cookbook shelf: authenticated user with cookbooks sees cards; unauthenticated or empty → correct empty state
6. Mobile: test at 375px — posters snap, cookbook scrolls, hero readable
7. No console errors; no broken image fallbacks (emoji shows if image missing)
