// src/app/(app)/cookbooks/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CookbookCover } from "@/components/cookbook-cover";
import { BookOpen, Copy } from "lucide-react";
import type { Metadata } from "next";
import type { CookbookChapter, CookbookRecipe } from "@/lib/cookbook-types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("cookbooks").select("title, tagline, cover_image_url").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: `${data.title} — What's Cooking`,
    description: data.tagline ?? undefined,
    openGraph: { images: data.cover_image_url ? [data.cover_image_url] : [] },
  };
}

export default async function CookbookPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select(`*, profiles(username, full_name, avatar_url), cookbook_chapters(*, cookbook_recipes(*, recipes(id, title, cuisine_type)))`)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!cookbook) notFound();

  await supabase.from("cookbooks").update({ view_count: (cookbook.view_count ?? 0) + 1 }).eq("id", cookbook.id);

  const isPurchased = user
    ? !!(await supabase.from("cookbook_purchases").select("id").eq("user_id", user.id).eq("cookbook_id", cookbook.id).single()).data
    : false;

  const isOwner = user?.id === cookbook.user_id;
  const hasAccess = isOwner || cookbook.price === 0 || isPurchased;
  const chapters: CookbookChapter[] = (cookbook.cookbook_chapters ?? []).sort((a: CookbookChapter, b: CookbookChapter) => a.position - b.position);
  const totalRecipes = chapters.reduce((s, ch) => s + (ch.cookbook_recipes?.length ?? 0), 0);
  const creator = cookbook.profiles;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <CookbookCover
        cookbook={cookbook}
        recipeCount={totalRecipes}
        creatorName={creator?.username ?? creator?.full_name}
        creatorAvatar={creator?.avatar_url}
        size="hero"
      />

      <div className="flex items-start gap-3 mt-5 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>{cookbook.title}</h1>
          {creator?.username && (
            <Link href={`/profile/${creator.username}`} className="text-sm font-medium hover:underline mt-0.5 inline-block" style={{ color: "#C85A2F" }}>
              @{creator.username}
            </Link>
          )}
          {cookbook.description && <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>{cookbook.description}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isOwner && (
            <Link href={`/cookbooks/${slug}/edit`} className="px-3 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: "#C85A2F", color: "#C85A2F" }}>
              Edit
            </Link>
          )}
          {cookbook.price === 0 && !isOwner && (
            <form action={`/api/cookbooks/${slug}/clone`} method="POST">
              <button type="submit" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: "#6B5B52", color: "#6B5B52" }}>
                <Copy className="w-3.5 h-3.5" /> Clone
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter, idx) => {
          const locked = !hasAccess && idx > 0;
          const recipes = (chapter.cookbook_recipes ?? []) as CookbookRecipe[];
          return (
            <div key={chapter.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ background: locked ? "#F9F5F0" : "#FFF8F3" }}>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: "#C85A2F" }}>Chapter {idx + 1}</p>
                  <h2 className="font-semibold" style={{ color: "#3D2817" }}>{chapter.title}</h2>
                </div>
                {locked
                  ? <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#F5E6D3", color: "#6B5B52" }}>🔒 Locked</span>
                  : <Link href={`/cookbooks/${slug}/chapter/${chapter.id}`} className="text-sm font-medium" style={{ color: "#C85A2F" }}>View →</Link>
                }
              </div>
              {!locked && (
                <div className="px-5 py-3 border-t" style={{ borderColor: "#F5E6D3" }}>
                  <p className="text-xs" style={{ color: "#6B5B52" }}>
                    {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}{recipes.length > 0 ? " · " : ""}
                    {recipes.slice(0, 3).map((cr) => cr.recipes?.title).filter(Boolean).join(", ")}
                    {recipes.length > 3 ? "…" : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!user && (
        <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: "#FFF8F3", border: "1px solid #F5E6D3" }}>
          <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "#C85A2F" }} />
          <p className="font-semibold mb-1" style={{ color: "#3D2817" }}>Sign up to access all chapters</p>
          <p className="text-sm mb-4" style={{ color: "#6B5B52" }}>Free account — unlock the full cookbook instantly.</p>
          <Link href="/signup" className="px-6 py-2 rounded-xl text-sm font-semibold text-white inline-block" style={{ background: "#C85A2F" }}>
            Create free account
          </Link>
        </div>
      )}
    </main>
  );
}
