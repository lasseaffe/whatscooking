import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page       = Math.max(0, parseInt(searchParams.get("page")  ?? "0"));
  const limit      = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const search     = searchParams.get("search")?.trim()     ?? "";
  const cuisine    = searchParams.get("cuisine")?.trim()    ?? "";
  const tags       = searchParams.get("tags")?.trim()       ?? "";
  const difficulty = searchParams.get("difficulty")?.trim() ?? "";
  const maxTime    = parseInt(searchParams.get("maxTime")   ?? "0") || 0;

  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, cuisine_type, dish_types, dietary_tags, " +
      "prep_time_minutes, cook_time_minutes, difficulty_level, required_utensils",
      { count: "exact" }
    )
    .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
    .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
    .neq("image_status", "hidden")
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (search)      query = query.ilike("title", `%${search}%`);
  if (cuisine)     query = query.eq("cuisine_type", cuisine);
  if (difficulty)  query = query.eq("difficulty_level", difficulty);
  if (maxTime > 0) query = query.lte("cook_time_minutes", maxTime);

  if (tags) {
    for (const tag of tags.split(",").filter(Boolean)) {
      query = query.contains("dietary_tags", [tag]);
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[recipes/list]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    recipes: data ?? [],
    total:   count ?? 0,
    page,
    hasMore: (page + 1) * limit < (count ?? 0),
  });
}
