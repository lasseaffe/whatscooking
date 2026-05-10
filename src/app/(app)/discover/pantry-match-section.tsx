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
}

export function PantryMatchSection({ matches, totalMatchCount, pantryItemCount }: Props) {
  const heading = (
    <h2
      className="text-sm font-bold mb-3"
      style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
    >
      🧺 Cook from Pantry
    </h2>
  );

  // No pantry items: show CTA
  if (pantryItemCount === 0) {
    return (
      <div
        className="px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {heading}
        <Link
          href="/pantry"
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "rgba(244,162,97,0.06)",
            border: "1px solid rgba(244,162,97,0.18)",
          }}
        >
          <span className="text-2xl">🛒</span>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: "var(--wc-text, #EFE3CE)" }}>
              Add items to your pantry
            </p>
            <p className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
              We&apos;ll show recipes you can cook right now →
            </p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        {heading}
        <Link href="/pantry" className="text-xs font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
          My Pantry →
        </Link>
      </div>

      {/* Match count banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
        style={{
          background: "rgba(244,162,97,0.08)",
          border: "1px solid rgba(244,162,97,0.2)",
        }}
      >
        <span className="text-xl">🥦</span>
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{ color: "var(--wc-text, #EFE3CE)" }}>
            {totalMatchCount} recipe{totalMatchCount !== 1 ? "s" : ""} match your pantry
          </p>
          <p className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
            Based on {pantryItemCount} pantry item{pantryItemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/pantry"
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1C0E04" }}
        >
          View
        </Link>
      </div>

      {/* Top 2 match cards */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/recipes/${m.id}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden rounded-lg shrink-0" style={{ width: 36, height: 36 }}>
                {m.image_url ? (
                  <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: "#2A1804" }}>🍳</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--wc-text, #EFE3CE)" }}>
                  {m.title}
                </p>
                <p className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
                  {m.matchedCount} / {m.totalIngredients} ingredients
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-center py-3" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
          Add more pantry items to find recipe matches.
        </p>
      )}
    </div>
  );
}
