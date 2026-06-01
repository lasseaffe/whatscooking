# Component Recipes Seed — Handoff Prompt

**Context:** What's Cooking at `C:\Users\lasse\Desktop\whatscooking` (Next.js 15, Supabase PostgreSQL, port 3002).

The recipe components feature was fully shipped. The DB has:
- `recipes.is_component` (boolean) and `recipes.component_type` (enum) columns
- `recipe_component_links(parent_recipe_id, component_recipe_id, ingredient_group_label, display_order)` junction table

**Your job:** Seed real component recipes (sauces, bases, marinades) extracted from ingredient patterns that genuinely recur across multiple existing recipes. Then link each component to its parent recipes via `recipe_component_links`.

---

## How to connect

Use the Supabase CLI from the WC project directory:
```bash
cd C:/Users/lasse/Desktop/whatscooking
npx supabase db query --linked "<SQL>"
```

Or apply via migration file — write to `supabase/migrations/20260601000000_seed_component_recipes.sql` and run `npx supabase db push`.

---

## The 6 components to create

These were derived by scanning the real recipe DB for ingredient clusters that co-occur across 2–8 existing recipes. The ingredients below are the **canonical intersection** of what each parent recipe uses.

---

### Component 1: Soffritto (Italian Vegetable Base)
**type:** `base` | **serves:** 4 | **prep:** 5 min | **cook:** 12 min

**Why real:** Appears verbatim in Venetian Duck Ragu, Osso Buco alla Milanese, Rich Tofu Ragu, 30 Minute Minestrone — all use the same onion+carrot+celery+garlic+olive oil base.

**Canonical ingredients:**
- 3 tbsp olive oil
- 1 large onion, finely diced
- 2 carrots, finely diced
- 2 celery sticks, finely diced
- 3 cloves garlic, minced
- 1 bay leaf
- salt and black pepper to taste

**Instructions:**
1. Heat olive oil in a wide pan over medium heat.
2. Add onion, carrot, and celery. Cook 8–10 min, stirring occasionally, until softened and golden.
3. Add garlic and bay leaf. Cook 2 min more until fragrant.
4. Season with salt and pepper. Remove bay leaf before using.

**Parent recipes to link (ingredient_group_label: "Soffritto Base"):**
- `ragu alla veneziana  venetian duck ragu`
- `Osso Buco alla Milanese`
- `Rich Tofu Ragu`
- `30 Minute Minestrone`

---

### Component 2: Lemon-Garlic-Olive Oil Marinade
**type:** `marinade` | **serves:** 4 | **prep:** 5 min | **cook:** 0 min

**Why real:** Used in Tuscan Lemon Chicken, Moroccan Nourish Bowl (as dressing), Spiced Lamb Triangles, Herb Grilled Chicken Meal Prep, and Grilled Lemon Chicken & Moroccan Couscous Salad — all share olive oil + lemon juice + garlic as their flavoring core.

**Canonical ingredients:**
- 4 tbsp extra virgin olive oil
- 3 tbsp fresh lemon juice
- 2 cloves garlic, minced
- 1 tsp salt
- 0.5 tsp black pepper
- 1 tsp dried herbs (oregano, rosemary, or cumin — see note)

**Instructions:**
1. Whisk all ingredients together in a bowl until emulsified.
2. Use immediately as a marinade (30 min minimum for proteins) or as a dressing.

**Note for seeder:** The herb varies by recipe — Tuscan uses rosemary, Moroccan uses cumin. Leave it as "dried herbs" in the component ingredients. The label on parent-recipe links should reflect the context (see below).

**Parent recipes to link:**
- `tuscan lemon chicken with warm bean salad` → label: "Lemon-Rosemary Marinade"
- `Moroccan-Style Nourish Bowl` → label: "Lemon-Garlic Dressing"
- `Herb Grilled Chicken Meal Prep` → label: "Lemon-Garlic Marinade"
- `grilled lemon chicken and moroccan couscous salad` → label: "Lemon-Garlic Marinade"

---

### Component 3: Ginger-Soy Marinade
**type:** `marinade` | **serves:** 4 | **prep:** 5 min | **cook:** 0 min

**Why real:** Appears in 4 recipes — Balinese Chicken, Authentic Chinese Garlic Pork, A Pork Marinade, Grilled Salmon/Chicken. All share soy sauce + garlic + ginger + sweetener (honey or brown sugar).

**Canonical ingredients:**
- 3 tbsp soy sauce
- 2 cloves garlic, minced
- 1 tbsp fresh ginger, grated
- 1 tbsp honey (or brown sugar)
- 1 tbsp vegetable oil
- 0.5 tsp black pepper

**Instructions:**
1. Whisk all ingredients together until smooth.
2. Use as a marinade for 30 min to overnight. Works on chicken, pork, salmon, and tofu.

**Parent recipes to link (label: "Ginger-Soy Marinade"):**
- `Ayam Bali  Balinese Chicken`
- `Authentic Chinese Garlic Pork`
- `A  Pork Marinade`
- `4Th Of July Grilled Salmon  Or Chicken`

---

### Component 4: Quick Tomato Sauce (Crushed Tomato Base)
**type:** `sauce` | **serves:** 4–6 | **prep:** 5 min | **cook:** 20 min

**Why real:** Used in Lasagna (crushed + diced + paste), Pasta Eggplant Casserole (crushed + paste), 30 Minute Chili (crushed tomatoes + garlic + onion). All share the same aromatic tomato base.

**Canonical ingredients:**
- 2 tbsp olive oil
- 1 onion, diced
- 4 cloves garlic, minced
- 1 can (400 g) crushed tomatoes
- 2 tbsp tomato paste
- 1 tsp dried basil (or oregano)
- 0.5 tsp sugar
- salt and black pepper to taste

**Instructions:**
1. Heat olive oil over medium heat. Sauté onion 5 min until soft.
2. Add garlic and cook 1 min.
3. Stir in tomato paste and cook 2 min until darkened.
4. Add crushed tomatoes, basil, sugar, salt, and pepper.
5. Simmer uncovered 12–15 min until thickened.

**Parent recipes to link (label: "Tomato Sauce Base"):**
- `the lasagna that will win them over`
- `pasta  eggplant and sausage casserole`
- `30 Minute Chili`

---

### Component 5: Tahini Sauce
**type:** `sauce` | **serves:** 4 | **prep:** 5 min | **cook:** 0 min

**Why real:** Identical in Rainbow Buddha Bowl and Moroccan-Style Nourish Bowl — both use tahini + lemon juice + garlic + maple syrup + water. Exact same 5-ingredient sauce.

**Canonical ingredients:**
- 3 tbsp tahini
- 2 tbsp fresh lemon juice
- 1 clove garlic, minced
- 1 tsp maple syrup
- 3–4 tbsp water (to thin)
- pinch of salt

**Instructions:**
1. Whisk tahini, lemon juice, garlic, and maple syrup together.
2. Add water 1 tbsp at a time, whisking until smooth and pourable.
3. Season with salt. Keeps refrigerated for 5 days.

**Parent recipes to link (label: "Tahini Sauce"):**
- `Rainbow Buddha Bowl`
- `Moroccan-Style Nourish Bowl`

---

### Component 6: Spicy Peanut Sauce
**type:** `sauce` | **serves:** 4 | **prep:** 5 min | **cook:** 0 min

**Why real:** Used in Spicy Peanut Noodles (peanut butter + soy + chili crunch + maple) and Sambal Satay Tofu Sando (peanut butter + tamari + agave + lime). Both are peanut butter + soy + sweetener + heat + water. Minor variation: one uses chili crunch + sriracha, the other uses sambal + lime.

**Canonical ingredients:**
- 3 tbsp peanut butter (smooth)
- 2 tbsp soy sauce
- 1 tbsp maple syrup (or agave)
- 1 tsp sriracha (or sambal)
- 1 tsp lime juice
- 3 tbsp warm water

**Instructions:**
1. Combine all ingredients in a bowl and whisk until smooth.
2. Add more water to thin if needed — it should coat a spoon.
3. Taste and adjust heat with more sriracha.

**Parent recipes to link (label: "Peanut Sauce"):**
- `Spicy Peanut Noodles`
- `Sambal Satay Tofu Sando`

---

## SQL approach

### Step 1 — Look up parent recipe IDs

For each parent recipe title, run:
```sql
SELECT id, title FROM recipes WHERE title ILIKE '%<search_term>%' LIMIT 5;
```

Use fuzzy matching — the stored titles have irregular spacing and capitalisation. Confirm you have the right recipe before inserting the link.

### Step 2 — Insert each component recipe

```sql
INSERT INTO recipes (
  id, source, title, description, is_component, component_type,
  cook_time_minutes, prep_time_minutes, servings, ingredients, instructions, created_at
) VALUES (
  gen_random_uuid(),
  'curated',
  '<title>',
  '<short description>',
  true,
  '<type>',
  <cook_minutes>,
  <prep_minutes>,
  <servings>,
  '<ingredients_json>'::jsonb,
  ARRAY['<step1>', '<step2>', ...],
  now()
);
```

Save each inserted component's `id` — you need it for the links.

### Step 3 — Insert recipe_component_links

```sql
INSERT INTO recipe_component_links
  (parent_recipe_id, component_recipe_id, ingredient_group_label, display_order)
VALUES
  ('<parent_id>', '<component_id>', '<label>', 0);
```

### Step 4 — Verify

```sql
SELECT
  p.title AS parent,
  c.title AS component,
  rcl.ingredient_group_label
FROM recipe_component_links rcl
JOIN recipes p ON p.id = rcl.parent_recipe_id
JOIN recipes c ON c.id = rcl.component_recipe_id
ORDER BY c.title;
```

---

## Success criteria

- 6 component recipes inserted with `is_component = true`
- Each has correct `component_type` and proper `ingredients` JSONB
- All parent recipe links inserted — 4+4+4+3+2+2 = 19 total links
- Running the above verification SQL shows all 19 rows
- Navigating to any parent recipe URL in the browser shows the orange ingredient group card for the component
