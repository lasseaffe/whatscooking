# Baby & Family Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Family" section to What's Cooking that lets households with babies/toddlers track developmental milestones, get age-safe recipe suggestions, and run a parallel baby track in the meal planner — all woven into the existing pantry, planner, and shopping list flows.

**Architecture:** Baby/child members are first-class rows in a new `household_members` table linked to existing `kitchen_groups`. Milestone confirmations and allergen introductions drive all downstream filtering — recipe browser, planner baby track, pantry warnings, shopping list tagging. AI (Claude) is used only for contextual adaptation snippets in three specific locations; all other content is static or DB-driven.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS, Anthropic SDK (already wired in `src/lib/anthropic.ts`), lucide-react icons.

---

## File Map

### New files to create
```
src/app/(app)/family/page.tsx                          — Family Hub landing (4 cards)
src/app/(app)/family/members/page.tsx                  — Member profiles + milestones + allergens
src/app/(app)/family/recipes/page.tsx                  — Baby recipe browser
src/app/(app)/family/guides/page.tsx                   — Guides index
src/app/(app)/family/guides/[slug]/page.tsx            — Individual guide article
src/app/(app)/family/planner/page.tsx                  — Redirect to /plans?babyTrack=1
src/app/api/family/members/route.ts                    — GET/POST household_members
src/app/api/family/members/[id]/route.ts               — PATCH/DELETE single member
src/app/api/family/milestones/route.ts                 — POST confirm milestone
src/app/api/family/allergens/route.ts                  — POST confirm allergen
src/app/api/family/baby-recipes/route.ts               — GET recipes filtered by stage + allergens
src/app/api/family/adapt-recipe/route.ts               — POST Claude adaptation snippet
src/lib/family-types.ts                                — All TS types for family feature
src/lib/guides-content.ts                              — Static guide content (8 articles)
src/components/family-member-card.tsx                  — Member card with milestone checklist
src/components/baby-track-row.tsx                      — Baby track row for meal planner
src/components/baby-recipe-browser-sheet.tsx           — Sheet for picking baby meals
```

### Files to modify
```
src/lib/types.ts                                       — Add baby fields to Recipe type
src/components/app-nav.tsx                             — Add "Family" nav group
src/components/mobile-bottom-nav.tsx                   — Add Family to MORE_ITEMS
src/app/(app)/pantry/pantry-client.tsx                 — Add allergen warning badges
src/app/(app)/plans/[id]/plan-builder.tsx              — Add baby track toggle + rows
src/app/(app)/recipes/[id]/recipe-columns-client.tsx   — Add baby variant / adapt button
supabase/migrations/                                   — New migration file
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260509000000_baby_family_hub.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260509000000_baby_family_hub.sql

-- ── New tables ──────────────────────────────────────────────

CREATE TABLE household_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_group_id uuid NOT NULL REFERENCES kitchen_groups(id) ON DELETE CASCADE,
  name             text NOT NULL,
  member_type      text NOT NULL CHECK (member_type IN ('baby', 'toddler', 'child', 'adult')),
  date_of_birth    date,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE member_milestones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  milestone_key text NOT NULL CHECK (milestone_key IN (
    'started_solids', 'handles_soft_lumps', 'finger_foods', 'family_table'
  )),
  confirmed_at  timestamptz DEFAULT now(),
  confirmed_by  uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (member_id, milestone_key)
);

CREATE TABLE member_allergens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  allergen_key  text NOT NULL CHECK (allergen_key IN (
    'egg', 'dairy', 'gluten', 'peanut', 'tree_nut', 'soy', 'fish', 'shellfish'
  )),
  introduced_at timestamptz DEFAULT now(),
  introduced_by uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (member_id, allergen_key)
);

-- ── Extend recipes ───────────────────────────────────────────

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS baby_stages    text[]  DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS allergen_flags text[]  DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS has_baby_variant       boolean DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS baby_variant_recipe_id uuid REFERENCES recipes(id);

-- ── Extend shopping lists ────────────────────────────────────

ALTER TABLE personal_shopping_items ADD COLUMN IF NOT EXISTS for_member_id uuid REFERENCES household_members(id);
ALTER TABLE group_shopping_items    ADD COLUMN IF NOT EXISTS for_member_id uuid REFERENCES household_members(id);

-- ── Extend user_preferences ──────────────────────────────────

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS baby_track_visible boolean DEFAULT false;

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE household_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_milestones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_allergens   ENABLE ROW LEVEL SECURITY;

-- household_members: readable/writable by members of the same kitchen_group
CREATE POLICY "group members can read household_members"
  ON household_members FOR SELECT
  USING (
    kitchen_group_id IN (
      SELECT kitchen_group_id FROM kitchen_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "group members can insert household_members"
  ON household_members FOR INSERT
  WITH CHECK (
    kitchen_group_id IN (
      SELECT kitchen_group_id FROM kitchen_group_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "group members can update household_members"
  ON household_members FOR UPDATE
  USING (
    kitchen_group_id IN (
      SELECT kitchen_group_id FROM kitchen_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "group members can delete household_members"
  ON household_members FOR DELETE
  USING (created_by = auth.uid());

-- member_milestones: same group access via member join
CREATE POLICY "group members can manage member_milestones"
  ON member_milestones FOR ALL
  USING (
    member_id IN (
      SELECT hm.id FROM household_members hm
      JOIN kitchen_group_members kgm ON kgm.kitchen_group_id = hm.kitchen_group_id
      WHERE kgm.user_id = auth.uid()
    )
  );

-- member_allergens: same group access via member join
CREATE POLICY "group members can manage member_allergens"
  ON member_allergens FOR ALL
  USING (
    member_id IN (
      SELECT hm.id FROM household_members hm
      JOIN kitchen_group_members kgm ON kgm.kitchen_group_id = hm.kitchen_group_id
      WHERE kgm.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
# or if using the dashboard: paste into SQL editor and run
```

Expected: no errors, all tables created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260509000000_baby_family_hub.sql
git commit -m "feat(db): add household_members, member_milestones, member_allergens tables + recipe/shopping baby columns"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/lib/family-types.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/family-types.ts`**

```typescript
export type MemberType = "baby" | "toddler" | "child" | "adult";

export type MilestoneKey =
  | "started_solids"
  | "handles_soft_lumps"
  | "finger_foods"
  | "family_table";

export type AllergenKey =
  | "egg"
  | "dairy"
  | "gluten"
  | "peanut"
  | "tree_nut"
  | "soy"
  | "fish"
  | "shellfish";

export const MILESTONE_KEYS: MilestoneKey[] = [
  "started_solids",
  "handles_soft_lumps",
  "finger_foods",
  "family_table",
];

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  started_solids:     "Started Solids",
  handles_soft_lumps: "Handles Soft Lumps",
  finger_foods:       "Finger Foods",
  family_table:       "Family Table",
};

export const MILESTONE_DESCRIPTIONS: Record<MilestoneKey, string> = {
  started_solids:     "Ready for single-ingredient purées — smooth, runny textures only.",
  handles_soft_lumps: "Can manage mashed textures and soft food combinations.",
  finger_foods:       "Self-feeds soft pieces; baby-led weaning compatible.",
  family_table:       "Eating adapted versions of whatever the family is having.",
};

export const ALLERGEN_KEYS: AllergenKey[] = [
  "egg", "dairy", "gluten", "peanut", "tree_nut", "soy", "fish", "shellfish",
];

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  egg:       "Egg",
  dairy:     "Dairy",
  gluten:    "Gluten",
  peanut:    "Peanut",
  tree_nut:  "Tree Nut",
  soy:       "Soy",
  fish:      "Fish",
  shellfish: "Shellfish",
};

export interface HouseholdMember {
  id: string;
  kitchen_group_id: string;
  name: string;
  member_type: MemberType;
  date_of_birth?: string | null;
  created_by: string;
  created_at: string;
  milestones?: MemberMilestone[];
  allergens?: MemberAllergen[];
}

export interface MemberMilestone {
  id: string;
  member_id: string;
  milestone_key: MilestoneKey;
  confirmed_at: string;
  confirmed_by: string;
}

export interface MemberAllergen {
  id: string;
  member_id: string;
  allergen_key: AllergenKey;
  introduced_at: string;
  introduced_by: string;
}

/** Returns the highest confirmed milestone for a member, or null if none */
export function currentMilestone(milestones: MemberMilestone[]): MilestoneKey | null {
  const confirmed = new Set(milestones.map((m) => m.milestone_key));
  for (let i = MILESTONE_KEYS.length - 1; i >= 0; i--) {
    if (confirmed.has(MILESTONE_KEYS[i])) return MILESTONE_KEYS[i];
  }
  return null;
}

/** Returns age in human-readable form ("8 months", "2 years") or null */
export function ageLabel(dateOfBirth: string | null | undefined): string | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""}`;
}
```

- [ ] **Step 2: Extend `Recipe` type in `src/lib/types.ts`**

Add after line 103 (after `created_at: string;` inside the `Recipe` interface):

```typescript
  // Baby & family fields
  baby_stages?: string[];
  allergen_flags?: string[];
  has_baby_variant?: boolean;
  baby_variant_recipe_id?: string | null;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/family-types.ts src/lib/types.ts
git commit -m "feat(types): add family-types.ts and baby fields to Recipe type"
```

---

## Task 3: API — Members CRUD

**Files:**
- Create: `src/app/api/family/members/route.ts`
- Create: `src/app/api/family/members/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/family/members/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET — list all household_members for the user's kitchen groups
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find all kitchen_group_ids the user belongs to
  const { data: memberships } = await supabase
    .from("kitchen_group_members")
    .select("kitchen_group_id")
    .eq("user_id", user.id);

  if (!memberships?.length) return NextResponse.json({ members: [] });

  const groupIds = memberships.map((m) => m.kitchen_group_id);

  const { data: members, error } = await supabase
    .from("household_members")
    .select(`
      *,
      milestones: member_milestones(*),
      allergens: member_allergens(*)
    `)
    .in("kitchen_group_id", groupIds)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: members ?? [] });
}

// POST — create a new household_member
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    kitchen_group_id: string;
    name: string;
    member_type: string;
    date_of_birth?: string;
  };

  if (!body.kitchen_group_id || !body.name || !body.member_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify user is a member of the group
  const { data: membership } = await supabase
    .from("kitchen_group_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("kitchen_group_id", body.kitchen_group_id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: member, error } = await supabase
    .from("household_members")
    .insert({
      kitchen_group_id: body.kitchen_group_id,
      name: body.name,
      member_type: body.member_type,
      date_of_birth: body.date_of_birth ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member }, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/family/members/[id]/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string; date_of_birth?: string };

  const { data: member, error } = await supabase
    .from("household_members")
    .update({ name: body.name, date_of_birth: body.date_of_birth ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/family/members/route.ts src/app/api/family/members/[id]/route.ts
git commit -m "feat(api): household_members GET/POST/PATCH/DELETE routes"
```

---

## Task 4: API — Milestones & Allergens

**Files:**
- Create: `src/app/api/family/milestones/route.ts`
- Create: `src/app/api/family/allergens/route.ts`

- [ ] **Step 1: Create `src/app/api/family/milestones/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { MILESTONE_KEYS, type MilestoneKey } from "@/lib/family-types";

export const runtime = "nodejs";

// POST — confirm a milestone for a member
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { member_id, milestone_key } = await req.json() as {
    member_id: string;
    milestone_key: MilestoneKey;
  };

  if (!member_id || !MILESTONE_KEYS.includes(milestone_key)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("member_milestones")
    .upsert(
      { member_id, milestone_key, confirmed_by: user.id },
      { onConflict: "member_id,milestone_key" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ milestone: data }, { status: 201 });
}

// DELETE — un-confirm a milestone (remove)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { member_id, milestone_key } = await req.json() as {
    member_id: string;
    milestone_key: MilestoneKey;
  };

  const { error } = await supabase
    .from("member_milestones")
    .delete()
    .eq("member_id", member_id)
    .eq("milestone_key", milestone_key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `src/app/api/family/allergens/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ALLERGEN_KEYS, type AllergenKey } from "@/lib/family-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { member_id, allergen_key } = await req.json() as {
    member_id: string;
    allergen_key: AllergenKey;
  };

  if (!member_id || !ALLERGEN_KEYS.includes(allergen_key)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("member_allergens")
    .upsert(
      { member_id, allergen_key, introduced_by: user.id },
      { onConflict: "member_id,allergen_key" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ allergen: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { member_id, allergen_key } = await req.json() as {
    member_id: string;
    allergen_key: AllergenKey;
  };

  const { error } = await supabase
    .from("member_allergens")
    .delete()
    .eq("member_id", member_id)
    .eq("allergen_key", allergen_key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/family/milestones/route.ts src/app/api/family/allergens/route.ts
git commit -m "feat(api): milestone confirm/remove and allergen introduce/remove routes"
```

---

## Task 5: API — Baby Recipe Query

**Files:**
- Create: `src/app/api/family/baby-recipes/route.ts`

- [ ] **Step 1: Create `src/app/api/family/baby-recipes/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { MilestoneKey } from "@/lib/family-types";

export const runtime = "nodejs";

// GET /api/family/baby-recipes?member_id=...&stage=...&meal_type=...&allergen_free=true&pantry=true
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId    = searchParams.get("member_id");
  const stage       = searchParams.get("stage") as MilestoneKey | null;
  const mealType    = searchParams.get("meal_type");
  const allergenFree = searchParams.get("allergen_free") === "true";
  const pantryMode  = searchParams.get("pantry") === "true";

  let query = supabase
    .from("recipes")
    .select("id, title, image_url, prep_time_minutes, baby_stages, allergen_flags, has_baby_variant, dish_types, difficulty_level")
    .not("baby_stages", "eq", "{}")
    .limit(40);

  if (stage) {
    query = query.contains("baby_stages", [stage]);
  }

  if (mealType) {
    query = query.contains("dish_types", [mealType]);
  }

  // If allergen_free + member_id: exclude recipes with allergens not yet introduced
  if (allergenFree && memberId) {
    const { data: introduced } = await supabase
      .from("member_allergens")
      .select("allergen_key")
      .eq("member_id", memberId);

    const introducedKeys = (introduced ?? []).map((a) => a.allergen_key);
    // All 8 allergens not yet introduced
    const notIntroduced = ["egg","dairy","gluten","peanut","tree_nut","soy","fish","shellfish"]
      .filter((k) => !introducedKeys.includes(k));

    for (const allergen of notIntroduced) {
      query = query.not("allergen_flags", "cs", `{${allergen}}`);
    }
  }

  // Pantry mode: filter to recipes whose ingredients overlap with user's pantry
  if (pantryMode) {
    const { data: pantryItems } = await supabase
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id);

    if (pantryItems?.length) {
      // Use text search on ingredients column — approximate match
      const pantryNames = pantryItems.map((p) => p.name.toLowerCase());
      // Filter: recipe ingredients array contains at least one pantry item name
      // This uses a GIN index on the ingredients jsonb column
      query = query.overlaps("ingredients", pantryNames);
    }
  }

  const { data: recipes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipes: recipes ?? [] });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/family/baby-recipes/route.ts
git commit -m "feat(api): baby recipe query route with stage, allergen-free, and pantry filters"
```

---

## Task 6: API — Claude Adaptation Snippet

**Files:**
- Create: `src/app/api/family/adapt-recipe/route.ts`

- [ ] **Step 1: Create `src/app/api/family/adapt-recipe/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { MILESTONE_LABELS, type MilestoneKey } from "@/lib/family-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipe_title, ingredients, milestone, member_name, context } = await req.json() as {
    recipe_title: string;
    ingredients: string[];       // ingredient names only
    milestone: MilestoneKey;
    member_name: string;
    context: "recipe_page" | "planner";
  };

  const stageLabel = MILESTONE_LABELS[milestone];

  const systemPrompt = `You are a pediatric nutrition assistant for a family cooking app. You give practical, warm, evidence-based advice aligned with WHO and AAP guidelines. You never provide medical diagnoses, never contradict "consult your pediatrician" advice, and never present allergen introduction schedules as guaranteed safe. Always end with: "Always consult your pediatrician before introducing new foods."`;

  const userPrompt = context === "planner"
    ? `The family is making "${recipe_title}" tonight. ${member_name} is at the "${stageLabel}" stage. In 2 sentences, describe how to adapt this meal for ${member_name}. Be specific to the ingredients: ${ingredients.join(", ")}.`
    : `Ingredients: ${ingredients.join(", ")}. ${member_name} is at the "${stageLabel}" stage. Write a short preparation note (2–3 sentences) for preparing this recipe safely for ${member_name}. Be specific: texture, size, what to remove or substitute.`;

  const anthropic = getAnthropicClient();
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ adaptation: text });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/family/adapt-recipe/route.ts
git commit -m "feat(api): Claude recipe adaptation snippet for baby track and recipe page"
```

---

## Task 7: Static Guide Content

**Files:**
- Create: `src/lib/guides-content.ts`

- [ ] **Step 1: Create `src/lib/guides-content.ts`**

```typescript
export type MilestoneRelevance =
  | "pre_solids"
  | "started_solids"
  | "started_solids_to_soft_lumps"
  | "handles_soft_lumps"
  | "finger_foods"
  | "family_table"
  | "all_stages";

export interface GuideArticle {
  slug: string;
  title: string;
  milestoneRelevance: MilestoneRelevance;
  summary: string;
  body: string; // markdown
}

export const GUIDES: GuideArticle[] = [
  {
    slug: "signs-of-readiness",
    title: "Starting Solids: Signs of Readiness",
    milestoneRelevance: "pre_solids",
    summary: "How to know your baby is ready to start solid foods — what to look for and what to ignore.",
    body: `
## Is Your Baby Ready?

Most babies are developmentally ready for solid foods around 6 months, but readiness is about signs — not age.

### Three signs to look for (all three should be present)

1. **Head control** — Your baby can hold their head steady and upright without support.
2. **Sitting with minimal support** — They can sit in a high chair without slumping.
3. **Interest in food** — They watch you eat, reach for food, and open their mouth when food approaches.

### Signs that are NOT indicators of readiness

- Waking at night (all babies do this; it is not a sign of hunger for solids)
- Chewing fists (normal oral development)
- Being a "big baby"

### What to do next

Talk to your pediatrician at the 4–6 month visit. If all three readiness signs are present, start with a single-ingredient smooth purée once a day.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "first-foods-purees",
    title: "First Foods: Single-Ingredient Purées",
    milestoneRelevance: "started_solids",
    summary: "The best first foods to try, how to prepare them, and how to introduce them safely.",
    body: `
## Starting With Purées

The goal of early solids is exposure, not nutrition — breast milk or formula remains the primary nutrition source until 12 months.

### Best first foods

- **Vegetables:** sweet potato, carrot, pea, butternut squash, parsnip
- **Fruit:** pear, apple, banana, avocado
- **Grains:** baby rice, oat porridge (iron-fortified)
- **Protein:** well-cooked lentils, chicken, beef (puréed smooth)

### How to prepare

1. Steam or roast until very soft.
2. Blend with enough breast milk, formula, or water to achieve a smooth, runny consistency — thinner than ketchup.
3. Serve at room temperature. Never microwave — stir and test temperature before serving.

### Introducing new foods

- Offer one new food every 2–3 days so you can spot any reaction.
- A reaction to watch for: hives, vomiting, or swelling within 2 hours of eating.
- Mild face-pulling is normal — it takes 10–15 exposures before a baby accepts a new flavour.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "introducing-allergens",
    title: "Introducing the Top 8 Allergens Safely",
    milestoneRelevance: "started_solids_to_soft_lumps",
    summary: "Current guidance from WHO and AAP on when and how to introduce the 8 major allergens.",
    body: `
## Allergen Introduction

Current evidence from the LEAP study and AAP guidance (2024) supports early introduction of allergens — delay increases risk.

### The 8 allergens to introduce

Egg, dairy, gluten, peanut, tree nuts, soy, fish, shellfish.

### How to introduce each

1. Introduce allergens one at a time, with 2–3 days between each new one.
2. Start with a small amount — ¼ teaspoon of peanut butter thinned with water, for example.
3. Offer at home, not at childcare, so you can observe for 2 hours.
4. If tolerated, continue offering that allergen regularly (2–3 times per week) to maintain tolerance.

### When to call a doctor immediately

Difficulty breathing, throat tightening, widespread hives, or loss of consciousness after eating.

> This guide is informational only. Always consult your pediatrician for a personalised allergen introduction plan, especially if there is a family history of allergies.
    `.trim(),
  },
  {
    slug: "blw-vs-spoon-feeding",
    title: "Baby-Led Weaning vs. Spoon Feeding",
    milestoneRelevance: "started_solids",
    summary: "The pros, cons, and practical considerations of each approach — and why you do not have to choose.",
    body: `
## Two approaches, one goal

Both baby-led weaning (BLW) and spoon feeding lead to healthy eaters. The best approach is the one that works for your family.

### Spoon feeding

- **Pros:** Easier portion control, you know how much they ate, less mess in early stages.
- **Cons:** Can override hunger cues if pushed; requires more prep (blending).
- **Best for:** Families who want structure, or babies with lower muscle tone.

### Baby-led weaning (BLW)

- **Pros:** Encourages self-regulation, develops pincer grip, makes family meals easier as baby eats what you eat.
- **Cons:** Messier, harder to know intake, requires baby to be at "finger foods" readiness stage.
- **Best for:** Families who eat together regularly and have flexible mealtimes.

### The hybrid approach

Start with purées, transition to mashed textures, then offer soft finger foods alongside spoon-fed portions. Most families do this naturally.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "mashed-lumpy-textures",
    title: "Moving to Mashed & Lumpy Textures",
    milestoneRelevance: "handles_soft_lumps",
    summary: "How to progress from smooth purées to mashed and textured foods without stress.",
    body: `
## Why texture matters

Exposure to lumpy textures before 9–10 months is associated with better food acceptance at age 7. Staying on smooth purées too long can make the transition harder.

### Texture progression

1. **Smooth purée** — no lumps, runny
2. **Thick mash** — lumps present but squash between fingers easily
3. **Fork-mashed** — visible pieces, soft enough to gum
4. **Soft chunks** — pieces about 1cm, soft throughout

### Foods that mash well

Banana, avocado, cooked potato, soft-cooked carrot, lentils, scrambled egg, soft cheese, yoghurt with fruit pieces.

### Foods to avoid at this stage

Raw hard vegetables, whole grapes, whole nuts, large chunks of meat, sticky foods like peanut butter from a spoon.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "finger-foods-safe-shapes",
    title: "Finger Foods: Safe Shapes & Sizes",
    milestoneRelevance: "finger_foods",
    summary: "The correct size and shape for every common finger food to minimise choking risk.",
    body: `
## The finger food rule

Cut all foods so they either dissolve quickly in the mouth OR are too large to fully enter the airway. The danger zone is 1–3cm spherical shapes — grapes, cherry tomatoes, whole blueberries.

### Safe shapes by food type

| Food | Safe preparation |
|------|-----------------|
| Grapes / cherry tomatoes | Quarter lengthways |
| Blueberries | Halve or squash flat |
| Strawberries | Quarter |
| Banana | Spear shape, 5cm long |
| Cooked carrot | Thin sticks or small dice, very soft |
| Toast / bread | Finger-length strips |
| Meat | Shredded or minced — never large chunks |
| Cheese | Thin strips or small cubes |
| Pasta | Shorter shapes (penne, fusilli) |

### Foods to avoid until age 4

Whole nuts, popcorn, hard raw vegetables, large chunks of apple, hot dogs (unless quartered lengthways), hard sweets.

### What to do if your baby gags

Gagging is normal and different from choking. Gagging is noisy and baby resolves it themselves. Choking is silent. Learn infant first aid before starting finger foods.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "foods-to-avoid-first-year",
    title: "Foods to Avoid in the First Year",
    milestoneRelevance: "all_stages",
    summary: "A definitive list of foods that are unsafe for babies under 12 months and why.",
    body: `
## Foods to avoid under 12 months

### Honey (all forms — including cooked)
Risk of infant botulism. Clostridium botulinum spores survive cooking. Absolute no until 12 months.

### Whole cow's milk as a drink
Fine in cooking and yoghurt/cheese, but not as the main drink — displaces iron-rich formula or breast milk.

### Added salt
Babies' kidneys cannot process adult salt levels. Do not add salt to any food. Check labels on bread, stock, and cheese.

### Added sugar
No nutritional benefit, creates preference for sweet foods. Avoid fruit juice, squash, and sugary snacks.

### Unpasteurised foods
Unpasteurised cheese, raw milk, smoked salmon, pâté — listeria risk.

### Certain fish
Shark, swordfish, marlin — high mercury. Limit tuna to 2 portions per week.

### Rice drinks
Not suitable under 4.5 years due to arsenic content.

### Whole nuts
Choking hazard under 4 years. Smooth nut butters are fine from 6 months (thinned for early stages).

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "eating-at-family-table",
    title: "Eating at the Family Table",
    milestoneRelevance: "family_table",
    summary: "How to transition your toddler to eating adapted family meals and make mealtimes enjoyable.",
    body: `
## Eating together

Shared mealtimes are consistently associated with better food acceptance, healthier eating habits, and stronger family relationships.

### How to adapt family meals for toddlers

1. **Cook once, adjust before seasoning.** Add salt and spices to the adult portion after setting aside the baby's portion.
2. **Texture:** Toddlers can handle most adult textures by 12–18 months. Cut into appropriate pieces; avoid hard raw vegetables.
3. **Spice:** Mild herbs and spices are fine and encouraged for flavour exposure. Chilli and very hot food — introduce gradually.
4. **Portion size:** Toddler stomachs are small. A tablespoon per year of age per food item is a rough guide. Do not pressure them to finish.

### Meals that adapt easily

- Pasta dishes (remove salt, serve sauce on the side early on)
- Roasted vegetables (soft-roasted)
- Fish (remove bones, flake)
- Soups (blend for younger babies, serve chunky for toddlers)
- Stews and casseroles (remove large bone pieces)

### Division of responsibility (Ellyn Satter)

- **Your job:** decide what food is offered, when, and where.
- **Their job:** decide whether to eat and how much.

Pressure and coercion reliably make picky eating worse. Consistent exposure without pressure is the evidence-based approach.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
];

/** Map milestone key to the guides relevant for that stage */
export const MILESTONE_GUIDE_MAP: Record<string, string[]> = {
  pre_solids:     ["signs-of-readiness"],
  started_solids: ["first-foods-purees", "introducing-allergens", "blw-vs-spoon-feeding", "foods-to-avoid-first-year"],
  handles_soft_lumps: ["mashed-lumpy-textures", "introducing-allergens", "foods-to-avoid-first-year"],
  finger_foods:   ["finger-foods-safe-shapes", "foods-to-avoid-first-year"],
  family_table:   ["eating-at-family-table", "foods-to-avoid-first-year"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/guides-content.ts
git commit -m "feat(content): add 8 static cornerstone baby food guides"
```

---

## Task 8: Family Member Card Component

**Files:**
- Create: `src/components/family-member-card.tsx`

- [ ] **Step 1: Create `src/components/family-member-card.tsx`**

```typescript
"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Trash2, Edit2, Baby } from "lucide-react";
import {
  type HouseholdMember,
  type MilestoneKey,
  type AllergenKey,
  MILESTONE_KEYS,
  MILESTONE_LABELS,
  MILESTONE_DESCRIPTIONS,
  ALLERGEN_KEYS,
  ALLERGEN_LABELS,
  currentMilestone,
  ageLabel,
} from "@/lib/family-types";

interface Props {
  member: HouseholdMember;
  onMilestoneToggle: (memberId: string, key: MilestoneKey, confirmed: boolean) => Promise<void>;
  onAllergenToggle: (memberId: string, key: AllergenKey, introduced: boolean) => Promise<void>;
  onDelete: (memberId: string) => Promise<void>;
  onEdit: (memberId: string, name: string) => Promise<void>;
}

export function FamilyMemberCard({
  member, onMilestoneToggle, onAllergenToggle, onDelete, onEdit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [loading, setLoading] = useState<string | null>(null);

  const confirmedMilestones = new Set(member.milestones?.map((m) => m.milestone_key) ?? []);
  const introducedAllergens = new Set(member.allergens?.map((a) => a.allergen_key) ?? []);
  const stage = currentMilestone(member.milestones ?? []);
  const age = ageLabel(member.date_of_birth);

  async function handleMilestone(key: MilestoneKey) {
    setLoading(`milestone-${key}`);
    await onMilestoneToggle(member.id, key, !confirmedMilestones.has(key));
    setLoading(null);
  }

  async function handleAllergen(key: AllergenKey) {
    setLoading(`allergen-${key}`);
    await onAllergenToggle(member.id, key, !introducedAllergens.has(key));
    setLoading(null);
  }

  async function handleSaveEdit() {
    if (!editName.trim()) return;
    await onEdit(member.id, editName.trim());
    setEditing(false);
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: "#1A1008", border: "1px solid #3A2416" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg, #B07D56, #5F3E2D)" }}
          >
            <Baby style={{ width: 20, height: 20, color: "#EFE3CE" }} />
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-lg px-3 py-1 text-sm font-semibold"
                style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: "#B07D56", color: "#fff" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: "#8A6A4A" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <p className="font-semibold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                {member.name}
              </p>
              <p className="text-xs" style={{ color: "#8A6A4A" }}>
                {age ? `${age} · ` : ""}{stage ? MILESTONE_LABELS[stage] : "No milestones confirmed yet"}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} style={{ color: "#8A6A4A" }} aria-label="Edit name">
            <Edit2 style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => onDelete(member.id)} style={{ color: "#8A6A4A" }} aria-label="Delete member">
            <Trash2 style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Milestone checklist */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6B4E36" }}>
          Milestones
        </p>
        <div className="space-y-2">
          {MILESTONE_KEYS.map((key) => {
            const confirmed = confirmedMilestones.has(key);
            const isLoading = loading === `milestone-${key}`;
            const confirmedDate = member.milestones?.find((m) => m.milestone_key === key)?.confirmed_at;
            return (
              <button
                key={key}
                onClick={() => handleMilestone(key)}
                disabled={isLoading}
                className="flex items-start gap-3 w-full text-left rounded-xl px-3 py-2.5 transition-colors"
                style={{
                  background: confirmed ? "rgba(176,125,86,0.08)" : "transparent",
                  border: confirmed ? "1px solid rgba(176,125,86,0.2)" : "1px solid transparent",
                }}
              >
                {confirmed
                  ? <CheckCircle2 style={{ width: 18, height: 18, color: "#B07D56", flexShrink: 0, marginTop: 1 }} />
                  : <Circle style={{ width: 18, height: 18, color: "#4A3020", flexShrink: 0, marginTop: 1 }} />
                }
                <div>
                  <p className="text-sm font-medium" style={{ color: confirmed ? "#EFE3CE" : "#6B4E36" }}>
                    {MILESTONE_LABELS[key]}
                  </p>
                  <p className="text-xs" style={{ color: "#6B4E36" }}>
                    {MILESTONE_DESCRIPTIONS[key]}
                  </p>
                  {confirmed && confirmedDate && (
                    <p className="text-xs mt-0.5" style={{ color: "#8A6A4A" }}>
                      Confirmed {new Date(confirmedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergen tracker */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6B4E36" }}>
          Allergens Introduced
        </p>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_KEYS.map((key) => {
            const introduced = introducedAllergens.has(key);
            const isLoading = loading === `allergen-${key}`;
            return (
              <button
                key={key}
                onClick={() => handleAllergen(key)}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: introduced ? "rgba(176,125,86,0.15)" : "#2A1808",
                  color: introduced ? "#F4A261" : "#6B4E36",
                  border: introduced ? "1px solid rgba(244,162,97,0.3)" : "1px solid #3A2416",
                }}
              >
                {introduced && <CheckCircle2 style={{ width: 12, height: 12 }} />}
                {ALLERGEN_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/family-member-card.tsx
git commit -m "feat(ui): FamilyMemberCard with milestone checklist and allergen tracker"
```

---

## Task 9: `/family/members` Page

**Files:**
- Create: `src/app/(app)/family/members/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/family/members/page.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { FamilyMemberCard } from "@/components/family-member-card";
import type { HouseholdMember, MilestoneKey, AllergenKey } from "@/lib/family-types";

export default function FamilyMembersPage() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"baby" | "toddler" | "child">("baby");
  const [newDob, setNewDob] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/family/members")
      .then((r) => r.json())
      .then((data) => { setMembers(data.members ?? []); setLoading(false); });

    // Get user's kitchen_group_id for creating new members
    fetch("/api/pantry/household-diets")
      .then(() => {
        // We need the group id — fetch from kitchen_groups
        fetch("/api/kitchen-groups/my")
          .then((r) => r.json())
          .then((d) => setGroupId(d.group?.id ?? null));
      });
  }, []);

  async function handleAdd() {
    if (!newName.trim() || !groupId) return;
    const res = await fetch("/api/family/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kitchen_group_id: groupId,
        name: newName.trim(),
        member_type: newType,
        date_of_birth: newDob || undefined,
      }),
    });
    const data = await res.json();
    if (data.member) {
      setMembers((prev) => [...prev, { ...data.member, milestones: [], allergens: [] }]);
      setNewName(""); setNewDob(""); setShowAddForm(false);
    }
  }

  async function handleMilestoneToggle(memberId: string, key: MilestoneKey, confirming: boolean) {
    await fetch("/api/family/milestones", {
      method: confirming ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, milestone_key: key }),
    });
    // Refresh members
    const data = await fetch("/api/family/members").then((r) => r.json());
    setMembers(data.members ?? []);
  }

  async function handleAllergenToggle(memberId: string, key: AllergenKey, introducing: boolean) {
    await fetch("/api/family/allergens", {
      method: introducing ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, allergen_key: key }),
    });
    const data = await fetch("/api/family/members").then((r) => r.json());
    setMembers(data.members ?? []);
  }

  async function handleDelete(memberId: string) {
    await fetch(`/api/family/members/${memberId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function handleEdit(memberId: string, name: string) {
    await fetch(`/api/family/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, name } : m));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p style={{ color: "#6B4E36" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Family Members
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: "#B07D56", color: "#fff" }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Add member
        </button>
      </div>

      {showAddForm && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "#1A1008", border: "1px solid #3A2416" }}
        >
          <p className="font-semibold" style={{ color: "#EFE3CE" }}>Add a family member</p>
          <input
            placeholder="Name (e.g. Mia)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-xl px-4 py-2 text-sm"
            style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as "baby" | "toddler" | "child")}
            className="w-full rounded-xl px-4 py-2 text-sm"
            style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
          >
            <option value="baby">Baby (0–12 months)</option>
            <option value="toddler">Toddler (1–3 years)</option>
            <option value="child">Child (3+ years)</option>
          </select>
          <div>
            <label className="text-xs" style={{ color: "#8A6A4A" }}>Date of birth (optional)</label>
            <input
              type="date"
              value={newDob}
              onChange={(e) => setNewDob(e.target.value)}
              className="w-full rounded-xl px-4 py-2 text-sm mt-1"
              style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: "#B07D56", color: "#fff" }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-xl px-4 py-2 text-sm"
              style={{ color: "#8A6A4A" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {members.length === 0 && !showAddForm && (
        <div
          className="rounded-2xl p-8 text-center space-y-3"
          style={{ background: "#1A1008", border: "1px solid #3A2416" }}
        >
          <p className="text-lg font-semibold" style={{ color: "#EFE3CE" }}>No family members yet</p>
          <p className="text-sm" style={{ color: "#8A6A4A" }}>
            Add a baby or child to get age-appropriate recipe suggestions and a baby track in your meal planner.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: "#B07D56", color: "#fff" }}
          >
            Add your first member
          </button>
        </div>
      )}

      {members.map((member) => (
        <FamilyMemberCard
          key={member.id}
          member={member}
          onMilestoneToggle={handleMilestoneToggle}
          onAllergenToggle={handleAllergenToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/family/members/page.tsx
git commit -m "feat(ui): /family/members page — member profiles, milestones, allergen tracker"
```

---

## Task 10: Family Hub Landing Page

**Files:**
- Create: `src/app/(app)/family/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/family/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Baby, BookOpen, Calendar, ChefHat, ArrowRight } from "lucide-react";
import { currentMilestone, MILESTONE_LABELS, type HouseholdMember } from "@/lib/family-types";
import { redirect } from "next/navigation";

async function getFamilyData(userId: string, supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: memberships } = await supabase
    .from("kitchen_group_members")
    .select("kitchen_group_id")
    .eq("user_id", userId);

  if (!memberships?.length) return { hasGroup: false, members: [], todayMeal: null, suggestedRecipes: [] };

  const groupIds = memberships.map((m) => m.kitchen_group_id);

  const { data: members } = await supabase
    .from("household_members")
    .select("*, milestones: member_milestones(*), allergens: member_allergens(*)")
    .in("kitchen_group_id", groupIds)
    .order("created_at", { ascending: true });

  // Get 3 baby recipe suggestions for the first member's current stage
  let suggestedRecipes: { id: string; title: string; image_url: string }[] = [];
  const firstMember = (members ?? [])[0] as HouseholdMember | undefined;
  if (firstMember) {
    const stage = currentMilestone(firstMember.milestones ?? []);
    if (stage) {
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, image_url")
        .contains("baby_stages", [stage])
        .limit(3);
      suggestedRecipes = recipes ?? [];
    }
  }

  return { hasGroup: true, members: (members ?? []) as HouseholdMember[], todayMeal: null, suggestedRecipes };
}

export default async function FamilyHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { hasGroup, members, suggestedRecipes } = await getFamilyData(user.id, supabase);

  const firstMember = members[0] as HouseholdMember | undefined;
  const firstStage = firstMember ? currentMilestone(firstMember.milestones ?? []) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
        Family Hub
      </h1>

      {!hasGroup && (
        <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
          <p className="font-semibold" style={{ color: "#EFE3CE" }}>Set up a household first</p>
          <p className="text-sm" style={{ color: "#8A6A4A" }}>
            Family features work with a shared household. Create one to get started.
          </p>
          <Link href="/pantry" className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "#B07D56", color: "#fff" }}>
            Go to Pantry & Household
          </Link>
        </div>
      )}

      {hasGroup && members.length === 0 && (
        <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
          <Baby style={{ width: 32, height: 32, color: "#B07D56", margin: "0 auto" }} />
          <p className="font-semibold" style={{ color: "#EFE3CE" }}>Add your first family member</p>
          <p className="text-sm" style={{ color: "#8A6A4A" }}>
            Track milestones, get age-safe recipes, and run a baby track in your meal planner.
          </p>
          <Link href="/family/members" className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "#B07D56", color: "#fff" }}>
            Add a baby or child
          </Link>
        </div>
      )}

      {hasGroup && members.length > 0 && (
        <>
          {/* Card 1 — Member profiles */}
          <Link href="/family/members" className="block rounded-2xl p-5 space-y-3" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Baby style={{ width: 18, height: 18, color: "#B07D56" }} />
                <p className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>Family Members</p>
              </div>
              <ArrowRight style={{ width: 16, height: 16, color: "#6B4E36" }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const stage = currentMilestone(m.milestones ?? []);
                return (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "#2A1808" }}>
                    <span className="text-sm font-medium" style={{ color: "#EFE3CE" }}>{m.name}</span>
                    {stage && <span className="text-xs" style={{ color: "#8A6A4A" }}>{MILESTONE_LABELS[stage]}</span>}
                  </div>
                );
              })}
            </div>
          </Link>

          {/* Card 2 — Today's baby track */}
          <Link href="/family/planner" className="block rounded-2xl p-5 space-y-2" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar style={{ width: 18, height: 18, color: "#B07D56" }} />
                <p className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>Baby Track</p>
              </div>
              <ArrowRight style={{ width: 16, height: 16, color: "#6B4E36" }} />
            </div>
            <p className="text-sm" style={{ color: "#8A6A4A" }}>
              See the baby track in your meal planner for this week.
            </p>
          </Link>

          {/* Card 3 — Recipe suggestions */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat style={{ width: 18, height: 18, color: "#B07D56" }} />
                <p className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>
                  {firstMember ? `Recipes for ${firstMember.name} right now` : "Baby Recipes"}
                </p>
              </div>
              <Link href="/family/recipes" style={{ color: "#8A6A4A" }}>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
            {suggestedRecipes.length === 0 && (
              <p className="text-sm" style={{ color: "#8A6A4A" }}>
                {firstStage ? "No recipes found for this stage yet." : "Confirm a milestone to see recipe suggestions."}
              </p>
            )}
            <div className="space-y-2">
              {suggestedRecipes.map((r) => (
                <Link key={r.id} href={`/recipes/${r.id}`} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#2A1808" }}>
                  {r.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt={r.title} className="rounded-lg object-cover" style={{ width: 48, height: 48 }} />
                  )}
                  <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>{r.title}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Card 4 — Guides */}
          <Link href="/family/guides" className="block rounded-2xl p-5 space-y-2" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen style={{ width: 18, height: 18, color: "#B07D56" }} />
                <p className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>Feeding Guides</p>
              </div>
              <ArrowRight style={{ width: 16, height: 16, color: "#6B4E36" }} />
            </div>
            <p className="text-sm" style={{ color: "#8A6A4A" }}>
              {firstStage
                ? `Stage-relevant guides for ${firstMember?.name ?? "your baby"}'s current milestone.`
                : "Evidence-based guides from first foods to family table."}
            </p>
          </Link>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/family/page.tsx
git commit -m "feat(ui): /family hub landing page with 4 cards"
```

---

## Task 11: Guides Pages

**Files:**
- Create: `src/app/(app)/family/guides/page.tsx`
- Create: `src/app/(app)/family/guides/[slug]/page.tsx`
- Create: `src/app/(app)/family/planner/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/family/guides/page.tsx`**

```typescript
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { GUIDES } from "@/lib/guides-content";

export default function GuidesIndexPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
        Baby Feeding Guides
      </h1>
      <p className="text-sm" style={{ color: "#8A6A4A" }}>
        Evidence-based guides aligned with WHO and AAP recommendations.
      </p>
      <div className="space-y-3">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/family/guides/${guide.slug}`}
            className="flex items-start gap-4 rounded-2xl p-4 transition-colors"
            style={{ background: "#1A1008", border: "1px solid #3A2416" }}
          >
            <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 40, height: 40, background: "#2A1808" }}>
              <BookOpen style={{ width: 18, height: 18, color: "#B07D56" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>{guide.title}</p>
              <p className="text-xs mt-1" style={{ color: "#8A6A4A" }}>{guide.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/(app)/family/guides/[slug]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { GUIDES } from "@/lib/guides-content";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuideArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/family/guides" className="flex items-center gap-2 text-sm mb-6" style={{ color: "#8A6A4A" }}>
        <ArrowLeft style={{ width: 16, height: 16 }} />
        All guides
      </Link>

      <h1 className="text-2xl font-bold mb-3" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
        {guide.title}
      </h1>
      <p className="text-sm mb-6" style={{ color: "#8A6A4A" }}>{guide.summary}</p>

      <article
        className="prose prose-invert prose-sm max-w-none"
        style={{ color: "#C4A882" }}
      >
        <ReactMarkdown>{guide.body}</ReactMarkdown>
      </article>

      {/* Medical disclaimer */}
      <div
        className="mt-8 rounded-xl p-4"
        style={{ background: "#1A1008", border: "1px solid #3A2416" }}
      >
        <p className="text-xs" style={{ color: "#6B4E36" }}>
          <strong style={{ color: "#8A6A4A" }}>Medical disclaimer:</strong> This guide is for informational purposes only and does not constitute medical advice. Every baby develops differently. Always consult your pediatrician before introducing new foods or making changes to your baby&apos;s diet.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/family/planner/page.tsx`**

```typescript
import { redirect } from "next/navigation";

export default function FamilyPlannerRedirect() {
  redirect("/plans?babyTrack=1");
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/family/guides/page.tsx src/app/\(app\)/family/guides/\[slug\]/page.tsx src/app/\(app\)/family/planner/page.tsx
git commit -m "feat(ui): family guides index, article pages, and planner redirect"
```

---

## Task 12: Baby Recipe Browser Page

**Files:**
- Create: `src/app/(app)/family/recipes/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/family/recipes/page.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Filter } from "lucide-react";
import type { HouseholdMember, MilestoneKey } from "@/lib/family-types";
import { currentMilestone, MILESTONE_LABELS, MILESTONE_KEYS } from "@/lib/family-types";
import type { Recipe } from "@/lib/types";

export default function FamilyRecipesPage() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [stage, setStage] = useState<MilestoneKey | "">("");
  const [mealType, setMealType] = useState("");
  const [allergenFree, setAllergenFree] = useState(false);
  const [pantryMode, setPantryMode] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [introducedAllergens, setIntroducedAllergens] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/family/members")
      .then((r) => r.json())
      .then((data) => {
        const m = data.members ?? [];
        setMembers(m);
        if (m.length > 0) {
          setSelectedMemberId(m[0].id);
          const s = currentMilestone(m[0].milestones ?? []);
          if (s) setStage(s);
          setIntroducedAllergens(new Set(m[0].allergens?.map((a: { allergen_key: string }) => a.allergen_key) ?? []));
        }
      });
  }, []);

  useEffect(() => {
    if (!stage) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedMemberId) params.set("member_id", selectedMemberId);
    if (stage) params.set("stage", stage);
    if (mealType) params.set("meal_type", mealType);
    if (allergenFree) params.set("allergen_free", "true");
    if (pantryMode) params.set("pantry", "true");

    fetch(`/api/family/baby-recipes?${params}`)
      .then((r) => r.json())
      .then((data) => { setRecipes(data.recipes ?? []); setLoading(false); });
  }, [selectedMemberId, stage, mealType, allergenFree, pantryMode]);

  function handleMemberTab(member: HouseholdMember) {
    setSelectedMemberId(member.id);
    const s = currentMilestone(member.milestones ?? []);
    if (s) setStage(s);
    setIntroducedAllergens(new Set(member.allergens?.map((a) => a.allergen_key) ?? []));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
        Baby Recipes
      </h1>

      {/* Member tabs */}
      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map((m) => {
            const s = currentMilestone(m.milestones ?? []);
            const active = m.id === selectedMemberId;
            return (
              <button
                key={m.id}
                onClick={() => handleMemberTab(m)}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? "#B07D56" : "#2A1808",
                  color: active ? "#fff" : "#8A6A4A",
                }}
              >
                {m.name}{s ? ` · ${MILESTONE_LABELS[s]}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#1A1008", border: "1px solid #3A2416" }}>
        <div className="flex items-center gap-2">
          <Filter style={{ width: 14, height: 14, color: "#8A6A4A" }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6B4E36" }}>Filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as MilestoneKey | "")}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
          >
            <option value="">All stages</option>
            {MILESTONE_KEYS.map((k) => (
              <option key={k} value={k}>{MILESTONE_LABELS[k]}</option>
            ))}
          </select>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
          >
            <option value="">All meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <button
            onClick={() => setAllergenFree((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              background: allergenFree ? "rgba(176,125,86,0.15)" : "#2A1808",
              color: allergenFree ? "#F4A261" : "#8A6A4A",
              border: allergenFree ? "1px solid rgba(244,162,97,0.3)" : "1px solid #3A2416",
            }}
          >
            Allergen-free for {members.find((m) => m.id === selectedMemberId)?.name ?? "baby"}
          </button>
          <button
            onClick={() => setPantryMode((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              background: pantryMode ? "rgba(176,125,86,0.15)" : "#2A1808",
              color: pantryMode ? "#F4A261" : "#8A6A4A",
              border: pantryMode ? "1px solid rgba(244,162,97,0.3)" : "1px solid #3A2416",
            }}
          >
            Use my pantry
          </button>
        </div>
      </div>

      {/* Recipe grid */}
      {loading && <p className="text-sm" style={{ color: "#6B4E36" }}>Loading recipes...</p>}
      {!loading && recipes.length === 0 && (
        <p className="text-sm" style={{ color: "#8A6A4A" }}>No recipes found for these filters. Try adjusting the stage or removing filters.</p>
      )}
      <div className="space-y-3">
        {recipes.map((recipe) => {
          const hasUnintroducedAllergen = (recipe.allergen_flags ?? []).some(
            (flag) => flag !== "honey" && !introducedAllergens.has(flag)
          );
          return (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: "#1A1008", border: "1px solid #3A2416" }}
            >
              {recipe.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={recipe.image_url} alt={recipe.title} className="rounded-xl object-cover flex-shrink-0" style={{ width: 64, height: 64 }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "#EFE3CE" }}>{recipe.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(recipe.baby_stages ?? []).map((s) => (
                    <span key={s} className="text-xs rounded-full px-2 py-0.5" style={{ background: "#2A1808", color: "#B07D56" }}>
                      {MILESTONE_LABELS[s as MilestoneKey] ?? s}
                    </span>
                  ))}
                  {hasUnintroducedAllergen && (
                    <span className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(234,179,8,0.1)", color: "#EAB308" }}>
                      <AlertTriangle style={{ width: 10, height: 10 }} />
                      Allergen check
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/family/recipes/page.tsx
git commit -m "feat(ui): /family/recipes baby recipe browser with member tabs, stage filter, allergen warnings"
```

---

## Task 13: Navigation Updates

**Files:**
- Modify: `src/components/app-nav.tsx`
- Modify: `src/components/mobile-bottom-nav.tsx`

- [ ] **Step 1: Add Family to `app-nav.tsx`**

In `src/components/app-nav.tsx`, find the `NAV_GROUPS` array and add a new group after the `"Kitchen"` group. Also add `Baby` to the import from lucide-react:

```typescript
// Add to lucide-react import:
Baby,

// Add to NAV_GROUPS array after the "Kitchen" group:
{
  group: "Family",
  items: [
    {
      href: "/family",
      label: "Family Hub",
      icon: Baby,
      desc: "",
      children: [
        { href: "/family/members",  label: "Family Members", icon: Baby,         desc: "" },
        { href: "/family/recipes",  label: "Baby Recipes",   icon: UtensilsCrossed, desc: "" },
        { href: "/family/guides",   label: "Feeding Guides", icon: BookOpen,     desc: "" },
      ],
    },
  ],
},
```

Also add `BookOpen` to the lucide-react import in `app-nav.tsx` (it's already imported in guides pages but needs to be here too):
```typescript
BookOpen,
```

- [ ] **Step 2: Add Family to `mobile-bottom-nav.tsx`**

In `MORE_ITEMS` array, add:
```typescript
{ href: "/family", label: "Family Hub", icon: Baby },
```

Also add `Baby` to the lucide-react import in `mobile-bottom-nav.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/app-nav.tsx src/components/mobile-bottom-nav.tsx
git commit -m "feat(nav): add Family Hub to app-nav and mobile-bottom-nav"
```

---

## Task 14: Pantry Safety Flags

**Files:**
- Modify: `src/app/(app)/pantry/pantry-client.tsx`

- [ ] **Step 1: Fetch household members in pantry client**

At the top of the `PantryClient` component (after existing state declarations), add:

```typescript
const [householdMembers, setHouseholdMembers] = useState<Array<{ id: string; name: string; allergens: Array<{ allergen_key: string }> }>>([]);

useEffect(() => {
  fetch("/api/family/members")
    .then((r) => r.json())
    .then((data) => setHouseholdMembers(data.members ?? []));
}, []);
```

- [ ] **Step 2: Add safety flag helper**

Add this function inside the component (before the return):

```typescript
function getUnsafeForMembers(itemName: string): string[] {
  const nameLower = itemName.toLowerCase();
  // Map common ingredient names to allergen keys
  const INGREDIENT_ALLERGEN_MAP: Record<string, string> = {
    egg: "egg", eggs: "egg",
    milk: "dairy", cheese: "dairy", butter: "dairy", cream: "dairy", yogurt: "dairy", yoghurt: "dairy",
    flour: "gluten", bread: "gluten", pasta: "gluten", wheat: "gluten",
    peanut: "peanut", "peanut butter": "peanut",
    almond: "tree_nut", walnut: "tree_nut", cashew: "tree_nut", pistachio: "tree_nut",
    soy: "soy", tofu: "soy", edamame: "soy",
    salmon: "fish", tuna: "fish", cod: "fish", haddock: "fish",
    shrimp: "shellfish", prawn: "shellfish", crab: "shellfish", lobster: "shellfish",
    honey: "honey",
  };

  const allergen = Object.entries(INGREDIENT_ALLERGEN_MAP).find(([ingredient]) =>
    nameLower.includes(ingredient)
  )?.[1];

  if (!allergen) return [];

  return householdMembers
    .filter((m) => {
      if (allergen === "honey") return true; // honey always unsafe under 12mo
      const introduced = m.allergens.map((a) => a.allergen_key);
      return !introduced.includes(allergen);
    })
    .map((m) => m.name);
}
```

- [ ] **Step 3: Add warning badge to pantry item cards**

In the pantry item rendering, find where each item name is displayed and add after it:

```typescript
{(() => {
  const unsafeFor = getUnsafeForMembers(item.name);
  if (!unsafeFor.length) return null;
  return (
    <span
      className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 mt-1"
      style={{ background: "rgba(234,179,8,0.1)", color: "#EAB308", width: "fit-content" }}
    >
      <AlertTriangle style={{ width: 10, height: 10 }} />
      Not yet introduced for {unsafeFor.join(", ")}
    </span>
  );
})()}
```

Also add `AlertTriangle` to the lucide-react import in `pantry-client.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/pantry/pantry-client.tsx
git commit -m "feat(pantry): add allergen safety flags for household members"
```

---

## Task 15: Recipe Page Baby Variant / Adapt Button

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-columns-client.tsx`

- [ ] **Step 1: Add baby variant state and fetch**

At the top of the `RecipeColumnsClient` component, add:

```typescript
const [babyAdaptation, setBabyAdaptation] = useState<string | null>(null);
const [adaptLoading, setAdaptLoading] = useState(false);
const [members, setMembers] = useState<Array<{ id: string; name: string; milestones: Array<{ milestone_key: string }> }>>([]);
const [selectedMember, setSelectedMember] = useState<string | null>(null);

useEffect(() => {
  fetch("/api/family/members")
    .then((r) => r.json())
    .then((data) => {
      const m = data.members ?? [];
      setMembers(m);
      if (m.length > 0) setSelectedMember(m[0].id);
    });
}, []);
```

- [ ] **Step 2: Add adapt handler**

```typescript
async function handleAdaptForBaby() {
  const member = members.find((m) => m.id === selectedMember);
  if (!member) return;
  const milestones = member.milestones ?? [];
  // currentMilestone import from family-types
  const stage = currentMilestone(milestones as { milestone_key: string }[] as never);
  if (!stage) return;

  setAdaptLoading(true);
  const res = await fetch("/api/family/adapt-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipe_title: recipe.title,
      ingredients: (recipe.ingredients ?? []).map((i) => i.name),
      milestone: stage,
      member_name: member.name,
      context: "recipe_page",
    }),
  });
  const data = await res.json();
  setBabyAdaptation(data.adaptation ?? null);
  setAdaptLoading(false);
}
```

Add `import { currentMilestone } from "@/lib/family-types";` to the imports.

- [ ] **Step 3: Render the baby variant / adapt button section**

Find the section just below the recipe title/header in the JSX and add:

```typescript
{/* Baby variant / adapt section */}
{members.length > 0 && (
  <div
    className="rounded-xl p-4 space-y-3"
    style={{ background: "#1A1008", border: "1px solid #3A2416" }}
  >
    <div className="flex items-center gap-2">
      <Baby style={{ width: 16, height: 16, color: "#B07D56" }} />
      <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>For the little ones</p>
    </div>
    {members.length > 1 && (
      <select
        value={selectedMember ?? ""}
        onChange={(e) => { setSelectedMember(e.target.value); setBabyAdaptation(null); }}
        className="rounded-lg px-3 py-1.5 text-sm w-full"
        style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid #5A3A22" }}
      >
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    )}
    {recipe.has_baby_variant ? (
      <Link
        href={`/recipes/${recipe.baby_variant_recipe_id}`}
        className="inline-block rounded-xl px-4 py-2 text-sm font-semibold"
        style={{ background: "#B07D56", color: "#fff" }}
      >
        View baby version
      </Link>
    ) : (recipe.baby_stages?.length ?? 0) > 0 ? (
      <div className="space-y-2">
        <button
          onClick={handleAdaptForBaby}
          disabled={adaptLoading}
          className="rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: "#B07D56", color: "#fff" }}
        >
          {adaptLoading ? "Adapting..." : `Adapt for ${members.find((m) => m.id === selectedMember)?.name ?? "baby"}`}
        </button>
        {babyAdaptation && (
          <div className="rounded-xl p-3" style={{ background: "#2A1808" }}>
            <p className="text-sm" style={{ color: "#C4A882" }}>{babyAdaptation}</p>
          </div>
        )}
      </div>
    ) : null}
  </div>
)}
```

Add `Baby` to the lucide-react import and `Link` from next/link if not already imported.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/recipes/\[id\]/recipe-columns-client.tsx
git commit -m "feat(recipes): baby variant button and AI adapt-for-baby on recipe detail page"
```

---

## Task 16: Meal Planner Baby Track

**Files:**
- Modify: `src/app/(app)/plans/[id]/plan-builder.tsx`

- [ ] **Step 1: Add baby track state**

At the top of the `PlanBuilder` component, add:

```typescript
const [babyTrackVisible, setBabyTrackVisible] = useState(false);
const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
const [babyAdaptations, setBabyAdaptations] = useState<Record<string, string>>({}); // key: `${dayNum}-${mealType}-${memberId}`

useEffect(() => {
  // Load baby track preference
  fetch("/api/user-preferences")
    .then((r) => r.json())
    .then((d) => setBabyTrackVisible(d.baby_track_visible ?? false));
  // Load household members
  fetch("/api/family/members")
    .then((r) => r.json())
    .then((d) => setHouseholdMembers(d.members ?? []));
}, []);
```

Add import: `import type { HouseholdMember } from "@/lib/family-types";`
Add import: `import { currentMilestone } from "@/lib/family-types";`

- [ ] **Step 2: Add toggle handler that persists preference**

```typescript
async function handleBabyTrackToggle(visible: boolean) {
  setBabyTrackVisible(visible);
  await fetch("/api/user-preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baby_track_visible: visible }),
  });
}
```

- [ ] **Step 3: Add baby adaptation fetch**

```typescript
async function fetchBabyAdaptation(
  dayNum: number,
  mealType: string,
  recipe: { title: string; ingredients?: Array<{ name: string }> },
  member: HouseholdMember
) {
  const key = `${dayNum}-${mealType}-${member.id}`;
  if (babyAdaptations[key]) return; // already cached

  const stage = currentMilestone(member.milestones ?? []);
  if (!stage) return;

  const res = await fetch("/api/family/adapt-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipe_title: recipe.title,
      ingredients: (recipe.ingredients ?? []).map((i) => i.name),
      milestone: stage,
      member_name: member.name,
      context: "planner",
    }),
  });
  const data = await res.json();
  if (data.adaptation) {
    setBabyAdaptations((prev) => ({ ...prev, [key]: data.adaptation }));
  }
}
```

- [ ] **Step 4: Add the baby track UI**

In the plan builder JSX, find the toggle/controls area at the top of the planner and add the baby track toggle:

```typescript
{householdMembers.length > 0 && (
  <button
    onClick={() => handleBabyTrackToggle(!babyTrackVisible)}
    className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium"
    style={{
      background: babyTrackVisible ? "rgba(176,125,86,0.15)" : "#2A1808",
      color: babyTrackVisible ? "#F4A261" : "#8A6A4A",
      border: babyTrackVisible ? "1px solid rgba(244,162,97,0.3)" : "1px solid #3A2416",
    }}
  >
    <Baby style={{ width: 14, height: 14 }} />
    Baby track
  </button>
)}
```

Then, after each adult meal slot row in the day grid, add a collapsible baby track row. Find the meal entry rendering loop and after each entry, add:

```typescript
{babyTrackVisible && householdMembers.map((member) => {
  const stage = currentMilestone(member.milestones ?? []);
  const adaptKey = `${entry.day_number}-${entry.meal_type}-${member.id}`;
  const adaptation = babyAdaptations[adaptKey];
  const isNotAdaptable = (entry.recipe_title ?? "").toLowerCase().includes("spicy") ||
    (entry.recipe_title ?? "").toLowerCase().includes("curry");

  return (
    <div
      key={member.id}
      className="flex items-start gap-3 rounded-xl p-3 ml-4"
      style={{ background: "#160C06", border: "1px solid #2A1808" }}
      ref={(el) => {
        // Lazy-load adaptation when scrolled into view
        if (el && !adaptation && !isNotAdaptable && stage) {
          const observer = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
              fetchBabyAdaptation(entry.day_number, entry.meal_type, { title: entry.recipe_title ?? "", ingredients: [] }, member);
              observer.disconnect();
            }
          });
          observer.observe(el);
        }
      }}
    >
      <Baby style={{ width: 14, height: 14, color: "#B07D56", flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: "#8A6A4A" }}>
          {member.name} · {stage ? MILESTONE_LABELS[stage] : "No milestone set"}
        </p>
        {isNotAdaptable ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "#2A1808", color: "#6B4E36" }}>
              Not adaptable
            </span>
            <Link href="/family/recipes" className="text-xs" style={{ color: "#B07D56" }}>
              Pick a baby meal →
            </Link>
          </div>
        ) : adaptation ? (
          <p className="text-xs mt-1" style={{ color: "#C4A882" }}>{adaptation}</p>
        ) : (
          <p className="text-xs mt-1" style={{ color: "#4A3020" }}>Loading suggestion...</p>
        )}
      </div>
    </div>
  );
})}
```

Add `Baby` and `MILESTONE_LABELS` imports.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/plans/\[id\]/plan-builder.tsx
git commit -m "feat(planner): baby track toggle with per-member AI adaptation suggestions"
```

---

## Task 17: API — User Preferences PATCH (baby_track_visible)

The planner baby track toggle needs to persist `baby_track_visible` to `user_preferences`. Check if an existing `/api/user-preferences` PATCH endpoint exists.

- [ ] **Step 1: Check for existing preferences API**

```bash
ls src/app/api/user-preferences/ 2>/dev/null || echo "Does not exist"
```

- [ ] **Step 2a: If route does not exist, create `src/app/api/user-preferences/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_preferences")
    .select("baby_track_visible, household_dietary_tags")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(data ?? {});
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["baby_track_visible"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2b: If route exists, add `baby_track_visible` to its allowed fields and GET select**

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user-preferences/route.ts
git commit -m "feat(api): user-preferences GET/PATCH with baby_track_visible"
```

---

## Task 18: Shopping List 🍼 Tags

**Files:**
- Modify the shopping list client component (find it at `src/app/(app)/shopping-list/`)

- [ ] **Step 1: Locate the shopping list client file**

```bash
ls src/app/\(app\)/shopping-list/
```

- [ ] **Step 2: Add 🍼 tag rendering for items with `for_member_id`**

In the shopping list item render, after the item name, add:

```typescript
{item.for_member_id && (() => {
  const member = householdMembers.find((m) => m.id === item.for_member_id);
  if (!member) return null;
  return (
    <span
      title={`For ${member.name}`}
      className="text-xs rounded-full px-2 py-0.5"
      style={{ background: "#2A1808", color: "#B07D56" }}
    >
      🍼 {member.name}
    </span>
  );
})()}
```

Fetch household members in this component's useEffect (same pattern as pantry: `fetch("/api/family/members")`).

- [ ] **Step 3: Add "Show baby items only" quick filter**

At the top of the shopping list, add a toggle button:

```typescript
const [babyOnlyFilter, setBabyOnlyFilter] = useState(false);
// In filter logic:
const displayedItems = babyOnlyFilter
  ? items.filter((item) => item.for_member_id != null)
  : items;
```

Button:
```typescript
{householdMembers.length > 0 && (
  <button
    onClick={() => setBabyOnlyFilter((v) => !v)}
    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
    style={{
      background: babyOnlyFilter ? "rgba(176,125,86,0.15)" : "#2A1808",
      color: babyOnlyFilter ? "#F4A261" : "#8A6A4A",
    }}
  >
    🍼 Baby items only
  </button>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/shopping-list/
git commit -m "feat(shopping-list): 🍼 baby item tags and baby-only filter"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task |
|---|---|
| DB tables: household_members, member_milestones, member_allergens | Task 1 |
| DB: recipes baby columns | Task 1 |
| DB: shopping list for_member_id | Task 1 |
| DB: user_preferences.baby_track_visible | Task 1 |
| TypeScript types + helpers | Task 2 |
| Members CRUD API | Task 3 |
| Milestones + allergens API | Task 4 |
| Baby recipe query API | Task 5 |
| Claude adapt snippet API | Task 6 |
| 8 static guides content | Task 7 |
| FamilyMemberCard component | Task 8 |
| /family/members page | Task 9 |
| /family hub landing | Task 10 |
| /family/guides + /family/guides/[slug] | Task 11 |
| /family/planner redirect | Task 11 |
| /family/recipes browser | Task 12 |
| Nav updates (desktop + mobile) | Task 13 |
| Pantry safety flags | Task 14 |
| Recipe page baby variant/adapt | Task 15 |
| Meal planner baby track | Task 16 |
| user-preferences PATCH | Task 17 |
| Shopping list 🍼 tags + filter | Task 18 |

All spec sections covered. No gaps found.

**Placeholder scan:** No TBD/TODO/placeholder steps. All code blocks are complete.

**Type consistency:**
- `HouseholdMember`, `MilestoneKey`, `AllergenKey` defined in Task 2, used consistently in Tasks 3–16.
- `currentMilestone()` defined in Task 2 (`family-types.ts`), imported in Tasks 8, 15, 16.
- `MILESTONE_LABELS`, `MILESTONE_KEYS` defined in Task 2, used in Tasks 8, 9, 12, 16.
- `babyAdaptations` key format `${dayNum}-${mealType}-${memberId}` consistent between setter (Task 16 step 3) and renderer (Task 16 step 4).
