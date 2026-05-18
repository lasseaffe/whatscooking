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
