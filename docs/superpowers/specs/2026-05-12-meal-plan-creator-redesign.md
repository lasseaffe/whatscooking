# Meal Plan Creator & Editor Redesign

**Date:** 2026-05-12  
**Status:** Approved for implementation  
**Scope:** `src/app/(app)/plans/new/` · `src/app/(app)/plans/[id]/` · `src/components/plans/`

---

## Summary of Design Decisions

| Question | Decision |
|---|---|
| Creator page structure | Carousel hero first, form row below, filters, CTA |
| Template card macro display | Progress bars (kcal / protein / carbs / fat vs goals) |
| Plan builder macro tracking | Week-average bar (top) + 2-macro footer per day column |
| No goals set fallback | RDA defaults fill bars + "Set your goals →" nudge chip |

---

## 1. Creator Page (`plans/new/page.js`)

### Layout Order

```
Page heading (New Meal Plan)
├── Template carousel (hero — full width, single row with arrows)
├── Form row (sticky-style inline: name + days + meals/day)
├── Dietary filters
└── CTA row (Cancel · Create plan →)
```

The "Customise plan details" collapsed section is removed. All fields are always visible, compact, and inline.

### Template Carousel

- Single horizontal row — `overflow: hidden` with prev/next arrow buttons at edges
- Each visible card: ~220px wide. Arrows scroll by 1 card.
- Selecting a template auto-fills: plan name, duration_days, meals_per_day, dietary_filters, and pre-populates nutritional_goals from the template's meal data averages.
- Unselecting a template clears those auto-filled fields only (leaves user edits untouched).
- "None / blank plan" is the implicit default — no card selected.

### Template Card — Macro Bars

Each card shows below the recipe image slideshow:

```
[Template title]
[duration] · [meals/day] · ~[avg_kcal] kcal/day

Calories  ████████░░  1 800 / 2 000
Protein   █████████░  148g / 150g      ← green if ≥ 90% of goal
Carbs     ██████░░░░  190g / 250g
Fat       ████████░░  62g / 70g

✓ Strong protein match · Carbs below target   ← generated label
```

**Goal source priority:**
1. User's `nutritional_goals` from their active calorie tracker profile
2. RDA defaults: 2 000 kcal · 50g protein · 300g carbs · 65g fat
3. When source is RDA: show `"Set your goals → "` chip below the bars, linking to `/calorie-tracker?tab=goals`

**Bar color logic:**
- ≥ 90% of goal: green (`#4caf7a`)
- 60–89%: orange (`#e07a3a`)
- < 60%: muted (`#888`)
- > 110% (over goal): amber (`#d4a843`)

**Template macro data:** computed as average daily values across all meals in `template.meals[]` using their `calories` field. Protein/carbs/fat come from a new `macros` field added to each meal entry in `plan-templates.ts` (see Data section).

### Form Row

Inline, always-visible, no accordion:

```
[Plan name *          ] [Days: 7] [Meals/day: 3]
```

- Plan name: flex-grow text input, required
- Days: number input, 1–30, width 64px
- Meals/day: number input, 1–6, width 64px
- All three are pre-filled when a template is selected

### Dietary Filters

Unchanged pill toggles. Pre-selected when template chosen.

### CTA

```
[Cancel]  [Create plan →]
```

Create plan disabled until plan name is non-empty.

---

## 2. Plan Builder (`plans/[id]/plan-builder.tsx`)

### Week Macro Bar

Pinned directly below the plan header, above the day grid:

```
Week avg:  2 100 / 2 500 kcal  [▓▓▓▓▓▓▓░░░]
           148g / 150g protein  [▓▓▓▓▓▓▓▓▓░]
           190g / 250g carbs    [▓▓▓▓▓▓░░░░]
           62g / 70g fat        [▓▓▓▓▓▓▓▓░░]
```

- Values = average across fully-filled days (days with ≥ 1 entry)
- Goal source: `plan.nutritional_goals` → calorie tracker goals → RDA
- "Set your goals →" chip appears here too if no goals are saved
- Same bar color logic as template cards
- Compact: single line per macro, 40px tall total bar

### Per-Day Macro Footer

Each day column in the grid gets a footer row below its meal slots:

```
Mon
[Chicken & Rice  ]
[Greek Salad     ]
[Salmon Bowl     ]
─────────────────
[2 120 kcal] [152g prot]
```

- Shows kcal + protein only (most decision-relevant pair)
- Empty day: shows `—` at 35% opacity
- Partial day (some slots filled): shows real sum, no visual warning
- Color: kcal in orange, protein in green — matches week bar colors

### Nutritional Goals on Plan

`nutritional_goals` is already a column on `meal_plans`. During plan creation it is now explicitly set:
1. If template selected: computed from template meal averages
2. If no template: pulled from calorie tracker goals (API call at creation time)
3. If neither: RDA defaults stored explicitly so future edits have a baseline

The plan builder reads `plan.nutritional_goals` directly — no live calorie tracker call needed inside the editor.

---

## 3. Data Changes

### `plan-templates.ts` — Add macros to each meal

```ts
meals: {
  title: string;
  image: string;
  tags: string[];
  time: string;
  calories: number;
  protein_g: number;   // NEW
  carbs_g: number;     // NEW
  fat_g: number;       // NEW
}[]
```

All 6 existing templates need realistic values filled in. Use template tags as a guide (high-protein ≈ 40g protein/meal, budget ≈ 15g, etc.).

### Calorie Tracker Goals API

New utility: `src/lib/nutrition-goals.ts`

```ts
export async function getUserNutritionGoals(userId: string): Promise<NutritionalGoals>
```

- Reads from `calorie_goals` table (`target_calories` + `notes` JSON for macros)
- Macro targets parsed from `JSON.parse(goal.notes ?? '{}')` → `{ protein_g, carbs_g, fat_g }`
- Calories: `goal.target_calories` (explicit) or computed TDEE±offset from `goal_type`
- Falls back to RDA constants (`{ calories: 2000, protein_g: 50, carbs_g: 300, fat_g: 65 }`) if no record found
- Returns `NutritionalGoals` shape already defined in `lib/types.ts`

Called in two places:
1. `plans/new/page.js` — to show goal-matched bars on template cards
2. `api/plans/route.ts` POST handler — to store goals on new plan

---

## 4. Cross-Feature Wiring

| From | To | Data | Trigger |
|---|---|---|---|
| Calorie tracker goals | Template card bars | `NutritionalGoals` | On creator page load |
| Calorie tracker goals | New plan record | `nutritional_goals` | On plan creation |
| Plan `nutritional_goals` | Builder week bar | Stored on plan | On builder mount |
| "Set your goals →" chip | Calorie tracker | Deep link `/calorie-tracker?tab=goals` | Click |

No new tables or API routes required beyond `getUserNutritionGoals`.

---

## 5. Files Changed

| File | Change |
|---|---|
| `plans/new/page.js` | Full layout reorder + form always-visible + carousel wiring |
| `plans/new/template-card.tsx` | Add macro bar section, accept `goals` prop |
| `plans/new/plan-templates.ts` | Add `protein_g`, `carbs_g`, `fat_g` to each meal entry |
| `plans/[id]/plan-builder.tsx` | Add week macro bar + per-day footer |
| `src/lib/nutrition-goals.ts` | New utility — fetch/fallback user goals |
| `api/plans/route.ts` | Store `nutritional_goals` on plan creation |

---

## 6. Out of Scope

- AI-powered macro balancing (auto-suggest meals to hit targets) — future
- Per-meal macro editing inside the builder — future
- Mobile carousel swipe gestures — future (arrows work on mobile for now)
- SEO / public plan pages — separate track
