import { ImageResponse } from "next/og";
import { getTeamByCode, teamFlagUrl } from "@/lib/wc2026-teams";

export const alt = "World Cup 2026 Matchday Menu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ match: string }> }) {
  const { match } = await params;
  const [homeCode, awayCode] = (match ?? "").split("-");
  const home = getTeamByCode(homeCode);
  const away = getTeamByCode(awayCode);
  const homeName = home?.name ?? homeCode ?? "Home";
  const awayName = away?.name ?? awayCode ?? "Away";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A1A08 0%, #16240E 55%, #0A1808 100%)",
          color: "#EFE3CE",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", letterSpacing: 8, fontSize: 26, color: "#F4A261", fontWeight: 700, marginBottom: 36 }}>
          WORLD CUP 2026 · MATCHDAY MENU
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamFlagUrl(homeCode, 80)} width={150} height={100} style={{ borderRadius: 10 }} alt={homeName} />
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{homeName}</div>
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "rgba(239,227,206,0.4)" }}>vs</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamFlagUrl(awayCode, 80)} width={150} height={100} style={{ borderRadius: 10 }} alt={awayName} />
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{awayName}</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "rgba(239,227,206,0.7)", marginTop: 44 }}>
          Half-time snacks + signature dishes from both nations
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 40, fontSize: 24, color: "#F4A261", fontWeight: 700 }}>
          What&apos;s Cooking
        </div>
      </div>
    ),
    { ...size },
  );
}
