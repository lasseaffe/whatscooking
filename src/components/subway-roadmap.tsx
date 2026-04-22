"use client";

import { useState } from "react";
import { CookingTip, detectTechniques } from "@/components/cooking-tip";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface Props {
  instructions: string[];
  onComplete?: () => void;
}

export function SubwayRoadmap({ instructions, onComplete }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [cooked, setCooked] = useState(false);

  const steps = (() => {
    const seen = new Set<string>();
    return instructions.map((step, i) => {
      const tips = detectTechniques(step).filter((t) => !seen.has(t.id));
      tips.forEach((t) => seen.add(t.id));
      return { step, tips, index: i };
    });
  })();

  const current = steps[activeStep];
  const progress = ((activeStep + 1) / steps.length) * 100;
  const isDone = activeStep === steps.length - 1;

  return (
    <div>
      {/* ── Header + progress ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Instructions
        </h2>
        <span className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: "rgba(42,24,8,0.6)", color: "var(--wc-pal-accent, #B07D56)" }}>
          {activeStep + 1} / {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full mb-6 overflow-hidden" style={{ background: "rgba(42,24,8,0.5)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--wc-pal-accent, #B07D56), var(--wc-pal-sage, #828E6F))" }}
        />
      </div>

      {/* ── Main active step ── */}
      <div
        className="rounded-2xl mb-5 relative overflow-hidden"
        style={{
          background: "rgba(26,16,8,0.8)",
          border: "1.5px solid rgba(176,125,86,0.3)",
          minHeight: 180,
        }}
      >
        {/* Accent top bar */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, var(--wc-pal-accent, #B07D56), transparent)" }} />

        <div className="p-6">
          {/* Step number badge */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
              style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
            >
              {isDone ? <CheckCircle2 style={{ width: 20, height: 20 }} /> : activeStep + 1}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--wc-pal-sage, #828E6F)" }}>
              {isDone ? "Complete!" : `Step ${activeStep + 1} of ${steps.length}`}
            </span>
          </div>

          {/* Step text — large and readable */}
          <p
            className="leading-relaxed"
            style={{
              color: "var(--wc-text, #EFE3CE)",
              fontSize: "1.05rem",
              lineHeight: "1.8",
            }}
          >
            {current.step}
          </p>

          {/* Cooking tips */}
          {current.tips.length > 0 && (
            <div className="mt-4 space-y-2">
              {current.tips.map((tech) => (
                <CookingTip key={tech.id} technique={tech} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
          disabled={activeStep === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-25 hover:opacity-90"
          style={{ background: "rgba(42,24,8,0.6)", color: "var(--wc-pal-accent, #B07D56)", border: "1px solid rgba(176,125,86,0.25)" }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} /> Previous
        </button>
        {!isDone ? (
          <button
            onClick={() => setActiveStep((p) => Math.min(steps.length - 1, p + 1))}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
          >
            Next step <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        ) : cooked ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "rgba(130,142,111,0.2)", color: "var(--wc-pal-sage, #828E6F)", border: "1px solid rgba(130,142,111,0.3)" }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} /> Marked as cooked!
          </div>
        ) : (
          <button
            onClick={() => { setCooked(true); onComplete?.(); }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #828E6F, #6B7A5A)", color: "#fff" }}
          >
            <CheckCircle2 style={{ width: 16, height: 16 }} /> Mark as cooked!
          </button>
        )}
      </div>

      {/* ── All steps mini-map ── */}
      <div className="rounded-xl p-3" style={{ background: "rgba(14,9,5,0.6)", border: "1px solid rgba(42,24,8,0.7)" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#4A3020" }}>All Steps</p>
        <div className="flex flex-col gap-1.5">
          {steps.map((s, i) => {
            const isAct = i === activeStep;
            const done = i < activeStep;
            return (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className="flex items-start gap-3 text-left w-full px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isAct ? "rgba(42,24,8,0.8)" : done ? "rgba(26,16,8,0.4)" : "transparent",
                  border: isAct ? "1px solid rgba(176,125,86,0.3)" : "1px solid transparent",
                }}
              >
                <div
                  className="mt-0.5 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    width: 22, height: 22,
                    fontSize: "0.65rem",
                    background: isAct
                      ? "var(--wc-pal-accent, #B07D56)"
                      : done
                        ? "rgba(130,142,111,0.4)"
                        : "rgba(42,24,8,0.5)",
                    color: isAct ? "#fff" : done ? "var(--wc-pal-sage, #828E6F)" : "#5A3A28",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <p
                  className="text-xs leading-snug line-clamp-2"
                  style={{
                    color: isAct ? "var(--wc-text, #EFE3CE)" : done ? "#4A3020" : "#7A5A40",
                    textDecoration: done ? "line-through" : "none",
                    textDecorationColor: "rgba(130,142,111,0.4)",
                  }}
                >
                  {s.step}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
