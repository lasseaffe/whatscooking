// src/app/(app)/cookbooks/page.tsx
import { createClient } from "@/lib/supabase/server";
import { CookbooksClient, type CookbookRow } from "./cookbooks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookbooks — What's Cooking" };

export default async function CookbooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cookbooks }, { data: follows }] = await Promise.all([
    supabase
      .from("cookbooks")
      .select(`
        id, title, tagline, cover_image_url, theme_color, title_font, price, slug, view_count, created_at,
        profiles(id, username, full_name, avatar_url),
        cookbook_chapters(cookbook_recipes(recipe:recipes(id, image_url)))
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(48),
    user
      ? supabase
          .from("profile_follows")
          .select("following_id")
          .eq("follower_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const followedCreatorIds = new Set((follows ?? []).map((f: { following_id: string }) => f.following_id));

  const mapped = (cookbooks ?? []).map((cb) => {
    const profile = Array.isArray(cb.profiles) ? cb.profiles[0] ?? null : cb.profiles;
    const recipeCount = (cb.cookbook_chapters ?? []).reduce(
      (s: number, ch: { cookbook_recipes: unknown[] }) => s + ch.cookbook_recipes.length, 0
    );
    // Flatten first 4 recipe image URLs for hover collage
    const recipeImages: string[] = [];
    for (const ch of cb.cookbook_chapters ?? []) {
      for (const cr of ch.cookbook_recipes ?? []) {
        const url = (cr as unknown as { recipe?: { image_url?: string | null } }).recipe?.image_url;
        if (url && recipeImages.length < 4) recipeImages.push(url);
      }
    }
    return { ...cb, profiles: profile, recipeCount, recipeImages };
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--wc-text)" }}>Cookbooks</h1>
        <p className="text-sm mt-1" style={{ color: "var(--wc-text-2)" }}>
          Curated recipe collections from creators around the world
        </p>
      </div>
      <CookbooksClient
        initialCookbooks={mapped as unknown as CookbookRow[]}
        userId={user?.id ?? null}
        initialFollowedCreatorIds={[...followedCreatorIds]}
      />
    </main>
  );
}
