"use client";

import { useState, useMemo } from "react";
import { Search, GlassWater } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import type { Recipe } from "@/lib/types";

type R = Recipe & { source_name?: string; source_url?: string };

const CATEGORIES = [
  { id: "all",        label: "All Drinks",   emoji: "🥂" },
  { id: "cocktail",   label: "Cocktails",    emoji: "🍸" },
  { id: "mocktail",   label: "Mocktails",    emoji: "🧃" },
  { id: "dirty-soda", label: "Dirty Sodas",  emoji: "🥤" },
  { id: "brewed",     label: "Brewed",       emoji: "☕" },
  { id: "smoothie",   label: "Smoothies",    emoji: "🥤" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

export function DrinksClient({ drinks }: { drinks: R[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId>("all");

  const filtered = useMemo(() => {
    // Deduplicate by title first
    const seen = new Set<string>();
    const deduped = drinks.filter((r) => {
      const key = r.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped.filter((r) => {
      const types = r.dish_types ?? [];
      if (cat !== "all" && !types.includes(cat)) return false;
      if (q) {
        const lower = q.toLowerCase();
        if (!r.title.toLowerCase().includes(lower) &&
            !(r.description ?? "").toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [drinks, cat, q]);

  // Group by category for the "All" view
  const groups = useMemo(() => {
    if (cat !== "all" || q) return null;
    const map: Record<string, R[]> = {};
    const seen = new Set<string>();
    for (const r of drinks) {
      const key = r.title.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const types = r.dish_types ?? [];
      const sub = ["cocktail","mocktail","dirty-soda","brewed","smoothie"].find((t) => types.includes(t)) ?? "other";
      if (!map[sub]) map[sub] = [];
      map[sub].push(r);
    }
    return map;
  }, [drinks, cat, q]);

  const SECTION_ORDER = ["dirty-soda", "cocktail", "mocktail", "brewed", "smoothie", "other"];
  const SECTION_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
    "dirty-soda": { label: "Utah Dirty Sodas", emoji: "🥤", desc: "Coconut cream, house syrups, zero alcohol — the original Utah craze" },
    "cocktail":   { label: "Cocktails",        emoji: "🍸", desc: "Classic and craft cocktails for every occasion" },
    "mocktail":   { label: "Mocktails",        emoji: "🧃", desc: "All the flavour, zero the alcohol" },
    "brewed":     { label: "Brewed & Hot",     emoji: "☕", desc: "Coffee, tea, matcha and everything in between" },
    "smoothie":   { label: "Smoothies",        emoji: "🥤", desc: "Blended fruit and veg — nutritious and delicious" },
    "other":      { label: "Other Drinks",     emoji: "🥂", desc: "" },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #1A2C3D 40%, #162536 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-10" aria-hidden>
          <span className="absolute top-8 right-16 text-6xl rotate-12">🍸</span>
          <span className="absolute top-24 right-40 text-4xl -rotate-6">🥂</span>
          <span className="absolute bottom-8 right-8 text-5xl rotate-6">🍹</span>
          <span className="absolute top-6 left-12 text-3xl rotate-3">☕</span>
          <span className="absolute bottom-10 left-28 text-4xl rotate-8">🧃</span>
        </div>

        <div className="relative px-6 sm:px-10 py-14 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
            <GlassWater className="w-3 h-3" />
            Cocktails · Mocktails · Dirty Sodas · Brewed Drinks · Smoothies
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3 text-white">
            Drinks for Every<br />
            <span style={{ color: "#FF8B6A" }}>Occasion</span>
          </h1>
          <p className="text-base mb-8 max-w-xl" style={{ color: "rgba(255,255,255,0.65)" }}>
            From Utah dirty sodas to classic cocktails — find your next pour.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mb-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search drinks…"
              className="w-full pl-14 pr-5 py-4 rounded-2xl text-base font-medium focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setCat(id as CategoryId)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: cat === id ? "#FF8B6A" : "rgba(255,255,255,0.08)",
                  color: cat === id ? "#fff" : "rgba(255,255,255,0.65)",
                  border: cat === id ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full">
        {/* Grouped "All" view */}
        {groups ? (
          <div className="space-y-14">
            {SECTION_ORDER.filter((k) => groups[k]?.length).map((key) => {
              const cfg = SECTION_LABELS[key];
              const items = groups[key];
              return (
                <section key={key}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: "rgba(200,90,47,0.1)" }}>
                      {cfg.emoji}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg" style={{ color: "#3D2817" }}>{cfg.label}</h2>
                      {cfg.desc && <p className="text-xs" style={{ color: "#A69180" }}>{cfg.desc}</p>}
                    </div>
                    <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: "#FFE4D6", color: "#C85A2F" }}>
                      {items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {items.map((r) => <RecipeCard key={r.id} recipe={r} />)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Filtered / search view */
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium" style={{ color: "#6B5B52" }}>
                {filtered.length} {filtered.length === 1 ? "drink" : "drinks"}
                {q && ` matching "${q}"`}
              </p>
              {(q || cat !== "all") && (
                <button
                  onClick={() => { setQ(""); setCat("all"); }}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg"
                  style={{ color: "#C85A2F", background: "#FFF0E6" }}
                >
                  Clear
                </button>
              )}
            </div>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            ) : (
              <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
                <GlassWater className="w-8 h-8 mx-auto mb-3" style={{ color: "#C85A2F", opacity: 0.3 }} />
                <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>No drinks found</p>
                <p className="text-xs" style={{ color: "#6B5B52" }}>Try a different search or category</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
