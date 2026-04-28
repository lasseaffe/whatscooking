# Spec B — Features
_What's Cooking · 2026-04-28_

---

## 1. Shopping List

### 1a. Quantity input on quick-add
Currently `parseQuickAdd()` parses a free-text string like "200g flour". The input field has no dedicated quantity/unit fields, making it easy to miss.

**Change:** Split the quick-add row into three inline inputs:
- `amount` — number input, narrow (e.g. `60px`)
- `unit` — select dropdown with metric + imperial options matching the recipe page unit system (g, kg, ml, l, oz, lb, cup, tbsp, tsp, pcs, bunch, head, can, jar, slice)
- `name` — text input, flex-1, existing behaviour

On Enter or + button tap, all three are combined into a `ShoppingItem`. The `parseQuickAdd` free-text fallback is removed; the three-field form is the only input method.

### 1b. Notes — WYSIWYG editor
Replace `RichTextarea` + `ReactMarkdown` preview toggle with **Tiptap** (headless rich text framework, MIT licence).

- Install: `@tiptap/react @tiptap/pm @tiptap/starter-kit`
- The editor renders formatted text inline as you type — bold looks bold, no `**` symbols visible
- Toolbar: Bold, Italic, Underline, Strikethrough, Bullet list, Ordered list — rendered as a slim icon row above the editor
- Content is stored as HTML in `localStorage` under key `wc_shopping_notes_v2` (new key avoids collision with old markdown content)
- The edit/preview toggle button is removed entirely
- Notes auto-save on every change (existing `handleNotesChange` pattern)

### 1c. Cost estimate — semi-automatic with locale
**What changes:**
- The `$` currency symbol is replaced with the user's locale currency symbol detected via `Intl.NumberFormat(navigator.language).resolvedOptions()` and a simple currency map (US→USD, DE→EUR, GB→GBP, etc.) — a ~20-line lookup table, no API needed
- Alongside the currency symbol, show a faint "suggested" price for common ingredients drawn from a hardcoded regional price table (e.g. `{ "DE": { "chicken": 4.5, "flour": 0.8 }, "US": { "chicken": 6.0, "flour": 1.2 } }`) — these pre-fill the input as a placeholder, not a locked value
- User can still override any price; prices are saved per-item-name in localStorage as before
- The cost estimate modal becomes an **inline collapsible section** below the item list rather than a modal — less friction when shopping

### 1d. Sort views
All three sort modes already exist (`recipe`, `aisle`, `category`). No logic changes needed — this is already done. ✓

### 1e. Print / Share
Print already exists (opens blank window). Share already exists (Web Share API with clipboard fallback). Both are already in the header button row. ✓

The only change: ensure the print output respects the current `sortMode` (currently it always groups by recipe regardless of active sort). Fix: pass `sortMode` and `grouped`/`groupKeys` into `printShoppingList()` instead of re-computing by recipe.

---

## 2. All Recipes — Card Appear Animation

**Problem:** Intersection Observer fires too late; cards only animate in after they're already partially visible, causing a jarring pop.

**Fix in `src/app/(app)/recipes/page.tsx` (or wherever the recipe card grid lives):**
- Change the `rootMargin` on the `IntersectionObserver` from `"0px"` to `"200px"` — this triggers the observer 200px before the card enters the viewport, so the animation is already running by the time the card is visible
- Reduce animation `threshold` from `0.1` to `0` so any pixel of the card entering the extended margin triggers it

If CSS `@keyframes` / `animation-delay` is the culprit instead, reduce the staggered delay between cards from whatever it currently is to `≤40ms` per card.

---

## 3. Meal Plans

### 3a. Popular plans placement
Currently popular/template plans appear above custom plans. **Invert:** custom plans (or the "no plans yet" empty state) appear first, popular templates below.

**Empty state redesign:**
- Text "No meal plans yet. Pick a template above to get started!" → becomes larger, centred, warmer copy
- Add a **+ card** (dashed border, `Plus` icon centred) as the first card in the custom plans row — clicking it goes to `/plans/new`

### 3b. Plan card thumbnail carousel
Each plan card currently shows a single static thumbnail. Replace with an auto-playing image carousel:

- Pulls the meal images for that plan (already available from plan data)
- Auto-advances every **3 seconds**
- Shows left/right chevron buttons on hover (desktop) / always visible (mobile)
- Dot indicators at the bottom of the card image
- Pause on hover
- If a plan has only 1 meal image, no carousel controls are shown (static image)
- Implemented as a self-contained `<PlanCardCarousel images={string[]} />` component in `src/app/(app)/plans/`

---

## 4. Recipe Tags & Utensil Filter

### 4a. Database schema

**New table: `wc_feature_tags`**
```sql
CREATE TABLE wc_feature_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,  -- e.g. "kids-meals", "low-effort"
  label      text NOT NULL,         -- e.g. "Kids Meals", "Low Effort"
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wc_recipe_feature_tags (
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES wc_feature_tags(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ai_assigned boolean NOT NULL DEFAULT false,
  PRIMARY KEY (recipe_id, tag_id)
);
```

**Seed data (initial tag set):**
kids-meals, low-effort, beginner-friendly, meal-prep, low-budget, quick-meals, one-pot, batch-cooking, freezer-friendly, date-night, comfort-food, high-protein, low-calorie, no-cook, 5-ingredients, vegetarian-friendly, spicy, crowd-pleaser, breakfast, dessert

### 4b. AI auto-assignment
- A Supabase Edge Function `auto-tag-recipe` runs when a recipe is inserted or updated
- It calls the Claude API with the recipe title, ingredients, cook time, and steps
- Returns a JSON array of tag slugs from the seed list
- Tags are inserted into `wc_recipe_feature_tags` with `ai_assigned = true`
- Confidence threshold: only assign tags the model is explicit about — no hedging

### 4c. Admin tag UI (your manual override)
On the recipe detail page (`/recipes/[id]`), a tag management section visible only to the authenticated owner/admin:
- Shows current tags as removable pills
- An `<TagInput />` combobox: as you type, existing tags from `wc_feature_tags` are suggested via a dropdown; pressing Enter on a new string creates the tag in the DB and assigns it
- New tags created this way are available globally and will appear as suggestions on other recipes
- Tags are saved immediately on selection/creation (no save button)

### 4d. Tag filtering on recipe browse
- Tags are **not shown by default** in the recipe grid — they act as hidden search/filter logic only
- A collapsible **"More filters"** section below the existing filter bar reveals the tag pills
- Selecting a tag filters the recipe grid (additive — multiple tags can be active, AND logic)
- Active tag filters persist in URL query params (`?tags=low-effort,meal-prep`) for shareability

### 4e. Utensil filter
A new filter dimension alongside dietary filters:

**Common utensils:** pot, pan, oven, blender, food processor, grill, air fryer, slow cooker, instant pot, wok, steamer, microwave

**Two modes** (mirrors dietary filter's adapt/filter toggle):
- **Filter mode:** hide recipes that require utensils the user doesn't have
- **Adapt mode:** show all recipes; when opening a recipe, flag steps that require a missing utensil and suggest alternatives (e.g. "No oven? Try pan-frying instead")

Utensil requirements per recipe are stored as a JSONB array on the recipe row: `required_utensils text[]`. AI auto-assignment populates this alongside feature tags.

The utensil selector lives in the dietary filters panel (appended as a new section at the bottom) — same UI pattern as the existing restriction toggles.

---

## 5. Out of Scope for This Spec
- Grocery price API integration (real-time prices)
- Tiptap plugins beyond starter-kit (tables, images, mentions)
- AI tag confidence scores surfaced to UI
- Mobile bottom nav changes
