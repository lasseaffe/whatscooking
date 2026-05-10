"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { WeeklyPlanGrid, type GridEntry, type MealType, type AutofillSuggestion } from "@/components/plans/WeeklyPlanGrid";
import { RecipeBank, type BankRecipe } from "@/components/plans/RecipeBank";
import type { PlanTemplate } from "./plan-templates";

const MEAL_CYCLE: MealType[] = ["breakfast", "lunch", "dinner"];

function templateToEntries(template: PlanTemplate): GridEntry[] {
  const entries: GridEntry[] = [];
  let clientIdx = 0;
  for (let day = 1; day <= template.durationDays; day++) {
    MEAL_CYCLE.forEach((mealType, i) => {
      const meal = template.meals[(day - 1 + i) % template.meals.length];
      entries.push({
        clientId: `template-${clientIdx++}`,
        day_number: day,
        meal_type: mealType,
        recipe_title: meal.title,
        image_url: meal.image ?? null,
        calories: meal.calories ?? null,
      });
    });
  }
  return entries;
}

interface Props {
  template: PlanTemplate;
}

export function MealPlanDndBuilder({ template }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<GridEntry[]>(() => templateToEntries(template));
  const [durationDays, setDurationDays] = useState(template.durationDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState(template.title);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [focusMealType, setFocusMealType] = useState<MealType | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === "recipe-bank") {
      const overId = String(over.id);
      if (overId.startsWith("cell-")) {
        const parts = overId.replace("cell-", "").split("-");
        const day = parseInt(parts[0]);
        const mealType = parts[1] as MealType;
        const recipe = active.data.current.recipe as BankRecipe;
        const newEntry: GridEntry = {
          clientId: `drop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          day_number: day,
          meal_type: mealType,
          recipe_title: recipe.title,
          image_url: recipe.image_url ?? null,
          calories: recipe.calories ?? null,
          protein_g: recipe.protein_g ?? null,
          carbs_g: recipe.carbs_g ?? null,
          fat_g: recipe.fat_g ?? null,
        };
        setEntries((prev) => {
          const filtered = prev.filter((e) => !(e.day_number === day && e.meal_type === mealType));
          return [...filtered, newEntry];
        });
      }
    }
  }

  const handleRemove = useCallback((clientId: string) => {
    setEntries((prev) => prev.filter((e) => e.clientId !== clientId));
  }, []);

  const handleAddDay = useCallback(() => {
    setDurationDays((d) => Math.min(d + 1, 14));
  }, []);

  const handleAutofill = useCallback(async (_day: number, _mealType: MealType): Promise<AutofillSuggestion[]> => {
    return [];
  }, []);

  const handleAutofillAccept = useCallback((day: number, mealType: MealType, suggestion: AutofillSuggestion) => {
    const newEntry: GridEntry = {
      clientId: `autofill-${Date.now()}`,
      day_number: day,
      meal_type: mealType,
      recipe_title: suggestion.title,
      calories: suggestion.calories ?? null,
      protein_g: suggestion.protein_g ?? null,
    };
    setEntries((prev) => {
      const filtered = prev.filter((e) => !(e.day_number === day && e.meal_type === mealType));
      return [...filtered, newEntry];
    });
  }, []);

  async function handleSave() {
    if (!planName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planName.trim(),
          dietary_tags: template.dietaryFilters,
          tags: template.tags,
          description: template.description,
          duration_days: durationDays,
          meals_per_day: template.mealsPerDay,
          week_start: weekStart ?? undefined,
        }),
      });
      if (!planRes.ok) {
        const d = await planRes.json();
        throw new Error(d.error ?? "Failed to create plan");
      }
      const plan = await planRes.json();

      const entryPayload = entries.map((e, pos) => ({
        day_number: e.day_number,
        meal_type: e.meal_type,
        recipe_title: e.recipe_title,
        calories: e.calories,
        protein_g: e.protein_g,
        carbs_g: e.carbs_g,
        fat_g: e.fat_g,
        position: pos,
      }));

      if (entryPayload.length > 0) {
        const entriesRes = await fetch(`/api/plans/${plan.id}/entries`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: entryPayload }),
        });
        if (!entriesRes.ok) {
          const d = await entriesRes.json();
          throw new Error(d.error ?? "Plan created but entries failed to save.");
        }
      }

      router.push(`/plans/${plan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  const filledCount = entries.length;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <DragOverlay />
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
          <label className="flex flex-col gap-1 shrink-0">
            <span className="text-xs font-medium" style={{ color: "#8A6A4A" }}>Start date</span>
            <input
              type="date"
              value={weekStart ?? ""}
              onChange={(e) => setWeekStart(e.target.value || null)}
              className="px-2 py-1.5 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </label>
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
            <RecipeBank
              planId=""
              dietaryFilters={template.dietaryFilters ?? []}
              focusMealType={focusMealType}
            />
          </div>

          {/* Right: Weekly grid */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
            <p className="text-sm font-bold mb-4" style={{ color: "#EFE3CE" }}>Weekly Planner</p>
            <WeeklyPlanGrid
              entries={entries}
              durationDays={durationDays}
              weekStart={weekStart}
              onRemove={handleRemove}
              onAddDay={handleAddDay}
              onAutofill={handleAutofill}
              onAutofillAccept={handleAutofillAccept}
              onOpenRecipeBank={(mt) => setFocusMealType(mt)}
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
}
