"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

interface TrendingRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  cuisine_type?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  saved_count?: number | null;
}

interface Props {
  recipes: TrendingRecipe[];
  totalCount: number;
}

export function TrendingSection({ recipes, totalCount }: Props) {
  if (recipes.length === 0) return null;

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          🔥 Trending Now
        </h2>
        <Link
          href="/recipes?sort=trending"
          className="text-xs font-semibold"
          style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
        >
          See all →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: 90, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden" style={{ height: 64 }}>
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: "#2A1804" }}
                  >
                    🍽️
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <p
                  className="text-xs font-semibold leading-tight line-clamp-2"
                  style={{ color: "var(--wc-text, #EFE3CE)" }}
                >
                  {r.title}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {r.saved_count != null && r.saved_count > 0 ? (
                    <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
                      ♥ {r.saved_count >= 1000
                        ? `${(r.saved_count / 1000).toFixed(1)}k`
                        : r.saved_count}
                    </span>
                  ) : totalTime > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
                      <Clock style={{ width: 9, height: 9 }} />{totalTime}m
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}

        {/* "+N more" tile */}
        {totalCount > recipes.length && (
          <Link
            href="/recipes?sort=trending"
            className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              width: 90,
              minHeight: 90,
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-base" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
              +{totalCount - recipes.length}
            </span>
            <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>more</span>
          </Link>
        )}
      </div>
    </div>
  );
}
