import { createClient } from "@/lib/supabase/server";
import { AllRecipesClient } from "./all-recipes-client";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level, required_utensils")
    .or('dish_types.is.null,dish_types.not.cs.{hack}')
    .or('dish_types.is.null,dish_types.not.cs.{premium}')
    .order("created_at", { ascending: false })
    .limit(1000);

  return <AllRecipesClient recipes={recipes ?? []} />;
}
