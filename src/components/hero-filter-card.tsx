"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, SlidersHorizontal, X } from "lucide-react";

export type HeroFilterState = {
  category: string;
  dietary: string[];
  difficulty: string;
  utensils: string[];
};

const CATEGORIES = [
  { value: "breakfast",   label: "Breakfast",   emoji: "🥞" },
  { value: "lunch",       label: "Lunch",       emoji: "🥗" },
  { value: "dinner",      label: "Dinner",      emoji: "🍽️" },
  { value: "main course", label: "Mains",       emoji: "🍳" },
  { value: "snack",       label: "Snack",       emoji: "🍎" },
  { value: "dessert",     label: "Dessert",     emoji: "🍰" },
  { value: "pasta",       label: "Pasta",       emoji: "🍝" },
  { value: "soup",        label: "Soups",       emoji: "🍲" },
  { value: "any",         label: "Surprise me", emoji: "✨" },
];

const DIETARY = [
  { value: "vegan",       label: "Vegan",       emoji: "🌱" },
  { value: "vegetarian",  label: "Vegetarian",  emoji: "🥦" },
  { value: "gluten-free", label: "Gluten-Free", emoji: "🌾" },
  { value: "dairy-free",  label: "Dairy-Free",  emoji: "🥛" },
  { value: "keto",        label: "Keto",        emoji: "🥑" },
  { value: "halal",       label: "Halal",       emoji: "☪️" },
];

const DIFFICULTY = [
  { value: "easy",   label: "Quick & Easy", emoji: "😌", desc: "30 min or less" },
  { value: "medium", label: "Worth the effort", emoji: "👨‍🍳", desc: "45–60 min" },
  { value: "hard",   label: "Show me a challenge", emoji: "🏆", desc: "1h+, advanced" },
  { value: "any",    label: "No preference", emoji: "🎲", desc: "Show everything" },
];

type Step = 0 | 1 | 2;

interface Props {
  onApply: (f: HeroFilterState) => void;
}

export function HeroFilterCard({ onApply }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [category, setCategory] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("");
  const [done, setDone] = useState(false);

  function handleCategory(val: string) {
    const cat = val === "any" ? "" : val;
    setCategory(cat);
    // immediately apply category, then advance to step 1
    setStep(1);
  }

  function toggleDietary(val: string) {
    setDietary((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  }

  function applyAll() {
    onApply({ category, dietary, difficulty: difficulty === "any" ? "" : difficulty, utensils: [] });
    setDone(true);
  }

  function reset() {
    setStep(0);
    setCategory("");
    setDietary([]);
    setDifficulty("");
    setDone(false);
    onApply({ category: "", dietary: [], difficulty: "", utensils: [] });
  }

  if (done) {
    const parts: string[] = [];
    if (category) parts.push(CATEGORIES.find((c) => c.value === category)?.label ?? category);
    if (dietary.length) parts.push(dietary.map((d) => DIETARY.find((x) => x.value === d)?.label ?? d).join(", "));
    if (difficulty && difficulty !== "any") parts.push(DIFFICULTY.find((d) => d.value === difficulty)?.label ?? difficulty);

    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
        style={{ background: "rgba(28,18,9,0.8)", border: "1.5px solid #C8522A40" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#C8522A" }}>
            Filtered for you
          </p>
          <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>
            {parts.length ? parts.join(" · ") : "All recipes"}
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
          style={{ background: "#2A1808", color: "#8A6A4A", border: "1px solid #3A2416" }}
        >
          <X className="w-3 h-3" /> Reset
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(20,12,6,0.9)", border: "1.5px solid #3A2416" }}
    >
      {/* Step progress bar */}
      <div className="flex h-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 transition-all"
            style={{ background: i <= step ? "#C8522A" : "rgba(58,36,22,0.5)" }}
          />
        ))}
      </div>

      <div className="px-5 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: "#2A1808" }}
              >
                <ChevronLeft className="w-3.5 h-3.5" style={{ color: "#8A6A4A" }} />
              </button>
            )}
            <SlidersHorizontal className="w-4 h-4" style={{ color: "#C8522A" }} />
            <h2 className="font-bold text-sm" style={{ color: "#EFE3CE" }}>
              {step === 0 && "What are you cooking?"}
              {step === 1 && "Any dietary needs?"}
              {step === 2 && "How much time do you have?"}
            </h2>
          </div>
          <span className="text-xs" style={{ color: "#6B4E36" }}>
            {step + 1} / 3
          </span>
        </div>

        {/* Step 0 — Category */}
        {step === 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCategory(c.value)}
                className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all hover:scale-[1.03]"
                style={{
                  background: category === (c.value === "any" ? "" : c.value) ? "rgba(200,82,42,0.18)" : "rgba(42,24,8,0.6)",
                  border: `1px solid ${category === (c.value === "any" ? "" : c.value) ? "#C8522A" : "#3A2416"}`,
                  color: category === (c.value === "any" ? "" : c.value) ? "#EFE3CE" : "#8A6A4A",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{c.emoji}</span>
                <span className="text-xs font-semibold text-center leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 1 — Dietary */}
        {step === 1 && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {DIETARY.map((d) => {
                const on = dietary.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDietary(d.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: on ? "rgba(115,190,89,0.15)" : "rgba(42,24,8,0.6)",
                      border: `1px solid ${on ? "#73be59" : "#3A2416"}`,
                      color: on ? "#73be59" : "#8A6A4A",
                    }}
                  >
                    <span>{d.emoji}</span> {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs mb-4" style={{ color: "#6B4E36" }}>Select all that apply, or skip</p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Step 2 — Difficulty */}
        {step === 2 && (
          <>
            <div className="flex flex-col gap-2 mb-4">
              {DIFFICULTY.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: difficulty === d.value ? "rgba(200,82,42,0.18)" : "rgba(42,24,8,0.6)",
                    border: `1px solid ${difficulty === d.value ? "#C8522A" : "#3A2416"}`,
                    color: difficulty === d.value ? "#EFE3CE" : "#8A6A4A",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{d.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{d.label}</div>
                    <div className="text-xs" style={{ color: "#6B4E36" }}>{d.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={applyAll}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              Show me recipes ✓
            </button>
          </>
        )}
      </div>
    </div>
  );
}
