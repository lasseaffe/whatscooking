"use client";

import { ChefHat } from "lucide-react";

export default function WelcomeStep() {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center gap-6"
      style={{ background: "rgba(26,16,8,0.7)", border: "1px solid rgba(58,36,22,0.5)" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}
      >
        <ChefHat style={{ width: 40, height: 40, color: "var(--wc-pal-accent, #B07D56)" }} />
      </div>
      <div>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Welcome to What&apos;s Cooking
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#9A7A5A" }}>
          Your AI-powered kitchen companion — from discovering new recipes to planning your whole week.
          This tour takes about two minutes and shows you everything the app can do.
        </p>
      </div>
    </div>
  );
}
