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
    .range(offset, offset + limit - 1)
    .order("title");

  if (type) {
    query = query.eq("component_type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ components: data ?? [] });
}
