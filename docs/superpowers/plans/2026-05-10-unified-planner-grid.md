# Unified Weekly Planner Grid & Recipe Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two parallel plan builder implementations (HTML5 drag in `/plans/new`, dnd-kit in `/plans/[id]`) with shared `WeeklyPlanGrid` and `RecipeBank` components that fix drag-and-drop, add calendar dates, macro footers, smart recommendations, and autofill.

**Architecture:** Single `DndContext` at page root wraps both sidebar and grid so draggables and droppables share the same React context (root cause of the current broken drag). Two new shared components in `src/components/plans/` absorb and replace the existing per-route implementations. A new `/api/recipes/recommend` endpoint scores recipes by dietary fit, saved status, plan deduplication, and macro gaps.

**Tech Stack:** Next.js App Router, dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`), Supabase (server client), Framer Motion, Tailwind CSS, Lucide React icons.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/components/plans/WeeklyPlanGrid.tsx` | Unified grid: dnd-kit droppables, calendar headers, macro footer, autofill cell UI |
| Create | `src/components/plans/RecipeBank.tsx` | Unified sidebar: search, filter chips, smart recs, dnd-kit draggables |
| Create | `src/app/api/recipes/recommend/route.ts` | Scored recipe recommendations endpoint |
| Modify | `src/app/api/recipes/autocomplete/route.ts` | Add `saved=true` param + `is_saved` field |
| Modify | `src/app/(app)/plans/new/dnd-builder.tsx` | Swap to shared components, wrap in DndContext |
| Modify | `src/app/(app)/plans/[id]/plan-builder.tsx` | Swap to shared components, expand DndContext scope |
| Delete | `src/app/(app)/plans/new/weekly-grid.tsx` | Absorbed into WeeklyPlanGrid |
| Delete | `src/app/(app)/plans/new/recipe-search-panel.tsx` | Absorbed into RecipeBank |

---

## Task 1: Create `WeeklyPlanGrid` component

**Files:**
- Create: `src/components/plans/WeeklyPlanGrid.tsx`

### Step 1a: Write the component skeleton with types

- [ ] Create `src/components/plans/WeeklyPlanGrid.tsx` with this content:

```tsx
"use client";
import { useState, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import { X, Plus, Coffee, UtensilsCrossed, Soup, Cookie, Loader2, Flame, Dumbbell } from "lucide-react";
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

// Derive real date string from weekStart + day offset
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function dayLabel(dayNumber: number, weekStart: string | null | undefined): { short: string; sub: string } {
  if (!weekStart) return { short: `Day ${dayNumber}`, sub: "" };
  const base = new Date(weekStart);
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
  // hiddenRows stores MealTypes the user has toggled off
  const [hiddenRows, setHiddenRows] = useState<Set<MealType>>(new Set());
  // autofillState: key = "day-mealType", value = state machine
  const [autofillState, setAutofillState] = useState<
    Record<string, { status: "loading" | "suggesting"; suggestions: AutofillSuggestion[]; idx: number }>
  >({});

  const toggleRow = useCallback((mt: MealType) => {
    setHiddenRows((prev) => {
      const next = new Set(prev);
      next.has(mt) ? next.delete(mt) : next.add(mt);
      return next;
    });
    // Persist preference
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("wc-hidden-rows") ?? "[]") as MealType[];
      const updated = hiddenRows.has(mt)
        ? stored.filter((r) => r !== mt)
        : [...stored, mt];
      localStorage.setItem("wc-hidden-rows", JSON.stringify(updated));
    }
  }, [hiddenRows]);

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

  // Compute per-day macro totals
  function dayMacros(day: number) {
    const dayEntries = entries.filter((e) => e.day_number === day);
    return {
      calories: dayEntries.reduce((s, e) => s + (e.calories ?? 0), 0),
      protein_g: dayEntries.reduce((s, e) => s + (e.protein_g ?? 0), 0),
      carbs_g: dayEntries.reduce((s, e) => s + (e.carbs_g ?? 0), 0),
      fat_g: dayEntries.reduce((s, e) => s + (e.fat_g ?? 0), 0),
    };
  }

  function macroColor(actual: number, goal: number | undefined): string {
    if (!goal) return "#8A6A4A";
    const ratio = actual / goal;
    if (ratio >= 0.9 && ratio <= 1.2) return "#4A5C2A";   // green
    if (ratio < 0.6) return "#E67E22";                     // amber
    return "#7A3520";                                       // red (over)
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
                {!lbl.sub && <div className="text-xs" style={{ color: "#6B4E36" }}>Day {i + 1}</div>}
              </div>
            );
          })}
          {/* Add Day button */}
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
            {/* Row header — click to toggle */}
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
                    setAutofillState((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], idx: (prev[key].idx + 1) % Math.max(prev[key].suggestions.length, 1) },
                    }))
                  }
                  onDismissAutofill={() => dismissAutofill(key)}
                  onSearchInstead={() => { dismissAutofill(key); onOpenRecipeBank?.(type); }}
                />
              );
            })}
            <div /> {/* spacer under add-day button */}
          </div>
        ))}

        {/* Hidden row indicators */}
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

        {/* Macro footer row */}
        <div className="grid mt-2 border-t" style={{ gridTemplateColumns: colTemplate, borderColor: "#2A1F14" }}>
          <div className="text-xs py-2 flex items-center gap-1" style={{ color: "#8A6A4A" }}>
            <Flame className="w-3 h-3" />
          </div>
          {Array.from({ length: durationDays }, (_, i) => {
            const day = i + 1;
            const m = dayMacros(day);
            const calGoal = nutritionalGoals?.calories;
            return (
              <div key={day} className="py-1.5 text-center">
                <div
                  className="text-xs font-semibold"
                  style={{ color: macroColor(m.calories, calGoal) }}
                >
                  {m.calories > 0 ? `${Math.round(m.calories)} kcal` : "—"}
                </div>
                {m.protein_g > 0 && (
                  <div className="text-xs" style={{ color: "#8A6A4A" }}>
                    P {Math.round(m.protein_g)}g
                  </div>
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

// ── GridCell sub-component ────────────────────────────────────────────────────

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
            <RecipeImage src={entry.image_url} alt={entry.recipe_title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-xs leading-tight px-0.5 line-clamp-2" style={{ color: "#EFE3CE" }}>
          {entry.recipe_title}
        </div>
        <button
          onClick={() => onRemove(entry.clientId)}
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
      <div
        ref={setNodeRef}
        style={{ ...baseStyle, border: "1px solid #E67E22", padding: 6, cursor: "default" }}
      >
        <div className="text-xs font-medium line-clamp-2 mb-1" style={{ color: "#EFE3CE" }}>
          {s.title}
        </div>
        {s.calories && (
          <div className="text-xs mb-1" style={{ color: "#8A6A4A" }}>{Math.round(s.calories)} kcal</div>
        )}
        {s.tag && (
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#2A1F14", color: "#E67E22" }}>
            {s.tag}
          </span>
        )}
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => onAutofillAccept(s)}
            className="flex-1 text-xs py-0.5 rounded"
            style={{ background: "#E67E22", color: "#1A120A" }}
          >Add</button>
          <button
            onClick={onAutofillSkip}
            className="flex-1 text-xs py-0.5 rounded"
            style={{ background: "#2A1F14", color: "#8A6A4A" }}
          >Skip</button>
        </div>
        <button
          onClick={onDismissAutofill}
          className="absolute top-1 right-1"
          style={{ color: "#6B4E36" }}
        >
          <X className="w-3 h-3" />
        </button>
        <button
          onClick={onSearchInstead}
          className="mt-1 text-xs w-full text-center underline"
          style={{ color: "#6B4E36" }}
        >
          Search instead
        </button>
      </div>
    );
  }

  // Empty cell
  return (
    <div ref={setNodeRef} style={baseStyle} className="flex items-center justify-center">
      <button onClick={onAutofillTrigger} style={{ color: "#3A2A1A" }} className="hover:text-[#E67E22] transition-colors">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] Verify the file was created without syntax errors by checking import paths match the project (`@/components/recipe-image` is used in `plan-builder.tsx` so it exists).

- [ ] Commit:
```bash
git add src/components/plans/WeeklyPlanGrid.tsx
git commit -m "feat(plans): add WeeklyPlanGrid shared component with dnd-kit droppables, macro footer, autofill cell UI"
```

---

## Task 2: Extend autocomplete API + create recommend API

**Files:**
- Modify: `src/app/api/recipes/autocomplete/route.ts`
- Create: `src/app/api/recipes/recommend/route.ts`

### Step 2a: Add `saved` param to autocomplete

- [ ] Replace `src/app/api/recipes/autocomplete/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/recipes/autocomplete?q=<query>&limit=8&saved=true
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "8"), 20);
  const includeSaved = req.nextUrl.searchParams.get("saved") === "true";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, image_url, calories, protein_g, carbs_g, fat_g, prep_time_minutes, cook_time_minutes, dietary_tags")
    .ilike("title", `%${q}%`)
    .limit(limit);

  if (error) return NextResponse.json([], { status: 500 });

  let savedIds = new Set<string>();
  if (includeSaved && user) {
    const { data: saved } = await supabase
      .from("user_saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((r) => r.recipe_id));
  }

  const results = (data ?? []).map((r) => ({ ...r, is_saved: savedIds.has(r.id) }));
  return NextResponse.json(results);
}
```

- [ ] Commit:
```bash
git add src/app/api/recipes/autocomplete/route.ts
git commit -m "feat(api): autocomplete — add saved=true param and is_saved field"
```

### Step 2b: Create recommend endpoint

- [ ] Create `src/app/api/recipes/recommend/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/recipes/recommend?plan_id=<id>&day_number=<n>&meal_type=<mt>
// Returns up to 10 scored recipes: dietary fit + saved boost + deduplication.
export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get("plan_id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fallback: return popular recipes when no plan context
  if (!planId) {
    const { data } = await supabase
      .from("recipes")
      .select("id, title, image_url, calories, protein_g, carbs_g, fat_g, prep_time_minutes, cook_time_minutes, dietary_tags")
      .limit(10);
    return NextResponse.json(data ?? []);
  }

  // Fetch plan context
  const [{ data: plan }, { data: entries }] = await Promise.all([
    supabase.from("meal_plans").select("dietary_filters, nutritional_goals").eq("id", planId).single(),
    supabase.from("meal_plan_entries").select("recipe_title").eq("meal_plan_id", planId),
  ]);

  const dietaryFilters: string[] = plan?.dietary_filters ?? [];
  const existingTitles = new Set((entries ?? []).map((e: { recipe_title: string }) => e.recipe_title));

  // Fetch user's saved recipe IDs
  let savedIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase
      .from("user_saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((r: { recipe_id: string }) => r.recipe_id));
  }

  // Fetch candidate recipes
  const { data: candidates } = await supabase
    .from("recipes")
    .select("id, title, image_url, calories, protein_g, carbs_g, fat_g, prep_time_minutes, cook_time_minutes, dietary_tags")
    .limit(60);

  if (!candidates) return NextResponse.json([]);

  // Score each recipe
  const scored = candidates.map((r) => {
    let score = 0;
    // Dietary filter match
    const tags: string[] = r.dietary_tags ?? [];
    if (dietaryFilters.length > 0 && dietaryFilters.every((f) => tags.includes(f))) score += 3;
    // Saved by user
    if (savedIds.has(r.id)) score += 2;
    // Not already in plan
    if (!existingTitles.has(r.title)) score += 2;
    return { ...r, is_saved: savedIds.has(r.id), _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  const top10 = scored.slice(0, 10).map(({ _score, ...r }) => r);
  return NextResponse.json(top10);
}
```

- [ ] Commit:
```bash
git add src/app/api/recipes/recommend/route.ts
git commit -m "feat(api): add /api/recipes/recommend — scored by dietary fit, saved status, deduplication"
```

---

## Task 3: Create `RecipeBank` component

**Files:**
- Create: `src/components/plans/RecipeBank.tsx`

- [ ] Create `src/components/plans/RecipeBank.tsx`:

```tsx
"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Search, Loader2, GripVertical, Clock, Flame, Bookmark, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { RecipeImage } from "@/components/recipe-image";
import type { MealType } from "./WeeklyPlanGrid";

export interface BankRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  dietary_tags?: string[];
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  is_saved?: boolean;
}

export interface RecipeBankProps {
  planId: string;
  dietaryFilters: string[];
  focusMealType?: MealType | null;
}

function DraggableCard({ recipe, large }: { recipe: BankRecipe; large?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bank-${recipe.id}`,
    data: { type: "recipe-bank", recipe },
  });

  if (large) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? "grabbing" : "grab",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #3A2A1A",
          background: "#1A120A",
        }}
      >
        {recipe.image_url && (
          <div className="w-full" style={{ height: 160 }}>
            <RecipeImage src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3">
          <div className="font-semibold text-sm mb-1" style={{ color: "#EFE3CE" }}>{recipe.title}</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {(recipe.dietary_tags ?? []).slice(0, 2).map((t) => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#2A1F14", color: "#E67E22" }}>{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#8A6A4A" }}>
            {recipe.prep_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)} min
              </span>
            )}
            {recipe.calories && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {recipe.calories} kcal
              </span>
            )}
            {recipe.is_saved && <Bookmark className="w-3 h-3" style={{ color: "#E67E22" }} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-2 rounded"
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        background: "#1A120A",
        border: "1px solid #2A1F14",
      }}
    >
      <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: "#3A2A1A" }} />
      {recipe.image_url && (
        <div className="w-8 h-8 rounded overflow-hidden shrink-0">
          <RecipeImage src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate" style={{ color: "#EFE3CE" }}>{recipe.title}</div>
        {recipe.calories && <div className="text-xs" style={{ color: "#8A6A4A" }}>{recipe.calories} kcal</div>}
      </div>
      {recipe.is_saved && <Bookmark className="w-3 h-3 shrink-0" style={{ color: "#E67E22" }} />}
    </div>
  );
}

export function RecipeBank({ planId, dietaryFilters, focusMealType }: RecipeBankProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BankRecipe[]>([]);
  const [recs, setRecs] = useState<BankRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load smart recommendations on mount / when plan changes
  useEffect(() => {
    if (!planId) return;
    setRecsLoading(true);
    fetch(`/api/recipes/recommend?plan_id=${planId}`)
      .then((r) => r.json())
      .then((data) => { setRecs(Array.isArray(data) ? data : []); setFeaturedIdx(0); })
      .finally(() => setRecsLoading(false));
  }, [planId]);

  // Focus search when focusMealType changes
  useEffect(() => {
    if (focusMealType) searchRef.current?.focus();
  }, [focusMealType]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/autocomplete?q=${encodeURIComponent(q)}&limit=10&saved=true`);
        if (res.ok) setResults(await res.json());
      } finally { setLoading(false); }
    }, 250);
  }, []);

  function toggleFilter(f: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const displayList = query.length >= 2 ? results : recs;
  const filtered = activeFilters.size === 0
    ? displayList
    : displayList.filter((r) => [...activeFilters].every((f) => r.dietary_tags?.includes(f)));

  const featured = filtered[featuredIdx] ?? filtered[0] ?? null;
  const rest = filtered.filter((_, i) => i !== (filtered.indexOf(featured)));

  return (
    <div className="flex flex-col gap-3" style={{ color: "#EFE3CE" }}>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6B4E36" }} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Search recipes..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded outline-none"
          style={{ background: "#1A120A", border: "1px solid #3A2A1A", color: "#EFE3CE" }}
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin" style={{ color: "#6B4E36" }} />}
      </div>

      {/* Filter chips */}
      {dietaryFilters.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {dietaryFilters.map((f) => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className="text-xs px-2.5 py-0.5 rounded-full border transition-colors"
              style={{
                background: activeFilters.has(f) ? "#E67E22" : "#2A1F14",
                color: activeFilters.has(f) ? "#1A120A" : "#8A6A4A",
                borderColor: activeFilters.has(f) ? "#E67E22" : "#3A2A1A",
              }}
            >
              {f}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button onClick={() => setActiveFilters(new Set())} className="text-xs px-2 py-0.5 rounded-full" style={{ color: "#6B4E36" }}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Smart recs label */}
      {query.length < 2 && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6B4E36" }}>
          <Sparkles className="w-3 h-3" />
          {recsLoading ? "Loading suggestions…" : "Suggested for you"}
        </div>
      )}

      {/* Featured card */}
      {featured && (
        <div className="relative">
          <DraggableCard recipe={featured} large />
          {filtered.length > 1 && (
            <div className="flex items-center gap-2 mt-1.5 justify-center">
              <button
                onClick={() => setFeaturedIdx((i) => (i - 1 + filtered.length) % filtered.length)}
                className="p-1 rounded" style={{ background: "#2A1F14", color: "#8A6A4A" }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs" style={{ color: "#6B4E36" }}>
                {filtered.indexOf(featured) + 1} / {filtered.length}
              </span>
              <button
                onClick={() => setFeaturedIdx((i) => (i + 1) % filtered.length)}
                className="p-1 rounded" style={{ background: "#2A1F14", color: "#8A6A4A" }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compact list */}
      <div className="flex flex-col gap-1.5">
        {rest.slice(0, 6).map((r) => (
          <DraggableCard key={r.id} recipe={r} />
        ))}
      </div>

    </div>
  );
}
```

- [ ] Commit:
```bash
git add src/components/plans/RecipeBank.tsx
git commit -m "feat(plans): add RecipeBank shared component with dnd-kit draggables, filter chips, smart recs"
```

---

## Task 4: Wire `/plans/new` — replace HTML5 drag with dnd-kit

**Files:**
- Modify: `src/app/(app)/plans/new/dnd-builder.tsx`

- [ ] Read the current full `dnd-builder.tsx` to understand save logic before editing:
  File: `src/app/(app)/plans/new/dnd-builder.tsx`

- [ ] Replace the imports and component body in `dnd-builder.tsx`. The key changes are:
  1. Add `DndContext`, `DragOverlay`, `PointerSensor` imports
  2. Import `WeeklyPlanGrid`, `RecipeBank`, and their types
  3. Remove `draggedRecipe` state and HTML5 drag handlers
  4. Add `handleDragEnd` for dnd-kit
  5. Replace `<RecipeSearchPanel>` with `<RecipeBank>`
  6. Replace `<WeeklyGrid>` with `<WeeklyPlanGrid>`

  Here is the complete replacement file content:

```tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { WeeklyPlanGrid, type GridEntry, type MealType, type AutofillSuggestion } from "@/components/plans/WeeklyPlanGrid";
import { RecipeBank, type BankRecipe } from "@/components/plans/RecipeBank";
import type { PlanTemplate } from "./plan-templates";

const MEAL_CYCLE: MealType[] = ["breakfast", "lunch", "dinner"];

function templateToEntries(template: PlanTemplate): GridEntry[] {
  const entries: GridEntry[] = [];
  let clientIdx = 0;
  for (let day = 1; day <= template.durationDays; day++) {
    MEAL_CYCLE.forEach((mealType, i) => {
      const meal = template.meals[(day - 1 + i) % template.meals.length];
      entries.push({
        clientId: `template-${clientIdx++}`,
        day_number: day,
        meal_type: mealType,
        recipe_title: meal.title,
        image_url: meal.image ?? null,
        calories: meal.calories ?? null,
      });
    });
  }
  return entries;
}

interface Props {
  template: PlanTemplate;
}

export function MealPlanDndBuilder({ template }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<GridEntry[]>(() => templateToEntries(template));
  const [durationDays, setDurationDays] = useState(template.durationDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState(template.title);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [focusMealType, setFocusMealType] = useState<MealType | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === "recipe-bank") {
      const overId = String(over.id);
      if (overId.startsWith("cell-")) {
        // "cell-{day}-{mealType}"
        const parts = overId.replace("cell-", "").split("-");
        const day = parseInt(parts[0]);
        const mealType = parts[1] as MealType;
        const recipe = active.data.current.recipe as BankRecipe;
        const newEntry: GridEntry = {
          clientId: `drop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          day_number: day,
          meal_type: mealType,
          recipe_title: recipe.title,
          image_url: recipe.image_url ?? null,
          calories: recipe.calories ?? null,
          protein_g: recipe.protein_g ?? null,
          carbs_g: recipe.carbs_g ?? null,
          fat_g: recipe.fat_g ?? null,
        };
        setEntries((prev) => {
          // Replace existing entry in that cell if any
          const filtered = prev.filter((e) => !(e.day_number === day && e.meal_type === mealType));
          return [...filtered, newEntry];
        });
      }
    }
  }

  const handleRemove = useCallback((clientId: string) => {
    setEntries((prev) => prev.filter((e) => e.clientId !== clientId));
  }, []);

  const handleAddDay = useCallback(() => {
    setDurationDays((d) => Math.min(d + 1, 14));
  }, []);

  const handleAutofill = useCallback(async (_day: number, _mealType: MealType): Promise<AutofillSuggestion[]> => {
    // No planId yet for new plans — return empty (autofill disabled for new)
    return [];
  }, []);

  const handleAutofillAccept = useCallback((day: number, mealType: MealType, suggestion: AutofillSuggestion) => {
    const newEntry: GridEntry = {
      clientId: `autofill-${Date.now()}`,
      day_number: day,
      meal_type: mealType,
      recipe_title: suggestion.title,
      calories: suggestion.calories ?? null,
      protein_g: suggestion.protein_g ?? null,
    };
    setEntries((prev) => {
      const filtered = prev.filter((e) => !(e.day_number === day && e.meal_type === mealType));
      return [...filtered, newEntry];
    });
  }, []);

  async function handleSave() {
    if (!planName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planName.trim(),
          dietary_tags: template.dietaryFilters,
          tags: template.tags,
          description: template.description,
          duration_days: durationDays,
          meals_per_day: template.mealsPerDay,
          week_start: weekStart ?? undefined,
        }),
      });
      if (!planRes.ok) throw new Error("Failed to create plan");
      const { id: planId } = await planRes.json();

      const entryPayload = entries.map((e, pos) => ({
        day_number: e.day_number,
        meal_type: e.meal_type,
        recipe_title: e.recipe_title,
        calories: e.calories,
        protein_g: e.protein_g,
        carbs_g: e.carbs_g,
        fat_g: e.fat_g,
        position: pos,
      }));

      const entriesRes = await fetch(`/api/plans/${planId}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entryPayload }),
      });
      if (!entriesRes.ok) throw new Error("Failed to save entries");
      router.push(`/plans/${planId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        {/* Plan name + week start */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Plan name"
            className="flex-1 min-w-0 px-3 py-2 rounded text-sm outline-none"
            style={{ background: "#1A120A", border: "1px solid #3A2A1A", color: "#EFE3CE" }}
          />
          <label className="flex items-center gap-2 text-xs" style={{ color: "#8A6A4A" }}>
            Start date
            <input
              type="date"
              value={weekStart ?? ""}
              onChange={(e) => setWeekStart(e.target.value || null)}
              className="px-2 py-1 rounded text-xs outline-none"
              style={{ background: "#1A120A", border: "1px solid #3A2A1A", color: "#EFE3CE" }}
            />
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ background: "#E67E22", color: "#1A120A" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Plan
          </button>
        </div>
        {error && <div className="text-xs" style={{ color: "#E67E22" }}>{error}</div>}

        {/* Two-column layout */}
        <div className="flex gap-4">
          {/* Recipe Bank sidebar */}
          <div className="w-72 shrink-0">
            <div className="font-semibold text-sm mb-3" style={{ color: "#EFE3CE" }}>Recipe Bank</div>
            <RecipeBank
              planId=""
              dietaryFilters={template.dietaryFilters ?? []}
              focusMealType={focusMealType}
            />
          </div>

          {/* Weekly grid */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-3" style={{ color: "#EFE3CE" }}>Weekly Planner</div>
            <WeeklyPlanGrid
              entries={entries}
              durationDays={durationDays}
              weekStart={weekStart}
              onRemove={handleRemove}
              onAddDay={handleAddDay}
              onAutofill={handleAutofill}
              onAutofillAccept={handleAutofillAccept}
              onOpenRecipeBank={(mt) => setFocusMealType(mt)}
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
}
```

- [ ] Delete the now-unused files:
```bash
git rm src/app/\(app\)/plans/new/weekly-grid.tsx
git rm src/app/\(app\)/plans/new/recipe-search-panel.tsx
```

  Note: also check if `meal-carousel.tsx` is still referenced anywhere. If only `recipe-search-panel.tsx` imported it, delete it too:
```bash
grep -r "meal-carousel" src/
```

- [ ] Commit:
```bash
git add src/app/\(app\)/plans/new/dnd-builder.tsx
git commit -m "feat(plans/new): replace HTML5 drag with unified WeeklyPlanGrid + RecipeBank + DndContext"
```

---

## Task 5: Wire `/plans/[id]` — expand DndContext and swap components

**Files:**
- Modify: `src/app/(app)/plans/[id]/plan-builder.tsx`

This file is large. Make targeted changes only — do not rewrite the file.

### Step 5a: Expand DndContext to wrap full component

- [ ] In `plan-builder.tsx`, find the `return (` of `PlanBuilder`. The `<DndContext>` currently wraps only part of the JSX. Move it to wrap the entire returned JSX tree. The sensors and handlers already exist — only move the opening/closing tags.

  Find the pattern (around line 400–500, search for `<DndContext`):
  - Move `<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>` to just inside the outermost `<div>` of the return
  - Move the closing `</DndContext>` to just before the outermost closing `</div>`

### Step 5b: Update handleDragEnd to use new cell IDs

- [ ] The existing `handleDragEnd` listens for `over.id` starting with `"day-"`. The new `WeeklyPlanGrid` uses `"cell-{day}-{mealType}"`. Update the recipe-bank drop handler:

  Find this block in `handleDragEnd` (around line 181–194):
  ```ts
  if (active.data.current?.type === "recipe-bank") {
    const overId = String(over.id);
    if (overId.startsWith("day-")) {
      const dayNum = parseInt(overId.slice(4));
  ```

  Replace with:
  ```ts
  if (active.data.current?.type === "recipe-bank") {
    const overId = String(over.id);
    if (overId.startsWith("cell-")) {
      const parts = overId.replace("cell-", "").split("-");
      const dayNum = parseInt(parts[0]);
      const mealType = parts[1] as MealType;
      const recipe = active.data.current.recipe as AutocompleteResult;
      addEntry(dayNum, {
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        calories: recipe.calories ?? null,
        protein_g: recipe.protein_g ?? null,
        carbs_g: recipe.carbs_g ?? null,
        fat_g: recipe.fat_g ?? null,
        meal_type: mealType,
        from_database: true,
        isEditing: false,
      });
    }
    return;
  }
  ```

  Note: check the existing `addEntry` signature — it may need `meal_type` added. Find `function addEntry` and add `meal_type?: MealType` to its parameter type if missing.

### Step 5c: Add `WeeklyPlanGrid` view mode

- [ ] The existing plan-builder has a `viewMode` state (`"list" | "grid"`). When `viewMode === "grid"`, render `WeeklyPlanGrid` instead of the day-list. Add this import at the top of the file:
  ```ts
  import { WeeklyPlanGrid, type GridEntry, type AutofillSuggestion } from "@/components/plans/WeeklyPlanGrid";
  import { RecipeBank } from "@/components/plans/RecipeBank";
  ```

- [ ] Find where `viewMode === "grid"` is checked in the JSX (the grid view branch). Replace its content with:
  ```tsx
  {viewMode === "grid" && (
    <WeeklyPlanGrid
      entries={days.flatMap((d) =>
        d.entries.map((e) => ({
          clientId: e.clientId,
          day_number: e.day_number,
          meal_type: e.meal_type as import("@/components/plans/WeeklyPlanGrid").MealType,
          recipe_title: e.recipe_title,
          image_url: null,
          calories: e.calories ?? null,
          protein_g: e.protein_g ?? null,
          carbs_g: e.carbs_g ?? null,
          fat_g: e.fat_g ?? null,
        }))
      )}
      durationDays={days.length}
      weekStart={weekStart}
      nutritionalGoals={goals}
      onRemove={(clientId) => {
        setDays((prev) => prev.map((d) => ({ ...d, entries: d.entries.filter((e) => e.clientId !== clientId) })));
        markDirty();
      }}
      onAddDay={() => {
        const nextDay = days.length + 1;
        setDays((prev) => [...prev, { day_number: nextDay, entries: [], expanded: true, suggesting: false, suggestionPrompt: "" }]);
        markDirty();
      }}
      onAutofill={async (day, mealType) => {
        const dayData = days.find((d) => d.day_number === day);
        const existing_titles = days.flatMap((d) => d.entries.map((e) => e.recipe_title));
        const res = await fetch(`/api/plans/${planId}/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day_number: day,
            meal_type: mealType,
            existing_titles,
            all_plan_titles: existing_titles,
            dietary_filters: dietaryFilters,
          }),
        });
        if (!res.ok) return [];
        const data = await res.json();
        const suggestions: AutofillSuggestion[] = (Array.isArray(data) ? data : []).map((s: Record<string, unknown>) => ({
          title: String(s.title ?? ""),
          description: s.description as string | undefined,
          calories: s.calories as number | undefined,
          tag: Array.isArray(s.tags) ? s.tags[0] : undefined,
        }));
        return suggestions;
      }}
      onAutofillAccept={(day, mealType, suggestion) => {
        addEntry(day, {
          recipe_title: suggestion.title,
          calories: suggestion.calories ?? null,
          meal_type: mealType,
          isEditing: false,
        });
      }}
      onOpenRecipeBank={() => {/* sidebar is always visible */}}
    />
  )}
  ```

### Step 5c: Replace RecipeBankSidebar with `<RecipeBank>`

- [ ] Find the `RecipeBankSidebar` component definition inside `plan-builder.tsx` (it is a locally-defined component). Remove its full definition.

- [ ] Find where `<RecipeBankSidebar` is rendered in the JSX. Replace with:
  ```tsx
  <RecipeBank
    planId={planId}
    dietaryFilters={dietaryFilters as string[]}
  />
  ```

- [ ] Commit:
```bash
git add src/app/\(app\)/plans/\[id\]/plan-builder.tsx
git commit -m "feat(plans/id): wire WeeklyPlanGrid + RecipeBank, expand DndContext, fix recipe-bank drop to cell IDs"
```

---

## Task 6: Verify end-to-end

- [ ] Start the dev server:
```bash
npm run dev
```

- [ ] Visit `http://localhost:3000/plans/new`:
  - Drag the big featured card in Recipe Bank → drop onto a grid cell → cell should fill ✓
  - Drag a compact list card → drop onto grid cell ✓
  - Set a start date → column headers show real dates (e.g. `Mon 12 / May`) ✓
  - Click `+` on an empty cell → shows loading then `+` (autofill disabled for new plans — expected) ✓
  - Click `+` at header right → adds a day column ✓

- [ ] Visit an existing plan at `http://localhost:3000/plans/<id>`:
  - Switch to grid view (grid icon button) → `WeeklyPlanGrid` renders ✓
  - Drag Recipe Bank card → drops into correct cell ✓
  - Click `+` on empty cell → loading spinner → 3 AI suggestions with Add/Skip/Search ✓
  - Filter chips filter Recipe Bank results ✓
  - Macro footer shows per-day calorie totals, color-coded ✓

- [ ] Check browser console — no unhandled errors during drag, drop, or autofill ✓

- [ ] Commit final verification notes or any hotfixes:
```bash
git add -A
git commit -m "fix(plans): post-wiring fixes from manual verification"
```

---

## Verification Checklist

- [ ] Drag big RecipeBank card → drops into grid cell (both `/plans/new` and `/plans/[id]`)
- [ ] Drag compact card from list → drops into grid cell
- [ ] Tap `+` on empty cell in existing plan → AI suggestions appear with Add/Skip/Search
- [ ] Set week_start via date picker → column headers show real dates
- [ ] Filter chips filter RecipeBank results by dietary tag
- [ ] Search bar returns saved recipes with bookmark badge
- [ ] Macro footer shows per-day calorie totals, color-coded vs goals
- [ ] `+` at header right edge adds a day column (capped at 14)
- [ ] Row header click toggles that row's visibility (persisted in localStorage)
- [ ] Both `/plans/new` and `/plans/[id]` use same `WeeklyPlanGrid` + `RecipeBank`
- [ ] No console errors during any interaction
