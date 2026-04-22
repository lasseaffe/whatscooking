"use client";

/**
 * DietaryFiltersPanel
 * -------------------
 * A self-contained modal panel for managing dietary restrictions.
 *
 * Features:
 *   - Checkbox list for all standard restrictions + Low-Carb, Keto, Paleo
 *   - Free-text "Avoid ingredient" field
 *   - "Adapt Recipes" CTA button (appears when any restriction is active)
 *   - Active badge count passed back to parent via onActiveCount
 *   - Accessible: focus trap, Escape key closes, click-outside closes
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { X, Leaf, Plus, Check, ShieldAlert, RefreshCw, Filter } from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { DIETARY_LABELS, DIETARY_COLORS, type DietaryRestriction } from "@/lib/dietary-substitutions";
import { FlipButton } from "@/components/ui/flip-button";
import { useRouter } from "next/navigation";

/* ── Extra restrictions beyond the core set ─────────────────────── */
type ExtendedRestriction = DietaryRestriction | "low-carb" | "keto" | "paleo";

const EXTENDED_LABELS: Record<ExtendedRestriction, string> = {
  ...DIETARY_LABELS,
  "low-carb": "Low-Carb",
  "keto":     "Keto",
  "paleo":    "Paleo",
};

/** Colour for extended (non-core) restrictions */
const EXTRA_COLOR = "#C08F68"; // warm toffee

const ALL_RESTRICTIONS: ExtendedRestriction[] = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "egg-free",
  "halal",
  "kosher",
  "low-carb",
  "keto",
  "paleo",
];

const EXTRA_RESTRICTIONS: ExtendedRestriction[] = ["low-carb", "keto", "paleo"];

/* ── Storage key for extended restrictions ──────────────────────── */
const EXTRA_KEY = "wc_extra_restrictions_v1";

/* ─────────────────────────────────────────────────────────────────── */

interface Props {
  /** Called when panel is closed */
  onClose: () => void;
}

export function DietaryFiltersPanel({ onClose }: Props) {
  const router = useRouter();
  const {
    restrictions,
    customAvoid,
    filterMode,
    setFilterMode,
    toggleRestriction,
    clearRestrictions,
    addCustomAvoid,
    removeCustomAvoid,
    active,
  } = useDietaryMode();

  /* Extended restrictions live only in localStorage + local state */
  const [extraActive, setExtraActive] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(EXTRA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleExtra = useCallback((r: string) => {
    setExtraActive((prev) => {
      const next = prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r];
      try { localStorage.setItem(EXTRA_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const [customInput, setCustomInput] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  /* Close on Escape */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /* Focus first interactive element on mount */
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  /* Click-outside to close */
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Use pointer capture so the click on the backdrop triggers close
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [onClose]);

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    const v = customInput.trim().toLowerCase();
    if (v) { addCustomAvoid(v); setCustomInput(""); }
    customInputRef.current?.focus();
  }

  function handleAdaptRecipes() {
    onClose();
    // Navigate to discover with dietary filters applied
    router.push("/discover");
  }

  /* Total active count for badge */
  const totalActive = restrictions.length + extraActive.length + customAvoid.length;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dietary Filters"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(18,10,4,0.6)", backdropFilter: "blur(6px)" }}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl"
        style={{
          background: "var(--wc-bg-card, #3A2618)",
          border: "1px solid var(--wc-border-default, #5A3A28)",
          animation: "wc-diet-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <style>{`
          @keyframes wc-diet-in {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{
            background: "var(--wc-bg-card, #3A2618)",
            borderBottom: "1px solid var(--wc-border-subtle, #4A3020)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 34,
                height: 34,
                background: active
                  ? "color-mix(in srgb, var(--wc-pal-accent,#C08F68) 18%, transparent)"
                  : "var(--wc-bg-hover, rgba(42,24,8,0.6))",
              }}
            >
              <Leaf
                style={{
                  width: 16,
                  height: 16,
                  color: active ? "var(--wc-pal-accent,#C08F68)" : "var(--wc-text-4,#7A5A40)",
                }}
              />
            </div>
            <div>
              <h2
                className="text-sm font-bold leading-tight"
                style={{ color: "var(--wc-text,#F7F5F0)", fontFamily: "'Libre Baskerville',Georgia,serif" }}
              >
                Dietary Filters
              </h2>
              {totalActive > 0 && (
                <p className="text-xs" style={{ color: "var(--wc-pal-accent,#C08F68)" }}>
                  {totalActive} active restriction{totalActive !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {active && (
              <button
                onClick={clearRestrictions}
                className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                style={{
                  background: "color-mix(in srgb, var(--wc-pal-accent,#C08F68) 15%, transparent)",
                  color: "var(--wc-pal-accent,#C08F68)",
                  border: "1px solid color-mix(in srgb, var(--wc-pal-accent,#C08F68) 30%, transparent)",
                }}
              >
                Clear all
              </button>
            )}
            <button
              ref={firstFocusRef}
              onClick={onClose}
              className="flex items-center justify-center rounded-xl transition-all hover:opacity-80"
              style={{
                width: 32,
                height: 32,
                background: "var(--wc-bg-hover, rgba(42,24,8,0.5))",
                color: "var(--wc-text-3,#9A7A58)",
              }}
              aria-label="Close dietary filters"
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-4 flex flex-col gap-5">

          {/* ── Mode switch ── */}
          <div className="flex flex-col gap-3">
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--wc-text-4,#7A5A40)" }}
            >
              Mode
            </p>
            <div className="flex gap-2">
              <FlipButton
                frontText="Adapt Meals"
                backText="Switch →"
                from="bottom"
                onClick={() => setFilterMode("adapt")}
                className="flex-1 h-9"
                frontClassName={
                  filterMode === "adapt"
                    ? "text-xs font-semibold !bg-[#C08F68] !text-white"
                    : "text-xs font-semibold !bg-[rgba(42,24,8,0.7)] !text-[#9A7A58] border border-[#4A3020]"
                }
                backClassName="text-xs font-semibold !bg-[#C08F68] !text-white"
              />
              <FlipButton
                frontText="Filter Meals"
                backText="Switch →"
                from="bottom"
                onClick={() => setFilterMode("filter")}
                className="flex-1 h-9"
                frontClassName={
                  filterMode === "filter"
                    ? "text-xs font-semibold !bg-[#C08F68] !text-white"
                    : "text-xs font-semibold !bg-[rgba(42,24,8,0.7)] !text-[#9A7A58] border border-[#4A3020]"
                }
                backClassName="text-xs font-semibold !bg-[#C08F68] !text-white"
              />
            </div>

            {/* ── Explainer cards ── */}
            <div className="grid grid-cols-1 gap-2">
              {/* Adapt Meals card */}
              <div
                className="rounded-xl p-3.5 flex gap-3"
                style={{
                  background: filterMode === "adapt"
                    ? "color-mix(in srgb, #C08F68 12%, var(--wc-bg-base,#2A1E10))"
                    : "var(--wc-bg-hover,rgba(42,24,8,0.5))",
                  border: `1px solid ${filterMode === "adapt" ? "#C08F6860" : "var(--wc-border-subtle,#4A3020)"}`,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center rounded-full"
                  style={{ width: 28, height: 28, background: "#C08F6825", border: "1px solid #C08F6850" }}
                >
                  <RefreshCw style={{ width: 13, height: 13, color: "#C08F68" }} />
                </div>
                <div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: filterMode === "adapt" ? "#C08F68" : "var(--wc-text-3,#9A7A58)" }}>
                    Adapt Meals
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--wc-text-4,#7A5A40)" }}>
                    All recipes stay visible — forbidden ingredients are automatically swapped when you open a recipe.
                  </p>
                </div>
              </div>

              {/* Filter Meals card */}
              <div
                className="rounded-xl p-3.5 flex gap-3"
                style={{
                  background: filterMode === "filter"
                    ? "color-mix(in srgb, #C08F68 12%, var(--wc-bg-base,#2A1E10))"
                    : "var(--wc-bg-hover,rgba(42,24,8,0.5))",
                  border: `1px solid ${filterMode === "filter" ? "#C08F6860" : "var(--wc-border-subtle,#4A3020)"}`,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center rounded-full"
                  style={{ width: 28, height: 28, background: "#C08F6825", border: "1px solid #C08F6850" }}
                >
                  <Filter style={{ width: 13, height: 13, color: "#C08F68" }} />
                </div>
                <div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: filterMode === "filter" ? "#C08F68" : "var(--wc-text-3,#9A7A58)" }}>
                    Filter Meals
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--wc-text-4,#7A5A40)" }}>
                    Recipes with forbidden ingredients are hidden entirely — only dishes that naturally match your diet are shown.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Standard restriction checkboxes ── */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--wc-text-4,#7A5A40)" }}
            >
              Standard Restrictions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DIETARY_LABELS) as DietaryRestriction[]).map((r) => {
                const cfg = DIETARY_COLORS[r];
                const isOn = restrictions.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRestriction(r)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90"
                    style={{
                      background: isOn
                        ? `color-mix(in srgb, ${cfg.color} 14%, var(--wc-bg-card,#3A2618))`
                        : "var(--wc-bg-hover, rgba(42,24,8,0.5))",
                      border: `1px solid ${isOn ? cfg.color + "60" : "var(--wc-border-subtle,#4A3020)"}`,
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="shrink-0 flex items-center justify-center rounded"
                      style={{
                        width: 18,
                        height: 18,
                        background: isOn ? cfg.color : "var(--wc-bg-base,#2A1E10)",
                        border: `1.5px solid ${isOn ? cfg.color : "var(--wc-border-default,#5A3A28)"}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isOn && <Check style={{ width: 11, height: 11, color: "#fff" }} />}
                    </div>
                    <span
                      className="text-xs font-semibold leading-tight"
                      style={{ color: isOn ? cfg.color : "var(--wc-text-3,#9A7A58)" }}
                    >
                      {DIETARY_LABELS[r]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Extended restrictions: Low-Carb, Keto, Paleo ── */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--wc-text-4,#7A5A40)" }}
            >
              Lifestyle Diets
            </p>
            <div className="grid grid-cols-3 gap-2">
              {EXTRA_RESTRICTIONS.map((r) => {
                const isOn = extraActive.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleExtra(r)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90"
                    style={{
                      background: isOn
                        ? `color-mix(in srgb, ${EXTRA_COLOR} 14%, var(--wc-bg-card,#3A2618))`
                        : "var(--wc-bg-hover, rgba(42,24,8,0.5))",
                      border: `1px solid ${isOn ? EXTRA_COLOR + "60" : "var(--wc-border-subtle,#4A3020)"}`,
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded"
                      style={{
                        width: 16,
                        height: 16,
                        background: isOn ? EXTRA_COLOR : "var(--wc-bg-base,#2A1E10)",
                        border: `1.5px solid ${isOn ? EXTRA_COLOR : "var(--wc-border-default,#5A3A28)"}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isOn && <Check style={{ width: 10, height: 10, color: "#fff" }} />}
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isOn ? EXTRA_COLOR : "var(--wc-text-3,#9A7A58)" }}
                    >
                      {EXTENDED_LABELS[r]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom "avoid ingredient" ── */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--wc-text-4,#7A5A40)" }}
            >
              Avoid Ingredients
            </p>

            {/* Active custom avoids */}
            {customAvoid.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {customAvoid.map((term) => (
                  <div
                    key={term}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "color-mix(in srgb, var(--wc-pal-accent,#C08F68) 12%, var(--wc-bg-card,#3A2618))",
                      border: "1px solid color-mix(in srgb, var(--wc-pal-accent,#C08F68) 35%, transparent)",
                      color: "var(--wc-pal-accent,#C08F68)",
                    }}
                  >
                    <ShieldAlert style={{ width: 10, height: 10, flexShrink: 0 }} />
                    No {term}
                    <button
                      onClick={() => removeCustomAvoid(term)}
                      className="shrink-0 rounded-full flex items-center justify-center hover:opacity-70"
                      style={{ width: 14, height: 14 }}
                      aria-label={`Remove no ${term}`}
                    >
                      <X style={{ width: 8, height: 8 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                ref={customInputRef}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. peanuts, shellfish, soy…"
                className="flex-1 min-w-0 text-xs px-3 py-2.5 rounded-xl outline-none border transition-all"
                style={{
                  background: "var(--wc-bg-base,#2A1E10)",
                  borderColor: "var(--wc-border-default,#5A3A28)",
                  color: "var(--wc-text,#F7F5F0)",
                }}
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="shrink-0 flex items-center justify-center rounded-xl transition-all disabled:opacity-30"
                style={{
                  width: 38,
                  height: 38,
                  background: "var(--wc-bg-hover, rgba(42,24,8,0.7))",
                  border: "1px solid var(--wc-border-default,#5A3A28)",
                }}
                aria-label="Add avoid ingredient"
              >
                <Plus style={{ width: 15, height: 15, color: "var(--wc-pal-accent,#C08F68)" }} />
              </button>
            </form>
          </div>

          {/* ── Adapt Recipes CTA — only shown when restrictions are active ── */}
          {totalActive > 0 && (
            <div className="pt-1">
              {/* Decorative rule above CTA */}
              <div
                className="mb-4"
                style={{
                  height: 1,
                  background:
                    "linear-gradient(to right, transparent, var(--wc-border-default,#5A3A28), transparent)",
                }}
              />
              <button
                onClick={handleAdaptRecipes}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--wc-pal-accent,#C08F68), var(--wc-pal-mid,#6E4E3A))",
                  color: "#fff",
                  boxShadow:
                    "0 8px 28px color-mix(in srgb, var(--wc-pal-accent,#C08F68) 35%, transparent), 0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                <Leaf style={{ width: 16, height: 16 }} />
                Adapt Recipes
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  {totalActive} active
                </span>
              </button>
              <p
                className="text-center text-xs mt-2"
                style={{ color: "var(--wc-text-4,#7A5A40)" }}
              >
                Filters apply immediately across all recipe views
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
