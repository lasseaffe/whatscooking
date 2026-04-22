import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChefHat, Plus, ArrowRight, Shuffle, Clock, Flame, Zap, Mountain } from "lucide-react";
import { MyRecipesClient } from "./my-recipes-client";
import { PhotoRecipeImport } from "@/components/photo-recipe-import";

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",        color: "#16A34A", bg: "#DCFCE7" },
  medium: { label: "Medium",      color: "#D97706", bg: "#FEF3C7" },
  hard:   { label: "Challenging", color: "#DC2626", bg: "#FEE2E2" },
} as const;

export default async function MyRecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: recipes }, { data: swipeLikes }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, description, image_url, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, calories, is_published, created_at")
      .eq("source", "user")
      .eq("created_by", user!.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("swipe_likes")
      .select("liked_at, recipe:recipes(id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, calories, difficulty_level)")
      .eq("user_id", user!.id)
      .order("liked_at", { ascending: false })
      .limit(50),
  ]);

  const swipeRecipes = (swipeLikes ?? []).map((row: { liked_at: string; recipe: unknown }) => row.recipe as {
    id: string; title: string; image_url: string | null; cuisine_type: string | null;
    prep_time_minutes: number | null; cook_time_minutes: number | null;
    calories: number | null; difficulty_level: "easy" | "medium" | "hard" | null;
  });

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            <ChefHat className="w-6 h-6" style={{ color: "#C8522A" }} />
            My Recipes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
            Recipes you&apos;ve created — publish them to share with the community.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PhotoRecipeImport />
          <Link href="/my-recipes/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C8522A", color: "#fff" }}>
            <Plus className="w-4 h-4" /> New recipe
          </Link>
        </div>
      </div>

      <div className="space-y-10">
        <PublishCTA />
        <MyRecipesClient initialRecipes={recipes ?? []} />

        {/* Swipe Liked Recipes */}
        {swipeRecipes.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C8522A, #E8834A)" }}>
                <Shuffle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#EFE3CE" }}>Liked via Meal Swipe</h2>
                <p className="text-xs" style={{ color: "#6B4E36" }}>{swipeRecipes.length} saved recipe{swipeRecipes.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {swipeRecipes.map((r) => {
                const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
                const diff = r.difficulty_level ? DIFFICULTY_CONFIG[r.difficulty_level] : null;
                return (
                  <Link key={r.id} href={`/recipes/${r.id}`}
                    className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-1"
                    style={{ borderColor: "#3A2416", background: "#1C1209" }}>
                    <div className="relative h-40 overflow-hidden">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" style={{ filter: "brightness(0.88) saturate(0.9)" }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: "#241809" }}>
                          <ChefHat className="w-8 h-8" style={{ color: "#3A2416" }} />
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.65) 0%, transparent 55%)" }} />
                      {diff && (
                        <div className="absolute top-2 left-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: diff.bg, color: diff.color }}>
                            {diff.label}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full backdrop-blur-sm"
                          style={{ background: "rgba(200,82,42,0.85)", color: "#fff" }}>
                          <Shuffle className="w-3 h-3" /> Swipe
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm leading-snug line-clamp-1 mb-1.5" style={{ color: "#EFE3CE" }}>
                        {r.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "#6B4E36" }}>
                        {r.cuisine_type && (
                          <span className="px-2 py-0.5 rounded-full" style={{ background: "#2A1808", color: "#C8522A" }}>
                            {r.cuisine_type}
                          </span>
                        )}
                        {totalTime > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{totalTime}m</span>}
                        {r.calories && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{r.calories} kcal</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PublishCTA() {
  return (
    <Link href="/my-recipes/new"
      className="group block rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
      style={{ background: "linear-gradient(135deg, #1A0C08 0%, #3A1810 50%, #5A2A18 100%)", border: "1px solid #C8522A30" }}>
      <div className="px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C8522A" }}>
            Share your creativity
          </p>
          <h2 className="text-xl font-bold leading-snug mb-2" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Publish Your Recipe
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8A6A4A" }}>
            Get real feedback and suggestions, inspire home cooks around the world,
            and build a fan community around your dishes.
          </p>
        </div>
        <div
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all group-hover:scale-105"
          style={{ background: "#C8522A", color: "#fff" }}>
          Start creating <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
