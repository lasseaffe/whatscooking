"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, ImageOff, FileQuestion, Bug, Filter } from "lucide-react";

interface Report {
  id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  issue_type: string | null;
  description: string | null;
  source_url: string | null;
  reporter_id: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  fix_file_path: string | null;
  fix_status: "applied" | "pending" | "pending_review" | null;
}

const ISSUE_ICONS: Record<string, React.ReactNode> = {
  faulty_image:       <ImageOff style={{ width: 14, height: 14 }} />,
  wrong_ingredients:  <FileQuestion style={{ width: 14, height: 14 }} />,
  wrong_instructions: <FileQuestion style={{ width: 14, height: 14 }} />,
  wrong_info:         <FileQuestion style={{ width: 14, height: 14 }} />,
  other:              <Bug style={{ width: 14, height: 14 }} />,
};

const ISSUE_LABEL: Record<string, string> = {
  faulty_image:       "Faulty Image",
  wrong_ingredients:  "Wrong Ingredients",
  wrong_instructions: "Wrong Instructions",
  wrong_info:         "Wrong Title / Info",
  other:              "Other",
};

function issueLabel(type: string | null): string {
  return type ? (ISSUE_LABEL[type] ?? type) : "Unknown";
}

function issueIcon(type: string | null) {
  return type ? (ISSUE_ICONS[type] ?? <AlertTriangle style={{ width: 14, height: 14 }} />) : null;
}

function FixPanel({ report, onResolved }: { report: Report; onResolved: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"image" | "instructions">("image");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  async function loadPendingDescription() {
    if (!report.recipe_id || report.fix_status !== "pending_review" || prefilled) return;
    try {
      const res = await fetch(`/api/admin/fix-description?recipeId=${report.recipe_id}`);
      if (res.ok) {
        const { content } = await res.json();
        setText(content);
        setPrefilled(true);
      }
    } catch { /* ignore */ }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !report.recipe_id) return;
    setBusy(true);
    setMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      const res = await fetch("/api/admin/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: report.recipe_id, reportId: report.id, type: "image", content }),
      });
      setBusy(false);
      if (res.ok) { setMsg("Image replaced"); onResolved(report.id); }
      else setMsg("Failed");
    };
    reader.readAsDataURL(file);
  }

  async function applyUserImage() {
    if (!report.recipe_id || !report.fix_file_path) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/apply-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId: report.recipe_id,
        reportId: report.id,
        type: "image",
        content: `already-applied:${report.fix_file_path}`,
      }),
    });
    setBusy(false);
    if (res.ok) { setMsg("Marked as applied"); onResolved(report.id); }
    else setMsg("Failed");
  }

  async function handleInstructionsSubmit() {
    if (!text.trim() || !report.recipe_id) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/apply-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: report.recipe_id, reportId: report.id, type: "instructions", content: text }),
    });
    setBusy(false);
    if (res.ok) { setMsg("Instructions updated"); onResolved(report.id); }
    else setMsg("Failed");
  }

  async function handleMarkResolved() {
    if (!report.recipe_id) return;
    setBusy(true);
    const res = await fetch("/api/admin/apply-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: report.recipe_id, reportId: report.id, type: "instructions", content: " " }),
    });
    setBusy(false);
    if (res.ok) onResolved(report.id);
  }

  if (report.resolved_at) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,180,80,0.12)", color: "#4CAF50" }}>
        Resolved
      </span>
    );
  }

  const hasPendingReview = report.fix_status === "pending_review" && !!report.fix_file_path;
  const hasApplied = report.fix_status === "applied";

  return (
    <div>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) loadPendingDescription(); }}
        className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
        style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}
      >
        {open ? "Cancel" : "Fix"}
      </button>

      {open && (
        <div className="mt-3 p-3 rounded-xl space-y-3" style={{ background: "rgba(42,24,8,0.4)", border: "1px solid rgba(58,36,22,0.5)" }}>
          <div className="flex gap-2">
            {(["image", "instructions"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="text-xs px-2 py-1 rounded-full font-semibold transition-all"
                style={{
                  background: mode === m ? "rgba(200,82,42,0.2)" : "transparent",
                  color: mode === m ? "#C8522A" : "#6B4E36",
                  border: "1px solid rgba(58,36,22,0.4)",
                }}
              >
                {m === "image" ? "Replace Image" : "Fix Instructions"}
              </button>
            ))}
            <button
              type="button"
              onClick={handleMarkResolved}
              disabled={busy}
              className="text-xs px-2 py-1 rounded-full font-semibold ml-auto"
              style={{ color: "#4A3020", border: "1px solid rgba(58,36,22,0.3)" }}
            >
              Mark Resolved
            </button>
          </div>

          {mode === "image" ? (
            <div className="space-y-2">
              {hasApplied && (
                <div className="rounded-lg p-2 text-xs" style={{ background: "rgba(0,180,80,0.1)", color: "#4CAF50" }}>
                  ✓ User image already applied to disk. Click below to mark resolved in Supabase.
                  <button
                    type="button"
                    onClick={applyUserImage}
                    disabled={busy}
                    className="block mt-1 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(0,180,80,0.2)", color: "#4CAF50", border: "1px solid rgba(0,180,80,0.3)" }}
                  >
                    {busy ? "Saving..." : "Mark Applied"}
                  </button>
                </div>
              )}
              <label className="block cursor-pointer">
                <span className="text-xs" style={{ color: "#8A6A4A" }}>Upload replacement image (.jpg / .png)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={busy} className="mt-1 block text-xs w-full" />
              </label>
            </div>
          ) : (
            <div>
              {hasPendingReview && !prefilled && (
                <p className="text-xs mb-1" style={{ color: "#8A6A4A" }}>
                  Loading user-submitted correction…
                </p>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Step 1: ...\nStep 2: ..."}
                rows={5}
                className="w-full text-xs p-2 rounded-lg resize-none"
                style={{ background: "rgba(18,12,7,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.5)" }}
              />
              <button
                type="button"
                onClick={handleInstructionsSubmit}
                disabled={busy || !text.trim()}
                className="mt-2 text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "rgba(200,82,42,0.2)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}
              >
                {busy ? "Saving..." : "Apply Instructions"}
              </button>
            </div>
          )}

          {msg && <p className="text-xs" style={{ color: msg === "Failed" ? "#e74c3c" : "#4CAF50" }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}

export function ReportsClient({ reports }: { reports: Report[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  function handleResolved(id: string) {
    setResolvedIds((prev) => new Set([...prev, id]));
  }

  const issueTypes = useMemo(() => {
    const types = new Set(reports.map((r) => r.issue_type ?? "other"));
    return ["all", ...Array.from(types)];
  }, [reports]);

  const [userFixOnly, setUserFixOnly] = useState(false);

  const grouped = useMemo(() => {
    let filtered = filterType === "all" ? reports : reports.filter((r) => (r.issue_type ?? "other") === filterType);
    if (userFixOnly) filtered = filtered.filter((r) => !!r.fix_file_path);
    const map: Record<string, Report[]> = {};
    for (const r of filtered) {
      const key = r.issue_type ?? "other";
      (map[key] ??= []).push(r);
    }
    return map;
  }, [reports, filterType, userFixOnly]);

  return (
    <div
      className="min-h-screen px-6 py-8 max-w-4xl mx-auto"
      style={{ color: "#EFE3CE" }}
    >
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity mb-5"
          style={{ color: "#B07D56" }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Discover
        </Link>
        <h1
          className="font-bold mb-1"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "2rem", color: "#EFE3CE" }}
        >
          Recipe Bug Reports
        </h1>
        <p className="text-sm" style={{ color: "#6B4E36" }}>
          {reports.length} total report{reports.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Filter style={{ width: 14, height: 14, color: "#6B4E36", marginTop: 2 }} />
        {issueTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filterType === type ? "rgba(200,82,42,0.2)" : "rgba(42,24,8,0.5)",
              color: filterType === type ? "#C8522A" : "#8A6A4A",
              border: filterType === type ? "1px solid rgba(200,82,42,0.4)" : "1px solid rgba(58,36,22,0.5)",
            }}
          >
            {type !== "all" && issueIcon(type)}
            {type === "all" ? `All (${reports.length})` : `${issueLabel(type)} (${reports.filter((r) => (r.issue_type ?? "other") === type).length})`}
          </button>
        ))}
        <button
          key="user-fix"
          type="button"
          onClick={() => setUserFixOnly((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: userFixOnly ? "rgba(200,82,42,0.2)" : "rgba(42,24,8,0.5)",
            color: userFixOnly ? "#C8522A" : "#8A6A4A",
            border: userFixOnly ? "1px solid rgba(200,82,42,0.4)" : "1px solid rgba(58,36,22,0.5)",
          }}
        >
          📎 User Submitted ({reports.filter((r) => !!r.fix_file_path).length})
        </button>
      </div>

      {/* Grouped sections */}
      {Object.keys(grouped).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center gap-3"
          style={{ background: "rgba(18,12,7,0.4)", border: "1px dashed rgba(58,36,22,0.5)" }}
        >
          <AlertTriangle style={{ width: 28, height: 28, color: "#4A3020" }} />
          <p style={{ color: "#6B4E36" }}>No reports found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: "#C8522A" }}>{issueIcon(type)}</span>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#C8522A" }}>
                  {issueLabel(type)}
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(200,82,42,0.12)", color: "#C8522A" }}
                >
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="px-5 py-4 rounded-xl"
                    style={{
                      background: "rgba(18,12,7,0.5)",
                      border: "1px solid rgba(42,24,8,0.6)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                      <div>
                        {r.recipe_id ? (
                          <Link
                            href={`/recipes/${r.recipe_id}`}
                            className="font-semibold text-sm hover:opacity-80 transition-opacity"
                            style={{ color: "#EFE3CE" }}
                          >
                            {r.recipe_name ?? r.recipe_id}
                          </Link>
                        ) : (
                          <span className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>
                            {r.recipe_name ?? "Unknown recipe"}
                          </span>
                        )}
                      </div>
                      <time className="text-xs shrink-0" style={{ color: "#4A3020" }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </time>
                    </div>

                    {r.description && (
                      <p className="text-sm leading-relaxed" style={{ color: "#8A6A4A" }}>
                        {r.description}
                      </p>
                    )}

                    {r.source_url && (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs hover:opacity-80 truncate max-w-xs"
                        style={{ color: "#4A3020" }}
                      >
                        {r.source_url}
                      </a>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                      <FixPanel
                        report={{ ...r, resolved_at: resolvedIds.has(r.id) ? new Date().toISOString() : r.resolved_at ?? null, resolved_by: r.resolved_by ?? null }}
                        onResolved={handleResolved}
                      />
                      {r.fix_file_path && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(200,82,42,0.12)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.25)" }}
                        >
                          {r.fix_status === "applied" ? "✓ User image applied" : "📎 User fix attached"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
