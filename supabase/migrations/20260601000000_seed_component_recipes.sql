-- Seed 6 curated component recipes derived from ingredient pattern analysis
-- across 300 WC recipes. Each component links back to 2-5 parent recipes.
-- Uses fixed UUIDs so this migration is idempotent (ON CONFLICT DO NOTHING).

DO $$
DECLARE
  soffritto_id       uuid := 'c0000001-0000-4000-8000-000000000001';
  lemon_garlic_id    uuid := 'c0000001-0000-4000-8000-000000000002';
  ginger_soy_id      uuid := 'c0000001-0000-4000-8000-000000000003';
  tomato_sauce_id    uuid := 'c0000001-0000-4000-8000-000000000004';
  tahini_id          uuid := 'c0000001-0000-4000-8000-000000000005';
  peanut_sauce_id    uuid := 'c0000001-0000-4000-8000-000000000006';
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Insert component recipes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO recipes (
  id, source, title, description,
  is_component, component_type,
  prep_time_minutes, cook_time_minutes, servings,
  ingredients, instructions,
  is_published, is_premium, is_hack, is_variation,
  ai_generated, creator_approved, steps_consolidated,
  macros_estimated, batch_friendly, image_status, drink_meta
)
VALUES

-- Component 1: Soffritto
(
  soffritto_id,
  'curated',
  'Soffritto (Italian Vegetable Base)',
  'The aromatic foundation of Italian braises, ragùs, and soups — onion, carrot, celery, and garlic cooked down in olive oil until sweet and golden.',
  true, 'base',
  5, 12, 4,
  '[
    {"amount": 3,  "unit": "tbsp",               "name": "olive oil"},
    {"amount": 1,  "unit": "large, finely diced", "name": "onion"},
    {"amount": 2,  "unit": "finely diced",        "name": "carrots"},
    {"amount": 2,  "unit": "finely diced",        "name": "celery sticks"},
    {"amount": 3,  "unit": "cloves, minced",      "name": "garlic"},
    {"amount": 1,  "unit": "",                    "name": "bay leaf"},
    {"amount": 0,  "unit": "to taste",            "name": "salt and black pepper"}
  ]'::jsonb,
  ARRAY[
    'Heat olive oil in a wide pan over medium heat.',
    'Add onion, carrot, and celery. Cook 8–10 minutes, stirring occasionally, until softened and golden.',
    'Add garlic and bay leaf. Cook 2 minutes more until fragrant.',
    'Season with salt and pepper. Remove bay leaf before using.'
  ],
  true, false, false, false,
  false, true, false,
  false, true, 'ok', '{}'::jsonb
),

-- Component 2: Lemon-Garlic-Olive Oil Marinade
(
  lemon_garlic_id,
  'curated',
  'Lemon-Garlic-Olive Oil Marinade',
  'A versatile Mediterranean marinade that doubles as a dressing — bright lemon, garlic, and olive oil with a touch of dried herbs.',
  true, 'marinade',
  5, 0, 4,
  '[
    {"amount": 4,   "unit": "tbsp",        "name": "extra virgin olive oil"},
    {"amount": 3,   "unit": "tbsp",        "name": "fresh lemon juice"},
    {"amount": 2,   "unit": "cloves, minced", "name": "garlic"},
    {"amount": 1,   "unit": "tsp",         "name": "salt"},
    {"amount": 0.5, "unit": "tsp",         "name": "black pepper"},
    {"amount": 1,   "unit": "tsp",         "name": "dried herbs (oregano, rosemary, or cumin)"}
  ]'::jsonb,
  ARRAY[
    'Whisk all ingredients together in a bowl until emulsified.',
    'Use immediately as a marinade (at least 30 minutes for proteins) or as a dressing.'
  ],
  true, false, false, false,
  false, true, false,
  false, true, 'ok', '{}'::jsonb
),

-- Component 3: Ginger-Soy Marinade
(
  ginger_soy_id,
  'curated',
  'Ginger-Soy Marinade',
  'A punchy umami-sweet marinade built on soy sauce, garlic, fresh ginger, and honey — works on chicken, pork, salmon, and tofu.',
  true, 'marinade',
  5, 0, 4,
  '[
    {"amount": 3,   "unit": "tbsp",           "name": "soy sauce"},
    {"amount": 2,   "unit": "cloves, minced", "name": "garlic"},
    {"amount": 1,   "unit": "tbsp, grated",   "name": "fresh ginger"},
    {"amount": 1,   "unit": "tbsp",           "name": "honey (or brown sugar)"},
    {"amount": 1,   "unit": "tbsp",           "name": "vegetable oil"},
    {"amount": 0.5, "unit": "tsp",            "name": "black pepper"}
  ]'::jsonb,
  ARRAY[
    'Whisk all ingredients together until smooth.',
    'Use as a marinade for 30 minutes to overnight. Works on chicken, pork, salmon, and tofu.'
  ],
  true, false, false, false,
  false, true, false,
  false, true, 'ok', '{}'::jsonb
),

-- Component 4: Quick Tomato Sauce
(
  tomato_sauce_id,
  'curated',
  'Quick Tomato Sauce (Crushed Tomato Base)',
  'A versatile, deeply flavoured tomato base for pasta bakes, lasagna, and chili — onion and garlic bloomed in olive oil with crushed tomatoes and a touch of sweetness.',
  true, 'sauce',
  5, 20, 5,
  '[
    {"amount": 2,   "unit": "tbsp",       "name": "olive oil"},
    {"amount": 1,   "unit": "diced",      "name": "onion"},
    {"amount": 4,   "unit": "cloves, minced", "name": "garlic"},
    {"amount": 400, "unit": "g (1 can)",  "name": "crushed tomatoes"},
    {"amount": 2,   "unit": "tbsp",       "name": "tomato paste"},
    {"amount": 1,   "unit": "tsp",        "name": "dried basil (or oregano)"},
    {"amount": 0.5, "unit": "tsp",        "name": "sugar"},
    {"amount": 0,   "unit": "to taste",   "name": "salt and black pepper"}
  ]'::jsonb,
  ARRAY[
    'Heat olive oil over medium heat. Sauté onion for 5 minutes until soft.',
    'Add garlic and cook 1 minute.',
    'Stir in tomato paste and cook 2 minutes until darkened.',
    'Add crushed tomatoes, basil, sugar, salt, and pepper.',
    'Simmer uncovered 12–15 minutes until thickened.'
  ],
  true, false, false, false,
  false, true, false,
  false, true, 'ok', '{}'::jsonb
),

-- Component 5: Tahini Sauce
(
  tahini_id,
  'curated',
  'Tahini Sauce',
  'A creamy, tangy sauce that comes together in minutes — tahini, lemon, garlic, and maple syrup thinned to a pourable consistency.',
  true, 'sauce',
  5, 0, 4,
  '[
    {"amount": 3,   "unit": "tbsp",          "name": "tahini"},
    {"amount": 2,   "unit": "tbsp",          "name": "fresh lemon juice"},
    {"amount": 1,   "unit": "clove, minced", "name": "garlic"},
    {"amount": 1,   "unit": "tsp",           "name": "maple syrup"},
    {"amount": 4,   "unit": "tbsp (to thin)","name": "water"},
    {"amount": 0,   "unit": "pinch",         "name": "salt"}
  ]'::jsonb,
  ARRAY[
    'Whisk tahini, lemon juice, garlic, and maple syrup together.',
    'Add water 1 tablespoon at a time, whisking until smooth and pourable.',
    'Season with salt. Keeps refrigerated for 5 days.'
  ],
  true, false, false, false,
  false, true, false,
  false, true, 'ok', '{}'::jsonb
),

-- Component 6: Spicy Peanut Sauce
(
  peanut_sauce_id,
  'curated',
  'Spicy Peanut Sauce',
  'A rich, heat-forward peanut sauce for noodles and sandos — smooth peanut butter, soy, sriracha, and lime balanced with a touch of sweetness.',
  true, 'sauce',
  5, 0, 4,
  '[
    {"amount": 3,   "unit": "tbsp",     "name": "peanut butter (smooth)"},
    {"amount": 2,   "unit": "tbsp",     "name": "soy sauce"},
    {"amount": 1,   "unit": "tbsp",     "name": "maple syrup (or agave)"},
    {"amount": 1,   "unit": "tsp",      "name": "sriracha (or sambal)"},
    {"amount": 1,   "unit": "tsp",      "name": "lime juice"},
    {"amount": 3,   "unit": "tbsp",     "name": "warm water"}
  ]'::jsonb,
  ARRAY[
    'Combine all ingredients in a bowl and whisk until smooth.',
    'Add more water to thin if needed — it should coat a spoon.',
    'Taste and adjust heat with more sriracha.'
  ],
  true, false, false, false,
  false, true, false,
  false, true, 'ok', '{}'::jsonb
)

ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Link component recipes to their parent recipes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO recipe_component_links
  (parent_recipe_id, component_recipe_id, ingredient_group_label, display_order)
VALUES

-- Soffritto → 5 parents (2 separate Osso Buco alla Milanese records)
('6d0ce290-2bcd-52ce-a770-db8964ca5abb', soffritto_id, 'Soffritto Base', 0),
('1a635f58-ad77-4958-a9c9-fc090fd6f413', soffritto_id, 'Soffritto Base', 0),
('e7eaa68d-0120-4dda-b5b7-9fa07d4ce33b', soffritto_id, 'Soffritto Base', 0),
('b60e8841-52be-4852-9fda-82257be734f6', soffritto_id, 'Soffritto Base', 0),
('1de3ec7f-8d20-454f-8831-3668f739b513', soffritto_id, 'Soffritto Base', 0),

-- Lemon-Garlic Marinade → 4 parents
('87c08fe6-0603-5894-9042-3304b1cba95a', lemon_garlic_id, 'Lemon-Rosemary Marinade',   0),
('2598f249-1dac-4c50-a8d9-41395069959d', lemon_garlic_id, 'Lemon-Garlic Dressing',     0),
('0839a9cf-cff4-45f9-9098-86908794b57b', lemon_garlic_id, 'Lemon-Garlic Marinade',     0),
('944348d7-8f18-5960-9567-b918cb7afcce', lemon_garlic_id, 'Lemon-Garlic Marinade',     0),

-- Ginger-Soy Marinade → 4 parents
('8e123da6-5179-4d2e-be6e-76123e37c9bf', ginger_soy_id, 'Ginger-Soy Marinade', 0),
('2cd63294-d682-4ee8-9a16-0e6cff16be68', ginger_soy_id, 'Ginger-Soy Marinade', 0),
('ae2cdeb7-ba5a-4d49-8cf8-0f0e7b422eb8', ginger_soy_id, 'Ginger-Soy Marinade', 0),
('52b764e5-2643-4d56-82c7-5416814f5500', ginger_soy_id, 'Ginger-Soy Marinade', 0),

-- Quick Tomato Sauce → 3 parents
('242f4f8a-f245-5366-b2bd-74dd0d34e099', tomato_sauce_id, 'Tomato Sauce Base', 0),
('cb076179-93a8-5a14-961c-5a98ad3c966b', tomato_sauce_id, 'Tomato Sauce Base', 0),
('62ea6811-8091-4d2e-982e-04f125e3aa18', tomato_sauce_id, 'Tomato Sauce Base', 0),

-- Tahini Sauce → 2 parents
('d0d86a39-83ca-49cf-9325-e0f98584e596', tahini_id, 'Tahini Sauce', 0),
('2598f249-1dac-4c50-a8d9-41395069959d', tahini_id, 'Tahini Sauce', 0),

-- Spicy Peanut Sauce → 2 parents
('224d9f4e-c77d-4f86-8916-2f6405bd8902', peanut_sauce_id, 'Peanut Sauce', 0),
('646894b9-499f-4082-b4cf-15695ae05670', peanut_sauce_id, 'Peanut Sauce', 0)

ON CONFLICT DO NOTHING;

END $$;
