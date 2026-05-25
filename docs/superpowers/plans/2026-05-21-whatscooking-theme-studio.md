# What's Cooking — Theme Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each signed-in user build, name, save, and apply their own full custom color theme in What's Cooking, with live preview and non-blocking contrast warnings, persisted to Supabase with a localStorage fallback.

**Architecture:** WC renders entirely through CSS custom properties. The semantic tokens (`--bg-*`, `--fg-*`, `--border-*`) are literal hex values in `:root`/`[data-theme]` in `globals.css` — they are NOT derived from the `--wc-pal-*` palette family, so the existing `PaletteSwitcher` only recolors the accent family. A real per-token custom theme therefore works by writing the chosen token values as **inline custom properties on `document.documentElement`**, which override the stylesheet `:root` rules. "Custom" is purely additive: when no custom theme is active, the normal dark/light + palette behavior is untouched. Theme *definitions* sync to a new `user_themes` Supabase table; the *active selection* lives in localStorage (it's per-device UI state), giving "backend + local fallback" with local→backend migration on sign-in.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (`@supabase/ssr`), Jest + ts-jest + jsdom + Testing Library. Tests live in `__tests__/` folders next to the code; run with `npm test`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/theme/tokens.ts` | Editable token registry (`THEME_TOKENS`), contrast pairs, `CustomTheme`/`ThemeTokens` types, `defaultTokens()` |
| `src/lib/theme/contrast.ts` | Pure WCAG contrast math (`hexToRgb`, `relativeLuminance`, `contrastRatio`, `meetsAA`) |
| `src/lib/theme/apply.ts` | DOM side-effects: `applyCustomTokens`, `clearCustomTokens` |
| `src/lib/theme/storage.ts` | localStorage CRUD for theme list + active id; `newThemeId` |
| `src/lib/theme/remote.ts` | Supabase CRUD + `rowToTheme` mapper + `syncLocalToRemote` |
| `src/lib/theme/use-custom-theme.ts` | `useCustomTheme()` hook orchestrating load/apply/CRUD/sign-in sync |
| `src/components/custom-theme-initializer.tsx` | Applies active custom theme on hydration (mounted in layout) |
| `src/components/theme-studio.tsx` | The Theme Studio editor UI |
| `src/app/(app)/settings/settings-client.tsx` | Add a "Theme Studio" section (modify) |
| `src/app/layout.tsx` | Mount `<CustomThemeInitializer />` (modify) |
| `supabase/migrations/20260521000000_user_themes.sql` | `user_themes` table + RLS |

All paths under `whatscooking/`. Do not touch other repos.

---

## Task 1: Token registry + types

**Files:**
- Create: `src/lib/theme/tokens.ts`

- [ ] **Step 1: Write the registry and types**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/theme/tokens.ts
git commit -m "feat(theme): add custom theme token registry and types"
```

---

## Task 2: Contrast math (TDD)

**Files:**
- Create: `src/lib/theme/contrast.ts`
- Test: `src/lib/theme/__tests__/contrast.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/theme/__tests__/contrast.test.ts
import { hexToRgb, relativeLuminance, contrastRatio, meetsAA } from "@/lib/theme/contrast";

describe("contrast math", () => {
  test("hexToRgb parses 6-digit hex", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#1f55f1")).toEqual({ r: 31, g: 85, b: 241 });
  });

  test("hexToRgb parses 3-digit shorthand and ignores 8-digit alpha", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#1f55f180")).toEqual({ r: 31, g: 85, b: 241 });
  });

  test("hexToRgb returns null for invalid input", () => {
    expect(hexToRgb("not-a-color")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });

  test("relativeLuminance is 0 for black and 1 for white", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  test("contrastRatio is 21 for black vs white and 1 for identical colors", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });

  test("contrastRatio returns 1 when a color is unparseable", () => {
    expect(contrastRatio("bogus", "#ffffff")).toBe(1);
  });

  test("meetsAA uses the 4.5 threshold", () => {
    expect(meetsAA(4.5)).toBe(true);
    expect(meetsAA(4.49)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- contrast`
Expected: FAIL — `Cannot find module '@/lib/theme/contrast'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/theme/contrast.ts
// Pure WCAG 2.1 relative-luminance contrast math. No DOM, no deps.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length === 8) h = h.slice(0, 6); // drop alpha
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  if (!a || !b) return 1;
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA for normal-size text. */
export function meetsAA(ratio: number): boolean {
  return ratio >= 4.5;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- contrast`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme/contrast.ts src/lib/theme/__tests__/contrast.test.ts
git commit -m "feat(theme): add WCAG contrast utilities with tests"
```

---

## Task 3: Apply / clear tokens on the DOM (TDD)

**Files:**
- Create: `src/lib/theme/apply.ts`
- Test: `src/lib/theme/__tests__/apply.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/theme/__tests__/apply.test.ts
import { applyCustomTokens, clearCustomTokens } from "@/lib/theme/apply";

describe("apply/clear custom tokens", () => {
  afterEach(() => {
    // reset inline styles between tests
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-custom-theme");
  });

  test("applyCustomTokens sets inline custom properties and the marker attribute", () => {
    applyCustomTokens({ "--bg-base": "#101010", "--fg-primary": "#fafafa" });
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--bg-base").trim()).toBe("#101010");
    expect(root.style.getPropertyValue("--fg-primary").trim()).toBe("#fafafa");
    expect(root.getAttribute("data-custom-theme")).toBe("on");
  });

  test("clearCustomTokens removes the given properties and the marker", () => {
    applyCustomTokens({ "--bg-base": "#101010", "--fg-primary": "#fafafa" });
    clearCustomTokens(["--bg-base", "--fg-primary"]);
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--bg-base")).toBe("");
    expect(root.getAttribute("data-custom-theme")).toBeNull();
  });

  test("applyCustomTokens skips empty values", () => {
    applyCustomTokens({ "--bg-base": "" });
    expect(document.documentElement.style.getPropertyValue("--bg-base")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- apply`
Expected: FAIL — `Cannot find module '@/lib/theme/apply'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/theme/apply.ts
// Writes user token values as inline custom properties on <html>. Inline styles
// override the :root / [data-theme] rules in globals.css, so this recolors the app
// without any new CSS. clearCustomTokens reverts to the stylesheet defaults.

import type { ThemeTokens } from "@/lib/theme/tokens";

const MARKER = "data-custom-theme";

function root(el?: HTMLElement): HTMLElement {
  return el ?? document.documentElement;
}

export function applyCustomTokens(tokens: ThemeTokens, el?: HTMLElement): void {
  const r = root(el);
  let applied = false;
  for (const [key, value] of Object.entries(tokens)) {
    if (!value) continue;
    r.style.setProperty(key, value);
    applied = true;
  }
  if (applied) r.setAttribute(MARKER, "on");
}

export function clearCustomTokens(keys: string[], el?: HTMLElement): void {
  const r = root(el);
  for (const key of keys) r.style.removeProperty(key);
  r.removeAttribute(MARKER);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- apply`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme/apply.ts src/lib/theme/__tests__/apply.test.ts
git commit -m "feat(theme): apply/clear inline token overrides on <html>"
```

---

## Task 4: localStorage storage layer (TDD)

**Files:**
- Create: `src/lib/theme/storage.ts`
- Test: `src/lib/theme/__tests__/storage.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/theme/__tests__/storage.test.ts
import {
  loadLocalThemes,
  saveLocalThemes,
  loadActiveThemeId,
  saveActiveThemeId,
  newThemeId,
} from "@/lib/theme/storage";
import type { CustomTheme } from "@/lib/theme/tokens";

describe("theme storage", () => {
  beforeEach(() => localStorage.clear());

  test("loadLocalThemes returns [] when nothing is stored", () => {
    expect(loadLocalThemes()).toEqual([]);
  });

  test("saveLocalThemes round-trips", () => {
    const themes: CustomTheme[] = [{ id: "a", name: "Mine", tokens: { "--bg-base": "#111" } }];
    saveLocalThemes(themes);
    expect(loadLocalThemes()).toEqual(themes);
  });

  test("loadLocalThemes returns [] on corrupt JSON", () => {
    localStorage.setItem("wc-custom-themes", "{not json");
    expect(loadLocalThemes()).toEqual([]);
  });

  test("active theme id round-trips and clears", () => {
    expect(loadActiveThemeId()).toBeNull();
    saveActiveThemeId("xyz");
    expect(loadActiveThemeId()).toBe("xyz");
    saveActiveThemeId(null);
    expect(loadActiveThemeId()).toBeNull();
  });

  test("newThemeId returns unique non-empty strings", () => {
    const a = newThemeId();
    const b = newThemeId();
    expect(a).not.toBe("");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage`
Expected: FAIL — `Cannot find module '@/lib/theme/storage'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/theme/storage.ts
// localStorage is the source of truth when signed out, and a cache when signed in.
// Theme *definitions* live in "wc-custom-themes"; the active selection (per-device
// UI state) lives in "wc-active-theme-id".

import type { CustomTheme } from "@/lib/theme/tokens";

const THEMES_KEY = "wc-custom-themes";
const ACTIVE_KEY = "wc-active-theme-id";

export function loadLocalThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomTheme[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalThemes(themes: CustomTheme[]): void {
  try {
    localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export function loadActiveThemeId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveThemeId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* non-fatal */
  }
}

export function newThemeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme/storage.ts src/lib/theme/__tests__/storage.test.ts
git commit -m "feat(theme): localStorage theme persistence layer with tests"
```

---

## Task 5: Supabase migration for `user_themes`

**Files:**
- Create: `supabase/migrations/20260521000000_user_themes.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260521000000_user_themes.sql
-- Per-user saved custom color themes for the Theme Studio. Definitions sync here;
-- the active selection stays client-side (localStorage). Owner-only RLS.

create table if not exists user_themes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  tokens      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_themes_user_idx on user_themes(user_id);

alter table user_themes enable row level security;

create policy "users read own themes"
  on user_themes for select using (user_id = auth.uid());

create policy "users insert own themes"
  on user_themes for insert with check (user_id = auth.uid());

create policy "users update own themes"
  on user_themes for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete own themes"
  on user_themes for delete using (user_id = auth.uid());
```

- [ ] **Step 2: Apply the migration**

Run (against the linked project): `npx supabase db push`
Expected: migration `20260521000000_user_themes` applies; `user_themes` exists with RLS enabled.
If the Supabase CLI is not linked locally, paste the SQL into the Supabase SQL editor and confirm the table + 4 policies were created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260521000000_user_themes.sql
git commit -m "feat(theme): add user_themes table with owner-only RLS"
```

---

## Task 6: Supabase data layer (TDD on the pure mapper)

**Files:**
- Create: `src/lib/theme/remote.ts`
- Test: `src/lib/theme/__tests__/remote.test.ts`

- [ ] **Step 1: Write the failing test (pure mapper + merge)**

```typescript
// src/lib/theme/__tests__/remote.test.ts
import { rowToTheme, mergeThemes } from "@/lib/theme/remote";
import type { CustomTheme } from "@/lib/theme/tokens";

describe("remote helpers", () => {
  test("rowToTheme maps a DB row to a CustomTheme", () => {
    const row = { id: "1", name: "Sunset", tokens: { "--bg-base": "#200" }, user_id: "u" };
    expect(rowToTheme(row)).toEqual({ id: "1", name: "Sunset", tokens: { "--bg-base": "#200" } });
  });

  test("rowToTheme defaults missing tokens to {}", () => {
    const row = { id: "2", name: "Empty", tokens: null, user_id: "u" };
    expect(rowToTheme(row)).toEqual({ id: "2", name: "Empty", tokens: {} });
  });

  test("mergeThemes keeps remote on id conflict and appends local-only", () => {
    const remote: CustomTheme[] = [{ id: "1", name: "Remote", tokens: {} }];
    const local: CustomTheme[] = [
      { id: "1", name: "Local stale", tokens: {} },
      { id: "2", name: "Local only", tokens: {} },
    ];
    const merged = mergeThemes(remote, local);
    expect(merged).toEqual([
      { id: "1", name: "Remote", tokens: {} },
      { id: "2", name: "Local only", tokens: {} },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- remote`
Expected: FAIL — `Cannot find module '@/lib/theme/remote'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/theme/remote.ts
// Supabase CRUD for user_themes. The browser client + RLS scope everything to the
// signed-in user. Pure helpers (rowToTheme, mergeThemes) are unit-tested; the
// network functions are thin wrappers.

import { createClient } from "@/lib/supabase/client";
import type { CustomTheme } from "@/lib/theme/tokens";

interface ThemeRow {
  id: string;
  name: string;
  tokens: Record<string, string> | null;
  user_id?: string;
}

export function rowToTheme(row: ThemeRow): CustomTheme {
  return { id: row.id, name: row.name, tokens: row.tokens ?? {} };
}

/** Remote wins on id conflicts; local-only themes are appended. */
export function mergeThemes(remote: CustomTheme[], local: CustomTheme[]): CustomTheme[] {
  const byId = new Map<string, CustomTheme>();
  for (const t of remote) byId.set(t.id, t);
  const out = [...remote];
  for (const t of local) {
    if (!byId.has(t.id)) out.push(t);
  }
  return out;
}

export async function fetchRemoteThemes(): Promise<CustomTheme[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_themes")
    .select("id, name, tokens")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as ThemeRow[]).map(rowToTheme);
}

export async function upsertRemoteTheme(theme: CustomTheme): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  await supabase.from("user_themes").upsert({
    id: theme.id,
    user_id: userId,
    name: theme.name,
    tokens: theme.tokens,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteRemoteTheme(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("user_themes").delete().eq("id", id);
}

/** Push local-only themes up, then return the merged set. Called on sign-in. */
export async function syncLocalToRemote(local: CustomTheme[]): Promise<CustomTheme[]> {
  const remote = await fetchRemoteThemes();
  const remoteIds = new Set(remote.map((t) => t.id));
  const localOnly = local.filter((t) => !remoteIds.has(t.id));
  for (const t of localOnly) {
    await upsertRemoteTheme(t);
  }
  return mergeThemes(remote, local);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- remote`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme/remote.ts src/lib/theme/__tests__/remote.test.ts
git commit -m "feat(theme): supabase user_themes data layer with tested helpers"
```

---

## Task 7: `useCustomTheme` orchestration hook

**Files:**
- Create: `src/lib/theme/use-custom-theme.ts`

- [ ] **Step 1: Write the hook**

```typescript
// src/lib/theme/use-custom-theme.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyCustomTokens, clearCustomTokens } from "@/lib/theme/apply";
import {
  loadActiveThemeId,
  loadLocalThemes,
  newThemeId,
  saveActiveThemeId,
  saveLocalThemes,
} from "@/lib/theme/storage";
import {
  deleteRemoteTheme,
  syncLocalToRemote,
  upsertRemoteTheme,
} from "@/lib/theme/remote";
import { THEME_TOKENS, type CustomTheme, type ThemeTokens } from "@/lib/theme/tokens";

const ALL_KEYS = THEME_TOKENS.map((t) => t.key);

export function useCustomTheme() {
  const [themes, setThemes] = useState<CustomTheme[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Apply (or clear) whenever the active theme changes.
  const applyById = useCallback(
    (id: string | null, list: CustomTheme[]) => {
      const theme = id ? list.find((t) => t.id === id) : undefined;
      if (theme) applyCustomTokens(theme.tokens);
      else clearCustomTokens(ALL_KEYS);
    },
    [],
  );

  // Initial load: local first (instant), then sync remote if signed in.
  useEffect(() => {
    const local = loadLocalThemes();
    const active = loadActiveThemeId();
    setThemes(local);
    setActiveId(active);
    applyById(active, local);

    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const merged = await syncLocalToRemote(local);
        setThemes(merged);
        saveLocalThemes(merged);
        applyById(active, merged);
      }
      setLoaded(true);
    })();
  }, [applyById]);

  const persist = useCallback((next: CustomTheme[]) => {
    setThemes(next);
    saveLocalThemes(next);
  }, []);

  const createTheme = useCallback(
    async (name: string, tokens: ThemeTokens): Promise<CustomTheme> => {
      const theme: CustomTheme = { id: newThemeId(), name, tokens };
      const next = [...themes, theme];
      persist(next);
      await upsertRemoteTheme(theme); // no-op when signed out
      return theme;
    },
    [themes, persist],
  );

  const updateTheme = useCallback(
    async (id: string, patch: Partial<Omit<CustomTheme, "id">>) => {
      const next = themes.map((t) => (t.id === id ? { ...t, ...patch } : t));
      persist(next);
      const updated = next.find((t) => t.id === id);
      if (updated) await upsertRemoteTheme(updated);
      if (id === activeId) applyById(id, next);
    },
    [themes, activeId, persist, applyById],
  );

  const deleteTheme = useCallback(
    async (id: string) => {
      const next = themes.filter((t) => t.id !== id);
      persist(next);
      if (id === activeId) {
        setActiveId(null);
        saveActiveThemeId(null);
        clearCustomTokens(ALL_KEYS);
      }
      await deleteRemoteTheme(id);
    },
    [themes, activeId, persist, applyById],
  );

  const setActive = useCallback(
    (id: string | null) => {
      setActiveId(id);
      saveActiveThemeId(id);
      applyById(id, themes);
    },
    [themes, applyById],
  );

  return { themes, activeId, loaded, createTheme, updateTheme, deleteTheme, setActive };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/theme/`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme/use-custom-theme.ts
git commit -m "feat(theme): useCustomTheme hook orchestrating load/apply/CRUD/sync"
```

---

## Task 8: Hydration initializer (no flash)

**Files:**
- Create: `src/components/custom-theme-initializer.tsx`
- Modify: `src/app/layout.tsx` (mount it next to `<PaletteInitializer />` at line 38)

- [ ] **Step 1: Write the initializer**

```tsx
// src/components/custom-theme-initializer.tsx
"use client";

import { useEffect } from "react";
import { loadActiveThemeId, loadLocalThemes } from "@/lib/theme/storage";
import { applyCustomTokens } from "@/lib/theme/apply";

/** Applies the persisted active custom theme on hydration so there is no flash of
 *  the default palette before useCustomTheme mounts inside the settings page. */
export function CustomThemeInitializer() {
  useEffect(() => {
    const id = loadActiveThemeId();
    if (!id) return;
    const theme = loadLocalThemes().find((t) => t.id === id);
    if (theme) applyCustomTokens(theme.tokens);
  }, []);
  return null;
}
```

- [ ] **Step 2: Mount in layout**

In `src/app/layout.tsx`, find:

```tsx
        <ThemeProvider>
          <PaletteInitializer />
```

Replace with:

```tsx
        <ThemeProvider>
          <PaletteInitializer />
          <CustomThemeInitializer />
```

And add the import near the existing `PaletteInitializer` import (line 5):

```tsx
import { CustomThemeInitializer } from "@/components/custom-theme-initializer";
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/custom-theme-initializer.tsx src/app/layout.tsx
git commit -m "feat(theme): apply active custom theme on hydration"
```

---

## Task 9: Theme Studio UI

**Files:**
- Create: `src/components/theme-studio.tsx`
- Test: `src/components/__tests__/theme-studio.test.tsx`

- [ ] **Step 1: Write the failing render test**

```tsx
// src/components/__tests__/theme-studio.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeStudio } from "@/components/theme-studio";

// jsdom has no crypto.randomUUID by default in some envs; storage.newThemeId falls back.
describe("ThemeStudio", () => {
  beforeEach(() => localStorage.clear());

  test("renders a row for every editable token", () => {
    render(<ThemeStudio />);
    expect(screen.getByText("Primary action")).toBeInTheDocument();
    expect(screen.getByText("App background")).toBeInTheDocument();
    expect(screen.getByText("Danger")).toBeInTheDocument();
  });

  test("renders the contrast checks section", () => {
    render(<ThemeStudio />);
    expect(screen.getByText(/Body text on base/i)).toBeInTheDocument();
  });

  test("Reset to defaults restores a known default value in its hex input", () => {
    render(<ThemeStudio />);
    const input = screen.getByLabelText("--bg-accent hex") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#abcdef" } });
    expect(input.value).toBe("#abcdef");
    fireEvent.click(screen.getByRole("button", { name: /Reset to defaults/i }));
    expect(input.value.toLowerCase()).toBe("#1f55f1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- theme-studio`
Expected: FAIL — `Cannot find module '@/components/theme-studio'`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/theme-studio.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Save, Trash2, AlertTriangle } from "lucide-react";
import { useCustomTheme } from "@/lib/theme/use-custom-theme";
import { applyCustomTokens } from "@/lib/theme/apply";
import { contrastRatio, meetsAA } from "@/lib/theme/contrast";
import {
  CONTRAST_PAIRS,
  TOKEN_GROUPS,
  THEME_TOKENS,
  defaultTokens,
  type ThemeTokens,
} from "@/lib/theme/tokens";

function resolve(tokens: ThemeTokens, ref: string): string {
  // a contrast pair side is either a token key ("--x") or a literal hex
  return ref.startsWith("--") ? tokens[ref] ?? "" : ref;
}

export function ThemeStudio() {
  const { themes, activeId, createTheme, updateTheme, deleteTheme, setActive } =
    useCustomTheme();

  // The working draft the user is editing. Seeded from the active theme or defaults.
  const initial = useMemo<ThemeTokens>(() => {
    const active = themes.find((t) => t.id === activeId);
    return active ? { ...defaultTokens(), ...active.tokens } : defaultTokens();
  }, [themes, activeId]);

  const [draft, setDraft] = useState<ThemeTokens>(initial);
  const [name, setName] = useState("My theme");

  function setToken(key: string, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    applyCustomTokens(next); // live preview on the real app chrome
  }

  function reset() {
    const d = defaultTokens();
    setDraft(d);
    applyCustomTokens(d);
  }

  async function saveAsNew() {
    const theme = await createTheme(name.trim() || "My theme", draft);
    setActive(theme.id);
  }

  async function saveOverActive() {
    if (!activeId) return saveAsNew();
    await updateTheme(activeId, { name: name.trim() || "My theme", tokens: draft });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Saved themes */}
      <div>
        <p className="text-xs mb-3" style={{ color: "var(--wc-text-3)" }}>
          Build your own colours. Changes preview live; save to keep and sync them.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActive(null)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              background: activeId === null ? "var(--wc-pal-accent)" : "var(--wc-bg-card)",
              color: activeId === null ? "#fff" : "var(--wc-text-3)",
              border: "1px solid var(--wc-border-default)",
            }}
          >
            Default (no custom)
          </button>
          {themes.map((t) => (
            <span key={t.id} className="inline-flex items-center">
              <button
                onClick={() => setActive(t.id)}
                className="text-xs font-semibold pl-3 pr-2 py-1.5 rounded-l-lg inline-flex items-center gap-1.5"
                style={{
                  background: activeId === t.id ? "var(--wc-pal-accent)" : "var(--wc-bg-card)",
                  color: activeId === t.id ? "#fff" : "var(--wc-text-3)",
                  border: "1px solid var(--wc-border-default)",
                }}
              >
                {activeId === t.id && <Check style={{ width: 11, height: 11 }} />}
                {t.name}
              </button>
              <button
                aria-label={`Delete ${t.name}`}
                onClick={() => deleteTheme(t.id)}
                className="px-1.5 py-1.5 rounded-r-lg"
                style={{
                  background: "var(--wc-bg-card)",
                  color: "var(--fg-destructive)",
                  border: "1px solid var(--wc-border-default)",
                  borderLeft: "none",
                }}
              >
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Token editor grouped by role */}
      {TOKEN_GROUPS.map((group) => (
        <div key={group}>
          <h4 className="text-xs font-bold mb-2" style={{ color: "var(--wc-text-2)" }}>
            {group}
          </h4>
          <div className="flex flex-col gap-1.5">
            {THEME_TOKENS.filter((t) => t.group === group).map((t) => (
              <div key={t.key} className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label={`${t.key} swatch`}
                  value={(draft[t.key] || "#000000").slice(0, 7)}
                  onChange={(e) => setToken(t.key, e.target.value)}
                  className="w-7 h-7 rounded-md shrink-0 cursor-pointer"
                  style={{ border: "1px solid var(--wc-border-default)", background: "transparent" }}
                />
                <span className="text-xs flex-1" style={{ color: "var(--wc-text-3)" }}>
                  {t.label}
                </span>
                <input
                  type="text"
                  aria-label={`${t.key} hex`}
                  value={draft[t.key] ?? ""}
                  onChange={(e) => setToken(t.key, e.target.value)}
                  className="w-24 text-xs px-2 py-1 rounded-md font-mono"
                  style={{
                    background: "var(--wc-bg-input)",
                    color: "var(--wc-text-2)",
                    border: "1px solid var(--wc-border-default)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Contrast warnings (non-blocking) */}
      <div>
        <h4 className="text-xs font-bold mb-2" style={{ color: "var(--wc-text-2)" }}>
          Contrast checks
        </h4>
        <div className="flex flex-col gap-1">
          {CONTRAST_PAIRS.map((pair) => {
            const ratio = contrastRatio(resolve(draft, pair.fg), resolve(draft, pair.bg));
            const ok = meetsAA(ratio);
            return (
              <div key={pair.label} className="flex items-center gap-2 text-xs">
                {ok ? (
                  <Check style={{ width: 12, height: 12, color: "var(--fg-positive)" }} />
                ) : (
                  <AlertTriangle style={{ width: 12, height: 12, color: "var(--fg-attention)" }} />
                )}
                <span style={{ color: "var(--wc-text-3)" }}>{pair.label}</span>
                <span className="font-mono" style={{ color: ok ? "var(--fg-positive)" : "var(--fg-attention)" }}>
                  {ratio.toFixed(1)}:1{ok ? "" : " — low"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input
          type="text"
          aria-label="Theme name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Theme name"
          className="text-xs px-3 py-2 rounded-lg flex-1 min-w-[140px]"
          style={{
            background: "var(--wc-bg-input)",
            color: "var(--wc-text)",
            border: "1px solid var(--wc-border-default)",
          }}
        />
        <button
          onClick={saveAsNew}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
          style={{ background: "var(--wc-pal-accent)", color: "#fff" }}
        >
          <Plus style={{ width: 13, height: 13 }} /> Save as new
        </button>
        {activeId && (
          <button
            onClick={saveOverActive}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{
              background: "var(--wc-bg-card)",
              color: "var(--wc-text-2)",
              border: "1px solid var(--wc-border-default)",
            }}
          >
            <Save style={{ width: 13, height: 13 }} /> Update active
          </button>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
          style={{
            background: "var(--wc-bg-card)",
            color: "var(--wc-text-3)",
            border: "1px solid var(--wc-border-default)",
          }}
        >
          <RotateCcw style={{ width: 13, height: 13 }} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- theme-studio`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/theme-studio.tsx src/components/__tests__/theme-studio.test.tsx
git commit -m "feat(theme): Theme Studio editor UI with live preview and contrast checks"
```

---

## Task 10: Wire Theme Studio into Settings

**Files:**
- Modify: `src/app/(app)/settings/settings-client.tsx`

- [ ] **Step 1: Add the import**

At the top of `settings-client.tsx`, add `Paintbrush` to the existing `lucide-react` import and import the Studio:

```tsx
import { ThemeStudio } from "@/components/theme-studio";
```

(Add `Paintbrush` to the destructured icon list on line 5.)

- [ ] **Step 2: Add the section**

In `SettingsClient`, immediately AFTER the existing `Colour Palette` `<Section>...</Section>` block (which ends with `</Section>` right after `<PaletteSwitcher />`), insert:

```tsx
      {/* ── Theme Studio ── */}
      <Section icon={<Paintbrush style={{ width: 16, height: 16 }} />} title="Theme Studio">
        <ThemeStudio />
      </Section>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev` then open `http://localhost:3002/settings`.
Expected: a "Theme Studio" card appears below "Colour Palette". Editing a color updates the whole app live; saving a named theme makes it selectable; "Default (no custom)" reverts; "Reset to defaults" restores brand values.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/settings/settings-client.tsx"
git commit -m "feat(theme): surface Theme Studio in settings"
```

---

## Task 11: Full verification pass

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all theme tests pass (contrast, apply, storage, remote, theme-studio); no regressions.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: success, no type errors.

- [ ] **Step 3: Manual end-to-end (dev server on :3002)**
  - Edit several tokens → whole app recolors live.
  - Force a low-contrast pair (e.g. set `--fg-primary` near `--bg-base`) → warning badge appears, save is NOT blocked.
  - Save "Sunset" → appears as a selectable chip and is applied.
  - Reload the page → "Sunset" still applied (no flash of default), proving the hydration initializer + localStorage cache.
  - Signed in: reload in a different browser/profile of the same account → "Sunset" present (Supabase sync). Create a theme while signed out, then sign in → it migrates up (appears after refresh).
  - Select "Default (no custom)" → app returns to normal dark/light + palette.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "test(theme): verification pass for Theme Studio"
```

---

## Notes & deliberate scope decisions
- **No `is_active` / `base_mode` columns.** WC stores each theme's *full* token map, so no base-mode fallback is needed, and the active selection is per-device UI state kept in localStorage — this avoids a partial-unique-index dance and matches "definitions synced, active choice local."
- **Editable surface = 17 curated semantic tokens** across 6 groups. This is the honest "full" set for WC: backgrounds, surfaces, text, accent, borders, status. Glow/shadow/gradient/shadcn tokens are intentionally excluded (not user-meaningful, easy to break).
- **Additive only.** WC has no protected modes (Sabbath/Tactical are HolyFlex/VenturePath concerns), so custom simply overlays the active dark/light + palette and fully reverts on "Default (no custom)".
- **Moodboard:** WC's moodboard is a separate `/moodboard` page; this plan does not change design tokens themselves (only adds a user-facing editor), so no `moodboard.config` edit is required. If `npm run moodboard:check` flags the new files, add them to the script's ignore list rather than altering brand tokens.
- **Cross-app TODO (per CLAUDE.md ecosystem mandate):** a future shared "accent hue" sync across HolyFlex/VP/WC is out of scope here; tracked in the parent design doc.
```
