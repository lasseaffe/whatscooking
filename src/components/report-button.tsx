"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

const ISSUE_TYPES = [
  { value: "faulty_image",      label: "🖼️  Faulty or missing image" },
  { value: "wrong_ingredients", label: "🥗  Wrong ingredients / amounts" },
  { value: "broken_link",       label: "🔗  Broken source link" },
  { value: "wrong_info",        label: "📋  Wrong title / info" },
  { value: "other",             label: "💬  Other problem" },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]["value"];

interface ReportButtonProps {
  recipeId: string;
  recipeName: string;
  /** Called immediately when the API auto-swaps a bad image — use to update local display */
  onImageSwapped?: (newUrl: string) => void;
  /** Extra class for the trigger button */
  className?: string;
  /** Inline style for the trigger button */
  style?: React.CSSProperties;
  /** Size of the trigger icon */
  iconSize?: number;
}

export function ReportButton({ recipeId, recipeName, onImageSwapped, className, style, iconSize = 13 }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>("faulty_image");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [swapped, setSwapped] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.append("recipeId", recipeId);
      fd.append("recipeName", recipeName);
      fd.append("issueType", issueType);
      fd.append("description", description);
      if (attachedFile) fd.append("file", attachedFile);

      const res = await fetch("/api/recipe-reports", { method: "POST", body: fd });
      if (res.ok && issueType === "faulty_image") {
        const json = await res.json() as { newImageUrl?: string };
        if (json.newImageUrl) {
          onImageSwapped?.(json.newImageUrl);
          setSwapped(true);
        }
      }
    } catch { /* fail silently for UX */ }
    setStatus("done");
    setTimeout(() => {
      setOpen(false);
      setStatus("idle");
      setDescription("");
      setAttachedFile(null);
      setSwapped(false);
    }, 1400);
  }

  function openModal(e: React.MouseEvent | React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  return (
    <>
      {/* Trigger — small ⚠ button */}
      <button
        type="button"
        aria-label="Report a problem with this recipe"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={openModal}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.40)",
          backdropFilter: "blur(4px)",
          color: "rgba(255,255,255,0.65)",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
          flexShrink: 0,
          ...style,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,82,42,0.85)";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.40)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
        }}
      >
        <AlertTriangle style={{ width: iconSize, height: iconSize }} />
      </button>

      {/* Modal — rendered in a portal to escape CSS transform stacking contexts */}
      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onPointerDown={(e) => { if (e.target === e.currentTarget) { e.stopPropagation(); setOpen(false); } }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8"
            style={{ background: "#1C1209" }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle style={{ width: 15, height: 15, color: "#C8522A" }} />
                <h3 className="font-black text-sm" style={{ color: "#EFE3CE" }}>
                  Report a problem
                </h3>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: "#2A1808", color: "#8A6A4A" }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <p className="text-xs mb-4 leading-snug" style={{ color: "#6B4E36" }}>
              <span style={{ color: "#8A6A4A" }}>Recipe: </span>
              <strong style={{ color: "#EFE3CE" }}>{recipeName}</strong>
            </p>

            {/* Issue type pills */}
            <div className="flex flex-col gap-1.5 mb-4">
              {ISSUE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={(e) => { e.stopPropagation(); setIssueType(t.value); setAttachedFile(null); }}
                  className="text-left px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all"
                  style={
                    issueType === t.value
                      ? { background: "#C8522A", color: "#fff", borderColor: "#C8522A" }
                      : { background: "transparent", color: "#8A6A4A", borderColor: "#3A2416" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Conditional file attachment */}
            {(issueType === "faulty_image" || issueType === "wrong_info") && (
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: "#8A6A4A" }}>
                  {issueType === "faulty_image"
                    ? "Attach replacement image (optional — we'll also try auto-fixing)"
                    : "Attach corrected title/description as .txt (optional)"}
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-2 rounded-xl text-xs font-semibold border border-dashed transition-all"
                  style={{
                    borderColor: attachedFile ? "#C8522A" : "#3A2416",
                    color: attachedFile ? "#C8522A" : "#6B4E36",
                    background: attachedFile ? "rgba(200,82,42,0.08)" : "transparent",
                  }}
                >
                  {attachedFile ? `✓ ${attachedFile.name}` : "Click to attach file"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={issueType === "faulty_image" ? "image/*" : ".txt,text/plain"}
                  className="hidden"
                  onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {/* Optional description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Extra details (optional)…"
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-xs resize-none outline-none border mb-4"
              style={{ borderColor: "#3A2416", background: "#161009", color: "#EFE3CE" }}
            />

            <button
              onClick={(e) => { e.stopPropagation(); submit(); }}
              disabled={status !== "idle"}
              className="w-full py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-70"
              style={
                status === "done"
                  ? { background: "#4A7A4A", color: "#fff" }
                  : { background: "#C8522A", color: "#fff" }
              }
            >
              {status === "idle"    && "Submit report"}
              {status === "sending" && "Sending…"}
              {status === "done" && swapped  && "✓ Image swapped — thanks!"}
              {status === "done" && !swapped && "✓ Report saved — thanks!"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
