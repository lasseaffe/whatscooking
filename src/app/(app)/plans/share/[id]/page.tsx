import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, Coffee, Soup, Cookie } from "lucide-react";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack", "dessert"];
const MEAL_ICONS: Record<string, React.ElementType> = {
  breakfast: Coffee, lunch: UtensilsCrossed, dinner: Soup, snack: Cookie, dessert: Cookie,
};
const MEAL_COLORS: Record<string, { color: string; bg: string }> = {
  breakfast: { color: "#7A5C1E", bg: "#F5EDD8" },
  lunch:     { color: "#4A5C2A", bg: "#EBF0DC" },
  dinner:    { color: "#7A3520", bg: "#F5E0D8" },
  snack:     { color: "#5C4A2A", bg: "#EDE0CC" },
  dessert:   { color: "#7A3D4E", bg: "#F5E0E8" },
};

export default async function SharedPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!plan) notFound();

  const { data: entries } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("meal_plan_id", id)
    .order("day_number")
    .order("position");

  const days = Array.from({ length: plan.duration_days ?? 7 }, (_, i) => i + 1);
  const byDay: Record<number, typeof entries> = {};
  days.forEach((d) => { byDay[d] = []; });
  (entries ?? []).forEach((e) => { const d = e.day_number; if (d != null && byDay[d]) byDay[d].push(e); });

  return (
    <div className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-3"
          style={{ background: "#FFE4D6", color: "#C85A2F" }}>
          🔗 Shared meal plan
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#3D2817" }}>{plan.title}</h1>
        <p className="text-sm" style={{ color: "#A69180" }}>
          {plan.duration_days} days · {plan.meals_per_day} meals/day
          {plan.dietary_filters?.length > 0 && " · " + plan.dietary_filters.join(", ")}
        </p>
      </div>

      {/* Day cards */}
      <div className="flex flex-col gap-4">
        {days.map((day) => {
          const dayEntries = (byDay[day] ?? []).sort(
            (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
          );
          if (dayEntries.length === 0) return null;
          const totalCal = dayEntries.reduce((s, e) => s + (e.calories ?? 0), 0);
          return (
            <div key={day} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ background: "#FFF8F3" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>Day {day}</span>
                {totalCal > 0 && <span className="text-xs" style={{ color: "#A69180" }}>{totalCal} kcal</span>}
              </div>
              <div className="divide-y" style={{ borderColor: "#F5E6D3" }}>
                {dayEntries.map((entry, i) => {
                  const cfg = MEAL_COLORS[entry.meal_type] ?? MEAL_COLORS.dinner;
                  const Icon = MEAL_ICONS[entry.meal_type] ?? UtensilsCrossed;
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon className="w-3 h-3" />
                        <span className="capitalize">{entry.meal_type}</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#3D2817" }}>{entry.recipe_title}</span>
                      {entry.calories && (
                        <span className="ml-auto text-xs shrink-0" style={{ color: "#A69180" }}>{entry.calories} kcal</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs mb-3" style={{ color: "#A69180" }}>Want to create your own meal plan?</p>
        <Link href="/plans/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "#C85A2F", color: "#fff" }}>
          Create a meal plan
        </Link>
      </div>
    </div>
  );
}
