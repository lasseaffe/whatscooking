"use client";

import Link from "next/link";

interface QuickRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
}

interface Props {
  recipes: QuickRecipe[];
}

export function QuickEasySection({ recipes }: Props) {
  // Hide section if fewer than 3 recipes
  if (recipes.length < 3) return null;

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
          ⚡ Quick &amp; Easy
        </h2>
        <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
          Under 20 min
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden" style={{ height: 72 }}>
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
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
                  className="text-xs font-semibold leading-tight line-clamp-2 mb-1"
                  style={{ color: "var(--wc-text, #EFE3CE)" }}
                >
                  {r.title}
                </p>
                {totalTime > 0 && (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
                  >
                    ⚡ {totalTime} min
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
