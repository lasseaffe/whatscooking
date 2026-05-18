// src/lib/weave-solver/__tests__/fill-suggestions.test.ts
import { describe, it, expect } from 'vitest';
import { fillSuggestions } from '../fill-suggestions';
import type { SolverRecipe, SolverConstraints, ProposedEntry } from '../types';

const r = (over: Partial<SolverRecipe>): SolverRecipe => ({
  id: 'x', title: 'X', image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 15,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

const c: SolverConstraints = {
  diet: [], time_weeknight_max: 30, time_weekend_max: 120,
  squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
  anti_repeat: 'moderate', batch_enabled: false,
  meal_types: ['dinner'],
};

describe('fillSuggestions', () => {
  it('fills every remaining slot when pool is non-empty', () => {
    const slots = [
      { day_number: 1, meal_type: 'dinner' as const, is_weekend: false },
      { day_number: 2, meal_type: 'dinner' as const, is_weekend: false },
    ];
    const pool = [r({ id: 'p1' }), r({ id: 'p2' })];
    const out = fillSuggestions(slots, pool, [], c, 0);
    expect(out).toHaveLength(2);
    expect(out.every(e => e.source === 'suggestion')).toBe(true);
  });

  it('prefers high pantry_match over low', () => {
    const slots = [{ day_number: 1, meal_type: 'dinner' as const, is_weekend: false }];
    const pool = [
      r({ id: 'low',  pantry_match: 0.1 }),
      r({ id: 'high', pantry_match: 0.9 }),
    ];
    const out = fillSuggestions(slots, pool, [], c, 0);
    expect(out[0].recipe_id).toBe('high');
  });

  it('does not reuse a recipe already on the plan', () => {
    const slots = [{ day_number: 2, meal_type: 'dinner' as const, is_weekend: false }];
    const placed: ProposedEntry[] = [{
      clientid: 'x', day_number: 1, meal_type: 'dinner', recipe_id: 'p1', recipe_title: 'P1',
      source: 'pinned', is_leftover: false, parent_clientid: null, locked: true, position: 0,
    }];
    const pool = [r({ id: 'p1' }), r({ id: 'p2' })];
    const out = fillSuggestions(slots, pool, placed, c, 0);
    expect(out[0].recipe_id).toBe('p2');
  });

  it('produces empty list when pool is empty', () => {
    const slots = [{ day_number: 1, meal_type: 'dinner' as const, is_weekend: false }];
    expect(fillSuggestions(slots, [], [], c, 0)).toEqual([]);
  });
});
