import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { getTeamByCode, teamFlagUrl } from "@/lib/wc2026-teams";
import { WcMatchdayMenu } from "@/components/wc-matchday-menu";

export const dynamic = "force-dynamic";

function parseMatch(slug: string): { home: string; away: string } | null {
  const [home, away] = slug.split("-");
  if (!home || !away) return null;
  return { home, away };
}

export async function generateMetadata({ params }: { params: Promise<{ match: string }> }) {
  const { match } = await params;
  const parsed = parseMatch(match);
  if (!parsed) return { title: "Matchday Menu — World Cup 2026" };
  const home = getTeamByCode(parsed.home);
  const away = getTeamByCode(parsed.away);
  const title = `${home?.name ?? parsed.home} vs ${away?.name ?? parsed.away} — Matchday Menu`;
  return {
    title,
    description: "Half-time snacks + signature dishes from both nations. Cook the World Cup on What's Cooking.",
    openGraph: { title, type: "website" },
  };
}

export default async function MatchdayMenuPage({ params }: { params: Promise<{ match: string }> }) {
  const { match } = await params;
  const parsed = parseMatch(match);
  if (!parsed) notFound();
  const home = getTeamByCode(parsed.home);
  const away = getTeamByCode(parsed.away);
  if (!home || !away) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20 pt-4">
      <Link href="/world-cup-2026" className="inline-flex items-center gap-2 text-sm font-medium mb-5" style={{ color: "#F4A261" }}>
        <ArrowLeft className="w-4 h-4" /> Back to your matchdays
      </Link>

      <div
        className="rounded-3xl overflow-hidden mb-6 px-6 py-8"
        style={{ background: "linear-gradient(135deg, #0A1A08 0%, #16240E 55%, #0A1808 100%)", border: "1px solid rgba(30,80,20,0.4)" }}
      >
        <div className="flex items-center gap-2 mb-4" style={{ color: "rgba(130,200,100,0.6)" }}>
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Matchday Menu</span>
        </div>
        <div className="flex items-center justify-center gap-5">
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamFlagUrl(home.code, 80)} alt={home.name} width={56} height={37} style={{ borderRadius: 5, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
            <span className="text-sm font-bold" style={{ color: "#EFE3CE" }}>{home.name}</span>
          </div>
          <span className="text-lg font-black" style={{ color: "rgba(239,227,206,0.35)" }}>VS</span>
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamFlagUrl(away.code, 80)} alt={away.name} width={56} height={37} style={{ borderRadius: 5, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
            <span className="text-sm font-bold" style={{ color: "#EFE3CE" }}>{away.name}</span>
          </div>
        </div>
      </div>

      <WcMatchdayMenu home={home.code} away={away.code} />
    </div>
  );
}
