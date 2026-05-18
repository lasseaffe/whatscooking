// src/lib/weave-solver/__tests__/leftovers.test.ts
import { describe, it, expect } from 'vitest';
import { expandLeftovers } from '../leftovers';
import type { ProposedEntry } from '../types';

const entry = (over: Partial<ProposedEntry>): ProposedEntry => ({
  clientid: 'p1', day_number: 1, meal_type: 'dinner',
  recipe_id: 'r1', recipe_title: 'Curry', source: 'pinned',
  is_leftover: false, parent_clientid: null, locked: true, position: 0,
  ...over,
});

describe('expandLeftovers', () => {
  it('returns input unchanged when batch_enabled=false', () => {
    const placed = [entry({})];
    const slots = [{ day_number: 2, meal_type: 'dinner' as const, is_weekend: false }];
    const result = expandLeftovers(placed, slots, { batch_enabled: false }, new Set(['r1']));
    expect(result.leftover_entries).toEqual([]);
    expect(result.remaining_slots).toHaveLength(1);
  });

  it('adds a leftover entry on the next available day for a batch-friendly pin', () => {
    const placed = [entry({ clientid: 'p1', day_number: 1, recipe_id: 'r1' })];
    const slots = [
      { day_number: 2, meal_type: 'dinner' as const, is_weekend: false },
      { day_number: 3, meal_type: 'dinner' as const, is_weekend: false },
    ];
    const result = expandLeftovers(placed, slots, { batch_enabled: true }, new Set(['r1']));
    expect(result.leftover_entries).toHaveLength(1);
    expect(result.leftover_entries[0].day_number).toBe(2);
    expect(result.leftover_entries[0].is_leftover).toBe(true);
    expect(result.leftover_entries[0].source).toBe('pinned');
    expect(result.leftover_entries[0].parent_clientid).toBe('p1');
    expect(result.leftover_entries[0].recipe_id).toBe('r1');
    expect(result.remaining_slots).toHaveLength(1);
  });

  it('skips a pin that isn\'t batch_friendly', () => {
    const placed = [entry({ recipe_id: 'r1' })];
    const slots = [{ day_number: 2, meal_type: 'dinner' as const, is_weekend: false }];
    const result = expandLeftovers(placed, slots, { batch_enabled: true }, new Set()); // empty set
    expect(result.leftover_entries).toEqual([]);
  });
});
