"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  Search, ChevronDown, ChevronUp, X, SlidersHorizontal, Clock,
  LayoutGrid, List,
} from "lucide-react";
import Link from "next/link";
import { ReportButton } from "@/components/report-button";
import { RecipeImage } from "@/components/recipe-image";

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

type TagGroup = { label: string; emoji: string; tags: string[] };

const TAG_GROUPS: TagGroup[] = [
  {
    label: "Cuisine or Region", emoji: "🌍",
    tags: ["austrian","brazilian","british","chinese","french","german","greek","indian","irish","israeli","italian","japanese","jewish","middle eastern","north african","portuguese","russian","spanish","thai","ukrainian","vietnamese"],
  },
  {
    label: "Diet", emoji: "🥗",
    tags: ["baby food","dairy-free","egg-free","gluten-free","vegan","vegetarian"],
  },
  {
    label: "Fruit", emoji: "🍎",
    tags: ["apple","apricot","avocado","banana","blackberries","blueberries","cherry","cranberries","dates","figs","grapefruit","grapes","honeydew","lemon","lime","mango","orange","peach","pear","pineapple","plum","pomegranate","raspberries","rhubarb","strawberries","watermelon"],
  },
  {
    label: "Holiday or Occasion", emoji: "🎄",
    tags: ["christmas","date night","easter","food gifts","game day","hanukkah","passover","ramadan","thanksgiving","birthday"],
  },
  {
    label: "Ingredient", emoji: "🧄",
    tags: ["beans","bourbon","brown butter","cheese","coconut","eggs","lamb","beef","peanut butter","seafood","tofu","turkey"],
  },
  {
    label: "Meal or Course", emoji: "🍽️",
    tags: ["appetizer","bread","breakfast","brunch","dinner","dips","drinks","dumplings","lunch","muffin","pizza","quick bread","salad","pasta","sandwich","side dish","snack","soup","stew","waffles"],
  },
  {
    label: "Method", emoji: "🔥",
    tags: ["baked","casserole","freezer friendly","grilling","instant pot","pickled","sheet pan","slow cooker"],
  },
  {
    label: "Season", emoji: "🍂",
    tags: ["fall","spring","summer","winter"],
  },
  {
    label: "Sweets", emoji: "🍰",
    tags: ["brownies","cake","candy","celebration cakes","chocolate","cookies","custard","doughnut","ice cream","pudding","tarts","pies"],
  },
  {
    label: "Vegetable", emoji: "🥦",
    tags: ["artichokes","asparagus","beets","brussels sprouts","cabbage","carrots","cauliflower","celery","corn","cucumber","eggplant","garlic","kale","leeks","mushrooms","okra","onions","peas","potatoes","radishes","spinach","swiss chard","tomatoes","pumpkin","zucchini"],
  },
];

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];
const DIET_TAGS = ["vegetarian","vegan","gluten-free","dairy-free","keto","halal","kosher","high-protein"];

function recipeMatchesTag(recipe: Recipe, tag: string): boolean {
  const haystack = [
    ...(recipe.dish_types ?? []),
    ...(recipe.dietary_tags ?? []),
    recipe.cuisine_type ?? "",
  ].map((s) => s.toLowerCase());
  const t = tag.toLowerCase();
  return haystack.some((h) => h.includes(t) || t.includes(h));
}

function adaptNeeded(
  recipe: { required_utensils?: string[] | null },
  utensilFilters: string[],
  mode: "positive" | "negative"
): boolean {
  if (mode !== "negative" || utensilFilters.length === 0) return false;
  return utensilFilters.some((u) =>
    (recipe.required_utensils ?? []).some((ru) => ru.toLowerCase().includes(u.toLowerCase()))
  );
}

function RecipeCard({ recipe, view, showAdaptBadge }: { recipe: Recipe; view: "grid" | "list"; showAdaptBadge?: boolean }) {
  const img = recipe.image_url ?? null;
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  if (view === "list") {
    return (
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-amber-700/50 group"
        style={{ borderColor: "rgba(90,50,20,0.25)", background: "rgba(30,18,8,0.4)" }}
      >
        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-amber-950/30">
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={img}
            title={recipe.title}
            cuisine={recipe.cuisine_type}
            dietaryTags={recipe.dietary_tags}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "#EFE3CE" }}>{recipe.title}</p>
          {recipe.description && (
            <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "#6B5040" }}>{recipe.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {totalTime > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#6B5040" }}>
                <Clock className="w-3 h-3" />{totalTime}m
              </span>
            )}
            {recipe.cuisine_type && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(90,50,20,0.3)", color: "#C8865A" }}>
                {recipe.cuisine_type}
              </span>
            )}
            {showAdaptBadge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}>
                🔄 Adapt
              </span>
            )}
          </div>
        </div>
        <div
          className="shrink-0 pr-3"
          onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        >
          <ReportButton recipeId={recipe.id} recipeName={recipe.title} iconSize={12} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: "rgba(90,50,20,0.25)", background: "rgba(30,18,8,0.4)" }}
    >
      <div className="relative h-40 overflow-hidden bg-amber-950/30">
        <RecipeImage
          recipeId={recipe.id}
          imageUrl={img}
          title={recipe.title}
          cuisine={recipe.cuisine_type}
          dietaryTags={recipe.dietary_tags}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.7) 0%, transparent 55%)" }} />
        {recipe.difficulty_level && (
          <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-medium capitalize"
            style={{ background: "rgba(0,0,0,0.5)", color: "#EFE3CE" }}>
            {recipe.difficulty_level}
          </span>
        )}
        {totalTime > 0 && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs"
            style={{ color: "rgba(239,227,206,0.85)" }}>
            <Clock className="w-3 h-3" />{totalTime}m
          </span>
        )}
        <div
          className="absolute bottom-2 right-2 z-10"
          onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        >
          <ReportButton recipeId={recipe.id} recipeName={recipe.title} iconSize={12} />
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "#EFE3CE" }}>{recipe.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          {recipe.cuisine_type && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(90,50,20,0.3)", color: "#C8865A" }}>
              {recipe.cuisine_type}
            </span>
          )}
          {showAdaptBadge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}>
              🔄 Adapt
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TagPill({
  tag, count, active, onClick,
}: {
  tag: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all hover:scale-105 capitalize"
      style={{
        borderColor: active ? "#F4A261" : "rgba(90,50,20,0.4)",
        background: active ? "rgba(244,162,97,0.15)" : "rgba(30,18,8,0.6)",
        color: active ? "#F4A261" : "#9A7A58",
        fontWeight: active ? 600 : 400,
      }}
    >
      {tag}
      {count > 0 && <span className="text-[10px] opacity-60">{count}</span>}
    </button>
  );
}

export function AllRecipesClient({
  recipes: initialRecipes,
  total: initialTotal,
}: {
  recipes: Recipe[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeDiets, setActiveDiets] = useState<Set<string>>(new Set());
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [utensilFilters, setUtensilFilters] = useState<string[]>([]);
  const [utensilMode, setUtensilMode] = useState<"positive" | "negative">("negative");

  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>(initialRecipes);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [hasMore, setHasMore] = useState((initialTotal ?? 0) > initialRecipes.length);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecipes = useCallback(async (opts: {
    page: number;
    search: string;
    tags: Set<string>;
    diets: Set<string>;
    difficulty: string | null;
    append: boolean;
  }) => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(opts.page), limit: "50" });
    if (opts.search.trim()) params.set("search", opts.search.trim());
    if (opts.difficulty)    params.set("difficulty", opts.difficulty);
    const allTags = [...opts.tags, ...opts.diets].filter(Boolean);
    if (allTags.length)     params.set("tags", allTags.join(","));

    try {
      const res = await fetch(`/api/recipes/list?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      const fetched: Recipe[] = json.recipes ?? [];
      setDisplayedRecipes(prev => opts.append ? [...prev, ...fetched] : fetched);
      setTotal(json.total ?? 0);
      setHasMore(json.hasMore ?? false);
      setPage(opts.page);
    } catch {
      // Keep existing recipes on network failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  const localFiltered = useMemo(() => {
    if (utensilFilters.length === 0 || utensilMode !== "positive") return displayedRecipes;
    return displayedRecipes.filter((r) =>
      utensilFilters.some((u) =>
        (r.required_utensils ?? []).some((ru) => ru.toLowerCase().includes(u.toLowerCase()))
      )
    );
  }, [displayedRecipes, utensilFilters, utensilMode]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      fetchRecipes({ page: 0, search: query, tags: next, diets: activeDiets, difficulty: activeDifficulty, append: false });
      return next;
    });
  };

  const toggleDiet = (diet: string) => {
    setActiveDiets((prev) => {
      const next = new Set(prev);
      next.has(diet) ? next.delete(diet) : next.add(diet);
      fetchRecipes({ page: 0, search: query, tags: activeTags, diets: next, difficulty: activeDifficulty, append: false });
      return next;
    });
  };

  const toggleGroup = (label: string) =>
    setExpandedGroups((p) => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n; });

  const activeFilterCount = activeTags.size + activeDiets.size + (activeDifficulty ? 1 : 0) + utensilFilters.length;
  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim());
  const clearAll = () => {
    setActiveTags(new Set());
    setActiveDiets(new Set());
    setActiveDifficulty(null);
    setQuery("");
    setUtensilFilters([]);
    setDisplayedRecipes(initialRecipes);
    setTotal(initialTotal);
    setHasMore(initialTotal > initialRecipes.length);
    setPage(0);
  };

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "#EFE3CE" }}>
          All Recipes
        </h1>
        <p className="text-sm" style={{ color: "#6B5040" }}>
          {total.toLocaleString()} recipes &middot; {localFiltered.length.toLocaleString()} showing
        </p>
      </div>

      {/* ── Search bar + controls ── */}
      <div className="px-6 pb-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B5040" }} />
          <input
            type="text"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              searchTimerRef.current = setTimeout(() => {
                fetchRecipes({ page: 0, search: val, tags: activeTags, diets: activeDiets, difficulty: activeDifficulty, append: false });
              }, 300);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
            style={{ background: "rgba(30,18,8,0.6)", borderColor: "rgba(90,50,20,0.4)", color: "#EFE3CE" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: "#6B5040" }} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
          style={{
            borderColor: showFilters ? "#F4A261" : "rgba(90,50,20,0.4)",
            background: showFilters ? "rgba(244,162,97,0.12)" : "rgba(30,18,8,0.6)",
            color: showFilters ? "#F4A261" : "#9A7A58",
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: "#F4A261", color: "#1A0A00" }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "rgba(90,50,20,0.4)" }}>
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className="p-2.5 transition-colors"
              style={{
                background: view === v ? "rgba(244,162,97,0.15)" : "rgba(30,18,8,0.6)",
                color: view === v ? "#F4A261" : "#6B5040",
              }}>
              {v === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasAnyFilter && (
        <div className="px-6 pb-3 flex flex-wrap items-center gap-1.5">
          {[...activeTags].map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "rgba(244,162,97,0.18)", color: "#F4A261", border: "1px solid rgba(244,162,97,0.4)" }}>
              {tag} <X className="w-3 h-3" />
            </button>
          ))}
          {[...activeDiets].map((diet) => (
            <button key={diet} onClick={() => toggleDiet(diet)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "rgba(100,200,100,0.12)", color: "#6DCC8A", border: "1px solid rgba(100,200,100,0.3)" }}>
              {diet} <X className="w-3 h-3" />
            </button>
          ))}
          {activeDifficulty && (
            <button onClick={() => setActiveDifficulty(null)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "rgba(160,100,200,0.12)", color: "#B07ADA", border: "1px solid rgba(160,100,200,0.3)" }}>
              {activeDifficulty} <X className="w-3 h-3" />
            </button>
          )}
          {utensilFilters.map((u) => (
            <button
              key={`utensil-${u}`}
              onClick={() => setUtensilFilters((prev) => prev.filter((x) => x !== u))}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{ background: "rgba(42,24,8,0.4)", borderColor: "rgba(90,50,20,0.4)", color: "#C8A882" }}
            >
              🍳 {u}
              <span style={{ fontSize: 10, marginLeft: 2 }}>×</span>
            </button>
          ))}
          <button onClick={clearAll} className="text-xs px-2 py-0.5 rounded-full"
            style={{ color: "#6B5040", border: "1px solid rgba(90,50,20,0.3)" }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="mx-6 mb-6 rounded-2xl border p-4 space-y-5"
          style={{ borderColor: "rgba(90,50,20,0.35)", background: "rgba(20,10,4,0.6)" }}>

          {/* Dietary quick filters */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(244,162,97,0.7)" }}>Dietary</p>
            <div className="flex flex-wrap gap-1.5">
              {DIET_TAGS.map((diet) => (
                <button key={diet} onClick={() => toggleDiet(diet)}
                  className="text-xs px-2.5 py-1 rounded-full border capitalize transition-all hover:scale-105"
                  style={{
                    borderColor: activeDiets.has(diet) ? "#6DCC8A" : "rgba(90,50,20,0.4)",
                    background: activeDiets.has(diet) ? "rgba(100,200,100,0.12)" : "rgba(30,18,8,0.6)",
                    color: activeDiets.has(diet) ? "#6DCC8A" : "#9A7A58",
                    fontWeight: activeDiets.has(diet) ? 600 : 400,
                  }}>
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(244,162,97,0.7)" }}>Difficulty</p>
            <div className="flex gap-1.5">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button key={d} onClick={() => {
                  const next = activeDifficulty === d ? null : d;
                  setActiveDifficulty(next);
                  fetchRecipes({ page: 0, search: query, tags: activeTags, diets: activeDiets, difficulty: next, append: false });
                }}
                  className="text-xs px-2.5 py-1 rounded-full border capitalize transition-all hover:scale-105"
                  style={{
                    borderColor: activeDifficulty === d ? "#B07ADA" : "rgba(90,50,20,0.4)",
                    background: activeDifficulty === d ? "rgba(160,100,200,0.12)" : "rgba(30,18,8,0.6)",
                    color: activeDifficulty === d ? "#B07ADA" : "#9A7A58",
                    fontWeight: activeDifficulty === d ? 600 : 400,
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible category groups */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(244,162,97,0.7)" }}>Categories</p>
            <div className="space-y-1.5">
              {TAG_GROUPS.map((group) => {
                const isOpen = expandedGroups.has(group.label);
                const activeInGroup = group.tags.filter((t) => activeTags.has(t)).length;
                return (
                  <div key={group.label} className="rounded-xl overflow-hidden border"
                    style={{ borderColor: "rgba(90,50,20,0.25)" }}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors"
                      style={{ background: isOpen ? "rgba(30,18,8,0.8)" : "rgba(20,10,4,0.4)" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{group.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: isOpen ? "#EFE3CE" : "#9A7A58" }}>
                          {group.label}
                        </span>
                        {activeInGroup > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(244,162,97,0.2)", color: "#F4A261" }}>
                            {activeInGroup}
                          </span>
                        )}
                      </div>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "#6B5040" }} />
                        : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#6B5040" }} />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-2 flex flex-wrap gap-1.5"
                        style={{ background: "rgba(14,7,2,0.5)" }}>
                        {group.tags.map((tag) => (
                          <TagPill
                            key={tag}
                            tag={tag}
                            count={0}
                            active={activeTags.has(tag)}
                            onClick={() => toggleTag(tag)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Recipe grid / list ── */}
      <div className="px-6 pb-10">
        {localFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-5xl">🍳</span>
            <p className="text-base font-semibold" style={{ color: "#EFE3CE" }}>No recipes match your filters</p>
            <p className="text-sm" style={{ color: "#6B5040" }}>Try removing a filter or searching something else</p>
            <button
              onClick={() => { setQuery(""); setActiveTags(new Set()); setUtensilFilters([]); setDisplayedRecipes(initialRecipes); setTotal(initialTotal); setHasMore(initialTotal > initialRecipes.length); setPage(0); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#F4A261", color: "#fff" }}
            >
              Clear all filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {localFiltered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                view="grid"
                showAdaptBadge={adaptNeeded(r, utensilFilters, utensilMode)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl">
            {localFiltered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                view="list"
                showAdaptBadge={adaptNeeded(r, utensilFilters, utensilMode)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Load More ── */}
      {hasMore && (
        <div className="px-6 py-8 flex justify-center">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fetchRecipes({
              page: page + 1,
              search: query,
              tags: activeTags,
              diets: activeDiets,
              difficulty: activeDifficulty,
              append: true,
            })}
            className="px-8 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: "rgba(90,50,20,0.3)",
              color: "#C8A882",
              border: "1px solid rgba(90,50,20,0.5)",
            }}
          >
            {isLoading ? "Loading…" : "Load 50 more recipes"}
          </button>
        </div>
      )}
      {!hasMore && displayedRecipes.length > 50 && (
        <p className="py-6 text-center text-sm" style={{ color: "#4A3020" }}>
          All {total.toLocaleString()} recipes shown
        </p>
      )}
    </div>
  );
}
