import { ThemeTokens } from "./tokens";

export function applyTokens(tokens: ThemeTokens): void {
  const el = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    el.style.setProperty(key, value);
  }
  el.setAttribute("data-theme", "custom");
}

export function clearTokens(tokens: ThemeTokens): void {
  const el = document.documentElement;
  for (const key of Object.keys(tokens)) {
    el.style.removeProperty(key);
  }
  el.removeAttribute("data-theme");
}
