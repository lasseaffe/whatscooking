import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanBuilder, type BuilderEntry } from "./plan-builder";
import { SavedRecipeFit } from "./saved-recipe-fit";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: plan }, { data: entries }, { data: saves }] = await Promise.all([
    supabase.from("meal_plans").select("*").eq("id", id).single(),
    supabase.from("meal_entries").select("*").eq("meal_plan_id", id).order("day_number").order("position"),
    supabase
      .from("recipe_saves")
      .select("recipe:recipes!inner(id, title, image_url, dietary_tags, prep_time_minutes, cook_time_minutes, calories, cuisine_type)")
      .eq("user_id", user!.id)
      .order("saved_at", { ascending: false })
      .limit(40),
  ]);

  if (!plan || plan.user_id !== user!.id) notFound();

  const savedRecipes = (saves ?? []).map((s) => s.recipe as unknown as {
    id: string; title: string; image_url: string | null;
    dietary_tags: string[] | null; prep_time_minutes: number | null;
    cook_time_minutes: number | null; calories: number | null; cuisine_type: string | null;
  });

  const initialEntries: BuilderEntry[] = (entries ?? []).map((e) => ({
    clientId: e.id ?? Math.random().toString(36).slice(2),
    dbId: e.id,
    recipe_id: e.recipe_id ?? null,
    day_number: e.day_number,
    meal_type: e.meal_type ?? "dinner",
    recipe_title: e.recipe_title ?? "",
    description: e.description ?? "",
    calories: e.calories ?? null,
    protein_g: e.protein_g ?? null,
    carbs_g: e.carbs_g ?? null,
    fat_g: e.fat_g ?? null,
    position: e.position ?? 0,
    isEditing: false,
  }));

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/plans" className="p-2 rounded-lg transition-colors" style={{ color: "#8A6A4A", background: "#1C1209" }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>{plan.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8A6A4A" }}>
            {plan.duration_days} days · {plan.meals_per_day} meals/day
            {plan.dietary_filters?.length > 0 && " · " + plan.dietary_filters.join(", ")}
          </p>
        </div>
        <span className="ml-auto text-xs px-3 py-1 rounded-full"
          style={{ background: plan.status === "active" ? "#2A1808" : "#1A1A08", color: plan.status === "active" ? "#C8522A" : "#C89818", border: `1px solid ${plan.status === "active" ? "#C8522A30" : "#C8981830"}` }}>
          {plan.status}
        </span>
      </div>

      {/* Interactive builder */}
      <PlanBuilder
        planId={id}
        planTitle={plan.title}
        durationDays={plan.duration_days ?? 7}
        dietaryFilters={plan.dietary_filters ?? []}
        nutritionalGoals={plan.nutritional_goals ?? {}}
        initialEntries={initialEntries}
      />

      {/* Saved recipes that fit this plan */}
      <SavedRecipeFit
        savedRecipes={savedRecipes}
        planDietaryFilters={plan.dietary_filters ?? []}
      />
    </div>
  );
}
