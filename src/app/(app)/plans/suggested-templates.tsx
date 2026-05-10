"use client";

import { useState } from "react";
import { TemplatePreviewModal } from "./template-preview-modal";
import type { PlanTemplate } from "./new/plan-templates";

interface Props {
  templates: PlanTemplate[];
}

export function SuggestedTemplates({ templates }: Props) {
  const [preview, setPreview] = useState<PlanTemplate | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setPreview(tpl)}
            className="text-left rounded-2xl overflow-hidden transition-all hover:-translate-y-1 h-full border"
            style={{ borderColor: "var(--wc-border-subtle, #3A2416)" }}
          >
            <div className="h-20 relative overflow-hidden">
              {tpl.meals?.[0]?.image ? (
                <>
                  <img
                    src={tpl.meals[0].image}
                    alt={tpl.title}
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.8) saturate(0.9)" }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.7) 0%, transparent 60%)" }} />
                  <span className="absolute bottom-1.5 left-2 text-lg">{tpl.emoji}</span>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: tpl.gradient }}>
                  {tpl.emoji}
                </div>
              )}
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: tpl.accentColor }} />
            </div>
            <div className="p-3 rounded-b-2xl" style={{ background: "var(--bg-secondary)" }}>
              <p className="font-semibold text-xs leading-snug" style={{ color: "var(--fg-primary)" }}>{tpl.title}</p>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--fg-tertiary)" }}>{tpl.subtitle}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tpl.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${tpl.accentColor} 15%, var(--bg-depth))`,
                      color: tpl.accentColor,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} />
    </>
  );
}
