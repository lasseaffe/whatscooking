"use client";

import { useEffect, useState } from "react";
import { moodboard } from "../moodboard.config";
import { PaletteSwitcher } from "@/components/palette-switcher";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function PatternsAndModes() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
    setTheme(t === "light" ? "light" : "dark");
  }, []);
  function setT(next: "dark" | "light") {
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  return (
    <SectionShell
      id="modes"
      number="06"
      title="Patterns & Modes"
      lede="Switch palette or theme right here. Color & Component sections above will repaint in response."
    >
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Theme</h3>
          <div className="flex gap-2">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setT(t)}
                className="text-[12px] uppercase tracking-[0.2em] px-3 py-1.5"
                style={{
                  background: theme === t ? "var(--wc-pal-accent, #B07D56)" : "transparent",
                  color: theme === t ? "#1A1208" : "var(--fg-secondary)",
                  border: "1px solid var(--wc-border-default)",
                  borderRadius: "0.5rem",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Palette personality</h3>
          <PaletteSwitcher compact />
          <p className="text-[11px] mt-3 italic" style={{ color: "var(--fg-tertiary)" }}>
            Sets <code style={{ fontFamily: "var(--font-mono)" }}>data-palette</code> on the root element. Persists in localStorage.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {moodboard.modes.map((m) => (
          <div key={m.name} className="p-4" style={CARD_STYLE}>
            <h4 className="text-[13px] font-semibold mb-1" style={{ color: "var(--fg-primary)" }}>{m.name}</h4>
            <code className="text-[11px] block mb-2" style={{ color: "var(--wc-pal-accent, #B07D56)", fontFamily: "var(--font-mono)" }}>{m.cssTrigger}</code>
            <p className="text-[12px] italic" style={{ color: "var(--fg-tertiary)" }}>{m.intent}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
