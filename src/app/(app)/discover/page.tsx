import { createClient } from "@/lib/supabase/server";
import { CUISINES } from "@/lib/cuisines";
import { DiscoverHubClient } from "./discover-hub-client";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: swipeRecipes },
    { data: gridRecipes },
    { data: pantryItems },
  ] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes, calories")
      .not("image_url", "is", null)
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .limit(30),

    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level")
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(300),

    user
      ? supabase.from("pantry_items").select("name").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { name: string }[], error: null }),
  ]);

  const pantryNames = (pantryItems ?? []).map((p) => p.name.toLowerCase());
  const cuisines = CUISINES.slice(0, 20);

  return (
    <DiscoverHubClient
      swipeRecipes={swipeRecipes ?? []}
      gridRecipes={gridRecipes ?? []}
      cuisines={cuisines}
      pantryNames={pantryNames}
    />
  );
}
