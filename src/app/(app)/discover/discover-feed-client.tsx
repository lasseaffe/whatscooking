"use client";

import { HeroSwiper } from "./hero-swiper";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { TrendingSection } from "./trending-section";
import { PantryMatchSection } from "./pantry-match-section";
import { QuickEasySection } from "./quick-easy-section";
import { CuisineRotator } from "./cuisine-rotator";
import { AllRecipesClient } from "../recipes/all-recipes-client";
import { RecipeQuestionnaire } from "./recipe-questionnaire";
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
  gridTotal: number;
  pantryNames: string[];
  isLoggedIn: boolean;
}

export function DiscoverFeedClient({
  swipeRecipes,
  trendingRecipes,
  trendingTotal,
  pantryMatches,
  pantryMatchTotal,
  pantryItemCount,
  quickRecipes,
  cuisines: _cuisines, // now sourced inside CuisineRotator
  gridRecipes,
  gridTotal,
  pantryNames: _pantryNames,
  isLoggedIn,
}: Props) {
  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>

      {/* ── Desktop: 2-col grid (swiper left, feed right); Mobile: stacked ── */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="lg:grid lg:grid-cols-[540px_1fr] lg:items-start">

          {/* Left column: swiper stays sticky while right column scrolls */}
          <div className="lg:sticky lg:top-0">
            <HeroSwiper recipes={swipeRecipes as SwipeRecipe[]} />
          </div>

          {/* Right column on desktop / full-width below swiper on mobile */}
          <div>
            {/* ── 1b. Recipe Questionnaire ── */}
            <RecipeQuestionnaire />

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
          </div>

        </div>
      </div>

      {/* ── 5. World Cuisines (rotating regional slideshow) ── */}
      <CuisineRotator />

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
        <AllRecipesClient recipes={gridRecipes} total={gridTotal} />
      </div>

    </div>
  );
}
