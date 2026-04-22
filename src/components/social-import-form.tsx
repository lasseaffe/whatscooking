"use client";

import { useState } from "react";
import { Loader2, CheckCircle, UtensilsCrossed, Tag } from "lucide-react";

interface ImportResult {
  recipe_name?: string;
  cuisine?: string;
  main_ingredients?: string[];
  cooking_method?: string;
  title?: string;
  description?: string;
  tags?: string[];
  suggested_plan_type?: string;
  id?: string;
}

export function SocialImportForm() {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!url.trim() && !caption.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() || undefined, caption: caption.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleImport()}
          placeholder="https://www.instagram.com/p/... or TikTok / YouTube food post"
          className="flex-1 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "#DDD0C8", background: "#fff", color: "#1C1209" }}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || (!url.trim() && !caption.trim())}
          className="px-4 py-2 rounded-xl font-medium text-sm shrink-0 inline-flex items-center gap-2 disabled:opacity-60 btn-primary-glow"
          style={{ background: "#C84B2F", color: "#fff" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowCaption((v) => !v)}
        className="text-xs text-left"
        style={{ color: "#C84B2F" }}
      >
        {showCaption ? "Hide caption input" : "No link? Paste the food post caption instead →"}
      </button>

      {showCaption && (
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Paste the food post caption or description here…"
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none"
          style={{ borderColor: "#DDD0C8", background: "#fff", color: "#1C1209" }}
        />
      )}

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
          {error}
        </p>
      )}

      {result && (
        <div className="mt-1 p-4 rounded-xl border" style={{ borderColor: "#C8C0A0", background: "#F5F2EC" }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4" style={{ color: "#4A6830" }} />
            <span className="text-sm font-medium" style={{ color: "#3D5030" }}>Saved to your recipe inspirations</span>
          </div>
          {result.title && <p className="font-semibold text-sm mb-1" style={{ color: "#1C1209" }}>{result.title}</p>}
          {result.description && <p className="text-xs mb-2" style={{ color: "#5C3D2E" }}>{result.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#5C3D2E" }}>
            {result.recipe_name && (
              <span className="flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3" />
                {result.recipe_name}
              </span>
            )}
            {result.cuisine && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {result.cuisine}
              </span>
            )}
            {result.cooking_method && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {result.cooking_method}
              </span>
            )}
          </div>
          {result.main_ingredients && result.main_ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.main_ingredients.map((ing) => (
                <span key={ing} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#DCFCE7", color: "#166534" }}>
                  {ing}
                </span>
              ))}
            </div>
          )}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#FFF3F0", color: "#C84B2F" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
