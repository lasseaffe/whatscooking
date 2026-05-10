import { createClient } from "@/lib/supabase/server";
import { PantryClient } from "./pantry-client";
import type { PantryItem, IngredientCategory } from "@/lib/types";

export default async function PantryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: items }, { data: categories }, { data: prefs }] = await Promise.all([
    supabase
      .from("pantry_items")
      .select("*, category:ingredient_categories(id, name, emoji, color)")
      .eq("user_id", user!.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("ingredient_categories")
      .select("id, name, emoji, color")
      .order("name"),
    supabase
      .from("user_preferences")
      .select("household_dietary_tags")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

  return (
    <PantryClient
      initialItems={(items ?? []) as PantryItem[]}
      categories={(categories ?? []) as IngredientCategory[]}
      initialHouseholdTags={(prefs?.household_dietary_tags ?? []) as string[]}
      userId={user?.id ?? ""}
    />
  );
}
