# Design Spec: Groups A + B + C
**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** Bug fixes, full-site color palette system, recipe page & card improvements

---

## Group A — Bug Fixes

### A1 — `continentId` server/client boundary error
**File:** `src/app/(app)/cuisines/page.tsx` + `src/components/cuisine-nav.tsx`  
**Error:** `Attempted to call continentId() from the server but continentId is on the client.`

`continentId()` is a pure string utility that lives inside `cuisine-nav.tsx` which carries `"use client"`. The server component `page.tsx` imports it, violating the Next.js server/client boundary rule.

**Fix:**
- Extract `continentId` into `src/lib/continent-id.ts` (no directive — safe for server + client)
- Update `cuisine-nav.tsx` and `page.tsx` to import from `@/lib/continent-id`

### A2 — Textarea hydration mismatch
**File:** `src/app/(app)/recipes/[id]/recipe-interactions.tsx:218`  
**Error:** Hydration mismatch on `<textarea>` — `data-has-listeners` attribute injected client-side.

This is a known React hydration issue with controlled inputs. The attribute difference between SSR and CSR triggers the warning.

**Fix:**
- Add `suppressHydrationWarning` to the `<textarea>` element at line 218

---

## Group B — Full-Site Color Palette System

### Root Cause
`palette-switcher.tsx` sets `data-palette="<id>"` on `<html>`. `globals.css` has `[data-palette="..."]` blocks that override `--wc-pal-*` tokens only. But the rest of the app uses `--wc-floor`, `--wc-surface-1`, `--wc-surface-2`, `--wc-accent-saffron`, `--wc-accent-primary` etc. — none of which are remapped in the palette blocks, so palette changes only affect components that explicitly read `--wc-pal-accent`.

### Fix
Inside **each** `[data-palette="..."]` block in `globals.css`, add mappings for all core tokens:

```css
--wc-floor:           var(--wc-pal-darkest);
--wc-surface-1:       color-mix(in srgb, var(--wc-pal-darkest) 60%, var(--wc-pal-dark));
--wc-surface-2:       var(--wc-pal-dark);
--wc-accent-saffron:  var(--wc-pal-accent);
--wc-accent-persimmon:var(--wc-pal-accent);
--wc-accent-primary:  var(--wc-pal-accent);
```

For **light mode** palette blocks (`[data-theme="light"][data-palette="..."]`), use palette-lightest as base:
```css
--wc-floor:     var(--wc-pal-lightest);
--wc-surface-1: color-mix(in srgb, var(--wc-pal-lightest) 85%, var(--wc-pal-mid));
--wc-surface-2: color-mix(in srgb, var(--wc-pal-lightest) 70%, var(--wc-pal-mid));
```

This cascades everywhere since all components already use `var(--wc-floor)` etc.

### Light Mode Improvements
The light mode (`[data-theme="light"]`) is too bright, especially the sidebar. Additional fixes in the light mode block:
- Sidebar background: use `#D8D0C4` instead of `#F0EDE9` for `--wc-floor`
- Input/textbox background: `#E4DED6`
- Button backgrounds: `#D0C8BC`

---

## Group C — Recipe Page + Cards

### C1 — Recipe image vertical space
**File:** `src/app/(app)/recipes/[id]/recipe-hero-image.tsx` (or wherever image height is set)  
Tags (`mediterranean`, `vegan`) are barely visible because sections below the image crowd it.

**Fix:**
- Increase image container min-height to `min-h-[340px]` (from current ~260px)
- Add `pb-6` gap below image before stat/tag pills

### C2 — Description on recipe cards
**File:** `src/components/recipe-card.tsx`  
Recipe description text is not shown on cards. PDF requests it shown below recipe name in body text style.

**Fix:**
- Add `<p>` below the title, `line-clamp-2`, muted color (`--wc-text-3`), text-sm
- Only render if `recipe.description` is truthy

### C3 — Grid/List/Gallery view toggle
**Files:** `src/components/ui/toggle-group.tsx` (new), `src/app/(app)/discover/discover-client.tsx`

Install the provided `toggle-group.tsx` component (uses `react-aria-components` + `class-variance-authority`). Wire into `discover-client.tsx`:

| Mode | Layout |
|------|--------|
| Grid | Current default: 4/2/1 col responsive grid |
| List | Single column, wider cards showing full description |
| Gallery | 2-col masonry, larger images, minimal text overlay |

View preference persisted in `localStorage` as `wc-view-mode`.

**Dependencies to install:** `react-aria-components`, `class-variance-authority`

---

## Implementation Order
1. A1 (continent-id extract) — unblocks cuisines page
2. A2 (textarea hydration) — removes console noise
3. B (palette system) — globals.css only, high impact
4. C1 (image space) — single-file change
5. C2 (description on cards) — single-file change
6. C3 (view toggle) — new component + wire-up
