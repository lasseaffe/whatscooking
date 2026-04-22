"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

export function PhotoRecipeImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/recipes/extract-from-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Extraction failed");

      const { recipe } = await res.json();
      const encoded = btoa(encodeURIComponent(JSON.stringify(recipe)));
      router.push(`/my-recipes/new?extracted=1&data=${encoded}`);
    } catch {
      setError("Couldn't extract recipe. Try a clearer photo.");
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 hover:opacity-90"
        style={{ border: "1px solid #C8522A", color: "#C8522A", background: "transparent" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Extracting…
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Add from photo
          </>
        )}
      </button>
      {error && (
        <p className="text-xs mt-1.5" style={{ color: "#B07A52" }}>{error}</p>
      )}
    </div>
  );
}
