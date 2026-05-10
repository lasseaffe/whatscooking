"use client";

import { ShoppingBasket } from "lucide-react";
import Link from "next/link";

export default function PantryStep() {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center gap-6"
      style={{ background: "rgba(26,16,8,0.7)", border: "1px solid rgba(58,36,22,0.5)" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}
      >
        <ShoppingBasket style={{ width: 40, height: 40, color: "var(--wc-pal-accent, #B07D56)" }} />
      </div>
      <div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Your kitchen, always stocked
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#9A7A5A" }}>
          Add ingredients to your pantry and What&apos;s Cooking will surface recipes you can make right now.
          As you cook through meal plans, pantry items are automatically checked off.
          Your shopping list is generated from what you&apos;re missing.
        </p>
      </div>
      <Link
        href="/pantry"
        className="text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:opacity-80"
        style={{
          background: "rgba(176,125,86,0.15)",
          color: "var(--wc-pal-accent, #B07D56)",
          border: "1px solid rgba(176,125,86,0.3)",
        }}
      >
        Open my pantry →
      </Link>
    </div>
  );
}
