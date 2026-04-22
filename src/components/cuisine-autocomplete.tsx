"use client";

import { useState, useRef, useEffect } from "react";
import { UtensilsCrossed, Loader2 } from "lucide-react";

interface MealDBMeal {
  strMeal: string;
  strArea?: string;
}

interface MealDBArea {
  strArea: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CuisineAutocomplete({ value, onChange, placeholder = "e.g. Italian, Thai, Mediterranean…" }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    onChange(q);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Search meals by name
        const [mealRes, areaRes] = await Promise.all([
          fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`),
          fetch(`https://www.themealdb.com/api/json/v1/1/list.php?a=list`),
        ]);

        const mealData = await mealRes.json();
        const areaData = await areaRes.json();

        const mealSuggestions: string[] = (mealData.meals ?? [])
          .slice(0, 5)
          .map((m: MealDBMeal) =>
            m.strArea ? `${m.strMeal} (${m.strArea})` : m.strMeal
          );

        // Filter area names that match the query
        const areaSuggestions: string[] = (areaData.meals ?? [])
          .filter((a: MealDBArea) =>
            a.strArea.toLowerCase().includes(q.toLowerCase())
          )
          .slice(0, 3)
          .map((a: MealDBArea) => `${a.strArea} cuisine`);

        const combined = [...areaSuggestions, ...mealSuggestions]
          .filter((s, i, arr) => arr.indexOf(s) === i)
          .slice(0, 8);

        setSuggestions(combined);
        setOpen(combined.length > 0);
      } catch {
        // silently fail — user can still type manually
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function select(suggestion: string) {
    onChange(suggestion);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <UtensilsCrossed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#B89080" }} />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin pointer-events-none" style={{ color: "#B89080" }} />
        )}
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "#DDD0C8", background: "#fff", color: "#1C1209" }}
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden"
          style={{ borderColor: "#DDD0C8", background: "#fff" }}
        >
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => select(s)}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                style={{ color: "#1C1209" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF3F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" style={{ color: "#B89080" }} />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
