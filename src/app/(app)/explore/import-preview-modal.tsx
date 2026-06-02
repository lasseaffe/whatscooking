"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2 } from "lucide-react";
import type { ImportPreview } from "@/lib/import-pipeline";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";

interface ImportPreviewModalProps {
  recipe: ExternalRecipe;
  onClose: () => void;
}

export function ImportPreviewModal({ recipe, onClose }: ImportPreviewModalProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setPreview(data.preview);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview, confirm: true }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(`/recipes/${data.recipeId}`);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof ImportPreview, value: string) {
    if (!preview) return;
    setPreview({ ...preview, [field]: value });
  }

  const isAI = (field: string) => preview?.aiGeneratedFields.includes(field) ?? false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(20,10,4,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ background: "#FBF6EE" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0E8DC" }}>
          <h2
            className="text-base font-bold"
            style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Save to Cookbook
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X className="w-4 h-4" style={{ color: "#6B5B52" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Initial CTA */}
          {!preview && !loading && (
            <div className="text-center py-8">
              <p className="text-sm mb-2" style={{ color: "#3D2817" }}>
                We&apos;ll check <strong>{recipe.title}</strong> for missing fields and fill them automatically.
              </p>
              <p className="text-xs mb-6" style={{ color: "#A69180" }}>
                AI-filled fields will be marked ✨ — you can edit them before saving.
              </p>
              <button
                onClick={loadPreview}
                className="px-6 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: "#C8522A", color: "#fff" }}
              >
                Prepare Recipe
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" style={{ color: "#C8522A" }} />
              <p className="text-sm" style={{ color: "#6B5B52" }}>Filling gaps with AI…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl p-4 mb-4" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Preview form */}
          {preview && (
            <div className="flex flex-col gap-4">
              {/* Image */}
              {preview.imageUrl && (
                <div className="rounded-xl overflow-hidden relative" style={{ height: 160 }}>
                  <img src={preview.imageUrl} alt={preview.title} className="w-full h-full object-cover" />
                  {isAI("imageUrl") && (
                    <span
                      className="absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "#7C3AED", color: "#fff" }}
                    >
                      <Sparkles className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B5B52" }}>Title</label>
                <input
                  value={preview.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E0D0BC", color: "#3D2817", background: "#fff" }}
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-xs font-semibold" style={{ color: "#6B5B52" }}>Description</label>
                  {isAI("description") && (
                    <span
                      className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: "#7C3AED18", color: "#7C3AED" }}
                    >
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                </div>
                <textarea
                  value={preview.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
                  style={{ borderColor: "#E0D0BC", color: "#3D2817", background: "#fff" }}
                />
              </div>

              {/* Difficulty */}
              {preview.difficulty && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-xs font-semibold" style={{ color: "#6B5B52" }}>Difficulty</label>
                    {isAI("difficulty") && (
                      <span
                        className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: "#7C3AED18", color: "#7C3AED" }}
                      >
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                  <select
                    value={preview.difficulty}
                    onChange={(e) => updateField("difficulty", e.target.value)}
                    className="px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#E0D0BC", color: "#3D2817", background: "#fff" }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              )}

              {/* Ingredients summary */}
              <div className="rounded-xl p-3" style={{ background: "#F0E8DC" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#6B5B52" }}>
                  {preview.ingredients.length} ingredients · {preview.instructions.length} steps
                </p>
                <p className="text-xs" style={{ color: "#A69180" }}>
                  {preview.ingredients.slice(0, 4).map((i) => i.name).join(", ")}
                  {preview.ingredients.length > 4 ? "…" : ""}
                </p>
              </div>

              {preview.aiGeneratedFields.length > 0 && (
                <p className="text-xs" style={{ color: "#7C3AED" }}>
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  AI filled: {preview.aiGeneratedFields.join(", ")}. You can edit these fields above.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: "#F0E8DC" }}>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-full text-sm border"
              style={{ borderColor: "#E0D0BC", color: "#6B5B52" }}
            >
              Cancel
            </button>
            <button
              onClick={confirmImport}
              disabled={saving}
              className="flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "#C8522A", color: "#fff", opacity: saving ? 0.7 : 1 }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save to Cookbook
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
