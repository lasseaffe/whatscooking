// src/lib/nutrition-goals.ts
import { createClient } from "@/lib/supabase/server";

export interface NutritionalGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const RDA_DEFAULTS: NutritionalGoals = {
  calories: 2000,
  protein_g: 50,
  carbs_g: 300,
  fat_g: 65,
};

export async function getUserNutritionGoals(userId: string): Promise<NutritionalGoals> {
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("calorie_goals")
    .select("target_calories, notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (!goal) return RDA_DEFAULTS;

  let parsedMacros: Partial<NutritionalGoals> = {};
  try {
    parsedMacros = JSON.parse(goal.notes ?? "{}");
  } catch {
    // malformed notes — use RDA
  }

  return {
    calories: goal.target_calories ?? RDA_DEFAULTS.calories,
    protein_g: parsedMacros.protein_g ?? RDA_DEFAULTS.protein_g,
    carbs_g: parsedMacros.carbs_g ?? RDA_DEFAULTS.carbs_g,
    fat_g: parsedMacros.fat_g ?? RDA_DEFAULTS.fat_g,
  };
}
