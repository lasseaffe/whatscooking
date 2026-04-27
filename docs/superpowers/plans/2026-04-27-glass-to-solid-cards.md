# Glass → Solid Card System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all liquid glass (`backdrop-blur-sm`, `bg-black/…`, `bg-white/…`, `border-white/…`) styles with solid opaque surfaces using the existing design system tokens.

**Architecture:** Add one `.card-solid` utility class to `globals.css`, then sweep all 13 affected files replacing glass patterns with semantic token equivalents. No new components, no structural changes — pure style token swap.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, CSS custom properties (existing `--bg-*`, `--border-*`, `--glow-*` tokens in `globals.css`)

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/app/globals.css` | Add `.card-solid` utility class |
| Modify | `src/components/recipe-card.tsx` | Badge `backdrop-blur-sm` → token |
| Modify | `src/components/sos-cooking-helper.tsx` | Container + tab strip glass → solid |
| Modify | `src/components/cooking-tip.tsx` | Tag pill `backdrop-blur-sm` → removed |
| Modify | `src/components/ui/sparks-carousel.tsx` | Card wrapper + badge overlay |
| Modify | `src/components/ui/animated-tabs.tsx` | `hover:bg-white/10` → glow token |
| Modify | `src/app/(app)/discover/discover-client.tsx` | Swipe action buttons |
| Modify | `src/app/(app)/my-recipes/my-recipes-client.tsx` | Tag pills |
| Modify | `src/app/(app)/my-recipes/page.tsx` | Tag pills |
| Modify | `src/app/(app)/saved/saved-client.tsx` | Tag pills |
| Modify | `src/app/(app)/swipe/swipe-client.tsx` | Overlay badge |
| Modify | `src/app/(app)/dashboard/dirty-soda-slideshow.tsx` | Nav arrow buttons |
| Modify | `src/app/(app)/dinner-parties/dinner-party-calendar.tsx` | Month nav buttons |
| Modify | `src/app/page.tsx` | Marketing page card |

## Token Reference

| Glass | Solid |
|---|---|
| `bg-black/20`, `bg-black/30` | `bg-[var(--bg-secondary)]` |
| `bg-black/50`, `bg-black/60` | `bg-[var(--bg-tertiary)]` |
| `border-white/10` | `border-[var(--border-primary)]` |
| `hover:bg-white/10`, `hover:bg-white/20` | `hover:bg-[var(--glow-on-neutral-hover)]` |
| `hover:bg-white/60` | `hover:bg-[var(--bg-quaternary)]` |
| `backdrop-blur-sm` (standalone) | remove |

---

### Task 1: Add `.card-solid` utility to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add the utility class**

Open `src/app/globals.css`. Find the end of the `:root` block (around line 130+, after all token definitions). Add the following after the last `}` of the root block, before any existing utility classes:

```css
/* ── Solid card surface — replaces glass/translucent patterns ── */
.card-solid {
  background: var(--bg-secondary);
  border: var(--border-default) solid var(--border-primary);
  border-radius: var(--radius-xl);
}
```

- [ ] **Step 2: Verify dev server still compiles**

Run: `cd C:/Users/lasse/Desktop/whatscooking && npm run dev`
Expected: Server starts with no CSS errors. No red overlay in browser.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add src/app/globals.css
git commit -m "style: add card-solid utility to replace glass patterns"
```

---

### Task 2: recipe-card.tsx — badge glass removal

**Files:**
- Modify: `src/components/recipe-card.tsx`

The recipe card has two badge types using `backdrop-blur-sm`: the Premium badge (`rc-card__badge--premium`) and the meal-plan-match badge. These are overlaid on top of the card image so they need `--bg-tertiary` (slightly elevated surface) rather than `--bg-secondary`.

- [ ] **Step 1: Read the file to confirm line numbers**

Read `src/components/recipe-card.tsx` lines 119–145.

- [ ] **Step 2: Remove `backdrop-blur-sm` from both badge spans**

Find:
```tsx
<span className="rc-card__badge rc-card__badge--premium backdrop-blur-sm">
```
Replace with:
```tsx
<span className="rc-card__badge rc-card__badge--premium">
```

Find:
```tsx
className="rc-card__badge backdrop-blur-sm"
```
Replace with:
```tsx
className="rc-card__badge"
```

The `rc-card__badge` CSS class should already define the solid background — if it uses a glass pattern, check `globals.css` for `.rc-card__badge` and replace any `backdrop-blur` or `bg-white/` there too.

- [ ] **Step 3: Verify visually**

Open `http://localhost:3000` (or any recipe grid page). Confirm badges are visible and solid — no blur artifact.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe-card.tsx
git commit -m "style: remove backdrop-blur from recipe card badges"
```

---

### Task 3: sos-cooking-helper.tsx — container + tab strip

**Files:**
- Modify: `src/components/sos-cooking-helper.tsx`

Two glass instances: a tab strip wrapper (`flex gap-2 flex-wrap bg-black/30 backdrop-blur-sm p-1 rounded-xl`) and a content container (`p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 min-h-20`).

- [ ] **Step 1: Read lines 30–60 to confirm exact strings**

Read `src/components/sos-cooking-helper.tsx` lines 30–60.

- [ ] **Step 2: Replace tab strip**

Find:
```tsx
<div className="flex gap-2 flex-wrap bg-black/30 backdrop-blur-sm p-1 rounded-xl">
```
Replace with:
```tsx
<div className="flex gap-2 flex-wrap bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl">
```

- [ ] **Step 3: Replace content container**

Find:
```tsx
<div className="p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 min-h-20">
```
Replace with:
```tsx
<div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] min-h-20">
```

- [ ] **Step 4: Verify visually**

Navigate to any recipe detail page and open the SOS helper. Confirm it renders solid with a visible border.

- [ ] **Step 5: Commit**

```bash
git add src/components/sos-cooking-helper.tsx
git commit -m "style: replace glass with solid tokens in SOS helper"
```

---

### Task 4: cooking-tip.tsx — tag pill blur removal

**Files:**
- Modify: `src/components/cooking-tip.tsx`

Three `<span>` elements use `backdrop-blur-sm` on pill tags overlaid on images. The pill background is already set via other classes — `backdrop-blur-sm` is the only glass artifact.

- [ ] **Step 1: Read the relevant lines**

Read `src/components/cooking-tip.tsx` lines 65–115.

- [ ] **Step 2: Remove all three `backdrop-blur-sm` instances**

Find (appears 3 times):
```tsx
className="flex items-center gap-1 text-xs px-2 py-1 rounded-full backdrop-blur-sm"
```
Replace with:
```tsx
className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
```

Also find:
```tsx
className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
```
Replace with:
```tsx
className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/cooking-tip.tsx
git commit -m "style: replace glass pill tags with solid tokens in cooking-tip"
```

---

### Task 5: ui/sparks-carousel.tsx — card wrapper + badge

**Files:**
- Modify: `src/components/ui/sparks-carousel.tsx`

Card wrapper: `overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-sm`
Badge overlay: `bg-black/50 text-white backdrop-blur-sm`

- [ ] **Step 1: Replace card wrapper**

Find:
```tsx
<div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md">
```
Replace with:
```tsx
<div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-sm transition-shadow hover:shadow-md">
```

- [ ] **Step 2: Replace badge overlay**

Find:
```tsx
<span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
```
Replace with:
```tsx
<span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--fg-primary)] border border-[var(--border-primary)]">
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sparks-carousel.tsx
git commit -m "style: replace glass with solid tokens in sparks carousel"
```

---

### Task 6: ui/animated-tabs.tsx — hover state

**Files:**
- Modify: `src/components/ui/animated-tabs.tsx`

One hover state using `hover:bg-white/10`.

- [ ] **Step 1: Read the relevant line**

Read `src/components/ui/animated-tabs.tsx` lines 120–130.

- [ ] **Step 2: Replace hover state**

Find:
```tsx
className="label-ornament px-8 py-3.5 transition-all hover:bg-white/10"
```
Replace with:
```tsx
className="label-ornament px-8 py-3.5 transition-all hover:bg-[var(--glow-on-neutral-hover)]"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/animated-tabs.tsx
git commit -m "style: replace glass hover state in animated-tabs"
```

---

### Task 7: discover-client.tsx — swipe action buttons

**Files:**
- Modify: `src/app/(app)/discover/discover-client.tsx`

Two circular action buttons (prev/next arrows) using `bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-black/80`.

- [ ] **Step 1: Read the relevant lines**

Read `src/app/(app)/discover/discover-client.tsx` lines 95–120.

- [ ] **Step 2: Replace both buttons**

Find (appears twice — left and right arrow):
```tsx
className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white shadow-md hover:bg-black/80 transition-colors"
```
Replace with:
```tsx
className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--fg-primary)] shadow-md hover:bg-[var(--bg-quaternary)] transition-colors"
```

Find (right arrow variant):
```tsx
className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white shadow-md hover:bg-black/80 transition-colors"
```
Replace with:
```tsx
className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--fg-primary)] shadow-md hover:bg-[var(--bg-quaternary)] transition-colors"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/discover/discover-client.tsx
git commit -m "style: replace glass swipe buttons with solid tokens in discover"
```

---

### Task 8: my-recipes-client.tsx + my-recipes/page.tsx — tag pills

**Files:**
- Modify: `src/app/(app)/my-recipes/my-recipes-client.tsx`
- Modify: `src/app/(app)/my-recipes/page.tsx`

Tag pill spans with `backdrop-blur-sm` overlaid on card images.

- [ ] **Step 1: Read both files to confirm the exact strings**

Read `src/app/(app)/my-recipes/my-recipes-client.tsx` lines 300–335.
Read `src/app/(app)/my-recipes/page.tsx` lines 85–115.

- [ ] **Step 2: Replace pill tags in my-recipes-client.tsx**

Find (appears twice):
```tsx
className="text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
```
Replace with:
```tsx
className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
```

Also find:
```tsx
className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium backdrop-blur-sm"
```
Replace with:
```tsx
className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
```

- [ ] **Step 3: Replace pill tags in my-recipes/page.tsx**

Find:
```tsx
className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
```
Replace with:
```tsx
className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/my-recipes/my-recipes-client.tsx src/app/(app)/my-recipes/page.tsx
git commit -m "style: replace glass tag pills with solid tokens in my-recipes"
```

---

### Task 9: saved-client.tsx — tag pills

**Files:**
- Modify: `src/app/(app)/saved/saved-client.tsx`

Same pattern as my-recipes: tag pill spans with `backdrop-blur-sm`.

- [ ] **Step 1: Read the relevant lines**

Read `src/app/(app)/saved/saved-client.tsx` lines 85–115.

- [ ] **Step 2: Replace pill tags**

Find:
```tsx
className="text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
```
Replace with:
```tsx
className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/saved/saved-client.tsx
git commit -m "style: replace glass tag pills with solid tokens in saved"
```

---

### Task 10: swipe-client.tsx — overlay badge

**Files:**
- Modify: `src/app/(app)/swipe/swipe-client.tsx`

One overlay badge on swipe cards: `absolute inset-0 bg-black/50 shadow-md backdrop-blur-sm !rounded-lg`.

- [ ] **Step 1: Read the relevant lines**

Read `src/app/(app)/swipe/swipe-client.tsx` lines 38–55.

- [ ] **Step 2: Replace overlay**

Find:
```tsx
className="absolute inset-0 bg-black/50 shadow-md backdrop-blur-sm !rounded-lg"
```
Replace with:
```tsx
className="absolute inset-0 bg-[var(--bg-tertiary)]/80 shadow-md !rounded-lg"
```

Note: keeping slight transparency here (`/80`) since this is a full-card overlay meant to signal a "matched" or "selected" state — fully opaque would block the card image entirely.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/swipe/swipe-client.tsx
git commit -m "style: replace glass overlay in swipe client"
```

---

### Task 11: dirty-soda-slideshow.tsx — nav arrow buttons

**Files:**
- Modify: `src/app/(app)/dashboard/dirty-soda-slideshow.tsx`

Two circular nav arrow buttons: `w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm`.

- [ ] **Step 1: Read the relevant lines**

Read `src/app/(app)/dashboard/dirty-soda-slideshow.tsx` lines 398–420.

- [ ] **Step 2: Replace both buttons**

Find (appears twice):
```tsx
className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80"
```
Replace with:
```tsx
className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border-primary)] transition-opacity hover:opacity-80"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/dashboard/dirty-soda-slideshow.tsx
git commit -m "style: replace glass nav buttons with solid tokens in dirty-soda slideshow"
```

---

### Task 12: dinner-party-calendar.tsx — month nav buttons

**Files:**
- Modify: `src/app/(app)/dinner-parties/dinner-party-calendar.tsx`

Two month nav buttons: `hover:bg-white/60`.

- [ ] **Step 1: Read the relevant lines**

Read `src/app/(app)/dinner-parties/dinner-party-calendar.tsx` lines 308–325.

- [ ] **Step 2: Replace hover states**

Find (appears twice):
```tsx
className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
```
Replace with:
```tsx
className="p-1.5 rounded-lg hover:bg-[var(--bg-quaternary)] transition-colors"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/dinner-parties/dinner-party-calendar.tsx
git commit -m "style: replace glass hover state in dinner party calendar"
```

---

### Task 13: app/page.tsx — marketing page card

**Files:**
- Modify: `src/app/page.tsx`

One card container on the marketing/landing page using glass patterns.

- [ ] **Step 1: Read the relevant lines**

Read `src/app/page.tsx` lines 155–165.

- [ ] **Step 2: Replace the card**

Find:
```tsx
className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
```
Replace with:
```tsx
className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--glow-on-neutral-hover)] transition-colors text-left"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: replace glass hover state on marketing page card"
```

---

### Task 14: Final verification sweep

- [ ] **Step 1: Confirm zero remaining glass patterns**

Run:
```bash
grep -rn "backdrop-blur\|bg-white/\|bg-black/" C:/Users/lasse/Desktop/whatscooking/src --include="*.tsx"
```
Expected: No output (or only intentional exceptions you consciously kept, e.g. the swipe overlay `/80` opacity modifier).

- [ ] **Step 2: Check globals.css for any remaining glass**

Run:
```bash
grep -n "backdrop-blur\|bg-white/\|bg-black/" C:/Users/lasse/Desktop/whatscooking/src/app/globals.css
```
Expected: No output.

- [ ] **Step 3: Visual smoke test — open 5 pages**

Navigate to each of these and confirm cards look solid, borders visible, no blur artifacts:
1. `http://localhost:3000` — marketing page
2. `http://localhost:3000/dashboard` — dirty soda slideshow nav
3. `http://localhost:3000/discover` — swipe action buttons
4. `http://localhost:3000/my-recipes` — tag pills
5. Any recipe detail page — SOS helper, cooking tip, badges

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "style: glass-to-solid card sweep complete"
```
