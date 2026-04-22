"use client";

import { useState } from "react";
import { RefreshCw, X, Plus, ChevronDown } from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { DIETARY_LABELS, DIETARY_COLORS, type DietaryRestriction } from "@/lib/dietary-substitutions";

const ALL_RESTRICTIONS: DietaryRestriction[] = [
  "vegan", "vegetarian", "gluten-free", "dairy-free", "nut-free", "egg-free",
];

export function DietaryBanner() {
  const { restrictions, toggleRestriction, clearRestrictions, active } = useDietaryMode();
  const [pickerOpen, setPickerOpen] = useState(false);

  const inactive = ALL_RESTRICTIONS.filter((r) => !restrictions.includes(r));

  // ── Collapsed/inactive state — render nothing ──────────────
  if (!active && !pickerOpen) {
    return null;
  }

  // ── Active state ──────────────────────────────────────────
  return (
    <div className="sticky top-0 z-40 border-b shadow-sm" style={{ borderColor: "#E8D4BA" }}>
      {/* Colour strip */}
      <AdaptColorStrip restrictions={restrictions} />

      <div className="flex items-center gap-3 px-5 py-2.5 flex-wrap"
        style={{ background: "rgba(255,251,247,0.97)", backdropFilter: "blur(8px)" }}>

        {/* Mode label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: restrictions[0] ? DIETARY_COLORS[restrictions[0]].bg : "#F5EDE4" }}>
            <RefreshCw className="w-3 h-3" style={{ color: restrictions[0] ? DIETARY_COLORS[restrictions[0]].color : "#A69180" }} />
          </div>
          <div>
            <span className="text-xs font-bold" style={{ color: "#3D2817" }}>Adapt Meals</span>
            <span className="text-xs ml-1.5" style={{ color: "#A69180" }}>
              — all recipes shown, ingredients swapped in recipe view
            </span>
          </div>
        </div>

        {/* Active restriction chips */}
        {restrictions.map((r) => {
          const cfg = DIETARY_COLORS[r];
          return (
            <span key={r}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + "40" }}>
              <RefreshCw className="w-3 h-3 shrink-0" />
              {DIETARY_LABELS[r]}
              <button onClick={() => toggleRestriction(r)}
                className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                title={`Remove ${DIETARY_LABELS[r]}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {/* Add more */}
        {inactive.length > 0 && (
          <div className="relative">
            <button onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-90"
              style={{ background: "#F5EDE4", color: "#6B5B52", borderColor: "#E8D4BA" }}>
              <Plus className="w-3 h-3" /> Add
              <ChevronDown className="w-3 h-3 transition-transform"
                style={{ transform: pickerOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl border shadow-xl overflow-hidden"
                  style={{ background: "#FAF7F2", borderColor: "#E8D4BA", minWidth: 210 }}>
                  {inactive.map((r) => {
                    const cfg = DIETARY_COLORS[r];
                    return (
                      <button key={r}
                        onClick={() => { toggleRestriction(r); setPickerOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity border-b last:border-b-0"
                        style={{ background: cfg.bg, color: cfg.color, borderColor: "rgba(0,0,0,0.05)" }}>
                        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                        {DIETARY_LABELS[r]}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <button onClick={clearRestrictions}
          className="ml-auto text-xs font-medium px-3 py-1 rounded-full border transition-all hover:opacity-90"
          style={{ color: "#A69180", borderColor: "#E8D4BA", background: "#FAF7F2" }}>
          Turn off
        </button>
      </div>
    </div>
  );
}


// ── Colour accent strip ───────────────────────────────────────
function AdaptColorStrip({ restrictions }: { restrictions: DietaryRestriction[] }) {
  if (restrictions.length === 0) return null;
  const colors = restrictions.map((r) => DIETARY_COLORS[r].color);
  let gradient: string;
  if (colors.length === 1) {
    gradient = colors[0];
  } else {
    const stops = colors.map((c, i) => {
      const pct = (i / colors.length) * 100;
      const pct2 = ((i + 1) / colors.length) * 100;
      return `${c} ${pct}%, ${c} ${pct2}%`;
    });
    gradient = `linear-gradient(to right, ${stops.join(", ")})`;
  }
  return <div style={{ height: 3, background: gradient, transition: "background 0.5s ease" }} />;
}
