import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/recipes/[id]/detail — fetch a recipe by UUID from Supabase
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, ingredients, instructions, servings, prep_time_minutes, cook_time_minutes, calories, protein_g, carbs_g, fat_g, dietary_tags, cuisine_type")
    .eq("id", id)
    .single();

  if (error || !recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(recipe);
}
