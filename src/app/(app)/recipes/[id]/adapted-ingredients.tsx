"use client";

import { useDietaryMode } from "@/lib/dietary-mode-context";
import { adaptIngredients, DIETARY_LABELS, DIETARY_COLORS, type DietaryRestriction } from "@/lib/dietary-substitutions";
import { AlertTriangle, CheckCircle, X, Plus, RefreshCw, ShoppingCart, Check, Package } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { IngredientTooltip } from "@/components/ingredient-tooltip";

type Ingredient = { name: string; amount?: number | null; unit?: string | null };
type PantryItem = { id: string; name: string; quantity?: string | null };

function getIngredientEmoji(name: string): string {
  const lower = name.toLowerCase();
  const quick: [string, string][] = [
    ["tomato","🍅"],["chicken","🍗"],["beef","🥩"],["pork","🥩"],["fish","🐟"],
    ["salmon","🐟"],["shrimp","🦐"],["egg","🥚"],["milk","🥛"],["butter","🧈"],
    ["cream","🥛"],["cheese","🧀"],["onion","🧅"],["garlic","🧄"],["carrot","🥕"],
    ["potato","🥔"],["rice","🍚"],["pasta","🍝"],["flour","🌾"],["sugar","🍬"],
    ["salt","🧂"],["pepper","🧂"],["oil","🫒"],["lemon","🍋"],["lime","🍋"],
    ["orange","🍊"],["basil","🌿"],["parsley","🌿"],["thyme","🌿"],["cumin","🌶️"],
    ["paprika","🌶️"],["chocolate","🍫"],["vanilla","🌿"],["bread","🍞"],
    ["wine","🍷"],["broth","🫙"],["stock","🫙"],["honey","🍯"],["mushroom","🍄"],
    ["spinach","🥬"],["kale","🥬"],["bean","🫘"],["lentil","🫘"],["yogurt","🥛"],
    ["avocado","🥑"],["corn","🌽"],["apple","🍎"],["banana","🍌"],["strawberry","🍓"],
    ["coconut","🥥"],["peanut","🥜"],["walnut","🥜"],["almond","🥜"],["tahini","🫙"],
    ["tofu","🟡"],["tempeh","🟤"],["soy","🫘"],["miso","🟡"],["sesame","🌾"],
    ["ginger","🌿"],["turmeric","🌿"],["cinnamon","🌿"],["chili","🌶️"],
    ["bell pepper","🫑"],["zucchini","🥒"],["cucumber","🥒"],["broccoli","🥦"],
    ["cauliflower","🥦"],["cabbage","🥬"],["lettuce","🥬"],["pea","🟢"],
    ["chickpea","🫘"],["sweet potato","🍠"],["beet","🟣"],["asparagus","🌿"],
  ];
  for (const [key, emoji] of quick) {
    if (lower.includes(key)) return emoji;
  }
  return "🍽️";
}

// Common pantry items for autocomplete suggestions beyond recipe ingredients
const COMMON_PANTRY = [
  "butter", "olive oil", "flour", "sugar", "salt", "eggs", "milk", "cream",
  "garlic", "onion", "chicken broth", "beef broth", "vegetable broth",
  "soy sauce", "lemon juice", "lime juice", "vinegar", "honey", "maple syrup",
  "baking soda", "baking powder", "yeast", "cornstarch", "breadcrumbs",
  "parmesan", "mozzarella", "cheddar", "feta", "cream cheese", "sour cream",
  "yogurt", "coconut milk", "heavy cream", "buttermilk", "almond milk",
  "chicken", "beef", "pork", "lamb", "shrimp", "salmon", "tuna", "tofu", "tempeh",
  "rice", "pasta", "quinoa", "oats", "bread", "tortilla",
  "tomatoes", "spinach", "kale", "broccoli", "cauliflower", "mushrooms",
  "bell peppers", "zucchini", "eggplant", "sweet potato", "potato", "carrot",
  "peanut butter", "tahini", "almond flour", "coconut flour", "arrowroot",
];

const CONFIDENCE_CONFIG = {
  high:   { label: "High confidence",                              color: "#16a34a", bg: "#DCFCE7", icon: CheckCircle },
  medium: { label: "Medium confidence",                            color: "#D97706", bg: "#FEF3C7", icon: AlertTriangle },
  low:    { label: "Low confidence — recipe may need adjustments", color: "#DC2626", bg: "#FEE2E2", icon: AlertTriangle },
  none:   { label: "No substitutions needed",                      color: "#16a34a", bg: "#DCFCE7", icon: CheckCircle },
};

function mergeAdaptations(
  ingredients: Ingredient[],
  restrictions: DietaryRestriction[],
  customSwaps: string[],
) {
  type Row = { original: Ingredient; adapted: boolean; replacement?: string; note?: string; confidence?: number; restriction?: string; customSwap?: boolean };

  const rows: Row[] = ingredients.map((ing) => ({ original: ing, adapted: false as const }));

  // Apply dietary restrictions first
  for (const r of restrictions) {
    const result = adaptIngredients(ingredients, r);
    result.ingredients.forEach((adapted, i) => {
      if (adapted.adapted && !rows[i].adapted) {
        rows[i] = { ...adapted, restriction: r };
      }
    });
  }

  // Apply custom swaps (flag any ingredient whose name contains any of the swap terms)
  for (let i = 0; i < ingredients.length; i++) {
    const lower = ingredients[i].name.toLowerCase();
    const matchedSwap = customSwaps.find((s) => lower.includes(s.toLowerCase()));
    if (matchedSwap && !rows[i].adapted) {
      rows[i] = {
        original: ingredients[i],
        adapted: true,
        replacement: "Substitute needed",
        note: `You flagged "${matchedSwap}" — choose an alternative that works for your recipe`,
        confidence: 0.5,
        customSwap: true,
      };
    }
  }

  const totalSubs = rows.filter((r) => r.adapted).length;
  const scores = rows.filter((r) => r.adapted && r.confidence !== undefined).map((r) => r.confidence as number);
  const overallConfidence = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
  const confidenceLabel: keyof typeof CONFIDENCE_CONFIG =
    totalSubs === 0 ? "none" : overallConfidence >= 0.85 ? "high" : overallConfidence >= 0.65 ? "medium" : "low";

  return { ingredients: rows, substitutionCount: totalSubs, confidenceLabel };
}

// ── Pantry matching ──────────────────────────────────────────
function isPantryMatch(ingName: string, pantryItems: PantryItem[]): boolean {
  const lower = ingName.toLowerCase().trim();
  return pantryItems.some((p) => {
    const pLower = p.name.toLowerCase().trim();
    return pLower === lower || lower.includes(pLower) || pLower.includes(lower);
  });
}

// ── Shopping list (localStorage) ─────────────────────────────
const SHOPPING_LIST_KEY = "wc_shopping_list_v1";

function saveToShoppingList(items: Ingredient[]): number {
  try {
    const existing: { name: string; amount?: number | null; unit?: string | null; checked: boolean; addedAt: string }[] =
      JSON.parse(localStorage.getItem(SHOPPING_LIST_KEY) || "[]");
    const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
    const newItems = items
      .filter((i) => !existingNames.has(i.name.toLowerCase()))
      .map((i) => ({ name: i.name, amount: i.amount ?? null, unit: i.unit ?? null, checked: false, addedAt: new Date().toISOString() }));
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify([...existing, ...newItems]));
    return newItems.length;
  } catch {
    return 0;
  }
}

export function AdaptedIngredients({ ingredients, pantryItems = [] }: { ingredients: Ingredient[]; pantryItems?: PantryItem[] }) {
  const { restrictions, active } = useDietaryMode();
  const [customSwaps, setCustomSwaps] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [shoppingMsg, setShoppingMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete list: recipe ingredient names + common pantry items
  const suggestions = useMemo(() => {
    const recipeNames = ingredients.map((i) => i.name.toLowerCase());
    const all = [...new Set([...recipeNames, ...COMMON_PANTRY.map((p) => p.toLowerCase())])].sort();
    return all;
  }, [ingredients]);

  function addSwap() {
    const v = inputValue.trim().toLowerCase();
    if (v && !customSwaps.includes(v)) {
      setCustomSwaps((prev) => [...prev, v]);
    }
    setInputValue("");
    inputRef.current?.focus();
  }

  function removeSwap(s: string) {
    setCustomSwaps((prev) => prev.filter((x) => x !== s));
  }

  const hasAdaptation = active || customSwaps.length > 0;

  const result = useMemo(() => {
    if (!hasAdaptation) return null;
    return mergeAdaptations(ingredients, active ? restrictions : [], customSwaps);
  }, [ingredients, restrictions, active, customSwaps, hasAdaptation]);

  // ── Pantry stats ─────────────────────────────────────────
  const pantryMatches = useMemo(() =>
    ingredients.map((ing) => isPantryMatch(ing.name, pantryItems)),
    [ingredients, pantryItems]
  );
  const inPantryCount = pantryMatches.filter(Boolean).length;
  const missingIngredients = ingredients.filter((_, i) => !pantryMatches[i]);

  function handleAddMissing() {
    const count = saveToShoppingList(missingIngredients);
    setShoppingMsg(count > 0 ? `${count} item${count !== 1 ? "s" : ""} added to shopping list` : "Already in shopping list");
    setTimeout(() => setShoppingMsg(null), 3000);
  }

  function handleAddAll() {
    const count = saveToShoppingList(ingredients);
    setShoppingMsg(count > 0 ? `${count} item${count !== 1 ? "s" : ""} added to shopping list` : "Already in shopping list");
    setTimeout(() => setShoppingMsg(null), 3000);
  }

  // ── Pantry summary bar — always visible ──────────────────
  const pantryBar = (
    <div className="mb-3 rounded-xl border px-4 py-3"
      style={{ background: "rgba(14,9,5,0.6)", borderColor: "rgba(42,24,8,0.7)" }}>
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Package style={{ width: 14, height: 14, color: "#828E6F" }} />
          {pantryItems.length > 0 ? (
            <>
              <span className="text-xs font-semibold" style={{ color: "#828E6F" }}>
                {inPantryCount} of {ingredients.length} in pantry
              </span>
              {inPantryCount === ingredients.length && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(130,142,111,0.2)", color: "#828E6F" }}>
                  All set!
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-semibold" style={{ color: "#6B4E36" }}>
              {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {shoppingMsg && (
          <span className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "#828E6F" }}>
            <Check style={{ width: 12, height: 12 }} /> {shoppingMsg}
          </span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {pantryItems.length > 0 && missingIngredients.length > 0 && (
          <button
            onClick={handleAddMissing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
            style={{ background: "rgba(176,125,86,0.15)", color: "#B07D56", border: "1px solid rgba(176,125,86,0.3)" }}
          >
            <ShoppingCart style={{ width: 12, height: 12 }} />
            Add missing ({missingIngredients.length})
          </button>
        )}
        <button
          onClick={handleAddAll}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
          style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}
        >
          <ShoppingCart style={{ width: 12, height: 12 }} />
          Add all to shopping list
        </button>
      </div>
    </div>
  );

  // The ingredient swap input — always shown
  const swapInput = (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: "#C8522A" }} />
        <span className="text-xs font-semibold" style={{ color: "#C8522A" }}>Swap ingredients</span>
        <span className="text-xs" style={{ color: "#6B4E36" }}>— type any ingredient to get substitution ideas</span>
      </div>

      {/* Active swaps */}
      {customSwaps.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {customSwaps.map((s) => (
            <span key={s}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "#2A1808", color: "#C8522A", border: "1px solid #C8522A30" }}>
              {s}
              <button onClick={() => removeSwap(s)} className="shrink-0 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <datalist id="ingredient-suggestions">
        {suggestions.map((s) => <option key={s} value={s} />)}
      </datalist>
      <form onSubmit={(e) => { e.preventDefault(); addSwap(); }} className="flex gap-2">
        <input
          ref={inputRef}
          list="ingredient-suggestions"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. butter, cream, flour…"
          autoComplete="off"
          className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl outline-none border"
          style={{
            background: "#1C1209",
            borderColor: "#3A2416",
            color: "#EFE3CE",
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:opacity-80"
          style={{ background: "#C8522A" }}
          aria-label="Add"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );

  if (!hasAdaptation || !result) {
    return (
      <div>
        {pantryBar}
        {swapInput}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#3A2416" }}>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 text-sm" style={{ borderColor: "#3A2416", background: i % 2 === 0 ? "#1C1209" : "#161009" }}>
              <span className="text-lg w-7 text-center">{getIngredientEmoji(ing.name)}</span>
              <span className="flex-1 font-medium" style={{ color: "#EFE3CE" }}>{ing.name}</span>
              {(ing.amount || ing.unit) && (
                <span className="text-sm" style={{ color: "#6B4E36" }}>{ing.amount} {ing.unit}</span>
              )}
              {pantryItems.length > 0 && (
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: pantryMatches[i] ? "rgba(130,142,111,0.2)" : "rgba(42,24,8,0.5)",
                    border: `1px solid ${pantryMatches[i] ? "rgba(130,142,111,0.4)" : "rgba(58,36,22,0.4)"}`,
                  }}
                  title={pantryMatches[i] ? "In your pantry" : "Not in pantry"}
                >
                  {pantryMatches[i]
                    ? <Check style={{ width: 10, height: 10, color: "#828E6F" }} />
                    : <span style={{ fontSize: "0.5rem", color: "#5A3A28" }}>✕</span>
                  }
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeRestrictions = active ? restrictions : [];
  const primaryRestriction = activeRestrictions[0];
  const dietaryColor = primaryRestriction ? DIETARY_COLORS[primaryRestriction] : { color: "#C8522A", bg: "#2A1808" };
  const confCfg = CONFIDENCE_CONFIG[result.confidenceLabel];
  const ConfIcon = confCfg.icon;

  return (
    <div>
      {pantryBar}
      {swapInput}

      {/* Adaptation banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3"
        style={{ background: dietaryColor.bg }}>
        <RefreshCw className="w-4 h-4 shrink-0" style={{ color: dietaryColor.color }} />
        <div className="flex-1">
          <span className="text-xs font-bold" style={{ color: dietaryColor.color }}>
            {activeRestrictions.length > 0
              ? `Adapt Meals: ${activeRestrictions.map((r) => DIETARY_LABELS[r]).join(" + ")}`
              : "Custom ingredient swaps active"
            }
          </span>
          {result.substitutionCount > 0 && (
            <span className="text-xs ml-2 opacity-75" style={{ color: dietaryColor.color }}>
              · {result.substitutionCount} ingredient{result.substitutionCount !== 1 ? "s" : ""} substituted
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: confCfg.bg }}>
          <ConfIcon className="w-3 h-3 shrink-0" style={{ color: confCfg.color }} />
          <span className="text-xs font-semibold" style={{ color: confCfg.color }}>
            {result.confidenceLabel === "none" ? "All clear" :
             result.confidenceLabel === "high" ? "High" :
             result.confidenceLabel === "medium" ? "Medium" : "Low"}
          </span>
        </div>
      </div>

      {result.substitutionCount > 0 && result.confidenceLabel !== "none" && (
        <p className="text-xs mb-3 px-1" style={{ color: "#6B4E36" }}>
          {confCfg.label} — original ingredients shown with strikethrough
        </p>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#3A2416" }}>
        {result.ingredients.map((ing, i) => (
          <div key={i}
            className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 text-sm"
            style={{
              borderColor: "#3A2416",
              background: ing.adapted ? (ing.customSwap ? "#2A1808" : "#1A2010") : i % 2 === 0 ? "#1C1209" : "#161009",
            }}>
            <span className="text-lg w-7 text-center mt-0.5">{getIngredientEmoji(ing.original.name)}</span>
            <div className="flex-1 min-w-0">
              {ing.adapted ? (
                <>
                  <IngredientTooltip
                    name={ing.original.name}
                    className="line-through text-xs block"
                    style={{ color: "#6B4E36" }}
                  />
                  <IngredientTooltip
                    name={ing.replacement ?? ing.original.name}
                    className="font-semibold"
                    style={{ color: ing.customSwap ? "#C8522A" : "#828E6F" }}
                  />
                  {ing.note && (
                    <span className="text-xs block mt-0.5" style={{ color: "#8A6A4A" }}>
                      {ing.note}
                    </span>
                  )}
                  {ing.confidence !== undefined && !ing.customSwap && (
                    <span
                      className="inline-flex items-center gap-1 text-xs mt-1 px-1.5 py-0.5 rounded-full"
                      style={{
                        background: ing.confidence >= 0.85 ? "#DCFCE7" : ing.confidence >= 0.65 ? "#FEF3C7" : "#FEE2E2",
                        color: ing.confidence >= 0.85 ? "#16a34a" : ing.confidence >= 0.65 ? "#D97706" : "#DC2626",
                      }}
                    >
                      {Math.round(ing.confidence * 100)}% match
                    </span>
                  )}
                </>
              ) : (
                <IngredientTooltip
                  name={ing.original.name}
                  className="font-medium"
                  style={{ color: "#EFE3CE" }}
                />
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {(ing.original.amount || ing.original.unit) && (
                <span className="text-sm" style={{ color: "#6B4E36" }}>
                  {ing.original.amount} {ing.original.unit}
                </span>
              )}
              {pantryItems.length > 0 && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: pantryMatches[i] ? "rgba(130,142,111,0.2)" : "rgba(42,24,8,0.5)",
                    border: `1px solid ${pantryMatches[i] ? "rgba(130,142,111,0.4)" : "rgba(58,36,22,0.4)"}`,
                  }}
                  title={pantryMatches[i] ? "In your pantry" : "Not in pantry"}
                >
                  {pantryMatches[i]
                    ? <Check style={{ width: 10, height: 10, color: "#828E6F" }} />
                    : <span style={{ fontSize: "0.5rem", color: "#5A3A28" }}>✕</span>
                  }
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
