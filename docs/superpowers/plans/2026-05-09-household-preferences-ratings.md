# Household Preferences & Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to manage household member profiles, record per-member meal reactions at rating time, track ingredient-level preferences per member, and have all of this drive recipe suggestion scoring and badges.

**Architecture:** New Supabase tables (`household_members`, `member_ingredient_preferences`, `member_meal_reactions`) feed a household scoring pass added to the existing suggestions API. The rating screen gains a per-member reaction section, and a new Household tab in the profile area handles member management.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), TypeScript, Tailwind, existing brand token palette (#C8522A, #EFE3CE, #3A2416, #1C1209).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260509_household.sql` | Create | All 3 new tables + `ingredient_categories.parent_category_id` column + RLS |
| `src/lib/types.ts` | Modify | Add `HouseholdMember`, `MemberReaction`, `MemberIngredientPreference` types |
| `src/app/api/household/members/route.ts` | Create | GET + POST household members |
| `src/app/api/household/members/[id]/route.ts` | Create | PATCH + DELETE a member |
| `src/app/api/household/members/[id]/link/route.ts` | Create | POST to send account-link invite |
| `src/app/api/household/preferences/route.ts` | Create | GET + POST + DELETE ingredient preferences |
| `src/app/api/household/reactions/route.ts` | Create | POST batch reactions |
| `src/app/api/household/reactions/[recipeId]/route.ts` | Create | GET reactions for a recipe |
| `src/app/(app)/household/page.tsx` | Create | Server component — Household tab wrapper |
| `src/app/(app)/household/household-client.tsx` | Create | Client — member list + add modal |
| `src/app/(app)/household/[id]/page.tsx` | Create | Server component — member detail wrapper |
| `src/app/(app)/household/[id]/member-detail-client.tsx` | Create | Client — reactions history + preferences |
| `src/app/(app)/recipes/[id]/recipe-interactions.tsx` | Modify | Add household reaction section below existing rating form |
| `src/app/api/recipes/suggestions/route.ts` | Modify | Add household scoring pass after existing cuisine/dish-type scoring |
| `src/app/(app)/discover/discover-client.tsx` | Modify | Render household badges on suggestion recipe cards |
| `src/app/(app)/recipes/[id]/page.tsx` | Modify | Pass recipe ingredients + household data to `RecipeInteractions` |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260509_household.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260509_household.sql

-- Extend ingredient_categories with parent for inference grouping
ALTER TABLE ingredient_categories
  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES ingredient_categories(id);

-- Age group and strictness enums
DO $$ BEGIN
  CREATE TYPE member_age_group AS ENUM ('baby', 'child', 'teen', 'adult');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_filter_strictness AS ENUM ('allergy', 'dislike', 'soft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ingredient_sentiment AS ENUM ('dislike', 'avoid', 'love');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE preference_source AS ENUM ('reported', 'inferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Household members
CREATE TABLE IF NOT EXISTS household_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name     TEXT NOT NULL,
  avatar_emoji     TEXT NOT NULL DEFAULT '🧑',
  age_group        member_age_group NOT NULL DEFAULT 'adult',
  filter_strictness member_filter_strictness NOT NULL DEFAULT 'dislike',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member ingredient preferences
CREATE TABLE IF NOT EXISTS member_ingredient_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  ingredient_id   UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_text TEXT NOT NULL,
  sentiment       ingredient_sentiment NOT NULL,
  source          preference_source NOT NULL DEFAULT 'reported',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member meal reactions
CREATE TABLE IF NOT EXISTS member_meal_reactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  recipe_id    UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 3),
  notes        TEXT,
  reported_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cooked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, recipe_id, cooked_at)
);

-- RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_ingredient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_meal_reactions ENABLE ROW LEVEL SECURITY;

-- household_members: owner sees/manages their own members; linked user sees their own entry
CREATE POLICY "owner manages members"
  ON household_members FOR ALL
  USING (owner_user_id = auth.uid());

CREATE POLICY "linked user reads own entry"
  ON household_members FOR SELECT
  USING (linked_user_id = auth.uid());

-- member_ingredient_preferences: owner of the member can do all
CREATE POLICY "owner manages preferences"
  ON member_ingredient_preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.id = member_id AND hm.owner_user_id = auth.uid()
    )
  );

-- member_meal_reactions: reported_by user can insert; owner can do all
CREATE POLICY "owner manages reactions"
  ON member_meal_reactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.id = member_id AND hm.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "reporter inserts own reactions"
  ON member_meal_reactions FOR INSERT
  WITH CHECK (reported_by = auth.uid());
```

- [ ] **Step 2: Apply the migration**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx supabase db push
```

Expected: migration applies with no errors. If `ingredients` table doesn't exist, change the FK on `member_ingredient_preferences.ingredient_id` to reference `recipes` or remove the FK — the `ingredient_text` column is the canonical fallback anyway.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260509_household.sql
git commit -m "feat: add household_members, member_ingredient_preferences, member_meal_reactions tables"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add types at the bottom of `src/lib/types.ts`**

```typescript
// ============================================================
// Household
// ============================================================

export type MemberAgeGroup = 'baby' | 'child' | 'teen' | 'adult';
export type MemberFilterStrictness = 'allergy' | 'dislike' | 'soft';
export type IngredientSentiment = 'dislike' | 'avoid' | 'love';
export type PreferenceSource = 'reported' | 'inferred';

export interface HouseholdMember {
  id: string;
  owner_user_id: string;
  linked_user_id: string | null;
  display_name: string;
  avatar_emoji: string;
  age_group: MemberAgeGroup;
  filter_strictness: MemberFilterStrictness;
  created_at: string;
}

export interface MemberIngredientPreference {
  id: string;
  member_id: string;
  ingredient_id: string | null;
  ingredient_text: string;
  sentiment: IngredientSentiment;
  source: PreferenceSource;
  created_at: string;
}

export interface MemberReaction {
  id: string;
  member_id: string;
  recipe_id: string;
  rating: 1 | 2 | 3;
  notes: string | null;
  reported_by: string;
  cooked_at: string;
}

export interface HouseholdMemberWithPreferences extends HouseholdMember {
  preferences: MemberIngredientPreference[];
  reactions: MemberReaction[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add HouseholdMember, MemberReaction, MemberIngredientPreference types"
```

---

## Task 3: Household Members API

**Files:**
- Create: `src/app/api/household/members/route.ts`
- Create: `src/app/api/household/members/[id]/route.ts`
- Create: `src/app/api/household/members/[id]/link/route.ts`

- [ ] **Step 1: Create `src/app/api/household/members/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/household/members — list current user's household members
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("household_members")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

// POST /api/household/members — create a new household member
// Body: { display_name, avatar_emoji?, age_group?, filter_strictness? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { display_name, avatar_emoji = "🧑", age_group = "adult", filter_strictness = "dislike" } = body;

  if (!display_name?.trim()) {
    return NextResponse.json({ error: "display_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("household_members")
    .insert({ owner_user_id: user.id, display_name: display_name.trim(), avatar_emoji, age_group, filter_strictness })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/household/members/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// PATCH /api/household/members/[id]
// Body: { display_name?, avatar_emoji?, age_group?, filter_strictness? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["display_name", "avatar_emoji", "age_group", "filter_strictness"];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from("household_members")
    .update(updates)
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ member: data });
}

// DELETE /api/household/members/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `src/app/api/household/members/[id]/link/route.ts`**

This sends a magic-link email to the provided address. When they sign in, if their `auth.users.id` matches the invite, we update `linked_user_id`. For now, implement as: record the invite email on the member row and let the user manually confirm linking after the invitee creates their account.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST /api/household/members/[id]/link
// Body: { email } — sends an invite; when they sign up, they can link via PATCH
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Check the member belongs to this owner
  const { data: member } = await supabase
    .from("household_members")
    .select("id")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if a user with this email already exists and link immediately
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", (await supabase.auth.admin?.getUserByEmail?.(email))?.data?.user?.id ?? "")
    .maybeSingle();

  if (existingUser) {
    await supabase
      .from("household_members")
      .update({ linked_user_id: existingUser.id })
      .eq("id", id);
    return NextResponse.json({ linked: true });
  }

  // Otherwise just return instructions — a full invite flow needs Supabase Auth email templates
  return NextResponse.json({
    linked: false,
    message: "Ask them to create an account, then link manually from their profile.",
  });
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/household/
git commit -m "feat: add household members CRUD and link API routes"
```

---

## Task 4: Preferences & Reactions APIs

**Files:**
- Create: `src/app/api/household/preferences/route.ts`
- Create: `src/app/api/household/reactions/route.ts`
- Create: `src/app/api/household/reactions/[recipeId]/route.ts`

- [ ] **Step 1: Create `src/app/api/household/preferences/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/household/preferences?member_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("member_id");
  if (!memberId) return NextResponse.json({ error: "member_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("member_ingredient_preferences")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}

// POST /api/household/preferences
// Body: { member_id, ingredient_text, sentiment, ingredient_id? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { member_id, ingredient_text, sentiment, ingredient_id } = body;

  if (!member_id || !ingredient_text || !sentiment) {
    return NextResponse.json({ error: "member_id, ingredient_text, sentiment required" }, { status: 400 });
  }

  // Verify ownership
  const { data: member } = await supabase
    .from("household_members")
    .select("id, filter_strictness")
    .eq("id", member_id)
    .eq("owner_user_id", user.id)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("member_ingredient_preferences")
    .insert({ member_id, ingredient_text: ingredient_text.trim(), sentiment, ingredient_id: ingredient_id ?? null, source: "reported" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Run inference check after insert (fire-and-forget)
  runInferenceCheck(supabase, member_id).catch(() => {});

  return NextResponse.json({ preference: data }, { status: 201 });
}

// DELETE /api/household/preferences?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefId = req.nextUrl.searchParams.get("id");
  if (!prefId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("member_ingredient_preferences")
    .delete()
    .eq("id", prefId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Lightweight inference: if member has 3+ dislikes/avoids in the same parent category,
// insert an inferred category-level preference
async function runInferenceCheck(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  memberId: string
) {
  // Get all reported dislikes/avoids for this member with ingredient_id set
  const { data: prefs } = await supabase
    .from("member_ingredient_preferences")
    .select("ingredient_id, sentiment")
    .eq("member_id", memberId)
    .in("sentiment", ["dislike", "avoid"])
    .eq("source", "reported")
    .not("ingredient_id", "is", null);

  if (!prefs?.length) return;

  const ingredientIds = prefs.map((p) => p.ingredient_id!);

  // Look up their parent categories
  const { data: cats } = await supabase
    .from("ingredient_categories")
    .select("id, name, parent_category_id")
    .in("id", ingredientIds);

  if (!cats) return;

  // Count by parent
  const parentCounts: Record<string, { count: number; name: string }> = {};
  for (const cat of cats) {
    if (!cat.parent_category_id) continue;
    if (!parentCounts[cat.parent_category_id]) {
      parentCounts[cat.parent_category_id] = { count: 0, name: "" };
    }
    parentCounts[cat.parent_category_id].count++;
  }

  for (const [parentId, { count }] of Object.entries(parentCounts)) {
    if (count < 3) continue;

    // Check no inferred preference for this category already exists
    const { data: existing } = await supabase
      .from("member_ingredient_preferences")
      .select("id")
      .eq("member_id", memberId)
      .eq("ingredient_id", parentId)
      .eq("source", "inferred")
      .maybeSingle();

    if (existing) continue;

    // Get parent category name
    const { data: parentCat } = await supabase
      .from("ingredient_categories")
      .select("name")
      .eq("id", parentId)
      .single();

    if (!parentCat) continue;

    await supabase.from("member_ingredient_preferences").insert({
      member_id: memberId,
      ingredient_text: parentCat.name,
      ingredient_id: parentId,
      sentiment: "dislike",
      source: "inferred",
    });
  }
}
```

- [ ] **Step 2: Create `src/app/api/household/reactions/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST /api/household/reactions
// Body: { recipe_id, reactions: Array<{ member_id, rating, notes?, disliked_ingredients?: string[] }> }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { recipe_id, reactions } = body as {
    recipe_id: string;
    reactions: Array<{
      member_id: string;
      rating: 1 | 2 | 3;
      notes?: string;
      disliked_ingredients?: string[];
    }>;
  };

  if (!recipe_id || !Array.isArray(reactions)) {
    return NextResponse.json({ error: "recipe_id and reactions array required" }, { status: 400 });
  }

  // Verify all member_ids belong to this user
  const memberIds = reactions.map((r) => r.member_id);
  const { data: ownedMembers } = await supabase
    .from("household_members")
    .select("id")
    .eq("owner_user_id", user.id)
    .in("id", memberIds);

  const ownedIds = new Set((ownedMembers ?? []).map((m) => m.id));
  const validReactions = reactions.filter((r) => ownedIds.has(r.member_id));

  if (!validReactions.length) return NextResponse.json({ saved: 0 });

  // Insert reactions
  const inserts = validReactions.map(({ member_id, rating, notes }) => ({
    member_id,
    recipe_id,
    rating,
    notes: notes ?? null,
    reported_by: user.id,
  }));

  const { data: saved, error } = await supabase
    .from("member_meal_reactions")
    .upsert(inserts, { onConflict: "member_id,recipe_id,cooked_at" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save any newly reported ingredient dislikes
  const preferenceInserts = validReactions.flatMap(({ member_id, disliked_ingredients }) =>
    (disliked_ingredients ?? []).map((ingredient_text) => ({
      member_id,
      ingredient_text,
      sentiment: "dislike" as const,
      source: "reported" as const,
    }))
  );

  if (preferenceInserts.length) {
    await supabase.from("member_ingredient_preferences").upsert(preferenceInserts, {
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({ saved: saved?.length ?? 0 });
}
```

- [ ] **Step 3: Create `src/app/api/household/reactions/[recipeId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/household/reactions/[recipeId]
// Returns reactions for all household members for this recipe
export async function GET(_req: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipeId } = await params;

  const { data, error } = await supabase
    .from("member_meal_reactions")
    .select("*, member:household_members!inner(id, display_name, avatar_emoji, owner_user_id)")
    .eq("recipe_id", recipeId)
    .eq("member.owner_user_id", user.id)
    .order("cooked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reactions: data });
}
```

- [ ] **Step 4: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/household/preferences/ src/app/api/household/reactions/
git commit -m "feat: add household preferences and reactions API routes"
```

---

## Task 5: Household Management UI

**Files:**
- Create: `src/app/(app)/household/page.tsx`
- Create: `src/app/(app)/household/household-client.tsx`
- Create: `src/app/(app)/household/[id]/page.tsx`
- Create: `src/app/(app)/household/[id]/member-detail-client.tsx`

- [ ] **Step 1: Create `src/app/(app)/household/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HouseholdClient } from "./household-client";

export default async function HouseholdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });

  return <HouseholdClient initialMembers={members ?? []} />;
}
```

- [ ] **Step 2: Create `src/app/(app)/household/household-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { HouseholdMember, MemberAgeGroup, MemberFilterStrictness } from "@/lib/types";

const AGE_LABELS: Record<MemberAgeGroup, string> = {
  baby: "Baby",
  child: "Child",
  teen: "Teen",
  adult: "Adult",
};

const STRICTNESS_LABELS: Record<MemberFilterStrictness, { label: string; color: string }> = {
  allergy: { label: "Allergy", color: "#DC2626" },
  dislike: { label: "Dislikes", color: "#C8A030" },
  soft:    { label: "Soft pref", color: "#828E6F" },
};

const EMOJI_OPTIONS = ["🧑", "👶", "🧒", "👦", "👧", "🧑‍🍼", "👨", "👩", "🧓", "🐱", "🐶"];

export function HouseholdClient({ initialMembers }: { initialMembers: HouseholdMember[] }) {
  const [members, setMembers] = useState<HouseholdMember[]>(initialMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧑");
  const [ageGroup, setAgeGroup] = useState<MemberAgeGroup>("adult");
  const [strictness, setStrictness] = useState<MemberFilterStrictness>("dislike");
  const [saving, setSaving] = useState(false);

  async function addMember() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/household/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name, avatar_emoji: emoji, age_group: ageGroup, filter_strictness: strictness }),
    });
    const json = await res.json();
    if (json.member) {
      setMembers((prev) => [...prev, json.member]);
      setShowAdd(false);
      setName("");
      setEmoji("🧑");
      setAgeGroup("adult");
      setStrictness("dislike");
    }
    setSaving(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/household/members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE" }}>Household</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#C8522A", color: "#fff" }}
        >
          + Add member
        </button>
      </div>

      {members.length === 0 && !showAdd && (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <p className="text-3xl mb-2">🏠</p>
          <p className="font-medium mb-1" style={{ color: "#EFE3CE" }}>No household members yet</p>
          <p className="text-sm" style={{ color: "#6B4E36" }}>Add family members to track everyone's preferences and tailor meal suggestions.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {members.map((m) => {
          const s = STRICTNESS_LABELS[m.filter_strictness];
          return (
            <div key={m.id} className="rounded-2xl border p-4 flex items-center gap-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
              <span className="text-3xl">{m.avatar_emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "#EFE3CE" }}>{m.display_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "#6B4E36" }}>{AGE_LABELS[m.age_group]}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, background: "#1C1209", border: `1px solid ${s.color}` }}>{s.label}</span>
                  {m.linked_user_id && <span className="text-xs" style={{ color: "#828E6F" }}>🔗 Linked</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/household/${m.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#2A1808", color: "#C8A030" }}>
                  View
                </Link>
                <button onClick={() => deleteMember(m.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#2A1808", color: "#DC2626" }}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <h2 className="font-semibold" style={{ color: "#EFE3CE" }}>Add household member</h2>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emma"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="text-2xl rounded-lg p-1.5 transition-all"
                  style={{ background: emoji === e ? "#2A1808" : "transparent", border: `1px solid ${emoji === e ? "#C8522A" : "#3A2416"}` }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Age group</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as MemberAgeGroup)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }}>
                {(Object.keys(AGE_LABELS) as MemberAgeGroup[]).map((k) => (
                  <option key={k} value={k}>{AGE_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Strictness</label>
              <select value={strictness} onChange={(e) => setStrictness(e.target.value as MemberFilterStrictness)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }}>
                {(Object.keys(STRICTNESS_LABELS) as MemberFilterStrictness[]).map((k) => (
                  <option key={k} value={k}>{STRICTNESS_LABELS[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: "#2A1808", color: "#8A6A4A" }}>Cancel</button>
            <button onClick={addMember} disabled={saving || !name.trim()} className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#C8522A", color: "#fff" }}>
              {saving ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/household/[id]/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { MemberDetailClient } from "./member-detail-client";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("household_members")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (!member) notFound();

  const [{ data: preferences }, { data: reactions }] = await Promise.all([
    supabase.from("member_ingredient_preferences").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("member_meal_reactions")
      .select("*, recipe:recipes(id, title, image_url)")
      .eq("member_id", id)
      .order("cooked_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <MemberDetailClient
      member={member}
      initialPreferences={preferences ?? []}
      initialReactions={reactions ?? []}
    />
  );
}
```

- [ ] **Step 4: Create `src/app/(app)/household/[id]/member-detail-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { HouseholdMember, MemberIngredientPreference, MemberFilterStrictness, IngredientSentiment } from "@/lib/types";

type Reaction = {
  id: string;
  rating: 1 | 2 | 3;
  notes: string | null;
  cooked_at: string;
  recipe: { id: string; title: string; image_url: string | null } | null;
};

const STRICTNESS_OPTIONS: { value: MemberFilterStrictness; label: string }[] = [
  { value: "allergy", label: "Allergy (hard filter)" },
  { value: "dislike", label: "Dislikes (−4 per match)" },
  { value: "soft",    label: "Soft preference (−1 per match)" },
];

const SENTIMENT_EMOJI: Record<IngredientSentiment, string> = {
  dislike: "👎",
  avoid:   "🚫",
  love:    "❤️",
};

const RATING_EMOJI: Record<number, string> = { 1: "😞", 2: "😐", 3: "😋" };

export function MemberDetailClient({
  member,
  initialPreferences,
  initialReactions,
}: {
  member: HouseholdMember;
  initialPreferences: MemberIngredientPreference[];
  initialReactions: Reaction[];
}) {
  const [strictness, setStrictness] = useState<MemberFilterStrictness>(member.filter_strictness);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [newIngredient, setNewIngredient] = useState("");
  const [newSentiment, setNewSentiment] = useState<IngredientSentiment>("dislike");
  const [addingPref, setAddingPref] = useState(false);

  async function updateStrictness(value: MemberFilterStrictness) {
    setStrictness(value);
    await fetch(`/api/household/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter_strictness: value }),
    });
  }

  async function addPreference() {
    if (!newIngredient.trim()) return;
    setAddingPref(true);
    const res = await fetch("/api/household/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: member.id, ingredient_text: newIngredient.trim(), sentiment: newSentiment }),
    });
    const json = await res.json();
    if (json.preference) {
      setPreferences((prev) => [json.preference, ...prev]);
      setNewIngredient("");
    }
    setAddingPref(false);
  }

  async function removePref(id: string) {
    await fetch(`/api/household/preferences?id=${id}`, { method: "DELETE" });
    setPreferences((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/household" className="text-sm" style={{ color: "#6B4E36" }}>← Household</Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl">{member.avatar_emoji}</span>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE" }}>{member.display_name}</h1>
          {member.linked_user_id && <p className="text-sm" style={{ color: "#828E6F" }}>🔗 Account linked</p>}
        </div>
      </div>

      {/* Strictness */}
      <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
        <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>Filter strictness</p>
        <div className="flex flex-col gap-2">
          {STRICTNESS_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => updateStrictness(value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left"
              style={{ background: strictness === value ? "#2A1808" : "transparent", border: `1px solid ${strictness === value ? "#C8522A" : "#3A2416"}`, color: strictness === value ? "#C8522A" : "#8A6A4A" }}>
              <span className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: strictness === value ? "#C8522A" : "#3A2416", background: strictness === value ? "#C8522A" : "transparent" }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient preferences */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: "#EFE3CE" }}>Ingredient preferences</h2>

        <div className="flex gap-2">
          <input value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="e.g. broccoli" onKeyDown={(e) => e.key === "Enter" && addPreference()}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }} />
          <select value={newSentiment} onChange={(e) => setNewSentiment(e.target.value as IngredientSentiment)}
            className="px-2 py-2 rounded-xl text-sm"
            style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }}>
            <option value="dislike">👎 Dislike</option>
            <option value="avoid">🚫 Avoid</option>
            <option value="love">❤️ Love</option>
          </select>
          <button onClick={addPreference} disabled={addingPref || !newIngredient.trim()}
            className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "#C8522A", color: "#fff" }}>
            Add
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {preferences.length === 0 && (
            <p className="text-sm py-4 text-center" style={{ color: "#6B4E36" }}>No preferences recorded yet.</p>
          )}
          {preferences.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#1C1209", border: "1px solid #3A2416" }}>
              <span className="text-sm">{SENTIMENT_EMOJI[p.sentiment]}</span>
              <span className="text-sm flex-1" style={{ color: "#EFE3CE" }}>{p.ingredient_text}</span>
              {p.source === "inferred" && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#2A1808", color: "#C8A030" }}>auto</span>
              )}
              <button onClick={() => removePref(p.id)} className="text-xs" style={{ color: "#6B4E36" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reactions */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: "#EFE3CE" }}>Recent meals</h2>
        {initialReactions.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "#6B4E36" }}>No meal reactions yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {initialReactions.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#1C1209", border: "1px solid #3A2416" }}>
              <span className="text-xl">{RATING_EMOJI[r.rating]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#EFE3CE" }}>{r.recipe?.title ?? "Unknown recipe"}</p>
                {r.notes && <p className="text-xs" style={{ color: "#6B4E36" }}>{r.notes}</p>}
              </div>
              <span className="text-xs" style={{ color: "#6B4E36" }}>{new Date(r.cooked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/household/
git commit -m "feat: add household management UI (member list + detail)"
```

---

## Task 6: Per-Member Reaction Section in Rating Form

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-interactions.tsx`
- Modify: `src/app/(app)/recipes/[id]/page.tsx`

- [ ] **Step 1: Update `page.tsx` to fetch household data and pass to `RecipeInteractions`**

Read the current page.tsx first to find the RecipeInteractions usage, then add these two fetches alongside the existing ones:

```tsx
// Add these fetches inside the page component (after getting user):

const [{ data: members }, { data: existingReactions }] = await Promise.all([
  supabase
    .from("household_members")
    .select("id, display_name, avatar_emoji, age_group, filter_strictness")
    .eq("owner_user_id", user.id),
  supabase
    .from("member_meal_reactions")
    .select("member_id, rating, notes")
    .eq("recipe_id", recipeId)
    .in("member_id", (members ?? []).map((m: { id: string }) => m.id))
    .order("cooked_at", { ascending: false })
    .limit(50),
]);
```

Then pass these as props to `RecipeInteractions`:
```tsx
<RecipeInteractions
  // ... existing props ...
  householdMembers={members ?? []}
  existingReactions={existingReactions ?? []}
  recipeIngredients={recipe.ingredients ?? []}  // string[] of ingredient names
/>
```

- [ ] **Step 2: Extend the `RecipeInteractions` component props and state**

Add at the top of `recipe-interactions.tsx`, after the existing type definitions:

```tsx
type HouseholdMemberSlim = {
  id: string;
  display_name: string;
  avatar_emoji: string;
  age_group: string;
};

type MemberReactionDraft = {
  member_id: string;
  rating: 1 | 2 | 3 | null;
  notes: string;
  disliked_ingredients: string[];
  wasntHome: boolean;
};
```

Add new props to `RecipeInteractions`:
```tsx
householdMembers?: HouseholdMemberSlim[];
existingReactions?: Array<{ member_id: string; rating: number; notes: string | null }>;
recipeIngredients?: string[];
```

Add state inside the component:
```tsx
const [memberReactions, setMemberReactions] = useState<MemberReactionDraft[]>(
  (householdMembers ?? []).map((m) => {
    const existing = (existingReactions ?? []).find((r) => r.member_id === m.id);
    return {
      member_id: m.id,
      rating: (existing?.rating as 1 | 2 | 3 | null) ?? null,
      notes: existing?.notes ?? "",
      disliked_ingredients: [],
      wasntHome: false,
    };
  })
);
```

- [ ] **Step 3: Add household reaction section to the rating form JSX**

Add this block inside the rating form div, after the "Submit rating" button:

```tsx
{(householdMembers ?? []).length > 0 && (
  <div className="pt-4 border-t space-y-4" style={{ borderColor: "#3A2416" }}>
    <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>How did everyone react?</p>
    {(householdMembers ?? []).map((member, idx) => {
      const draft = memberReactions[idx];
      if (!draft) return null;

      // Find recipe ingredients that this member has disliked before (chips)
      // For now we show all recipe ingredients as potential chips
      const ingredientChips = (recipeIngredients ?? []).slice(0, 6);

      return (
        <div key={member.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: "#3A2416", background: "#161009", opacity: draft.wasntHome ? 0.5 : 1 }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{member.avatar_emoji}</span>
            <span className="text-sm font-medium" style={{ color: "#EFE3CE" }}>{member.display_name}</span>
            <button
              type="button"
              onClick={() => setMemberReactions((prev) => prev.map((r, i) => i === idx ? { ...r, wasntHome: !r.wasntHome } : r))}
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: draft.wasntHome ? "#2A1808" : "transparent", border: "1px solid #3A2416", color: "#6B4E36" }}>
              {draft.wasntHome ? "Wasn't home ✓" : "Wasn't home"}
            </button>
          </div>

          {!draft.wasntHome && (
            <>
              <div className="flex gap-3">
                {([1, 2, 3] as const).map((v) => (
                  <button key={v} type="button"
                    onClick={() => setMemberReactions((prev) => prev.map((r, i) => i === idx ? { ...r, rating: v } : r))}
                    className="flex-1 py-2 rounded-xl text-xl transition-all"
                    style={{ background: draft.rating === v ? "#2A1808" : "transparent", border: `1px solid ${draft.rating === v ? "#C8522A" : "#3A2416"}` }}>
                    {["😞", "😐", "😋"][v - 1]}
                  </button>
                ))}
              </div>

              {ingredientChips.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "#6B4E36" }}>Didn't eat?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ingredientChips.map((ing) => {
                      const selected = draft.disliked_ingredients.includes(ing);
                      return (
                        <button key={ing} type="button"
                          onClick={() => setMemberReactions((prev) => prev.map((r, i) =>
                            i === idx ? {
                              ...r,
                              disliked_ingredients: selected
                                ? r.disliked_ingredients.filter((x) => x !== ing)
                                : [...r.disliked_ingredients, ing],
                            } : r
                          ))}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: selected ? "#2A1808" : "#1C1209", border: `1px solid ${selected ? "#C8522A" : "#3A2416"}`, color: selected ? "#C8522A" : "#8A6A4A" }}>
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <input
                value={draft.notes}
                onChange={(e) => setMemberReactions((prev) => prev.map((r, i) => i === idx ? { ...r, notes: e.target.value } : r))}
                placeholder="Add a note…"
                className="w-full px-3 py-1.5 rounded-xl text-xs outline-none"
                style={{ background: "#1C1209", border: "1px solid #3A2416", color: "#EFE3CE" }} />
            </>
          )}
        </div>
      );
    })}
  </div>
)}
```

- [ ] **Step 4: Submit household reactions alongside the user's own rating**

Update `submitRating()` to also POST household reactions:

```tsx
async function submitRating() {
  setSubmittingRating(true);
  await fetch("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe_id: recipeId, ...rating }),
  });

  const reactionsToSave = memberReactions.filter((r) => !r.wasntHome && r.rating !== null);
  if (reactionsToSave.length > 0) {
    await fetch("/api/household/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipeId,
        reactions: reactionsToSave.map((r) => ({
          member_id: r.member_id,
          rating: r.rating,
          notes: r.notes || undefined,
          disliked_ingredients: r.disliked_ingredients,
        })),
      }),
    });
  }

  setRatingSubmitted(true);
  setShowRatingForm(false);
  setSubmittingRating(false);
}
```

- [ ] **Step 5: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/recipes/
git commit -m "feat: add per-member household reaction cards to rating form"
```

---

## Task 7: Household Scoring in Suggestions API

**Files:**
- Modify: `src/app/api/recipes/suggestions/route.ts`

- [ ] **Step 1: Add household data fetch at the top of the POST handler, after the user check**

Add this block after `const { data: { user } } = ...`:

```typescript
// Fetch household members and their preferences for scoring
const { data: householdMembers } = await supabase
  .from("household_members")
  .select("id, filter_strictness, age_group")
  .eq("owner_user_id", user.id);

type MemberPref = { ingredient_text: string; sentiment: string };
type MemberReactionRow = { recipe_id: string; rating: number };

let memberPrefs: Record<string, MemberPref[]> = {};
let memberReactionMap: Record<string, MemberReactionRow[]> = {};

if (householdMembers?.length) {
  const memberIds = householdMembers.map((m) => m.id);

  const [{ data: prefs }, { data: reactions }] = await Promise.all([
    supabase
      .from("member_ingredient_preferences")
      .select("member_id, ingredient_text, sentiment")
      .in("member_id", memberIds)
      .in("sentiment", ["dislike", "avoid"]),
    supabase
      .from("member_meal_reactions")
      .select("member_id, recipe_id, rating")
      .in("member_id", memberIds),
  ]);

  for (const p of prefs ?? []) {
    if (!memberPrefs[p.member_id]) memberPrefs[p.member_id] = [];
    memberPrefs[p.member_id].push({ ingredient_text: p.ingredient_text, sentiment: p.sentiment });
  }

  for (const r of reactions ?? []) {
    if (!memberReactionMap[r.member_id]) memberReactionMap[r.member_id] = [];
    memberReactionMap[r.member_id].push({ recipe_id: r.recipe_id, rating: r.rating });
  }
}
```

- [ ] **Step 2: Add the household scoring pass inside the `.map()` in step 5**

Replace the existing scoring `.map()` block with this extended version:

```typescript
const scored = candidates
  .filter((r) => !seenIdSet.has(r.id))
  .reduce<Array<{ _score: number; _hardFiltered: boolean } & typeof candidates[0]>>((acc, r) => {
    let score = 0;
    let hardFiltered = false;

    // Existing taste-profile scoring
    if (r.cuisine_type && topCuisines.includes(r.cuisine_type)) {
      score += (topCuisines.length - topCuisines.indexOf(r.cuisine_type)) * 3;
    }
    for (const t of r.dish_types ?? []) {
      if (topDishTypes.includes(t)) score += 2;
    }
    for (const t of r.dietary_tags ?? []) {
      if (topDietaryTags.includes(t)) score += 1;
    }

    // Household scoring pass
    for (const member of householdMembers ?? []) {
      const prefs = memberPrefs[member.id] ?? [];
      const reactions = memberReactionMap[member.id] ?? [];
      const recipeTitle = (r.title ?? "").toLowerCase();
      const recipeDesc = (r.description ?? "").toLowerCase();

      for (const pref of prefs) {
        const ingredientLower = pref.ingredient_text.toLowerCase();
        const matches = recipeTitle.includes(ingredientLower) || recipeDesc.includes(ingredientLower);
        if (!matches) continue;

        if (member.filter_strictness === "allergy") {
          hardFiltered = true;
          break;
        } else if (member.filter_strictness === "dislike") {
          score -= 4;
        } else {
          score -= 1;
        }
      }

      if (hardFiltered) break;

      for (const reaction of reactions) {
        if (reaction.recipe_id !== r.id) continue;
        if (reaction.rating === 3) score += 2;
        if (reaction.rating === 1) score -= 3;
      }
    }

    if (!hardFiltered) acc.push({ ...r, _score: score, _hardFiltered: false });
    return acc;
  }, [])
  .sort((a, b) => b._score - a._score);
```

- [ ] **Step 3: Update the final return to strip `_hardFiltered` alongside `_score`**

```typescript
const suggestions = [...top, ...rest.slice(0, 8)].map(({ _score: _, _hardFiltered: __, ...r }) => r);
```

- [ ] **Step 4: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipes/suggestions/route.ts
git commit -m "feat: add household preference scoring pass to suggestions API"
```

---

## Task 8: Recipe Card Badges and Family Fit Indicator

**Files:**
- Modify: `src/app/(app)/discover/discover-client.tsx`
- Modify: `src/app/api/recipes/suggestions/route.ts` (add badge metadata to response)

- [ ] **Step 1: Add badge computation to suggestions response**

In the household scoring pass (Task 7 Step 2), before `if (!hardFiltered) acc.push(...)`, compute badges:

```typescript
// Compute household badges for this recipe
const badges: string[] = [];

// Family favourite: avg member reaction >= 2.5 across >= 2 members
const recipeMemberRatings = (householdMembers ?? [])
  .map((m) => (memberReactionMap[m.id] ?? []).find((r) => r.recipe_id === r.recipe_id)?.rating)
  .filter((v): v is number => v !== undefined);

if (recipeMemberRatings.length >= 2) {
  const avg = recipeMemberRatings.reduce((a, b) => a + b, 0) / recipeMemberRatings.length;
  if (avg >= 2.5) badges.push("family_favourite");
}

// Baby-friendly: no baby-age member has a dislike match
const babyMembers = (householdMembers ?? []).filter((m) => m.age_group === "baby");
const babyConflict = babyMembers.some((m) =>
  (memberPrefs[m.id] ?? []).some((pref) =>
    (r.title ?? "").toLowerCase().includes(pref.ingredient_text.toLowerCase()) ||
    (r.description ?? "").toLowerCase().includes(pref.ingredient_text.toLowerCase())
  )
);
if (babyMembers.length > 0 && !babyConflict) badges.push("baby_friendly");

// Won't eat: members with dislike/allergy match
const wontEatMembers = (householdMembers ?? [])
  .filter((m) => m.filter_strictness !== "soft")
  .filter((m) =>
    (memberPrefs[m.id] ?? []).some((pref) =>
      (r.title ?? "").toLowerCase().includes(pref.ingredient_text.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(pref.ingredient_text.toLowerCase())
    )
  )
  .map((m) => m.id);

if (wontEatMembers.length > 0) badges.push(`wont_eat:${wontEatMembers.join(",")}`);
```

Also pass `householdMembers` in the API response for badge label lookup:
```typescript
return NextResponse.json({ suggestions, seedCount: seedRecipes.length, profile, householdMembers: householdMembers ?? [] });
```

And include `badges` on each recipe in the suggestions array by extending the scored object:
```typescript
if (!hardFiltered) acc.push({ ...r, _score: score, _hardFiltered: false, _badges: badges });
```
```typescript
const suggestions = [...top, ...rest.slice(0, 8)].map(({ _score: _, _hardFiltered: __, _badges, ...r }) => ({ ...r, badges: _badges }));
```

- [ ] **Step 2: Render badges on recipe cards in `discover-client.tsx`**

Find where recipe cards are rendered in the SuggestionPanel or discover feed. Add below the recipe title:

```tsx
{recipe.badges?.includes("family_favourite") && (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mr-1"
    style={{ background: "#2A1808", color: "#C8A030" }}>⭐ Family favourite</span>
)}
{recipe.badges?.includes("baby_friendly") && (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mr-1"
    style={{ background: "#1A2010", color: "#828E6F" }}>👶 Baby-friendly</span>
)}
{recipe.badges?.some((b: string) => b.startsWith("wont_eat:")) && (() => {
  const memberIds = recipe.badges.find((b: string) => b.startsWith("wont_eat:"))!.replace("wont_eat:", "").split(",");
  return memberIds.map((mid: string) => {
    const member = householdMembers?.find((m: { id: string; display_name: string }) => m.id === mid);
    return member ? (
      <span key={mid} className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mr-1"
        style={{ background: "#2A1808", color: "#DC2626" }}>⚠️ {member.display_name} won't eat this</span>
    ) : null;
  });
})()}
```

- [ ] **Step 3: Add family fit indicator to recipe detail page**

In `src/app/(app)/recipes/[id]/page.tsx`, after fetching household members (added in Task 6), compute fit status and pass to a new `FamilyFitBar` component. Create `src/components/family-fit-bar.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { HouseholdMember, MemberIngredientPreference } from "@/lib/types";

type FitStatus = "green" | "yellow" | "red";

function getMemberFit(
  member: HouseholdMember,
  prefs: MemberIngredientPreference[],
  recipeText: string
): { status: FitStatus; flaggedIngredients: string[] } {
  const lowerText = recipeText.toLowerCase();
  const flagged = prefs
    .filter((p) => lowerText.includes(p.ingredient_text.toLowerCase()))
    .map((p) => p.ingredient_text);

  if (flagged.length > 0) return { status: "red", flaggedIngredients: flagged };
  return { status: "green", flaggedIngredients: [] };
}

const FIT_COLORS: Record<FitStatus, string> = {
  green: "#828E6F",
  yellow: "#C8A030",
  red: "#DC2626",
};

export function FamilyFitBar({
  members,
  memberPrefs,
  recipeTitle,
  recipeDescription,
}: {
  members: HouseholdMember[];
  memberPrefs: Record<string, MemberIngredientPreference[]>;
  recipeTitle: string;
  recipeDescription: string;
}) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const recipeText = `${recipeTitle} ${recipeDescription}`;

  if (members.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
      <p className="text-sm font-semibold mb-3" style={{ color: "#EFE3CE" }}>Family fit</p>
      <div className="flex gap-3 flex-wrap">
        {members.map((m) => {
          const { status, flaggedIngredients } = getMemberFit(m, memberPrefs[m.id] ?? [], recipeText);
          const isOpen = openMemberId === m.id;
          return (
            <div key={m.id} className="relative">
              <button
                onClick={() => setOpenMemberId(isOpen ? null : m.id)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{m.avatar_emoji}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: FIT_COLORS[status] }} />
                <span className="text-xs" style={{ color: "#8A6A4A" }}>{m.display_name}</span>
              </button>
              {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 rounded-xl border p-3 min-w-36 shadow-lg"
                  style={{ background: "#1C1209", borderColor: "#3A2416" }}>
                  {flaggedIngredients.length === 0 ? (
                    <p className="text-xs" style={{ color: "#828E6F" }}>No conflicts ✓</p>
                  ) : (
                    <>
                      <p className="text-xs font-medium mb-1" style={{ color: "#DC2626" }}>Conflicts:</p>
                      {flaggedIngredients.map((ing) => (
                        <p key={ing} className="text-xs" style={{ color: "#EFE3CE" }}>• {ing}</p>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Then use `FamilyFitBar` in the recipe detail page after the existing recipe header section.

- [ ] **Step 4: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/discover/ src/components/family-fit-bar.tsx src/app/api/recipes/suggestions/route.ts src/app/(app)/recipes/
git commit -m "feat: add household badges on suggestion cards and family fit indicator on recipe detail"
```

---

## Task 9: Navigation Link to Household Page

**Files:**
- Modify: `src/app/(app)/profile/page.tsx` (or the nav component)

- [ ] **Step 1: Add Household link in profile page**

Read `src/app/(app)/profile/page.tsx`, find where settings/tabs are rendered, and add:

```tsx
<Link href="/household"
  className="flex items-center gap-3 px-4 py-3 rounded-xl"
  style={{ background: "#1C1209", border: "1px solid #3A2416" }}>
  <span className="text-xl">🏠</span>
  <div>
    <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>Household</p>
    <p className="text-xs" style={{ color: "#6B4E36" }}>Manage family members & preferences</p>
  </div>
  <span className="ml-auto" style={{ color: "#6B4E36" }}>›</span>
</Link>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/profile/
git commit -m "feat: add Household link to profile page"
```

---

## Verification Checklist

- [ ] Create a household member with `allergy` strictness, add "broccoli" as a dislike → fetch `/api/recipes/suggestions` and verify no recipe with "broccoli" in title/description appears
- [ ] Open a recipe detail with household members present → confirm member reaction cards appear below the rating form
- [ ] Submit a reaction with a disliked ingredient chip selected → check `member_ingredient_preferences` in Supabase has the new row with `source: reported`
- [ ] Add 3 different ingredients that share a parent category → check `member_ingredient_preferences` has a new row with `source: inferred`
- [ ] Cook a recipe 2+ times for a member with rating 3 → confirm "⭐ Family favourite" badge on the suggestion card
- [ ] Open recipe detail → confirm `FamilyFitBar` shows red avatar for member with disliked ingredient in recipe, green for members with no conflicts
- [ ] Navigate to `/household` from profile page → confirm member list, add member, view detail all work
