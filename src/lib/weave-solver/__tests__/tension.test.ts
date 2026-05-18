import { describe, it, expect } from 'vitest';
import { computeTension } from '../tension';
import type { ProposedEntry, SolverRecipe } from '../types';

const r = (id: string, over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id, title: id, image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

const e = (clientid: string, day: number, recipe_id: string, is_leftover = false): ProposedEntry => ({
  clientid, day_number: day, meal_type: 'dinner',
  recipe_id, recipe_title: recipe_id,
  source: 'pinned', is_leftover, parent_clientid: null, locked: false, position: 0,
});

describe('computeTension', () => {
  it('zero tension for varied weeks', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r2'), e('c', 3, 'r3')];
    const pool = new Map([
      ['r1', r('r1', { cuisine_type: 'italian' })],
      ['r2', r('r2', { cuisine_type: 'thai' })],
      ['r3', r('r3', { cuisine_type: 'mexican' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts).toHaveLength(0);
    expect(out.byClientid['a'].tension).toBe(0);
  });

  it('flags adjacent cuisine collision', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r2')];
    const pool = new Map([
      ['r1', r('r1', { cuisine_type: 'italian' })],
      ['r2', r('r2', { cuisine_type: 'italian' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts.length).toBeGreaterThan(0);
    expect(out.conflicts[0].reason).toContain('cuisine');
    expect(out.byClientid['a'].tension).toBeGreaterThan(0);
    expect(out.byClientid['b'].tension).toBeGreaterThan(0);
  });

  it('flags shared protein keyword in titles', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r2')];
    const pool = new Map([
      ['r1', r('r1', { title: 'Roast Chicken with Rosemary' })],
      ['r2', r('r2', { title: 'Chicken Tikka Masala' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts.some(c => c.reason.includes('chicken'))).toBe(true);
  });

  it('ignores leftover entries (a leftover repeating its parent is fine)', () => {
    const entries = [e('a', 1, 'r1'), e('b', 2, 'r1', true)];
    const pool = new Map([['r1', r('r1', { cuisine_type: 'italian' })]]);
    const out = computeTension(entries, pool);
    expect(out.conflicts).toHaveLength(0);
  });

  it('only flags adjacent days (1 apart), not 2+ apart', () => {
    const entries = [e('a', 1, 'r1'), e('b', 3, 'r2')];
    const pool = new Map([
      ['r1', r('r1', { cuisine_type: 'italian' })],
      ['r2', r('r2', { cuisine_type: 'italian' })],
    ]);
    const out = computeTension(entries, pool);
    expect(out.conflicts).toHaveLength(0);
  });
});
