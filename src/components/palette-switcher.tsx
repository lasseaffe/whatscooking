"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";

const PALETTES = [
  // ── Original five ──────────────────────────────────────────────
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
  // ── New palettes ───────────────────────────────────────────────
  {
    id: "burgundy-wine",
    name: "Burgundy & Wine",
    desc: "Moody deep claret kitchen",
    swatches: ["#1A0808", "#6B1825", "#9A4060", "#C83050", "#FEF0F2"],
  },
  {
    id: "sage-herbaceous",
    name: "Sage & Herbaceous",
    desc: "Garden-to-table fresh greens",
    swatches: ["#101408", "#2D4A3E", "#5A8060", "#7AC870", "#EFF8ED"],
  },
  {
    id: "charcoal-terracotta",
    name: "Charcoal + Terracotta",
    desc: "Photographer's choice — food pops",
    swatches: ["#14110F", "#282018", "#7A5040", "#C86040", "#F5EDE8"],
  },
  {
    id: "teal-saffron",
    name: "Teal & Saffron",
    desc: "High-contrast modern hybrid",
    swatches: ["#0A1A1A", "#1A4747", "#306868", "#E8A820", "#FDF8E8"],
  },
  {
    id: "copper-skillet",
    name: "The Copper Skillet",
    desc: "Navy & copper — like French cookware",
    swatches: ["#0E1828", "#1E3048", "#7A5840", "#C87840", "#F8F0E8"],
  },
  {
    id: "nordic-kitchen",
    name: "Nordic Kitchen",
    desc: "Cool slate — minimal & functional",
    swatches: ["#141820", "#2A3848", "#6080A0", "#88B8D8", "#F0F4FC"],
  },
  {
    id: "umami-midnight",
    name: "Umami Midnight",
    desc: "Luxury dark — espresso & gold",
    swatches: ["#0E0C08", "#2A2418", "#6A6030", "#C8A840", "#F4F0E0"],
  },
  {
    id: "matcha-milk",
    name: "Matcha & Milk",
    desc: "Japanese minimalist — soft & clean",
    swatches: ["#0C1008", "#2A3820", "#6A8860", "#A8C890", "#F2F8EE"],
  },
  {
    id: "smoked-paprika",
    name: "Smoked Paprika",
    desc: "Bold Spanish kitchen — heat & char",
    swatches: ["#180808", "#4A1010", "#884030", "#E06040", "#FBF0EB"],
  },
  {
    id: "lavender-honey",
    name: "Lavender Honey",
    desc: "Provençal French — purple & gold",
    swatches: ["#180818", "#3A2848", "#8870A8", "#D0A840", "#FBF4FF"],
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
