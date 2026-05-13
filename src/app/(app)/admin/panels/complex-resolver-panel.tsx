"use client";

import { useState } from "react";

export function ComplexResolverPanel({ adminSecret }: { adminSecret: string }) {
  const [issue, setIssue] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [proposal, setProposal] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  async function resolve() {
    if (!issue.trim()) return;
    setRunning(true);
    setProposal(null);
    try {
      const res = await fetch("/api/admin/resolve-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ issue, recipeId: recipeId || null }),
      });
      const data = await res.json();
      setProposal(data.proposal ?? null);
      setTimestamp(data.timestamp ?? null);
    } catch (e) {
      setProposal(`Error: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🤖 Complex Issue Resolver
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(176,125,86,0.6)" }}>
        Describe a complex data or recipe problem. Claude analyzes it and proposes a fix. All results are appended to{" "}
        <code style={{ color: "#88B8D8" }}>logs/admin-complex-fixes.log</code>.
      </p>

      <div className="mb-3">
        <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Recipe ID (optional)</label>
        <input
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
          placeholder="uuid or leave blank"
          className="rounded-lg px-3 py-2 text-sm w-72"
          style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs mb-1" style={{ color: "rgba(176,125,86,0.7)" }}>Issue description</label>
        <textarea
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          rows={6}
          placeholder="Describe the problem in detail — what's wrong, what you've tried, what you expect..."
          className="rounded-xl px-4 py-3 text-sm w-full"
          style={{
            background: "rgba(42,24,8,0.6)",
            color: "#EFE3CE",
            border: "1px solid rgba(58,36,22,0.6)",
            resize: "vertical",
          }}
        />
      </div>

      <button
        onClick={resolve}
        disabled={running || !issue.trim()}
        className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
        style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
      >
        {running ? "Analyzing…" : "Resolve Issue"}
      </button>

      {proposal && (
        <div className="mt-5">
          {timestamp && (
            <p className="text-xs mb-2" style={{ color: "rgba(176,125,86,0.5)" }}>
              Logged at {new Date(timestamp).toLocaleString()} · check <code>logs/admin-complex-fixes.log</code>
            </p>
          )}
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: "rgba(10,8,4,0.7)",
              border: "1px solid rgba(136,184,216,0.2)",
              color: "#C8A882",
              whiteSpace: "pre-wrap",
              fontFamily: "'Libre Baskerville', Georgia, serif",
              lineHeight: 1.7,
              maxHeight: 480,
              overflowY: "auto",
            }}
          >
            {proposal}
          </div>
        </div>
      )}
    </div>
  );
}
