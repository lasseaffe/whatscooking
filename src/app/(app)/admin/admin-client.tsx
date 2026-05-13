"use client";

import { useState } from "react";
import { DescriptionPanel } from "./panels/description-panel";
import { InstructionPanel } from "./panels/instruction-panel";
import { IngredientRepairPanel } from "./panels/ingredient-repair-panel";
import { TemplateRepairPanel } from "./panels/template-repair-panel";
import { ImageAuditPanel } from "./panels/image-audit-panel";
import { PlaywrightFixerPanel } from "./panels/playwright-fixer-panel";
import { DuplicateDetectorPanel } from "./panels/duplicate-detector-panel";
import { BulkDeletePanel } from "./panels/bulk-delete-panel";
import { ComplexResolverPanel } from "./panels/complex-resolver-panel";
import { PalettePreviewerPanel } from "./panels/palette-previewer-panel";

const PANELS = [
  { id: "descriptions",   label: "Description Enhancer",  emoji: "✍️" },
  { id: "instructions",   label: "Instruction Enhancer",  emoji: "📋" },
  { id: "ingredients",    label: "Ingredient Repair",      emoji: "🔧" },
  { id: "template",       label: "Template Repair",        emoji: "🗂️" },
  { id: "images",         label: "Image Audit",            emoji: "🖼️" },
  { id: "playwright",     label: "Playwright Fixer",       emoji: "🎭" },
  { id: "duplicates",     label: "Duplicate Detector",     emoji: "🔍" },
  { id: "bulk-delete",    label: "Bulk Delete",            emoji: "🗑️" },
  { id: "resolve-issue",  label: "Issue Resolver",         emoji: "🤖" },
  { id: "palettes",       label: "Palette Previewer",      emoji: "🎨" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

export function AdminClient({ adminSecret }: { adminSecret: string }) {
  const [activePanel, setActivePanel] = useState<PanelId>("descriptions");

  return (
    <div className="min-h-screen" style={{ background: "var(--wc-floor, #1A1208)", color: "var(--wc-text, #EFE3CE)" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(58,36,22,0.4)" }}>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-pal-accent, #B07D56)" }}
        >
          Admin Kitchen
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(176,125,86,0.6)" }}>
          Pipeline control · Recipe enhancement · Data repair
        </p>
      </div>

      <div className="flex" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* Sidebar */}
        <aside
          className="shrink-0 flex flex-col gap-1 p-3 border-r"
          style={{ width: 220, borderColor: "rgba(58,36,22,0.4)", background: "rgba(26,18,8,0.6)" }}
        >
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all"
              style={{
                background: activePanel === p.id ? "rgba(176,125,86,0.18)" : "transparent",
                color: activePanel === p.id ? "var(--wc-pal-accent, #B07D56)" : "rgba(176,125,86,0.55)",
                fontWeight: activePanel === p.id ? 700 : 400,
                border: activePanel === p.id ? "1px solid rgba(176,125,86,0.25)" : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </aside>

        {/* Panel content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activePanel === "descriptions"  && <DescriptionPanel   adminSecret={adminSecret} />}
          {activePanel === "instructions"  && <InstructionPanel   adminSecret={adminSecret} />}
          {activePanel === "ingredients"   && <IngredientRepairPanel adminSecret={adminSecret} />}
          {activePanel === "template"      && <TemplateRepairPanel adminSecret={adminSecret} />}
          {activePanel === "images"        && <ImageAuditPanel    adminSecret={adminSecret} />}
          {activePanel === "playwright"    && <PlaywrightFixerPanel adminSecret={adminSecret} />}
          {activePanel === "duplicates"    && <DuplicateDetectorPanel adminSecret={adminSecret} />}
          {activePanel === "bulk-delete"   && <BulkDeletePanel    adminSecret={adminSecret} />}
          {activePanel === "resolve-issue" && <ComplexResolverPanel adminSecret={adminSecret} />}
          {activePanel === "palettes"      && <PalettePreviewerPanel />}
        </main>
      </div>
    </div>
  );
}
