"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Clock, Flame, Loader2 } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  image_url?: string | null;
  calories?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  dietary_tags?: string[] | null;
}

interface Props {
  mealType: string;
  dietaryFilters: string[];
  onSelect: (recipe: Recipe) => void;
  onClose: () => void;
}

export function RecipePickerSlideOver({ mealType, dietaryFilters: _dietaryFilters, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      fetchSuggestions();
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const mealParam = ["breakfast","lunch","dinner","snack","dessert"].includes(mealType.toLowerCase())
        ? `&type=${encodeURIComponent(mealType)}` : "";
      const res = await fetch(`/api/recipes/autocomplete?q=&limit=20${mealParam}`);
      if (res.ok) setResults(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md h-[80vh] sm:h-full sm:max-h-screen flex flex-col"
        style={{ background: "var(--wc-bg-card, #1C1209)", borderLeft: "1px solid rgba(90,50,20,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(90,50,20,0.3)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B5040" }}>Add meal</p>
            <h3
              className="text-base font-bold"
              style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {mealLabel}
            </h3>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg" style={{ color: "#6B5040" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(90,50,20,0.2)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6B5040" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${mealLabel.toLowerCase()} recipes…`}
              autoFocus
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(90,50,20,0.4)" }}
            />
            {loading && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin"
                style={{ color: "#6B5040" }}
              />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-4xl" role="img" aria-label="cooking">&#x1F373;</span>
              <p className="text-sm" style={{ color: "#6B5040" }}>No recipes found</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {results.map((r) => {
                const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
                return (
                  <button
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="flex items-center gap-3 px-4 py-3 text-left w-full hover:bg-white/5 transition-colors"
                    style={{ borderBottom: "1px solid rgba(90,50,20,0.1)" }}
                  >
                    {r.image_url ? (
                      <img src={r.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl"
                        style={{ background: "rgba(42,24,8,0.6)" }}
                      >
                        &#x1F37D;&#xFE0F;
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>{r.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {totalTime > 0 && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "#6B5040" }}>
                            <Clock style={{ width: 10, height: 10 }} />{totalTime}m
                          </span>
                        )}
                        {r.calories && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "#6B5040" }}>
                            <Flame style={{ width: 10, height: 10 }} />{r.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
