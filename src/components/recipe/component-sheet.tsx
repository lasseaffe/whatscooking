"use client";

import { useState } from "react";
import type { RecipeComponentWithRecipe } from "@/lib/types";
import { COMPONENT_TYPE_EMOJI, COMPONENT_TYPE_LABELS } from "@/lib/component-types";

interface Props {
  link: RecipeComponentWithRecipe | null;
  onClose: () => void;
  onOpenFull: (componentId: string) => void;
  onSave: (componentId: string) => void;
}

function scaleAmount(amount: number, multiplier: number): string {
  const scaled = amount * multiplier;
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
}

export function ComponentSheet({ link, onClose, onOpenFull, onSave }: Props) {
  const baseServings = link?.component.servings ?? 4;
  const [servings, setServings] = useState(baseServings);

  if (!link) return null;

  const { component } = link;
  const type = component.component_type ?? "sauce";
  const multiplier = servings / baseServings;

  function formatIngredient(ing: { name: string; amount?: number; unit?: string }) {
    if (!ing.amount) return `• ${ing.name}`;
    return `• ${scaleAmount(ing.amount, multiplier)}${ing.unit ?? ""} ${ing.name}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl p-5"
        style={{ background: "#1e140f", borderTop: "2px solid #c0521a" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-0.5 rounded mx-auto mb-4" style={{ background: "#555" }} />

        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{COMPONENT_TYPE_EMOJI[type]}</span>
          <div className="flex-1">
            <p className="font-bold text-base" style={{ color: "#ffe0cc" }}>
              {component.title}
            </p>
            <p className="text-xs" style={{ color: "#aaa" }}>
              {COMPONENT_TYPE_LABELS[type]}
            </p>
          </div>
          <button
            aria-label="✕"
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: "#888" }}
          >
            ✕
          </button>
        </div>

        {component.description && (
          <p className="text-sm mb-4 leading-relaxed" style={{ color: "#ccc" }}>
            {component.description}
          </p>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: "#888" }}>
            Servings
          </span>
          <button
            aria-label="−"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "#2d1e14", color: "#e87c3e", border: "1px solid #c0521a" }}
          >
            −
          </button>
          <span className="font-bold text-sm w-4 text-center" style={{ color: "#ffe0cc" }}>
            {servings}
          </span>
          <button
            aria-label="+"
            onClick={() => setServings((s) => s + 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "#2d1e14", color: "#e87c3e", border: "1px solid #c0521a" }}
          >
            +
          </button>
          {servings !== baseServings && (
            <span className="text-xs" style={{ color: "#888" }}>
              (base: {baseServings})
            </span>
          )}
        </div>

        <div className="rounded-lg p-3 mb-4" style={{ background: "#2d1e14" }}>
          {component.ingredients.slice(0, 4).map((ing, i) => (
            <p key={i} className="text-sm" style={{ color: "#ddd" }}>
              {formatIngredient(ing)}
            </p>
          ))}
          {component.ingredients.length > 4 && (
            <p className="text-xs mt-1" style={{ color: "#888" }}>
              + {component.ingredients.length - 4} more on full page
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSave(component.id)}
            className="flex-1 rounded-lg py-3 text-sm font-semibold"
            style={{ background: "#c0521a", color: "#ffe0cc" }}
          >
            Save to my components
          </button>
          <button
            onClick={() => onOpenFull(component.id)}
            className="flex-1 rounded-lg py-3 text-sm font-semibold"
            style={{ background: "#2d1e14", border: "1px solid #c0521a", color: "#e87c3e" }}
          >
            Open full recipe →
          </button>
        </div>
      </div>
    </div>
  );
}
