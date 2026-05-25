"use client";

import { useEffect, useState } from "react";
import { moodboard } from "../moodboard.config";
import { readCssVar, resolveToHex } from "../lib/readCssVar";
import { SectionShell, CARD_STYLE } from "./SectionShell";

type Resolved = { hex: string | null; raw: string | null };

export function ColorPalette() {
  const [resolved, setResolved] = useState<Record<string, Resolved>>({});
  // Re-read whenever palette or theme attributes change.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setTick((n) => n + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "data-theme"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const next: Record<string, Resolved> = {};
    for (const t of moodboard.colors) {
      next[t.cssVar] = { hex: resolveToHex(t.cssVar), raw: readCssVar(t.cssVar) };
    }
    setResolved(next);
  }, [tick]);

  const groups: Array<{ key: "semantic" | "wc" | "palette"; label: string }> = [
    { key: "semantic", label: "Semantic tokens (live from globals.css)" },
    { key: "wc", label: "WC namespace tokens" },
  ];

  return (
    <SectionShell
      id="color"
      number="02"
      title="Color"
      lede="Swatches read live from globals.css. Switch the palette in Patterns & Modes — these will repaint."
    >
      {groups.map((g) => (
        <div key={g.key} className="mb-6">
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>{g.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {moodboard.colors.filter((c) => c.group === g.key).map((t) => {
              const r = resolved[t.cssVar];
              return (
                <div key={t.cssVar} className="flex gap-3 items-stretch overflow-hidden" style={CARD_STYLE}>
                  <div className="w-20 shrink-0" style={{ background: `var(${t.cssVar})` }} />
                  <div className="p-3 flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: "var(--fg-primary)" }}>{t.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>{t.cssVar}</p>
                    <p className="text-[11px]" style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>{r?.hex ?? r?.raw ?? "…"}</p>
                    <p className="text-[11px] mt-1 italic" style={{ color: "var(--fg-tertiary)" }}>{t.usage}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </SectionShell>
  );
}
