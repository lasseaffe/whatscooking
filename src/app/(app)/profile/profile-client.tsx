"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe2, Trophy, MapPin, BookOpen, Heart, Star,
  ChefHat, ArrowRight, Loader2, Palette, Zap, X, ExternalLink, Clock, Sparkles, Home,
} from "lucide-react";
import { TIER_STYLES, TIER_ORDER, type BadgeTier } from "@/lib/achievements";

// ── Kitchen Hack types & components ─────────────────────────────────────────
interface HackRow {
  id: string; title: string; description: string | null; source_url: string | null; image_url: string | null;
  ingredients?: { name: string; amount?: number | null; unit?: string | null }[] | null;
  instructions?: string[] | null;
  prep_time_minutes?: number | null; cook_time_minutes?: number | null;
}

const HACK_FALLBACKS = [
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=70",
  "https://images.unsplash.com/photo-1464347744102-11db6282f854?w=600&q=70",
  "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=600&q=70",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=70",
];

function HackModal({ hack, onClose }: { hack: HackRow; onClose: () => void }) {
  const instructions = (hack.instructions ?? []) as string[];
  const ingredients = (hack.ingredients ?? []) as { name: string; amount?: number | null; unit?: string | null }[];
  const totalTime = (hack.prep_time_minutes ?? 0) + (hack.cook_time_minutes ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0" style={{ background: "rgba(30,18,8,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" style={{ background: "#1C1209" }}>
        {hack.image_url && (
          <div className="relative h-48 overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
            <img src={hack.image_url} alt={hack.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(30,18,8,0.7) 0%, transparent 60%)" }} />
          </div>
        )}
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.35)" }}>
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#2A1808" }}>
              <Zap className="w-4 h-4" style={{ color: "#C8522A" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#2A1808", color: "#C8522A" }}>Kitchen Hack</span>
                {totalTime > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#8A6A4A" }}>
                    <Clock className="w-3 h-3" />{totalTime} min
                  </span>
                )}
              </div>
              <h2 className="font-bold text-base leading-snug" style={{ color: "#EFE3CE" }}>{hack.title}</h2>
            </div>
          </div>
          {hack.description && <p className="text-sm leading-relaxed mb-4" style={{ color: "#8A6A4A" }}>{hack.description}</p>}
          {instructions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6B4E36" }}>The Technique</h3>
              <div className="flex flex-col gap-2.5">
                {instructions.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#2A1808", color: "#C8522A" }}>{i + 1}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "#EFE3CE" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hack.source_url && (
            <a href={hack.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#3A2416", color: "#8A6A4A", background: "#161009" }}>
              <ExternalLink className="w-4 h-4" /> Watch original video
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function HackCard({ hack, index, onOpen }: { hack: HackRow; index: number; onOpen: () => void }) {
  const fallback = HACK_FALLBACKS[index % HACK_FALLBACKS.length];
  const [imgSrc, setImgSrc] = useState(hack.image_url || fallback);
  const [failed, setFailed] = useState(false);

  return (
    <button type="button" onClick={onOpen}
      className="group rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-md text-left w-full"
      style={{ borderColor: "#3A2416", background: "#1C1209" }}>
      <div className="relative h-28 overflow-hidden">
        {!failed ? (
          <img src={imgSrc} alt={hack.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => { if (imgSrc !== fallback) setImgSrc(fallback); else setFailed(true); }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A1208 0%, #2A1A0A 100%)" }}>
            <Zap className="w-8 h-8" style={{ color: "#C8522A", opacity: 0.3 }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(74,60,30,0.85) 0%, transparent 60%)" }} />
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "#2A1808", color: "#C8522A" }}>HACK</div>
        <div className="absolute bottom-2 left-2">
          <span className="text-xs font-semibold text-white group-hover:underline">Tap to learn →</span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: "#EFE3CE" }}>{hack.title}</p>
        {hack.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: "#6B4E36" }}>{hack.description}</p>}
      </div>
    </button>
  );
}
import { CUISINE_SLUG_TO_COUNTRY, CUISINE_COUNTRIES } from "@/lib/country-cuisine-map";
import { PaletteSwitcher } from "@/components/palette-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

type WorldMapData = {
  pinnedCountries: { slug: string; isoNumeric: string; name: string; flag: string }[];
  totalPinned: number;
  badges: { id: string; name: string; description: string; emoji: string; tier: BadgeTier }[];
  stats: { savedCount: number; ratedCount: number; ownRecipeCount: number; publishedRecipeCount: number };
};

// ── Chef Rank ────────────────────────────────────────────────────────────────
function getChefRank(recipeCount: number): string {
  if (recipeCount >= 100) return "Executive Chef";
  if (recipeCount >= 51)  return "Chef de Partie";
  if (recipeCount >= 21)  return "Line Cook";
  if (recipeCount >= 6)   return "Sous Chef";
  return "Home Cook";
}

// ── ISO alpha-2 from flag emoji (U+1F1E6..U+1F1FF regional indicators) ───────
function flagToAlpha2(flag: string): string {
  try {
    const cps = [...flag].map(c => c.codePointAt(0)! - 0x1F1A5);
    return String.fromCharCode(cps[0], cps[1]);
  } catch {
    return "??";
  }
}

// ── Flavor Profile Radar Chart ───────────────────────────────────────────────
const RADAR_AXES = ["Spicy", "Savory", "Sweet", "Healthy", "Complex", "Quick"] as const;
const AXIS_COUNT = RADAR_AXES.length;
const CX = 100;
const CY = 100;
const R = 75;

function polarToXY(angleDeg: number, radius: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function polygonPoints(values: number[]) {
  return values
    .map((v, i) => {
      const angle = (360 / AXIS_COUNT) * i;
      const r = (v / 100) * R;
      const { x, y } = polarToXY(angle, r);
      return `${x},${y}`;
    })
    .join(" ");
}

interface RadarChartProps {
  values?: number[]; // 0–100 per axis, length must equal AXIS_COUNT
}

function RadarChart({ values }: RadarChartProps) {
  const data = values && values.length === AXIS_COUNT ? values : Array(AXIS_COUNT).fill(30);
  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto" aria-label="Flavor profile radar">
      {/* Grid rings */}
      {rings.map(pct => {
        const ringR = (pct / 100) * R;
        const pts = Array.from({ length: AXIS_COUNT }, (_, i) => {
          const angle = (360 / AXIS_COUNT) * i;
          const { x, y } = polarToXY(angle, ringR);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={pct}
            points={pts}
            fill="none"
            stroke="var(--wc-surface-2)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis spokes */}
      {RADAR_AXES.map((_, i) => {
        const angle = (360 / AXIS_COUNT) * i;
        const outer = polarToXY(angle, R);
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={outer.x} y2={outer.y}
            stroke="var(--wc-surface-2)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints(data)}
        fill="var(--wc-accent-saffron)"
        fillOpacity="0.3"
        stroke="var(--wc-accent-saffron)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Axis labels */}
      {RADAR_AXES.map((label, i) => {
        const angle = (360 / AXIS_COUNT) * i;
        const labelR = R + 14;
        const { x, y } = polarToXY(angle, labelR);
        const anchor =
          Math.abs(x - CX) < 4 ? "middle" : x < CX ? "end" : "start";
        return (
          <text
            key={label}
            x={x} y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="8"
            fontWeight="600"
            fill="var(--fg-secondary)"
          >
            {label}
          </text>
        );
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="2.5" fill="var(--wc-accent-saffron)" />
    </svg>
  );
}

// ── Passport Stamp Grid ──────────────────────────────────────────────────────
interface PassportStampGridProps {
  pinnedCountries: WorldMapData["pinnedCountries"];
}

function PassportStampGrid({ pinnedCountries }: PassportStampGridProps) {
  const [activeStamp, setActiveStamp] = useState<string | null>(null);
  const pinnedSet = new Set(pinnedCountries.map(c => c.isoNumeric));

  // Build a map from isoNumeric → pinned country data for tooltip
  const pinnedByIso = Object.fromEntries(
    pinnedCountries.map(c => [c.isoNumeric, c])
  );

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5"
        role="list"
        aria-label="World cuisine passport stamps"
      >
        {CUISINE_COUNTRIES.map(country => {
          const cooked = pinnedSet.has(country.isoNumeric);
          const alpha2 = flagToAlpha2(country.flag);
          const isActive = activeStamp === country.isoNumeric;

          return (
            <button
              key={country.isoNumeric}
              role="listitem"
              aria-label={`${country.name}${cooked ? " — collected" : " — not yet collected"}`}
              title={country.name}
              onClick={() => {
                if (cooked) setActiveStamp(isActive ? null : country.isoNumeric);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.5rem",
                height: "2rem",
                borderRadius: "6px",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: cooked ? "pointer" : "default",
                transition: "all 0.18s ease",
                opacity: cooked ? 1 : 0.55,
                background: cooked ? "var(--wc-accent-saffron)" : "var(--wc-surface-2)",
                color: cooked ? "var(--wc-pal-darkest)" : "var(--fg-tertiary)",
                boxShadow: cooked
                  ? isActive
                    ? "0 0 14px rgba(244,162,97,0.6), 0 0 0 2px var(--wc-accent-saffron)"
                    : "0 0 8px rgba(244,162,97,0.35)"
                  : "none",
                border: cooked
                  ? isActive
                    ? "1.5px solid var(--wc-accent-saffron)"
                    : "1px solid transparent"
                  : "1px solid var(--wc-surface-2)",
                transform: isActive ? "scale(1.12)" : "scale(1)",
              }}
            >
              {alpha2}
            </button>
          );
        })}
      </div>

      {/* Expanded stamp detail */}
      {activeStamp && pinnedByIso[activeStamp] && (
        <div
          className="mt-3 px-3 py-2.5 rounded-xl text-xs"
          style={{
            background: "var(--wc-surface-1)",
            border: "1px solid var(--wc-accent-saffron)",
            color: "var(--fg-secondary)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{pinnedByIso[activeStamp].flag}</span>
            <span className="font-bold" style={{ color: "var(--fg-primary)" }}>
              {pinnedByIso[activeStamp].name}
            </span>
            <span style={{ color: "var(--wc-accent-saffron)" }}>— collected!</span>
          </div>
          <Link
            href={`/cuisines/${pinnedByIso[activeStamp].slug}`}
            className="underline"
            style={{ color: "var(--wc-accent-saffron)" }}
          >
            Browse {pinnedByIso[activeStamp].name} recipes →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Achievement badge card ───────────────────────────────────────────────────
const TIER_GLOW: Record<BadgeTier, string> = {
  bronze:   "0 0 8px rgba(205,127,50,0.25)",
  silver:   "0 0 8px rgba(192,192,192,0.25)",
  gold:     "0 0 8px rgba(244,162,97,0.30)",
  platinum: "0 0 8px rgba(14,165,233,0.25)",
};

const TIER_BORDER_COLOR: Record<BadgeTier, string> = {
  bronze:   "#CD7F32",
  silver:   "#C0C0C0",
  gold:     "var(--wc-accent-saffron)",
  platinum: "#0284C7",
};

// ── Main component ───────────────────────────────────────────────────────────
export function ProfileClient({ userId, email, hacks }: { userId: string; email: string; hacks: HackRow[] }) {
  const [data, setData] = useState<WorldMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHack, setSelectedHack] = useState<HackRow | null>(null);

  useEffect(() => {
    fetch("/api/world-map")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const initial = email?.[0]?.toUpperCase() ?? "C";
  const totalAvail = CUISINE_COUNTRIES.length;

  const recipeCount = data?.stats.ownRecipeCount ?? 0;
  const chefRank = getChefRank(recipeCount);

  // Group badges by tier
  const badgesByTier: Partial<Record<BadgeTier, NonNullable<typeof data>["badges"]>> = {};
  for (const b of (data?.badges ?? [])) {
    if (!badgesByTier[b.tier]) badgesByTier[b.tier] = [];
    badgesByTier[b.tier]!.push(b);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── CHEF PROFILE HEADER ─────────────────────────────────────── */}
      <div className="flex items-start gap-5">
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.375rem",
            fontWeight: 700,
            flexShrink: 0,
            background: "linear-gradient(135deg, var(--wc-pal-lightest), var(--wc-pal-mid))",
            color: "var(--wc-pal-accent)",
            boxShadow: "0 0 0 3px var(--wc-surface-2)",
          }}
        >
          {initial}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--fg-primary)" }}>Chef</h1>
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: "var(--wc-pal-accent)" }}
          >
            {chefRank}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{email}</p>

          {loading ? (
            <div className="flex gap-3 mt-3">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-7 w-16 rounded-lg animate-pulse"
                  style={{ background: "var(--wc-surface-2)" }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 mt-3">
              <Stat icon={<Heart className="w-3.5 h-3.5" />} label="Saved"     value={data?.stats.savedCount ?? 0} />
              <Stat icon={<Star className="w-3.5 h-3.5" />}  label="Rated"     value={data?.stats.ratedCount ?? 0} />
              <Stat icon={<ChefHat className="w-3.5 h-3.5" />} label="Recipes" value={data?.stats.ownRecipeCount ?? 0} />
              <Stat icon={<BookOpen className="w-3.5 h-3.5" />} label="Published" value={data?.stats.publishedRecipeCount ?? 0} />
              <Stat icon={<MapPin className="w-3.5 h-3.5" />} label="Countries" value={data?.totalPinned ?? 0} />
            </div>
          )}
        </div>
      </div>

      {/* ── 2-COLUMN COMMAND CENTER GRID ─────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "65fr 35fr",
          gap: "24px",
          alignItems: "start",
        }}
        className="profile-grid"
      >
        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* World Collection / Passport Stamp Grid */}
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--wc-surface-2)",
              background: "var(--wc-surface-1)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4" style={{ color: "var(--wc-accent-saffron)" }} />
                <h2 className="font-bold text-sm" style={{ color: "var(--fg-primary)" }}>
                  World Collection
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "var(--wc-surface-2)",
                    color: "var(--wc-accent-saffron)",
                  }}
                >
                  {data?.totalPinned ?? 0} / {totalAvail}
                </span>
              </div>
              <Link
                href="/cuisines"
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "var(--wc-accent-saffron)" }}
              >
                View map <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded animate-pulse"
                    style={{ width: "2.5rem", height: "2rem", background: "var(--wc-surface-2)" }}
                  />
                ))}
              </div>
            ) : (
              <PassportStampGrid pinnedCountries={data?.pinnedCountries ?? []} />
            )}
          </div>

          {/* Achievements */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4" style={{ color: "var(--wc-accent-saffron)" }} />
              <h2 className="font-bold text-base" style={{ color: "var(--fg-primary)" }}>
                Achievements
                {!loading && (data?.badges.length ?? 0) > 0 && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "var(--wc-surface-2)",
                      color: "var(--wc-accent-saffron)",
                    }}
                  >
                    {data!.badges.length} earned
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl animate-pulse"
                    style={{ background: "var(--wc-surface-2)" }}
                  />
                ))}
              </div>
            ) : (data?.badges.length ?? 0) === 0 ? (
              <div
                className="rounded-2xl border p-10 text-center"
                style={{ borderColor: "var(--wc-surface-2)", borderStyle: "dashed" }}
              >
                <Trophy
                  className="w-8 h-8 mx-auto mb-3"
                  style={{ color: "var(--wc-accent-saffron)", opacity: 0.3 }}
                />
                <p className="text-sm font-medium mb-1" style={{ color: "var(--fg-primary)" }}>
                  No achievements yet
                </p>
                <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                  Start saving and cooking recipes to unlock badges.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {TIER_ORDER.slice().reverse().map(tier => {
                  const badges = badgesByTier[tier];
                  if (!badges || badges.length === 0) return null;
                  const borderColor = TIER_BORDER_COLOR[tier];
                  const glowShadow = TIER_GLOW[tier];
                  const ts = TIER_STYLES[tier];
                  return (
                    <div key={tier}>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: borderColor }}
                        />
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: ts.text }}
                        >
                          {ts.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {badges.map(b => (
                          <div
                            key={b.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                            style={{
                              background: "var(--wc-surface-2)",
                              border: `1px solid ${borderColor}`,
                              boxShadow: glowShadow,
                            }}
                          >
                            <span className="text-2xl shrink-0">{b.emoji}</span>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-bold truncate"
                                style={{ color: ts.text }}
                              >
                                {b.name}
                              </p>
                              <p
                                className="text-xs mt-0.5 line-clamp-2"
                                style={{ color: "var(--fg-tertiary)" }}
                              >
                                {b.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Flavor Profile Radar */}
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--wc-surface-2)",
              background: "var(--wc-surface-1)",
            }}
          >
            <h2 className="font-bold text-sm mb-4" style={{ color: "var(--fg-primary)" }}>
              Flavor Profile
            </h2>
            <RadarChart />
            <p
              className="text-center text-xs mt-3"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Cook more recipes to sharpen your profile
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/my-recipes", icon: ChefHat,  label: "My Recipes"    },
              { href: "/saved",      icon: Heart,     label: "Saved"          },
              { href: "/cuisines",   icon: Globe2,    label: "World Cuisines" },
              { href: "/plans",      icon: BookOpen,  label: "Meal Plans"     },
              { href: "/household",  icon: Home,      label: "Household"      },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style={{
                  borderColor: "var(--wc-surface-2)",
                  background: "var(--wc-surface-1)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--wc-accent-saffron)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--fg-primary)" }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Color Palette Card */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--wc-surface-2)",
              background: "var(--wc-surface-1)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4" style={{ color: "var(--wc-accent-saffron)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--fg-primary)" }}>
                Color Palette
              </h3>
            </div>
            <PaletteSwitcher compact />
          </div>

          {/* Theme Toggle Card */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--wc-surface-2)",
              background: "var(--wc-surface-1)",
            }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: "var(--fg-primary)" }}>
              Appearance
            </p>
            <ThemeToggle variant="pill" />
          </div>

          {/* Cooking Stats Mini-Widget */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--wc-surface-2)",
              background: "var(--wc-surface-1)",
            }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: "var(--fg-primary)" }}>
              Your Kitchen Stats
            </p>
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-9 rounded-lg animate-pulse"
                    style={{ background: "var(--wc-surface-2)" }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <MiniStat
                  label="Recipes saved"
                  value={data?.stats.savedCount ?? 0}
                  max={100}
                  icon={<Heart className="w-3 h-3" />}
                />
                <MiniStat
                  label="Recipes rated"
                  value={data?.stats.ratedCount ?? 0}
                  max={50}
                  icon={<Star className="w-3 h-3" />}
                />
                <MiniStat
                  label="Countries explored"
                  value={data?.totalPinned ?? 0}
                  max={totalAvail}
                  icon={<Globe2 className="w-3 h-3" />}
                />
                <MiniStat
                  label="My recipes"
                  value={data?.stats.ownRecipeCount ?? 0}
                  max={20}
                  icon={<ChefHat className="w-3 h-3" />}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KITCHEN HACKS ─────────────────────────────────────────── */}
      {hacks.length > 0 && (
        <div>
          {/* Hack modal */}
          {selectedHack && (
            <HackModal hack={selectedHack} onClose={() => setSelectedHack(null)} />
          )}

          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4" style={{ color: "#C8522A" }} />
            <h2 className="font-bold text-base" style={{ color: "var(--fg-primary)" }}>
              Kitchen Hacks
            </h2>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "var(--wc-surface-2)", color: "#C8522A" }}
            >
              {hacks.length} tips
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {hacks.map((hack, i) => (
              <HackCard
                key={hack.id}
                hack={hack}
                index={i}
                onOpen={() => setSelectedHack(hack)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Responsive grid override — collapses to single column on small screens */}
      <style>{`
        @media (max-width: 640px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Small inline stat pill ───────────────────────────────────────────────────
function Stat({ icon, label, value }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-tertiary)" }}>
      <span style={{ color: "var(--wc-accent-saffron)" }}>{icon}</span>
      <span className="font-bold" style={{ color: "var(--fg-primary)" }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Mini stat bar for right column widget ────────────────────────────────────
function MiniStat({
  label,
  value,
  max,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5" style={{ color: "var(--fg-tertiary)" }}>
          <span style={{ color: "var(--wc-accent-saffron)" }}>{icon}</span>
          <span className="text-xs">{label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: "var(--fg-primary)" }}>
          {value}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--wc-surface-2)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, var(--wc-accent-saffron) 0%, var(--wc-pal-mid) 100%)",
          }}
        />
      </div>
    </div>
  );
}
