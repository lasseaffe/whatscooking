// src/app/(app)/cookbooks/page.tsx
import { createClient } from "@/lib/supabase/server";
import { CookbooksClient } from "./cookbooks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookbooks — What's Cooking" };

export default async function CookbooksPage() {
  const supabase = await createClient();
  const { data: cookbooks } = await supabase
    .from("cookbooks")
    .select(`
      id, title, tagline, cover_image_url, theme_color, title_font, price, slug, view_count, created_at,
      profiles(username, full_name, avatar_url),
      cookbook_chapters(id, cookbook_recipes(id))
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(48);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#3D2817" }}>Cookbooks</h1>
        <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>
          Curated recipe collections from creators around the world
        </p>
      </div>
      <CookbooksClient initialCookbooks={(cookbooks ?? []).map((cb) => ({
        ...cb,
        profiles: Array.isArray(cb.profiles) ? cb.profiles[0] ?? null : cb.profiles,
      }))} />
    </main>
  );
}
