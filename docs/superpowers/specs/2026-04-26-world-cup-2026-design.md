# World Cup 2026 Feature — Design Spec
**Date:** 2026-04-26  
**Status:** Approved

---

## Overview

Expand the existing World Cup 2026 passport-challenge page into a full live-event feature: real flag cards, animated layout, fixture tracking, matchday floating panel, community dish photos, watch party planning, and guaranteed recipe coverage for every nation.

---

## 1. Country Card Redesign

**Goal:** Replace emoji flags + tiny text with real flag images filling the card background.

- Source: `https://flagcdn.com/w80/{iso2}.png` (free, no auth; lowercase ISO-2 code)
- Card size: `96px × 72px` (landscape flag ratio), `border-radius: 12px`
- 2-letter ISO code centered in bold white text with `text-shadow: 0 1px 4px rgba(0,0,0,0.8)`
- Status overlay: thin strip at card bottom
  - Stamped (≥3 cooked): gold shimmer + `✦` icon
  - In progress: amber progress pip e.g. `2/3`
  - Untouched: dark translucent strip, muted
- Hover: `translateY(-3px)` + flag `brightness(1.1)`, `transition: 150ms ease`
- Country name shown as tooltip (`title` attribute) — not on card face to keep it clean
- Cards link to `/world-cup-2026#{iso2}` so matchday panel deep-links work

---

## 2. Dynamic Layout & Motion

**Grid entrance animation:**
- Cards animate in per confederation, staggered: `animation-delay: calc(var(--i) * 30ms)`
- CSS `@keyframes card-in { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }`
- Stamped cards get an additional gold shimmer sweep on mount (`@keyframes shimmer`)

**Confederation headers:**
- Animated left-border color pulse in confederation color (subtle `opacity` keyframe, not distracting)
- Progress fraction (`0/19 cooked`) uses a CSS counter-up via `@property --n` + `counter()` trick — no JS

**Hero:**
- Progress bar width animates from `0%` to current `%` on mount (`transition: width 700ms cubic-bezier(0.34,1.56,0.64,1)`)
- Subtle background: faint repeating football/globe SVG pattern at `opacity: 0.04`, `background-attachment: fixed` (CSS only, no scroll JS)

---

## 3. Database Schema

### `wc_fixtures`
```sql
create table wc_fixtures (
  id          uuid primary key default gen_random_uuid(),
  match_day   int  not null,
  stage       text not null check (stage in ('group','r16','qf','sf','final')),
  match_date  timestamptz not null,
  home_code   char(2) not null,  -- ISO-2
  away_code   char(2) not null,
  home_score  int,               -- null = not yet played
  away_score  int,
  venue       text,
  group_label text               -- 'A'–'L' for group stage only
);
```

### `wc_match_photos`
```sql
create table wc_match_photos (
  id           uuid primary key default gen_random_uuid(),
  fixture_id   uuid references wc_fixtures(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  storage_path text not null,    -- Supabase Storage path
  caption      text,
  created_at   timestamptz default now()
);
-- RLS: insert own rows; select all (community feed)
```

### `wc_recipe_tags`
```sql
create table wc_recipe_tags (
  recipe_id      uuid references recipes(id) on delete cascade,
  nation_code    char(2) not null,
  is_event_badge boolean default true,
  primary key (recipe_id, nation_code)
);
```

`wc_recipe_tags` drives:
1. The World Cup badge rendered on recipe cards
2. Click routing: badge → `/world-cup-2026#{nation_code}`
3. The "≥5 recipes per nation" coverage query

**RLS policies:**
- `wc_fixtures`: public read, no user write (admin only via service role)
- `wc_match_photos`: select = public, insert = authenticated (own `user_id`), delete = own row
- `wc_recipe_tags`: public read, admin write

---

## 4. Matchday Floating Panel

**Position:** Fixed bottom, above nav bar (`bottom: 64px` on mobile, `bottom: 16px` on desktop).

**Collapsed state** (default):
- Single row: Trophy icon + "Matchday 12 · 3 matches today" + expand chevron
- Height: `48px`, `border-radius: 24px`, frosted glass background
- Hidden entirely when no fixtures within ±3 hours of now AND none scheduled today

**Expanded state** (tap chevron):
- Slides up via `max-height` transition
- One card per today's match:
  - Dual flag thumbnails (40×30px each) for home vs away
  - Kickoff time (localized via `Intl.DateTimeFormat`)
  - Score badge if live or finished; "vs" if upcoming
  - Two buttons: `[🇫🇷 FR]` `[🇦🇷 AR]` — each → `/world-cup-2026#FR` / `#AR`
  - "🍿 Watch Party" button → `/dinner-parties/new?theme=worldcup&match=FR-AR&date=...`
  - "📸 Share dish" button → opens photo upload bottom sheet

**Data:** Panel fetches from `/api/world-cup/fixtures?today=1` (server route reads `wc_fixtures` for today's date range). Polling every 60s when panel is expanded to catch score updates.

---

## 5. Matchday Photo Upload

**Entry point:** "📸 Share your dish" on each match card in the expanded panel.

**Bottom sheet:**
- Image file picker (accept: `image/*`, max 5MB client-side check)
- Optional caption (`<textarea maxLength={120}`)
- Submit button → POST to `/api/world-cup/photos` (multipart)

**API route (`/api/world-cup/photos`):**
1. Validate auth (reject unauthenticated)
2. Upload image to Supabase Storage bucket `wc-photos/{fixture_id}/{user_id}/{uuid}.jpg`
3. Insert row into `wc_match_photos`
4. Return `{ storage_path, public_url }`

**Community photo strip:**
- Below each match card in the panel (and on the nation's section of the page): horizontal scroll strip of thumbnails from `wc_match_photos` for that fixture
- Tap thumbnail → full-screen lightbox with caption + username

---

## 6. Watch Party Bridge

**Entry points:**
1. Nation card → "🍿 Watch Party" (opens fixture picker for that nation's upcoming matches, then bridges)
2. Matchday panel match card → "🍿 Watch Party" (directly bridges with that match pre-filled)

**Bridge mechanism:** Navigate to `/dinner-parties/new` with query params:
```
?theme=worldcup&match=FR-AR&date=2026-06-15T18:00Z&home=France&away=Argentina
```

**Changes to existing dinner party creator (`events-client.tsx`):**
- Add `"Sports Night"` to `OCCASIONS`: `{ id: "sports-night", label: "Sports Night", emoji: "⚽", desc: "Watch party for the big game" }`
- On mount, read query params: if `theme=worldcup`, auto-select `sports-night` occasion, pre-fill name `"France vs Argentina Watch Party"`, inject into `notes`: `"World Cup match between France and Argentina. Suggest classic sports viewing foods (wings, nachos, sliders, dips) plus 1–2 signature dishes from French and Argentinian cuisine."`
- No new DB tables — fully reuses `dinner_parties` schema

---

## 7. Recipe Coverage

### Output Files

**`RECIPES_NEEDED.md`** — Human-readable, updated after each pipeline run:
```markdown
# World Cup 2026 — Recipe Coverage
Last updated: 2026-04-26

| Nation       | Code | Have | Need | Gap | Status          |
|--------------|------|------|------|-----|-----------------|
| France       | FR   |  2   |  5   |  3  | 🟡 needs 3 more |
| Zambia       | ZM   |  0   |  5   |  5  | 🔴 needs 5 more |
| United States| US   |  7   |  5   |  0  | ✅ covered      |
```

**`scripts/wc2026_recipe_targets.yaml`** — Machine-readable, consumed by the scraping pipeline:
```yaml
# Auto-updated by pipeline — do not edit current_count manually
targets:
  - nation: France
    code: FR
    cuisine_slug: french
    current_count: 2
    needed: 5
  - nation: Zambia
    code: ZM
    cuisine_slug: east-african
    current_count: 0
    needed: 5
```

### Pipeline Integration
- Existing `ddgs + recipe-scrapers + supabase upsert` GitHub Action reads `wc2026_recipe_targets.yaml`
- Filters to entries where `current_count < needed`
- Scrapes `needed - current_count` recipes per nation using `cuisine_slug` as search seed
- After upsert, updates `current_count` in YAML and regenerates `RECIPES_NEEDED.md`
- New step: after scraping, run `wc_recipe_tags` upsert to tag scraped recipes with `nation_code`

### World Cup Badge on Recipe Cards
- Recipe cards query `wc_recipe_tags` for the recipe's id
- If a tag exists: render a small "⚽ WC2026" badge overlay on the card thumbnail
- Badge is a `<Link href="/world-cup-2026#{nation_code}">` — click navigates to that nation's section

---

## Implementation Order

1. **DB migrations** — create 3 tables + RLS + seed `wc_fixtures` with full confirmed schedule
2. **Flag card redesign** — swap emoji for `flagcdn.com` images, new card layout + CSS animations
3. **Recipe coverage files** — generate `RECIPES_NEEDED.md` + `wc2026_recipe_targets.yaml` from DB query
4. **`wc_recipe_tags` population** — tag existing recipes, add pipeline step, add badge to recipe cards
5. **Matchday floating panel** — component + `/api/world-cup/fixtures` route + polling
6. **Photo upload** — bottom sheet + `/api/world-cup/photos` route + community strip
7. **Watch party bridge** — query param handling in dinner party creator + "Watch Party" buttons

---

## Out of Scope

- Admin UI for updating match scores (use Supabase dashboard / service-role API call)
- Push notifications for match kickoff
- Live score websocket (polling every 60s is sufficient for this scale)
