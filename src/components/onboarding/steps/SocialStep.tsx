"use client";

import { Users } from "lucide-react";
import Link from "next/link";

export default function SocialStep() {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center gap-6"
      style={{ background: "rgba(26,16,8,0.7)", border: "1px solid rgba(58,36,22,0.5)" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}
      >
        <Users style={{ width: 40, height: 40, color: "var(--wc-pal-accent, #B07D56)" }} />
      </div>
      <div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Cook together
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#9A7A5A" }}>
          Host a Dinner Party — invite guests, assign dishes, and keep everyone coordinated.
          The Household feature lets you share a pantry and meal plan with the people you live with.
          Family Guides offer curated cooking content for parents and kids to cook together.
        </p>
      </div>
      <Link
        href="/dinner-parties"
        className="text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:opacity-80"
        style={{
          background: "rgba(176,125,86,0.15)",
          color: "var(--wc-pal-accent, #B07D56)",
          border: "1px solid rgba(176,125,86,0.3)",
        }}
      >
        Plan a dinner party →
      </Link>
    </div>
  );
}
