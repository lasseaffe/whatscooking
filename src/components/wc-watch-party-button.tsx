"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Popcorn, Users, Plus, Check } from "lucide-react";

type Squad = { id: string; name: string };

const PARCHMENT = "#EFE3CE";
const SAFFRON = "#F4A261";

export function WcWatchPartyButton({ fixtureId }: { fixtureId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          background: "#C8522A",
          color: "#fff",
          fontSize: "0.78rem",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
        }}
      >
        <Popcorn size={15} /> Start a watch party for this match
      </button>
      {open && <WatchPartySheet fixtureId={fixtureId} onClose={() => setOpen(false)} router={router} />}
    </>
  );
}

function WatchPartySheet({
  fixtureId,
  onClose,
  router,
}: {
  fixtureId: string;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [squads, setSquads] = useState<Squad[] | null>(null);
  const [choice, setChoice] = useState<string>("solo"); // "solo" | squadId | "new"
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load squads on first open.
  if (squads === null) {
    setSquads([]); // guard against re-fetch
    fetch("/api/kitchen/groups")
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((json) => json?.groups && setSquads(json.groups.map((g: Squad) => ({ id: g.id, name: g.name }))))
      .catch(() => {});
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      let kitchenGroupId: string | null = null;

      if (choice === "new") {
        if (!newName.trim()) {
          setError("Name your squad first");
          setBusy(false);
          return;
        }
        const res = await fetch("/api/kitchen/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim(), description: "World Cup watch squad" }),
        });
        if (res.status === 401) return void (window.location.href = "/login?next=/world-cup-2026");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not create squad");
        kitchenGroupId = json.group.id;
      } else if (choice !== "solo") {
        kitchenGroupId = choice;
      }

      const res = await fetch("/api/world-cup/watch-parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixture_id: fixtureId, kitchen_group_id: kitchenGroupId }),
      });
      if (res.status === 401) return void (window.location.href = "/login?next=/world-cup-2026");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create watch party");
      router.push(`/dinner-parties/${json.party_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const optionStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "11px 13px",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    background: active ? "rgba(244,162,97,0.14)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(244,162,97,0.4)" : "rgba(255,255,255,0.08)"}`,
    color: PARCHMENT,
    fontSize: "0.82rem",
    fontWeight: 600,
  });

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div style={{ width: "100%", maxWidth: 480, background: "#140E08", borderRadius: "20px 20px 0 0", padding: 22, border: "1px solid rgba(255,255,255,0.08)" }}>
        <h3 style={{ fontWeight: 800, color: PARCHMENT, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Popcorn size={18} style={{ color: SAFFRON }} /> Watch this one together
        </h3>
        <p style={{ fontSize: "0.76rem", color: "rgba(239,227,206,0.5)", marginBottom: 16 }}>
          We&apos;ll create the event with a ready-made matchday menu. Pick who&apos;s coming.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setChoice("solo")} style={optionStyle(choice === "solo")}>
            <Check size={16} style={{ opacity: choice === "solo" ? 1 : 0.25, color: SAFFRON }} /> Just me for now
          </button>

          {(squads ?? []).map((s) => (
            <button key={s.id} onClick={() => setChoice(s.id)} style={optionStyle(choice === s.id)}>
              <Users size={16} style={{ color: SAFFRON, opacity: choice === s.id ? 1 : 0.4 }} /> {s.name}
            </button>
          ))}

          <button onClick={() => setChoice("new")} style={optionStyle(choice === "new")}>
            <Plus size={16} style={{ color: SAFFRON, opacity: choice === "new" ? 1 : 0.4 }} /> New watch squad
          </button>
          {choice === "new" && (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Squad name (e.g. The Group Chat)"
              maxLength={60}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 12px", color: PARCHMENT, fontSize: "0.84rem" }}
            />
          )}
        </div>

        {error && <p style={{ color: SAFFRON, fontSize: "0.75rem", marginBottom: 10 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={create}
            disabled={busy}
            style={{ flex: 1, padding: "11px 16px", borderRadius: 12, background: busy ? "rgba(200,82,42,0.4)" : "#C8522A", border: "none", color: "#fff", fontWeight: 800, fontSize: "0.84rem", cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "Creating…" : "Create watch party"}
          </button>
          <button onClick={onClose} style={{ padding: "11px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
