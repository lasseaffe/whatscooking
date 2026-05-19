# Meal Planner — Plan 4: Polish & Smart Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Close the polish gap left by Plans 1–3 and ship the spec-promised "smart" behaviors. Combines Lane B (polish) and the high-ROI parts of Lane C (smart features) into one focused branch.

**Architecture:** No new tables. No new endpoints. Six features layered on top of the existing Pinboard / Weave / Cook surfaces. All work fits inside `src/components/plans/`, `src/lib/`, plus a small extension to `usePlannerState`.

**Tech Stack:** Next.js 15 · React 19 · `@dnd-kit/core` (already installed and previously used by `RecipeBank` + retired `WeeklyPlanGrid`) · existing tokens.

**Spec:** `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`
**Plan 3 (cook view):** `docs/superpowers/plans/2026-05-19-meal-planner-cook-view.md`

**Branch base:** `feat/meal-planner-pinboard-weave-polish-smart` from `feat/meal-planner-pinboard-weave-cook`.

**What's in scope, in priority order:**

| # | Feature | Lane | Why this order |
|---|---|---|---|
| 1 | **Smart-swap rebalance** | C | Spec-promised, currently missing. When a user swaps a cell, adjacent suggestion cells re-rank so the week stays coherent. |
| 2 | **Anti-repeat visual warnings** | B | Builds on #1 — surfaces "you have chicken three days in a row" as a yellow underline + tooltip, even before any swap happens. |
| 3 | **Drag-and-drop between cells** | B | The grid feels native instead of click-to-swap-only. @dnd-kit already in the project. |
| 4 | **Batch-cook prep guidance** | C | Small visual cue on pinned cells with leftover descendants: "Cook 2× portions". One badge, one helper. |
| 5 | **Density ribbon** | B | Per-day visual summary band. Polish, but high-impact at a glance. Prompt was already saved earlier. |
| 6 | **Orphan cleanup** | B | Remove `src/components/plans/RecipeBank.tsx` and `src/app/(app)/plans/new/dnd-builder.tsx` if they have no remaining callers. Keeps the new grid the only grid. |

**Deferred to a later plan:**
- Squad-aware filters (touches household_member_preferences, deserves its own scoping).
- Moodboard entries (depends on which branch the moodboard config lives on once master settles).

---

## Phase 0 — Branch setup

### Task 0.1: Create branch

- [ ] **Step 1**

```bash
cd "C:/Users/lasse/Desktop/whatscooking"
git checkout feat/meal-planner-pinboard-weave-cook
git pull --ff-only
git checkout -b feat/meal-planner-pinboard-weave-polish-smart
git status
```

Expected: clean tree on the new branch.

---

## Phase A — Smart-swap rebalance + anti-repeat warnings

These two features share a single underlying helper (compute anti-repeat tension across the woven week). Build the helper first, then layer #1 (swap-time rebalance) and #2 (always-on warnings) on top.

### Task A.1: `anti-repeat-tension` helper

**Files:**
- Create: `src/lib/weave-solver/tension.ts`
- Create: `src/lib/weave-solver/__tests__/tension.test.ts`

Pure function that, given the woven entries + a recipe lookup, returns:
- Per-entry a `tension` score (0..1, higher = more conflict with neighbors)
- A list of `conflicts: { clientid_a, clientid_b, reason }`

Reason strings: `"same cuisine"`, `"shared dish type"`, `"same protein"`. Protein detection is heuristic — look for common protein keywords in `recipe.title` and `recipe.dish_types`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/tension.test.ts
import { describe, it, expect } from 'vitest';
import { computeTension } from '../tension';
import type { ProposedEntry, SolverRecipe } from '../types';

const r = (id: string, over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id, title: id, image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

const e = (clientid: string, day: number, recipe_id: string, is_leftover = false): ProposedEntry => ({
  clientid, day_number: day, meal_type: 'dinner',
  recipe_id, recipe_title: recipe_id,
  source: 'pinned', is_leftover, parent_clientid: null, locked: false, position: 0,
});

describe('computeTension', () => {
  it('zero tension for varied weeks', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r2'), e('c', 3, 'r3')];
    const pool = new Map([
      ['r1', r('r1', { cuisine_type: 'italian' })],
      ['r2', r('r2', { cuisine_type: 'thai' })],
      ['r3', r('r3', { cuisine_type: 'mexican' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts).toHaveLength(0);
    expect(out.byClientid['a'].tension).toBe(0);
  });

  it('flags adjacent cuisine collision', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r2')];
    const pool = new Map([
      ['r1', r('r1', { cuisine_type: 'italian' })],
      ['r2', r('r2', { cuisine_type: 'italian' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts.length).toBeGreaterThan(0);
    expect(out.conflicts[0].reason).toContain('cuisine');
    expect(out.byClientid['a'].tension).toBeGreaterThan(0);
    expect(out.byClientid['b'].tension).toBeGreaterThan(0);
  });

  it('flags shared protein keyword in titles', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r2')];
    const pool = new Map([
      ['r1', r('r1', { title: 'Roast Chicken with Rosemary' })],
      ['r2', r('r2', { title: 'Chicken Tikka Masala' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts.some(c => c.reason.includes('chicken'))).toBe(true);
  });

  it('ignores leftover entries (a leftover repeating its parent is fine)', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r1', true)];
    const pool = new Map([['r1', r('r1', { cuisine_type: 'italian' })]]);
    const out = computeTension(entries, pool);
    expect(out.conflicts).toHaveLength(0);
  });

  it('only flags adjacent days (1 apart), not 2+ apart', () => {
    const entries = [e('a', 1, 'r1'), e('b', 3, 'r2')];
    const pool = new Map([
      ['r1', r('r1', { cuisine_type: 'italian' })],
      ['r2', r('r2', { cuisine_type: 'italian' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
npx vitest run src/lib/weave-solver/__tests__/tension.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/lib/weave-solver/tension.ts
import type { ProposedEntry, SolverRecipe } from './types';

const PROTEIN_KEYWORDS = ['chicken', 'beef', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'tofu', 'lentil', 'chickpea', 'duck', 'turkey'];

export interface Conflict {
  clientid_a: string;
  clientid_b: string;
  reason: string;
}

export interface TensionMap {
  [clientid: string]: { tension: number };
}

export interface TensionResult {
  byClientid: TensionMap;
  conflicts: Conflict[];
}

function detectProtein(recipe: SolverRecipe | undefined): string | null {
  if (!recipe) return null;
  const haystack = `${recipe.title} ${recipe.dish_types.join(' ')}`.toLowerCase();
  for (const k of PROTEIN_KEYWORDS) if (haystack.includes(k)) return k;
  return null;
}

export function computeTension(
  entries: ProposedEntry[],
  pool: Map<string, SolverRecipe>,
): TensionResult {
  const conflicts: Conflict[] = [];
  const byClientid: TensionMap = {};
  for (const e of entries) byClientid[e.clientid] = { tension: 0 };

  // Sort by day then meal — adjacency in meal-time within same day is also fair to flag,
  // but for v1 we only flag adjacent-day-same-meal-type conflicts.
  const live = entries.filter(e => !e.is_leftover);

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (Math.abs(a.day_number - b.day_number) !== 1) continue;
      if (a.meal_type !== b.meal_type) continue;

      const ra = pool.get(a.recipe_id);
      const rb = pool.get(b.recipe_id);
      if (!ra || !rb) continue;

      const reasons: string[] = [];
      if (ra.cuisine_type && ra.cuisine_type === rb.cuisine_type) {
        reasons.push(`same cuisine (${ra.cuisine_type})`);
      }
      const sharedDishes = ra.dish_types.filter(d => rb.dish_types.includes(d));
      if (sharedDishes.length > 0) {
        reasons.push(`shared dish type (${sharedDishes[0]})`);
      }
      const pa = detectProtein(ra);
      const pb = detectProtein(rb);
      if (pa && pa === pb) {
        reasons.push(`same protein (${pa})`);
      }

      if (reasons.length > 0) {
        const reason = reasons.join(', ');
        conflicts.push({ clientid_a: a.clientid, clientid_b: b.clientid, reason });
        byClientid[a.clientid].tension = Math.min(1, byClientid[a.clientid].tension + 0.4 * reasons.length);
        byClientid[b.clientid].tension = Math.min(1, byClientid[b.clientid].tension + 0.4 * reasons.length);
      }
    }
  }

  return { byClientid, conflicts };
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npx vitest run src/lib/weave-solver/__tests__/tension.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/tension.ts src/lib/weave-solver/__tests__/tension.test.ts
git commit -m "feat(weave): anti-repeat tension helper"
```

### Task A.2: Wire tension into the woven view

**Files:**
- Modify: `src/components/plans/WeaveCell.tsx`
- Modify: `src/components/plans/WeaveGrid.tsx`
- Modify: `src/components/plans/WeaveSection.tsx`

Surface tension on the cell as a yellow underline + a hover tooltip listing the conflict reason. Pinned cells get the underline too (they can still have anti-repeat tension; the user just can't move them automatically).

- [ ] **Step 1: Compute tension in `WeaveSection`**

Inside `WeaveSection.tsx`, after building the `recipes` map, also compute the tension. Build a `SolverRecipe`-shaped pool from the weave-response recipe metadata (or from pins). Pass `tension` map + `conflicts` down to `WeaveGrid`.

```tsx
import { computeTension } from '@/lib/weave-solver/tension';
import type { SolverRecipe } from '@/lib/weave-solver/types';

// Inside the component body, after recipes lookup is built:
const solverPool = new Map<string, SolverRecipe>();
for (const p of state.pins) {
  solverPool.set(p.recipe.id, {
    id: p.recipe.id,
    title: p.recipe.title,
    image_url: p.recipe.image_url,
    cuisine_type: p.recipe.cuisine_type,
    dietary_tags: p.recipe.dietary_tags ?? [],
    dish_types: [],
    prep_time_minutes: p.recipe.prep_time_minutes,
    cook_time_minutes: p.recipe.cook_time_minutes,
    calories: p.recipe.calories,
    protein_g: p.recipe.protein_g,
    carbs_g: p.recipe.carbs_g,
    fat_g: p.recipe.fat_g,
    batch_friendly: p.recipe.batch_friendly,
    pantry_match: 0,
    inspiration_match: 0,
  });
}
for (const r of (state.weave as any).recipes ?? []) {
  if (!solverPool.has(r.id)) {
    // The weave response includes only macro/image meta — we don't have cuisine_type
    // or dish_types from there yet, but pinned recipes (which carry both) cover
    // anything pinned. Suggestion recipes without cuisine_type just won't trigger
    // tension — acceptable for v1.
    solverPool.set(r.id, {
      id: r.id, title: '', image_url: r.image_url ?? null, cuisine_type: null,
      dietary_tags: [], dish_types: [], prep_time_minutes: r.prep_time_minutes,
      cook_time_minutes: r.cook_time_minutes, calories: r.calories,
      protein_g: r.protein_g, carbs_g: r.carbs_g, fat_g: r.fat_g,
      batch_friendly: false, pantry_match: 0, inspiration_match: 0,
    });
  }
}

const tension = computeTension(state.weave.entries, solverPool);
```

Pass `tensionByClientid={tension.byClientid}` and `conflictsByClientid` (built from `tension.conflicts` as a `Record<string, string[]>` keyed by clientid containing the reasons it touches) down to `<WeaveGrid>`.

- [ ] **Step 2: Extend `WeaveGrid` to pass tension through**

```tsx
// WeaveGrid props add:
tensionByClientid?: Record<string, { tension: number }>;
conflictsByClientid?: Record<string, string[]>;

// Inside the cell rendering, pass:
<WeaveCell
  entry={entry}
  recipe={recipes[entry.recipe_id]}
  tension={tensionByClientid?.[entry.clientid]?.tension ?? 0}
  conflictReasons={conflictsByClientid?.[entry.clientid] ?? []}
  // ... existing props
/>
```

- [ ] **Step 3: Render in `WeaveCell`**

```tsx
// Extend WeaveCell props
interface Props {
  // ... existing
  tension?: number;
  conflictReasons?: string[];
}

// At the bottom of the cell JSX, after badges:
{tension > 0 && conflictReasons.length > 0 && (
  <div
    className="absolute -bottom-0.5 left-1 right-1 h-0.5 rounded-full"
    style={{ background: '#F2C94C', opacity: Math.min(1, 0.4 + tension * 0.6) }}
    title={`Anti-repeat: ${conflictReasons.join('; ')}`}
  />
)}
```

- [ ] **Step 4: Wire props through `WeaveSection` → `WeaveGrid`**

In `WeaveSection`, build `conflictsByClientid`:

```ts
const conflictsByClientid: Record<string, string[]> = {};
for (const c of tension.conflicts) {
  (conflictsByClientid[c.clientid_a] ??= []).push(c.reason);
  (conflictsByClientid[c.clientid_b] ??= []).push(c.reason);
}
```

Pass both to `<WeaveGrid>`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/tension.ts src/components/plans/WeaveCell.tsx src/components/plans/WeaveGrid.tsx src/components/plans/WeaveSection.tsx
# (tension.ts already committed in A.1, this catches the others)
git add src/components/plans/WeaveCell.tsx src/components/plans/WeaveGrid.tsx src/components/plans/WeaveSection.tsx
git commit -m "feat(plans): anti-repeat tension underline on weave cells"
```

### Task A.3: Smart-swap rebalance — picker pre-ranks by gap awareness

When the user taps a cell to swap, the picker should already prefer recipes that *resolve* the cell's tension (or at minimum don't introduce new conflicts).

**Files:**
- Modify: `src/components/plans/ConstraintPicker.tsx`
- Modify: `src/components/plans/WeaveSection.tsx`

The picker currently calls `/api/recipes/picker?plan_id=...&meal_type=...&exclude_recipe_ids=...`. The picker route already supports the relevant ranking. The smart-swap step is **client-side post-filtering of results**: when the cell being swapped has neighbors with known cuisine/protein, **demote** results that would re-create the same conflict and **boost** results that fix it.

- [ ] **Step 1: Add `neighborHints` prop to picker**

```tsx
// ConstraintPicker.tsx
interface Props {
  // ... existing
  neighborHints?: {
    avoidCuisines: string[];   // cuisines used by adjacent-day same-meal entries
    avoidProteins: string[];   // protein keywords to avoid
    avoidDishTypes: string[];  // dish types to avoid
  };
}
```

After fetching `results`, sort them client-side:

```ts
const ranked = useMemo(() => {
  if (!neighborHints) return results;
  return [...results].sort((a, b) => penalty(b) - penalty(a)); // descending so higher score wins; flip
}, [results, neighborHints]);

function penalty(r: any): number {
  let score = 0;
  if (neighborHints?.avoidCuisines.includes(r.cuisine_type ?? '')) score -= 1;
  const protein = detectProteinClient(r.title);
  if (protein && neighborHints?.avoidProteins.includes(protein)) score -= 0.7;
  for (const d of r.dish_types ?? []) {
    if (neighborHints?.avoidDishTypes.includes(d)) score -= 0.3;
  }
  return score;
}
```

(Use the descending sort correctly — penalty returns ≤ 0; better recipes have larger numbers; sort `(a, b) => penalty(b) - penalty(a)` ascending by penalty puts best first.)

`detectProteinClient` is the same heuristic as in `tension.ts`, inlined client-side to avoid pulling solver lib into a client bundle. Keep it small:

```ts
const CLIENT_PROTEINS = ['chicken', 'beef', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'tofu', 'lentil', 'chickpea', 'duck', 'turkey'];
function detectProteinClient(title: string): string | null {
  const t = (title ?? '').toLowerCase();
  for (const k of CLIENT_PROTEINS) if (t.includes(k)) return k;
  return null;
}
```

Also add a small banner inside the picker when `neighborHints` is provided and any avoid* list is non-empty:

```tsx
{neighborHints && (neighborHints.avoidCuisines.length + neighborHints.avoidProteins.length > 0) && (
  <div className="px-4 py-2 border-b text-xs" style={{ borderColor: '#2A1F14', color: '#F2C94C' }}>
    Picking around: {[...neighborHints.avoidCuisines, ...neighborHints.avoidProteins].join(', ')}
  </div>
)}
```

- [ ] **Step 2: Compute `neighborHints` in `WeaveSection`**

```ts
function computeNeighborHints(slot: { day: number; mealType: MealType }, entries: ProposedEntry[], pool: Map<string, SolverRecipe>) {
  const avoidCuisines = new Set<string>();
  const avoidProteins = new Set<string>();
  const avoidDishTypes = new Set<string>();
  for (const e of entries) {
    if (Math.abs(e.day_number - slot.day) !== 1) continue;
    if (e.meal_type !== slot.mealType) continue;
    const r = pool.get(e.recipe_id);
    if (!r) continue;
    if (r.cuisine_type) avoidCuisines.add(r.cuisine_type);
    for (const d of r.dish_types) avoidDishTypes.add(d);
    const p = detectProteinClient(r.title);
    if (p) avoidProteins.add(p);
  }
  return {
    avoidCuisines: [...avoidCuisines],
    avoidProteins: [...avoidProteins],
    avoidDishTypes: [...avoidDishTypes],
  };
}
```

Pass to `<ConstraintPicker neighborHints={...} />`.

- [ ] **Step 3: Commit**

```bash
git add src/components/plans/ConstraintPicker.tsx src/components/plans/WeaveSection.tsx
git commit -m "feat(plans): smart-swap picker ranks around adjacent-day conflicts"
```

---

## Phase B — Drag-and-drop in the Weave grid

### Task B.1: Wrap `WeaveGrid` in a DnD context with cell-to-cell swap

**Files:**
- Modify: `src/components/plans/WeaveGrid.tsx`
- Modify: `src/components/plans/WeaveCell.tsx`
- Modify: `src/components/plans/WeaveSection.tsx`
- Modify: `src/app/(app)/plans/[id]/use-planner-state.ts`

When the user drags one cell over another, swap their recipe references (not their slot positions — the slot identity is day×meal_type).

- [ ] **Step 1: Add a swap-by-clientid action to the hook**

```ts
// use-planner-state.ts — add to the returned API
const swapEntriesByClientid = useCallback((aClientid: string, bClientid: string) => {
  setWeave(prev => {
    if (!prev) return prev;
    const a = prev.entries.find(e => e.clientid === aClientid);
    const b = prev.entries.find(e => e.clientid === bClientid);
    if (!a || !b) return prev;
    return {
      ...prev,
      entries: prev.entries.map(e => {
        if (e.clientid === aClientid) return { ...e, recipe_id: b.recipe_id, recipe_title: b.recipe_title };
        if (e.clientid === bClientid) return { ...e, recipe_id: a.recipe_id, recipe_title: a.recipe_title };
        return e;
      }),
    };
  });
}, []);

// Add `swapEntriesByClientid` to the returned object.
```

- [ ] **Step 2: Make `WeaveCell` draggable + droppable**

```tsx
// WeaveCell.tsx — at the top of the component body
import { useDraggable, useDroppable } from '@dnd-kit/core';

const drag = useDraggable({ id: entry.clientid, data: { kind: 'cell' } });
const drop = useDroppable({ id: entry.clientid, data: { kind: 'cell' } });

// On the outer container:
ref={(el) => { drag.setNodeRef(el); drop.setNodeRef(el); }}
{...drag.attributes}
{...drag.listeners}
style={{
  ...(existingStyle),
  opacity: drag.isDragging ? 0.4 : (existingOpacity ?? 1),
  outline: drop.isOver ? '2px solid #E67E22' : undefined,
  outlineOffset: drop.isOver ? -2 : undefined,
  touchAction: 'none',
  cursor: drag.isDragging ? 'grabbing' : 'grab',
}}
```

Don't break the click-to-pick behavior: `useDraggable` uses pointer events with a small activation distance. Add a sensor in `WeaveGrid` (Step 3) that sets `activationConstraint: { distance: 5 }` so a click registers as a click, not a drag.

- [ ] **Step 3: DndContext in `WeaveGrid`**

```tsx
// WeaveGrid.tsx
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';

// Add a prop:
onSwapCells: (aClientid: string, bClientid: string) => void;

// In the component:
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

const handleDragEnd = (event: DragEndEvent) => {
  const a = event.active?.id;
  const b = event.over?.id;
  if (!a || !b || a === b) return;
  onSwapCells(String(a), String(b));
};

return (
  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    {/* existing grid */}
  </DndContext>
);
```

Pass `onSwapCells={state.swapEntriesByClientid}` from `WeaveSection`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/plans/[id]/use-planner-state.ts" src/components/plans/WeaveCell.tsx src/components/plans/WeaveGrid.tsx src/components/plans/WeaveSection.tsx
git commit -m "feat(plans): drag-and-drop cell swap in Weave grid"
```

---

## Phase C — Batch-cook prep guidance

### Task C.1: Show "cook 2× portions" badge on pin cells with leftover descendants

**Files:**
- Modify: `src/components/plans/WeaveCell.tsx`

When an entry is `source === 'pinned'` AND there exists another entry in the same week with `parent_clientid === entry.clientid`, that pin is the cook day for a leftover. Show a small badge "🍳 2× portions" so the user knows the recipe will feed two slots.

- [ ] **Step 1: Add prop**

```tsx
interface Props {
  // ... existing
  hasLeftoverDescendant?: boolean;
}

// JSX badge (next to or near the 📌 icon row):
{hasLeftoverDescendant && (
  <span
    className="text-xs px-1.5 py-0.5 rounded ml-auto"
    style={{ background: 'rgba(122, 163, 80, 0.2)', color: '#7AA350' }}
    title="This is the cook day; one leftover slot uses the same dish"
  >
    🍳 2×
  </span>
)}
```

- [ ] **Step 2: Compute in `WeaveGrid`**

```ts
const leftoverParentIds = new Set(
  entries.filter(e => e.is_leftover && e.parent_clientid).map(e => e.parent_clientid as string)
);

// Pass per cell:
hasLeftoverDescendant={leftoverParentIds.has(entry.clientid)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/plans/WeaveCell.tsx src/components/plans/WeaveGrid.tsx
git commit -m "feat(plans): batch-cook 2x portions badge on cook-day cells"
```

### Task C.2: Same hint on the Cook view's TodayCard

**Files:**
- Modify: `src/components/plans/cook/TodayCard.tsx`

When a `TodayCard` entry is the parent of a leftover in the same plan, show the same "🍳 cook 2× portions" hint inline.

- [ ] **Step 1: Thread the data**

`CookClient` already has all entries. Compute the set of clientids that are parents of leftovers and pass `leftoverParentIds: Set<string>` to `TodayCard`. Adjust `CookableEntry` to include `clientid` if it doesn't — check the type and add to the SELECT in `page.tsx` if needed.

Wait — `CookableEntry.id` is the DB primary key; `parent_clientid` references a clientid generated by the solver. These are **not the same**. The solver-side clientid only persists if it's saved with the entry. Look at how Plan 1's data flow handles this.

Inspect `meal_entries` schema: it has `parent_clientid uuid` (Plan 1 migration `20260518h`), but the entry's own clientid is **not a DB column** — the DB primary key is `id`. The plan layer never persisted the solver-side clientid; it was only used in-flight.

**Resolution:** for the Cook view, batch-cook hint is *not directly derivable from `meal_entries`* unless we persist the clientid. Three options:
1. Add `clientid` column to `meal_entries` (migration). Bigger change.
2. Use a *recipe-based* heuristic instead: a TodayCard entry that has a non-leftover sibling with the same `recipe_id` later in the week → "cook 2× portions". Works for the common case.
3. Skip the cook-view side for v1 and only do the Weave-side badge from Task C.1.

Go with **option 2** — recipe-based heuristic. It's correct for the common case (cook once, eat leftovers tomorrow uses the same recipe). It misses contrived cases (manually constructed leftovers with different recipes), but Plan 1's solver only creates leftovers via `parent`, so any `recipe_id` shared between a non-leftover and a leftover is exactly the pattern we want to surface.

- [ ] **Step 2: Implement**

In `CookClient.tsx`, before rendering `TodayCard`:

```ts
const cookOnceEatTwice = useMemo(() => {
  const recipeCounts = new Map<string, { cook: number; reheat: number }>();
  for (const e of entries) {
    if (!e.recipe_id) continue;
    const slot = recipeCounts.get(e.recipe_id) ?? { cook: 0, reheat: 0 };
    if (e.is_leftover) slot.reheat += 1;
    else slot.cook += 1;
    recipeCounts.set(e.recipe_id, slot);
  }
  const ids = new Set<string>();
  for (const [recipeId, count] of recipeCounts) {
    if (count.cook >= 1 && count.reheat >= 1) ids.add(recipeId);
  }
  return ids;
}, [entries]);

// Pass into TodayCard:
<TodayCard ... cookOnceEatTwice={cookOnceEatTwice} />
```

In `TodayCard`, accept `cookOnceEatTwice: Set<string>` and render the badge next to each non-leftover entry whose `recipe_id` is in the set.

```tsx
{!e.is_leftover && e.recipe_id && cookOnceEatTwice.has(e.recipe_id) && (
  <span
    className="text-xs px-1.5 py-0.5 rounded ml-2"
    style={{ background: 'rgba(122, 163, 80, 0.2)', color: '#7AA350' }}
    title="Plan reuses this dish as leftovers"
  >
    🍳 2×
  </span>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/plans/cook/TodayCard.tsx "src/app/(app)/plans/[id]/cook/cook-client.tsx"
git commit -m "feat(plans): 2x portions hint on TodayCard for cook-once dishes"
```

---

## Phase D — Density ribbon

### Task D.1: `DayDensityRibbon` component

**Files:**
- Create: `src/components/plans/DayDensityRibbon.tsx`
- Modify: `src/components/plans/WeaveGrid.tsx`

Per-day visual band above the first meal row. Three thin (~4px) stacked bands:
1. **Cook-time depth** — sum of active cook minutes that day / 120 cap → warm orange fill 0–100%
2. **Leftover marker** — translucent green fill when any cell that day is leftover
3. **Pantry coverage** — sandstone fill 0–100%

Hide the ribbon if all three bands would be near-zero (avoids visual noise).

- [ ] **Step 1: Component**

```tsx
// src/components/plans/DayDensityRibbon.tsx
'use client';

interface Band {
  pct: number;     // 0..1
  color: string;
  label: string;
  value: string;   // human-readable for tooltip
}

interface Props {
  cookMinutes: number;
  hasLeftover: boolean;
  pantryPct: number;
}

export function DayDensityRibbon({ cookMinutes, hasLeftover, pantryPct }: Props) {
  const cookBand: Band = {
    pct: Math.min(1, cookMinutes / 120),
    color: '#E67E22',
    label: 'cook time',
    value: cookMinutes > 0 ? `${cookMinutes} min active cooking` : 'no cooking',
  };
  const leftoverBand: Band = {
    pct: hasLeftover ? 1 : 0,
    color: '#7AA350',
    label: 'leftover',
    value: hasLeftover ? 'leftover day' : 'no leftovers',
  };
  const pantryBand: Band = {
    pct: pantryPct,
    color: '#C8A882',
    label: 'pantry coverage',
    value: `${Math.round(pantryPct * 100)}% from pantry`,
  };

  // Hide if all bands are near-zero
  if (cookBand.pct < 0.05 && leftoverBand.pct === 0 && pantryBand.pct < 0.05) return null;

  return (
    <div className="flex flex-col gap-0.5 pb-2" title={`${cookBand.value} · ${leftoverBand.value} · ${pantryBand.value}`}>
      {[cookBand, leftoverBand, pantryBand].map((b, i) => (
        <div
          key={i}
          className="h-1 rounded-full overflow-hidden"
          style={{ background: '#2A1F14' }}
          aria-label={`${b.label}: ${b.value}`}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${b.pct * 100}%`, background: b.color }}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Mount in `WeaveGrid`**

The grid currently renders a header row (`Day 1`, `Day 2`...). After the header label, render a `<DayDensityRibbon>` between the header and the first meal-type row.

Compute per-day numbers in `WeaveGrid`:

```ts
import { DayDensityRibbon } from './DayDensityRibbon';

// New prop:
recipeMacrosByRecipeId: Record<string, { prep_time_minutes: number | null; cook_time_minutes: number | null }>;
pantryPctByRecipeId: Record<string, number>;  // optional; default to 0 when not provided

// Per day helpers:
function dayStats(day: number, entries: ProposedEntry[], recipes: Record<string, { prep_time_minutes: number | null; cook_time_minutes: number | null }>, pantryByRecipe: Record<string, number>) {
  const dayEntries = entries.filter(e => e.day_number === day);
  let cookMinutes = 0;
  let hasLeftover = false;
  let pantrySum = 0;
  let pantryCount = 0;
  for (const e of dayEntries) {
    if (e.is_leftover) { hasLeftover = true; continue; }
    const r = recipes[e.recipe_id];
    if (r) cookMinutes += (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
    const p = pantryByRecipe[e.recipe_id];
    if (typeof p === 'number') { pantrySum += p; pantryCount += 1; }
  }
  return { cookMinutes, hasLeftover, pantryPct: pantryCount > 0 ? pantrySum / pantryCount : 0 };
}
```

Render a ribbon per day column right under the day header label:

```tsx
{Array.from({ length: durationDays }).map((_, i) => {
  const day = i + 1;
  const stats = dayStats(day, entries, recipeMacrosByRecipeId, pantryPctByRecipeId);
  return (
    <div key={`hdr-${i}`} className="text-xs text-center font-semibold pb-2" style={{ color: '#8A6A4A' }}>
      <div>{dayLabel(day)}</div>
      <DayDensityRibbon cookMinutes={stats.cookMinutes} hasLeftover={stats.hasLeftover} pantryPct={stats.pantryPct} />
    </div>
  );
})}
```

- [ ] **Step 3: Provide pantry data**

The weave route already computes `pantry_match` during solving but doesn't return it per-recipe in the response. Extend the weave route's `recipes[]` payload to include `pantry_match` (which we already computed for ranking — recompute or carry it through). Then thread that map down into `WeaveGrid`.

Simpler v1 approach: skip pantry per-day for now. Pass an empty `pantryPctByRecipeId={{}}` and the band shows zero. The cook-time and leftover bands still work. Land pantry as a follow-up.

- [ ] **Step 4: Commit**

```bash
git add src/components/plans/DayDensityRibbon.tsx src/components/plans/WeaveGrid.tsx
git commit -m "feat(plans): per-day density ribbon (cook time + leftover + pantry)"
```

---

## Phase E — Orphan cleanup

### Task E.1: Remove unused `RecipeBank` and `dnd-builder`

**Files:**
- Possibly remove: `src/components/plans/RecipeBank.tsx`
- Possibly remove: `src/app/(app)/plans/new/dnd-builder.tsx`

These remained after Plan 2's Pinboard replaced the old grid model. Verify they have no callers before removing.

- [ ] **Step 1: Grep for callers**

```bash
grep -rn "RecipeBank\|from.*RecipeBank\|dnd-builder\|DndBuilder" src/ --include="*.tsx" --include="*.ts" 2>&1 | grep -v "RecipeBank.tsx:\|dnd-builder.tsx:"
```

- [ ] **Step 2: If no callers, remove**

```bash
git rm src/components/plans/RecipeBank.tsx "src/app/(app)/plans/new/dnd-builder.tsx"
```

If `dnd-builder.tsx` is imported by `src/app/(app)/plans/new/page.tsx`, instead check what `/plans/new` does today. If it's the "create a plan" wizard, do NOT remove — find a small adapter that points to the new flow, or leave the legacy in place and add a TODO.

- [ ] **Step 3: Commit (only if files were actually removed)**

```bash
git commit -m "chore(plans): remove orphaned RecipeBank + dnd-builder after Pinboard refactor"
```

---

## Phase F — Verify + log + PR

### Task F.1: Solver tests

```bash
npx vitest run src/lib/weave-solver/
```

Expected: 34 + 5 = **39 tests passing**.

### Task F.2: Typecheck

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types/\|events/\[id\]/page\|app-nav\|vitest" | tail -30
```

Expected: no errors in any file touched by this plan.

### Task F.3: Log entry

Append to `logs/2026-05-19.md`:

```markdown
## [HH:MM] Polish + smart features shipped (Plan 4)

Branch `feat/meal-planner-pinboard-weave-polish-smart` stacked on cook view.

### What landed
- **Smart-swap rebalance:** picker now ranks around adjacent-day cuisines / proteins / dish types
- **Anti-repeat tension:** yellow underline on woven cells that share cuisine/protein with adjacent days; hover tooltip explains
- **Drag-and-drop:** cell-to-cell swap in the Weave grid via @dnd-kit
- **Batch-cook hint:** "🍳 2×" badge on cook-day cells and TodayCard entries when the recipe reappears as a leftover
- **Density ribbon:** per-day three-band visual (cook time, leftover, pantry)
- **Cleanup:** retired orphaned RecipeBank.tsx and dnd-builder.tsx (if confirmed unused)

### Not in this plan
- Squad-aware filters (Plan 5 candidate)
- Moodboard entries (depends on master state)

### Tests
- 39/39 solver tests passing (added tension.test.ts with 5 cases)
- Typecheck clean
```

### Task F.4: Push and open PR

```bash
git push -u origin feat/meal-planner-pinboard-weave-polish-smart

gh pr create --draft \
  --base feat/meal-planner-pinboard-weave-cook \
  --head feat/meal-planner-pinboard-weave-polish-smart \
  --title "feat(plans): meal planner polish + smart features — Plan 4" \
  --body "$(cat <<'EOF'
## Summary

Polish + smart features layer on top of the meal planner. Stacks on PR #4 (cook view).

Closes the spec's smart-swap promise (§5.3) and adds drag-and-drop, batch-cook hints, and the density ribbon polish.

## What's in this PR
- **Smart-swap rebalance** (Lane C) — picker pre-ranks around adjacent cuisine/protein/dish conflicts
- **Anti-repeat visual warnings** (Lane B) — yellow tension underline on cells with conflicts; hover tooltip
- **Drag-and-drop cell swap** (Lane B) — @dnd-kit wired into WeaveGrid, click still works for the picker
- **Batch-cook 2× portions hint** (Lane C) — cook-day cells and TodayCard entries show the badge when a leftover descendant uses the same recipe
- **Density ribbon** (Lane B) — per-day three-band visual (cook time / leftover / pantry)
- **Orphan cleanup** — removed `RecipeBank.tsx` + `dnd-builder.tsx` (or kept with note if still referenced)

## Solver
- New `src/lib/weave-solver/tension.ts` + 5 unit tests (now 39 total passing)

## Out of scope
- Squad-aware filters (Plan 5)
- Moodboard token entries (depends on master state)

## Test plan
- [x] Solver tests pass (39/39)
- [x] Typecheck clean
- [ ] Drag a cell on the Weave grid → another cell → recipes swap
- [ ] Tap a cell with a conflicting neighbor → picker shows "Picking around: italian" banner
- [ ] Cells with adjacent-day cuisine match show yellow underline
- [ ] Cook day with a leftover descendant shows "🍳 2×" badge
- [ ] Each day in the grid has a density ribbon (or hides when all-zero)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- §5.3 smart-swap rebalance — Phase A (tension + picker re-ranking)
- §6.3 density ribbon — Phase D
- Drag-and-drop / batch hint — orthogonal polish, not in spec but obvious feature gaps

**Type consistency:** `TensionResult`, `Conflict`, `TensionMap` defined once in `tension.ts`. `Band` used only inside `DayDensityRibbon`. `cookOnceEatTwice: Set<string>` used identically across `CookClient` and `TodayCard`.

**Placeholders:** None. The pantry-band-empty-for-now in D.3 is explicit, documented, and falls back gracefully.

**Scope discipline:** Plan 4 adds **zero new tables**, **zero new endpoints**, **one new pure-lib module** (tension), and touches roughly 8 existing component files plus one hook. No new external dependencies — @dnd-kit was already installed.
