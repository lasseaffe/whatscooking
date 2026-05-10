# Recipe Page Mobile Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile: reorder recipe page sections, make the cooking CTA sticky (center-bottom), compact the time-breakdown bar, allow free phase jumping, rename SOS Helper to "The Kitchen Oracle", and remove the redundant floating SOS button.

**Architecture:** Changes are split across three files: `page.tsx` (layout reorder + SOS removal), `cooking-mode-wrapper.tsx` (sticky CTA logic), and `recipe-columns-client.tsx` (phase navigation onClick + SOS rename). No new files needed.

**Tech Stack:** React, Next.js, Tailwind CSS, IntersectionObserver API

---

### Task 1: Reorder mobile layout in page.tsx

**Files:**
- Modify: `src/app/(app)/recipes/[id]/page.tsx:86-262`

The current layout on mobile (< lg) renders: title/meta left → image+CTA right (stacked). We need: image → title → description → metrics → servings control → time bar → dietary tags → ingredients → instructions.

The `ServingControl` is currently inside `recipe-columns-client.tsx` (ingredients panel). We move it to the header section on mobile only.

- [ ] **Step 1: Move servings control into the header section for mobile**

In `page.tsx`, pass `baseServings` as a prop to a new local component that renders the `ServingControl` at mobile only. The simplest approach: add a client component wrapper that reads a shared React context.

Actually — the serving state lives inside `RecipeColumnsClient`. The cleanest approach without refactoring is to render a **duplicate** servings display in mobile view, and hide it on desktop. Both read from the same URL state via `useSearchParams` or context.

Since `RecipeColumnsClient` already manages its own serving state internally, the mobile-only serving control above ingredients is best handled **inside** `RecipeColumnsClient` — display it before ingredients on mobile, hide it in the ingredient column header on mobile.

Open `src/app/(app)/recipes/[id]/recipe-columns-client.tsx` and find where `ServingControl` is rendered in the ingredients panel. Add `className="hidden lg:flex"` to the existing ingredient-panel serving control, and add a duplicate above the ingredients list with `className="flex lg:hidden"`:

```tsx
{/* Mobile-only serving control — above ingredients */}
<div className="flex lg:hidden items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "rgba(42,24,8,0.3)" }}>
  <span className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>Servings</span>
  <ServingControl base={baseServings ?? 2} current={servings} onChange={setServings} />
  <UnitToggle value={unitSystem} onChange={setUnitSystem} />
</div>
```

And on the existing ingredient-panel serving control, add `className="hidden lg:flex"` to its wrapper so it only shows on desktop.

- [ ] **Step 2: Reorder page.tsx for mobile**

In `page.tsx`, the image and CTA are in the right column (rendered second in DOM order). On mobile this means they appear below the title. We want the image first on mobile.

Change `page.tsx` lines 100-218 to use `flex-col-reverse lg:flex-row` so on mobile, the image panel appears first:

```tsx
<div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12 items-start">
  {/* ── Left: title + metadata ── */}
  <div className="flex-1 flex flex-col gap-4 lg:py-2">
    {/* ... existing content ... */}
  </div>

  {/* ── Right: image + CTA (shown first on mobile via flex-col-reverse) ── */}
  <div className="w-full lg:w-[42%] shrink-0 flex flex-col gap-4" style={{ maxWidth: 520 }}>
    {/* ... existing image + CTA ... */}
  </div>
</div>
```

Note: `flex-col-reverse` puts the second child (image) visually first on mobile while keeping the DOM order for SEO (title first in DOM).

- [ ] **Step 3: Remove the floating SOSCookingHelper from page.tsx**

At line 258 in `page.tsx`, delete:
```tsx
{/* SOS helper */}
<SOSCookingHelper recipeTitle={displayTitle} ingredients={ingredients} />
```

Also remove the import at line 10:
```tsx
import { SOSCookingHelper } from "@/components/sos-cooking-helper";
```

- [ ] **Step 4: TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep "recipes/\[id\]" | head -20
```
Expected: no errors.

---

### Task 2: Sticky center-bottom cooking CTA on mobile

**Files:**
- Modify: `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx`

- [ ] **Step 5: Convert CookingModeCTA to a sticky mobile element**

Replace the `CookingModeCTA` function in `cooking-mode-wrapper.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { ChefHat } from "lucide-react";
import { CookingModeProvider, useCookingMode } from "@/lib/cooking-mode-context";
import { CookingModeScreen } from "./cooking-mode-screen";

// ... (keep existing CookingModeWrapper and CookingModeWrapperInner unchanged)

// Standalone CTA — must be rendered inside a CookingModeWrapper (shared context).
export function CookingModeCTA({ commentsRef }: { commentsRef?: React.RefObject<HTMLElement | null> }) {
  const { activate } = useCookingMode();
  const [isSticky, setIsSticky] = useState(true);

  useEffect(() => {
    const sentinel = document.getElementById("cta-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const btn = (
    <button
      type="button"
      onClick={activate}
      aria-label="Enter Cooking Mode"
      className="flex items-center justify-center gap-3 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
      style={{
        padding: "1rem 1.5rem",
        background: "linear-gradient(135deg, rgba(200,82,42,0.18) 0%, rgba(176,125,86,0.12) 100%)",
        border: "1.5px solid var(--wc-pal-accent, #B07D56)",
        color: "var(--wc-pal-accent, #B07D56)",
        fontSize: "1rem",
      }}
    >
      <ChefHat style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span>Start Cooking Mode</span>
      <span className="text-xs font-normal opacity-60 hidden sm:inline" style={{ marginLeft: 4 }}>
        — keeps screen on
      </span>
    </button>
  );

  return (
    <>
      {/* Desktop: static below image */}
      <div className="hidden lg:block w-full">{btn}</div>

      {/* Mobile: sticky center-bottom when above comments */}
      <div className={`lg:hidden ${isSticky ? "fixed bottom-4 left-1/2 -translate-x-1/2 z-40" : "relative mt-4"}`}>
        {btn}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Add the sentinel div in page.tsx above the comments section**

In `page.tsx`, find the `<RecipeInteractions>` block (around line 239). Just before it, add:
```tsx
{/* Sentinel for sticky CTA — when this enters viewport, CTA unsticks */}
<div id="cta-sentinel" />
```

- [ ] **Step 7: Verify sticky behavior on mobile**

In Chrome DevTools at 390px width, scroll down a recipe page. Confirm:
- CTA appears fixed at bottom center while scrolling through ingredients/instructions
- CTA transitions to normal flow when reaching the comments section

---

### Task 3: Compact time-breakdown bar on mobile

**Files:**
- Modify: `src/components/time-breakdown-bar.tsx`

- [ ] **Step 8: Add a compact mobile variant to TimeBreakdownBar**

In `time-breakdown-bar.tsx`, the component renders a segmented bar with labels. Add a responsive mobile variant using a horizontal pill row.

At the top of the component's return JSX, add a mobile-only render using `sm:hidden`:

```tsx
return (
  <>
    {/* Mobile: compact pill row */}
    <div className="flex flex-wrap gap-1.5 sm:hidden">
      {segments.map((seg, i) => (
        <button
          key={i}
          onClick={() => seg.stepIndex != null && scrollToStep(seg.stepIndex)}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{ background: seg.color + "22", color: seg.color, border: `1px solid ${seg.color}44` }}
        >
          <span>{seg.emoji}</span>
          <span>{seg.minutes}m</span>
        </button>
      ))}
    </div>

    {/* Desktop: full segmented bar (existing render) */}
    <div className="hidden sm:block">
      {/* ... existing JSX ... */}
    </div>
  </>
);
```

Note: The exact shape of `segments` depends on the current component implementation. Read the component to understand the data structure before writing this step. The key is: each segment has an emoji, duration in minutes, color, and optional step index for scrolling.

- [ ] **Step 9: Verify compact bar renders on mobile**

At 390px width, the recipe page should show emoji pills (e.g. 🔪 15m, 🍳 20m) instead of the wide segmented bar. Desktop unchanged.

---

### Task 4: Free phase navigation in recipe-columns-client.tsx

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-columns-client.tsx:44-84`

The `PhaseStepper` component renders phase pills but has no `onClick`. Add click handlers.

- [ ] **Step 10: Add setPhase prop to PhaseStepper and wire onClick**

The `PhaseStepper` function (lines 44-84) needs access to `setPhase`. Add it as a prop:

```tsx
function PhaseStepper({
  phase,
  cookingDone,
  onPhaseClick,
}: {
  phase: Phase;
  cookingDone: boolean;
  onPhaseClick: (p: Phase) => void;
}) {
```

Inside the map, wrap the pill div in a button:
```tsx
<button
  key={step.key}
  onClick={() => step.key !== "done" && onPhaseClick(step.key as Phase)}
  className="flex items-center gap-1 flex-1 last:flex-none cursor-pointer"
  style={{ background: "none", border: "none", padding: 0 }}
>
  <div className="flex items-center gap-1.5">
    {/* existing pill div unchanged */}
  </div>
  {i < PHASE_STEPS.length - 1 && (
    <div className="flex-1 h-px mx-1" style={{ background: isDone ? "rgba(130,142,111,0.3)" : "rgba(42,24,8,0.4)" }} />
  )}
</button>
```

- [ ] **Step 11: Pass onPhaseClick from the parent to PhaseStepper**

Find where `<PhaseStepper>` is rendered in the main `RecipeColumnsClient` return. Add the `onPhaseClick` prop:
```tsx
<PhaseStepper
  phase={phase}
  cookingDone={cookingDone}
  onPhaseClick={(p) => setPhase(p)}
/>
```

Where `setPhase` is the existing `useState` setter for the current phase.

---

### Task 5: Rename SOS Helper to "The Kitchen Oracle"

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-columns-client.tsx`
- Modify: `src/components/sos-cooking-helper.tsx` (display text only)

- [ ] **Step 12: Rename display text in sos-cooking-helper.tsx**

In `src/components/sos-cooking-helper.tsx`, find all user-visible strings containing "SOS" or "SOS Helper". Replace:
- "SOS Helper" → "The Kitchen Oracle"
- "SOS" (in button labels, modal titles) → "Oracle"

Do NOT rename the file or the component export — only the display strings.

- [ ] **Step 13: Add hover tooltip to the inline SOS trigger in recipe-columns-client.tsx**

The inline per-step SOS button (around lines 805-934) currently has no title/tooltip. Find the button element and add:
```tsx
title="Ask The Kitchen Oracle for help with this step"
```

- [ ] **Step 14: Final TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 15: Commit**

```bash
git add src/app/(app)/recipes/[id]/page.tsx src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx src/app/(app)/recipes/[id]/recipe-columns-client.tsx src/components/time-breakdown-bar.tsx src/components/sos-cooking-helper.tsx
git commit -m "feat: recipe page mobile improvements — sticky CTA, compact time bar, free phase nav, Kitchen Oracle rename"
```
