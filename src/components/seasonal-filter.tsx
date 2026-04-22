"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import { detectClimateZone, getSeasonalProduce, getSeasonLabel, type ClimateZone } from "@/lib/seasonal";

export interface SeasonalState {
  active: boolean;
  produce: string[];
  label: string; // e.g. "Oslo, Norway · winter ❄️"
}

interface Props {
  onChange: (state: SeasonalState) => void;
}

export function SeasonalFilter({ onChange }: Props) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState("");
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);
  const [climateZone, setClimateZone] = useState<ClimateZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Propagate changes up
  useEffect(() => {
    if (!active || !climateZone) {
      onChange({ active: false, produce: [], label: "" });
      return;
    }
    const produce = getSeasonalProduce(climateZone);
    const season = getSeasonLabel(climateZone);
    onChange({
      active: true,
      produce,
      label: resolvedLabel ? `${resolvedLabel} · ${season}` : season,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, climateZone, resolvedLabel]);

  function applyZone(zone: ClimateZone, label: string) {
    setClimateZone(zone);
    setResolvedLabel(label);
    setError(null);
    setLoading(false);
  }

  // Auto-detect via browser geolocation → reverse geocode
  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          if (!res.ok) throw new Error("geocode failed");
          const data = await res.json();
          const locationStr = `${data.state ?? ""} ${data.country ?? ""} ${data.country_code ?? ""}`;
          const zone = detectClimateZone(locationStr);
          const parts = [data.city, data.country].filter(Boolean);
          applyZone(zone, parts.join(", "));
          setQuery(parts.join(", "));
        } catch {
          setError("Couldn't resolve your location. Try typing it below.");
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Type your location below.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }

  // Resolve a typed location string
  async function resolveQuery(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const locationStr = `${data.state ?? ""} ${data.country ?? ""} ${data.country_code ?? ""}`;
        const zone = detectClimateZone(locationStr);
        const parts = [data.city ?? data.state, data.country].filter(Boolean);
        applyZone(zone, parts.join(", ") || data.display_name?.split(",")[0] || q);
      } else {
        // Fallback: try parsing the raw string directly
        const zone = detectClimateZone(q);
        applyZone(zone, q);
      }
    } catch {
      const zone = detectClimateZone(q);
      applyZone(zone, q);
    }
  }

  function toggle() {
    const next = !active;
    setActive(next);
    if (next && !climateZone) {
      // Auto-detect on first activation
      detectLocation();
    }
    if (!next) {
      // Reset when turning off
      setClimateZone(null);
      setResolvedLabel(null);
      setQuery("");
      setError(null);
    }
  }

  function clear() {
    setActive(false);
    setClimateZone(null);
    setResolvedLabel(null);
    setQuery("");
    setError(null);
  }

  const seasonalProduce = climateZone ? getSeasonalProduce(climateZone) : [];
  const seasonLabel = climateZone ? getSeasonLabel(climateZone) : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle chip */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
          style={{
            borderColor: active ? "#4A6830" : "#E8D4C0",
            background: active ? "#E5EDD8" : "#fff",
            color: active ? "#3D5030" : "#6B5B52",
          }}
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <span>🌱</span>}
          Seasonal
          {active && seasonLabel && (
            <span className="ml-1 text-xs font-normal opacity-75">· {seasonLabel}</span>
          )}
        </button>

        {active && (climateZone || loading) && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ background: "#F5F2EC", color: "#4A6830" }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        {active && resolvedLabel && (
          <span className="text-xs flex items-center gap-1" style={{ color: "#4A6830" }}>
            <MapPin className="w-3 h-3" />
            {resolvedLabel}
          </span>
        )}
      </div>

      {/* Location picker — shown when seasonal is active */}
      {active && (
        <div className="flex flex-col gap-2 pl-1">
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#4A6830" }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") resolveQuery(query); }}
                placeholder="e.g. Tuscany, Utah, France…"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={{
                  borderColor: "#C8C0A0",
                  background: "#F5F2EC",
                  color: "#3D2817",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => resolveQuery(query)}
              disabled={loading || !query.trim()}
              className="px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors"
              style={{ background: "#4A6830", color: "#fff" }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Find"}
            </button>
            <button
              type="button"
              onClick={detectLocation}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors"
              style={{ background: "#E5EDD8", color: "#3D5030" }}
              title="Detect my location"
            >
              <Navigation className="w-3.5 h-3.5" />
              Detect
            </button>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#C85A2F" }}>{error}</p>
          )}

          {/* Show a preview of what's in season */}
          {seasonalProduce.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-lg">
              {seasonalProduce.slice(0, 12).map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ background: "#E5EDD8", color: "#3D5030" }}>
                  {p}
                </span>
              ))}
              {seasonalProduce.length > 12 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#E5EDD8", color: "#3D5030" }}>
                  +{seasonalProduce.length - 12} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
