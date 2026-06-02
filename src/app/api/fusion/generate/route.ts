import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { runImportPipeline } from "@/lib/import-pipeline";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cuisine1, cuisine2 } = await req.json();
  if (!cuisine1 || !cuisine2) {
    return NextResponse.json({ error: "Two cuisines required" }, { status: 400 });
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are a creative fusion chef. Generate a single fusion dish that combines ${cuisine1} and ${cuisine2} cuisine.

Return ONLY valid JSON in exactly this shape:
{
  "name": "Dish Name",
  "description": "2-3 sentence appetising description",
  "ingredients": [
    {"name": "ingredient name", "amount": 200, "unit": "g"}
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "prepTime": 20,
  "cookTime": 25,
  "servings": 4,
  "difficulty": "medium",
  "dietaryTags": [],
  "flavorBridge": ["pairing 1 that makes this fusion work", "pairing 2"],
  "originStory": "2-3 sentences on the cultural collision that inspired this dish"
}

Rules:
- ingredients: 6-12 items, realistic amounts
- instructions: 3-6 clear steps
- difficulty: "easy", "medium", or "hard"
- dietaryTags: only include if genuinely applicable: "vegetarian", "vegan", "gluten-free"
- flavorBridge: 2 items explaining why the fusion works`,
    }],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text : "";

  let generated: Record<string, unknown>;
  try {
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    generated = JSON.parse(jsonMatch?.[0] ?? text);
  } catch {
    return NextResponse.json({ error: "AI returned malformed JSON" }, { status: 500 });
  }

  const ext: ExternalRecipe = {
    externalId: `ai-${Date.now()}`,
    source: "flavordb",
    sourceUrl: "",
    title: String(generated.name ?? ""),
    description: String(generated.description ?? ""),
    imageUrl: undefined,
    ingredients: ((generated.ingredients as { name: string; amount?: number; unit?: string }[]) ?? []).map((i) => ({
      name: i.name,
      amount: i.amount ?? null,
      unit: i.unit ?? null,
    })),
    instructions: (generated.instructions as string[]) ?? [],
    prepTime: typeof generated.prepTime === "number" ? generated.prepTime : undefined,
    cookTime: typeof generated.cookTime === "number" ? generated.cookTime : undefined,
    servings: typeof generated.servings === "number" ? generated.servings : undefined,
    difficulty: generated.difficulty as "easy" | "medium" | "hard" | undefined,
    dietaryTags: (generated.dietaryTags as string[] | undefined) ?? [],
  };

  const pipeline = await runImportPipeline(ext);
  if ("error" in pipeline) {
    return NextResponse.json({ error: pipeline.error }, { status: 422 });
  }

  const { data, error } = await supabase.from("recipes").insert({
    title:               pipeline.title,
    description:         pipeline.description,
    image_url:           pipeline.imageUrl || null,
    instructions:        pipeline.instructions,
    ingredients:         pipeline.ingredients,
    prep_time_minutes:   pipeline.prepTime   ?? null,
    cook_time_minutes:   pipeline.cookTime   ?? null,
    servings:            pipeline.servings   ?? null,
    difficulty_level:    pipeline.difficulty ?? null,
    dietary_tags:        pipeline.dietaryTags ?? [],
    source:              "imported",
    original_source:     "ai_fusion",
    original_source_url: null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    recipeId: data.id,
    preview: pipeline,
    originStory: String(generated.originStory ?? ""),
    flavorBridge: (generated.flavorBridge as string[]) ?? [],
  });
}
