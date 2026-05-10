"use client";

import { HeroSwiper } from "./hero-swiper";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { TrendingSection } from "./trending-section";
import { PantryMatchSection } from "./pantry-match-section";
import { QuickEasySection } from "./quick-easy-section";
import { AllRecipesClient } from "../recipes/all-recipes-client";
import Link from "next/link";
import type { CuisineInfo } from "@/lib/cuisines";

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
  pantryNames: _pantryNames,
  isLoggedIn,
}: Props) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #1C1209)" }}>

      {/* ── 1. Meal Swipe ── */}
      <HeroSwiper recipes={swipeRecipes as SwipeRecipe[]} />

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
