# Visual Identity Standards

## Color Palette

### CRITICAL RULE — CSS Variables Only
**NEVER write hardcoded hex color values in component code.** The app supports 5 switchable palettes and dark/light mode. Hardcoded values break palette switching and theme toggling. Always use the CSS custom properties below.

### CSS Variables to use in all components (`style={{ ... }}` and class names)

| Purpose | CSS Variable | Notes |
|---|---|---|
| Page background | `var(--wc-bg-base)` | Darkest surface |
| Card / panel background | `var(--wc-bg-card)` | Slightly lighter |
| Elevated surface | `var(--wc-bg-elevated)` | Inputs, modals |
| Hover state | `var(--wc-bg-hover)` | Interactive hover |
| Active/pressed | `var(--wc-bg-active)` | Active states |
| Primary text | `var(--wc-text)` | Headings, body |
| Secondary text | `var(--wc-text-2)` | Subheadings |
| Muted text | `var(--wc-text-3)` | Captions |
| Dimmed text | `var(--wc-text-4)` | Placeholder |
| Subtle border | `var(--wc-border-subtle)` | Dividers |
| Default border | `var(--wc-border-default)` | Card borders |
| Strong border | `var(--wc-border-strong)` | Emphasis |
| Primary CTA (terracotta) | `var(--wc-terracotta)` | Buttons, links |
| Sage accent | `var(--wc-sage)` | Secondary accents |
| Gold (premium) | `var(--wc-gold)` | Premium badges |
| Current palette accent | `var(--wc-pal-accent)` | Active palette colour |

### Five palettes (defined in globals.css, only ONE active at a time via `data-palette` attr)
- `cast-iron` — Moody dark brown/thyme (default)
- `copper-clove` — Warm amber/spice
- `heirloom-orchard` — Sophisticated warm
- `sage-stone` — Cool earthy greens
- `midnight-pantry` — Deep cool blues

### Fixed colours (never change regardless of palette)
- **Gold / Premium**: `var(--wc-gold)` = `#C89818`
- **Destructive/Error**: `#ef4444` (Tailwind red-500)
- **Success**: `#22c55e` (Tailwind green-500)

### Light mode
Light mode (`data-theme="light"`) automatically flips `--wc-bg-base` ↔ `--wc-pal-lightest` and `--wc-text` ↔ `--wc-pal-darkest`. No code changes needed — just use the CSS variables above and both modes work automatically.

## Typography
- [cite_start]**Headers**: Serif (Libre Baskerville) [cite: 111]
- [cite_start]**UI Elements**: Sans-Serif (Inter) [cite: 111]
- [cite_start]**User Notes/Tips**: Script or Italic Serif to simulate 'Handwritten' notes [cite: 85]

## UI Patterns
- [cite_start]**Cards**: 16px corner radius with soft-lift hover effects (Y-8px)[cite: 59].
- **Animations**: 
  - [cite_start]Pulse indicators in Sage Green for 'Hot Right Now'[cite: 58].
  - [cite_start]Strikethrough effect on ingredients using SVG path (wobbly line)[cite: 112].
  - [cite_start]3-step SVG animation for Napkin Folding[cite: 95].