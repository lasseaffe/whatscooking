// src/components/cookbook-wizard/step-chapters.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { WizardDraft, WizardChapter } from "./wizard-shell";

interface Props { draft: WizardDraft; updateDraft: (p: Partial<WizardDraft>) => void; saving: boolean; onNext: () => void; onBack: () => void; }

export function StepChapters({ draft, updateDraft, onNext, onBack }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function addChapter() {
    const ch: WizardChapter = { title: `Chapter ${draft.chapters.length + 1}`, intro_text: "", cover_image_url: "", position: draft.chapters.length, recipes: [] };
    updateDraft({ chapters: [...draft.chapters, ch] });
    setExpandedIdx(draft.chapters.length);
  }

  function updateChapter(idx: number, patch: Partial<WizardChapter>) {
    updateDraft({ chapters: draft.chapters.map((ch, i) => i === idx ? { ...ch, ...patch } : ch) });
  }

  function removeChapter(idx: number) {
    updateDraft({ chapters: draft.chapters.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#3D2817" }}>Chapters</h2>
      {draft.chapters.map((ch, idx) => (
        <div key={idx} className="rounded-xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
          <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" style={{ background: "#FFF8F3" }}
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
            <GripVertical className="w-4 h-4" style={{ color: "#C4A882" }} />
            <span className="flex-1 font-medium text-sm" style={{ color: "#3D2817" }}>{ch.title || `Chapter ${idx + 1}`}</span>
            <button onClick={(e) => { e.stopPropagation(); removeChapter(idx); }}>
              <Trash2 className="w-4 h-4" style={{ color: "#C85A2F" }} />
            </button>
          </div>
          {expandedIdx === idx && (
            <div className="px-4 py-4 space-y-3 border-t" style={{ borderColor: "#F5E6D3" }}>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#3D2817" }}>Chapter title</label>
                <input value={ch.title} onChange={(e) => updateChapter(idx, { title: e.target.value })}
                  className="w-full rounded-lg px-3 py-1.5 border text-sm" style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#3D2817" }}>Intro text</label>
                <textarea value={ch.intro_text} onChange={(e) => updateChapter(idx, { intro_text: e.target.value })}
                  rows={3} placeholder="Write an intro for this chapter…"
                  className="w-full rounded-lg px-3 py-1.5 border text-sm resize-none"
                  style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={addChapter}
        className="w-full py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-1"
        style={{ borderColor: "#C85A2F", color: "#C85A2F", borderStyle: "dashed" }}>
        <Plus className="w-4 h-4" /> Add chapter
      </button>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl font-semibold border text-sm" style={{ borderColor: "#F5E6D3", color: "#6B5B52" }}>← Back</button>
        <button onClick={onNext} disabled={draft.chapters.length === 0}
          className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: "#C85A2F" }}>
          Next: Recipes →
        </button>
      </div>
    </div>
  );
}
