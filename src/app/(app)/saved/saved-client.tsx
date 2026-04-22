"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Clock, Flame, ExternalLink, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

type SavedRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  source_name: string | null;
  source_url: string | null;
  saved_at: string;
};

export function SavedClient({ initialRecipes }: { initialRecipes: SavedRecipe[] }) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>(initialRecipes);
  const [pending, setPending] = useState<string | null>(null);

  async function handleUnsave(id: string) {
    setPending(null);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/saves?recipe_id=${id}`, { method: "DELETE" });
  }

  if (recipes.length === 0) {
    return (
      <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
        <Heart className="w-8 h-8 mx-auto mb-3" style={{ color: "#C85A2F", opacity: 0.3 }} />
        <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>No saved recipes yet</p>
        <p className="text-xs mb-4" style={{ color: "#6B5B52" }}>
          Hit the Save button on any recipe to bookmark it here.
        </p>
        <Link href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "#C85A2F", color: "#fff" }}>
          Find recipes
        </Link>
      </div>
    );
  }

  return (
    <>
      <ConfirmDeleteDialog
        open={!!pending}
        title="Remove saved recipe?"
        description="This recipe will be removed from your saved list. You can save it again anytime."
        confirmLabel="Remove"
        onConfirm={() => pending && handleUnsave(pending)}
        onCancel={() => setPending(null)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          return (
            <div key={r.id} className="group rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg relative"
              style={{ borderColor: "#F5E6D3", background: "#fff" }}>
              <Link href={`/recipes/${r.id}`} className="block">
                <div className="relative h-44 overflow-hidden">
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "#FFF0E6" }}>
                      <Heart className="w-8 h-8" style={{ color: "#C85A2F", opacity: 0.3 }} />
                    </div>
                  )}
                  {(r.dietary_tags ?? []).length > 0 && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      {(r.dietary_tags ?? []).slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
                          style={{ background: "rgba(255,255,255,0.85)", color: "#C85A2F" }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2" style={{ color: "#3D2817" }}>{r.title}</h3>
                  <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "#A69180" }}>
                    {totalTime > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{totalTime}m</span>}
                    {r.calories && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{r.calories} kcal</span>}
                    {r.cuisine_type && <span className="ml-auto">{r.cuisine_type}</span>}
                  </div>
                  {r.source_name && (
                    <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: "#A69180" }}>
                      <ExternalLink className="w-3 h-3" />{r.source_name}
                    </div>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={() => setPending(r.id)}
                className="absolute top-2 right-2 p-1.5 rounded-xl backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                style={{ background: "rgba(220,38,38,0.85)", color: "#fff" }}
                title="Remove from saved"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
