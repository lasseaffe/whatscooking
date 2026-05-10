"use client";

import { useState } from "react";
import Link from "next/link";
import { Shuffle, Globe, UtensilsCrossed } from "lucide-react";
import type { CuisineInfo } from "@/lib/cuisines";
import { SwipeSection } from "./swipe-section";
import { AllRecipesClient } from "../recipes/all-recipes-client";

function flagEmoji(code: string): string {
  if (code.length !== 2) return "🍽️";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + 127397));
}

interface SwipeRecipe {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cuisine_type?: string | null;
  dietary_tags?: string[] | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
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
  gridRecipes: GridRecipe[];
  cuisines: CuisineInfo[];
  pantryNames: string[];
}

export function DiscoverHubClient({ swipeRecipes, gridRecipes, cuisines, pantryNames: _pantryNames }: Props) {
  const [activeSection, setActiveSection] = useState<"swipe" | "cuisines" | "recipes">("swipe");

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-0 z-30 flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
        style={{ background: "var(--bg-base, #1C1209)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {([
          { key: "swipe",    label: "Meal Swipe",    icon: Shuffle },
          { key: "cuisines", label: "World Cuisines", icon: Globe },
          { key: "recipes",  label: "All Recipes",    icon: UtensilsCrossed },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all"
            style={{
              background: activeSection === key ? "var(--wc-accent-saffron, #F4A261)" : "rgba(255,255,255,0.05)",
              color: activeSection === key ? "#1C0E04" : "var(--fg-secondary, #8A6A4A)",
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            {label}
          </button>
        ))}
      </div>

      {activeSection === "swipe" && (
        <div className="px-4 py-6">
          <SwipeSection recipes={swipeRecipes} />
        </div>
      )}

      {activeSection === "cuisines" && (
        <div className="px-4 py-6">
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-text, #EFE3CE)" }}
          >
            World Cuisines
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cuisines.map((c) => (
              <Link
                key={c.slug}
                href={`/cuisines/${c.slug}`}
                className="relative overflow-hidden rounded-2xl group"
                style={{ height: 110 }}
              >
                <img src={c.heroImage} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.75) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <div className="text-base mb-0.5">{flagEmoji(c.flag)}</div>
                  <p className="text-xs font-bold" style={{ color: "#EFE3CE" }}>{c.name}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/cuisines" className="text-sm font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
              See all cuisines →
            </Link>
          </div>
        </div>
      )}

      {activeSection === "recipes" && (
        <AllRecipesClient recipes={gridRecipes} />
      )}
    </div>
  );
}
