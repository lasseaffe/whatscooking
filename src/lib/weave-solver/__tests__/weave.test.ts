// src/lib/weave-solver/__tests__/weave.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { weave } from '../index';
import { resetClientIdCounter } from '../util';
import type { SolverInput, SolverRecipe } from '../types';

const r = (id: string, over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id, title: `Recipe ${id}`, image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: 500, protein_g: 20, carbs_g: 40, fat_g: 15,
  batch_friendly: false, pantry_match: 0.5, inspiration_match: 0,
  ...over,
});

const baseInput: SolverInput = {
  duration_days: 3,
  week_start: null,
  pins: [r('pin1'), r('pin2')],
  pool: [r('s1', { pantry_match: 0.9 }), r('s2', { pantry_match: 0.8 }), r('s3', { pantry_match: 0.7 })],
  constraints: {
    diet: [], time_weeknight_max: 30, time_weekend_max: 120,
    squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
    anti_repeat: 'moderate', batch_enabled: false,
    meal_types: ['dinner'],
  },
  seed: 0,
};

beforeEach(() => resetClientIdCounter());

describe('weave', () => {
  it('fills every slot when pool is large enough', () => {
    const out = weave(baseInput);
    expect(out.entries).toHaveLength(3);
    expect(out.summary.slots_total).toBe(3);
    expect(out.summary.slots_filled).toBe(3);
  });

  it('all pinned recipes appear with source=pinned and locked=true', () => {
    const out = weave(baseInput);
    const pinned = out.entries.filter(e => e.source === 'pinned');
    expect(pinned).toHaveLength(2);
    expect(pinned.every(p => p.locked)).toBe(true);
    expect(new Set(pinned.map(p => p.recipe_id))).toEqual(new Set(['pin1', 'pin2']));
  });

  it('is deterministic at seed=0', () => {
    resetClientIdCounter();
    const a = weave(baseInput);
    resetClientIdCounter();
    const b = weave(baseInput);
    expect(a.entries.map(e => ({ d: e.day_number, m: e.meal_type, r: e.recipe_id })))
      .toEqual(b.entries.map(e => ({ d: e.day_number, m: e.meal_type, r: e.recipe_id })));
  });

  it('produces a leftover when batch_enabled and pin is batch_friendly', () => {
    const input: SolverInput = {
      ...baseInput,
      pins: [r('pin1', { batch_friendly: true })],
      pool: [r('s1'), r('s2')],
      constraints: { ...baseInput.constraints, batch_enabled: true },
    };
    const out = weave(input);
    const leftovers = out.entries.filter(e => e.is_leftover);
    expect(leftovers).toHaveLength(1);
    expect(leftovers[0].parent_clientid).toBeTruthy();
    expect(out.summary.leftover_count).toBe(1);
  });
});
