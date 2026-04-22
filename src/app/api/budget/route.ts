import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimateWeeklyPlanCost } from "@/lib/cost-estimator";

// GET /api/budget — return weekly_budget + estimated_spent from active plans
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the user's weekly budget
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("weekly_budget")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch active meal plan IDs
  const { data: activePlans } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");

  let estimated_spent = 0;

  if (activePlans && activePlans.length > 0) {
    const planIds = activePlans.map((p) => p.id);

    const { data: entries } = await supabase
      .from("meal_entries")
      .select("recipe_id, recipe:recipes(ingredients, servings)")
      .in("meal_plan_id", planIds);

    if (entries) {
      estimated_spent = estimateWeeklyPlanCost(
        entries as unknown as Array<{
          recipe_id?: string | null;
          recipe?: { ingredients: { name: string; amount?: number; unit?: string; category?: string }[]; servings?: number | null } | null;
        }>
      );
    }
  }

  return NextResponse.json({
    weekly_budget: (prefs as { weekly_budget: number | null } | null)?.weekly_budget ?? null,
    estimated_spent,
    currency: "USD",
  });
}

// PUT /api/budget — set/update weekly budget
export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { weekly_budget?: number };
  const weekly_budget = typeof body.weekly_budget === "number" && body.weekly_budget > 0
    ? body.weekly_budget
    : null;

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: user.id, weekly_budget, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, weekly_budget });
}
