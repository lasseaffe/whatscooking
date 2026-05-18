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
