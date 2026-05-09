// src/components/cookbook-wizard/step-recipes.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import type { WizardDraft, WizardRecipe } from "./wizard-shell";

interface RecipeResult { id: string; title: string; image_url: string | null; cuisine_type: string | null; }

interface Props { draft: WizardDraft; updateDraft: (p: Partial<WizardDraft>) => void; saving: boolean; onNext: () => void; onBack: () => void; }

export function StepRecipes({ draft, updateDraft, onNext, onBack }: Props) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeResult[]>([]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}&limit=8`);
      if (res.ok) setResults(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function addRecipe(recipe: RecipeResult) {
    const chapter = draft.chapters[activeChapter];
    if (!chapter || chapter.recipes.some((r) => r.recipe_id === recipe.id)) return;
    const newRecipe: WizardRecipe = { recipe_id: recipe.id, position: chapter.recipes.length, chef_note: "", creator_meal_photo_url: "", title: recipe.title, image_url: recipe.image_url };
    updateDraft({ chapters: draft.chapters.map((ch, i) => i === activeChapter ? { ...ch, recipes: [...ch.recipes, newRecipe] } : ch) });
    setQuery(""); setResults([]);
  }

  function removeRecipe(ci: number, ri: number) {
    updateDraft({ chapters: draft.chapters.map((ch, i) => i === ci ? { ...ch, recipes: ch.recipes.filter((_, j) => j !== ri) } : ch) });
  }

  function updateRecipe(ci: number, ri: number, patch: Partial<WizardRecipe>) {
    updateDraft({ chapters: draft.chapters.map((ch, i) => i === ci ? { ...ch, recipes: ch.recipes.map((r, j) => j === ri ? { ...r, ...patch } : r) } : ch) });
  }

  const chapter = draft.chapters[activeChapter];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#3D2817" }}>Add Recipes</h2>
      <div className="flex gap-2 flex-wrap">
        {draft.chapters.map((ch, i) => (
          <button key={i} onClick={() => setActiveChapter(i)} className="px-3 py-1 rounded-lg text-sm font-medium"
            style={{ background: activeChapter === i ? "#C85A2F" : "#F5E6D3", color: activeChapter === i ? "#fff" : "#3D2817" }}>
            {ch.title}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#C4A882" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes to add…"
          className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
      </div>
      {results.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
          {results.map((r) => (
            <button key={r.id} onClick={() => addRecipe(r)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 border-b last:border-0"
              style={{ borderColor: "#F5E6D3" }}>
              <Plus className="w-4 h-4 flex-shrink-0" style={{ color: "#C85A2F" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#3D2817" }}>{r.title}</p>
                {r.cuisine_type && <p className="text-xs" style={{ color: "#6B5B52" }}>{r.cuisine_type}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
      {chapter?.recipes.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: "#C4A882" }}>No recipes in this chapter yet. Search above to add.</p>
      )}
      <div className="space-y-3">
        {chapter?.recipes.map((r, ri) => (
          <div key={ri} className="rounded-xl border p-3" style={{ borderColor: "#F5E6D3" }}>
            <div className="flex items-center gap-2 mb-2">
              <p className="flex-1 text-sm font-medium" style={{ color: "#3D2817" }}>{r.title}</p>
              <button onClick={() => removeRecipe(activeChapter, ri)}><Trash2 className="w-4 h-4" style={{ color: "#C85A2F" }} /></button>
            </div>
            <textarea value={r.chef_note} onChange={(e) => updateRecipe(activeChapter, ri, { chef_note: e.target.value })}
              placeholder="Chef's note (max 280 chars)…" maxLength={280} rows={2}
              className="w-full rounded-lg px-3 py-1.5 border text-xs resize-none"
              style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
            <input value={r.creator_meal_photo_url} onChange={(e) => updateRecipe(activeChapter, ri, { creator_meal_photo_url: e.target.value })}
              placeholder="Your photo URL for this dish…"
              className="mt-1.5 w-full rounded-lg px-3 py-1.5 border text-xs"
              style={{ borderColor: "#F5E6D3", color: "#3D2817" }} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl font-semibold border text-sm" style={{ borderColor: "#F5E6D3", color: "#6B5B52" }}>← Back</button>
        <button onClick={onNext} className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: "#C85A2F" }}>Next: Publish →</button>
      </div>
    </div>
  );
}
