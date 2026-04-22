"use client";

import { useState, useCallback, useEffect } from "react";
import { Utensils, BookOpen, ChevronRight, SkipForward, CheckCircle2, Star, ThumbsUp, ThumbsDown, Loader2, Minus, Plus, ShoppingCart, Lightbulb, Archive, ChevronDown, PackageMinus } from "lucide-react";
import { addToShoppingList } from "@/lib/shopping-list";
import { IngredientsColumn } from "./ingredients-column";
import { SubwayRoadmap } from "@/components/subway-roadmap";
import { LivingCookbookTicker } from "@/components/living-cookbook-ticker";
import { TableStylist } from "@/components/table-stylist";
import { ZeroWasteGuide } from "@/components/zero-waste-guide";
import { AnimatedTabs, type Tab } from "@/components/ui/animated-tabs";

type Ingredient = { name: string; amount?: number | null; unit?: string | null };
type PantryItem = { id: string; name: string; quantity?: string | null };

type Phase = "cook" | "post-pantry" | "post-review" | "serve" | "restore";

interface Props {
  recipeId: string;
  initialIngredients: Ingredient[];
  initialInstructions: string[];
  sourceUrl: string | null;
  isPremium: boolean;
  pantryItems: PantryItem[];
  recipeTitle: string;
  dietaryTags: string[];
}

// ── Phase stepper ─────────────────────────────────────────────
const PHASE_STEPS: { key: Phase | "done"; roman: string; label: string; emoji: string }[] = [
  { key: "cook",         roman: "III", label: "Cook",    emoji: "🍳" },
  { key: "serve",        roman: "IV",  label: "Serve",   emoji: "🍽️" },
  { key: "restore",      roman: "V",   label: "Restore", emoji: "♻️" },
];

function phaseOrder(p: Phase): number {
  const map: Record<Phase, number> = { cook: 0, "post-pantry": 0.5, "post-review": 0.75, serve: 1, restore: 2 };
  return map[p] ?? 0;
}

function PhaseStepper({ phase, cookingDone }: { phase: Phase; cookingDone: boolean }) {
  const currentOrder = phaseOrder(phase);
  return (
    <div className="flex items-center gap-1 px-5 pt-5 pb-3">
      {PHASE_STEPS.map((step, i) => {
        const stepOrder = i;
        const isDone = currentOrder > stepOrder || (step.key === "cook" && cookingDone && phase !== "cook");
        const isCurrent = step.key === phase || (step.key === "cook" && (phase === "post-pantry" || phase === "post-review"));
        return (
          <div key={step.key} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  background: isDone
                    ? "rgba(130,142,111,0.35)"
                    : isCurrent
                      ? "var(--wc-pal-accent, #B07D56)"
                      : "rgba(42,24,8,0.5)",
                  color: isDone ? "#828E6F" : isCurrent ? "#fff" : "#5A3A28",
                  border: isCurrent ? "none" : isDone ? "1px solid rgba(130,142,111,0.3)" : "1px solid rgba(42,24,8,0.6)",
                }}
              >
                {isDone ? "✓" : step.roman}
              </div>
              <span
                className="text-xs font-semibold hidden sm:block"
                style={{ color: isDone ? "#828E6F" : isCurrent ? "var(--wc-pal-accent, #B07D56)" : "#4A3020" }}
              >
                {step.label}
              </span>
            </div>
            {i < PHASE_STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1" style={{ background: isDone ? "rgba(130,142,111,0.3)" : "rgba(42,24,8,0.4)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Post-cook: Pantry deduction ───────────────────────────────
function PantryDeductPrompt({
  ingredients,
  pantryItems,
  onDone,
  onSkip,
}: {
  ingredients: Ingredient[];
  pantryItems: PantryItem[];
  onDone: () => void;
  onSkip: () => void;
}) {
  // Match each ingredient to pantry item
  function findPantryItem(ing: Ingredient): PantryItem | null {
    const lower = ing.name.toLowerCase().trim();
    return pantryItems.find((p) => {
      const pLower = p.name.toLowerCase().trim();
      return pLower === lower || lower.includes(pLower) || pLower.includes(lower);
    }) ?? null;
  }

  // Only show ingredients that match something in pantry
  const matchedRows = ingredients
    .map((ing) => ({ ing, pantryItem: findPantryItem(ing) }))
    .filter((r) => r.pantryItem !== null);

  const [checked, setChecked] = useState<Set<string>>(
    new Set(matchedRows.map((r) => r.pantryItem!.id))
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(matchedRows.map((r) => [r.pantryItem!.id, 1]))
  );
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function adjustQty(id: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 1) + delta) }));
  }

  async function handleSubtract() {
    const toRemove = matchedRows.filter((r) => checked.has(r.pantryItem!.id));
    if (!toRemove.length) { onDone(); return; }

    setRemoving(true);
    try {
      await Promise.all(
        toRemove.map((r) =>
          fetch(`/api/pantry/items?id=${r.pantryItem!.id}`, { method: "DELETE" })
        )
      );
      setRemoved(true);
      setTimeout(onDone, 1200);
    } catch {
      setRemoving(false);
    }
  }

  if (removed) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(130,142,111,0.08)", border: "1px solid rgba(130,142,111,0.2)" }}>
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#828E6F" }} />
        <p className="text-sm font-semibold" style={{ color: "#828E6F" }}>Pantry updated!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(176,125,86,0.25)", background: "rgba(26,16,8,0.8)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(42,24,8,0.6)", background: "rgba(42,24,8,0.4)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
              Subtract used ingredients from pantry?
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
              {matchedRows.length > 0
                ? `${matchedRows.length} of your pantry items were used`
                : "No pantry items matched these ingredients"}
            </p>
          </div>
          <button onClick={onSkip} className="text-xs font-semibold hover:opacity-70 flex items-center gap-1"
            style={{ color: "#6B4E36" }}>
            <SkipForward style={{ width: 13, height: 13 }} /> Skip
          </button>
        </div>
      </div>

      {matchedRows.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-sm" style={{ color: "#6B4E36" }}>Nothing to subtract — no matches found in your pantry.</p>
          <button onClick={onSkip} className="mt-3 text-xs underline" style={{ color: "#B07D56" }}>Continue</button>
        </div>
      ) : (
        <div>
          <div className="divide-y" style={{ borderColor: "rgba(42,24,8,0.5)" }}>
            {matchedRows.map(({ ing, pantryItem }) => {
              const id = pantryItem!.id;
              const isChecked = checked.has(id);
              return (
                <div key={id} className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => toggle(id)}
                    className="shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                    style={{
                      background: isChecked ? "var(--wc-pal-accent, #B07D56)" : "rgba(42,24,8,0.6)",
                      border: `1px solid ${isChecked ? "#B07D56" : "#3A2416"}`,
                    }}
                  >
                    {isChecked && <CheckCircle2 style={{ width: 12, height: 12, color: "#fff" }} />}
                  </button>
                  <span className="flex-1 text-sm font-medium" style={{ color: isChecked ? "#EFE3CE" : "#5A3A28" }}>
                    {ing.name}
                    {pantryItem!.quantity && (
                      <span className="text-xs ml-1.5" style={{ color: "#6B4E36" }}>
                        (have: {pantryItem!.quantity})
                      </span>
                    )}
                  </span>
                  {isChecked && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => adjustQty(id, -1)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70"
                        style={{ background: "rgba(42,24,8,0.6)", border: "1px solid #3A2416" }}>
                        <Minus style={{ width: 10, height: 10, color: "#8A6A4A" }} />
                      </button>
                      <span className="text-xs font-bold w-5 text-center" style={{ color: "#B07D56" }}>
                        {quantities[id] ?? 1}
                      </span>
                      <button onClick={() => adjustQty(id, 1)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70"
                        style={{ background: "rgba(42,24,8,0.6)", border: "1px solid #3A2416" }}>
                        <Plus style={{ width: 10, height: 10, color: "#8A6A4A" }} />
                      </button>
                      <span className="text-xs" style={{ color: "#6B4E36" }}>
                        {ing.unit ?? ""}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-4 flex gap-2">
            <button
              onClick={handleSubtract}
              disabled={removing || checked.size === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
            >
              {removing ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing…</> : <>Remove {checked.size} from pantry</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post-cook: Quick review ───────────────────────────────────
function QuickReviewPrompt({
  recipeId,
  onDone,
  onSkip,
}: {
  recipeId: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [taste, setTaste] = useState<number | null>(null);
  const [wouldMakeAgain, setWouldMakeAgain] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  async function handleSubmit() {
    if (taste === null && wouldMakeAgain === null) { onDone(); return; }
    setSubmitting(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId, taste, would_make_again: wouldMakeAgain }),
      });
      setSubmitted(true);
      setTimeout(onDone, 1500);
    } catch {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(176,125,86,0.08)", border: "1px solid rgba(176,125,86,0.2)" }}>
        <Star className="w-8 h-8 mx-auto mb-2" style={{ color: "#B07D56", fill: "#B07D56" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Thanks for the review!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(176,125,86,0.2)", background: "rgba(26,16,8,0.8)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(42,24,8,0.6)", background: "rgba(42,24,8,0.3)" }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
            How did it turn out? Leave a quick review
          </p>
          <button onClick={onSkip} className="text-xs font-semibold hover:opacity-70 flex items-center gap-1"
            style={{ color: "#6B4E36" }}>
            <SkipForward style={{ width: 13, height: 13 }} /> Skip
          </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {/* Taste rating */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>Taste (1–5 stars)</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoveredStar(n)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => setTaste(n)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className="w-7 h-7"
                  fill={(hoveredStar ?? taste ?? 0) >= n ? "#C8522A" : "none"}
                  style={{ color: (hoveredStar ?? taste ?? 0) >= n ? "#C8522A" : "#3A2416" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Would make again */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>Would you make it again?</p>
          <div className="flex gap-2">
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                onClick={() => setWouldMakeAgain(v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: wouldMakeAgain === v
                    ? v ? "rgba(130,142,111,0.25)" : "rgba(200,82,42,0.2)"
                    : "rgba(42,24,8,0.5)",
                  border: `1px solid ${wouldMakeAgain === v ? (v ? "#828E6F" : "#C8522A") : "#3A2416"}`,
                  color: wouldMakeAgain === v ? (v ? "#828E6F" : "#C8522A") : "#6B4E36",
                }}
              >
                {v ? <ThumbsUp style={{ width: 14, height: 14 }} /> : <ThumbsDown style={{ width: 14, height: 14 }} />}
                {v ? "Yes!" : "Not really"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting || (taste === null && wouldMakeAgain === null)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skip/Done button row ──────────────────────────────────────
function PhaseActions({
  onDone,
  onSkip,
  doneLabel = "Done",
}: {
  onDone: () => void;
  onSkip: () => void;
  doneLabel?: string;
}) {
  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={onSkip}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
        style={{ background: "rgba(42,24,8,0.5)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.5)" }}
      >
        <SkipForward style={{ width: 14, height: 14 }} /> Skip phase
      </button>
      <button
        onClick={onDone}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
      >
        {doneLabel} <ChevronRight style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

// ── Phase header ──────────────────────────────────────────────
function PhaseHeader({ roman, label, emoji }: { roman: string; label: string; emoji: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(42,24,8,0.7)", border: "1px solid rgba(90,50,20,0.4)" }}>
        <span style={{ fontSize: "1.1rem" }}>{emoji}</span>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4A3020" }}>Phase {roman}</div>
        <div className="text-base font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          {label}
        </div>
      </div>
    </div>
  );
}


// ── Add to Pantry Storage ─────────────────────────────────────
function AddToStorageButton({ recipeTitle }: { recipeTitle: string }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      await fetch("/api/pantry/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: recipeTitle, quantity: "1 batch" }),
      });
      setSaved(true);
      setToast(true);
      setTimeout(() => setToast(false), 2800);
    } catch {
      // silently fail — pantry is non-critical here
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
          style={{
            background: "var(--wc-surface-1, #2C2724)",
            color: "var(--fg-primary, #EFE3CE)",
            border: "1px solid rgba(244,162,97,0.3)",
          }}
        >
          <Archive style={{ width: 15, height: 15, color: "var(--wc-accent-saffron, #F4A261)" }} />
          Added &quot;{recipeTitle}&quot; to your pantry!
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={saving || saved}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          background: saved ? "rgba(130,142,111,0.15)" : "var(--wc-surface-2, rgba(42,24,8,0.5))",
          border: `1px solid ${saved ? "rgba(130,142,111,0.4)" : "var(--wc-accent-saffron, #F4A261)"}`,
          color: saved ? "#828E6F" : "var(--wc-accent-saffron, #F4A261)",
        }}
      >
        {saving ? (
          <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
        ) : saved ? (
          <CheckCircle2 style={{ width: 15, height: 15 }} />
        ) : (
          <Archive style={{ width: 15, height: 15 }} />
        )}
        {saved ? "Added to pantry storage" : "Add to my pantry storage"}
      </button>
    </>
  );
}

// ── Metric/Imperial toggle ────────────────────────────────────
type UnitSystem = "metric" | "imperial";

function UnitToggle({ value, onChange }: { value: UnitSystem; onChange: (v: UnitSystem) => void }) {
  return (
    <div
      className="inline-flex items-center rounded-full p-0.5 text-xs font-semibold"
      style={{ background: "rgba(42,24,8,0.6)", border: "1px solid rgba(58,36,22,0.6)" }}
    >
      {(["metric", "imperial"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-1 rounded-full transition-all capitalize"
          style={{
            background: value === opt ? "var(--wc-pal-accent, #B07D56)" : "transparent",
            color: value === opt ? "#fff" : "#8A6A4A",
          }}
        >
          {opt === "metric" ? "Metric" : "Imperial"}
        </button>
      ))}
    </div>
  );
}

// ── Convert a single amount metric→imperial ───────────────────
function convertUnit(amount: number | null | undefined, unit: string | null | undefined, system: UnitSystem): { amount: string; unit: string } {
  const a = amount ?? 0;
  const u = (unit ?? "").toLowerCase().trim();

  if (system === "imperial") {
    if (u === "g")   return { amount: (a * 0.03527).toFixed(1), unit: "oz" };
    if (u === "kg")  return { amount: (a * 2.205).toFixed(2),   unit: "lb" };
    if (u === "ml")  return { amount: (a * 0.03381).toFixed(1), unit: "fl oz" };
    if (u === "l")   return { amount: (a * 33.81).toFixed(1),   unit: "fl oz" };
  }
  return { amount: a > 0 ? String(a) : "", unit: unit ?? "" };
}

// ── Interactive ingredient checklist (no DB, useState only) ─────
function InteractiveIngredients({
  ingredients,
  unitSystem,
  pantryItems,
  recipeTitle,
}: {
  ingredients: Ingredient[];
  unitSystem: UnitSystem;
  pantryItems: PantryItem[];
  recipeTitle: string;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const allChecked = ingredients.length > 0 && checked.size === ingredients.length;

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function isPantryMatch(name: string): boolean {
    const lower = name.toLowerCase().trim();
    return pantryItems.some((p) => {
      const pLower = p.name.toLowerCase().trim();
      return pLower === lower || lower.includes(pLower) || pLower.includes(lower);
    });
  }

  function showToast(msg: string) {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 2600);
  }

  function handleAddAll() {
    const converted = ingredients.map((ing) => {
      const c = convertUnit(ing.amount, ing.unit, unitSystem);
      return { name: ing.name, amount: c.amount, unit: c.unit, recipeTitle };
    });
    addToShoppingList(converted);
    showToast(`${ingredients.length} ingredients added to your list`);
  }

  function handleAddMissing() {
    const missing = ingredients.filter((ing) => !isPantryMatch(ing.name));
    if (missing.length === 0) { showToast("Nothing missing — all ingredients are in your pantry!"); return; }
    const converted = missing.map((ing) => {
      const c = convertUnit(ing.amount, ing.unit, unitSystem);
      return { name: ing.name, amount: c.amount, unit: c.unit, recipeTitle };
    });
    addToShoppingList(converted);
    showToast(`${missing.length} missing ingredient${missing.length !== 1 ? "s" : ""} added`);
  }

  return (
    <>
      {/* Toast */}
      {addedToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: "var(--wc-surface-1, #2C2724)", color: "#EFE3CE", border: "1px solid rgba(244,162,97,0.3)" }}
        >
          <ShoppingCart style={{ width: 15, height: 15, color: "#F4A261" }} />
          {addedToast}
        </div>
      )}

      {/* Count + collapse toggle row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>
          {allChecked ? "All done!" : `${checked.size}/${ingredients.length} checked`}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#6B4E36" }}
        >
          <ChevronDown
            style={{
              width: 14, height: 14,
              transition: "transform 0.2s ease",
              transform: collapsed ? "rotate(-90deg)" : "none",
            }}
          />
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {/* Shopping list action buttons */}
      {!collapsed && (
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleAddAll}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: "rgba(42,24,8,0.6)", color: "var(--wc-pal-accent, #B07D56)", border: "1px solid rgba(58,36,22,0.6)" }}
          >
            <ShoppingCart style={{ width: 11, height: 11 }} /> Add all to list
          </button>
          <button
            type="button"
            onClick={handleAddMissing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: "rgba(42,24,8,0.6)", color: "#828E6F", border: "1px solid rgba(58,36,22,0.6)" }}
          >
            <PackageMinus style={{ width: 11, height: 11 }} /> Add missing
          </button>
        </div>
      )}

      {/* Collapsable ingredient list */}
      {!collapsed && (
        allChecked ? (
          <div
            className="rounded-xl px-4 py-5 flex flex-col items-center gap-2 text-center"
            style={{ background: "var(--wc-surface-2, rgba(42,24,8,0.5))", border: "1px solid rgba(130,142,111,0.3)" }}
          >
            <CheckCircle2 style={{ width: 28, height: 28, color: "#828E6F" }} />
            <p className="text-sm font-semibold" style={{ color: "#828E6F" }}>All done!</p>
            <button
              type="button"
              onClick={() => setChecked(new Set())}
              className="text-xs underline opacity-60 hover:opacity-100"
              style={{ color: "var(--wc-pal-accent, #B07D56)" }}
            >
              Reset
            </button>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {ingredients.map((ing, i) => {
              const isChecked = checked.has(i);
              const converted = convertUnit(ing.amount, ing.unit, unitSystem);
              const label = [converted.amount, converted.unit, ing.name].filter(Boolean).join(" ");
              const inPantry = isPantryMatch(ing.name);

              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex items-start gap-3 w-full text-left transition-opacity"
                    style={{ opacity: isChecked ? 0.45 : 1 }}
                  >
                    <span
                      className="shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5 transition-all"
                      style={{
                        background: isChecked ? "var(--wc-pal-accent, #B07D56)" : "rgba(42,24,8,0.5)",
                        border: `1.5px solid ${isChecked ? "var(--wc-pal-accent, #B07D56)" : "#3A2416"}`,
                      }}
                    >
                      {isChecked && (
                        <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: isChecked ? "#5A3A28" : "var(--wc-text, #EFE3CE)",
                        lineHeight: 1.5,
                        flex: 1,
                        textDecoration: isChecked ? "line-through" : "none",
                      }}
                    >
                      {label}
                    </span>
                    {inPantry && !isChecked && (
                      <span
                        className="shrink-0 text-xs px-1.5 py-0.5 rounded-full mt-0.5"
                        style={{ background: "rgba(130,142,111,0.15)", color: "#828E6F", fontSize: "0.6rem", fontWeight: 700 }}
                      >
                        pantry
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )
      )}
    </>
  );
}

// ── Numbered instruction steps with inline Pro-Tips ───────────
const PRO_TIP_KEYWORDS = [
  { pattern: /\b(sear|searing)\b/i, tip: "Pat dry before searing — moisture is the enemy of a good crust." },
  { pattern: /\b(season|seasoning)\b/i, tip: "Season in layers, not just at the end." },
  { pattern: /\b(rest(ing)?)\b/i, tip: "Resting allows juices to redistribute — don't skip it." },
  { pattern: /\b(emulsify|emulsion)\b/i, tip: "Add oil in a thin stream while whisking to achieve a stable emulsion." },
  { pattern: /\b(fold(ing)?)\b/i, tip: "Fold gently from the bottom up to preserve air in the batter." },
  { pattern: /\b(carameli[sz]e)\b/i, tip: "Don't rush caramelization — medium-low heat and patience." },
  { pattern: /\b(deglaze)\b/i, tip: "Cold liquid into a hot pan makes the fond release — all that flavour is gold." },
  { pattern: /\b(bloom(ing)?)\b/i, tip: "Blooming spices in fat unlocks fat-soluble flavour compounds." },
];

function getProTip(step: string): string | null {
  for (const { pattern, tip } of PRO_TIP_KEYWORDS) {
    if (pattern.test(step)) return tip;
  }
  return null;
}

// ── Chef Tip box ─────────────────────────────────────────────
function ChefTipBox({ tip }: { tip: string }) {
  return (
    <div
      className="flex items-start gap-2 mt-2 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
      style={{
        background: "var(--wc-surface-2, #3A3430)",
        borderLeft: "3px solid var(--wc-accent-saffron, #F4A261)",
      }}
    >
      <Lightbulb style={{ width: 13, height: 13, color: "var(--wc-accent-saffron, #F4A261)", flexShrink: 0, marginTop: 1 }} />
      <span style={{ color: "var(--fg-secondary, #e7e7e6)" }}>
        <strong style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>Chef tip:</strong> {tip}
      </span>
    </div>
  );
}

function NumberedInstructions({
  instructions,
  onComplete,
}: {
  instructions: string[];
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const allDone = currentStep >= instructions.length;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#4A3020" }}>
          Instructions
        </h3>
        {!allDone && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(42,24,8,0.6)", color: "var(--wc-pal-accent, #B07D56)" }}>
            Step {currentStep + 1} / {instructions.length}
          </span>
        )}
      </div>

      <ol className="flex flex-col gap-3">
        {instructions.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          const tip = getProTip(step);

          return (
            <li
              key={i}
              className="flex gap-3 rounded-xl transition-all"
              style={{
                opacity: isDone ? 0.45 : 1,
                // Focus mode: active step gets saffron left border + surface-2 bg + padding
                borderLeft: isActive ? "3px solid var(--wc-accent-saffron, #F4A261)" : "3px solid transparent",
                background: isActive ? "var(--wc-surface-2, rgba(58,52,48,0.7))" : "transparent",
                padding: isActive ? "12px 12px 12px 12px" : "4px 4px 4px 4px",
              }}
            >
              {/* Step number bubble */}
              <button
                type="button"
                onClick={() => setCurrentStep(i)}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-all"
                style={{
                  background: isDone
                    ? "rgba(130,142,111,0.3)"
                    : isActive
                      ? "var(--wc-accent-saffron, #F4A261)"
                      : "rgba(42,24,8,0.6)",
                  color: isDone ? "#828E6F" : isActive ? "#1a1208" : "#5A3A28",
                  border: isDone ? "1px solid rgba(130,142,111,0.3)" : isActive ? "none" : "1px solid #3A2416",
                  cursor: "pointer",
                }}
                aria-label={isDone ? `Go back to step ${i + 1}` : `Jump to step ${i + 1}`}
              >
                {isDone ? (
                  <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#828E6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isActive ? "var(--fg-primary, #EFE3CE)" : "#8A6A4A",
                    lineHeight: 1.75,
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {step}
                </p>

                {/* Chef Tip — shown inline on active step */}
                {tip && isActive && <ChefTipBox tip={tip} />}

                {/* Next/Done button on active step */}
                {isActive && (
                  <button
                    type="button"
                    onClick={() => {
                      if (i + 1 >= instructions.length) {
                        setCurrentStep(instructions.length);
                        onComplete();
                      } else {
                        setCurrentStep(i + 1);
                      }
                    }}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                    style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}
                  >
                    {i + 1 >= instructions.length ? "Done cooking" : `Next: Step ${i + 2}`}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(130,142,111,0.12)", border: "1px solid rgba(130,142,111,0.2)" }}>
          <CheckCircle2 style={{ width: 18, height: 18, color: "#828E6F", flexShrink: 0 }} />
          <p className="text-sm font-semibold" style={{ color: "#828E6F" }}>All steps complete!</p>
        </div>
      )}
    </div>
  );
}

// ── Split instructions into labelled phases for tabs ─────────
function splitIntoPhaseTabs(instructions: string[], onComplete: () => void): Tab[] {
  if (instructions.length <= 4) {
    return [{
      id: "cook",
      label: "🍳 Cook",
      content: <NumberedInstructions instructions={instructions} onComplete={onComplete} />,
    }];
  }

  const PREP_KEYWORDS = /\b(prepare|prep|chop|dice|slice|mince|peel|wash|rinse|marinate|season|mix|combine|measure|gather|cut|trim|soak)\b/i;
  const FINISH_KEYWORDS = /\b(rest|serve|plate|garnish|top with|finish|drizzle|sprinkle|present|enjoy|transfer to plate)\b/i;

  const prepSteps: string[] = [];
  const cookSteps: string[] = [];
  const finishSteps: string[] = [];

  instructions.forEach(step => {
    if (FINISH_KEYWORDS.test(step)) finishSteps.push(step);
    else if (PREP_KEYWORDS.test(step) && cookSteps.length === 0) prepSteps.push(step);
    else cookSteps.push(step);
  });

  // If auto-split produced empty buckets, fall back to rough thirds
  if (cookSteps.length === 0) {
    const third = Math.ceil(instructions.length / 3);
    prepSteps.splice(0, prepSteps.length, ...instructions.slice(0, third));
    cookSteps.push(...instructions.slice(third, third * 2));
    finishSteps.splice(0, finishSteps.length, ...instructions.slice(third * 2));
  }

  const tabs: Tab[] = [];
  if (prepSteps.length > 0) {
    tabs.push({
      id: "prep",
      label: "🥣 Prep",
      content: <NumberedInstructions instructions={prepSteps} onComplete={() => {}} />,
    });
  }
  if (cookSteps.length > 0) {
    tabs.push({
      id: "cook",
      label: "🍳 Cook",
      content: (
        <NumberedInstructions
          instructions={cookSteps}
          onComplete={finishSteps.length === 0 ? onComplete : () => {}}
        />
      ),
    });
  }
  if (finishSteps.length > 0) {
    tabs.push({
      id: "finish",
      label: "✨ Finish",
      content: <NumberedInstructions instructions={finishSteps} onComplete={onComplete} />,
    });
  }
  return tabs;
}

// ── Main component ────────────────────────────────────────────
export function RecipeColumnsClient({
  recipeId,
  initialIngredients,
  initialInstructions,
  sourceUrl,
  isPremium,
  pantryItems,
  recipeTitle,
  dietaryTags,
}: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [instructions, setInstructions] = useState<string[]>(initialInstructions);
  const [phase, setPhase] = useState<Phase>("cook");
  const [cookingDone, setCookingDone] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  function handleExtracted(recipe: Record<string, unknown>) {
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      setIngredients(recipe.ingredients as Ingredient[]);
    }
    if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
      setInstructions(recipe.instructions as string[]);
    }
  }

  const handleCookingComplete = useCallback(() => {
    setCookingDone(true);
    setPhase("post-pantry");
  }, []);

  return (
    <div
      className="flex"
      style={{
        minHeight: "calc(100vh - 96px)",
        alignItems: "flex-start",
      }}
    >
      {/* ── INGREDIENTS PANEL (left half of right side) ── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: "38%",
          minWidth: 240,
          borderRight: "1px solid rgba(42,24,8,0.5)",
          background: "rgba(18,12,7,0.4)",
          overflowY: "auto",
          maxHeight: "calc(100vh - 96px)",
          position: "sticky",
          top: 0,
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(42,24,8,0.7)", border: "1px solid rgba(90,50,20,0.4)" }}>
              <Utensils style={{ width: 15, height: 15, color: "var(--wc-pal-accent, #B07D56)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4A3020" }}>Phase II</div>
              <div className="text-base font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                Ingredients
              </div>
            </div>
            {/* Metric / Imperial toggle */}
            <UnitToggle value={unitSystem} onChange={setUnitSystem} />
          </div>

          {/* Interactive ingredient checklist */}
          {ingredients.length > 0 ? (
            <InteractiveIngredients
              ingredients={ingredients}
              unitSystem={unitSystem}
              pantryItems={pantryItems}
              recipeTitle={recipeTitle}
            />
          ) : (
            <IngredientsColumn
              recipeId={recipeId}
              initialIngredients={ingredients}
              sourceUrl={sourceUrl}
              isPremium={isPremium}
              onExtracted={handleExtracted}
              pantryItems={pantryItems}
            />
          )}
        </div>
      </div>

      {/* ── INSTRUCTIONS + PHASE RUNNER (right half) ── */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{
          background: "rgba(22,14,8,0.3)",
          overflowY: "auto",
          maxHeight: "calc(100vh - 96px)",
        }}
      >
        {/* Phase progress stepper */}
        <PhaseStepper phase={phase} cookingDone={cookingDone} />

        <div className="p-5 pt-2">
          {/* ── Phase III: Cook — numbered steps with Pro-Tips ── */}
          {(phase === "cook" || phase === "post-pantry" || phase === "post-review") && (
            <div>
              {phase === "cook" && (
                <>
                  <LivingCookbookTicker />
                  {instructions.length > 0 ? (
                    <AnimatedTabs
                      tabs={splitIntoPhaseTabs(instructions, handleCookingComplete)}
                      className="mt-4"
                    />
                  ) : (
                    <div className="rounded-xl p-8 text-center mt-4"
                      style={{ background: "rgba(26,16,8,0.5)", border: "1px dashed rgba(42,24,8,0.7)" }}>
                      <BookOpen style={{ width: 32, height: 32, margin: "0 auto 12px", color: "#3A2416" }} />
                      <p className="text-base font-medium mb-2" style={{ color: "#6B4E36" }}>No instructions yet</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#4A3020" }}>
                        Use the <strong style={{ color: "#6B4E36" }}>Extract ingredients</strong> button in the Ingredients panel.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Post-cook: Pantry deduction */}
              {phase === "post-pantry" && (
                <div className="space-y-4">
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: "rgba(130,142,111,0.12)", border: "1px solid rgba(130,142,111,0.2)" }}>
                    <CheckCircle2 style={{ width: 18, height: 18, color: "#828E6F", flexShrink: 0 }} />
                    <p className="text-sm font-semibold" style={{ color: "#828E6F" }}>Cooking complete!</p>
                  </div>
                  <PantryDeductPrompt
                    ingredients={ingredients}
                    pantryItems={pantryItems}
                    onDone={() => setPhase("post-review")}
                    onSkip={() => setPhase("post-review")}
                  />
                  {/* Store leftovers */}
                  <AddToStorageButton recipeTitle={recipeTitle} />
                </div>
              )}

              {/* Post-cook: Quick review */}
              {phase === "post-review" && (
                <div className="space-y-4">
                  <QuickReviewPrompt
                    recipeId={recipeId}
                    onDone={() => setPhase("serve")}
                    onSkip={() => setPhase("serve")}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Phase IV: Serve ── */}
          {phase === "serve" && (
            <div>
              <PhaseHeader roman="IV" label="Serve" emoji="🍽️" />
              <TableStylist title={recipeTitle} dietaryTags={dietaryTags} />
              <PhaseActions
                onDone={() => setPhase("restore")}
                onSkip={() => setPhase("restore")}
                doneLabel="Proceed to Restore"
              />
            </div>
          )}

          {/* ── Phase V: Restore ── */}
          {phase === "restore" && ingredients.length > 0 && (
            <div>
              <PhaseHeader roman="V" label="Restore" emoji="♻️" />
              <ZeroWasteGuide title={recipeTitle} ingredients={ingredients} />
              <PhaseActions
                onDone={() => {}}
                onSkip={() => {}}
                doneLabel="All done!"
              />
            </div>
          )}
          {phase === "restore" && ingredients.length === 0 && (
            <div>
              <PhaseHeader roman="V" label="Restore" emoji="♻️" />
              <div className="rounded-xl p-6 text-center" style={{ background: "rgba(26,16,8,0.5)", border: "1px dashed rgba(42,24,8,0.7)" }}>
                <p className="text-sm" style={{ color: "#6B4E36" }}>No ingredients to restore — add ingredients first.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
