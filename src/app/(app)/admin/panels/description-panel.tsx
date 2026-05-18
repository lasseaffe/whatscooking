"use client";

import { useState } from "react";
import { useStream } from "./use-stream";
import { StreamLog } from "./stream-log";

type Scope = "missing" | "all" | "source:standard" | "source:premium" | "source:dataset";

export function DescriptionPanel({ adminSecret }: { adminSecret: string }) {
  const [scope, setScope] = useState<Scope>("missing");
  const [dryRun, setDryRun] = useState(true);
  const { lines, running, run } = useStream("/api/admin/fix-descriptions", adminSecret);

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        ✍️ Description Enhancer
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        AI-rewrites recipe descriptions in Ottolenghi / NYT Cooking editorial style.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
          >
            <option value="missing">Missing / bad only</option>
            <option value="all">All recipes</option>
            <option value="source:standard">Standard (Spoonacular/AI)</option>
            <option value="source:premium">Premium recipes</option>
            <option value="source:dataset">Dataset recipes</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-2" style={{ color: "rgba(176,125,86,0.7)" }}>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Dry run (preview only)
          </label>
        </div>
      </div>

      <button
        onClick={() => run({ scope, dryRun })}
        disabled={running}
        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
      >
        {running ? "Running…" : "Run Enhancer"}
      </button>

      <StreamLog lines={lines} />
    </div>
  );
}
