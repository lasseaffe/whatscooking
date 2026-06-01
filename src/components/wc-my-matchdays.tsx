"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, CalendarDays, MapPin, Popcorn } from "lucide-react";
import { getTeamByCode, teamColor, teamFlagUrl } from "@/lib/wc2026-teams";
import { WcMatchdayMenu } from "@/components/wc-matchday-menu";

export type Fixture = {
  id: string;
  match_day: number;
  stage: string;
  match_date: string;
  home_code: string;
  away_code: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  group_label: string | null;
};

const PARCHMENT = "#EFE3CE";
const SAFFRON = "#F4A261";

function dayLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date(iso));
}
function kickoff(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function TeamSide({ code, align }: { code: string; align: "left" | "right" }) {
  const team = getTeamByCode(code);
  const name = team?.name ?? code;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: align === "right" ? "row-reverse" : "row",
        alignItems: "center",
        gap: 9,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={teamFlagUrl(code, 40)}
        alt={name}
        width={30}
        height={20}
        style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
      />
      <span
        style={{
          fontSize: "0.82rem",
          fontWeight: 700,
          color: PARCHMENT,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: align,
        }}
      >
        {name}
      </span>
    </div>
  );
}

function MatchdayRow({ fixture, followed }: { fixture: Fixture; followed: Set<string> }) {
  const [open, setOpen] = useState(false);
  const home = getTeamByCode(fixture.home_code);
  const away = getTeamByCode(fixture.away_code);
  const mine = followed.has(fixture.home_code) || followed.has(fixture.away_code);
  const accent = mine ? SAFFRON : "#7C8C6A";

  const partyParams = new URLSearchParams({
    theme: "worldcup",
    match: `${fixture.home_code}-${fixture.away_code}`,
    home: fixture.home_code,
    away: fixture.away_code,
    date: fixture.match_date,
    fixture: fixture.id,
  });

  return (
    <div
      style={{
        borderRadius: 16,
        background: "rgba(12,9,5,0.6)",
        border: `1px solid ${mine ? "rgba(244,162,97,0.3)" : "rgba(255,255,255,0.06)"}`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: accent }}>
            {mine ? "Your matchday" : "Featured match"}
            {fixture.group_label ? ` · Group ${fixture.group_label}` : ""}
          </span>
          <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "rgba(239,227,206,0.55)" }}>{kickoff(fixture.match_date)}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TeamSide code={fixture.home_code} align="left" />
          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(239,227,206,0.35)", flexShrink: 0 }}>VS</span>
          <TeamSide code={fixture.away_code} align="right" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(239,227,206,0.4)" }}>
          <MapPin size={11} />
          <span style={{ fontSize: "0.66rem", flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fixture.venue ?? "Venue TBD"}
          </span>
          <ChevronDown
            size={15}
            style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}
          />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <WcMatchdayMenu
            home={fixture.home_code}
            away={fixture.away_code}
            homeColor={home ? teamColor(home) : SAFFRON}
            awayColor={away ? teamColor(away) : SAFFRON}
          />
          <Link
            href={`/dinner-parties/new?${partyParams}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#C8522A",
              color: "#fff",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Popcorn size={15} /> Start a watch party for this match
          </Link>
        </div>
      )}
    </div>
  );
}

export function WcMyMatchdays({ fixtures, followedCodes }: { fixtures: Fixture[]; followedCodes: string[] }) {
  const followed = new Set(followedCodes);

  if (fixtures.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: "22px 18px",
          textAlign: "center",
          background: "rgba(12,9,5,0.5)",
          border: "1px dashed rgba(244,162,97,0.25)",
        }}
      >
        <Popcorn size={26} style={{ color: SAFFRON, marginBottom: 8 }} />
        <p style={{ fontSize: "0.86rem", fontWeight: 700, color: PARCHMENT, marginBottom: 4 }}>No matchdays lined up yet</p>
        <p style={{ fontSize: "0.74rem", color: "rgba(239,227,206,0.5)" }}>
          Follow a team above and their fixtures — plus the day&apos;s marquee matches — show up here with a ready-to-cook menu.
        </p>
      </div>
    );
  }

  // Group fixtures by calendar day for a clean schedule feel.
  const byDay = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = dayLabel(f.match_date);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(f);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {Array.from(byDay.entries()).map(([day, dayFixtures]) => (
        <div key={day}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
            <CalendarDays size={13} style={{ color: SAFFRON }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.04em", color: "rgba(239,227,206,0.7)" }}>{day}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dayFixtures.map((f) => (
              <MatchdayRow key={f.id} fixture={f} followed={followed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
