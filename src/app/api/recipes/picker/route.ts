// src/app/api/recipes/picker/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  loadPantrySet,
  pantryMatch,
  pantryMissingCount,
  inspirationMatch,
} from "@/lib/recipe-match";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mealType = url.searchParams.get("meal_type");
  const planId = url.searchParams.get("plan_id");
  const excludeIds = (url.searchParams.get("exclude_recipe_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const pantryAware = url.searchParams.get("pantry_aware") === "1";
  const pantryMissingMax = parseInt(
    url.searchParams.get("pantry_missing_max") ?? "4",
    10,
  );
  const inspirationTags = (url.searchParams.get("inspiration_tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const limitParam = parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 40;

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

  const ranked = pantryAware || inspirationTags.length > 0;

  // When ranking we need ingredients + tags for scoring. Otherwise stick to the
  // legacy lean projection so existing callers don't pay for extra columns.
  const selectCols = ranked
    ? "id, title, image_url, focal_x, focal_y, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, batch_friendly, ingredients"
    : "id, title, image_url, focal_x, focal_y, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories";

  let query = supabase
    .from("recipes")
    .select(selectCols)
    // Over-fetch when ranking so we can sort/trim client-side.
    .limit(ranked ? Math.max(limit * 4, 80) : limit);

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
  if (!ranked) {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!ranked) {
    return NextResponse.json({ recipes: data ?? [] });
  }

  // Ranking path — load pantry once and score.
  const pantrySet = pantryAware
    ? await loadPantrySet(supabase, user.id)
    : new Set<string>();

  type RecipeRow = Record<string, unknown> & {
    id: string;
    ingredients?: unknown;
    dietary_tags?: string[] | null;
    dish_types?: string[] | null;
    cuisine_type?: string | null;
  };

  const scored = ((data ?? []) as unknown as RecipeRow[])
    .filter((r) =>
      !pantryAware || pantryMissingCount(r, pantrySet) <= pantryMissingMax,
    )
    .map((r) => {
      const pm = pantryAware ? pantryMatch(r, pantrySet) : 0;
      const im = inspirationMatch(r, inspirationTags);
      const score = pm * 0.5 + im * 0.5;
      // Strip ingredients from the response payload — clients don't need them.
      const { ingredients: _ingredients, ...rest } = r;
      void _ingredients;
      return {
        ...rest,
        pantry_match: pm,
        inspiration_match: im,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ recipes: scored });
}
