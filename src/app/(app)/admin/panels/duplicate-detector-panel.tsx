"use client";

import { useState } from "react";

type DupePair = {
  a: { id: string; title: string; source: string | null };
  b: { id: string; title: string; source: string | null };
  similarity: number;
};

export function DuplicateDetectorPanel({ adminSecret }: { adminSecret: string }) {
  const [threshold, setThreshold] = useState(85);
  const [pairs, setPairs] = useState<DupePair[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  async function scan() {
    setLoading(true);
    setPairs([]);
    const res = await fetch("/api/admin/find-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ threshold: threshold / 100, limit: 2000 }),
    });
    const data = await res.json();
    setPairs(data.pairs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  async function deleteRecipe(id: string) {
    setDeleting(id);
    await fetch("/api/admin/find-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ deleteId: id }),
    });
    setPairs((prev) => prev.filter((p) => p.a.id !== id && p.b.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🔍 Duplicate Detector
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        Finds recipes with near-identical titles using trigram similarity. Adjust the threshold to control sensitivity.
      </p>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>
            Similarity threshold: {threshold}%
          </label>
          <input
            type="range"
            min={70}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-40"
          />
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </div>

      {total > 0 && (
        <p className="text-xs mb-3" style={{ color: "rgba(176,125,86,0.5)" }}>
          Scanned {total} recipes — found {pairs.length} potential duplicates
        </p>
      )}

      {pairs.length > 0 && (
        <div className="flex flex-col gap-2" style={{ maxHeight: 420, overflowY: "auto" }}>
          {pairs.map((pair, i) => (
            <div
              key={i}
              className="rounded-xl p-3 text-xs"
              style={{ background: "rgba(26,18,8,0.6)", border: "1px solid rgba(58,36,22,0.4)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div style={{ color: "#C8A882", fontWeight: 600 }}>{pair.a.title}</div>
                  <div style={{ color: "rgba(176,125,86,0.5)" }}>vs.</div>
                  <div style={{ color: "#C8A882", fontWeight: 600 }}>{pair.b.title}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="font-bold text-sm mb-1"
                    style={{ color: pair.similarity >= 95 ? "#E85D40" : pair.similarity >= 90 ? "#E8A820" : "#88B8D8" }}
                  >
                    {pair.similarity}%
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => deleteRecipe(pair.b.id)}
                      disabled={deleting === pair.b.id}
                      className="px-2 py-1 rounded text-xs font-bold disabled:opacity-50"
                      style={{ background: "rgba(232,93,64,0.2)", color: "#E85D40", border: "1px solid rgba(232,93,64,0.3)" }}
                    >
                      {deleting === pair.b.id ? "…" : "Delete B"}
                    </button>
                    <button
                      onClick={() => deleteRecipe(pair.a.id)}
                      disabled={deleting === pair.a.id}
                      className="px-2 py-1 rounded text-xs font-bold disabled:opacity-50"
                      style={{ background: "rgba(232,93,64,0.15)", color: "#E85D40", border: "1px solid rgba(232,93,64,0.2)" }}
                    >
                      {deleting === pair.a.id ? "…" : "Delete A"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <span style={{ color: "rgba(176,125,86,0.4)" }}>A: {pair.a.source ?? "—"}</span>
                <span style={{ color: "rgba(176,125,86,0.4)" }}>B: {pair.b.source ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && total > 0 && pairs.length === 0 && (
        <p className="text-sm" style={{ color: "#7AC870" }}>No duplicates found at {threshold}% threshold.</p>
      )}
    </div>
  );
}
