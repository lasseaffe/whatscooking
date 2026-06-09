import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runImportPipeline } from "@/lib/import-pipeline";
import type { ImportPreview } from "@/lib/import-pipeline";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";

export const runtime = "nodejs";

// POST /api/recipes/import
// Phase 1: { recipe: ExternalRecipe }            → run pipeline, return ImportPreview
// Phase 2: { preview: ImportPreview, confirm: true } → save to Supabase, return { recipeId }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Phase 1: run pipeline, return preview (no DB write)
  if (body.recipe && !body.confirm) {
    const ext = body.recipe as ExternalRecipe;
    const result = await runImportPipeline(ext);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json({ preview: result });
  }

  // Phase 2: user confirmed — save to Supabase
  if (body.preview && body.confirm) {
    const p = body.preview as ImportPreview;

    const { data, error } = await supabase.from("recipes").insert({
      title:               p.title,
      description:         p.description,
      image_url:           p.imageUrl,
      instructions:        p.instructions,
      ingredients:         p.ingredients,
      prep_time_minutes:   p.prepTime   ?? null,
      cook_time_minutes:   p.cookTime   ?? null,
      servings:            p.servings   ?? null,
      cuisine_type:        p.cuisineType ?? null,
      difficulty_level:    p.difficulty ?? null,
      dietary_tags:        p.dietaryTags ?? [],
      calories:            p.calories   ?? null,
      protein_g:           p.protein    ?? null,
      carbs_g:             p.carbs      ?? null,
      fat_g:               p.fat        ?? null,
      source:              "imported",
      original_source:     p.originalSource,
      original_source_url: p.originalSourceUrl,
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ recipeId: data.id });
  }

  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}
