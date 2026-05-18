// src/lib/weave-solver/__tests__/place-pins.test.ts
import { describe, it, expect } from 'vitest';
import { placePins } from '../place-pins';
import { buildSlots } from '../slots';
import type { SolverRecipe, SolverConstraints } from '../types';

const r = (over: Partial<SolverRecipe>): SolverRecipe => ({
  id: 'x', title: 'x', image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: ['dinner'], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

const constraints: SolverConstraints = {
  diet: [], time_weeknight_max: 30, time_weekend_max: 120,
  squad_size: 2, pantry_aware: false, pantry_missing_max: 4,
  anti_repeat: 'moderate', batch_enabled: false,
  meal_types: ['dinner'],
};

describe('placePins', () => {
  it('places each pin into exactly one slot', () => {
    const slots = buildSlots({ duration_days: 3, meal_types: ['dinner'], week_start: null });
    const pins = [r({ id: 'a' }), r({ id: 'b' })];
    const { placed, remaining_slots } = placePins(pins, slots, constraints);
    expect(placed).toHaveLength(2);
    expect(remaining_slots).toHaveLength(1);
    expect(new Set(placed.map(p => p.recipe_id))).toEqual(new Set(['a', 'b']));
  });

  it('routes high-effort pins to weekend slots', () => {
    const slots = buildSlots({
      duration_days: 7,
      meal_types: ['dinner'],
      week_start: '2026-05-18', // Monday → Sat=day6, Sun=day7
    });
    const pins = [
      r({ id: 'long', prep_time_minutes: 30, cook_time_minutes: 60 }), // 90m
      r({ id: 'short', prep_time_minutes: 10, cook_time_minutes: 15 }), // 25m
    ];
    const { placed } = placePins(pins, slots, constraints);
    const long = placed.find(p => p.recipe_id === 'long')!;
    const short = placed.find(p => p.recipe_id === 'short')!;
    expect([6, 7]).toContain(long.day_number);
    expect([1, 2, 3, 4, 5]).toContain(short.day_number);
  });

  it('returns no placements when no slots remain', () => {
    const slots = buildSlots({ duration_days: 1, meal_types: ['dinner'], week_start: null });
    const pins = [r({ id: 'a' }), r({ id: 'b' })];
    const { placed, remaining_slots } = placePins(pins, slots, constraints);
    expect(placed).toHaveLength(1);
    expect(remaining_slots).toHaveLength(0);
  });
});
