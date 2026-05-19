'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SolverOutput, ProposedEntry } from '@/lib/weave-solver';

export interface WeaveRecipeMeta {
  id: string;
  image_url: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sat_fat_g: number | null;
  sodium_mg: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  macros_estimated: boolean | null;
  cuisine_type?: string | null;
  dish_types?: string[] | null;
  pantry_match?: number;
}

export interface WeaveResponse extends SolverOutput {
  recipes?: WeaveRecipeMeta[];
}

export type PlanStatus = 'planning' | 'active' | 'completed' | 'draft' | 'woven' | 'cooking' | 'archived';

export interface Pin {
  id: string;
  recipe_id: string;
  priority: number;
  pinned_at: string;
  recipe: {
    id: string;
    title: string;
    image_url: string | null;
    focal_x?: number | null;
    focal_y?: number | null;
    cuisine_type: string | null;
    dietary_tags: string[];
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    batch_friendly: boolean;
  };
}

export interface PinboardFilters {
  diet: string[];
  time_weeknight: number;
  time_weekend: number;
  squad_size: number;
  pantry_aware: boolean;
  pantry_missing_max: number;
  anti_repeat: 'strict' | 'moderate' | 'off';
  batch_enabled: boolean;
  inspiration_tags: string[];
  squad_aware: boolean;
}

const DEFAULT_FILTERS: PinboardFilters = {
  diet: [],
  time_weeknight: 30,
  time_weekend: 120,
  squad_size: 2,
  pantry_aware: false,
  pantry_missing_max: 4,
  anti_repeat: 'moderate',
  batch_enabled: false,
  inspiration_tags: [],
  squad_aware: true,
};

export function usePlannerState(planId: string, initialStatus: PlanStatus, initialFilters: Partial<PinboardFilters>) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [filters, setFiltersState] = useState<PinboardFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [weave, setWeave] = useState<WeaveResponse | null>(null);
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<WeaveResponse[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    fetch(`/api/plans/${planId}/pins`)
      .then(r => r.ok ? r.json() : { pins: [] })
      .then(d => setPins(d.pins ?? []));
  }, [planId]);

  const runWeave = useCallback(async (opts?: { seed?: number; persistUndo?: boolean }) => {
    setLoading(true);
    if (opts?.persistUndo && weave) setUndoStack(s => [...s.slice(-9), weave]);
    try {
      const res = await fetch(`/api/plans/${planId}/weave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: opts?.seed ?? 0 }),
      });
      if (res.ok) {
        const out = await res.json();
        setWeave(out);
        setStatus('woven');
      }
    } finally { setLoading(false); }
  }, [planId, weave]);

  const setFilters = useCallback((patch: Partial<PinboardFilters>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...patch };
      // Persist to plan
      fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinboard_filters: next }),
      });
      // Debounced auto-reweave when we already have a woven plan
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (weave) {
        debounceRef.current = setTimeout(() => { void runWeave({ persistUndo: true }); }, 400);
      }
      return next;
    });
  }, [planId, runWeave, weave]);

  const addPin = useCallback(async (recipe_id: string) => {
    const res = await fetch(`/api/plans/${planId}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id }),
    });
    if (res.ok) {
      const list = await fetch(`/api/plans/${planId}/pins`).then(r => r.json());
      setPins(list.pins ?? []);
    }
  }, [planId]);

  const removePin = useCallback(async (recipe_id: string) => {
    await fetch(`/api/plans/${planId}/pins/${recipe_id}`, { method: 'DELETE' });
    setPins(prev => prev.filter(p => p.recipe_id !== recipe_id));
  }, [planId]);

  const reorderPin = useCallback(async (recipe_id: string, priority: number) => {
    await fetch(`/api/plans/${planId}/pins/${recipe_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
    setPins(prev => prev.map(p => p.recipe_id === recipe_id ? { ...p, priority } : p));
  }, [planId]);

  const swapEntry = useCallback((clientid: string, replacement: Partial<ProposedEntry> & { recipe_id: string; recipe_title: string }) => {
    setWeave(prev => prev ? ({
      ...prev,
      entries: prev.entries.map(e =>
        e.clientid === clientid
          ? { ...e, ...replacement, source: 'suggestion', is_leftover: false }
          : e
      ),
    }) : prev);
  }, []);

  const swapEntriesByClientid = useCallback((aClientid: string, bClientid: string) => {
    setWeave(prev => {
      if (!prev) return prev;
      const a = prev.entries.find(e => e.clientid === aClientid);
      const b = prev.entries.find(e => e.clientid === bClientid);
      if (!a || !b) return prev;
      return {
        ...prev,
        entries: prev.entries.map(e => {
          if (e.clientid === aClientid) return { ...e, recipe_id: b.recipe_id, recipe_title: b.recipe_title };
          if (e.clientid === bClientid) return { ...e, recipe_id: a.recipe_id, recipe_title: a.recipe_title };
          return e;
        }),
      };
    });
  }, []);

  const removeEntry = useCallback((clientid: string) => {
    setWeave(prev => prev ? ({
      ...prev,
      entries: prev.entries.filter(e => e.clientid !== clientid),
    }) : prev);
  }, []);

  const pinSuggestion = useCallback((clientid: string) => {
    setWeave(prev => prev ? ({
      ...prev,
      entries: prev.entries.map(e =>
        e.clientid === clientid ? { ...e, source: 'pinned', locked: true } : e
      ),
    }) : prev);
    // Also add to pins
    const target = weave?.entries.find(e => e.clientid === clientid);
    if (target) void addPin(target.recipe_id);
  }, [addPin, weave]);

  const undoWeave = useCallback(() => {
    setUndoStack(stack => {
      const prev = stack[stack.length - 1];
      if (!prev) return stack;
      setWeave(prev);
      return stack.slice(0, -1);
    });
  }, []);

  return {
    pins, filters, weave, status, loading, canUndo: undoStack.length > 0,
    addPin, removePin, reorderPin, setFilters,
    runWeave, swapEntry, swapEntriesByClientid, removeEntry, pinSuggestion, undoWeave,
  };
}
