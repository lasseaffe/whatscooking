// src/lib/theme/tokens.ts
// The curated set of CSS custom properties a user can recolor in the Theme Studio.
// Defaults are the dark-mode :root values from globals.css. Editing these as inline
// custom properties on <html> overrides the stylesheet, recoloring the whole app.

export type ThemeTokens = Record<string, string>;

export interface CustomTheme {
  id: string;
  name: string;
  tokens: ThemeTokens;
}

export interface ThemeTokenDef {
  /** CSS custom property name, e.g. "--bg-base" */
  key: string;
  /** Human label shown in the Studio */
  label: string;
  /** Group heading */
  group: "Backgrounds" | "Surfaces" | "Text" | "Accent" | "Borders" | "Status";
  /** Default hex value (dark mode) */
  default: string;
}

export const THEME_TOKENS: ThemeTokenDef[] = [
  // Backgrounds
  { key: "--bg-depth", label: "App background", group: "Backgrounds", default: "#090908" },
  { key: "--bg-base", label: "Base surface", group: "Backgrounds", default: "#0d0d0c" },
  { key: "--bg-primary", label: "Card", group: "Backgrounds", default: "#121211" },
  // Surfaces
  { key: "--bg-secondary", label: "Input / raised", group: "Surfaces", default: "#171716" },
  { key: "--bg-tertiary", label: "Elevated", group: "Surfaces", default: "#1f1f1e" },
  { key: "--bg-quaternary", label: "Hover", group: "Surfaces", default: "#272726" },
  // Text
  { key: "--fg-primary", label: "Primary text", group: "Text", default: "#ffffff" },
  { key: "--fg-secondary", label: "Secondary text", group: "Text", default: "#e7e7e6" },
  { key: "--fg-tertiary", label: "Muted text", group: "Text", default: "#9c9c9b" },
  // Accent
  { key: "--bg-accent", label: "Primary action", group: "Accent", default: "#1f55f1" },
  { key: "--fg-accent", label: "Accent text / links", group: "Accent", default: "#749df7" },
  { key: "--wc-pal-accent", label: "Palette accent", group: "Accent", default: "#B07D56" },
  // Borders
  { key: "--border-base", label: "Base border", group: "Borders", default: "#242422" },
  { key: "--border-primary", label: "Primary border", group: "Borders", default: "#292927" },
  // Status
  { key: "--bg-positive", label: "Success", group: "Status", default: "#338500" },
  { key: "--bg-attention", label: "Warning", group: "Status", default: "#ce4700" },
  { key: "--bg-destructive", label: "Danger", group: "Status", default: "#e12429" },
];

export const TOKEN_GROUPS = [
  "Backgrounds",
  "Surfaces",
  "Text",
  "Accent",
  "Borders",
  "Status",
] as const;

/** Contrast pairs the Studio checks (text foreground vs. background). */
export interface ContrastPair {
  label: string;
  /** token key OR a literal hex (for fixed colors like white button labels) */
  fg: string;
  bg: string;
}

export const CONTRAST_PAIRS: ContrastPair[] = [
  { label: "Body text on base", fg: "--fg-primary", bg: "--bg-base" },
  { label: "Text on cards", fg: "--fg-primary", bg: "--bg-primary" },
  { label: "Secondary text on inputs", fg: "--fg-secondary", bg: "--bg-secondary" },
  { label: "Muted text on cards", fg: "--fg-tertiary", bg: "--bg-primary" },
  { label: "Button label on primary action", fg: "#ffffff", bg: "--bg-accent" },
];

/** A fresh token map populated with all defaults. */
export function defaultTokens(): ThemeTokens {
  const out: ThemeTokens = {};
  for (const t of THEME_TOKENS) out[t.key] = t.default;
  return out;
}
