"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, Search, Globe, FileText, Loader2, Check, Plus, ExternalLink,
  AlertCircle, Flame, ChefHat, Leaf, Filter,
} from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { DIETARY_LABELS } from "@/lib/dietary-substitutions";

type Dish = {
  originalName: string;
  englishName: string;
  category: string;
  description: string;
  price: string | null;
  dietaryTags: string[];
  allergens: string[];
  spiceLevel: string;
  confidence: string;
};

type ScanResult = {
  restaurant: { name: string; cuisine: string; location: string | null };
  dishes: Dish[];
  translationNote: string | null;
};

type ImportState = "idle" | "loading" | "done" | "error";

const CATEGORY_ICONS: Record<string, string> = {
  starter: "🥗",
  main: "🍽️",
  dessert: "🍰",
  drink: "🥤",
  side: "🥘",
  snack: "🍟",
  other: "🍴",
};

const SPICE_ICONS: Record<string, string> = {
  none: "",
  mild: "🌶️",
  medium: "🌶️🌶️",
  hot: "🌶️🌶️🌶️",
  very_hot: "🌶️🌶️🌶️🌶️",
};

export function MenuScannerClient() {
  const { restrictions } = useDietaryMode();

  const [mode, setMode] = useState<"name" | "url" | "paste">("name");
  const [restaurantName, setRestaurantName] = useState("");
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const [filterQuery, setFilterQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDiet, setFilterDiet] = useState<string[]>([]);

  const [importStates, setImportStates] = useState<Record<string, ImportState>>({});
  const [importedIds, setImportedIds] = useState<Record<string, string>>({});

  async function handleScan() {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/menu-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim() || undefined,
          url: mode === "url" ? url.trim() || undefined : undefined,
          menuText: mode === "paste" ? pastedText.trim() || undefined : undefined,
          dietaryFilters: restrictions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data as ScanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setScanning(false);
  }

  async function handleImport(dish: Dish) {
    const key = dish.originalName;
    setImportStates((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const res = await fetch("/api/menu-scanner/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dish,
          restaurantName: result?.restaurant.name,
          cuisineType: result?.restaurant.cuisine,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportStates((prev) => ({ ...prev, [key]: "done" }));
      setImportedIds((prev) => ({ ...prev, [key]: data.recipe.id }));
    } catch {
      setImportStates((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  const canScan =
    (mode === "name" && restaurantName.trim().length > 1) ||
    (mode === "url" && url.trim().length > 5) ||
    (mode === "paste" && pastedText.trim().length > 20);

  const filteredDishes = (result?.dishes ?? []).filter((d) => {
    if (filterQuery && !d.englishName.toLowerCase().includes(filterQuery.toLowerCase()) &&
      !d.description.toLowerCase().includes(filterQuery.toLowerCase())) return false;
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (filterDiet.length > 0 && !filterDiet.every((f) => d.dietaryTags.includes(f))) return false;
    return true;
  });

  const categories = [...new Set((result?.dishes ?? []).map((d) => d.category))];

  return (
    <div className="min-h-screen" style={{ background: "#FFFBF7" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "#F0E8DC", background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <Link href="/discover" className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "#A69180" }}>
            <ChevronLeft className="w-4 h-4" /> Discover
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #2C4A8C, #1A6B9A)" }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#3D2817" }}>Restaurant Menu Scanner</h1>
              <p className="text-sm" style={{ color: "#A69180" }}>
                Translate menus, identify dishes, import to your collection
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Input modes */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            {(["name", "url", "paste"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: mode === m ? "#2C4A8C" : "#F0E8DC",
                  color: mode === m ? "#fff" : "#6B5B52",
                }}>
                {m === "name" && <Search className="w-3.5 h-3.5" />}
                {m === "url" && <Globe className="w-3.5 h-3.5" />}
                {m === "paste" && <FileText className="w-3.5 h-3.5" />}
                {m === "name" ? "Restaurant Name" : m === "url" ? "Menu URL" : "Paste Menu Text"}
              </button>
            ))}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #E8D4BA" }}>
            {/* Restaurant name (always shown) */}
            <div className="mb-3">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#6B5B52" }}>
                Restaurant Name {mode !== "name" && <span style={{ color: "#A69180" }}>(optional)</span>}
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Sushi Saito, Tokyo"
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: "#FAF7F2", border: "1.5px solid #E8D4BA", color: "#3D2817" }}
              />
            </div>

            {mode === "url" && (
              <div className="mb-3">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#6B5B52" }}>Menu URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://restaurant.com/menu"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm font-mono"
                  style={{ background: "#FAF7F2", border: "1.5px solid #E8D4BA", color: "#3D2817" }}
                />
                <p className="text-xs mt-1.5" style={{ color: "#A69180" }}>
                  We&apos;ll fetch and parse the page — works best on simple menu pages
                </p>
              </div>
            )}

            {mode === "paste" && (
              <div className="mb-3">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#6B5B52" }}>
                  Paste Menu Text
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={6}
                  placeholder={"Paste menu text here — any language works!\n\nラーメン ¥800\nとんこつラーメン ¥950\nチャーシュー丼 ¥700"}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none font-mono"
                  style={{ background: "#FAF7F2", border: "1.5px solid #E8D4BA", color: "#3D2817" }}
                />
                <p className="text-xs mt-1.5" style={{ color: "#A69180" }}>
                  Works with Japanese, Arabic, Chinese, Thai, Korean and more
                </p>
              </div>
            )}

            {/* Active dietary restrictions note */}
            {restrictions.length > 0 && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                <Leaf className="w-3.5 h-3.5 shrink-0" style={{ color: "#16A34A" }} />
                <span className="text-xs" style={{ color: "#16A34A" }}>
                  Dietary filters active: {restrictions.map((r) => DIETARY_LABELS[r]).join(", ")} — dishes will be flagged
                </span>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={!canScan || scanning}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #2C4A8C, #1A6B9A)" }}
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning &amp; Translating…
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Scan Menu
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>Scan failed</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B1C1C" }}>{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Restaurant info */}
            <div className="mb-6 rounded-2xl p-4" style={{ background: "#EEF2FA", border: "1px solid #C4CEE8" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#2C4A8C" }}>
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base leading-tight" style={{ color: "#1A2F5A" }}>{result.restaurant.name}</h2>
                  <p className="text-sm" style={{ color: "#4A6090" }}>
                    {result.restaurant.cuisine}
                    {result.restaurant.location ? ` · ${result.restaurant.location}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: "#2C4A8C", color: "#fff" }}>
                  {result.dishes.length} dishes
                </span>
              </div>
              {result.translationNote && (
                <p className="text-xs mt-3 px-1" style={{ color: "#4A6090" }}>
                  ℹ️ {result.translationNote}
                </p>
              )}
            </div>

            {/* Filters */}
            <div className="mb-5 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#A69180" }} />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search dishes…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "#fff", border: "1.5px solid #E8D4BA", color: "#3D2817" }}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: "#A69180" }} />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "#fff", border: "1.5px solid #E8D4BA", color: "#6B5B52" }}
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {(["vegan", "vegetarian", "gluten-free", "halal", "kosher"] as const).map((diet) => (
                <button key={diet}
                  onClick={() => setFilterDiet((prev) =>
                    prev.includes(diet) ? prev.filter((x) => x !== diet) : [...prev, diet]
                  )}
                  className="text-xs px-2.5 py-2 rounded-xl font-medium transition-all"
                  style={{
                    background: filterDiet.includes(diet) ? "#2C4A8C" : "#F0E8DC",
                    color: filterDiet.includes(diet) ? "#fff" : "#6B5B52",
                  }}>
                  {DIETARY_LABELS[diet]}
                </button>
              ))}
            </div>

            <p className="text-xs mb-4" style={{ color: "#A69180" }}>
              {filteredDishes.length} of {result.dishes.length} dishes shown
            </p>

            {/* Dish grid */}
            <div className="flex flex-col gap-3">
              {filteredDishes.map((dish) => {
                const key = dish.originalName;
                const importState = importStates[key] ?? "idle";
                const importedId = importedIds[key];

                return (
                  <div key={key}
                    className="rounded-2xl p-4 transition-all"
                    style={{ background: "#fff", border: "1.5px solid #F0E8DC" }}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0 mt-0.5">
                        {CATEGORY_ICONS[dish.category] ?? "🍴"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-bold text-base leading-tight" style={{ color: "#3D2817" }}>
                              {dish.englishName}
                            </h3>
                            {dish.originalName !== dish.englishName && (
                              <p className="text-xs font-medium mt-0.5" style={{ color: "#A69180" }}>
                                {dish.originalName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {dish.price && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: "#FFF0E6", color: "#C85A2F" }}>
                                {dish.price}
                              </span>
                            )}
                            {SPICE_ICONS[dish.spiceLevel] && (
                              <span className="text-xs">{SPICE_ICONS[dish.spiceLevel]}</span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm leading-relaxed mb-2.5" style={{ color: "#6B5B52" }}>
                          {dish.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {dish.dietaryTags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#DCFCE7", color: "#16A34A" }}>
                              {tag}
                            </span>
                          ))}
                          {dish.allergens.map((a) => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "#FEF3C7", color: "#92400E" }}>
                              ⚠️ {a}
                            </span>
                          ))}
                          {dish.confidence === "low" && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "#F3F4F6", color: "#9CA3AF" }}>
                              ℹ️ low confidence
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {importState === "done" ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: "#DCFCE7" }}>
                              <Check className="w-4 h-4" style={{ color: "#16A34A" }} />
                            </div>
                            {importedId && (
                              <Link href={`/recipes/${importedId}`}
                                className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
                                style={{ background: "#EEF2FA" }}>
                                <ExternalLink className="w-4 h-4" style={{ color: "#2C4A8C" }} />
                              </Link>
                            )}
                          </div>
                        ) : importState === "loading" ? (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "#EEF2FA" }}>
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#2C4A8C" }} />
                          </div>
                        ) : importState === "error" ? (
                          <button onClick={() => handleImport(dish)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "#FEF2F2" }}>
                            <AlertCircle className="w-4 h-4" style={{ color: "#DC2626" }} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleImport(dish)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}
                            title="Import to my recipes"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredDishes.length === 0 && (
                <div className="text-center py-12">
                  <Flame className="w-10 h-10 mx-auto mb-3" style={{ color: "#E8D4BA" }} />
                  <p className="text-sm font-medium" style={{ color: "#A69180" }}>No dishes match your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !scanning && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "#3D2817" }}>Find dishes from anywhere</h2>
            <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: "#A69180" }}>
              Enter a restaurant name, paste a menu URL, or paste menu text in any language.
              We&apos;ll identify all the dishes and you can import any of them to your recipe collection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
