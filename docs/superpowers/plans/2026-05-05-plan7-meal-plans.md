# Meal Plans Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the two separate meal plan flows into one `plans/[id]/` page with a grid/list view toggle (grid default). Add dnd-kit drag-and-drop to grid cards, empty-slot recipe suggestions, add-row/add-column, and meal prep enhancements (batch cook badge, prep day aggregator, macro week bar).

**Architecture:** `plans/[id]/page.tsx` gets a `viewMode` state. Grid view uses a new `PlanGrid` component (derived from `weekly-grid.tsx` but wired to `BuilderEntry` data and dnd-kit). List view uses the existing `PlanBuilder`. Both share the same `initialEntries` data. A slot click opens a slide-over recipe picker. The `plans/new/` flow still creates plans but redirects to `plans/[id]/` after creation.

**Tech Stack:** React, @dnd-kit/core, @dnd-kit/sortable, Supabase, Next.js App Router

---

### Task 1: Add view toggle to plans/[id]/page.tsx

**Files:**
- Modify: `src/app/(app)/plans/[id]/page.tsx`
- Create: `src/app/(app)/plans/[id]/plan-page-client.tsx`

The server component (`page.tsx`) fetches data. We move the view-toggle logic into a new client wrapper.

- [ ] **Step 1: Create plan-page-client.tsx**

Create `src/app/(app)/plans/[id]/plan-page-client.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import { PlanBuilder, type BuilderEntry } from "./plan-builder";
import { PlanGrid } from "./plan-grid";

interface PlanMeta {
  id: string;
  title: string;
  duration_days: number;
  week_start: string | null;
  dietary_filters: string[];
  nutritional_goals: Record<string, number>;
  status: string;
  meals_per_day: number;
}

interface Props {
  plan: PlanMeta;
  initialEntries: BuilderEntry[];
}

export function PlanPageClient({ plan, initialEntries }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("planViewMode") as "grid" | "list") ?? "grid";
  });

  useEffect(() => {
    localStorage.setItem("planViewMode", viewMode);
  }, [viewMode]);

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="inline-flex rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(90,50,20,0.4)" }}
        >
          {([
            { key: "grid", Icon: LayoutGrid, label: "Grid" },
            { key: "list", Icon: List,        label: "List" },
          ] as const).map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: viewMode === key ? "rgba(200,90,47,0.2)" : "transparent",
                color: viewMode === key ? "#C85A2F" : "#8A6A4A",
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "grid" ? (
        <PlanGrid
          planId={plan.id}
          planTitle={plan.title}
          durationDays={plan.duration_days ?? 7}
          weekStart={plan.week_start}
          dietaryFilters={plan.dietary_filters ?? []}
          nutritionalGoals={plan.nutritional_goals ?? {}}
          initialEntries={initialEntries}
        />
      ) : (
        <PlanBuilder
          planId={plan.id}
          planTitle={plan.title}
          durationDays={plan.duration_days ?? 7}
          weekStart={plan.week_start}
          dietaryFilters={plan.dietary_filters ?? []}
          nutritionalGoals={plan.nutritional_goals ?? {}}
          initialEntries={initialEntries}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update plans/[id]/page.tsx to use PlanPageClient**

In `src/app/(app)/plans/[id]/page.tsx`, replace the `<PlanBuilder ...>` usage with `<PlanPageClient>`:

```tsx
import { PlanPageClient } from "./plan-page-client";
// ... (keep all existing fetches)

return (
  <div className="px-6 py-8 max-w-5xl mx-auto">
    {/* Header — unchanged */}
    <div className="flex items-center gap-3 mb-6">
      {/* ... existing header JSX unchanged ... */}
    </div>

    <PlanPageClient
      plan={{
        id,
        title: plan.title,
        duration_days: plan.duration_days ?? 7,
        week_start: plan.week_start ?? null,
        dietary_filters: plan.dietary_filters ?? [],
        nutritional_goals: plan.nutritional_goals ?? {},
        status: plan.status,
        meals_per_day: plan.meals_per_day,
      }}
      initialEntries={initialEntries}
    />

    {/* SavedRecipeFit — unchanged */}
    <SavedRecipeFit
      savedRecipes={savedRecipes}
      planDietaryFilters={plan.dietary_filters ?? []}
    />
  </div>
);
```

---

### Task 2: Create PlanGrid component

**Files:**
- Create: `src/app/(app)/plans/[id]/plan-grid.tsx`

The `PlanGrid` is the grid-view editor. It uses `BuilderEntry` from `plan-builder.tsx` (same data shape) and adds dnd-kit drag-and-drop, slot-click recipe picker, add-row, and add-column.

- [ ] **Step 3: Create plan-grid.tsx**

Create `src/app/(app)/plans/[id]/plan-grid.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { Plus, X, Save, Loader2, Coffee, UtensilsCrossed, Soup, Cookie, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BuilderEntry, MealType } from "./plan-builder";
import { RecipePickerSlideOver } from "./recipe-picker-slideover";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MEAL_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  breakfast: { label: "Breakfast", icon: Coffee,          color: "#7A5C1E", bg: "#F5EDD8" },
  lunch:     { label: "Lunch",     icon: UtensilsCrossed, color: "#4A5C2A", bg: "#EBF0DC" },
  dinner:    { label: "Dinner",    icon: Soup,             color: "#7A3520", bg: "#F5E0D8" },
  snack:     { label: "Snack",     icon: Cookie,           color: "#5C4A2A", bg: "#EDE0CC" },
  dessert:   { label: "Dessert",   icon: Cookie,           color: "#7A3D4E", bg: "#F5E0E8" },
};

function makeId() { return Math.random().toString(36).slice(2); }

interface Props {
  planId: string;
  planTitle: string;
  durationDays: number;
  weekStart?: string | null;
  dietaryFilters: string[];
  nutritionalGoals: Record<string, number>;
  initialEntries: BuilderEntry[];
}

interface GridState {
  days: number;         // number of columns
  mealTypes: string[];  // row labels
  entries: BuilderEntry[];
}

// Week totals for the macro bar
function weekMacros(entries: BuilderEntry[]) {
  return {
    cal:   entries.reduce((s, e) => s + (e.calories   ?? 0), 0),
    pro:   entries.reduce((s, e) => s + (e.protein_g  ?? 0), 0),
    carbs: entries.reduce((s, e) => s + (e.carbs_g    ?? 0), 0),
    fat:   entries.reduce((s, e) => s + (e.fat_g      ?? 0), 0),
  };
}

// Batch cook: recipe appears 3+ times across the week
function batchCookRecipes(entries: BuilderEntry[]): Set<string> {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    if (!e.recipe_title) continue;
    counts[e.recipe_title] = (counts[e.recipe_title] ?? 0) + 1;
  }
  return new Set(Object.entries(counts).filter(([, n]) => n >= 3).map(([t]) => t));
}

function dayLabel(dayNumber: number, weekStart: string | null | undefined): string {
  if (!weekStart) return DAY_LABELS[(dayNumber - 1) % 7] ?? `Day ${dayNumber}`;
  const base = new Date(weekStart);
  base.setDate(base.getDate() + dayNumber - 1);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return `${days[base.getDay()]} ${base.getDate()} ${MONTH_NAMES[base.getMonth()]}`;
}

export function PlanGrid({ planId, planTitle, durationDays, weekStart, dietaryFilters, nutritionalGoals: _nutritionalGoals, initialEntries }: Props) {
  const [grid, setGrid] = useState<GridState>({
    days: durationDays,
    mealTypes: ["breakfast", "lunch", "dinner", "snack"],
    entries: initialEntries,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<{ day: number; mealType: string } | null>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function getEntry(day: number, mealType: string): BuilderEntry | undefined {
    return grid.entries.find((e) => e.day_number === day && e.meal_type === mealType);
  }

  function setEntry(day: number, mealType: string, recipe: { id: string; title: string; image_url?: string | null; calories?: number | null } | null) {
    setGrid((prev) => {
      const entries = prev.entries.filter((e) => !(e.day_number === day && e.meal_type === mealType));
      if (recipe) {
        entries.push({
          clientId: makeId(),
          day_number: day,
          meal_type: mealType as MealType,
          recipe_title: recipe.title,
          recipe_id: recipe.id,
          calories: recipe.calories ?? null,
          position: 0,
          isEditing: false,
          from_database: true,
        });
      }
      return { ...prev, entries };
    });
    markDirty();
  }

  function removeEntry(clientId: string) {
    setGrid((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.clientId !== clientId) }));
    markDirty();
  }

  function addColumn() {
    setGrid((prev) => ({ ...prev, days: prev.days + 1 }));
    markDirty();
  }

  function addRow(name: string) {
    if (!name.trim() || grid.mealTypes.includes(name.toLowerCase())) return;
    setGrid((prev) => ({ ...prev, mealTypes: [...prev.mealTypes, name.toLowerCase()] }));
    markDirty();
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const sourceEntry = grid.entries.find((e) => e.clientId === String(active.id));
    if (!sourceEntry) return;

    // over.id is "slot-{day}-{mealType}"
    const overId = String(over.id);
    if (!overId.startsWith("slot-")) return;
    const [, dayStr, ...mtParts] = overId.split("-");
    const destDay = parseInt(dayStr);
    const destMealType = mtParts.join("-");
    if (isNaN(destDay) || !destMealType) return;

    // Don't drop onto occupied slot
    const occupied = getEntry(destDay, destMealType);
    if (occupied && occupied.clientId !== sourceEntry.clientId) return;

    setGrid((prev) => ({
      ...prev,
      entries: prev.entries.map((e) =>
        e.clientId === sourceEntry.clientId
          ? { ...e, day_number: destDay, meal_type: destMealType as MealType }
          : e
      ),
    }));
    markDirty();
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    const allEntries = grid.entries.map((e, i) => ({ ...e, position: i }));
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

  const macros = weekMacros(grid.entries);
  const batchSet = batchCookRecipes(grid.entries);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button onClick={save} disabled={saving || !isDirty}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
          style={{ background: "#C85A2F", color: "#fff" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
        <div className="ml-auto flex items-center gap-2">
          {isDirty && <span className="text-xs" style={{ color: "#A69180" }}>Unsaved changes</span>}
          {savedAt && !isDirty && <span className="text-xs" style={{ color: "#4A6830" }}>✓ Saved {savedAt}</span>}
          {saveError && <span className="text-xs" style={{ color: "#C85A2F" }}>{saveError}</span>}
        </div>
      </div>

      {/* Macro week bar */}
      {macros.cal > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-4 px-4 py-2.5 rounded-xl text-xs"
          style={{ background: "rgba(42,24,8,0.5)", border: "1px solid rgba(90,50,20,0.3)" }}>
          <span className="font-semibold" style={{ color: "#C8A882" }}>Week totals:</span>
          <span style={{ color: "#A69180" }}>🔥 {macros.cal} kcal</span>
          {macros.pro > 0 && <span style={{ color: "#A69180" }}>💪 {macros.pro}g protein</span>}
          {macros.carbs > 0 && <span style={{ color: "#A69180" }}>🌾 {macros.carbs}g carbs</span>}
          {macros.fat > 0 && <span style={{ color: "#A69180" }}>🥑 {macros.fat}g fat</span>}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(90,50,20,0.3)" }}>
        <div style={{ minWidth: grid.days * 130 + 100 }}>
          {/* Header row */}
          <div className="grid border-b" style={{
            gridTemplateColumns: `100px repeat(${grid.days}, minmax(120px, 1fr)) 40px`,
            borderColor: "rgba(90,50,20,0.3)",
            background: "rgba(42,24,8,0.6)",
          }}>
            <div className="p-2" />
            {Array.from({ length: grid.days }, (_, i) => (
              <div key={i} className="p-2 text-center text-xs font-semibold" style={{ color: "#C8A882" }}>
                {dayLabel(i + 1, weekStart)}
              </div>
            ))}
            {/* Add column button */}
            <button onClick={addColumn}
              className="flex items-center justify-center p-2 text-xs font-bold hover:opacity-80 transition-opacity"
              style={{ color: "#C85A2F" }}
              title="Add day">
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Meal type rows */}
          {grid.mealTypes.map((mealType) => {
            const cfg = MEAL_TYPE_CONFIG[mealType] ?? MEAL_TYPE_CONFIG.dinner;
            const Icon = cfg.icon;
            return (
              <div key={mealType} className="grid border-b last:border-b-0" style={{
                gridTemplateColumns: `100px repeat(${grid.days}, minmax(120px, 1fr)) 40px`,
                borderColor: "rgba(90,50,20,0.2)",
              }}>
                {/* Row label */}
                <div className="flex items-center gap-1.5 p-2.5">
                  <Icon style={{ width: 13, height: 13, color: cfg.color }} />
                  <span className="text-xs font-semibold capitalize" style={{ color: "#8A6A4A" }}>{cfg.label}</span>
                </div>

                {/* Slots */}
                {Array.from({ length: grid.days }, (_, dayIdx) => {
                  const day = dayIdx + 1;
                  const entry = getEntry(day, mealType);
                  return (
                    <GridSlot
                      key={day}
                      day={day}
                      mealType={mealType}
                      entry={entry}
                      batchSet={batchSet}
                      onClear={() => entry && removeEntry(entry.clientId)}
                      onAddClick={() => setPickerSlot({ day, mealType })}
                    />
                  );
                })}
                <div />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add row button */}
      <AddRowButton onAdd={addRow} />

      {/* Drag overlay */}
      <DragOverlay>
        {activeId ? (() => {
          const entry = grid.entries.find((e) => e.clientId === activeId);
          if (!entry) return null;
          return (
            <div className="px-2 py-1.5 rounded-lg text-xs font-semibold shadow-xl"
              style={{ background: "#C85A2F", color: "#fff", opacity: 0.9 }}>
              {entry.recipe_title || "Meal"}
            </div>
          );
        })() : null}
      </DragOverlay>

      {/* Recipe picker slide-over */}
      {pickerSlot && (
        <RecipePickerSlideOver
          mealType={pickerSlot.mealType}
          dietaryFilters={dietaryFilters}
          onSelect={(recipe) => {
            setEntry(pickerSlot.day, pickerSlot.mealType, recipe);
            setPickerSlot(null);
          }}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </DndContext>
  );
}

// ── Grid slot ─────────────────────────────────────────────────────────────────

function GridSlot({ day, mealType, entry, batchSet, onClear, onAddClick }: {
  day: number;
  mealType: string;
  entry?: BuilderEntry;
  batchSet: Set<string>;
  onClear: () => void;
  onAddClick: () => void;
}) {
  const slotId = `slot-${day}-${mealType}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slotId });

  if (entry) {
    return (
      <DraggableSlot
        entry={entry}
        dropId={slotId}
        isOver={isOver}
        isBatch={batchSet.has(entry.recipe_title)}
        onClear={onClear}
      />
    );
  }

  return (
    <div
      ref={setDropRef}
      onClick={onAddClick}
      className="m-1 rounded-xl flex items-center justify-center cursor-pointer transition-all"
      style={{
        minHeight: 72,
        border: `1px dashed ${isOver ? "#C8522A" : "rgba(90,50,20,0.35)"}`,
        background: isOver ? "rgba(200,82,42,0.08)" : "transparent",
      }}
    >
      <span className="text-xs" style={{ color: isOver ? "#C8522A" : "#3A2416" }}>
        {isOver ? "Drop here" : "+"}
      </span>
    </div>
  );
}

function DraggableSlot({ entry, dropId, isOver, isBatch, onClear }: {
  entry: BuilderEntry;
  dropId: string;
  isOver: boolean;
  isBatch: boolean;
  onClear: () => void;
}) {
  const { setNodeRef: setDropRef } = useDroppable({ id: dropId });
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: entry.clientId });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={(el) => { setDropRef(el); setDragRef(el); }}
      style={{
        ...style,
        minHeight: 72,
        margin: 4,
        opacity: isDragging ? 0.4 : 1,
        background: isOver ? "rgba(200,82,42,0.08)" : "rgba(42,24,8,0.5)",
        border: `1px solid ${isOver ? "#C8522A" : "rgba(90,50,20,0.4)"}`,
        borderRadius: 12,
        touchAction: "none",
      }}
      className="group flex flex-col relative p-1.5 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <p className="text-xs leading-snug line-clamp-3" style={{ color: "#EFE3CE" }}>
        {entry.recipe_title}
      </p>
      {entry.calories && (
        <span className="text-xs mt-auto pt-1" style={{ color: "#6B5040" }}>{entry.calories} kcal</span>
      )}
      {isBatch && (
        <span
          className="absolute top-1 left-1 text-xs px-1 rounded"
          title="Batch cook this recipe — it appears 3+ times this week"
          style={{ background: "rgba(200,82,42,0.2)", color: "#C8522A", fontSize: 9 }}
        >
          🍳 batch
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "#C8522A" }}
        aria-label="Remove"
      >
        <X style={{ width: 9, height: 9, color: "#fff" }} />
      </button>
      <div className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical style={{ width: 10, height: 10, color: "#A69180" }} />
      </div>
    </div>
  );
}

function AddRowButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const PRESETS = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Appetizer", "Brunch"];

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
          style={{ borderColor: "rgba(90,50,20,0.4)", color: "#8A6A4A", background: "transparent" }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Add meal type row
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => { onAdd(p); setOpen(false); setValue(""); }}
              className="px-3 py-1 rounded-full text-xs font-medium border"
              style={{ borderColor: "rgba(90,50,20,0.4)", color: "#C8A882", background: "rgba(42,24,8,0.4)" }}>
              {p}
            </button>
          ))}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { onAdd(value); setOpen(false); setValue(""); } }}
            placeholder="Custom name…"
            className="px-3 py-1 rounded-xl border text-xs focus:outline-none"
            style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
            autoFocus
          />
          <button onClick={() => setOpen(false)} className="text-xs" style={{ color: "#6B5040" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 3: Create RecipePickerSlideOver component

**Files:**
- Create: `src/app/(app)/plans/[id]/recipe-picker-slideover.tsx`

- [ ] **Step 4: Create recipe-picker-slideover.tsx**

Create `src/app/(app)/plans/[id]/recipe-picker-slideover.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Clock, Flame, Loader2 } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  image_url?: string | null;
  calories?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  dietary_tags?: string[] | null;
}

interface Props {
  mealType: string;
  dietaryFilters: string[];
  onSelect: (recipe: Recipe) => void;
  onClose: () => void;
}

export function RecipePickerSlideOver({ mealType, dietaryFilters: _dietaryFilters, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      // Show suggestions for the meal type when no query
      fetchSuggestions();
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      // Fetch recipes appropriate for the meal type
      const mealParam = ["breakfast","lunch","dinner","snack","dessert"].includes(mealType.toLowerCase())
        ? `&type=${encodeURIComponent(mealType)}`
        : "";
      const res = await fetch(`/api/recipes/autocomplete?q=&limit=20${mealParam}`);
      if (res.ok) setResults(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md h-[80vh] sm:h-full sm:max-h-screen flex flex-col"
        style={{ background: "var(--bg-base, #1C1209)", borderLeft: "1px solid rgba(90,50,20,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(90,50,20,0.3)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B5040" }}>Add meal</p>
            <h3 className="text-base font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              {mealLabel}
            </h3>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg" style={{ color: "#6B5040" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(90,50,20,0.2)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6B5040" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${mealLabel.toLowerCase()} recipes…`}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(42,24,8,0.6)", color: "#EFE3CE", border: "1px solid rgba(90,50,20,0.4)" }}
              autoFocus
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin" style={{ color: "#6B5040" }} />}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-4xl">🍳</span>
              <p className="text-sm" style={{ color: "#6B5040" }}>No recipes found</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y" style={{ divideColor: "rgba(90,50,20,0.15)" }}>
              {results.map((r) => {
                const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
                return (
                  <button
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(42,24,8,0.4)] transition-colors w-full"
                    style={{ borderBottom: "1px solid rgba(90,50,20,0.1)" }}
                  >
                    {r.image_url ? (
                      <img src={r.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl"
                        style={{ background: "rgba(42,24,8,0.6)" }}>
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>{r.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {totalTime > 0 && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "#6B5040" }}>
                            <Clock style={{ width: 10, height: 10 }} />{totalTime}m
                          </span>
                        )}
                        {r.calories && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "#6B5040" }}>
                            <Flame style={{ width: 10, height: 10 }} />{r.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep -E "plan-grid|plan-page|recipe-picker" | head -20
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/plans/[id]/plan-page-client.tsx src/app/(app)/plans/[id]/plan-grid.tsx src/app/(app)/plans/[id]/recipe-picker-slideover.tsx src/app/(app)/plans/[id]/page.tsx
git commit -m "feat: meal plans grid/list view toggle, dnd grid cards, slot click recipe picker, add row/column, macro bar, batch badge"
```
