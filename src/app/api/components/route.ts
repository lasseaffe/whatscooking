import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select("id, title, description, image_url, component_type, cook_time_minutes, prep_time_minutes, difficulty_level, servings, ingredients")
    .eq("is_component", true)
    .or("is_variation.is.null,is_variation.eq.false")
    .range(offset, offset + limit - 1)
    .order("title");

  if (type) {
    query = query.eq("component_type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch variation counts for all returned canonicals in one query
  const ids = (data ?? []).map((c) => c.id);
  const { data: varCounts } = ids.length > 0
    ? await supabase
        .from("recipes")
        .select("parent_id")
        .eq("is_component", true)
        .eq("is_variation", true)
        .in("parent_id", ids)
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const row of varCounts ?? []) {
    if (row.parent_id) countMap[row.parent_id] = (countMap[row.parent_id] ?? 0) + 1;
  }

  const components = (data ?? []).map((c) => ({
    ...c,
    variation_count: countMap[c.id] ?? 0,
  }));

  return NextResponse.json({ components });
}
