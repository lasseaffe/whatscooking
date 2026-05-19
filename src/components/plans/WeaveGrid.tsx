'use client';

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { WeaveCell } from './WeaveCell';
import { DayDensityRibbon } from './DayDensityRibbon';
import type { ProposedEntry, MealType } from '@/lib/weave-solver';

interface Props {
  entries: ProposedEntry[];
  recipes: Record<string, { image_url: string | null; focal_x?: number | null; focal_y?: number | null; prep_time_minutes?: number | null; cook_time_minutes?: number | null }>;
  durationDays: number;
  mealTypes: MealType[];
  weekStart: string | null;
  onCellTap: (day: number, mealType: MealType, entry: ProposedEntry | null) => void;
  onCellRemove: (clientid: string) => void;
  onPinSuggestion: (clientid: string) => void;
  tensionByClientid?: Record<string, { tension: number }>;
  conflictsByClientid?: Record<string, string[]>;
  onSwapCells?: (aClientid: string, bClientid: string) => void;
  pantryPctByRecipeId?: Record<string, number>;
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};

export function WeaveGrid({ entries, recipes, durationDays, mealTypes, weekStart, onCellTap, onCellRemove, onPinSuggestion, tensionByClientid, conflictsByClientid, onSwapCells, pantryPctByRecipeId }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function dayStats(day: number): { cookMinutes: number; hasLeftover: boolean; pantryPct: number } {
    let cookMinutes = 0;
    let hasLeftover = false;
    let pantrySum = 0;
    let pantryCount = 0;
    for (const e of entries) {
      if (e.day_number !== day) continue;
      if (e.is_leftover) { hasLeftover = true; continue; }
      const r = recipes[e.recipe_id];
      if (r) cookMinutes += (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
      const p = pantryPctByRecipeId?.[e.recipe_id];
      if (typeof p === 'number') { pantrySum += p; pantryCount += 1; }
    }
    return { cookMinutes, hasLeftover, pantryPct: pantryCount > 0 ? pantrySum / pantryCount : 0 };
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const a = event.active?.id;
    const b = event.over?.id;
    if (!a || !b || a === b) return;
    onSwapCells?.(String(a), String(b));
  };

  const leftoverParentIds = new Set(
    entries.filter(e => e.is_leftover && e.parent_clientid).map(e => e.parent_clientid as string)
  );

  const dayLabel = (n: number) => {
    if (!weekStart) return `Day ${n}`;
    const d = new Date(weekStart);
    d.setDate(d.getDate() + n - 1);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const get = (day: number, mt: MealType) =>
    entries.find(e => e.day_number === day && e.meal_type === mt) ?? null;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <div className="overflow-x-auto">
      <div className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${durationDays}, minmax(140px, 1fr))` }}>
        <div />
        {Array.from({ length: durationDays }).map((_, i) => {
          const day = i + 1;
          const stats = dayStats(day);
          return (
            <div key={i} className="text-xs text-center font-semibold pb-2" style={{ color: '#8A6A4A' }}>
              <div>{dayLabel(day)}</div>
              <DayDensityRibbon cookMinutes={stats.cookMinutes} hasLeftover={stats.hasLeftover} pantryPct={stats.pantryPct} />
            </div>
          );
        })}
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
                      tension={tensionByClientid?.[entry.clientid]?.tension ?? 0}
                      conflictReasons={conflictsByClientid?.[entry.clientid] ?? []}
                      hasLeftoverDescendant={leftoverParentIds.has(entry.clientid)}
                    />
                  ) : (
                    <button
                      onClick={() => onCellTap(day, mt, null)}
                      className="w-full h-full min-h-20 rounded-md border-dashed border flex items-center justify-center text-2xl"
                      style={{ borderColor: '#3A2A1A', color: '#3A2A1A' }}
                      aria-label={`Add ${mt} for day ${day}`}
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
    </DndContext>
  );
}
