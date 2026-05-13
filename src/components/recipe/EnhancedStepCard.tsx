"use client";

import { useState } from "react";
import { BookOpen, Eye, Sparkles, Lightbulb } from "lucide-react";
import type { EnhancedStep } from "@/lib/types";

interface Props {
  step: EnhancedStep;
  index: number;
  isActive?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
  enhanceButton?: React.ReactNode;
}

export function EnhancedStepCard({ step, index, isActive, isDimmed, onClick, enhanceButton }: Props) {
  const [skillTab, setSkillTab] = useState<"beginner" | "pro" | null>(null);
  const [openJargon, setOpenJargon] = useState<string | null>(null);

  return (
    <li
      id={`recipe-step-${index}`}
      onClick={onClick}
      className="rounded-xl px-4 py-4 cursor-pointer"
      style={{
        background: isActive ? "var(--wc-surface-2, #3A3430)" : "transparent",
        borderLeft: isActive ? "3px solid var(--wc-accent-saffron, #F4A261)" : "3px solid transparent",
        opacity: isDimmed ? 0.45 : 1,
        transition: "background 0.2s ease, opacity 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="flex gap-3">
        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
          style={{
            background: isActive ? "var(--wc-accent-saffron, #F4A261)" : "#C8522A",
            color: "#fff",
            transition: "background 0.2s ease",
          }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-snug" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              {step.header}
            </h3>
            {enhanceButton}
          </div>

          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#EFE3CE", lineHeight: 1.75 }}>
            {step.body_text}
          </p>

          {/* Skill tabs */}
          <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSkillTab(skillTab === "beginner" ? null : "beginner")}
              className="text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5"
              style={{
                borderColor: skillTab === "beginner" ? "#86EFAC" : "#3A3430",
                background: skillTab === "beginner" ? "#0F2A1A" : "transparent",
                color: skillTab === "beginner" ? "#86EFAC" : "#A69180",
              }}
            >
              <BookOpen className="w-3 h-3" />
              Training Wheels
            </button>
            <button
              type="button"
              onClick={() => setSkillTab(skillTab === "pro" ? null : "pro")}
              className="text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5"
              style={{
                borderColor: skillTab === "pro" ? "#F4A261" : "#3A3430",
                background: skillTab === "pro" ? "#2A1A0F" : "transparent",
                color: skillTab === "pro" ? "#F4A261" : "#A69180",
              }}
            >
              <Sparkles className="w-3 h-3" />
              Pro Move
            </button>
          </div>

          {skillTab === "beginner" && (
            <p className="mt-2 text-sm pl-3 border-l-2" style={{ color: "#C9E4D2", borderColor: "#86EFAC", lineHeight: 1.7 }}>
              {step.skill.beginner}
            </p>
          )}
          {skillTab === "pro" && (
            <p className="mt-2 text-sm pl-3 border-l-2" style={{ color: "#F4D5B0", borderColor: "#F4A261", lineHeight: 1.7 }}>
              {step.skill.pro}
            </p>
          )}

          {/* Jargon chips */}
          {step.jargon.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              {step.jargon.map((j) => {
                const isOpen = openJargon === j.term;
                return (
                  <div key={j.term} className="inline-block">
                    <button
                      type="button"
                      onClick={() => setOpenJargon(isOpen ? null : j.term)}
                      className="text-[11px] px-2.5 py-1 rounded-full border inline-flex items-center gap-1"
                      style={{
                        borderColor: isOpen ? "#F4A261" : "#3A3430",
                        background: isOpen ? "#2A1A0F" : "transparent",
                        color: isOpen ? "#F4A261" : "#A69180",
                      }}
                    >
                      <Lightbulb className="w-3 h-3" />
                      {j.term}
                    </button>
                    {isOpen && (
                      <p className="mt-1.5 text-xs pl-2 border-l" style={{ color: "#C9B89A", borderColor: "#3A3430", lineHeight: 1.6 }}>
                        {j.definition}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Visual strategy caption */}
          <p className="mt-3 text-[11px] italic flex items-start gap-1.5" style={{ color: "#8A6A4A" }}>
            <Eye className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{step.visual_strategy}</span>
          </p>
        </div>
      </div>
    </li>
  );
}