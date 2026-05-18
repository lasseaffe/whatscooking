// src/app/api/recipes/picker/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mealType = url.searchParams.get("meal_type");
  const planId = url.searchParams.get("plan_id");
  const excludeIds = (url.searchParams.get("exclude_recipe_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load plan for dietary filters (if plan_id passed)
  let dietFilters: string[] = [];
  if (planId) {
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("user_id, dietary_filters, pinboard_filters")
      .eq("id", planId)
      .single();
    if (plan && plan.user_id === user.id) {
      const pf = (plan.pinboard_filters ?? {}) as Record<string, unknown>;
      dietFilters = Array.isArray(pf.diet)
        ? (pf.diet as string[])
        : (plan.dietary_filters ?? []);
    }
  }

  let query = supabase
    .from("recipes")
    .select(
      "id, title, image_url, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories",
    )
    .limit(40);

  if (q) query = query.ilike("title", `%${q}%`);
  if (mealType) query = query.contains("dish_types", [mealType]);
  if (dietFilters.length > 0) query = query.contains("dietary_tags", dietFilters);
  if (excludeIds.length > 0) {
    query = query.not(
      "id",
      "in",
      `(${excludeIds.map((id) => `"${id}"`).join(",")})`,
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ recipes: data ?? [] });
}
