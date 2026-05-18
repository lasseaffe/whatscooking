// src/lib/weave-solver/place-pins.ts
import type { SolverRecipe, SolverConstraints, ProposedEntry } from './types';
import type { Slot } from './slots';
import { dayBudget, } from './slots';
import { effortFit, totalCookMinutes } from './scoring';
import { newClientId } from './util';

interface PinPlacement {
  placed: ProposedEntry[];
  remaining_slots: Slot[];
}

export function placePins(
  pins: SolverRecipe[],
  slots: Slot[],
  c: SolverConstraints,
): PinPlacement {
  let remaining = [...slots];
  const placed: ProposedEntry[] = [];

  // Sort pins by descending effort so heavy ones get first dibs on weekend slots
  const ordered = [...pins].sort((a, b) => totalCookMinutes(b) - totalCookMinutes(a));

  for (const pin of ordered) {
    if (remaining.length === 0) break;
    // Score each remaining slot for this pin
    let best = remaining[0];
    let bestScore = -1;
    for (const s of remaining) {
      const budget = dayBudget(s.is_weekend, c);
      const score = effortFit(pin, budget);
      if (score > bestScore) { bestScore = score; best = s; }
    }
    placed.push({
      clientid: newClientId(),
      day_number: best.day_number,
      meal_type: best.meal_type,
      recipe_id: pin.id,
      recipe_title: pin.title,
      source: 'pinned',
      is_leftover: false,
      parent_clientid: null,
      locked: true,
      position: 0,
    });
    remaining = remaining.filter(s => !(s.day_number === best.day_number && s.meal_type === best.meal_type));
  }
  return { placed, remaining_slots: remaining };
}
