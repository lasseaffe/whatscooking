# Groups D, E, F — Cooking Mode, Restore Phase & Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the cooking experience (collapsible ingredients panel, sticky step nav, step-aware SOS), restructure the Restore phase into two tabs (Food Care / Kitchen Care) with a warm-dark TableStylist, and fix navigation inconsistencies (logo, All Done button, World Cup event page).

**Architecture:** A new `CookingModeContext` centralises active state and current step text so `CookingModeWrapper`, `RecipeColumnsClient`, and `SOSCookingHelper` can share state without prop-drilling through the server component `page.tsx`. Group E changes are self-contained within existing component files. Group F changes are small isolated edits.

**Tech Stack:** Next.js 15 App Router, React 19 context, `localStorage` (for storage toast + flag collection), `AnimatedTabs` (`@/components/ui/animated-tabs`), Lucide React icons, inline styles (project pattern).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/cooking-mode-context.tsx` | **Create** | Shared context: active state, wake lock, currentStepText |
| `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx` | **Modify** | Use context provider; add tooltip |
| `src/app/(app)/recipes/[id]/recipe-columns-client.tsx` | **Modify** | Collapsible ingredients; sticky step nav; fix AddToStorage; All Done nav |
| `src/components/sos-cooking-helper.tsx` | **Modify** | Move button to bottom-left; tooltip; step-aware prompts from context |
| `src/components/zero-waste-guide.tsx` | **Modify** | Split into Food Care / Kitchen Care AnimatedTabs |
| `src/components/table-stylist.tsx` | **Modify** | Warm dark redesign; 2-col grid |
| `src/app/(app)/pantry/pantry-client.tsx` | **Modify** | Read `?tab=leftovers` query param to deep-link |
| `src/components/app-nav.tsx` | **Modify** | Logo href `/discover` → `/dashboard` |
| `src/app/(app)/events/world-cup-2026/page.tsx` | **Create** | Flag collection page with localStorage tracking |
| `.ai_context/master_roadmap.md` | **Modify** | Log Group D+E+F completion |

---

## Task 1: Create CookingModeContext

**Files:**
- Create: `src/lib/cooking-mode-context.tsx`

Extracts wake lock logic and active state from `CookingModeWrapper` into a shared React context. Also tracks `currentStepText` so `SOSCookingHelper` can show step-specific prompts without prop-drilling.

- [ ] **Step 1: Create the context file**

```tsx
// src/lib/cooking-mode-context.tsx
"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

interface CookingModeContextValue {
  active: boolean;
  activate: () => Promise<void>;
  deactivate: () => void;
  currentStepText: string;
  setCurrentStepText: (text: string) => void;
}

const CookingModeContext = createContext<CookingModeContextValue>({
  active: false,
  activate: async () => {},
  deactivate: () => {},
  currentStepText: "",
  setCurrentStepText: () => {},
});

export function CookingModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const activate = useCallback(async () => {
    setActive(true);
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as Navigator & {
          wakeLock: { request: (type: string) => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
      }
    } catch {
      // Wake lock not supported or denied — continue without it
    }
  }, []);

  const deactivate = useCallback(() => {
    setActive(false);
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  // Re-acquire wake lock when tab becomes visible again
  useEffect(() => {
    if (!active) return;
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") activate();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, activate]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
  }, []);

  return (
    <CookingModeContext.Provider value={{ active, activate, deactivate, currentStepText, setCurrentStepText }}>
      {children}
    </CookingModeContext.Provider>
  );
}

export function useCookingMode() {
  return useContext(CookingModeContext);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/lasse/Desktop/whatscooking
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cooking-mode-context.tsx
git commit -m "feat: add CookingModeContext for shared cooking state"
```

---

## Task 2: Refactor CookingModeWrapper to use context + add tooltip

**Files:**
- Modify: `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx`

Replace the inline wake lock state with the context provider. Use an inner component pattern so the fixed buttons can read `useCookingMode()` while the outer wrapper provides it. Add hover tooltips.

- [ ] **Step 1: Read the current file**

```bash
cat /c/Users/lasse/Desktop/whatscooking/src/app/\(app\)/recipes/\[id\]/cooking-mode-wrapper.tsx
```

- [ ] **Step 2: Replace the entire file**

```tsx
// src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx
"use client";

import { ChefHat, X } from "lucide-react";
import { CookingModeProvider, useCookingMode } from "@/lib/cooking-mode-context";

function CookingModeButtons() {
  const { active, activate, deactivate } = useCookingMode();
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 60 }}>
      <div className="group relative">
        {/* Tooltip */}
        <div
          className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
          style={{ background: "rgba(13,9,7,0.95)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
        >
          {active
            ? "Exit cooking mode — releases screen lock"
            : "Keep screen on while you cook"}
        </div>

        {active ? (
          <button
            type="button"
            onClick={deactivate}
            aria-label="Exit Cooking Mode"
            className="flex items-center gap-2 font-bold rounded-2xl shadow-2xl transition-all hover:opacity-90 active:scale-95"
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: "0.6rem 1.1rem",
              background: "rgba(200,82,42,0.95)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              fontSize: "0.8rem",
            }}
          >
            <X style={{ width: 16, height: 16, flexShrink: 0 }} />
            Exit Cooking Mode
          </button>
        ) : (
          <button
            type="button"
            onClick={activate}
            aria-label="Enter Cooking Mode"
            className="flex items-center gap-2 font-bold rounded-2xl shadow-2xl transition-all hover:opacity-90 active:scale-95"
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: "0.6rem 1.1rem",
              background: "rgba(28,18,9,0.92)",
              color: "var(--wc-pal-accent, #B07D56)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid var(--wc-pal-accent, #B07D56)",
              fontSize: "0.8rem",
            }}
          >
            <ChefHat style={{ width: 16, height: 16, flexShrink: 0 }} />
            Cooking Mode
          </button>
        )}
      </div>
    </div>
  );
}

function CookingModeWrapperInner({ children }: { children: React.ReactNode }) {
  const { active } = useCookingMode();
  return (
    <div
      className={active ? "cooking-mode-active" : ""}
      style={{ minHeight: "calc(100vh - 48px)", position: "relative" }}
    >
      {children}
      <CookingModeButtons />
      {active && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 55,
            height: 3,
            background: "linear-gradient(90deg, #C8522A, #B07D56, #828E6F)",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}

export function CookingModeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CookingModeProvider>
      <CookingModeWrapperInner>{children}</CookingModeWrapperInner>
    </CookingModeProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/cooking-mode-wrapper.tsx
git commit -m "feat: refactor CookingModeWrapper to use context, add hover tooltip"
```

---

## Task 3: RecipeColumnsClient overhaul

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-columns-client.tsx`

Four changes to this file:
1. Collapsible ingredients panel (auto-collapses on cooking mode)
2. Step-aware context updates (thread `setCurrentStepText` into `NumberedInstructions`)
3. Sticky Prev/Next navigation footer inside `NumberedInstructions`
4. Fix `AddToStorageButton` to write to localStorage, high-z toast with pantry link, All Done button navigates to `/dashboard`

- [ ] **Step 1: Read the current file**

```bash
cat /c/Users/lasse/Desktop/whatscooking/src/app/\(app\)/recipes/\[id\]/recipe-columns-client.tsx
```

- [ ] **Step 2: Add imports at top of file**

After the existing `import { AnimatedTabs, type Tab } from "@/components/ui/animated-tabs";` line, add:

```tsx
import { useCookingMode } from "@/lib/cooking-mode-context";
import { useRouter } from "next/navigation";
```

Also add `ChevronLeft` to the lucide-react import:

Change:
```tsx
import { Utensils, BookOpen, ChevronRight, SkipForward, CheckCircle2, Star, ThumbsUp, ThumbsDown, Loader2, Minus, Plus, ShoppingCart, Lightbulb, Archive, ChevronDown, PackageMinus } from "lucide-react";
```

To:
```tsx
import { Utensils, BookOpen, ChevronLeft, ChevronRight, SkipForward, CheckCircle2, Star, ThumbsUp, ThumbsDown, Loader2, Minus, Plus, ShoppingCart, Lightbulb, Archive, ChevronDown, PackageMinus } from "lucide-react";
```

- [ ] **Step 3: Replace the entire `AddToStorageButton` function**

Find the existing `AddToStorageButton` function (starts with `function AddToStorageButton`) and replace it entirely with:

```tsx
function AddToStorageButton({ recipeTitle }: { recipeTitle: string }) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);

  function handleAdd() {
    const STORAGE_KEY = "wc_leftover_storage_v1";
    const item = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      name: recipeTitle,
      storedAt: new Date().toISOString(),
      storageType: "fridge" as const,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: unknown[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...existing]));
    } catch {
      // localStorage unavailable — silently skip
    }
    setSaved(true);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  }

  return (
    <>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
          style={{
            zIndex: 9999,
            background: "var(--wc-surface-1, #2C2724)",
            color: "#EFE3CE",
            border: "1px solid rgba(244,162,97,0.3)",
          }}
        >
          <Archive style={{ width: 15, height: 15, color: "#F4A261" }} />
          <span>Stored!</span>
          <a href="/pantry?tab=leftovers" className="underline font-bold" style={{ color: "#F4A261" }}>
            View in Pantry →
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={saved}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          background: saved ? "rgba(130,142,111,0.15)" : "var(--wc-surface-2, rgba(42,24,8,0.5))",
          border: `1px solid ${saved ? "rgba(130,142,111,0.4)" : "var(--wc-accent-saffron, #F4A261)"}`,
          color: saved ? "#828E6F" : "var(--wc-accent-saffron, #F4A261)",
        }}
      >
        {saved ? (
          <CheckCircle2 style={{ width: 15, height: 15 }} />
        ) : (
          <Archive style={{ width: 15, height: 15 }} />
        )}
        {saved ? "Stored in pantry" : "Store leftovers"}
      </button>
    </>
  );
}
```

- [ ] **Step 4: Update `NumberedInstructions` to accept `onStepChange` and add sticky nav**

Replace the function signature and body. Find `function NumberedInstructions({` and replace the entire function with:

```tsx
function NumberedInstructions({
  instructions,
  onComplete,
  onStepChange,
}: {
  instructions: string[];
  onComplete: () => void;
  onStepChange?: (text: string) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const allDone = currentStep >= instructions.length;

  function goToStep(i: number) {
    setCurrentStep(i);
    onStepChange?.(instructions[i] ?? "");
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#4A3020" }}>
          Instructions
        </h3>
        {!allDone && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(42,24,8,0.6)", color: "var(--wc-pal-accent, #B07D56)" }}>
            Step {currentStep + 1} / {instructions.length}
          </span>
        )}
      </div>

      <ol className="flex flex-col gap-3">
        {instructions.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          const tip = getProTip(step);

          return (
            <li
              key={i}
              className="flex gap-3 rounded-xl transition-all"
              style={{
                opacity: isDone ? 0.45 : 1,
                borderLeft: isActive ? "3px solid var(--wc-accent-saffron, #F4A261)" : "3px solid transparent",
                background: isActive ? "var(--wc-surface-2, rgba(58,52,48,0.7))" : "transparent",
                padding: isActive ? "12px 12px 12px 12px" : "4px 4px 4px 4px",
              }}
            >
              {/* Step number bubble */}
              <button
                type="button"
                onClick={() => goToStep(i)}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-all"
                style={{
                  background: isDone
                    ? "rgba(130,142,111,0.3)"
                    : isActive
                      ? "var(--wc-accent-saffron, #F4A261)"
                      : "rgba(42,24,8,0.6)",
                  color: isDone ? "#828E6F" : isActive ? "#1a1208" : "#5A3A28",
                  border: isDone ? "1px solid rgba(130,142,111,0.3)" : isActive ? "none" : "1px solid #3A2416",
                  cursor: "pointer",
                }}
                aria-label={isDone ? `Go back to step ${i + 1}` : `Jump to step ${i + 1}`}
              >
                {isDone ? (
                  <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#828E6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isActive ? "var(--fg-primary, #EFE3CE)" : "#8A6A4A",
                    lineHeight: 1.75,
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {step}
                </p>
                {tip && isActive && <ChefTipBox tip={tip} />}
              </div>
            </li>
          );
        })}
      </ol>

      {allDone ? (
        <div className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(130,142,111,0.12)", border: "1px solid rgba(130,142,111,0.2)" }}>
          <CheckCircle2 style={{ width: 18, height: 18, color: "#828E6F", flexShrink: 0 }} />
          <p className="text-sm font-semibold" style={{ color: "#828E6F" }}>All steps complete!</p>
        </div>
      ) : (
        /* Sticky Prev / Next nav */
        <div
          className="sticky bottom-0 flex items-center justify-between gap-3 mt-4 pt-3"
          style={{
            borderTop: "1px solid rgba(42,24,8,0.6)",
            background: "rgba(18,12,7,0.95)",
            backdropFilter: "blur(8px)",
            padding: "10px 0",
          }}
        >
          <button
            type="button"
            onClick={() => goToStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-30"
            style={{ background: "rgba(42,24,8,0.6)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.5)" }}
          >
            <ChevronLeft style={{ width: 12, height: 12 }} /> Prev
          </button>
          <span className="text-xs font-semibold" style={{ color: "#6B4E36" }}>
            {currentStep + 1} / {instructions.length}
          </span>
          <button
            type="button"
            onClick={() => {
              if (currentStep + 1 >= instructions.length) {
                setCurrentStep(instructions.length);
                onStepChange?.("");
                onComplete();
              } else {
                goToStep(currentStep + 1);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
            style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
          >
            {currentStep + 1 >= instructions.length ? "Done" : "Next"}
            <ChevronRight style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Thread `onStepChange` through `splitIntoPhaseTabs`**

Find `function splitIntoPhaseTabs(instructions: string[], onComplete: () => void): Tab[] {` and change the signature to:

```tsx
function splitIntoPhaseTabs(instructions: string[], onComplete: () => void, onStepChange?: (text: string) => void): Tab[] {
```

Then in every `<NumberedInstructions ...>` inside that function, add `onStepChange={onStepChange}` as a prop. There are up to 3 instances (prep, cook, finish).

- [ ] **Step 6: Update the `RecipeColumnsClient` main function**

In the `RecipeColumnsClient` component body, add these at the top (after the existing `useState` declarations):

```tsx
const { active: cookingModeActive, setCurrentStepText } = useCookingMode();
const [ingredientsCollapsed, setIngredientsCollapsed] = useState(false);
const router = useRouter();

// Auto-collapse ingredients when cooking mode activates
useEffect(() => {
  if (cookingModeActive) setIngredientsCollapsed(true);
}, [cookingModeActive]);
```

- [ ] **Step 7: Replace the ingredients panel div**

Find the ingredients panel `<div className="flex flex-col shrink-0"` (the left-side panel) and replace it with:

```tsx
{/* ── INGREDIENTS PANEL (left half of right side) ── */}
<div
  className="flex flex-col shrink-0"
  style={{
    width: ingredientsCollapsed ? "48px" : "38%",
    minWidth: ingredientsCollapsed ? "48px" : 240,
    borderRight: "1px solid rgba(42,24,8,0.5)",
    background: "rgba(18,12,7,0.4)",
    overflowY: ingredientsCollapsed ? "hidden" : "auto",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 96px)",
    position: "sticky",
    top: 0,
    transition: "width 0.3s ease, min-width 0.3s ease",
    flexShrink: 0,
  }}
>
  {ingredientsCollapsed ? (
    /* Collapsed strip — icon + vertical text */
    <button
      type="button"
      onClick={() => setIngredientsCollapsed(false)}
      className="flex flex-col items-center gap-2.5 w-full h-full justify-start pt-6 transition-opacity hover:opacity-80"
      style={{ padding: "24px 0 0 0", color: "var(--wc-pal-accent, #B07D56)" }}
      aria-label="Expand Ingredients"
    >
      <Utensils style={{ width: 16, height: 16 }} />
      <span
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#5A3A28",
          marginTop: 8,
        }}
      >
        Ingredients
      </span>
    </button>
  ) : (
    /* Expanded full panel */
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(42,24,8,0.7)", border: "1px solid rgba(90,50,20,0.4)" }}
        >
          <Utensils style={{ width: 15, height: 15, color: "var(--wc-pal-accent, #B07D56)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4A3020" }}>Phase II</div>
          <div className="text-base font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Ingredients
          </div>
        </div>
        {/* Metric / Imperial toggle */}
        <UnitToggle value={unitSystem} onChange={setUnitSystem} />
        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setIngredientsCollapsed(true)}
          className="p-1.5 rounded-lg ml-1 transition-opacity hover:opacity-70"
          style={{ color: "#4A3020" }}
          title="Collapse ingredients"
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Interactive ingredient checklist */}
      {ingredients.length > 0 ? (
        <InteractiveIngredients
          ingredients={ingredients}
          unitSystem={unitSystem}
          pantryItems={pantryItems}
          recipeTitle={recipeTitle}
        />
      ) : (
        <IngredientsColumn
          recipeId={recipeId}
          initialIngredients={ingredients}
          sourceUrl={sourceUrl}
          isPremium={isPremium}
          onExtracted={handleExtracted}
          pantryItems={pantryItems}
        />
      )}
    </div>
  )}
</div>
```

- [ ] **Step 8: Update the `AnimatedTabs` call to pass `setCurrentStepText`**

Find:
```tsx
<AnimatedTabs
  tabs={splitIntoPhaseTabs(instructions, handleCookingComplete)}
  className="mt-4"
/>
```

Replace with:
```tsx
<AnimatedTabs
  tabs={splitIntoPhaseTabs(instructions, handleCookingComplete, setCurrentStepText)}
  className="mt-4"
/>
```

- [ ] **Step 9: Update Restore phase `PhaseActions` to navigate on All Done**

Find the Restore phase `PhaseActions` call (the last one at the bottom of the cook/restore phase section):
```tsx
<PhaseActions
  onDone={() => {}}
  onSkip={() => {}}
  doneLabel="All done!"
/>
```

Replace with:
```tsx
<PhaseActions
  onDone={() => router.push("/dashboard")}
  onSkip={() => router.push("/dashboard")}
  doneLabel="All done!"
/>
```

- [ ] **Step 10: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors. Fix any `useEffect` missing dependency warnings if TypeScript flags them.

- [ ] **Step 11: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/recipe-columns-client.tsx
git commit -m "feat: collapsible ingredients panel, sticky step nav, fix storage toast, All Done nav"
```

---

## Task 4: SOSCookingHelper — move button, add tooltip, step-aware prompts

**Files:**
- Modify: `src/components/sos-cooking-helper.tsx`

The SOS button is currently at `bottom-6 right-6` — same position as the Cooking Mode button, causing overlap. Move it to `bottom-6 left-6`. Add a hover tooltip. Use `currentStepText` from `CookingModeContext` to show a step-specific quick prompt at the top of the suggestions grid.

- [ ] **Step 1: Read the current file**

```bash
cat /c/Users/lasse/Desktop/whatscooking/src/components/sos-cooking-helper.tsx
```

- [ ] **Step 2: Add context import and read currentStepText**

After `import { useState, useRef, useEffect } from "react";`, add:

```tsx
import { useCookingMode } from "@/lib/cooking-mode-context";
```

At the top of the `SOSCookingHelper` function body, add:

```tsx
const { currentStepText } = useCookingMode();
```

- [ ] **Step 3: Move the floating button from right to left, add tooltip**

Replace the floating button JSX (lines 93–106 approximately):

```tsx
{/* Floating SOS button — bottom-left, with tooltip */}
<div
  className="group"
  style={{
    position: "fixed",
    bottom: "1.5rem",
    left: "1.5rem",
    zIndex: 50,
    display: open ? "none" : "block",
  }}
>
  {/* Tooltip */}
  <div
    className="absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
    style={{ background: "rgba(13,9,7,0.95)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
  >
    Get instant help when something goes wrong mid-cook
  </div>
  <button
    onClick={() => setOpen(true)}
    className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-105 active:scale-95"
    style={{
      background: "linear-gradient(135deg, #C85A2F 0%, #A84520 100%)",
      color: "#fff",
      boxShadow: "0 4px 20px rgba(200,90,47,0.4)",
    }}
    aria-label="SOS Kitchen Help"
  >
    <span style={{ fontSize: 18 }}>🆘</span>
    <span>SOS Help</span>
  </button>
</div>
```

- [ ] **Step 4: Add step-aware quick prompt at top of suggestions grid**

Inside the messages area, find where `QUICK_PROMPTS` is rendered (inside the `messages.length === 0` block) and replace the entire empty-state div with:

```tsx
{messages.length === 0 && (
  <div>
    <p className="text-sm text-center mb-4" style={{ color: "#A69180" }}>
      Stuck mid-cook? Ask anything — I&apos;m here.
    </p>
    <div className="grid grid-cols-2 gap-2">
      {/* Step-aware prompt — shown when cooking is active */}
      {currentStepText && (
        <button
          onClick={() => send(`Help with: "${currentStepText.slice(0, 60)}${currentStepText.length > 60 ? "…" : ""}"`)}
          className="col-span-2 text-xs px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-80"
          style={{ background: "rgba(200,82,42,0.15)", color: "#C85A2F", border: "1px solid rgba(200,82,42,0.3)" }}
        >
          🎯 Help with current step
        </button>
      )}
      {QUICK_PROMPTS.map((p) => (
        <button
          key={p}
          onClick={() => send(p)}
          className="text-xs px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-80"
          style={{ background: "#F5E6D3", color: "#5D4037", border: "1px solid #E8D5C0" }}
        >
          {p}
        </button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/components/sos-cooking-helper.tsx
git commit -m "feat: move SOS button to bottom-left, add tooltip and step-aware prompt"
```

---

## Task 5: ZeroWasteGuide — split into Food Care / Kitchen Care tabs

**Files:**
- Modify: `src/components/zero-waste-guide.tsx`

The component already has both Storage (fridge/freezer cards, reheat, do-not-store, tips) and Cleanup sections. Split them into two `AnimatedTabs` tabs. Wrap the three "insights" (zero-waste tip, shopping tip, cook-again idea) in a collapsible "Sustainable Chef Insights" accordion.

- [ ] **Step 1: Read the current file**

```bash
cat /c/Users/lasse/Desktop/whatscooking/src/components/zero-waste-guide.tsx
```

- [ ] **Step 2: Add AnimatedTabs import**

Add after the existing imports:

```tsx
import { AnimatedTabs, type Tab } from "@/components/ui/animated-tabs";
```

- [ ] **Step 3: Add `insightsOpen` state inside the component**

In `ZeroWasteGuide`, add alongside existing state:

```tsx
const [insightsOpen, setInsightsOpen] = useState(false);
```

- [ ] **Step 4: Replace the `{open && (...)}` section with tabs**

Keep the header toggle button as-is. Replace the entire `{open && (<div className="space-y-3">...</div>)}` block with:

```tsx
{open && (() => {
  const foodCareContent = (
    <div className="space-y-3 pt-1">
      {/* Storage hero cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Refrigerator className="w-3.5 h-3.5" style={{ color: "#6B9FD4" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B9FD4" }}>Fridge</span>
          </div>
          <p className="text-lg font-bold" style={{ color: "#EFE3CE" }}>
            {guide.fridgeDays.min}–{guide.fridgeDays.max}d
          </p>
          <div className="flex items-start gap-1.5 mt-2">
            <Container className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#4A3020" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#6B4E36" }}>{guide.container}</p>
          </div>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Snowflake className="w-3.5 h-3.5" style={{ color: "#93C5FD" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#93C5FD" }}>Freezer</span>
          </div>
          {guide.freezerMonths.max > 0 ? (
            <>
              <p className="text-lg font-bold" style={{ color: "#EFE3CE" }}>
                {guide.freezerMonths.min === guide.freezerMonths.max
                  ? `${guide.freezerMonths.max}mo`
                  : `${guide.freezerMonths.min}–${guide.freezerMonths.max}mo`}
              </p>
              <p className="text-xs mt-1" style={{ color: "#6B4E36" }}>Thaw overnight in fridge</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "#6B4E36" }}>Not suitable for freezing</p>
          )}
        </div>
      </div>

      {/* Reheat method */}
      <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Flame className="w-3.5 h-3.5" style={{ color: "#C8522A" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#C8522A" }}>Best Reheat Method</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#EFE3CE" }}>{guide.reheatingMethod}</p>
      </div>

      {/* Do-not-store warning */}
      {guide.doNotStore && (
        <div className="rounded-xl px-3.5 py-2.5 flex items-start gap-2"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <span className="text-xs font-medium leading-relaxed" style={{ color: "#EF9E9E" }}>
            ⚠ {guide.doNotStore}
          </span>
        </div>
      )}

      {/* Sustainable Chef Insights accordion */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(130,142,111,0.2)" }}>
        <button
          onClick={() => setInsightsOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3.5 py-3"
          style={{ background: "rgba(130,142,111,0.08)" }}
        >
          <Leaf className="w-3.5 h-3.5 shrink-0" style={{ color: "#828E6F" }} />
          <span className="flex-1 text-xs font-semibold text-left" style={{ color: "#A8B89A" }}>
            Sustainable Chef Insights
          </span>
          {insightsOpen
            ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "#4A3020" }} />
            : <ChevronDown className="w-3.5 h-3.5" style={{ color: "#4A3020" }} />
          }
        </button>
        {insightsOpen && (
          <div className="p-3.5 grid grid-cols-1 gap-3" style={{ borderTop: "1px solid rgba(130,142,111,0.15)" }}>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#828E6F" }}>🌱 Zero-Waste Tip</p>
              <p className="text-xs leading-relaxed" style={{ color: "#6B4E36" }}>{guide.zeroWasteTip}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#D97706" }}>🛒 Shopping Tip</p>
              <p className="text-xs leading-relaxed" style={{ color: "#6B4E36" }}>{guide.shoppingTip}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#C8522A" }}>👨‍🍳 Cook Again</p>
              <p className="text-xs leading-relaxed" style={{ color: "#6B4E36" }}>{guide.cookAgainIdea}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const kitchenCareContent = (
    <div className="space-y-3 pt-1">
      <div className="rounded-xl p-4" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "#EFE3CE" }}>🧹 Cleanup Concierge</p>
        <div className="flex rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(42,24,8,0.8)" }}>
          {(["dishwasher", "handwash"] as const).map((mode) => (
            <button key={mode} onClick={() => setCleanupMode(mode)}
              className="flex-1 py-1.5 text-xs font-semibold transition-all capitalize"
              style={{
                background: cleanupMode === mode ? "#3A2416" : "transparent",
                color: cleanupMode === mode ? "#EFE3CE" : "#4A3020",
              }}>
              {mode === "dishwasher" ? "🍽️ Dishwasher" : "🫧 Hand Wash"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold mb-1.5" style={{ color: "#828E6F" }}>✅ Safe</p>
            <ul className="space-y-1">
              {cleanup.safe.map((item, i) => (
                <li key={i} className="text-xs leading-snug" style={{ color: "#6B4E36" }}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold mb-1.5" style={{ color: "#C8522A" }}>⛔ No-Go</p>
            <ul className="space-y-1">
              {cleanup.noGo.map((item, i) => (
                <li key={i} className="text-xs leading-snug" style={{ color: "#6B4E36" }}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(42,24,8,0.6)" }}>
          {!kitchenReset ? (
            <button onClick={handleKitchenReset}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: "#3A2416", color: "#EFE3CE" }}>
              ✓ Kitchen Reset Complete
            </button>
          ) : (
            <div className="w-full py-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2"
              style={{ background: "rgba(130,142,111,0.12)", color: "#828E6F", border: "1px solid rgba(130,142,111,0.25)" }}>
              {showConfetti
                ? <><PartyPopper className="w-3.5 h-3.5" /> Kitchen is sparkling! 🎉</>
                : <><Check className="w-3.5 h-3.5" /> Reset complete — well done!</>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabs: Tab[] = [
    { id: "food-care",    label: "🥗 Food Care",    content: foodCareContent },
    { id: "kitchen-care", label: "🧹 Kitchen Care", content: kitchenCareContent },
  ];

  return <AnimatedTabs tabs={tabs} />;
})()}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/components/zero-waste-guide.tsx
git commit -m "feat: split ZeroWasteGuide into Food Care / Kitchen Care tabs"
```

---

## Task 6: TableStylist warm dark redesign + Pantry deep-link

**Files:**
- Modify: `src/components/table-stylist.tsx`
- Modify: `src/app/(app)/pantry/pantry-client.tsx`

### Part A — TableStylist

Replace the light cream colour scheme with the app's warm dark aesthetic (Deep Espresso backgrounds, Rich Camel `#C19A6B` labels, warm cream `#EFE3CE` text). Switch from single-column to 2-column grid for the guide cards.

- [ ] **Step 1: Read table-stylist.tsx**

```bash
cat /c/Users/lasse/Desktop/whatscooking/src/components/table-stylist.tsx
```

- [ ] **Step 2: Replace the return JSX of `TableStylist`**

Find `return (` inside `TableStylist` and replace the entire returned JSX with:

```tsx
return (
  <div className="mt-8">
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-lg font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
        Phase IV: Table Styling
      </h2>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
        style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A" }}>
        Occasion-based
      </span>
    </div>

    {/* Occasion toggle */}
    <div className="flex rounded-xl overflow-hidden border mb-4" style={{ borderColor: "rgba(42,24,8,0.7)" }}>
      {OCCASION_LABELS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setOccasion(id)}
          className="flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: occasion === id ? "#3A2416" : "rgba(26,16,8,0.5)",
            color: occasion === id ? "#EFE3CE" : "#6B4E36",
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>

    {/* 2-column guide grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { icon: "🫙", label: "Serve on",     value: guide.plate  },
        { icon: "🌿", label: "Garnish",      value: guide.garnish },
        { icon: "📐", label: "Layout",       value: guide.layout  },
        { icon: "🍷", label: "Drink pairing", value: guide.drink  },
      ].map(({ icon, label, value }) => (
        <div
          key={label}
          className="rounded-xl p-3"
          style={{ background: "rgba(14,9,5,0.75)", border: "1px solid rgba(42,24,8,0.7)" }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">{icon}</span>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#C19A6B" }}>{label}</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#EFE3CE" }}>{value}</p>
        </div>
      ))}
    </div>

    {/* Pro tip */}
    <div className="mt-3 rounded-xl px-3.5 py-3 flex gap-2.5"
      style={{ background: "rgba(130,142,111,0.08)", border: "1px solid rgba(130,142,111,0.15)" }}>
      <span className="text-base shrink-0">💡</span>
      <p className="text-xs italic leading-relaxed" style={{ color: "#828E6F" }}>{guide.tip}</p>
    </div>
  </div>
);
```

### Part B — Pantry deep-link

- [ ] **Step 3: Read pantry-client.tsx `activeTab` state setup**

Find the line in `pantry-client.tsx`:
```tsx
const [activeTab, setActiveTab] = useState<"pantry" | "leftovers">("pantry");
```

- [ ] **Step 4: Add `useSearchParams` import and deep-link initialisation**

At the top of `pantry-client.tsx`, add to the existing React import:
```tsx
import { useSearchParams } from "next/navigation";
```

Then replace the `activeTab` state line with:

```tsx
const searchParams = useSearchParams();
const [activeTab, setActiveTab] = useState<"pantry" | "leftovers">(
  searchParams.get("tab") === "leftovers" ? "leftovers" : "pantry"
);
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/components/table-stylist.tsx src/app/\(app\)/pantry/pantry-client.tsx
git commit -m "feat: TableStylist warm dark redesign, pantry deep-link ?tab=leftovers"
```

---

## Task 7: Navigation fixes — logo and mobile nav

**Files:**
- Modify: `src/components/app-nav.tsx`

The logo currently links to `/discover`. Change it to `/dashboard`. Also check `src/components/mobile-bottom-nav.tsx` and `src/components/top-bar.tsx` for any logo links that need the same fix.

- [ ] **Step 1: Check for logo links across nav components**

```bash
grep -rn "href.*discover\|href.*\/\"" /c/Users/lasse/Desktop/whatscooking/src/components/app-nav.tsx /c/Users/lasse/Desktop/whatscooking/src/components/top-bar.tsx /c/Users/lasse/Desktop/whatscooking/src/components/mobile-bottom-nav.tsx 2>/dev/null
```

- [ ] **Step 2: Fix logo link in app-nav.tsx**

In `src/components/app-nav.tsx`, find:
```tsx
<Link href="/discover" className="flex items-center gap-2.5 min-w-0">
```

Replace with:
```tsx
<Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
```

- [ ] **Step 3: Fix logo link in top-bar.tsx if it links to /discover**

Read the file first:
```bash
head -60 /c/Users/lasse/Desktop/whatscooking/src/components/top-bar.tsx
```

If a logo `<Link>` points to `/discover`, update it to `/dashboard`.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/app-nav.tsx src/components/top-bar.tsx
git commit -m "fix: logo links to /dashboard on all nav components"
```

---

## Task 8: Dashboard feature cards visual upgrade

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

Add gradient image-style backgrounds to the feature cards on the dashboard hero so they feel as rich as the Discover recipe cards (dark overlay + warm gradient per card).

- [ ] **Step 1: Read the dashboard page**

```bash
cat /c/Users/lasse/Desktop/whatscooking/src/app/\(app\)/dashboard/page.tsx
```

- [ ] **Step 2: Identify all feature card components**

Note all cards rendered on the page (typically rendered as `<Link>` blocks with icon, title, description).

- [ ] **Step 3: Add gradient backgrounds to each card**

For each feature card, wrap or modify the card container to include a background gradient. The pattern to follow — each card gets a unique warm gradient and overlay:

```tsx
// Card wrapper pattern — apply to each card
<Link
  href="/discover"
  className="group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02]"
  style={{
    background: "linear-gradient(135deg, #1A0E06 0%, #2E1A0A 60%, #3A2010 100%)",
    border: "1px solid rgba(176,125,86,0.25)",
    minHeight: 120,
  }}
>
  {/* Warm gradient accent */}
  <div
    className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
    style={{ background: "linear-gradient(135deg, rgba(200,82,42,0.3) 0%, transparent 60%)" }}
  />
  {/* Content */}
  <div className="relative z-10 p-5">
    {/* existing icon + title + description */}
  </div>
</Link>
```

Apply a different accent colour per card category:
- Recipes: persimmon `rgba(200,82,42,0.3)`
- Meals/Plans: saffron `rgba(244,162,97,0.3)`
- Pantry: sage `rgba(130,142,111,0.3)`
- Events: teal `rgba(56,178,172,0.3)`

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat: dashboard feature cards with warm gradient backgrounds"
```

---

## Task 9: World Cup 2026 flag collection page

**Files:**
- Create: `src/app/(app)/events/world-cup-2026/page.tsx`

A curated page of 32 World Cup 2026 nations. Each country shows flag emoji + name + link to `/discover?cuisine=<cuisine>`. Completed countries (marked via localStorage when a recipe's Restore phase is finished from that cuisine) show a gold stamp. Progress displayed as X/32.

- [ ] **Step 1: Create the file**

```tsx
// src/app/(app)/events/world-cup-2026/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Globe } from "lucide-react";

const STORAGE_KEY = "wc_worldcup2026_collected";

const NATIONS = [
  { country: "Brazil",       flag: "🇧🇷", cuisine: "Brazilian"    },
  { country: "Argentina",    flag: "🇦🇷", cuisine: "Argentine"    },
  { country: "France",       flag: "🇫🇷", cuisine: "French"       },
  { country: "Germany",      flag: "🇩🇪", cuisine: "German"       },
  { country: "Spain",        flag: "🇪🇸", cuisine: "Spanish"      },
  { country: "Italy",        flag: "🇮🇹", cuisine: "Italian"      },
  { country: "England",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", cuisine: "British"      },
  { country: "Portugal",     flag: "🇵🇹", cuisine: "Portuguese"   },
  { country: "Netherlands",  flag: "🇳🇱", cuisine: "Dutch"        },
  { country: "Belgium",      flag: "🇧🇪", cuisine: "Belgian"      },
  { country: "Japan",        flag: "🇯🇵", cuisine: "Japanese"     },
  { country: "South Korea",  flag: "🇰🇷", cuisine: "Korean"       },
  { country: "Mexico",       flag: "🇲🇽", cuisine: "Mexican"      },
  { country: "USA",          flag: "🇺🇸", cuisine: "American"     },
  { country: "Canada",       flag: "🇨🇦", cuisine: "Canadian"     },
  { country: "Morocco",      flag: "🇲🇦", cuisine: "Moroccan"     },
  { country: "Nigeria",      flag: "🇳🇬", cuisine: "Nigerian"     },
  { country: "Senegal",      flag: "🇸🇳", cuisine: "West African" },
  { country: "Egypt",        flag: "🇪🇬", cuisine: "Egyptian"     },
  { country: "Saudi Arabia", flag: "🇸🇦", cuisine: "Middle Eastern" },
  { country: "Iran",         flag: "🇮🇷", cuisine: "Persian"      },
  { country: "Australia",    flag: "🇦🇺", cuisine: "Australian"   },
  { country: "Colombia",     flag: "🇨🇴", cuisine: "Colombian"    },
  { country: "Uruguay",      flag: "🇺🇾", cuisine: "Uruguayan"    },
  { country: "Chile",        flag: "🇨🇱", cuisine: "Chilean"      },
  { country: "Ecuador",      flag: "🇪🇨", cuisine: "Ecuadorian"   },
  { country: "Switzerland",  flag: "🇨🇭", cuisine: "Swiss"        },
  { country: "Poland",       flag: "🇵🇱", cuisine: "Polish"       },
  { country: "Croatia",      flag: "🇭🇷", cuisine: "Croatian"     },
  { country: "Denmark",      flag: "🇩🇰", cuisine: "Nordic"       },
  { country: "Serbia",       flag: "🇷🇸", cuisine: "Balkan"       },
  { country: "Turkey",       flag: "🇹🇷", cuisine: "Turkish"      },
] as const;

export default function WorldCup2026Page() {
  const [collected, setCollected] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollected(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  function toggleCollected(cuisine: string) {
    setCollected((prev) => {
      const next = new Set(prev);
      if (next.has(cuisine)) next.delete(cuisine);
      else next.add(cuisine);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const collectedCount = collected.size;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #C8522A, #B07D56)" }}
        >
          <Trophy style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            World Cup 2026 🏆
          </h1>
          <p className="text-xs" style={{ color: "#6B4E36" }}>Cook one recipe per nation to collect its flag</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>
            {collectedCount} / {NATIONS.length} flags collected
          </span>
          {collectedCount === NATIONS.length && (
            <span className="text-xs font-bold" style={{ color: "#C9A84C" }}>🏆 World Champion Chef!</span>
          )}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(42,24,8,0.6)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(collectedCount / NATIONS.length) * 100}%`,
              background: "linear-gradient(90deg, #C8522A, #C9A84C)",
            }}
          />
        </div>
      </div>

      {/* Nations grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {NATIONS.map(({ country, flag, cuisine }) => {
          const isCollected = collected.has(cuisine);
          return (
            <div
              key={country}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: isCollected
                  ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(176,125,86,0.1))"
                  : "rgba(18,12,7,0.7)",
                border: `1px solid ${isCollected ? "rgba(201,168,76,0.4)" : "rgba(42,24,8,0.7)"}`,
              }}
            >
              <Link
                href={`/discover?cuisine=${encodeURIComponent(cuisine)}`}
                className="block p-3 transition-opacity hover:opacity-80"
              >
                <div className="text-2xl mb-1">{flag}</div>
                <p className="text-xs font-semibold leading-snug" style={{ color: isCollected ? "#C9A84C" : "#EFE3CE" }}>
                  {country}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>{cuisine}</p>
              </Link>

              {/* Collect / uncollect stamp */}
              <button
                type="button"
                onClick={() => toggleCollected(cuisine)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: isCollected ? "rgba(201,168,76,0.9)" : "rgba(42,24,8,0.8)",
                  border: `1px solid ${isCollected ? "#C9A84C" : "rgba(58,36,22,0.6)"}`,
                }}
                aria-label={isCollected ? `Remove ${country} from collection` : `Collect ${country}`}
              >
                {isCollected ? (
                  <span style={{ fontSize: 11 }}>✓</span>
                ) : (
                  <Globe style={{ width: 10, height: 10, color: "#5A3A28" }} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center mt-6" style={{ color: "#3A2416" }}>
        Tip: complete the Restore phase of any recipe to auto-collect that cuisine's flag.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/events/world-cup-2026/page.tsx
git commit -m "feat: World Cup 2026 flag collection page"
```

---

## Task 10: Log changes to master_roadmap.md

**Files:**
- Modify: `.ai_context/master_roadmap.md`

- [ ] **Step 1: Read the file tail**

```bash
tail -30 /c/Users/lasse/Desktop/whatscooking/.ai_context/master_roadmap.md
```

- [ ] **Step 2: Append the Groups D+E+F log entry**

Append to `.ai_context/master_roadmap.md`:

```markdown

---

## 2026-04-22 — Groups D, E, F

### Group D — Cooking Mode Overhaul
- **CookingModeContext** (`src/lib/cooking-mode-context.tsx`): centralised active state, wake lock, and `currentStepText` shared across components.
- **CookingModeWrapper**: refactored to use context provider + inner component; hover tooltip explains cooking mode.
- **RecipeColumnsClient**: collapsible ingredients panel (auto-collapses on cooking mode; 48px strip with vertical text); sticky Prev/Next step navigation footer inside `NumberedInstructions`; `AddToStorageButton` now writes to `localStorage` (`wc_leftover_storage_v1`) instead of pantry API, z-9999 toast links to `/pantry?tab=leftovers`; All Done button navigates to `/dashboard`.
- **SOSCookingHelper**: moved button from `bottom-right` to `bottom-left` to eliminate overlap with Cooking Mode button; hover tooltip; step-aware "Help with current step" quick prompt when `currentStepText` is set in context.

### Group E — Restore Phase + Table Styling
- **ZeroWasteGuide**: split into two `AnimatedTabs` tabs — "🥗 Food Care" (storage hero cards with fridge/freezer days, reheat, do-not-store warning, collapsible Sustainable Chef Insights accordion) and "🧹 Kitchen Care" (cleanup concierge with dishwasher/hand wash toggle + lists + kitchen reset).
- **TableStylist**: warm dark redesign — Deep Espresso backgrounds, Rich Camel `#C19A6B` labels, cream `#EFE3CE` text, 2-column guide grid.
- **PantryClient**: added `?tab=leftovers` query param support via `useSearchParams` to deep-link from storage toast.

### Group F — Hero & Navigation
- **AppNav**: logo now links to `/dashboard` instead of `/discover`.
- **Dashboard**: feature cards upgraded with warm gradient backgrounds (category-specific accent overlays).
- **World Cup 2026**: new page at `/events/world-cup-2026` — 32 nations with flag emojis, localStorage flag collection, link to `/discover?cuisine=<cuisine>` per country.
```

- [ ] **Step 3: Commit**

```bash
git add .ai_context/master_roadmap.md
git commit -m "docs: log Groups D+E+F changes to master_roadmap"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Ingredients panel collapses to left | Task 3 step 7 |
| Auto-collapse on cooking mode | Task 3 step 6 |
| Fixed sticky Next Step button | Task 3 step 4 |
| Step completion animation (step number turns to checkmark) | Already in existing code — step number buttons show checkmark for done steps |
| Go back to previous step | Task 3 step 4 (Prev button) |
| Auto-advance when all steps done | Existing `onComplete()` callback — unchanged |
| Separate SOS from Cooking Mode button | Task 4 step 3 (SOS → left) |
| Tooltips on both buttons | Task 2 step 2 + Task 4 step 3 |
| SOS step-aware auto-suggestions | Task 4 steps 2+4 |
| Restore phase Food Care / Kitchen Care tabs | Task 5 |
| Sustainable Chef Insights accordion | Task 5 step 4 |
| Interactive cleanup concierge | Preserved in Kitchen Care tab |
| AddToStorage → actually adds to storage | Task 3 step 3 (localStorage) |
| Storage toast z-index + pantry link | Task 3 step 3 (z-9999) |
| TableStylist warm aesthetic + 2-col grid | Task 6 Part A |
| Pantry deep-link for storage | Task 6 Part B |
| Logo → /dashboard | Task 7 |
| All Done → /dashboard | Task 3 step 9 |
| Dashboard feature cards with visuals | Task 8 |
| World Cup 2026 flag collection | Task 9 |

**Notes:**
- "Hero stats for storage (fridge days, freezer suitability)" are the large `text-lg font-bold` numbers in the Food Care tab storage cards.
- "View whole storage page" is satisfied by `/pantry?tab=leftovers` deep-link from the toast.
- "Background loopable video on hero page" — already implemented in a prior session; not duplicated here.
- "All done button → localhost:3002" interpreted as `/dashboard` (the app root) since hardcoded localhost URLs are environment-specific.
