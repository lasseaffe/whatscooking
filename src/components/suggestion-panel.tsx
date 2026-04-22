"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, RefreshCw, Heart, BookOpen, Star, Plus, X, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import type { Recipe } from "@/lib/types";

type R = Recipe & { source_name?: string; source_url?: string };

interface Profile {
  topCuisines: string[];
  topDishTypes: string[];
  topDietaryTags: string[];
  seedCount: number;
  isAllVegan: boolean;
  isAllVegetarian: boolean;
}

interface SuggestionPanelProps {
  allRecipes: R[]; // catalog to search through for manual adds
}

export function SuggestionPanel({ allRecipes }: SuggestionPanelProps) {
  const [open, setOpen] = useState(false);
  const [useSaved, setUseSaved] = useState(true);
  const [useOwn, setUseOwn] = useState(true);
  const [useRated, setUseRated] = useState(true);
  const [respectDietary, setRespectDietary] = useState(true);
  const [manualSeeds, setManualSeeds] = useState<R[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<R[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedIds: manualSeeds.map((r) => r.id),
          useSaved,
          useOwn,
          useRated,
          respectDietary,
        }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("Failed to load suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setProfile(data.profile);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError("Couldn't load suggestions");
      }
    }
    setLoading(false);
  }, [useSaved, useOwn, useRated, respectDietary, manualSeeds]);

  // Fetch when panel opens or settings change
  useEffect(() => {
    if (open) fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useSaved, useOwn, useRated, respectDietary, manualSeeds]);

  const searchResults = searchQ.length > 1
    ? allRecipes
        .filter((r) =>
          !manualSeeds.some((s) => s.id === r.id) &&
          (r.title.toLowerCase().includes(searchQ.toLowerCase()) ||
           (r.cuisine_type ?? "").toLowerCase().includes(searchQ.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  function addSeed(r: R) {
    setManualSeeds((prev) => [...prev, r]);
    setSearchQ("");
    setShowSearch(false);
  }

  function removeSeed(id: string) {
    setManualSeeds((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section className="px-6 sm:px-10 py-6 max-w-5xl mx-auto w-full">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all hover:shadow-md"
        style={{ background: "linear-gradient(135deg, #FFF8EE 0%, #FFF0D8 100%)", border: "2px solid #E8C88A" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #FFE4D6, #FFD0A8)" }}>
          <Sparkles className="w-5 h-5" style={{ color: "#C85A2F" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base" style={{ color: "#3D2817" }}>For You</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#FFE4D6", color: "#C85A2F" }}>
              Personalised
            </span>
            {profile && (
              <span className="text-xs" style={{ color: "#A69180" }}>
                Based on {profile.seedCount} recipe{profile.seedCount !== 1 ? "s" : ""} you love
                {profile.isAllVegan && " · showing vegan recipes"}
                {profile.isAllVegetarian && !profile.isAllVegan && " · showing vegetarian recipes"}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#8C6820" }}>
            Smart suggestions based on your taste profile
          </p>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#E8C870" }}>
          {open
            ? <ChevronUp className="w-4 h-4" style={{ color: "#5C3C10" }} />
            : <ChevronDown className="w-4 h-4" style={{ color: "#5C3C10" }} />}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            {/* Source toggles */}
            {[
              { key: "saved",   label: "Saved",        icon: Heart,    value: useSaved,    set: setUseSaved    },
              { key: "own",     label: "My Recipes",   icon: BookOpen, value: useOwn,      set: setUseOwn      },
              { key: "rated",   label: "Highly Rated", icon: Star,     value: useRated,    set: setUseRated    },
            ].map(({ key, label, icon: Icon, value, set }) => (
              <button key={key}
                onClick={() => set((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: value ? "#FFF0E6" : "#FAF7F2",
                  color: value ? "#C85A2F" : "#A69180",
                  borderColor: value ? "#C85A2F40" : "#E8D4BA",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}

            <button
              onClick={() => setRespectDietary((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: respectDietary ? "#DCFCE7" : "#FAF7F2",
                color: respectDietary ? "#16A34A" : "#A69180",
                borderColor: respectDietary ? "#16A34A40" : "#E8D4BA",
              }}
            >
              🌿 Match dietary style
            </button>

            <button onClick={() => setShowSearch((v) => !v)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-90"
              style={{ background: "#F5EDE4", color: "#6B5B52", borderColor: "#E8D4BA" }}>
              <Plus className="w-3.5 h-3.5" />
              Add meal as reference
            </button>

            <button onClick={fetchSuggestions} disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border transition-all hover:opacity-90 disabled:opacity-40"
              style={{ color: "#6B5B52", borderColor: "#E8D4BA" }}>
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Manual seed search */}
          {showSearch && (
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                style={{ borderColor: "#E8D4BA", background: "#FFFCF8" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "#A69180" }} />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search for a meal to use as reference…"
                  className="flex-1 text-sm bg-transparent focus:outline-none"
                  style={{ color: "#3D2817" }}
                />
                <button onClick={() => { setShowSearch(false); setSearchQ(""); }}>
                  <X className="w-4 h-4" style={{ color: "#A69180" }} />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border shadow-lg overflow-hidden"
                  style={{ background: "#FAF7F2", borderColor: "#E8D4BA" }}>
                  {searchResults.map((r) => (
                    <button key={r.id}
                      onClick={() => addSeed(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors border-b last:border-b-0"
                      style={{ borderColor: "#F5E6D3" }}>
                      {r.image_url && (
                        <img src={r.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <div className="font-medium" style={{ color: "#3D2817" }}>{r.title}</div>
                        {r.cuisine_type && (
                          <div className="text-xs" style={{ color: "#A69180" }}>{r.cuisine_type}</div>
                        )}
                      </div>
                      <Plus className="w-4 h-4 ml-auto shrink-0" style={{ color: "#C85A2F" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual seed chips */}
          {manualSeeds.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              <span className="text-xs self-center" style={{ color: "#A69180" }}>Using as reference:</span>
              {manualSeeds.map((r) => (
                <span key={r.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ background: "#FFF0E6", color: "#C85A2F", borderColor: "#C85A2F40" }}>
                  {r.title}
                  <button onClick={() => removeSeed(r.id)} className="opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggestions grid */}
          {loading && (
            <div className="flex items-center justify-center py-12 gap-3"
              style={{ color: "#A69180" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Finding recipes you&apos;ll love…</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8 text-sm" style={{ color: "#C85A2F" }}>{error}</div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="text-center py-8 rounded-2xl border" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
              <Sparkles className="w-7 h-7 mx-auto mb-2" style={{ color: "#C85A2F", opacity: 0.4 }} />
              <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>Nothing to suggest yet</p>
              <p className="text-xs" style={{ color: "#6B5B52" }}>
                Save some recipes, rate recipes you&apos;ve tried, or add a reference meal above.
              </p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {profile?.topCuisines.length ? (
                <p className="text-xs px-1" style={{ color: "#A69180" }}>
                  Based on your love of {profile.topCuisines.slice(0, 3).join(", ")} cuisine
                  {profile.isAllVegan ? " · showing vegan recipes only" : ""}
                  {profile.isAllVegetarian && !profile.isAllVegan ? " · showing vegetarian recipes only" : ""}
                </p>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {suggestions.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
