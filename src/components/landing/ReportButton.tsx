"use client";

import { useState, useRef, useEffect } from "react";
import { Flag } from "lucide-react";

const ISSUE_TYPES = [
  { value: "faulty_image", label: "Wrong / broken image" },
  { value: "wrong_info",   label: "Wrong title or info" },
  { value: "wrong_ingredients", label: "Wrong ingredients" },
  { value: "wrong_instructions", label: "Wrong instructions" },
  { value: "other",        label: "Other" },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]["value"];

interface Props {
  recipeId: string;
  recipeTitle: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
}

export function ReportButton({ recipeId, recipeTitle, sourceUrl, imageUrl }: Props) {
  void imageUrl;

  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>("faulty_image");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const fd = new FormData();
    fd.append("recipeId", recipeId);
    fd.append("recipeName", recipeTitle);
    fd.append("issueType", issueType);
    fd.append("description", detail);
    if (sourceUrl) fd.append("sourceUrl", sourceUrl);
    try {
      await fetch("/api/recipe-reports", { method: "POST", body: fd });
      setStatus("done");
      setTimeout(() => { setOpen(false); setStatus("idle"); setDetail(""); }, 1500);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div ref={ref} className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
      <button
        type="button"
        aria-label="Report issue with this recipe"
        onClick={() => setOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full"
        style={{ background: "rgba(0,0,0,0.55)", color: "#EFE3CE" }}
      >
        <Flag style={{ width: 13, height: 13 }} />
      </button>

      {open && (
        <div
          className="absolute top-8 right-0 w-56 rounded-xl p-3 space-y-2.5 shadow-xl"
          style={{ background: "#1A0F08", border: "1px solid rgba(200,120,42,0.3)", zIndex: 50 }}
        >
          {status === "done" ? (
            <p className="text-xs text-center py-2" style={{ color: "#4CAF50" }}>Reported ✓</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <p className="text-xs font-semibold" style={{ color: "#EFE3CE" }}>Report an issue</p>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full text-xs rounded-lg px-2 py-1.5"
                style={{ background: "#110900", color: "#EFE3CE", border: "1px solid rgba(200,120,42,0.25)" }}
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 200))}
                placeholder="More details… (optional)"
                rows={2}
                className="w-full text-xs rounded-lg px-2 py-1.5 resize-none"
                style={{ background: "#110900", color: "#EFE3CE", border: "1px solid rgba(200,120,42,0.2)" }}
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full text-xs font-semibold py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "#C8782A", color: "#F8F3E8" }}
              >
                {status === "submitting" ? "Sending…" : "Report"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
