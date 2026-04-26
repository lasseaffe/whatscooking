import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Globe2, Trophy } from "lucide-react";
import { WcFlagCard } from "@/components/wc-flag-card";

export const dynamic = "force-dynamic";

// 48-nation World Cup 2026 lineup (confirmed qualified nations)
const WC2026_NATIONS = [
  { flag: "🇺🇸", iso2: "US", name: "United States",  cuisine: "American",       slug: "american",         group: "Host" },
  { flag: "🇨🇦", iso2: "CA", name: "Canada",          cuisine: "Canadian",       slug: "canadian",         group: "Host" },
  { flag: "🇲🇽", iso2: "MX", name: "Mexico",          cuisine: "Mexican",        slug: "mexican",          group: "Host" },
  { flag: "🇧🇷", iso2: "BR", name: "Brazil",          cuisine: "Brazilian",      slug: "brazilian",        group: "CONMEBOL" },
  { flag: "🇦🇷", iso2: "AR", name: "Argentina",       cuisine: "Argentinian",    slug: "argentinian",      group: "CONMEBOL" },
  { flag: "🇺🇾", iso2: "UY", name: "Uruguay",         cuisine: "Uruguayan",      slug: "south-american",   group: "CONMEBOL" },
  { flag: "🇨🇱", iso2: "CL", name: "Chile",           cuisine: "Chilean",        slug: "south-american",   group: "CONMEBOL" },
  { flag: "🇨🇴", iso2: "CO", name: "Colombia",        cuisine: "Colombian",      slug: "south-american",   group: "CONMEBOL" },
  { flag: "🇵🇾", iso2: "PY", name: "Paraguay",        cuisine: "Paraguayan",     slug: "south-american",   group: "CONMEBOL" },
  { flag: "🇩🇪", iso2: "DE", name: "Germany",         cuisine: "German",         slug: "german",           group: "UEFA" },
  { flag: "🇫🇷", iso2: "FR", name: "France",          cuisine: "French",         slug: "french",           group: "UEFA" },
  { flag: "🇪🇸", iso2: "ES", name: "Spain",           cuisine: "Spanish",        slug: "spanish",          group: "UEFA" },
  { flag: "🇵🇹", iso2: "PT", name: "Portugal",        cuisine: "Portuguese",     slug: "portuguese",       group: "UEFA" },
  { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso2: "GB-ENG", name: "England",       cuisine: "British",        slug: "british",          group: "UEFA" },
  { flag: "🇳🇱", iso2: "NL", name: "Netherlands",     cuisine: "Dutch",          slug: "european",         group: "UEFA" },
  { flag: "🇧🇪", iso2: "BE", name: "Belgium",         cuisine: "Belgian",        slug: "european",         group: "UEFA" },
  { flag: "🇮🇹", iso2: "IT", name: "Italy",           cuisine: "Italian",        slug: "italian",          group: "UEFA" },
  { flag: "🇵🇱", iso2: "PL", name: "Poland",          cuisine: "Polish",         slug: "polish",           group: "UEFA" },
  { flag: "🇦🇹", iso2: "AT", name: "Austria",         cuisine: "Austrian",       slug: "european",         group: "UEFA" },
  { flag: "🇨🇭", iso2: "CH", name: "Switzerland",     cuisine: "Swiss",          slug: "european",         group: "UEFA" },
  { flag: "🇩🇰", iso2: "DK", name: "Denmark",         cuisine: "Scandinavian",   slug: "scandinavian",     group: "UEFA" },
  { flag: "🇭🇺", iso2: "HU", name: "Hungary",         cuisine: "Hungarian",      slug: "eastern-european", group: "UEFA" },
  { flag: "🇷🇴", iso2: "RO", name: "Romania",         cuisine: "Romanian",       slug: "eastern-european", group: "UEFA" },
  { flag: "🇬🇷", iso2: "GR", name: "Greece",          cuisine: "Greek",          slug: "greek",            group: "UEFA" },
  { flag: "🇸🇰", iso2: "SK", name: "Slovakia",        cuisine: "Slovak",         slug: "eastern-european", group: "UEFA" },
  { flag: "🇺🇦", iso2: "UA", name: "Ukraine",         cuisine: "Ukrainian",      slug: "eastern-european", group: "UEFA" },
  { flag: "🇸🇮", iso2: "SI", name: "Slovenia",        cuisine: "Slovenian",      slug: "european",         group: "UEFA" },
  { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso2: "GB-SCT", name: "Scotland",      cuisine: "British",        slug: "british",          group: "UEFA" },
  { flag: "🇲🇦", iso2: "MA", name: "Morocco",         cuisine: "Moroccan",       slug: "moroccan",         group: "CAF" },
  { flag: "🇳🇬", iso2: "NG", name: "Nigeria",         cuisine: "Nigerian",       slug: "nigerian",         group: "CAF" },
  { flag: "🇿🇦", iso2: "ZA", name: "South Africa",    cuisine: "South African",  slug: "south-african",    group: "CAF" },
  { flag: "🇸🇳", iso2: "SN", name: "Senegal",         cuisine: "Senegalese",     slug: "senegalese",       group: "CAF" },
  { flag: "🇪🇬", iso2: "EG", name: "Egypt",           cuisine: "Egyptian",       slug: "egyptian",         group: "CAF" },
  { flag: "🇨🇲", iso2: "CM", name: "Cameroon",        cuisine: "Cameroonian",    slug: "west-african",     group: "CAF" },
  { flag: "🇲🇱", iso2: "ML", name: "Mali",            cuisine: "West African",   slug: "west-african",     group: "CAF" },
  { flag: "🇿🇲", iso2: "ZM", name: "Zambia",          cuisine: "Zambian",        slug: "east-african",     group: "CAF" },
  { flag: "🇹🇿", iso2: "TZ", name: "Tanzania",        cuisine: "East African",   slug: "east-african",     group: "CAF" },
  { flag: "🇯🇵", iso2: "JP", name: "Japan",           cuisine: "Japanese",       slug: "japanese",         group: "AFC" },
  { flag: "🇰🇷", iso2: "KR", name: "South Korea",     cuisine: "Korean",         slug: "korean",           group: "AFC" },
  { flag: "🇮🇷", iso2: "IR", name: "Iran",            cuisine: "Persian",        slug: "persian",          group: "AFC" },
  { flag: "🇦🇺", iso2: "AU", name: "Australia",       cuisine: "Australian",     slug: "australian",       group: "AFC" },
  { flag: "🇸🇦", iso2: "SA", name: "Saudi Arabia",    cuisine: "Middle Eastern", slug: "middle-eastern",   group: "AFC" },
  { flag: "🇵🇸", iso2: "PS", name: "Palestine",       cuisine: "Middle Eastern", slug: "middle-eastern",   group: "AFC" },
  { flag: "🇺🇿", iso2: "UZ", name: "Uzbekistan",      cuisine: "Central Asian",  slug: "central-asian",    group: "AFC" },
  { flag: "🇶🇦", iso2: "QA", name: "Qatar",           cuisine: "Middle Eastern", slug: "middle-eastern",   group: "AFC" },
  { flag: "🇨🇷", iso2: "CR", name: "Costa Rica",      cuisine: "Costa Rican",    slug: "central-american", group: "CONCACAF" },
  { flag: "🇵🇦", iso2: "PA", name: "Panama",          cuisine: "Panamanian",     slug: "central-american", group: "CONCACAF" },
  { flag: "🇯🇲", iso2: "JM", name: "Jamaica",         cuisine: "Jamaican",       slug: "caribbean",        group: "CONCACAF" },
  { flag: "🇸🇻", iso2: "SV", name: "El Salvador",     cuisine: "Central American", slug: "central-american", group: "CONCACAF" },
] as const;

const CONF_COLORS: Record<string, string> = {
  "Host":     "#C8522A",
  "UEFA":     "#4060C0",
  "CONMEBOL": "#208040",
  "CAF":      "#B06020",
  "AFC":      "#6040A0",
  "CONCACAF": "#208080",
};

export default async function WorldCup2026Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Count rated recipes per cuisine type — proxy for "cooked this"
  const { data: ratedRecipes } = await supabase
    .from("recipe_ratings")
    .select("recipe:recipes(cuisine_type)")
    .eq("user_id", user!.id);

  const cuisineCounts = new Map<string, number>();
  for (const row of ratedRecipes ?? []) {
    const ct = (row.recipe as { cuisine_type?: string | null } | null)?.cuisine_type;
    if (ct) {
      const key = ct.toLowerCase();
      cuisineCounts.set(key, (cuisineCounts.get(key) ?? 0) + 1);
    }
  }

  const STAMP_THRESHOLD = 3;

  function getCookedCount(nation: typeof WC2026_NATIONS[number]) {
    return (
      (cuisineCounts.get(nation.cuisine.toLowerCase()) ?? 0) +
      (cuisineCounts.get(nation.slug.toLowerCase()) ?? 0)
    );
  }

  function isStamped(nation: typeof WC2026_NATIONS[number]) {
    return getCookedCount(nation) >= STAMP_THRESHOLD;
  }

  function isStarted(nation: typeof WC2026_NATIONS[number]) {
    return getCookedCount(nation) > 0;
  }

  const stamped = WC2026_NATIONS.filter(isStamped).length;
  const total = WC2026_NATIONS.length;
  const pct = Math.round((stamped / total) * 100);

  const groups = Array.from(new Set(WC2026_NATIONS.map((n) => n.group)));

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">

      {/* ── Hero ── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 mt-2"
        style={{
          background: "linear-gradient(135deg, #0A1A08 0%, #1A2810 50%, #0A1808 100%)",
          border: "1px solid rgba(30,80,20,0.4)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='8' fill='none' stroke='white' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="px-6 py-10 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #206820, #0A4010)" }}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(130,200,100,0.6)" }}>
                Passport Challenge
              </p>
              <h1 className="text-3xl font-bold mb-2"
                style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                World Cup 2026
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(239,227,206,0.6)" }}>
                Cook a dish from every qualifying nation. Earn a passport stamp for each cuisine you've explored.
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "rgba(239,227,206,0.5)" }}>
                Passport progress
              </span>
              <span className="text-sm font-bold" style={{ color: "#F4A261" }}>
                {stamped} / {total} nations — {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #206820, #F4A261)",
                  animation: `wc-progress-fill 800ms cubic-bezier(0.34,1.56,0.64,1) both`,
                }}
              />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes wc-progress-fill {
            from { width: 0%; }
            to   { width: ${pct}%; }
          }
          @keyframes wc-conf-pulse {
            0%, 100% { opacity: 0.65; }
            50%       { opacity: 1; }
          }
        `}</style>
      </div>

      {/* ── Nation grid by confederation ── */}
      <div className="space-y-8">
        {groups.map((conf) => {
          const nations = WC2026_NATIONS.filter((n) => n.group === conf);
          const confStamped = nations.filter(isStamped).length;
          const color = CONF_COLORS[conf] ?? "#B07D56";

          return (
            <div key={conf}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30`, animation: "wc-conf-pulse 3s ease-in-out infinite" }}>
                  {conf}
                </span>
                <span className="text-xs" style={{ color: "#4A3020" }}>
                  {confStamped}/{nations.length} cooked
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {nations.map((nation, i) => (
                  <WcFlagCard
                    key={nation.name}
                    code={nation.iso2}
                    name={nation.name}
                    cuisineSlug={nation.slug}
                    cookedCount={Math.min(getCookedCount(nation), STAMP_THRESHOLD)}
                    threshold={STAMP_THRESHOLD}
                    confColor={color}
                    index={i}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <div className="mt-10 rounded-2xl p-6 text-center"
        style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.6)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#EFE3CE" }}>
          Ready to explore a new cuisine?
        </p>
        <p className="text-xs mb-4" style={{ color: "#6B4E36" }}>
          Rate a recipe from any nation to earn your passport stamp.
        </p>
        <Link
          href="/cuisines"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "#C8522A", color: "#fff" }}
        >
          <Globe2 className="w-4 h-4" />
          Explore World Cuisines
        </Link>
      </div>

    </div>
  );
}
