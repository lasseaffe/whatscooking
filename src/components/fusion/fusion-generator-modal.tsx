"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2 } from "lucide-react";

const ALL_CUISINES = [
  "Korean", "Japanese", "Mexican", "Italian", "Indian", "Thai", "Chinese",
  "Lebanese", "French", "Spanish", "Peruvian", "Ethiopian", "Greek", "Turkish",
  "Moroccan", "Vietnamese", "Brazilian", "American", "British", "German",
];

interface FusionGeneratorModalProps {
  onClose: () => void;
}

interface GeneratorResult {
  name: string;
  recipeId: string;
  originStory: string;
  flavorBridge: string[];
}

export function FusionGeneratorModal({ onClose }: FusionGeneratorModalProps) {
  const router = useRouter();
  const [cuisine1, setCuisine1] = useState("");
  const [cuisine2, setCuisine2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!cuisine1 || !cuisine2 || cuisine1 === cuisine2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fusion/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuisine1, cuisine2 }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult({
        name: data.preview.title,
        recipeId: data.recipeId,
        originStory: data.originStory,
        flavorBridge: data.flavorBridge ?? [],
      });
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(20,10,4,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#FBF6EE" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0E8DC" }}>
          <h2
            className="text-base font-bold flex items-center gap-2"
            style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#C8522A" }} />
            Generate a Fusion Dish
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X className="w-4 h-4" style={{ color: "#6B5B52" }} />
          </button>
        </div>

        <div className="px-5 py-5">
          {!result ? (
            <>
              <p className="text-xs mb-4" style={{ color: "#6B5B52" }}>
                Pick two cuisines — our AI will create a unique fusion dish and save it to your cookbook.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B5B52" }}>Cuisine 1</label>
                  <select
                    value={cuisine1}
                    onChange={(e) => setCuisine1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#E0D0BC", color: "#3D2817", background: "#fff" }}
                  >
                    <option value="">Select…</option>
                    {ALL_CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B5B52" }}>Cuisine 2</label>
                  <select
                    value={cuisine2}
                    onChange={(e) => setCuisine2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#E0D0BC", color: "#3D2817", background: "#fff" }}
                  >
                    <option value="">Select…</option>
                    {ALL_CUISINES.filter((c) => c !== cuisine1).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs mb-3" style={{ color: "#B91C1C" }}>{error}</p>}

              <button
                onClick={generate}
                disabled={!cuisine1 || !cuisine2 || cuisine1 === cuisine2 || loading}
                className="w-full py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{
                  background: "#C8522A",
                  color: "#fff",
                  opacity: (!cuisine1 || !cuisine2 || loading) ? 0.6 : 1,
                }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  : <><Sparkles className="w-4 h-4" /> Generate Dish</>
                }
              </button>
            </>
          ) : (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "#FDF2EC" }}
              >
                <Sparkles className="w-6 h-6" style={{ color: "#C8522A" }} />
              </div>
              <h3
                className="text-base font-bold mb-1"
                style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {result.name}
              </h3>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6B5B52" }}>
                {result.originStory}
              </p>
              {result.flavorBridge.length > 0 && (
                <div className="rounded-xl p-3 mb-4 text-left" style={{ background: "#F0E8DC" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#C8522A" }}>Why it works</p>
                  {result.flavorBridge.map((b, i) => (
                    <p key={i} className="text-xs" style={{ color: "#3D2817" }}>· {b}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => router.push(`/recipes/${result.recipeId}`)}
                className="w-full py-2.5 rounded-full text-sm font-semibold"
                style={{ background: "#C8522A", color: "#fff" }}
              >
                View Full Recipe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
