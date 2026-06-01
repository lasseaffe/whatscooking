import Link from "next/link";
import { Trophy } from "lucide-react";
import { WC2026_NATIONS, CONF_COLORS, flagcdnCode } from "@/lib/wc2026";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "World Cup 2026 — What's Cooking" };

const GROUPS = ["Host", "UEFA", "CONMEBOL", "CAF", "AFC", "CONCACAF", "OFC"] as const;
const GROUP_LABELS: Record<string, string> = {
  Host: "🏆 Host Nations",
  UEFA: "🇪🇺 UEFA — Europe",
  CONMEBOL: "🌎 CONMEBOL — South America",
  CAF: "🌍 CAF — Africa",
  AFC: "🌏 AFC — Asia",
  CONCACAF: "🌐 CONCACAF — N. & C. America",
  OFC: "🏝 OFC — Oceania",
};

export default async function WCCuisinesPage() {
  const supabase = await createClient();

  // Single query: fetch all cuisine_types so we can count per nation
  const { data: cuisineRows } = await supabase
    .from("recipes")
    .select("cuisine_type")
    .not("cuisine_type", "is", null);

  // Build a lowercase count map
  const countMap: Record<string, number> = {};
  for (const row of cuisineRows ?? []) {
    const key = (row.cuisine_type as string).toLowerCase();
    countMap[key] = (countMap[key] ?? 0) + 1;
  }

  function recipeCount(cuisine: string): number {
    return countMap[cuisine.toLowerCase()] ?? 0;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "#A69180" }}>
        <Link href="/cuisines" className="hover:underline">Cuisines</Link>
        <span>/</span>
        <span style={{ color: "#6B5B52" }}>World Cup 2026</span>
      </div>

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-10 p-8"
        style={{ background: "linear-gradient(135deg, #0A0500 0%, #1A0C02 60%, #0D1020 100%)", border: "1px solid #3A2820" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-8 h-8" style={{ color: "#FFD700" }} />
          <h1 className="text-3xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            World Cup 2026
          </h1>
        </div>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(239,227,206,0.65)" }}>
          48 nations. 48 culinary traditions. Explore the flavours of every team competing in the 2026 FIFA World Cup — from host nations USA, Canada &amp; Mexico to UEFA giants, African powerhouses, and Asian contenders.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          {GROUPS.map((g) => (
            <span
              key={g}
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: `${CONF_COLORS[g]}25`, color: CONF_COLORS[g], border: `1px solid ${CONF_COLORS[g]}40` }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Nation grids by confederation */}
      {GROUPS.map((group) => {
        const nations = WC2026_NATIONS.filter((n) => n.group === group);
        const color = CONF_COLORS[group];
        return (
          <section key={group} className="mb-10">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"
              style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
              {GROUP_LABELS[group]}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {nations.map((nation) => {
                const count = recipeCount(nation.cuisine);
                return (
                  <Link
                    key={nation.countrySlug}
                    href={`/cuisines/world-cup-2026/${nation.countrySlug}`}
                    className="group rounded-2xl overflow-hidden border transition-all hover:shadow-lg"
                    style={{ borderColor: `${color}30`, background: "#0F0A06" }}
                  >
                    <div className="relative h-28 overflow-hidden flex items-center justify-center" style={{ background: "#0A0500" }}>
                      <img
                        src={`https://flagcdn.com/w320/${flagcdnCode(nation.iso2)}.png`}
                        alt={`${nation.name} flag`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,5,0,0.78) 0%, transparent 55%)" }} />
                      {count > 0 && (
                        <span
                          className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${color}CC`, color: "#fff", fontSize: 10 }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold leading-tight" style={{ color: "#EFE3CE" }}>{nation.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(239,227,206,0.45)" }}>
                        {count > 0 ? `${count} recipe${count === 1 ? "" : "s"}` : `${nation.dishes.length} dishes`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
