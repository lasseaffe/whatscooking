"use client";

import { useState, useCallback } from "react";

const CONTINENT_BACKGROUNDS: Record<string, string> = {
  // cuisine.region values
  "Europe":         "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80",
  "Asia":           "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1600&q=80",
  "Middle East":    "https://images.unsplash.com/photo-1579636905684-7a67d12dffd4?w=1600&q=80",
  "Americas":       "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=1600&q=80",
  "Africa":         "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1600&q=80",
  // CULINARY_REGIONS names
  "Mediterranean":  "https://images.unsplash.com/photo-1544025162-d76538497332?w=1600&q=80",
  "East Asian":     "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1600&q=80",
  "South Asian":    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&q=80",
  "Latin American": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1600&q=80",
  "Middle Eastern": "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1600&q=80",
  "African":        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=1600&q=80",
};

const DEFAULT_BG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80";

interface Props {
  children: React.ReactNode;
}

export function CuisinesPageWrapper({ children }: Props) {
  const [activeBg, setActiveBg] = useState<string>(DEFAULT_BG);
  const [fading, setFading] = useState(false);

  const setBg = useCallback((continent: string | null) => {
    const next = (continent && CONTINENT_BACKGROUNDS[continent]) ?? DEFAULT_BG;
    if (next === activeBg) return;
    setFading(true);
    setTimeout(() => {
      setActiveBg(next);
      setFading(false);
    }, 300);
  }, [activeBg]);

  return (
    <div className="relative min-h-screen">
      {/* Full-page background image */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-500"
        style={{
          backgroundImage: `url(${activeBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 0 : 1,
        }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 -z-10" style={{ background: "rgba(8,4,2,0.72)" }} />

      {/* Content — passes setBg down via data-continent attributes on hover */}
      <div
        onMouseOver={(e) => {
          const el = (e.target as HTMLElement).closest("[data-continent]");
          if (el) setBg(el.getAttribute("data-continent"));
        }}
        onMouseLeave={() => setBg(null)}
      >
        {children}
      </div>
    </div>
  );
}
