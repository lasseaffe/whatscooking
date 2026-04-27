"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { RecipeSearchPanel, type DraggableRecipe } from "./recipe-search-panel";
import { WeeklyGrid, type GridSlot, type MealType } from "./weekly-grid";
import type { PlanTemplate } from "./plan-templates";

const MEAL_CYCLE: MealType[] = ["breakfast", "lunch", "dinner"];

function templateToSlots(template: PlanTemplate): GridSlot[] {
  const slots: GridSlot[] = [];
  for (let day = 1; day <= template.durationDays; day++) {
    MEAL_CYCLE.forEach((mealType, i) => {
      const meal = template.meals[(day - 1 + i) % template.meals.length];
      slots.push({
        day,
        mealType,
        recipe: {
          id: null,
          title: meal.title,
          image: meal.image,
          tags: meal.tags,
          time: meal.time,
          calories: meal.calories,
          protein_g: null,
          description: null,
        },
      });
    });
    // snack slot starts empty
    slots.push({ day, mealType: "snack", recipe: null });
  }
  return slots;
}

interface Props {
  template: PlanTemplate;
}

export function MealPlanDndBuilder({ template }: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState<GridSlot[]>(() => templateToSlots(template));
  const [draggedRecipe, setDraggedRecipe] = useState<DraggableRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState(template.title);

  const handleSlotDrop = useCallback((day: number, mealType: MealType) => {
    if (!draggedRecipe) return;
    setSlots((prev) =>
      prev.map((s) => s.day === day && s.mealType === mealType ? { ...s, recipe: draggedRecipe } : s)
    );
    setDraggedRecipe(null);
  }, [draggedRecipe]);

  const handleSlotClear = useCallback((day: number, mealType: MealType) => {
    setSlots((prev) =>
      prev.map((s) => s.day === day && s.mealType === mealType ? { ...s, recipe: null } : s)
    );
  }, []);

  async function handleSave() {
    if (!planName.trim()) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Create the plan
      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planName.trim(),
          dietary_tags: template.dietaryFilters,
          tags: template.tags,
          description: template.description,
          duration_days: template.durationDays,
          meals_per_day: template.mealsPerDay,
        }),
      });

      if (!planRes.ok) {
        const d = await planRes.json();
        setError(d.error ?? "Failed to create plan.");
        setSaving(false);
        return;
      }

      const plan = await planRes.json();

      // 2. Save entries
      const entries = slots
        .filter((s) => s.recipe !== null)
        .map((s, i) => ({
          day_number: s.day,
          meal_type: s.mealType,
          recipe_id: s.recipe!.id ?? null,
          recipe_title: s.recipe!.title,
          description: s.recipe!.description ?? null,
          calories: s.recipe!.calories ?? null,
          protein_g: s.recipe!.protein_g ?? null,
          position: i,
        }));

      if (entries.length > 0) {
        const entriesRes = await fetch(`/api/plans/${plan.id}/entries`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        });

        if (!entriesRes.ok) {
          const d = await entriesRes.json();
          setError(d.error ?? "Plan created but entries failed to save.");
          setSaving(false);
          return;
        }
      }

      router.push(`/plans/${plan.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const filledCount = slots.filter((s) => s.recipe !== null).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Plan name + save bar */}
      <div className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
        <div className="flex-1">
          <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Plan name</label>
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
          />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs mb-1" style={{ color: "#6B4E36" }}>{filledCount} meals added</p>
          <button
            onClick={handleSave}
            disabled={saving || !planName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Plan"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Recipe bank */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "#EFE3CE" }}>Recipe Bank</p>
          <RecipeSearchPanel
            templateMeals={template.meals}
            onDragStart={setDraggedRecipe}
            onDragEnd={() => setDraggedRecipe(null)}
          />
        </div>

        {/* Right: Weekly grid */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "#EFE3CE" }}>Weekly Planner</p>
          <WeeklyGrid
            durationDays={template.durationDays}
            slots={slots}
            draggedRecipe={draggedRecipe}
            onSlotDrop={handleSlotDrop}
            onSlotClear={handleSlotClear}
          />
        </div>
      </div>
    </div>
  );
}
