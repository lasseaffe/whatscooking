"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink, UtensilsCrossed, Sparkles, LayoutGrid, List, GalleryHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toggle, ToggleButtonGroup } from "@/components/ui/toggle-group";

import { RecipeCard } from "@/components/recipe-card";
import { ReportButton } from "@/components/report-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { FilterBar, DietFilterBar, DifficultyFilterBar } from "@/components/filter-bar";
import { SeasonalFilter, type SeasonalState } from "@/components/seasonal-filter";
import { SuggestionPanel } from "@/components/suggestion-panel";
import { isSeasonalRecipe } from "@/lib/seasonal";
import { CUISINES, CUISINE_REGIONS, getCuisineBySlug } from "@/lib/cuisines";
import type { Recipe } from "@/lib/types";
import { Globe2 } from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { FilterDrawer, type FilterState as DrawerFilterState } from "@/components/filter-drawer";
import { HeroFilterCard, type HeroFilterState } from "@/components/hero-filter-card";

const TIME_OPTIONS = [
  { label: "≤ 15 min", value: 15 },
  { label: "≤ 30 min", value: 30 },
  { label: "≤ 45 min", value: 45 },
  { label: "≤ 60 min", value: 60 },
];

function flagEmoji(code: string): string {
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}

type R = Recipe & { source_name?: string; source_url?: string; is_premium?: boolean; is_hack?: boolean };


interface Props {
  initialRecipes: R[];
  initialQ: string;
  initialType: string;
  initialDiet: string;
  pantryNames: string[];
}

function pantryMatchPct(recipe: R, pantryNames: string[]): number {
  if (!pantryNames.length) return 0;
  const ings = ((recipe as R & { ingredients?: { name: string }[] | null }).ingredients ?? []);
  if (!ings.length) return 0;
  const matched = ings.filter((ing) =>
    pantryNames.some((p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase()))
  ).length;
  return Math.round((matched / ings.length) * 100);
}

export function DiscoverClient({ initialRecipes, initialQ, initialType, initialDiet, pantryNames }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState(initialType || "all");
  const [dietFilters, setDietFilters] = useState<string[]>(initialDiet ? [initialDiet] : []);
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [seasonal, setSeasonal] = useState<SeasonalState>({ active: false, produce: [], label: "" });
  const [seasonalKey, setSeasonalKey] = useState(0);
  const [showCuisines, setShowCuisines] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [pantryFirst, setPantryFirst] = useState(false);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [utensilFilters, setUtensilFilters] = useState<string[]>([]);
  const [maxReadyMinutes, setMaxReadyMinutes] = useState<number | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "gallery">("grid");
  const recipesRef = useRef<HTMLElement>(null);

  // Restore persisted preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("wc-view-mode") as "grid" | "list" | "gallery" | null;
    if (saved) setViewMode(saved);
  }, []);

  function handleViewMode(val: Set<React.Key>) {
    const next = [...val][0] as "grid" | "list" | "gallery";
    if (next) {
      setViewMode(next);
      localStorage.setItem("wc-view-mode", next);
    }
  }
  const { restrictions: globalRestrictions, customAvoid } = useDietaryMode();

  const hasFilters = q.length > 0 || type !== "all" || dietFilters.length > 0 || seasonal.active || cuisineFilter !== "all" || customAvoid.length > 0 || difficultyFilter !== null || pantryFirst || tagFilters.length > 0 || utensilFilters.length > 0 || maxReadyMinutes !== null;

  const filtered = useMemo(() => {
    // Deduplicate by title first
    const seen = new Set<string>();
    return initialRecipes.filter((r) => {
      const key = r.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);

      const dishTypes = r.dish_types ?? [];
      // Exclude hacks, premium, and drinks — each has its own dedicated page
      if (dishTypes.includes("hack") || dishTypes.includes("premium") || dishTypes.includes("drink")) return false;
      if (q && !r.title.toLowerCase().includes(q.toLowerCase()) &&
          !(r.description ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "all" && !dishTypes.includes(type)) return false;
      // Dietary FILTER — only dietFilters (from filter bar) hide recipes.
      // globalRestrictions (Adapt Meals mode) never hides recipes — it only swaps ingredients in recipe view.
      if (dietFilters.length > 0) {
        const tags = r.dietary_tags ?? [];
        if (!dietFilters.every((d) => tags.includes(d))) return false;
      }
      if (customAvoid.length > 0) {
        const ingNames = ((r as R & { ingredients?: { name: string }[] | null }).ingredients ?? []).map((i) => i.name.toLowerCase());
        if (customAvoid.some((avoid) => ingNames.some((ing) => ing.includes(avoid)))) return false;
      }
      if (difficultyFilter !== null) {
        if ((r as R & { difficulty_level?: string | null }).difficulty_level !== difficultyFilter) return false;
      }
      if (cuisineFilter !== "all") {
        const info = getCuisineBySlug(cuisineFilter);
        if (info && r.cuisine_type) {
          const lower = r.cuisine_type.toLowerCase();
          if (!info.dbValues.some((v) => v.toLowerCase() === lower)) return false;
        } else if (!r.cuisine_type) {
          return false;
        }
      }
      if (seasonal.active && seasonal.produce.length > 0) {
        if (!isSeasonalRecipe(r, seasonal.produce)) return false;
      }
      if (pantryFirst && pantryNames.length > 0) {
        if (pantryMatchPct(r, pantryNames) < 40) return false;
      }
      // Utensil filter — two modes:
      // "no-*" values: exclude recipes that require the named utensil
      // Positive values (e.g. "air-fryer"): show only recipes that use that utensil
      if (utensilFilters.length > 0) {
        const required: string[] = (r as R & { required_utensils?: string[] }).required_utensils ?? [];
        const lacking = utensilFilters
          .filter((u) => u.startsWith("no-"))
          .map((u) => u.slice(3));
        const positive = utensilFilters.filter((u) => !u.startsWith("no-") && u !== "no-special");
        // Exclude if recipe requires a utensil the user says they lack
        if (lacking.length > 0 && required.some((req) => lacking.includes(req))) return false;
        // "Basic Kitchen" / no-special — exclude recipes that require any special utensil
        if (utensilFilters.includes("no-special") && required.length > 0) return false;
        // Positive filter — only show recipes that require at least one of the selected utensils
        if (positive.length > 0 && !positive.some((u) => required.includes(u))) return false;
      }
      if (maxReadyMinutes !== null) {
        const totalMinutes = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
        if (totalMinutes > 0 && totalMinutes > maxReadyMinutes) return false;
      }
      return true;
    });
  }, [initialRecipes, q, type, dietFilters, cuisineFilter, seasonal, customAvoid, difficultyFilter, pantryFirst, pantryNames, utensilFilters, maxReadyMinutes]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(to bottom, #090908 0%, #090908 70%, transparent 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
          <span className="absolute top-6 right-12 opacity-5 rotate-12" style={{ fontSize: "3.5rem" }}>🍕</span>
          <span className="absolute top-20 right-36 opacity-5 -rotate-6" style={{ fontSize: "2.5rem" }}>🥑</span>
          <span className="absolute bottom-10 right-8 opacity-5 rotate-6" style={{ fontSize: "3rem" }}>🍊</span>
          <span className="absolute top-4 left-8 opacity-5 rotate-3" style={{ fontSize: "2.5rem" }}>🍜</span>
        </div>

        <div className="relative px-6 sm:px-10 py-14 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "#2A1808", color: "#C8522A", border: "1px solid #C8522A30" }}>
            <Sparkles className="w-3 h-3" />
            Curated from NYT Cooking · Serious Eats · Bon Appétit · AllRecipes · TikTok
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Find Your Next<br />
            <span style={{ color: "#C8522A" }}>Favourite Dish</span>
          </h1>
          <p className="text-base mb-8 max-w-xl" style={{ color: "#8A6A4A" }}>
            Every recipe links to its original source. No paywalls, no nonsense —
            just the best food from the internet in one place.
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#6B4E36" }} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes, ingredients, cuisines…"
              className="w-full pl-14 pr-5 py-4 rounded-2xl text-base font-medium focus:outline-none"
              style={{ background: "#1C1209", color: "#EFE3CE", border: "1.5px solid #3A2416" }}
            />
          </div>

          {/* ── Hero Filter Questionnaire Card ── */}
          <div className="mt-5 max-w-2xl">
            <HeroFilterCard
              onApply={(f: HeroFilterState) => {
                setType(f.category || "all");
                setDietFilters(f.dietary);
                setDifficultyFilter(f.difficulty || null);
                setUtensilFilters(f.utensils);
              }}
            />
          </div>

          {/* ── Ready In chips ── */}
          <div className="mt-4 max-w-2xl">
            <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>Ready in</p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMaxReadyMinutes(prev => prev === value ? null : value)}
                  className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                  style={{
                    borderColor: maxReadyMinutes === value ? "#C8522A" : "#3A2416",
                    background: maxReadyMinutes === value ? "#2A1808" : "#1C1209",
                    color: maxReadyMinutes === value ? "#C8522A" : "#8A6A4A",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Filter Drawer — Progressive Questionnaire ── */}
          {showFilterDrawer && (
            <FilterDrawer
              onClose={() => setShowFilterDrawer(false)}
              initial={{ dietary: dietFilters, difficulty: difficultyFilter ?? "", seasonality: seasonal.active ? seasonal.label : "" }}
              onApply={(f: DrawerFilterState) => {
                setDietFilters(f.dietary);
                setDifficultyFilter(f.difficulty && f.difficulty !== "any" ? f.difficulty : null);
                if (f.category && f.category !== "any") setType(f.category);
                setTagFilters(f.tags ?? []);
                setUtensilFilters(f.utensils ?? []);
                setShowFilterDrawer(false);
              }}
            />
          )}
        </div>
      </div>

      {/* ── FOR YOU — personalised suggestions ─────────────────── */}
      {!hasFilters && (
        <SuggestionPanel allRecipes={initialRecipes} />
      )}

      {/* ── WORLD CUISINES ──────────────────────────────────────── */}
      <ScrollReveal>
      <section className="px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
        <button
          onClick={() => setShowCuisines(v => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all"
          style={{ background: "rgba(28,18,9,0.6)", backdropFilter: "blur(6px)", border: "1.5px solid #3A2416" }}
        >
          <Globe2 className="w-5 h-5 shrink-0" style={{ color: "#828E6F" }} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base" style={{ color: "#EFE3CE" }}>World Cuisines</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#1C1209", color: "#828E6F", border: "1px solid #828E6F30" }}>
                {CUISINES.length} cuisines
              </span>
              {cuisineFilter !== "all" && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#828E6F", color: "#fff" }}>
                  {getCuisineBySlug(cuisineFilter)?.name} selected
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
              Filter recipes by cuisine — from Moroccan tagines to Japanese ramen
            </p>
          </div>
          <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#1C1209" }}>
            {showCuisines
              ? <ChevronUp className="w-4 h-4" style={{ color: "#828E6F" }} />
              : <ChevronDown className="w-4 h-4" style={{ color: "#828E6F" }} />}
          </div>
        </button>

        {showCuisines && (
          <div className="mt-4">
            {cuisineFilter !== "all" && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#EFE3CE" }}>
                  Showing {getCuisineBySlug(cuisineFilter)?.name} recipes
                </span>
                <button
                  onClick={() => setCuisineFilter("all")}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#2A1808", color: "#C8522A" }}
                >
                  Clear
                </button>
              </div>
            )}
            {CUISINE_REGIONS.map(region => (
              <div key={region} className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: "#A69180" }}>
                  {region}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {CUISINES.filter(c => c.region === region).map(cuisine => {
                    const isActive = cuisineFilter === cuisine.slug;
                    return (
                      <button
                        key={cuisine.slug}
                        onClick={() => {
                          setCuisineFilter(isActive ? "all" : cuisine.slug);
                          if (!isActive) {
                            setTimeout(() => recipesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                          }
                        }}
                        className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg text-left shrink-0 flex flex-col"
                        style={{
                          width: 160,
                          border: isActive ? `2px solid ${cuisine.color}` : "1px solid #3A2416",
                          background: isActive ? "#1C1209" : "#1C1209",
                          boxShadow: isActive ? `0 0 0 3px ${cuisine.color}25` : undefined,
                        }}
                      >
                        <div className="relative overflow-hidden" style={{ height: 112 }}>
                          <img src={cuisine.heroImage} alt={cuisine.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />
                          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
                            <div className="flex items-end justify-between gap-1">
                              <h3 className="text-white font-bold text-sm leading-tight drop-shadow-sm">{cuisine.name}</h3>
                              <span className="text-base shrink-0">{flagEmoji(cuisine.flag)}</span>
                            </div>
                          </div>
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cuisine.color }} />
                        </div>
                        <div className="px-2.5 py-2 flex flex-col flex-1">
                          <p className="text-xs font-medium italic mb-1.5 line-clamp-1" style={{ color: cuisine.color }}>
                            &ldquo;{cuisine.tagline}&rdquo;
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {cuisine.keyDishes.slice(0, 2).map(dish => (
                              <span key={dish} className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(255,255,255,0.07)", color: cuisine.color, fontSize: "10px" }}>
                                {dish}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </ScrollReveal>

      {/* ── TRAVEL PLANNER AD ───────────────────────────────────── */}
      <ScrollReveal delay={60}>
      <section className="px-6 sm:px-10 pb-2 max-w-5xl mx-auto w-full">
        <Link href="/menu-scanner"
          className="group flex items-stretch gap-0 rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ border: "1.5px solid #3A2416", background: "linear-gradient(120deg, rgba(28,18,9,0.7) 0%, rgba(36,26,13,0.7) 100%)", backdropFilter: "blur(6px)" }}>
          {/* Left: image strip */}
          <div className="hidden sm:flex flex-col shrink-0 overflow-hidden" style={{ width: 120 }}>
            <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=240&q=70)" }} />
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #C8522A, #828E6F)" }} />
            <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1553621042-f6e147245754?w=240&q=70)" }} />
          </div>
          <div className="flex-1 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-black tracking-tight" style={{ color: "#EFE3CE" }}>✈️ Travel × What&apos;s Cooking</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#C8522A", color: "#fff" }}>NEW</span>
            </div>
            <h3 className="text-base font-bold mb-1.5 leading-snug" style={{ color: "#EFE3CE" }}>
              Ate something amazing abroad?<br />
              <span style={{ color: "#C8522A" }}>Find the recipe.</span>
            </h3>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#8A6A4A" }}>
              Scan any restaurant menu online — we translate non-western menus (Japanese, Arabic, Thai…),
              identify dishes by description, and import them straight into your recipe collection.
            </p>
            <div className="flex flex-wrap gap-2">
              {["🍣 Translate menus", "🔍 Identify unknown dishes", "📥 Import to What's Cooking"].map(f => (
                <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#2A1808", color: "#8A6A4A" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center px-4 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
              style={{ background: "#C8522A" }}>
              <svg className="w-4 h-4 text-white fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </Link>
      </section>
      </ScrollReveal>

      {/* ── ALL RECIPES GRID ────────────────────────────────────── */}
      <section ref={recipesRef} className="px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#EFE3CE" }}>
              {cuisineFilter !== "all"
                ? `${getCuisineBySlug(cuisineFilter)?.flag} ${getCuisineBySlug(cuisineFilter)?.name} Recipes`
                : "🍽️ All Recipes"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#6B4E36" }}>
              {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
              {hasFilters && " matching your filters"}
              {seasonal.active && seasonal.label && (
                <span className="block text-xs mt-0.5" style={{ color: "#828E6F" }}>
                  🌱 {seasonal.label}
                </span>
              )}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setQ(""); setType("all"); setDietFilters([]); setCuisineFilter("all"); setDifficultyFilter(null); setPantryFirst(false); setSeasonalKey(k => k + 1); setMaxReadyMinutes(null); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ color: "#C8522A", background: "#2A1808" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <>
            {/* View toggle */}
            <div className="flex justify-end mb-3">
              <ToggleButtonGroup
                selectionMode="single"
                selectedKeys={new Set([viewMode])}
                onSelectionChange={handleViewMode}
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: "var(--wc-surface-2, #3A3430)", background: "var(--wc-surface-1, #2C2724)" }}
              >
                <Toggle id="grid" size="sm" aria-label="Grid view">
                  <LayoutGrid className="w-4 h-4" />
                </Toggle>
                <Toggle id="list" size="sm" aria-label="List view">
                  <List className="w-4 h-4" />
                </Toggle>
                <Toggle id="gallery" size="sm" aria-label="Gallery view">
                  <GalleryHorizontal className="w-4 h-4" />
                </Toggle>
              </ToggleButtonGroup>
            </div>

            {viewMode === "grid" && (
              <ScrollReveal group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((recipe) => {
                  const pct = pantryNames.length > 0 ? pantryMatchPct(recipe, pantryNames) : 0;
                  return (
                    <div key={recipe.id} className="relative">
                      <RecipeCard recipe={recipe} />
                      {pct > 0 && (
                        <div className="absolute top-2 right-2 pointer-events-none">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full shadow"
                            style={{
                              background: pct >= 80 ? "#828E6F" : pct >= 50 ? "#B8A060" : "#D4C9BA",
                              color: "#fff",
                              fontSize: 10,
                            }}
                          >
                            🥬 {pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </ScrollReveal>
            )}

            {viewMode === "list" && (
              <div className="flex flex-col gap-3">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                    className="flex gap-4 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.005]"
                    style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid var(--wc-surface-2, #3A3430)" }}
                  >
                    <div className="w-28 h-24 shrink-0 overflow-hidden">
                      <img
                        src={recipe.image_url ?? "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=200&q=80"}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-1 py-3 pr-4 flex-1">
                      <p className="font-semibold text-sm leading-tight" style={{ color: "var(--fg-primary, #EFE3CE)" }}>{recipe.title}</p>
                      {recipe.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "rgba(239,227,206,0.55)" }}>{recipe.description}</p>
                      )}
                      {((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)) > 0 && (
                        <span className="text-xs" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
                          {(recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)} min
                        </span>
                      )}
                    </div>
                    <div className="flex items-center pr-3" onClick={(e) => e.stopPropagation()}>
                      <ReportButton recipeId={recipe.id} recipeName={recipe.title} iconSize={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "gallery" && (
              <div className="columns-2 gap-4 space-y-4">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                    className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer relative"
                    style={{ border: "1px solid var(--wc-surface-2, #3A3430)" }}
                  >
                    <img
                      src={recipe.image_url ?? "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=600&q=80"}
                      alt={recipe.title}
                      className="w-full object-cover"
                      style={{ maxHeight: "320px", minHeight: "140px" }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
                    >
                      <p className="text-sm font-semibold leading-tight mb-1" style={{ color: "#fff" }}>{recipe.title}</p>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ReportButton recipeId={recipe.id} recipeName={recipe.title} iconSize={11} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "#3A2416", borderStyle: "dashed" }}>
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-3" style={{ color: "#C8522A", opacity: 0.3 }} />
            <p className="text-sm font-medium mb-1" style={{ color: "#EFE3CE" }}>No recipes found</p>
            <p className="text-xs mb-4" style={{ color: "#8A6A4A" }}>
              {initialRecipes.length === 0
                ? "Run supabase/more_recipes.sql to populate the recipe database."
                : "Try adjusting your search or filters."}
            </p>
            <button
              onClick={() => { setQ(""); setType("all"); setDietFilters([]); setCuisineFilter("all"); setDifficultyFilter(null); setPantryFirst(false); setSeasonalKey(k => k + 1); setMaxReadyMinutes(null); }}
              className="text-sm font-semibold px-5 py-2 rounded-xl"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
