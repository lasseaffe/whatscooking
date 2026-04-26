import { createClient } from "@/lib/supabase/server";

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data: wcTags } = await supabase
    .from("wc_recipe_tags")
    .select("recipe_id, nation_code")
    .eq("is_event_badge", true);

  const wcTagMap = new Map<string, string>(
    (wcTags ?? []).map((t) => [t.recipe_id, t.nation_code])
  );

  void wcTagMap; // used when RecipeCard is rendered in this page

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>My Recipes</h1>
      <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>Save your favorite recipes here.</p>
    </div>
  );
}
