"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Search,
  Loader2,
  GripVertical,
  Clock,
  Flame,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { RecipeImage } from "@/components/recipe-image";
import type { MealType } from "./WeeklyPlanGrid";

export interface BankRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  dietary_tags?: string[];
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  is_saved?: boolean;
}

export interface RecipeBankProps {
  planId: string;
  dietaryFilters: string[];
  focusMealType?: MealType | null;
}

function DraggableCard({
  recipe,
  large,
}: {
  recipe: BankRecipe;
  large?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bank-${recipe.id}`,
    data: { type: "recipe-bank", recipe },
  });

  if (large) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? "grabbing" : "grab",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #3A2A1A",
          background: "#1A120A",
        }}
      >
        <div className="w-full" style={{ height: 160 }}>
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={recipe.image_url}
            title={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-3">
          <div
            className="font-semibold text-sm mb-1"
            style={{ color: "#EFE3CE" }}
          >
            {recipe.title}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {(recipe.dietary_tags ?? []).slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "#2A1F14", color: "#E67E22" }}
              >
                {t}
              </span>
            ))}
          </div>
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: "#8A6A4A" }}
          >
            {recipe.prep_time_minutes != null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)} min
              </span>
            )}
            {recipe.calories != null && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {recipe.calories} kcal
              </span>
            )}
            {recipe.is_saved && (
              <Bookmark className="w-3 h-3" style={{ color: "#E67E22" }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-2 rounded"
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        background: "#1A120A",
        border: "1px solid #2A1F14",
      }}
    >
      <GripVertical
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: "#3A2A1A" }}
      />
      <div className="w-8 h-8 rounded overflow-hidden shrink-0">
        <RecipeImage
          recipeId={recipe.id}
          imageUrl={recipe.image_url}
          title={recipe.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium truncate"
          style={{ color: "#EFE3CE" }}
        >
          {recipe.title}
        </div>
        {recipe.calories != null && (
          <div className="text-xs" style={{ color: "#8A6A4A" }}>
            {recipe.calories} kcal
          </div>
        )}
      </div>
      {recipe.is_saved && (
        <Bookmark
          className="w-3 h-3 shrink-0"
          style={{ color: "#E67E22" }}
        />
      )}
    </div>
  );
}

export function RecipeBank({
  planId,
  dietaryFilters,
  focusMealType,
}: RecipeBankProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BankRecipe[]>([]);
  const [recs, setRecs] = useState<BankRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!planId) return;
    const controller = new AbortController();
    setRecsLoading(true);
    fetch(`/api/recipes/recommend?plan_id=${encodeURIComponent(planId)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setRecs(Array.isArray(data) ? data : []);
        setFeaturedIdx(0);
      })
      .catch((e) => { if (e.name !== "AbortError") setRecs([]); })
      .finally(() => setRecsLoading(false));
    return () => controller.abort();
  }, [planId]);

  useEffect(() => {
    if (focusMealType) searchRef.current?.focus();
  }, [focusMealType]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    setFeaturedIdx(0);
  }, [activeFilters, query]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/recipes/autocomplete?q=${encodeURIComponent(q)}&limit=10&saved=true`
        );
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  function toggleFilter(f: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const displayList = query.length >= 2 ? results : recs;
  const filtered =
    activeFilters.size === 0
      ? displayList
      : displayList.filter((r) =>
          [...activeFilters].every((f) => r.dietary_tags?.includes(f))
        );

  const featuredItem = filtered[featuredIdx] ?? filtered[0] ?? null;
  const featuredItemIndex = featuredItem ? filtered.indexOf(featuredItem) : -1;
  const rest = filtered.filter((_, i) => i !== featuredItemIndex);

  return (
    <div className="flex flex-col gap-3" style={{ color: "#EFE3CE" }}>
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: "#6B4E36" }}
        />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Search recipes..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded outline-none"
          style={{
            background: "#1A120A",
            border: "1px solid #3A2A1A",
            color: "#EFE3CE",
          }}
        />
        {loading && (
          <Loader2
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin"
            style={{ color: "#6B4E36" }}
          />
        )}
      </div>

      {/* Filter chips */}
      {dietaryFilters.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {dietaryFilters.map((f) => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              aria-pressed={activeFilters.has(f)}
              className="text-xs px-2.5 py-0.5 rounded-full border transition-colors"
              style={{
                background: activeFilters.has(f) ? "#E67E22" : "#2A1F14",
                color: activeFilters.has(f) ? "#1A120A" : "#8A6A4A",
                borderColor: activeFilters.has(f) ? "#E67E22" : "#3A2A1A",
              }}
            >
              {f}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button
              onClick={() => setActiveFilters(new Set())}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: "#6B4E36" }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Smart recs label */}
      {query.length < 2 && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "#6B4E36" }}
        >
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {recsLoading ? "Loading suggestions…" : "Suggested for you"}
        </div>
      )}

      {/* Featured card */}
      {featuredItem && (
        <div className="relative">
          <DraggableCard recipe={featuredItem} large />
          {filtered.length > 1 && (
            <div className="flex items-center gap-2 mt-1.5 justify-center">
              <button
                aria-label="Previous recipe"
                onClick={() =>
                  setFeaturedIdx(
                    (i) => (i - 1 + filtered.length) % filtered.length
                  )
                }
                className="p-1 rounded"
                style={{ background: "#2A1F14", color: "#8A6A4A" }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs" style={{ color: "#6B4E36" }}>
                {featuredItemIndex + 1} / {filtered.length}
              </span>
              <button
                aria-label="Next recipe"
                onClick={() =>
                  setFeaturedIdx((i) => (i + 1) % filtered.length)
                }
                className="p-1 rounded"
                style={{ background: "#2A1F14", color: "#8A6A4A" }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compact list */}
      <div className="flex flex-col gap-1.5">
        {rest.slice(0, 6).map((r) => (
          <DraggableCard key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  );
}
