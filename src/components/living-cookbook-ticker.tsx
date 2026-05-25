"use client";

import { useState, useEffect } from "react";

const TIPS: { text: string; author: string }[] = [
  { text: "Salt your pasta water generously — it should taste like the sea.", author: "Marco R." },
  { text: "Let your meat rest for at least 5 minutes before cutting — keeps all the juices in.", author: "Leila K." },
  { text: "A cold pan with cold oil = no sticking. Heat both together.", author: "Tomás V." },
  { text: "Acid (lemon/vinegar) at the end of cooking brightens any dish instantly.", author: "Yuki M." },
  { text: "Don't crowd the pan. Give everything space to caramelise, not steam.", author: "Sarah B." },
  { text: "Taste as you go. The best seasoning is continuous attention.", author: "Pierre D." },
  { text: "Bloom your spices in oil for 30 seconds before adding anything else.", author: "Priya N." },
  { text: "Mise en place — prep everything before you start. Cooking becomes effortless.", author: "Chef Al." },
  { text: "Deglaze the pan after searing. That fond is pure flavour.", author: "Jin H." },
  { text: "Use room-temperature eggs and butter for baking — it makes a real difference.", author: "Emma S." },
];

export function LivingCookbookTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TIPS.length);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const tip = TIPS[index];

  return (
    <div
      className="rounded-2xl px-5 py-4 mb-6 overflow-hidden relative"
      style={{ background: "rgba(58,52,48,0.55)", border: "1px solid rgba(58,36,22,0.5)", borderLeft: "3px solid var(--wc-accent-saffron, #F4A261)" }}
    >
      {/* Decorative quote mark */}
      <span className="absolute top-2 left-3 text-5xl font-serif leading-none select-none" style={{ color: "rgba(244,162,97,0.28)", lineHeight: 1 }}>"</span>

      <div
        className="transition-all duration-400 pl-4"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}
      >
        <p
          className="text-sm leading-relaxed mb-2"
          style={{
            color: "#EFE3CE",
            fontStyle: "italic",
            fontFamily: "'Libre Baskerville', Georgia, serif",
            lineHeight: "1.7",
          }}
        >
          {tip.text}
        </p>
        <p className="text-xs font-medium" style={{ color: "#828E6F" }}>
          — {tip.author}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-1 mt-3 pl-4">
        {TIPS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true); }, 300); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 16 : 6,
              height: 6,
              background: i === index ? "var(--wc-accent-saffron, #F4A261)" : "rgba(176,125,86,0.4)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
