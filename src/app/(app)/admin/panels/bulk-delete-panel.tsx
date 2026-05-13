"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Recipe = { id: string; title: string | null; source: string | null; cuisine_type: string | null };

export function BulkDeletePanel({ adminSecret: _adminSecret }: { adminSecret: string }) {
  const [source, setSource] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(0);

  async function search() {
    setLoading(true);
    setRecipes([]);
    setSelected(new Set());
    const supabase = createClient();
    let q = supabase.from("recipes").select("id, title, source, cuisine_type").limit(500);
    if (source) q = q.eq("source", source);
    if (cuisine) q = q.ilike("cuisine_type", `%${cuisine}%`);
    const { data } = await q;
    setRecipes(data ?? []);
    setLoading(false);
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} recipes? This cannot be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const ids = Array.from(selected);
    const { error } = await supabase.from("recipes").delete().in("id", ids);
    if (!error) {
      setDeleted((prev) => prev + ids.length);
      setRecipes((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
    }
    setDeleting(false);
  }

  function toggleAll() {
    if (selected.size === recipes.length) setSelected(new Set());
    else setSelected(new Set(recipes.map((r) => r.id)));
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "#E85D40" }}>
        🗑️ Bulk Delete
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        Filter recipes by source or cuisine, select, and delete. Irreversible — use with care.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="spoonacular, ai, dataset…"
            className="rounded-lg px-3 py-2 text-sm w-44"
            style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Cuisine (partial)</label>
          <input
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Italian, fusion…"
            className="rounded-lg px-3 py-2 text-sm w-44"
            style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={search}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            style={{ background: "rgba(42,24,8,0.8)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.5)" }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {recipes.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={toggleAll} className="text-xs" style={{ color: "rgba(176,125,86,0.7)" }}>
              {selected.size === recipes.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs" style={{ color: "rgba(176,125,86,0.5)" }}>
              {recipes.length} found, {selected.size} selected
            </span>
          </div>

          <div
            className="rounded-xl overflow-hidden mb-4 text-xs"
            style={{ border: "1px solid rgba(58,36,22,0.4)", maxHeight: 300, overflowY: "auto" }}
          >
            {recipes.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected((prev) => { const next = new Set(prev); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); return next; })}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                style={{
                  background: selected.has(r.id) ? "rgba(232,93,64,0.1)" : "rgba(26,18,8,0.4)",
                  borderBottom: "1px solid rgba(42,24,8,0.4)",
                  color: "#C8A882",
                }}
              >
                <input type="checkbox" readOnly checked={selected.has(r.id)} />
                <span className="flex-1">{r.title ?? "(no title)"}</span>
                <span style={{ color: "rgba(176,125,86,0.4)" }}>{r.source ?? "—"}</span>
                <span style={{ color: "rgba(176,125,86,0.4)" }}>{r.cuisine_type ?? "—"}</span>
              </div>
            ))}
          </div>

          <button
            onClick={deleteSelected}
            disabled={deleting || selected.size === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: "rgba(232,93,64,0.2)", color: "#E85D40", border: "1px solid rgba(232,93,64,0.4)" }}
          >
            {deleting ? "Deleting…" : `Delete ${selected.size} Recipes`}
          </button>

          {deleted > 0 && (
            <p className="text-xs mt-2" style={{ color: "#7AC870" }}>Deleted {deleted} recipes this session.</p>
          )}
        </>
      )}
    </div>
  );
}
