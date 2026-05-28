"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Utensils, BookOpen, ChevronLeft, ChevronRight, SkipForward, CheckCircle2, Star, ThumbsUp, ThumbsDown, Loader2, Minus, Plus, ShoppingCart, Lightbulb, Archive, ChevronDown, PackageMinus, Users, AlertTriangle, Send, RefreshCw } from "lucide-react";
import { addToShoppingList } from "@/lib/shopping-list";
import { IngredientsColumn } from "./ingredients-column";
import { useCookingMode } from "@/lib/cooking-mode-context";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { adaptIngredients, DIETARY_LABELS, DIETARY_COLORS } from "@/lib/dietary-substitutions";
import { useRouter } from "next/navigation";
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
  baseServings?: number | null;
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

function PhaseStepper({ phase, cookingDone, onPhaseClick }: { phase: Phase; cookingDone: boolean; onPhaseClick: (p: Phase) => void }) {
  const currentOrder = phaseOrder(phase);
  return (
    <div className="flex items-center px-5 pt-5 pb-3">
      {PHASE_STEPS.map((step, i) => {
        const stepOrder = i;
        const isDone = currentOrder > stepOrder || (step.key === "cook" && cookingDone && phase !== "cook");
        const isCurrent = step.key === phase || (step.key === "cook" && (phase === "post-pantry" || phase === "post-review"));
        return (
          <div key={step.key} className="flex items-center flex-1">
            <button
              onClick={() => step.key !== "done" && onPhaseClick(step.key as Phase)}
              className="flex items-center gap-2 flex-1 justify-center rounded-full transition-all"
              style={{
                background: isCurrent ? "rgba(244,162,97,0.16)" : "transparent",
                border: isCurrent ? "1px solid rgba(244,162,97,0.45)" : "1px solid transparent",
                padding: "6px 12px",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  background: isDone
                    ? "#828E6F"
                    : isCurrent
                      ? "var(--wc-accent-saffron, #F4A261)"
                      : "transparent",
                  color: isDone || isCurrent ? "#1A0E04" : "#A8845E",
                  border: isDone || isCurrent ? "none" : "1.5px solid rgba(168,132,94,0.5)",
                }}
              >
                {isDone ? "✓" : step.roman}
              </div>
              <span
                className="text-sm font-semibold min-w-0 truncate"
                style={{ color: isDone ? "#828E6F" : isCurrent ? "var(--wc-accent-saffron, #F4A261)" : "#A8845E" }}
              >
                {step.label}
              </span>
            </button>
            {i < PHASE_STEPS.length - 1 && (
              <div className="h-[2px] mx-2 shrink-0 rounded-full" style={{ width: 28, background: isDone ? "#828E6F" : "rgba(168,132,94,0.3)" }} />
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
  const [toast, setToast] = useState(false);

  function handleAdd() {
    const STORAGE_KEY = "wc_leftover_storage_v1";
    const item = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      name: recipeTitle,
      storedAt: new Date().toISOString(),
      storageType: "fridge" as const,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: unknown[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...existing]));
    } catch {
      // localStorage unavailable — silently skip
    }
    setSaved(true);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  }

  return (
    <>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
          style={{
            zIndex: 9999,
            background: "var(--wc-surface-1, #2C2724)",
            color: "#EFE3CE",
            border: "1px solid rgba(244,162,97,0.3)",
          }}
        >
          <Archive style={{ width: 15, height: 15, color: "#F4A261" }} />
          <span>Stored!</span>
          <a href="/pantry?tab=leftovers" className="underline font-bold" style={{ color: "#F4A261" }}>
            View in Pantry →
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={saved}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          background: saved ? "rgba(130,142,111,0.15)" : "var(--wc-surface-2, rgba(42,24,8,0.5))",
          border: `1px solid ${saved ? "rgba(130,142,111,0.4)" : "var(--wc-accent-saffron, #F4A261)"}`,
          color: saved ? "#828E6F" : "var(--wc-accent-saffron, #F4A261)",
        }}
      >
        {saved ? (
          <CheckCircle2 style={{ width: 15, height: 15 }} />
        ) : (
          <Archive style={{ width: 15, height: 15 }} />
        )}
        {saved ? "Stored in pantry" : "Store leftovers"}
      </button>
    </>
  );
}

// ── Serving size multiplier ───────────────────────────────────
function ServingControl({
  base,
  current,
  onChange,
}: {
  base: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full p-0.5" style={{ background: "rgba(42,24,8,0.6)", border: "1px solid rgba(58,36,22,0.6)" }}>
      <button
        type="button"
        aria-label="Fewer servings"
        onClick={() => onChange(Math.max(1, current - 1))}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ background: current === base ? "transparent" : "rgba(176,125,86,0.2)" }}
      >
        <Minus style={{ width: 10, height: 10, color: "#8A6A4A" }} />
      </button>
      <div className="flex items-center gap-1 px-1">
        <Users style={{ width: 11, height: 11, color: "var(--wc-pal-accent, #B07D56)" }} />
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--wc-pal-accent, #B07D56)", minWidth: "1.5ch", textAlign: "center" }}>
          {current}
        </span>
      </div>
      <button
        type="button"
        aria-label="More servings"
        onClick={() => onChange(Math.min(99, current + 1))}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ background: current === base ? "transparent" : "rgba(176,125,86,0.2)" }}
      >
        <Plus style={{ width: 10, height: 10, color: "#8A6A4A" }} />
      </button>
    </div>
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
  multiplier,
  pantryItems,
  recipeTitle,
}: {
  ingredients: Ingredient[];
  unitSystem: UnitSystem;
  multiplier: number;
  pantryItems: PantryItem[];
  recipeTitle: string;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const { restrictions, active } = useDietaryMode();

  // Build adapted ingredient map: index → { replacement, note, confidence, restriction }
  const adaptedMap = useMemo(() => {
    if (!active || restrictions.length === 0) return new Map<number, { replacement: string; note?: string; confidence: number; restriction: string }>();
    const map = new Map<number, { replacement: string; note?: string; confidence: number; restriction: string }>();
    for (const r of restrictions) {
      const result = adaptIngredients(ingredients, r);
      result.ingredients.forEach((adapted, i) => {
        if (adapted.adapted && !map.has(i) && adapted.replacement) {
          map.set(i, { replacement: adapted.replacement, note: adapted.note, confidence: adapted.confidence ?? 0.5, restriction: r });
        }
      });
    }
    return map;
  }, [ingredients, restrictions, active]);

  const adaptedCount = adaptedMap.size;
  const avgConfidence = adaptedCount > 0
    ? Array.from(adaptedMap.values()).reduce((a, b) => a + b.confidence, 0) / adaptedCount
    : 1;
  const confidenceLabel = adaptedCount === 0 ? "none" : avgConfidence >= 0.85 ? "high" : avgConfidence >= 0.65 ? "medium" : "low";
  const primaryRestriction = restrictions[0];
  const dietaryColor = primaryRestriction ? DIETARY_COLORS[primaryRestriction] : { color: "#C8522A", bg: "#2A1808" };

  const allChecked = ingredients.length > 0 && checked.size === ingredients.length;

  // Auto-collapse after a brief celebration delay when all items are checked
  useEffect(() => {
    if (!allChecked) return;
    const t = setTimeout(() => setCollapsed(true), 1400);
    return () => clearTimeout(t);
  }, [allChecked]);

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
      const c = convertUnit((ing.amount ?? 0) * multiplier, ing.unit, unitSystem);
      return { name: ing.name, amount: c.amount, unit: c.unit, recipeTitle };
    });
    addToShoppingList(converted);
    showToast(`${ingredients.length} ingredients added to your list`);
  }

  function handleAddMissing() {
    const missing = ingredients.filter((ing) => !isPantryMatch(ing.name));
    if (missing.length === 0) { showToast("Nothing missing — all ingredients are in your pantry!"); return; }
    const converted = missing.map((ing) => {
      const c = convertUnit((ing.amount ?? 0) * multiplier, ing.unit, unitSystem);
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

      {/* Dietary adaptation banner */}
      {active && adaptedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
          style={{ background: dietaryColor.bg }}>
          <RefreshCw style={{ width: 13, height: 13, color: dietaryColor.color, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold" style={{ color: dietaryColor.color }}>
              {restrictions.map((r) => DIETARY_LABELS[r]).join(" + ")} — {adaptedCount} ingredient{adaptedCount !== 1 ? "s" : ""} swapped
            </span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: confidenceLabel === "high" ? "#DCFCE7" : confidenceLabel === "medium" ? "#FEF3C7" : "#FEE2E2",
              color: confidenceLabel === "high" ? "#16a34a" : confidenceLabel === "medium" ? "#D97706" : "#DC2626",
            }}
          >
            {confidenceLabel === "high" ? "High" : confidenceLabel === "medium" ? "Med" : "Low"} confidence
          </span>
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
              const scaled = ing.amount != null ? ing.amount * multiplier : ing.amount;
              const converted = convertUnit(scaled, ing.unit, unitSystem);
              const amountStr = [converted.amount, converted.unit].filter(Boolean).join(" ");
              const inPantry = isPantryMatch(ing.name);
              const swap = adaptedMap.get(i);

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
                    <span className="flex-1 min-w-0" style={{ lineHeight: 1.5 }}>
                      {swap ? (
                        <>
                          {/* Original crossed out */}
                          <span style={{ fontSize: "0.72rem", color: "#6B4E36", textDecoration: "line-through", display: "block" }}>
                            {[amountStr, ing.name].filter(Boolean).join(" ")}
                          </span>
                          {/* Replacement */}
                          <span style={{ fontSize: "0.82rem", color: "#828E6F", fontWeight: 600, display: "block" }}>
                            {[amountStr, swap.replacement].filter(Boolean).join(" ")}
                          </span>
                          {/* Note + confidence */}
                          <span className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {swap.note && (
                              <span style={{ fontSize: "0.65rem", color: "#8A6A4A" }}>{swap.note}</span>
                            )}
                            <span
                              style={{
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                padding: "1px 5px",
                                borderRadius: 99,
                                background: swap.confidence >= 0.85 ? "#DCFCE7" : swap.confidence >= 0.65 ? "#FEF3C7" : "#FEE2E2",
                                color: swap.confidence >= 0.85 ? "#16a34a" : swap.confidence >= 0.65 ? "#D97706" : "#DC2626",
                              }}
                            >
                              {Math.round(swap.confidence * 100)}% match
                            </span>
                          </span>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: isChecked ? "#5A3A28" : "var(--wc-text, #EFE3CE)",
                            textDecoration: isChecked ? "line-through" : "none",
                          }}
                        >
                          {[amountStr, ing.name].filter(Boolean).join(" ")}
                        </span>
                      )}
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

// ── Inline SOS Helper — scoped to one instruction step ────────
function InlineSOSHelper({ stepText }: { stepText: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: text.trim() }, { role: "assistant", text: "" }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), stepContext: stepText }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((m) => {
          const updated = [...m];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + chunk };
          return updated;
        });
      }
    } catch {
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { role: "assistant", text: "Something went wrong. Try again." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  const QUICK = ["This step isn't working", "Substitute an ingredient", "How do I know it's done?"];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ask The Kitchen Oracle for help with this step"
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ background: "rgba(200,82,42,0.12)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.25)" }}
      >
        <AlertTriangle style={{ width: 11, height: 11 }} />
        SOS Helper
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(200,82,42,0.3)", background: "#1A0C06" }}>
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(200,82,42,0.15)", borderBottom: "1px solid rgba(200,82,42,0.2)" }}>
        <span className="text-xs font-bold" style={{ color: "#C8522A" }}>🆘 SOS — step context loaded</span>
        <button type="button" onClick={() => setOpen(false)} className="text-xs hover:opacity-70" style={{ color: "#6B4E36" }}>✕</button>
      </div>

      <div className="px-3 py-2 space-y-2 overflow-y-auto" style={{ maxHeight: 180, minHeight: 48 }}>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK.map((p) => (
              <button key={p} type="button" onClick={() => send(p)}
                className="text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "rgba(42,24,8,0.7)", color: "#8A6A4A", border: "1px solid #3A2416" }}>
                {p}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && <span className="text-sm mr-1.5 shrink-0 mt-0.5">👨‍🍳</span>}
            <div className="rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[90%]"
              style={{
                background: msg.role === "user" ? "#C85A2F" : "rgba(42,24,8,0.8)",
                color: msg.role === "user" ? "#fff" : "#C8A882",
                borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
              }}>
              {msg.text || (
                <span className="flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-1.5 px-3 pb-3 pt-1.5" style={{ borderTop: "1px solid rgba(42,24,8,0.5)" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="What's going wrong?"
          className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
          style={{ background: "rgba(42,24,8,0.8)", color: "#EFE3CE", border: "1px solid #3A2416" }}
        />
        <button type="button" onClick={() => send(input)} disabled={!input.trim() || loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
          style={{ background: "#C85A2F", color: "#fff" }}>
          <Send style={{ width: 11, height: 11 }} />
        </button>
      </div>
    </div>
  );
}

// ── Mobile-only bullet list instructions ─────────────────────
function MobileBulletInstructions({ instructions }: { instructions: string[] }) {
  return (
    <ol className="flex flex-col gap-4 mt-4">
      {instructions.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
            style={{
              background: "rgba(244,162,97,0.15)",
              color: "#F4A261",
              border: "1px solid rgba(244,162,97,0.3)",
            }}
          >
            {i + 1}
          </span>
          <p className="flex-1 text-sm leading-relaxed" style={{ color: "#C8B49A", lineHeight: 1.8 }}>
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Derive a short display title from the first verb phrase of a step. */
function stepTitle(text: string): string {
  // Take first sentence or up to 6 words, whichever is shorter
  const first = text.split(/[.,;]/)[0].trim();
  const words = first.split(/\s+/);
  return words.slice(0, 6).join(" ");
}

function NumberedInstructions({
  instructions,
  onComplete,
  onStepChange,
}: {
  instructions: string[];
  onComplete: () => void;
  onStepChange?: (text: string) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const allDone = currentStep >= instructions.length;

  function goToStep(i: number) {
    setCurrentStep(i);
    onStepChange?.(instructions[i] ?? "");
  }

  const step = instructions[currentStep] ?? "";
  const tip = allDone ? null : getProTip(step);

  return (
    <div className="mt-4 flex flex-col" style={{ minHeight: 320 }}>
      {/* Step pill + counter row */}
      <div className="flex items-center justify-between mb-6">
        {!allDone && (
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: "rgba(180,90,40,0.18)", color: "#C8522A", letterSpacing: "0.12em" }}
          >
            Step {currentStep + 1}
          </span>
        )}
        {!allDone && (
          <span className="text-xs font-semibold" style={{ color: "#5A3A28" }}>
            {currentStep + 1} / {instructions.length}
          </span>
        )}
      </div>

      {allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <CheckCircle2 style={{ width: 36, height: 36, color: "#828E6F" }} />
          <p className="text-lg font-bold" style={{ color: "#828E6F", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            All steps complete!
          </p>
        </div>
      ) : (
        <div className="flex-1">
          {/* Big editorial heading */}
          <h2
            className="font-bold leading-tight mb-4"
            style={{
              color: "#EFE3CE",
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              lineHeight: 1.15,
            }}
          >
            {stepTitle(step)}
          </h2>

          {/* Full step body */}
          <p
            className="leading-relaxed mb-5"
            style={{ color: "#B09070", fontSize: "0.95rem", lineHeight: 1.8 }}
          >
            {step}
          </p>

          {tip && <ChefTipBox tip={tip} />}
          <InlineSOSHelper stepText={step} />
        </div>
      )}

      {/* Prev / Next bar */}
      <div
        className="cook-next-bar"
        style={{ backdropFilter: "blur(10px)", marginTop: "1.5rem" }}
      >
        <button
          type="button"
          onClick={() => goToStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all hover:brightness-125 disabled:opacity-25"
          style={{ background: "rgba(244,162,97,0.12)", color: "#D4956A", border: "1.5px solid rgba(244,162,97,0.35)", minWidth: 72 }}
        >
          <ChevronLeft style={{ width: 13, height: 13 }} /> Prev
        </button>
        <button
          type="button"
          onClick={() => {
            if (currentStep + 1 >= instructions.length) {
              setCurrentStep(instructions.length);
              onStepChange?.("");
              onComplete();
            } else {
              goToStep(currentStep + 1);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1A0E04" }}
        >
          {currentStep + 1 >= instructions.length ? "All Done!" : "Next Step"}
          <ChevronRight style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  );
}

// ── Phase tab icons ───────────────────────────────────────────
function PrepIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3v6a6 6 0 0012 0V3" stroke="#8A6A4A" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="15" x2="12" y2="21" stroke="#8A6A4A" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="17" rx="8" ry="3" stroke="#8A6A4A" strokeWidth="2" />
      <path d="M4 17v1a8 8 0 0016 0v-1" stroke="#8A6A4A" strokeWidth="2" />
      <path d="M8 10c0-2 1-4 4-4s4 2 4 4" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="3" x2="12" y2="6" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" />
      <line x1="8.5" y1="4" x2="9.5" y2="6.7" stroke="#F4A261" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.5" y1="4" x2="14.5" y2="6.7" stroke="#F4A261" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FinishIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="#8A6A4A" strokeWidth="2" />
      <path d="M8 12l3 3 5-5" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TabLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {text}
    </span>
  );
}

// ── Split instructions into labelled phases for tabs ─────────
function splitIntoPhaseTabs(
  instructions: string[],
  onComplete: () => void,
  onStepChange: ((text: string) => void) | undefined,
  setActivePhaseTab: (id: string) => void,
): Tab[] {
  if (instructions.length <= 4) {
    return [{
      id: "cook",
      label: <TabLabel icon={<CookIcon />} text="Cook" />,
      content: <NumberedInstructions instructions={instructions} onComplete={onComplete} onStepChange={onStepChange} />,
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
      label: <TabLabel icon={<PrepIcon />} text="Prep" />,
      content: (
        <NumberedInstructions
          instructions={prepSteps}
          onComplete={() => setActivePhaseTab("cook")}
          onStepChange={onStepChange}
        />
      ),
    });
  }
  if (cookSteps.length > 0) {
    tabs.push({
      id: "cook",
      label: <TabLabel icon={<CookIcon />} text="Cook" />,
      content: (
        <NumberedInstructions
          instructions={cookSteps}
          onComplete={finishSteps.length === 0 ? onComplete : () => setActivePhaseTab("finish")}
          onStepChange={onStepChange}
        />
      ),
    });
  }
  if (finishSteps.length > 0) {
    tabs.push({
      id: "finish",
      label: <TabLabel icon={<FinishIcon />} text="Finish" />,
      content: <NumberedInstructions instructions={finishSteps} onComplete={onComplete} onStepChange={onStepChange} />,
    });
  }
  return tabs;
}

// ── Cook This — add missing to shopping list ─────────────────
function CookThisButton({
  ingredients,
}: {
  ingredients: { name: string; amount?: number | null; unit?: string | null }[];
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [addedCount, setAddedCount] = useState(0);

  async function handleCookThis() {
    setState("loading");
    try {
      const res = await fetch("/api/pantry/gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      if (!res.ok) {
        setState("idle");
        return;
      }
      const json = await res.json() as {
        missing?: { name: string; amount?: number; unit?: string }[];
      };
      const missing = json.missing ?? [];
      if (missing.length === 0) {
        setState("done");
        setAddedCount(0);
        return;
      }
      addToShoppingList(
        missing.map((m) => ({
          name: m.name,
          amount: m.amount !== undefined ? String(m.amount) : undefined,
          unit: m.unit,
        }))
      );
      setAddedCount(missing.length);
      setState("done");
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-3"
        style={{ background: "rgba(130,142,111,0.2)", color: "#828E6F", border: "1px solid rgba(130,142,111,0.3)" }}
      >
        <CheckCircle2 style={{ width: 16, height: 16 }} />
        {addedCount === 0
          ? "You have everything!"
          : `${addedCount} missing item${addedCount !== 1 ? "s" : ""} added to list`}
      </div>
    );
  }

  return (
    <button
      onClick={handleCookThis}
      disabled={state === "loading"}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 mb-3 w-full justify-center"
      style={{
        background: "rgba(176,125,86,0.18)",
        color: "#B07D56",
        border: "1px solid rgba(176,125,86,0.3)",
      }}
    >
      {state === "loading"
        ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
        : <ShoppingCart style={{ width: 16, height: 16 }} />}
      {state === "loading" ? "Checking pantry…" : "Cook This — add missing to list"}
    </button>
  );
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
  baseServings,
}: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [instructions, setInstructions] = useState<string[]>(initialInstructions);
  const [phase, setPhase] = useState<Phase>("cook");
  const [cookingDone, setCookingDone] = useState(false);
  const [activePhaseTab, setActivePhaseTab] = useState<string>(() => {
    const PREP_KEYWORDS = /\b(prepare|prep|chop|dice|slice|mince|peel|wash|rinse|marinate|season|mix|combine|measure|gather|cut|trim|soak)\b/i;
    return initialInstructions.length > 4 && PREP_KEYWORDS.test(initialInstructions[0] ?? "") ? "prep" : "cook";
  });
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const base = baseServings ?? 4;
  const [servings, setServings] = useState(base);
  const multiplier = servings / base;
  const { active: cookingModeActive, setCurrentStepText } = useCookingMode();
  const [ingredientsCollapsed, setIngredientsCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (cookingModeActive) setIngredientsCollapsed(true);
  }, [cookingModeActive]);

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
      className="relative flex flex-col lg:flex-row lg:items-stretch"
      style={{
        minHeight: "calc(100vh - 96px)",
        background: "#0d0d0c",
      }}
    >
      {/* Faint kitchen-pattern grain over the solid surface — replaces the page
          illustration bleeding through the old translucent panels */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/kitchen-pattern.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "4200px auto",
          opacity: 0.05,
          zIndex: 0,
        }}
      />
      {/* ── INGREDIENTS PANEL (left half of right side on desktop, full-width on mobile) ── */}
      <div
        className={`relative z-[1] flex flex-col shrink-0 w-full lg:sticky lg:top-0 lg:max-h-[calc(100vh-96px)] ${ingredientsCollapsed ? "" : "lg:w-[38%]"}`}
        style={{
          width: ingredientsCollapsed ? "48px" : undefined,
          minWidth: ingredientsCollapsed ? "48px" : undefined,
          borderRight: "1px solid rgba(42,24,8,0.6)",
          overflowY: ingredientsCollapsed ? "hidden" : "auto",
          overflowX: "hidden",
          transition: "width 0.3s ease, min-width 0.3s ease",
          flexShrink: 0,
        }}
      >
        {ingredientsCollapsed ? (
          <button
            type="button"
            onClick={() => setIngredientsCollapsed(false)}
            className="flex flex-col items-center gap-2.5 w-full h-full justify-start transition-opacity hover:opacity-80"
            style={{ padding: "24px 0 0 0", color: "var(--wc-pal-accent, #B07D56)" }}
            aria-label="Expand Ingredients"
          >
            <Utensils style={{ width: 16, height: 16 }} />
            <span
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#5A3A28",
                marginTop: 8,
              }}
            >
              Ingredients
            </span>
          </button>
        ) : (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(42,24,8,0.7)", border: "1px solid rgba(90,50,20,0.4)" }}>
                <Utensils style={{ width: 15, height: 15, color: "var(--wc-pal-accent, #B07D56)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A8845E" }}>Phase II</div>
                <div className="text-base font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  Ingredients
                </div>
              </div>
              <UnitToggle value={unitSystem} onChange={setUnitSystem} />
              <button
                type="button"
                onClick={() => setIngredientsCollapsed(true)}
                className="p-1.5 rounded-lg ml-1 transition-opacity hover:opacity-70"
                style={{ color: "#4A3020" }}
                title="Collapse ingredients"
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
            </div>
            {/* Serving size multiplier — desktop only */}
            <div className="hidden lg:flex items-center gap-2 mb-3 pl-10">
              <span className="text-xs font-semibold" style={{ color: "#A8845E" }}>Servings</span>
              <ServingControl base={base} current={servings} onChange={setServings} />
              {multiplier !== 1 && (
                <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(176,125,86,0.55)" }}>
                  ×{parseFloat(multiplier.toFixed(2))}
                </span>
              )}
            </div>
            {/* Mobile-only serving control */}
            <div className="flex lg:hidden items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "rgba(42,24,8,0.3)" }}>
              <span className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>Servings</span>
              <ServingControl base={base ?? 2} current={servings} onChange={setServings} />
              <UnitToggle value={unitSystem} onChange={setUnitSystem} />
            </div>
            {ingredients.length > 0 ? (
              <>
                {pantryItems && pantryItems.length >= 0 && (
                  <CookThisButton ingredients={ingredients} />
                )}
                <InteractiveIngredients
                  ingredients={ingredients}
                  unitSystem={unitSystem}
                  multiplier={multiplier}
                  pantryItems={pantryItems}
                  recipeTitle={recipeTitle}
                />
              </>
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
        )}
      </div>

      {/* ── INSTRUCTIONS + PHASE RUNNER (right half) ── */}
      <div
        className="relative z-[1] flex-1 flex flex-col min-w-0 lg:overflow-y-auto lg:max-h-[calc(100vh-96px)]"
      >
        {/* Phase progress stepper */}
        <PhaseStepper phase={phase} cookingDone={cookingDone} onPhaseClick={(p) => setPhase(p)} />

        <div className="p-5 pt-2">
          {/* ── Phase III: Cook — numbered steps with Pro-Tips ── */}
          {(phase === "cook" || phase === "post-pantry" || phase === "post-review") && (
            <div>
              {phase === "cook" && (
                <>
                  <LivingCookbookTicker />
                  {instructions.length > 0 ? (
                    <>
                      {/* Mobile: simple numbered bullet list */}
                      <div className="md:hidden">
                        <MobileBulletInstructions instructions={instructions} />
                      </div>
                      {/* Desktop: interactive step-by-step tabs */}
                      <div className="hidden md:block">
                        <AnimatedTabs
                          tabs={splitIntoPhaseTabs(instructions, handleCookingComplete, setCurrentStepText, setActivePhaseTab)}
                          activeTab={activePhaseTab}
                          onTabChange={setActivePhaseTab}
                          className="mt-4"
                        />
                      </div>
                    </>
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
                onDone={() => router.push("/")}
                onSkip={() => router.push("/")}
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
