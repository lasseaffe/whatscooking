# Glass → Solid Card System

**Date:** 2026-04-27  
**Scope:** What's Cooking — replace all liquid glass card/container styles with solid opaque surfaces matching the existing design system tokens.

---

## Problem

~26 instances across 13 files use `backdrop-blur-sm`, `bg-black/…`, `bg-white/…`, and `border-white/…` Tailwind utility classes. These create a translucent glass effect that is inconsistent with the solid opaque card style established in images 2 & 3 (dietary filters modal, nutrition tracker).

---

## Goal

Every card, container, badge, and overlay that currently uses glass styling should become:
- **Solid** background using the semantic surface tokens
- **Crisp border** using border tokens (no translucent white borders)
- **No blur** (`backdrop-blur-sm` removed everywhere)
- **Hover states** replaced with the glow token equivalents

---

## Token Mapping

| Glass pattern | Solid replacement |
|---|---|
| `bg-black/20`, `bg-black/30` | `bg-[var(--bg-secondary)]` |
| `bg-black/50`, `bg-black/60` | `bg-[var(--bg-tertiary)]` |
| `border-white/10` | `border-[var(--border-primary)]` |
| `hover:bg-white/10`, `hover:bg-white/20` | `hover:bg-[var(--glow-on-neutral-hover)]` |
| `hover:bg-white/60` | `hover:bg-[var(--bg-quaternary)]` |
| `backdrop-blur-sm` (standalone) | removed |

---

## New Utility Class

Add to `src/app/globals.css`:

```css
.card-solid {
  background: var(--bg-secondary);
  border: var(--border-default) solid var(--border-primary);
  border-radius: var(--radius-xl);
}
```

Badges overlaid on images use `--bg-tertiary` so they read above the card surface.

---

## Files to Change (13 files, 26 instances)

### Components
- `src/components/recipe-card.tsx` — badges (`rc-card__badge`) with `backdrop-blur-sm`
- `src/components/sos-cooking-helper.tsx` — container and tab strip
- `src/components/cooking-tip.tsx` — tag pills with `backdrop-blur-sm`
- `src/components/ui/sparks-carousel.tsx` — card wrapper + badge overlay
- `src/components/ui/animated-tabs.tsx` — tab hover state `hover:bg-white/10`

### Page-level clients
- `src/app/(app)/discover/discover-client.tsx` — swipe action buttons
- `src/app/(app)/my-recipes/my-recipes-client.tsx` — tag pills
- `src/app/(app)/my-recipes/page.tsx` — tag pills
- `src/app/(app)/saved/saved-client.tsx` — tag pills
- `src/app/(app)/swipe/swipe-client.tsx` — overlay badge
- `src/app/(app)/dashboard/dirty-soda-slideshow.tsx` — nav arrow buttons
- `src/app/(app)/dinner-parties/dinner-party-calendar.tsx` — month nav buttons
- `src/app/page.tsx` — marketing page card

---

## Out of Scope

- Dark/light mode toggle behavior (unchanged)
- Recipe card image scrim (intentional, not glass)
- Any `opacity-…` classes that are not glass-related
- CSS variables already defined in globals.css (no changes to token definitions)
