# Baby & Family Hub — Design Spec
**Date:** 2026-05-09
**Project:** What's Cooking
**Status:** Approved for implementation planning

---

## Overview

A "Family" section targeting young families with babies and toddlers. Baby/child members are first-class household profile entries with milestone-based stage tracking (not age-gated). The feature is woven through the existing app — planner, pantry, shopping list, recipe browser — rather than isolated in a silo. Entry point is a dedicated "Family" nav item.

**Core insight:** The milestone-based member profile is the data primitive that makes every downstream feature (planner baby track, pantry safety flags, shopping list tagging, contextual guides) actually smart rather than just filtered.

---

## Target Audience

Young families with babies (4 months–3 years) and toddlers. Users who already have a kitchen group / shared household on the platform are the primary adoption path — the baby profile slots into the existing group membership model.

---

## Data Model

### New table: `household_members`

Represents a person (baby, toddler, child) within a kitchen group.

```sql
household_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_group_id uuid NOT NULL REFERENCES kitchen_groups(id) ON DELETE CASCADE,
  name            text NOT NULL,
  member_type     text NOT NULL CHECK (member_type IN ('baby', 'toddler', 'child', 'adult')),
  date_of_birth   date,                          -- optional, used to suggest current stage
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
)
```

RLS: readable by all members of the same `kitchen_group_id`, writable by group members.

### New table: `member_milestones`

Parent-confirmed readiness milestones per member. Milestone order is advisory — parents confirm based on their child's readiness, not age.

```sql
member_milestones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  milestone_key text NOT NULL CHECK (milestone_key IN (
    'started_solids',    -- purées, single-ingredient only
    'handles_soft_lumps', -- mashed textures, soft combinations
    'finger_foods',       -- soft self-fed pieces, BLW-compatible
    'family_table'        -- adapted versions of family meals
  )),
  confirmed_at  timestamptz DEFAULT now(),
  confirmed_by  uuid NOT NULL REFERENCES auth.users(id)
)
```

### New table: `member_allergens`

Tracks allergen introduction status per member.

```sql
member_allergens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  allergen_key  text NOT NULL CHECK (allergen_key IN (
    'egg', 'dairy', 'gluten', 'peanut', 'tree_nut',
    'soy', 'fish', 'shellfish'
  )),
  introduced_at timestamptz DEFAULT now(),
  introduced_by uuid NOT NULL REFERENCES auth.users(id)
)
```

### Extended: `recipes` table

Add columns to existing recipe rows:

```sql
ALTER TABLE recipes ADD COLUMN baby_stages text[] DEFAULT '{}';
-- values: 'started_solids' | 'handles_soft_lumps' | 'finger_foods' | 'family_table'

ALTER TABLE recipes ADD COLUMN allergen_flags text[] DEFAULT '{}';
-- values: 'egg' | 'dairy' | 'gluten' | 'peanut' | 'tree_nut' | 'soy' | 'fish' | 'shellfish' | 'honey'

ALTER TABLE recipes ADD COLUMN has_baby_variant boolean DEFAULT false;
ALTER TABLE recipes ADD COLUMN baby_variant_recipe_id uuid REFERENCES recipes(id);
```

### Extended: shopping list tables

Both `personal_shopping_items` and `group_shopping_items`:

```sql
ALTER TABLE personal_shopping_items ADD COLUMN for_member_id uuid REFERENCES household_members(id);
ALTER TABLE group_shopping_items ADD COLUMN for_member_id uuid REFERENCES household_members(id);
```

Null = adult/family item. Non-null = baby/child item, rendered with 🍼 tag.

### Extended: `user_preferences`

```sql
ALTER TABLE user_preferences ADD COLUMN baby_track_visible boolean DEFAULT false;
-- persists the "Show baby track" toggle state in the meal planner
```

---

## Routes

```
/family                    → Family Hub landing page
/family/members            → Manage household member profiles + milestones + allergens
/family/recipes            → Baby & family recipe browser
/family/guides             → Static cornerstone guides + contextual AI snippets
/family/planner            → Redirect to /plans with baby track pre-activated
```

"Family" is added to the main nav, always visible.

---

## Feature: Family Hub (`/family`)

Landing page with 4 cards:

1. **Member profiles card** — Avatar + name + current milestone stage per baby/child member. "Add member" CTA if none exist. Tapping a member navigates to `/family/members`.

2. **Today's baby track card** — Pulls from the active meal plan. Shows today's suggested baby meal alongside the family meal. Quick-confirm or swap button. Empty state if no plan exists for today.

3. **Recipes card** — "Recipes for [name] right now" — filtered to current confirmed milestones of the first/selected member. Rotates daily suggestions (3 recipe cards).

4. **Guides card** — Shows the most relevant guide based on the earliest-stage baby's current milestone. Links to `/family/guides`.

For users with no household group: show a "Create a household first" prompt linking to the existing kitchen group flow.

For users with a household but no `household_members` entries: show an onboarding prompt to add a baby/child member.

---

## Feature: Member Profiles (`/family/members`)

Per-member card shows:
- Name + optional age (derived from DOB if set, displayed as "8 months" not exact date)
- Current stage label (derived from latest confirmed milestone)
- **Milestone checklist** — 4 milestones in order, each with:
  - Confirm button (sets `confirmed_at`)
  - Date confirmed (displayed after confirmation)
  - Brief description of what this milestone means in practice
- **Allergen introduction tracker** — 8 allergens checklist, parent marks "introduced safely" with date

Edit/delete member actions available.

---

## Feature: Baby Recipe Browser (`/family/recipes`)

Queries existing `recipes` table filtered by `baby_stages` and `allergen_flags`.

**Member selector tabs** at top — one tab per household member, labeled "Mia · Finger foods". Selecting a tab filters the page to that member's current milestone stage.

**Recipe card additions** (extends existing recipe card component):
- Stage badge: "Finger foods", "Soft lumps" etc.
- Allergen warning chip: soft warning if recipe contains an allergen not yet in `member_allergens` for this member. Informational only — no hard block.

**Filters panel** (extends existing filter UI):
- Stage: pre-set to member's current stage, adjustable to browse ahead
- Allergen-free toggle: hides recipes with unintroduced allergens
- Meal type: breakfast / lunch / dinner / snack
- Prep time

**Pantry integration:** "Use what's in your pantry" toggle (already exists for adult recipes) — filters to baby-safe recipes makeable from current pantry items, cross-referenced against the member's allergen introduction status.

---

## Feature: Baby Variant on Recipe Pages

On any recipe detail page:

- If `has_baby_variant: true` → **"Baby version" button** below recipe header. Opens a slide-in panel showing adapted ingredients, texture/preparation notes, which members it's safe for, and an "Add to baby track" button (adds to meal planner baby track for a selected day).

- If `has_baby_variant: false` but `baby_stages` is non-empty → **"Adapt for [Mia]" button** — Claude generates a one-time adaptation note based on recipe ingredients and Mia's current milestone. Displayed inline, not saved as a new recipe. Cached in session to avoid re-generating on revisit.

---

## Feature: Meal Planner Baby Track (`/plans`)

A collapsible baby track row added beneath each day's adult meal slots. Toggled by "Show baby track" switch at top of planner — state persists in `user_preferences.baby_track_visible`.

**Baby track row per day:**

Each day slot shows one of three states:

1. **Auto-suggested variant** — Adult meal has a baby variant or `baby_stages` tag → Claude generates a 2-sentence adaptation suggestion. Lazy-generated on scroll into view, cached after first generation.

2. **Not adaptable** — Adult meal flagged as not adaptable (spicy, alcohol-based, honey-containing, etc.) → "Not adaptable" chip + "Pick a separate baby meal" CTA opening the baby recipe browser in a sheet.

3. **Override** — Always-visible "Change" button opens baby recipe browser sheet to pick any recipe, regardless of adult meal. Replaces auto-suggestion.

**Multiple members:** If household has 2+ children at different stages, each gets their own sub-row within the baby track (e.g., "Mia · Finger foods" and "Leo · Soft lumps").

---

## Feature: Shopping List Integration

Baby track ingredients flow into existing shopping list generation with `for_member_id` set.

- Baby items interleaved with adult items (not separated)
- 🍼 tag on baby items — tappable, shows which member and which meal it's for
- "Show baby items only" quick filter at top of shopping list
- Quantities respect baby portion sizes — stored as fractional amounts, displayed as "¼ avocado (for Mia)"

---

## Feature: Pantry Safety Flags

Pantry item cards show a soft warning badge when an item has an `allergen_flags` value not yet introduced for a household member: "Not yet introduced for Mia". Informational only — no hard blocks.

---

## Feature: Guides (`/family/guides`)

### Static cornerstone guides (8 articles)

| Guide | Milestone relevance |
|---|---|
| Starting Solids: Signs of Readiness | Pre-solids |
| First Foods: Single-Ingredient Purées | started_solids |
| Introducing the Top 8 Allergens Safely | started_solids → handles_soft_lumps |
| Baby-Led Weaning vs. Spoon Feeding | started_solids |
| Moving to Mashed & Lumpy Textures | handles_soft_lumps |
| Finger Foods: Safe Shapes & Sizes | finger_foods |
| Foods to Avoid in the First Year | All stages |
| Eating at the Family Table | family_table |

Guide page layout:
- Clean long-form article layout
- "Relevant for [name] right now" badge if matches current milestone
- Inline links to baby recipes relevant to that guide's stage
- Medical disclaimer footer on every guide

### Contextual AI snippets (Claude)

AI surfaces relevant guide excerpts and pantry-aware suggestions in three locations only — no free-form advice:

1. **Recipe page** — Preparation note for baby: "Preparing this for Mia (finger foods stage): remove whole nuts, cut into 1cm pieces, serve at room temperature"
2. **Meal planner baby track** — 2-sentence adaptation explanation when auto-suggesting a baby variant
3. **Guides page sidebar** — "Based on Mia's pantry this week, you could try: [2 recipe suggestions]"

**Claude prompt constraints for all baby content:**
- Role: pediatric nutrition assistant, evidence-based, WHO/AAP aligned
- Tone: warm, practical, non-alarmist
- Hard prohibitions: no specific medical diagnoses, no contradicting "consult your doctor" framing, no allergen introduction schedules presented as guaranteed safe
- Always appends: "Always consult your pediatrician before introducing new foods."

---

## Out of Scope (this spec)

- Growth tracking / weight logging
- Direct messaging between parents in the app
- Pediatrician integration or medical records
- Recipe submission/community contributions for baby food
- Push notifications for milestone reminders (can be added later via existing push_subscriptions infrastructure)

---

## Apple Compliance / Differentiation Notes

**UNIQUENESS:** Milestone-based member profiles (not age-gated) combined with household-aware meal planning baby track — no generic recipe app produces this without knowing the specific household composition and confirmed developmental stage of each child.

**BRAND FIDELITY:** N/A — this is What's Cooking, not HolyFlex.

**FUNCTIONALITY DEPTH:** Family Hub landing (4 interactive cards), member profile management (milestone + allergen checklists), baby recipe browser (member tabs + filters + allergen warnings), meal planner baby track (auto-suggest + override + multi-member), shopping list 🍼 tagging, pantry safety flags, 8 static guides with contextual AI — well above minimum functionality threshold on every route.
