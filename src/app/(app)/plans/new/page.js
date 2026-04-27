"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, CalendarDays, Utensils, ChevronDown, ChevronUp } from "lucide-react";
import { PLAN_TEMPLATES } from "./plan-templates";
import { TemplateCard } from "./template-card";
import { MealPlanDndBuilder } from "./dnd-builder";

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "high-protein", "keto", "paleo", "low-carb",
];

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = useState(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId) ?? null : null
  );
  const [title, setTitle] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [showCustom, setShowCustom] = useState(!presetId);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // When a template is selected, pre-fill fields
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
          // Store duration/meals-per-day as part of description for now
          description: selectedTemplate
            ? selectedTemplate.description
            : `${durationDays}-day plan, ${mealsPerDay} meals/day`,
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

  // When arriving with a template param, skip the picker and go straight to the DnD builder
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

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-7">
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

      {/* ── Template grid ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" style={{ color: "#C8522A" }} />
          <h2 className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>Choose a Template</h2>
          <span className="text-xs" style={{ color: "#6B4E36" }}>— optional</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLAN_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              selected={selectedTemplate?.id === tpl.id}
              onSelect={() => {
                if (selectedTemplate?.id === tpl.id) {
                  setSelectedTemplate(null);
                  setTitle("");
                } else {
                  setSelectedTemplate(tpl);
                  setShowCustom(false);
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Plan details ───────────────────────────────────────────── */}
      <section
        className="rounded-2xl border p-5 space-y-5"
        style={{ borderColor: "#3A2416", background: "#1C1209" }}
      >
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold w-full text-left"
          style={{ color: "#EFE3CE" }}
        >
          <Utensils className="w-4 h-4" style={{ color: "#C8522A" }} />
          Customise plan details
          {showCustom
            ? <ChevronUp className="w-4 h-4 ml-auto" style={{ color: "#6B4E36" }} />
            : <ChevronDown className="w-4 h-4 ml-auto" style={{ color: "#6B4E36" }} />}
        </button>

        {showCustom && (
          <div className="space-y-4 pt-1">
            <div>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
                  Duration (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
                  Meals per day
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
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
                    key={tag}
                    type="button"
                    onClick={() => toggleDiet(tag)}
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
          </div>
        )}

        {/* Name input always visible when template pre-fills it */}
        {!showCustom && selectedTemplate && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
              Plan name *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
        )}
      </section>

      {error && (
        <p className="mt-3 text-sm" style={{ color: "#DC2626" }}>{error}</p>
      )}

      <div className="mt-6 flex gap-3">
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
