// src/app/(app)/cookbooks/[slug]/chapter/[chapterId]/page.tsx
// NOTE: dangerouslySetInnerHTML is used intentionally here — content is sanitized via
// DOMPurify.sanitize() server-side before rendering. This is the standard safe pattern.
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { MealPhotoGallery } from "@/components/meal-photo-gallery";
import type { CookbookRecipe, CookbookMealPhoto } from "@/lib/cookbook-types";

type Props = { params: Promise<{ slug: string; chapterId: string }> };

export default async function ChapterPage({ params }: Props) {
  const { slug, chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select("id, title, slug, user_id, price, theme_color")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!cookbook) notFound();

  const isPurchased = user
    ? !!(await supabase.from("cookbook_purchases").select("id").eq("user_id", user.id).eq("cookbook_id", cookbook.id).single()).data
    : false;
  const isOwner = user?.id === cookbook.user_id;
  const hasAccess = isOwner || cookbook.price === 0 || isPurchased;
  if (!hasAccess) notFound();

  const { data: chapter } = await supabase
    .from("cookbook_chapters")
    .select("*, cookbook_recipes(*, recipes(id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, dietary_tags))")
    .eq("id", chapterId)
    .eq("cookbook_id", cookbook.id)
    .single();
  if (!chapter) notFound();

  const recipes = ((chapter.cookbook_recipes ?? []) as CookbookRecipe[]).sort((a, b) => a.position - b.position);

  const { data: mealPhotos } = await supabase
    .from("cookbook_meal_photos")
    .select("*, profiles(username, avatar_url)")
    .eq("cookbook_id", cookbook.id)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false });

  // Safe: sanitize creator-provided HTML with DOMPurify before rendering
  const safeIntroHtml = chapter.intro_text ? DOMPurify.sanitize(chapter.intro_text) : null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/cookbooks/${slug}`} className="text-sm mb-6 inline-block" style={{ color: "#C85A2F" }}>
        ← Back to {cookbook.title}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#3D2817" }}>{chapter.title}</h1>
        {safeIntroHtml && (
          <div
            className="prose prose-sm max-w-none"
            style={{ color: "#6B5B52" }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: safeIntroHtml }}
          />
        )}
      </div>

      <div className="space-y-6">
        {recipes.map((cr) => (
          <div key={cr.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
            <Link href={`/recipes/${cr.recipes?.id}`} className="block">
              {(cr.creator_meal_photo_url ?? cr.recipes?.image_url) && (
                <div className="relative h-44 w-full">
                  <Image
                    src={(cr.creator_meal_photo_url ?? cr.recipes!.image_url)!}
                    alt={cr.recipes?.title ?? ""}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="px-4 py-3">
                <h3 className="font-semibold" style={{ color: "#3D2817" }}>{cr.recipes?.title}</h3>
                {cr.recipes?.cuisine_type && (
                  <p className="text-xs mt-0.5" style={{ color: "#6B5B52" }}>{cr.recipes.cuisine_type}</p>
                )}
              </div>
            </Link>

            {cr.chef_note && (
              <div className="mx-4 mb-3 px-3 py-2 rounded-xl text-sm italic"
                style={{ background: "#FFF8F3", color: "#6B5B52", borderLeft: `3px solid ${cookbook.theme_color}` }}>
                &ldquo;{cr.chef_note}&rdquo;
              </div>
            )}

            {user && (
              <MealPhotoGallery
                cookbookSlug={slug}
                recipeId={cr.recipes?.id ?? ""}
                photos={((mealPhotos ?? []) as CookbookMealPhoto[]).filter((p) => p.recipe_id === cr.recipes?.id)}
                isOwner={isOwner}
                currentUserId={user.id}
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
