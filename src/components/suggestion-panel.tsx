"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, RefreshCw, Heart, BookOpen, Star, Plus, X, Search, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [open, setOpen] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const VISIBLE = 4; // how many cards visible at once
  const [useSaved, setUseSaved] = useState(true);
  const [useOwn, setUseOwn] = useState(true);
  const [useRated, setUseRated] = useState(true);
  const [respectDietary, setRespectDietary] = useState(true);
  const [manualSeeds, setManualSeeds] = useState<R[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<(R & { badges?: string[] })[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<{ id: string; display_name: string }[]>([]);
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
      setHouseholdMembers(data.householdMembers ?? []);
      setCarouselIndex(0);
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
        style={{ background: "rgba(28,18,9,0.6)", backdropFilter: "blur(6px)", border: "1.5px solid #3A2416" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#2A1808", border: "1px solid #3A2416" }}>
          <Sparkles className="w-5 h-5" style={{ color: "#C8522A" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base" style={{ color: "#EFE3CE" }}>For You</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
              style={{ background: "#2A1808", borderColor: "#C8522A40", color: "#C8522A" }}>
              Personalised
            </span>
            {profile && (
              <span className="text-xs" style={{ color: "#8A6A4A" }}>
                Based on {profile.seedCount} recipe{profile.seedCount !== 1 ? "s" : ""} you love
                {profile.isAllVegan && " · showing vegan recipes"}
                {profile.isAllVegetarian && !profile.isAllVegan && " · showing vegetarian recipes"}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
            Smart suggestions based on your taste profile
          </p>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#2A1808" }}>
          {open
            ? <ChevronUp className="w-4 h-4" style={{ color: "#C8522A" }} />
            : <ChevronDown className="w-4 h-4" style={{ color: "#C8522A" }} />}
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
                  background: value ? "rgba(200,82,42,0.15)" : "#1C1209",
                  color: value ? "#C8522A" : "#8A6A4A",
                  borderColor: value ? "#C8522A" : "#3A2416",
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
                background: respectDietary ? "rgba(22,163,74,0.15)" : "#1C1209",
                color: respectDietary ? "#4ADE80" : "#8A6A4A",
                borderColor: respectDietary ? "#16A34A" : "#3A2416",
              }}
            >
              <span>🌿</span> Match dietary style
            </button>

            <button onClick={() => setShowSearch((v) => !v)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-90"
              style={{ background: "#2A1808", color: "#8A6A4A", borderColor: "#3A2416" }}>
              <Plus className="w-3.5 h-3.5" />
              Add meal as reference
            </button>

            <button onClick={fetchSuggestions} disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border transition-all hover:opacity-90 disabled:opacity-40"
              style={{ color: "#8A6A4A", borderColor: "#3A2416" }}>
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Manual seed search */}
          {showSearch && (
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                style={{ borderColor: "#3A2416", background: "#1C1209" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "#6B4E36" }} />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search for a meal to use as reference…"
                  className="flex-1 text-sm bg-transparent focus:outline-none"
                  style={{ color: "#EFE3CE" }}
                />
                <button onClick={() => { setShowSearch(false); setSearchQ(""); }}>
                  <X className="w-4 h-4" style={{ color: "#A69180" }} />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border shadow-lg overflow-hidden"
                  style={{ background: "#1C1209", borderColor: "#3A2416" }}>
                  {searchResults.map((r) => (
                    <button key={r.id}
                      onClick={() => addSeed(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors border-b last:border-b-0 hover:bg-[#2A1808]"
                      style={{ borderColor: "#3A2416" }}>
                      {r.image_url && (
                        <img src={r.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <div className="font-medium" style={{ color: "#EFE3CE" }}>{r.title}</div>
                        {r.cuisine_type && (
                          <div className="text-xs" style={{ color: "#8A6A4A" }}>{r.cuisine_type}</div>
                        )}
                      </div>
                      <Plus className="w-4 h-4 ml-auto shrink-0" style={{ color: "#C8522A" }} />
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
                  style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", borderColor: "#C8522A40" }}>
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
              style={{ color: "#8A6A4A" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Finding recipes you&apos;ll love…</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8 text-sm" style={{ color: "#C8522A" }}>{error}</div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="text-center py-8 rounded-2xl border" style={{ borderColor: "#3A2416", borderStyle: "dashed" }}>
              <Sparkles className="w-7 h-7 mx-auto mb-2" style={{ color: "#C8522A", opacity: 0.4 }} />
              <p className="text-sm font-medium mb-1" style={{ color: "#EFE3CE" }}>Nothing to suggest yet</p>
              <p className="text-xs" style={{ color: "#6B4E36" }}>
                Save some recipes, rate recipes you&apos;ve tried, or add a reference meal above.
              </p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {profile?.topCuisines.length ? (
                <p className="text-xs px-1" style={{ color: "#8A6A4A" }}>
                  Based on your love of {profile.topCuisines.slice(0, 3).join(", ")} cuisine
                  {profile.isAllVegan ? " · showing vegan recipes only" : ""}
                  {profile.isAllVegetarian && !profile.isAllVegan ? " · showing vegetarian recipes only" : ""}
                </p>
              ) : null}

              {/* ── Horizontal Carousel ── */}
              <div className="relative">
                {/* Prev button */}
                {carouselIndex > 0 && (
                  <button
                    onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    style={{ background: "#C8522A", color: "#fff" }}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                {/* Cards row */}
                <div className="overflow-hidden">
                  <motion.div
                    className="flex gap-4"
                    animate={{ x: `calc(-${carouselIndex * (100 / VISIBLE)}% - ${carouselIndex * 16 / VISIBLE}px)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ width: `${(suggestions.length / VISIBLE) * 100}%` }}
                  >
                    {suggestions.map((recipe) => (
                      <div
                        key={recipe.id}
                        style={{ width: `${100 / suggestions.length}%`, flexShrink: 0 }}
                      >
                        <RecipeCard recipe={recipe} />
                        {/* Household badges */}
                        {Array.isArray(recipe.badges) && recipe.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 px-1">
                            {recipe.badges.includes("family_favourite") && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "#2A1808", color: "#C8A030" }}>⭐ Family favourite</span>
                            )}
                            {recipe.badges.includes("baby_friendly") && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "#1A2010", color: "#828E6F" }}>👶 Baby-friendly</span>
                            )}
                            {recipe.badges.find((b: string) => b.startsWith("wont_eat:")) && (() => {
                              const badge = recipe.badges.find((b: string) => b.startsWith("wont_eat:"))!;
                              const memberIds = badge.replace("wont_eat:", "").split(",");
                              return memberIds.map((mid: string) => {
                                const member = householdMembers.find((m) => m.id === mid);
                                return member ? (
                                  <span key={mid} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: "#2A1808", color: "#DC2626" }}>⚠️ {member.display_name} won&apos;t eat this</span>
                                ) : null;
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Next button */}
                {carouselIndex < suggestions.length - VISIBLE && (
                  <button
                    onClick={() => setCarouselIndex((i) => Math.min(suggestions.length - VISIBLE, i + 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    style={{ background: "#C8522A", color: "#fff" }}
                    aria-label="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Dot indicators */}
                {suggestions.length > VISIBLE && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {Array.from({ length: suggestions.length - VISIBLE + 1 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === carouselIndex ? 20 : 6,
                          height: 6,
                          background: i === carouselIndex ? "#C8522A" : "#3A2416",
                        }}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
