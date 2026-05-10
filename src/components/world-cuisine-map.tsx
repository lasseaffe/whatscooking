"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type { CuisineInfo } from "@/lib/cuisines";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Lon/lat coordinates for each cuisine country
const COUNTRY_COORDS: Record<string, [number, number]> = {
  FR: [2.35,   48.85],   // France
  IT: [12.49,  41.90],   // Italy
  ES: [-3.70,  40.42],   // Spain
  PT: [-8.22,  39.40],   // Portugal
  GR: [23.73,  37.98],   // Greece
  MX: [-99.13, 19.43],   // Mexico
  TX: [-97.50, 31.00],   // Tex-Mex (Texas)
  JP: [139.69, 35.68],   // Japan
  VN: [105.85, 21.03],   // Vietnam
  CN: [104.19, 35.86],   // China
  KR: [127.77, 35.91],   // Korea
  TH: [100.99, 15.87],   // Thailand
  IN: [78.96,  20.59],   // India
  MA: [-7.09,  31.79],   // Morocco
  TN: [9.54,   33.89],   // Tunisia
  LB: [35.50,  33.89],   // Lebanon
  EG: [30.80,  26.82],   // Egypt
  NG: [8.67,   9.08],    // Nigeria
  GH: [-1.02,  7.95],    // Ghana
  ET: [40.49,  9.15],    // Ethiopia
  SN: [-14.45, 14.45],   // Senegal
  ZA: [25.08, -29.00],   // South Africa
  KE: [37.90,   0.02],   // Kenya
  CI: [-5.55,   7.54],   // Côte d'Ivoire
};

interface Props {
  cuisines: CuisineInfo[];
  countMap: Record<string, number>;
  onCountryClick: (cuisine: CuisineInfo) => void;
}

export function WorldCuisineMap({ cuisines, countMap, onCountryClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const glowingCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of cuisines) {
      const total = c.dbValues.reduce((s, v) => s + (countMap[v.toLowerCase()] ?? 0), 0);
      if (total >= 3) set.add(c.flag);
    }
    return set;
  }, [cuisines, countMap]);

  function getCount(c: CuisineInfo) {
    return c.dbValues.reduce((s, v) => s + (countMap[v.toLowerCase()] ?? 0), 0);
  }

  return (
    <div className="world-map-wrap">
      <ComposableMap
        projectionConfig={{ scale: 147, center: [15, 5] }}
        style={{ width: "100%", height: "auto", display: "block", background: "#0d1824" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e2d20"
                stroke="#0d1824"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover:   { outline: "none", fill: "#243027" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Lat/lon grid lines */}
        <defs>
          <filter id="saffron-glow-rsm" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#F4A900" floodOpacity="0.85" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft-glow-rsm" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#ffffff" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Interactive cuisine pins */}
        {cuisines.map((cuisine) => {
          const coords = COUNTRY_COORDS[cuisine.flag];
          if (!coords) return null;
          const isGlowing = glowingCountries.has(cuisine.flag);
          const isHovered = hovered === cuisine.slug;
          const count = getCount(cuisine);

          return (
            <Marker
              key={cuisine.slug}
              coordinates={coords}
              onClick={() => onCountryClick(cuisine)}
              onMouseEnter={() => setHovered(cuisine.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <g style={{ cursor: "pointer" }} role="button" aria-label={`${cuisine.name}: ${count} recipes`}>
                {/* Pulsing outer ring */}
                {isGlowing && (
                  <circle
                    r={14}
                    fill="none"
                    stroke="#F4A900"
                    strokeWidth="1.5"
                    opacity={isHovered ? 0.9 : 0.5}
                    className="map-pulse-ring"
                  />
                )}

                {/* Hover ring */}
                {isHovered && (
                  <circle
                    r={18}
                    fill="none"
                    stroke={isGlowing ? "#F4A900" : "#ffffff"}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                )}

                {/* Main dot */}
                <circle
                  r={isHovered ? 9 : 7}
                  fill={isGlowing ? "#F4A900" : "rgba(255,255,255,0.55)"}
                  filter={isGlowing ? "url(#saffron-glow-rsm)" : isHovered ? "url(#soft-glow-rsm)" : undefined}
                  style={{ transition: "r 0.15s ease" }}
                />

                {/* Inner dot */}
                <circle
                  r={3}
                  fill={isGlowing ? "#fff" : "rgba(255,255,255,0.9)"}
                  opacity={0.9}
                />

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={-38} y={-34}
                      width={76} height={22}
                      rx={4}
                      fill="rgba(10,8,5,0.92)"
                      stroke={isGlowing ? "rgba(244,169,0,0.55)" : "rgba(255,255,255,0.18)"}
                      strokeWidth="1"
                    />
                    <text
                      x={0} y={-19}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >
                      {cuisine.name}
                      {count > 0 ? ` · ${count}` : ""}
                    </text>
                  </g>
                )}
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Legend row */}
      <div className="world-map-legend">
        <div className="world-map-legend-item">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="#F4A900" filter="url(#saffron-glow-rsm)" />
            <circle cx="8" cy="8" r="2.5" fill="#fff" opacity="0.9" />
          </svg>
          <span>3+ recipes</span>
        </div>
        <div className="world-map-legend-item">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="5.5" fill="rgba(255,255,255,0.45)" />
            <circle cx="8" cy="8" r="2" fill="rgba(255,255,255,0.8)" />
          </svg>
          <span>fewer recipes</span>
        </div>
      </div>

      <p className="world-map-hint">Click any dot to open its passport</p>

      <style>{`
        .world-map-wrap {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          background: #0d1824;
        }

        .world-map-legend {
          display: flex;
          gap: 20px;
          padding: 8px 16px 4px;
        }

        .world-map-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.45);
          font-family: system-ui, sans-serif;
        }

        .world-map-hint {
          text-align: center;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.3);
          padding: 2px 0 10px;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.04em;
        }

        @keyframes pulse-ring {
          0%   { r: 11; opacity: 0.6; }
          70%  { r: 18; opacity: 0; }
          100% { r: 11; opacity: 0; }
        }
        .map-pulse-ring {
          animation: pulse-ring 2.4s ease-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
