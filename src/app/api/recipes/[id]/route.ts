import { getRecipeById, normalizeSpoonacularRecipe } from "@/lib/spoonacular";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spoonacularId = parseInt(id);
    if (isNaN(spoonacularId)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check cache first
    const { data: cached } = await supabase
      .from("recipes")
      .select("*")
      .eq("external_id", spoonacularId.toString())
      .eq("source", "spoonacular")
      .single();

    if (cached) return NextResponse.json(cached);

    // Fetch from Spoonacular and cache
    const raw = await getRecipeById(spoonacularId);
    const normalized = normalizeSpoonacularRecipe(raw);

    const { data: recipe } = await supabase
      .from("recipes")
      .insert(normalized)
      .select()
      .single();

    return NextResponse.json(recipe ?? normalized);
  } catch (error) {
    console.error("[recipes/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}
