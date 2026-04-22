import { createClient } from "@/lib/supabase/server";
import { PantryClient } from "./pantry-client";
import type { PantryItem, IngredientCategory } from "@/lib/types";

export default async function PantryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from("pantry_items")
      .select("*, category:ingredient_categories(id, name, emoji, color)")
      .eq("user_id", user!.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("ingredient_categories")
      .select("id, name, emoji, color")
      .order("name"),
  ]);

  return (
    <PantryClient
      initialItems={(items ?? []) as PantryItem[]}
      categories={(categories ?? []) as IngredientCategory[]}
    />
  );
}
