"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CultureConfig, CULTURE_FILTERS } from "@/lib/drinks";
import { DrinkFilterBar } from "@/components/drinks/drink-filter-bar";
import { RecipeCard } from "@/components/recipe-card";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  dish_types: string[];
  drink_meta: Record<string, unknown>;
  cook_time_minutes: number | null;
  servings: number | null;
}

interface Props {
  culture: CultureConfig;
  recipes: Recipe[];
}

export function CultureClient({ culture, recipes }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeFilters = useMemo(() => {
    const raw = searchParams.get("filter");
    return raw ? raw.split(",") : [];
  }, [searchParams]);

  function toggleFilter(option: string) {
    const next = activeFilters.includes(option)
      ? activeFilters.filter((f) => f !== option)
      : [...activeFilters, option];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("filter", next.join(","));
    else params.delete("filter");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const visible = useMemo(() => {
    if (!activeFilters.length) return recipes;
    return recipes.filter((r) =>
      activeFilters.some((f) =>
        r.dish_types.some((t) => t.toLowerCase() === f.toLowerCase())
      )
    );
  }, [recipes, activeFilters]);

  const photoUrl = `https://source.unsplash.com/featured/1400x500/?${encodeURIComponent(culture.photoQuery)}&sig=${culture.photoSig}`;

  return (
    <div
      className="culture-page"
      style={{ "--accent": culture.accentColor } as React.CSSProperties}
    >
      <div
        className="culture-hero"
        style={{ backgroundImage: `url(${photoUrl})` }}
      >
        <div className="culture-hero__scrim" />
        <div className="culture-hero__text">
          <p className="culture-hero__eyebrow">{culture.eyebrow}</p>
          <h1 className="culture-hero__name">
            {culture.emoji} {culture.name}
          </h1>
          <p className="culture-hero__desc">{culture.desc}</p>
        </div>
      </div>

      <DrinkFilterBar
        groups={CULTURE_FILTERS[culture.slug]}
        active={activeFilters}
        onToggle={toggleFilter}
        accentColor={culture.accentColor}
      />

      {activeFilters.length > 0 && (
        <div className="culture-active-filters">
          {activeFilters.map((f) => (
            <button key={f} onClick={() => toggleFilter(f)} className="culture-active-filter-pill">
              {f} ×
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="culture-empty">
          <p>
            {culture.emoji} No {culture.name} recipes match those filters.
          </p>
          <button onClick={() => router.replace(pathname)}>Clear filters</button>
        </div>
      ) : (
        <div className="culture-grid">
          {visible.map((recipe) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <RecipeCard key={recipe.id} recipe={recipe as any} />
          ))}
        </div>
      )}
    </div>
  );
}
