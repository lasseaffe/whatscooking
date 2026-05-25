"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";

interface Props {
  recipeId: string;
  initialTitle: string;
  initialDescription?: string | null;
  iconSize?: number;
  className?: string;
  style?: React.CSSProperties;
  onSaved?: (title: string, description: string) => void;
}

export function EditRecipeButton({
  recipeId,
  initialTitle,
  initialDescription,
  iconSize = 13,
  className,
  style,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Keep local state in sync if parent re-renders with new data
  useEffect(() => { setTitle(initialTitle); }, [initialTitle]);
  useEffect(() => { setDescription(initialDescription ?? ""); }, [initialDescription]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      if (res.ok) {
        onSaved?.(title.trim(), description.trim());
        setStatus("done");
        setTimeout(() => { setOpen(false); setStatus("idle"); }, 1200);
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  function openModal(e: React.MouseEvent | React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Edit recipe"
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
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,120,42,0.85)";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.40)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
        }}
      >
        <Pencil style={{ width: iconSize, height: iconSize }} />
      </button>

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pencil style={{ width: 15, height: 15, color: "#C8782A" }} />
                <h3 className="font-black text-sm" style={{ color: "#EFE3CE" }}>Edit recipe</h3>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: "#2A1808", color: "#8A6A4A" }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#8A6A4A" }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={160}
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border"
                  style={{ borderColor: "#3A2416", background: "#161009", color: "#EFE3CE" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#8A6A4A" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={400}
                  rows={3}
                  placeholder="Short description…"
                  className="w-full rounded-xl px-4 py-2.5 text-sm resize-none outline-none border"
                  style={{ borderColor: "#3A2416", background: "#161009", color: "#EFE3CE" }}
                />
              </div>
              <button
                type="submit"
                disabled={status !== "idle"}
                className="w-full py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-70"
                style={
                  status === "done"
                    ? { background: "#4A7A4A", color: "#fff" }
                    : { background: "#C8782A", color: "#fff" }
                }
              >
                {status === "idle"   && "Save changes"}
                {status === "saving" && "Saving…"}
                {status === "done"   && "✓ Saved!"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
