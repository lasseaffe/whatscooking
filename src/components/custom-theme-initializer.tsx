"use client";

import { useEffect } from "react";
import { applyTokens } from "@/lib/theme/apply";
import { getActiveThemeId, loadThemes } from "@/lib/theme/storage";

export function CustomThemeInitializer() {
  useEffect(() => {
    const activeId = getActiveThemeId();
    if (!activeId) return;
    const theme = loadThemes().find((t) => t.id === activeId);
    if (theme) applyTokens(theme.tokens);
  }, []);

  return null;
}
