import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { recipe_id, taste, difficulty, prep_time_rating, value_for_effort, presentation, would_make_again } = body;
    if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("recipe_ratings")
      .upsert({
        user_id: user.id,
        recipe_id,
        taste,
        difficulty,
        prep_time_rating,
        value_for_effort,
        presentation,
        would_make_again,
      }, { onConflict: "user_id,recipe_id" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rating: data });
  } catch (error) {
    console.error("[ratings POST]", error);
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const recipe_id = searchParams.get("recipe_id");
    if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

    const { data: ratings } = await supabase
      .from("recipe_ratings")
      .select("*, profile:profiles(full_name)")
      .eq("recipe_id", recipe_id);

    // Compute averages
    type RatingRow = Record<string, number | null | boolean>;
    const avg = (key: string) => {
      const vals = (ratings as RatingRow[] ?? []).map((r) => r[key]).filter((v) => typeof v === "number") as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    return NextResponse.json({
      ratings: ratings ?? [],
      averages: {
        taste: avg("taste"),
        difficulty: avg("difficulty"),
        prep_time_rating: avg("prep_time_rating"),
        value_for_effort: avg("value_for_effort"),
        presentation: avg("presentation"),
      },
      count: ratings?.length ?? 0,
    });
  } catch (error) {
    console.error("[ratings GET]", error);
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}
