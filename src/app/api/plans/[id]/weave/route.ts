// src/app/api/plans/[id]/weave/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weave } from "@/lib/weave-solver";
import type {
  SolverRecipe,
  SolverConstraints,
  MealType,
} from "@/lib/weave-solver/types";
import {
  loadPantrySet,
  pantryMatch as computePantryMatch,
  pantryMissingCount as computePantryMissing,
  inspirationMatch as computeInspirationMatch,
  squadHardFilter,
  squadScore,
} from "@/lib/recipe-match";
import { resolveSquadPreferences } from "@/lib/plans/squad-resolve";

const DEFAULT_CONSTRAINTS: SolverConstraints = {
  diet: [],
  time_weeknight_max: 30,
  time_weekend_max: 120,
  squad_size: 2,
  pantry_aware: false,
  pantry_missing_max: 4,
  anti_repeat: "moderate",
  batch_enabled: false,
  meal_types: ["breakfast", "lunch", "dinner"],
};

function defaultMealTypes(meals_per_day: number | null): MealType[] {
  if ((meals_per_day ?? 3) <= 1) return ["dinner"];
  if (meals_per_day === 2) return ["lunch", "dinner"];
  if (meals_per_day === 3) return ["breakfast", "lunch", "dinner"];
  return ["breakfast", "lunch", "dinner", "snack"];
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: planId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const seed = typeof body?.seed === "number" ? body.seed : 0;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Load plan + ownership check
  const { data: plan, error: planErr } = await supabase
    .from("meal_plans")
    .select("id, user_id, duration_days, week_start, meals_per_day, dietary_filters, pinboard_filters")
    .eq("id", planId)
    .single();
  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message ?? "plan not found" }, { status: 404 });
  }
  if (plan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Resolve constraints from pinboard_filters + plan defaults
  const filters = (plan.pinboard_filters ?? {}) as Record<string, unknown>;
  const constraints: SolverConstraints = {
    ...DEFAULT_CONSTRAINTS,
    diet: Array.isArray(filters.diet)
      ? (filters.diet as string[])
      : (plan.dietary_filters ?? []),
    time_weeknight_max:
      typeof filters.time_weeknight === "number"
        ? (filters.time_weeknight as number)
        : DEFAULT_CONSTRAINTS.time_weeknight_max,
    time_weekend_max:
      typeof filters.time_weekend === "number"
        ? (filters.time_weekend as number)
        : DEFAULT_CONSTRAINTS.time_weekend_max,
    squad_size:
      typeof filters.squad_size === "number"
        ? (filters.squad_size as number)
        : DEFAULT_CONSTRAINTS.squad_size,
    pantry_aware: !!filters.pantry_aware,
    anti_repeat:
      (filters.anti_repeat as SolverConstraints["anti_repeat"]) ?? "moderate",
    batch_enabled: !!filters.batch_enabled,
    meal_types: defaultMealTypes(plan.meals_per_day),
  };

  // 3. Load pantry once for pantry-match scoring
  const pantrySet = await loadPantrySet(supabase, user.id);

  // 3b. Resolve squad preferences (auto-enable when ≥1 member; allow per-plan
  // opt-out via pinboard_filters.squad_aware === false).
  const squad = await resolveSquadPreferences(supabase, user.id);
  const squadAware =
    filters.squad_aware === false ? false : squad.members.length >= 1;

  function pantryMatch(recipe: { ingredients?: unknown }): number {
    return computePantryMatch(recipe, pantrySet);
  }

  function pantryMissingCount(recipe: { ingredients?: unknown }): number {
    return computePantryMissing(recipe, pantrySet);
  }

  // 4. Inspiration tags from filters
  const inspirationTags = Array.isArray(filters.inspiration_tags)
    ? (filters.inspiration_tags as string[])
    : [];

  function inspirationMatch(r: {
    dietary_tags?: string[] | null;
    dish_types?: string[] | null;
    cuisine_type?: string | null;
  }): number {
    return computeInspirationMatch(r, inspirationTags);
  }

  function toSolverRecipe(r: Record<string, unknown>): SolverRecipe {
    return {
      id: r.id as string,
      title: (r.title as string) ?? "",
      image_url: (r.image_url as string | null) ?? null,
      cuisine_type: (r.cuisine_type as string | null) ?? null,
      dietary_tags: (r.dietary_tags as string[] | null) ?? [],
      dish_types: (r.dish_types as string[] | null) ?? [],
      prep_time_minutes: (r.prep_time_minutes as number | null) ?? null,
      cook_time_minutes: (r.cook_time_minutes as number | null) ?? null,
      calories: (r.calories as number | null) ?? null,
      protein_g: (r.protein_g as number | null) ?? null,
      carbs_g: (r.carbs_g as number | null) ?? null,
      fat_g: (r.fat_g as number | null) ?? null,
      batch_friendly: !!r.batch_friendly,
      pantry_match: pantryMatch(r as { ingredients?: unknown }),
      inspiration_match: inspirationMatch(
        r as { dietary_tags?: string[]; dish_types?: string[]; cuisine_type?: string | null },
      ),
    };
  }

  // 5. Load pins joined with recipe (including ingredients for pantry scoring)
  const { data: pinsRaw } = await supabase
    .from("meal_plan_pins")
    .select(`
      priority, pinned_at,
      recipe:recipes (id, title, image_url, cuisine_type, dietary_tags, dish_types,
                      prep_time_minutes, cook_time_minutes, calories, protein_g,
                      carbs_g, fat_g, batch_friendly, ingredients)
    `)
    .eq("meal_plan_id", planId)
    .order("priority", { ascending: false });

  const pins: SolverRecipe[] = ((pinsRaw ?? []) as unknown as Array<{
    recipe: Record<string, unknown> | Record<string, unknown>[] | null;
  }>)
    .flatMap((row) => {
      if (!row.recipe) return [];
      return Array.isArray(row.recipe) ? row.recipe : [row.recipe];
    })
    .map((r) => toSolverRecipe(r));

  // 6. Load suggestion pool
  const { data: poolRaw } = await supabase
    .from("recipes")
    .select(
      "id, title, image_url, cuisine_type, dietary_tags, dish_types, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, batch_friendly, ingredients",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const pool: SolverRecipe[] = (poolRaw ?? [])
    .filter((r: Record<string, unknown>) =>
      constraints.diet.every((t) =>
        ((r.dietary_tags as string[] | null) ?? []).includes(t),
      ),
    )
    .filter((r: Record<string, unknown>) =>
      !constraints.pantry_aware ||
      pantryMissingCount(r as { ingredients?: unknown }) <= constraints.pantry_missing_max,
    )
    // Hard squad filter — only applied to the suggestion pool, not to pins
    // (pins are an explicit user choice; surface a warning in the UI instead).
    .filter((r: Record<string, unknown>) =>
      !squadAware || squadHardFilter(r as { ingredients?: unknown }, squad.avoid),
    )
    .map((r: Record<string, unknown>) => {
      const sr = toSolverRecipe(r);
      if (squadAware) {
        // Blend squad love/dislike into inspiration_match so the solver picks
        // it up without a solver schema change.
        const ss = squadScore(r as { ingredients?: unknown }, squad);
        sr.inspiration_match = Math.max(-1, Math.min(1, sr.inspiration_match + ss));
      }
      return sr;
    });

  // 7. Run solver
  const result = weave({
    duration_days: plan.duration_days ?? 7,
    week_start: plan.week_start ?? null,
    pins,
    pool,
    constraints,
    seed,
  });

  // 8. Update last_woven_at + status
  await supabase
    .from("meal_plans")
    .update({
      last_woven_at: new Date().toISOString(),
      status: "woven",
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  // 9. Enrich response with recipe metadata for every entry (image, macros, est flag)
  const recipeIds = Array.from(new Set(result.entries.map((e) => e.recipe_id)));
  let recipeMeta: Array<Record<string, unknown>> = [];
  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from("recipes")
      .select(
        "id, image_url, focal_x, focal_y, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sat_fat_g, sodium_mg, prep_time_minutes, cook_time_minutes, macros_estimated, cuisine_type, dish_types",
      )
      .in("id", recipeIds);
    recipeMeta = (data ?? []) as Array<Record<string, unknown>>;
  }

  return NextResponse.json({
    ...result,
    recipes: recipeMeta,
    squad: squadAware ? squad : { members: [], avoid: [], dislike: [], love: [] },
  });
}
