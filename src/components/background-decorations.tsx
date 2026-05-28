"use client";

import { useBgMode } from "@/lib/bg-mode-context";

export function BackgroundDecorations() {
  const { opacity } = useBgMode();

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: "url('/kitchen-pattern.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "4200px auto",
          opacity,
          transition: "opacity 0.4s ease",
        }}
      />
      {/* Palette-reactive tint — shifts colour with --wc-pal-accent when user changes palette */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: "var(--wc-pal-accent, #B07040)",
          mixBlendMode: "screen",
          opacity: 0.13,
          transition: "opacity 0.4s ease",
        }}
      />
    </>
  );
}
