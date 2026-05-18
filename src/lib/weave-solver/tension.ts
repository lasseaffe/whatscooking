// src/lib/weave-solver/tension.ts
import type { ProposedEntry, SolverRecipe } from './types';

const PROTEIN_KEYWORDS = ['chicken', 'beef', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'tofu', 'lentil', 'chickpea', 'duck', 'turkey'];

export interface Conflict {
  clientid_a: string;
  clientid_b: string;
  reason: string;
}

export interface TensionMap {
  [clientid: string]: { tension: number };
}

export interface TensionResult {
  byClientid: TensionMap;
  conflicts: Conflict[];
}

function detectProtein(recipe: SolverRecipe | undefined): string | null {
  if (!recipe) return null;
  const haystack = `${recipe.title} ${recipe.dish_types.join(' ')}`.toLowerCase();
  for (const k of PROTEIN_KEYWORDS) if (haystack.includes(k)) return k;
  return null;
}

export function computeTension(
  entries: ProposedEntry[],
  pool: Map<string, SolverRecipe>,
): TensionResult {
  const conflicts: Conflict[] = [];
  const byClientid: TensionMap = {};
  for (const e of entries) byClientid[e.clientid] = { tension: 0 };

  // v1: flag adjacent-day same-meal-type conflicts only. Leftovers excluded.
  const live = entries.filter(e => !e.is_leftover);

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (Math.abs(a.day_number - b.day_number) !== 1) continue;
      if (a.meal_type !== b.meal_type) continue;

      const ra = pool.get(a.recipe_id);
      const rb = pool.get(b.recipe_id);
      if (!ra || !rb) continue;

      const reasons: string[] = [];
      if (ra.cuisine_type && ra.cuisine_type === rb.cuisine_type) {
        reasons.push(`same cuisine (${ra.cuisine_type})`);
      }
      const sharedDishes = ra.dish_types.filter(d => rb.dish_types.includes(d));
      if (sharedDishes.length > 0) {
        reasons.push(`shared dish type (${sharedDishes[0]})`);
      }
      const pa = detectProtein(ra);
      const pb = detectProtein(rb);
      if (pa && pa === pb) {
        reasons.push(`same protein (${pa})`);
      }

      if (reasons.length > 0) {
        const reason = reasons.join(', ');
        conflicts.push({ clientid_a: a.clientid, clientid_b: b.clientid, reason });
        byClientid[a.clientid].tension = Math.min(1, byClientid[a.clientid].tension + 0.4 * reasons.length);
        byClientid[b.clientid].tension = Math.min(1, byClientid[b.clientid].tension + 0.4 * reasons.length);
      }
    }
  }

  return { byClientid, conflicts };
}
