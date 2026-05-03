"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { DietaryRestriction } from "./dietary-substitutions";

export type DietaryFilterMode = "adapt" | "filter";

export const UTENSILS = [
  "pot", "pan", "oven", "blender", "food processor",
  "grill", "air fryer", "slow cooker", "instant pot",
  "wok", "steamer", "microwave",
] as const;

export type Utensil = typeof UTENSILS[number];

interface DietaryModeState {
  restrictions: DietaryRestriction[];
  customAvoid: string[];
  filterMode: DietaryFilterMode;
  toggleRestriction: (r: DietaryRestriction) => void;
  clearRestrictions: () => void;
  addCustomAvoid: (term: string) => void;
  removeCustomAvoid: (term: string) => void;
  setFilterMode: (mode: DietaryFilterMode) => void;
  /** Convenience: true when any restriction or custom avoid is active */
  active: boolean;
  missingUtensils: Utensil[];
  utensilMode: "filter" | "adapt";
  toggleUtensil: (u: Utensil) => void;
  setUtensilMode: (m: "filter" | "adapt") => void;
}

const DietaryModeContext = createContext<DietaryModeState>({
  restrictions: [],
  customAvoid: [],
  filterMode: "adapt",
  toggleRestriction: () => {},
  clearRestrictions: () => {},
  addCustomAvoid: () => {},
  removeCustomAvoid: () => {},
  setFilterMode: () => {},
  active: false,
  missingUtensils: [],
  utensilMode: "adapt",
  toggleUtensil: () => {},
  setUtensilMode: () => {},
});

const STORAGE_KEY = "wc_dietary_mode_v2";
const CUSTOM_AVOID_KEY = "wc_custom_avoid_v1";
const FILTER_MODE_KEY = "wc_filter_mode_v1";
const UTENSILS_KEY = "wc_missing_utensils_v1";
const UTENSIL_MODE_KEY = "wc_utensil_mode_v1";

export function DietaryModeProvider({ children }: { children: React.ReactNode }) {
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [customAvoid, setCustomAvoid] = useState<string[]>([]);
  const [filterMode, setFilterModeState] = useState<DietaryFilterMode>("adapt");
  const [missingUtensils, setMissingUtensils] = useState<Utensil[]>([]);
  const [utensilMode, setUtensilModeState] = useState<"filter" | "adapt">("adapt");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRestrictions(JSON.parse(stored));
      const storedCustom = localStorage.getItem(CUSTOM_AVOID_KEY);
      if (storedCustom) setCustomAvoid(JSON.parse(storedCustom));
      const storedMode = localStorage.getItem(FILTER_MODE_KEY) as DietaryFilterMode | null;
      if (storedMode === "adapt" || storedMode === "filter") setFilterModeState(storedMode);
      const storedUtensils = localStorage.getItem(UTENSILS_KEY);
      if (storedUtensils) setMissingUtensils(JSON.parse(storedUtensils));
      const storedUtensilMode = localStorage.getItem(UTENSIL_MODE_KEY) as "filter" | "adapt" | null;
      if (storedUtensilMode === "adapt" || storedUtensilMode === "filter") setUtensilModeState(storedUtensilMode);
    } catch {}
  }, []);

  const setFilterMode = useCallback((mode: DietaryFilterMode) => {
    setFilterModeState(mode);
    try { localStorage.setItem(FILTER_MODE_KEY, mode); } catch {}
  }, []);

  const toggleRestriction = useCallback((r: DietaryRestriction) => {
    setRestrictions((prev) => {
      const next = prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearRestrictions = useCallback(() => {
    setRestrictions([]);
    setCustomAvoid([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CUSTOM_AVOID_KEY);
    } catch {}
  }, []);

  const addCustomAvoid = useCallback((term: string) => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;
    setCustomAvoid((prev) => {
      if (prev.includes(normalized)) return prev;
      const next = [...prev, normalized];
      try { localStorage.setItem(CUSTOM_AVOID_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeCustomAvoid = useCallback((term: string) => {
    setCustomAvoid((prev) => {
      const next = prev.filter((x) => x !== term);
      try { localStorage.setItem(CUSTOM_AVOID_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleUtensil = useCallback((u: Utensil) => {
    setMissingUtensils((prev) => {
      const next = prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u];
      try { localStorage.setItem(UTENSILS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const setUtensilMode = useCallback((m: "filter" | "adapt") => {
    setUtensilModeState(m);
    try { localStorage.setItem(UTENSIL_MODE_KEY, m); } catch {}
  }, []);

  return (
    <DietaryModeContext.Provider value={{
      restrictions,
      customAvoid,
      filterMode,
      toggleRestriction,
      clearRestrictions,
      addCustomAvoid,
      removeCustomAvoid,
      setFilterMode,
      active: restrictions.length > 0 || customAvoid.length > 0,
      missingUtensils,
      utensilMode,
      toggleUtensil,
      setUtensilMode,
    }}>
      {children}
    </DietaryModeContext.Provider>
  );
}

export function useDietaryMode() {
  return useContext(DietaryModeContext);
}
