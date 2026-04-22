import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dish, restaurantName, cuisineType } = await req.json() as {
    dish: {
      englishName: string;
      originalName?: string;
      description?: string;
      dietaryTags?: string[];
      category?: string;
    };
    restaurantName?: string;
    cuisineType?: string;
  };

  if (!dish?.englishName) return NextResponse.json({ error: "dish.englishName required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("recipes")
    .select("id, title, description, image_url")
    .ilike("title", dish.englishName)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ found: true, recipe: existing });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: "You are a professional chef and recipe writer. Generate complete, accurate recipes with nutritional estimates. Return valid JSON only. No markdown fences.",
    messages: [
      {
        role: "user",
        content: `Generate a complete recipe for "${dish.englishName}"${dish.originalName && dish.originalName !== dish.englishName ? ` (${dish.originalName})` : ""}.
${dish.description ? `Description: ${dish.description}` : ""}
${restaurantName ? `From restaurant: ${restaurantName}` : ""}
${cuisineType ? `Cuisine: ${cuisineType}` : ""}

Return this exact JSON (no markdown):
{
  "title": "...",
  "description": "...",
  "cuisine_type": "...",
  "dish_types": ["main course"],
  "servings": 4,
  "prep_time_minutes": 20,
  "cook_time_minutes": 30,
  "calories": 450,
  "protein_g": 25,
  "carbs_g": 40,
  "fat_g": 15,
  "fiber_g": 5,
  "dietary_tags": [],
  "ingredients": [
    { "name": "...", "amount": 200, "unit": "g" }
  ],
  "instructions": ["Step 1...", "Step 2..."]
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  let recipeData: Record<string, unknown>;
  try {
    recipeData = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }

  const { data: saved, error } = await supabase
    .from("recipes")
    .insert({
      title: recipeData.title ?? dish.englishName,
      description: recipeData.description ?? dish.description ?? null,
      cuisine_type: recipeData.cuisine_type ?? cuisineType ?? null,
      dish_types: recipeData.dish_types ?? ["main course"],
      source: "ai",
      servings: recipeData.servings ?? 4,
      prep_time_minutes: recipeData.prep_time_minutes ?? null,
      cook_time_minutes: recipeData.cook_time_minutes ?? null,
      calories: recipeData.calories ?? null,
      protein_g: recipeData.protein_g ?? null,
      carbs_g: recipeData.carbs_g ?? null,
      fat_g: recipeData.fat_g ?? null,
      fiber_g: recipeData.fiber_g ?? null,
      dietary_tags: recipeData.dietary_tags ?? dish.dietaryTags ?? [],
      ingredients: recipeData.ingredients ?? [],
      instructions: recipeData.instructions ?? [],
      created_by: user.id,
      is_published: false,
    })
    .select("id, title, description, image_url")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ found: false, recipe: saved });
}
