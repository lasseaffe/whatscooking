// src/app/(app)/plans/[id]/cook/cook-client.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
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
