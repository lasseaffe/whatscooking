"use client";

import { useState } from "react";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";
import { ExternalRecipeCard } from "@/components/external-recipe-card";
import { FlavorPairingsTab } from "./flavor-pairings-tab";
import { Search, Compass } from "lucide-react";

type Source = "themealdb" | "spoonacular" | "flavordb";

const SOURCES: { id: Source; label: string; color: string }[] = [
  { id: "themealdb",   label: "TheMealDB",   color: "#0D9488" },
  { id: "spoonacular", label: "Spoonacular", color: "#EA580C" },
  { id: "flavordb",    label: "FlavorDB",    color: "#7C3AED" },
];

export function ExploreClient() {
  const [source, setSource] = useState<Source>("themealdb");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalRecipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/explore/search?source=${source}&q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.recipes ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1 flex items-center gap-2"
          style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          <Compass className="w-6 h-6" style={{ color: "#C8522A" }} />
          Explore Recipes
        </h1>
        <p className="text-sm" style={{ color: "#6B5B52" }}>
          Browse recipes from external sources. Save any recipe to your cookbook.
        </p>
      </div>

      {/* Source tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSource(s.id); setResults([]); setHasSearched(false); }}
            className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors"
            style={source === s.id
              ? { background: s.color, color: "#fff", borderColor: s.color }
              : { background: "#FBF6EE", color: "#6B5B52", borderColor: "#E0D0BC" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* FlavorDB pairings tab */}
      {source === "flavordb" && <FlavorPairingsTab />}

      {/* Search */}
      {source !== "flavordb" && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A69180" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${source === "themealdb" ? "TheMealDB" : "Spoonacular"}…`}
                className="w-full pl-9 pr-4 py-2.5 rounded-full border text-sm outline-none"
                style={{ background: "#FBF6EE", borderColor: "#E0D0BC", color: "#3D2817" }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              {isLoading ? "Searching…" : "Search"}
            </button>
          </form>

          {hasSearched && results.length === 0 && !isLoading && (
            <p className="text-sm text-center py-12" style={{ color: "#A69180" }}>
              No recipes found for &ldquo;{query}&rdquo;
            </p>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {results.map((r) => (
                <ExternalRecipeCard key={r.externalId} recipe={r} />
              ))}
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-16" style={{ color: "#A69180" }}>
              <Compass className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Search to discover recipes from {source === "themealdb" ? "TheMealDB" : "Spoonacular"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
