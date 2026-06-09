"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, Plus } from "lucide-react";
import { WC_TEAMS, CONFEDERATION_ORDER, teamColor, type WCTeam } from "@/lib/wc2026-teams";

const PARCHMENT = "#EFE3CE";
const SAFFRON = "#F4A261";

type Followed = Record<string, boolean>; // code -> is_primary

const CONF_LABEL: Record<string, string> = {
  Host: "Host Nations",
  UEFA: "Europe",
  CONMEBOL: "South America",
  CONCACAF: "North & Central America",
  CAF: "Africa",
  AFC: "Asia",
  OFC: "Oceania",
};

export function WcTeamPicker({
  initialFollowed,
  isAuthed,
}: {
  initialFollowed: { nation_code: string; is_primary: boolean }[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [followed, setFollowed] = useState<Followed>(() =>
    Object.fromEntries(initialFollowed.map((t) => [t.nation_code, t.is_primary])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  function requireAuth(): boolean {
    if (!isAuthed) {
      window.location.href = "/login?next=/world-cup-2026";
      return false;
    }
    return true;
  }

  async function toggle(team: WCTeam) {
    if (!requireAuth()) return;
    const code = team.code;
    const isFollowed = code in followed;
    setBusy(code);
    // optimistic
    setFollowed((prev) => {
      const next = { ...prev };
      if (isFollowed) delete next[code];
      else next[code] = Object.keys(prev).length === 0; // first follow becomes primary
      return next;
    });
    try {
      if (isFollowed) {
        await fetch(`/api/world-cup/teams?nation_code=${encodeURIComponent(code)}`, { method: "DELETE" });
      } else {
        await fetch("/api/world-cup/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nation_code: code, is_primary: Object.keys(followed).length === 0 }),
        });
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function makePrimary(code: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!requireAuth()) return;
    setBusy(code);
    setFollowed((prev) => {
      const next: Followed = {};
      for (const k of Object.keys(prev)) next[k] = k === code;
      return next;
    });
    try {
      await fetch("/api/world-cup/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nation_code: code, is_primary: true }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {CONFEDERATION_ORDER.map((conf) => {
        const teams = WC_TEAMS.filter((t) => t.confederation === conf);
        if (teams.length === 0) return null;
        return (
          <div key={conf}>
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(239,227,206,0.45)",
                marginBottom: 8,
              }}
            >
              {CONF_LABEL[conf] ?? conf}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {teams.map((team) => {
                const on = team.code in followed;
                const primary = followed[team.code] === true;
                const accent = teamColor(team);
                return (
                  <button
                    key={team.code}
                    onClick={() => toggle(team)}
                    disabled={busy === team.code}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px 6px 8px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: on ? "#0A0A06" : PARCHMENT,
                      background: on ? accent : "rgba(255,255,255,0.04)",
                      border: `1px solid ${on ? accent : "rgba(255,255,255,0.09)"}`,
                      opacity: busy === team.code ? 0.6 : 1,
                      transition: "background 160ms ease, color 160ms ease",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>{team.flag}</span>
                    <span>{team.name}</span>
                    {on ? (
                      <span
                        role="button"
                        onClick={(e) => makePrimary(team.code, e)}
                        title={primary ? "Your primary team" : "Set as primary"}
                        style={{ display: "inline-flex", marginLeft: 1 }}
                      >
                        <Star
                          size={13}
                          fill={primary ? "#0A0A06" : "none"}
                          style={{ color: "#0A0A06" }}
                        />
                      </span>
                    ) : (
                      <Plus size={13} style={{ opacity: 0.55 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!isAuthed && (
        <p style={{ fontSize: "0.72rem", color: "rgba(239,227,206,0.5)" }}>
          <Check size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
          Sign in to save the teams you&apos;re rooting for.
        </p>
      )}
    </div>
  );
}
