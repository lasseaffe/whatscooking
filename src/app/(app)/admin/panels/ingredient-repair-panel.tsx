"use client";

import { useState } from "react";
import { useStream } from "./use-stream";
import { StreamLog } from "./stream-log";

export function IngredientRepairPanel({ adminSecret }: { adminSecret: string }) {
  const [dryRun, setDryRun] = useState(true);
  const { lines, running, run } = useStream("/api/admin/fix-ingredients", adminSecret);

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🔧 Ingredient Repair
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        Scans all recipes for ingredients with unrecognized units or null amounts, then uses AI to normalize them.
        Run "Scan Only" first to preview what will change.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "rgba(176,125,86,0.7)" }}>
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry run (no writes)
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => run({ scanOnly: true })}
          disabled={running}
          className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: "rgba(136,184,216,0.15)", color: "#88B8D8", border: "1px solid rgba(136,184,216,0.3)" }}
        >
          {running ? "Scanning…" : "Scan Only"}
        </button>
        <button
          onClick={() => run({ scanOnly: false, dryRun })}
          disabled={running}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
        >
          {running ? "Running…" : "Scan & Fix"}
        </button>
      </div>

      <StreamLog lines={lines} />
    </div>
  );
}
