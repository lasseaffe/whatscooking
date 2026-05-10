"use client";
import { useState, useCallback, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { X, Plus, Coffee, UtensilsCrossed, Soup, Cookie, Loader2, Flame } from "lucide-react";
import { RecipeImage } from "@/components/recipe-image";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface GridRecipe {
  id: string | null;
  title: string;
  image_url?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  dietary_tags?: string[];
}

export interface GridEntry {
  clientId: string;
  day_number: number;
  meal_type: MealType;
  recipe_title: string;
  image_url?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

export interface AutofillSuggestion {
  title: string;
  description?: string;
  calories?: number;
  tag?: string;
  recipe_id?: string | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

export interface WeeklyPlanGridProps {
  entries: GridEntry[];
  durationDays: number;
  weekStart?: string | null;
  nutritionalGoals?: Record<string, number>;
  onRemove: (clientId: string) => void;
  onAddDay: () => void;
  onAutofill: (day: number, mealType: MealType) => Promise<AutofillSuggestion[]>;
  onAutofillAccept: (day: number, mealType: MealType, suggestion: AutofillSuggestion) => void;
  onOpenRecipeBank?: (mealType: MealType) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function dayLabel(dayNumber: number, weekStart: string | null | undefined): { short: string; sub: string } {
  if (!weekStart) return { short: `Day ${dayNumber}`, sub: "" };
  const base = new Date(`${weekStart}T12:00:00`);
  base.setDate(base.getDate() + dayNumber - 1);
  return {
    short: `${DAY_NAMES[base.getDay()]} ${base.getDate()}`,
    sub: MONTH_NAMES[base.getMonth()],
  };
}

const MEAL_ROWS: { type: MealType; label: string; Icon: React.ElementType; color: string }[] = [
  { type: "breakfast", label: "Breakfast", Icon: Coffee,          color: "#7A5C1E" },
  { type: "lunch",     label: "Lunch",     Icon: UtensilsCrossed,  color: "#4A5C2A" },
  { type: "dinner",    label: "Dinner",    Icon: Soup,             color: "#7A3520" },
  { type: "snack",     label: "Snack",     Icon: Cookie,           color: "#5C4A2A" },
];

export function WeeklyPlanGrid({
  entries,
  durationDays,
  weekStart,
  nutritionalGoals,
  onRemove,
  onAddDay,
  onAutofill,
  onAutofillAccept,
  onOpenRecipeBank,
}: WeeklyPlanGridProps) {
  const [hiddenRows, setHiddenRows] = useState<Set<MealType>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = JSON.parse(localStorage.getItem("wc-hidden-rows") ?? "[]") as MealType[];
      return new Set(stored);
    } catch {
      return new Set();
    }
  });
  const [autofillState, setAutofillState] = useState<
    Record<string, { status: "loading" | "suggesting"; suggestions: AutofillSuggestion[]; idx: number }>
  >({});

  const toggleRow = useCallback((mt: MealType) => {
    setHiddenRows((prev) => {
      const next = new Set(prev);
      next.has(mt) ? next.delete(mt) : next.add(mt);
      if (typeof window !== "undefined") {
        localStorage.setItem("wc-hidden-rows", JSON.stringify([...next]));
      }
      return next;
    });
  }, []);

  const handleAutofill = useCallback(async (day: number, mt: MealType) => {
    const key = `${day}-${mt}`;
    setAutofillState((prev) => ({ ...prev, [key]: { status: "loading", suggestions: [], idx: 0 } }));
    try {
      const suggestions = await onAutofill(day, mt);
      setAutofillState((prev) => ({ ...prev, [key]: { status: "suggesting", suggestions, idx: 0 } }));
    } catch {
      setAutofillState((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  }, [onAutofill]);

  const dismissAutofill = useCallback((key: string) => {
    setAutofillState((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const macrosByDay = useMemo(() => {
    const map: Record<number, { calories: number; protein_g: number; carbs_g: number; fat_g: number }> = {};
    for (const e of entries) {
      const d = e.day_number;
      if (!map[d]) map[d] = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      map[d].calories  += e.calories  ?? 0;
      map[d].protein_g += e.protein_g ?? 0;
      map[d].carbs_g   += e.carbs_g   ?? 0;
      map[d].fat_g     += e.fat_g     ?? 0;
    }
    return map;
  }, [entries]);

  function macroColor(actual: number, goal: number | undefined): string {
    if (!goal) return "#8A6A4A";
    const ratio = actual / goal;
    if (ratio >= 0.9 && ratio <= 1.2) return "#4A5C2A";
    if (ratio < 0.6) return "#E67E22";
    return "#7A3520";
  }

  const visibleRows = MEAL_ROWS.filter((r) => !hiddenRows.has(r.type));
  const colTemplate = `80px repeat(${durationDays}, minmax(110px, 1fr)) 40px`;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: durationDays * 120 + 120 }}>

        {/* Header row */}
        <div className="grid mb-2 items-center" style={{ gridTemplateColumns: colTemplate }}>
          <div />
          {Array.from({ length: durationDays }, (_, i) => {
            const lbl = dayLabel(i + 1, weekStart);
            return (
              <div key={i} className="text-center py-1">
                <div className="text-xs font-semibold" style={{ color: "#EFE3CE" }}>{lbl.short}</div>
                {lbl.sub && <div className="text-xs" style={{ color: "#6B4E36" }}>{lbl.sub}</div>}
              </div>
            );
          })}
          <button
            onClick={() => durationDays < 14 && onAddDay()}
            disabled={durationDays >= 14}
            className="flex items-center justify-center w-7 h-7 rounded-full text-xs disabled:opacity-30"
            style={{ background: "#2A1F14", color: "#E67E22", border: "1px dashed #6B4E36" }}
            title={durationDays >= 14 ? "Maximum 14 days" : "Add day"}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Meal rows */}
        {visibleRows.map(({ type, label, Icon, color }) => (
          <div key={type} className="grid mb-1" style={{ gridTemplateColumns: colTemplate }}>
            <button
              onClick={() => toggleRow(type)}
              className="flex items-center gap-1.5 pr-2 text-left"
              title={`Toggle ${label} row`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              <span className="text-xs font-medium" style={{ color: "#8A6A4A" }}>{label}</span>
            </button>

            {Array.from({ length: durationDays }, (_, i) => {
              const day = i + 1;
              const entry = entries.find((e) => e.day_number === day && e.meal_type === type);
              const key = `${day}-${type}`;
              const af = autofillState[key];
              return (
                <GridCell
                  key={key}
                  cellId={key}
                  entry={entry ?? null}
                  autofill={af ?? null}
                  onRemove={onRemove}
                  onAutofillTrigger={() => handleAutofill(day, type)}
                  onAutofillAccept={(s) => { onAutofillAccept(day, type, s); dismissAutofill(key); }}
                  onAutofillSkip={() =>
                    setAutofillState((prev) => {
                      const cur = prev[key];
                      if (!cur) return prev;
                      return {
                        ...prev,
                        [key]: { ...cur, idx: (cur.idx + 1) % Math.max(cur.suggestions.length, 1) },
                      };
                    })
                  }
                  onDismissAutofill={() => dismissAutofill(key)}
                  onSearchInstead={() => { dismissAutofill(key); onOpenRecipeBank?.(type); }}
                />
              );
            })}
            <div />
          </div>
        ))}

        {/* Hidden row restore buttons */}
        {MEAL_ROWS.filter((r) => hiddenRows.has(r.type)).map(({ type, label, Icon, color }) => (
          <button
            key={type}
            onClick={() => toggleRow(type)}
            className="flex items-center gap-1.5 mb-1 px-2 py-0.5 rounded text-xs opacity-50 hover:opacity-80"
            style={{ color }}
          >
            <Icon className="w-3 h-3" />
            <span>{label} (hidden)</span>
          </button>
        ))}

        {/* Macro footer */}
        <div className="grid mt-2 border-t" style={{ gridTemplateColumns: colTemplate, borderColor: "#2A1F14" }}>
          <div className="text-xs py-2 flex items-center gap-1" style={{ color: "#8A6A4A" }}>
            <Flame className="w-3 h-3" />
          </div>
          {Array.from({ length: durationDays }, (_, i) => {
            const day = i + 1;
            const m = macrosByDay[day] ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
            const calGoal = nutritionalGoals?.calories;
            return (
              <div key={day} className="py-1.5 text-center">
                <div className="text-xs font-semibold" style={{ color: macroColor(m.calories, calGoal) }}>
                  {m.calories > 0 ? `${Math.round(m.calories)} kcal` : "—"}
                </div>
                {m.protein_g > 0 && (
                  <div className="text-xs" style={{ color: "#8A6A4A" }}>P {Math.round(m.protein_g)}g</div>
                )}
              </div>
            );
          })}
          <div />
        </div>

      </div>
    </div>
  );
}

// ── GridCell ──────────────────────────────────────────────────────────────────

interface GridCellProps {
  cellId: string;
  entry: GridEntry | null;
  autofill: { status: "loading" | "suggesting"; suggestions: AutofillSuggestion[]; idx: number } | null;
  onRemove: (clientId: string) => void;
  onAutofillTrigger: () => void;
  onAutofillAccept: (s: AutofillSuggestion) => void;
  onAutofillSkip: () => void;
  onDismissAutofill: () => void;
  onSearchInstead: () => void;
}

function GridCell({
  cellId, entry, autofill, onRemove,
  onAutofillTrigger, onAutofillAccept, onAutofillSkip, onDismissAutofill, onSearchInstead,
}: GridCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${cellId}`,
    data: {
      day_number: parseInt(cellId.split("-")[0]),
      meal_type: cellId.split("-")[1] as MealType,
    },
  });

  const baseStyle: React.CSSProperties = {
    minHeight: 72,
    borderRadius: 6,
    border: isOver ? "2px solid #E67E22" : "1px dashed #3A2A1A",
    background: isOver ? "rgba(230,126,34,0.08)" : "#1A120A",
    position: "relative",
    transition: "border-color 0.15s, background 0.15s",
    margin: "0 3px 3px 0",
  };

  if (entry) {
    return (
      <div ref={setNodeRef} style={{ ...baseStyle, border: "1px solid #3A2A1A", padding: 4 }} className="group">
        {entry.image_url && (
          <div className="w-full h-10 rounded overflow-hidden mb-1">
            <RecipeImage recipeId={entry.clientId} imageUrl={entry.image_url} title={entry.recipe_title} alt={entry.recipe_title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-xs leading-tight px-0.5 line-clamp-2" style={{ color: "#EFE3CE" }}>
          {entry.recipe_title}
        </div>
        <button
          onClick={() => onRemove(entry.clientId)}
          aria-label={`Remove ${entry.recipe_title}`}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5"
          style={{ background: "#2A1F14" }}
        >
          <X className="w-3 h-3" style={{ color: "#E67E22" }} />
        </button>
      </div>
    );
  }

  if (autofill?.status === "loading") {
    return (
      <div ref={setNodeRef} style={baseStyle} className="flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#6B4E36" }} />
      </div>
    );
  }

  if (autofill?.status === "suggesting" && autofill.suggestions.length > 0) {
    const s = autofill.suggestions[autofill.idx];
    return (
      <div ref={setNodeRef} style={{ ...baseStyle, border: "1px solid #E67E22", padding: 6, cursor: "default" }}>
        <div className="text-xs font-medium line-clamp-2 mb-1" style={{ color: "#EFE3CE" }}>{s.title}</div>
        {s.calories && (
          <div className="text-xs mb-1" style={{ color: "#8A6A4A" }}>{Math.round(s.calories)} kcal</div>
        )}
        {s.tag && (
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#2A1F14", color: "#E67E22" }}>
            {s.tag}
          </span>
        )}
        <div className="flex gap-1 mt-2">
          <button onClick={() => onAutofillAccept(s)} className="flex-1 text-xs py-0.5 rounded" style={{ background: "#E67E22", color: "#1A120A" }}>Add</button>
          <button onClick={onAutofillSkip} className="flex-1 text-xs py-0.5 rounded" style={{ background: "#2A1F14", color: "#8A6A4A" }}>Skip</button>
        </div>
        <button onClick={onDismissAutofill} aria-label="Dismiss suggestion" className="absolute top-1 right-1" style={{ color: "#6B4E36" }}>
          <X className="w-3 h-3" />
        </button>
        <button onClick={onSearchInstead} className="mt-1 text-xs w-full text-center underline" style={{ color: "#6B4E36" }}>
          Search instead
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={baseStyle} className="flex items-center justify-center">
      <button onClick={onAutofillTrigger} style={{ color: "#3A2A1A" }} className="hover:text-[#E67E22] transition-colors">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
