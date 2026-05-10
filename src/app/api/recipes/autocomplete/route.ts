import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/recipes/autocomplete?q=<query>&limit=8&saved=true
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "8"), 20);
  const includeSaved = req.nextUrl.searchParams.get("saved") === "true";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, image_url, calories, protein_g, carbs_g, fat_g, prep_time_minutes, cook_time_minutes, dietary_tags")
    .ilike("title", `%${q}%`)
    .limit(limit);

  if (error) return NextResponse.json([], { status: 500 });

  let savedIds = new Set<string>();
  if (includeSaved && user) {
    const { data: saved } = await supabase
      .from("user_saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((r) => r.recipe_id));
  }

  const results = (data ?? []).map((r) =>
    includeSaved && user ? { ...r, is_saved: savedIds.has(r.id) } : r
  );
  return NextResponse.json(results);
}
