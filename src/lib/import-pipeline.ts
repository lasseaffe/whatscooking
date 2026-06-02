import type { ExternalRecipe } from "@/lib/external-sources/adapters";
import Anthropic from "@anthropic-ai/sdk";

export interface ImportPreview {
  title: string;
  description: string;
  imageUrl: string;
  instructions: string[];
  ingredients: { name: string; amount?: number | null; unit?: string | null }[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  cuisineType?: string;
  difficulty?: "easy" | "medium" | "hard";
  dietaryTags?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  source: "imported";
  originalSource: string;
  originalSourceUrl: string;
  aiGeneratedFields: string[];
}

// Step 1: Map ExternalRecipe to ImportPreview shape (no AI yet)
function mapToPreview(ext: ExternalRecipe): Omit<ImportPreview, "aiGeneratedFields"> {
  return {
    title: ext.title,
    description: ext.description ?? "",
    imageUrl: ext.imageUrl ?? "",
    instructions: ext.instructions,
    ingredients: ext.ingredients,
    prepTime: ext.prepTime,
    cookTime: ext.cookTime,
    servings: ext.servings,
    cuisineType: ext.cuisineType,
    difficulty: ext.difficulty,
    dietaryTags: ext.dietaryTags,
    calories: ext.calories,
    protein: ext.protein,
    carbs: ext.carbs,
    fat: ext.fat,
    source: "imported",
    originalSource: ext.source,
    originalSourceUrl: ext.sourceUrl,
  };
}

// Step 2: Validate required fields, return list of missing ones
export function validatePreview(preview: Omit<ImportPreview, "aiGeneratedFields">): string[] {
  const missing: string[] = [];
  if (!preview.title?.trim()) missing.push("title");
  if (!preview.imageUrl?.trim()) missing.push("imageUrl");
  if (!preview.description || preview.description.length < 20) missing.push("description");
  if (!preview.instructions || preview.instructions.length < 2) missing.push("instructions");
  if (!preview.ingredients || preview.ingredients.length < 3) missing.push("ingredients");
  return missing;
}

// Step 3: AI gap-fill — runs parallel calls for each missing field
async function fillGaps(
  preview: Omit<ImportPreview, "aiGeneratedFields">,
  missing: string[]
): Promise<{ filled: Omit<ImportPreview, "aiGeneratedFields">; aiGeneratedFields: string[] }> {
  const aiGeneratedFields: string[] = [];
  const filled = { ...preview };

  const client = new Anthropic();
  const promises: Promise<void>[] = [];

  if (missing.includes("description")) {
    promises.push(
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [{
          role: "user",
          content: `Write a 2-3 sentence appetising description for a recipe called "${preview.title}". Ingredients include: ${preview.ingredients.slice(0, 6).map((i) => i.name).join(", ")}. Return only the description text, nothing else.`,
        }],
      }).then((res) => {
        const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : "";
        if (text) {
          filled.description = text;
          aiGeneratedFields.push("description");
        }
      })
    );
  }

  if (missing.includes("imageUrl")) {
    // Fallback to a food Unsplash search (no API key needed for display)
    const slug = encodeURIComponent(preview.title.toLowerCase().replace(/\s+/g, "-"));
    filled.imageUrl = `https://source.unsplash.com/featured/800x600/?${slug},food`;
    aiGeneratedFields.push("imageUrl");
  }

  if (!preview.difficulty) {
    const instructionCount = preview.instructions.length;
    const complexVerbs = ["julienne", "braise", "deglaze", "temper", "emulsify", "baste", "clarify"];
    const allText = preview.instructions.join(" ").toLowerCase();
    const complexCount = complexVerbs.filter((v) => allText.includes(v)).length;
    if (instructionCount <= 3 && complexCount === 0) filled.difficulty = "easy";
    else if (instructionCount <= 6 && complexCount <= 1) filled.difficulty = "medium";
    else filled.difficulty = "hard";
    aiGeneratedFields.push("difficulty");
  }

  await Promise.all(promises);

  return { filled, aiGeneratedFields };
}

// Main pipeline entry point
export async function runImportPipeline(ext: ExternalRecipe): Promise<ImportPreview | { error: string }> {
  const preview = mapToPreview(ext);
  const missingRequired = validatePreview(preview);

  // Title, instructions, ingredients are hard blockers — can't AI-fill these reliably
  const blockingMissing = missingRequired.filter(
    (f) => f === "title" || f === "instructions" || f === "ingredients"
  );
  if (blockingMissing.length > 0) {
    return { error: `Cannot import: missing required fields — ${blockingMissing.join(", ")}` };
  }

  const { filled, aiGeneratedFields } = await fillGaps(preview, missingRequired);

  return { ...filled, aiGeneratedFields };
}
