"use client";

import { useEffect, useState } from "react";
import { useStream } from "./use-stream";
import { StreamLog } from "./stream-log";

type SparseRecipe = {
  id: string;
  title: string | null;
  source: string | null;
  source_url: string | null;
  instructionCount: number;
  ingredientCount: number;
  isPremium: boolean;
};

export function TemplateRepairPanel({ adminSecret }: { adminSecret: string }) {
  const [sparse, setSparse] = useState<SparseRecipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { lines, running, run } = useStream("/api/admin/template-repair", adminSecret);

  async function loadSparse() {
    setLoading(true);
    const res = await fetch("/api/admin/template-repair", {
      headers: { "x-admin-secret": adminSecret },
    });
    const data = await res.json();
    setSparse(data.sparse ?? []);
    setLoading(false);
  }

  useEffect(() => { loadSparse(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAll() {
    if (selected.size === sparse.length) setSelected(new Set());
    else setSelected(new Set(sparse.map((r) => r.id)));
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🗂️ Template Recipe Repair
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        Lists all recipes with fewer than 3 ingredients or 3 instructions. Select recipes and trigger AI extraction.
      </p>

      <div className="flex gap-3 mb-3">
        <button
          onClick={loadSparse}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.4)" }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <button
          onClick={toggleAll}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.4)" }}
        >
          {selected.size === sparse.length ? "Deselect All" : "Select All"}
        </button>
        <button
          onClick={() => run({ ids: Array.from(selected) })}
          disabled={running || selected.size === 0}
          className="px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
        >
          {running ? "Fixing…" : `Fix Selected (${selected.size})`}
        </button>
      </div>

      {sparse.length > 0 ? (
        <div
          className="rounded-xl overflow-hidden text-xs"
          style={{ border: "1px solid rgba(58,36,22,0.4)", maxHeight: 360, overflowY: "auto" }}
        >
          <table className="w-full">
            <thead style={{ background: "rgba(26,18,8,0.8)", position: "sticky", top: 0 }}>
              <tr>
                <th className="p-2 text-left w-8" style={{ color: "rgba(176,125,86,0.6)" }}></th>
                <th className="p-2 text-left" style={{ color: "rgba(176,125,86,0.6)" }}>Title</th>
                <th className="p-2 text-center" style={{ color: "rgba(176,125,86,0.6)" }}>Ingr.</th>
                <th className="p-2 text-center" style={{ color: "rgba(176,125,86,0.6)" }}>Steps</th>
                <th className="p-2 text-left" style={{ color: "rgba(176,125,86,0.6)" }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {sparse.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.id)) next.delete(r.id); else next.add(r.id);
                      return next;
                    });
                  }}
                  className="cursor-pointer transition-colors"
                  style={{
                    background: selected.has(r.id) ? "rgba(176,125,86,0.12)" : "transparent",
                    borderTop: "1px solid rgba(42,24,8,0.4)",
                  }}
                >
                  <td className="p-2">
                    <input type="checkbox" readOnly checked={selected.has(r.id)} />
                  </td>
                  <td className="p-2" style={{ color: "#C8A882" }}>{r.title ?? "(no title)"}</td>
                  <td className="p-2 text-center" style={{ color: r.ingredientCount < 3 ? "#E85D40" : "#7AC870" }}>{r.ingredientCount}</td>
                  <td className="p-2 text-center" style={{ color: r.instructionCount < 3 ? "#E85D40" : "#7AC870" }}>{r.instructionCount}</td>
                  <td className="p-2" style={{ color: "rgba(176,125,86,0.5)" }}>{r.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "rgba(176,125,86,0.5)" }}>
          {loading ? "Loading…" : "No sparse recipes found."}
        </p>
      )}

      <StreamLog lines={lines} />
    </div>
  );
}
