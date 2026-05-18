'use client';

import { ConstraintChipBar } from './ConstraintChipBar';
import { InspirationChips } from './InspirationChips';
import { PinboardFeed } from './PinboardFeed';
import { PinTray } from './PinTray';
import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
  durationDays: number;
  mealsPerDay: number;
}

export function Pinboard({ state, planId, durationDays, mealsPerDay }: Props) {
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
        durationDays={durationDays}
        mealsPerDay={mealsPerDay}
        onRemove={state.removePin}
        onWeave={() => state.runWeave({ persistUndo: false })}
        weaving={state.loading}
      />
    </section>
  );
}
