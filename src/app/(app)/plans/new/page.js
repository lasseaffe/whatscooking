"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, Target } from "lucide-react";
import { PLAN_TEMPLATES } from "./plan-templates";
import { TemplateCard } from "./template-card";
import { MealPlanDndBuilder } from "./dnd-builder";

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "high-protein", "keto", "paleo", "low-carb",
];

const RDA_DEFAULTS = { calories: 2000, protein_g: 50, carbs_g: 300, fat_g: 65 };

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = useState(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId) ?? null : null
  );
  const [title, setTitle] = useState(selectedTemplate?.title ?? "");
  const [durationDays, setDurationDays] = useState(selectedTemplate?.durationDays ?? 7);
  const [mealsPerDay, setMealsPerDay] = useState(selectedTemplate?.mealsPerDay ?? 3);
  const [dietaryFilters, setDietaryFilters] = useState(selectedTemplate?.dietaryFilters ?? []);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState(RDA_DEFAULTS);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const CARDS_VISIBLE = 3;
  const maxOffset = Math.max(0, PLAN_TEMPLATES.length - CARDS_VISIBLE);

  useEffect(() => {
    fetch("/api/nutrition-goals")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setGoals(data);
        setGoalsLoaded(true);
      })
      .catch(() => setGoalsLoaded(true));
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setDurationDays(selectedTemplate.durationDays);
      setMealsPerDay(selectedTemplate.mealsPerDay);
      setDietaryFilters(selectedTemplate.dietaryFilters);
    }
  }, [selectedTemplate]);

  function toggleDiet(tag) {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function selectTemplate(tpl) {
    if (selectedTemplate?.id === tpl.id) {
      setSelectedTemplate(null);
      setTitle("");
      setDurationDays(7);
      setMealsPerDay(3);
      setDietaryFilters([]);
    } else {
      setSelectedTemplate(tpl);
    }
  }

  async function create() {
    if (!title.trim()) { setError("Give your plan a name."); return; }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dietary_tags: dietaryFilters,
          tags: selectedTemplate ? selectedTemplate.tags : [],
          description: selectedTemplate
            ? selectedTemplate.description
            : `${durationDays}-day plan, ${mealsPerDay} meals/day`,
          duration_days: durationDays,
          meals_per_day: mealsPerDay,
          nutritional_goals: goals,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create plan.");
        setCreating(false);
        return;
      }

      const plan = await res.json();
      router.push(`/plans/${plan.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  if (selectedTemplate && presetId) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            <span className="text-2xl">{selectedTemplate.emoji}</span>
            {selectedTemplate.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
            {selectedTemplate.subtitle} · {selectedTemplate.durationDays} days · {selectedTemplate.mealsPerDay} meals/day
          </p>
        </div>
        <MealPlanDndBuilder template={selectedTemplate} />
      </div>
    );
  }

  const isUsingRda = goals.calories === RDA_DEFAULTS.calories && goals.protein_g === RDA_DEFAULTS.protein_g;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Page heading ─────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          <CalendarDays className="w-6 h-6" style={{ color: "#C8522A" }} />
          New Meal Plan
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
          Start from a template or build your own.
        </p>
      </div>

      {/* ── Template carousel ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "#C8522A" }} />
          <h2 className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>Choose a Template</h2>
          <span className="text-xs" style={{ color: "#6B4E36" }}>— optional</span>
          {goalsLoaded && isUsingRda && (
            <a
              href="/calorie-tracker?tab=goals"
              className="flex items-center gap-1 text-xs ml-auto px-2 py-0.5 rounded-full border"
              style={{ borderColor: "#3A2416", color: "#C8522A" }}
            >
              <Target className="w-3 h-3" /> Set your goals →
            </a>
          )}
        </div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setCarouselOffset((o) => Math.max(0, o - 1))}
            disabled={carouselOffset === 0}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-opacity disabled:opacity-30"
            style={{ borderColor: "#3A2416", background: "#1C1209", color: "#EFE3CE" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-3 transition-transform duration-300"
              style={{ transform: `translateX(calc(-${carouselOffset} * (33.333% + 4px)))` }}
            >
              {PLAN_TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="flex-shrink-0" style={{ width: "calc(33.333% - 8px)" }}>
                  <TemplateCard
                    template={tpl}
                    selected={selectedTemplate?.id === tpl.id}
                    onSelect={() => selectTemplate(tpl)}
                    goals={goals}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCarouselOffset((o) => Math.min(maxOffset, o + 1))}
            disabled={carouselOffset >= maxOffset}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-opacity disabled:opacity-30"
            style={{ borderColor: "#3A2416", background: "#1C1209", color: "#EFE3CE" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Inline form + filters ────────────────────────────── */}
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{ borderColor: "#3A2416", background: "#1C1209" }}
      >
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
              Plan name *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My High-Protein Week"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Days</label>
            <input
              type="number" min={1} max={30} value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-16 px-3 py-2 rounded-xl border text-sm text-center focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Meals/day</label>
            <input
              type="number" min={1} max={6} value={mealsPerDay}
              onChange={(e) => setMealsPerDay(Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-xl border text-sm text-center focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "#8A6A4A" }}>
            Dietary filters
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((tag) => (
              <button
                key={tag} type="button" onClick={() => toggleDiet(tag)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: dietaryFilters.includes(tag) ? "#C8522A" : "#3A2416",
                  background: dietaryFilters.includes(tag) ? "#2A1010" : "#130C05",
                  color: dietaryFilters.includes(tag) ? "#C8522A" : "#6B4E36",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-3 rounded-xl border text-sm font-medium"
          style={{ borderColor: "#3A2416", color: "#6B4E36" }}
        >
          Cancel
        </button>
        <button
          onClick={create}
          disabled={creating || !title.trim()}
          className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          style={{ background: "#C8522A", color: "#fff" }}
        >
          {creating ? "Creating…" : "Create plan →"}
        </button>
      </div>
    </div>
  );
}
