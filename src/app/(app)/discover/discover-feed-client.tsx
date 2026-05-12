"use client";

import { useState } from "react";
import { HeroSwiper } from "./hero-swiper";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { TrendingSection } from "./trending-section";
import { PantryMatchSection } from "./pantry-match-section";
import { QuickEasySection } from "./quick-easy-section";
import { AllRecipesClient } from "../recipes/all-recipes-client";
import Link from "next/link";
import type { CuisineInfo } from "@/lib/cuisines";
import { ReportButton } from "@/components/report-button";
import { AnimatePresence } from "framer-motion";
import { Wand2 } from "lucide-react";
import { FinderDrawer, type FinderAnswers, type FinderResult } from "@/components/finder-drawer";
import { FinderResultsSection } from "@/components/finder-results-section";
import type { Recipe } from "@/lib/types";

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
  gridTotal,
  pantryNames: _pantryNames,
  isLoggedIn,
}: Props) {
  const [showFinder, setShowFinder] = useState(false);
  const [finderResult, setFinderResult] = useState<FinderResult | null>(null);
  const [finderAnswers, setFinderAnswers] = useState<FinderAnswers | null>(null);

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

      {/* ── Finder — "Help me decide" ── */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFinder(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            <Wand2 className="w-4 h-4" />
            {finderResult ? "✏️ Refine picks" : "Help me decide"}
          </button>
          {finderResult && (
            <button
              onClick={() => { setFinderResult(null); setFinderAnswers(null); }}
              className="text-xs font-medium px-3 py-2 rounded-full"
              style={{ color: "#6B4E36", background: "#1C1209", border: "1px solid #3A2416" }}
            >
              ✕ Clear
            </button>
          )}
          {!finderResult && (
            <span className="text-xs" style={{ color: "#6B4E36" }}>
              Answer 4 quick questions — we&apos;ll find 20 recipes for you
            </span>
          )}
        </div>
      </div>

      {/* ── Finder results carousel (when available) ── */}
      {finderResult && (
        <FinderResultsSection
          recipes={finderResult.recipes as Recipe[]}
          profile={finderResult.profile}
          onRefine={() => setShowFinder(true)}
          onDismiss={() => { setFinderResult(null); setFinderAnswers(null); }}
        />
      )}

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
        <div className="grid grid-cols-3 gap-3">
          {cuisines.slice(0, 8).map((c) => (
            <div key={c.slug} className="relative group">
              <Link
                href={`/cuisines/${c.slug}`}
                className="relative overflow-hidden rounded-xl flex flex-col"
                style={{ height: 90, border: `1.5px solid ${c.color}30`, background: "#1C1209" }}
              >
                {/* Hero image */}
                <img
                  src={c.heroImage}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(10,5,2,0.88) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }}
                />
                {/* Colour accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: c.color }} />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
                  <div className="flex items-end justify-between gap-1">
                    <span className="text-white font-bold leading-tight drop-shadow-sm" style={{ fontSize: "0.75rem" }}>{c.name}</span>
                    <span style={{ fontSize: "0.9rem" }}>{flagEmoji(c.flag)}</span>
                  </div>
                </div>
              </Link>
              {/* Report problem button — top-right on hover */}
              <div
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ zIndex: 10 }}
                onClick={(e) => e.preventDefault()}
              >
                <ReportButton
                  recipeId={`cuisine-${c.slug}`}
                  recipeName={`${c.name} Cuisine Card`}
                  iconSize={11}
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 6,
                    padding: "3px 5px",
                  }}
                />
              </div>
            </div>
          ))}
          {cuisines.length > 8 && (
            <Link
              href="/cuisines"
              className="rounded-xl flex flex-col items-center justify-center gap-1"
              style={{ height: 90, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
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
        <AllRecipesClient recipes={gridRecipes} total={gridTotal} />
      </div>

      {/* ── Finder Drawer ── */}
      <AnimatePresence>
        {showFinder && (
          <FinderDrawer
            onClose={() => setShowFinder(false)}
            onResults={(result, answers) => {
              setFinderResult(result);
              setFinderAnswers(answers);
            }}
            initial={finderAnswers ?? undefined}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
