# Meal Planner — Plan 6: Creation Flow Modernization + Orphan Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Modernize `/plans/new` so creation always lands on the Pinboard (no more legacy DnD builder branch). Seed pins from templates so a templated plan opens with real recipes already pinned. Remove the now-unreferenced `RecipeBank.tsx`, `WeeklyPlanGrid.tsx`, and `dnd-builder.tsx` that have been carrying their weight purely for the creation flow.

**Architecture:** No new tables, no new routes. `/plans/new/page.js` becomes `page.tsx` and shrinks — its only job is "collect title + template + diet, POST `/api/plans`, redirect." The POST endpoint gets a small extension to also create pins when the template's meals match real recipes by title. Then we delete the three legacy components and clean up imports.

**Tech Stack:** Next.js 15 · React 19 · existing tokens · existing Pinboard / Weave / Cook surfaces from Plans 1–5.

**Spec:** `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`
**Plan 5:** `docs/superpowers/plans/2026-05-19-meal-planner-squad-aware.md`

**Branch base:** `feat/meal-planner-pinboard-weave-create` from `feat/meal-planner-pinboard-weave-squad`.

**What's in scope:**

| # | Feature |
|---|---|
| 1 | Convert `page.js` → `page.tsx`; remove the inline `MealPlanDndBuilder` rendering branch — always redirect to `/plans/[id]` after creation |
| 2 | POST `/api/plans` accepts an optional `template_meals: string[]` (recipe titles) and seeds `meal_plan_pins` from any titles that match real recipes (case-insensitive, fuzzy fallback) |
| 3 | The creation page seeds `pinboard_filters` from the template's dietary filters so the new plan opens with the right Pinboard chips already set |
| 4 | Template cards visual pass: drop the rainbow `accentColor` overrides, use Pinboard tokens (`#1A120A` / `#E67E22` / `#3A2A1A`) so the picker fits the rest of the surface |
| 5 | Remove orphans: `src/components/plans/RecipeBank.tsx`, `src/components/plans/WeeklyPlanGrid.tsx`, `src/app/(app)/plans/new/dnd-builder.tsx`, `src/app/(app)/plans/new/scratch/page.js` (a previous scratch file) |

**Deferred:**
- Per-member breakdowns inside recipe pages (Plan 7 candidate)
- Member-meal-reaction feedback into solver scoring

---

## Phase 0 — Branch setup

### Task 0.1

```bash
cd "C:/Users/lasse/Desktop/whatscooking"
git checkout feat/meal-planner-pinboard-weave-squad
git pull --ff-only
git checkout -b feat/meal-planner-pinboard-weave-create
git status
```

Expected: clean tree on the new branch.

---

## Phase A — POST `/api/plans` extension

### Task A.1: Seed pins from template_meals

**Files:**
- Modify: `src/app/api/plans/route.ts`

Add optional fields to the POST body: `template_meals: string[]` (recipe titles) and `pinboard_filters: object`. After the plan row is inserted, if `template_meals` is provided, look up recipes by title and bulk-insert into `meal_plan_pins`.

- [ ] **Step 1: Read the current handler**

```bash
sed -n '20,80p' "src/app/api/plans/route.ts"
```

- [ ] **Step 2: Extend the body parser and insert flow**

Add to the destructure: `template_meals, pinboard_filters`. After the plan row is created with `.select().single()`, run:

```ts
if (Array.isArray(template_meals) && template_meals.length > 0) {
  const titles = template_meals.map((t: string) => t.toLowerCase().trim()).filter(Boolean);

  // Try exact match first
  const { data: exact } = await supabase
    .from('recipes')
    .select('id, title')
    .in('title', template_meals);

  const matchedIds = new Set<string>((exact ?? []).map((r: any) => r.id));

  // For unmatched titles, fall back to ilike
  const matchedTitlesLower = new Set((exact ?? []).map((r: any) => (r.title ?? '').toLowerCase().trim()));
  const missing = titles.filter(t => !matchedTitlesLower.has(t));
  for (const t of missing) {
    const { data: fuzzy } = await supabase
      .from('recipes')
      .select('id')
      .ilike('title', `%${t}%`)
      .limit(1);
    if (fuzzy?.[0]?.id) matchedIds.add(fuzzy[0].id);
  }

  if (matchedIds.size > 0) {
    await supabase
      .from('meal_plan_pins')
      .insert(Array.from(matchedIds).map((rid, i) => ({
        meal_plan_id: plan.id,
        recipe_id: rid,
        priority: 100 - i,  // earlier titles get higher priority
      })));
  }
}

if (pinboard_filters && typeof pinboard_filters === 'object') {
  await supabase
    .from('meal_plans')
    .update({ pinboard_filters })
    .eq('id', plan.id);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/plans/route.ts
git commit -m "feat(api): /plans POST accepts template_meals + pinboard_filters seeding"
```

---

## Phase B — Modernize `/plans/new`

### Task B.1: Convert `page.js` to `page.tsx`, drop DnD branch

**Files:**
- Delete: `src/app/(app)/plans/new/page.js`
- Create: `src/app/(app)/plans/new/page.tsx`

The new page is much smaller. It does NOT render `MealPlanDndBuilder` ever. It POSTs to `/api/plans` with the template's meal titles + dietary filters, then redirects.

- [ ] **Step 1: Read the existing page.js** to preserve the user-facing UX

```bash
cat "src/app/(app)/plans/new/page.js"
```

Note: keep the template grid + custom-mode toggle + dietary chips. Drop everything below the `if (selectedTemplate && presetId)` early return.

- [ ] **Step 2: Write `page.tsx`**

```tsx
// src/app/(app)/plans/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, CalendarDays, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { PLAN_TEMPLATES, type PlanTemplate } from './plan-templates';
import { TemplateCard } from './template-card';

const DIETARY_OPTIONS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'high-protein', 'keto', 'paleo', 'low-carb',
];

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get('template');

  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(
    presetId ? PLAN_TEMPLATES.find(t => t.id === presetId) ?? null : null,
  );
  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(!presetId);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function toggleDiet(tag: string) {
    setDietaryFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function applyTemplate(t: PlanTemplate | null) {
    setSelectedTemplate(t);
    if (t) {
      setTitle(t.title);
      setDurationDays(t.durationDays);
      setMealsPerDay(t.mealsPerDay);
      setDietaryFilters(t.dietaryFilters);
      setShowCustom(false);
    }
  }

  async function create() {
    if (!title.trim()) { setError('Give your plan a name.'); return; }
    setCreating(true);
    setError('');

    const template_meals = selectedTemplate ? selectedTemplate.meals.map(m => m.title) : undefined;
    const pinboard_filters = selectedTemplate ? { diet: selectedTemplate.dietaryFilters } : undefined;

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          dietary_tags: dietaryFilters,
          tags: selectedTemplate ? selectedTemplate.tags : [],
          description: selectedTemplate
            ? selectedTemplate.description
            : `${durationDays}-day plan, ${mealsPerDay} meals/day`,
          duration_days: durationDays,
          meals_per_day: mealsPerDay,
          template_meals,
          pinboard_filters,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create plan.');
        setCreating(false);
        return;
      }

      const plan = await res.json();
      router.push(`/plans/${plan.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setCreating(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <header className="mb-7">
        <h1 className="text-2xl font-serif flex items-center gap-2" style={{ color: '#EFE3CE' }}>
          <CalendarDays className="w-6 h-6" style={{ color: '#E67E22' }} />
          New Meal Plan
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A6A4A' }}>
          Start from a template or build your own. You'll land on the Pinboard to fine-tune.
        </p>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" style={{ color: '#E67E22' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#EFE3CE' }}>Choose a template</h2>
          <span className="text-xs" style={{ color: '#6B4E36' }}>— optional</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLAN_TEMPLATES.map(tpl => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              selected={selectedTemplate?.id === tpl.id}
              onClick={() => applyTemplate(selectedTemplate?.id === tpl.id ? null : tpl)}
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <button
          onClick={() => setShowCustom(s => !s)}
          className="flex items-center gap-2 mb-3 text-sm"
          style={{ color: '#EFE3CE' }}
          aria-expanded={showCustom}
        >
          {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Custom settings
        </button>
        {showCustom && (
          <div className="flex flex-col gap-4 p-4 rounded-lg border" style={{ background: '#1A120A', borderColor: '#3A2A1A' }}>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Plan name</span>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Cozy Sunday week"
                className="px-3 py-2 rounded border text-sm focus:outline-none"
                style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
              />
            </label>
            <div className="flex gap-4">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Duration</span>
                <select
                  value={durationDays}
                  onChange={e => setDurationDays(parseInt(e.target.value))}
                  className="px-3 py-2 rounded border text-sm"
                  style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
                >
                  {[3, 5, 7, 10, 14].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Meals / day</span>
                <select
                  value={mealsPerDay}
                  onChange={e => setMealsPerDay(parseInt(e.target.value))}
                  className="px-3 py-2 rounded border text-sm"
                  style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
                >
                  {[1, 2, 3, 4].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6B4E36' }}>Dietary tags</p>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map(d => {
                  const on = dietaryFilters.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDiet(d)}
                      className="px-3 py-1 rounded-full text-xs border transition-colors"
                      style={{
                        background: on ? '#E67E22' : 'transparent',
                        borderColor: on ? '#E67E22' : '#3A2A1A',
                        color: on ? '#1A120A' : '#8A6A4A',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {!showCustom && (
        <label className="flex flex-col gap-1 mb-4">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Plan name</span>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={selectedTemplate?.title ?? 'e.g. Cozy Sunday week'}
            className="px-3 py-2 rounded border text-sm focus:outline-none"
            style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
          />
        </label>
      )}

      {error && <p className="text-sm mb-3" style={{ color: '#E67E22' }}>{error}</p>}

      <button
        onClick={create}
        disabled={creating || !title.trim()}
        className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold disabled:opacity-40 transition-opacity"
        style={{ background: '#E67E22', color: '#1A120A' }}
      >
        {creating ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating…</span> : 'Create plan →'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Delete the old page**

```bash
git rm "src/app/(app)/plans/new/page.js"
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/plans/new/page.tsx"
git commit -m "feat(plans): modernize /plans/new (TS, no legacy DnD branch, redirect to Pinboard)"
```

### Task B.2: Visual pass on TemplateCard

**Files:**
- Modify: `src/app/(app)/plans/new/template-card.tsx`

Drop the rainbow `accentColor` and `gradient` overrides. Use the Pinboard palette so the picker fits the rest of the surface.

- [ ] **Step 1: Read current state**

- [ ] **Step 2: Rewrite to use unified tokens**

Keep the structure (emoji + title + subtitle + meal preview list) but swap the styles:

```tsx
// Replace the dynamic gradient with a flat panel:
style={{ background: '#1A120A', borderColor: selected ? '#E67E22' : '#3A2A1A' }}

// Replace `accentColor` references with `#E67E22`.
// Keep the emoji prominent. Drop any colored top border or shimmer.
```

For meal preview thumbnails: if `template.meals[i].image` is a URL string (Unsplash etc.), render it as a small image with `objectFit: cover` and the warm-tone fallback if it fails to load.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/plans/new/template-card.tsx"
git commit -m "feat(plans): template-card uses Pinboard tokens"
```

---

## Phase C — Orphan removal

### Task C.1: Confirm no remaining callers

**Files:** none yet — verification step.

- [ ] **Step 1: Grep**

```bash
grep -rn "WeeklyPlanGrid\|RecipeBank\|MealPlanDndBuilder\|dnd-builder" src/ --include="*.tsx" --include="*.ts" --include="*.js" 2>&1 | grep -v "WeeklyPlanGrid.tsx:\|RecipeBank.tsx:\|dnd-builder.tsx:"
```

Expected output: empty (or only references inside the files themselves). If any other file imports them, STOP and report — don't delete.

### Task C.2: Delete orphans

**Files:**
- Delete: `src/components/plans/RecipeBank.tsx`
- Delete: `src/components/plans/WeeklyPlanGrid.tsx`
- Delete: `src/app/(app)/plans/new/dnd-builder.tsx`
- Delete: `src/app/(app)/plans/new/scratch/page.js` (a leftover scratch file)

- [ ] **Step 1: Verify the scratch file is unused**

```bash
ls "src/app/(app)/plans/new/scratch/" 2>&1
cat "src/app/(app)/plans/new/scratch/page.js" 2>&1 | head -20
```

If it's a real route that does something, leave it. If it's a stub or duplicate, remove.

- [ ] **Step 2: Remove**

```bash
git rm src/components/plans/RecipeBank.tsx src/components/plans/WeeklyPlanGrid.tsx "src/app/(app)/plans/new/dnd-builder.tsx"
# Optionally: git rm "src/app/(app)/plans/new/scratch/page.js"
```

- [ ] **Step 3: Verify build still typechecks**

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types/\|events/\[id\]/page\|app-nav\|vitest" | tail -20
```

Expected: no new errors. (Any new errors would mean grep missed a caller — go back to Task C.1.)

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(plans): remove orphaned RecipeBank + WeeklyPlanGrid + dnd-builder"
```

---

## Phase D — Verify + log + PR

### Task D.1: Solver regression

```bash
npx vitest run src/lib/weave-solver/
```

Expected: 39/39 passing.

### Task D.2: Log entry

Append to `logs/2026-05-19.md`:

```markdown
## [HH:MM] Creation flow modernization + orphan cleanup (Plan 6)

Branch `feat/meal-planner-pinboard-weave-create`.

### What landed
- `/plans/new` is now a TypeScript page that always redirects to the Pinboard at `/plans/[id]` — no more inline DnD builder fork.
- POST `/api/plans` accepts optional `template_meals: string[]` and `pinboard_filters: object`. Template meal titles are matched against the recipe DB (exact then `ilike` fallback) and bulk-inserted into `meal_plan_pins` so a templated plan opens with real pins, not "Cooking..." placeholders.
- Template cards use the Pinboard token palette (Ember interactive on Midnight + Sandstone borders).
- Deleted ~970 lines of legacy code: `RecipeBank.tsx`, `WeeklyPlanGrid.tsx`, `dnd-builder.tsx`, and the `scratch` stub.

### Tests
- Solver: 39/39
- Typecheck clean

### What's left (Plan 7 candidates)
- Per-member breakdowns in recipe pages.
- Member-meal-reaction feedback into solver scoring.
- The plan-templates.ts list itself could become DB-backed.
```

### Task D.3: Push + PR

```bash
git push -u origin feat/meal-planner-pinboard-weave-create

gh pr create --draft \
  --base feat/meal-planner-pinboard-weave-squad \
  --head feat/meal-planner-pinboard-weave-create \
  --title "feat(plans): creation flow modernization + orphan cleanup — Plan 6" \
  --body "$(cat <<'EOF'
## Summary

The last piece of meal-planner technical debt. `/plans/new` now always lands on the new Pinboard, templates seed real pins on creation, and three large legacy components are retired.

**Spec:** docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md
**Plan 6:** docs/superpowers/plans/2026-05-19-meal-planner-creation-modernization.md

## What's in this PR
- `/plans/new` converted to TypeScript; the inline `MealPlanDndBuilder` branch is gone — creation always redirects to `/plans/[id]`.
- POST `/api/plans` accepts `template_meals` (recipe titles) and `pinboard_filters`. Titles are matched against the recipe DB (exact + ilike fallback) and bulk-inserted into `meal_plan_pins`.
- Template cards repainted in Pinboard tokens (Ember + Midnight + Sandstone).
- Removed: `src/components/plans/RecipeBank.tsx`, `src/components/plans/WeeklyPlanGrid.tsx`, `src/app/(app)/plans/new/dnd-builder.tsx`, and the `scratch` stub (~970 lines).

## Out of scope
- Per-member breakdowns in recipe pages
- Member-meal-reaction feedback loop
- Migrating `plan-templates.ts` to a DB table

## Test plan
- [x] Solver tests pass (39/39)
- [x] Typecheck clean after deletions
- [ ] Create a plan from a template → land on Pinboard with template pins already populated
- [ ] Create a custom plan → land on Pinboard with empty pins
- [ ] Visit `/plans/new` without ?template param → see template grid + custom section + Create button
- [ ] Confirm no surface in the app still imports `RecipeBank` or `WeeklyPlanGrid`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:** Plan 6 isn't adding new spec features — it finishes the rollout of Plan 2's surface so the old grid model is fully retired. Architectural cleanup.

**Type consistency:** `PlanTemplate` is imported from `./plan-templates`. `template_meals: string[]` and `pinboard_filters: object` are simple JSON shapes documented in the route.

**Placeholders:** None.

**Scope discipline:** No new tables. No new routes. One small route extension. One page rewrite. Three file deletions. Total expected diff: ~−700 lines net.
