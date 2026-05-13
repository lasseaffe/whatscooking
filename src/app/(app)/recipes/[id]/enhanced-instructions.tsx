"use client";

import { useState } from "react";
import { Sparkles, Pencil } from "lucide-react";
import type { EnhancedStep, RecipeIngredient } from "@/lib/types";
import { EnhancedStepCard } from "@/components/recipe/EnhancedStepCard";
import { EnhancePreviewModal } from "@/components/recipe/EnhancePreviewModal";

interface Props {
  recipeId: string;
  title: string;
  ingredients: RecipeIngredient[];
  plainInstructions: string[];
  initialEnhanced: EnhancedStep[] | null;
  isOwner: boolean;
}

export function EnhancedInstructions({
  recipeId,
  title,
  ingredients,
  plainInstructions,
  initialEnhanced,
  isOwner,
}: Props) {
  const [enhanced, setEnhanced] = useState<EnhancedStep[] | null>(initialEnhanced);
  const [plain, setPlain] = useState<string[]>(plainInstructions);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<null | { mode: "single" | "all"; index: number }>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function persist(payload: { instructions_enhanced?: EnhancedStep[]; instructions?: string[] }) {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/recipes/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipeId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data?.error ?? "Save failed"); return false; }
      if (payload.instructions_enhanced) setEnhanced(payload.instructions_enhanced);
      if (payload.instructions) setPlain(payload.instructions);
      return true;
    } catch (e) {
      setSaveError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (!enhanced || enhanced.length === 0) {
    if (!isOwner) return null;
    return (
      <section className="px-6 lg:px-10 py-6">
        <div
          className="rounded-2xl border p-5 flex items-start gap-4"
          style={{ borderColor: "#3A2A20", background: "#1A1410" }}
        >
          <Sparkles className="w-6 h-6 mt-0.5 shrink-0" style={{ color: "#F4A261" }} />
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              Upgrade your instructions
            </h2>
            <p className="text-sm mt-1" style={{ color: "#A69180" }}>
              Run your steps through the chef-mentor pass to add the why, sensory cues, pro moves, and visual hints.
            </p>
            <button
              type="button"
              disabled={plain.length === 0}
              onClick={() => setModalMode({ mode: "all", index: 0 })}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "#F4A261", color: "#1F1A17" }}
            >
              <Sparkles className="w-4 h-4" /> Enhance recipe
            </button>
          </div>
        </div>
        {modalMode && (
          <EnhancePreviewModal
            open
            mode={modalMode.mode}
            title={title}
            ingredients={ingredients}
            originalInstructions={plain}
            initialStepIndex={modalMode.index}
            onClose={() => setModalMode(null)}
            onAcceptAll={async (steps, consolidatedPlain) => {
              const payload: { instructions_enhanced: EnhancedStep[]; instructions?: string[] } = { instructions_enhanced: steps };
              if (consolidatedPlain) payload.instructions = consolidatedPlain;
              const ok = await persist(payload);
              if (ok) setModalMode(null);
            }}
          />
        )}
      </section>
    );
  }

  return (
    <section className="px-6 lg:px-10 py-8" style={{ borderBottom: "1px solid rgba(42,24,8,0.5)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: "#F4A261" }} />
          <h2 className="text-xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Chef-mentor walkthrough
          </h2>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setModalMode({ mode: "all", index: 0 })}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "#2A2522", color: "#F4A261", border: "1px solid #3A3430" }}
          >
            <Pencil className="w-3 h-3" /> Re-enhance all
          </button>
        )}
      </div>

      <ol className="flex flex-col gap-3 m-0">
        {enhanced.map((step, i) => {
          const isActive = activeStep === i;
          const isDimmed = activeStep !== null && !isActive;
          return (
            <EnhancedStepCard
              key={i}
              step={step}
              index={i}
              isActive={isActive}
              isDimmed={isDimmed}
              onClick={() => setActiveStep((p) => (p === i ? null : i))}
              enhanceButton={
                isOwner ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalMode({ mode: "single", index: i });
                    }}
                    className="p-1.5 rounded-lg shrink-0"
                    style={{ background: "#2A2522", color: "#F4A261", border: "1px solid #3A3430" }}
                    aria-label="Re-enhance this step"
                    title="Re-enhance this step"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          );
        })}
      </ol>

      {saving && <p className="mt-3 text-xs" style={{ color: "#A69180" }}>Saving...</p>}
      {saveError && <p className="mt-3 text-xs" style={{ color: "#F87171" }}>{saveError}</p>}

      {modalMode && (
        <EnhancePreviewModal
          open
          mode={modalMode.mode}
          title={title}
          ingredients={ingredients}
          originalInstructions={plain}
          initialStepIndex={modalMode.index}
          onClose={() => setModalMode(null)}
          onAcceptOne={async (idx, step) => {
            const next = [...enhanced];
            next[idx] = step;
            const ok = await persist({ instructions_enhanced: next });
            if (ok) setModalMode(null);
          }}
          onAcceptAll={async (steps, consolidatedPlain) => {
            const payload: { instructions_enhanced: EnhancedStep[]; instructions?: string[] } = { instructions_enhanced: steps };
            if (consolidatedPlain) payload.instructions = consolidatedPlain;
            const ok = await persist(payload);
            if (ok) setModalMode(null);
          }}
        />
      )}
    </section>
  );
}