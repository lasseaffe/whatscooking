// src/app/(app)/cookbooks/[slug]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { WizardShell } from "@/components/cookbook-wizard/wizard-shell";
import type { WizardDraft } from "@/components/cookbook-wizard/wizard-shell";

type Props = { params: Promise<{ slug: string }> };

export default async function EditCookbookPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cb } = await supabase
    .from("cookbooks")
    .select("*, cookbook_chapters(*, cookbook_recipes(*, recipes(id, title, image_url, cuisine_type)))")
    .eq("slug", slug).eq("user_id", user.id).single();

  if (!cb) notFound();

  type ChapterRow = {
    id: string; title: string; intro_text: string | null; cover_image_url: string | null; position: number;
    cookbook_recipes: RecipeRow[];
  };
  type RecipeRow = {
    id: string; recipe_id: string; position: number; chef_note: string | null;
    creator_meal_photo_url: string | null;
    recipes: { id: string; title: string; image_url: string | null } | null;
  };

  const draft: Partial<WizardDraft> = {
    id: cb.id, slug: cb.slug, title: cb.title, description: cb.description ?? "",
    cover_image_url: cb.cover_image_url ?? "", theme_color: cb.theme_color,
    title_font: cb.title_font, tagline: cb.tagline ?? "", price: cb.price,
    chapters: (cb.cookbook_chapters ?? [] as ChapterRow[])
      .sort((a: ChapterRow, b: ChapterRow) => a.position - b.position)
      .map((ch: ChapterRow) => ({
        id: ch.id, title: ch.title, intro_text: ch.intro_text ?? "", cover_image_url: ch.cover_image_url ?? "", position: ch.position,
        recipes: (ch.cookbook_recipes ?? [] as RecipeRow[])
          .sort((a: RecipeRow, b: RecipeRow) => a.position - b.position)
          .map((cr: RecipeRow) => ({
            id: cr.id, recipe_id: cr.recipe_id, position: cr.position,
            chef_note: cr.chef_note ?? "", creator_meal_photo_url: cr.creator_meal_photo_url ?? "",
            title: cr.recipes?.title ?? "", image_url: cr.recipes?.image_url ?? null,
          })),
      })),
  };

  return <WizardShell initialDraft={draft} />;
}
