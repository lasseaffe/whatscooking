"use client";

import { useMemo, useState } from "react";
import { CookingTip, detectTechniques } from "@/components/cooking-tip";
import { useLanguage } from "@/lib/language-context";

interface Props {
  instructions: string[];
}

export function InstructionsWithTips({ instructions }: Props) {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const stepsWithTips = useMemo(() => {
    const seen = new Set<string>();
    return instructions.map((step) => {
      const tips = detectTechniques(step).filter((tech) => !seen.has(tech.id));
      tips.forEach((tech) => seen.add(tech.id));
      return { step, tips };
    });
  }, [instructions]);

  function handleStepClick(i: number) {
    setActiveStep((prev) => (prev === i ? null : i));
    const el = document.getElementById(`recipe-step-${i}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>{t("recipe.instructions")}</h2>
      <ol className="flex flex-col gap-3">
        {stepsWithTips.map(({ step, tips }, i) => {
          const isActive = activeStep === i;
          const isDimmed = activeStep !== null && !isActive;
          return (
            <li
              key={i}
              id={`recipe-step-${i}`}
              onClick={() => handleStepClick(i)}
              className="rounded-xl px-4 py-3 cursor-pointer"
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
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed" style={{ color: "#EFE3CE", lineHeight: "1.75" }}>{step}</p>
                  {tips.map((tech) => (
                    <CookingTip key={tech.id} technique={tech} />
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
