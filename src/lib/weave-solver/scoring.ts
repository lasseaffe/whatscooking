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
