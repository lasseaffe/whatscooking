"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, RotateCw, Check, ChevronLeft, ChevronRight, AlertCircle, Layers } from "lucide-react";
import type { EnhancedStep, RecipeIngredient } from "@/lib/types";
import { EnhancedStepCard } from "./EnhancedStepCard";

type Mode = "single" | "all";

interface Props {
  open: boolean;
  mode: Mode;
  title: string;
  ingredients: RecipeIngredient[];
  originalInstructions: string[];
  initialStepIndex?: number;
  onClose: () => void;
  onAcceptOne?: (index: number, step: EnhancedStep) => void;
  onAcceptAll?: (steps: EnhancedStep[], consolidatedPlain?: string[]) => void;
}

type Status = "loading" | "ready" | "error";

export function EnhancePreviewModal({
  open,
  mode,
  title,
  ingredients,
  originalInstructions,
  initialStepIndex = 0,
  onClose,
  onAcceptOne,
  onAcceptAll,
}: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  // Working steps = consolidated_steps if returned, else originalInstructions
  const [workingSteps, setWorkingSteps] = useState<string[]>([]);
  const [enhancedSteps, setEnhancedSteps] = useState<(EnhancedStep | null)[]>([]);
  const [consolidated, setConsolidated] = useState<string[] | null>(null);
  const [originalCount, setOriginalCount] = useState<number | null>(null);
  const [cursor, setCursor] = useState(initialStepIndex);

  useEffect(() => {
    if (!open) return;
    setStatus("loading");
    setErrorMsg("");
    setConsolidated(null);
    setOriginalCount(null);
    setWorkingSteps(originalInstructions);
    setEnhancedSteps(originalInstructions.map(() => null));
    setCursor(mode === "single" ? initialStepIndex : 0);
    runEnhance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function runEnhance() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const body: Record<string, unknown> = { title, ingredients, instructions: originalInstructions };
      if (mode === "single") body.step_index = initialStepIndex;
      const res = await fetch("/api/recipes/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      if (mode === "single" && data.step && typeof data.index === "number") {
        const next = originalInstructions.map(() => null) as (EnhancedStep | null)[];
        next[data.index] = data.step;
        setWorkingSteps(originalInstructions);
        setEnhancedSteps(next);
        setCursor(data.index);
      } else if (mode === "all" && Array.isArray(data.steps)) {
        const consolidatedList: string[] | undefined = Array.isArray(data.consolidated_steps) ? data.consolidated_steps : undefined;
        const working = consolidatedList ?? originalInstructions;
        setWorkingSteps(working);
        setEnhancedSteps(data.steps);
        setConsolidated(consolidatedList ?? null);
        setOriginalCount(typeof data.original_count === "number" ? data.original_count : null);
        setCursor(0);
      } else {
        setStatus("error");
        setErrorMsg("Unexpected response shape");
        return;
      }
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setErrorMsg((e as Error).message);
    }
  }

  function acceptCurrent() {
    const step = enhancedSteps[cursor];
    if (!step) return;
    onAcceptOne?.(cursor, step);
    if (mode === "single") onClose();
  }

  function acceptAll() {
    const full = enhancedSteps.filter((s): s is EnhancedStep => s !== null);
    if (full.length !== workingSteps.length) return;
    onAcceptAll?.(full, consolidated ?? undefined);
    onClose();
  }

  if (!open) return null;

  const total = workingSteps.length;
  const current = enhancedSteps[cursor];
  const allReady = mode === "all" && enhancedSteps.every((s) => s !== null);
  const showConsolidationBanner = mode === "all" && consolidated && originalCount && originalCount !== consolidated.length;

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
              {mode === "single" ? `Enhance step ${initialStepIndex + 1}` : "Enhance all steps"}
            </h2>
            {mode === "all" && status === "ready" && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#2A1A0F", color: "#F4A261" }}>
                {cursor + 1} / {total}
              </span>
            )}
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

        {/* Consolidation banner */}
        {showConsolidationBanner && status === "ready" && (
          <div
            className="flex items-start gap-3 px-5 py-3 border-b"
            style={{ borderColor: "#3A3430", background: "rgba(244,162,97,0.06)" }}
          >
            <Layers className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#F4A261" }} />
            <div className="flex-1 text-xs leading-relaxed" style={{ color: "#C9B89A" }}>
              <strong style={{ color: "#F4A261" }}>{originalCount} → {consolidated!.length} steps.</strong>{" "}
              Adjacent micro-steps were merged into coherent actions before enhancing. Accepting will replace your plain step list with the consolidated version.
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Sparkles className="w-8 h-8 animate-pulse" style={{ color: "#F4A261" }} />
              <p className="text-sm" style={{ color: "#A69180" }}>
                Enhancing {mode === "all" ? `${originalInstructions.length} steps` : "step"} with Claude...
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

          {status === "ready" && current && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Original (working = consolidated when present) */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8A6A4A" }}>
                  {consolidated ? "Consolidated" : "Original"}
                </p>
                <div className="rounded-xl border p-4" style={{ borderColor: "#3A3430", background: "#15110F" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#C9B89A", lineHeight: 1.7 }}>
                    {workingSteps[cursor]}
                  </p>
                </div>
              </div>

              {/* Enhanced */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#F4A261" }}>
                  <Sparkles className="w-3 h-3" /> Enhanced
                </p>
                <ol className="m-0">
                  <EnhancedStepCard step={current} index={cursor} />
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "ready" && (
          <div className="px-5 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: "#3A3430", background: "#15110F" }}>
            <div className="flex items-center gap-2">
              {mode === "all" && (
                <>
                  <button
                    type="button"
                    onClick={() => setCursor((c) => Math.max(0, c - 1))}
                    disabled={cursor === 0}
                    className="p-2 rounded-lg disabled:opacity-30"
                    style={{ background: "#2A2522", color: "#EFE3CE" }}
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCursor((c) => Math.min(total - 1, c + 1))}
                    disabled={cursor === total - 1}
                    className="p-2 rounded-lg disabled:opacity-30"
                    style={{ background: "#2A2522", color: "#EFE3CE" }}
                    aria-label="Next step"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
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
              {mode === "all" ? (
                <>
                  <button
                    type="button"
                    onClick={acceptCurrent}
                    className="text-sm px-3 py-2 rounded-lg inline-flex items-center gap-1.5"
                    style={{ background: "#2D7A4F", color: "#fff" }}
                  >
                    <Check className="w-4 h-4" /> Accept this step
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    disabled={!allReady}
                    className="text-sm px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                    style={{ background: "#F4A261", color: "#1F1A17" }}
                  >
                    <Check className="w-4 h-4" /> Accept all
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={acceptCurrent}
                  className="text-sm px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5"
                  style={{ background: "#F4A261", color: "#1F1A17" }}
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}