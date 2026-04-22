"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp,
  UtensilsCrossed, Coffee, Soup, Cookie, Save, ShoppingCart,
  Printer, X, Share2, Link2, Check, AlertTriangle, Users,
  Flame, Dumbbell,
} from "lucide-react";
import Link from "next/link";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

// ── Types ────────────────────────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";

export interface BuilderEntry {
  clientId: string;
  dbId?: string;
  recipe_id?: string | null;
  day_number: number;
  meal_type: MealType;
  recipe_title: string;
  description?: string;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  position: number;
  isEditing: boolean;
  from_database?: boolean;
}

interface DayData {
  day_number: number;
  entries: BuilderEntry[];
  expanded: boolean;
  suggesting: boolean;
  suggestionPrompt: string;
}

interface ShoppingIngredient {
  name: string;
  amount?: number | null;
  unit?: string | null;
  from: string[];
  category?: string;
}

interface ShoppingData {
  missing: ShoppingIngredient[];
  have: ShoppingIngredient[];
  unknownEntries: { recipeTitle: string }[];
  totalRecipes: number;
}

interface RecipeDetail {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  ingredients?: { name: string; amount?: number | null; unit?: string | null }[];
  instructions?: string[];
  servings?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

interface Props {
  planId: string;
  planTitle: string;
  durationDays: number;
  dietaryFilters: string[];
  nutritionalGoals: Record<string, number>;
  initialEntries: BuilderEntry[];
  isPublic?: boolean;
}

// ── Earthy meal type config ───────────────────────────────────────────────────

function makeId() { return Math.random().toString(36).slice(2); }

const MEAL_TYPE_CONFIG: Record<MealType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  breakfast: { label: "Breakfast", icon: Coffee,          color: "#7A5C1E", bg: "#F5EDD8" },
  lunch:     { label: "Lunch",     icon: UtensilsCrossed,  color: "#4A5C2A", bg: "#EBF0DC" },
  dinner:    { label: "Dinner",    icon: Soup,              color: "#7A3520", bg: "#F5E0D8" },
  snack:     { label: "Snack",     icon: Cookie,            color: "#5C4A2A", bg: "#EDE0CC" },
  dessert:   { label: "Dessert",   icon: Cookie,            color: "#7A3D4E", bg: "#F5E0E8" },
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack", "dessert"];

function dayTotal(entries: BuilderEntry[]) {
  return {
    cal: entries.reduce((s, e) => s + (e.calories ?? 0), 0),
    pro: entries.reduce((s, e) => s + (e.protein_g ?? 0), 0),
  };
}

function getIngredientEmoji(name: string): string {
  const n = name.toLowerCase();
  const q: [string, string][] = [
    ["tomato","🍅"],["chicken","🍗"],["beef","🥩"],["pork","🥩"],["fish","🐟"],["salmon","🐟"],
    ["shrimp","🦐"],["egg","🥚"],["milk","🥛"],["butter","🧈"],["cheese","🧀"],["onion","🧅"],
    ["garlic","🧄"],["carrot","🥕"],["potato","🥔"],["rice","🍚"],["pasta","🍝"],["flour","🌾"],
    ["sugar","🍬"],["salt","🧂"],["oil","🫒"],["lemon","🍋"],["orange","🍊"],["basil","🌿"],
    ["herb","🌿"],["chocolate","🍫"],["wine","🍷"],["broth","🫙"],["stock","🫙"],["honey","🍯"],
    ["mushroom","🍄"],["spinach","🥬"],["bean","🫘"],["avocado","🥑"],["corn","🌽"],
  ];
  for (const [k, e] of q) { if (n.includes(k)) return e; }
  return "🍽️";
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlanBuilder({ planId, planTitle, durationDays, dietaryFilters, nutritionalGoals, initialEntries, isPublic: initialIsPublic }: Props) {
  const [days, setDays] = useState<DayData[]>(() => {
    const dayMap = new Map<number, BuilderEntry[]>();
    for (let d = 1; d <= durationDays; d++) dayMap.set(d, []);
    initialEntries.forEach((e) => { if (dayMap.has(e.day_number)) dayMap.get(e.day_number)!.push(e); });
    return Array.from(dayMap.entries()).map(([day_number, entries]) => ({
      day_number,
      entries: entries.sort((a, b) => a.position - b.position),
      expanded: true,
      suggesting: false,
      suggestionPrompt: "",
    }));
  });

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Shopping list state
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingData, setShoppingData] = useState<ShoppingData | null>(null);
  const [shoppingSortBy, setShoppingSortBy] = useState<"category" | "meal">("category");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Recipe detail modal
  const [detailEntry, setDetailEntry] = useState<BuilderEntry | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Share state
  const [isPublic, setIsPublic] = useState(initialIsPublic ?? false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/plans/share/${planId}`
    : `/plans/share/${planId}`;

  // ── Track dirtiness ───────────────────────────────────────────────────────

  // Mark dirty on any days mutation (done inline where setDays is called)
  const markDirty = useCallback(() => setIsDirty(true), []);

  // ── Entry mutations ───────────────────────────────────────────────────────

  const addEntry = useCallback((dayNum: number, prefill?: Partial<BuilderEntry>) => {
    const entry: BuilderEntry = {
      clientId: makeId(),
      day_number: dayNum,
      meal_type: prefill?.meal_type ?? "dinner",
      recipe_title: prefill?.recipe_title ?? "",
      description: prefill?.description ?? "",
      calories: prefill?.calories ?? null,
      protein_g: prefill?.protein_g ?? null,
      recipe_id: prefill?.recipe_id ?? null,
      position: 9999,
      isEditing: !prefill?.recipe_title,
      from_database: prefill?.from_database,
    };
    setDays((prev) => prev.map((d) => d.day_number === dayNum ? { ...d, entries: [...d.entries, entry] } : d));
    markDirty();
  }, [markDirty]);

  const updateEntry = useCallback((clientId: string, patch: Partial<BuilderEntry>) => {
    setDays((prev) => prev.map((d) => ({
      ...d,
      entries: d.entries.map((e) => e.clientId === clientId ? { ...e, ...patch } : e),
    })));
    if (!("isEditing" in patch)) markDirty();
  }, [markDirty]);

  const removeEntry = useCallback((clientId: string) => {
    setDays((prev) => prev.map((d) => ({ ...d, entries: d.entries.filter((e) => e.clientId !== clientId) })));
    markDirty();
  }, [markDirty]);

  // ── Recipe detail modal ───────────────────────────────────────────────────

  async function openDetail(entry: BuilderEntry) {
    setDetailEntry(entry);
    setDetailRecipe(null);
    setDetailLoading(true);
    try {
      if (entry.recipe_id) {
        const res = await fetch(`/api/recipes/${entry.recipe_id}/detail`);
        if (res.ok) { setDetailRecipe(await res.json()); setDetailLoading(false); return; }
      }
      // Fallback: look up by title
      if (entry.recipe_title) {
        const res = await fetch(`/api/recipes/by-title?q=${encodeURIComponent(entry.recipe_title)}`);
        if (res.ok) setDetailRecipe(await res.json());
      }
    } catch { /* show fallback */ }
    setDetailLoading(false);
  }

  function closeDetail() {
    setDetailEntry(null);
    setDetailRecipe(null);
  }

  // ── AI suggest ────────────────────────────────────────────────────────────

  async function suggestForDay(dayNum: number) {
    const day = days.find((d) => d.day_number === dayNum);
    if (!day) return;
    setDays((prev) => prev.map((d) => d.day_number === dayNum ? { ...d, suggesting: true } : d));
    try {
      const res = await fetch(`/api/plans/${planId}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_number: dayNum,
          existing_titles: day.entries.map((e) => e.recipe_title),
          all_plan_titles: days.flatMap((d) => d.entries.map((e) => e.recipe_title)),
          dietary_filters: dietaryFilters,
          nutritional_goals: nutritionalGoals,
          prompt: day.suggestionPrompt,
        }),
      });
      const data = await res.json();
      if (data.suggestions?.length > 0) {
        for (const s of data.suggestions) {
          addEntry(dayNum, { meal_type: s.meal_type as MealType, recipe_title: s.recipe_title, description: s.description, calories: s.calories, from_database: s.from_database, isEditing: false });
        }
      }
    } catch { /* silent */ }
    setDays((prev) => prev.map((d) => d.day_number === dayNum ? { ...d, suggesting: false, suggestionPrompt: "" } : d));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function save() {
    setSaving(true);
    setSaveError(null);
    const allEntries = days.flatMap((d, di) => d.entries.map((e, ei) => ({ ...e, position: di * 100 + ei })));
    try {
      const res = await fetch(`/api/plans/${planId}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: allEntries }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
      setIsDirty(false);
    } catch { setSaveError("Couldn't save — try again."); }
    setSaving(false);
  }

  // ── Shopping list ─────────────────────────────────────────────────────────

  async function loadShopping() {
    setShoppingLoading(true);
    try {
      const res = await fetch(`/api/plans/${planId}/shopping`);
      const data = await res.json();
      setShoppingData(data);
      setShowShopping(true);
      // Expand all categories by default
      const cats = new Set<string>((data.missing as ShoppingIngredient[]).map((i: ShoppingIngredient) => i.category ?? "Other"));
      setExpandedCategories(cats);
    } catch { /* silent */ }
    setShoppingLoading(false);
  }

  // ── Print ─────────────────────────────────────────────────────────────────

  function printShopping() {
    if (!shoppingData) return;
    const grouped = groupByCategory(shoppingData.missing);
    const lines: string[] = [`Shopping List — ${planTitle}`, `Generated ${new Date().toLocaleDateString()}`, ""];
    for (const [cat, items] of Object.entries(grouped)) {
      lines.push(`${cat}`);
      for (const item of items) {
        const qty = item.amount ? ` (${item.amount}${item.unit ? " " + item.unit : ""})` : "";
        lines.push(`  • ${item.name}${qty}`);
      }
      lines.push("");
    }
    if (shoppingData.have.length > 0) {
      lines.push("Already in pantry:");
      for (const item of shoppingData.have) lines.push(`  ✓ ${item.name}`);
    }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Shopping List</title><style>
      body{font-family:Georgia,serif;max-width:600px;margin:40px auto;color:#3D2817;line-height:1.7}
      h1{font-size:22px;margin-bottom:4px}
      .date{color:#A69180;font-size:13px;margin-bottom:24px}
      h2{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6B5B52;margin:20px 0 6px;border-bottom:1px solid #F5E6D3;padding-bottom:4px}
      ul{margin:0 0 8px;padding:0 0 0 20px}
      li{font-size:14px;margin-bottom:3px}
      .have h2{color:#2D7A4F}
      .have li{color:#2D7A4F}
      @media print{body{margin:20px}}
    </style></head><body>
      <h1>Shopping List — ${planTitle}</h1>
      <div class="date">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
      ${Object.entries(grouped).map(([cat, items]) => `
        <h2>${cat}</h2>
        <ul>${items.map((i) => `<li>${i.name}${i.amount ? ` <span style="color:#A69180">(${i.amount}${i.unit ? " " + i.unit : ""})</span>` : ""}</li>`).join("")}</ul>
      `).join("")}
      ${shoppingData!.have.length > 0 ? `<div class="have"><h2>Already in Pantry</h2><ul>${shoppingData!.have.map((i) => `<li>${i.name}</li>`).join("")}</ul></div>` : ""}
    </body></html>`);
    win.document.close();
    win.print();
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  async function publishPlan() {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: true }),
      });
      if (res.ok) setIsPublic(true);
    } catch { /* silent */ }
    setShareLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
          style={{ background: "#C85A2F", color: "#fff" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save plan
        </button>

        <button
          onClick={showShopping ? () => setShowShopping(false) : loadShopping}
          disabled={shoppingLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border disabled:opacity-60"
          style={{ borderColor: "#C8BC9C", background: showShopping ? "#E5EDD8" : "#F5F2EC", color: "#3D5030" }}>
          {shoppingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          {showShopping ? "Hide shopping list" : "Shopping list"}
        </button>

        <button
          onClick={() => {
            if (isDirty) { setSaveError("Please save first before sharing."); return; }
            setShowShareModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border"
          style={{ borderColor: "#E8D8C0", background: "#FFF8F0", color: "#6B4020" }}>
          <Share2 className="w-4 h-4" />
          {isPublic ? "Shared" : "Share plan"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {isDirty && <span className="text-xs" style={{ color: "#A69180" }}>Unsaved changes</span>}
          {savedAt && !saveError && !isDirty && <span className="text-xs" style={{ color: "#4A6830" }}>✓ Saved {savedAt}</span>}
          {saveError && <span className="text-xs" style={{ color: "#C85A2F" }}>{saveError}</span>}
        </div>
      </div>

      {/* ── Shopping list panel ──────────────────────────────────────────── */}
      {showShopping && shoppingData && (
        <ShoppingListPanel
          data={shoppingData}
          planTitle={planTitle}
          sortBy={shoppingSortBy}
          onSortChange={setShoppingSortBy}
          expandedCategories={expandedCategories}
          onToggleCategory={(cat) => setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
          })}
          onPrint={printShopping}
          days={days}
        />
      )}

      {/* ── Day cards ────────────────────────────────────────────────────── */}
      {days.map((day) => (
        <DayCard
          key={day.day_number}
          day={day}
          onToggle={() => setDays((prev) => prev.map((d) => d.day_number === day.day_number ? { ...d, expanded: !d.expanded } : d))}
          onAddEntry={addEntry}
          onUpdateEntry={updateEntry}
          onRemoveEntry={removeEntry}
          onSuggest={suggestForDay}
          onPromptChange={(p) => setDays((prev) => prev.map((d) => d.day_number === day.day_number ? { ...d, suggestionPrompt: p } : d))}
          onOpenDetail={openDetail}
        />
      ))}

      {/* ── Recipe detail modal ──────────────────────────────────────────── */}
      {detailEntry && (
        <RecipeDetailModal
          entry={detailEntry}
          recipe={detailRecipe}
          loading={detailLoading}
          onClose={closeDetail}
        />
      )}

      {/* ── Share modal ──────────────────────────────────────────────────── */}
      {showShareModal && (
        <ShareModal
          isPublic={isPublic}
          shareUrl={shareUrl}
          loading={shareLoading}
          copied={copied}
          onPublish={publishPlan}
          onCopy={copyLink}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// ── Grouping helpers ─────────────────────────────────────────────────────────

function groupByCategory(items: ShoppingIngredient[]): Record<string, ShoppingIngredient[]> {
  const groups: Record<string, ShoppingIngredient[]> = {};
  for (const item of items) {
    const cat = item.category ?? "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  // Sort alphabetically within each category
  for (const cat of Object.keys(groups)) groups[cat].sort((a, b) => a.name.localeCompare(b.name));
  return groups;
}

function groupByMeal(items: ShoppingIngredient[]): Record<string, ShoppingIngredient[]> {
  const groups: Record<string, ShoppingIngredient[]> = {};
  for (const item of items) {
    for (const from of item.from) {
      if (!groups[from]) groups[from] = [];
      if (!groups[from].find((i) => i.name === item.name)) groups[from].push(item);
    }
  }
  return groups;
}

// ── Shopping list panel ───────────────────────────────────────────────────────

function ShoppingListPanel({ data, planTitle, sortBy, onSortChange, expandedCategories, onToggleCategory, onPrint, days }: {
  data: ShoppingData;
  planTitle: string;
  sortBy: "category" | "meal";
  onSortChange: (s: "category" | "meal") => void;
  expandedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  onPrint: () => void;
  days: DayData[];
}) {
  const [showHave, setShowHave] = useState(false);
  const grouped = sortBy === "category" ? groupByCategory(data.missing) : groupByMeal(data.missing);

  const noLinkedRecipes = data.totalRecipes === 0;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#C8BC9C" }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ background: "#F5F2EC" }}>
        <ShoppingCart className="w-4 h-4 shrink-0" style={{ color: "#3D5030" }} />
        <span className="font-bold text-sm flex-1" style={{ color: "#3D5030" }}>
          Shopping List — {planTitle}
        </span>
        {/* Sort tabs */}
        <div className="flex rounded-lg overflow-hidden border text-xs" style={{ borderColor: "#C8BC9C" }}>
          {(["category", "meal"] as const).map((s) => (
            <button key={s} onClick={() => onSortChange(s)}
              className="px-3 py-1.5 font-medium capitalize transition-colors"
              style={{ background: sortBy === s ? "#4A6830" : "#fff", color: sortBy === s ? "#fff" : "#4A6830" }}>
              by {s}
            </button>
          ))}
        </div>
        <button onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
          style={{ borderColor: "#C8BC9C", color: "#3D5030", background: "#fff" }}>
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      <div className="px-5 py-4" style={{ background: "#FAFFFE" }}>
        {/* Warning — no linked recipes */}
        {noLinkedRecipes && (
          <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl" style={{ background: "#FFFDE7" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#92400E" }} />
            <p className="text-xs" style={{ color: "#92400E" }}>
              No meals are linked to recipes in the library yet — ingredients can&apos;t be determined.
              After saving your plan, use the Suggest button to add AI-recommended recipes, or manually link meals to your saved recipes.
            </p>
          </div>
        )}

        {/* Unknown entries warning */}
        {!noLinkedRecipes && data.unknownEntries.length > 0 && (
          <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "#FFFDE7", color: "#92400E" }}>
            ⚠️ {data.unknownEntries.length} meal{data.unknownEntries.length !== 1 ? "s" : ""} without library links
            ({data.unknownEntries.slice(0, 3).map((e) => e.recipeTitle).join(", ")}{data.unknownEntries.length > 3 ? "…" : ""})
          </p>
        )}

        {/* Missing ingredients */}
        {data.missing.length === 0 && !noLinkedRecipes ? (
          <div className="flex items-center gap-2 py-2">
            <Check className="w-5 h-5" style={{ color: "#3D5030" }} />
            <span className="text-sm font-semibold" style={{ color: "#3D5030" }}>
              You have everything in your pantry!
            </span>
          </div>
        ) : data.missing.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold mb-1" style={{ color: "#6B5B52" }}>
              Need to buy — {data.missing.length} item{data.missing.length !== 1 ? "s" : ""}
            </p>
            {Object.entries(grouped).map(([groupName, items]) => (
              <div key={groupName} className="rounded-xl overflow-hidden border" style={{ borderColor: "#E8D4C0" }}>
                <button
                  onClick={() => onToggleCategory(groupName)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                  style={{ background: "#FFF8F3" }}>
                  <span className="text-xs font-semibold" style={{ color: "#6B5B52" }}>
                    {groupName} <span style={{ color: "#A69180", fontWeight: 400 }}>({items.length})</span>
                  </span>
                  {expandedCategories.has(groupName)
                    ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "#A69180" }} />
                    : <ChevronDown className="w-3.5 h-3.5" style={{ color: "#A69180" }} />}
                </button>
                {expandedCategories.has(groupName) && (
                  <ul className="divide-y" style={{ borderColor: "#F5E6D3" }}>
                    {items.map((ing) => (
                      <li key={ing.name} className="flex items-center gap-2 px-3 py-2">
                        <span className="text-base w-6 text-center">{getIngredientEmoji(ing.name)}</span>
                        <span className="text-sm flex-1 capitalize" style={{ color: "#3D2817" }}>{ing.name}</span>
                        {(ing.amount || ing.unit) && (
                          <span className="text-xs shrink-0" style={{ color: "#A69180" }}>
                            {ing.amount} {ing.unit}
                          </span>
                        )}
                        <span className="text-xs shrink-0 ml-auto" style={{ color: "#A69180", maxWidth: 120, textAlign: "right" }}>
                          {ing.from.slice(0, 2).join(", ")}{ing.from.length > 2 ? ` +${ing.from.length - 2}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Have in pantry */}
        {data.have.length > 0 && !noLinkedRecipes && (
          <div className="mt-3">
            <button onClick={() => setShowHave((v) => !v)}
              className="text-xs flex items-center gap-1 font-medium"
              style={{ color: "#4A6830" }}>
              {showHave ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Already in pantry ({data.have.length})
            </button>
            {showHave && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.have.map((ing) => (
                  <span key={ing.name} className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ background: "#E5EDD8", color: "#3D5030" }}>
                    ✓ {ing.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t" style={{ borderColor: "#C8BC9C" }}>
          <Link href="/pantry" className="text-xs font-medium" style={{ color: "#4A6830" }}>
            Manage pantry →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── DayCard ───────────────────────────────────────────────────────────────────

function DayCard({ day, onToggle, onAddEntry, onUpdateEntry, onRemoveEntry, onSuggest, onPromptChange, onOpenDetail }: {
  day: DayData;
  onToggle: () => void;
  onAddEntry: (n: number, p?: Partial<BuilderEntry>) => void;
  onUpdateEntry: (id: string, p: Partial<BuilderEntry>) => void;
  onRemoveEntry: (id: string) => void;
  onSuggest: (n: number) => void;
  onPromptChange: (p: string) => void;
  onOpenDetail: (e: BuilderEntry) => void;
}) {
  const totals = dayTotal(day.entries);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
        style={{ background: "#FFF8F3" }}>
        <span className="font-bold text-sm" style={{ color: "#3D2817" }}>Day {day.day_number}</span>
        {day.entries.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FFE4D6", color: "#C85A2F" }}>
            {day.entries.length} meal{day.entries.length !== 1 ? "s" : ""}
          </span>
        )}
        {totals.cal > 0 && (
          <span className="text-xs" style={{ color: "#A69180" }}>
            {totals.cal} kcal{totals.pro > 0 ? ` · ${totals.pro}g protein` : ""}
          </span>
        )}
        <span className="ml-auto">
          {day.expanded ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
        </span>
      </button>

      {day.expanded && (
        <div className="px-5 pb-4 pt-2 flex flex-col gap-2" style={{ background: "#FFFDF9" }}>
          {day.entries.map((entry) => (
            <EntryRow
              key={entry.clientId}
              entry={entry}
              onUpdate={(p) => onUpdateEntry(entry.clientId, p)}
              onRemove={() => onRemoveEntry(entry.clientId)}
              onOpen={() => onOpenDetail(entry)}
            />
          ))}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button onClick={() => onAddEntry(day.day_number)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "#E8D4C0", color: "#6B5B52", background: "#fff" }}>
              <Plus className="w-3.5 h-3.5" /> Add meal
            </button>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                type="text"
                value={day.suggestionPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSuggest(day.day_number)}
                placeholder="e.g. light, Italian, quick…"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border text-xs focus:outline-none"
                style={{ borderColor: "#E8D8C0", background: "#FFF8F0", color: "#3D2817" }}
              />
              <button onClick={() => onSuggest(day.day_number)} disabled={day.suggesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60"
                style={{ background: "#8C5030", color: "#fff" }}>
                {day.suggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Suggest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EntryRow ──────────────────────────────────────────────────────────────────

function EntryRow({ entry, onUpdate, onRemove, onOpen }: {
  entry: BuilderEntry;
  onUpdate: (p: Partial<BuilderEntry>) => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cfg = MEAL_TYPE_CONFIG[entry.meal_type];
  const Icon = cfg.icon;

  if (entry.isEditing) {
    return (
      <div className="rounded-xl border p-3 flex flex-col gap-2" style={{ borderColor: "#E8D4C0", background: "#fff" }}>
        <div className="flex items-center gap-2">
          <select value={entry.meal_type} onChange={(e) => onUpdate({ meal_type: e.target.value as MealType })}
            className="px-2 py-1 rounded-lg border text-xs font-medium focus:outline-none"
            style={{ borderColor: "#E8D4C0", background: cfg.bg, color: cfg.color }}>
            {MEAL_TYPES.map((t) => <option key={t} value={t}>{MEAL_TYPE_CONFIG[t].label}</option>)}
          </select>
          <input
            type="text"
            value={entry.recipe_title}
            onChange={(e) => onUpdate({ recipe_title: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && entry.recipe_title.trim()) onUpdate({ isEditing: false }); }}
            placeholder="Recipe or meal name…"
            className="flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none"
            style={{ borderColor: "#E8D4C0", color: "#3D2817" }}
            autoFocus
          />
          <button onClick={() => { if (entry.recipe_title.trim()) onUpdate({ isEditing: false }); else onRemove(); }}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "#C85A2F", color: "#fff" }}>
            Done
          </button>
          {/* No confirm needed in edit mode — entry not yet saved */}
          <button onClick={onRemove} className="shrink-0 p-1 rounded-lg" style={{ color: "#A69180" }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={entry.description ?? ""} onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Short description (optional)"
            className="flex-1 px-3 py-1 rounded-lg border text-xs focus:outline-none"
            style={{ borderColor: "#E8D4C0", color: "#3D2817" }} />
          <input type="number" value={entry.calories ?? ""} onChange={(e) => onUpdate({ calories: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="kcal" className="w-20 px-2 py-1 rounded-lg border text-xs focus:outline-none"
            style={{ borderColor: "#E8D4C0", color: "#3D2817" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onOpen}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer"
      style={{ borderColor: "#F5E6D3", background: "#fff" }}
    >
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
        style={{ background: cfg.bg, color: cfg.color }}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate" style={{ color: "#3D2817" }}>{entry.recipe_title || "Untitled"}</span>
          {entry.from_database && (
            <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "#FFF0E6", color: "#C85A2F" }}>✓ library</span>
          )}
        </div>
        {entry.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "#A69180" }}>{entry.description}</p>
        )}
      </div>
      {entry.calories && <span className="text-xs shrink-0" style={{ color: "#A69180" }}>{entry.calories} kcal</span>}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ isEditing: true }); }}
          className="p-1 rounded hover:bg-amber-50" style={{ color: "#A69180" }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
          className="p-1 rounded hover:bg-red-50" style={{ color: "#A69180" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <ConfirmDeleteDialog
        open={confirmOpen}
        title="Remove meal?"
        description={`Remove "${entry.recipe_title || "this meal"}" from the plan?`}
        confirmLabel="Remove"
        onConfirm={() => { setConfirmOpen(false); onRemove(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ── Recipe detail modal ───────────────────────────────────────────────────────

function RecipeDetailModal({ entry, recipe, loading, onClose }: {
  entry: BuilderEntry;
  recipe: RecipeDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const cfg = MEAL_TYPE_CONFIG[entry.meal_type];
  const Icon = cfg.icon;
  const totalTime = recipe ? (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0) : 0;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div
        className="relative w-full sm:max-w-xl max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: "#fff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#F5E6D3" }}>
          <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </div>
          <h2 className="flex-1 font-bold text-base leading-snug" style={{ color: "#3D2817" }}>
            {recipe?.title ?? entry.recipe_title}
          </h2>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50" style={{ color: "#A69180" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3" style={{ color: "#A69180" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading recipe…</span>
            </div>
          ) : recipe ? (
            <div className="flex flex-col gap-4">
              {/* Small image */}
              {recipe.image_url && (
                <div className="rounded-xl overflow-hidden" style={{ height: 160 }}>
                  <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Description */}
              {recipe.description && (
                <p className="text-sm leading-relaxed" style={{ color: "#6B5B52" }}>{recipe.description}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "#A69180" }}>
                {recipe.servings && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {recipe.servings} serves</span>}
                {totalTime > 0 && <span>⏱ {totalTime} min total</span>}
                {recipe.calories && <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {recipe.calories} kcal</span>}
                {recipe.protein_g && <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {recipe.protein_g}g protein</span>}
              </div>

              {/* Ingredients */}
              {(recipe.ingredients ?? []).length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: "#3D2817" }}>Ingredients</h3>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
                    {(recipe.ingredients ?? []).map((ing, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0 text-sm"
                        style={{ borderColor: "#F5E6D3" }}>
                        <span className="text-base w-6 text-center">{getIngredientEmoji(ing.name)}</span>
                        <span className="flex-1" style={{ color: "#3D2817" }}>{ing.name}</span>
                        {(ing.amount || ing.unit) && (
                          <span className="text-xs" style={{ color: "#A69180" }}>{ing.amount} {ing.unit}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions (no tips) */}
              {(recipe.instructions ?? []).length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: "#3D2817" }}>Instructions</h3>
                  <ol className="flex flex-col gap-3">
                    {(recipe.instructions ?? []).map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                          style={{ background: "#C85A2F", color: "#fff" }}>{i + 1}</span>
                        <p className="text-sm leading-relaxed flex-1" style={{ color: "#3D2817" }}>{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            /* No recipe_id or not found */
            <div className="flex flex-col gap-3">
              {entry.description && (
                <p className="text-sm leading-relaxed" style={{ color: "#6B5B52" }}>{entry.description}</p>
              )}
              {entry.calories && (
                <p className="text-sm" style={{ color: "#A69180" }}>{entry.calories} kcal</p>
              )}
              <p className="text-xs p-3 rounded-xl" style={{ background: "#FFF8F3", color: "#A69180" }}>
                This meal was added manually. Link it to a recipe in the library to see full ingredients and instructions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Share modal ───────────────────────────────────────────────────────────────

function ShareModal({ isPublic, shareUrl, loading, copied, onPublish, onCopy, onClose }: {
  isPublic: boolean;
  shareUrl: string;
  loading: boolean;
  copied: boolean;
  onPublish: () => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#fff" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F5E6D3" }}>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" style={{ color: "#6B4020" }} />
            <h2 className="font-bold text-base" style={{ color: "#3D2817" }}>Share Meal Plan</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#A69180" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {!isPublic ? (
            <>
              <div className="rounded-xl p-4 flex gap-3" style={{ background: "#FFFDE7" }}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#92400E" }} />
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#3D2817" }}>Make this plan public?</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B5B52" }}>
                    Anyone with the link will be able to view your meal plan — including the meal titles and schedule.
                    You can unpublish it any time from your plan settings.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded" />
                <span className="text-sm" style={{ color: "#3D2817" }}>
                  I understand this plan will be publicly accessible via link
                </span>
              </label>

              <button
                onClick={onPublish}
                disabled={!consented || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ background: "#8C5030", color: "#fff" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Publish & get share link
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: "#E8D8C0", background: "#FFF8F0" }}>
                <Link2 className="w-4 h-4 shrink-0" style={{ color: "#6B4020" }} />
                <span className="text-xs flex-1 truncate" style={{ color: "#6B4020" }}>{shareUrl}</span>
                <button onClick={onCopy}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: copied ? "#E5EDD8" : "#8C5030", color: copied ? "#3D5030" : "#fff" }}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : "Copy link"}
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: "#A69180" }}>
                ✓ This plan is public — anyone with the link can view it
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
