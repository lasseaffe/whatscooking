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
      is_leftover: false,
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
