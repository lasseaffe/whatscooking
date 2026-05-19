# Meal Planner — Plan 5: Squad-Aware Filters + Pantry Band Data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** When the user has household members with ingredient preferences, the planner should silently respect them. Recipes containing ingredients any member marked `avoid` are excluded outright. Recipes containing `dislike` ingredients get demoted. Recipes that lean on `love` ingredients get a small bump. Plus: finish the Plan 4 follow-up by threading per-recipe `pantry_match` into the density ribbon.

**Architecture:** No new tables — the household infra (`household_members`, `member_ingredient_preferences`, `member_allergens`) already exists. Add one resolution helper + a small recipe-match extension. Wire into the existing weave and picker routes via the constraint chip bar's new "Squad" mode.

**Tech Stack:** Next.js 15 · React 19 · existing tokens · existing solver/recipe-match libraries.

**Spec:** `docs/superpowers/specs/2026-05-18-meal-planner-pinboard-weave-design.md`
**Plan 4:** `docs/superpowers/plans/2026-05-19-meal-planner-polish-and-smart.md`

**Branch base:** `feat/meal-planner-pinboard-weave-squad` from `feat/meal-planner-pinboard-weave-polish-smart`.

**Existing schema we'll consume (no migrations):**

| Table | Relevant columns |
|---|---|
| `household_members` | `id, kitchen_group_id, name, member_type ('baby'/'toddler'/'child'/'adult'), owner_user_id, linked_user_id, display_name` |
| `member_ingredient_preferences` | `member_id, ingredient_text, sentiment ('dislike'/'avoid'/'love')` |
| `member_allergens` | `member_id, allergen` (treated as hard `avoid`) |
| `kitchen_groups` | resolved via user → kitchen group membership (existing helper assumed; we'll discover or build) |

**What's in scope:**

| # | Feature |
|---|---|
| 1 | Squad-resolution helper: from user_id → flat lists of avoid / dislike / love ingredient text |
| 2 | `GET /api/household/squad-preferences` endpoint |
| 3 | Recipe-match extension: hard squad filter + soft squad score |
| 4 | Weave route applies squad filter to pool + scoring |
| 5 | Picker route accepts `squad_aware=1` |
| 6 | Squad constraint chip in `ConstraintChipBar` shows member count + opens a popover that lists members + their conflict tags |
| 7 | Auto-enable squad-aware when ≥2 members exist (with an explicit "disable for this plan" toggle) |
| 8 | Pinboard feed cards show a 👥 warning badge when a `dislike` ingredient is present |
| 9 | **Plan 4 follow-up:** weave route returns `pantry_match` per recipe; density ribbon's pantry band lights up |

**Deferred:**
- Per-member breakdowns inside the recipe detail page (Plan 6 polish if useful)
- "Date night" override that disables squad filtering for a single plan (just a chip toggle for v1)
- Member-meal-reaction feedback loop (a different feature surface)

---

## Phase 0 — Branch setup

### Task 0.1

```bash
cd "C:/Users/lasse/Desktop/whatscooking"
git checkout feat/meal-planner-pinboard-weave-polish-smart
git pull --ff-only
git checkout -b feat/meal-planner-pinboard-weave-squad
git status
```

Expected: clean tree on the new branch.

---

## Phase A — Squad resolution

### Task A.1: Resolution helper

**Files:**
- Create: `src/lib/plans/squad-resolve.ts`

Given a `user_id`, query the household members that share the user's kitchen group(s), collect preferences + allergens, return flat lowercased text lists. Avoidance includes ingredients with `sentiment='avoid'` and all `member_allergens.allergen` strings. Dislikes only include `sentiment='dislike'`. Loves only `sentiment='love'`.

The helper takes a Supabase client so the caller controls auth context.

- [ ] **Step 1: Locate the existing user → kitchen_group helper**

```bash
grep -rn "kitchen_group\|user_kitchen_groups\|getKitchenGroup" src/lib src/app/api 2>&1 | head -10
```

Use whatever helper already exists. If none, this query works:

```ts
// fallback: any kitchen group where the user is the owner.
const { data: groups } = await supabase
  .from('kitchen_groups')
  .select('id')
  .eq('owner_user_id', user_id);
```

Adapt to the real schema once you find the existing pattern.

- [ ] **Step 2: Write the helper**

```ts
// src/lib/plans/squad-resolve.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SquadMember {
  id: string;
  name: string;
  member_type: 'baby' | 'toddler' | 'child' | 'adult';
  avoid: string[];
  dislike: string[];
  love: string[];
}

export interface SquadPreferences {
  members: SquadMember[];
  avoid: string[];        // union of all members' avoid + allergens, lowercased
  dislike: string[];      // union of all members' dislike, lowercased
  love: string[];         // union of all members' love, lowercased
}

function norm(s: string): string {
  return s.toLowerCase().trim();
}

export async function resolveSquadPreferences(
  supabase: SupabaseClient,
  user_id: string,
): Promise<SquadPreferences> {
  // Get the user's kitchen groups (broadest possible interpretation; refine to whichever helper the repo already provides).
  const { data: groups } = await supabase
    .from('kitchen_groups')
    .select('id')
    .or(`owner_user_id.eq.${user_id}`);

  const groupIds = (groups ?? []).map(g => g.id);
  if (groupIds.length === 0) return { members: [], avoid: [], dislike: [], love: [] };

  const { data: rawMembers } = await supabase
    .from('household_members')
    .select('id, name, display_name, member_type, kitchen_group_id')
    .in('kitchen_group_id', groupIds);

  const memberIds = (rawMembers ?? []).map(m => m.id);
  if (memberIds.length === 0) return { members: [], avoid: [], dislike: [], love: [] };

  const [{ data: prefs }, { data: allergens }] = await Promise.all([
    supabase
      .from('member_ingredient_preferences')
      .select('member_id, ingredient_text, sentiment')
      .in('member_id', memberIds),
    supabase
      .from('member_allergens')
      .select('member_id, allergen')
      .in('member_id', memberIds),
  ]);

  const members: SquadMember[] = (rawMembers ?? []).map(m => {
    const myPrefs = (prefs ?? []).filter(p => p.member_id === m.id);
    const myAllergens = (allergens ?? []).filter(a => a.member_id === m.id);
    return {
      id: m.id,
      name: m.display_name || m.name,
      member_type: m.member_type,
      avoid: [
        ...myPrefs.filter(p => p.sentiment === 'avoid').map(p => norm(p.ingredient_text)),
        ...myAllergens.map(a => norm(a.allergen)),
      ],
      dislike: myPrefs.filter(p => p.sentiment === 'dislike').map(p => norm(p.ingredient_text)),
      love: myPrefs.filter(p => p.sentiment === 'love').map(p => norm(p.ingredient_text)),
    };
  });

  const union = (sel: (m: SquadMember) => string[]) =>
    Array.from(new Set(members.flatMap(sel)));

  return {
    members,
    avoid: union(m => m.avoid),
    dislike: union(m => m.dislike),
    love: union(m => m.love),
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/plans/squad-resolve.ts
git commit -m "feat(plans): squad-preference resolution helper"
```

### Task A.2: `GET /api/household/squad-preferences`

**Files:**
- Create: `src/app/api/household/squad-preferences/route.ts`

- [ ] **Step 1: Route**

```ts
// src/app/api/household/squad-preferences/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveSquadPreferences } from '@/lib/plans/squad-resolve';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const squad = await resolveSquadPreferences(supabase, user.id);
  return NextResponse.json(squad);
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/household/squad-preferences/route.ts"
git commit -m "feat(api): squad-preferences endpoint"
```

---

## Phase B — Recipe-match + solver wiring

### Task B.1: Squad filter + score in `recipe-match`

**Files:**
- Modify: `src/lib/recipe-match.ts`

Extract ingredient text from a recipe row (the `ingredients` column is `jsonb` — an array of `{ name, amount?, unit? }` objects, sometimes strings). Build helpers:

- `recipeIngredientNames(recipe): string[]` — lowercased names
- `squadHardFilter(recipe, avoid): boolean` — returns false if any avoid term appears as a substring in any ingredient name (so "egg" catches "egg yolk" and "shelled egg"; trade-off accepted for v1)
- `squadScore(recipe, squad: { dislike, love }): number` — `-0.5` per dislike hit, `+0.3` per love hit, capped at `[-1, +1]`

- [ ] **Step 1: Open the file and add**

```ts
// src/lib/recipe-match.ts (extension; preserve existing exports)

export function recipeIngredientNames(recipe: any): string[] {
  const arr = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  return arr.map((i: any) => (typeof i === 'string' ? i : i?.name ?? '')).map((s: string) => s.toLowerCase().trim()).filter(Boolean);
}

export function squadHardFilter(recipe: any, avoid: string[]): boolean {
  if (avoid.length === 0) return true;
  const ings = recipeIngredientNames(recipe);
  for (const a of avoid) {
    const needle = a.toLowerCase().trim();
    if (!needle) continue;
    for (const ing of ings) {
      if (ing.includes(needle)) return false;
    }
  }
  return true;
}

export function squadScore(recipe: any, squad: { dislike: string[]; love: string[] }): number {
  const ings = recipeIngredientNames(recipe);
  let score = 0;
  for (const d of squad.dislike) {
    const needle = d.toLowerCase().trim();
    if (!needle) continue;
    if (ings.some(i => i.includes(needle))) score -= 0.5;
  }
  for (const l of squad.love) {
    const needle = l.toLowerCase().trim();
    if (!needle) continue;
    if (ings.some(i => i.includes(needle))) score += 0.3;
  }
  return Math.max(-1, Math.min(1, score));
}

export function squadDislikeHits(recipe: any, dislike: string[]): string[] {
  const ings = recipeIngredientNames(recipe);
  return dislike.filter(d => {
    const needle = d.toLowerCase().trim();
    return needle && ings.some(i => i.includes(needle));
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/recipe-match.ts
git commit -m "feat(plans): squad hard-filter and score helpers"
```

### Task B.2: Apply squad in `/weave`

**Files:**
- Modify: `src/app/api/plans/[id]/weave/route.ts`

- [ ] **Step 1: After resolving user but before pool query**

Read the existing route. Before the `recipes` SELECT for the pool, call `resolveSquadPreferences(supabase, user.id)`. Plumb the squad through.

```ts
import { resolveSquadPreferences } from '@/lib/plans/squad-resolve';
import { squadHardFilter, squadScore } from '@/lib/recipe-match';

// near the top of the handler, after auth
const squad = await resolveSquadPreferences(supabase, user.id);

// Honor a per-plan opt-out: if pinboard_filters.squad_aware === false, skip filtering.
const filters = (plan.pinboard_filters ?? {}) as Record<string, unknown>;
const squadAware = filters.squad_aware === false ? false : squad.members.length >= 1;
```

When building the pool, additionally:
- Hard filter: `if (squadAware && !squadHardFilter(r, squad.avoid)) skip`
- Add to the recipe's score: pool entries get an extra `squad_score` field

```ts
const pool: SolverRecipe[] = (poolRaw ?? [])
  .filter((r: any) => constraints.diet.every(t => (r.dietary_tags ?? []).includes(t)))
  .filter((r: any) => !constraints.pantry_aware || pantryMissingCount(r) <= constraints.pantry_missing_max)
  .filter((r: any) => !squadAware || squadHardFilter(r, squad.avoid))
  .map((r: any) => ({
    ...toSolverRecipe(r),
    pantry_match: pantryMatch(r),
    inspiration_match: inspirationMatch(r),
    // squadScore folds into inspiration_match weighting at solve time
    // (or extend SolverRecipe with squad_score; we choose the lightweight route here
    // by pre-mixing into inspiration_match — solver doesn't need to know about squad)
  }));

// If squad is active, blend squad_score into inspiration_match so the solver picks
// up love/dislike bias without a solver-side schema change.
if (squadAware) {
  for (let i = 0; i < pool.length; i++) {
    const raw = poolRaw[i];
    if (!raw) continue;
    const ss = squadScore(raw, squad);
    pool[i].inspiration_match = Math.max(-1, Math.min(1, pool[i].inspiration_match + ss));
  }
}
```

Pins should also be filtered? No — pinned recipes were the user's explicit choice. Honor pins even if they conflict; surface a warning in the UI instead (Phase C). So *do not* hard-filter pins by squad avoid.

In the response, include the squad object so the client can render warnings:

```ts
return NextResponse.json({ ...result, recipes: recipeMeta ?? [], squad });
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/plans/[id]/weave/route.ts"
git commit -m "feat(api): weave applies squad hard filter + score bias"
```

### Task B.3: Apply squad in `/recipes/picker`

**Files:**
- Modify: `src/app/api/recipes/picker/route.ts`

- [ ] **Step 1: Read the existing route**

Find the place where pool filtering happens. Add a `squad_aware` query param (default off). When set:

```ts
import { resolveSquadPreferences } from '@/lib/plans/squad-resolve';
import { squadHardFilter, squadScore } from '@/lib/recipe-match';

const squadAware = url.searchParams.get('squad_aware') === '1';
let squad: Awaited<ReturnType<typeof resolveSquadPreferences>> | null = null;
if (squadAware) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) squad = await resolveSquadPreferences(supabase, user.id);
}

// In the filter pipeline:
.filter((r: any) => !squad || squadHardFilter(r, squad.avoid))

// In the score pipeline (if the picker already ranks by score):
const score = baseScore(r) + (squad ? squadScore(r, squad) * 0.3 : 0);
```

If the picker doesn't have a unified ranking pipeline, the simplest fix is the hard filter only — soft-score bias is a polish. Decide based on the file's current shape.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/recipes/picker/route.ts
git commit -m "feat(api): picker supports squad-aware filter"
```

---

## Phase C — UI

### Task C.1: `SquadChip` opens member popover

**Files:**
- Modify: `src/components/plans/ConstraintChipBar.tsx`

The existing chip bar already has a `Squad ${size}` chip that opens a number slider. Replace its popover with a richer one that:

- Lists members (name + member_type label)
- Shows a small toggle "Apply squad preferences" (defaults ON when ≥1 member)
- For each member, shows their conflict tags as small pills (avoid in red, dislike in yellow, love in green) — collapsed by default, click member name to expand

Also add `squad_aware: boolean` to `PinboardFilters` (and default it based on whether `members.length >= 1`).

- [ ] **Step 1: Extend `PinboardFilters` in `use-planner-state.ts`**

```ts
export interface PinboardFilters {
  // ... existing
  squad_aware: boolean;
}

// In DEFAULT_FILTERS:
squad_aware: true,
```

- [ ] **Step 2: Squad chip with embedded fetch**

Fetch members lazily when the popover opens. Cache once.

```tsx
// Inside ConstraintChipBar.tsx
import { useState, useEffect } from 'react';

interface SquadMember {
  id: string; name: string; member_type: string;
  avoid: string[]; dislike: string[]; love: string[];
}

function useSquad() {
  const [squad, setSquad] = useState<{ members: SquadMember[] } | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    fetch('/api/household/squad-preferences')
      .then(r => r.ok ? r.json() : { members: [] })
      .then(setSquad)
      .finally(() => setLoaded(true));
  }, [loaded]);
  return squad;
}
```

In the chip popover for `squad`, replace the number slider with member list + toggle. Update the chip label too:

```tsx
const squad = useSquad();
const members = squad?.members ?? [];
const label = members.length === 0
  ? `Squad ${filters.squad_size}`
  : `Squad ${members.length} 👥${filters.squad_aware ? '' : ' (off)'}`;
```

In the popover:

```tsx
<Popover onClose={close}>
  <label className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#EFE3CE' }}>
    <input
      type="checkbox"
      checked={filters.squad_aware}
      onChange={e => onChange({ squad_aware: e.target.checked })}
      disabled={members.length === 0}
    />
    Apply preferences{members.length === 0 ? ' (no members)' : ''}
  </label>
  {members.length === 0 ? (
    <p className="text-xs" style={{ color: '#6B4E36' }}>
      No household members yet. Add one in <a href="/household" style={{ color: '#E67E22' }}>Household</a>.
    </p>
  ) : (
    <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
      {members.map(m => (
        <li key={m.id} className="text-sm">
          <span style={{ color: '#EFE3CE' }}>{m.name}</span>
          <span className="text-xs ml-2" style={{ color: '#6B4E36' }}>· {m.member_type}</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {m.avoid.map(t => <Tag key={`a-${t}`} tone="avoid" text={t} />)}
            {m.dislike.map(t => <Tag key={`d-${t}`} tone="dislike" text={t} />)}
            {m.love.slice(0, 4).map(t => <Tag key={`l-${t}`} tone="love" text={t} />)}
          </div>
        </li>
      ))}
    </ul>
  )}
  <div className="mt-3">
    <p className="text-xs mb-1" style={{ color: '#6B4E36' }}>Squad size for portions</p>
    <NumberSlider value={filters.squad_size} onChange={v => onChange({ squad_size: v })} min={1} max={8} step={1} />
  </div>
</Popover>
```

Define `Tag`:

```tsx
function Tag({ tone, text }: { tone: 'avoid' | 'dislike' | 'love'; text: string }) {
  const color =
    tone === 'avoid' ? { bg: 'rgba(200, 90, 47, 0.18)', fg: '#E67E22' } :
    tone === 'dislike' ? { bg: 'rgba(242, 201, 76, 0.15)', fg: '#F2C94C' } :
    { bg: 'rgba(122, 163, 80, 0.15)', fg: '#7AA350' };
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded"
      style={{ background: color.bg, color: color.fg }}
    >
      {text}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/plans/[id]/use-planner-state.ts" src/components/plans/ConstraintChipBar.tsx
git commit -m "feat(plans): squad chip lists members + applies preferences toggle"
```

### Task C.2: Squad warning badge on Pinboard feed cards

**Files:**
- Modify: `src/lib/recipe-match-badges.ts`
- Modify: `src/components/plans/PinboardFeed.tsx`

When `squad_aware` is on and the user's squad has dislikes, decorate cards that hit a dislike with a 👥 warning badge listing the dislike tags (max 2).

- [ ] **Step 1: Extend `buildMatchBadges`**

```ts
// recipe-match-badges.ts
import { squadDislikeHits } from './recipe-match';
import type { PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';

export interface SquadHint {
  dislike: string[];
}

export function buildMatchBadges(
  recipe: any,
  filters: PinboardFilters,
  squad?: SquadHint,
): MatchBadge[] {
  const badges: MatchBadge[] = [];
  // ... existing badges (pantry, diet, time, batch)
  if (filters.squad_aware && squad) {
    const hits = squadDislikeHits(recipe, squad.dislike);
    if (hits.length > 0) {
      badges.push({ label: `👥 ${hits.slice(0, 2).join(', ')}`, tone: 'inspiration' });
      // Reusing 'inspiration' tone for now; could add a 'squad' tone if styling diverges.
    }
  }
  return badges;
}
```

- [ ] **Step 2: Plumb squad into the feed**

The feed already pulls plan id. Have it also fetch `/api/household/squad-preferences` on mount and pass `{ dislike: squad.dislike }` to `buildMatchBadges`. Memoize.

- [ ] **Step 3: Commit**

```bash
git add src/lib/recipe-match-badges.ts src/components/plans/PinboardFeed.tsx
git commit -m "feat(plans): squad dislike warning badge on Pinboard cards"
```

### Task C.3: Persist `squad_aware` to plan filters

The chip bar's `onChange({ squad_aware })` already goes through `usePlannerState.setFilters` which PATCHes the plan's `pinboard_filters`. Verify nothing else is needed — should be a free pass through the existing pipe.

- [ ] **Step 1: Smoke check**

```bash
grep -n "squad_aware\|pinboard_filters" "src/app/(app)/plans/[id]/use-planner-state.ts" "src/app/api/plans/[id]/route.ts" src/app/api/plans/[id]/weave/route.ts 2>&1 | head -20
```

Confirm `squad_aware` is propagated end-to-end. No commit needed if it already works.

---

## Phase D — Pantry-band data path (Plan 4 follow-up)

### Task D.1: Weave route returns per-recipe pantry_match

**Files:**
- Modify: `src/app/api/plans/[id]/weave/route.ts`

Currently the route builds `pool` with computed `pantry_match` but the response's `recipes[]` payload doesn't carry it back. Add it.

- [ ] **Step 1: Extend `recipeMeta` with `pantry_match`**

Find where `recipeMeta` (the `recipes` payload) is built. After fetching the recipe rows, compute `pantry_match` for each using the same `pantryMatch(r)` helper that the pool uses (you already loaded the user's pantry in this route). Attach the value:

```ts
const recipeMeta = (recipeRows ?? []).map((r: any) => ({
  ...r,
  pantry_match: pantryMatch(r),
}));
return NextResponse.json({ ...result, recipes: recipeMeta, squad });
```

- [ ] **Step 2: Thread to grid**

In `use-planner-state.ts`, extend `WeaveRecipeMeta` (or its equivalent) to include `pantry_match?: number`. In `WeaveSection`, build a `pantryPctByRecipeId: Record<string, number>` from the response and pass to `<WeaveGrid pantryPctByRecipeId={...} />` (the prop already exists from Plan 4 — just stop passing `{}`).

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/plans/[id]/weave/route.ts" "src/app/(app)/plans/[id]/use-planner-state.ts" src/components/plans/WeaveSection.tsx
git commit -m "feat(plans): thread pantry_match into density ribbon"
```

---

## Phase E — Verify + log + PR

### Task E.1: Solver regression

```bash
npx vitest run src/lib/weave-solver/
```

Expected: 39/39 passing (Plan 5 doesn't touch the solver core).

### Task E.2: Typecheck

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types/\|events/\[id\]/page\|app-nav\|vitest" | tail -30
```

Expected: no new errors in any file touched by this plan.

### Task E.3: Log entry

Append to `logs/2026-05-19.md`:

```markdown
## [HH:MM] Squad-aware filters + pantry-band data (Plan 5)

Branch `feat/meal-planner-pinboard-weave-squad`.

### Squad-aware
- `src/lib/plans/squad-resolve.ts` collects members + avoid/dislike/love from `member_ingredient_preferences` and `member_allergens` across the user's kitchen groups.
- `GET /api/household/squad-preferences` returns the resolved squad shape.
- `recipeMatch.squadHardFilter` excludes recipes containing any avoid term as a substring of any ingredient.
- `recipeMatch.squadScore` blends ±love/dislike weight into the solver pool via `inspiration_match` (no solver schema change).
- Weave + picker routes honor a `squad_aware` toggle (defaults on when ≥1 member exists; per-plan opt-out via `pinboard_filters.squad_aware`).
- ConstraintChipBar shows the Squad chip with member count + a member popover listing tags (avoid red / dislike yellow / love green).
- PinboardFeed cards show a 👥 warning badge when a dislike ingredient is present.

### Plan 4 follow-up
- Weave route now returns `pantry_match` per recipe.
- WeaveGrid's density ribbon's pantry band finally lights up.

### Tests
- Solver: 39/39 passing
- Typecheck clean on touched files

### Deferred (Plan 6 if useful)
- Squad breakdown inside individual recipe pages
- Member-meal-reaction feedback loop into the solver
```

### Task E.4: Push + PR

```bash
git push -u origin feat/meal-planner-pinboard-weave-squad

gh pr create --draft \
  --base feat/meal-planner-pinboard-weave-polish-smart \
  --head feat/meal-planner-pinboard-weave-squad \
  --title "feat(plans): squad-aware filters + pantry band data — Plan 5" \
  --body "$(cat <<'EOF'
## Summary

Two related deliverables:

1. **Squad-aware filters** (Lane C completion) — when the user has household members with ingredient preferences, the planner silently respects them. Avoid + allergens become hard filters; dislike/love bias the score.
2. **Pantry band data path** (Plan 4 follow-up) — weave route now returns per-recipe pantry_match, lighting up the density ribbon's pantry band.

## What's in this PR
- `src/lib/plans/squad-resolve.ts` — collects members + avoid/dislike/love from existing household tables. No new migrations.
- `GET /api/household/squad-preferences` — returns the resolved squad shape.
- `src/lib/recipe-match.ts` extensions — `squadHardFilter`, `squadScore`, `squadDislikeHits`, `recipeIngredientNames`.
- Weave + picker routes apply squad filter + score bias; auto-enabled when ≥1 member exists; per-plan opt-out via `pinboard_filters.squad_aware`.
- ConstraintChipBar — Squad chip now opens a popover with member list + tag pills + "Apply preferences" toggle.
- PinboardFeed — 👥 warning badge on cards containing a dislike ingredient.
- Weave route — `recipes[]` payload now includes `pantry_match`; density ribbon's pantry band reads it.

## Out of scope
- Per-member breakdowns inside individual recipe pages (Plan 6 polish if useful)
- Member-meal-reaction feedback loop

## Test plan
- [x] Solver tests pass (39/39)
- [x] Typecheck clean
- [ ] With ≥1 household member having an avoid preference, run Weave → confirm no recipes containing that ingredient appear
- [ ] Toggle "Apply preferences" off → confirm filtering disables
- [ ] Browse Pinboard with a member who dislikes an ingredient → cards with that ingredient show 👥 warning
- [ ] Density ribbon's pantry band shows non-zero fill when pantry has matching items

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:** §4.1 Household fit constraint chip — implemented as a richer chip that lists members. §10 ecosystem connectivity — squad-aware is the cross-tool bridge that consumes household data.

**Type consistency:** `SquadMember`, `SquadPreferences`, `SquadHint` defined in one place. `squad_aware` field added to `PinboardFilters` and threaded.

**Placeholders:** None. The substring-match heuristic for avoid filtering is intentionally simple — documented trade-off, not a TODO.

**Scope discipline:** Zero new tables. One new tiny endpoint. One new lib helper. Plumbing changes through existing routes. Pantry-band fix is a 5-minute Phase 4 follow-up rolled in because the data already exists in the weave route.
