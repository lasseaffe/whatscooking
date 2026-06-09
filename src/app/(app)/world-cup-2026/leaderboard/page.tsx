import Link from "next/link";
import { ArrowLeft, Trophy, Camera, Globe2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PhotoRow = {
  user_id: string;
  fixture: { home_code: string; away_code: string } | null;
};

type Standing = { userId: string; dishes: number; nations: number };

export default async function CookedTheWorldPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("wc_match_photos")
    .select("user_id, fixture:wc_fixtures(home_code, away_code)");
  const photos = (data ?? []) as unknown as PhotoRow[];

  // Aggregate per chef: total dishes shared + distinct nations cooked for.
  const byUser = new Map<string, { dishes: number; nations: Set<string> }>();
  for (const p of photos) {
    if (!p.user_id) continue;
    const entry = byUser.get(p.user_id) ?? { dishes: 0, nations: new Set<string>() };
    entry.dishes += 1;
    if (p.fixture) {
      if (p.fixture.home_code) entry.nations.add(p.fixture.home_code);
      if (p.fixture.away_code) entry.nations.add(p.fixture.away_code);
    }
    byUser.set(p.user_id, entry);
  }

  const standings: Standing[] = Array.from(byUser.entries())
    .map(([userId, e]) => ({ userId, dishes: e.dishes, nations: e.nations.size }))
    .sort((a, b) => b.nations - a.nations || b.dishes - a.dishes)
    .slice(0, 25);

  const myRank = user ? standings.findIndex((s) => s.userId === user.id) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20 pt-4">
      <Link href="/world-cup-2026" className="inline-flex items-center gap-2 text-sm font-medium mb-5" style={{ color: "#F4A261" }}>
        <ArrowLeft className="w-4 h-4" /> Back to your matchdays
      </Link>

      <div
        className="rounded-3xl overflow-hidden mb-6 px-6 py-8"
        style={{ background: "linear-gradient(135deg, #0A1A08 0%, #16240E 55%, #0A1808 100%)", border: "1px solid rgba(30,80,20,0.4)" }}
      >
        <div className="flex items-center gap-2 mb-2" style={{ color: "rgba(130,200,100,0.6)" }}>
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Tournament Leaderboard</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Cooked the World
        </h1>
        <p className="text-sm" style={{ color: "rgba(239,227,206,0.6)" }}>
          Share a dish on any matchday to climb the table. Ranked by nations cooked, then dishes shared.
        </p>
      </div>

      {standings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl"
          style={{ background: "rgba(12,9,5,0.5)", border: "1px dashed rgba(244,162,97,0.25)" }}>
          <Camera className="w-9 h-9" style={{ color: "#F4A261" }} />
          <p className="text-lg font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Be the first to plate up
          </p>
          <p className="text-sm max-w-xs" style={{ color: "rgba(239,227,206,0.5)" }}>
            No dishes shared yet. Cook a matchday menu, snap your spread, and you&apos;ll top the table.
          </p>
          <Link href="/world-cup-2026" className="px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: "#C8522A", color: "#fff" }}>
            See your matchdays
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {standings.map((s, i) => {
            const isMe = user && s.userId === user.id;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
            return (
              <div
                key={s.userId}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isMe ? "rgba(244,162,97,0.14)" : "rgba(12,9,5,0.6)",
                  border: `1px solid ${isMe ? "rgba(244,162,97,0.4)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <span className="w-8 text-center text-sm font-black" style={{ color: i < 3 ? "#F4A261" : "rgba(239,227,206,0.5)" }}>
                  {medal}
                </span>
                <span className="flex-1 text-sm font-bold" style={{ color: "#EFE3CE" }}>
                  {isMe ? "You" : `Chef ${s.userId.slice(0, 4)}`}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#A8D890" }}>
                  <Globe2 className="w-3.5 h-3.5" /> {s.nations}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(239,227,206,0.6)" }}>
                  <Camera className="w-3.5 h-3.5" /> {s.dishes}
                </span>
              </div>
            );
          })}
          {user && myRank === -1 && (
            <p className="text-xs text-center mt-3" style={{ color: "rgba(239,227,206,0.45)" }}>
              You haven&apos;t shared a dish yet — cook a matchday menu to join the table.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
