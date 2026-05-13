"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, RotateCw, Check, AlertCircle } from "lucide-react";
import type { EnhancedDescription, RecipeIngredient } from "@/lib/types";
import { EnhancedDescriptionCard } from "./EnhancedDescriptionCard";

interface Props {
  open: boolean;
  title: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  originalDescription: string;
  onClose: () => void;
  onAccept: (description: EnhancedDescription) => void;
}

type Status = "loading" | "ready" | "error";

export function EnhanceDescriptionModal({
  open,
  title,
  ingredients,
  instructions,
  originalDescription,
  onClose,
  onAccept,
}: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<EnhancedDescription | null>(null);

  useEffect(() => {
    if (!open) return;
    runEnhance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function runEnhance() {
    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    try {
      const res = await fetch("/api/recipes/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ingredients,
          instructions,
          description: originalDescription,
          target: "description",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.error ?? `Request failed ()`);
        return;
      }
      if (data.description) {
        setResult(data.description as EnhancedDescription);
        setStatus("ready");
      } else {
        setStatus("error");
        setErrorMsg("Unexpected response shape");
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg((e as Error).message);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#1F1A17", border: "1px solid #3A3430" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#3A3430" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: "#F4A261" }} />
            <h2 className="text-lg font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              Enhance description
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg"
            style={{ color: "#A69180" }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Sparkles className="w-8 h-8 animate-pulse" style={{ color: "#F4A261" }} />
              <p className="text-sm" style={{ color: "#A69180" }}>
                Researching cuisine, technique, and audience...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: "#7F1D1D", background: "#2A0F0F" }}>
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#F87171" }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#F87171" }}>Enhancement failed</p>
                <p className="text-xs mt-1" style={{ color: "#FCA5A5" }}>{errorMsg}</p>
                <button
                  type="button"
                  onClick={runEnhance}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: "#F87171", color: "#2A0F0F" }}
                >
                  <RotateCw className="w-3 h-3" /> Try again
                </button>
              </div>
            </div>
          )}

          {status === "ready" && result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Original */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8A6A4A" }}>
                  Original
                </p>
                <div className="rounded-xl border p-4" style={{ borderColor: "#3A3430", background: "#15110F" }}>
                  <p className="text-sm leading-relaxed italic" style={{ color: "#C9B89A", lineHeight: 1.7 }}>
                    {originalDescription?.trim() || "(empty - no description on file)"}
                  </p>
                </div>
              </div>

              {/* Enhanced */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#F4A261" }}>
                  <Sparkles className="w-3 h-3" /> Enhanced
                </p>
                <EnhancedDescriptionCard description={result} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "ready" && result && (
          <div className="px-5 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "#3A3430", background: "#15110F" }}>
            <button
              type="button"
              onClick={runEnhance}
              className="text-sm px-3 py-2 rounded-lg inline-flex items-center gap-1.5"
              style={{ background: "#2A2522", color: "#EFE3CE", border: "1px solid #3A3430" }}
            >
              <RotateCw className="w-4 h-4" /> Re-run
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-2 rounded-lg"
              style={{ background: "transparent", color: "#A69180", border: "1px solid #3A3430" }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => onAccept(result)}
              className="text-sm px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5"
              style={{ background: "#F4A261", color: "#1F1A17" }}
            >
              <Check className="w-4 h-4" /> Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}