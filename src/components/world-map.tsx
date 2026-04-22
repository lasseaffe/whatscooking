"use client";

import { useState, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { CUISINE_SLUG_TO_COUNTRY, ISO_TO_COUNTRY } from "@/lib/country-cuisine-map";
import { TIER_STYLES, type BadgeTier } from "@/lib/achievements";
import Link from "next/link";
import { Globe2, Trophy, MapPin, ChevronDown, ChevronUp } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  "250": [2.35,  48.85],
  "380": [12.49, 41.90],
  "724": [-3.70, 40.42],
  "620": [-8.22, 39.40],
  "300": [23.73, 37.98],
  "484": [-99.13, 19.43],
  "840": [-101.3, 37.09],
  "392": [139.69, 35.68],
  "704": [105.85, 21.03],
  "156": [104.19, 35.86],
  "410": [127.77, 35.91],
  "764": [100.99, 15.87],
  "356": [78.96, 20.59],
  "504": [-7.09, 31.79],
  "788": [9.54,  33.89],
  "422": [35.50, 33.89],
  "818": [30.80, 26.82],
  "566": [8.67,  9.08],   // Nigeria
  "288": [-1.02, 7.95],   // Ghana
  "231": [40.49, 9.15],   // Ethiopia
  "686": [-14.45, 14.45], // Senegal
  "710": [25.08, -29.00], // South Africa
  "404": [37.90, 0.02],   // Kenya
  "384": [-5.55, 7.54],   // Côte d'Ivoire
};

type WorldMapData = {
  pinnedCountries: { slug: string; isoNumeric: string; name: string; flag: string; cuisineSlug: string }[];
  pinnedSlugs: string[];
  totalPinned: number;
  badges: { id: string; name: string; description: string; emoji: string; tier: BadgeTier }[];
  stats: { savedCount: number; ratedCount: number; ownRecipeCount: number; publishedRecipeCount: number };
};

export function WorldMap() {
  const [data, setData] = useState<WorldMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; flag: string } | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/world-map")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const pinnedSet = new Set(data?.pinnedCountries.map(c => c.isoNumeric) ?? []);
  const totalAvail = Object.keys(CUISINE_SLUG_TO_COUNTRY).length;

  function getCountryFill(isoNum: string): string {
    if (pinnedSet.has(isoNum)) return hoveredIso === isoNum ? "#C85A2F" : "#E8834A";
    return hoveredIso === isoNum ? "#E2D4C6" : "#EDE4DA";
  }
  function getCountryStroke(isoNum: string): string {
    return pinnedSet.has(isoNum) ? "#A0401A" : "#D4C4B0";
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #FFF0E6, #FFE0C8)" }}>
            <Globe2 className="w-4 h-4" style={{ color: "#C85A2F" }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: "#3D2817" }}>Around the World</h2>
            <p className="text-xs" style={{ color: "#A69180" }}>
              {loading ? "Loading…" : `${data?.totalPinned ?? 0} / ${totalAvail} countries collected`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#E8834A" }} /><span style={{ color: "#6B5B52" }}>Cooked</span></div>
          <div className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#EDE4DA" }} /><span style={{ color: "#6B5B52" }}>Unexplored</span></div>
        </div>
      </div>

      {/* Side-by-side layout: map left, scoreboard right */}
      <div className="flex gap-4 items-start">

        {/* ── MAP (left, 58%) ── */}
        <div ref={mapContainerRef} className="relative rounded-2xl overflow-hidden border flex-[3] min-w-0"
          style={{ borderColor: "#E8D8C8", background: "linear-gradient(160deg, #D8E8F4 0%, #C8DCF0 100%)" }}>

          {tooltip && (
            <div className="absolute z-10 px-2.5 py-1 rounded-lg text-xs font-semibold pointer-events-none shadow-lg"
              style={{ left: tooltip.x + 10, top: tooltip.y, background: "#3D2817", color: "#fff", transform: "translateY(-100%)" }}>
              {tooltip.flag ? `${tooltip.flag} ` : ""}{tooltip.name}
            </div>
          )}

          <ComposableMap
            projectionConfig={{ scale: 130, center: [15, 10] }}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isoNum = String(geo.id).padStart(3, "0");
                    const countryInfo = ISO_TO_COUNTRY[isoNum];
                    const geoName: string = (geo.properties as { name?: string })?.name ?? "";
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryFill(isoNum)}
                        stroke={getCountryStroke(isoNum)}
                        strokeWidth={0.4}
                        style={{
                          default: { outline: "none" },
                          hover:   { outline: "none", cursor: "pointer" },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e: React.MouseEvent) => {
                          const name = countryInfo?.name ?? geoName;
                          const flag = countryInfo?.flag ?? "";
                          setHoveredIso(isoNum);
                          if (name && mapContainerRef.current) {
                            const rect = mapContainerRef.current.getBoundingClientRect();
                            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, name, flag });
                          }
                        }}
                        onMouseLeave={() => { setHoveredIso(null); setTooltip(null); }}
                        onMouseMove={(e: React.MouseEvent) => {
                          if (mapContainerRef.current) {
                            const rect = mapContainerRef.current.getBoundingClientRect();
                            setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
                          }
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {data?.pinnedCountries.map((c) => {
                const centroid = COUNTRY_CENTROIDS[c.isoNumeric];
                if (!centroid) return null;
                const isHovered = hoveredIso === c.isoNumeric;
                return (
                  <Marker key={c.isoNumeric} coordinates={centroid}>
                    <circle r={isHovered ? 5 : 3.5} fill={isHovered ? "#fff" : "#fff"} stroke="#C85A2F" strokeWidth={isHovered ? 2.5 : 2}
                      style={{ cursor: "pointer", transition: "r 0.12s" }}
                      onMouseEnter={() => setHoveredIso(c.isoNumeric)}
                      onMouseLeave={() => setHoveredIso(null)} />
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* ── RIGHT PANEL (42%) ── */}
        <div className="flex-[2] min-w-0 flex flex-col gap-3">

          {/* Countries collected */}
          <div className="rounded-2xl border p-4" style={{ borderColor: "#F0E8DC", background: "#fff" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#C85A2F" }} />
              <span className="font-bold text-xs" style={{ color: "#3D2817" }}>
                Collected ({data?.totalPinned ?? 0})
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0E8DC" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.round(((data?.totalPinned ?? 0) / totalAvail) * 100)}%`,
                  background: "linear-gradient(90deg, #C85A2F 0%, #E8834A 100%)",
                }} />
              </div>
            </div>

            {loading ? (
              <div className="space-y-1.5">
                {[1,2,3].map(i => <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: "#F5EDE4" }} />)}
              </div>
            ) : (data?.pinnedCountries.length ?? 0) === 0 ? (
              <p className="text-xs py-2 text-center" style={{ color: "#A69180" }}>
                Save recipes to collect pins!
              </p>
            ) : (
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                {data!.pinnedCountries.map(c => (
                  <Link key={c.isoNumeric} href={`/cuisines/${c.cuisineSlug}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all hover:scale-[1.01]"
                    style={{ background: "#FFF8F3" }}>
                    <span className="text-base shrink-0">{c.flag}</span>
                    <span className="font-medium flex-1 truncate" style={{ color: "#3D2817" }}>{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="rounded-2xl border p-4" style={{ borderColor: "#F0E8DC", background: "#fff" }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: "#C85A2F" }} />
              <span className="font-bold text-xs" style={{ color: "#3D2817" }}>
                Badges ({data?.badges.length ?? 0})
              </span>
            </div>

            {loading ? (
              <div className="space-y-1.5">
                {[1,2].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "#F5EDE4" }} />)}
              </div>
            ) : (data?.badges.length ?? 0) === 0 ? (
              <p className="text-xs py-2 text-center" style={{ color: "#A69180" }}>Cook more to earn badges!</p>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  {(showAllBadges ? data!.badges : data!.badges.slice(0, 4)).map(b => {
                    const ts = TIER_STYLES[b.tier];
                    return (
                      <div key={b.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                        style={{ background: ts.bg, border: `1px solid ${ts.border}25` }}>
                        <span className="text-base shrink-0">{b.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold truncate" style={{ color: ts.text }}>{b.name}</span>
                            <span className="text-xs px-1 rounded font-medium shrink-0"
                              style={{ background: ts.border + "20", color: ts.text, fontSize: "9px" }}>
                              {ts.label.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B5B52", fontSize: "10px" }}>{b.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(data?.badges.length ?? 0) > 4 && (
                  <button onClick={() => setShowAllBadges(v => !v)}
                    className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-xl hover:bg-amber-50 transition-colors"
                    style={{ color: "#C85A2F" }}>
                    {showAllBadges
                      ? <><ChevronUp className="w-3 h-3" /> Less</>
                      : <><ChevronDown className="w-3 h-3" /> All {data!.badges.length}</>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
