"use client";

import { useState } from "react";
import { useStream } from "./use-stream";
import { StreamLog } from "./stream-log";

export function ImageAuditPanel({ adminSecret }: { adminSecret: string }) {
  const [fixBroken, setFixBroken] = useState(false);
  const [limit, setLimit] = useState(500);
  const { lines, running, run } = useStream("/api/admin/audit-images", adminSecret);

  const doneEvent = lines.find((l) => l.event === "done");

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🖼️ Image Audit
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        HEAD-checks all recipe image URLs and flags 404s. Optionally clears broken URLs so the hero image falls back gracefully.
      </p>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Limit</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg px-3 py-2 text-sm w-24"
            style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm cursor-pointer" style={{ color: "rgba(176,125,86,0.7)" }}>
          <input type="checkbox" checked={fixBroken} onChange={(e) => setFixBroken(e.target.checked)} />
          Auto-clear broken URLs
        </label>
      </div>

      <button
        onClick={() => run({ limit, fixBroken })}
        disabled={running}
        className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
        style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
      >
        {running ? "Auditing…" : "Run Audit"}
      </button>

      {doneEvent && (
        <div className="mt-4 flex gap-4 text-sm">
          <span style={{ color: "#7AC870" }}>✓ OK: {String(doneEvent.ok ?? 0)}</span>
          <span style={{ color: "#E85D40" }}>✗ Broken: {String(doneEvent.broken ?? 0)}</span>
          <span style={{ color: "#88B8D8" }}>⏱ Timeout: {String(doneEvent.timeouts ?? 0)}</span>
        </div>
      )}

      <StreamLog lines={lines} />
    </div>
  );
}
