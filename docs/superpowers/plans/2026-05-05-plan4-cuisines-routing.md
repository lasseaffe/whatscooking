# Cuisines Routing Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix cuisine 404s (e.g. `/cuisines/american`) by adding slug aliases in `getCuisineBySlug`, and ensure all World Cup 2026 country pages have branded empty states instead of 404s.

**Architecture:** `getCuisineBySlug` in `src/lib/cuisines.ts` does an exact `slug` match. We add a secondary alias lookup so common alternate slugs (american, english, etc.) resolve to the correct cuisine. WC 2026 empty state handled in the `[country]` page.

**Tech Stack:** Next.js, TypeScript

---

### Task 1: Add slug alias map to getCuisineBySlug

**Files:**
- Modify: `src/lib/cuisines.ts:435-437`

Current function (line 435-437):
```ts
export function getCuisineBySlug(slug: string): CuisineInfo | undefined {
  return CUISINES.find((c) => c.slug === slug);
}
```

- [ ] **Step 1: Add SLUG_ALIASES map above getCuisineBySlug**

Insert before line 435:
```ts
// Common alternate slugs that should resolve to an existing cuisine
const SLUG_ALIASES: Record<string, string> = {
  "american":      "north-american",
  "usa":           "north-american",
  "us":            "north-american",
  "english":       "british",
  "uk":            "british",
  "gb":            "british",
  "middle-east":   "lebanese",
  "arab":          "lebanese",
  "north-africa":  "moroccan",
  "latin":         "mexican",
  "latam":         "mexican",
  "west-african":  "nigerian",
  "west-africa":   "nigerian",
  "east-african":  "kenyan",
  "east-africa":   "kenyan",
  "south-africa":  "south-african",
  "cote-divoire":  "ivorian",
  "ivory-coast":   "ivorian",
};
```

- [ ] **Step 2: Update getCuisineBySlug to check aliases**

Replace the function body:
```ts
export function getCuisineBySlug(slug: string): CuisineInfo | undefined {
  const normalized = slug.toLowerCase();
  const direct = CUISINES.find((c) => c.slug === normalized);
  if (direct) return direct;
  const aliasTarget = SLUG_ALIASES[normalized];
  if (aliasTarget) return CUISINES.find((c) => c.slug === aliasTarget);
  return undefined;
}
```

- [ ] **Step 3: Verify /cuisines/american no longer 404s**

Start dev server if not running. Visit `http://localhost:3002/cuisines/american` — should show the North American cuisine page with recipes.

Also verify `http://localhost:3002/cuisines/british` still works (direct slug, unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/lib/cuisines.ts
git commit -m "fix: add slug aliases to getCuisineBySlug — /cuisines/american, /english, etc. no longer 404"
```

---

### Task 2: Add branded empty state to World Cup country pages

**Files:**
- Modify: `src/app/(app)/cuisines/world-cup-2026/[country]/page.tsx`

- [ ] **Step 5: Read the current [country] page**

Open `src/app/(app)/cuisines/world-cup-2026/[country]/page.tsx` and find where recipes are rendered. Identify the block that renders `list` (the recipe array).

- [ ] **Step 6: Add empty state when list is empty**

Find the recipe grid section. Before rendering the grid, add:
```tsx
{list.length === 0 && (
  <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
    <span className="text-5xl">⚽</span>
    <p className="text-xl font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-text, #EFE3CE)" }}>
      Recipes Coming Soon
    </p>
    <p className="text-sm max-w-xs" style={{ color: "#7A5A40" }}>
      We&apos;re busy collecting authentic dishes from this nation. Check back soon!
    </p>
    <Link
      href="/cuisines/world-cup-2026"
      className="px-4 py-2 rounded-xl text-sm font-semibold"
      style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#fff" }}
    >
      ← Back to World Cup
    </Link>
  </div>
)}
```

- [ ] **Step 7: Verify a country with no recipes shows the empty state**

If any WC 2026 country has no recipes in the DB, visit its page (e.g. `/cuisines/world-cup-2026/cameroon`) and confirm it shows the branded empty state, not a 404 or blank page.

- [ ] **Step 8: Commit**

```bash
git add src/app/(app)/cuisines/world-cup-2026/[country]/page.tsx
git commit -m "fix: branded empty state for WC 2026 country pages with no recipes"
```
