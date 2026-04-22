# Groups A+B+C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two runtime errors on the cuisines page, make the palette switcher change the entire site's colour scheme, darken light mode, add recipe descriptions to cards, increase recipe hero image space, and add Grid/List/Gallery view toggle to discover.

**Architecture:** All changes are CSS-token wiring (Group B), pure utility extraction (A1), a single attribute addition (A2), and UI tweaks + one new component (Group C). No new API routes or DB changes needed.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS, CSS custom properties, `react-aria-components`, `class-variance-authority`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/continent-id.ts` | **Create** | Pure `continentId()` util — no client/server directive |
| `src/components/cuisine-nav.tsx` | **Modify** | Import `continentId` from new util instead of defining it |
| `src/app/(app)/cuisines/page.tsx` | **Modify** | Import `continentId` from new util |
| `src/app/(app)/recipes/[id]/recipe-interactions.tsx` | **Modify** | Add `suppressHydrationWarning` to textarea |
| `src/app/globals.css` | **Modify** | Remap core tokens inside every `[data-palette]` block; darken light mode |
| `src/components/recipe-card.tsx` | **Modify** | Render `recipe.description` below title |
| `src/app/(app)/recipes/[id]/recipe-hero-image.tsx` | **Modify** | Increase image container min-height |
| `src/app/(app)/recipes/[id]/page.tsx` | **Modify** | Increase left-column image wrapper height |
| `src/components/ui/toggle-group.tsx` | **Create** | Grid/List/Gallery toggle component |
| `src/app/(app)/discover/discover-client.tsx` | **Modify** | Wire view toggle, add List and Gallery layouts |

---

## Task 1: Extract `continentId` to shared util

**Files:**
- Create: `src/lib/continent-id.ts`
- Modify: `src/components/cuisine-nav.tsx`
- Modify: `src/app/(app)/cuisines/page.tsx`

- [ ] **Step 1: Create the shared util**

Create `src/lib/continent-id.ts`:
```ts
export function continentId(name: string): string {
  return "continent-" + name.toLowerCase().replace(/\s+/g, "-");
}
```

- [ ] **Step 2: Update `cuisine-nav.tsx` to import from util**

In `src/components/cuisine-nav.tsx`, remove the local `continentId` function definition (lines 10-12) and add the import at the top:
```ts
import { continentId } from "@/lib/continent-id";
```

- [ ] **Step 3: Update `page.tsx` to import from util**

In `src/app/(app)/cuisines/page.tsx` line 7, change:
```ts
// Before:
import { CuisineNav, continentId } from "@/components/cuisine-nav";

// After:
import { CuisineNav } from "@/components/cuisine-nav";
import { continentId } from "@/lib/continent-id";
```

- [ ] **Step 4: Verify the app compiles — open http://localhost:3002/cuisines and confirm no runtime error about `continentId`**

- [ ] **Step 5: Commit**
```bash
git add src/lib/continent-id.ts src/components/cuisine-nav.tsx "src/app/(app)/cuisines/page.tsx"
git commit -m "fix: extract continentId to shared util — resolves server/client boundary error"
```

---

## Task 2: Fix textarea hydration mismatch

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-interactions.tsx:218`

- [ ] **Step 1: Add `suppressHydrationWarning` to the textarea**

In `recipe-interactions.tsx`, find the `<textarea>` at line 218 and add the prop:
```tsx
// Before:
<textarea
  value={commentText}
  onChange={(e) => setCommentText(e.target.value)}
  placeholder="Share your experience, tips, or variations…"
  rows={3}
  className="w-full text-sm resize-none focus:outline-none bg-transparent"
  style={{ color: "#EFE3CE" }}
/>

// After:
<textarea
  value={commentText}
  onChange={(e) => setCommentText(e.target.value)}
  placeholder="Share your experience, tips, or variations…"
  rows={3}
  suppressHydrationWarning
  className="w-full text-sm resize-none focus:outline-none bg-transparent"
  style={{ color: "#EFE3CE" }}
/>
```

- [ ] **Step 2: Open a recipe page (http://localhost:3002/recipes/<any-id>) and confirm the hydration console error is gone**

- [ ] **Step 3: Commit**
```bash
git add "src/app/(app)/recipes/[id]/recipe-interactions.tsx"
git commit -m "fix: suppress textarea hydration mismatch warning"
```

---

## Task 3: Wire core colour tokens to palette system

**Files:**
- Modify: `src/app/globals.css` (the five `html[data-palette="..."]` blocks, lines ~521–560)

The problem: `--wc-floor`, `--wc-surface-1`, `--wc-surface-2`, `--wc-accent-saffron`, `--wc-accent-persimmon`, `--wc-accent-primary` are only defined once (in `:root`) as hardcoded hex values. They are never overridden in palette blocks, so switching palette only affects `--wc-pal-*` consumers. Fix: add remappings inside every palette block.

- [ ] **Step 1: Extend the `cast-iron` palette block**

Find `html[data-palette="cast-iron"]` in `globals.css` (~line 521) and extend it:
```css
html[data-palette="cast-iron"] {
  --wc-pal-darkest:  #1A1208;
  --wc-pal-dark:     #5F3E2D;
  --wc-pal-mid:      #828E6F;
  --wc-pal-accent:   #B07D56;
  --wc-pal-sage:     #828E6F;
  --wc-pal-lightest: #F3F1ED;
  /* Core token remaps */
  --wc-floor:            #1A1208;
  --wc-surface-1:        #2A1E14;
  --wc-surface-2:        #3D2D20;
  --wc-accent-saffron:   #B07D56;
  --wc-accent-persimmon: #C8522A;
  --wc-accent-primary:   #B07D56;
}
```

- [ ] **Step 2: Extend the `copper-clove` palette block**

Find `html[data-palette="copper-clove"]` (~line 529):
```css
html[data-palette="copper-clove"] {
  --wc-pal-darkest:  #160E08;
  --wc-pal-dark:     #7A4A20;
  --wc-pal-mid:      #A89060;
  --wc-pal-accent:   #C8782A;
  --wc-pal-sage:     #A89060;
  --wc-pal-lightest: #FDF5E8;
  /* Core token remaps */
  --wc-floor:            #160E08;
  --wc-surface-1:        #261608;
  --wc-surface-2:        #3A2210;
  --wc-accent-saffron:   #C8782A;
  --wc-accent-persimmon: #E06020;
  --wc-accent-primary:   #C8782A;
}
```

- [ ] **Step 3: Extend the `heirloom-orchard` palette block**

Find `html[data-palette="heirloom-orchard"]` (~line 537):
```css
html[data-palette="heirloom-orchard"] {
  --wc-pal-darkest:  #1A1210;
  --wc-pal-dark:     #6B4A38;
  --wc-pal-mid:      #A6B08E;
  --wc-pal-accent:   #B07D56;
  --wc-pal-sage:     #A6B08E;
  --wc-pal-lightest: #F3F1ED;
  /* Core token remaps */
  --wc-floor:            #1A1210;
  --wc-surface-1:        #281A14;
  --wc-surface-2:        #3C2A20;
  --wc-accent-saffron:   #B07D56;
  --wc-accent-persimmon: #C85030;
  --wc-accent-primary:   #B07D56;
}
```

- [ ] **Step 4: Extend the `sage-stone` palette block**

Find `html[data-palette="sage-stone"]` (~line 545):
```css
html[data-palette="sage-stone"] {
  --wc-pal-darkest:  #121810;
  --wc-pal-dark:     #4A6040;
  --wc-pal-mid:      #7A9A6A;
  --wc-pal-accent:   #7A9A6A;
  --wc-pal-sage:     #A6B08E;
  --wc-pal-lightest: #F0F4EC;
  /* Core token remaps */
  --wc-floor:            #121810;
  --wc-surface-1:        #1C2618;
  --wc-surface-2:        #2A3824;
  --wc-accent-saffron:   #7A9A6A;
  --wc-accent-persimmon: #5A8050;
  --wc-accent-primary:   #7A9A6A;
}
```

- [ ] **Step 5: Extend the `midnight-pantry` palette block**

Find `html[data-palette="midnight-pantry"]` (~line 553):
```css
html[data-palette="midnight-pantry"] {
  --wc-pal-darkest:  #0A0E14;
  --wc-pal-dark:     #2A3A50;
  --wc-pal-mid:      #5A8AB0;
  --wc-pal-accent:   #5A8AB0;
  --wc-pal-sage:     #8AA0B8;
  --wc-pal-lightest: #EEF2F8;
  /* Core token remaps */
  --wc-floor:            #0A0E14;
  --wc-surface-1:        #141C28;
  --wc-surface-2:        #1E2C40;
  --wc-accent-saffron:   #5A8AB0;
  --wc-accent-persimmon: #4070A0;
  --wc-accent-primary:   #5A8AB0;
}
```

- [ ] **Step 6: Test — open the app, switch palettes from the sidebar, confirm the background/surface/accent colours all change site-wide**

- [ ] **Step 7: Commit**
```bash
git add src/app/globals.css
git commit -m "feat: wire core colour tokens to palette system — full-site palette switching"
```

---

## Task 4: Darken light mode

**Files:**
- Modify: `src/app/globals.css` (the `[data-theme="light"]` block, around line 450–510)

- [ ] **Step 1: Find the light mode token block and update floor/surface/input colours**

Find `[data-theme="light"]` in `globals.css`. Update the `--wc-floor`, `--wc-surface-1`, `--wc-surface-2` tokens and add input/button colours:

```css
/* Replace the existing light-mode wc- tokens with these */
--wc-floor:           #D8D0C4;   /* was #F0EDE9 — darker sidebar base */
--wc-surface-1:       #E4DED6;   /* was #F9F7F4 */
--wc-surface-2:       #CEC6BA;   /* was #E4E0DB */
--wc-accent-saffron:  #C06810;   /* was #D4780E — slightly richer */
--wc-accent-persimmon:#B84418;   /* was #CC4D18 */
--wc-accent-primary:  #C06810;
/* Input/button backgrounds */
--wc-bg-input:        #D0C8BC;
--wc-bg-card:         #DDD8D0;
--wc-bg-elevated:     #E8E4DE;
--wc-bg-hover:        #C8C0B4;
```

- [ ] **Step 2: Toggle to light mode in the app and verify the sidebar is notably darker, input boxes and buttons are tinted warm grey**

- [ ] **Step 3: Commit**
```bash
git add src/app/globals.css
git commit -m "fix: darken light mode — sidebar, inputs, and buttons"
```

---

## Task 5: Increase recipe hero image space

**Files:**
- Modify: `src/app/(app)/recipes/[id]/page.tsx`

The recipe detail page renders the hero image in a left sticky column. The image height needs more room so dietary tags don't get cut off.

- [ ] **Step 1: Find the image wrapper in `page.tsx` and increase its height**

In `src/app/(app)/recipes/[id]/page.tsx`, find the left-column image wrapper (look for where `RecipeHeroImage` is rendered — around line 100–160). The container div that wraps `RecipeHeroImage` currently has a fixed height like `h-[260px]` or `aspect-ratio`. Change it so the image has at least 340px:

```tsx
// Find the wrapper div around <RecipeHeroImage ...> and update:
// Before (example — exact class may vary):
<div className="relative overflow-hidden rounded-2xl" style={{ height: "260px" }}>

// After:
<div className="relative overflow-hidden rounded-2xl" style={{ minHeight: "340px", height: "40vh" }}>
```

Also add bottom padding after the image before the next section:
```tsx
// The div immediately after the image wrapper — add pt-4 or mb-4 to create breathing room
```

- [ ] **Step 2: Open a recipe page and confirm the tags (e.g. "mediterranean", "vegan") are fully visible without being cut off**

- [ ] **Step 3: Commit**
```bash
git add "src/app/(app)/recipes/[id]/page.tsx"
git commit -m "fix: increase recipe hero image height so dietary tags are visible"
```

---

## Task 6: Show description on recipe cards

**Files:**
- Modify: `src/components/recipe-card.tsx`

- [ ] **Step 1: Add a description paragraph below the recipe title**

In `src/components/recipe-card.tsx`, find the title element inside the bottom content area (around line 170–220, inside `.absolute.inset-x-0.bottom-0`). After the `<h2>` or `<h3>` title element, add:

```tsx
{recipe.description && (
  <p
    className="text-xs leading-snug line-clamp-2 mt-0.5"
    style={{
      color: "rgba(239,227,206,0.65)",
      textShadow: "0 1px 3px rgba(0,0,0,0.6)",
    }}
  >
    {recipe.description}
  </p>
)}
```

- [ ] **Step 2: Verify on the discover page that recipe cards with descriptions show 1–2 lines of body text below the title**

- [ ] **Step 3: Commit**
```bash
git add src/components/recipe-card.tsx
git commit -m "feat: show recipe description on recipe cards"
```

---

## Task 7: Add Grid/List/Gallery view toggle to discover

**Files:**
- Create: `src/components/ui/toggle-group.tsx`
- Modify: `src/app/(app)/discover/discover-client.tsx`

- [ ] **Step 1: Install dependencies**
```bash
cd C:/Users/lasse/Desktop/whatscooking
npm install react-aria-components class-variance-authority
```
Expected: packages added with no errors.

- [ ] **Step 2: Create `toggle-group.tsx`**

Create `src/components/ui/toggle-group.tsx` with this exact content:
```tsx
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
  composeRenderProps,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  [
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "data-[hovered]:bg-muted data-[hovered]:text-muted-foreground",
    "data-[selected]:bg-accent data-[selected]:text-accent-foreground",
    "data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2",
    "focus-visible:outline-none",
  ],
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent data-[hovered]:bg-accent data-[hovered]:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleProps
  extends AriaToggleButtonProps,
    VariantProps<typeof toggleVariants> {}

const Toggle = ({ className, variant, size, ...props }: ToggleProps) => (
  <AriaToggleButton
    className={composeRenderProps(className, (className) =>
      cn(
        "group-data-[orientation=vertical]/togglegroup:w-full",
        toggleVariants({ variant, size, className })
      )
    )}
    {...props}
  />
)

const ToggleButtonGroup = ({
  children,
  className,
  ...props
}: AriaToggleButtonGroupProps) => (
  <AriaToggleButtonGroup
    className={composeRenderProps(className, (className) =>
      cn(
        "group/togglegroup flex items-center justify-center gap-1 data-[orientation=vertical]:flex-col",
        className
      )
    )}
    {...props}
  >
    {children}
  </AriaToggleButtonGroup>
)

export { Toggle, toggleVariants, ToggleButtonGroup }
export type { ToggleProps }
```

- [ ] **Step 3: Add the view-mode toggle to `discover-client.tsx`**

In `src/app/(app)/discover/discover-client.tsx`:

**3a.** At the top, add imports:
```tsx
import { LayoutGrid, List, GalleryHorizontal } from "lucide-react";
import { Toggle, ToggleButtonGroup } from "@/components/ui/toggle-group";
```

**3b.** Near the top of the component function, add state (alongside existing state):
```tsx
const [viewMode, setViewMode] = React.useState<"grid" | "list" | "gallery">(() => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("wc-view-mode") as "grid" | "list" | "gallery") ?? "grid";
  }
  return "grid";
});

function handleViewMode(val: Set<React.Key>) {
  const next = [...val][0] as "grid" | "list" | "gallery";
  if (next) {
    setViewMode(next);
    localStorage.setItem("wc-view-mode", next);
  }
}
```

**3c.** Find the recipe grid div (around line 1097 — `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"`). Replace the entire `<ScrollReveal>` / grid wrapper with this:

```tsx
{/* View toggle — sits just above the grid */}
<div className="flex justify-end mb-3">
  <ToggleButtonGroup
    selectionMode="single"
    selectedKeys={new Set([viewMode])}
    onSelectionChange={handleViewMode}
    className="rounded-xl overflow-hidden border"
    style={{ borderColor: "var(--wc-surface-2, #3A3430)", background: "var(--wc-surface-1, #2C2724)" }}
  >
    <Toggle id="grid" size="sm" title="Grid view">
      <LayoutGrid className="w-4 h-4" />
    </Toggle>
    <Toggle id="list" size="sm" title="List view">
      <List className="w-4 h-4" />
    </Toggle>
    <Toggle id="gallery" size="sm" title="Gallery view">
      <GalleryHorizontal className="w-4 h-4" />
    </Toggle>
  </ToggleButtonGroup>
</div>

{/* Grid view */}
{viewMode === "grid" && (
  <ScrollReveal group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {visibleRecipes.map((recipe, i) => (
      <RecipeCard key={recipe.id} recipe={recipe} index={i} />
    ))}
  </ScrollReveal>
)}

{/* List view */}
{viewMode === "list" && (
  <div className="flex flex-col gap-3">
    {visibleRecipes.map((recipe) => (
      <div
        key={recipe.id}
        onClick={() => router.push(`/recipes/${recipe.id}`)}
        className="flex gap-4 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.005]"
        style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid var(--wc-surface-2, #3A3430)" }}
      >
        <div className="w-28 h-24 shrink-0 overflow-hidden">
          <img
            src={recipe.image_url ?? `https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=200&q=80`}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-1 py-3 pr-4">
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--fg-primary, #EFE3CE)" }}>{recipe.title}</p>
          {recipe.description && (
            <p className="text-xs line-clamp-2" style={{ color: "rgba(239,227,206,0.55)" }}>{recipe.description}</p>
          )}
          {((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)) > 0 && (
            <span className="text-xs" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
              {(recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)} min
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
)}

{/* Gallery view */}
{viewMode === "gallery" && (
  <div className="columns-2 gap-4 space-y-4">
    {visibleRecipes.map((recipe) => (
      <div
        key={recipe.id}
        onClick={() => router.push(`/recipes/${recipe.id}`)}
        className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer relative"
        style={{ border: "1px solid var(--wc-surface-2, #3A3430)" }}
      >
        <img
          src={recipe.image_url ?? `https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=600&q=80`}
          alt={recipe.title}
          className="w-full object-cover"
          style={{ maxHeight: "320px", minHeight: "140px" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
        >
          <p className="text-sm font-semibold leading-tight" style={{ color: "#fff" }}>{recipe.title}</p>
        </div>
      </div>
    ))}
  </div>
)}
```

**Note:** If `visibleRecipes` is not the variable name, use whatever the current grid loop uses (check the `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` loop for the variable name).

- [ ] **Step 4: Open http://localhost:3002/discover and verify the three toggle buttons appear top-right of the grid. Clicking each one switches the layout.**

- [ ] **Step 5: Commit**
```bash
git add src/components/ui/toggle-group.tsx "src/app/(app)/discover/discover-client.tsx"
git commit -m "feat: add Grid/List/Gallery view toggle to discover page"
```

---

## Task 8: Log changes to master_roadmap.md

**Files:**
- Modify: `src/.ai_context/master_roadmap.md` (path: `C:/Users/lasse/Desktop/whatscooking/.ai_context/master_roadmap.md`)

- [ ] **Step 1: Append a log entry**

Add to the "Log of Recent Manifest Changes" section at the bottom:
```markdown
* [2026-04-22] — Group A+B+C batch:
  - 🟢 **Fix: continentId server/client boundary** — extracted to `src/lib/continent-id.ts`
  - 🟢 **Fix: textarea hydration mismatch** — `suppressHydrationWarning` on comment textarea
  - 🟢 **Full-site palette switching** — all `[data-palette]` blocks now remap `--wc-floor`, `--wc-surface-*`, `--wc-accent-*` core tokens
  - 🟢 **Light mode darkened** — sidebar, inputs, buttons now use warmer darker values
  - 🟢 **Recipe hero image** — increased min-height so dietary tags are fully visible
  - 🟢 **Recipe card descriptions** — `recipe.description` shown below title with `line-clamp-2`
  - 🟢 **Discover view toggle** — Grid / List / Gallery; preference persisted in localStorage; new `toggle-group.tsx` component
```

- [ ] **Step 2: Commit**
```bash
git add .ai_context/master_roadmap.md
git commit -m "docs: log Group A+B+C changes to master_roadmap"
```
