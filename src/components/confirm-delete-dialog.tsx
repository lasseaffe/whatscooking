"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#fff" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#FEE2E2" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#DC2626" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base leading-snug" style={{ color: "#1F1F1F" }}>
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B5B52" }}>
                {description}
              </p>
            )}
          </div>
          <button onClick={onCancel} className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#A69180" }} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E8D4C0", color: "#6B5B52" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: "#DC2626", color: "#fff" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
