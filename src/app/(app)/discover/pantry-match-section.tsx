"use client";

import Link from "next/link";

interface PantryMatch {
  id: string;
  title: string;
  image_url?: string | null;
  matchedCount: number;
  totalIngredients: number;
}

interface Props {
  matches: PantryMatch[];
  totalMatchCount: number;
  pantryItemCount: number;
  pantryNames: string[];
}

export function PantryMatchSection({ matches, totalMatchCount, pantryItemCount, pantryNames }: Props) {
  // No pantry items: simple warm CTA
  if (pantryItemCount === 0) {
    return (
      <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link
          href="/pantry"
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(200,90,47,0.06)", border: "1px solid rgba(200,90,47,0.18)" }}
        >
          <span className="text-2xl">🧺</span>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: "#EFE3CE" }}>
              Add items to your pantry
            </p>
            <p className="text-xs" style={{ color: "#8A6A4A" }}>
              We&apos;ll show recipes you can cook right now →
            </p>
          </div>
        </Link>
      </div>
    );
  }

  const displayedPills = pantryNames.slice(0, 4);
  const extraCount = pantryNames.length - displayedPills.length;

  return (
    <div
      data-tour="pantry-matches"
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Hero header */}
      <div
        className="rounded-xl px-4 pt-4 pb-3 mb-3"
        style={{
          background: "linear-gradient(135deg, rgba(200,120,42,0.1) 0%, transparent 70%)",
          border: "1px solid rgba(200,90,47,0.15)",
        }}
      >
        {/* Ingredient pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {displayedPills.map((name) => (
            <span
              key={name}
              className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{
                background: "rgba(244,162,97,0.1)",
                border: "1px solid rgba(244,162,97,0.2)",
                color: "#F4A261",
              }}
            >
              {name}
            </span>
          ))}
          {extraCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(244,162,97,0.06)", border: "1px solid rgba(244,162,97,0.15)", color: "rgba(244,162,97,0.6)" }}
            >
              +{extraCount} more
            </span>
          )}
        </div>

        <p
          className="font-semibold mb-0.5"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "#EFE3CE" }}
        >
          Cook without shopping.
        </p>
        <p className="text-xs mb-3" style={{ color: "rgba(239,227,206,0.45)" }}>
          {totalMatchCount} recipe{totalMatchCount !== 1 ? "s" : ""} you can make right now
        </p>

        <Link
          href="/pantry"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #C85A2F, #E8834A)",
            color: "white",
            boxShadow: "0 3px 12px rgba(200,90,47,0.35)",
          }}
        >
          ⚡ Show my matches
        </Link>
      </div>

      {/* Match recipe rows */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-0">
          {matches.map((m) => {
            const pct = m.totalIngredients > 0
              ? Math.round((m.matchedCount / m.totalIngredients) * 100)
              : 0;
            return (
              <Link
                key={m.id}
                href={`/recipes/${m.id}`}
                className="flex items-center gap-3 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                {/* Thumbnail with % badge */}
                <div className="relative shrink-0" style={{ width: 48, height: 48 }}>
                  <div className="w-full h-full rounded-lg overflow-hidden">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: "#2A1804" }}>🍳</div>
                    )}
                  </div>
                  <span
                    className="absolute bottom-0.5 right-0.5 text-xs font-bold leading-none px-1 py-0.5 rounded"
                    style={{ background: "rgba(18,10,4,0.85)", color: "#F4A261", fontSize: 8 }}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Info + progress bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate mb-0.5" style={{ color: "#EFE3CE" }}>
                    {m.title}
                  </p>
                  <p className="text-xs mb-1.5" style={{ color: "#8A6A4A" }}>
                    {m.matchedCount} of {m.totalIngredients} ingredients in pantry
                  </p>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #C85A2F, #F4A261)",
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
