# Meal Planner Pinboard + Weave — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend foundation for the Pinboard + Weave meal planner — database changes, the deterministic Weave solver (pure library, fully unit-tested), all new API routes, the recipe-image rendering fix, and the display-time macro estimator endpoint. Plan 2 (UI layer) consumes this as a stable contract.

**Architecture:** Additive Supabase migrations on top of existing `meal_plans` and `meal_entries`; new `meal_plan_pins` table; pure `weave-solver` TS module under `src/lib/`; Next.js App Router API routes; single shared `<RecipeImage>` component updated to consume `focal_x` / `focal_y` from the recently-added migration.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (Postgres + RLS) · Vitest for solver unit tests · `@ai-sdk` (via existing Vercel AI integration) for macro estimation · LLM-as-judge not needed (solver is deterministic).

**Spec:** `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`

**Schema name mapping (spec → actual):**

| Spec name | Actual table |
|---|---|
| `plans` | `meal_plans` |
| `plan_entries` | `meal_entries` |
| `plan_pins` | `meal_plan_pins` (new) |

---

## Phase 0 — Branch setup

### Task 0.1: Create feature branch

**Files:** none

- [ ] **Step 1: Create branch from master**

```bash
cd "C:/Users/lasse/Desktop/whatscooking"
git fetch origin
git checkout -b feat/meal-planner-pinboard-weave origin/master
```

Expected: switched to new branch tracking origin/master.

- [ ] **Step 2: Verify clean state**

```bash
git status
```

Expected: clean working tree, branch `feat/meal-planner-pinboard-weave`.

---

## Phase A — Database migrations

Migrations live in `supabase/migrations/`. File naming follows the existing convention `YYYYMMDD_short_name.sql` (today is 2026-05-18; suffix with letter if collision).

### Task A.1: Migration — `meal_plans` adds Pinboard state

**Files:**
- Create: `supabase/migrations/20260518e_meal_plan_pinboard.sql`

- [ ] **Step 1: Write migration**

```sql
-- ============================================================
-- Meal plan Pinboard state
-- Adds: extended status enum, pinboard filter state, last-woven timestamp
-- ============================================================

alter table public.meal_plans
  drop constraint if exists meal_plans_status_check;

alter table public.meal_plans
  add constraint meal_plans_status_check
    check (status in ('planning','active','completed','woven','cooking','archived'));

alter table public.meal_plans
  add column if not exists pinboard_filters jsonb not null default '{}'::jsonb,
  add column if not exists last_woven_at    timestamptz;

comment on column public.meal_plans.pinboard_filters is
  'Last-used Pinboard chip state. Shape: { diet: text[], time_weeknight: int, time_weekend: int, squad_size: int, pantry_aware: bool, anti_repeat: text, batch_enabled: bool, inspiration_tags: text[] }';
comment on column public.meal_plans.last_woven_at is
  'When the Weave solver last produced suggestions for this plan.';
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db reset --linked=false 2>&1 | tail -5
```

OR (if not using reset workflow):

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260518e_meal_plan_pinboard.sql
```

Expected: no errors. The status enum now includes `woven`, `cooking`, `archived`.

- [ ] **Step 3: Verify columns**

```bash
psql "$SUPABASE_DB_URL" -c "\d public.meal_plans"
```

Expected: `pinboard_filters jsonb` and `last_woven_at timestamptz` present.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518e_meal_plan_pinboard.sql
git commit -m "feat(db): extend meal_plans with pinboard state + woven status"
```

### Task A.2: Migration — `meal_plan_pins` table

**Files:**
- Create: `supabase/migrations/20260518f_meal_plan_pins.sql`

- [ ] **Step 1: Write migration**

```sql
-- ============================================================
-- meal_plan_pins
-- Recipes a user has pinned to a plan during the Pinboard browse phase.
-- ============================================================

create table if not exists public.meal_plan_pins (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  recipe_id    uuid not null references public.recipes(id) on delete cascade,
  pinned_at    timestamptz not null default now(),
  priority     int not null default 0,
  unique (meal_plan_id, recipe_id)
);

create index if not exists meal_plan_pins_meal_plan_id_idx
  on public.meal_plan_pins(meal_plan_id);

alter table public.meal_plan_pins enable row level security;

drop policy if exists "Pin owners can do anything" on public.meal_plan_pins;
create policy "Pin owners can do anything"
  on public.meal_plan_pins for all
  using (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_pins.meal_plan_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_pins.meal_plan_id
        and p.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260518f_meal_plan_pins.sql
```

Expected: no errors.

- [ ] **Step 3: Verify**

```bash
psql "$SUPABASE_DB_URL" -c "\d public.meal_plan_pins"
```

Expected: 5 columns, unique constraint on (meal_plan_id, recipe_id), RLS enabled.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518f_meal_plan_pins.sql
git commit -m "feat(db): add meal_plan_pins table with owner-scoped RLS"
```

### Task A.3: Migration — `meal_entries` Weave columns

**Files:**
- Create: `supabase/migrations/20260518g_meal_entries_weave.sql`

- [ ] **Step 1: Write migration**

```sql
-- ============================================================
-- meal_entries Weave columns
-- source: how this entry got onto the plan (pinned/suggestion/leftover/manual)
-- parent_clientid: for leftover entries, the clientid of the cook-day entry
-- locked: whether reweave can replace this cell
-- ============================================================

alter table public.meal_entries
  add column if not exists source           text not null default 'manual',
  add column if not exists parent_clientid  uuid,
  add column if not exists locked           boolean not null default false;

alter table public.meal_entries
  drop constraint if exists meal_entries_source_check;

alter table public.meal_entries
  add constraint meal_entries_source_check
    check (source in ('pinned','suggestion','leftover','manual'));

comment on column public.meal_entries.source is
  'How this entry got placed: pinned = explicit user pin; suggestion = solver-filled; leftover = derived from a pinned batch-friendly cook day; manual = legacy or direct edit.';
comment on column public.meal_entries.parent_clientid is
  'For source=leftover: the clientid of the parent cook-day entry. Removing the leftover restores the parent''s active cook time.';
comment on column public.meal_entries.locked is
  'When true, the Weave solver will not replace this entry during reweave.';
```

- [ ] **Step 2: Apply, verify, commit**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260518g_meal_entries_weave.sql
psql "$SUPABASE_DB_URL" -c "\d public.meal_entries"
git add supabase/migrations/20260518g_meal_entries_weave.sql
git commit -m "feat(db): add source/parent_clientid/locked to meal_entries"
```

Expected verify: three new columns visible; check constraint enforces enum.

### Task A.4: Migration — `recipes` macro estimator + batch flag

**Files:**
- Create: `supabase/migrations/20260518h_recipes_macros_batch.sql`

Note: `fiber_g`, `sugar_g`, `sodium_mg` already exist on `recipes`. Only `sat_fat_g`, estimator metadata, and `batch_friendly` are new.

- [ ] **Step 1: Write migration**

```sql
-- ============================================================
-- Recipes: macro estimator metadata + batch-friendly flag
-- ============================================================

alter table public.recipes
  add column if not exists sat_fat_g           numeric,
  add column if not exists macros_estimated    boolean not null default false,
  add column if not exists macros_estimated_at timestamptz,
  add column if not exists estimator_version   text,
  add column if not exists batch_friendly      boolean not null default false;

comment on column public.recipes.macros_estimated is
  'True when macro fields were filled by the display-time LLM estimator (vs. source data).';
comment on column public.recipes.estimator_version is
  'Version tag of the estimator prompt; allows mass invalidation on prompt change.';
comment on column public.recipes.batch_friendly is
  'Recipe scales well for cook-once-eat-twice. Used by the Weave solver to plan leftover days.';
```

- [ ] **Step 2: Apply, verify, commit**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260518h_recipes_macros_batch.sql
psql "$SUPABASE_DB_URL" -c "\d public.recipes" | grep -E "sat_fat_g|macros_estimated|estimator_version|batch_friendly"
git add supabase/migrations/20260518h_recipes_macros_batch.sql
git commit -m "feat(db): add macro estimator metadata + batch_friendly to recipes"
```

Expected verify: all five columns listed.

---

## Phase B — Weave solver (pure library, fully tested)

The solver is a pure TypeScript module — no I/O, no side effects. Given pins + a recipe pool + constraints + plan duration, it returns proposed entries and a summary. Server API routes call it. Unit tests pin its behavior.

### Task B.1: Solver types module

**Files:**
- Create: `src/lib/weave-solver/types.ts`

- [ ] **Step 1: Write the types module**

```ts
// src/lib/weave-solver/types.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type EntrySource = 'pinned' | 'suggestion' | 'leftover' | 'manual';
export type AntiRepeatStrength = 'strict' | 'moderate' | 'off';

export interface SolverRecipe {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[];
  dish_types: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  batch_friendly: boolean;
  // Pre-computed pantry coverage 0..1, supplied by caller
  pantry_match: number;
  // Inspiration chip overlap 0..1, supplied by caller
  inspiration_match: number;
}

export interface SolverConstraints {
  diet: string[];                  // required dietary tags
  time_weeknight_max: number;      // minutes
  time_weekend_max: number;        // minutes
  squad_size: number;
  pantry_aware: boolean;
  pantry_missing_max: number;      // when pantry_aware, drop recipes missing > this many ingredients
  anti_repeat: AntiRepeatStrength;
  batch_enabled: boolean;
  meal_types: MealType[];
}

export interface SolverInput {
  duration_days: number;
  week_start: string | null;       // ISO date or null (used to determine which days are weekend)
  pins: SolverRecipe[];            // ordered by priority desc
  pool: SolverRecipe[];            // candidate suggestions (pre-filtered by diet + pantry aggressive)
  constraints: SolverConstraints;
  seed: number;                    // 0 = deterministic; nonzero = randomized variant
}

export interface ProposedEntry {
  clientid: string;
  day_number: number;
  meal_type: MealType;
  recipe_id: string;
  recipe_title: string;
  source: EntrySource;
  parent_clientid: string | null;
  locked: boolean;
  position: number;
}

export interface WeaveSummary {
  pantry_pct: number;              // 0..1
  active_minutes: number;
  variety_score: number;           // 0..1 (higher = more variety)
  leftover_count: number;
  slots_total: number;
  slots_filled: number;
}

export interface SolverOutput {
  entries: ProposedEntry[];
  summary: WeaveSummary;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/weave-solver/types.ts
git commit -m "feat(weave): solver types"
```

### Task B.2: Slot model + day-shape helper

**Files:**
- Create: `src/lib/weave-solver/slots.ts`
- Create: `src/lib/weave-solver/__tests__/slots.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/slots.test.ts
import { describe, it, expect } from 'vitest';
import { buildSlots, isWeekend, dayBudget } from '../slots';

describe('buildSlots', () => {
  it('produces day × meal_type cross product', () => {
    const slots = buildSlots({
      duration_days: 3,
      meal_types: ['breakfast', 'dinner'],
      week_start: null,
    });
    expect(slots).toHaveLength(6);
    expect(slots[0]).toEqual({ day_number: 1, meal_type: 'breakfast', is_weekend: false });
    expect(slots[5]).toEqual({ day_number: 3, meal_type: 'dinner', is_weekend: false });
  });

  it('marks Sat/Sun as weekend when week_start is a Monday', () => {
    const slots = buildSlots({
      duration_days: 7,
      meal_types: ['dinner'],
      week_start: '2026-05-18', // Monday
    });
    expect(slots.map(s => s.is_weekend)).toEqual([false,false,false,false,false,true,true]);
  });
});

describe('isWeekend', () => {
  it('returns true for Sat/Sun', () => {
    expect(isWeekend(new Date('2026-05-23'))).toBe(true); // Sat
    expect(isWeekend(new Date('2026-05-24'))).toBe(true); // Sun
    expect(isWeekend(new Date('2026-05-19'))).toBe(false); // Tue
  });
});

describe('dayBudget', () => {
  it('returns weekend_max on weekends', () => {
    expect(dayBudget(true, { time_weeknight_max: 30, time_weekend_max: 120 } as any)).toBe(120);
  });
  it('returns weeknight_max otherwise', () => {
    expect(dayBudget(false, { time_weeknight_max: 30, time_weekend_max: 120 } as any)).toBe(30);
  });
});
```

- [ ] **Step 2: Run and confirm fail**

```bash
npx vitest run src/lib/weave-solver/__tests__/slots.test.ts
```

Expected: module not found / functions undefined.

- [ ] **Step 3: Implement `slots.ts`**

```ts
// src/lib/weave-solver/slots.ts
import type { MealType, SolverConstraints } from './types';

export interface Slot {
  day_number: number;
  meal_type: MealType;
  is_weekend: boolean;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

export function buildSlots(input: {
  duration_days: number;
  meal_types: MealType[];
  week_start: string | null;
}): Slot[] {
  const baseDate = input.week_start ? new Date(input.week_start) : null;
  const slots: Slot[] = [];
  for (let day = 1; day <= input.duration_days; day++) {
    let weekend = false;
    if (baseDate) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + day - 1);
      weekend = isWeekend(d);
    }
    for (const mt of input.meal_types) {
      slots.push({ day_number: day, meal_type: mt, is_weekend: weekend });
    }
  }
  return slots;
}

export function dayBudget(is_weekend: boolean, c: Pick<SolverConstraints, 'time_weeknight_max' | 'time_weekend_max'>): number {
  return is_weekend ? c.time_weekend_max : c.time_weeknight_max;
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npx vitest run src/lib/weave-solver/__tests__/slots.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/slots.ts src/lib/weave-solver/__tests__/slots.test.ts
git commit -m "feat(weave): slot model + weekend detection"
```

### Task B.3: Recipe scoring — effort, diet, anti-repeat

**Files:**
- Create: `src/lib/weave-solver/scoring.ts`
- Create: `src/lib/weave-solver/__tests__/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { effortFit, dietMatch, antiRepeatFit, totalCookMinutes } from '../scoring';
import type { SolverRecipe } from '../types';

const r = (over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id: 'r1', title: 't', image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

describe('totalCookMinutes', () => {
  it('sums prep + cook, treats null as 0', () => {
    expect(totalCookMinutes(r({ prep_time_minutes: 10, cook_time_minutes: 20 }))).toBe(30);
    expect(totalCookMinutes(r({ prep_time_minutes: null, cook_time_minutes: 15 }))).toBe(15);
  });
});

describe('effortFit', () => {
  it('1.0 when under budget', () => {
    expect(effortFit(r({ prep_time_minutes: 10, cook_time_minutes: 10 }), 30)).toBe(1);
  });
  it('0 when more than 2× budget', () => {
    expect(effortFit(r({ prep_time_minutes: 30, cook_time_minutes: 40 }), 30)).toBe(0);
  });
  it('linearly degrades between 1× and 2× budget', () => {
    // 45 min vs budget 30 → ratio 1.5 → score 0.5
    expect(effortFit(r({ prep_time_minutes: 15, cook_time_minutes: 30 }), 30)).toBeCloseTo(0.5);
  });
});

describe('dietMatch', () => {
  it('1.0 when no diet required', () => {
    expect(dietMatch(r({ dietary_tags: [] }), [])).toBe(1);
  });
  it('1.0 when all required tags present', () => {
    expect(dietMatch(r({ dietary_tags: ['vegan', 'gluten-free'] }), ['vegan'])).toBe(1);
  });
  it('0 when any required tag missing', () => {
    expect(dietMatch(r({ dietary_tags: ['vegetarian'] }), ['vegan'])).toBe(0);
  });
});

describe('antiRepeatFit', () => {
  it('1.0 with strength=off regardless of neighbors', () => {
    const recent = [r({ cuisine_type: 'italian', dish_types: ['pasta'] })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'off')).toBe(1);
  });
  it('lowers score when same cuisine appears in the previous day', () => {
    const recent = [r({ cuisine_type: 'italian' })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'moderate')).toBeLessThan(1);
  });
  it('strict drops to 0 on same cuisine adjacent day', () => {
    const recent = [r({ cuisine_type: 'italian' })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'strict')).toBe(0);
  });
  it('full score when no overlap', () => {
    const recent = [r({ cuisine_type: 'thai' })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'strict')).toBe(1);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
npx vitest run src/lib/weave-solver/__tests__/scoring.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement `scoring.ts`**

```ts
// src/lib/weave-solver/scoring.ts
import type { SolverRecipe, AntiRepeatStrength } from './types';

export function totalCookMinutes(r: SolverRecipe): number {
  return (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
}

export function effortFit(r: SolverRecipe, budget_minutes: number): number {
  if (budget_minutes <= 0) return 1;
  const total = totalCookMinutes(r);
  if (total <= budget_minutes) return 1;
  const ratio = total / budget_minutes;
  if (ratio >= 2) return 0;
  return 1 - (ratio - 1); // ratio 1 → 1, ratio 2 → 0
}

export function dietMatch(r: SolverRecipe, required: string[]): number {
  if (required.length === 0) return 1;
  const tags = new Set(r.dietary_tags);
  return required.every(t => tags.has(t)) ? 1 : 0;
}

export function antiRepeatFit(
  candidate: SolverRecipe,
  recent: SolverRecipe[],          // entries within ±1 day of the target slot
  strength: AntiRepeatStrength,
): number {
  if (strength === 'off' || recent.length === 0) return 1;
  const candCuisine = candidate.cuisine_type;
  const candDishes = new Set(candidate.dish_types);
  let penalty = 0;
  for (const r of recent) {
    if (candCuisine && r.cuisine_type === candCuisine) penalty += 0.5;
    for (const d of r.dish_types) if (candDishes.has(d)) penalty += 0.3;
  }
  if (strength === 'strict' && penalty > 0) return 0;
  return Math.max(0, 1 - penalty);
}
```

- [ ] **Step 4: Run, expect all pass**

```bash
npx vitest run src/lib/weave-solver/__tests__/scoring.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/scoring.ts src/lib/weave-solver/__tests__/scoring.test.ts
git commit -m "feat(weave): recipe scoring (effort, diet, anti-repeat)"
```

### Task B.4: Pin placement (greedy, effort-aware)

**Files:**
- Create: `src/lib/weave-solver/place-pins.ts`
- Create: `src/lib/weave-solver/__tests__/place-pins.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/place-pins.test.ts
import { describe, it, expect } from 'vitest';
import { placePins } from '../place-pins';
import { buildSlots } from '../slots';
import type { SolverRecipe, SolverConstraints } from '../types';

const r = (over: Partial<SolverRecipe>): SolverRecipe => ({
  id: 'x', title: 'x', image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: ['dinner'], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

const constraints: SolverConstraints = {
  diet: [], time_weeknight_max: 30, time_weekend_max: 120,
  squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
  anti_repeat: 'moderate', batch_enabled: false,
  meal_types: ['dinner'],
};

describe('placePins', () => {
  it('places each pin into exactly one slot', () => {
    const slots = buildSlots({ duration_days: 3, meal_types: ['dinner'], week_start: null });
    const pins = [r({ id: 'a' }), r({ id: 'b' })];
    const { placed, remaining_slots } = placePins(pins, slots, constraints);
    expect(placed).toHaveLength(2);
    expect(remaining_slots).toHaveLength(1);
    expect(new Set(placed.map(p => p.recipe_id))).toEqual(new Set(['a', 'b']));
  });

  it('routes high-effort pins to weekend slots', () => {
    const slots = buildSlots({
      duration_days: 7,
      meal_types: ['dinner'],
      week_start: '2026-05-18', // Monday → Sat=day6, Sun=day7
    });
    const pins = [
      r({ id: 'long', prep_time_minutes: 30, cook_time_minutes: 60 }), // 90m
      r({ id: 'short', prep_time_minutes: 10, cook_time_minutes: 15 }), // 25m
    ];
    const { placed } = placePins(pins, slots, constraints);
    const long = placed.find(p => p.recipe_id === 'long')!;
    const short = placed.find(p => p.recipe_id === 'short')!;
    expect([6, 7]).toContain(long.day_number);
    expect([1, 2, 3, 4, 5]).toContain(short.day_number);
  });

  it('returns no placements when no slots remain', () => {
    const slots = buildSlots({ duration_days: 1, meal_types: ['dinner'], week_start: null });
    const pins = [r({ id: 'a' }), r({ id: 'b' })];
    const { placed, remaining_slots } = placePins(pins, slots, constraints);
    expect(placed).toHaveLength(1);
    expect(remaining_slots).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `place-pins.ts`**

```ts
// src/lib/weave-solver/place-pins.ts
import type { SolverRecipe, SolverConstraints, ProposedEntry } from './types';
import type { Slot } from './slots';
import { dayBudget, } from './slots';
import { effortFit, totalCookMinutes } from './scoring';
import { newClientId } from './util';

interface PinPlacement {
  placed: ProposedEntry[];
  remaining_slots: Slot[];
}

export function placePins(
  pins: SolverRecipe[],
  slots: Slot[],
  c: SolverConstraints,
): PinPlacement {
  let remaining = [...slots];
  const placed: ProposedEntry[] = [];

  // Sort pins by descending effort so heavy ones get first dibs on weekend slots
  const ordered = [...pins].sort((a, b) => totalCookMinutes(b) - totalCookMinutes(a));

  for (const pin of ordered) {
    if (remaining.length === 0) break;
    // Score each remaining slot for this pin
    let best = remaining[0];
    let bestScore = -1;
    for (const s of remaining) {
      const budget = dayBudget(s.is_weekend, c);
      const score = effortFit(pin, budget);
      if (score > bestScore) { bestScore = score; best = s; }
    }
    placed.push({
      clientid: newClientId(),
      day_number: best.day_number,
      meal_type: best.meal_type,
      recipe_id: pin.id,
      recipe_title: pin.title,
      source: 'pinned',
      parent_clientid: null,
      locked: true,
      position: 0,
    });
    remaining = remaining.filter(s => !(s.day_number === best.day_number && s.meal_type === best.meal_type));
  }
  return { placed, remaining_slots: remaining };
}
```

- [ ] **Step 4: Implement `util.ts` (deterministic clientid)**

```ts
// src/lib/weave-solver/util.ts
let counter = 0;
export function newClientId(): string {
  counter += 1;
  return `weave-${counter.toString(36)}-${Date.now().toString(36)}`;
}
export function resetClientIdCounter() { counter = 0; }
```

- [ ] **Step 5: Run, expect pass**

```bash
npx vitest run src/lib/weave-solver/__tests__/place-pins.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/weave-solver/place-pins.ts src/lib/weave-solver/util.ts src/lib/weave-solver/__tests__/place-pins.test.ts
git commit -m "feat(weave): pin placement (effort-aware greedy)"
```

### Task B.5: Leftover expansion (batch-friendly)

**Files:**
- Create: `src/lib/weave-solver/leftovers.ts`
- Create: `src/lib/weave-solver/__tests__/leftovers.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/leftovers.test.ts
import { describe, it, expect } from 'vitest';
import { expandLeftovers } from '../leftovers';
import type { ProposedEntry } from '../types';

const entry = (over: Partial<ProposedEntry>): ProposedEntry => ({
  clientid: 'p1', day_number: 1, meal_type: 'dinner',
  recipe_id: 'r1', recipe_title: 'Curry', source: 'pinned',
  parent_clientid: null, locked: true, position: 0,
  ...over,
});

describe('expandLeftovers', () => {
  it('returns input unchanged when batch_enabled=false', () => {
    const placed = [entry({})];
    const slots = [{ day_number: 2, meal_type: 'dinner' as const, is_weekend: false }];
    const result = expandLeftovers(placed, slots, { batch_enabled: false }, new Set(['r1']));
    expect(result.leftover_entries).toEqual([]);
    expect(result.remaining_slots).toHaveLength(1);
  });

  it('adds a leftover entry on the next available day for a batch-friendly pin', () => {
    const placed = [entry({ clientid: 'p1', day_number: 1, recipe_id: 'r1' })];
    const slots = [
      { day_number: 2, meal_type: 'dinner' as const, is_weekend: false },
      { day_number: 3, meal_type: 'dinner' as const, is_weekend: false },
    ];
    const result = expandLeftovers(placed, slots, { batch_enabled: true }, new Set(['r1']));
    expect(result.leftover_entries).toHaveLength(1);
    expect(result.leftover_entries[0].day_number).toBe(2);
    expect(result.leftover_entries[0].source).toBe('leftover');
    expect(result.leftover_entries[0].parent_clientid).toBe('p1');
    expect(result.leftover_entries[0].recipe_id).toBe('r1');
    expect(result.remaining_slots).toHaveLength(1);
  });

  it('skips a pin that isn\'t batch_friendly', () => {
    const placed = [entry({ recipe_id: 'r1' })];
    const slots = [{ day_number: 2, meal_type: 'dinner' as const, is_weekend: false }];
    const result = expandLeftovers(placed, slots, { batch_enabled: true }, new Set()); // empty set
    expect(result.leftover_entries).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `leftovers.ts`**

```ts
// src/lib/weave-solver/leftovers.ts
import type { ProposedEntry } from './types';
import type { Slot } from './slots';
import { newClientId } from './util';

export function expandLeftovers(
  placed: ProposedEntry[],
  slots: Slot[],
  c: { batch_enabled: boolean },
  batch_recipe_ids: Set<string>,
): { leftover_entries: ProposedEntry[]; remaining_slots: Slot[] } {
  if (!c.batch_enabled) return { leftover_entries: [], remaining_slots: slots };

  let remaining = [...slots];
  const leftovers: ProposedEntry[] = [];

  for (const pin of placed) {
    if (!batch_recipe_ids.has(pin.recipe_id)) continue;
    // Find the earliest slot strictly after the pin's day with matching meal_type
    const nextSlot = remaining
      .filter(s => s.day_number > pin.day_number && s.meal_type === pin.meal_type)
      .sort((a, b) => a.day_number - b.day_number)[0];
    if (!nextSlot) continue;
    leftovers.push({
      clientid: newClientId(),
      day_number: nextSlot.day_number,
      meal_type: nextSlot.meal_type,
      recipe_id: pin.recipe_id,
      recipe_title: `${pin.recipe_title} (leftover)`,
      source: 'leftover',
      parent_clientid: pin.clientid,
      locked: false,
      position: 0,
    });
    remaining = remaining.filter(s => !(s.day_number === nextSlot.day_number && s.meal_type === nextSlot.meal_type));
  }
  return { leftover_entries: leftovers, remaining_slots: remaining };
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/leftovers.ts src/lib/weave-solver/__tests__/leftovers.test.ts
git commit -m "feat(weave): leftover expansion for batch-friendly pins"
```

### Task B.6: Suggestion fill ranking

**Files:**
- Create: `src/lib/weave-solver/fill-suggestions.ts`
- Create: `src/lib/weave-solver/__tests__/fill-suggestions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/fill-suggestions.test.ts
import { describe, it, expect } from 'vitest';
import { fillSuggestions } from '../fill-suggestions';
import type { SolverRecipe, SolverConstraints, ProposedEntry } from '../types';

const r = (over: Partial<SolverRecipe>): SolverRecipe => ({
  id: 'x', title: 'X', image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 15,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

const c: SolverConstraints = {
  diet: [], time_weeknight_max: 30, time_weekend_max: 120,
  squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
  anti_repeat: 'moderate', batch_enabled: false,
  meal_types: ['dinner'],
};

describe('fillSuggestions', () => {
  it('fills every remaining slot when pool is non-empty', () => {
    const slots = [
      { day_number: 1, meal_type: 'dinner' as const, is_weekend: false },
      { day_number: 2, meal_type: 'dinner' as const, is_weekend: false },
    ];
    const pool = [r({ id: 'p1' }), r({ id: 'p2' })];
    const out = fillSuggestions(slots, pool, [], c, 0);
    expect(out).toHaveLength(2);
    expect(out.every(e => e.source === 'suggestion')).toBe(true);
  });

  it('prefers high pantry_match over low', () => {
    const slots = [{ day_number: 1, meal_type: 'dinner' as const, is_weekend: false }];
    const pool = [
      r({ id: 'low',  pantry_match: 0.1 }),
      r({ id: 'high', pantry_match: 0.9 }),
    ];
    const out = fillSuggestions(slots, pool, [], c, 0);
    expect(out[0].recipe_id).toBe('high');
  });

  it('does not reuse a recipe already on the plan', () => {
    const slots = [{ day_number: 2, meal_type: 'dinner' as const, is_weekend: false }];
    const placed: ProposedEntry[] = [{
      clientid: 'x', day_number: 1, meal_type: 'dinner', recipe_id: 'p1', recipe_title: 'P1',
      source: 'pinned', parent_clientid: null, locked: true, position: 0,
    }];
    const pool = [r({ id: 'p1' }), r({ id: 'p2' })];
    const out = fillSuggestions(slots, pool, placed, c, 0);
    expect(out[0].recipe_id).toBe('p2');
  });

  it('produces empty list when pool is empty', () => {
    const slots = [{ day_number: 1, meal_type: 'dinner' as const, is_weekend: false }];
    expect(fillSuggestions(slots, [], [], c, 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `fill-suggestions.ts`**

```ts
// src/lib/weave-solver/fill-suggestions.ts
import type { SolverRecipe, SolverConstraints, ProposedEntry } from './types';
import type { Slot } from './slots';
import { dayBudget } from './slots';
import { effortFit, dietMatch, antiRepeatFit } from './scoring';
import { newClientId } from './util';

const WEIGHTS = {
  pantry: 0.35,
  anti_repeat: 0.30,
  effort: 0.20,
  diet: 0.10,
  inspiration: 0.05,
};

export function fillSuggestions(
  slots: Slot[],
  pool: SolverRecipe[],
  placed: ProposedEntry[],
  c: SolverConstraints,
  seed: number,
): ProposedEntry[] {
  if (pool.length === 0) return [];
  const used = new Set(placed.map(p => p.recipe_id));
  const results: ProposedEntry[] = [];

  // Order slots day-1 → day-N so anti-repeat sees a growing context
  const ordered = [...slots].sort((a, b) =>
    a.day_number - b.day_number ||
    a.meal_type.localeCompare(b.meal_type),
  );

  for (const slot of ordered) {
    const neighbors = recipesNearSlot([...placed, ...results], pool, slot);
    const candidates = pool
      .filter(r => !used.has(r.id))
      .map(r => ({ r, score: scoreCandidate(r, slot, neighbors, c) + jitter(seed, r.id) }))
      .sort((a, b) => b.score - a.score);
    const winner = candidates[0];
    if (!winner) continue;
    results.push({
      clientid: newClientId(),
      day_number: slot.day_number,
      meal_type: slot.meal_type,
      recipe_id: winner.r.id,
      recipe_title: winner.r.title,
      source: 'suggestion',
      parent_clientid: null,
      locked: false,
      position: 0,
    });
    used.add(winner.r.id);
  }
  return results;
}

function scoreCandidate(r: SolverRecipe, slot: Slot, neighbors: SolverRecipe[], c: SolverConstraints): number {
  const budget = dayBudget(slot.is_weekend, c);
  return (
    WEIGHTS.pantry      * r.pantry_match +
    WEIGHTS.anti_repeat * antiRepeatFit(r, neighbors, c.anti_repeat) +
    WEIGHTS.effort      * effortFit(r, budget) +
    WEIGHTS.diet        * dietMatch(r, c.diet) +
    WEIGHTS.inspiration * r.inspiration_match
  );
}

function recipesNearSlot(all: ProposedEntry[], pool: SolverRecipe[], slot: Slot): SolverRecipe[] {
  const lookup = new Map(pool.map(r => [r.id, r]));
  return all
    .filter(e => Math.abs(e.day_number - slot.day_number) <= 1)
    .map(e => lookup.get(e.recipe_id))
    .filter((r): r is SolverRecipe => r != null);
}

// Deterministic per-(seed, id) hash → small jitter in [0, 0.001) to break ties when seed > 0
function jitter(seed: number, id: string): number {
  if (seed === 0) return 0;
  let h = seed;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1_000_000;
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/fill-suggestions.ts src/lib/weave-solver/__tests__/fill-suggestions.test.ts
git commit -m "feat(weave): suggestion ranking and slot filling"
```

### Task B.7: Summary computation

**Files:**
- Create: `src/lib/weave-solver/summary.ts`
- Create: `src/lib/weave-solver/__tests__/summary.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/summary.test.ts
import { describe, it, expect } from 'vitest';
import { computeSummary } from '../summary';
import type { ProposedEntry, SolverRecipe } from '../types';

const r = (id: string, over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id, title: id, image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0.5, inspiration_match: 0,
  ...over,
});

const e = (id: string, day: number, src: ProposedEntry['source']): ProposedEntry => ({
  clientid: `c${day}`, day_number: day, meal_type: 'dinner',
  recipe_id: id, recipe_title: id, source: src,
  parent_clientid: null, locked: src === 'pinned', position: 0,
});

describe('computeSummary', () => {
  it('reports slot counts and basic numbers', () => {
    const entries = [e('a', 1, 'pinned'), e('b', 2, 'suggestion')];
    const pool = new Map([['a', r('a', { pantry_match: 0.6 })], ['b', r('b', { pantry_match: 1.0 })]]);
    const s = computeSummary(entries, pool, 3);
    expect(s.slots_total).toBe(3);
    expect(s.slots_filled).toBe(2);
    expect(s.leftover_count).toBe(0);
    expect(s.pantry_pct).toBeCloseTo(0.8, 2); // mean of 0.6 and 1.0
    expect(s.active_minutes).toBe(60); // 2 entries × (10+20)
  });

  it('counts leftover entries but doesn\'t add their cook time', () => {
    const entries = [e('a', 1, 'pinned'), e('a', 2, 'leftover')];
    const pool = new Map([['a', r('a')]]);
    const s = computeSummary(entries, pool, 3);
    expect(s.leftover_count).toBe(1);
    expect(s.active_minutes).toBe(30); // only the cook day counts
  });

  it('variety_score is 1.0 when all entries have different cuisines', () => {
    const entries = [e('a', 1, 'pinned'), e('b', 2, 'pinned')];
    const pool = new Map([
      ['a', r('a', { cuisine_type: 'italian' })],
      ['b', r('b', { cuisine_type: 'thai' })],
    ]);
    expect(computeSummary(entries, pool, 2).variety_score).toBe(1);
  });

  it('variety_score is 0 when all entries are the same cuisine', () => {
    const entries = [e('a', 1, 'pinned'), e('b', 2, 'pinned')];
    const pool = new Map([
      ['a', r('a', { cuisine_type: 'italian' })],
      ['b', r('b', { cuisine_type: 'italian' })],
    ]);
    expect(computeSummary(entries, pool, 2).variety_score).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `summary.ts`**

```ts
// src/lib/weave-solver/summary.ts
import type { ProposedEntry, SolverRecipe, WeaveSummary } from './types';
import { totalCookMinutes } from './scoring';

export function computeSummary(
  entries: ProposedEntry[],
  pool: Map<string, SolverRecipe>,
  slots_total: number,
): WeaveSummary {
  const slots_filled = entries.length;
  const leftover_count = entries.filter(e => e.source === 'leftover').length;

  let active_minutes = 0;
  let pantry_sum = 0;
  let pantry_count = 0;
  const cuisines: string[] = [];
  for (const ent of entries) {
    const r = pool.get(ent.recipe_id);
    if (!r) continue;
    if (ent.source !== 'leftover') {
      active_minutes += totalCookMinutes(r);
    }
    pantry_sum += r.pantry_match;
    pantry_count += 1;
    if (r.cuisine_type) cuisines.push(r.cuisine_type);
  }

  const pantry_pct = pantry_count > 0 ? pantry_sum / pantry_count : 0;
  const variety_score = cuisines.length <= 1
    ? (cuisines.length === 0 ? 1 : 1)
    : new Set(cuisines).size === 1
      ? 0
      : (new Set(cuisines).size - 1) / (cuisines.length - 1);

  return { slots_total, slots_filled, leftover_count, active_minutes, pantry_pct, variety_score };
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/summary.ts src/lib/weave-solver/__tests__/summary.test.ts
git commit -m "feat(weave): summary computation"
```

### Task B.8: Top-level `weave()` entry point + determinism test

**Files:**
- Create: `src/lib/weave-solver/index.ts`
- Create: `src/lib/weave-solver/__tests__/weave.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/weave-solver/__tests__/weave.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { weave } from '../index';
import { resetClientIdCounter } from '../util';
import type { SolverInput, SolverRecipe } from '../types';

const r = (id: string, over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id, title: `Recipe ${id}`, image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: 500, protein_g: 20, carbs_g: 40, fat_g: 15,
  batch_friendly: false, pantry_match: 0.5, inspiration_match: 0,
  ...over,
});

const baseInput: SolverInput = {
  duration_days: 3,
  week_start: null,
  pins: [r('pin1'), r('pin2')],
  pool: [r('s1', { pantry_match: 0.9 }), r('s2', { pantry_match: 0.8 }), r('s3', { pantry_match: 0.7 })],
  constraints: {
    diet: [], time_weeknight_max: 30, time_weekend_max: 120,
    squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
    anti_repeat: 'moderate', batch_enabled: false,
    meal_types: ['dinner'],
  },
  seed: 0,
};

beforeEach(() => resetClientIdCounter());

describe('weave', () => {
  it('fills every slot when pool is large enough', () => {
    const out = weave(baseInput);
    expect(out.entries).toHaveLength(3);
    expect(out.summary.slots_total).toBe(3);
    expect(out.summary.slots_filled).toBe(3);
  });

  it('all pinned recipes appear with source=pinned and locked=true', () => {
    const out = weave(baseInput);
    const pinned = out.entries.filter(e => e.source === 'pinned');
    expect(pinned).toHaveLength(2);
    expect(pinned.every(p => p.locked)).toBe(true);
    expect(new Set(pinned.map(p => p.recipe_id))).toEqual(new Set(['pin1', 'pin2']));
  });

  it('is deterministic at seed=0', () => {
    resetClientIdCounter();
    const a = weave(baseInput);
    resetClientIdCounter();
    const b = weave(baseInput);
    expect(a.entries.map(e => ({ d: e.day_number, m: e.meal_type, r: e.recipe_id })))
      .toEqual(b.entries.map(e => ({ d: e.day_number, m: e.meal_type, r: e.recipe_id })));
  });

  it('produces a leftover when batch_enabled and pin is batch_friendly', () => {
    const input: SolverInput = {
      ...baseInput,
      pins: [r('pin1', { batch_friendly: true })],
      pool: [r('s1'), r('s2')],
      constraints: { ...baseInput.constraints, batch_enabled: true },
    };
    const out = weave(input);
    const leftovers = out.entries.filter(e => e.source === 'leftover');
    expect(leftovers).toHaveLength(1);
    expect(leftovers[0].parent_clientid).toBeTruthy();
    expect(out.summary.leftover_count).toBe(1);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `index.ts`**

```ts
// src/lib/weave-solver/index.ts
import type { SolverInput, SolverOutput, SolverRecipe } from './types';
import { buildSlots } from './slots';
import { placePins } from './place-pins';
import { expandLeftovers } from './leftovers';
import { fillSuggestions } from './fill-suggestions';
import { computeSummary } from './summary';

export * from './types';

export function weave(input: SolverInput): SolverOutput {
  const slots = buildSlots({
    duration_days: input.duration_days,
    meal_types: input.constraints.meal_types,
    week_start: input.week_start,
  });
  const slots_total = slots.length;

  // 1. Place pins
  const { placed, remaining_slots: afterPins } =
    placePins(input.pins, slots, input.constraints);

  // 2. Expand leftovers
  const batchIds = new Set(input.pins.filter(p => p.batch_friendly).map(p => p.id));
  const { leftover_entries, remaining_slots: afterLeftovers } =
    expandLeftovers(placed, afterPins, input.constraints, batchIds);

  // 3. Fill suggestions
  const allBeforeFill = [...placed, ...leftover_entries];
  const suggestions = fillSuggestions(afterLeftovers, input.pool, allBeforeFill, input.constraints, input.seed);

  const entries = [...placed, ...leftover_entries, ...suggestions]
    .map((e, i) => ({ ...e, position: i }));

  // 4. Summary
  const recipePool: Map<string, SolverRecipe> = new Map();
  for (const r of input.pins) recipePool.set(r.id, r);
  for (const r of input.pool) if (!recipePool.has(r.id)) recipePool.set(r.id, r);

  const summary = computeSummary(entries, recipePool, slots_total);
  return { entries, summary };
}
```

- [ ] **Step 4: Run all weave tests**

```bash
npx vitest run src/lib/weave-solver/
```

Expected: all suites pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weave-solver/index.ts src/lib/weave-solver/__tests__/weave.test.ts
git commit -m "feat(weave): top-level solver entry point + determinism test"
```

---

## Phase C — API routes

All routes use the App Router under `src/app/api/`. They use the existing Supabase server client at `@/lib/supabase/server` (verify this path exists; substitute the project's actual server-client helper if different).

### Task C.1: GET / POST / DELETE pins

**Files:**
- Create: `src/app/api/plans/[id]/pins/route.ts`
- Create: `src/app/api/plans/[id]/pins/[recipeId]/route.ts`

- [ ] **Step 1: Verify server-client path**

```bash
ls "C:/Users/lasse/Desktop/whatscooking/src/lib/supabase/"
```

Expected: a `server.ts` (or similar). If not present, search:

```bash
grep -rn "createServerClient\|cookies()" "C:/Users/lasse/Desktop/whatscooking/src/lib/" 2>&1 | head -5
```

Note the actual import path. Use it consistently in tasks below — these examples use `@/lib/supabase/server`.

- [ ] **Step 2: Write `pins/route.ts`**

```ts
// src/app/api/plans/[id]/pins/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: planId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('meal_plan_pins')
    .select(`
      id, recipe_id, priority, pinned_at,
      recipe:recipes (id, title, image_url, cuisine_type, dietary_tags,
                      prep_time_minutes, cook_time_minutes, calories,
                      protein_g, carbs_g, fat_g, batch_friendly)
    `)
    .eq('meal_plan_id', planId)
    .order('priority', { ascending: false })
    .order('pinned_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pins: data });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: planId } = await ctx.params;
  const { recipe_id } = await req.json();
  if (!recipe_id) return NextResponse.json({ error: 'recipe_id required' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('meal_plan_pins')
    .upsert(
      { meal_plan_id: planId, recipe_id },
      { onConflict: 'meal_plan_id,recipe_id' },
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pin: data });
}
```

- [ ] **Step 3: Write `pins/[recipeId]/route.ts`**

```ts
// src/app/api/plans/[id]/pins/[recipeId]/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; recipeId: string }> }) {
  const { id: planId, recipeId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('meal_plan_pins')
    .delete()
    .eq('meal_plan_id', planId)
    .eq('recipe_id', recipeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; recipeId: string }> }) {
  const { id: planId, recipeId } = await ctx.params;
  const { priority } = await req.json();
  if (typeof priority !== 'number') return NextResponse.json({ error: 'priority must be a number' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('meal_plan_pins')
    .update({ priority })
    .eq('meal_plan_id', planId)
    .eq('recipe_id', recipeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pin: data });
}
```

- [ ] **Step 4: Manually verify with curl (or browser-based test)**

```bash
# replace PLAN_ID and RECIPE_ID with real values from your DB.
curl -X POST http://localhost:3002/api/plans/PLAN_ID/pins \
  -H 'Content-Type: application/json' -d '{"recipe_id":"RECIPE_ID"}'
curl http://localhost:3002/api/plans/PLAN_ID/pins
curl -X DELETE http://localhost:3002/api/plans/PLAN_ID/pins/RECIPE_ID
```

Expected: POST returns the new pin; GET lists it; DELETE returns ok.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/plans/[id]/pins/
git commit -m "feat(api): meal plan pins CRUD"
```

### Task C.2: POST `/api/plans/[id]/weave`

**Files:**
- Create: `src/app/api/plans/[id]/weave/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/plans/[id]/weave/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { weave } from '@/lib/weave-solver';
import type { SolverRecipe, SolverConstraints, MealType } from '@/lib/weave-solver/types';

const DEFAULT_CONSTRAINTS: SolverConstraints = {
  diet: [], time_weeknight_max: 30, time_weekend_max: 120,
  squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
  anti_repeat: 'moderate', batch_enabled: false,
  meal_types: ['breakfast', 'lunch', 'dinner'],
};

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: planId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const seed = typeof body.seed === 'number' ? body.seed : 0;

  const supabase = await createSupabaseServerClient();

  // 1. Load plan
  const { data: plan, error: planErr } = await supabase
    .from('meal_plans')
    .select('id, duration_days, week_start, meals_per_day, dietary_filters, pinboard_filters')
    .eq('id', planId)
    .single();
  if (planErr || !plan) return NextResponse.json({ error: planErr?.message ?? 'plan not found' }, { status: 404 });

  // 2. Resolve constraints from pinboard_filters + plan defaults
  const filters = (plan.pinboard_filters ?? {}) as Record<string, unknown>;
  const constraints: SolverConstraints = {
    ...DEFAULT_CONSTRAINTS,
    diet: Array.isArray(filters.diet) ? filters.diet as string[] : (plan.dietary_filters ?? []),
    time_weeknight_max: typeof filters.time_weeknight === 'number' ? filters.time_weeknight as number : DEFAULT_CONSTRAINTS.time_weeknight_max,
    time_weekend_max: typeof filters.time_weekend === 'number' ? filters.time_weekend as number : DEFAULT_CONSTRAINTS.time_weekend_max,
    squad_size: typeof filters.squad_size === 'number' ? filters.squad_size as number : DEFAULT_CONSTRAINTS.squad_size,
    pantry_aware: !!filters.pantry_aware,
    anti_repeat: (filters.anti_repeat as SolverConstraints['anti_repeat']) ?? 'moderate',
    batch_enabled: !!filters.batch_enabled,
    meal_types: defaultMealTypes(plan.meals_per_day),
  };

  // 3. Load pins joined with recipe
  const { data: pinsRaw } = await supabase
    .from('meal_plan_pins')
    .select(`
      priority, pinned_at,
      recipe:recipes (id, title, image_url, cuisine_type, dietary_tags, dish_types,
                      prep_time_minutes, cook_time_minutes, calories, protein_g,
                      carbs_g, fat_g, batch_friendly)
    `)
    .eq('meal_plan_id', planId)
    .order('priority', { ascending: false });

  const pins: SolverRecipe[] = (pinsRaw ?? [])
    .map(row => row.recipe as any)
    .filter(Boolean)
    .map((r: any) => toSolverRecipe(r));

  // 4. Load suggestion pool (constraint-pre-filtered)
  // For now: 100 most-recent recipes matching diet filter. Pantry pre-filter and
  // pantry_match scoring TODO in a follow-up task — see step 5.
  const { data: poolRaw } = await supabase
    .from('recipes')
    .select('id, title, image_url, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, batch_friendly')
    .order('created_at', { ascending: false })
    .limit(100);

  const pool: SolverRecipe[] = (poolRaw ?? [])
    .filter((r: any) => constraints.diet.every(t => (r.dietary_tags ?? []).includes(t)))
    .map((r: any) => toSolverRecipe(r));

  // 5. Run solver
  const result = weave({
    duration_days: plan.duration_days ?? 7,
    week_start: plan.week_start,
    pins,
    pool,
    constraints,
    seed,
  });

  // 6. Update last_woven_at + status
  await supabase
    .from('meal_plans')
    .update({ last_woven_at: new Date().toISOString(), status: 'woven' })
    .eq('id', planId);

  return NextResponse.json(result);
}

function defaultMealTypes(meals_per_day: number | null): MealType[] {
  if ((meals_per_day ?? 3) <= 1) return ['dinner'];
  if (meals_per_day === 2) return ['lunch', 'dinner'];
  if (meals_per_day === 3) return ['breakfast', 'lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner', 'snack'];
}

function toSolverRecipe(r: any): SolverRecipe {
  return {
    id: r.id, title: r.title, image_url: r.image_url ?? null,
    cuisine_type: r.cuisine_type ?? null,
    dietary_tags: r.dietary_tags ?? [],
    dish_types: r.dish_types ?? [],
    prep_time_minutes: r.prep_time_minutes ?? null,
    cook_time_minutes: r.cook_time_minutes ?? null,
    calories: r.calories ?? null, protein_g: r.protein_g ?? null,
    carbs_g: r.carbs_g ?? null, fat_g: r.fat_g ?? null,
    batch_friendly: !!r.batch_friendly,
    pantry_match: 0.5,        // placeholder — populated by C.2.b
    inspiration_match: 0,     // placeholder — populated by C.2.b
  };
}
```

- [ ] **Step 2: Manual smoke test**

```bash
curl -X POST http://localhost:3002/api/plans/PLAN_ID/weave -H 'Content-Type: application/json' -d '{}'
```

Expected: JSON with `entries[]` (length = duration_days × meal_types) and `summary`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/plans/[id]/weave/route.ts
git commit -m "feat(api): POST /plans/[id]/weave runs the deterministic solver"
```

### Task C.2.b: Wire pantry-match and inspiration-match into the weave route

**Files:**
- Modify: `src/app/api/plans/[id]/weave/route.ts`
- Reuse: existing pantry helpers under `src/lib/pantry/*` (verify path)

- [ ] **Step 1: Locate pantry helpers**

```bash
grep -rn "pantry_items\|pantryMatch\|matchRecipe" "C:/Users/lasse/Desktop/whatscooking/src/lib/" 2>&1 | head -10
```

Note the helper name. If none exists, use the inline implementation below.

- [ ] **Step 2: Replace `toSolverRecipe` site with pantry-aware mapping**

Inside `route.ts`, before mapping `poolRaw` to `pool`, load the user's pantry:

```ts
// fetch pantry once
const { data: pantry } = await supabase
  .from('pantry_items')
  .select('ingredient_name')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '');
const pantrySet = new Set((pantry ?? []).map((p: any) => normalize(p.ingredient_name)));

function normalize(s: string) { return s.toLowerCase().trim(); }

function pantryMatch(recipe: any): number {
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (ings.length === 0) return 0;
  const matches = ings.filter((i: any) => pantrySet.has(normalize(typeof i === 'string' ? i : (i.name ?? '')))).length;
  return matches / ings.length;
}

function pantryMissingCount(recipe: any): number {
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  return ings.filter((i: any) => !pantrySet.has(normalize(typeof i === 'string' ? i : (i.name ?? '')))).length;
}
```

Update the recipes SELECT to include `ingredients`:

```ts
const { data: poolRaw } = await supabase
  .from('recipes')
  .select('id, title, image_url, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, batch_friendly, ingredients')
  .order('created_at', { ascending: false })
  .limit(200);
```

Update the pool mapping:

```ts
const inspirationTags = Array.isArray(filters.inspiration_tags) ? filters.inspiration_tags as string[] : [];
function inspirationMatch(r: any): number {
  if (inspirationTags.length === 0) return 0;
  const tags = new Set<string>([
    ...(r.dietary_tags ?? []),
    ...(r.dish_types ?? []),
    ...(r.cuisine_type ? [r.cuisine_type] : []),
  ]);
  const hits = inspirationTags.filter(t => tags.has(t)).length;
  return hits / inspirationTags.length;
}

const pool: SolverRecipe[] = (poolRaw ?? [])
  .filter((r: any) => constraints.diet.every(t => (r.dietary_tags ?? []).includes(t)))
  .filter((r: any) => !constraints.pantry_aware || pantryMissingCount(r) <= constraints.pantry_missing_max)
  .map((r: any) => ({
    ...toSolverRecipe(r),
    pantry_match: pantryMatch(r),
    inspiration_match: inspirationMatch(r),
  }));
```

Also extend the pins query to include `ingredients` and apply pantry/inspiration scores to pins too (so summary numbers are right).

- [ ] **Step 3: Smoke test with `pantry_aware=true`**

```bash
curl -X POST http://localhost:3002/api/plans/PLAN_ID/weave -H 'Content-Type: application/json' -d '{}'
```

Confirm `summary.pantry_pct > 0` for a user with a populated pantry.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/plans/[id]/weave/route.ts
git commit -m "feat(api): wire pantry-match and inspiration-match into weave"
```

### Task C.3: PATCH `/api/plans/[id]` — pinboard_filters and status

**Files:**
- Create: `src/app/api/plans/[id]/route.ts` (or extend if exists)

- [ ] **Step 1: Check existing route**

```bash
ls "C:/Users/lasse/Desktop/whatscooking/src/app/api/plans/[id]/" 2>&1
```

If `route.ts` exists, modify it. Otherwise create new.

- [ ] **Step 2: Add PATCH handler**

```ts
// src/app/api/plans/[id]/route.ts (add or extend)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_STATUS = new Set(['planning','active','completed','woven','cooking','archived']);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (body.pinboard_filters && typeof body.pinboard_filters === 'object') {
    update.pinboard_filters = body.pinboard_filters;
  }
  if (typeof body.status === 'string' && ALLOWED_STATUS.has(body.status)) {
    update.status = body.status;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ plan: data });
}
```

- [ ] **Step 3: Smoke test**

```bash
curl -X PATCH http://localhost:3002/api/plans/PLAN_ID -H 'Content-Type: application/json' \
  -d '{"pinboard_filters":{"diet":["vegan"],"time_weeknight":25}}'
```

Expected: updated plan in response.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/plans/[id]/route.ts
git commit -m "feat(api): PATCH meal plan status + pinboard_filters"
```

### Task C.4: GET `/api/recipes/picker`

**Files:**
- Create: `src/app/api/recipes/picker/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/recipes/picker/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mealType = url.searchParams.get('meal_type');
  const planId = url.searchParams.get('plan_id');
  const excludeIds = (url.searchParams.get('exclude_recipe_ids') ?? '').split(',').filter(Boolean);
  const q = url.searchParams.get('q')?.trim() ?? '';

  const supabase = await createSupabaseServerClient();
  // Load plan for dietary filters
  let dietFilters: string[] = [];
  if (planId) {
    const { data: plan } = await supabase
      .from('meal_plans')
      .select('dietary_filters, pinboard_filters')
      .eq('id', planId)
      .single();
    const pf = (plan?.pinboard_filters ?? {}) as Record<string, unknown>;
    dietFilters = (Array.isArray(pf.diet) ? pf.diet as string[] : plan?.dietary_filters) ?? [];
  }

  let query = supabase
    .from('recipes')
    .select('id, title, image_url, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories')
    .limit(40);

  if (q) query = query.ilike('title', `%${q}%`);
  if (mealType) query = query.contains('dish_types', [mealType]);
  if (dietFilters.length > 0) query = query.contains('dietary_tags', dietFilters);
  if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ recipes: data ?? [] });
}
```

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:3002/api/recipes/picker?meal_type=dinner&plan_id=PLAN_ID&q=pasta"
```

Expected: up to 40 recipes matching title %pasta%, dish_types contains dinner, dietary_tags includes plan's diet filter.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/recipes/picker/route.ts
git commit -m "feat(api): constraint-aware recipe picker endpoint"
```

### Task C.5: POST `/api/recipes/[id]/estimate-macros`

**Files:**
- Create: `src/app/api/recipes/[id]/estimate-macros/route.ts`
- Create: `src/lib/macro-estimator.ts`

- [ ] **Step 1: Locate AI SDK setup**

```bash
grep -rn "generateObject\|@ai-sdk\|vercel-ai" "C:/Users/lasse/Desktop/whatscooking/src/lib/" 2>&1 | head -10
grep -rn "AI_GATEWAY\|model:" "C:/Users/lasse/Desktop/whatscooking/src/app/api/" 2>&1 | head -10
```

Note the project's chosen model / gateway pattern. The plan uses `generateObject` from `ai` with Anthropic Haiku via the existing Vercel AI Gateway pattern — substitute if the project uses a different one.

- [ ] **Step 2: Write `macro-estimator.ts`**

```ts
// src/lib/macro-estimator.ts
import { generateObject } from 'ai';
import { z } from 'zod';

export const ESTIMATOR_VERSION = 'v1-2026-05';

const Macros = z.object({
  calories:  z.number().int().nullable(),
  protein_g: z.number().nullable(),
  carbs_g:   z.number().nullable(),
  fat_g:     z.number().nullable(),
  fiber_g:   z.number().nullable(),
  sugar_g:   z.number().nullable(),
  sat_fat_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
});

export type EstimatedMacros = z.infer<typeof Macros>;

export async function estimateMacros(input: {
  title: string;
  ingredients: unknown;
  servings: number | null;
}): Promise<EstimatedMacros> {
  const { object } = await generateObject({
    model: 'anthropic/claude-haiku-4-5-20251001',
    schema: Macros,
    system: 'Estimate per-portion nutrition from the ingredients list. Be conservative; return null for fields you cannot reasonably estimate.',
    prompt: JSON.stringify({
      title: input.title,
      servings: input.servings ?? 1,
      ingredients: input.ingredients,
    }),
  });
  return object;
}
```

- [ ] **Step 3: Write the route**

```ts
// src/app/api/recipes/[id]/estimate-macros/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { estimateMacros, ESTIMATOR_VERSION } from '@/lib/macro-estimator';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();

  const { data: r } = await supabase
    .from('recipes')
    .select('id, title, ingredients, servings, macros_estimated, estimator_version')
    .eq('id', id)
    .single();
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (r.macros_estimated && r.estimator_version === ESTIMATOR_VERSION) {
    return NextResponse.json({ skipped: true });
  }

  try {
    const macros = await estimateMacros({
      title: r.title,
      ingredients: r.ingredients,
      servings: r.servings,
    });
    const { error } = await supabase
      .from('recipes')
      .update({
        ...macros,
        macros_estimated: true,
        macros_estimated_at: new Date().toISOString(),
        estimator_version: ESTIMATOR_VERSION,
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, macros });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'estimator failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Smoke test**

```bash
curl -X POST http://localhost:3002/api/recipes/RECIPE_ID/estimate-macros
```

Expected: JSON with `macros` populated. Re-running returns `{skipped:true}`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/macro-estimator.ts src/app/api/recipes/[id]/estimate-macros/route.ts
git commit -m "feat(api): display-time macro estimator with version-tagged caching"
```

### Task C.6: Eager estimator at ingest (hybrid backfill — "going forward" half)

**Files:**
- Modify: the existing recipe ingest pipeline (TBD by grep)

- [ ] **Step 1: Locate ingest entry points**

```bash
grep -rn "insert.*recipes\|from('recipes').*insert\|.upsert" "C:/Users/lasse/Desktop/whatscooking/src/" 2>&1 | head -20
```

You're looking for whatever writes new rows to `recipes` — likely an `/api/recipes/import` route, a script under `scripts/`, or a webhook endpoint.

- [ ] **Step 2: After each successful insert, fire the estimator non-blockingly**

Inside the insert path, after the row is created, add:

```ts
import { estimateMacros, ESTIMATOR_VERSION } from '@/lib/macro-estimator';

// non-blocking; do not await
void (async () => {
  try {
    if (typeof newRecipe.calories === 'number' && newRecipe.calories > 0) return; // source had macros
    const m = await estimateMacros({
      title: newRecipe.title,
      ingredients: newRecipe.ingredients,
      servings: newRecipe.servings ?? null,
    });
    await supabase.from('recipes').update({
      ...m,
      macros_estimated: true,
      macros_estimated_at: new Date().toISOString(),
      estimator_version: ESTIMATOR_VERSION,
    }).eq('id', newRecipe.id);
  } catch {}
})();
```

If the project ingests recipes in batches (script under `scripts/`), wire the same call in the batch loop instead.

- [ ] **Step 3: Commit**

```bash
git add <modified files>
git commit -m "feat(ingest): eager macro estimation for newly-ingested recipes"
```

---

## Phase D — Image rendering fix (cross-cutting)

### Task D.1: Update `<RecipeImage>` to consume focal_x / focal_y

**Files:**
- Modify: `src/components/recipe-image.tsx`

- [ ] **Step 1: Read the current component**

```bash
cat "C:/Users/lasse/Desktop/whatscooking/src/components/recipe-image.tsx"
```

- [ ] **Step 2: Update its props to accept focal point and apply `object-position`**

```tsx
// src/components/recipe-image.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface RecipeImageProps {
  recipeId: string;
  imageUrl: string | null | undefined;
  title: string;
  alt?: string;
  className?: string;
  focal_x?: number | null;   // 0-100, default 50
  focal_y?: number | null;   // 0-100, default 50
  sizes?: string;
  priority?: boolean;
}

export function RecipeImage({
  imageUrl, title, alt, className,
  focal_x, focal_y, sizes, priority,
}: RecipeImageProps) {
  const [errored, setErrored] = useState(false);
  const fx = typeof focal_x === 'number' ? focal_x : 50;
  const fy = typeof focal_y === 'number' ? focal_y : 50;

  if (!imageUrl || errored) {
    return (
      <div
        role="img"
        aria-label={alt ?? title}
        className={className}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #2A1F14, #1A120A)',
          color: '#6B4E36',
          fontSize: 24,
        }}
      >
        {/* warm-tone cookware glyph — no broken icon */}
        <span aria-hidden>🍳</span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt ?? title}
      fill
      sizes={sizes ?? '(max-width: 768px) 50vw, 25vw'}
      priority={priority}
      onError={() => setErrored(true)}
      style={{
        objectFit: 'cover',
        objectPosition: `${fx}% ${fy}%`,
      }}
      className={className}
    />
  );
}
```

- [ ] **Step 3: Verify the parent wrapper supports `fill`**

Anywhere the image is used, the parent must have `position: relative` and a defined size. Grep usages:

```bash
grep -rn "RecipeImage" "C:/Users/lasse/Desktop/whatscooking/src/" 2>&1
```

For each usage, ensure the immediate parent is positioned and has dimensions. If any usage was using `<img>` directly with width/height props, update to wrap in `<div className="relative w-X h-Y">…</div>`.

- [ ] **Step 4: Smoke test in browser**

Start dev server on the WC port:

```bash
cd "C:/Users/lasse/Desktop/whatscooking" && npm run dev
```

Visit `/plans/[id]` (any existing plan), `/discover`, `/recipes/[slug]`. Verify:
- Images appear or the warm 🍳 fallback shows.
- No broken-icon glyphs.
- Recipes with `focal_y < 50` show their food correctly positioned (visible in the focal-point migration test set).

- [ ] **Step 5: Commit**

```bash
git add src/components/recipe-image.tsx
git commit -m "fix(images): consume focal_x/focal_y, warm-tone fallback, never broken"
```

### Task D.2: Pass focal_x / focal_y through to all RecipeImage call sites

**Files:**
- Modify: every file matching the grep in D.1 Step 3.

- [ ] **Step 1: For each call site, ensure the data source includes focal_x and focal_y**

For server-rendered surfaces that select recipes, add `focal_x, focal_y` to the SELECT list. For client surfaces that receive recipe props, extend the type. Common sites:

- `src/app/(app)/discover/page.tsx`
- `src/app/(app)/plans/[id]/plan-builder.tsx`
- `src/components/plans/WeeklyPlanGrid.tsx`
- `src/components/plans/RecipeBank.tsx`
- `src/app/(app)/recipes/[slug]/page.tsx`

For each: extend the recipe query and pass `focal_x`/`focal_y` to `<RecipeImage>`.

- [ ] **Step 2: Smoke test the same surfaces again — verify focal positioning visually**

- [ ] **Step 3: Commit**

```bash
git add <all modified files>
git commit -m "fix(images): thread focal_x/focal_y to all RecipeImage call sites"
```

---

## Phase E — Logging + moodboard delta (CLAUDE.md mandates)

### Task E.1: Append session log

**Files:**
- Modify or create: `logs/2026-05-18.md`

- [ ] **Step 1: Append entry**

Add at the end of today's log (or create the file):

```markdown
## [HH:MM] Meal planner foundation (Plan 1)

- Branch: feat/meal-planner-pinboard-weave
- 4 migrations: meal_plan_pinboard, meal_plan_pins, meal_entries_weave, recipes_macros_batch
- Pure weave-solver lib at src/lib/weave-solver/ with full unit-test coverage
- New API routes: meal_plan_pins CRUD, POST /weave, PATCH /plans/[id], picker, estimate-macros
- RecipeImage now consumes focal_x/focal_y with warm-tone fallback
- Eager macro estimator wired into recipe ingest
- Files changed: see commits f0…HEAD on feat/meal-planner-pinboard-weave
```

- [ ] **Step 2: Commit**

```bash
git add logs/2026-05-18.md
git commit -m "chore(logs): foundation plan complete"
```

### Task E.2: Moodboard delta

**Files:**
- Modify: `src/app/moodboard/moodboard.config.ts`
- Modify: `docs/moodboard.log.md`

Foundation work is mostly non-visual, but the `<RecipeImage>` fallback is a new visual primitive.

- [ ] **Step 1: Add an entry under patterns or components in `moodboard.config.ts`**

Add the warm-tone glyph fallback pattern. Read the existing config first to match shape:

```bash
cat "C:/Users/lasse/Desktop/whatscooking/src/app/moodboard/moodboard.config.ts" | head -80
```

Add a new entry following the file's existing TypeScript structure (don't invent a new shape — match what's already there). Example concept:

```ts
{
  name: 'Recipe image fallback',
  category: 'media',
  do: 'When image_url is missing or fails, show the warm-tone cookware glyph on a gradient #2A1F14 → #1A120A background.',
  dont: 'Never show a broken-image icon, gray Tailwind skeleton, or empty box.',
}
```

- [ ] **Step 2: Prepend a dated entry to `docs/moodboard.log.md`**

```markdown
## 2026-05-18 — Meal planner foundation

### Changed
- New `<RecipeImage>` fallback: warm-tone cookware glyph on dark gradient, no broken icons anywhere.
- All recipe image surfaces now honor focal_x / focal_y.

### Ideas / next steps
- Cell archetypes for woven week (pinned / suggestion / leftover) — Plan 2.
- Constraint chip pattern + multi-select inspiration chips — Plan 2.
- Three-state macro display tokens — Plan 2.
```

- [ ] **Step 3: Run the drift check**

```bash
cd "C:/Users/lasse/Desktop/whatscooking" && npm run moodboard:check
```

Expected: no new warnings. If any, either resolve or extend the script's `ignored` allow-list per CLAUDE.md.

- [ ] **Step 4: Commit**

```bash
git add src/app/moodboard/moodboard.config.ts docs/moodboard.log.md
git commit -m "chore(moodboard): document RecipeImage fallback pattern"
```

---

## Phase F — Verification before declaring Plan 1 complete

### Task F.1: Run full test + lint + typecheck

- [ ] **Step 1: Tests**

```bash
cd "C:/Users/lasse/Desktop/whatscooking" && npx vitest run
```

Expected: all suites pass; weave-solver suite contains at minimum: slots, scoring, place-pins, leftovers, fill-suggestions, summary, weave.

- [ ] **Step 2: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors. If `typecheck` script doesn't exist in `package.json`, run `npx tsc --noEmit`.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: production build passes. (Image rendering changes pass through Next image-optimization without warnings.)

- [ ] **Step 4: Manual smoke**

With dev server running on port 3002:

1. Pick any existing plan → POST `/weave` via curl → confirm response shape matches `SolverOutput`.
2. Pin a recipe to that plan via POST `/pins`, then GET `/pins` and DELETE.
3. PATCH the plan with `pinboard_filters`, re-POST `/weave`, confirm output changes.
4. POST `/estimate-macros` for a recipe with null calories; verify columns populate.

### Task F.2: Open draft PR

- [ ] **Step 1: Push**

```bash
git push -u origin feat/meal-planner-pinboard-weave
```

- [ ] **Step 2: Open draft PR with summary linking the spec**

```bash
gh pr create --draft --title "feat(plans): meal planner pinboard + weave — Plan 1 foundation" --body "$(cat <<'EOF'
## Summary
- Foundation for the Pinboard + Weave meal-planner redesign
- Spec: docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md
- Plan: docs/superpowers/plans/2026-05-18-meal-planner-foundation.md

## What's in this PR
- 4 additive Supabase migrations (pinboard state, pins table, entry source columns, recipe macro/batch columns)
- Pure deterministic weave solver with full unit-test coverage
- New API routes: pins CRUD, /weave, /plans/[id] PATCH, /recipes/picker, /recipes/[id]/estimate-macros
- RecipeImage focal-point support + warm-tone fallback
- Eager macro estimation at recipe ingest

## Out of scope (Plan 2)
- Pinboard UI, Weave grid UI, smart-swap, macro display

## Test plan
- [ ] vitest run (solver suites)
- [ ] npm run typecheck && npm run lint && npm run build
- [ ] curl smoke test of every new endpoint
- [ ] visit /plans/[id], /discover, /recipes/[slug] in browser to verify image fallback

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

Coverage of spec sections in this plan:

- §3 Page architecture — deferred to Plan 2 (UI work)
- §4 Pinboard surface — deferred to Plan 2 (UI work)
- §5 Weave behavior — solver covered (§B), UI deferred to Plan 2
- §6 Cell + macro design — image fix covered (§D), macro display UI deferred to Plan 2; estimator backend covered (§C.5, §C.6)
- §7 Recipe picker behavior — picker endpoint covered (§C.4); UI integration deferred to Plan 2
- §8 Data model + APIs — fully covered (§A + §C)
- §9 Component map — only `RecipeImage` change is in scope here; rest deferred to Plan 2
- §10 Cross-app + moodboard — moodboard delta in §E.2; cross-app hooks remain wired through existing tables (no new code needed for streak / household / dietary plumbing in foundation work)
- §13 Acceptance criteria 6, 8 partially achievable post-Plan-1 via direct API; 1–5, 7, 9, 10 are UI and deferred to Plan 2

Type / function name consistency check:
- `weave()`, `placePins()`, `expandLeftovers()`, `fillSuggestions()`, `computeSummary()` — consistent across all tasks
- `SolverRecipe`, `SolverConstraints`, `SolverInput`, `SolverOutput`, `ProposedEntry`, `WeaveSummary`, `MealType` — defined once in types.ts; referenced consistently
- `meal_plan_pins`, `meal_entries`, `meal_plans` — used consistently (not the spec's `plan_pins` / `plan_entries` / `plans`)
- `ESTIMATOR_VERSION` — single export from `src/lib/macro-estimator.ts`, used in both estimator route and ingest hook
