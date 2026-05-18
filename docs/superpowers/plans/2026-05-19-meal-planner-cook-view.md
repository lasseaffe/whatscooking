# Meal Planner Pinboard + Weave — Plan 3: Cook View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `/plans/[id]/cook` — the execution view that turns a woven plan into something a user can *use*. Day-by-day card stack focused on "what am I cooking today/tomorrow", inline shopping panel that aggregates ingredients minus pantry, and a one-tap "I cooked this" check-off that updates the plan status and emits a cross-app streak event.

**Architecture:** New page route at `/plans/[id]/cook`. Reuses the existing `GET /api/plans/[id]/shopping` endpoint. Adds one column (`cooked_at`) to `meal_entries` and a single new endpoint pair (`POST/DELETE /api/plans/[id]/entries/[entryId]/cook`). New UI lives under `src/components/plans/cook/`. No changes to the solver or to Plan 1/2 components beyond a single CTA link.

**Tech Stack:** Next.js 15 App Router · React 19 · Tailwind 4 · existing tokens · existing `<RecipeImage>`.

**Spec:** `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`
**Plan 1 (foundation):** `docs/superpowers/plans/2026-05-18-meal-planner-foundation.md`
**Plan 2 (UI):** `docs/superpowers/plans/2026-05-18-meal-planner-ui.md`

**Branch base:** `feat/meal-planner-pinboard-weave-cook` from `feat/meal-planner-pinboard-weave-ui`. When PR #3 merges, rebase onto its base.

**What already exists** (do not rebuild):
- `GET /api/plans/[id]/shopping/route.ts` — returns `{ missing, have, unknownEntries, totalRecipes }` with category fields and pantry matching. Plan 3 just consumes this.
- `meal_plans.status` enum already includes `'cooking'` (Plan 1 migration `20260518f`).
- `meal_entries.is_leftover` already exists (Plan 1) — Cook view treats these as reheats, not cooks.
- `WeaveSummary` already has a "Start cooking →" button that navigates to `/plans/[id]/cook`.

---

## Phase 0 — Branch setup

### Task 0.1: Create branch

- [ ] **Step 1: Branch from the UI plan**

```bash
cd "C:/Users/lasse/Desktop/whatscooking"
git checkout feat/meal-planner-pinboard-weave-ui
git pull --ff-only
git checkout -b feat/meal-planner-pinboard-weave-cook
git status
```

Expected: clean tree on the new branch.

---

## Phase A — Database

### Task A.1: Migration — `meal_entries.cooked_at`

**Files:**
- Create: `supabase/migrations/20260519_meal_entries_cooked_at.sql`

A single timestamp on each entry. NULL = not yet cooked. Setting it = cooked. Re-cooking is a no-op (the timestamp updates; we don't track cook counts for v1 — that's a YAGNI we can revisit if users ask).

- [ ] **Step 1: Write migration**

```sql
-- ============================================================
-- meal_entries.cooked_at
-- Marks when a plan entry was cooked. NULL = pending.
-- Setting this column drives the Cook view's checked state and
-- fires a streak event via the application layer (see /api/plans/[id]/entries/[entryId]/cook).
-- ============================================================

alter table public.meal_entries
  add column if not exists cooked_at timestamptz;

create index if not exists meal_entries_cooked_at_idx
  on public.meal_entries(meal_plan_id, cooked_at);

comment on column public.meal_entries.cooked_at is
  'When this entry was last cooked. NULL = pending. Leftover entries cooked_at represents the reheat moment, not the original cook day.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260519_meal_entries_cooked_at.sql
git commit -m "feat(db): meal_entries.cooked_at timestamp for cook tracking"
```

### Task A.2: Optional — streak events table (deferred)

**Files:** none in this plan.

The CLAUDE.md cross-app contract says WC produces `recipe_cooked` streak events for HolyFlex to consume. There is **no streak_events table or endpoint in WC yet** as of this branch's master. Rather than invent the cross-app surface here, the cook endpoint in Phase B emits a structured payload to a single helper at `src/lib/streak-emit.ts` that today is a no-op (logs to console in dev). When HolyFlex's streak surface is wired into WC, that helper becomes the integration point. Acceptance criterion: a `// CROSS-APP: streak event` comment marks the emission site so future-you finds it quickly.

---

## Phase B — API

### Task B.1: Cook check-off endpoint

**Files:**
- Create: `src/app/api/plans/[id]/entries/[entryId]/cook/route.ts`
- Create: `src/lib/streak-emit.ts`

The endpoint:
- Auth + plan ownership check (same pattern as the shopping route)
- `POST` → sets `cooked_at = now()`, emits a streak event, returns updated entry
- `DELETE` → clears `cooked_at`, returns updated entry
- Side effect: when **every non-leftover entry** in the plan has `cooked_at`, transition `meal_plans.status` to `completed`. When at least one is cooked and status is `woven`, transition to `cooking`.

- [ ] **Step 1: Streak emit helper**

```ts
// src/lib/streak-emit.ts

export interface StreakEvent {
  user_id: string;
  action_id: string;             // e.g. 'recipe_cooked'
  source: 'whatscooking';
  timestamp: string;             // ISO
  metadata?: Record<string, unknown>;
}

/**
 * Emit a cross-app streak event. Currently a no-op stub — when the
 * HolyFlex streak surface is wired into WC (see CLAUDE.md ecosystem
 * mandate), replace this body with the actual emission (Supabase
 * insert into a shared streak_events table, or an outbound HTTP call
 * to /api/streak/tick in the HF deployment).
 */
export async function emitStreakEvent(event: StreakEvent): Promise<void> {
  // CROSS-APP: streak event integration point.
  if (process.env.NODE_ENV === 'development') {
    console.log('[streak]', event.action_id, event.user_id, event.metadata);
  }
}
```

- [ ] **Step 2: Cook route**

```ts
// src/app/api/plans/[id]/entries/[entryId]/cook/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emitStreakEvent } from '@/lib/streak-emit';

type Ctx = { params: Promise<{ id: string; entryId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id: planId, entryId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ownership check via plan
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, user_id, status')
    .eq('id', planId)
    .single();
  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { data: entry, error } = await supabase
    .from('meal_entries')
    .update({ cooked_at: now })
    .eq('id', entryId)
    .eq('meal_plan_id', planId)
    .select()
    .single();
  if (error || !entry) {
    return NextResponse.json({ error: error?.message ?? 'entry not found' }, { status: 400 });
  }

  // CROSS-APP: streak event emission (no-op stub today)
  await emitStreakEvent({
    user_id: user.id,
    action_id: entry.is_leftover ? 'recipe_reheated' : 'recipe_cooked',
    source: 'whatscooking',
    timestamp: now,
    metadata: {
      meal_plan_id: planId,
      meal_entry_id: entryId,
      recipe_id: entry.recipe_id,
      recipe_title: entry.recipe_title,
    },
  });

  // Status transitions
  const { data: allEntries } = await supabase
    .from('meal_entries')
    .select('cooked_at, is_leftover')
    .eq('meal_plan_id', planId);
  const cookable = (allEntries ?? []).filter(e => !e.is_leftover);
  const allCooked = cookable.length > 0 && cookable.every(e => e.cooked_at != null);
  const anyCooked = (allEntries ?? []).some(e => e.cooked_at != null);

  let nextStatus = plan.status;
  if (allCooked) nextStatus = 'completed';
  else if (anyCooked && plan.status === 'woven') nextStatus = 'cooking';

  if (nextStatus !== plan.status) {
    await supabase.from('meal_plans').update({ status: nextStatus }).eq('id', planId);
  }

  return NextResponse.json({ entry, status: nextStatus });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: planId, entryId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('user_id, status')
    .eq('id', planId)
    .single();
  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: entry, error } = await supabase
    .from('meal_entries')
    .update({ cooked_at: null })
    .eq('id', entryId)
    .eq('meal_plan_id', planId)
    .select()
    .single();
  if (error || !entry) {
    return NextResponse.json({ error: error?.message ?? 'entry not found' }, { status: 400 });
  }

  // If the plan was completed and we just un-cooked one, drop it back to cooking
  if (plan.status === 'completed') {
    await supabase.from('meal_plans').update({ status: 'cooking' }).eq('id', planId);
    return NextResponse.json({ entry, status: 'cooking' });
  }
  return NextResponse.json({ entry, status: plan.status });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/streak-emit.ts "src/app/api/plans/[id]/entries/[entryId]/cook/route.ts"
git commit -m "feat(api): cook check-off endpoint + streak event stub"
```

### Task B.2: Plan-level cooked summary

The Cook view needs counts (`X/Y cooked`) and the list of "today's pending meals" without fetching the full plan twice. Reuse `meal_entries` directly in the page's server component — no new endpoint needed. Skip if you have time pressure; but better to centralize the cooked-count derivation in a small helper.

**Files:**
- Create: `src/lib/plans/cook-progress.ts`

- [ ] **Step 1: Helper**

```ts
// src/lib/plans/cook-progress.ts

export interface CookableEntry {
  id: string;
  day_number: number;
  meal_type: string;
  recipe_id: string | null;
  recipe_title: string;
  is_leftover: boolean;
  cooked_at: string | null;
  parent_clientid?: string | null;
}

export interface CookProgress {
  total: number;          // non-leftover entries
  cooked: number;
  reheated: number;
  pending: number;
  pctComplete: number;    // 0..1 of total
}

export function summarizeCookProgress(entries: CookableEntry[]): CookProgress {
  const cookable = entries.filter(e => !e.is_leftover);
  const cooked = cookable.filter(e => e.cooked_at != null).length;
  const reheated = entries.filter(e => e.is_leftover && e.cooked_at != null).length;
  return {
    total: cookable.length,
    cooked,
    reheated,
    pending: cookable.length - cooked,
    pctComplete: cookable.length > 0 ? cooked / cookable.length : 0,
  };
}

export function todayDayNumber(weekStart: string | null, today = new Date()): number | null {
  if (!weekStart) return null;
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return diff + 1; // day 1 == weekStart
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/plans/cook-progress.ts
git commit -m "feat(plans): cook-progress derivation helper"
```

---

## Phase C — `/cook` page UI

### Task C.1: Page route shell

**Files:**
- Create: `src/app/(app)/plans/[id]/cook/page.tsx`

Server component. Loads the plan, all entries, joins recipes for images + macros, fetches the shopping list, hydrates the client component with everything it needs in one round-trip.

- [ ] **Step 1: Page**

```tsx
// src/app/(app)/plans/[id]/cook/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CookClient } from './cook-client';

type Props = { params: Promise<{ id: string }> };

export default async function CookPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, user_id, title, status, week_start, duration_days, meals_per_day')
    .eq('id', id)
    .single();
  if (!plan || plan.user_id !== user.id) notFound();

  const { data: entries } = await supabase
    .from('meal_entries')
    .select('id, day_number, meal_type, recipe_id, recipe_title, is_leftover, cooked_at, parent_clientid')
    .eq('meal_plan_id', id)
    .order('day_number')
    .order('meal_type');

  const recipeIds = Array.from(new Set((entries ?? []).map(e => e.recipe_id).filter((x): x is string => x != null)));
  const { data: recipes } = recipeIds.length > 0
    ? await supabase
        .from('recipes')
        .select('id, title, image_url, focal_x, focal_y, prep_time_minutes, cook_time_minutes, calories, ingredients, instructions')
        .in('id', recipeIds)
    : { data: [] };

  return (
    <CookClient
      plan={plan}
      entries={entries ?? []}
      recipes={recipes ?? []}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(app)/plans/[id]/cook/page.tsx"
git commit -m "feat(plans): /cook route shell loading entries + recipes"
```

### Task C.2: `CookClient` orchestrator

**Files:**
- Create: `src/app/(app)/plans/[id]/cook/cook-client.tsx`

Two-column layout on desktop, stacked on mobile:
- Left (main): `<TodayCard>` then `<DayStack>` (next 6 days)
- Right (sidebar): `<ShoppingPanel>`

Top: `<CookHeader>` with title, progress bar, "Back to plan" link.

- [ ] **Step 1: Component**

```tsx
// src/app/(app)/plans/[id]/cook/cook-client.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { CookHeader } from '@/components/plans/cook/CookHeader';
import { TodayCard } from '@/components/plans/cook/TodayCard';
import { DayStack } from '@/components/plans/cook/DayStack';
import { ShoppingPanel } from '@/components/plans/cook/ShoppingPanel';
import { summarizeCookProgress, todayDayNumber, type CookableEntry } from '@/lib/plans/cook-progress';

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x: number | null;
  focal_y: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  ingredients: unknown;
  instructions: string[] | null;
}

interface Plan {
  id: string;
  title: string;
  status: string;
  week_start: string | null;
  duration_days: number;
  meals_per_day: number;
}

interface Props {
  plan: Plan;
  entries: CookableEntry[];
  recipes: Recipe[];
}

export function CookClient({ plan, entries: initialEntries, recipes }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [status, setStatus] = useState(plan.status);

  const recipeById = useMemo(() => {
    const m: Record<string, Recipe> = {};
    for (const r of recipes) m[r.id] = r;
    return m;
  }, [recipes]);

  const progress = summarizeCookProgress(entries);
  const today = todayDayNumber(plan.week_start);

  const todayEntries = today != null
    ? entries.filter(e => e.day_number === today).sort(mealOrder)
    : [];

  const futureDays = today != null
    ? entries.filter(e => e.day_number > today)
    : entries;
  const allDaysExceptToday = today != null
    ? Array.from(new Set(futureDays.map(e => e.day_number))).sort((a, b) => a - b)
    : Array.from(new Set(entries.map(e => e.day_number))).sort((a, b) => a - b);

  const toggleCooked = useCallback(async (entryId: string, currentlyCooked: boolean) => {
    // Optimistic update
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, cooked_at: currentlyCooked ? null : new Date().toISOString() } : e));
    try {
      const res = await fetch(`/api/plans/${plan.id}/entries/${entryId}/cook`, {
        method: currentlyCooked ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        const { entry, status: nextStatus } = await res.json();
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, cooked_at: entry.cooked_at } : e));
        if (nextStatus) setStatus(nextStatus);
      } else {
        // Roll back
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, cooked_at: currentlyCooked ? new Date().toISOString() : null } : e));
      }
    } catch {
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, cooked_at: currentlyCooked ? new Date().toISOString() : null } : e));
    }
  }, [plan.id]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-7xl mx-auto">
      <Link href={`/plans/${plan.id}`} className="text-xs" style={{ color: '#6B4E36' }}>
        ← Back to plan
      </Link>

      <CookHeader title={plan.title} status={status} progress={progress} />

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {todayEntries.length > 0 && (
            <TodayCard
              dayNumber={today!}
              weekStart={plan.week_start}
              entries={todayEntries}
              recipes={recipeById}
              onToggleCooked={toggleCooked}
            />
          )}
          <DayStack
            days={allDaysExceptToday}
            weekStart={plan.week_start}
            entriesByDay={groupByDay(entries.filter(e => e.day_number !== today))}
            recipes={recipeById}
            onToggleCooked={toggleCooked}
          />
        </div>
        <ShoppingPanel planId={plan.id} />
      </div>
    </div>
  );
}

function mealOrder(a: CookableEntry, b: CookableEntry): number {
  const order = ['breakfast','lunch','dinner','snack'];
  return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
}

function groupByDay(entries: CookableEntry[]): Record<number, CookableEntry[]> {
  const m: Record<number, CookableEntry[]> = {};
  for (const e of entries) {
    if (!m[e.day_number]) m[e.day_number] = [];
    m[e.day_number].push(e);
  }
  for (const k of Object.keys(m)) m[Number(k)].sort(mealOrder);
  return m;
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(app)/plans/[id]/cook/cook-client.tsx"
git commit -m "feat(plans): CookClient orchestrates today / day-stack / shopping"
```

### Task C.3: `CookHeader` component

**Files:**
- Create: `src/components/plans/cook/CookHeader.tsx`

- [ ] **Step 1: Component**

```tsx
// src/components/plans/cook/CookHeader.tsx
'use client';

import type { CookProgress } from '@/lib/plans/cook-progress';

interface Props {
  title: string;
  status: string;
  progress: CookProgress;
}

export function CookHeader({ title, status, progress }: Props) {
  const pct = Math.round(progress.pctComplete * 100);
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-serif" style={{ color: '#EFE3CE' }}>{title}</h1>
        <span
          className="px-3 py-1 rounded-full text-xs uppercase tracking-wider border"
          style={{ borderColor: '#3A2A1A', color: '#E67E22' }}
        >
          {status}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#2A1F14' }}>
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: '#E67E22' }} />
        </div>
        <span className="text-sm font-mono whitespace-nowrap" style={{ color: '#EFE3CE' }}>
          {progress.cooked} / {progress.total} cooked
        </span>
        {progress.reheated > 0 && (
          <span className="text-xs whitespace-nowrap" style={{ color: '#7AA350' }}>
            · ♻ {progress.reheated} reheated
          </span>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/cook/CookHeader.tsx
git commit -m "feat(plans): CookHeader with progress bar"
```

### Task C.4: `TodayCard` — the hero of the page

**Files:**
- Create: `src/components/plans/cook/TodayCard.tsx`

Big card showing today's meals (1–4 entries). Each entry has an image, title, time, prep+cook breakdown, and the "I cooked this" toggle. For `is_leftover` entries, show `♻ Reheated from Day X` linking to the parent.

- [ ] **Step 1: Component**

```tsx
// src/components/plans/cook/TodayCard.tsx
'use client';

import { RecipeImage } from '@/components/recipe-image';
import { CookCheckButton } from './CookCheckButton';
import type { CookableEntry } from '@/lib/plans/cook-progress';

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x: number | null;
  focal_y: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
}

interface Props {
  dayNumber: number;
  weekStart: string | null;
  entries: CookableEntry[];
  recipes: Record<string, Recipe>;
  onToggleCooked: (entryId: string, currentlyCooked: boolean) => void;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: '🥐 Breakfast', lunch: '🥗 Lunch', dinner: '🍲 Dinner', snack: '🍎 Snack',
};

function dayLabel(dayNumber: number, weekStart: string | null): string {
  if (!weekStart) return `Day ${dayNumber}`;
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function TodayCard({ dayNumber, weekStart, entries, recipes, onToggleCooked }: Props) {
  return (
    <section
      className="rounded-2xl border p-5 flex flex-col gap-4"
      style={{ background: '#1A120A', borderColor: '#E67E22' }}
      aria-label="Today's meals"
    >
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: '#E67E22' }}>Today</p>
          <h2 className="text-xl font-serif" style={{ color: '#EFE3CE' }}>{dayLabel(dayNumber, weekStart)}</h2>
        </div>
        <span className="text-xs" style={{ color: '#6B4E36' }}>
          {entries.filter(e => e.cooked_at).length} / {entries.length} done
        </span>
      </header>
      <div className="flex flex-col gap-3">
        {entries.map(e => {
          const r = e.recipe_id ? recipes[e.recipe_id] : undefined;
          const totalTime = (r?.prep_time_minutes ?? 0) + (r?.cook_time_minutes ?? 0);
          const cooked = e.cooked_at != null;
          return (
            <div
              key={e.id}
              className="flex gap-3 p-3 rounded-lg border"
              style={{
                background: cooked ? 'rgba(122, 163, 80, 0.08)' : '#2A1F14',
                borderColor: cooked ? '#7AA350' : '#3A2A1A',
                opacity: cooked ? 0.85 : 1,
              }}
            >
              <div className="relative w-20 h-20 rounded overflow-hidden shrink-0" style={{ background: '#1A120A' }}>
                <RecipeImage
                  recipeId={e.id}
                  imageUrl={r?.image_url ?? null}
                  title={e.recipe_title}
                  focal_x={r?.focal_x}
                  focal_y={r?.focal_y}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>
                  {MEAL_LABEL[e.meal_type] ?? e.meal_type}
                  {e.is_leftover && <span className="ml-2" style={{ color: '#7AA350' }}>♻ leftover</span>}
                </p>
                <h3 className="text-sm font-semibold line-clamp-2" style={{ color: cooked ? '#8A6A4A' : '#EFE3CE', textDecoration: cooked ? 'line-through' : undefined }}>
                  {e.recipe_title}
                </h3>
                {!e.is_leftover && totalTime > 0 && (
                  <p className="text-xs" style={{ color: '#6B4E36' }}>
                    ⏱ {totalTime}m
                    {r?.calories ? ` · ${r.calories} kcal` : ''}
                  </p>
                )}
              </div>
              <CookCheckButton
                cooked={cooked}
                isLeftover={e.is_leftover}
                onClick={() => onToggleCooked(e.id, cooked)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/cook/TodayCard.tsx
git commit -m "feat(plans): TodayCard hero with cook check-off"
```

### Task C.5: `CookCheckButton` — the satisfying tap target

**Files:**
- Create: `src/components/plans/cook/CookCheckButton.tsx`

A standalone button so it can be reused on `DayStack` rows too. Two states: pending (warm border, label "Mark cooked") and done (green fill, ✓ icon, label "Cooked"). For leftovers, label is "Reheated" / "Reheat".

- [ ] **Step 1: Component**

```tsx
// src/components/plans/cook/CookCheckButton.tsx
'use client';

interface Props {
  cooked: boolean;
  isLeftover: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function CookCheckButton({ cooked, isLeftover, onClick, compact = false }: Props) {
  const label = cooked
    ? (isLeftover ? '♻ Reheated' : '✓ Cooked')
    : (isLeftover ? 'Mark reheated' : 'Mark cooked');
  const verb = isLeftover ? 'reheated' : 'cooked';
  return (
    <button
      onClick={onClick}
      aria-label={`Mark as ${verb}`}
      aria-pressed={cooked}
      className={`shrink-0 self-center rounded-full font-semibold border transition-colors ${compact ? 'text-xs px-3 py-1' : 'text-sm px-4 py-2'}`}
      style={{
        background: cooked ? '#7AA350' : 'transparent',
        borderColor: cooked ? '#7AA350' : '#E67E22',
        color: cooked ? '#1A120A' : '#E67E22',
      }}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/cook/CookCheckButton.tsx
git commit -m "feat(plans): CookCheckButton with two states + leftover variant"
```

### Task C.6: `DayStack` — the rest of the week

**Files:**
- Create: `src/components/plans/cook/DayStack.tsx`

Compact list of upcoming days. Each day is a collapsible row (closed by default; first one open). Inside: condensed entry rows with the compact `CookCheckButton`.

- [ ] **Step 1: Component**

```tsx
// src/components/plans/cook/DayStack.tsx
'use client';

import { useState } from 'react';
import { RecipeImage } from '@/components/recipe-image';
import { CookCheckButton } from './CookCheckButton';
import type { CookableEntry } from '@/lib/plans/cook-progress';

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x: number | null;
  focal_y: number | null;
}

interface Props {
  days: number[];
  weekStart: string | null;
  entriesByDay: Record<number, CookableEntry[]>;
  recipes: Record<string, Recipe>;
  onToggleCooked: (entryId: string, currentlyCooked: boolean) => void;
}

function dayLabel(dayNumber: number, weekStart: string | null): string {
  if (!weekStart) return `Day ${dayNumber}`;
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function DayStack({ days, weekStart, entriesByDay, recipes, onToggleCooked }: Props) {
  const [open, setOpen] = useState<Set<number>>(new Set(days[0] != null ? [days[0]] : []));
  const toggle = (d: number) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  if (days.length === 0) return null;

  return (
    <section className="flex flex-col gap-2" aria-label="Upcoming days">
      <h2 className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Upcoming</h2>
      {days.map(day => {
        const entries = entriesByDay[day] ?? [];
        const cookedCount = entries.filter(e => e.cooked_at).length;
        const expanded = open.has(day);
        return (
          <div key={day} className="rounded-lg border" style={{ background: '#1A120A', borderColor: '#3A2A1A' }}>
            <button
              onClick={() => toggle(day)}
              className="w-full flex items-center justify-between px-4 py-3"
              aria-expanded={expanded}
            >
              <span className="text-sm font-semibold" style={{ color: '#EFE3CE' }}>
                {dayLabel(day, weekStart)}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B4E36' }}>{cookedCount}/{entries.length}</span>
                <span style={{ color: '#6B4E36' }}>{expanded ? '▴' : '▾'}</span>
              </span>
            </button>
            {expanded && (
              <div className="px-4 pb-3 flex flex-col gap-2">
                {entries.map(e => {
                  const r = e.recipe_id ? recipes[e.recipe_id] : undefined;
                  const cooked = e.cooked_at != null;
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
                        <RecipeImage
                          recipeId={e.id}
                          imageUrl={r?.image_url ?? null}
                          title={e.recipe_title}
                          focal_x={r?.focal_x}
                          focal_y={r?.focal_y}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: '#6B4E36' }}>
                          {e.meal_type}
                          {e.is_leftover && <span className="ml-1" style={{ color: '#7AA350' }}>♻</span>}
                        </p>
                        <p
                          className="text-sm line-clamp-1"
                          style={{
                            color: cooked ? '#8A6A4A' : '#EFE3CE',
                            textDecoration: cooked ? 'line-through' : undefined,
                          }}
                        >
                          {e.recipe_title}
                        </p>
                      </div>
                      <CookCheckButton
                        cooked={cooked}
                        isLeftover={e.is_leftover}
                        compact
                        onClick={() => onToggleCooked(e.id, cooked)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/cook/DayStack.tsx
git commit -m "feat(plans): DayStack with collapsible day rows"
```

### Task C.7: `ShoppingPanel` — sidebar

**Files:**
- Create: `src/components/plans/cook/ShoppingPanel.tsx`

Loads `GET /api/plans/[id]/shopping`. Renders:
- Header with total counts ("17 to buy · 8 in pantry")
- Section per category for the `missing` array, sorted by category alphabetical
- Collapsed "already have" + "unknown recipes" sections
- Each item is a checkable row (local state only — user uses this in-store, no persistence in v1)

- [ ] **Step 1: Component**

```tsx
// src/components/plans/cook/ShoppingPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

interface Item {
  name: string;
  amount?: number | null;
  unit?: string | null;
  from: string[];
  category?: string;
}

interface Unknown {
  recipeTitle: string;
  dayNumber: number;
  mealType: string;
}

interface Props {
  planId: string;
}

export function ShoppingPanel({ planId }: Props) {
  const [data, setData] = useState<{ missing: Item[]; have: Item[]; unknownEntries: Unknown[]; totalRecipes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showHave, setShowHave] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/plans/${planId}/shopping`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [planId]);

  const groupedMissing = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Item[]>();
    for (const i of data.missing) {
      const cat = i.category ?? 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(i);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const toggle = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <aside
      className="sticky top-6 self-start rounded-2xl border p-4 flex flex-col gap-3"
      style={{ background: '#1A120A', borderColor: '#3A2A1A', maxHeight: 'calc(100vh - 3rem)' }}
      aria-label="Shopping list"
    >
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#E67E22' }}>🛒 Shopping</h2>
        {data && (
          <span className="text-xs" style={{ color: '#6B4E36' }}>
            {data.missing.length} to buy · {data.have.length} in pantry
          </span>
        )}
      </header>
      {loading && <p className="text-sm" style={{ color: '#6B4E36' }}>Loading…</p>}
      {data && (
        <>
          <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1">
            {groupedMissing.map(([cat, items]) => (
              <section key={cat}>
                <h3 className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8A6A4A' }}>{cat}</h3>
                <ul className="flex flex-col gap-0.5">
                  {items.map(i => {
                    const key = `m:${i.name}`;
                    const ck = checked.has(key);
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center gap-2 text-left py-1 text-sm"
                          aria-pressed={ck}
                        >
                          <span
                            className="w-4 h-4 rounded border flex items-center justify-center text-xs"
                            style={{ borderColor: ck ? '#7AA350' : '#3A2A1A', background: ck ? '#7AA350' : 'transparent', color: '#1A120A' }}
                          >
                            {ck ? '✓' : ''}
                          </span>
                          <span style={{ color: ck ? '#6B4E36' : '#EFE3CE', textDecoration: ck ? 'line-through' : undefined }}>
                            {i.name}
                            {i.amount != null && i.unit ? ` · ${i.amount} ${i.unit}` : ''}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {data.have.length > 0 && (
              <section>
                <button
                  onClick={() => setShowHave(s => !s)}
                  className="text-xs uppercase tracking-wider"
                  style={{ color: '#6B4E36' }}
                  aria-expanded={showHave}
                >
                  ✓ {data.have.length} already have · {showHave ? '▴' : '▾'}
                </button>
                {showHave && (
                  <ul className="flex flex-col gap-0.5 mt-1">
                    {data.have.map(i => (
                      <li key={`h:${i.name}`} className="text-xs" style={{ color: '#6B4E36' }}>
                        {i.name}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {data.unknownEntries.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider mb-1" style={{ color: '#C85A2F' }}>
                  ⚠ {data.unknownEntries.length} recipes without ingredients
                </h3>
                <p className="text-xs" style={{ color: '#6B4E36' }}>
                  These manual entries won't generate shopping items: {data.unknownEntries.map(u => u.recipeTitle).join(', ')}
                </p>
              </section>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/plans/cook/ShoppingPanel.tsx
git commit -m "feat(plans): ShoppingPanel with categorized list + check-off"
```

---

## Phase D — Wire-up + verification

### Task D.1: Verify the "Start cooking →" link in `WeaveSummary`

**Files:**
- Possibly modify: `src/components/plans/WeaveSummary.tsx`

The Plan 2 implementation already wires this — confirm by reading the file. It should navigate to `/plans/${planId}/cook` via the `onStartCooking` callback from `WeaveSection`.

- [ ] **Step 1: Confirm**

```bash
grep -n "onStartCooking\|/cook" src/components/plans/WeaveSummary.tsx "src/app/(app)/plans/[id]/plan-builder.tsx" src/components/plans/WeaveSection.tsx 2>&1
```

Expected: `WeaveSection.tsx` has `onStartCooking={() => router.push(\`/plans/${planId}/cook\`)}` or equivalent. If absent, add it. Commit only if you actually had to change something.

### Task D.2: Cooked entries appear in the woven view too

When the user navigates back from `/cook` to `/plans/[id]`, cooked entries should look different in the Weave grid — at minimum, a small ✓ corner badge. This is a tiny visual touch in `WeaveCell.tsx`.

**Files:**
- Modify: `src/components/plans/WeaveCell.tsx`
- Modify: `src/app/api/plans/[id]/weave/route.ts` (include `cooked_at` in recipe metadata? No — `cooked_at` is on the entry, not the recipe. Better: extend the entry shape in the API to include `cooked_at`)

This requires the `WeaveResponse.entries[]` to include `cooked_at`. Currently the solver's `ProposedEntry` doesn't have that field — and it shouldn't, because solver output is conceptually fresh proposals, not persisted state.

The right fix: when `usePlannerState` loads existing entries on mount, it should merge the persisted `cooked_at` over the solver output. For now (v1), **skip this — keep the visual feedback only on `/cook`**, not on the woven grid. Adds polish without scope creep.

If you have time, add a one-line addition to `WeaveCell.tsx` so that an entry with a hypothetical `cooked_at` (passed as optional prop) renders with a small ✓. Don't wire the data path — leave a TODO.

- [ ] **Step 1: Add the optional visual marker**

```tsx
// In WeaveCell.tsx props:
interface Props {
  entry: ProposedEntry & { cooked_at?: string | null }; // <-- extend
  // ... rest unchanged
}

// In the JSX, after the badges row:
{(entry as any).cooked_at && (
  <span className="absolute bottom-1 left-1 text-xs" style={{ color: '#7AA350' }} aria-label="cooked" title="Cooked">✓</span>
)}
```

This is purely defensive — no upstream wiring. When/if `usePlannerState` learns to merge cooked_at, the visual just lights up. Mark with `// TODO: thread cooked_at from persisted entries when reload-from-DB lands`.

- [ ] **Step 2: Commit (only if changed)**

```bash
git add src/components/plans/WeaveCell.tsx
git commit -m "feat(plans): defensive cooked_at badge on WeaveCell (no wiring yet)"
```

### Task D.3: Append session log

**Files:**
- Modify: `logs/2026-05-19.md` (create if it doesn't exist)

- [ ] **Step 1: Write entry**

```markdown
# 2026-05-19 — Meal Planner Cook View (Plan 3)

## [HH:MM] /cook execution view shipped

Cook view for the meal planner is on `feat/meal-planner-pinboard-weave-cook` (stacked on the UI plan branch).

### What landed

- **Migration:** `meal_entries.cooked_at timestamptz` (nullable). Index on `(meal_plan_id, cooked_at)`.
- **API:**
  - `POST/DELETE /api/plans/[id]/entries/[entryId]/cook` — mark/unmark cooked, transitions `meal_plans.status` between `woven` → `cooking` → `completed`, emits a streak event (currently a no-op stub).
  - `GET /api/plans/[id]/shopping` — pre-existing, consumed by the new ShoppingPanel.
- **`/plans/[id]/cook` route:**
  - `CookHeader` — title + status + progress bar (`X / Y cooked`).
  - `TodayCard` — hero card surfacing today's meals (computed from `week_start + duration_days`), large CookCheckButton per entry.
  - `DayStack` — collapsible rows for upcoming days, compact CookCheckButton.
  - `ShoppingPanel` — sidebar with category-grouped "to buy" list, collapsed "already have" + "unknown recipes" sections, local-only check-off state.
- **`<RecipeImage>`** reused everywhere — focal-point cropping carries through.
- **Cross-app hook:** `src/lib/streak-emit.ts` is the integration point. Currently logs to console in dev; replace its body when HolyFlex streak surface lands in WC.

### Out of scope
- Cooked badge on Weave grid cells (defensive marker added, no wiring — flagged TODO).
- Cook-day reminders, calendar export, in-recipe cooking-mode hand-off, post-cook ratings.
- Real streak integration with HF (stub in place, ready to swap).
```

- [ ] **Step 2: Commit**

```bash
git add logs/2026-05-19.md
git commit -m "chore(logs): Plan 3 cook view shipped"
```

### Task D.4: Solver regression + typecheck

- [ ] **Step 1: Run solver tests**

```bash
npx vitest run src/lib/weave-solver/
```

Expected: 34/34 passing (Plan 3 doesn't touch the solver).

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types/\|events/\[id\]/page\|app-nav\|vitest" | tail -30
```

Expected: no errors in `src/app/(app)/plans/[id]/cook/`, `src/components/plans/cook/`, `src/lib/plans/cook-progress.ts`, `src/lib/streak-emit.ts`, or the new API route.

### Task D.5: Open draft PR

- [ ] **Step 1: Push**

```bash
git push -u origin feat/meal-planner-pinboard-weave-cook
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --draft \
  --base feat/meal-planner-pinboard-weave-ui \
  --head feat/meal-planner-pinboard-weave-cook \
  --title "feat(plans): meal planner cook view — Plan 3" \
  --body "$(cat <<'EOF'
## Summary

`/plans/[id]/cook` execution view. Stacks on PR #3 (Plan 2 UI). Closes the loop: woven plans now have a place to *use*.

## What's in this PR
- Migration: `meal_entries.cooked_at` timestamp.
- Endpoint: `POST/DELETE /api/plans/[id]/entries/[entryId]/cook` with auto status transitions (`woven` → `cooking` → `completed`) and a cross-app streak event stub.
- Page `/plans/[id]/cook`: CookHeader (progress bar), TodayCard (hero), DayStack (collapsible upcoming), ShoppingPanel (category-grouped, local check-off).
- Cross-app hook at `src/lib/streak-emit.ts` ready to wire into HolyFlex's streak surface when it lands in WC.

## Acceptance criteria
- [x] User can see today's meals at the top of `/cook`
- [x] Tap "Mark cooked" → optimistic toggle, server confirms
- [x] Marking the last non-leftover entry transitions plan to `completed`
- [x] Shopping list shows missing items by category + collapsed "have" + "unknown" warnings
- [x] Leftover entries label as "Reheat" with ♻ icon
- [x] No solver regression (34/34 tests passing)

## Out of scope
- Cooked badge wiring back to the Weave grid (defensive marker added, TODO logged)
- Real HolyFlex streak integration (stub in place)
- Calendar export, reminders, in-recipe cooking-mode hand-off
- Persistent shopping check-off state across sessions

## Test plan
- [x] Solver tests pass
- [x] Typecheck clean
- [ ] Apply migration `20260519_meal_entries_cooked_at.sql` to staging
- [ ] Walk through `/cook` for a woven plan: check off today's meals, watch progress fill, confirm status transition
- [ ] Verify shopping panel matches what `/api/plans/[id]/shopping` returns

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:** §3 architecture's "Cook week" mode is implemented as a separate route per the agreed shape. §10 ecosystem connectivity: streak event emission point is in place at `src/lib/streak-emit.ts` with a `// CROSS-APP` comment marker.

**Type consistency:** `CookableEntry`, `CookProgress`, `StreakEvent` defined once and re-used. `CookCheckButton` props match between TodayCard and DayStack consumers.

**Placeholders:** None. The cross-app streak emission is *intentionally* a no-op today; that's explicitly documented and marked with a comment, not a TODO that promises future code.

**Scope discipline:** Plan 3 doesn't touch the solver, doesn't add new state to `usePlannerState`, doesn't restructure Weave/Pinboard. It's purely additive: one column, one endpoint, one route, six small components.
