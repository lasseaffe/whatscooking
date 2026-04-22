"use client";

import { useDietaryMode } from "@/lib/dietary-mode-context";
import { DIETARY_COLORS, type DietaryRestriction } from "@/lib/dietary-substitutions";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Build a subtle blended background tint from all active restriction colors */
function buildTint(restrictions: DietaryRestriction[]): string {
  if (restrictions.length === 0) return "transparent";

  if (restrictions.length === 1) {
    return hexToRgba(DIETARY_COLORS[restrictions[0]].color, 0.04);
  }

  // Multi: equal-segment gradient
  const stops = restrictions.flatMap((r, i) => {
    const color = hexToRgba(DIETARY_COLORS[r].color, 0.05);
    const start = (i / restrictions.length) * 100;
    const end = ((i + 1) / restrictions.length) * 100;
    return [`${color} ${start.toFixed(1)}%`, `${color} ${end.toFixed(1)}%`];
  });
  return `linear-gradient(160deg, ${stops.join(", ")})`;
}

/** Build the left-border gradient from all active restriction colors */
function buildBorderGradient(restrictions: DietaryRestriction[]): string {
  if (restrictions.length === 0) return "transparent";
  if (restrictions.length === 1) return DIETARY_COLORS[restrictions[0]].color;
  const stops = restrictions.map((r, i) => {
    const pct = ((i + 0.5) / restrictions.length) * 100;
    return `${DIETARY_COLORS[r].color} ${pct.toFixed(1)}%`;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

export function DietaryTint({ children }: { children: React.ReactNode }) {
  const { restrictions, active } = useDietaryMode();

  return (
    <div className="flex-1 min-w-0 flex" style={{ position: "relative" }}>
      {/* Left accent bar — gradient when multiple restrictions */}
      {active && restrictions.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: buildBorderGradient(restrictions),
            transition: "background 0.5s ease",
            zIndex: 10,
          }}
        />
      )}

      {/* Tinted content area */}
      <div
        className="flex-1 min-w-0"
        style={{
          background: active ? buildTint(restrictions) : "transparent",
          paddingLeft: active ? 4 : 0,
          transition: "background 0.5s ease, padding-left 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
