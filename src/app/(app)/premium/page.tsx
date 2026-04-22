import { createClient } from "@/lib/supabase/server";
import { PremiumClient } from "./premium-client";

export const dynamic = "force-dynamic";

export default async function PremiumPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, source_url, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, calories, dietary_tags, ingredients, instructions")
    .filter("dish_types", "cs", '{"premium"}')
    .not("dish_types", "cs", '{"hack"}')
    .order("created_at", { ascending: false });

  return <PremiumClient recipes={recipes ?? []} />;
}
