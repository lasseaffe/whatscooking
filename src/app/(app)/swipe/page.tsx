import { createClient } from "@/lib/supabase/server";
import { SwipeClient } from "./swipe-client";

export const dynamic = "force-dynamic";

export default async function SwipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: recipes }, { data: savedRows }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dietary_tags, calories, prep_time_minutes, cook_time_minutes, dish_types, ingredients, instructions, servings, protein_g, carbs_g, fat_g, difficulty_level")
      .not("dish_types", "cs", '{"hack"}')
      .not("dish_types", "cs", '{"premium"}')
      .not("image_url", "is", null)
      .limit(80),
    user
      ? supabase.from("swipe_likes").select("recipe_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const shuffled = (recipes ?? []).sort(() => Math.random() - 0.5);
  const savedIds = new Set((savedRows ?? []).map((r: { recipe_id: string }) => r.recipe_id));

  return <SwipeClient recipes={shuffled} initialSavedIds={[...savedIds]} />;
}
