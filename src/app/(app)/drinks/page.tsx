import { createClient } from "@/lib/supabase/server";
import { DrinksClient } from "./drinks-client";

export const dynamic = "force-dynamic";

export default async function DrinksPage() {
  const supabase = await createClient();

  const { data: drinks } = await supabase
    .from("recipes")
    .select("*")
    .contains("dish_types", ["drink"])
    .order("created_at", { ascending: true });

  return <DrinksClient drinks={drinks ?? []} />;
}
