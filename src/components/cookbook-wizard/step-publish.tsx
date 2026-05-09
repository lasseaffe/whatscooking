// src/components/cookbook-wizard/step-publish.tsx
"use client";

import type { WizardDraft } from "./wizard-shell";

interface Props { draft: WizardDraft; updateDraft: (p: Partial<WizardDraft>) => void; saving: boolean; onBack: () => void; onSaveDraft: () => void; onPublish: () => void; }

export function StepPublish({ draft, updateDraft, saving, onBack, onSaveDraft, onPublish }: Props) {
  const totalRecipes = draft.chapters.reduce((s, ch) => s + ch.recipes.length, 0);
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "#3D2817" }}>Pricing & Publish</h2>
      <div className="rounded-2xl p-5 space-y-2" style={{ background: "#FFF8F3", border: "1px solid #F5E6D3" }}>
        <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>Summary</p>
        <p className="text-sm" style={{ color: "#6B5B52" }}>📖 {draft.title || "Untitled"}</p>
        <p className="text-sm" style={{ color: "#6B5B52" }}>📂 {draft.chapters.length} chapter{draft.chapters.length !== 1 ? "s" : ""}</p>
        <p className="text-sm" style={{ color: "#6B5B52" }}>🍽 {totalRecipes} recipe{totalRecipes !== 1 ? "s" : ""}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "#3D2817" }}>Price</label>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "#6B5B52" }}>$</span>
          <input type="number" min="0" step="0.01" value={draft.price}
            onChange={(e) => updateDraft({ price: parseFloat(e.target.value) || 0 })}
            className="w-32 rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
          {draft.price === 0 && (
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#F0FDF4", color: "#16a34a" }}>Free</span>
          )}
        </div>
        {draft.price > 0 && (
          <p className="text-xs mt-2" style={{ color: "#C4A882" }}>Chapter 1 is always free to preview. Payment processing coming soon.</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "#3D2817" }}>Description</label>
        <textarea value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })}
          rows={3} placeholder="What's this cookbook about?"
          className="w-full rounded-xl px-3 py-2 border text-sm resize-none"
          style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl font-semibold border text-sm" style={{ borderColor: "#F5E6D3", color: "#6B5B52" }}>← Back</button>
        <button onClick={onSaveDraft} disabled={saving}
          className="flex-1 py-2.5 rounded-xl font-semibold border text-sm disabled:opacity-50"
          style={{ borderColor: "#C85A2F", color: "#C85A2F" }}>Save draft</button>
        <button onClick={onPublish} disabled={saving || !draft.title || draft.chapters.length === 0}
          className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
          style={{ background: "#C85A2F" }}>
          {saving ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
