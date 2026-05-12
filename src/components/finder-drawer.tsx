// src/components/finder-drawer.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Loader2 } from "lucide-react";
import { parseFinderText } from "@/lib/finder-parse";
import type { Recipe } from "@/lib/types";

export type FinderAnswers = {
  vibe?: string;
  maxMinutes?: 15 | 30 | 60 | null;
  dietary?: string;
  pantryMode?: "pantry" | "shop" | "any";
  freeText?: string;
};

export interface FinderResult {
  recipes: Recipe[];
  profile: { vibeLabel: string | null; timeLabel: string | null };
}

interface Props {
  onClose: () => void;
  onResults: (result: FinderResult, answers: FinderAnswers) => void;
  initial?: FinderAnswers;
}

type QuestionKey = "vibe" | "maxMinutes" | "dietary" | "pantryMode";

interface Option {
  value: string | number | null;
  label: string;
  emoji: string;
  desc?: string;
}

const QUESTIONS: Array<{ key: QuestionKey; question: string; options: Option[] }> = [
  {
    key: "vibe",
    question: "What's the vibe?",
    options: [
      { value: "lazy",       label: "Lazy night in",   emoji: "😴", desc: "easy, warming, no fuss" },
      { value: "date-night", label: "Date night",      emoji: "🍷", desc: "Italian, French, seafood" },
      { value: "fuel",       label: "Quick fuel",      emoji: "⚡", desc: "fast, filling, energising" },
      { value: "comfort",    label: "Comfort food",    emoji: "😋", desc: "cosy, hearty, satisfying" },
      { value: "clean",      label: "Clean eating",    emoji: "🌿", desc: "fresh, light, nutritious" },
      { value: "impress",    label: "Impress guests",  emoji: "🤩", desc: "showstopper, special" },
    ],
  },
  {
    key: "maxMinutes",
    question: "How much time?",
    options: [
      { value: 15,   label: "Under 15 min", emoji: "⚡", desc: "eggs, toast, stir-fry" },
      { value: 30,   label: "30 minutes",   emoji: "🕐", desc: "curries, pasta, burgers" },
      { value: 60,   label: "An hour",      emoji: "🍖", desc: "roasts, risotto, bakes" },
      { value: null, label: "All day",      emoji: "🌅", desc: "slow braises, bread" },
    ],
  },
  {
    key: "dietary",
    question: "Any dietary needs?",
    options: [
      { value: "none",        label: "None",        emoji: "🍽️" },
      { value: "vegan",       label: "Vegan",       emoji: "🌱" },
      { value: "vegetarian",  label: "Vegetarian",  emoji: "🥦" },
      { value: "gluten-free", label: "Gluten-free", emoji: "🌾" },
      { value: "dairy-free",  label: "Dairy-free",  emoji: "🥛" },
      { value: "halal",       label: "Halal",       emoji: "☪️" },
    ],
  },
  {
    key: "pantryMode",
    question: "Use pantry items?",
    options: [
      { value: "pantry", label: "Yes please",      emoji: "🥬", desc: "prioritise what I have" },
      { value: "shop",   label: "I'll shop fresh", emoji: "🛒", desc: "any ingredients fine" },
      { value: "any",    label: "Surprise me",     emoji: "✨", desc: "whatever works best" },
    ],
  },
];

const ANSWER_LABELS: Record<string, string> = {
  lazy:          "😴 Lazy night",
  "date-night":  "🍷 Date night",
  fuel:          "⚡ Quick fuel",
  comfort:       "😋 Comfort food",
  clean:         "🌿 Clean eating",
  impress:       "🤩 Impress guests",
  "15":          "⚡ ≤15 min",
  "30":          "🕐 ≤30 min",
  "60":          "🍖 ≤60 min",
  "null":        "🌅 All day",
  none:          "🍽️ No restrictions",
  vegan:         "🌱 Vegan",
  vegetarian:    "🥦 Vegetarian",
  "gluten-free": "🌾 Gluten-free",
  "dairy-free":  "🥛 Dairy-free",
  halal:         "☪️ Halal",
  pantry:        "🥬 Using pantry",
  shop:          "🛒 Shopping fresh",
  any:           "✨ Surprise me",
};

export function FinderDrawer({ onClose, onResults, initial }: Props) {
  const [freeText, setFreeText] = useState(initial?.freeText ?? "");
  const [answers, setAnswers] = useState<FinderAnswers>(initial ?? {});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.freeText) {
      const hints = parseFinderText(initial.freeText);
      setAnswers((prev) => ({
        ...prev,
        ...(hints.vibe && !prev.vibe ? { vibe: hints.vibe } : {}),
        ...(hints.maxMinutes != null && prev.maxMinutes == null
          ? { maxMinutes: hints.maxMinutes }
          : {}),
        ...(hints.dietary?.length && !prev.dietary
          ? { dietary: hints.dietary[0] }
          : {}),
        ...(hints.pantryMode && !prev.pantryMode
          ? { pantryMode: hints.pantryMode }
          : {}),
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(key: QuestionKey, value: string | number | null) {
    const newAnswers: FinderAnswers = {
      ...answers,
      [key]: value === "none" ? undefined : value,
    };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 150);
    } else {
      void fireAPI(newAnswers);
    }
  }

  function clearAnswer(key: QuestionKey) {
    const newAnswers = { ...answers };
    delete newAnswers[key];
    setAnswers(newAnswers);
    setStep(QUESTIONS.findIndex((q) => q.key === key));
  }

  async function fireAPI(answersToSend: FinderAnswers) {
    setLoading(true);
    setError(null);

    const hints = parseFinderText(freeText);

    const body = {
      vibe: answersToSend.vibe ?? hints.vibe,
      maxMinutes:
        answersToSend.maxMinutes !== undefined
          ? answersToSend.maxMinutes
          : hints.maxMinutes,
      dietary:
        answersToSend.dietary && answersToSend.dietary !== "none"
          ? [
              answersToSend.dietary,
              ...(hints.dietary ?? []).filter((d) => d !== answersToSend.dietary),
            ]
          : (hints.dietary ?? []),
      pantryMode: answersToSend.pantryMode ?? hints.pantryMode ?? "any",
      excludeKeywords: hints.excludeKeywords,
      dishHint: hints.dishHint,
    };

    try {
      const res = await fetch("/api/recipes/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const fullAnswers: FinderAnswers = {
        ...answersToSend,
        freeText: freeText || undefined,
      };
      localStorage.setItem("wc-finder-answers", JSON.stringify(fullAnswers));

      setLoading(false);
      onResults(
        { recipes: data.results as Recipe[], profile: data.profile },
        fullAnswers
      );
      onClose();
    } catch {
      setError("Something went wrong — try again.");
      setLoading(false);
    }
  }

  const answeredKeys = QUESTIONS.slice(0, step)
    .map((q) => q.key)
    .filter((k) => answers[k as keyof FinderAnswers] !== undefined);

  const answeredCount = QUESTIONS.filter((q) => answers[q.key as keyof FinderAnswers] !== undefined).length;
  const progress = answeredCount / QUESTIONS.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full rounded-t-2xl"
        style={{
          background: "#140C06",
          border: "1px solid #3A2416",
          borderBottom: "none",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full" style={{ background: "#3A2416" }} />
        </div>

        <div className="px-5 pb-10">
          {/* Close */}
          <div className="flex justify-end mb-1">
            <button onClick={onClose} aria-label="Close" style={{ color: "#6B4E36" }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free text — always pinned at top */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>
              What are you in the mood for?
            </p>
            <input
              autoFocus
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && freeText.trim()) void fireAPI(answers);
              }}
              placeholder="quick vegan pasta, nothing spicy, use what I've got…"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                background: "#1C1209",
                border: "1.5px solid #C8522A50",
                color: "#EFE3CE",
              }}
            />
            {freeText.trim() && (
              <p className="text-xs mt-1.5" style={{ color: "#6B4E36" }}>
                Press Enter to search, or answer below for better results
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="h-0.5 rounded-full mb-5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "#C8522A" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Answered summary chips */}
          {answeredKeys.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {answeredKeys.map((key) => {
                const val = answers[key as keyof FinderAnswers];
                const label = ANSWER_LABELS[String(val)] ?? String(val);
                return (
                  <button
                    key={key}
                    onClick={() => clearAnswer(key as QuestionKey)}
                    aria-label={`Remove ${label}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(200,82,42,0.15)",
                      border: "1px solid #C8522A40",
                      color: "#C8522A",
                    }}
                  >
                    {label}
                    <X className="w-3 h-3" aria-hidden />
                  </button>
                );
              })}
            </div>
          )}

          {/* Active question */}
          {!loading && step < QUESTIONS.length && (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#C8522A" }}
                >
                  Question {step + 1} of {QUESTIONS.length}
                </span>
                <h3
                  className="text-base font-extrabold mt-1 mb-4"
                  style={{
                    color: "#EFE3CE",
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                  }}
                >
                  {QUESTIONS[step].question}
                </h3>
                <div className="flex flex-col gap-2">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => handleAnswer(QUESTIONS[step].key, opt.value)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: "rgba(42,24,8,0.6)",
                        border: "1px solid #3A2416",
                      }}
                    >
                      <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>
                        {opt.emoji}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>
                          {opt.label}
                        </div>
                        {opt.desc && (
                          <div className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
                            {opt.desc}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#3A2416" }} />
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C8522A" }} />
              <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>
                Finding your 20 picks…
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <p className="text-sm text-center mt-4" style={{ color: "#C8522A" }}>
              {error}
            </p>
          )}

          {/* Skip */}
          {!loading && step < QUESTIONS.length && (
            <button
              onClick={() => void fireAPI(answers)}
              className="w-full mt-5 text-xs text-center py-2"
              style={{ color: "#6B4E36" }}
            >
              Skip remaining questions →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
