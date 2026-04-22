import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Heart } from "lucide-react";
import { SavedClient } from "./saved-client";

type SavedRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  source_name: string | null;
  source_url: string | null;
  saved_at: string;
};

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: saves } = await supabase
    .from("recipe_saves")
    .select("saved_at, recipe:recipes!inner(id, title, description, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes, calories, source_name, source_url)")
    .eq("user_id", user!.id)
    .order("saved_at", { ascending: false });

  const recipes: SavedRecipe[] = (saves ?? []).map((s) => {
    const r = s.recipe as unknown as Omit<SavedRecipe, "saved_at">;
    return { ...r, saved_at: s.saved_at };
  });

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            <Heart className="w-6 h-6" style={{ color: "#C8522A" }} fill="#C8522A" />
            Saved Recipes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} saved
          </p>
        </div>
        <Link href="/discover" className="text-sm font-medium" style={{ color: "#C8522A" }}>
          Browse more →
        </Link>
      </div>

      <SavedClient initialRecipes={recipes} />
    </div>
  );
}
