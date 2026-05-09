const API_BASE = "https://api.spoonacular.com";
const API_KEY = process.env.SPOONACULAR_API_KEY;

interface SpoonacularSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  type?: string;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
  number?: number;
  offset?: number;
  addRecipeNutrition?: boolean;
  maxReadyTime?: number;
}

async function spoonFetch(path: string, params: Record<string, string> = {}) {
  if (!API_KEY) throw new Error("SPOONACULAR_API_KEY not set");
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("apiKey", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spoonacular ${res.status}: ${text}`);
  }
  return res.json();
}

export async function searchRecipes(params: SpoonacularSearchParams) {
  const query: Record<string, string> = {
    number: String(params.number ?? 12),
    offset: String(params.offset ?? 0),
    addRecipeNutrition: String(params.addRecipeNutrition ?? true),
    addRecipeInformation: "true",
  };
  if (params.query) query.query = params.query;
  if (params.cuisine) query.cuisine = params.cuisine;
  if (params.diet) query.diet = params.diet;
  if (params.intolerances) query.intolerances = params.intolerances;
  if (params.type) query.type = params.type;
  if (params.minCalories) query.minCalories = String(params.minCalories);
  if (params.maxCalories) query.maxCalories = String(params.maxCalories);
  if (params.minProtein) query.minProtein = String(params.minProtein);
  if (params.maxProtein) query.maxProtein = String(params.maxProtein);
  if (params.minCarbs) query.minCarbs = String(params.minCarbs);
  if (params.maxCarbs) query.maxCarbs = String(params.maxCarbs);
  if (params.minFat) query.minFat = String(params.minFat);
  if (params.maxFat) query.maxFat = String(params.maxFat);
  if (params.maxReadyTime) query.maxReadyTime = String(params.maxReadyTime);

  return spoonFetch("/recipes/complexSearch", query);
}

export async function getRecipeById(id: number) {
  return spoonFetch(`/recipes/${id}/information`, {
    includeNutrition: "true",
  });
}

export async function findByIngredients(
  ingredients: string[],
  options: { number?: number; ranking?: 1 | 2; ignorePantry?: boolean } = {}
) {
  return spoonFetch("/recipes/findByIngredients", {
    ingredients: ingredients.join(","),
    number: String(options.number ?? 12),
    ranking: String(options.ranking ?? 1),
    ignorePantry: String(options.ignorePantry ?? false),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpoonacularRecipe(raw: any) {
  const nutrients = raw.nutrition?.nutrients ?? [];
  const findNutrient = (name: string) =>
    nutrients.find((n: { title: string }) => n.title === name)?.amount ?? null;

  return {
    external_id: String(raw.id),
    source: "spoonacular" as const,
    title: raw.title ?? "",
    description: raw.summary?.replace(/<[^>]*>/g, "") ?? "",
    image_url: raw.image ?? null,
    cuisine_type: raw.cuisines?.[0] ?? null,
    dish_types: raw.dishTypes ?? [],
    dietary_tags: [
      ...(raw.vegetarian ? ["vegetarian"] : []),
      ...(raw.vegan ? ["vegan"] : []),
      ...(raw.glutenFree ? ["gluten-free"] : []),
      ...(raw.dairyFree ? ["dairy-free"] : []),
      ...(raw.veryHealthy ? ["healthy"] : []),
    ],
    ingredients: (raw.extendedIngredients ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ing: any) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.aisle ?? "Other",
      })
    ),
    instructions: raw.analyzedInstructions?.[0]?.steps?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.step
    ) ?? [],
    prep_time_minutes: raw.preparationMinutes ?? null,
    cook_time_minutes: raw.cookingMinutes ?? raw.readyInMinutes ?? null,
    servings: raw.servings ?? null,
    calories: findNutrient("Calories") ? Math.round(findNutrient("Calories")) : null,
    protein_g: findNutrient("Protein"),
    carbs_g: findNutrient("Carbohydrates"),
    fat_g: findNutrient("Fat"),
    fiber_g: findNutrient("Fiber"),
    sugar_g: findNutrient("Sugar"),
    sodium_mg: findNutrient("Sodium"),
  };
}
