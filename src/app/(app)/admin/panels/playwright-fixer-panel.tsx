"use client";

import { useState } from "react";
import { StreamLog } from "./stream-log";
import type { StreamLine } from "./use-stream";

export function PlaywrightFixerPanel({ adminSecret }: { adminSecret: string }) {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [running, setRunning] = useState(false);
  const [limit, setLimit] = useState(20);

  async function runFixer() {
    setLines([]);
    setRunning(true);
    try {
      const res = await fetch("/api/admin/playwright-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ limit }),
      });
      if (!res.ok || !res.body) {
        setLines([{ event: "error", message: `HTTP ${res.status}` }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.trim()) continue;
          try { setLines((prev) => [...prev, JSON.parse(part)]); } catch { /* skip */ }
        }
      }
    } catch (e) {
      setLines([{ event: "error", message: String(e) }]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🎭 Playwright Fixer
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        Processes pending bug reports using Playwright browser automation — fixes broken images, bad data, and missing content via live page scraping.
      </p>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Max reports</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg px-3 py-2 text-sm w-24"
            style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
          />
        </div>
      </div>

      <button
        onClick={runFixer}
        disabled={running}
        className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
        style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
      >
        {running ? "Running…" : "Run Playwright Fix"}
      </button>

      <StreamLog lines={lines} />
    </div>
  );
}
