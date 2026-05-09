// src/components/cookbook-wizard/step-cover.tsx
"use client";

import { CookbookCover } from "@/components/cookbook-cover";
import type { WizardDraft } from "./wizard-shell";
import type { CookbookFont } from "@/lib/cookbook-types";

const PRESETS = ["#C85A2F","#D97706","#16a34a","#2563eb","#7c3aed","#1f2937"];
const FONTS: { value: CookbookFont; label: string }[] = [
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans" },
  { value: "script", label: "Script" },
];

interface Props { draft: WizardDraft; updateDraft: (p: Partial<WizardDraft>) => void; saving: boolean; onNext: () => void; }

export function StepCover({ draft, updateDraft, onNext }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "#3D2817" }}>Cover Design</h2>
      <CookbookCover cookbook={draft} size="card" />
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#3D2817" }}>Title *</label>
          <input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })}
            placeholder="My Cookbook" className="w-full rounded-xl px-3 py-2 border text-sm"
            style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#3D2817" }}>Tagline</label>
          <input value={draft.tagline} onChange={(e) => updateDraft({ tagline: e.target.value })}
            placeholder="A short line under the title" className="w-full rounded-xl px-3 py-2 border text-sm"
            style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#3D2817" }}>Cover image URL</label>
          <input value={draft.cover_image_url} onChange={(e) => updateDraft({ cover_image_url: e.target.value })}
            placeholder="https://…" className="w-full rounded-xl px-3 py-2 border text-sm"
            style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#3D2817" }}>Theme color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((c) => (
              <button key={c} onClick={() => updateDraft({ theme_color: c })}
                className="w-8 h-8 rounded-full border-2"
                style={{ background: c, borderColor: draft.theme_color === c ? "#3D2817" : "transparent" }} />
            ))}
            <input type="color" value={draft.theme_color} onChange={(e) => updateDraft({ theme_color: e.target.value })}
              className="w-8 h-8 rounded-full cursor-pointer" title="Custom color" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#3D2817" }}>Title font</label>
          <div className="flex gap-2">
            {FONTS.map((f) => (
              <button key={f.value} onClick={() => updateDraft({ title_font: f.value })}
                className="px-4 py-1.5 rounded-lg text-sm border"
                style={{ borderColor: draft.title_font === f.value ? "#C85A2F" : "#F5E6D3",
                  background: draft.title_font === f.value ? "#FFF8F3" : "transparent", color: "#3D2817" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={onNext} disabled={!draft.title}
        className="w-full py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
        style={{ background: "#C85A2F" }}>
        Next: Chapters →
      </button>
    </div>
  );
}
