export interface WCDishRecipe {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  instructions: string[];
  tip?: string;
}

export type WCRecipeMap = Record<string, WCDishRecipe[]>;

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getDishRecipe(countrySlug: string, dishSlug: string): WCDishRecipe | undefined {
  const nation = WC_RECIPES[countrySlug];
  if (!nation) return undefined;
  return nation.find((d) => slug(d.name) === dishSlug);
}

export function getDishSlug(name: string) {
  return slug(name);
}

export const WC_RECIPES: WCRecipeMap = {};
