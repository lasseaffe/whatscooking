// src/lib/weave-solver/leftovers.ts
import type { ProposedEntry } from './types';
import type { Slot } from './slots';
import { newClientId } from './util';

export function expandLeftovers(
  placed: ProposedEntry[],
  slots: Slot[],
  c: { batch_enabled: boolean },
  batch_recipe_ids: Set<string>,
): { leftover_entries: ProposedEntry[]; remaining_slots: Slot[] } {
  if (!c.batch_enabled) return { leftover_entries: [], remaining_slots: slots };

  let remaining = [...slots];
  const leftovers: ProposedEntry[] = [];

  for (const pin of placed) {
    if (!batch_recipe_ids.has(pin.recipe_id)) continue;
    // Find the earliest slot strictly after the pin's day with matching meal_type
    const nextSlot = remaining
      .filter(s => s.day_number > pin.day_number && s.meal_type === pin.meal_type)
      .sort((a, b) => a.day_number - b.day_number)[0];
    if (!nextSlot) continue;
    leftovers.push({
      clientid: newClientId(),
      day_number: nextSlot.day_number,
      meal_type: nextSlot.meal_type,
      recipe_id: pin.recipe_id,
      recipe_title: `${pin.recipe_title} (leftover)`,
      source: 'pinned',
      is_leftover: true,
      parent_clientid: pin.clientid,
      locked: false,
      position: 0,
    });
    remaining = remaining.filter(s => !(s.day_number === nextSlot.day_number && s.meal_type === nextSlot.meal_type));
  }
  return { leftover_entries: leftovers, remaining_slots: remaining };
}
