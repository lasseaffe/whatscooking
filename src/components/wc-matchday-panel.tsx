"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ChevronUp, ChevronDown } from "lucide-react";

type Fixture = {
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

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

function formatKickoff(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function ScoreBadge({ fixture }: { fixture: Fixture }) {
  const played = fixture.home_score !== null && fixture.away_score !== null;
  if (played) {
    return (
      <span style={{ color: "#F4A261", fontWeight: 800, fontSize: "0.85rem" }}>
        {fixture.home_score} – {fixture.away_score}
      </span>
    );
  }
  return (
    <span style={{ color: "rgba(239,227,206,0.5)", fontSize: "0.7rem" }}>
      {formatKickoff(fixture.match_date)}
    </span>
  );
}

export function WcMatchdayPanel() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  async function fetchFixtures() {
    try {
      const res = await fetch("/api/world-cup/fixtures?today=1");
      const json = await res.json();
      const today = (json.fixtures ?? []) as Fixture[];
      setFixtures(today);
      setVisible(today.length > 0);
    } catch {
      // silently ignore — panel stays hidden
    }
  }

  useEffect(() => {
    fetchFixtures();
    const interval = setInterval(() => {
      if (expanded) fetchFixtures();
    }, 60_000);
    return () => clearInterval(interval);
  }, [expanded]);

  if (!visible) return null;

  const matchDay = fixtures[0]?.match_day ?? 1;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "480px",
        zIndex: 50,
        borderRadius: expanded ? "20px" : "999px",
        background: "rgba(10,6,3,0.92)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(244,162,97,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        overflow: "hidden",
        transition: "border-radius 250ms ease",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#EFE3CE",
        }}
      >
        <Trophy style={{ width: 16, height: 16, color: "#F4A261", flexShrink: 0 }} />
        <span style={{ fontSize: "0.78rem", fontWeight: 700, flex: 1, textAlign: "left" }}>
          Matchday {matchDay} · {fixtures.length} match{fixtures.length !== 1 ? "es" : ""} today
        </span>
        {expanded
          ? <ChevronDown style={{ width: 16, height: 16, opacity: 0.5 }} />
          : <ChevronUp style={{ width: 16, height: 16, opacity: 0.5 }} />
        }
      </button>

      {expanded && (
        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          {fixtures.map((f) => (
            <MatchCard key={f.id} fixture={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ fixture: f }: { fixture: Fixture }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          href={`/world-cup-2026#${f.home_code}`}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}
        >
          <img src={flagUrl(f.home_code)} alt={f.home_code} width={40} height={27} style={{ borderRadius: 4, objectFit: "cover" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#EFE3CE" }}>{f.home_code}</span>
        </Link>

        <ScoreBadge fixture={f} />

        <Link
          href={`/world-cup-2026#${f.away_code}`}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}
        >
          <img src={flagUrl(f.away_code)} alt={f.away_code} width={40} height={27} style={{ borderRadius: 4, objectFit: "cover" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#EFE3CE" }}>{f.away_code}</span>
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <WatchPartyButton fixture={f} />
        <PhotoUploadButton fixtureId={f.id} />
      </div>
    </div>
  );
}

function WatchPartyButton({ fixture }: { fixture: Fixture }) {
  const params = new URLSearchParams({
    theme: "worldcup",
    match: `${fixture.home_code}-${fixture.away_code}`,
    date: fixture.match_date,
    home: fixture.home_code,
    away: fixture.away_code,
  });
  return (
    <Link
      href={`/dinner-parties/new?${params}`}
      style={{
        flex: 1,
        textAlign: "center",
        padding: "7px 10px",
        borderRadius: 10,
        background: "rgba(200,82,42,0.2)",
        border: "1px solid rgba(200,82,42,0.3)",
        color: "#F4A261",
        fontSize: "0.7rem",
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      🍿 Watch Party
    </Link>
  );
}

function PhotoUploadButton({ fixtureId }: { fixtureId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          flex: 1,
          padding: "7px 10px",
          borderRadius: 10,
          background: "rgba(60,40,100,0.2)",
          border: "1px solid rgba(100,80,160,0.3)",
          color: "rgba(200,180,255,0.8)",
          fontSize: "0.7rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        📸 Share dish
      </button>
      {open && <WcPhotoUploadSheet fixtureId={fixtureId} onClose={() => setOpen(false)} />}
    </>
  );
}

function WcPhotoUploadSheet({ fixtureId, onClose }: { fixtureId: string; onClose: () => void }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fixture_id", fixtureId);
      fd.append("caption", caption);
      const res = await fetch("/api/world-cup/photos", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setLoading(false);
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#140E08",
          borderRadius: "20px 20px 0 0",
          padding: 24,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", color: "#A8D890", padding: "20px 0" }}>
            <p style={{ fontSize: "1.5rem" }}>🎉</p>
            <p style={{ fontWeight: 700, marginTop: 8 }}>Dish shared!</p>
            <button
              onClick={onClose}
              style={{ marginTop: 16, padding: "8px 20px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", color: "#EFE3CE", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontWeight: 800, color: "#EFE3CE", marginBottom: 16 }}>Share your match-day dish</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%", marginBottom: 12, color: "#EFE3CE" }}
            />
            <textarea
              placeholder="Caption (optional)"
              maxLength={120}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#EFE3CE",
                fontSize: "0.85rem",
                resize: "none",
                marginBottom: 12,
              }}
            />
            {error && <p style={{ color: "#F4A261", fontSize: "0.75rem", marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={submit}
                disabled={!file || loading}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: loading || !file ? "rgba(200,82,42,0.3)" : "#C8522A",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: !file || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Uploading…" : "Share"}
              </button>
              <button
                onClick={onClose}
                style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
