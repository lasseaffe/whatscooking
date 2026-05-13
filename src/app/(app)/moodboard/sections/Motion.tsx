"use client";

import { useState } from "react";
import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function Motion() {
  const [hoverKey, setHoverKey] = useState(0);
  return (
    <SectionShell id="motion" number="10" title="Motion" lede={moodboard.motion.intent}>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Recipe card hover</h3>
          <button
            onClick={() => setHoverKey((k) => k + 1)}
            className="text-[11px] uppercase tracking-[0.2em] px-3 py-1 mb-3"
            style={{ background: "transparent", color: "var(--fg-primary)", border: "1px solid var(--wc-border-default)", borderRadius: "0.5rem" }}
          >
            Replay
          </button>
          <div
            key={hoverKey}
            style={{
              background: "var(--wc-bg-elevated, #1f1f1e)",
              border: "1px solid var(--wc-border-default)",
              borderRadius: "0.75rem",
              padding: 16,
              animation: "wc-card-lift 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
          >
            <p style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, color: "var(--fg-primary)" }}>
              Slow-Roasted Lamb Shoulder
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>cubic-bezier(0.34, 1.56, 0.64, 1)</p>
          </div>
          <style>{`@keyframes wc-card-lift { 0% { opacity: 0; transform: translateY(10px) scale(0.99); } 100% { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        </div>

        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Loading shimmer</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 14,
                  width: `${100 - i * 12}%`,
                  background: "linear-gradient(90deg, var(--wc-bg-elevated) 0%, var(--wc-bg-hover) 50%, var(--wc-bg-elevated) 100%)",
                  backgroundSize: "200% 100%",
                  animation: "wc-shimmer 1.4s linear infinite",
                  borderRadius: "0.25rem",
                }}
              />
            ))}
          </div>
          <style>{`@keyframes wc-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      </div>

      <div className="p-5" style={CARD_STYLE}>
        <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Named animations & easings</h3>
        <ul className="space-y-2">
          {moodboard.motion.namedAnimations.map((a) => (
            <li key={a.name} className="flex items-baseline gap-3 text-[13px]" style={{ color: "var(--fg-primary)" }}>
              <code style={{ color: "var(--wc-pal-accent, #B07D56)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{a.name}</code>
              <span style={{ color: "var(--fg-tertiary)" }}>· {a.duration} — {a.note}</span>
            </li>
          ))}
        </ul>
        <hr className="my-3" style={{ border: "none", borderTop: "1px solid var(--wc-border-default)" }} />
        <ul className="space-y-2">
          {moodboard.motion.easings.map((e) => (
            <li key={e.name} className="text-[13px]" style={{ color: "var(--fg-primary)" }}>
              <strong>{e.name}</strong> · <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--wc-pal-accent, #B07D56)" }}>{e.value}</code> — <span style={{ color: "var(--fg-tertiary)", fontStyle: "italic" }}>{e.note}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] italic mt-3" style={{ color: "var(--fg-tertiary)" }}>{moodboard.motion.reducedMotion}</p>
      </div>
    </SectionShell>
  );
}
