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
  cookOnceEatTwice?: Set<string>;
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

export function TodayCard({ dayNumber, weekStart, entries, recipes, onToggleCooked, cookOnceEatTwice }: Props) {
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
                <h3 className="text-sm font-semibold line-clamp-2 flex items-center gap-2" style={{ color: cooked ? '#8A6A4A' : '#EFE3CE', textDecoration: cooked ? 'line-through' : undefined }}>
                  <span className="line-clamp-2">{e.recipe_title}</span>
                  {!e.is_leftover && e.recipe_id && cookOnceEatTwice?.has(e.recipe_id) && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: 'rgba(122, 163, 80, 0.2)', color: '#7AA350' }}
                      title="Plan reuses this dish as leftovers"
                    >
                      🍳 2×
                    </span>
                  )}
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
