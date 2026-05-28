import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CULTURES, CULTURE_TAGS, DrinkCulture } from "@/lib/drinks";
import { CultureClient } from "./culture-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ culture: string }>;
}

export async function generateStaticParams() {
  return ["cafe", "bar", "wine", "wellness", "zero-proof"].map((c) => ({
    culture: c,
  }));
}

export default async function CulturePage({ params }: Props) {
  const { culture: cultureSlug } = await params;
  const config = CULTURES.find((c) => c.slug === cultureSlug);
  if (!config) notFound();

  const supabase = await createClient();
  const tags = CULTURE_TAGS[cultureSlug as DrinkCulture];

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, image_url, dish_types, drink_meta, cook_time_minutes, servings")
    .overlaps("dish_types", tags)
    .order("title");

  if (error) throw error;

  return <CultureClient culture={config} recipes={recipes ?? []} />;
}
