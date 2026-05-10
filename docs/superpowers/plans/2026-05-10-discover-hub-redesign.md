# Discover Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the standalone `/swipe` Meal Swipe into `/discover` and expand Discover into a rich scrollable feed with six sections: Meal Swipe, Trending Now, Cook from Pantry, Quick & Easy, World Cuisines, All Recipes.

**Architecture:** The existing `discover-hub-client.tsx` (tab switcher) is replaced by a new `discover-feed-client.tsx` (scrollable sections). The swipe logic already extracted to `swipe-section.tsx` stays in place. Three new thin section components are added. The server component `page.tsx` grows to fetch all section data in one `Promise.all`. The `/swipe` route is converted to a redirect.

**Tech Stack:** Next.js App Router (server + client components), Supabase (server-side queries), React pointer events (swipe drag), Tailwind + inline CSS vars (existing pattern), Lucide icons.

---

## File Map

| Action | File |
|---|---|
| Modify | `src/app/(app)/discover/page.tsx` |
| Replace | `src/app/(app)/discover/discover-hub-client.tsx` → `discover-feed-client.tsx` |
| Keep | `src/app/(app)/discover/swipe-section.tsx` |
| Create | `src/app/(app)/discover/trending-section.tsx` |
| Create | `src/app/(app)/discover/pantry-match-section.tsx` |
| Create | `src/app/(app)/discover/quick-easy-section.tsx` |
| Modify | `src/app/(app)/swipe/page.tsx` (redirect) |
| Modify | `src/components/app-nav.tsx` (remove swipe nav item) |

---

## Task 1: Remove Meal Swipe from sidebar nav

**Files:**
- Modify: `src/components/app-nav.tsx`

- [ ] **Step 1: Open `app-nav.tsx` and locate the swipe nav entry**

Find this block in `NAV_GROUPS` (around line 38):

```tsx
{
  href: "/swipe",
  label: "Meal Swipe",
  icon: Shuffle,
  desc: "",
},
```

- [ ] **Step 2: Delete the swipe nav entry**

Remove the entire object above. The `Discover` group should now only contain:

```tsx
{
  group: "Discover",
  items: [
    {
      href: "/discover",
      label: "Discover",
      icon: Compass,
      desc: "",
    },
    {
      href: "/cuisines",
      label: "World Cuisines",
      icon: Globe,
      desc: "",
      children: [
        { href: "/cuisines/fusion",        label: "Fusion Foods",   icon: Globe,  desc: "" },
        { href: "/cuisines/world-cup-2026", label: "World Cup 2026", icon: Trophy, desc: "" },
      ],
    },
    {
      href: "/recipes",
      label: "All Recipes",
      icon: UtensilsCrossed,
      desc: "",
    },
  ],
},
```

- [ ] **Step 3: Remove the unused `Shuffle` import if it's no longer used**

Check the top of the file. If `Shuffle` only appeared in the swipe nav entry, remove it from the import line:

```tsx
// Before
import {
  ChefHat, UtensilsCrossed, ShoppingBasket, Calendar, PartyPopper,
  Target, LogOut, Shuffle, Globe, Trophy, Compass,
  ChevronRight, ShoppingCart,
} from "lucide-react";

// After
import {
  ChefHat, UtensilsCrossed, ShoppingBasket, Calendar, PartyPopper,
  Target, LogOut, Globe, Trophy, Compass,
  ChevronRight, ShoppingCart,
} from "lucide-react";
```

- [ ] **Step 4: Start the dev server and verify the sidebar no longer shows "Meal Swipe"**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npm run dev
```

Open http://localhost:3000 (or 3002), hover the sidebar — confirm "Meal Swipe" is gone, "Discover" still links correctly.

- [ ] **Step 5: Commit**

```bash
git add src/components/app-nav.tsx
git commit -m "feat(nav): remove Meal Swipe sidebar entry"
```

---

## Task 2: Redirect `/swipe` to `/discover`

**Files:**
- Modify: `src/app/(app)/swipe/page.tsx`

- [ ] **Step 1: Replace the swipe page with a redirect**

Open `src/app/(app)/swipe/page.tsx`. Replace its entire contents with:

```tsx
import { redirect } from "next/navigation";

export default function SwipePage() {
  redirect("/discover");
}
```

- [ ] **Step 2: Verify the redirect works**

Navigate to http://localhost:3000/swipe — you should land on `/discover` immediately.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/swipe/page.tsx
git commit -m "feat(swipe): redirect /swipe to /discover"
```

---

## Task 3: Create `TrendingSection` component

**Files:**
- Create: `src/app/(app)/discover/trending-section.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

interface TrendingRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  cuisine_type?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  saved_count?: number | null;
}

interface Props {
  recipes: TrendingRecipe[];
  totalCount: number;
}

export function TrendingSection({ recipes, totalCount }: Props) {
  if (recipes.length === 0) return null;

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          🔥 Trending Now
        </h2>
        <Link
          href="/recipes?sort=trending"
          className="text-xs font-semibold"
          style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
        >
          See all →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: 90, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden" style={{ height: 64 }}>
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: "#2A1804" }}
                  >
                    🍽️
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <p
                  className="text-xs font-semibold leading-tight line-clamp-2"
                  style={{ color: "var(--wc-text, #EFE3CE)" }}
                >
                  {r.title}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {r.saved_count != null && r.saved_count > 0 ? (
                    <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
                      ♥ {r.saved_count >= 1000
                        ? `${(r.saved_count / 1000).toFixed(1)}k`
                        : r.saved_count}
                    </span>
                  ) : totalTime > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
                      <Clock style={{ width: 9, height: 9 }} />{totalTime}m
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}

        {/* "+N more" tile */}
        {totalCount > recipes.length && (
          <Link
            href="/recipes?sort=trending"
            className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              width: 90,
              minHeight: 90,
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-base" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
              +{totalCount - recipes.length}
            </span>
            <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>more</span>
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/discover/trending-section.tsx
git commit -m "feat(discover): add TrendingSection component"
```

---

## Task 4: Create `PantryMatchSection` component

**Files:**
- Create: `src/app/(app)/discover/pantry-match-section.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";

interface PantryMatch {
  id: string;
  title: string;
  image_url?: string | null;
  matchedCount: number;
  totalIngredients: number;
}

interface Props {
  matches: PantryMatch[];
  totalMatchCount: number;
  pantryItemCount: number;
}

export function PantryMatchSection({ matches, totalMatchCount, pantryItemCount }: Props) {
  // No pantry items: show CTA
  if (pantryItemCount === 0) {
    return (
      <div
        className="px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h2
          className="text-sm font-bold mb-3"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          🧺 Cook from Pantry
        </h2>
        <Link
          href="/pantry"
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "rgba(244,162,97,0.06)",
            border: "1px solid rgba(244,162,97,0.18)",
          }}
        >
          <span className="text-2xl">🛒</span>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: "var(--wc-text, #EFE3CE)" }}>
              Add items to your pantry
            </p>
            <p className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
              We&apos;ll show recipes you can cook right now →
            </p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          🧺 Cook from Pantry
        </h2>
        <Link href="/pantry" className="text-xs font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
          My Pantry →
        </Link>
      </div>

      {/* Match count banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
        style={{
          background: "rgba(244,162,97,0.08)",
          border: "1px solid rgba(244,162,97,0.2)",
        }}
      >
        <span className="text-xl">🥦</span>
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{ color: "var(--wc-text, #EFE3CE)" }}>
            {totalMatchCount} recipe{totalMatchCount !== 1 ? "s" : ""} match your pantry
          </p>
          <p className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
            Based on {pantryItemCount} pantry item{pantryItemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/pantry"
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1C0E04" }}
        >
          View
        </Link>
      </div>

      {/* Top 2 match cards */}
      {matches.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/recipes/${m.id}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden rounded-lg shrink-0" style={{ width: 36, height: 36 }}>
                {m.image_url ? (
                  <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: "#2A1804" }}>🍳</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--wc-text, #EFE3CE)" }}>
                  {m.title}
                </p>
                <p className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
                  {m.matchedCount} / {m.totalIngredients} ingredients
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/discover/pantry-match-section.tsx
git commit -m "feat(discover): add PantryMatchSection component"
```

---

## Task 5: Create `QuickEasySection` component

**Files:**
- Create: `src/app/(app)/discover/quick-easy-section.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";

interface QuickRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
}

interface Props {
  recipes: QuickRecipe[];
}

export function QuickEasySection({ recipes }: Props) {
  // Hide section if fewer than 3 recipes
  if (recipes.length < 3) return null;

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          ⚡ Quick &amp; Easy
        </h2>
        <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
          Under 20 min
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden" style={{ height: 72 }}>
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: "#2A1804" }}
                  >
                    🍽️
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <p
                  className="text-xs font-semibold leading-tight line-clamp-2 mb-1"
                  style={{ color: "var(--wc-text, #EFE3CE)" }}
                >
                  {r.title}
                </p>
                {totalTime > 0 && (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
                  >
                    ⚡ {totalTime} min
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/discover/quick-easy-section.tsx
git commit -m "feat(discover): add QuickEasySection component"
```

---

## Task 6: Create `DiscoverFeedClient` (replaces `DiscoverHubClient`)

**Files:**
- Create: `src/app/(app)/discover/discover-feed-client.tsx`

This is the top-level client component that stitches all sections together in scroll order.

- [ ] **Step 1: Check what `AllRecipesClient` import path is**

Search for `AllRecipesClient` in the discover directory:

```bash
grep -r "AllRecipesClient" src/app/\(app\)/discover/ --include="*.tsx"
```

Note the import path used in `discover-hub-client.tsx` (it currently imports from `"../recipes/all-recipes-client"`).

- [ ] **Step 2: Create `discover-feed-client.tsx`**

```tsx
"use client";

import { SwipeSection } from "./swipe-section";
import { TrendingSection } from "./trending-section";
import { PantryMatchSection } from "./pantry-match-section";
import { QuickEasySection } from "./quick-easy-section";
import { AllRecipesClient } from "../recipes/all-recipes-client";
import Link from "next/link";
import type { CuisineInfo } from "@/lib/cuisines";

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

interface TrendingRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  cuisine_type?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  saved_count?: number | null;
}

interface PantryMatch {
  id: string;
  title: string;
  image_url?: string | null;
  matchedCount: number;
  totalIngredients: number;
}

interface QuickRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
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
  required_utensils?: string[] | null;
}

interface Props {
  swipeRecipes: SwipeRecipe[];
  trendingRecipes: TrendingRecipe[];
  trendingTotal: number;
  pantryMatches: PantryMatch[];
  pantryMatchTotal: number;
  pantryItemCount: number;
  quickRecipes: QuickRecipe[];
  cuisines: CuisineInfo[];
  gridRecipes: GridRecipe[];
  pantryNames: string[];
  isLoggedIn: boolean;
}

function flagEmoji(code: string): string {
  if (code.length !== 2) return "🍽️";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + 127397));
}

export function DiscoverFeedClient({
  swipeRecipes,
  trendingRecipes,
  trendingTotal,
  pantryMatches,
  pantryMatchTotal,
  pantryItemCount,
  quickRecipes,
  cuisines,
  gridRecipes,
  pantryNames,
  isLoggedIn,
}: Props) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #1C1209)" }}>

      {/* ── 1. Meal Swipe ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-4 pt-5 pb-2">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "var(--wc-accent-saffron, #F4A261)", opacity: 0.7 }}
          >
            Today&apos;s Picks
          </span>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Meal Swipe
          </h1>
        </div>
        <SwipeSection recipes={swipeRecipes} />
      </div>

      {/* ── 2. Trending Now ── */}
      <TrendingSection recipes={trendingRecipes} totalCount={trendingTotal} />

      {/* ── 3. Cook from Pantry (logged-in only) ── */}
      {isLoggedIn && (
        <PantryMatchSection
          matches={pantryMatches}
          totalMatchCount={pantryMatchTotal}
          pantryItemCount={pantryItemCount}
        />
      )}

      {/* ── 4. Quick & Easy ── */}
      <QuickEasySection recipes={quickRecipes} />

      {/* ── 5. World Cuisines ── */}
      <div
        className="px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            🌍 World Cuisines
          </h2>
          <Link href="/cuisines" className="text-xs font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cuisines.slice(0, 8).map((c) => (
            <Link
              key={c.slug}
              href={`/cuisines/${c.slug}`}
              className="relative overflow-hidden rounded-xl flex flex-col items-center justify-center gap-1"
              style={{ height: 56, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-xl">{flagEmoji(c.flag)}</span>
              <span className="text-xs font-bold" style={{ color: "var(--wc-text, #EFE3CE)" }}>{c.name}</span>
            </Link>
          ))}
          {cuisines.length > 8 && (
            <Link
              href="/cuisines"
              className="rounded-xl flex flex-col items-center justify-center gap-1"
              style={{ height: 56, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
            >
              <span className="text-xs font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
                +{cuisines.length - 8}
              </span>
              <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>more</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 6. All Recipes ── */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            🍽️ All Recipes
          </h2>
          <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
            {gridRecipes.length}+ recipes
          </span>
        </div>
        <AllRecipesClient recipes={gridRecipes} />
      </div>

    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/discover/discover-feed-client.tsx
git commit -m "feat(discover): add DiscoverFeedClient scrollable feed"
```

---

## Task 7: Update `discover/page.tsx` — new data fetching + pantry match logic

**Files:**
- Modify: `src/app/(app)/discover/page.tsx`

- [ ] **Step 1: Replace `page.tsx` with the updated server component**

The key additions: `trendingRecipes`, `quickRecipes`, and pantry match computation.

```tsx
import { createClient } from "@/lib/supabase/server";
import { CUISINES } from "@/lib/cuisines";
import { DiscoverFeedClient } from "./discover-feed-client";

export const dynamic = "force-dynamic";

function computePantryMatches(
  recipes: Array<{
    id: string;
    title: string;
    image_url?: string | null;
    ingredients?: Array<{ name: string }> | null;
  }>,
  pantryNames: string[]
): Array<{ id: string; title: string; image_url?: string | null; matchedCount: number; totalIngredients: number }> {
  if (pantryNames.length === 0) return [];

  return recipes
    .filter((r) => (r.ingredients ?? []).length > 0)
    .map((r) => {
      const ings = r.ingredients ?? [];
      const matched = ings.filter((ing) =>
        pantryNames.some(
          (p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase())
        )
      ).length;
      return {
        id: r.id,
        title: r.title,
        image_url: r.image_url,
        matchedCount: matched,
        totalIngredients: ings.length,
        matchPct: Math.round((matched / ings.length) * 100),
      };
    })
    .filter((r) => r.matchPct >= 40)
    .sort((a, b) => b.matchPct - a.matchPct);
}

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: swipeRecipes },
    { data: trendingRaw, count: trendingTotal },
    { data: quickRecipes },
    { data: gridRecipes },
    { data: pantryItems },
    { data: matchCandidates },
  ] = await Promise.all([
    // 1. Swipe deck
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes, calories")
      .not("image_url", "is", null)
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .limit(30),

    // 2. Trending — order by saved_count desc, fall back handled below
    supabase
      .from("recipes")
      .select("id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, saved_count", { count: "exact" })
      .not("image_url", "is", null)
      .order("saved_count", { ascending: false, nullsFirst: false })
      .limit(10),

    // 3. Quick & Easy (≤20 min total)
    supabase
      .from("recipes")
      .select("id, title, image_url, prep_time_minutes, cook_time_minutes")
      .not("image_url", "is", null)
      .lte("prep_time_minutes", 20)
      .limit(10),

    // 4. All recipes grid
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level")
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(300),

    // 5. Pantry items (for swipe filter + pantry matching)
    user
      ? supabase.from("pantry_items").select("name").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { name: string }[], error: null }),

    // 6. Recipes with ingredients for pantry matching (only when logged in)
    user
      ? supabase
          .from("recipes")
          .select("id, title, image_url, ingredients")
          .not("ingredients", "is", null)
          .limit(200)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; image_url?: string | null; ingredients?: Array<{ name: string }> | null }>, error: null }),
  ]);

  const pantryNames = (pantryItems ?? []).map((p) => p.name.toLowerCase());
  const cuisines = CUISINES.slice(0, 20);

  // Pantry matches
  const allPantryMatches = computePantryMatches(matchCandidates ?? [], pantryNames);
  const topPantryMatches = allPantryMatches.slice(0, 2);

  // Quick recipes: filter server-side didn't catch cook_time, refilter
  const filteredQuick = (quickRecipes ?? []).filter(
    (r) => (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0) <= 20
  );

  return (
    <DiscoverFeedClient
      swipeRecipes={swipeRecipes ?? []}
      trendingRecipes={trendingRaw ?? []}
      trendingTotal={trendingTotal ?? 0}
      pantryMatches={topPantryMatches}
      pantryMatchTotal={allPantryMatches.length}
      pantryItemCount={pantryNames.length}
      quickRecipes={filteredQuick}
      cuisines={cuisines}
      gridRecipes={gridRecipes ?? []}
      pantryNames={pantryNames}
      isLoggedIn={!!user}
    />
  );
}
```

**Note on `saved_count`:** If the column doesn't exist on `recipes`, Supabase will return an error. Check by running:

```bash
grep -r "saved_count" src/app --include="*.tsx" --include="*.ts"
```

If no results, the column likely doesn't exist — change the trending query to fall back to `created_at` ordering:

```tsx
// Fallback trending query (if saved_count column doesn't exist):
supabase
  .from("recipes")
  .select("id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes", { count: "exact" })
  .not("image_url", "is", null)
  .order("created_at", { ascending: false })
  .limit(10),
```

- [ ] **Step 2: Start the dev server and open `/discover`**

```bash
npm run dev
```

Navigate to http://localhost:3000/discover. Verify all 6 sections render. Check the browser console for errors.

- [ ] **Step 3: Fix any TypeScript errors**

```bash
npx tsc --noEmit
```

Fix any type mismatches reported.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/discover/page.tsx
git commit -m "feat(discover): update page.tsx with 6-section data fetching"
```

---

## Task 8: Delete old hub client and verify

**Files:**
- Delete: `src/app/(app)/discover/discover-hub-client.tsx`

- [ ] **Step 1: Confirm nothing imports `discover-hub-client`**

```bash
grep -r "discover-hub-client" src/ --include="*.tsx" --include="*.ts"
```

Expected: no results (page.tsx now imports `discover-feed-client`).

- [ ] **Step 2: Delete the file**

```bash
rm "src/app/(app)/discover/discover-hub-client.tsx"
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify the page still loads**

Open http://localhost:3000/discover. All 6 sections should render correctly.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(discover): delete obsolete discover-hub-client"
```

---

## Task 9: Check `AllRecipesClient` import path

The `AllRecipesClient` component is imported in `discover-feed-client.tsx` as `"../recipes/all-recipes-client"`. Verify it exists there.

- [ ] **Step 1: Locate the actual file**

```bash
find src/app -name "all-recipes-client*" 2>/dev/null
```

- [ ] **Step 2: If path differs, update the import in `discover-feed-client.tsx`**

For example if it lives at `src/components/all-recipes-client.tsx`:

```tsx
// Change
import { AllRecipesClient } from "../recipes/all-recipes-client";
// To
import { AllRecipesClient } from "@/components/all-recipes-client";
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: If `AllRecipesClient` doesn't exist, use `DiscoverClient` instead**

The existing `discover-client.tsx` already renders a full recipe grid. In `discover-feed-client.tsx`, swap:

```tsx
// Replace AllRecipesClient section with a simple 2-col grid inline:
<div className="grid grid-cols-2 gap-3">
  {gridRecipes.map((r) => (
    <Link key={r.id} href={`/recipes/${r.id}`}
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ height: 80 }}>
        {r.image_url
          ? <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "#2A1804" }}>🍽️</div>}
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold line-clamp-2" style={{ color: "var(--wc-text, #EFE3CE)" }}>{r.title}</p>
        {r.cuisine_type && (
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>{r.cuisine_type}</p>
        )}
      </div>
    </Link>
  ))}
</div>
```

- [ ] **Step 5: Commit if any changes were needed**

```bash
git add src/app/(app)/discover/discover-feed-client.tsx
git commit -m "fix(discover): correct AllRecipesClient import path"
```

---

## Task 10: Final smoke test

- [ ] **Step 1: Check the full page flow**

1. Open http://localhost:3000/discover — all 6 sections visible, page scrolls smoothly
2. Swipe a card left and right — LIKE/NOPE stamps appear, deck advances
3. Tap a card — preview sheet opens
4. Deck empties — match screen appears inline (no redirect)
5. Click "🔥 Trending Now → See all →" — lands on `/recipes?sort=trending`
6. Click a pantry match card — goes to recipe detail
7. Click a cuisine tile — goes to `/cuisines/[slug]`
8. Navigate to http://localhost:3000/swipe — redirects to `/discover`
9. Check sidebar — "Meal Swipe" is gone, "Discover" is active

- [ ] **Step 2: Check console is clean**

Open DevTools → Console. No red errors on page load or during swipe.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(discover): complete Discover Hub redesign — scrollable feed with 6 sections"
```
