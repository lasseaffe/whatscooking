"use client";

import { useMemo } from "react";
import { CookingTip, detectTechniques } from "@/components/cooking-tip";
import { useLanguage } from "@/lib/language-context";

interface Props {
  instructions: string[];
}

export function InstructionsWithTips({ instructions }: Props) {
  const { t } = useLanguage();

  // Deduplicate tips across all steps — each tip ID shown at most once per recipe
  const stepsWithTips = useMemo(() => {
    const seen = new Set<string>();
    return instructions.map((step) => {
      const tips = detectTechniques(step).filter((tech) => !seen.has(tech.id));
      tips.forEach((tech) => seen.add(tech.id));
      return { step, tips };
    });
  }, [instructions]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>{t("recipe.instructions")}</h2>
      <ol className="flex flex-col gap-5">
        {stepsWithTips.map(({ step, tips }, i) => (
          <li key={i}>
            <div className="flex gap-3">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: "#C8522A", color: "#fff" }}
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
        ))}
      </ol>
    </div>
  );
}
