import { CustomTheme } from "./tokens";

export const STORAGE_KEY = "wc:custom-themes";
export const ACTIVE_KEY = "wc:active-theme-id";

export function loadThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomTheme[]) : [];
  } catch {
    return [];
  }
}

export function saveTheme(theme: CustomTheme): void {
  const themes = loadThemes();
  const idx = themes.findIndex((t) => t.id === theme.id);
  if (idx >= 0) {
    themes[idx] = theme;
  } else {
    themes.push(theme);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function deleteTheme(id: string): void {
  const themes = loadThemes().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function setActiveThemeId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_KEY);
  } else {
    localStorage.setItem(ACTIVE_KEY, id);
  }
}

export function getActiveThemeId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
