import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Globe2, Trophy, Star, Ticket } from "lucide-react";
import { WcFlagCard } from "@/components/wc-flag-card";
import { WcTeamPicker } from "@/components/wc-team-picker";
import { WcMyMatchdays, type Fixture } from "@/components/wc-my-matchdays";
import { WC2026_NATIONS, CONF_COLORS } from "@/lib/wc2026";
import { getTeamByCode, teamColor } from "@/lib/wc2026-teams";

export const dynamic = "force-dynamic";

const HOST_CODES = ["US", "CA", "MX"]; // marquee fallback when a fan has no fixtures lined up
const MAX_MATCHDAYS = 12;

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default async function WorldCup2026Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Followed teams (allegiance) ──
  let followed: { nation_code: string; is_primary: boolean }[] = [];
  if (user) {
    const { data } = await supabase
      .from("wc_user_teams")
      .select("nation_code, is_primary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    followed = data ?? [];
  }
  const followedCodes = followed.map((t) => t.nation_code);
  const primaryCode = followed.find((t) => t.is_primary)?.nation_code;

  // ── Upcoming fixtures → "My Matchdays" feed ──
  const { data: upcomingRaw } = await supabase
    .from("wc_fixtures")
    .select("*")
    .gte("match_date", new Date().toISOString())
    .order("match_date", { ascending: true })
    .limit(80);
  const upcoming = (upcomingRaw ?? []) as Fixture[];

  const followedSet = new Set(followedCodes);
  const involvesMine = (f: Fixture) => followedSet.has(f.home_code) || followedSet.has(f.away_code);
  const isMarquee = (f: Fixture) =>
    HOST_CODES.includes(f.home_code) || HOST_CODES.includes(f.away_code) || isToday(f.match_date);

  let matchdays: Fixture[];
  if (followedCodes.length > 0) {
    const mine = upcoming.filter(involvesMine);
    // Pad with a few marquee matches so the feed always has texture.
    const extras = upcoming.filter((f) => !involvesMine(f) && isMarquee(f)).slice(0, 3);
    matchdays = [...mine, ...extras]
      .sort((a, b) => +new Date(a.match_date) - +new Date(b.match_date))
      .slice(0, MAX_MATCHDAYS);
  } else {
    // No allegiance yet — tease the marquee schedule.
    matchdays = upcoming.filter(isMarquee).slice(0, 6);
    if (matchdays.length === 0) matchdays = upcoming.slice(0, 6);
  }

  // ── Passport (cuisine catalog) — demoted secondary section ──
  const cuisineCounts = new Map<string, number>();
  if (user) {
    const { data: ratedRecipes } = await supabase
      .from("recipe_ratings")
      .select("recipe:recipes(cuisine_type)")
      .eq("user_id", user.id);
    for (const row of ratedRecipes ?? []) {
      const ct = (row.recipe as { cuisine_type?: string | null } | null)?.cuisine_type;
      if (ct) {
        const key = ct.toLowerCase();
        cuisineCounts.set(key, (cuisineCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const STAMP_THRESHOLD = 3;
  const getCookedCount = (n: (typeof WC2026_NATIONS)[number]) =>
    (cuisineCounts.get(n.cuisine.toLowerCase()) ?? 0) + (cuisineCounts.get(n.countrySlug.toLowerCase()) ?? 0);
  const stamped = WC2026_NATIONS.filter((n) => getCookedCount(n) >= STAMP_THRESHOLD).length;
  const passportGroups = Array.from(new Set(WC2026_NATIONS.map((n) => n.group)));

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
      {/* ── Hero: My Teams ── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 mt-2"
        style={{
          background: "linear-gradient(135deg, #0A1A08 0%, #16240E 50%, #0A1808 100%)",
          border: "1px solid rgba(30,80,20,0.4)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='8' fill='none' stroke='white' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="px-6 py-9 relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(130,200,100,0.6)" }}>
            World Cup 2026 · Your Table
          </p>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Cook every matchday
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(239,227,206,0.6)" }}>
            Pick the teams you&apos;re rooting for. We line up their fixtures and hand you a ready-to-cook menu —
            half-time snacks plus signature dishes from both nations — for every game.
          </p>

          {followedCodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {followedCodes.map((code) => {
                const team = getTeamByCode(code);
                if (!team) return null;
                const isPrimary = code === primaryCode;
                const accent = teamColor(team);
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                    style={{
                      background: isPrimary ? accent : "rgba(255,255,255,0.06)",
                      color: isPrimary ? "#0A0A06" : "#EFE3CE",
                      border: `1px solid ${isPrimary ? accent : "rgba(255,255,255,0.12)"}`,
                    }}
                  >
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>{team.flag}</span>
                    {team.name}
                    {isPrimary && <Star size={12} fill="#0A0A06" style={{ color: "#0A0A06" }} />}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: "rgba(244,162,97,0.12)", color: "#F4A261", border: "1px solid rgba(244,162,97,0.3)" }}>
              <Ticket size={14} /> Choose your nations below to begin
            </div>
          )}
        </div>
      </div>

      {/* ── Team picker ── */}
      {followedCodes.length === 0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-1" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Who are you rooting for?
          </h2>
          <p className="text-xs mb-5" style={{ color: "rgba(239,227,206,0.5)" }}>
            Tap a nation to follow it. Star one as your primary — it leads your matchday feed.
          </p>
          <WcTeamPicker initialFollowed={followed} isAuthed={!!user} />
        </section>
      ) : (
        <details className="mb-8 group">
          <summary className="cursor-pointer text-sm font-semibold list-none flex items-center gap-2 mb-1"
            style={{ color: "#F4A261" }}>
            <span className="group-open:rotate-90 transition-transform inline-block">›</span> Add or change teams
          </summary>
          <div className="pt-4">
            <WcTeamPicker initialFollowed={followed} isAuthed={!!user} />
          </div>
        </details>
      )}

      {/* ── My Matchdays ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {followedCodes.length > 0 ? "Your matchdays" : "Matchdays to come"}
          </h2>
          <Link
            href="/world-cup-2026/leaderboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ color: "#F4A261", background: "rgba(244,162,97,0.1)", border: "1px solid rgba(244,162,97,0.25)" }}
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </Link>
        </div>
        <WcMyMatchdays fixtures={matchdays} followedCodes={followedCodes} />
      </section>

      {/* ── Passport (demoted) ── */}
      <details className="rounded-2xl overflow-hidden" style={{ background: "rgba(14,9,5,0.6)", border: "1px solid rgba(42,24,8,0.6)" }}>
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #206820, #0A4010)" }}>
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#EFE3CE" }}>Passport Challenge</p>
            <p className="text-xs" style={{ color: "rgba(239,227,206,0.5)" }}>
              {stamped} / {WC2026_NATIONS.length} cuisines explored — cook to collect stamps
            </p>
          </div>
          <span style={{ color: "rgba(239,227,206,0.4)" }}>▾</span>
        </summary>

        <div className="px-5 pb-6 pt-1 space-y-6">
          {passportGroups.map((conf) => {
            const nations = WC2026_NATIONS.filter((n) => n.group === conf);
            const color = CONF_COLORS[conf] ?? "#B07D56";
            return (
              <div key={conf}>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                  {conf}
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-3">
                  {nations.map((nation, i) => (
                    <WcFlagCard
                      key={nation.name}
                      code={nation.iso2}
                      name={nation.name}
                      cuisineSlug={nation.countrySlug}
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
          <Link
            href="/cuisines"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            <Globe2 className="w-4 h-4" />
            Explore World Cuisines
          </Link>
        </div>
      </details>
    </div>
  );
}
