"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, X, Search, ShoppingBasket, Loader2, Camera, CheckSquare, Square, PackagePlus, Calendar, AlertTriangle, ChefHat, Bell, BellOff, Leaf } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { CategoryBadge } from "@/components/category-badge";
import { getIngredientEmoji } from "@/lib/ingredient-emoji";
import { searchIngredients } from "@/lib/common-ingredients";
import type { PantryItem, IngredientCategory } from "@/lib/types";
import { PantryScramble } from "./pantry-scramble";
import { LeftoverStorage } from "./leftover-storage";

// ── Unit system helpers ──────────────────────────────────────
type UnitSystem = "metric" | "imperial";

const LIQUID_UNITS_METRIC   = ["ml", "L", "dl"];
const LIQUID_UNITS_IMPERIAL = ["fl oz", "cup", "pint", "quart", "gallon", "tbsp", "tsp"];
const SOLID_UNITS_METRIC    = ["g", "kg"];
const SOLID_UNITS_IMPERIAL  = ["oz", "lb"];
const COUNT_UNITS = ["pieces", "slices", "cans", "jars", "bunches", "cloves", "sprigs", "whole"];

function isLiquid(name: string) {
  const lower = name.toLowerCase();
  return ["milk","cream","broth","stock","juice","oil","water","wine","beer","sauce","syrup","vinegar","tea","lemonade"].some((l) => lower.includes(l));
}

function getUnitOptions(name: string, system: UnitSystem): string[] {
  const liquid = isLiquid(name);
  if (liquid) return system === "metric" ? LIQUID_UNITS_METRIC : LIQUID_UNITS_IMPERIAL;
  return [
    ...(system === "metric" ? SOLID_UNITS_METRIC : SOLID_UNITS_IMPERIAL),
    ...COUNT_UNITS,
  ];
}

// ── Language support (labels only) ──────────────────────────
const LABELS = {
  en: {
    title: "My Pantry",
    subtitle: "Add what you have at home — we'll suggest recipes using your ingredients.",
    addIngredient: "Add ingredient",
    placeholder: "e.g. pasta, tomatoes, mozzarella…",
    qty: "Qty",
    unit: "Unit",
    add: "Add",
    aiNote: "AI auto-categorises each ingredient — just type and press Enter.",
    search: "Search pantry…",
    empty: "Your pantry is empty",
    emptyHint: "Add ingredients above to get recipe suggestions.",
    findRecipes: "Find recipes",
    youHave: "You have",
    ingredients: "ingredients",
    findUsingPantry: "Find recipes that use what's in your pantry.",
    language: "Language",
    units: "Units",
    metric: "Metric",
    imperial: "Imperial",
    failed: "Failed to add ingredient.",
  },
  es: {
    title: "Mi despensa",
    subtitle: "Agrega lo que tienes en casa — sugeriremos recetas con tus ingredientes.",
    addIngredient: "Agregar ingrediente",
    placeholder: "ej. pasta, tomates, mozzarella…",
    qty: "Cant.",
    unit: "Unid.",
    add: "Agregar",
    aiNote: "La IA categoriza cada ingrediente automáticamente.",
    search: "Buscar despensa…",
    empty: "Tu despensa está vacía",
    emptyHint: "Agrega ingredientes arriba para obtener sugerencias.",
    findRecipes: "Buscar recetas",
    youHave: "Tienes",
    ingredients: "ingredientes",
    findUsingPantry: "Encuentra recetas con lo que tienes.",
    language: "Idioma",
    units: "Unidades",
    metric: "Métrico",
    imperial: "Imperial",
    failed: "Error al agregar el ingrediente.",
  },
  de: {
    title: "Meine Vorratskammer",
    subtitle: "Füge deine Zutaten hinzu — wir schlagen passende Rezepte vor.",
    addIngredient: "Zutat hinzufügen",
    placeholder: "z. B. Pasta, Tomaten, Mozzarella…",
    qty: "Menge",
    unit: "Einh.",
    add: "Hinzufügen",
    aiNote: "KI kategorisiert jede Zutat automatisch.",
    search: "Vorratskammer durchsuchen…",
    empty: "Deine Vorratskammer ist leer",
    emptyHint: "Füge oben Zutaten hinzu für Rezeptvorschläge.",
    findRecipes: "Rezepte finden",
    youHave: "Du hast",
    ingredients: "Zutaten",
    findUsingPantry: "Finde Rezepte mit deinen Zutaten.",
    language: "Sprache",
    units: "Einheiten",
    metric: "Metrisch",
    imperial: "Imperial",
    failed: "Zutat konnte nicht hinzugefügt werden.",
  },
};

type LangKey = keyof typeof LABELS;

function suggestExpiryDate(name: string): string {
  const lower = name.toLowerCase();
  let days = 7;
  if (["milk","yogurt","cream","sour cream"].some(k => lower.includes(k))) days = 7;
  else if (["butter","hard cheese","cheddar","parmesan"].some(k => lower.includes(k))) days = 21;
  else if (["soft cheese","brie","camembert","ricotta"].some(k => lower.includes(k))) days = 7;
  else if (["chicken","beef","pork","lamb","mince","ground"].some(k => lower.includes(k))) days = 3;
  else if (["fish","salmon","tuna","shrimp","prawn"].some(k => lower.includes(k))) days = 2;
  else if (["bread","toast","bun","roll","baguette"].some(k => lower.includes(k))) days = 5;
  else if (["egg","eggs"].some(k => lower.includes(k))) days = 21;
  else if (["tomato","lettuce","spinach","kale","cucumber","berries","strawberr"].some(k => lower.includes(k))) days = 5;
  else if (["apple","pear","peach","mango","banana","orange","lemon","lime"].some(k => lower.includes(k))) days = 7;
  else if (["carrot","potato","onion","garlic","beetroot","celery"].some(k => lower.includes(k))) days = 14;
  else if (["herbs","basil","parsley","coriander","cilantro","dill"].some(k => lower.includes(k))) days = 5;
  else if (["pasta","rice","flour","sugar","salt","oats","cereal"].some(k => lower.includes(k))) days = 365;
  else if (["can","canned","jar","pickle","sauce","vinegar"].some(k => lower.includes(k))) days = 730;
  else if (["frozen","freeze"].some(k => lower.includes(k))) days = 90;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface Props {
  initialItems: PantryItem[];
  categories: IngredientCategory[];
}

export function PantryClient({ initialItems, categories }: Props) {
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [input, setInput] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<LangKey>("en");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  // Photo extraction state
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>([]);
  const [selectedExtracted, setSelectedExtracted] = useState<Set<string>>(new Set());
  const [addingBatch, setAddingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const L = LABELS[lang];
  const [activeTab, setActiveTab] = useState<"pantry" | "leftovers">("pantry");
  // Expiry dates stored locally: { [itemId]: ISO date string }
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("wc_pantry_expiry_v1") || "{}"); } catch { return {}; }
  });
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("wc_expiry_notif_v1") ?? "true"); } catch { return true; }
  });
  // Waste Not
  const [wasteNotLoading, setWasteNotLoading] = useState(false);
  const [wasteNotRecipes, setWasteNotRecipes] = useState<{ title: string; reason: string }[] | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Autocomplete
  useEffect(() => {
    const results = searchIngredients(input, 8);
    setSuggestions(results);
    setShowSuggestions(results.length > 0 && input.length > 1);
  }, [input]);

  // Reset unit when ingredient changes
  useEffect(() => {
    const opts = getUnitOptions(input, unitSystem);
    setUnit(opts[0] ?? "");
  }, [input, unitSystem]);

  const grouped = useMemo(() => {
    const filtered = search
      ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : items;
    const groups: Record<string, PantryItem[]> = { Uncategorised: [] };
    filtered.forEach((item) => {
      const catName = item.category?.name ?? "Uncategorised";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });
    if (groups["Uncategorised"].length === 0) delete groups["Uncategorised"];
    return groups;
  }, [items, search]);

  function pickSuggestion(name: string) {
    setInput(name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  async function handleAdd() {
    const name = input.trim();
    if (!name) return;
    setAdding(true);
    setError(null);

    let categoryId: string | undefined;
    try {
      const res = await fetch("/api/pantry/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: [name] }),
      });
      const json = await res.json();
      const cat = json.categorized?.[name];
      categoryId = cat?.id;
    } catch { /* uncategorised fallback */ }

    const quantityStr = quantity.trim() ? `${quantity.trim()} ${unit}`.trim() : null;

    const res = await fetch("/api/pantry/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity: quantityStr, category_id: categoryId ?? null }),
    });
    const json = await res.json();

    if (!res.ok || json.error) {
      setError(`${L.failed} (${json.error ?? res.status})`);
    } else if (json.item) {
      setItems((prev) => [json.item as PantryItem, ...prev]);
      // Auto-suggest expiry date based on ingredient type
      const expiry = suggestExpiryDate(name);
      setItemExpiry(json.item.id, expiry);
      setInput("");
      setQuantity("");
    }
    setAdding(false);
  }

  async function handleRemove(id: string) {
    setPendingDelete(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/pantry/items?id=${id}`, { method: "DELETE" });
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    e.target.value = "";
    if (!file) return;

    setPhotoLoading(true);
    setPhotoError(null);
    setExtractedIngredients([]);
    setSelectedExtracted(new Set());

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data URL prefix to get pure base64
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/pantry/extract-from-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType: file.type }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setPhotoError(json.error ?? "Could not extract ingredients.");
      } else {
        const ingredients: string[] = json.ingredients ?? [];
        setExtractedIngredients(ingredients);
        setSelectedExtracted(new Set(ingredients));
      }
    } catch {
      setPhotoError("Failed to process photo.");
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleAddExtracted() {
    const toAdd = extractedIngredients.filter((i) => selectedExtracted.has(i));
    if (toAdd.length === 0) return;
    setAddingBatch(true);

    // Categorise all at once
    let catMap: Record<string, { id: string }> = {};
    try {
      const res = await fetch("/api/pantry/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: toAdd }),
      });
      const json = await res.json();
      catMap = json.categorized ?? {};
    } catch { /* uncategorised fallback */ }

    const added: typeof items = [];
    for (const name of toAdd) {
      const res = await fetch("/api/pantry/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity: null, category_id: catMap[name]?.id ?? null }),
      });
      const json = await res.json();
      if (json.item) added.push(json.item);
    }
    setItems((prev) => [...added, ...prev]);
    setExtractedIngredients([]);
    setSelectedExtracted(new Set());
    setAddingBatch(false);
  }

  const unitOptions = getUnitOptions(input, unitSystem);

  function setItemExpiry(id: string, date: string) {
    const updated = { ...expiryDates, [id]: date };
    setExpiryDates(updated);
    try { localStorage.setItem("wc_pantry_expiry_v1", JSON.stringify(updated)); } catch {}
    setEditingExpiry(null);
  }

  function clearItemExpiry(id: string) {
    const updated = { ...expiryDates };
    delete updated[id];
    setExpiryDates(updated);
    try { localStorage.setItem("wc_pantry_expiry_v1", JSON.stringify(updated)); } catch {}
  }

  function getExpiryStatus(id: string): null | { label: string; color: string; bg: string; daysLeft: number } {
    const exp = expiryDates[id];
    if (!exp) return null;
    const now = new Date();
    const expDate = new Date(exp);
    const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "Expired", color: "#DC2626", bg: "#FEF2F2", daysLeft };
    if (daysLeft === 0) return { label: "Today!", color: "#EA580C", bg: "#FFF7ED", daysLeft };
    if (daysLeft <= 2) return { label: `${daysLeft}d left`, color: "#D97706", bg: "#FFFBEB", daysLeft };
    if (daysLeft <= 5) return { label: `${daysLeft}d left`, color: "#CA8A04", bg: "#FEFCE8", daysLeft };
    return { label: `${daysLeft}d`, color: "#16A34A", bg: "#F0FDF4", daysLeft };
  }

  const expiringSoonCount = items.filter((i) => {
    const s = getExpiryStatus(i.id);
    return s && s.daysLeft <= 3;
  }).length;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <ConfirmDeleteDialog
        open={!!pendingDelete}
        title="Remove from pantry?"
        description="This ingredient will be removed from your pantry."
        confirmLabel="Remove"
        onConfirm={() => pendingDelete && handleRemove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
      {/* Hidden file input for photo extraction */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "#F5E6D3" }}>
        <button
          onClick={() => setActiveTab("pantry")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: activeTab === "pantry" ? "#fff" : "transparent",
            color: activeTab === "pantry" ? "#3D2817" : "#A69180",
            boxShadow: activeTab === "pantry" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <ShoppingBasket className="w-4 h-4" /> My Pantry
          {expiringSoonCount > 0 && activeTab !== "pantry" && (
            <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: "#DC2626", color: "#fff" }}>{expiringSoonCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("leftovers")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: activeTab === "leftovers" ? "#fff" : "transparent",
            color: activeTab === "leftovers" ? "#3D2817" : "#A69180",
            boxShadow: activeTab === "leftovers" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <ChefHat className="w-4 h-4" /> Leftovers & Storage
        </button>
      </div>

      {activeTab === "leftovers" && <LeftoverStorage />}

      {activeTab === "pantry" && <>

      {/* Expiry notification banner */}
      {expiringSoonCount > 0 && notifEnabled && (
        <div className="mb-4 rounded-2xl p-4 flex items-start gap-3" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#C2410C" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#7C2D12" }}>
              {expiringSoonCount} item{expiringSoonCount !== 1 ? "s" : ""} expiring soon
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9A3412" }}>
              Check below — items shown in yellow/red are approaching or past expiry.
            </p>
          </div>
          <button
            onClick={() => {
              const updated = !notifEnabled;
              setNotifEnabled(updated);
              try { localStorage.setItem("wc_expiry_notif_v1", JSON.stringify(updated)); } catch {}
            }}
            className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-orange-100"
            title="Toggle expiry alerts"
          >
            {notifEnabled ? <Bell className="w-4 h-4" style={{ color: "#C2410C" }} /> : <BellOff className="w-4 h-4" style={{ color: "#A69180" }} />}
          </button>
        </div>
      )}

      {/* Header + controls */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#3D2817" }}>
            <ShoppingBasket className="w-6 h-6" style={{ color: "#C85A2F" }} />
            {L.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Unit toggle */}
          <div className="flex rounded-xl overflow-hidden border text-xs" style={{ borderColor: "#E8D4C0" }}>
            {(["metric", "imperial"] as UnitSystem[]).map((s) => (
              <button key={s} onClick={() => setUnitSystem(s)}
                className="px-2.5 py-1.5 font-medium transition-colors"
                style={{ background: unitSystem === s ? "#C85A2F" : "#fff", color: unitSystem === s ? "#fff" : "#6B5B52" }}>
                {s === "metric" ? L.metric : L.imperial}
              </button>
            ))}
          </div>
          {/* Language picker */}
          <select value={lang} onChange={(e) => setLang(e.target.value as LangKey)}
            className="px-2 py-1.5 rounded-xl border text-xs focus:outline-none"
            style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }}>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="de">🇩🇪 DE</option>
          </select>
        </div>
      </div>

      {/* Add ingredient */}
      <div className="rounded-2xl border p-4 mb-6" style={{ borderColor: "#F5E6D3", background: "#fff" }}>
        <p className="text-sm font-medium mb-3" style={{ color: "#3D2817" }}>{L.addIngredient}</p>

        {/* Input row */}
        <div className="flex gap-2 mb-2 relative">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); handleAdd(); } if (e.key === "Escape") setShowSuggestions(false); }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              placeholder={L.placeholder}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }}
              autoComplete="off"
            />
            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border shadow-lg overflow-hidden"
                style={{ background: "#fff", borderColor: "#E8D4C0" }}>
                {suggestions.map((s) => (
                  <button key={s} onMouseDown={() => pickSuggestion(s)}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors"
                    style={{ color: "#3D2817" }}>
                    <span className="text-base w-6 text-center">{getIngredientEmoji(s)}</span>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={L.qty}
            className="w-16 px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }}
          />

          {/* Unit */}
          <select value={unit} onChange={(e) => setUnit(e.target.value)}
            className="w-20 px-2 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }}>
            {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>

          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !input.trim()}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: "#C85A2F", color: "#fff" }}
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {L.add}
          </button>
        </div>

        {error && <p className="text-xs mt-1" style={{ color: "#991B1B" }}>{error}</p>}
        <p className="text-xs mt-2" style={{ color: "#A69180" }}>{L.aiNote}</p>

        {/* Photo / receipt extraction */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "#F5E6D3" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
            style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }}
          >
            {photoLoading
              ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C85A2F" }} />
              : <Camera className="w-4 h-4" style={{ color: "#C85A2F" }} />}
            {photoLoading ? "Scanning…" : "Extract from photo or receipt"}
          </button>
          <p className="text-xs mt-1" style={{ color: "#A69180" }}>
            Snap your fridge, pantry shelf, or a grocery receipt — AI reads all the ingredients.
          </p>

          {photoError && (
            <p className="text-xs mt-2" style={{ color: "#991B1B" }}>{photoError}</p>
          )}

          {/* Extracted ingredients confirmation */}
          {extractedIngredients.length > 0 && (
            <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "#E8D4C0", background: "#fff" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: "#3D2817" }}>
                  Found {extractedIngredients.length} ingredient{extractedIngredients.length !== 1 ? "s" : ""} — pick which to add:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExtracted(new Set(extractedIngredients))}
                    className="text-xs" style={{ color: "#C85A2F" }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedExtracted(new Set())}
                    className="text-xs" style={{ color: "#A69180" }}
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {extractedIngredients.map((name) => {
                  const checked = selectedExtracted.has(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedExtracted((prev) => {
                          const next = new Set(prev);
                          if (next.has(name)) next.delete(name);
                          else next.add(name);
                          return next;
                        });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all"
                      style={{
                        borderColor: checked ? "#C85A2F" : "#E8D4C0",
                        background: checked ? "#FFF0E6" : "#FAF7F2",
                        color: checked ? "#C85A2F" : "#6B5B52",
                      }}
                    >
                      {checked
                        ? <CheckSquare className="w-3 h-3" />
                        : <Square className="w-3 h-3" />}
                      {name}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddExtracted}
                  disabled={addingBatch || selectedExtracted.size === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
                  style={{ background: "#C85A2F", color: "#fff" }}
                >
                  {addingBatch
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <PackagePlus className="w-4 h-4" />}
                  Add {selectedExtracted.size > 0 ? `${selectedExtracted.size} ` : ""}ingredient{selectedExtracted.size !== 1 ? "s" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => { setExtractedIngredients([]); setSelectedExtracted(new Set()); }}
                  className="text-xs" style={{ color: "#A69180" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {items.length > 4 && (
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A69180" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L.search}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }}
          />
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
          <ShoppingBasket className="w-8 h-8 mx-auto mb-3" style={{ color: "#C85A2F", opacity: 0.35 }} />
          <p className="text-sm mb-1 font-medium" style={{ color: "#3D2817" }}>{L.empty}</p>
          <p className="text-xs" style={{ color: "#6B5B52" }}>{L.emptyHint}</p>
        </div>
      )}

      {/* Grouped items */}
      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([catName, catItems]) => {
          const cat = catItems[0]?.category;
          return (
            <div key={catName}>
              <div className="flex items-center gap-2 mb-2">
                {cat ? (
                  <CategoryBadge name={cat.name} emoji={cat.emoji} color={cat.color} size="md" />
                ) : (
                  <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{catName}</span>
                )}
                <span className="text-xs" style={{ color: "#A69180" }}>{catItems.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {catItems.map((item) => {
                  const expiryStatus = getExpiryStatus(item.id);
                  return (
                    <div key={item.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                      style={{
                        borderColor: expiryStatus ? expiryStatus.color + "50" : "#E8D4C0",
                        background: expiryStatus ? expiryStatus.bg : "#fff",
                        color: "#3D2817",
                      }}>
                      <span className="text-base">{getIngredientEmoji(item.name)}</span>
                      <span>{item.name}</span>
                      {item.quantity && (
                        <span className="text-xs" style={{ color: "#A69180" }}>{item.quantity}</span>
                      )}
                      {expiryStatus && (
                        <span className="text-xs font-semibold flex items-center gap-0.5"
                          style={{ color: expiryStatus.color }}>
                          {expiryStatus.daysLeft < 0 && <AlertTriangle className="w-3 h-3" />}
                          {expiryStatus.label}
                        </span>
                      )}
                      {/* Expiry date picker */}
                      {editingExpiry === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            autoFocus
                            className="text-xs px-1.5 py-0.5 rounded-lg border"
                            style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817", fontSize: "0.65rem" }}
                            onChange={(e) => e.target.value && setItemExpiry(item.id, e.target.value)}
                            onBlur={() => setEditingExpiry(null)}
                          />
                          {expiryStatus && (
                            <button onClick={() => clearItemExpiry(item.id)} className="text-xs" style={{ color: "#A69180" }}>✕</button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingExpiry(item.id)}
                          className="hover:opacity-70 transition-opacity"
                          title="Set expiry date"
                          style={{ color: expiryStatus ? expiryStatus.color : "#A69180" }}
                        >
                          <Calendar className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item.id)}
                        className="ml-1 hover:text-red-500 transition-colors"
                        style={{ color: "#A69180" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scramble feature */}
      {items.length >= 2 && (
        <PantryScramble itemCount={items.length} />
      )}

      {/* Waste Not widget */}
      {(() => {
        const atRisk = items.filter(i => { const s = getExpiryStatus(i.id); return s && s.daysLeft >= 0 && s.daysLeft <= 5; });
        if (atRisk.length === 0) return null;
        return (
          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4" style={{ color: "#16A34A" }} />
              <p className="text-sm font-semibold" style={{ color: "#15803D" }}>
                Waste Not — {atRisk.length} item{atRisk.length !== 1 ? "s" : ""} expiring soon
              </p>
            </div>
            <p className="text-xs mb-3" style={{ color: "#166534" }}>
              Use up: {atRisk.map(i => i.name).join(", ")}
            </p>
            <button
              onClick={async () => {
                setWasteNotLoading(true);
                setWasteNotRecipes(null);
                try {
                  const res = await fetch("/api/pantry/scramble", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ingredients: atRisk.map(i => i.name) }),
                  });
                  const json = await res.json();
                  setWasteNotRecipes(json.recipes ?? []);
                } catch { setWasteNotRecipes([]); }
                setWasteNotLoading(false);
              }}
              disabled={wasteNotLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
              style={{ background: "#16A34A", color: "#fff" }}
            >
              {wasteNotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
              {wasteNotLoading ? "Finding recipes…" : "Find waste-not recipes"}
            </button>
            {wasteNotRecipes && wasteNotRecipes.length === 0 && (
              <p className="text-xs mt-3" style={{ color: "#166534" }}>No recipes found — try adding more ingredients.</p>
            )}
            {wasteNotRecipes && wasteNotRecipes.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {wasteNotRecipes.map((r, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "#dcfce7" }}>
                    <p className="text-sm font-semibold" style={{ color: "#15803D" }}>{r.title}</p>
                    {r.reason && <p className="text-xs mt-0.5" style={{ color: "#166534" }}>{r.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Notification toggle */}
      <div className="mt-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {notifEnabled ? <Bell className="w-4 h-4" style={{ color: "#C85A2F" }} /> : <BellOff className="w-4 h-4" style={{ color: "#A69180" }} />}
          <span className="text-xs" style={{ color: "#6B5B52" }}>Expiry alerts</span>
        </div>
        <button
          onClick={() => {
            const updated = !notifEnabled;
            setNotifEnabled(updated);
            try { localStorage.setItem("wc_expiry_notif_v1", JSON.stringify(updated)); } catch {}
          }}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{ background: notifEnabled ? "#C85A2F" : "#E8D4C0" }}
          aria-label="Toggle expiry alerts"
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            style={{ transform: notifEnabled ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>

      {/* Find recipes CTA */}
      {items.length >= 2 && (
        <div className="mt-6 rounded-2xl border p-5 flex items-center justify-between gap-4"
          style={{ borderColor: "#F5E6D3", background: "#FFF8F3" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>
              {L.youHave} {items.length} {L.ingredients}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6B5B52" }}>{L.findUsingPantry}</p>
          </div>
          <a href={`/discover?ingredients=${items.map((i) => i.name).join(",")}`}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C85A2F", color: "#fff" }}>
            {L.findRecipes}
          </a>
        </div>
      )}
      </>}
    </div>
  );
}
