# Meal Plan Creator & Editor Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the meal plan creator into a carousel-first, macro-aware flow and add a week + per-day nutrition bar to the plan builder.

**Architecture:** Six targeted file edits — data layer first (template macros + goals utility), then UI layer (card, page, builder, API). Each task is independently testable. No new DB tables; `nutritional_goals` column already exists on `meal_plans`.

**Tech Stack:** Next.js App Router · React · Tailwind (inline styles, brand tokens) · Supabase · TypeScript

---

## File Map

| File | Role | Change |
|---|---|---|
| `src/app/(app)/plans/new/plan-templates.ts` | Template data | Add `protein_g`, `carbs_g`, `fat_g` to each meal entry |
| `src/lib/nutrition-goals.ts` | Shared utility | New — fetch user goals from `calorie_goals`, fall back to RDA |
| `src/app/(app)/plans/new/template-card.tsx` | Template card UI | Add macro progress bars below card body, accept `goals` prop |
| `src/app/(app)/plans/new/page.js` | Creator page | Reorder layout: carousel hero → inline form → filters → CTA |
| `src/app/(app)/plans/[id]/plan-builder.tsx` | Plan editor | Add week macro bar + per-day kcal/protein footer |
| `src/app/api/plans/route.ts` | Plans API | Send `nutritional_goals`, `duration_days`, `meals_per_day` on POST |

---

## Task 1 — Add macro fields to template meal data

**Files:**
- Modify: `src/app/(app)/plans/new/plan-templates.ts`

- [ ] **Step 1: Add `protein_g`, `carbs_g`, `fat_g` to the `PlanTemplate` meal interface**

Replace lines 14–20 in `plan-templates.ts`:

```ts
meals: {
  title: string;
  image: string;
  tags: string[];
  time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}[];
```

- [ ] **Step 2: Fill in macro values for all 7 templates**

Replace the entire `PLAN_TEMPLATES` array. Use realistic per-meal values consistent with each template's identity (high-protein ≈ 40g protein/meal, plant-based ≈ 15g, etc.):

```ts
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "high-protein",
    emoji: "💪",
    title: "High-Protein Week",
    subtitle: "Build muscle, feel full",
    description: "30g+ protein per meal. Grilled chicken, salmon, eggs, Greek yogurt, and lean beef. Every meal fuels your workout.",
    tags: ["High Protein", "Meal Prep", "Under 30 min"],
    tagKeys: ["tag.high_protein", "tag.meal_prep", "tag.under_30"],
    dietaryFilters: ["high-protein"],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #1a2a1a 0%, #2d4a2d 100%)",
    accentColor: "#4ade80",
    meals: [
      { title: "Grilled Herb Chicken", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["High Protein", "Quick Cook"], time: "20 min", calories: 380, protein_g: 42, carbs_g: 8, fat_g: 14 },
      { title: "Miso Glazed Salmon", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", tags: ["High Protein", "Gluten-Free"], time: "15 min", calories: 340, protein_g: 38, carbs_g: 12, fat_g: 16 },
      { title: "Ahi Tuna Poke Bowl", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", tags: ["High Protein", "Quick Cook"], time: "20 min", calories: 520, protein_g: 44, carbs_g: 52, fat_g: 12 },
      { title: "Egg White Frittata", image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80", tags: ["High Protein", "Vegetarian"], time: "25 min", calories: 220, protein_g: 28, carbs_g: 6, fat_g: 8 },
      { title: "Lean Turkey Meatballs", image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80", tags: ["High Protein", "Meal Prep"], time: "35 min", calories: 280, protein_g: 34, carbs_g: 10, fat_g: 9 },
    ],
  },
  {
    id: "plant-based",
    emoji: "🌱",
    title: "Plant-Based Week",
    subtitle: "100% vegan, 100% delicious",
    description: "A week of vibrant, satisfying vegan meals. Chickpea curries, Buddha bowls, black bean tacos — proving plant-based is never boring.",
    tags: ["Vegan", "High Fiber", "Budget"],
    tagKeys: ["tag.vegan", "tag.meal_prep", "tag.low_cost"],
    dietaryFilters: ["vegan", "dairy-free"],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #0d2818 0%, #1a4a2e 100%)",
    accentColor: "#86efac",
    meals: [
      { title: "Chickpea Coconut Curry", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80", tags: ["Vegan", "Budget"], time: "20 min", calories: 420, protein_g: 14, carbs_g: 58, fat_g: 14 },
      { title: "Rainbow Buddha Bowl", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tags: ["Vegan", "Meal Prep"], time: "30 min", calories: 620, protein_g: 18, carbs_g: 88, fat_g: 20 },
      { title: "Crispy Cauliflower Tacos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80", tags: ["Vegan", "Quick Cook"], time: "30 min", calories: 320, protein_g: 10, carbs_g: 48, fat_g: 10 },
      { title: "Mushroom & Walnut Ragu", image: "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=600&q=80", tags: ["Vegan", "Hearty"], time: "35 min", calories: 580, protein_g: 16, carbs_g: 62, fat_g: 28 },
      { title: "Red Lentil Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", tags: ["Vegan", "Budget", "Batch Cook"], time: "30 min", calories: 310, protein_g: 18, carbs_g: 44, fat_g: 6 },
    ],
  },
  {
    id: "quick-weeknights",
    emoji: "⚡",
    title: "Quick Weeknight Meals",
    subtitle: "Dinner on the table in 30 min",
    description: "Every recipe under 30 minutes. Real food for real busy people — no shortcuts on flavour, only on time.",
    tags: ["Under 30 min", "Quick Cook", "Weeknight"],
    tagKeys: ["tag.under_30", "tag.quick_cook", "tag.family"],
    dietaryFilters: [],
    durationDays: 5,
    mealsPerDay: 2,
    gradient: "linear-gradient(135deg, #2a1a00 0%, #4a3000 100%)",
    accentColor: "#fbbf24",
    meals: [
      { title: "Cacio e Pepe", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80", tags: ["Quick Cook", "Vegetarian"], time: "15 min", calories: 580, protein_g: 18, carbs_g: 78, fat_g: 22 },
      { title: "Better-Than-Takeout Fried Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80", tags: ["Quick Cook", "Budget"], time: "15 min", calories: 420, protein_g: 16, carbs_g: 62, fat_g: 12 },
      { title: "Salmon Teriyaki", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", tags: ["Quick Cook", "High Protein"], time: "20 min", calories: 340, protein_g: 38, carbs_g: 18, fat_g: 12 },
      { title: "Shakshuka", image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80", tags: ["Quick Cook", "Vegetarian"], time: "25 min", calories: 280, protein_g: 14, carbs_g: 22, fat_g: 16 },
      { title: "Smash Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", tags: ["Quick Cook", "Under 30 min"], time: "20 min", calories: 680, protein_g: 36, carbs_g: 48, fat_g: 36 },
    ],
  },
  {
    id: "mediterranean",
    emoji: "🫒",
    title: "Mediterranean Diet",
    subtitle: "The world's healthiest cuisine",
    description: "Olive oil, fresh vegetables, lean protein, and whole grains. Linked to longevity and heart health — and it tastes incredible.",
    tags: ["Mediterranean", "Heart Healthy", "Gluten-Free"],
    tagKeys: ["tag.mediterranean", "tag.gluten_free", "tag.vegetarian"],
    dietaryFilters: ["gluten-free"],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #001a2c 0%, #002d4a 100%)",
    accentColor: "#38bdf8",
    meals: [
      { title: "Shakshuka", image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80", tags: ["Mediterranean", "Vegetarian"], time: "25 min", calories: 280, protein_g: 14, carbs_g: 22, fat_g: 16 },
      { title: "Greek Yogurt Baked Chicken", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["Mediterranean", "High Protein"], time: "50 min", calories: 420, protein_g: 46, carbs_g: 12, fat_g: 18 },
      { title: "Classic Greek Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tags: ["Mediterranean", "Quick Cook"], time: "10 min", calories: 280, protein_g: 8, carbs_g: 18, fat_g: 20 },
      { title: "Lamb Kofta Kebabs", image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80", tags: ["Mediterranean", "High Protein"], time: "25 min", calories: 480, protein_g: 36, carbs_g: 14, fat_g: 30 },
      { title: "Silky Smooth Hummus", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80", tags: ["Mediterranean", "Vegan"], time: "80 min", calories: 180, protein_g: 8, carbs_g: 20, fat_g: 8 },
    ],
  },
  {
    id: "budget-friendly",
    emoji: "💰",
    title: "Budget Friendly Week",
    subtitle: "Feed 4 for under $50",
    description: "Hearty, filling meals that cost next to nothing. Lentils, beans, eggs, and smart protein — proving you don't need to spend to eat well.",
    tags: ["Budget", "Batch Cook", "High Fiber"],
    tagKeys: ["tag.low_cost", "tag.batch_cook", "tag.meal_prep"],
    dietaryFilters: [],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #2a1a0a 0%, #4a2e10 100%)",
    accentColor: "#fb923c",
    meals: [
      { title: "1-Pot Vegan Chili", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80", tags: ["Budget", "Batch Cook"], time: "40 min", calories: 340, protein_g: 16, carbs_g: 52, fat_g: 6 },
      { title: "Classic Minestrone", image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&q=80", tags: ["Budget", "Vegan"], time: "45 min", calories: 280, protein_g: 10, carbs_g: 44, fat_g: 6 },
      { title: "Lean Turkey Meatballs", image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80", tags: ["Budget", "High Protein"], time: "35 min", calories: 280, protein_g: 34, carbs_g: 10, fat_g: 9 },
      { title: "Better-Than-Takeout Fried Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80", tags: ["Budget", "Quick Cook"], time: "15 min", calories: 420, protein_g: 16, carbs_g: 62, fat_g: 12 },
      { title: "Red Lentil Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", tags: ["Budget", "Vegan"], time: "30 min", calories: 310, protein_g: 18, carbs_g: 44, fat_g: 6 },
    ],
  },
  {
    id: "family-feast",
    emoji: "👨‍👩‍👧‍👦",
    title: "Family Feast Week",
    subtitle: "Everyone at the table, happy",
    description: "Crowd-pleasing classics the whole family will love. No complicated techniques, no unusual ingredients — just reliable, delicious dinners.",
    tags: ["Family", "Kid-Friendly", "Comfort Food"],
    tagKeys: ["tag.family", "tag.quick_cook", "tag.low_cost"],
    dietaryFilters: [],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #1a0a2a 0%, #2d1a45 100%)",
    accentColor: "#c084fc",
    meals: [
      { title: "The Ultimate Lasagna", image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80", tags: ["Family", "Make Ahead"], time: "85 min", calories: 720, protein_g: 36, carbs_g: 72, fat_g: 32 },
      { title: "Chicken Pot Pie", image: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80", tags: ["Family", "Comfort"], time: "55 min", calories: 560, protein_g: 28, carbs_g: 52, fat_g: 26 },
      { title: "Ultimate Mac & Cheese", image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&q=80", tags: ["Family", "Kid-Friendly"], time: "40 min", calories: 620, protein_g: 22, carbs_g: 74, fat_g: 26 },
      { title: "Perfect Roast Chicken", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["Family", "Weekend"], time: "75 min", calories: 580, protein_g: 48, carbs_g: 8, fat_g: 36 },
      { title: "Extra-Fluffy Pancakes", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&q=80", tags: ["Family", "Breakfast"], time: "25 min", calories: 220, protein_g: 6, carbs_g: 36, fat_g: 6 },
    ],
  },
  {
    id: "meal-prep-sunday",
    emoji: "📦",
    title: "Meal Prep Sunday",
    subtitle: "Cook once, eat all week",
    description: "Five batch-friendly recipes cooked on Sunday that provide lunches and dinners through Friday. Minimum effort, maximum variety.",
    tags: ["Meal Prep", "Batch Cook", "Budget"],
    tagKeys: ["tag.meal_prep", "tag.batch_cook", "tag.low_cost"],
    dietaryFilters: [],
    durationDays: 5,
    mealsPerDay: 2,
    gradient: "linear-gradient(135deg, #0a1a2a 0%, #1a2d45 100%)",
    accentColor: "#67e8f9",
    meals: [
      { title: "Herb Grilled Chicken Meal Prep", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["Meal Prep", "High Protein"], time: "25 min", calories: 280, protein_g: 38, carbs_g: 4, fat_g: 12 },
      { title: "Classic Beef Stew", image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&q=80", tags: ["Batch Cook", "Comfort"], time: "3 hrs", calories: 560, protein_g: 40, carbs_g: 44, fat_g: 22 },
      { title: "Massaged Kale & Farro Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tags: ["Meal Prep", "Vegan"], time: "30 min", calories: 360, protein_g: 12, carbs_g: 58, fat_g: 10 },
      { title: "1-Pot Vegan Chili", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80", tags: ["Batch Cook", "Budget"], time: "40 min", calories: 340, protein_g: 16, carbs_g: 52, fat_g: 6 },
      { title: "Brown Butter Banana Bread", image: "https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=600&q=80", tags: ["Meal Prep", "Snack"], time: "75 min", calories: 280, protein_g: 4, carbs_g: 44, fat_g: 12 },
    ],
  },
];
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors on `plan-templates.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/plans/new/plan-templates.ts
git commit -m "feat(plans): add protein_g/carbs_g/fat_g to template meal entries"
```

---

## Task 2 — Create `getUserNutritionGoals` utility

**Files:**
- Create: `src/lib/nutrition-goals.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/nutrition-goals.ts
import { createClient } from "@/lib/supabase/server";

export interface NutritionalGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const RDA_DEFAULTS: NutritionalGoals = {
  calories: 2000,
  protein_g: 50,
  carbs_g: 300,
  fat_g: 65,
};

export async function getUserNutritionGoals(userId: string): Promise<NutritionalGoals> {
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("calorie_goals")
    .select("target_calories, notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (!goal) return RDA_DEFAULTS;

  let parsedMacros: Partial<NutritionalGoals> = {};
  try {
    parsedMacros = JSON.parse(goal.notes ?? "{}");
  } catch {
    // malformed notes — use RDA
  }

  return {
    calories: goal.target_calories ?? RDA_DEFAULTS.calories,
    protein_g: parsedMacros.protein_g ?? RDA_DEFAULTS.protein_g,
    carbs_g: parsedMacros.carbs_g ?? RDA_DEFAULTS.carbs_g,
    fat_g: parsedMacros.fat_g ?? RDA_DEFAULTS.fat_g,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/nutrition-goals.ts
git commit -m "feat(plans): add getUserNutritionGoals utility with RDA fallback"
```

---

## Task 3 — Add macro progress bars to TemplateCard

**Files:**
- Modify: `src/app/(app)/plans/new/template-card.tsx`

- [ ] **Step 1: Add `goals` prop and `templateAvgMacros` helper**

Add `NutritionalGoals` import and update the props interface and component signature. Add a helper that computes the template's average daily macros from its meal entries. Insert this before the `TemplateCard` function:

```tsx
import type { NutritionalGoals } from "@/lib/nutrition-goals";

// Compute average daily macros from template meals (used as proxy for avg daily intake)
function templateAvgMacros(template: PlanTemplate) {
  const n = template.meals.length;
  if (n === 0) return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  return {
    calories: Math.round(template.meals.reduce((s, m) => s + m.calories, 0) / n),
    protein_g: Math.round(template.meals.reduce((s, m) => s + (m.protein_g ?? 0), 0) / n),
    carbs_g: Math.round(template.meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0) / n),
    fat_g: Math.round(template.meals.reduce((s, m) => s + (m.fat_g ?? 0), 0) / n),
  };
}

function barColor(pct: number): string {
  if (pct >= 0.9 && pct <= 1.1) return "#4caf7a"; // on target: green
  if (pct > 1.1) return "#d4a843";                 // over: amber
  if (pct >= 0.6) return "#e07a3a";                // below: orange
  return "#888";                                    // far below: muted
}
```

- [ ] **Step 2: Update `TemplateCardProps` and function signature**

```tsx
interface TemplateCardProps {
  template: PlanTemplate;
  selected: boolean;
  onSelect: () => void;
  goals: NutritionalGoals;
}

export function TemplateCard({ template, selected, onSelect, goals }: TemplateCardProps) {
```

- [ ] **Step 3: Add macro bars section inside the card body**

Inside the `return` JSX, after the `<div className="flex flex-wrap gap-1.5">` tags block (after the closing `</div>` of that flex wrap), add:

```tsx
        {/* ── Macro progress bars ─────────────────────────── */}
        {(() => {
          const avg = templateAvgMacros(template);
          const macros = [
            { label: "Calories", value: avg.calories, goal: goals.calories, unit: "kcal" },
            { label: "Protein",  value: avg.protein_g, goal: goals.protein_g, unit: "g" },
            { label: "Carbs",    value: avg.carbs_g,   goal: goals.carbs_g,   unit: "g" },
            { label: "Fat",      value: avg.fat_g,     goal: goals.fat_g,     unit: "g" },
          ];
          return (
            <div className="mt-3 space-y-1.5">
              {macros.map(({ label, value, goal, unit }) => {
                const pct = goal > 0 ? value / goal : 0;
                const fillPct = Math.min(pct, 1.15) * 100;
                const color = barColor(pct);
                return (
                  <div key={label}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[10px]" style={{ color: "#6B4E36" }}>{label}</span>
                      <span className="text-[10px] font-semibold" style={{ color }}>
                        {value}{unit} <span style={{ color: "#4A3020", fontWeight: 400 }}>/ {goal}{unit}</span>
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 4, background: "#2A1808" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${fillPct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/plans/new/template-card.tsx
git commit -m "feat(plans): add macro progress bars to TemplateCard"
```

---

## Task 4 — Redesign the creator page layout

**Files:**
- Modify: `src/app/(app)/plans/new/page.js`

This is a full rewrite of the page component. The new layout: page heading → single-row carousel with arrows → inline form row (name + days + meals/day, always visible) → dietary filter chips → CTA. Selecting a template auto-fills the form; the collapsed accordion is removed.

- [ ] **Step 1: Replace the entire file content**

```jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, Target } from "lucide-react";
import { PLAN_TEMPLATES } from "./plan-templates";
import { TemplateCard } from "./template-card";
import { MealPlanDndBuilder } from "./dnd-builder";

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "high-protein", "keto", "paleo", "low-carb",
];

const RDA_DEFAULTS = { calories: 2000, protein_g: 50, carbs_g: 300, fat_g: 65 };

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = useState(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId) ?? null : null
  );
  const [title, setTitle] = useState(selectedTemplate?.title ?? "");
  const [durationDays, setDurationDays] = useState(selectedTemplate?.durationDays ?? 7);
  const [mealsPerDay, setMealsPerDay] = useState(selectedTemplate?.mealsPerDay ?? 3);
  const [dietaryFilters, setDietaryFilters] = useState(selectedTemplate?.dietaryFilters ?? []);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState(RDA_DEFAULTS);
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  // Carousel offset — how many cards scrolled
  const [carouselOffset, setCarouselOffset] = useState(0);
  const CARDS_VISIBLE = 3; // desktop; CSS handles narrower viewports

  // Load user nutrition goals (server action via API)
  useEffect(() => {
    fetch("/api/nutrition-goals")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setGoals(data);
        setGoalsLoaded(true);
      })
      .catch(() => setGoalsLoaded(true));
  }, []);

  // Auto-fill form when template selected
  useEffect(() => {
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setDurationDays(selectedTemplate.durationDays);
      setMealsPerDay(selectedTemplate.mealsPerDay);
      setDietaryFilters(selectedTemplate.dietaryFilters);
    }
  }, [selectedTemplate]);

  function toggleDiet(tag) {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function selectTemplate(tpl) {
    if (selectedTemplate?.id === tpl.id) {
      setSelectedTemplate(null);
      setTitle("");
      setDurationDays(7);
      setMealsPerDay(3);
      setDietaryFilters([]);
    } else {
      setSelectedTemplate(tpl);
    }
  }

  const maxOffset = Math.max(0, PLAN_TEMPLATES.length - CARDS_VISIBLE);

  async function create() {
    if (!title.trim()) { setError("Give your plan a name."); return; }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dietary_tags: dietaryFilters,
          tags: selectedTemplate ? selectedTemplate.tags : [],
          description: selectedTemplate
            ? selectedTemplate.description
            : `${durationDays}-day plan, ${mealsPerDay} meals/day`,
          duration_days: durationDays,
          meals_per_day: mealsPerDay,
          nutritional_goals: goals,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create plan.");
        setCreating(false);
        return;
      }

      const plan = await res.json();
      router.push(`/plans/${plan.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  // Preset template: skip picker, go to DnD builder
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

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Page heading ─────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          <CalendarDays className="w-6 h-6" style={{ color: "#C8522A" }} />
          New Meal Plan
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
          Start from a template or build your own.
        </p>
      </div>

      {/* ── Template carousel ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "#C8522A" }} />
          <h2 className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>Choose a Template</h2>
          <span className="text-xs" style={{ color: "#6B4E36" }}>— optional</span>
          {!goalsLoaded && (
            <span className="text-xs ml-auto" style={{ color: "#6B4E36" }}>Loading your goals…</span>
          )}
          {goalsLoaded && goals.calories === RDA_DEFAULTS.calories && goals.protein_g === RDA_DEFAULTS.protein_g && (
            <a
              href="/calorie-tracker?tab=goals"
              className="flex items-center gap-1 text-xs ml-auto px-2 py-0.5 rounded-full border"
              style={{ borderColor: "#3A2416", color: "#C8522A" }}
            >
              <Target className="w-3 h-3" /> Set your goals →
            </a>
          )}
        </div>

        <div className="relative flex items-center gap-2">
          {/* Prev arrow */}
          <button
            onClick={() => setCarouselOffset((o) => Math.max(0, o - 1))}
            disabled={carouselOffset === 0}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-opacity disabled:opacity-30"
            style={{ borderColor: "#3A2416", background: "#1C1209", color: "#EFE3CE" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Card track */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-3 transition-transform duration-300"
              style={{ transform: `translateX(calc(-${carouselOffset} * (33.333% + 4px)))` }}
            >
              {PLAN_TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="flex-shrink-0" style={{ width: "calc(33.333% - 8px)" }}>
                  <TemplateCard
                    template={tpl}
                    selected={selectedTemplate?.id === tpl.id}
                    onSelect={() => selectTemplate(tpl)}
                    goals={goals}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={() => setCarouselOffset((o) => Math.min(maxOffset, o + 1))}
            disabled={carouselOffset >= maxOffset}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-opacity disabled:opacity-30"
            style={{ borderColor: "#3A2416", background: "#1C1209", color: "#EFE3CE" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Inline form row ──────────────────────────────────── */}
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{ borderColor: "#3A2416", background: "#1C1209" }}
      >
        {/* Name + duration + meals — always visible */}
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
              Plan name *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My High-Protein Week"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Days</label>
            <input
              type="number" min={1} max={30} value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-16 px-3 py-2 rounded-xl border text-sm text-center focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Meals/day</label>
            <input
              type="number" min={1} max={6} value={mealsPerDay}
              onChange={(e) => setMealsPerDay(Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-xl border text-sm text-center focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
        </div>

        {/* Dietary filters */}
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "#8A6A4A" }}>
            Dietary filters
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((tag) => (
              <button
                key={tag} type="button" onClick={() => toggleDiet(tag)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: dietaryFilters.includes(tag) ? "#C8522A" : "#3A2416",
                  background: dietaryFilters.includes(tag) ? "#2A1010" : "#130C05",
                  color: dietaryFilters.includes(tag) ? "#C8522A" : "#6B4E36",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-3 rounded-xl border text-sm font-medium"
          style={{ borderColor: "#3A2416", color: "#6B4E36" }}
        >
          Cancel
        </button>
        <button
          onClick={create}
          disabled={creating || !title.trim()}
          className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          style={{ background: "#C8522A", color: "#fff" }}
        >
          {creating ? "Creating…" : "Create plan →"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/plans/new/page.js
git commit -m "feat(plans): redesign creator — carousel hero, inline form, always-visible fields"
```

---

## Task 5 — Add `/api/nutrition-goals` endpoint

**Files:**
- Create: `src/app/api/nutrition-goals/route.ts`

The creator page fetches goals client-side (it's a client component). This lightweight route calls `getUserNutritionGoals` and returns the result.

- [ ] **Step 1: Create the route**

```ts
// src/app/api/nutrition-goals/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserNutritionGoals } from "@/lib/nutrition-goals";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getUserNutritionGoals(user.id);
  return NextResponse.json(goals);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/nutrition-goals/route.ts
git commit -m "feat(plans): add /api/nutrition-goals endpoint"
```

---

## Task 6 — Store `nutritional_goals`, `duration_days`, `meals_per_day` on plan creation

**Files:**
- Modify: `src/app/api/plans/route.ts`

- [ ] **Step 1: Accept and store `nutritional_goals` in the POST handler**

In the POST handler, update the destructuring line and the `insert` call:

Replace:
```ts
const { title, cuisine, plan_type, serves, start_date, end_date, description, is_public, dietary_tags, tags, duration_days, meals_per_day } = body;
```
With:
```ts
const { title, cuisine, plan_type, serves, start_date, end_date, description, is_public, dietary_tags, tags, duration_days, meals_per_day, nutritional_goals } = body;
```

Then inside the `.insert({...})` call, add after `meals_per_day: meals_per_day ?? null,`:
```ts
      nutritional_goals: nutritional_goals ?? null,
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/plans/route.ts
git commit -m "feat(plans): persist nutritional_goals, duration_days, meals_per_day on plan creation"
```

---

## Task 7 — Add week macro bar + per-day footer to plan builder

**Files:**
- Modify: `src/app/(app)/plans/[id]/plan-builder.tsx`

- [ ] **Step 1: Add `weekMacros` helper below the existing `dayTotal` function**

`dayTotal` already exists at line ~118. Add `weekMacros` directly after it:

```ts
function weekMacros(days: DayData[]) {
  const filledDays = days.filter((d) => d.entries.length > 0);
  if (filledDays.length === 0) return { cal: 0, pro: 0, carb: 0, fat: 0 };
  return {
    cal:  Math.round(filledDays.reduce((s, d) => s + d.entries.reduce((e, r) => e + (r.calories  ?? 0), 0), 0) / filledDays.length),
    pro:  Math.round(filledDays.reduce((s, d) => s + d.entries.reduce((e, r) => e + (r.protein_g ?? 0), 0), 0) / filledDays.length),
    carb: Math.round(filledDays.reduce((s, d) => s + d.entries.reduce((e, r) => e + (r.carbs_g   ?? 0), 0), 0) / filledDays.length),
    fat:  Math.round(filledDays.reduce((s, d) => s + d.entries.reduce((e, r) => e + (r.fat_g     ?? 0), 0), 0) / filledDays.length),
  };
}

function macroBarColor(pct: number): string {
  if (pct >= 0.9 && pct <= 1.1) return "#4caf7a";
  if (pct > 1.1) return "#d4a843";
  if (pct >= 0.6) return "#e07a3a";
  return "#888";
}
```

- [ ] **Step 2: Add the week macro bar JSX**

In the `PlanBuilder` return JSX, find the plan header section (the `<div>` that renders `planTitle`, the Save button, etc.). Directly after that header `<div>`, add:

```tsx
      {/* ── Week macro bar ───────────────────────────────────── */}
      {(() => {
        const wm = weekMacros(days);
        const goals = {
          cal:  nutritionalGoals.calories  ?? 2000,
          pro:  nutritionalGoals.protein_g ?? 50,
          carb: nutritionalGoals.carbs_g   ?? 300,
          fat:  nutritionalGoals.fat_g     ?? 65,
        };
        const macros = [
          { label: "Calories", value: wm.cal,  goal: goals.cal,  unit: "kcal" },
          { label: "Protein",  value: wm.pro,  goal: goals.pro,  unit: "g" },
          { label: "Carbs",    value: wm.carb, goal: goals.carb, unit: "g" },
          { label: "Fat",      value: wm.fat,  goal: goals.fat,  unit: "g" },
        ];
        return (
          <div
            className="flex gap-4 flex-wrap px-4 py-2 border-b text-xs"
            style={{ borderColor: "#2A1808", background: "#130C05" }}
          >
            <span style={{ color: "#6B4E36" }}>Week avg:</span>
            {macros.map(({ label, value, goal, unit }) => {
              const pct = goal > 0 ? value / goal : 0;
              const color = macroBarColor(pct);
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <span style={{ color: "#6B4E36" }}>{label}</span>
                  <div className="rounded-full overflow-hidden" style={{ width: 48, height: 4, background: "#2A1808" }}>
                    <div style={{ width: `${Math.min(pct * 100, 115)}%`, height: "100%", background: color, borderRadius: 9999 }} />
                  </div>
                  <span style={{ color }} className="font-semibold">{value}<span style={{ color: "#4A3020", fontWeight: 400 }}> / {goal}{unit}</span></span>
                </div>
              );
            })}
          </div>
        );
      })()}
```

- [ ] **Step 3: Add per-day kcal + protein footer in the list view**

In the list-view rendering (the `days.map(...)` section that renders day cards in list mode), find where each day's entries are displayed. After the last entry in each day, add the footer:

```tsx
              {/* Per-day macro footer */}
              {(() => {
                const dt = dayTotal(day.entries);
                const hasData = day.entries.length > 0;
                const calGoal = nutritionalGoals.calories ?? 2000;
                const proGoal = nutritionalGoals.protein_g ?? 50;
                return (
                  <div
                    className="flex gap-3 pt-2 mt-1 border-t text-xs"
                    style={{ borderColor: "#2A1808", opacity: hasData ? 1 : 0.35 }}
                  >
                    <span style={{ color: hasData ? "#e07a3a" : "#4A3020" }}>
                      {hasData ? dt.cal : "—"} <span style={{ color: "#4A3020" }}>/ {calGoal} kcal</span>
                    </span>
                    <span style={{ color: hasData ? "#4caf7a" : "#4A3020" }}>
                      {hasData ? dt.pro : "—"} <span style={{ color: "#4A3020" }}>/ {proGoal}g prot</span>
                    </span>
                  </div>
                );
              })()}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/plans/\[id\]/plan-builder.tsx
git commit -m "feat(plans): add week macro bar and per-day macro footer to plan builder"
```

---

## Task 8 — Smoke test in browser

- [ ] **Step 1: Start the dev server**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npm run dev
```

- [ ] **Step 2: Test the creator page at `http://localhost:3002/plans/new`**

Check:
- [ ] Template cards display in a single row with left/right arrows
- [ ] Arrows disable at start/end of carousel
- [ ] Each card shows 4 macro progress bars below tags
- [ ] "Set your goals →" chip appears if no goals saved
- [ ] Selecting a template fills name, days, meals/day, dietary filters
- [ ] De-selecting a template resets those fields
- [ ] Creating a plan with a template selected redirects to `/plans/{id}`

- [ ] **Step 3: Test the plan builder**

Open any existing plan at `http://localhost:3002/plans/{id}`. Check:
- [ ] Week macro bar visible below the header
- [ ] Bar values update as you add/remove meals
- [ ] Per-day footer shows kcal + protein for filled days, `—` for empty days
- [ ] Colors follow the green/orange/amber/muted logic

- [ ] **Step 4: Fix any issues found, commit fixes**

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Carousel hero layout | Task 4 |
| Single-row carousel with arrows | Task 4 |
| Template auto-fills form | Task 4 |
| Macro bars on template cards | Task 3 |
| Goal source: calorie_goals table | Task 2 |
| RDA fallback | Task 2 |
| "Set your goals →" nudge chip | Task 4 |
| Progress bar colors (green/orange/amber/muted) | Tasks 3, 7 |
| Week macro bar in plan builder | Task 7 |
| Per-day kcal + protein footer | Task 7 |
| `nutritional_goals` stored on plan creation | Tasks 5, 6 |
| `duration_days` and `meals_per_day` sent on creation | Task 4, 6 |
| Template meal macros (protein_g/carbs_g/fat_g) | Task 1 |
