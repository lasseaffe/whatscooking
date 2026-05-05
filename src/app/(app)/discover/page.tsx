import { createClient } from "@/lib/supabase/server";
import { DiscoverClient } from "./discover-client";

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
    { data: pantryItems },
  ] = await Promise.all([
    // All non-drink, non-hack, non-premium recipes
    // Use .or() so rows with null dish_types (most scraped recipes) are included
    supabase
      .from("recipes")
      .select("*", { count: "exact" })
      .or('dish_types.is.null,dish_types.not.cs.{"drink"}')
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .limit(300),

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
      <DiscoverClient
        initialRecipes={recipes ?? []}
        initialQ={q ?? ""}
        initialType={type ?? "all"}
        initialDiet={diet ?? ""}
        pantryNames={pantryNames}
      />
    </div>
  );
}
