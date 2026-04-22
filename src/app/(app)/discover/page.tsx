import { createClient } from "@/lib/supabase/server";
import { DiscoverClient } from "./discover-client";
import { HotRightNow } from "@/components/hot-right-now";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; diet?: string }>;
}) {
  const { q, type, diet } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: recipes },
    { data: hacks },
    { data: premiumRecipes },
    { data: pantryItems },
  ] = await Promise.all([
    // All non-drink, non-hack, non-premium recipes
    supabase
      .from("recipes")
      .select("*", { count: "exact" })
      .not("dish_types", "cs", '{"drink"}')
      .not("dish_types", "cs", '{"hack"}')
      .not("dish_types", "cs", '{"premium"}')
      .limit(300),

    // Hacks — full data for in-page modal
    supabase
      .from("recipes")
      .select("id, title, description, source_url, image_url, ingredients, instructions, prep_time_minutes, cook_time_minutes")
      .contains("dish_types", ["hack"])
      .order("created_at", { ascending: true }),

    // Premium Instagram recipes (non-hack)
    supabase
      .from("recipes")
      .select("id, title, description, source_url, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, calories, dietary_tags, dish_types")
      .contains("dish_types", ["premium"])
      .order("created_at", { ascending: false })
      .limit(200),

    // User's pantry ingredient names for match scoring
    user
      ? supabase
          .from("pantry_items")
          .select("name")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const pantryNames = (pantryItems ?? []).map((p: { name: string }) => p.name.toLowerCase());

  return (
    <div>
      <div className="px-4 sm:px-6 pt-6">
        <HotRightNow />
      </div>
      <DiscoverClient
        initialRecipes={recipes ?? []}
        hacks={hacks ?? []}
        premiumRecipes={premiumRecipes ?? []}
        initialQ={q ?? ""}
        initialType={type ?? "all"}
        initialDiet={diet ?? ""}
        pantryNames={pantryNames}
      />
    </div>
  );
}
