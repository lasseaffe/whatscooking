"use client";

import { useState } from "react";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";

interface Props {
  recipeId: string;
  title: string;
  sourceUrl: string | null;
  onExtracted: (recipe: Record<string, unknown>) => void;
}

export function PremiumExtract({ recipeId, title, sourceUrl, onExtracted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extract() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      onExtracted(data.recipe);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border overflow-hidden mb-6" style={{ borderColor: "#3A2416" }}>
      {/* Instagram-style gradient header */}
      <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)" }}>
        <div className="flex items-center gap-2.5 mb-2">
          {/* Instagram camera icon (inline SVG — lucide-react doesn't include it) */}
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
          <span className="text-sm font-bold text-white">Instagram Recipe</span>
        </div>
        <p className="text-sm text-white opacity-90 leading-snug">{title}</p>
      </div>

      <div className="px-6 py-5" style={{ background: "#1C1209" }}>
        <p className="text-sm mb-4" style={{ color: "#8A6A4A" }}>
          This recipe comes from an Instagram post. We can reconstruct the full step-by-step recipe using AI — or view the original post directly.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={extract}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Reconstructing recipe…</>
              : <><Sparkles className="w-4 h-4" /> Reconstruct full recipe with AI</>}
          </button>

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "#2A1808", color: "#8A6A4A", border: "1.5px solid #3A2416" }}
            >
              <ExternalLink className="w-4 h-4" />
              View original post
            </a>
          )}
        </div>

        {error && (
          <p className="text-xs mt-3" style={{ color: "#C8522A" }}>{error}</p>
        )}

        <p className="text-xs mt-3" style={{ color: "#6B4E36" }}>
          AI reconstruction generates a recipe based on the post title and description. For the most accurate version, view the original post.
        </p>
      </div>
    </div>
  );
}
