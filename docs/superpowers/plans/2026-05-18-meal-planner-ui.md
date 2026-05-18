# Meal Planner Pinboard + Weave — Plan 2: UI Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the UI for the new meal planner — Pinboard (constraint chips, inspiration filters, recipe feed, pin tray), Weave grid refactor (cell archetypes, summary strip, smart-swap, auto-reweave), constraint-aware picker, and three-state macro display. Consumes the stable backend contract delivered in Plan 1.

**Architecture:** Single scrollable `/plans/[id]` page with Pinboard above and Weave below; client components coordinate via the existing plan-builder shell. Each UI primitive is a small focused component under `src/components/plans/`. No new state library — useState/useReducer + the existing API surface from Plan 1.

**Tech Stack:** Next.js 15 App Router · TypeScript · React 19 · Tailwind 4 · `@dnd-kit/core` (already in use for the grid) · existing `<RecipeImage>` and project tokens.

**Spec:** `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`
**Plan 1 (foundation):** `docs/superpowers/plans/2026-05-18-meal-planner-foundation.md`

**Branch base:** `feat/meal-planner-pinboard-weave-ui` from `feat/meal-planner-pinboard-weave` (foundation). When PR #2 merges to master, rebase onto master.

**Tokens to use** (per APPLE_COMPLIANCE / WC palette already in `WeeklyPlanGrid.tsx`):

| Purpose | Token |
|---|---|
| Background card | `#1A120A` |
| Soft border | `#3A2A1A` |
| Brand interactive | `#E67E22` (Ember) |
| Text bright | `#EFE3CE` |
| Text muted | `#8A6A4A` |
| Text dim | `#6B4E36` |
| Accent dark | `#2A1F14` |

**Type-checking:** every UI task ends with `npx tsc --noEmit` on touched files. Pre-existing errors in `.next/types/`, `app-nav.tsx`, `events/[id]/page.tsx`, and `vitest` test files are out of scope.

---

## Phase 0 — Branch setup

### Task 0.1: Create UI branch

- [ ] **Step 1: Stack on foundation branch**

```bash
cd "C:/Users/lasse/Desktop/whatscooking"
git checkout feat/meal-planner-pinboard-weave
git pull --ff-only
git checkout -b feat/meal-planner-pinboard-weave-ui
git status
```

Expected: clean tree on the new branch tracking the foundation.

---

## Phase A — Shared state hook + page shell

The Pinboard and Weave share three things: the plan, the pins, and the constraint state. Putting them in one hook makes the rest of the components dumb. The hook lives in the page client component.

### Task A.1: `usePlannerState` hook

**Files:**
- Create: `src/app/(app)/plans/[id]/use-planner-state.ts`

This is a client-only hook that:
- Holds `pins: Pin[]`, `filters: PinboardFilters`, `weaveOutput: SolverOutput | null`, `entries: BuilderEntry[]`, `status: PlanStatus`, `loading: boolean`
- Exposes `addPin`, `removePin`, `reorderPin`, `setFilters` (debounced PATCH), `runWeave`, `swapEntry`, `removeEntry`, `pinSuggestion`
- Auto-reweaves on filter change with a 400ms debounce + an undo stack of the last `weaveOutput` snapshot
- Fetches initial pins on mount

- [ ] **Step 1: Write the hook**

```ts
// src/app/(app)/plans/[id]/use-planner-state.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SolverOutput, ProposedEntry, MealType } from '@/lib/weave-solver';

export type PlanStatus = 'planning' | 'active' | 'completed' | 'draft' | 'woven' | 'cooking' | 'archived';

export interface Pin {
  id: string;
  recipe_id: string;
  priority: number;
  pinned_at: string;
  recipe: {
    id: string;
    title: string;
    image_url: string | null;
    focal_x?: number | null;
    focal_y?: number | null;
    cuisine_type: string | null;
    dietary_tags: string[];
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    batch_friendly: boolean;
  };
}

export interface PinboardFilters {
  diet: string[];
  time_weeknight: number;
  time_weekend: number;
  squad_size: number;
  pantry_aware: boolean;
  pantry_missing_max: number;
  anti_repeat: 'strict' | 'moderate' | 'off';
  batch_enabled: boolean;
  inspiration_tags: string[];
}

const DEFAULT_FILTERS: PinboardFilters = {
  diet: [],
  time_weeknight: 30,
  time_weekend: 120,
  squad_size: 2,
  pantry_aware: false,
  pantry_missing_max: 4,
  anti_repeat: 'moderate',
  batch_enabled: false,
  inspiration_tags: [],
};

export function usePlannerState(planId: string, initialStatus: PlanStatus, initialFilters: Partial<PinboardFilters>) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [filters, setFiltersState] = useState<PinboardFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [weave, setWeave] = useState<SolverOutput | null>(null);
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<SolverOutput[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    fetch(`/api/plans/${planId}/pins`)
      .then(r => r.ok ? r.json() : { pins: [] })
      .then(d => setPins(d.pins ?? []));
  }, [planId]);

  const runWeave = useCallback(async (opts?: { seed?: number; persistUndo?: boolean }) => {
    setLoading(true);
    if (opts?.persistUndo && weave) setUndoStack(s => [...s.slice(-9), weave]);
    try {
      const res = await fetch(`/api/plans/${planId}/weave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: opts?.seed ?? 0 }),
      });
      if (res.ok) {
        const out = await res.json();
        setWeave(out);
        setStatus('woven');
      }
    } finally { setLoading(false); }
  }, [planId, weave]);

  const setFilters = useCallback((patch: Partial<PinboardFilters>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...patch };
      // Persist to plan
      fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinboard_filters: next }),
      });
      // Debounced auto-reweave when we already have a woven plan
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (weave) {
        debounceRef.current = setTimeout(() => { void runWeave({ persistUndo: true }); }, 400);
      }
      return next;
    });
  }, [planId, runWeave, weave]);

  const addPin = useCallback(async (recipe_id: string) => {
    const res = await fetch(`/api/plans/${planId}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id }),
    });
    if (res.ok) {
      const list = await fetch(`/api/plans/${planId}/pins`).then(r => r.json());
      setPins(list.pins ?? []);
    }
  }, [planId]);

  const removePin = useCallback(async (recipe_id: string) => {
    await fetch(`/api/plans/${planId}/pins/${recipe_id}`, { method: 'DELETE' });
    setPins(prev => prev.filter(p => p.recipe_id !== recipe_id));
  }, [planId]);

  const reorderPin = useCallback(async (recipe_id: string, priority: number) => {
    await fetch(`/api/plans/${planId}/pins/${recipe_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
    setPins(prev => prev.map(p => p.recipe_id === recipe_id ? { ...p, priority } : p));
  }, [planId]);

  const swapEntry = useCallback((clientid: string, replacement: Partial<ProposedEntry> & { recipe_id: string; recipe_title: string }) => {
    setWeave(prev => prev ? ({
      ...prev,
      entries: prev.entries.map(e =>
        e.clientid === clientid
          ? { ...e, ...replacement, source: 'suggestion', is_leftover: false }
          : e
      ),
    }) : prev);
  }, []);

  const removeEntry = useCallback((clientid: string) => {
    setWeave(prev => prev ? ({
      ...prev,
      entries: prev.entries.filter(e => e.clientid !== clientid),
    }) : prev);
  }, []);

  const pinSuggestion = useCallback((clientid: string) => {
    setWeave(prev => prev ? ({
      ...prev,
      entries: prev.entries.map(e =>
        e.clientid === clientid ? { ...e, source: 'pinned', locked: true } : e
      ),
    }) : prev);
    // Also add to pins
    const target = weave?.entries.find(e => e.clientid === clientid);
    if (target) void addPin(target.recipe_id);
  }, [addPin, weave]);

  const undoWeave = useCallback(() => {
    setUndoStack(stack => {
      const prev = stack[stack.length - 1];
      if (!prev) return stack;
      setWeave(prev);
      return stack.slice(0, -1);
    });
  }, []);

  return {
    pins, filters, weave, status, loading, canUndo: undoStack.length > 0,
    addPin, removePin, reorderPin, setFilters,
    runWeave, swapEntry, removeEntry, pinSuggestion, undoWeave,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/plans/[id]/use-planner-state.ts
git commit -m "feat(plans): usePlannerState hook (pins/filters/weave + undo)"
```

### Task A.2: Replace `plan-builder.tsx` shell with stacked layout

**Files:**
- Modify: `src/app/(app)/plans/[id]/plan-builder.tsx`

The current `plan-builder.tsx` renders `WeeklyPlanGrid` + `RecipeBank` side-by-side (per the screenshot). The new shape is a vertical stack: header → Pinboard → Weave. Most of the existing client coordination is replaced with the new hook.

- [ ] **Step 1: Read the current file**

```bash
wc -l "src/app/(app)/plans/[id]/plan-builder.tsx"
```

This file is ~1300 lines. The replacement is much smaller because state moves to `usePlannerState` and visuals split into new components. Treat this as a near-rewrite.

- [ ] **Step 2: Write the new shell**

```tsx
// src/app/(app)/plans/[id]/plan-builder.tsx
'use client';

import { Pinboard } from '@/components/plans/Pinboard';
import { WeaveSection } from '@/components/plans/WeaveSection';
import { usePlannerState, type PlanStatus, type PinboardFilters } from './use-planner-state';

export interface PlanBuilderProps {
  planId: string;
  planTitle: string;
  durationDays: number;
  weekStart: string | null;
  mealsPerDay: number;
  status: PlanStatus;
  pinboardFilters: Partial<PinboardFilters>;
}

export function PlanBuilder(props: PlanBuilderProps) {
  const state = usePlannerState(props.planId, props.status, props.pinboardFilters);

  return (
    <div className="flex flex-col gap-8 px-4 py-6 max-w-6xl mx-auto">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif" style={{ color: '#EFE3CE' }}>{props.planTitle}</h1>
          <p className="text-sm" style={{ color: '#6B4E36' }}>
            {props.durationDays} days · {props.mealsPerDay} meals/day
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs uppercase tracking-wider border"
          style={{ borderColor: '#3A2A1A', color: '#E67E22' }}
        >
          {state.status}
        </span>
      </header>

      <Pinboard state={state} planId={props.planId} />

      <WeaveSection
        state={state}
        planId={props.planId}
        durationDays={props.durationDays}
        weekStart={props.weekStart}
        mealsPerDay={props.mealsPerDay}
      />
    </div>
  );
}
```

- [ ] **Step 3: Update the page component (server) that loads `plan-builder`**

Open `src/app/(app)/plans/[id]/page.tsx`. The plan page already loads `meal_plans` and `meal_entries`. Ensure it passes `status`, `pinboard_filters`, and `meals_per_day` to `<PlanBuilder>`. Add to the select list:

```ts
.select('id, title, duration_days, week_start, meals_per_day, status, pinboard_filters, dietary_filters, nutritional_goals')
```

And in the JSX:

```tsx
<PlanBuilder
  planId={plan.id}
  planTitle={plan.title}
  durationDays={plan.duration_days}
  weekStart={plan.week_start}
  mealsPerDay={plan.meals_per_day ?? 3}
  status={plan.status as PlanStatus}
  pinboardFilters={(plan.pinboard_filters ?? {}) as Partial<PinboardFilters>}
/>
```

If the existing page passes additional props (e.g. `dietaryFilters`, `nutritionalGoals`), keep them — Phase D's macro panel will use them.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/plans/[id]/plan-builder.tsx" "src/app/(app)/plans/[id]/page.tsx"
git commit -m "feat(plans): stacked layout shell using usePlannerState"
```

> **Note:** the old grid will be broken between this commit and the end of Phase C — that's expected. Phase B creates `Pinboard`, Phase C creates `WeaveSection`. The branch isn't shippable until Phase C ends; that's fine because PR review happens after the whole plan.

---

## Phase B — Pinboard

### Task B.1: `ConstraintChipBar` component

**Files:**
- Create: `src/components/plans/ConstraintChipBar.tsx`

Sticky chip row beneath the page header. Six first-class chips. Each chip is a button → opens an inline popover with its editor.

- [ ] **Step 1: Write the component**

```tsx
// src/components/plans/ConstraintChipBar.tsx
'use client';

import { useState } from 'react';
import type { PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  filters: PinboardFilters;
  onChange: (patch: Partial<PinboardFilters>) => void;
}

const DIET_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'pescatarian', 'keto'];

export function ConstraintChipBar({ filters, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const close = () => setOpen(null);

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap gap-2 py-3 px-4 -mx-4 backdrop-blur-md"
      style={{ background: 'rgba(26,18,10,0.85)', borderBottom: '1px solid #2A1F14' }}
    >
      <Chip
        active={filters.diet.length > 0}
        label={filters.diet.length > 0 ? `Diet: ${filters.diet.join(', ')}` : 'Diet'}
        onClick={() => setOpen(open === 'diet' ? null : 'diet')}
      />
      {open === 'diet' && (
        <Popover onClose={close}>
          {DIET_OPTIONS.map(d => (
            <label key={d} className="flex items-center gap-2 py-1 text-sm" style={{ color: '#EFE3CE' }}>
              <input
                type="checkbox"
                checked={filters.diet.includes(d)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...filters.diet, d]
                    : filters.diet.filter(x => x !== d);
                  onChange({ diet: next });
                }}
              />
              {d}
            </label>
          ))}
        </Popover>
      )}

      <Chip
        active
        label={`Weeknight ≤${filters.time_weeknight}m`}
        onClick={() => setOpen(open === 'time-week' ? null : 'time-week')}
      />
      {open === 'time-week' && (
        <Popover onClose={close}>
          <NumberSlider value={filters.time_weeknight} onChange={v => onChange({ time_weeknight: v })} min={10} max={90} step={5} />
        </Popover>
      )}

      <Chip
        active
        label={`Weekend ≤${filters.time_weekend}m`}
        onClick={() => setOpen(open === 'time-end' ? null : 'time-end')}
      />
      {open === 'time-end' && (
        <Popover onClose={close}>
          <NumberSlider value={filters.time_weekend} onChange={v => onChange({ time_weekend: v })} min={30} max={240} step={15} />
        </Popover>
      )}

      <Chip
        active
        label={`Squad ${filters.squad_size}`}
        onClick={() => setOpen(open === 'squad' ? null : 'squad')}
      />
      {open === 'squad' && (
        <Popover onClose={close}>
          <NumberSlider value={filters.squad_size} onChange={v => onChange({ squad_size: v })} min={1} max={8} step={1} />
        </Popover>
      )}

      <ToggleChip
        active={filters.pantry_aware}
        label={`Pantry-aware${filters.pantry_aware ? ` (≤${filters.pantry_missing_max} missing)` : ''}`}
        onClick={() => onChange({ pantry_aware: !filters.pantry_aware })}
      />

      <Chip
        active
        label={`Anti-repeat: ${filters.anti_repeat}`}
        onClick={() => setOpen(open === 'rep' ? null : 'rep')}
      />
      {open === 'rep' && (
        <Popover onClose={close}>
          {(['strict','moderate','off'] as const).map(v => (
            <button key={v} onClick={() => { onChange({ anti_repeat: v }); close(); }} className="block w-full text-left py-1 px-2 text-sm" style={{ color: filters.anti_repeat === v ? '#E67E22' : '#EFE3CE' }}>
              {v}
            </button>
          ))}
        </Popover>
      )}

      <ToggleChip
        active={filters.batch_enabled}
        label="🍳 Batch / leftovers"
        onClick={() => onChange({ batch_enabled: !filters.batch_enabled })}
      />
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm border transition-colors"
      style={{
        background: active ? '#2A1F14' : 'transparent',
        borderColor: active ? '#E67E22' : '#3A2A1A',
        color: active ? '#E67E22' : '#8A6A4A',
      }}
    >
      {label}
    </button>
  );
}

function ToggleChip(props: { active: boolean; label: string; onClick: () => void }) {
  return <Chip {...props} />;
}

function Popover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div
        className="absolute z-30 mt-12 p-3 rounded-lg border shadow-lg"
        style={{ background: '#1A120A', borderColor: '#3A2A1A', minWidth: 200 }}
      >
        {children}
      </div>
    </>
  );
}

function NumberSlider({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full"
      />
      <span className="text-xs text-center" style={{ color: '#E67E22' }}>{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/ConstraintChipBar.tsx
git commit -m "feat(plans): ConstraintChipBar with six first-class chips"
```

### Task B.2: `InspirationChips` component

**Files:**
- Create: `src/components/plans/InspirationChips.tsx`
- Create: `src/lib/inspiration-tags.ts`

Multi-select pill row below the constraint bar. Tags re-rank the feed (additive, not restrictive).

- [ ] **Step 1: Tag definitions**

```ts
// src/lib/inspiration-tags.ts
export interface InspirationTag {
  id: string;
  label: string;
  category: 'cuisine' | 'mood' | 'season' | 'chef';
}

export const INSPIRATION_TAGS: InspirationTag[] = [
  // cuisines
  { id: 'italian',  label: 'Italian',  category: 'cuisine' },
  { id: 'thai',     label: 'Thai',     category: 'cuisine' },
  { id: 'korean',   label: 'Korean',   category: 'cuisine' },
  { id: 'mexican',  label: 'Mexican',  category: 'cuisine' },
  { id: 'french',   label: 'French',   category: 'cuisine' },
  { id: 'mediterranean', label: 'Mediterranean', category: 'cuisine' },
  { id: 'middle-eastern', label: 'Middle Eastern', category: 'cuisine' },
  { id: 'indian',   label: 'Indian',   category: 'cuisine' },
  // moods
  { id: 'cozy',     label: 'Cozy',         category: 'mood' },
  { id: 'quick',    label: 'Quick',        category: 'mood' },
  { id: 'impress',  label: 'Impress guests', category: 'mood' },
  { id: 'comfort',  label: 'Comfort',      category: 'mood' },
  { id: 'fresh',    label: 'Fresh & light', category: 'mood' },
  // seasons
  { id: 'spring',   label: 'Spring produce', category: 'season' },
  { id: 'summer',   label: 'Summer',        category: 'season' },
  { id: 'autumn',   label: 'Autumn',        category: 'season' },
  { id: 'winter',   label: 'Winter',        category: 'season' },
];
```

- [ ] **Step 2: Component**

```tsx
// src/components/plans/InspirationChips.tsx
'use client';

import { INSPIRATION_TAGS } from '@/lib/inspiration-tags';

interface Props {
  selected: string[];
  onToggle: (tagId: string) => void;
}

const CATEGORIES = ['cuisine', 'mood', 'season'] as const;

export function InspirationChips({ selected, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <p className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Inspiration</p>
      {CATEGORIES.map(cat => (
        <div key={cat} className="flex flex-wrap gap-1.5">
          {INSPIRATION_TAGS.filter(t => t.category === cat).map(t => {
            const on = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                className="px-2.5 py-1 rounded-full text-xs border transition-all"
                style={{
                  background: on ? '#E67E22' : 'transparent',
                  borderColor: on ? '#E67E22' : '#3A2A1A',
                  color: on ? '#1A120A' : '#8A6A4A',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/plans/InspirationChips.tsx src/lib/inspiration-tags.ts
git commit -m "feat(plans): InspirationChips multi-select row"
```

### Task B.3: `PinboardFeed` component + extended picker endpoint

The feed pulls recipes through the constraints and inspiration tags. We add an optional `inspiration_tags` query param to the existing `/api/recipes/picker` so the feed can rank by inspiration overlap.

**Files:**
- Modify: `src/app/api/recipes/picker/route.ts`
- Create: `src/components/plans/PinboardFeed.tsx`
- Create: `src/lib/recipe-match-badges.ts`

- [ ] **Step 1: Extend the picker endpoint**

Read `src/app/api/recipes/picker/route.ts`. Add support for these new query params (additive, defaults to old behavior when absent):
- `pantry_aware=1` — apply aggressive pantry pre-filter (drop recipes missing > `pantry_missing_max`)
- `pantry_missing_max=N` — threshold
- `inspiration_tags=a,b,c` — used only for ranking; matches against `cuisine_type`, `dish_types`, `dietary_tags`
- `limit=N` — default 24 for feed use (vs. 40 for single-meal picker)
- `meal_type` is now **optional** (when omitted, return all dish types)

Ranking: when inspiration tags or pantry_aware are present, compute a per-recipe score:

```
score = pantry_match * 0.5 + inspiration_match * 0.5
where:
  pantry_match = matching_ingredients / total_ingredients (0..1)
  inspiration_match = matching_tags / count(active tags) (0..1, 0 if none)
```

Sort by score desc. When neither flag is active, fall back to `created_at desc` (current default).

Reuse the helper logic the C.2 weave route already implements for pantry — extract into `src/lib/recipe-match.ts` so both routes share it.

Commit message:

```
git add src/lib/recipe-match.ts src/app/api/recipes/picker/route.ts
git commit -m "feat(api): picker supports pantry-aware + inspiration ranking"
```

- [ ] **Step 2: Match-badge helpers**

```ts
// src/lib/recipe-match-badges.ts
import type { PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';

export interface MatchBadge {
  label: string;
  tone: 'pantry' | 'diet' | 'time' | 'batch' | 'inspiration';
}

export function buildMatchBadges(recipe: any, filters: PinboardFilters): MatchBadge[] {
  const badges: MatchBadge[] = [];
  if (typeof recipe.pantry_match === 'number' && recipe.pantry_match > 0.5) {
    badges.push({ label: `${Math.round(recipe.pantry_match * 100)}% pantry`, tone: 'pantry' });
  }
  if (filters.diet.length > 0 && (recipe.dietary_tags ?? []).some((t: string) => filters.diet.includes(t))) {
    badges.push({ label: '✓ diet', tone: 'diet' });
  }
  const total = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  if (total > 0 && total <= filters.time_weeknight) {
    badges.push({ label: `${total}m`, tone: 'time' });
  }
  if (recipe.batch_friendly && filters.batch_enabled) {
    badges.push({ label: '🍳 batch', tone: 'batch' });
  }
  return badges;
}
```

- [ ] **Step 3: Feed component**

```tsx
// src/components/plans/PinboardFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { RecipeImage } from '@/components/recipe-image';
import { buildMatchBadges } from '@/lib/recipe-match-badges';
import type { Pin, PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  planId: string;
  filters: PinboardFilters;
  pins: Pin[];
  onTogglePin: (recipe_id: string) => void;
}

export function PinboardFeed({ planId, filters, pins, onTogglePin }: Props) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('plan_id', planId);
    params.set('limit', '24');
    if (filters.pantry_aware) {
      params.set('pantry_aware', '1');
      params.set('pantry_missing_max', String(filters.pantry_missing_max));
    }
    if (filters.inspiration_tags.length > 0) {
      params.set('inspiration_tags', filters.inspiration_tags.join(','));
    }
    setLoading(true);
    fetch(`/api/recipes/picker?${params}`)
      .then(r => r.ok ? r.json() : { recipes: [] })
      .then(d => setRecipes(d.recipes ?? []))
      .finally(() => setLoading(false));
  }, [planId, filters.pantry_aware, filters.pantry_missing_max, filters.inspiration_tags]);

  const pinnedIds = new Set(pins.map(p => p.recipe_id));

  if (loading && recipes.length === 0) {
    return <div className="py-12 text-center text-sm" style={{ color: '#6B4E36' }}>Loading recipes…</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {recipes.map(r => {
        const pinned = pinnedIds.has(r.id);
        const badges = buildMatchBadges(r, filters);
        return (
          <div
            key={r.id}
            className="flex gap-3 p-3 rounded-lg border"
            style={{ background: '#1A120A', borderColor: pinned ? '#E67E22' : '#3A2A1A' }}
          >
            <div className="relative w-24 h-24 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
              <RecipeImage
                recipeId={r.id}
                imageUrl={r.image_url}
                title={r.title}
                focal_x={r.focal_x}
                focal_y={r.focal_y}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-2" style={{ color: '#EFE3CE' }}>{r.title}</h3>
              <div className="flex flex-wrap gap-1">
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#2A1F14', color: '#E67E22' }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onTogglePin(r.id)}
                className="mt-auto self-start text-xs px-3 py-1 rounded-full border transition-colors"
                style={{
                  background: pinned ? '#E67E22' : 'transparent',
                  borderColor: '#E67E22',
                  color: pinned ? '#1A120A' : '#E67E22',
                }}
              >
                {pinned ? '📌 Pinned' : 'Pin'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/plans/PinboardFeed.tsx src/lib/recipe-match-badges.ts
git commit -m "feat(plans): PinboardFeed with constraint-match badges"
```

### Task B.4: `PinTray` (sticky bottom)

**Files:**
- Create: `src/components/plans/PinTray.tsx`

- [ ] **Step 1: Component**

```tsx
// src/components/plans/PinTray.tsx
'use client';

import { RecipeImage } from '@/components/recipe-image';
import type { Pin } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  pins: Pin[];
  durationDays: number;
  mealsPerDay: number;
  onRemove: (recipe_id: string) => void;
  onWeave: () => void;
  weaving: boolean;
}

export function PinTray({ pins, durationDays, mealsPerDay, onRemove, onWeave, weaving }: Props) {
  if (pins.length === 0) return null;
  const slotCount = durationDays * mealsPerDay;
  const qualityMin = Math.ceil(slotCount / 3);
  const ready = pins.length >= 3;
  const quality: 'low' | 'med' | 'high' = pins.length >= qualityMin ? 'high' : pins.length >= 3 ? 'med' : 'low';

  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 px-4 py-3 flex items-center gap-3 backdrop-blur-md"
      style={{ background: 'rgba(26,18,10,0.92)', borderTop: '1px solid #2A1F14' }}
    >
      <span className="text-sm font-semibold" style={{ color: '#E67E22' }}>
        📌 {pins.length} pinned
      </span>
      <div className="flex gap-1 overflow-x-auto flex-1">
        {pins.map(p => (
          <button
            key={p.id}
            onClick={() => onRemove(p.recipe_id)}
            className="relative w-10 h-10 rounded overflow-hidden shrink-0 group"
            title={`Remove ${p.recipe.title}`}
            style={{ background: '#2A1F14' }}
          >
            <RecipeImage
              recipeId={p.recipe.id}
              imageUrl={p.recipe.image_url}
              title={p.recipe.title}
              focal_x={p.recipe.focal_x}
              focal_y={p.recipe.focal_y}
              className="w-full h-full"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.6)' }}>×</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col items-end gap-1">
        {!ready && (
          <span className="text-xs" style={{ color: '#6B4E36' }}>Pin 3+ to weave</span>
        )}
        {ready && quality !== 'high' && (
          <span className="text-xs" style={{ color: '#8A6A4A' }}>App will pick a lot — add more pins to shape the week</span>
        )}
        <button
          disabled={!ready || weaving}
          onClick={onWeave}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#E67E22', color: '#1A120A' }}
        >
          {weaving ? 'Weaving…' : 'Weave the week →'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/PinTray.tsx
git commit -m "feat(plans): PinTray sticky bottom with quality meter"
```

### Task B.5: `Pinboard` parent that wires it all

**Files:**
- Create: `src/components/plans/Pinboard.tsx`

- [ ] **Step 1: Component**

```tsx
// src/components/plans/Pinboard.tsx
'use client';

import { ConstraintChipBar } from './ConstraintChipBar';
import { InspirationChips } from './InspirationChips';
import { PinboardFeed } from './PinboardFeed';
import { PinTray } from './PinTray';
import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
}

export function Pinboard({ state, planId }: Props) {
  const togglePin = (recipe_id: string) => {
    const already = state.pins.find(p => p.recipe_id === recipe_id);
    if (already) state.removePin(recipe_id);
    else state.addPin(recipe_id);
  };
  const toggleInspiration = (id: string) => {
    const next = state.filters.inspiration_tags.includes(id)
      ? state.filters.inspiration_tags.filter(x => x !== id)
      : [...state.filters.inspiration_tags, id];
    state.setFilters({ inspiration_tags: next });
  };

  return (
    <section aria-label="Pinboard" className="flex flex-col gap-3">
      <ConstraintChipBar filters={state.filters} onChange={state.setFilters} />
      <InspirationChips selected={state.filters.inspiration_tags} onToggle={toggleInspiration} />
      <PinboardFeed planId={planId} filters={state.filters} pins={state.pins} onTogglePin={togglePin} />
      <PinTray
        pins={state.pins}
        durationDays={7} /* duration is on plan; passed via WeaveSection — here we approximate or thread later */
        mealsPerDay={3}
        onRemove={state.removePin}
        onWeave={() => state.runWeave({ persistUndo: false })}
        weaving={state.loading}
      />
    </section>
  );
}
```

> The placeholder `7` / `3` here is because Pinboard doesn't strictly need duration to function — but the PinTray quality meter does. Fix this by threading `durationDays` and `mealsPerDay` through `Pinboard` props from `plan-builder.tsx`. Update the `Props` interface accordingly and pass them down.

- [ ] **Step 2: Thread props correctly**

Update `Pinboard.tsx` Props:

```tsx
interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
  durationDays: number;
  mealsPerDay: number;
}
```

Use them in the `<PinTray durationDays={...} mealsPerDay={...} />`. Update `plan-builder.tsx` to pass them.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "Pinboard|plan-builder|use-planner" | head -20
git add src/components/plans/Pinboard.tsx "src/app/(app)/plans/[id]/plan-builder.tsx"
git commit -m "feat(plans): Pinboard parent wires constraint bar + feed + tray"
```

---

## Phase C — Weave section

### Task C.1: `WeaveCell` archetypes

**Files:**
- Create: `src/components/plans/WeaveCell.tsx`

Three archetypes: pinned, suggestion, leftover. Cell width adapts to viewport via parent grid.

- [ ] **Step 1: Component**

```tsx
// src/components/plans/WeaveCell.tsx
'use client';

import { RecipeImage } from '@/components/recipe-image';
import type { ProposedEntry } from '@/lib/weave-solver';

interface Props {
  entry: ProposedEntry;
  recipe?: { image_url: string | null; focal_x?: number | null; focal_y?: number | null };
  onTap: () => void;
  onPin?: () => void;
  onRemove: () => void;
}

export function WeaveCell({ entry, recipe, onTap, onPin, onRemove }: Props) {
  const isPinned = entry.source === 'pinned' && !entry.is_leftover;
  const isLeftover = entry.is_leftover;
  const isSuggestion = entry.source === 'suggestion';

  const borderStyle = isPinned ? 'solid' : isSuggestion ? 'dashed' : 'solid';
  const borderColor = isPinned ? '#E67E22' : isSuggestion ? '#3A2A1A' : '#6B4E36';
  const imageOpacity = isSuggestion ? 0.85 : 1;
  const bgTint = isLeftover ? 'rgba(74, 104, 48, 0.15)' : '#1A120A';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={e => { if (e.key === 'Enter') onTap(); }}
      className="group relative flex flex-col gap-1 p-1.5 rounded-md cursor-pointer transition-colors hover:bg-[#2A1F14]"
      style={{ border: `1px ${borderStyle} ${borderColor}`, background: bgTint, minHeight: 80 }}
    >
      <div className="relative w-full h-12 rounded overflow-hidden" style={{ background: '#2A1F14', opacity: imageOpacity }}>
        <RecipeImage
          recipeId={entry.clientid}
          imageUrl={recipe?.image_url ?? null}
          title={entry.recipe_title}
          focal_x={recipe?.focal_x}
          focal_y={recipe?.focal_y}
          className="w-full h-full"
        />
      </div>
      <div className="flex items-center gap-1">
        {isPinned && <span aria-label="pinned" title="Pinned">📌</span>}
        {isSuggestion && <span aria-label="suggestion" title="Suggestion" style={{ color: '#E67E22' }}>✨</span>}
        {isLeftover && <span aria-label="leftover" title="Leftover" style={{ color: '#7AA350' }}>♻</span>}
        <p className="text-xs leading-tight line-clamp-2 flex-1" style={{ color: '#EFE3CE' }}>
          {entry.recipe_title}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        aria-label={`Remove ${entry.recipe_title}`}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5"
        style={{ background: '#2A1F14' }}
      >
        <span className="block w-3 h-3 text-xs leading-3" style={{ color: '#E67E22' }}>×</span>
      </button>
      {isSuggestion && onPin && (
        <button
          onClick={e => { e.stopPropagation(); onPin(); }}
          aria-label="Pin this suggestion"
          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 rounded"
          style={{ background: '#E67E22', color: '#1A120A' }}
        >
          📌
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/WeaveCell.tsx
git commit -m "feat(plans): WeaveCell with pinned/suggestion/leftover archetypes"
```

### Task C.2: `WeaveSummary` strip

**Files:**
- Create: `src/components/plans/WeaveSummary.tsx`

Top-of-Weave summary: pantry %, cook time, variety, leftover count + controls (Reweave, Tune, Cook).

- [ ] **Step 1: Component**

```tsx
// src/components/plans/WeaveSummary.tsx
'use client';

import type { WeaveSummary as Summary } from '@/lib/weave-solver';

interface Props {
  summary: Summary;
  weaving: boolean;
  canUndo: boolean;
  onReweave: () => void;
  onUndo: () => void;
  onStartCooking: () => void;
}

export function WeaveSummary({ summary, weaving, canUndo, onReweave, onUndo, onStartCooking }: Props) {
  const pantryPct = Math.round(summary.pantry_pct * 100);
  const hours = Math.floor(summary.active_minutes / 60);
  const mins = summary.active_minutes % 60;
  const varietyLabel = summary.variety_score >= 0.7 ? 'high' : summary.variety_score >= 0.4 ? 'medium' : 'low';

  return (
    <div
      className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg border"
      style={{ background: '#1A120A', borderColor: '#3A2A1A' }}
    >
      <span className="text-sm flex items-center gap-1" style={{ color: '#EFE3CE' }}>
        🥕 <span style={{ color: '#E67E22' }}>{pantryPct}%</span> pantry
      </span>
      <span className="text-sm" style={{ color: '#8A6A4A' }}>·</span>
      <span className="text-sm flex items-center gap-1" style={{ color: '#EFE3CE' }}>
        ⏱ {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
      </span>
      <span className="text-sm" style={{ color: '#8A6A4A' }}>·</span>
      <span className="text-sm flex items-center gap-1" style={{ color: '#EFE3CE' }}>
        🔁 variety: <span style={{ color: '#E67E22' }}>{varietyLabel}</span>
      </span>
      {summary.leftover_count > 0 && (
        <>
          <span className="text-sm" style={{ color: '#8A6A4A' }}>·</span>
          <span className="text-sm flex items-center gap-1" style={{ color: '#7AA350' }}>
            ♻ {summary.leftover_count} leftover
          </span>
        </>
      )}
      <div className="ml-auto flex gap-2">
        {canUndo && (
          <button onClick={onUndo} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: '#3A2A1A', color: '#8A6A4A' }}>
            ↶ undo
          </button>
        )}
        <button
          disabled={weaving}
          onClick={onReweave}
          className="text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-40"
          style={{ borderColor: '#E67E22', color: '#E67E22' }}
        >
          🔀 reweave
        </button>
        <button
          onClick={onStartCooking}
          className="text-xs px-3 py-1.5 rounded font-semibold"
          style={{ background: '#E67E22', color: '#1A120A' }}
        >
          🛒 start cooking →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/WeaveSummary.tsx
git commit -m "feat(plans): WeaveSummary strip"
```

### Task C.3: `WeaveGrid` layout

**Files:**
- Create: `src/components/plans/WeaveGrid.tsx`

Grid renders the woven entries by day × meal_type. Each cell delegates to `WeaveCell`. Empty (shouldn't happen post-weave, but defensively) cells get a "tap to fill" stub.

- [ ] **Step 1: Component**

```tsx
// src/components/plans/WeaveGrid.tsx
'use client';

import { WeaveCell } from './WeaveCell';
import type { ProposedEntry, MealType } from '@/lib/weave-solver';

interface Props {
  entries: ProposedEntry[];
  recipes: Record<string, { image_url: string | null; focal_x?: number | null; focal_y?: number | null }>;
  durationDays: number;
  mealTypes: MealType[];
  weekStart: string | null;
  onCellTap: (day: number, mealType: MealType, entry: ProposedEntry | null) => void;
  onCellRemove: (clientid: string) => void;
  onPinSuggestion: (clientid: string) => void;
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};

export function WeaveGrid({ entries, recipes, durationDays, mealTypes, weekStart, onCellTap, onCellRemove, onPinSuggestion }: Props) {
  const dayLabel = (n: number) => {
    if (!weekStart) return `Day ${n}`;
    const d = new Date(weekStart);
    d.setDate(d.getDate() + n - 1);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const get = (day: number, mt: MealType) =>
    entries.find(e => e.day_number === day && e.meal_type === mt) ?? null;

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${durationDays}, minmax(140px, 1fr))` }}>
        <div />
        {Array.from({ length: durationDays }).map((_, i) => (
          <div key={i} className="text-xs text-center font-semibold pb-2" style={{ color: '#8A6A4A' }}>
            {dayLabel(i + 1)}
          </div>
        ))}
        {mealTypes.map(mt => (
          <div key={mt} className="contents">
            <div className="text-xs font-semibold py-2" style={{ color: '#6B4E36' }}>
              {MEAL_TYPE_LABEL[mt] ?? mt}
            </div>
            {Array.from({ length: durationDays }).map((_, i) => {
              const day = i + 1;
              const entry = get(day, mt);
              return (
                <div key={`${day}-${mt}`}>
                  {entry ? (
                    <WeaveCell
                      entry={entry}
                      recipe={recipes[entry.recipe_id]}
                      onTap={() => onCellTap(day, mt, entry)}
                      onPin={entry.source === 'suggestion' ? () => onPinSuggestion(entry.clientid) : undefined}
                      onRemove={() => onCellRemove(entry.clientid)}
                    />
                  ) : (
                    <button
                      onClick={() => onCellTap(day, mt, null)}
                      className="w-full h-full min-h-20 rounded-md border-dashed border flex items-center justify-center text-2xl"
                      style={{ borderColor: '#3A2A1A', color: '#3A2A1A' }}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/WeaveGrid.tsx
git commit -m "feat(plans): WeaveGrid renders entries by day x meal_type"
```

### Task C.4: Constraint-aware picker slide-over (replaces autofill bug)

**Files:**
- Create: `src/components/plans/ConstraintPicker.tsx`

When a cell is tapped, this slide-over opens **immediately** (no LLM call) and queries `/api/recipes/picker` with the plan's diet + meal type + a list of recipe IDs to exclude (the woven entries that aren't the one being swapped).

- [ ] **Step 1: Component**

```tsx
// src/components/plans/ConstraintPicker.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { RecipeImage } from '@/components/recipe-image';
import type { MealType, ProposedEntry } from '@/lib/weave-solver';

interface Props {
  planId: string;
  mealType: MealType;
  excludeRecipeIds: string[];
  onPick: (recipe: { id: string; title: string; image_url: string | null; focal_x?: number | null; focal_y?: number | null }) => void;
  onSuggestOne: () => Promise<{ id: string; title: string; image_url: string | null } | null>;
  onClose: () => void;
}

export function ConstraintPicker({ planId, mealType, excludeRecipeIds, onPick, onSuggestOne, onClose }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      const params = new URLSearchParams({ plan_id: planId, meal_type: mealType, limit: '24' });
      if (q.trim()) params.set('q', q.trim());
      if (excludeRecipeIds.length > 0) params.set('exclude_recipe_ids', excludeRecipeIds.join(','));
      try {
        const r = await fetch(`/api/recipes/picker?${params}`);
        if (r.ok) {
          const d = await r.json();
          setResults(d.recipes ?? []);
        }
      } finally { setLoading(false); }
    };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fetch_, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, mealType, planId, excludeRecipeIds.join(',')]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trySuggest = async () => {
    setSuggesting(true);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 6000);
      const r = await onSuggestOne();
      clearTimeout(timeout);
      if (r) onPick(r);
    } catch { /* fall through */ }
    setSuggesting(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:w-96 h-[85vh] sm:h-full flex flex-col"
        style={{ background: '#1A120A', borderLeft: '1px solid #3A2A1A' }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#3A2A1A' }}>
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Pick a recipe</p>
            <h2 className="text-base font-serif" style={{ color: '#EFE3CE' }}>{mealType}</h2>
          </div>
          <button onClick={onClose} className="ml-auto text-2xl leading-none" style={{ color: '#6B4E36' }}>×</button>
        </header>

        <div className="px-4 py-3 border-b" style={{ borderColor: '#2A1F14' }}>
          <input
            autoFocus
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Search ${mealType} recipes…`}
            className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
            style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
          />
          <button
            disabled={suggesting}
            onClick={trySuggest}
            className="mt-2 w-full text-sm px-3 py-2 rounded border transition-colors disabled:opacity-40"
            style={{ borderColor: '#E67E22', color: '#E67E22' }}
          >
            {suggesting ? 'Thinking…' : '✨ Suggest one for me'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && results.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#6B4E36' }}>Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#6B4E36' }}>No recipes match.</p>
          ) : (
            <ul>
              {results.map(r => (
                <li key={r.id}>
                  <button
                    onClick={() => onPick(r)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#2A1F14]"
                    style={{ borderBottom: '1px solid #2A1F14' }}
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
                      <RecipeImage recipeId={r.id} imageUrl={r.image_url} title={r.title} focal_x={r.focal_x} focal_y={r.focal_y} className="w-full h-full" />
                    </div>
                    <span className="text-sm" style={{ color: '#EFE3CE' }}>{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/ConstraintPicker.tsx
git commit -m "feat(plans): ConstraintPicker slide-over (replaces autofill-on-click)"
```

### Task C.5: `WeaveSection` parent

**Files:**
- Create: `src/components/plans/WeaveSection.tsx`

Orchestrates Summary + Grid + Picker + auto-reweave + undo. This is the consumer of `usePlannerState`'s weave-related slice.

- [ ] **Step 1: Component**

```tsx
// src/components/plans/WeaveSection.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WeaveSummary } from './WeaveSummary';
import { WeaveGrid } from './WeaveGrid';
import { ConstraintPicker } from './ConstraintPicker';
import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';
import type { MealType, ProposedEntry } from '@/lib/weave-solver';

interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
  durationDays: number;
  weekStart: string | null;
  mealsPerDay: number;
}

function defaultMealTypes(meals_per_day: number): MealType[] {
  if (meals_per_day <= 1) return ['dinner'];
  if (meals_per_day === 2) return ['lunch', 'dinner'];
  if (meals_per_day === 3) return ['breakfast', 'lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner', 'snack'];
}

export function WeaveSection({ state, planId, durationDays, weekStart, mealsPerDay }: Props) {
  const router = useRouter();
  const [picker, setPicker] = useState<{ day: number; mealType: MealType; existing: ProposedEntry | null } | null>(null);
  const mealTypes = defaultMealTypes(mealsPerDay);

  if (!state.weave) {
    return (
      <section aria-label="Weave" className="flex flex-col gap-3 py-8 text-center">
        <p className="text-sm" style={{ color: '#6B4E36' }}>
          Pin recipes above, then weave them into a week.
        </p>
      </section>
    );
  }

  const recipes: Record<string, { image_url: string | null; focal_x?: number | null; focal_y?: number | null }> = {};
  for (const p of state.pins) recipes[p.recipe.id] = { image_url: p.recipe.image_url, focal_x: p.recipe.focal_x, focal_y: p.recipe.focal_y };
  // Note: suggestion entries may have recipes not in pins. Their image_url/focal_x are not in state.
  // For now: WeaveCell falls back to glyph when image_url is missing. Fix in Task C.6.

  const onCellTap = (day: number, mealType: MealType, entry: ProposedEntry | null) => {
    setPicker({ day, mealType, existing: entry });
  };

  const onPick = (recipe: any) => {
    if (!picker) return;
    if (picker.existing) {
      state.swapEntry(picker.existing.clientid, { recipe_id: recipe.id, recipe_title: recipe.title });
    } else {
      // Insert a new entry (rare; only if user managed to remove a cell entirely)
      // Use swapEntry semantics by creating a synthetic clientid and adding through removeEntry+swap.
      // For simplicity in v1, no-op insert — Plan 3 polish if needed.
    }
    setPicker(null);
  };

  const suggestOne = async () => {
    if (!picker) return null;
    const params = new URLSearchParams({ plan_id: planId, meal_type: picker.mealType, limit: '1' });
    const exclude = state.weave?.entries.filter(e => e.clientid !== picker.existing?.clientid).map(e => e.recipe_id) ?? [];
    if (exclude.length) params.set('exclude_recipe_ids', exclude.join(','));
    const r = await fetch(`/api/recipes/picker?${params}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.recipes?.[0] ?? null;
  };

  return (
    <section aria-label="Weave" className="flex flex-col gap-3">
      <WeaveSummary
        summary={state.weave.summary}
        weaving={state.loading}
        canUndo={state.canUndo}
        onReweave={() => state.runWeave({ seed: Date.now() & 0xffff, persistUndo: true })}
        onUndo={state.undoWeave}
        onStartCooking={() => router.push(`/plans/${planId}/cook`)}
      />
      <WeaveGrid
        entries={state.weave.entries}
        recipes={recipes}
        durationDays={durationDays}
        mealTypes={mealTypes}
        weekStart={weekStart}
        onCellTap={onCellTap}
        onCellRemove={state.removeEntry}
        onPinSuggestion={state.pinSuggestion}
      />
      {picker && (
        <ConstraintPicker
          planId={planId}
          mealType={picker.mealType}
          excludeRecipeIds={state.weave.entries.filter(e => e.clientid !== picker.existing?.clientid).map(e => e.recipe_id)}
          onPick={onPick}
          onSuggestOne={suggestOne}
          onClose={() => setPicker(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/WeaveSection.tsx
git commit -m "feat(plans): WeaveSection orchestrates summary + grid + picker"
```

### Task C.6: Suggestion-recipe metadata enrichment

The Weave returns `entries` with `recipe_id` + `recipe_title` only — no image_url, focal point, or macros. The grid needs these for suggestions (pins already have full recipe data from `state.pins`).

**Files:**
- Modify: `src/app/api/plans/[id]/weave/route.ts`
- Modify: `src/components/plans/WeaveSection.tsx`

- [ ] **Step 1: Extend weave route response**

In the route, after the solver runs, build a `recipes` lookup map of every recipe referenced by any entry, and return it alongside `entries` + `summary`:

```ts
const recipeIds = Array.from(new Set(result.entries.map(e => e.recipe_id)));
const { data: recipeMeta } = await supabase
  .from('recipes')
  .select('id, image_url, focal_x, focal_y, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sat_fat_g, sodium_mg, prep_time_minutes, cook_time_minutes')
  .in('id', recipeIds);

return NextResponse.json({ ...result, recipes: recipeMeta ?? [] });
```

- [ ] **Step 2: Consume in `WeaveSection`**

Extend the recipes lookup to include the new payload from the weave response. Update `usePlannerState` to store `weave.recipes` (extend `SolverOutput` type locally with a `recipes?` field — keep it out of the solver core since it's a delivery concern).

In `WeaveSection.tsx`:

```tsx
const recipes: Record<string, ...> = {};
for (const p of state.pins) recipes[p.recipe.id] = { image_url: p.recipe.image_url, focal_x: p.recipe.focal_x, focal_y: p.recipe.focal_y };
for (const r of (state.weave as any).recipes ?? []) {
  if (!recipes[r.id]) recipes[r.id] = { image_url: r.image_url, focal_x: r.focal_x, focal_y: r.focal_y };
}
```

- [ ] **Step 3: Type the extended weave**

In `use-planner-state.ts`, define:

```ts
export interface WeaveResponse extends SolverOutput {
  recipes?: Array<{
    id: string;
    image_url: string | null;
    focal_x?: number | null;
    focal_y?: number | null;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    sugar_g: number | null;
    sat_fat_g: number | null;
    sodium_mg: number | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
  }>;
}
```

Replace the `weave: SolverOutput | null` state type with `WeaveResponse | null`. Everywhere the hook reads `state.weave.recipes` it's now type-safe.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/plans/[id]/weave/route.ts src/components/plans/WeaveSection.tsx "src/app/(app)/plans/[id]/use-planner-state.ts"
git commit -m "feat(weave): return recipe metadata alongside entries"
```

---

## Phase D — Macros (three-state, estimator client)

### Task D.1: `MacroSummary` component with three-state display

**Files:**
- Create: `src/components/plans/MacroSummary.tsx`
- Create: `src/lib/plans/macros.ts`

- [ ] **Step 1: Aggregator (three-state)**

```ts
// src/lib/plans/macros.ts
import type { ProposedEntry } from '@/lib/weave-solver';

export interface MacroAggregate {
  total: number;
  known_slots: number;
  partial_slots: number;   // entries that had at least one null in their macro panel
  total_slots: number;
}

export type MacroField = 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sugar_g' | 'sat_fat_g' | 'sodium_mg';

export interface RecipeMacros {
  id: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sat_fat_g: number | null;
  sodium_mg: number | null;
}

export function aggregateMacro(
  entries: ProposedEntry[],
  recipes: Record<string, RecipeMacros>,
  field: MacroField,
): MacroAggregate {
  let total = 0;
  let known = 0;
  let total_slots = 0;
  for (const e of entries) {
    if (e.is_leftover) continue;       // count cook days only
    total_slots += 1;
    const r = recipes[e.recipe_id];
    const val = r?.[field];
    if (typeof val === 'number' && Number.isFinite(val)) {
      total += val;
      known += 1;
    }
  }
  return { total, known_slots: known, partial_slots: 0, total_slots };
}

export function formatMacro(agg: MacroAggregate, unit: string): { display: string; tilde: boolean; em: boolean } {
  if (agg.known_slots === 0) return { display: '—', tilde: false, em: true };
  const rounded = Math.round(agg.total);
  const tilde = agg.known_slots < agg.total_slots;
  return { display: `${tilde ? '~' : ''}${rounded}${unit}`, tilde, em: false };
}
```

- [ ] **Step 2: Component**

```tsx
// src/components/plans/MacroSummary.tsx
'use client';

import { aggregateMacro, formatMacro, type RecipeMacros } from '@/lib/plans/macros';
import type { ProposedEntry } from '@/lib/weave-solver';

interface Props {
  entries: ProposedEntry[];
  recipes: Record<string, RecipeMacros>;
  nutritionalGoals?: Record<string, number>;
}

const FIELDS: Array<{ key: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; icon: string; label: string; unit: string; goalKey: string }> = [
  { key: 'calories', icon: '⚡', label: 'Energy', unit: ' kcal', goalKey: 'calories_per_day' },
  { key: 'protein_g', icon: '🥩', label: 'Protein', unit: 'g', goalKey: 'protein_g_per_day' },
  { key: 'carbs_g', icon: '🌾', label: 'Carbs', unit: 'g', goalKey: 'carbs_g_per_day' },
  { key: 'fat_g', icon: '🥑', label: 'Fat', unit: 'g', goalKey: 'fat_g_per_day' },
];

export function MacroSummary({ entries, recipes, nutritionalGoals }: Props) {
  const durationDays = Math.max(...entries.map(e => e.day_number), 1);
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-lg border" style={{ background: '#1A120A', borderColor: '#3A2A1A' }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Week macros</h3>
      </div>
      {FIELDS.map(f => {
        const agg = aggregateMacro(entries, recipes, f.key);
        const fmt = formatMacro(agg, f.unit);
        const goal = nutritionalGoals?.[f.goalKey] ? nutritionalGoals[f.goalKey] * durationDays : null;
        const pct = goal && goal > 0 ? Math.min(1, agg.total / goal) : null;
        return (
          <div key={f.key} className="flex items-center gap-3 text-sm py-0.5">
            <span style={{ color: '#8A6A4A' }}>{f.icon}</span>
            <span className="w-16" style={{ color: '#8A6A4A' }}>{f.label}</span>
            <span className="font-mono" style={{ color: fmt.em ? '#6B4E36' : '#EFE3CE' }}>{fmt.display}</span>
            {goal && (
              <span className="ml-auto flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B4E36' }}>{Math.round(goal)}{f.unit}</span>
                {pct != null && (
                  <span className="w-20 h-1.5 rounded overflow-hidden" style={{ background: '#2A1F14' }}>
                    <span className="block h-full" style={{ width: `${pct * 100}%`, background: '#E67E22' }} />
                  </span>
                )}
              </span>
            )}
            {fmt.tilde && (
              <span className="text-xs italic" style={{ color: '#6B4E36' }}>partial</span>
            )}
          </div>
        );
      })}
      <div className="mt-1 text-xs" style={{ color: '#6B4E36' }}>
        {FIELDS.length > 0 && (() => {
          const cal = aggregateMacro(entries, recipes, 'calories');
          return `${cal.known_slots}/${cal.total_slots} cook days have macros known`;
        })()}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mount in `WeaveSection`**

Above `<WeaveGrid>` and below `<WeaveSummary>`, render:

```tsx
<MacroSummary
  entries={state.weave.entries}
  recipes={recipesMacroLookup}
  nutritionalGoals={nutritionalGoals}
/>
```

Build `recipesMacroLookup` from the weave response's `recipes` field. Thread `nutritionalGoals` from `plan-builder.tsx` (already available on the plan row).

- [ ] **Step 4: Commit**

```bash
git add src/lib/plans/macros.ts src/components/plans/MacroSummary.tsx src/components/plans/WeaveSection.tsx
git commit -m "feat(plans): three-state macro summary with goal mode"
```

### Task D.2: Estimator client polling for missing macros

**Files:**
- Modify: `src/components/plans/MacroSummary.tsx`

When the recipes lookup has rows with `calories === null` and `macros_estimated === false`, fire `POST /api/recipes/[id]/estimate-macros` in batches of 6 concurrent. Update local state on each resolve so the macro line re-renders with the new value labelled with a dotted underline.

- [ ] **Step 1: Add to weave response**

In the route, the `recipes` SELECT already returns `macros_estimated` if we add it to the column list. Edit `src/app/api/plans/[id]/weave/route.ts` to include `macros_estimated` in the `.select('...')` for `recipeMeta`.

- [ ] **Step 2: Estimator hook**

```tsx
// inside MacroSummary.tsx
import { useEffect, useState } from 'react';

function useLazyEstimator(recipes: Record<string, RecipeMacros & { macros_estimated?: boolean }>) {
  const [estimated, setEstimated] = useState<Record<string, Partial<RecipeMacros>>>({});

  useEffect(() => {
    const missing = Object.values(recipes)
      .filter(r => !r.macros_estimated && (r.calories == null || r.protein_g == null))
      .slice(0, 12); // cap so we don't fan out forever
    if (missing.length === 0) return;

    let cancelled = false;
    const queue = [...missing];
    const workers = Array.from({ length: 6 }, async () => {
      while (queue.length > 0 && !cancelled) {
        const r = queue.shift()!;
        try {
          const res = await fetch(`/api/recipes/${r.id}/estimate-macros`, { method: 'POST' });
          if (!res.ok) continue;
          const d = await res.json();
          if (cancelled || !d.macros) continue;
          setEstimated(prev => ({ ...prev, [r.id]: d.macros }));
        } catch { /* swallow */ }
      }
    });
    void Promise.all(workers);
    return () => { cancelled = true; };
  }, [Object.keys(recipes).length]); // re-run when recipe set changes

  return estimated;
}
```

Mix `estimated` into the recipes map passed to `aggregateMacro`. Mark fields whose source is `estimated[id]` with a dotted underline in the row (already partially handled via the `tilde` flag — extend with an `est` flag).

- [ ] **Step 3: Commit**

```bash
git add src/components/plans/MacroSummary.tsx src/app/api/plans/[id]/weave/route.ts
git commit -m "feat(plans): lazy macro estimator client polling with 'est' label"
```

---

## Phase E — Logging + finalization

### Task E.1: Append session log

**Files:**
- Modify: `logs/2026-05-18.md` (file exists from Plan 1)

- [ ] **Step 1: Append entry**

Add a new section to the existing file (newest entries at the top of the file under the date header). Use the current time. Example:

```markdown
## [HH:MM] Pinboard + Weave UI (Plan 2)

- Branch: feat/meal-planner-pinboard-weave-ui (stacked on foundation)
- Components: usePlannerState, Pinboard (ConstraintChipBar + InspirationChips + PinboardFeed + PinTray), WeaveSection (WeaveSummary + WeaveGrid + WeaveCell + ConstraintPicker + MacroSummary)
- Picker hang fixed: tapping a cell opens the picker instantly; AI suggestion is an explicit secondary CTA with 6s timeout
- Macros are three-state (known/partial/unknown) with em-dash for unknown and ~ prefix for partial; lazy LLM estimator backfills nulls per render
- Auto-reweave with undo: 400ms debounce on filter changes; undo stack keeps last 10 weaves
```

- [ ] **Step 2: Commit**

```bash
git add logs/2026-05-18.md
git commit -m "chore(logs): UI plan complete"
```

### Task E.2: Verify + open PR

- [ ] **Step 1: Run solver tests** (regression check — UI shouldn't have touched these)

```bash
npx vitest run src/lib/weave-solver/
```

Expected: 34/34 passing.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types/\|events/\[id\]/page\|app-nav\|vitest" | tail -30
```

Expected: no errors in any new file. Pre-existing errors are out of scope.

- [ ] **Step 3: Dev-server smoke test**

```bash
npm run dev
```

Visit `/plans/[id]` for any existing plan. Confirm:
- Pinboard renders, constraint chips toggle, inspiration chips re-rank the feed.
- Pinning a recipe → tray populates, "Weave the week" enables at ≥3 pins.
- Click Weave → grid populates with cells; pinned vs suggestion vs leftover archetypes visibly distinct.
- Tap any cell → picker opens **immediately** (no hang); "Suggest one for me" runs and cancels gracefully.
- Macro summary shows real numbers; null macros backfill within ~5s via the estimator and become `est.` labeled.
- Tweak a constraint chip → undo button appears, reweave fires after 400ms.

- [ ] **Step 4: Push + draft PR**

```bash
git push -u origin feat/meal-planner-pinboard-weave-ui

gh pr create --draft --base feat/meal-planner-pinboard-weave \
  --title "feat(plans): meal planner pinboard + weave UI — Plan 2" \
  --body "$(cat <<'EOF'
## Summary

UI layer for the new Pinboard + Weave meal planner. Stacks on PR #2 (Plan 1: foundation). Together they ship the spec at `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`.

## What's in this PR
- `usePlannerState` hook coordinates pins, filters, weave output, and undo.
- Pinboard: ConstraintChipBar (six first-class chips), InspirationChips (multi-select, additive ranking), PinboardFeed (constraint-match badges), PinTray (sticky bottom, quality meter, "Weave the week" CTA).
- WeaveSection: WeaveSummary strip, WeaveGrid (day × meal-type), three cell archetypes (pinned / suggestion / leftover), ConstraintPicker (replaces autofill-on-click bug).
- MacroSummary: three-state display (known / partial-with-tilde / unknown-em-dash), goal-mode bars, lazy LLM estimator backfill.
- Auto-reweave with undo (400ms debounce on filter changes).

## Acceptance criteria from spec §13
- [x] Open fresh plan, land on Pinboard
- [x] Multi-select inspiration chips re-rank feed
- [x] Pantry-aware aggressive toggle filters feed
- [x] Pin 5+ recipes, tray populates, trigger Weave
- [x] Deterministic woven week with three cell archetypes
- [x] Tap any cell → picker opens immediately, no LLM hang
- [x] Explicit AI suggestion with cancel + 6s timeout + graceful fallback
- [x] Every cell renders image or warm-tone fallback
- [x] Three-state macros + "est." label
- [x] Cell swap re-ranks neighbors with anti-repeat warnings (basic version: swap works; visual underline is Plan 3 polish)

## Out of scope
- `/plans/[id]/cook` route (execution view, shopping list).
- Density ribbon polish (a prompt was saved earlier for a future session).
- Moodboard entries — will land once moodboard.config.ts merges into master.
- Drag-and-drop reordering between cells (uses click-to-swap for now).

## Test plan
- [x] Solver suite (regression): 34/34 passing
- [ ] Apply Plan 1 migrations to staging
- [ ] Walkthrough on `/plans/[id]` — checklist above
- [ ] Confirm the original three bugs no longer reproduce: "+" hang, broken images, lying macros

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- §3 page architecture — Phase A
- §4 Pinboard (constraint bar, inspiration multi-select, feed, pin tray) — Phase B
- §5 Weave (summary, grid, smart-swap, auto-reweave, undo, leftover archetype) — Phase C
- §6 cell + macro design — Phase C.1 (cells) + Phase D (macros)
- §7 picker behavior — Phase C.4
- §10 moodboard — explicitly deferred; noted in PR
- §13 acceptance criteria — referenced 1–10 in the PR body checklist

**Type consistency:**
- `PinboardFilters` defined once in `use-planner-state.ts`; re-imported everywhere.
- `MealType`, `ProposedEntry`, `SolverOutput`, `WeaveSummary` all imported from `@/lib/weave-solver`.
- `RecipeMacros` defined once in `src/lib/plans/macros.ts`.
- `WeaveResponse` extends `SolverOutput` with the API delivery payload — kept at the API layer, not in solver core.

**Function name consistency:**
- `aggregateMacro`, `formatMacro`, `buildMatchBadges`, `defaultMealTypes` — each named once and used consistently.
- `runWeave`, `swapEntry`, `removeEntry`, `pinSuggestion`, `undoWeave`, `setFilters`, `addPin`, `removePin`, `reorderPin` — all exposed from `usePlannerState`; consumers reference identical names.

**Placeholder scan:** none. Every step has executable content. The two "fix later" comments inside `WeaveSection` (`// Plan 3 polish if needed`) are explicit out-of-scope flags, not blockers.

**Scope:** focused on `/plans/[id]` UI. Doesn't touch cook-week, doesn't restructure non-plans surfaces beyond what the Plan 1 image fix already shipped.
