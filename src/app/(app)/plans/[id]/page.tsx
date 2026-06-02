import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanBuilder } from "./plan-builder";
import type { PlanStatus, PinboardFilters } from "./use-planner-state";
import { SavedRecipeFit } from "./saved-recipe-fit";
import { EcosystemPortal } from "@/components/ecosystem/EcosystemPortal";
import { detectGrowableIngredients, getRecipePortalState } from "@/lib/ecosystem";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: plan, error: planError }, { data: saves }, { data: profile }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("id, title, duration_days, week_start, meals_per_day, status, pinboard_filters, dietary_filters, nutritional_goals, user_id, person_count, track_intake")
      .eq("id", id)
      .single(),
    supabase
      .from("recipe_saves")
      .select("recipe:recipes!inner(id, title, image_url, dietary_tags, prep_time_minutes, cook_time_minutes, calories, cuisine_type)")
      .eq("user_id", user!.id)
      .order("saved_at", { ascending: false })
      .limit(40),
    supabase
      .from("profiles")
      .select("track_intake")
      .eq("id", user!.id)
      .single(),
  ]);

  void planError;
  if (!plan || plan.user_id !== user!.id) notFound();

  // Ecosystem: fetch upcoming meal plan items + their ingredient names to detect garden matches
  const { data: upcomingItems } = await supabase
    .from("meal_plan_items")
    .select("recipe_id, planned_date, recipes(ingredients)")
    .eq("plan_id", id)
    .gte("planned_date", new Date().toISOString().split("T")[0])
    .order("planned_date")
    .limit(14);

  let planPortalState = null;
  let planGrowableIngredients: string[] = [];
  if (upcomingItems && upcomingItems.length > 0) {
    const allIngNames = upcomingItems.flatMap((item) => {
      const ings = (Array.isArray(item.recipes) ? item.recipes[0]?.ingredients : (item.recipes as { ingredients?: unknown } | null)?.ingredients) ?? [];
      return (ings as { name?: string }[]).map((i) => i.name ?? "").filter(Boolean);
    });
    planGrowableIngredients = await detectGrowableIngredients(allIngNames);
    if (planGrowableIngredients.length > 0) {
      planPortalState = await getRecipePortalState({ wcUserId: user!.id, growableIngredients: planGrowableIngredients });
    }
  }

  const hasGoals = Object.keys((plan.nutritional_goals ?? {}) as Record<string, number>).length > 0;
  const trackingEnabled = hasGoals || !!plan.track_intake || !!(profile?.track_intake);

  const savedRecipes = (saves ?? []).map((s) => s.recipe as unknown as {
    id: string; title: string; image_url: string | null;
    dietary_tags: string[] | null; prep_time_minutes: number | null;
    cook_time_minutes: number | null; calories: number | null; cuisine_type: string | null;
  });

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

      {/* Ecosystem: garden → meal plan bridge */}
      {planPortalState && planGrowableIngredients.length > 0 && (
        <div className="mb-6">
          <EcosystemPortal
            portalState={planPortalState}
            growableIngredients={planGrowableIngredients}
          />
        </div>
      )}

      {/* New stacked builder: Pinboard + Weave */}
      <PlanBuilder
        planId={plan.id}
        planTitle={plan.title}
        durationDays={plan.duration_days ?? 7}
        weekStart={plan.week_start ?? null}
        mealsPerDay={plan.meals_per_day ?? 3}
        status={(plan.status ?? "draft") as PlanStatus}
        pinboardFilters={(plan.pinboard_filters ?? {}) as Partial<PinboardFilters>}
        nutritionalGoals={(plan.nutritional_goals ?? {}) as Record<string, number>}
        personCount={plan.person_count ?? 1}
        trackingEnabled={trackingEnabled}
      />

      {/* Saved recipes that fit this plan */}
      <SavedRecipeFit
        savedRecipes={savedRecipes}
        planDietaryFilters={plan.dietary_filters ?? []}
      />
    </div>
  );
}
