"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, Clock, Flame, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { ScrambleResult } from "@/app/api/pantry/scramble/route";
import { RecipeImage } from "@/components/recipe-image";

export function PantryScramble({ itemCount }: { itemCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrambleResult[]>([]);
  const [pantryEmpty, setPantryEmpty] = useState(false);
  const [onlyNow, setOnlyNow] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/pantry/scramble");
      const json = await res.json();
      setResults(json.results ?? []);
      setPantryEmpty(json.pantryEmpty ?? false);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && results.length === 0) load();
  }

  const visible = onlyNow
    ? results.filter((r) => r.canMakeNow)
    : results;

  const canMakeCount = results.filter((r) => r.canMakeNow).length;

  return (
    <div className="mt-6">
      {/* Toggle button */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border transition-all"
        style={{
          borderColor: open ? "#C85A2F" : "#F5E6D3",
          background: open
            ? "linear-gradient(135deg, #FFF0E6 0%, #FFE4D1 100%)"
            : "linear-gradient(135deg, #FFFBF7 0%, #FFF5ED 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#C85A2F" }}>
            <Shuffle className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm" style={{ color: "#3D2817" }}>
              What can I scramble together?
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6B5B52" }}>
              {open && canMakeCount > 0
                ? `${canMakeCount} recipe${canMakeCount === 1 ? "" : "s"} you can make right now`
                : "Find recipes from your pantry ingredients"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {open && canMakeCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#C85A2F", color: "#fff" }}>
              {canMakeCount} ready
            </span>
          )}
          <span className="text-xs font-medium" style={{ color: "#C85A2F" }}>
            {open ? "Hide ↑" : "Show ↓"}
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3" style={{ color: "#A69180" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Checking your pantry…</span>
            </div>
          ) : pantryEmpty ? (
            <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "#F5E6D3" }}>
              <p className="text-sm" style={{ color: "#6B5B52" }}>Add ingredients first to see what you can make.</p>
            </div>
          ) : (
            <>
              {/* Filter toggle */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-xs font-medium" style={{ color: "#6B5B52" }}>Show:</span>
                <div className="flex rounded-xl overflow-hidden border text-xs" style={{ borderColor: "#E8D4C0" }}>
                  <button
                    onClick={() => setOnlyNow(false)}
                    className="px-3 py-1.5 font-medium transition-colors"
                    style={{
                      background: !onlyNow ? "#C85A2F" : "#fff",
                      color: !onlyNow ? "#fff" : "#6B5B52",
                    }}
                  >
                    All recipes
                  </button>
                  <button
                    onClick={() => setOnlyNow(true)}
                    className="px-3 py-1.5 font-medium transition-colors"
                    style={{
                      background: onlyNow ? "#C85A2F" : "#fff",
                      color: onlyNow ? "#fff" : "#6B5B52",
                    }}
                  >
                    Can make now ✓
                  </button>
                </div>
                <span className="text-xs ml-auto" style={{ color: "#A69180" }}>
                  {visible.length} recipe{visible.length !== 1 ? "s" : ""}
                  {onlyNow ? " ready" : " sorted by fewest missing"}
                </span>
              </div>

              {visible.length === 0 && (
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "#F5E6D3" }}>
                  <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>
                    No recipes you can make with exactly these ingredients.
                  </p>
                  <p className="text-xs" style={{ color: "#6B5B52" }}>
                    Switch to "All recipes" to see the closest matches.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {visible.slice(0, 20).map((r) => (
                  <ScrambleCard
                    key={r.id}
                    result={r}
                    onClick={() => router.push(`/recipes/${r.id}`)}
                  />
                ))}
                {visible.length > 20 && (
                  <p className="text-center text-xs py-2" style={{ color: "#A69180" }}>
                    + {visible.length - 20} more — add more ingredients to narrow it down
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ScrambleCard({
  result,
  onClick,
}: {
  result: ScrambleResult;
  onClick: () => void;
}) {
  const pct = Math.round((result.haveCount / result.totalIngredients) * 100);
  const totalTime = (result.prep_time_minutes ?? 0) + (result.cook_time_minutes ?? 0);
  const missingCritical = result.missingIngredients.filter((m) => m.criticality > 0.5);
  const missingEasy = result.missingIngredients.filter((m) => m.criticality <= 0.5);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="cursor-pointer rounded-2xl border overflow-hidden flex gap-0 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "#F5E6D3", background: "#fff" }}
    >
      {/* Thumbnail */}
      <div className="w-24 shrink-0 relative overflow-hidden" style={{ minHeight: 96 }}>
        <RecipeImage
          recipeId={result.id}
          imageUrl={result.image_url}
          title={result.title}
          cuisine={result.cuisine_type}
          dietaryTags={result.dietary_tags}
          style={{ minHeight: 96 }}
        />
        {/* Coverage badge */}
        <div className="absolute bottom-0 inset-x-0 py-1 text-center text-xs font-bold"
          style={{
            background: result.canMakeNow ? "rgba(34,197,94,0.92)" : "rgba(200,90,47,0.85)",
            color: "#fff",
          }}>
          {result.canMakeNow ? "✓ Ready" : `${pct}%`}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-1" style={{ color: "#3D2817" }}>
            {result.title}
          </h3>
          {result.canMakeNow && (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
          )}
        </div>

        {/* Coverage bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F5E6D3" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: result.canMakeNow ? "#16a34a" : pct >= 75 ? "#C85A2F" : "#d97706",
              }} />
          </div>
          <span className="text-xs shrink-0" style={{ color: "#A69180" }}>
            {result.haveCount}/{result.totalIngredients} ingredients
          </span>
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {totalTime > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "#A69180" }}>
              <Clock className="w-3 h-3" />{totalTime}m
            </span>
          )}
          {result.calories && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "#A69180" }}>
              <Flame className="w-3 h-3" />{result.calories} cal
            </span>
          )}
          {result.cuisine_type && (
            <span className="text-xs" style={{ color: "#A69180" }}>{result.cuisine_type}</span>
          )}
        </div>

        {/* Missing ingredients */}
        {result.missingIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missingCritical.slice(0, 3).map((m) => (
              <span key={m.name}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#FEE2E2", color: "#991B1B" }}>
                <AlertCircle className="w-2.5 h-2.5" />
                {m.name}
              </span>
            ))}
            {missingEasy.slice(0, 2).map((m) => (
              <span key={m.name}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#FFF7ED", color: "#C85A2F" }}>
                ~{m.name}
              </span>
            ))}
            {result.missingIngredients.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#F5F0FF", color: "#6B5B52" }}>
                +{result.missingIngredients.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
