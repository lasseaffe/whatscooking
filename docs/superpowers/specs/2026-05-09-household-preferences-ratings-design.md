# Household Preferences & Ratings Design

**Date:** 2026-05-09  
**Status:** Approved for implementation

---

## Context

Currently, recipe ratings are per-user and one-dimensional in terms of household impact — they influence suggestions only through the individual user's taste profile. There is no way to record how other household members (children, partners, guests) reacted to a meal, and no mechanism to track ingredient-level preferences per person.

This design adds:
1. Household member profiles (with optional account linking)
2. Per-member feedback collected at rating time
3. Ingredient-level preference tracking (canonical + free-text, with lightweight inference)
4. Household-aware suggestion scoring with badges and a family fit indicator

---

## 1. Data Model

### `household_members`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `owner_user_id` | UUID FK → auth.users | Account that manages this member |
| `linked_user_id` | UUID FK → auth.users | Nullable — set when member links their own account |
| `display_name` | text | e.g. "Emma", "Baby Noah" |
| `avatar_emoji` | text | Quick visual identity |
| `age_group` | enum: `baby\|child\|teen\|adult` | |
| `filter_strictness` | enum: `allergy\|dislike\|soft` | Controls hard vs soft filtering in suggestions |
| `created_at` | timestamp | |

### `member_ingredient_preferences`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `member_id` | UUID FK → household_members | |
| `ingredient_id` | UUID FK → ingredients | Nullable — canonical match |
| `ingredient_text` | text | Free-text fallback |
| `sentiment` | enum: `dislike\|avoid\|love` | |
| `source` | enum: `reported\|inferred` | `inferred` when 3+ same-category dislikes detected |
| `created_at` | timestamp | |

### `member_meal_reactions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `member_id` | UUID FK → household_members | |
| `recipe_id` | UUID FK → recipes | |
| `rating` | smallint 1–3 | 1=didn't like, 2=okay, 3=loved |
| `notes` | text | Nullable — e.g. "left the broccoli" |
| `reported_by` | UUID FK → auth.users | The account that logged this reaction |
| `cooked_at` | timestamp | |

### Ingredient category hierarchy (extend existing table)

Add `parent_category_id UUID nullable` to `ingredient_categories`. This enables lightweight inference: if Emma dislikes broccoli + cauliflower, both map to a "brassicas" parent → system infers and stores a pattern-level preference with `source: inferred`.

---

## 2. Household Member Management UI

**Location:** New "Household" tab in profile/settings area.

### Member list screen
- Cards: avatar emoji + name + age group + strictness badge
- "Add member" → modal: name, emoji picker, age group, strictness
- "Link account" action per card → sends invite link; on accept, sets `linked_user_id`
- Linked members show a "has account" indicator

### Member detail screen
- Meal reaction history (last 10 cooked meals with star)
- Ingredient preferences list (dislikes/avoids/loves, reported vs inferred label)
- "Add preference" → ingredient search (canonical first, free-text fallback)
- Inferred preferences shown with: "We noticed Emma often dislikes brassicas — added automatically"
- Strictness selector editable here

### Account linking flow
- Unlinked: owner manages entirely
- Linked: member's own app ratings auto-populate `member_meal_reactions` — no double entry

---

## 3. Per-Member Feedback at Rating Time

**File to extend:** `src/app/(app)/recipes/[id]/recipe-interactions.tsx`

### Layout
Single screen, two sections:

**Your rating** (existing — unchanged)  
5-dimension stars + `would_make_again` boolean.

**"How did everyone react?"** (new section below)  
One card per household member:
- Avatar emoji + display name
- 1–3 star tap row (😞 / 😐 / 😋)
- Pre-populated ingredient chips from recipe ingredients that match known dislikes for that member (e.g. "left the broccoli?" if broccoli is in recipe)
- Free-text "add note" below chips
- "Wasn't home" toggle — excludes from this meal's history without a rating
- Members can be skipped (optional)

### Submission
- Existing rating → POST `/api/ratings` (unchanged)
- Member reactions → POST `/api/household/reactions` (new batch endpoint, single call)
- Reported ingredient dislikes → upsert into `member_ingredient_preferences` with `source: reported`

---

## 4. Suggestion Scoring with Household Preferences

**File to extend:** `src/app/api/recipes/suggestions/route.ts`

### New household scoring pass (runs after existing cuisine/dish-type pass)

For each recipe candidate, for each household member:

| Condition | Score delta |
|---|---|
| Ingredient match on `allergy` strictness | Remove from candidates (hard filter) |
| Ingredient match on `dislike` strictness | −4 per matching ingredient |
| Ingredient match on `soft` strictness | −1 per matching ingredient |
| Member previously rated recipe 3 stars | +2 |
| Member previously rated recipe 1 star | −3 |

Aggregate household delta added to recipe's existing score before final ranking.

### Recipe card badges (new UI on suggestion cards)

| Badge | Condition |
|---|---|
| "⭐ Family favourite" | Avg member reaction ≥ 2.5 across ≥ 2 members |
| "⚠️ [Name] won't eat this" | Any member has dislike/allergy ingredient match |
| "👶 Baby-friendly" | No `age_group: baby` member has a dislike match |

### Family fit indicator (recipe detail screen)

- Row of member avatar emojis, each green / yellow / red:
  - Green: no ingredient conflicts, positive history
  - Yellow: soft dislike match or no history
  - Red: dislike/allergy match
- Tap avatar → tooltip/sheet showing specific flagged ingredients for that member

---

## 5. Inference Engine (Lightweight)

Runs server-side after each new `member_ingredient_preferences` insert:

1. Count `dislike|avoid` preferences for this member grouped by `ingredient_categories.parent_category_id`
2. If any parent category has ≥ 3 dislikes and no existing `inferred` preference for that category → insert `member_ingredient_preferences` with `source: inferred`, `ingredient_text` = category name
3. Surface inferred preferences in member detail UI with explanatory note

---

## 6. New API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/household/members` | GET / POST | List / create household members |
| `/api/household/members/[id]` | PATCH / DELETE | Update / remove a member |
| `/api/household/members/[id]/link` | POST | Send account link invite |
| `/api/household/preferences` | GET / POST / DELETE | Member ingredient preferences |
| `/api/household/reactions` | POST | Batch submit meal reactions |
| `/api/household/reactions/[recipeId]` | GET | Get reactions for a recipe (for rating screen pre-population) |

---

## 7. Critical Files

| File | Change |
|---|---|
| `supabase/migrations/` | New migration: `household_members`, `member_ingredient_preferences`, `member_meal_reactions`, `ingredient_categories` parent column |
| `src/app/api/recipes/suggestions/route.ts` | Add household scoring pass |
| `src/app/(app)/recipes/[id]/recipe-interactions.tsx` | Add per-member reaction section |
| `src/app/(app)/settings/` (or profile) | New Household tab + member management UI |
| `src/app/api/household/` | All new routes above |
| `src/lib/types.ts` | New types: `HouseholdMember`, `MemberReaction`, `MemberIngredientPreference` |

---

## 8. Verification

1. **Member management:** Create a member, set strictness to `allergy`, add broccoli as a dislike → confirm recipe with broccoli is removed from suggestions entirely
2. **Rating flow:** Open a recipe detail, rate it, confirm household member cards appear below with pre-populated ingredient chips matching recipe ingredients
3. **Suggestion badges:** Cook a recipe twice for a member (both 3 stars) → confirm "Family favourite" badge appears on suggestion card
4. **Inference:** Add 3 brassica dislikes for a member → confirm an inferred "brassicas" preference appears in member detail with "added automatically" label
5. **Family fit indicator:** Open recipe detail containing a disliked ingredient → confirm that member's avatar shows red with tooltip listing the flagged ingredient
6. **Linked account:** Link a member to a real account, have that account rate a recipe → confirm reaction auto-populates in `member_meal_reactions`
