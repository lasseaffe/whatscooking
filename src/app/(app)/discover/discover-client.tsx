"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink, UtensilsCrossed, Sparkles, Star, X, Clock, Zap, Loader2, LayoutGrid, List, GalleryHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toggle, ToggleButtonGroup } from "@/components/ui/toggle-group";

const HACK_FALLBACKS = [
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=70",
  "https://images.unsplash.com/photo-1464347744102-11db6282f854?w=600&q=70",
  "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=600&q=70",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=70",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=70",
  "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=70",
];

const PREMIUM_FALLBACKS = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=70",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=70",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=70",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=70",
  "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=70",
  "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=400&q=70",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── HACK MODAL ────────────────────────────────────────────────
function HackModal({ hack: initialHack, onClose }: { hack: HackRow; onClose: () => void }) {
  const [hack, setHack] = useState(initialHack);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function extractHack() {
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch(`/api/recipes/${hack.id}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setHack((prev) => ({ ...prev, ...data.recipe }));
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Something went wrong");
    }
    setExtracting(false);
  }

  const ingredients = (hack.ingredients ?? []) as { name: string; amount?: number | null; unit?: string | null }[];
  const instructions = (hack.instructions ?? []) as string[];
  const totalTime = (hack.prep_time_minutes ?? 0) + (hack.cook_time_minutes ?? 0);
  const hasContent = instructions.length >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(30,18,8,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl"
        style={{ background: "#1C1209" }}>
        {/* Image header */}
        {hack.image_url && (
          <div className="relative h-48 overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
            <img src={hack.image_url} alt={hack.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(30,18,8,0.7) 0%, transparent 60%)" }} />
          </div>
        )}

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.35)" }}>
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#2A1808" }}>
              <Zap className="w-4 h-4" style={{ color: "#C8522A" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "#2A1808", color: "#C8522A" }}>Kitchen Hack</span>
                {totalTime > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#8A6A4A" }}>
                    <Clock className="w-3 h-3" />{totalTime} min
                  </span>
                )}
              </div>
              <h2 className="font-bold text-base leading-snug" style={{ color: "#EFE3CE" }}>{hack.title}</h2>
            </div>
          </div>

          {hack.description && (
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#8A6A4A" }}>{hack.description}</p>
          )}

          {/* If no content yet — show extract button */}
          {!hasContent && (
            <div className="mb-5 p-4 rounded-xl" style={{ background: "#161009", border: "1px solid #3A2416" }}>
              <p className="text-sm mb-3" style={{ color: "#8A6A4A" }}>
                Extract the full technique as step-by-step instructions using AI, so you can use it without leaving the app.
              </p>
              <button onClick={extractHack} disabled={extracting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
                style={{ background: "#C8522A", color: "#fff" }}>
                {extracting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
                  : <><Sparkles className="w-4 h-4" /> Extract full technique</>}
              </button>
              {extractError && <p className="text-xs mt-2" style={{ color: "#C8522A" }}>{extractError}</p>}
            </div>
          )}

          {/* Instructions as hack tips */}
          {instructions.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6B4E36" }}>The Technique</h3>
              <div className="flex flex-col gap-2.5">
                {instructions.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "#2A1808", color: "#C8522A" }}>
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "#EFE3CE" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients if any */}
          {ingredients.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B4E36" }}>You&apos;ll Need</h3>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "#2A1808", color: "#8A6A4A" }}>
                    {ing.amount} {ing.unit} {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source link */}
          {hack.source_url && (
            <a href={hack.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-opacity-80"
              style={{ borderColor: "#3A2416", color: "#8A6A4A", background: "#161009" }}>
              <ExternalLink className="w-4 h-4" />
              Watch original video
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function HackCard({ hack, index, onOpen }: { hack: HackRow; index: number; onOpen: () => void }) {
  const fallback = HACK_FALLBACKS[index % HACK_FALLBACKS.length];
  const [imgSrc, setImgSrc] = useState(hack.image_url || fallback);
  const [failed, setFailed] = useState(false);
  function onErr() {
    if (imgSrc !== fallback) setImgSrc(fallback);
    else setFailed(true);
  }
  return (
    <button type="button" onClick={onOpen}
      className="group rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-md text-left w-full"
      style={{ borderColor: "#3A2416", background: "#1C1209" }}>
      <div className="relative h-28 overflow-hidden">
        {!failed ? (
          <img src={imgSrc} alt={hack.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={onErr} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1A1208 0%, #2A1A0A 100%)" }}>
            <UtensilsCrossed className="w-8 h-8" style={{ color: "#C8522A", opacity: 0.3 }} />
          </div>
        )}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(74,60,30,0.85) 0%, transparent 60%)" }} />
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold"
          style={{ background: "#2A1808", color: "#C8522A" }}>
          HACK
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="text-xs font-semibold text-white group-hover:underline">Tap to learn →</span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: "#EFE3CE" }}>
          {hack.title}
        </p>
        {hack.description && (
          <p className="text-xs mt-1 line-clamp-1" style={{ color: "#6B4E36" }}>
            {hack.description}
          </p>
        )}
      </div>
    </button>
  );
}

// Cuisine-specific Unsplash image seeds for unique thumbnails
const CUISINE_IMAGES: Record<string, string[]> = {
  italian: ["photo-1555396273-367ea4eb4db5", "photo-1621996346565-e3dbc353d2e5", "photo-1474722883778-792e7990302f"],
  french:  ["photo-1414235077428-338989a2e8c0", "photo-1530648672449-81f6c723e2f1", "photo-1517244683847-7456b63c5969"],
  japanese:["photo-1553621042-f6e147245754", "photo-1617196034183-421b4040ed20", "photo-1569050467447-ce54b3bbc37d"],
  mexican: ["photo-1565299585323-38d6b0865b47", "photo-1551504734-5da9ec4ec05b", "photo-1604882406385-b92e8d26f8dc"],
  indian:  ["photo-1596797038530-2c107229654b", "photo-1585937421612-70a008356fbe", "photo-1548943487-a2e4e43b4853"],
  chinese: ["photo-1617093727343-374698b1b08d", "photo-1563245372-f21724e3856d", "photo-1582878826629-29b7ad1cdc43"],
  thai:    ["photo-1569562853014-e04dbdca6d09", "photo-1516684669134-de6f7c473a2a", "photo-1562565652-a0d8f0c59eb4"],
  american:["photo-1568901346375-23c9450c58cd", "photo-1529193591184-b1d58069ecdd", "photo-1571091718767-18b5b1457add"],
};

function getPremiumImage(r: PremiumRow): string {
  if (r.image_url) return r.image_url;
  const cuisine = (r.cuisine_type ?? "").toLowerCase();
  const imgs = CUISINE_IMAGES[cuisine] ?? null;
  if (imgs) {
    const idx = hashStr(r.id) % imgs.length;
    return `https://images.unsplash.com/${imgs[idx]}?w=400&q=70`;
  }
  return PREMIUM_FALLBACKS[hashStr(r.id) % PREMIUM_FALLBACKS.length];
}

function PremiumCard({ r: initialR }: { r: PremiumRow }) {
  const router = useRouter();
  const [r, setR] = useState(initialR);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);

  const isStub = !r.title || r.title === "Premium Recipe";
  const bestImg = getPremiumImage(r);
  const [imgSrc, setImgSrc] = useState(bestImg);
  const [failed, setFailed] = useState(false);
  const fallback = PREMIUM_FALLBACKS[hashStr(r.id) % PREMIUM_FALLBACKS.length];
  function onErr() {
    if (imgSrc !== fallback) setImgSrc(fallback);
    else setFailed(true);
  }
  const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
  const ingredients = (r.ingredients ?? []) as { name: string; amount?: number | null; unit?: string | null }[];
  const hasInstructions = (r.instructions ?? []).length >= 2;
  const extracted = ingredients.length >= 3 && hasInstructions;

  async function handleExtract(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch(`/api/recipes/${r.id}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setR((prev) => ({ ...prev, ...data.recipe }));
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed");
    }
    setExtracting(false);
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: "#1E1208", aspectRatio: "3/4" }}
      onClick={() => router.push(`/recipes/${r.id}`)}
    >
      {!failed ? (
        <img src={imgSrc} alt={isStub ? "Premium recipe" : (r.title ?? "Premium recipe")}
          className="absolute inset-0 w-full h-full object-cover opacity-75 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
          onError={onErr} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2C1E0F 0%, #4A3020 100%)" }}>
          <UtensilsCrossed className="w-8 h-8" style={{ color: "#E8C870", opacity: 0.3 }} />
        </div>
      )}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(18,10,4,0.95) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }} />

      {/* Top-left badge */}
      {r.cuisine_type && !isStub ? (
        <div className="absolute top-2 left-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
            style={{ background: "rgba(232,200,112,0.2)", color: "#E8C870", border: "1px solid rgba(232,200,112,0.3)" }}>
            {r.cuisine_type}
          </span>
        </div>
      ) : isStub ? (
        <div className="absolute top-2 left-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
            style={{ background: "rgba(200,160,48,0.25)", color: "#E8C870", border: "1px solid rgba(200,160,48,0.3)" }}>
            ✦ Tap to reveal
          </span>
        </div>
      ) : null}

      {/* Top-right: original post link */}
      {r.source_url && (
        <a
          href={r.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
        >
          <ExternalLink className="w-3 h-3" /> Post
        </a>
      )}

      {/* Ingredients overlay */}
      {showIngredients && (
        <div
          className="absolute inset-0 overflow-y-auto p-3 z-10"
          style={{ background: "rgba(12,6,2,0.97)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#E8C870" }}>
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
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        {/* Extract button */}
        {!extracted && (
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 mb-2 rounded-xl text-xs font-bold disabled:opacity-60"
            style={{ background: "rgba(200,82,42,0.9)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            {extracting
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Extracting…</>
              : <><Sparkles className="w-3 h-3" /> Extract recipe</>}
          </button>
        )}
        {extractError && <p className="text-xs mb-1 text-center" style={{ color: "#ef4444" }}>{extractError}</p>}

        {isStub ? (
          <p className="text-white/50 text-xs italic leading-snug mb-1 drop-shadow">
            Instagram recipe — tap to generate full details
          </p>
        ) : (
          <p className="text-white text-xs font-semibold leading-snug line-clamp-2 mb-1 drop-shadow">
            {r.title}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {totalTime > 0 && !isStub && (
              <span className="text-xs flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Clock className="w-3 h-3" />{totalTime}m
              </span>
            )}
            {r.calories && !isStub && (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{r.calories} kcal</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {extracted && ingredients.length > 0 && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowIngredients(true); }}
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(232,200,112,0.85)", color: "#1A1208" }}
              >
                Ingredients
              </button>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(212,160,48,0.85)", color: "#fff" }}>
              ★ Premium
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { RecipeCard } from "@/components/recipe-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { FilterBar, DietFilterBar, DifficultyFilterBar } from "@/components/filter-bar";
import { SeasonalFilter, type SeasonalState } from "@/components/seasonal-filter";
import { SuggestionPanel } from "@/components/suggestion-panel";
import { isSeasonalRecipe } from "@/lib/seasonal";
import { CUISINES, CUISINE_REGIONS, getCuisineBySlug } from "@/lib/cuisines";
import type { Recipe } from "@/lib/types";
import { Globe2, SlidersHorizontal } from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";

function flagEmoji(code: string): string {
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}

type R = Recipe & { source_name?: string; source_url?: string; is_premium?: boolean; is_hack?: boolean };

interface HackRow {
  id: string; title: string; description: string | null; source_url: string | null; image_url: string | null;
  ingredients?: { name: string; amount?: number | null; unit?: string | null }[] | null;
  instructions?: string[] | null;
  prep_time_minutes?: number | null; cook_time_minutes?: number | null;
}
interface PremiumRow {
  id: string; title: string; description: string | null; source_url: string | null; image_url: string | null;
  cuisine_type: string | null; prep_time_minutes: number | null; cook_time_minutes: number | null;
  calories: number | null; dietary_tags: string[] | null; dish_types: string[] | null;
  ingredients?: { name: string; amount?: number | null; unit?: string | null }[] | null;
  instructions?: string[] | null;
}

interface Props {
  initialRecipes: R[];
  hacks: HackRow[];
  premiumRecipes: PremiumRow[];
  initialQ: string;
  initialType: string;
  initialDiet: string;
  pantryNames: string[];
}

function pantryMatchPct(recipe: R, pantryNames: string[]): number {
  if (!pantryNames.length) return 0;
  const ings = ((recipe as R & { ingredients?: { name: string }[] | null }).ingredients ?? []);
  if (!ings.length) return 0;
  const matched = ings.filter((ing) =>
    pantryNames.some((p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase()))
  ).length;
  return Math.round((matched / ings.length) * 100);
}

export function DiscoverClient({ initialRecipes, hacks, premiumRecipes, initialQ, initialType, initialDiet, pantryNames }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState(initialType || "all");
  const [dietFilters, setDietFilters] = useState<string[]>(initialDiet ? [initialDiet] : []);
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [showHacks, setShowHacks] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [selectedHack, setSelectedHack] = useState<HackRow | null>(null);
  const [seasonal, setSeasonal] = useState<SeasonalState>({ active: false, produce: [], label: "" });
  const [seasonalKey, setSeasonalKey] = useState(0);
  const [showCuisines, setShowCuisines] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [pantryFirst, setPantryFirst] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "gallery">("grid");
  const recipesRef = useRef<HTMLElement>(null);

  // Restore persisted preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("wc-view-mode") as "grid" | "list" | "gallery" | null;
    if (saved) setViewMode(saved);
  }, []);

  function handleViewMode(val: Set<React.Key>) {
    const next = [...val][0] as "grid" | "list" | "gallery";
    if (next) {
      setViewMode(next);
      localStorage.setItem("wc-view-mode", next);
    }
  }
  const { restrictions: globalRestrictions, customAvoid } = useDietaryMode();

  const hasFilters = q.length > 0 || type !== "all" || dietFilters.length > 0 || seasonal.active || cuisineFilter !== "all" || customAvoid.length > 0 || difficultyFilter !== null || pantryFirst;

  // Deterministic daily random premium recipe (same for everyone, changes at midnight)
  const dailyPremium = useMemo(() => {
    // Only pick fully-extracted recipes (with a real title) for Today's Pick
    const extracted = premiumRecipes.filter(r => r.title && r.title !== "Premium Recipe");
    if (!extracted.length) return null;
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return extracted[seed % extracted.length];
  }, [premiumRecipes]);

  const filteredPremium = useMemo(() => {
    if (!hasFilters) return premiumRecipes;
    return premiumRecipes.filter((r) => {
      const dishTypes = r.dish_types ?? [];
      if (q && !r.title.toLowerCase().includes(q.toLowerCase()) &&
          !(r.description ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "all" && !dishTypes.includes(type)) return false;
      if (dietFilters.length > 0) {
        const tags = r.dietary_tags ?? [];
        if (!dietFilters.every((d) => tags.includes(d))) return false;
      }
      return true;
    });
  }, [premiumRecipes, q, type, dietFilters, hasFilters]);

  const filtered = useMemo(() => {
    // Deduplicate by title first
    const seen = new Set<string>();
    return initialRecipes.filter((r) => {
      const key = r.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);

      const dishTypes = r.dish_types ?? [];
      // Exclude hacks, premium, and drinks — each has its own dedicated page
      if (dishTypes.includes("hack") || dishTypes.includes("premium") || dishTypes.includes("drink")) return false;
      if (q && !r.title.toLowerCase().includes(q.toLowerCase()) &&
          !(r.description ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "all" && !dishTypes.includes(type)) return false;
      // Dietary FILTER — only dietFilters (from filter bar) hide recipes.
      // globalRestrictions (Adapt Meals mode) never hides recipes — it only swaps ingredients in recipe view.
      if (dietFilters.length > 0) {
        const tags = r.dietary_tags ?? [];
        if (!dietFilters.every((d) => tags.includes(d))) return false;
      }
      if (customAvoid.length > 0) {
        const ingNames = ((r as R & { ingredients?: { name: string }[] | null }).ingredients ?? []).map((i) => i.name.toLowerCase());
        if (customAvoid.some((avoid) => ingNames.some((ing) => ing.includes(avoid)))) return false;
      }
      if (difficultyFilter !== null) {
        if ((r as R & { difficulty_level?: string | null }).difficulty_level !== difficultyFilter) return false;
      }
      if (cuisineFilter !== "all") {
        const info = getCuisineBySlug(cuisineFilter);
        if (info && r.cuisine_type) {
          const lower = r.cuisine_type.toLowerCase();
          if (!info.dbValues.some((v) => v.toLowerCase() === lower)) return false;
        } else if (!r.cuisine_type) {
          return false;
        }
      }
      if (seasonal.active && seasonal.produce.length > 0) {
        if (!isSeasonalRecipe(r, seasonal.produce)) return false;
      }
      if (pantryFirst && pantryNames.length > 0) {
        if (pantryMatchPct(r, pantryNames) < 40) return false;
      }
      return true;
    });
  }, [initialRecipes, q, type, dietFilters, cuisineFilter, seasonal, customAvoid, difficultyFilter, pantryFirst, pantryNames]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hack modal */}
      {selectedHack && <HackModal hack={selectedHack} onClose={() => setSelectedHack(null)} />}

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div className="wc-zone-hero relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
          <span className="absolute top-6 right-12 opacity-5 rotate-12" style={{ fontSize: "3.5rem" }}>🍕</span>
          <span className="absolute top-20 right-36 opacity-5 -rotate-6" style={{ fontSize: "2.5rem" }}>🥑</span>
          <span className="absolute bottom-10 right-8 opacity-5 rotate-6" style={{ fontSize: "3rem" }}>🍊</span>
          <span className="absolute top-4 left-8 opacity-5 rotate-3" style={{ fontSize: "2.5rem" }}>🍜</span>
        </div>

        <div className="relative px-6 sm:px-10 py-14 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "#2A1808", color: "#C8522A", border: "1px solid #C8522A30" }}>
            <Sparkles className="w-3 h-3" />
            Curated from NYT Cooking · Serious Eats · Bon Appétit · AllRecipes · TikTok
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Find Your Next<br />
            <span style={{ color: "#C8522A" }}>Favourite Dish</span>
          </h1>
          <p className="text-base mb-8 max-w-xl" style={{ color: "#8A6A4A" }}>
            Every recipe links to its original source. No paywalls, no nonsense —
            just the best food from the internet in one place.
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#6B4E36" }} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes, ingredients, cuisines…"
              className="w-full pl-14 pr-5 py-4 rounded-2xl text-base font-medium focus:outline-none"
              style={{ background: "#1C1209", color: "#EFE3CE", border: "1.5px solid #3A2416" }}
            />
          </div>

          {/* ── Single horizontal filter row + More Filters ── */}
          <div className="mt-5">
            <div className="flex items-center gap-2">
              {/* Cuisine scroll row with fade mask */}
              <div className="cuisine-scroll-row-wrapper flex-1 min-w-0">
                <div className="cuisine-scroll-row">
                  {/* Dish type pills */}
                  {[
                    { value: "all", label: "All" },
                    { value: "main course", label: "🍽 Mains" },
                    { value: "pasta", label: "🍝 Pasta" },
                    { value: "soup", label: "🍲 Soups" },
                    { value: "salad", label: "🥬 Salads" },
                    { value: "breakfast", label: "🍳 Breakfast" },
                    { value: "dessert", label: "🍰 Desserts" },
                    { value: "snack", label: "🍿 Snacks" },
                    { value: "curry", label: "🍛 Curry" },
                    { value: "pizza", label: "🍕 Pizza" },
                    { value: "burger", label: "🍔 Burgers" },
                  ].map((f) => {
                    const on = type === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setType(f.value)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border"
                        style={{
                          borderColor: on ? "#C8522A" : "#3A2416",
                          background: on ? "#C8522A" : "#1C1209",
                          color: on ? "#fff" : "#8A6A4A",
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* More Filters button */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                style={{
                  borderColor: (dietFilters.length > 0 || difficultyFilter || seasonal.active || pantryFirst) ? "#C8522A" : "#3A2416",
                  background: (dietFilters.length > 0 || difficultyFilter || seasonal.active || pantryFirst) ? "rgba(200,82,42,0.15)" : "#1C1209",
                  color: (dietFilters.length > 0 || difficultyFilter || seasonal.active || pantryFirst) ? "#C8522A" : "#8A6A4A",
                }}
              >
                <SlidersHorizontal style={{ width: 12, height: 12 }} />
                More Filters
                {(dietFilters.length + (difficultyFilter ? 1 : 0) + (seasonal.active ? 1 : 0) + (pantryFirst ? 1 : 0)) > 0 && (
                  <span className="ml-0.5 font-bold">
                    ({dietFilters.length + (difficultyFilter ? 1 : 0) + (seasonal.active ? 1 : 0) + (pantryFirst ? 1 : 0)})
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Filter Drawer Overlay + Panel ── */}
          {showFilterDrawer && (
            <>
              <div className="filter-drawer-overlay" onClick={() => setShowFilterDrawer(false)} />
              <div className="filter-drawer-panel">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                    Filters
                  </h3>
                  <button
                    onClick={() => setShowFilterDrawer(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ background: "rgba(42,24,8,0.6)" }}
                  >
                    <X className="w-4 h-4" style={{ color: "#8A6A4A" }} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Difficulty */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6B4E36" }}>Difficulty</p>
                    <DifficultyFilterBar active={difficultyFilter} onChange={setDifficultyFilter} />
                  </div>

                  {/* Dietary */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B4E36" }}>Dietary</p>
                      {dietFilters.length > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(30,80,200,0.2)", color: "#93C5FD" }}>
                          {dietFilters.length} active
                        </span>
                      )}
                    </div>
                    <DietFilterBar active={dietFilters} onChange={setDietFilters} />
                  </div>

                  {/* Seasonal */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6B4E36" }}>Seasonal</p>
                    <SeasonalFilter key={seasonalKey} onChange={setSeasonal} />
                  </div>

                  {/* Pantry-First */}
                  {pantryNames.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6B4E36" }}>Pantry</p>
                      <button
                        onClick={() => setPantryFirst(v => !v)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full"
                        style={{
                          background: pantryFirst ? "#828E6F" : "#1C1209",
                          color: pantryFirst ? "#fff" : "#828E6F",
                          border: "1.5px solid #828E6F",
                        }}
                      >
                        Pantry-First {pantryFirst ? "ON" : "OFF"}
                        <span className="text-xs opacity-75">— show only recipes you can mostly make</span>
                      </button>
                    </div>
                  )}

                  {/* Apply / Clear */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setDietFilters([]); setDifficultyFilter(null); setPantryFirst(false); setSeasonalKey(k => k + 1); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                      style={{ borderColor: "#3A2416", color: "#8A6A4A", background: "#1C1209" }}
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilterDrawer(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                      style={{ background: "#C8522A", color: "#fff" }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TODAY'S PICK (Daily Random Premium) ─────────────────── */}
      {!hasFilters && dailyPremium && (
        <ScrollReveal>
        <section className="wc-zone-featured px-6 sm:px-10 pb-2 max-w-5xl mx-auto w-full">
          <div className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{ background: "#1C1209", border: "1px solid #C8A87040" }}>
            <div className="flex flex-col sm:flex-row items-stretch">
              <Link href={`/recipes/${dailyPremium.id}`} className="sm:w-52 h-44 sm:h-auto shrink-0 overflow-hidden relative block">
                {dailyPremium.image_url ? (
                  <img src={dailyPremium.image_url} alt={dailyPremium.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ filter: "brightness(0.88) saturate(0.9)" }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "#241809" }}>⭐</div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.5) 0%, transparent 60%)" }} />
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(212,160,48,0.9)", color: "#fff" }}>
                    ⭐ Today&apos;s Pick
                  </span>
                </div>
              </Link>
              <div className="flex-1 px-6 py-5 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "#8A6A4A" }}>Refreshes daily · Premium Recipe</p>
                  <Link href={`/recipes/${dailyPremium.id}`}>
                    <h3 className="font-bold text-xl leading-snug mb-2 hover:underline" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                      {dailyPremium.title}
                    </h3>
                  </Link>
                  {dailyPremium.description && (
                    <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: "#8A6A4A" }}>{dailyPremium.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Link href={`/recipes/${dailyPremium.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background: "#C8A030", color: "#fff" }}>
                    View Full Recipe →
                  </Link>
                  {dailyPremium.source_url && (
                    <a href={dailyPremium.source_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                      style={{ color: "#8A6A4A" }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Original source
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── KITCHEN HACKS (collapsed by default) ────────────────── */}
      {!hasFilters && hacks.length > 0 && (
        <ScrollReveal delay={80}>
        <section className="wc-zone-secondary px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
          <button
            onClick={() => setShowHacks((v) => !v)}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all"
            style={{ background: "#1C1209", border: "1.5px solid #3A2416" }}
          >
            <span className="text-xl">⚡</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base" style={{ color: "#EFE3CE" }}>Kitchen Hacks</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "#2A1808", color: "#C8522A" }}>
                  {hacks.length} tips
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
                Viral techniques that actually change how you cook
              </p>
            </div>
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#2A1808" }}>
              {showHacks
                ? <ChevronUp className="w-4 h-4" style={{ color: "#C8522A" }} />
                : <ChevronDown className="w-4 h-4" style={{ color: "#C8522A" }} />}
            </div>
          </button>

          {showHacks && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hacks.map((hack, i) => (
                <HackCard key={hack.id} hack={hack} index={i} onOpen={() => setSelectedHack(hack)} />
              ))}
            </div>
          )}
        </section>
        </ScrollReveal>
      )}

      {/* ── PREMIUM INSTAGRAM RECIPES ───────────────────────────── */}
      {filteredPremium.length > 0 && (
        <ScrollReveal delay={120}>
        <section className="wc-zone-trending px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
          <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #C8A87040" }}>
            <button
              onClick={() => setShowPremium((v) => !v)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
              style={{ background: "#1C1209" }}
            >
              <Star className="w-5 h-5 shrink-0" style={{ color: "#C8A030" }} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base" style={{ color: "#EFE3CE" }}>Premium Instagram Recipes</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#2A1A08", color: "#C8A030", border: "1px solid #C8A03030" }}>
                    {filteredPremium.length} posts
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
                  {hasFilters ? "Premium recipes matching your filters" : "Hand-picked from the best food creators on Instagram"}
                </p>
              </div>
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#2A1A08" }}>
                {showPremium
                  ? <ChevronUp className="w-4 h-4" style={{ color: "#C8A030" }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: "#C8A030" }} />}
              </div>
            </button>

            {(showPremium || hasFilters) && (
              <div className="px-5 pb-5 pt-3" style={{ background: "#161009" }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {filteredPremium.slice(0, hasFilters ? 50 : 16).map((r) => (
                    <PremiumCard key={r.id} r={r} />
                  ))}
                </div>
                {!hasFilters && filteredPremium.length > 16 && (
                  <p className="text-center text-xs mb-3" style={{ color: "#6B4E36" }}>
                    Showing 16 of {filteredPremium.length} premium recipes
                  </p>
                )}
                {!hasFilters && (
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => setShowPremium(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium"
                      style={{ background: "#1C1209", color: "#8A6A4A", border: "1px solid #3A2416" }}>
                      Collapse
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── FOR YOU — personalised suggestions ─────────────────── */}
      {!hasFilters && (
        <SuggestionPanel allRecipes={initialRecipes} />
      )}

      {/* ── WORLD CUISINES ──────────────────────────────────────── */}
      <ScrollReveal>
      <section className="px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
        <button
          onClick={() => setShowCuisines(v => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all"
          style={{ background: "#1C1209", border: "1.5px solid #3A2416" }}
        >
          <Globe2 className="w-5 h-5 shrink-0" style={{ color: "#828E6F" }} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base" style={{ color: "#EFE3CE" }}>World Cuisines</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#1A2010", color: "#828E6F", border: "1px solid #828E6F30" }}>
                {CUISINES.length} cuisines
              </span>
              {cuisineFilter !== "all" && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#828E6F", color: "#fff" }}>
                  {getCuisineBySlug(cuisineFilter)?.name} selected
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
              Filter recipes by cuisine — from Moroccan tagines to Japanese ramen
            </p>
          </div>
          <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#1A2010" }}>
            {showCuisines
              ? <ChevronUp className="w-4 h-4" style={{ color: "#828E6F" }} />
              : <ChevronDown className="w-4 h-4" style={{ color: "#828E6F" }} />}
          </div>
        </button>

        {showCuisines && (
          <div className="mt-4">
            {cuisineFilter !== "all" && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#EFE3CE" }}>
                  Showing {getCuisineBySlug(cuisineFilter)?.name} recipes
                </span>
                <button
                  onClick={() => setCuisineFilter("all")}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#2A1808", color: "#C8522A" }}
                >
                  Clear
                </button>
              </div>
            )}
            {CUISINE_REGIONS.map(region => (
              <div key={region} className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: "#A69180" }}>
                  {region}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {CUISINES.filter(c => c.region === region).map(cuisine => {
                    const isActive = cuisineFilter === cuisine.slug;
                    return (
                      <button
                        key={cuisine.slug}
                        onClick={() => {
                          setCuisineFilter(isActive ? "all" : cuisine.slug);
                          if (!isActive) {
                            setTimeout(() => recipesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                          }
                        }}
                        className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg text-left shrink-0 flex flex-col"
                        style={{
                          width: 160,
                          border: isActive ? `2px solid ${cuisine.color}` : "1px solid #3A2416",
                          background: isActive ? "#1C1209" : "#1C1209",
                          boxShadow: isActive ? `0 0 0 3px ${cuisine.color}25` : undefined,
                        }}
                      >
                        <div className="relative overflow-hidden" style={{ height: 112 }}>
                          <img src={cuisine.heroImage} alt={cuisine.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />
                          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
                            <div className="flex items-end justify-between gap-1">
                              <h3 className="text-white font-bold text-sm leading-tight drop-shadow-sm">{cuisine.name}</h3>
                              <span className="text-base shrink-0">{flagEmoji(cuisine.flag)}</span>
                            </div>
                          </div>
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cuisine.color }} />
                        </div>
                        <div className="px-2.5 py-2 flex flex-col flex-1">
                          <p className="text-xs font-medium italic mb-1.5 line-clamp-1" style={{ color: cuisine.color }}>
                            &ldquo;{cuisine.tagline}&rdquo;
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {cuisine.keyDishes.slice(0, 2).map(dish => (
                              <span key={dish} className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(255,255,255,0.07)", color: cuisine.color, fontSize: "10px" }}>
                                {dish}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </ScrollReveal>

      {/* ── TRAVEL PLANNER AD ───────────────────────────────────── */}
      <ScrollReveal delay={60}>
      <section className="px-6 sm:px-10 pb-2 max-w-5xl mx-auto w-full">
        <Link href="/menu-scanner"
          className="group flex items-stretch gap-0 rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ border: "1.5px solid #3A2416", background: "linear-gradient(120deg, #1C1209 0%, #241A0D 100%)" }}>
          {/* Left: image strip */}
          <div className="hidden sm:flex flex-col shrink-0 overflow-hidden" style={{ width: 120 }}>
            <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=240&q=70)" }} />
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #C8522A, #828E6F)" }} />
            <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1553621042-f6e147245754?w=240&q=70)" }} />
          </div>
          <div className="flex-1 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-black tracking-tight" style={{ color: "#EFE3CE" }}>✈️ Travel × What&apos;s Cooking</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#C8522A", color: "#fff" }}>NEW</span>
            </div>
            <h3 className="text-base font-bold mb-1.5 leading-snug" style={{ color: "#EFE3CE" }}>
              Ate something amazing abroad?<br />
              <span style={{ color: "#C8522A" }}>Find the recipe.</span>
            </h3>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#8A6A4A" }}>
              Scan any restaurant menu online — we translate non-western menus (Japanese, Arabic, Thai…),
              identify dishes by description, and import them straight into your recipe collection.
            </p>
            <div className="flex flex-wrap gap-2">
              {["🍣 Translate menus", "🔍 Identify unknown dishes", "📥 Import to What's Cooking"].map(f => (
                <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#2A1808", color: "#8A6A4A" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center px-4 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
              style={{ background: "#C8522A" }}>
              <svg className="w-4 h-4 text-white fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </Link>
      </section>
      </ScrollReveal>

      {/* ── ALL RECIPES GRID ────────────────────────────────────── */}
      <section ref={recipesRef} className="px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#EFE3CE" }}>
              {cuisineFilter !== "all"
                ? `${getCuisineBySlug(cuisineFilter)?.flag} ${getCuisineBySlug(cuisineFilter)?.name} Recipes`
                : "🍽️ All Recipes"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#6B4E36" }}>
              {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
              {hasFilters && " matching your filters"}
              {seasonal.active && seasonal.label && (
                <span className="block text-xs mt-0.5" style={{ color: "#828E6F" }}>
                  🌱 {seasonal.label}
                </span>
              )}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setQ(""); setType("all"); setDietFilters([]); setCuisineFilter("all"); setDifficultyFilter(null); setPantryFirst(false); setSeasonalKey(k => k + 1); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ color: "#C8522A", background: "#2A1808" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <>
            {/* View toggle */}
            <div className="flex justify-end mb-3">
              <ToggleButtonGroup
                selectionMode="single"
                selectedKeys={new Set([viewMode])}
                onSelectionChange={handleViewMode}
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: "var(--wc-surface-2, #3A3430)", background: "var(--wc-surface-1, #2C2724)" }}
              >
                <Toggle id="grid" size="sm" aria-label="Grid view">
                  <LayoutGrid className="w-4 h-4" />
                </Toggle>
                <Toggle id="list" size="sm" aria-label="List view">
                  <List className="w-4 h-4" />
                </Toggle>
                <Toggle id="gallery" size="sm" aria-label="Gallery view">
                  <GalleryHorizontal className="w-4 h-4" />
                </Toggle>
              </ToggleButtonGroup>
            </div>

            {viewMode === "grid" && (
              <ScrollReveal group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((recipe) => {
                  const pct = pantryNames.length > 0 ? pantryMatchPct(recipe, pantryNames) : 0;
                  return (
                    <div key={recipe.id} className="relative">
                      <RecipeCard recipe={recipe} />
                      {pct > 0 && (
                        <div className="absolute top-2 right-2 pointer-events-none">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full shadow"
                            style={{
                              background: pct >= 80 ? "#828E6F" : pct >= 50 ? "#B8A060" : "#D4C9BA",
                              color: "#fff",
                              fontSize: 10,
                            }}
                          >
                            🥬 {pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </ScrollReveal>
            )}

            {viewMode === "list" && (
              <div className="flex flex-col gap-3">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                    className="flex gap-4 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.005]"
                    style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid var(--wc-surface-2, #3A3430)" }}
                  >
                    <div className="w-28 h-24 shrink-0 overflow-hidden">
                      <img
                        src={recipe.image_url ?? "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=200&q=80"}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-1 py-3 pr-4">
                      <p className="font-semibold text-sm leading-tight" style={{ color: "var(--fg-primary, #EFE3CE)" }}>{recipe.title}</p>
                      {recipe.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "rgba(239,227,206,0.55)" }}>{recipe.description}</p>
                      )}
                      {((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)) > 0 && (
                        <span className="text-xs" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
                          {(recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)} min
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "gallery" && (
              <div className="columns-2 gap-4 space-y-4">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                    className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer relative"
                    style={{ border: "1px solid var(--wc-surface-2, #3A3430)" }}
                  >
                    <img
                      src={recipe.image_url ?? "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=600&q=80"}
                      alt={recipe.title}
                      className="w-full object-cover"
                      style={{ maxHeight: "320px", minHeight: "140px" }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
                    >
                      <p className="text-sm font-semibold leading-tight" style={{ color: "#fff" }}>{recipe.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "#3A2416", borderStyle: "dashed" }}>
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-3" style={{ color: "#C8522A", opacity: 0.3 }} />
            <p className="text-sm font-medium mb-1" style={{ color: "#EFE3CE" }}>No recipes found</p>
            <p className="text-xs mb-4" style={{ color: "#8A6A4A" }}>
              {initialRecipes.length === 0
                ? "Run supabase/more_recipes.sql to populate the recipe database."
                : "Try adjusting your search or filters."}
            </p>
            <button
              onClick={() => { setQ(""); setType("all"); setDietFilters([]); setCuisineFilter("all"); setDifficultyFilter(null); setPantryFirst(false); setSeasonalKey(k => k + 1); }}
              className="text-sm font-semibold px-5 py-2 rounded-xl"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
