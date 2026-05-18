"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { EnhancedDescriptionCard } from "@/components/recipe/EnhancedDescriptionCard";
import { EnhanceDescriptionModal } from "@/components/recipe/EnhanceDescriptionModal";
import type { EnhancedDescription } from "@/lib/types";

interface EnhancedDescriptionBlockProps {
  recipeId: string;
  title: string;
  ingredients: { name: string; amount?: number; unit?: string }[];
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
}: EnhancedDescriptionBlockProps) {
  const [enhanced, setEnhanced] = useState<EnhancedDescription | null>(initialEnhanced);
  const [showModal, setShowModal] = useState(false);

  // If enhanced data exists, render the card. Otherwise render plain description + enhance button.
  if (enhanced) {
    return (
      <div className="space-y-4">
        <EnhancedDescriptionCard description={enhanced} />
        {isOwner && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-opacity hover:opacity-80"
            style={{ background: "rgba(176,125,86,0.12)", color: "#B07D56" }}
          >
            <Sparkles style={{ width: 12, height: 12 }} /> Re-enhance description
          </button>
        )}
        {showModal && (
          <EnhanceDescriptionModal
            open={showModal}
            title={title}
            ingredients={ingredients}
            instructions={instructions}
            originalDescription={plainDescription}
            onAccept={(newEnhanced) => {
              setEnhanced(newEnhanced);
              setShowModal(false);
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  // No enhanced data yet. Show plain description + enhance button.
  return (
    <div className="space-y-3">
      {plainDescription && (
        <p
          className="italic text-sm leading-relaxed"
          style={{ color: "#8A6A4A" }}
        >
          {plainDescription}
        </p>
      )}
      {isOwner && (
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-opacity hover:opacity-80"
          style={{ background: "rgba(176,125,86,0.12)", color: "#B07D56" }}
        >
          <Sparkles style={{ width: 12, height: 12 }} /> Enhance description
        </button>
      )}
      {showModal && (
        <EnhanceDescriptionModal
          open={showModal}
          title={title}
          ingredients={ingredients}
          instructions={instructions}
          originalDescription={plainDescription}
          onAccept={(newEnhanced) => {
            setEnhanced(newEnhanced);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}