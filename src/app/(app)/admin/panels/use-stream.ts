"use client";

import { useState, useCallback } from "react";

export type StreamLine = Record<string, unknown> & { event?: string };

export function useStream(url: string, adminSecret: string) {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [running, setRunning] = useState(false);

  const run = useCallback(async (body: Record<string, unknown>) => {
    setLines([]);
    setRunning(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify(body),
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
          try { setLines((prev) => [...prev, JSON.parse(part)]); } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      setLines([{ event: "error", message: String(e) }]);
    } finally {
      setRunning(false);
    }
  }, [url, adminSecret]);

  return { lines, running, run };
}
