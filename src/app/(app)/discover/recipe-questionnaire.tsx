"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { TypewriterText } from "@/components/ui/TypewriterText";

interface Question {
  text: string;
  param: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: Question[] = [
  {
    text: "What are you craving tonight?",
    param: "craving",
    options: [
      { label: "Comfort food", value: "comfort" },
      { label: "Something light", value: "light" },
      { label: "Adventurous", value: "adventurous" },
      { label: "Quick & easy", value: "quick" },
    ],
  },
  {
    text: "How much time do you have?",
    param: "time",
    options: [
      { label: "Under 20 min", value: "under-20" },
      { label: "30–45 min", value: "30-45" },
      { label: "About an hour", value: "60" },
      { label: "All afternoon", value: "90+" },
    ],
  },
  {
    text: "Cooking for...",
    param: "for",
    options: [
      { label: "Just me", value: "1" },
      { label: "A couple", value: "2" },
      { label: "Family", value: "4" },
      { label: "A crowd", value: "8+" },
    ],
  },
];

export function RecipeQuestionnaire() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const [done, setDone] = useState(false);
  // Guard: ignore onDone from a previous step's TypewriterText interval
  const stepRef = useRef(step);

  const question = QUESTIONS[step];

  function handleAnswer(value: string) {
    const next = [...answers, value];
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      stepRef.current = step + 1;
      setStep(step + 1);
      setTypingDone(false);
    } else {
      setDone(true);
    }
  }

  function handleReset() {
    stepRef.current = 0;
    setStep(0);
    setAnswers([]);
    setTypingDone(false);
    setDone(false);
  }

  const searchParams = QUESTIONS.slice(0, answers.length)
    .map((q, i) => `${q.param}=${answers[i]}`)
    .join("&");

  const summaryLabels = answers.map((val, i) =>
    QUESTIONS[i]?.options.find((o) => o.value === val)?.label ?? val
  );

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          🔍 Find a Recipe
        </h2>
        {(step > 0 || done) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#8A6A4A" }}
          >
            Reset
          </button>
        )}
      </div>

      {done ? (
        /* ── Completion state ── */
        <div className="flex flex-col gap-3">
          <p
            className="text-sm italic"
            style={{ color: "#A69180", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            <TypewriterText
              key="done"
              text={`${summaryLabels[0]} · ${summaryLabels[1]} · ${summaryLabels[2]}`}
              speed={32}
              cursorColor="#B07D56"
            />
          </p>
          <Link
            href={`/discover?${searchParams}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: "rgba(176,125,86,0.18)",
              color: "#B07D56",
              border: "1px solid rgba(176,125,86,0.3)",
              fontFamily: "'Libre Baskerville', Georgia, serif",
            }}
          >
            Find my recipe →
          </Link>
        </div>
      ) : (
        /* ── Active question ── */
        <div className="flex flex-col gap-3">
          {/* Question text with typewriter */}
          <p
            className="text-base font-semibold leading-snug"
            style={{
              color: "var(--wc-text, #EFE3CE)",
              fontFamily: "'Libre Baskerville', Georgia, serif",
              minHeight: "1.6rem",
            }}
          >
            <TypewriterText
              key={step}
              text={question.text}
              speed={38}
              onDone={() => { if (stepRef.current === step) setTypingDone(true); }}
              cursorColor="#B07D56"
            />
          </p>

          {/* Options — fade in after typing completes */}
          <div
            className="flex flex-wrap gap-2 transition-opacity duration-300"
            style={{ opacity: typingDone ? 1 : 0, pointerEvents: typingDone ? "auto" : "none" }}
          >
            {question.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAnswer(opt.value)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "rgba(176,125,86,0.12)",
                  color: "#B07D56",
                  border: "1px solid rgba(176,125,86,0.25)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-1">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  background: i < step
                    ? "var(--wc-pal-accent, #B07D56)"
                    : i === step
                      ? "var(--wc-accent-saffron, #F4A261)"
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
