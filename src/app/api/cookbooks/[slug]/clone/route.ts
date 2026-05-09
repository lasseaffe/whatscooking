import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: original } = await supabase
    .from("cookbooks")
    .select("*, cookbook_chapters(*, cookbook_recipes(*))")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (original.price > 0) return NextResponse.json({ error: "Cannot clone paid cookbooks" }, { status: 403 });

  const newSlug = original.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

  const { data: cloned, error: cbErr } = await supabase
    .from("cookbooks")
    .insert({
      user_id: user.id,
      title: `${original.title} (copy)`,
      description: original.description,
      cover_image_url: original.cover_image_url,
      theme_color: original.theme_color,
      title_font: original.title_font,
      tagline: original.tagline ? `${original.tagline} — via @${slug}` : null,
      price: 0,
      status: "draft",
      slug: newSlug,
    })
    .select()
    .single();

  if (cbErr || !cloned) return NextResponse.json({ error: cbErr?.message }, { status: 500 });

  for (const chapter of original.cookbook_chapters ?? []) {
    const { data: newChapter } = await supabase
      .from("cookbook_chapters")
      .insert({ cookbook_id: cloned.id, title: chapter.title, intro_text: chapter.intro_text, cover_image_url: chapter.cover_image_url, position: chapter.position })
      .select()
      .single();
    if (!newChapter) continue;
    for (const cr of chapter.cookbook_recipes ?? []) {
      await supabase.from("cookbook_recipes").insert({
        chapter_id: newChapter.id, cookbook_id: cloned.id, recipe_id: cr.recipe_id,
        position: cr.position, chef_note: cr.chef_note, creator_meal_photo_url: cr.creator_meal_photo_url,
      });
    }
  }

  return NextResponse.json({ slug: cloned.slug }, { status: 201 });
}
