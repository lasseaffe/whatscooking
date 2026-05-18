// src/lib/weave-solver/summary.ts
import type { ProposedEntry, SolverRecipe, WeaveSummary } from './types';
import { totalCookMinutes } from './scoring';

export function computeSummary(
  entries: ProposedEntry[],
  pool: Map<string, SolverRecipe>,
  slots_total: number,
): WeaveSummary {
  const slots_filled = entries.length;
  const leftover_count = entries.filter(e => e.is_leftover).length;

  let active_minutes = 0;
  let pantry_sum = 0;
  let pantry_count = 0;
  const cuisines: string[] = [];
  for (const ent of entries) {
    const r = pool.get(ent.recipe_id);
    if (!r) continue;
    if (!ent.is_leftover) {
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
