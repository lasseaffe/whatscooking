# All Recipes: Empty State Fix + Utensil Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the All Recipes page showing 0 entries, and surface the utensil filter (which exists in `FilterDrawer` but is not wired into the All Recipes UI) with positive and negative/adapt modes.

**Architecture:** The server component (`recipes/page.tsx`) uses `.not("dish_types", "cs", '{"hack"}')` filters — these silently exclude all recipes with `null` dish_types on some Supabase versions. Fix by using the same `.or()` pattern the Discover page uses. Then add `utensilFilters` state + chip to `all-recipes-client.tsx`, filter the recipe list client-side, and show an "Adapt" badge for negative-mode utensil filters.

**Tech Stack:** Next.js App Router, Supabase, React

---

### Task 1: Fix the server query in recipes/page.tsx

**Files:**
- Modify: `src/app/(app)/recipes/page.tsx`

Current query (lines 9-15) uses `.not("dish_types", "cs", '{"hack"}')` which excludes rows where `dish_types` is `null` on many Postgres/Supabase versions, causing 0 results.

- [ ] **Step 1: Replace the query with a null-safe OR pattern**

Replace the content of `src/app/(app)/recipes/page.tsx`:
```ts
import { createClient } from "@/lib/supabase/server";
import { AllRecipesClient } from "./all-recipes-client";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level, required_utensils")
    .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
    .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
    .order("created_at", { ascending: false })
    .limit(1000);

  return <AllRecipesClient recipes={recipes ?? []} />;
}
```

Note: added `required_utensils` to the select so utensil filtering has data to work with.

- [ ] **Step 2: Verify the query now returns results**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx next dev --port 3002 &
# Then visit http://localhost:3002/recipes in the browser — should show recipe cards
```

---

### Task 2: Add utensil filter state to AllRecipesClient

**Files:**
- Modify: `src/app/(app)/recipes/all-recipes-client.tsx`

The `Recipe` type already exists (lines 10-21). Add `required_utensils` to it and add utensil filter state.

- [ ] **Step 3: Extend the Recipe type**

In `all-recipes-client.tsx`, update the `Recipe` type (lines 10-21):
```ts
type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cuisine_type?: string | null;
  dish_types?: string[] | null;
  dietary_tags?: string[] | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  difficulty_level?: string | null;
  required_utensils?: string[] | null;
};
```

- [ ] **Step 4: Add utensil filter state and mode**

In the `AllRecipesClient` component function body, after the existing `useState` declarations, add:
```ts
const [utensilFilters, setUtensilFilters] = useState<string[]>([]);
// "positive" = show only recipes that USE the utensil
// "negative" = hide recipes that REQUIRE the utensil (or show with Adapt badge)
const [utensilMode, setUtensilMode] = useState<"positive" | "negative">("negative");
```

- [ ] **Step 5: Add utensil filtering logic to the filtered recipes memo**

The component already has a `useMemo` that filters recipes by search/tags/difficulty. Add utensil filtering inside that memo.

Find the `useMemo` that computes `filtered` recipes. Add this logic at the end of the filter chain (before the `return`):

```ts
// Utensil filter
let utensFiltered = tagFiltered; // (whatever the current last variable name is before return)
if (utensilFilters.length > 0) {
  if (utensilMode === "positive") {
    // Show only recipes that require at least one selected utensil
    utensFiltered = utensFiltered.filter((r) =>
      utensilFilters.some((u) =>
        (r.required_utensils ?? []).some((ru) => ru.toLowerCase().includes(u.toLowerCase()))
      )
    );
  }
  // In negative mode, we don't filter — we just mark recipes for the Adapt badge
  // (filtering happens in the render via the adaptNeeded helper)
}
return utensFiltered;
```

Also add a helper function outside the component:
```ts
function adaptNeeded(recipe: Recipe, utensilFilters: string[], mode: "positive" | "negative"): boolean {
  if (mode !== "negative" || utensilFilters.length === 0) return false;
  return utensilFilters.some((u) =>
    (recipe.required_utensils ?? []).some((ru) => ru.toLowerCase().includes(u.toLowerCase()))
  );
}
```

---

### Task 3: Add Utensil filter UI chips

**Files:**
- Modify: `src/app/(app)/recipes/all-recipes-client.tsx`

The `FilterDrawer` component already has the utensil step defined. Wire it in.

- [ ] **Step 6: Pass utensil state to FilterDrawer**

Find where `FilterDrawer` is rendered in `all-recipes-client.tsx`. It currently receives props for dietary filters and tags. Add utensil props:
```tsx
<FilterDrawer
  // existing props...
  utensilFilters={utensilFilters}
  utensilMode={utensilMode}
  onUtensilChange={(filters, mode) => {
    setUtensilFilters(filters);
    setUtensilMode(mode);
  }}
/>
```

- [ ] **Step 7: Add utensil chips to the active-filter chips row**

Find the section that renders active filter chips (the `X` buttons showing current filters). Add utensil chips after the existing chips:
```tsx
{utensilFilters.map((u) => (
  <button
    key={`utensil-${u}`}
    onClick={() => setUtensilFilters((prev) => prev.filter((x) => x !== u))}
    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
    style={{ background: "rgba(42,24,8,0.4)", borderColor: "rgba(90,50,20,0.4)", color: "#C8A882" }}
  >
    🍳 {u}
    <X style={{ width: 10, height: 10 }} />
  </button>
))}
```

- [ ] **Step 8: Add "Adapt" badge to recipe cards in negative utensil mode**

In `RecipeCard` component (around line 81), add an `adaptNeeded` prop and show a badge:
```tsx
function RecipeCard({ recipe, view, showAdaptBadge }: { recipe: Recipe; view: "grid" | "list"; showAdaptBadge?: boolean }) {
```

In the card JSX, add the badge after the image (for grid view) or before the title (for list view):
```tsx
{showAdaptBadge && (
  <span
    className="text-xs px-2 py-0.5 rounded-full font-medium"
    style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}
  >
    🔄 Adapt
  </span>
)}
```

In the recipe list render, pass `showAdaptBadge`:
```tsx
<RecipeCard
  key={r.id}
  recipe={r}
  view={view}
  showAdaptBadge={adaptNeeded(r, utensilFilters, utensilMode)}
/>
```

- [ ] **Step 9: Update FilterDrawer to accept and emit utensil props**

In `src/components/filter-drawer.tsx`, the utensil step is already defined (lines 106-118). Ensure the component's props interface includes:
```ts
interface FilterDrawerProps {
  // existing props...
  utensilFilters?: string[];
  utensilMode?: "positive" | "negative";
  onUtensilChange?: (filters: string[], mode: "positive" | "negative") => void;
}
```

Wire these into the utensils step UI so selections persist across opens.

- [ ] **Step 10: Add branded empty state**

Find where the recipe grid renders `filtered.length === 0`. Add an empty state instead of a blank div:
```tsx
{filtered.length === 0 && (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <span className="text-5xl">🍳</span>
    <p className="text-base font-semibold" style={{ color: "var(--fg-primary)" }}>No recipes match your filters</p>
    <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>Try removing a filter or searching something else</p>
    <button
      onClick={() => { setSearch(""); setSelectedTags([]); setUtensilFilters([]); setDifficulty(""); }}
      className="px-4 py-2 rounded-xl text-sm font-semibold"
      style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#fff" }}
    >
      Clear all filters
    </button>
  </div>
)}
```

- [ ] **Step 11: TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add src/app/(app)/recipes/page.tsx src/app/(app)/recipes/all-recipes-client.tsx src/components/filter-drawer.tsx
git commit -m "fix: all-recipes empty state + wire utensil filter with positive/negative modes"
```
