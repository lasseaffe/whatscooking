"use client";

import { useState, useCallback } from "react";
import { CustomTheme } from "./tokens";
import { applyTokens, clearTokens } from "./apply";
import {
  loadThemes,
  saveTheme,
  deleteTheme,
  setActiveThemeId,
  getActiveThemeId,
} from "./storage";

export interface UseCustomThemeReturn {
  themes: CustomTheme[];
  activeTheme: CustomTheme | null;
  saveAndActivate: (theme: CustomTheme) => void;
  deactivate: () => void;
  removeTheme: (id: string) => void;
}

export function useCustomTheme(): UseCustomThemeReturn {
  const [themes, setThemes] = useState<CustomTheme[]>(() => loadThemes());
  const [activeTheme, setActiveTheme] = useState<CustomTheme | null>(() => {
    const activeId = getActiveThemeId();
    if (!activeId) return null;
    return loadThemes().find((t) => t.id === activeId) ?? null;
  });

  const saveAndActivate = useCallback((theme: CustomTheme) => {
    saveTheme(theme);
    setActiveThemeId(theme.id);
    applyTokens(theme.tokens);
    setThemes(loadThemes());
    setActiveTheme(theme);
  }, []);

  const deactivate = useCallback(() => {
    if (activeTheme) clearTokens(activeTheme.tokens);
    setActiveThemeId(null);
    setActiveTheme(null);
  }, [activeTheme]);

  const removeTheme = useCallback(
    (id: string) => {
      deleteTheme(id);
      if (activeTheme?.id === id) {
        if (activeTheme) clearTokens(activeTheme.tokens);
        setActiveThemeId(null);
        setActiveTheme(null);
      }
      setThemes(loadThemes());
    },
    [activeTheme]
  );

  return { themes, activeTheme, saveAndActivate, deactivate, removeTheme };
}
