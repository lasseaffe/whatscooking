import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

export default async function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (!plan) notFound();

  const { data: entries } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("meal_plan_id", id)
    .order("day_number");

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>{plan.title}</h1>
      <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>
        {plan.meals_per_day} meals · {plan.duration_days}d · {plan.cuisine || "Mixed"}
      </p>

      {entries && entries.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-4" style={{ color: "#3D2817" }}>Meals</h2>
          {entries.map((entry) => (
            <div key={entry.id} className="mb-3 p-4 rounded-xl border" style={{ borderColor: "#F5E6D3" }}>
              <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>
                Day {entry.day_number} - {entry.meal_type}
              </p>
              <p style={{ color: "#6B5B52" }}>{entry.recipe_title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
