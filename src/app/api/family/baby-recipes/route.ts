import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { MilestoneKey } from "@/lib/family-types";
import { MILESTONE_KEYS } from "@/lib/family-types";

export const runtime = "nodejs";

// GET /api/family/baby-recipes?member_id=...&stage=...&meal_type=...&allergen_free=true&pantry=true
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const memberId    = searchParams.get("member_id");
    const stage       = searchParams.get("stage") as MilestoneKey | null;
    const mealType    = searchParams.get("meal_type");
    const allergenFree = searchParams.get("allergen_free") === "true";
    const pantryMode  = searchParams.get("pantry") === "true";

    // Validate stage if provided
    if (stage && !MILESTONE_KEYS.includes(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }

    let query = supabase
      .from("recipes")
      .select("id, title, image_url, prep_time_minutes, baby_stages, allergen_flags, has_baby_variant, dish_types, difficulty_level")
      .not("baby_stages", "eq", "{}")
      .limit(40);

    if (stage) {
      query = query.contains("baby_stages", [stage]);
    }

    if (mealType) {
      query = query.contains("dish_types", [mealType]);
    }

    // If allergen_free + member_id: exclude recipes with allergens not yet introduced
    if (allergenFree && memberId) {
      const { data: introduced } = await supabase
        .from("member_allergens")
        .select("allergen_key")
        .eq("member_id", memberId);

      const introducedKeys = (introduced ?? []).map((a) => a.allergen_key);
      const notIntroduced = ["egg","dairy","gluten","peanut","tree_nut","soy","fish","shellfish"]
        .filter((k) => !introducedKeys.includes(k));

      for (const allergen of notIntroduced) {
        query = query.not("allergen_flags", "cs", `{${allergen}}`);
      }
    }

    // Pantry mode: filter to recipes whose ingredients overlap with user's pantry
    if (pantryMode) {
      const { data: pantryItems } = await supabase
        .from("pantry_items")
        .select("name")
        .eq("user_id", user.id);

      if (pantryItems?.length) {
        // NOTE: ingredients is a JSONB array of objects {name, amount, unit}.
        // Text overlap filtering requires a DB function or full-text search.
        // For now, pantry filtering is a no-op — recipes are returned unfiltered
        // when pantry=true. This can be implemented properly with a Postgres function.
        // The UI shows the toggle but it does not restrict results yet.
      }
    }

    const { data: recipes, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ recipes: recipes ?? [] });
  } catch (err) {
    console.error("[family/baby-recipes GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
