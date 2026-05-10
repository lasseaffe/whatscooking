import { ai, getModel } from "./ai";
import { Recipe, RecipeIngredient, NutritionalGoals } from "./types";

const SYSTEM_PROMPT = `You are a culinary AI assistant specializing in meal planning and recipe creation for What's Cooking, a personal meal planning platform.

You have expertise in:
- Recipe creation with accurate nutritional data
- Meal planning based on nutritional goals
- Ingredient categorization and pantry management
- Dietary preferences (vegetarian, vegan, keto, paleo, etc)

Always respond with structured JSON only. No markdown fences. Be accurate with nutritional estimates.`;

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{") !== -1 ? cleaned.indexOf("{") : cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("}") !== -1 ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
    return start !== -1 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : {} as T;
  }
}

export async function generateRecipe(params: {
  description: string;
  dietaryTags?: string[];
  ingredients?: string[];
  servings?: number;
}): Promise<Recipe> {
  const prompt = `${SYSTEM_PROMPT}

Generate a detailed recipe based on this description: "${params.description}"

${params.ingredients ? `Use these ingredients if possible: ${params.ingredients.join(", ")}` : ""}
${params.dietaryTags ? `Dietary preferences: ${params.dietaryTags.join(", ")}` : ""}
Servings: ${params.servings || 4}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {"name": "ingredient", "amount": 1, "unit": "cup", "category": "category name"}
  ],
  "instructions": ["step 1", "step 2"],
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "cuisine_type": "cuisine",
  "dish_types": ["main course"],
  "dietary_tags": ["tags"],
  "calories": 450,
  "protein_g": 25,
  "carbs_g": 45,
  "fat_g": 15,
  "fiber_g": 5,
  "sugar_g": 5,
  "sodium_mg": 800
}`;

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const recipe = parseJSON<Record<string, unknown>>(raw);

  return {
    id: `ai-${Date.now()}`,
    source: "ai",
    title: recipe.title as string,
    description: recipe.description as string,
    cuisine_type: recipe.cuisine_type as string,
    dish_types: (recipe.dish_types as string[]) || [],
    dietary_tags: (recipe.dietary_tags as string[]) || params.dietaryTags || [],
    ingredients: (recipe.ingredients as RecipeIngredient[]) || [],
    instructions: (recipe.instructions as string[]) || [],
    prep_time_minutes: recipe.prep_time_minutes as number,
    cook_time_minutes: recipe.cook_time_minutes as number,
    servings: recipe.servings as number,
    calories: recipe.calories as number,
    protein_g: recipe.protein_g as number,
    carbs_g: recipe.carbs_g as number,
    fat_g: recipe.fat_g as number,
    fiber_g: recipe.fiber_g as number,
    sugar_g: recipe.sugar_g as number,
    sodium_mg: recipe.sodium_mg as number,
    created_at: new Date().toISOString(),
  };
}

export async function categorizeIngredients(
  ingredientNames: string[]
): Promise<Record<string, string>> {
  if (ingredientNames.length === 0) return {};

  const prompt = `Categorize these ingredients. Respond with ONLY valid JSON mapping (no markdown, no code blocks):
Ingredients: ${ingredientNames.join(", ")}

Categories are: Vegetables, Fruits, Meat & Fish, Dairy, Grains & Pasta, Legumes, Nuts & Seeds, Spices & Herbs, Oils & Sauces, Beverages, Baking, Frozen, Canned Goods, Snacks, Other

Respond with JSON:
{
  "ingredient_name": "Category Name"
}`;

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return parseJSON<Record<string, string>>(raw);
}

export async function generateMealPlan(params: {
  recipes: Recipe[];
  duration_days?: number;
  meals_per_day?: number;
  nutritional_goals?: NutritionalGoals;
  dietary_filters?: string[];
}): Promise<{
  meals: Array<{
    day: number;
    meal_type: string;
    recipe_id: string;
    recipe_title: string;
  }>;
  daily_nutrition: Record<
    string,
    {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }
  >;
}> {
  const duration = params.duration_days || 7;
  const mealsPerDay = params.meals_per_day || 3;

  const recipeList = params.recipes
    .map((r) => {
      const tags = (r.dietary_tags as string[] | null) ?? [];
      const isMealPrep = tags.some((t) => t.toLowerCase().includes("meal prep") || t.toLowerCase().includes("batch"));
      const prepFlag = isMealPrep ? " ★MEAL-PREP" : "";
      return `- ${r.title}${prepFlag} (${r.calories ?? "?"} cal, ${r.protein_g ?? "?"}g protein)`;
    })
    .join("\n");

  const totalSlots = duration * mealsPerDay;
  const uniqueRecipes = params.recipes.length;

  const prompt = `Create a ${duration}-day meal plan with ${mealsPerDay} meals per day.

Available recipes (★MEAL-PREP = great for batch cooking and prepping ahead):
${recipeList}

${params.nutritional_goals ? `Daily nutritional goals: ${JSON.stringify(params.nutritional_goals)}` : ""}
${params.dietary_filters?.length ? `Dietary filters: ${params.dietary_filters.join(", ")}` : ""}

IMPORTANT RULES:
1. NEVER assign the same recipe to more than one day — every day must feel different.
2. Prefer ★MEAL-PREP recipes for lunches and batch dinner slots where repeating portions is practical.
3. You have ${uniqueRecipes} recipes for ${totalSlots} slots — spread them out, do NOT cluster the same dishes together.
4. Vary cuisines and protein sources across days (no 3 chicken days in a row).
5. Match breakfast/snack slots to lighter recipes; dinner to heartier ones.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "meals": [
    {"day": 1, "meal_type": "breakfast", "recipe_title": "Recipe Name"},
    {"day": 1, "meal_type": "lunch", "recipe_title": "Recipe Name"}
  ],
  "daily_nutrition": {
    "day_1": {"calories": 2000, "protein_g": 100, "carbs_g": 200, "fat_g": 60}
  }
}`;

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return parseJSON(raw);
}
