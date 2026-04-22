"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";

const PALETTES = [
  {
    id: "cast-iron",
    name: "Cast Iron & Thyme",
    desc: "Moody dark kitchen",
    swatches: ["#1A1208", "#5F3E2D", "#828E6F", "#B07D56", "#F3F1ED"],
  },
  {
    id: "copper-clove",
    name: "Copper & Clove",
    desc: "Warm amber spice",
    swatches: ["#160E08", "#7A4A20", "#A89060", "#C8782A", "#FDF5E8"],
  },
  {
    id: "heirloom-orchard",
    name: "Heirloom Orchard",
    desc: "Sophisticated warm tones",
    swatches: ["#1A1210", "#6B4A38", "#A6B08E", "#B07D56", "#F3F1ED"],
  },
  {
    id: "sage-stone",
    name: "Sage & Stone",
    desc: "Cool earthy greens",
    swatches: ["#121810", "#4A6040", "#7A9A6A", "#A6B08E", "#F0F4EC"],
  },
  {
    id: "midnight-pantry",
    name: "Midnight Pantry",
    desc: "Deep cool blues",
    swatches: ["#0A0E14", "#2A3A50", "#5A8AB0", "#8AA0B8", "#EEF2F8"],
  },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

const STORAGE_KEY = "wc-palette";
const DEFAULT_PALETTE: PaletteId = "cast-iron";

export function usePalette() {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as PaletteId | null) ?? DEFAULT_PALETTE;
    setPaletteState(saved);
    document.documentElement.setAttribute("data-palette", saved);
  }, []);

  function setPalette(id: PaletteId) {
    setPaletteState(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.setAttribute("data-palette", id);
  }

  return { palette, setPalette };
}

export function PaletteSwitcher({ compact = false }: { compact?: boolean }) {
  const { palette, setPalette } = usePalette();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPalette(p.id)}
            title={p.name}
            className="relative w-8 h-8 rounded-full overflow-hidden transition-all hover:scale-110"
            style={{
              border: palette === p.id ? "2px solid var(--wc-pal-accent)" : "2px solid transparent",
              boxShadow: palette === p.id ? "0 0 0 1px color-mix(in srgb, var(--wc-pal-accent) 40%, transparent)" : "none",
            }}
          >
            <div className="w-full h-full grid grid-cols-2">
              <div style={{ background: p.swatches[0] }} />
              <div style={{ background: p.swatches[2] }} />
              <div style={{ background: p.swatches[3] }} />
              <div style={{ background: p.swatches[4] }} />
            </div>
            {palette === p.id && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4" style={{ color: "var(--wc-pal-accent)" }} />
        <h3 className="text-sm font-bold" style={{ color: "var(--wc-text)" }}>Color Palette</h3>
      </div>
      <div className="flex flex-col gap-2">
        {PALETTES.map((p) => {
          const active = palette === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPalette(p.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.01]"
              style={{
                background: active ? "var(--wc-bg-hover)" : "var(--wc-bg-card)",
                border: `1px solid ${active ? "var(--wc-pal-accent)" : "var(--wc-border-default)"}`,
              }}
            >
              {/* Swatch preview */}
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 grid grid-cols-2 gap-px" style={{ padding: "1px", background: "var(--wc-border-default)" }}>
                {p.swatches.slice(0, 4).map((color, i) => (
                  <div key={i} style={{ background: color, borderRadius: "2px" }} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: active ? "var(--wc-text)" : "var(--wc-text-3)" }}>
                  {p.name}
                </div>
                <div className="text-xs" style={{ color: active ? "var(--wc-text-3)" : "var(--wc-text-4)" }}>
                  {p.desc}
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: active ? "var(--wc-pal-accent)" : "var(--wc-bg-elevated)",
                  border: `1px solid ${active ? "var(--wc-pal-accent)" : "var(--wc-border-default)"}`,
                }}
              >
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Drop this once in your app root to apply persisted palette on hydration */
export function PaletteInitializer() {
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as PaletteId | null) ?? DEFAULT_PALETTE;
    document.documentElement.setAttribute("data-palette", saved);
  }, []);
  return null;
}
