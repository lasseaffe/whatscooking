"use client";

import { useState } from "react";
import Link from "next/link";
import { ChefHat, Clock, Flame, Globe, Lock, Trash2 } from "lucide-react";
import { PublishToggle } from "./publish-toggle";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { COMPONENT_TYPE_EMOJI, COMPONENT_TYPE_LABELS } from "@/lib/component-types";
import type { ComponentType } from "@/lib/types";

type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  dish_types: string[] | null;
  dietary_tags: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  is_published: boolean;
  created_at: string;
};

type ComponentSummary = {
  id: string; title: string; description: string | null; image_url: string | null;
  component_type: string; cook_time_minutes: number | null;
};

export function MyRecipesClient({ initialRecipes, savedComponents = [] }: { initialRecipes: Recipe[]; savedComponents?: ComponentSummary[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [pending, setPending] = useState<string | null>(null); // id to confirm delete

  async function handleDelete(id: string) {
    setPending(null);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/recipes/user?id=${id}`, { method: "DELETE" });
  }

  return (
    <>
      <ConfirmDeleteDialog
        open={!!pending}
        title="Delete recipe?"
        description="This will permanently delete the recipe and remove it from any saves or ratings. This cannot be undone."
        confirmLabel="Delete recipe"
        onConfirm={() => pending && handleDelete(pending)}
        onCancel={() => setPending(null)}
      />

      {recipes.length === 0 ? (
        <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
          <ChefHat className="w-8 h-8 mx-auto mb-3" style={{ color: "#C85A2F", opacity: 0.3 }} />
          <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>No recipes yet</p>
          <p className="text-xs mb-4" style={{ color: "#6B5B52" }}>Create your first recipe and share it with the community.</p>
          <Link href="/my-recipes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C85A2F", color: "#fff" }}>
            Create recipe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((r) => {
            const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
            return (
              <div key={r.id} className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "#F5E6D3", background: "#fff" }}>
                <Link href={`/recipes/${r.id}`} className="block">
                  <div className="relative h-40 overflow-hidden">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #FFF0E6 0%, #FFE4D1 100%)" }}>
                        <ChefHat className="w-8 h-8" style={{ color: "#C85A2F", opacity: 0.3 }} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {r.is_published ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ background: "rgba(45,122,79,0.85)", color: "#fff" }}>
                          <Globe className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-1 mb-1.5" style={{ color: "#3D2817" }}>{r.title}</h3>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#A69180" }}>
                      {totalTime > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{totalTime}m</span>}
                      {r.calories && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{r.calories} kcal</span>}
                    </div>
                  </div>
                </Link>
                <div className="px-3 pb-3 flex items-center gap-2">
                  <div className="flex-1">
                    <PublishToggle recipeId={r.id} initialPublished={r.is_published} />
                  </div>
                  <button
                    onClick={() => setPending(r.id)}
                    className="p-2 rounded-xl transition-colors hover:bg-red-50"
                    style={{ color: "#A69180" }}
                    title="Delete recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MY BUILDING BLOCKS ── */}
      <div className="mt-10">
        <h2 className="text-base font-bold mb-4" style={{ color: "#EFE3CE" }}>
          🧩 My Building Blocks
        </h2>
        {savedComponents.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}
          >
            <p className="text-2xl mb-2">🧩</p>
            <p className="text-sm font-medium mb-1" style={{ color: "#EFE3CE" }}>
              No building blocks saved yet
            </p>
            <p className="text-xs mb-4" style={{ color: "#8A6A4A" }}>
              Tap &quot;Save to my components&quot; when viewing a sauce, dressing, or marinade.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#C85A2F", color: "#fff" }}
            >
              Browse building blocks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {savedComponents.map((c) => (
              <Link
                key={c.id}
                href={`/recipes/${c.id}`}
                className="rounded-xl p-4 transition-opacity hover:opacity-80"
                style={{ background: "#1C1209", border: "1px solid #3A2416" }}
              >
                <span className="text-2xl mb-2 block">
                  {COMPONENT_TYPE_EMOJI[(c.component_type as ComponentType)] ?? "🧩"}
                </span>
                <p className="font-bold text-sm mb-0.5" style={{ color: "#e87c3e" }}>
                  {c.title}
                </p>
                <p className="text-xs" style={{ color: "#6B4E36" }}>
                  {COMPONENT_TYPE_LABELS[(c.component_type as ComponentType)] ?? c.component_type}
                  {c.cook_time_minutes ? ` · ${c.cook_time_minutes} min` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
