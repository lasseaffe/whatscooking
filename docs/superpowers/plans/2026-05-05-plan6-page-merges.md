# Page Merges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge dashboard content into the root landing page; restructure `/discover` to embed meal swipe + world cuisines + all recipes; add redirects from `/swipe` and `/dashboard`.

**Architecture:** Three changes: (1) root `src/app/page.tsx` gets dashboard content appended below the hero (server-rendered trending recipes for guests, personalised for authed users); (2) `src/app/(app)/discover/page.tsx` becomes a hub that renders the swipe card stack, a world cuisines row, and the recipe grid — all on one scrollable page; (3) `/swipe` and `/dashboard` become redirect routes.

**Tech Stack:** Next.js App Router, Supabase, React

---

### Task 1: Add dashboard content to the root landing page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/(app)/discover/discover-client.tsx` (extract a reusable `RecipeGrid` section)

The root `src/app/page.tsx` is the marketing landing page (403 lines). It currently ends after the "Dirty Soda" and features sections. We append a "Trending Now" section that shows real recipes from the DB.

- [ ] **Step 1: Make root page.tsx a server component that fetches trending recipes**

`src/app/page.tsx` is currently a client component (`"use client"`) or a server component — check line 1. If it has `"use client"`, we need to split: keep the interactive marketing sections as a client component and make the page server component.

Check line 1 of `src/app/page.tsx`:
```bash
head -3 src/app/page.tsx
```

- [ ] **Step 2: Add a Supabase fetch for trending recipes at the bottom of page.tsx**

If `src/app/page.tsx` is already a server component (no `"use client"`), add a fetch. If it is a client component, create `src/app/landing-client.tsx` and move the interactive content there.

Add at the top of the default export (or in the server component):
```ts
import { createClient } from "@/lib/supabase/server";

// Inside the page function:
const supabase = await createClient();
const { data: trendingRecipes } = await supabase
  .from("recipes")
  .select("id, title, description, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, calories, dietary_tags")
  .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
  .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
  .not("image_url", "is", null)
  .order("created_at", { ascending: false })
  .limit(8);
```

- [ ] **Step 3: Append a "Trending Recipes" section at the bottom of the landing page JSX**

After the existing content sections (before the closing `</main>` or equivalent), add:
```tsx
{/* ── Trending Recipes ── */}
<section className="px-6 py-16 max-w-6xl mx-auto">
  <h2
    className="text-2xl font-bold mb-2"
    style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-text, #EFE3CE)" }}
  >
    Trending Right Now
  </h2>
  <p className="text-sm mb-8" style={{ color: "#7A5A40" }}>
    Fresh from the community — no paywalls, no sign-up required.
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {(trendingRecipes ?? []).map((r) => (
      <a
        key={r.id}
        href={`/recipes/${r.id}`}
        className="group rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="relative overflow-hidden" style={{ paddingBottom: "66%" }}>
          <img
            src={r.image_url ?? ""}
            alt={r.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-3 flex flex-col gap-1">
          <p className="text-sm font-semibold line-clamp-2 leading-snug" style={{ color: "#EFE3CE" }}>{r.title}</p>
          <p className="text-xs" style={{ color: "#6B5040" }}>
            {[r.cuisine_type, r.prep_time_minutes ? `${r.prep_time_minutes}m` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
      </a>
    ))}
  </div>
  <div className="mt-8 text-center">
    <a
      href="/discover"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
      style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1C0E04" }}
    >
      Browse all recipes →
    </a>
  </div>
</section>
```

- [ ] **Step 4: Add redirect from /dashboard to root /**

Create `src/app/(app)/dashboard/page.tsx` (or modify if it exists) with:
```ts
import { redirect } from "next/navigation";
export default function DashboardPage() {
  redirect("/");
}
```

---

### Task 2: Restructure /discover to embed swipe + world cuisines + all recipes

**Files:**
- Modify: `src/app/(app)/discover/page.tsx`
- Create: `src/app/(app)/discover/discover-hub-client.tsx`
- Modify: `src/app/(app)/swipe/page.tsx` (add redirect)

The current `/discover` page renders `DiscoverClient` which is the recipe browse grid with hacks/premium accordions. We're replacing it with a hub that has three sections.

- [ ] **Step 5: Read SwipeClient to understand what it needs**

```bash
head -30 src/app/(app)/swipe/page.tsx
```

Note what props `SwipeClient` needs and whether it does its own data fetch or receives props.

- [ ] **Step 6: Update discover/page.tsx to fetch data for all three sections**

Replace `src/app/(app)/discover/page.tsx` with a server component that fetches:
1. Recipes for the swipe stack (with `image_url` required, limit 30)
2. Cuisines list (from `src/lib/cuisines.ts` CUISINES array — no fetch needed)
3. All recipes for the grid (existing fetch, reuse the current query)

```ts
import { createClient } from "@/lib/supabase/server";
import { CUISINES } from "@/lib/cuisines";
import { DiscoverHubClient } from "./discover-hub-client";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: swipeRecipes },
    { data: gridRecipes },
    { data: pantryItems },
  ] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes, calories")
      .not("image_url", "is", null)
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .limit(30),

    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level")
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(300),

    user
      ? supabase.from("pantry_items").select("name").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const pantryNames = (pantryItems ?? []).map((p: { name: string }) => p.name.toLowerCase());
  const cuisines = CUISINES.slice(0, 20); // top 20 for the scroll row

  return (
    <DiscoverHubClient
      swipeRecipes={swipeRecipes ?? []}
      gridRecipes={gridRecipes ?? []}
      cuisines={cuisines}
      pantryNames={pantryNames}
    />
  );
}
```

- [ ] **Step 7: Create discover-hub-client.tsx with three sections**

Create `src/app/(app)/discover/discover-hub-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Shuffle, Globe, UtensilsCrossed } from "lucide-react";
import type { CuisineInfo } from "@/lib/cuisines";
import { SwipeSection } from "./swipe-section";
import { AllRecipesClient } from "../recipes/all-recipes-client";

interface SwipeRecipe {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cuisine_type?: string | null;
  dietary_tags?: string[] | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
}

interface GridRecipe {
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
}

interface Props {
  swipeRecipes: SwipeRecipe[];
  gridRecipes: GridRecipe[];
  cuisines: CuisineInfo[];
  pantryNames: string[];
}

export function DiscoverHubClient({ swipeRecipes, gridRecipes, cuisines, pantryNames: _pantryNames }: Props) {
  const [activeSection, setActiveSection] = useState<"swipe" | "cuisines" | "recipes">("swipe");

  return (
    <div className="min-h-screen">
      {/* Section tab bar */}
      <div
        className="sticky top-0 z-30 flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
        style={{ background: "var(--bg-base, #1C1209)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {([
          { key: "swipe",    label: "Meal Swipe",     icon: Shuffle },
          { key: "cuisines", label: "World Cuisines",  icon: Globe },
          { key: "recipes",  label: "All Recipes",     icon: UtensilsCrossed },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all"
            style={{
              background: activeSection === key ? "var(--wc-accent-saffron, #F4A261)" : "rgba(255,255,255,0.05)",
              color: activeSection === key ? "#1C0E04" : "var(--fg-secondary, #8A6A4A)",
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            {label}
          </button>
        ))}
      </div>

      {/* Swipe section */}
      {activeSection === "swipe" && (
        <div className="px-4 py-6">
          <SwipeSection recipes={swipeRecipes} />
        </div>
      )}

      {/* World Cuisines section */}
      {activeSection === "cuisines" && (
        <div className="px-4 py-6">
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-text, #EFE3CE)" }}
          >
            World Cuisines
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cuisines.map((c) => (
              <Link
                key={c.slug}
                href={`/cuisines/${c.slug}`}
                className="relative overflow-hidden rounded-2xl group"
                style={{ height: 110 }}
              >
                <img src={c.heroImage} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.75) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <div className="text-base mb-0.5">{c.flag}</div>
                  <p className="text-xs font-bold" style={{ color: "#EFE3CE" }}>{c.name}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/cuisines" className="text-sm font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
              See all cuisines →
            </Link>
          </div>
        </div>
      )}

      {/* All Recipes section */}
      {activeSection === "recipes" && (
        <AllRecipesClient recipes={gridRecipes} />
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create a lightweight SwipeSection component**

The existing `SwipeClient` at `src/app/(app)/swipe/swipe-client.tsx` is likely full-screen and opinionated about layout. Create a wrapper that constrains it to an embedded card stack:

Create `src/app/(app)/discover/swipe-section.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, ChefHat } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cuisine_type?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
}

export function SwipeSection({ recipes }: { recipes: Recipe[] }) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);

  if (index >= recipes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">🎉</span>
        <p className="text-base font-bold" style={{ color: "var(--wc-text, #EFE3CE)" }}>You&apos;ve seen them all!</p>
        <button
          onClick={() => setIndex(0)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1C0E04" }}
        >
          Start over
        </button>
        {saved.length > 0 && (
          <p className="text-xs" style={{ color: "#7A5A40" }}>You liked {saved.length} recipe{saved.length !== 1 ? "s" : ""}</p>
        )}
      </div>
    );
  }

  const recipe = recipes[index];
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
      <p className="text-xs self-start font-semibold" style={{ color: "#7A5A40" }}>
        {index + 1} / {recipes.length}
      </p>

      {/* Card */}
      <div className="w-full rounded-3xl overflow-hidden relative" style={{ height: 420 }}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--wc-surface-1, #2C2724)" }}>
            <ChefHat style={{ width: 48, height: 48, color: "#3A2416", opacity: 0.4 }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,6,2,0.92) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {recipe.cuisine_type && (
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#C8522A" }}>{recipe.cuisine_type}</p>
          )}
          <h3 className="text-xl font-bold mb-1 leading-snug" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {recipe.title}
          </h3>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#8A6A4A" }}>
            {totalTime > 0 && <span>⏱ {totalTime} min</span>}
            {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIndex((v) => v + 1)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(200,82,42,0.15)", border: "2px solid rgba(200,82,42,0.4)" }}
          aria-label="Skip"
        >
          <X style={{ width: 22, height: 22, color: "#C8522A" }} />
        </button>

        <Link
          href={`/recipes/${recipe.id}`}
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold"
          style={{ background: "var(--wc-surface-1, #2C2724)", color: "var(--fg-primary, #EFE3CE)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          View recipe
        </Link>

        <button
          onClick={() => { setSaved((v) => [...v, recipe.id]); setIndex((i) => i + 1); }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(130,142,111,0.15)", border: "2px solid rgba(130,142,111,0.4)" }}
          aria-label="Save"
        >
          <Heart style={{ width: 22, height: 22, color: "#828E6F" }} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Redirect /swipe to /discover**

Replace `src/app/(app)/swipe/page.tsx` content with:
```ts
import { redirect } from "next/navigation";
export default function SwipePage() {
  redirect("/discover");
}
```

- [ ] **Step 10: Check CuisineInfo type has a `flag` field**

```bash
grep -n "flag\|emoji" src/lib/cuisines.ts | head -20
```

If `CuisineInfo` uses `emoji` instead of `flag`, update the `discover-hub-client.tsx` to use `c.emoji` instead of `c.flag`.

- [ ] **Step 11: TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep -E "discover|swipe" | head -20
```
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add src/app/page.tsx src/app/(app)/discover/ src/app/(app)/swipe/page.tsx src/app/(app)/dashboard/page.tsx
git commit -m "feat: merge dashboard into landing page; restructure /discover as swipe+cuisines+recipes hub"
```
