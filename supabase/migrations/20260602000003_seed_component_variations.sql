-- Seed 13 curated variations across 5 canonical components
-- Quick-twist format: variation_overrides holds the diff; ingredients = [], instructions = []

DO $$
DECLARE
  tomato_id uuid := 'c0000001-0000-4000-8000-000000000004';
  pesto_id  uuid := '6ed44087-526e-40ec-95aa-4934023bc84e';
  bbq_id    uuid := 'c0000002-0000-4000-8000-000000000001';
  tahini_id uuid := 'c0000001-0000-4000-8000-000000000005';
  peanut_id uuid := 'c0000001-0000-4000-8000-000000000006';
BEGIN

INSERT INTO recipes (
  id, source, title, description,
  is_component, component_type,
  is_variation, parent_id, variation_type, variation_notes, variation_overrides,
  prep_time_minutes, cook_time_minutes, servings,
  ingredients, instructions,
  is_published, is_premium, is_hack,
  ai_generated, creator_approved, steps_consolidated,
  macros_estimated, batch_friendly, image_status, drink_meta
) VALUES

-- ── TOMATO SAUCE ─────────────────────────────────────────────────────────────

('c0000003-0000-4000-8000-000000000001','curated','Arrabbiata (Spicy Tomato)',
 'The angry Roman variation — generous chili flakes, double the garlic, no herbs, no sweetness.',
 true,'sauce', true,tomato_id,'profile_swap',
 'Add chili flakes and extra garlic. Skip the basil and sugar entirely.',
 '{"added_ingredients":[{"amount":1.5,"unit":"tsp","name":"dried chili flakes"},{"amount":2,"unit":"cloves extra","name":"garlic"}],"removed_ingredients":["dried basil","sugar"],"step_notes":"Add chili flakes with the garlic. Arrabbiata should be quite spicy."}'::jsonb,
 3,20,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000002','curated','Puttanesca (Olives & Capers)',
 'The bold, briny Neapolitan — anchovy, olives, capers, and chili transform the base into something deeply savoury.',
 true,'sauce', true,tomato_id,'profile_swap',
 'Add anchovy, black olives, capers, and chili. The salt from olives and capers replaces added salt.',
 '{"added_ingredients":[{"amount":4,"unit":"fillets minced","name":"anchovy"},{"amount":0.5,"unit":"cup halved","name":"black olives"},{"amount":2,"unit":"tbsp","name":"capers"},{"amount":0.5,"unit":"tsp","name":"dried chili flakes"}],"removed_ingredients":["sugar","salt and black pepper"],"step_notes":"Saute anchovy with the garlic until dissolved. Add olives and capers with the tomatoes."}'::jsonb,
 5,20,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000003','curated','Roasted Cherry Tomato Sauce',
 'Roast the tomatoes in the oven instead of simmering — more concentrated, sweeter, and charred at the edges.',
 true,'sauce', true,tomato_id,'profile_swap',
 'Replace crushed canned tomatoes with 500g fresh cherry tomatoes roasted at 200°C for 25 minutes.',
 '{"added_ingredients":[{"amount":500,"unit":"g halved","name":"cherry tomatoes (replace canned)"}],"removed_ingredients":["crushed tomatoes","tomato paste"],"step_notes":"Toss cherry tomatoes and garlic with olive oil, roast at 200°C (400°F) 25 min until blistered. Crush with a spoon and simmer 10 min with basil."}'::jsonb,
 5,35,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000004','curated','Vodka Sauce (Pink Tomato Cream)',
 'Add a splash of vodka and heavy cream for the silky, blush-pink pasta sauce.',
 true,'sauce', true,tomato_id,'profile_swap',
 'Add vodka (burns off), heavy cream, and a pinch of red pepper flakes.',
 '{"added_ingredients":[{"amount":0.25,"unit":"cup","name":"vodka"},{"amount":0.5,"unit":"cup","name":"heavy cream"},{"amount":0.5,"unit":"tsp","name":"red pepper flakes"}],"removed_ingredients":[],"step_notes":"Add vodka after the tomato paste step. Simmer 5 min to cook off alcohol. Stir in cream at the end and simmer 3 more min."}'::jsonb,
 5,25,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── PESTO ─────────────────────────────────────────────────────────────────────

('c0000003-0000-4000-8000-000000000005','curated','Pesto Rosso (Sun-Dried Tomato)',
 'Sicilian red pesto — swap fresh basil for sun-dried tomatoes and pine nuts for almonds. Earthy, sweet, and intense.',
 true,'sauce', true,pesto_id,'regional',
 'Replace fresh basil with sun-dried tomatoes and pine nuts with blanched almonds. Add smoked paprika.',
 '{"added_ingredients":[{"amount":80,"unit":"g drained","name":"sun-dried tomatoes (replace basil)"},{"amount":0.5,"unit":"tsp","name":"smoked paprika"}],"removed_ingredients":["fresh basil","pine nuts"],"step_notes":"Use blanched almonds instead of pine nuts. Blend sun-dried tomatoes with remaining ingredients."}'::jsonb,
 10,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000006','curated','Kale & Walnut Pesto',
 'A heartier, more nutritious pesto using blanched kale and walnuts — earthier flavour, holds up to heavier pastas.',
 true,'sauce', true,pesto_id,'dietary',
 'Replace basil with blanched kale, pine nuts with walnuts. Add lemon juice to balance earthiness.',
 '{"added_ingredients":[{"amount":100,"unit":"g blanched and squeezed dry","name":"kale (replace basil)"},{"amount":1,"unit":"tbsp","name":"lemon juice"}],"removed_ingredients":["fresh basil","pine nuts"],"step_notes":"Blanch kale 60 seconds, refresh in ice water, squeeze very dry. Use walnuts instead of pine nuts."}'::jsonb,
 10,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000007','curated','Vegan Pesto (No Cheese)',
 'Drop the parmesan, add nutritional yeast and extra lemon for the same umami depth without dairy.',
 true,'sauce', true,pesto_id,'dietary',
 'Replace parmesan with nutritional yeast. Add extra lemon juice to compensate for the missing tang.',
 '{"added_ingredients":[{"amount":3,"unit":"tbsp","name":"nutritional yeast (replace parmesan)"},{"amount":1,"unit":"tbsp extra","name":"lemon juice"}],"removed_ingredients":["parmesan"],"step_notes":"Season more aggressively with salt since parmesan is salty."}'::jsonb,
 10,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── BBQ SAUCE ─────────────────────────────────────────────────────────────────

('c0000003-0000-4000-8000-000000000008','curated','Carolina Mustard BBQ Sauce',
 'South Carolina-style gold sauce — yellow mustard replaces ketchup as the base. Tangy, peppery, zero tomato.',
 true,'sauce', true,bbq_id,'regional',
 'Replace ketchup with yellow mustard as the primary base. Increase vinegar. No tomato flavour.',
 '{"added_ingredients":[{"amount":0.5,"unit":"cup","name":"yellow mustard (replace ketchup)"},{"amount":1,"unit":"tbsp extra","name":"apple cider vinegar"}],"removed_ingredients":["ketchup","smoked paprika"],"step_notes":"Same method. Simmer 10 min — sauce will thin slightly, which is correct."}'::jsonb,
 5,15,6,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000009','curated','Alabama White BBQ Sauce',
 'Northern Alabama''s signature mayo-base BBQ sauce with horseradish and ACV. Outstanding on smoked chicken.',
 true,'sauce', true,bbq_id,'regional',
 'Completely different base: mayonnaise replaces ketchup. Add horseradish. No cooking needed.',
 '{"added_ingredients":[{"amount":1,"unit":"cup","name":"mayonnaise (replaces ketchup and sugar)"},{"amount":2,"unit":"tbsp","name":"prepared horseradish"},{"amount":1,"unit":"tsp","name":"black pepper"}],"removed_ingredients":["ketchup","brown sugar","Worcestershire sauce","smoked paprika","cayenne pepper"],"step_notes":"Just whisk together — no cooking needed. Best served cold or at room temperature."}'::jsonb,
 5,0,8,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── TAHINI ────────────────────────────────────────────────────────────────────

('c0000003-0000-4000-8000-000000000010','curated','Green Tahini (Herb)',
 'Blend a handful of parsley or coriander into the base for a vibrant green version.',
 true,'sauce', true,tahini_id,'profile_swap',
 'Add a large handful of fresh parsley or coriander — blend until completely smooth and green.',
 '{"added_ingredients":[{"amount":1,"unit":"large handful","name":"fresh parsley or coriander"}],"removed_ingredients":[],"step_notes":"Add herbs to the blender with all other ingredients. Strain for a silkier texture."}'::jsonb,
 5,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000011','curated','Smoky Tahini',
 'Add smoked paprika and cumin for a warm, earthy variation suited to roasted vegetables and falafel.',
 true,'sauce', true,tahini_id,'profile_swap',
 'Add smoked paprika and ground cumin to the base recipe.',
 '{"added_ingredients":[{"amount":0.5,"unit":"tsp","name":"smoked paprika"},{"amount":0.25,"unit":"tsp","name":"ground cumin"}],"removed_ingredients":[],"step_notes":"Pairs especially well with roasted cauliflower and aubergine."}'::jsonb,
 5,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── PEANUT SAUCE ──────────────────────────────────────────────────────────────

('c0000003-0000-4000-8000-000000000012','curated','Coconut Peanut Sauce',
 'Replace water with coconut milk for a richer, creamier version suited to satay and Thai noodle dishes.',
 true,'sauce', true,peanut_id,'profile_swap',
 'Replace water with coconut milk and add a squeeze of lime.',
 '{"added_ingredients":[{"amount":0.25,"unit":"cup","name":"coconut milk (replace water)"},{"amount":1,"unit":"tsp","name":"lime juice"}],"removed_ingredients":["warm water"],"step_notes":"Use full-fat coconut milk. Thin with more coconut milk if needed."}'::jsonb,
 5,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb),

('c0000003-0000-4000-8000-000000000013','curated','Almond Butter Satay Sauce',
 'Swap peanut butter for almond butter for a milder, slightly less intense version.',
 true,'sauce', true,peanut_id,'dietary',
 'Replace peanut butter with smooth almond butter. Otherwise identical.',
 '{"added_ingredients":[{"amount":3,"unit":"tbsp","name":"smooth almond butter (replace peanut butter)"}],"removed_ingredients":["peanut butter (smooth)"],"step_notes":"Almond butter is slightly less oily — may need 1 extra tbsp warm water."}'::jsonb,
 5,0,4,'[]'::jsonb,'{}',
 true,false,false,false,true,false,false,true,'ok','{}'::jsonb)

ON CONFLICT (id) DO NOTHING;

END $$;
