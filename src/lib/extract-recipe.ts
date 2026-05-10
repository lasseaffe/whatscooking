import { ai, getModel } from "./ai";
import { createClient } from "@/lib/supabase/server";

export interface ExtractedRecipe {
  description?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: { name: string; amount: number | null; unit: string | null }[];
  instructions?: string[];
}

export async function extractAndSaveRecipe(recipeId: string): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const { data: recipe } = await supabase.from("recipes").select("*").eq("id", recipeId).single();
  if (!recipe) return null;

  const hasContent = ((recipe.instructions as string[] | null)?.length ?? 0) >= 2
    && ((recipe.ingredients as unknown[] | null)?.length ?? 0) >= 3;
  if (hasContent) return recipe;

  const isHack = (recipe.dish_types as string[] | null)?.includes("hack") ?? false;
  const title: string = recipe.title ?? "Recipe";
  const description: string = recipe.description ?? "";
  const hasRealDescription = description.length > 50
    && !description.toLowerCase().includes("exclusive recipe from")
    && !description.toLowerCase().includes("see the instagram post");

  const prompt = isHack ? `
You are a professional chef. Based only on this title${hasRealDescription ? " and description" : ""}, write a complete kitchen hack/technique.

Title: ${title}
${hasRealDescription ? `Description: ${description}` : ""}

Return valid JSON only:
{
  "description": "What this hack does and why it works (2-3 sentences)",
  "prep_time_minutes": 5,
  "cook_time_minutes": 0,
  "ingredients": [{ "name": "tool or ingredient needed", "amount": null, "unit": null }],
  "instructions": ["Step 1...", "Step 2...", "Step 3..."]
}
Include 3-7 steps. Return ONLY the JSON.`.trim()
  : `
You are a culinary expert. Based on this recipe title${hasRealDescription ? " and description" : ""}, write a complete, accurate recipe.

Recipe name: ${title}
${hasRealDescription ? `Post description: ${description}` : ""}
${recipe.cuisine_type ? `Cuisine: ${recipe.cuisine_type}` : ""}
${(recipe.dietary_tags as string[] | null)?.length ? `Dietary: ${(recipe.dietary_tags as string[]).join(", ")}` : ""}

Return valid JSON only:
{
  "description": "Appetising description (2-3 sentences)",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 25,
  "calories": 420,
  "protein_g": 22,
  "carbs_g": 38,
  "fat_g": 16,
  "ingredients": [{ "name": "ingredient", "amount": 200, "unit": "g" }],
  "instructions": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5..."]
}
Include at least 5 ingredients and 5 steps. Be specific with amounts. Return ONLY the JSON.`.trim();

  try {
    const response = await ai.chat.completions.create({
      model: getModel(),
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "{}";
    let extracted: ExtractedRecipe;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      extracted = JSON.parse(cleaned);
    } catch {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      extracted = start !== -1 && end > start ? JSON.parse(raw.slice(start, end + 1)) : {};
    }

    const update: Record<string, unknown> = {};
    if (extracted.description && !hasRealDescription) update.description = extracted.description;
    if (extracted.servings) update.servings = extracted.servings;
    if (extracted.prep_time_minutes) update.prep_time_minutes = extracted.prep_time_minutes;
    if (extracted.cook_time_minutes) update.cook_time_minutes = extracted.cook_time_minutes;
    if (extracted.calories) update.calories = extracted.calories;
    if (extracted.protein_g) update.protein_g = extracted.protein_g;
    if (extracted.carbs_g) update.carbs_g = extracted.carbs_g;
    if (extracted.fat_g) update.fat_g = extracted.fat_g;
    if (extracted.ingredients && (extracted.ingredients as unknown[]).length > 0)
      update.ingredients = extracted.ingredients;
    if (extracted.instructions && extracted.instructions.length > 0)
      update.instructions = extracted.instructions;

    if (Object.keys(update).length > 0) {
      await supabase.from("recipes").update(update).eq("id", recipeId);
    }

    return { ...recipe, ...update };
  } catch (err) {
    console.error("[extractAndSaveRecipe]", err);
    return null;
  }
}
