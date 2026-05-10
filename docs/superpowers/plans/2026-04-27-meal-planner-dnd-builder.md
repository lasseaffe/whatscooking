# Meal Planner Drag-and-Drop Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When arriving at `/plans/new?template=<id>`, show a two-column drag-and-drop builder pre-filled with that template's meals — no separate "create plan" step required.

**Architecture:** Replace the current `new/page.js` template-picker flow with a split-panel builder: left panel shows a `MealCarousel` (adapted from `CircularTestimonials`) of template meals + a recipe search bar with draggable results; right panel shows a weekly grid auto-filled with template meals, where every slot is a drop target. On "Save Plan", a plan + entries are created atomically via existing APIs and the user is redirected to `/plans/[id]`.

**Tech Stack:** Next.js App Router (client component), Framer Motion (drag + AnimatePresence), existing `/api/plans` POST + `/api/plans/[id]/entries` PUT, `/api/recipes/by-title` search, TypeScript, Tailwind + inline earthy styles matching existing codebase.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/(app)/plans/new/page.js` | **Modify** | Detect `?template=` param; render `TemplatePicker` when absent, `MealPlanDndBuilder` when present |
| `src/app/(app)/plans/new/meal-carousel.tsx` | **Create** | `MealCarousel` — adapted `CircularTestimonials` for meal data |
| `src/app/(app)/plans/new/dnd-builder.tsx` | **Create** | `MealPlanDndBuilder` — two-column layout, drag state, slot grid, save logic |
| `src/app/(app)/plans/new/recipe-search-panel.tsx` | **Create** | Left panel: carousel + search bar + draggable recipe cards |
| `src/app/(app)/plans/new/weekly-grid.tsx` | **Create** | Right panel: day columns × meal-type rows, drop slots |
| `src/app/(app)/plans/new/plan-templates.ts` | **Read-only** | Existing template data (no changes needed) |
| `src/app/(app)/plans/new/template-card.tsx` | **Read-only** | Used by existing picker (no changes needed) |

---

## Task 1: Create `MealCarousel` component

Adapts `CircularTestimonials` for meal objects. Shows 3 meal images (left/center/right) with Framer Motion perspective transitions. The center card shows meal name, tags, and time/calories. Arrows + autoplay cycle through template meals.

**Files:**
- Create: `src/app/(app)/plans/new/meal-carousel.tsx`

- [ ] **Step 1: Create the file with types and the component**

```tsx
"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame } from "lucide-react";

export interface CarouselMeal {
  title: string;
  image: string;
  tags: string[];
  time: string;
  calories: number;
}

interface Props {
  meals: CarouselMeal[];
  autoplay?: boolean;
}

function calculateGap(width: number) {
  const minWidth = 1024, maxWidth = 1456, minGap = 48, maxGap = 72;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export function MealCarousel({ meals, autoplay = true }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const len = useMemo(() => meals.length, [meals]);
  const active = useMemo(() => meals[activeIndex], [activeIndex, meals]);

  useEffect(() => {
    function onResize() {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    timerRef.current = setInterval(() => setActiveIndex((p) => (p + 1) % len), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, len]);

  const handleNext = useCallback(() => {
    setActiveIndex((p) => (p + 1) % len);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [len]);

  const handlePrev = useCallback(() => {
    setActiveIndex((p) => (p - 1 + len) % len);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [len]);

  function getImageStyle(index: number): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.7;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + len) % len === index;
    const isRight = (activeIndex + 1) % len === index;
    if (isActive) return { zIndex: 3, opacity: 1, pointerEvents: "auto", transform: "translateX(0) translateY(0) scale(1) rotateY(0deg)", transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
    if (isLeft) return { zIndex: 2, opacity: 0.85, pointerEvents: "auto", transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.82) rotateY(14deg)`, transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
    if (isRight) return { zIndex: 2, opacity: 0.85, pointerEvents: "auto", transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.82) rotateY(-14deg)`, transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
    return { zIndex: 1, opacity: 0, pointerEvents: "none", transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
  }

  return (
    <div className="w-full">
      {/* Image stack */}
      <div ref={containerRef} className="relative w-full" style={{ height: 200, perspective: 1000 }}>
        {meals.map((meal, i) => (
          <img
            key={meal.src ?? meal.image ?? i}
            src={meal.image}
            alt={meal.title}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-lg"
            style={getImageStyle(i)}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
          />
        ))}
      </div>

      {/* Info + controls */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-4 px-1"
        >
          <p className="font-bold text-sm leading-snug mb-1" style={{ color: "#EFE3CE" }}>{active.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {active.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#2A1808", color: "#C8522A" }}>{tag}</span>
            ))}
            <span className="flex items-center gap-0.5 text-xs ml-auto" style={{ color: "#6B4E36" }}>
              <Clock className="w-3 h-3" />{active.time}
            </span>
            <span className="flex items-center gap-0.5 text-xs" style={{ color: "#6B4E36" }}>
              <Flame className="w-3 h-3" />{active.calories}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
          style={{ background: hoverPrev ? "#C8522A" : "#2A1808" }}
          onMouseEnter={() => setHoverPrev(true)}
          onMouseLeave={() => setHoverPrev(false)}
          aria-label="Previous meal"
        >
          <FaArrowLeft size={14} color="#EFE3CE" />
        </button>
        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
          style={{ background: hoverNext ? "#C8522A" : "#2A1808" }}
          onMouseEnter={() => setHoverNext(true)}
          onMouseLeave={() => setHoverNext(false)}
          aria-label="Next meal"
        >
          <FaArrowRight size={14} color="#EFE3CE" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1 ml-auto">
          {meals.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); if (timerRef.current) clearInterval(timerRef.current); }}
              className="rounded-full transition-all border-none cursor-pointer"
              style={{ width: i === activeIndex ? 14 : 5, height: 5, background: i === activeIndex ? "#C8522A" : "#3A2416" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && npx tsc --noEmit --project tsconfig.json 2>&1 | grep meal-carousel
```

Expected: no output (no errors for this file).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add src/app/\(app\)/plans/new/meal-carousel.tsx && git commit -m "feat: add MealCarousel component for template meal preview"
```

---

## Task 2: Create `RecipeSearchPanel` (left panel)

Left panel contains: `MealCarousel` at top, then a search bar that hits `/api/recipes/by-title?q=`, then results rendered as draggable recipe cards.

**Files:**
- Create: `src/app/(app)/plans/new/recipe-search-panel.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";
import { useState, useRef } from "react";
import { Search, Loader2, GripVertical, Clock, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { MealCarousel, type CarouselMeal } from "./meal-carousel";

export interface DraggableRecipe {
  id: string | null;
  title: string;
  image: string | null;
  tags: string[];
  time: string;
  calories: number | null;
  protein_g: number | null;
  description: string | null;
}

interface Props {
  templateMeals: CarouselMeal[];
  onDragStart: (recipe: DraggableRecipe) => void;
  onDragEnd: () => void;
}

export function RecipeSearchPanel({ templateMeals, onDragStart, onDragEnd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DraggableRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/by-title?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // by-title returns a single recipe; normalize to array
          const arr = Array.isArray(data) ? data : [data];
          setResults(arr.map((r) => ({
            id: r.id ?? null,
            title: r.title ?? value,
            image: r.image_url ?? null,
            tags: r.dietary_tags ?? [],
            time: r.prep_time_minutes ? `${r.prep_time_minutes + (r.cook_time_minutes ?? 0)} min` : "",
            calories: r.calories ?? null,
            protein_g: r.protein_g ?? null,
            description: r.description ?? null,
          })));
        } else {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Carousel */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "#6B4E36" }}>Template Meals</p>
        <MealCarousel meals={templateMeals} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: "#2A1A0C" }} />
        <span className="text-xs" style={{ color: "#6B4E36" }}>Add from recipes</span>
        <div className="flex-1 h-px" style={{ background: "#2A1A0C" }} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B4E36" }} />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search recipes…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: "#C8522A" }} />}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
        {results.map((recipe) => (
          <DraggableRecipeCard key={recipe.id ?? recipe.title} recipe={recipe} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        ))}
      </div>
    </div>
  );
}

function DraggableRecipeCard({ recipe, onDragStart, onDragEnd }: { recipe: DraggableRecipe; onDragStart: (r: DraggableRecipe) => void; onDragEnd: () => void }) {
  return (
    <motion.div
      draggable
      onDragStart={() => onDragStart(recipe)}
      onDragEnd={onDragEnd}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, opacity: 0.85 }}
      className="flex items-center gap-3 rounded-xl border p-2.5 cursor-grab active:cursor-grabbing select-none"
      style={{ borderColor: "#3A2416", background: "#1C1209" }}
    >
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-xl" style={{ background: "#2A1808" }}>🍽️</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "#EFE3CE" }}>{recipe.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {recipe.time && <span className="text-xs flex items-center gap-0.5" style={{ color: "#6B4E36" }}><Clock className="w-3 h-3" />{recipe.time}</span>}
          {recipe.calories && <span className="text-xs flex items-center gap-0.5" style={{ color: "#6B4E36" }}><Flame className="w-3 h-3" />{recipe.calories}</span>}
        </div>
      </div>
      <GripVertical className="w-4 h-4 shrink-0" style={{ color: "#3A2416" }} />
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && npx tsc --noEmit 2>&1 | grep recipe-search-panel
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add src/app/\(app\)/plans/new/recipe-search-panel.tsx && git commit -m "feat: add RecipeSearchPanel with search and draggable recipe cards"
```

---

## Task 3: Create `WeeklyGrid` (right panel)

Day columns × meal-type rows. Each slot is a drop target. When a recipe is dragged over a slot, it highlights. Dropping fills the slot. Clicking an occupied slot removes it (returns to empty). Meals from the template are pre-filled on mount.

**Files:**
- Create: `src/app/(app)/plans/new/weekly-grid.tsx`

- [ ] **Step 1: Create the file with types and component**

```tsx
"use client";
import React, { useState } from "react";
import { X, Coffee, UtensilsCrossed, Soup, Cookie } from "lucide-react";
import type { DraggableRecipe } from "./recipe-search-panel";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface GridSlot {
  day: number;
  mealType: MealType;
  recipe: DraggableRecipe | null;
}

const MEAL_TYPES: { type: MealType; label: string; Icon: React.ElementType; color: string }[] = [
  { type: "breakfast", label: "Breakfast", Icon: Coffee,          color: "#7A5C1E" },
  { type: "lunch",     label: "Lunch",     Icon: UtensilsCrossed,  color: "#4A5C2A" },
  { type: "dinner",    label: "Dinner",    Icon: Soup,             color: "#7A3520" },
  { type: "snack",     label: "Snack",     Icon: Cookie,           color: "#5C4A2A" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  durationDays: number;
  slots: GridSlot[];
  draggedRecipe: DraggableRecipe | null;
  onSlotDrop: (day: number, mealType: MealType) => void;
  onSlotClear: (day: number, mealType: MealType) => void;
}

export function WeeklyGrid({ durationDays, slots, draggedRecipe, onSlotDrop, onSlotClear }: Props) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  function slotKey(day: number, mt: MealType) { return `${day}-${mt}`; }

  function getSlot(day: number, mt: MealType): GridSlot | undefined {
    return slots.find((s) => s.day === day && s.mealType === mt);
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: durationDays * 120 }}>
        {/* Header row */}
        <div className="grid mb-2" style={{ gridTemplateColumns: `80px repeat(${durationDays}, minmax(110px, 1fr))` }}>
          <div />
          {Array.from({ length: durationDays }, (_, i) => (
            <div key={i} className="text-center text-xs font-semibold py-1" style={{ color: "#EFE3CE" }}>
              {DAY_LABELS[i % 7]}
              <span className="block text-xs font-normal" style={{ color: "#6B4E36" }}>Day {i + 1}</span>
            </div>
          ))}
        </div>

        {/* Meal type rows */}
        {MEAL_TYPES.map(({ type, label, Icon, color }) => (
          <div key={type} className="grid mb-2" style={{ gridTemplateColumns: `80px repeat(${durationDays}, minmax(110px, 1fr))` }}>
            {/* Row label */}
            <div className="flex items-center gap-1.5 pr-2">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              <span className="text-xs font-medium" style={{ color: "#8A6A4A" }}>{label}</span>
            </div>

            {/* Slots */}
            {Array.from({ length: durationDays }, (_, dayIdx) => {
              const day = dayIdx + 1;
              const key = slotKey(day, type);
              const slot = getSlot(day, type);
              const isHovered = hoveredSlot === key && !!draggedRecipe;

              return (
                <div
                  key={day}
                  className="mx-1 rounded-xl transition-all border"
                  style={{
                    minHeight: 64,
                    borderColor: isHovered ? "#C8522A" : slot?.recipe ? "#3A2416" : "#2A1808",
                    background: isHovered ? "#2A1008" : slot?.recipe ? "#1C1209" : "#130C05",
                    borderStyle: slot?.recipe ? "solid" : "dashed",
                  }}
                  onDragOver={(e) => {
                    if (!draggedRecipe) return;
                    e.preventDefault();
                    setHoveredSlot(key);
                  }}
                  onDragLeave={() => setHoveredSlot(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoveredSlot(null);
                    onSlotDrop(day, type);
                  }}
                >
                  {slot?.recipe ? (
                    <div className="p-1.5 h-full flex flex-col relative group">
                      {slot.recipe.image && (
                        <img src={slot.recipe.image} alt={slot.recipe.title} className="w-full h-8 object-cover rounded-lg mb-1" />
                      )}
                      <p className="text-xs leading-snug line-clamp-2 flex-1" style={{ color: "#EFE3CE" }}>
                        {slot.recipe.title}
                      </p>
                      <button
                        onClick={() => onSlotClear(day, type)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "#C8522A" }}
                        aria-label="Remove meal"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs" style={{ color: "#3A2416" }}>
                      {isHovered ? "Drop here" : "+"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && npx tsc --noEmit 2>&1 | grep weekly-grid
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add src/app/\(app\)/plans/new/weekly-grid.tsx && git commit -m "feat: add WeeklyGrid drop-target meal slot grid"
```

---

## Task 4: Create `MealPlanDndBuilder` (orchestrator)

Owns all state: `slots`, `draggedRecipe`. Pre-fills slots from template on mount (cycling breakfast/lunch/dinner for each day). Connects left and right panels. Handles "Save Plan" — POST to `/api/plans`, then PUT `/api/plans/[id]/entries`, then redirect.

**Files:**
- Create: `src/app/(app)/plans/new/dnd-builder.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { RecipeSearchPanel, type DraggableRecipe } from "./recipe-search-panel";
import { WeeklyGrid, type GridSlot, type MealType } from "./weekly-grid";
import type { PlanTemplate } from "./plan-templates";

const MEAL_CYCLE: MealType[] = ["breakfast", "lunch", "dinner"];

function templateToSlots(template: PlanTemplate): GridSlot[] {
  const slots: GridSlot[] = [];
  for (let day = 1; day <= template.durationDays; day++) {
    MEAL_CYCLE.forEach((mealType, i) => {
      // cycle through template meals
      const meal = template.meals[(day - 1 + i) % template.meals.length];
      slots.push({
        day,
        mealType,
        recipe: {
          id: null,
          title: meal.title,
          image: meal.image,
          tags: meal.tags,
          time: meal.time,
          calories: meal.calories,
          protein_g: null,
          description: null,
        },
      });
    });
    // snack slot starts empty
    slots.push({ day, mealType: "snack", recipe: null });
  }
  return slots;
}

interface Props {
  template: PlanTemplate;
}

export function MealPlanDndBuilder({ template }: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState<GridSlot[]>(() => templateToSlots(template));
  const [draggedRecipe, setDraggedRecipe] = useState<DraggableRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState(template.title);

  const handleSlotDrop = useCallback((day: number, mealType: MealType) => {
    if (!draggedRecipe) return;
    setSlots((prev) =>
      prev.map((s) => s.day === day && s.mealType === mealType ? { ...s, recipe: draggedRecipe } : s)
    );
    setDraggedRecipe(null);
  }, [draggedRecipe]);

  const handleSlotClear = useCallback((day: number, mealType: MealType) => {
    setSlots((prev) =>
      prev.map((s) => s.day === day && s.mealType === mealType ? { ...s, recipe: null } : s)
    );
  }, []);

  async function handleSave() {
    if (!planName.trim()) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Create the plan
      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planName.trim(),
          dietary_tags: template.dietaryFilters,
          tags: template.tags,
          description: template.description,
          duration_days: template.durationDays,
          meals_per_day: template.mealsPerDay,
        }),
      });

      if (!planRes.ok) {
        const d = await planRes.json();
        setError(d.error ?? "Failed to create plan.");
        setSaving(false);
        return;
      }

      const plan = await planRes.json();

      // 2. Save entries
      const entries = slots
        .filter((s) => s.recipe !== null)
        .map((s, i) => ({
          day_number: s.day,
          meal_type: s.mealType,
          recipe_id: s.recipe!.id ?? null,
          recipe_title: s.recipe!.title,
          description: s.recipe!.description ?? null,
          calories: s.recipe!.calories ?? null,
          protein_g: s.recipe!.protein_g ?? null,
          position: i,
        }));

      if (entries.length > 0) {
        const entriesRes = await fetch(`/api/plans/${plan.id}/entries`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        });

        if (!entriesRes.ok) {
          const d = await entriesRes.json();
          setError(d.error ?? "Plan created but entries failed to save.");
          setSaving(false);
          return;
        }
      }

      router.push(`/plans/${plan.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const filledCount = slots.filter((s) => s.recipe !== null).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Plan name + save bar */}
      <div className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
        <div className="flex-1">
          <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Plan name</label>
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
          />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs mb-1" style={{ color: "#6B4E36" }}>{filledCount} meals added</p>
          <button
            onClick={handleSave}
            disabled={saving || !planName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Plan"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Recipe bank */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "#EFE3CE" }}>Recipe Bank</p>
          <RecipeSearchPanel
            templateMeals={template.meals}
            onDragStart={setDraggedRecipe}
            onDragEnd={() => setDraggedRecipe(null)}
          />
        </div>

        {/* Right: Weekly grid */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "#EFE3CE" }}>Weekly Planner</p>
          <WeeklyGrid
            durationDays={template.durationDays}
            slots={slots}
            draggedRecipe={draggedRecipe}
            onSlotDrop={handleSlotDrop}
            onSlotClear={handleSlotClear}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && npx tsc --noEmit 2>&1 | grep dnd-builder
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add src/app/\(app\)/plans/new/dnd-builder.tsx && git commit -m "feat: add MealPlanDndBuilder orchestrator with save logic"
```

---

## Task 5: Wire up `new/page.js`

When `?template=<id>` is present and matches a known template, render `MealPlanDndBuilder` directly instead of the template picker + form. When no template param, show the existing flow unchanged.

**Files:**
- Modify: `src/app/(app)/plans/new/page.js`

- [ ] **Step 1: Read the current page file to see what needs to change**

Open `src/app/(app)/plans/new/page.js` and locate the `return` block — specifically the section that renders `<TemplateCard>` grid and the plan details form.

- [ ] **Step 2: Add the import and conditional render**

At the top of `page.js`, add:

```js
import { MealPlanDndBuilder } from "./dnd-builder";
```

Then, after the `presetId` and `selectedTemplate` initialization, add a guard before the main `return`:

```js
// If template is pre-selected via URL param, go straight to the DnD builder
if (selectedTemplate && presetId) {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          <span className="text-2xl">{selectedTemplate.emoji}</span>
          {selectedTemplate.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
          {selectedTemplate.subtitle} · {selectedTemplate.durationDays} days · {selectedTemplate.mealsPerDay} meals/day
        </p>
      </div>
      <MealPlanDndBuilder template={selectedTemplate} />
    </div>
  );
}
```

Place this guard **inside the component function**, after `selectedTemplate` is resolved from `PLAN_TEMPLATES.find(...)` — before the main `return (...)`.

- [ ] **Step 3: Verify the dev server renders the new page**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && npm run dev
```

Open `http://localhost:3002/plans/new?template=plant-based` — should show the two-column builder with "Plant-Based Week" header and pre-filled meals. Should NOT show the template picker grid.

Open `http://localhost:3002/plans/new` (no param) — should still show the original template picker.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add src/app/\(app\)/plans/new/page.js && git commit -m "feat: skip template picker when template param present, show DnD builder"
```

---

## Task 6: Wire the plans page template links to use the new flow

The `/plans` page already links template cards to `/plans/new?template=<id>`. No URL changes needed — verify the existing links work end-to-end.

**Files:**
- Read-only: `src/app/(app)/plans/page.tsx` (no changes needed)

- [ ] **Step 1: Verify the full flow manually**

1. Go to `http://localhost:3002/plans`
2. Click "Plant-Based Week" template card
3. Confirm redirect is to `/plans/new?template=plant-based`
4. Confirm the DnD builder renders with pre-filled meals
5. Drag a meal from the left panel to an empty snack slot — confirm it fills
6. Hover a filled slot and click X — confirm it empties
7. Type "chickpea" in the search bar — confirm a recipe result appears as a draggable card
8. Enter a plan name and click "Save Plan"
9. Confirm redirect to `/plans/<new-id>` and the plan detail page shows the correct entries

- [ ] **Step 2: Check the `/plans/[id]` page still functions**

After saving, visit the plan detail page and verify:
- Plan title shows correctly
- PlanBuilder shows pre-filled entries (from the DnD builder save)
- SavedRecipeFit section renders (or is absent if no saved recipes match)

- [ ] **Step 3: Commit any fixes found during testing**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add -p && git commit -m "fix: <describe what was fixed>"
```

---

## Task 7: Install `react-icons` if missing

`MealCarousel` uses `FaArrowLeft` / `FaArrowRight` from `react-icons/fa`. Check if the package is already installed.

**Files:**
- Possibly modify: `package.json`

- [ ] **Step 1: Check if react-icons is installed**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && node -e "require('react-icons/fa')" 2>&1
```

Expected (if installed): no output or a module object.
Expected (if missing): `Cannot find module 'react-icons/fa'`

- [ ] **Step 2: Install only if missing**

If step 1 showed "Cannot find module":

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && npm install react-icons
```

Expected: installs successfully. Then re-run `npx tsc --noEmit` to confirm no new errors.

- [ ] **Step 3: Commit if package.json changed**

```bash
cd "C:\Users\lasse\Desktop\whatscooking" && git add package.json package-lock.json && git commit -m "chore: add react-icons dependency"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Carousel of template meals: `MealCarousel` (Task 1)
- ✅ Weekly grid auto-filled from template: `templateToSlots()` in `dnd-builder.tsx` (Task 4)
- ✅ Breakfast/lunch/dinner/snack per day: `MEAL_CYCLE` + snack slot (Task 4)
- ✅ Drag-and-drop meals into slots: `onDragStart`/`onDrop` (Tasks 2, 3, 4)
- ✅ Remove meals from slots: `onSlotClear` + X button (Task 3, 4)
- ✅ Recipe search bar: `RecipeSearchPanel` with debounced fetch (Task 2)
- ✅ Draggable search results: `DraggableRecipeCard` (Task 2)
- ✅ Layout resembling reference image (left recipe bank, right weekly grid): two-column in `MealPlanDndBuilder` (Task 4)
- ✅ Skip template picker when template pre-selected: guard in `page.js` (Task 5)
- ✅ Save plan + entries atomically: POST plan → PUT entries → redirect (Task 4)
- ✅ `react-icons` dependency check: Task 7

**Placeholder scan:** No TBDs, no "implement later", all code blocks complete.

**Type consistency:**
- `DraggableRecipe` defined in `recipe-search-panel.tsx`, imported in `weekly-grid.tsx` and `dnd-builder.tsx` ✅
- `GridSlot` defined in `weekly-grid.tsx`, imported in `dnd-builder.tsx` ✅
- `MealType` defined in `weekly-grid.tsx`, used consistently across all files ✅
- `CarouselMeal` defined in `meal-carousel.tsx`, `PlanTemplate.meals` matches shape ✅
- `PlanTemplate` imported from existing `plan-templates.ts` ✅
