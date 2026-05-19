"use client";

export function BackgroundDecorations() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage: "url('/kitchen-pattern.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
        opacity: 1,
      }}
    />
  );
}
