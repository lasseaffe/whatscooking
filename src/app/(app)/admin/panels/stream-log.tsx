"use client";

import type { StreamLine } from "./use-stream";

export function StreamLog({ lines }: { lines: StreamLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div
      className="mt-4 rounded-xl p-4 font-mono text-xs overflow-y-auto"
      style={{
        maxHeight: 380,
        background: "rgba(10,8,4,0.7)",
        border: "1px solid rgba(42,24,8,0.6)",
        color: "#A07850",
      }}
    >
      {lines.map((line, i) => {
        const event = line.event as string | undefined;
        const color =
          event === "done" ? "#7AC870" :
          event === "error" ? "#E85D40" :
          event === "start" ? "#88B8D8" :
          event === "item" ? (line.status === "updated" || line.status === "fixed" ? "#A8C890" : "#6B4A36") :
          "#7A5A38";
        return (
          <div key={i} style={{ color, lineHeight: 1.6 }}>
            {event === "progress" && (
              <span style={{ color: "#4A3020" }}>
                [{String(line.index ?? "")}/{String(line.of ?? "")}] {String(line.title ?? "")}
              </span>
            )}
            {event === "start" && (
              <span>▶ Start — {String(line.candidates ?? line.flagged ?? line.total ?? "?")} candidates, scope: {String(line.scope ?? "—")}</span>
            )}
            {event === "item" && (
              <span>
                {line.status === "updated" || line.status === "fixed" ? "✓" : line.status === "ai_error" ? "✗" : "·"}{" "}
                {String(line.title ?? line.id ?? "")} — {String(line.status ?? "")}
                {line.stepCount ? ` (${line.stepCount} steps)` : ""}
                {line.new ? ` → "${String(line.new).slice(0, 80)}…"` : ""}
              </span>
            )}
            {event === "done" && (
              <span>
                ✓ Done — rewritten/fixed: {String(line.rewritten ?? line.fixed ?? 0)}, failed: {String(line.failed ?? 0)}
              </span>
            )}
            {event === "error" && (
              <span>✗ Error: {String(line.message ?? "")} {line.detail ? `(${String(line.detail)})` : ""}</span>
            )}
            {event === "broken" && (
              <span>🔴 Broken: {String(line.title ?? "")} — {String(line.url ?? "")}</span>
            )}
            {event === "flagged" && (
              <span>⚠ {String(line.title ?? "")} — {String(((line.issues as unknown[]) ?? []).length)} issues</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
