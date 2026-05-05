"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, SlidersHorizontal } from "lucide-react";

export type FilterState = {
  category: string;
  dietary: string[];
  difficulty: string;
  seasonality: string;
  tags: string[];
  utensils: string[];
};

const EMPTY_FILTERS: FilterState = {
  category: "",
  dietary: [],
  difficulty: "",
  seasonality: "",
  tags: [],
  utensils: [],
};

const CATEGORIES = [
  { value: "breakfast", label: "Breakfast", emoji: "🥞" },
  { value: "lunch",     label: "Lunch",     emoji: "🥗" },
  { value: "dinner",    label: "Dinner",    emoji: "🍽️" },
  { value: "snack",     label: "Snack",     emoji: "🍎" },
  { value: "dessert",   label: "Dessert",   emoji: "🍰" },
  { value: "drink",     label: "Drink",     emoji: "🥤" },
  { value: "any",       label: "Any",       emoji: "✨" },
];

const DIETARY_OPTIONS = [
  { value: "vegan",       label: "Vegan",       emoji: "🌱" },
  { value: "vegetarian",  label: "Vegetarian",  emoji: "🥦" },
  { value: "gluten-free", label: "Gluten-Free", emoji: "🌾" },
  { value: "dairy-free",  label: "Dairy-Free",  emoji: "🥛" },
  { value: "nut-free",    label: "Nut-Free",    emoji: "🥜" },
  { value: "keto",        label: "Keto",        emoji: "🥑" },
  { value: "paleo",       label: "Paleo",       emoji: "🦴" },
  { value: "halal",       label: "Halal",       emoji: "☪️" },
  { value: "kosher",      label: "Kosher",      emoji: "✡️" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Easy",    emoji: "😌", desc: "30 min or less, simple steps" },
  { value: "medium", label: "Medium",  emoji: "👨‍🍳", desc: "45–60 min, some technique" },
  { value: "hard",   label: "Advanced",emoji: "🏆", desc: "1h+, complex methods" },
  { value: "any",    label: "Any",     emoji: "🎲", desc: "Show everything" },
];

const SEASON_OPTIONS = [
  { value: "spring", label: "Spring", emoji: "🌸" },
  { value: "summer", label: "Summer", emoji: "☀️" },
  { value: "autumn", label: "Autumn", emoji: "🍂" },
  { value: "winter", label: "Winter", emoji: "❄️" },
  { value: "any",    label: "Any",    emoji: "🗓️" },
];

// ── Extended tags ─────────────────────────────────────────────────
const TAG_GROUPS = [
  {
    group: "⏱ Time & Effort",
    tags: [
      { value: "quick-meals",       label: "Quick Meals",       emoji: "⚡", desc: "Ready in 30 min or less" },
      { value: "low-effort",        label: "Low Effort",        emoji: "🛋️", desc: "Minimal active cooking time" },
      { value: "meal-prep",         label: "Meal Prep",         emoji: "📦", desc: "Great for batch cooking" },
      { value: "make-ahead",        label: "Make Ahead",        emoji: "🗓️", desc: "Prepares well in advance" },
      { value: "one-pot",           label: "One Pot",           emoji: "🫕", desc: "Minimal washing up" },
    ],
  },
  {
    group: "👨‍👩‍👧 Audience",
    tags: [
      { value: "kids-meals",        label: "Kids Meals",        emoji: "👶", desc: "Family-friendly, mild flavours" },
      { value: "beginner-friendly", label: "Beginner Friendly", emoji: "🎓", desc: "Simple technique, hard to fail" },
      { value: "dinner-party",      label: "Dinner Party",      emoji: "🥂", desc: "Impressive for guests" },
      { value: "date-night",        label: "Date Night",        emoji: "❤️", desc: "Romantic, elegant dishes" },
      { value: "office-lunch",      label: "Office Lunch",      emoji: "💼", desc: "Packs and reheats well" },
    ],
  },
  {
    group: "💰 Budget & Health",
    tags: [
      { value: "low-budget",        label: "Low Budget",        emoji: "💸", desc: "Under £5/$6 per serving" },
      { value: "high-protein",      label: "High Protein",      emoji: "💪", desc: "25g+ protein per serving" },
      { value: "low-calorie",       label: "Low Calorie",       emoji: "🌿", desc: "Under 400 kcal per serving" },
      { value: "comfort-food",      label: "Comfort Food",      emoji: "🧸", desc: "Hearty, nostalgic, satisfying" },
      { value: "light-and-fresh",   label: "Light & Fresh",     emoji: "🍃", desc: "Salads, raw, clean eating" },
    ],
  },
  {
    group: "🌍 Style",
    tags: [
      { value: "street-food",       label: "Street Food",       emoji: "🌮", desc: "Casual, bold, authentic" },
      { value: "restaurant-style",  label: "Restaurant Style",  emoji: "⭐", desc: "Elevated plating & technique" },
      { value: "bbq",               label: "BBQ & Grill",       emoji: "🔥", desc: "Outdoor cooking" },
      { value: "baking",            label: "Baking",            emoji: "🥖", desc: "Bread, pastries, cakes" },
      { value: "five-ingredients",  label: "5 Ingredients",     emoji: "🖐️", desc: "Maximum 5 main ingredients" },
    ],
  },
];

// ── Utensils ──────────────────────────────────────────────────────
const UTENSIL_OPTIONS = [
  { value: "no-oven",       label: "No Oven",         emoji: "🚫🔥", desc: "Stovetop or no-cook only" },
  { value: "no-pot",        label: "No Pot",          emoji: "🚫🫕", desc: "No boiling required" },
  { value: "no-pan",        label: "No Pan",          emoji: "🚫🍳", desc: "No frying or sautéing" },
  { value: "no-blender",    label: "No Blender",      emoji: "🚫🌀", desc: "No blending or processing" },
  { value: "microwave-only",label: "Microwave Only",  emoji: "📡", desc: "Only needs a microwave" },
  { value: "air-fryer",     label: "Air Fryer",       emoji: "🌬️", desc: "Optimised for air fryer" },
  { value: "slow-cooker",   label: "Slow Cooker",     emoji: "⏲️", desc: "Set and forget" },
  { value: "instant-pot",   label: "Instant Pot",     emoji: "⚡🫕", desc: "Pressure cooker recipes" },
  { value: "wok",           label: "Wok",             emoji: "🥢", desc: "Stir-fry and high-heat cooking" },
  { value: "grill",         label: "Grill / BBQ",     emoji: "🔥", desc: "Outdoor or grill pan" },
  { value: "no-special",    label: "Basic Kitchen",   emoji: "✅", desc: "Just a pan and a knife" },
];

type Step = "category" | "dietary" | "difficulty" | "seasonality" | "tags" | "utensils";
const STEPS: Step[] = ["category", "dietary", "difficulty", "seasonality", "tags", "utensils"];
const STEP_LABELS: Record<Step, string> = {
  category:    "What are you cooking?",
  dietary:     "Any dietary needs?",
  difficulty:  "How much time do you have?",
  seasonality: "Any seasonal preference?",
  tags:        "Any special requirements?",
  utensils:    "What equipment do you have?",
};

interface Props {
  onApply: (filters: FilterState) => void;
  onClose: () => void;
  initial?: Partial<FilterState>;
}

export function FilterDrawer({ onApply, onClose, initial }: Props) {
  const [step, setStep] = useState<Step>("category");
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, ...initial });

  const stepIndex = STEPS.indexOf(step);
  const isLast = stepIndex === STEPS.length - 1;

  function toggleDietary(val: string) {
    setFilters((f) => ({
      ...f,
      dietary: f.dietary.includes(val) ? f.dietary.filter((d) => d !== val) : [...f.dietary, val],
    }));
  }

  function toggleTag(val: string) {
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(val) ? f.tags.filter((t) => t !== val) : [...f.tags, val],
    }));
  }

  function toggleUtensil(val: string) {
    setFilters((f) => ({
      ...f,
      utensils: f.utensils.includes(val) ? f.utensils.filter((u) => u !== val) : [...f.utensils, val],
    }));
  }

  function nextStep() {
    if (isLast) { onApply(filters); onClose(); }
    else setStep(STEPS[stepIndex + 1]);
  }

  function prevStep() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  }

  function handleApplyNow() { onApply(filters); onClose(); }

  const activeCount =
    (filters.category && filters.category !== "any" ? 1 : 0) +
    filters.dietary.length +
    (filters.difficulty && filters.difficulty !== "any" ? 1 : 0) +
    (filters.seasonality && filters.seasonality !== "any" ? 1 : 0) +
    filters.tags.length +
    filters.utensils.length;

  return (
    <>
      <div className="filter-drawer-overlay" onClick={onClose} aria-hidden="true" />

      <div className="filter-drawer-panel flex flex-col gap-0" role="dialog" aria-modal="true" aria-label="Filter recipes">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal style={{ width: 18, height: 18, color: "var(--wc-accent-saffron, #F4A261)" }} />
            <span className="font-bold" style={{ color: "var(--rc-title, #EFE3CE)", fontSize: "0.95rem" }}>
              Filter Recipes
            </span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(244,162,97,0.2)", color: "var(--wc-accent-saffron, #F4A261)", border: "1px solid rgba(244,162,97,0.3)" }}>
                {activeCount} active
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Close filters"
            className="flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.06)" }}>
            <X style={{ width: 16, height: 16, color: "var(--rc-meta, #A08060)" }} />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(s)}
              className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= stepIndex ? "var(--wc-accent-saffron, #F4A261)" : "rgba(90,58,40,0.4)" }}
              aria-label={`Go to ${s} step`}
            />
          ))}
        </div>

        {/* Step label */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--rc-sub, #6B4E36)" }}>
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <h2 className="text-lg font-bold mb-5" style={{ color: "var(--rc-title, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          {STEP_LABELS[step]}
        </h2>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {step === "category" && (
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setFilters((f) => ({ ...f, category: c.value }))}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: filters.category === c.value ? "rgba(244,162,97,0.15)" : "rgba(42,24,8,0.5)",
                    border: `1px solid ${filters.category === c.value ? "rgba(244,162,97,0.4)" : "rgba(58,36,22,0.5)"}`,
                    color: filters.category === c.value ? "var(--wc-accent-saffron, #F4A261)" : "var(--rc-meta, #A08060)",
                  }}>
                  <span style={{ fontSize: "1.25rem" }}>{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === "dietary" && (
            <div className="flex flex-col gap-2">
              {DIETARY_OPTIONS.map((d) => {
                const on = filters.dietary.includes(d.value);
                return (
                  <button key={d.value} onClick={() => toggleDietary(d.value)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: on ? "rgba(115,190,89,0.12)" : "rgba(42,24,8,0.5)",
                      border: `1px solid ${on ? "rgba(115,190,89,0.4)" : "rgba(58,36,22,0.5)"}`,
                      color: on ? "#73be59" : "var(--rc-meta, #A08060)",
                    }}>
                    <span style={{ fontSize: "1.1rem" }}>{d.emoji}</span>
                    <span className="text-sm font-semibold flex-1">{d.label}</span>
                    {on && <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(115,190,89,0.25)", color: "#73be59", fontSize: "0.65rem", fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })}
              <p className="text-xs mt-1" style={{ color: "var(--rc-sub, #6B4E36)" }}>Select all that apply (or skip)</p>
            </div>
          )}

          {step === "difficulty" && (
            <div className="flex flex-col gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button key={d.value} onClick={() => setFilters((f) => ({ ...f, difficulty: d.value }))}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: filters.difficulty === d.value ? "rgba(244,162,97,0.15)" : "rgba(42,24,8,0.5)",
                    border: `1px solid ${filters.difficulty === d.value ? "rgba(244,162,97,0.4)" : "rgba(58,36,22,0.5)"}`,
                    color: filters.difficulty === d.value ? "var(--wc-accent-saffron, #F4A261)" : "var(--rc-meta, #A08060)",
                  }}>
                  <span style={{ fontSize: "1.25rem" }}>{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{d.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--rc-sub, #6B4E36)" }}>{d.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === "seasonality" && (
            <div className="grid grid-cols-2 gap-2">
              {SEASON_OPTIONS.map((s) => (
                <button key={s.value} onClick={() => setFilters((f) => ({ ...f, seasonality: s.value }))}
                  className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl transition-all"
                  style={{
                    background: filters.seasonality === s.value ? "rgba(244,162,97,0.15)" : "rgba(42,24,8,0.5)",
                    border: `1px solid ${filters.seasonality === s.value ? "rgba(244,162,97,0.4)" : "rgba(58,36,22,0.5)"}`,
                    color: filters.seasonality === s.value ? "var(--wc-accent-saffron, #F4A261)" : "var(--rc-meta, #A08060)",
                  }}>
                  <span style={{ fontSize: "1.6rem" }}>{s.emoji}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === "tags" && (
            <div className="flex flex-col gap-5">
              {TAG_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 px-0.5" style={{ color: "var(--rc-sub, #6B4E36)" }}>
                    {group.group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((t) => {
                      const on = filters.tags.includes(t.value);
                      return (
                        <button key={t.value} onClick={() => toggleTag(t.value)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{
                            background: on ? "rgba(244,162,97,0.18)" : "rgba(42,24,8,0.6)",
                            border: `1px solid ${on ? "rgba(244,162,97,0.45)" : "rgba(58,36,22,0.55)"}`,
                            color: on ? "var(--wc-accent-saffron, #F4A261)" : "var(--rc-meta, #A08060)",
                          }}
                          title={t.desc}>
                          <span>{t.emoji}</span>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs" style={{ color: "var(--rc-sub, #5A3A28)" }}>
                Tags refine search results — select any that apply, or skip
              </p>
            </div>
          )}

          {step === "utensils" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs mb-3" style={{ color: "var(--rc-sub, #6B4E36)" }}>
                Tell us what you <strong style={{ color: "var(--wc-accent-saffron)" }}>don't have</strong> — we'll adapt results to match your kitchen setup.
              </p>
              {UTENSIL_OPTIONS.map((u) => {
                const on = filters.utensils.includes(u.value);
                return (
                  <button key={u.value} onClick={() => toggleUtensil(u.value)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: on ? "rgba(116,157,247,0.12)" : "rgba(42,24,8,0.5)",
                      border: `1px solid ${on ? "rgba(116,157,247,0.4)" : "rgba(58,36,22,0.5)"}`,
                      color: on ? "#749df7" : "var(--rc-meta, #A08060)",
                    }}>
                    <span style={{ fontSize: "1.1rem" }}>{u.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{u.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--rc-sub, #6B4E36)" }}>{u.desc}</div>
                    </div>
                    {on && <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(116,157,247,0.2)", color: "#749df7", fontSize: "0.65rem", fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-col gap-2">
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button onClick={prevStep}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(42,24,8,0.6)", color: "var(--rc-meta, #A08060)", border: "1px solid rgba(58,36,22,0.5)" }}>
                <ChevronLeft style={{ width: 15, height: 15 }} /> Back
              </button>
            )}
            <button onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1A0E04" }}>
              {isLast ? "Apply Filters" : "Next"}
              {!isLast && <ChevronRight style={{ width: 15, height: 15 }} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleApplyNow}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
              style={{ color: "var(--rc-sub, #6B4E36)", background: "transparent" }}>
              Apply now
            </button>
            <button onClick={() => setFilters(EMPTY_FILTERS)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
              style={{ color: "var(--rc-sub, #6B4E36)", background: "transparent" }}>
              Clear all
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
