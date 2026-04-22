import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/recipes/by-title?q=<title> — find recipe by exact or closest title match
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("q")?.trim();
  if (!title) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const supabase = await createClient();

  // Try exact match first (case-insensitive)
  const { data: exact } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, ingredients, instructions, servings, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, dietary_tags, cuisine_type")
    .ilike("title", title)
    .limit(1)
    .single();

  if (exact) return NextResponse.json(exact);

  // Fallback: search with contains on each significant word
  const words = title.split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try the first meaningful word as a contains search
  const { data: fuzzy } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, ingredients, instructions, servings, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, dietary_tags, cuisine_type")
    .ilike("title", `%${words[0]}%`)
    .limit(5);

  if (!fuzzy || fuzzy.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Pick the closest match by title length similarity
  const titleLower = title.toLowerCase();
  const best = fuzzy.sort((a, b) => {
    const scoreA = titleLower.split(" ").filter((w) => a.title.toLowerCase().includes(w)).length;
    const scoreB = titleLower.split(" ").filter((w) => b.title.toLowerCase().includes(w)).length;
    return scoreB - scoreA;
  })[0];

  return NextResponse.json(best);
}
