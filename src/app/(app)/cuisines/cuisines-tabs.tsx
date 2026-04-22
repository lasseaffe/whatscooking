"use client";

import { useState } from "react";
import { Flag, Globe2 } from "lucide-react";

const CONTINENT_BACKGROUNDS: Record<string, string> = {
  "Europe":      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80",
  "Asia":        "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1600&q=80",
  "Middle East": "https://images.unsplash.com/photo-1579636905684-7a67d12dffd4?w=1600&q=80",
  "Americas":    "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=1600&q=80",
  "Africa":      "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1600&q=80",
};

const DEFAULT_BG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80";

interface Props {
  byCountryContent: React.ReactNode;
  byRegionContent: React.ReactNode;
  onContinentHover?: (continent: string | null) => void;
}

export function CuisinesTabs({ byCountryContent, byRegionContent, onContinentHover }: Props) {
  const [tab, setTab] = useState<"country" | "region">("country");

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-2xl w-fit"
        style={{ background: "var(--wc-bg-surface, rgba(90,50,20,0.15))", border: "1px solid var(--wc-border-subtle, rgba(90,50,20,0.2))" }}>
        <button
          onClick={() => setTab("country")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: tab === "country" ? "var(--wc-bg-elevated, rgba(176,125,86,0.18))" : "transparent",
            color: tab === "country" ? "var(--wc-pal-accent, #B07D56)" : "var(--wc-text-4, #8A6A4A)",
            boxShadow: tab === "country" ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
          }}
        >
          <Flag className="w-4 h-4" />
          By Country
        </button>
        <button
          onClick={() => setTab("region")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: tab === "region" ? "var(--wc-bg-elevated, rgba(176,125,86,0.18))" : "transparent",
            color: tab === "region" ? "var(--wc-pal-accent, #B07D56)" : "var(--wc-text-4, #8A6A4A)",
            boxShadow: tab === "region" ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
          }}
        >
          <Globe2 className="w-4 h-4" />
          By Flavour Region
        </button>
      </div>

      {tab === "country" ? byCountryContent : byRegionContent}
    </div>
  );
}

export { CONTINENT_BACKGROUNDS, DEFAULT_BG };
