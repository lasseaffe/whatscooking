"use client";

import { useState } from "react";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function ComponentSamples() {
  const [val, setVal] = useState("");
  return (
    <SectionShell id="components" number="05" title="Components" lede="Live, token-driven primitives — buttons, inputs, badges, recipe-card shell.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <button style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A1208", padding: "10px 18px", borderRadius: "0.5rem", fontWeight: 600 }}>
              Open Recipe
            </button>
            <button style={{ background: "transparent", color: "var(--fg-primary)", border: "1px solid var(--wc-border-default)", padding: "10px 18px", borderRadius: "0.5rem" }}>
              Save
            </button>
            <button style={{ background: "var(--bg-accent, #1f55f1)", color: "#fff", padding: "10px 18px", borderRadius: "0.5rem", fontWeight: 600 }}>
              Plan Week
            </button>
            <button style={{ background: "var(--bg-positive, #338500)", color: "#fff", padding: "10px 18px", borderRadius: "0.5rem", fontWeight: 600 }}>
              In Pantry
            </button>
          </div>
        </div>

        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Inputs & badges</h3>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Search by ingredient…"
            className="w-full px-3 py-2 outline-none mb-3"
            style={{ background: "var(--wc-bg-input, #171716)", color: "var(--fg-primary)", border: "1px solid var(--wc-border-default)", borderRadius: "0.5rem", fontSize: 14 }}
          />
          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] px-2.5 py-1" style={{ background: "var(--wc-bg-elevated)", color: "var(--fg-secondary)", borderRadius: 9999 }}>Vegetarian</span>
            <span className="text-[11px] px-2.5 py-1" style={{ background: "var(--bg-positive-translucent, #3385003d)", color: "var(--fg-positive)", borderRadius: 9999 }}>In Pantry</span>
            <span className="text-[11px] px-2.5 py-1" style={{ background: "var(--bg-attention-translucent, #ce47003d)", color: "var(--fg-attention)", borderRadius: 9999 }}>Low stock</span>
            <span className="text-[11px] px-2.5 py-1" style={{ background: "var(--bg-special-translucent, #8e48ff3d)", color: "var(--fg-special)", borderRadius: 9999 }}>Premium</span>
          </div>
        </div>

        <div className="p-5 md:col-span-2" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Recipe card shell</h3>
          <article className="overflow-hidden" style={{ background: "var(--wc-bg-card)", border: "1px solid var(--wc-border-default)", borderRadius: "1rem", maxWidth: 360 }}>
            <div style={{ background: "linear-gradient(135deg, var(--wc-pal-accent) 0%, var(--wc-bg-elevated) 100%)", aspectRatio: "16 / 9" }} />
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Mediterranean · Main</p>
              <h4 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 22, fontWeight: 600, color: "var(--fg-primary)", letterSpacing: "-0.01em" }}>
                Slow-Roasted Lamb Shoulder
              </h4>
              <p className="mt-2 text-[13px]" style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>
                350g · 45 min · 220°C · 6 servings
              </p>
            </div>
          </article>
        </div>
      </div>
    </SectionShell>
  );
}
