export interface ExternalRecipe {
  externalId: string;
  source: "themealdb" | "spoonacular" | "flavordb";
  sourceUrl: string;
  title: string;
  description?: string;
  imageUrl?: string;
  ingredients: { name: string; amount?: number | null; unit?: string | null }[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  cuisineType?: string;
  dietaryTags?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  difficulty?: "easy" | "medium" | "hard";
}

// TheMealDB — free, no key needed
export async function fetchTheMealDB(query: string): Promise<ExternalRecipe[]> {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();
  if (!data.meals) return [];
  return data.meals.map(adaptMealDB);
}

export async function fetchTheMealDBById(id: string): Promise<ExternalRecipe | null> {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();
  if (!data.meals?.[0]) return null;
  return adaptMealDB(data.meals[0]);
}

function adaptMealDB(meal: Record<string, string>): ExternalRecipe {
  const ingredients: ExternalRecipe["ingredients"] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, unit: measure || null, amount: null });
  }

  const rawInstructions = meal.strInstructions ?? "";
  const instructions = rawInstructions
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  return {
    externalId: meal.idMeal,
    source: "themealdb",
    sourceUrl: meal.strSource ?? `https://www.themealdb.com/meal/${meal.idMeal}`,
    title: meal.strMeal,
    imageUrl: meal.strMealThumb,
    cuisineType: meal.strArea,
    ingredients,
    instructions,
    dietaryTags: meal.strCategory === "Vegetarian" ? ["vegetarian"] : [],
  };
}

// Spoonacular — 150 req/day free
export async function fetchSpoonacular(query: string): Promise<ExternalRecipe[]> {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) return [];
  const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&addRecipeInformation=true&number=12&apiKey=${key}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();
  return (data.results ?? []).map(adaptSpoonacular);
}

export async function fetchSpoonacularById(id: string): Promise<ExternalRecipe | null> {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) return null;
  const url = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${key}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();
  return adaptSpoonacular(data);
}

function adaptSpoonacular(r: Record<string, unknown>): ExternalRecipe {
  const extIngredients = (r.extendedIngredients as Record<string, unknown>[] | undefined) ?? [];
  const ingredients = extIngredients.map((ing: Record<string, unknown>) => ({
    name: String(ing.name ?? ""),
    amount: typeof ing.amount === "number" ? ing.amount : null,
    unit: (ing.unit as string) || null,
  }));

  const rawSteps = (r.analyzedInstructions as Record<string, unknown>[] | undefined)?.[0];
  const steps = rawSteps
    ? ((rawSteps.steps as Record<string, unknown>[]) ?? []).map((s: Record<string, unknown>) => String(s.step ?? ""))
    : [String(r.instructions ?? "")].filter(Boolean);

  const diets = (r.diets as string[] | undefined) ?? [];

  return {
    externalId: String(r.id ?? ""),
    source: "spoonacular",
    sourceUrl: String(r.sourceUrl ?? ""),
    title: String(r.title ?? ""),
    description: String(r.summary ?? "").replace(/<[^>]+>/g, "").slice(0, 300),
    imageUrl: String(r.image ?? ""),
    prepTime: typeof r.preparationMinutes === "number" && r.preparationMinutes > 0 ? r.preparationMinutes : undefined,
    cookTime: typeof r.cookingMinutes === "number" && r.cookingMinutes > 0 ? r.cookingMinutes : undefined,
    servings: typeof r.servings === "number" ? r.servings : undefined,
    cuisineType: (r.cuisines as string[] | undefined)?.[0],
    dietaryTags: diets.slice(0, 4),
    calories: (r.nutrition as Record<string, unknown> | undefined)
      ? Math.round(Number(((r.nutrition as Record<string, unknown>).nutrients as Record<string, unknown>[] | undefined)?.[0]?.amount ?? 0))
      : undefined,
    ingredients,
    instructions: steps,
  };
}
