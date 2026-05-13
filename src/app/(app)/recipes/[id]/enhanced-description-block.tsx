"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { EnhancedDescription, RecipeIngredient } from "@/lib/types";
import { EnhancedDescriptionCard } from "@/components/recipe/EnhancedDescriptionCard";
import { EnhanceDescriptionModal } from "@/components/recipe/EnhanceDescriptionModal";

interface Props {
  recipeId: string;
  title: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  plainDescription: string;
  initialEnhanced: EnhancedDescription | null;
  isOwner: boolean;
}

export function EnhancedDescriptionBlock({
  recipeId,
  title,
  ingredients,
  instructions,
  plainDescription,
  initialEnhanced,
  isOwner,
}: Props) {
  const [enhanced, setEnhanced] = useState<EnhancedDescription | null>(initialEnhanced);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function persist(next: EnhancedDescription) {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/recipes/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipeId, description_enhanced: next }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data?.error ?? "Save failed"); return false; }
      setEnhanced(next);
      return true;
    } catch (e) {
      setSaveError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Owner with no enhancement yet -> show CTA
  if (!enhanced && isOwner) {
    return (
      <div className="mt-3">
        {plainDescription?.trim() && (
          <p className="text-base italic leading-relaxed mb-3" style={{ color: "#7A5A40", maxWidth: "44ch" }}>
            {plainDescription}
          </p>
        )}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: "rgba(244,162,97,0.12)", color: "#F4A261", border: "1px solid rgba(244,162,97,0.35)" }}
        >
          <Sparkles className="w-3 h-3" />
          {plainDescription?.trim() ? "Enhance description" : "Write description from title + ingredients"}
        </button>
        {modalOpen && (
          <EnhanceDescriptionModal
            open
            title={title}
            ingredients={ingredients}
            instructions={instructions}
            originalDescription={plainDescription}
            onClose={() => setModalOpen(false)}
            onAccept={async (d) => {
              const ok = await persist(d);
              if (ok) setModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // Non-owner, no enhancement -> render plain italic description (or nothing)
  if (!enhanced && !isOwner) {
    if (!plainDescription?.trim()) return null;
    return (
      <p className="text-base italic leading-relaxed mt-3" style={{ color: "#7A5A40", maxWidth: "44ch" }}>
        {plainDescription}
      </p>
    );
  }

  // Enhanced exists -> render full card + (owner) re-enhance button
  return (
    <div className="mt-4">
      {enhanced && <EnhancedDescriptionCard description={enhanced} />}
      {isOwner && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "#2A2522", color: "#F4A261", border: "1px solid #3A3430" }}
          >
            <Sparkles className="w-3 h-3" /> Re-enhance description
          </button>
          {saving && <span className="text-xs" style={{ color: "#A69180" }}>Saving...</span>}
          {saveError && <span className="text-xs" style={{ color: "#F87171" }}>{saveError}</span>}
        </div>
      )}
      {modalOpen && (
        <EnhanceDescriptionModal
          open
          title={title}
          ingredients={ingredients}
          instructions={instructions}
          originalDescription={plainDescription}
          onClose={() => setModalOpen(false)}
          onAccept={async (d) => {
            const ok = await persist(d);
            if (ok) setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}