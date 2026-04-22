"use client";

import { useState, useMemo } from "react";
import { Search, Star, Clock, Flame, Sparkles, ExternalLink, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Curated Unsplash food photos — used as fallback thumbnails
const FOOD_PHOTOS = [
  "photo-1504674900247-0877df9cc836",
  "photo-1414235077428-338989a2e8c0",
  "photo-1476224203421-9ac39bcb3327",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1546069901-ba9599a7e63c",
  "photo-1512621776951-a57141f2eefd",
  "photo-1484723091739-30a097e8f929",
  "photo-1499028344343-cd173ffc68a9",
  "photo-1455619452474-d2be8b1e70cd",
  "photo-1432139509613-5c4255815697",
  "photo-1467003909585-2f8a72700288",
  "photo-1519708227418-c8fd9a32b7a2",
  "photo-1606851091851-e8c8c0fca5ba",
  "photo-1555939594-58d7cb561ad1",
  "photo-1567620905732-2d1ec7ab7445",
  "photo-1528735602780-2552fd46c7af",
  "photo-1567620832903-9fc6debc209f",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1504754524776-8f4f37790ca0",
  "photo-1490645935967-10de6ba17061",
  "photo-1473093295043-cdd812d0e601",
  "photo-1482049016688-2d3e1b311543",
  "photo-1505253716362-afaea1d3d1af",
  "photo-1563379926898-05f4575a45d8",
  "photo-1548940740-204726a19be3",
  "photo-1562802378-063ec186a863",
  "photo-1551183053-bf91798d9fe8",
  "photo-1549584526-c2a2e8dde7b0",
  "photo-1547592166-23ac45744acd",
  "photo-1601050690597-df0568f70950",
  "photo-1585937421612-70a008356fbe",
  "photo-1603133872878-684f208fb84b",
  "photo-1596560548464-f010549b84d7",
  "photo-1574484284002-952d92456975",
  "photo-1565958011703-44f9829ba187",
  "photo-1559847844-5315695dadae",
  "photo-1529042410759-befb1204b468",
  "photo-1498837167922-ddd27525d352",
  "photo-1484980972926-edee96e0960d",
  "photo-1571091718767-18b5b1457add",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getPhoto(id: string) {
  return `https://images.unsplash.com/${FOOD_PHOTOS[hashStr(id) % FOOD_PHOTOS.length]}?w=600&q=70`;
}

interface PremiumRecipe {
  id: string;
  title: string;
  description?: string | null;
  source_url?: string | null;
  image_url?: string | null;
  cuisine_type?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
  dietary_tags?: string[] | null;
  difficulty_level?: string | null;
  ingredients?: unknown[];
  instructions?: string[];
}

const CUISINES = [
  "all",
  "Italian", "Asian", "Mexican", "American", "Mediterranean",
  "French", "Indian", "Middle Eastern", "Japanese", "Thai",
];

function isExtracted(r: PremiumRecipe) {
  return (r.instructions ?? []).length >= 2 && (r.ingredients ?? []).length >= 3;
}

function PremiumCard({ recipe: initialRecipe }: { recipe: PremiumRecipe }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);

  const extracted = isExtracted(recipe);
  const ingredients = (recipe.ingredients ?? []) as { name: string; amount?: number | null; unit?: string | null }[];
  const imgSrc = recipe.image_url && !recipe.image_url.includes("1490645935967")
    ? recipe.image_url
    : getPhoto(recipe.id);
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const isPlaceholder = recipe.title === "Premium Recipe";

  async function handleExtract(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setRecipe((prev) => ({ ...prev, ...data.recipe }));
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed");
    }
    setExtracting(false);
  }

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer"
      style={{ borderColor: "#C9A84C", background: "#1E1208", aspectRatio: "3/4" }}
      onClick={() => router.push(`/recipes/${recipe.id}`)}
    >
      {/* Image */}
      <img src={imgSrc} alt={recipe.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />

      {/* Top-left badges */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: "rgba(201,168,76,0.95)", color: "#fff" }}>
          ★ Premium
        </span>
        {recipe.cuisine_type && recipe.cuisine_type !== "Social" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(255,255,255,0.9)", color: "#3D2817" }}>
            {recipe.cuisine_type}
          </span>
        )}
      </div>

      {/* Top-right: original post link */}
      {recipe.source_url && (
        <a
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium"
          style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
        >
          <ExternalLink className="w-3 h-3" /> Post
        </a>
      )}

      {/* Ingredients overlay */}
      {showIngredients && (
        <div
          className="absolute inset-0 overflow-y-auto p-4 z-10"
          style={{ background: "rgba(12,6,2,0.97)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>
              Ingredients
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowIngredients(false); }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {ingredients.map((ing, i) => (
              <p key={i} className="text-xs leading-snug" style={{ color: "#EFE3CE" }}>
                {[ing.amount, ing.unit, ing.name].filter(Boolean).join(" ")}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {/* Extract button (shown when recipe hasn't been extracted yet) */}
        {!extracted && (
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-2.5 rounded-xl text-xs font-bold disabled:opacity-60 transition-opacity"
            style={{ background: "rgba(200,82,42,0.92)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            {extracting
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Extracting…</>
              : <><Sparkles className="w-3 h-3" /> Extract full recipe</>}
          </button>
        )}
        {extractError && (
          <p className="text-xs mb-2 text-center" style={{ color: "#ef4444" }}>{extractError}</p>
        )}

        {/* Title + meta + ingredients button */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1">
              {isPlaceholder ? "Instagram Recipe" : recipe.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {totalTime > 0 && (
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <Clock className="w-3 h-3" />{totalTime}m
                </span>
              )}
              {recipe.calories && (
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <Flame className="w-3 h-3" />{recipe.calories} kcal
                </span>
              )}
            </div>
          </div>
          {/* Ingredients peek button — only shown when extracted */}
          {extracted && ingredients.length > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowIngredients(true); }}
              className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
              style={{ background: "rgba(201,168,76,0.92)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              Ingredients
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PremiumClient({ recipes }: { recipes: PremiumRecipe[] }) {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("all");

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (cuisine !== "all" && r.cuisine_type !== cuisine) return false;
      if (q) {
        const lower = q.toLowerCase();
        if (!r.title.toLowerCase().includes(lower) &&
            !(r.description ?? "").toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [recipes, cuisine, q]);

  const extractedCount = recipes.filter(isExtracted).length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1A1206 0%, #2E1D0A 40%, #3D2817 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-10" aria-hidden>
          <span className="absolute top-8 right-16 text-6xl rotate-12">⭐</span>
          <span className="absolute top-24 right-40 text-4xl -rotate-6">🍽️</span>
          <span className="absolute bottom-8 right-8 text-5xl rotate-6">✨</span>
          <span className="absolute top-6 left-12 text-3xl rotate-3">🌿</span>
          <span className="absolute bottom-10 left-28 text-4xl rotate-8">👨‍🍳</span>
        </div>

        <div className="relative px-6 sm:px-10 py-14 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
            <Star className="w-3 h-3" />
            Curated from Instagram · {recipes.length} recipes
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3 text-white">
            Premium<br />
            <span style={{ color: "#C9A84C" }}>Collection</span>
          </h1>
          <p className="text-base mb-8 max-w-xl" style={{ color: "rgba(255,255,255,0.65)" }}>
            Hand-picked recipes from top food creators. Use AI to unlock full ingredients and step-by-step instructions.
          </p>

          {extractedCount > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
              style={{ background: "rgba(34,197,94,0.15)", color: "#86EFAC", border: "1px solid rgba(34,197,94,0.25)" }}>
              <Sparkles className="w-4 h-4" />
              {extractedCount} recipe{extractedCount !== 1 ? "s" : ""} fully extracted
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-2xl mb-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search premium recipes…"
              className="w-full pl-14 pr-5 py-4 rounded-2xl text-base font-medium focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>

          {/* Cuisine tabs */}
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                style={{
                  background: cuisine === c ? "#C9A84C" : "rgba(255,255,255,0.08)",
                  color: cuisine === c ? "#fff" : "rgba(255,255,255,0.65)",
                  border: cuisine === c ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {c === "all" ? "All Cuisines" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 sm:px-10 py-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium" style={{ color: "#6B5B52" }}>
            {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
            {q && ` matching "${q}"`}
          </p>
          {(q || cuisine !== "all") && (
            <button
              onClick={() => { setQ(""); setCuisine("all"); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ color: "#C9A84C", background: "#FFF9EC" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((r) => <PremiumCard key={r.id} recipe={r} />)}
          </div>
        ) : (
          <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
            <Star className="w-8 h-8 mx-auto mb-3" style={{ color: "#C9A84C", opacity: 0.3 }} />
            <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>No recipes found</p>
            <p className="text-xs" style={{ color: "#6B5B52" }}>Try a different search or cuisine filter</p>
          </div>
        )}

        {/* Info callout */}
        <div className="mt-12 rounded-2xl p-6 flex items-start gap-4"
          style={{ background: "linear-gradient(135deg, #FFF9EC 0%, #FFF3D6 100%)", border: "1.5px solid #E8D4A0" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#C9A84C20" }}>
            <Sparkles className="w-5 h-5" style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: "#3D2817" }}>How premium recipes work</p>
            <p className="text-sm" style={{ color: "#6B5B52" }}>
              Each recipe is sourced from a curated Instagram post. Click any card to view it — if the full recipe hasn{"'"}t been extracted yet,
              you can use the AI button to reconstruct ingredients and step-by-step instructions from the post.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
