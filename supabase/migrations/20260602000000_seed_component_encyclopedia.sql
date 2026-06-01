-- Component Encyclopedia — Track A: 39 fresh curated components
-- UUIDs: c0000002-0000-4000-8000-0000000000NN

DO $$
DECLARE
  -- SAUCES
  bbq_id        uuid := 'c0000002-0000-4000-8000-000000000001';
  teriyaki_id   uuid := 'c0000002-0000-4000-8000-000000000002';
  enchilada_id  uuid := 'c0000002-0000-4000-8000-000000000003';
  chimichurri_id uuid := 'c0000002-0000-4000-8000-000000000004';
  buffalo_id    uuid := 'c0000002-0000-4000-8000-000000000005';
  romesco_id    uuid := 'c0000002-0000-4000-8000-000000000006';
  hollandaise_id uuid := 'c0000002-0000-4000-8000-000000000007';
  -- DRESSINGS
  caesar_id     uuid := 'c0000002-0000-4000-8000-000000000008';
  honey_mst_id  uuid := 'c0000002-0000-4000-8000-000000000009';
  ranch_id      uuid := 'c0000002-0000-4000-8000-000000000010';
  miso_ginger_id uuid := 'c0000002-0000-4000-8000-000000000011';
  balsamic_id   uuid := 'c0000002-0000-4000-8000-000000000012';
  -- MARINADES
  yogurt_id     uuid := 'c0000002-0000-4000-8000-000000000013';
  buttermilk_id uuid := 'c0000002-0000-4000-8000-000000000014';
  red_wine_id   uuid := 'c0000002-0000-4000-8000-000000000015';
  jerk_id       uuid := 'c0000002-0000-4000-8000-000000000016';
  -- BASES
  chicken_stk_id uuid := 'c0000002-0000-4000-8000-000000000017';
  veg_stk_id    uuid := 'c0000002-0000-4000-8000-000000000018';
  beef_stk_id   uuid := 'c0000002-0000-4000-8000-000000000019';
  mirepoix_id   uuid := 'c0000002-0000-4000-8000-000000000020';
  dashi_id      uuid := 'c0000002-0000-4000-8000-000000000021';
  -- PASTES
  ginger_garlic_id uuid := 'c0000002-0000-4000-8000-000000000022';
  green_curry_id uuid := 'c0000002-0000-4000-8000-000000000023';
  red_curry_id  uuid := 'c0000002-0000-4000-8000-000000000024';
  harissa_id    uuid := 'c0000002-0000-4000-8000-000000000025';
  sundried_id   uuid := 'c0000002-0000-4000-8000-000000000026';
  -- SPICE BLENDS
  garam_id      uuid := 'c0000002-0000-4000-8000-000000000027';
  ras_id        uuid := 'c0000002-0000-4000-8000-000000000028';
  zaatar_id     uuid := 'c0000002-0000-4000-8000-000000000029';
  italian_id    uuid := 'c0000002-0000-4000-8000-000000000030';
  cajun_id      uuid := 'c0000002-0000-4000-8000-000000000031';
  taco_id       uuid := 'c0000002-0000-4000-8000-000000000032';
  -- CONDIMENTS
  tzatziki_id   uuid := 'c0000002-0000-4000-8000-000000000033';
  pico_id       uuid := 'c0000002-0000-4000-8000-000000000034';
  pickled_id    uuid := 'c0000002-0000-4000-8000-000000000035';
  -- BATTERS / DOUGHS
  shortcrust_id uuid := 'c0000002-0000-4000-8000-000000000036';
  rough_puff_id uuid := 'c0000002-0000-4000-8000-000000000037';
  pancake_id    uuid := 'c0000002-0000-4000-8000-000000000038';
  tempura_id    uuid := 'c0000002-0000-4000-8000-000000000039';
BEGIN

INSERT INTO recipes (
  id, source, title, description,
  is_component, component_type,
  prep_time_minutes, cook_time_minutes, servings,
  ingredients, instructions,
  is_published, is_premium, is_hack, is_variation,
  ai_generated, creator_approved, steps_consolidated,
  macros_estimated, batch_friendly, image_status, drink_meta
) VALUES

-- ── SAUCES ───────────────────────────────────────────────────────────────────

(bbq_id, 'curated', 'American BBQ Sauce',
 'A rich, smoky-sweet all-purpose BBQ sauce built on ketchup, brown sugar, and smoked paprika. Brushes, dips, and glazes.',
 true, 'sauce', 5, 20, 8,
 '[{"amount":1,"unit":"cup","name":"ketchup"},
   {"amount":0.25,"unit":"cup","name":"brown sugar"},
   {"amount":2,"unit":"tbsp","name":"apple cider vinegar"},
   {"amount":1,"unit":"tbsp","name":"Worcestershire sauce"},
   {"amount":1,"unit":"tsp","name":"smoked paprika"},
   {"amount":0.5,"unit":"tsp","name":"garlic powder"},
   {"amount":0.5,"unit":"tsp","name":"onion powder"},
   {"amount":0.25,"unit":"tsp","name":"cayenne pepper"},
   {"amount":0,"unit":"to taste","name":"salt and black pepper"}]'::jsonb,
 ARRAY[
   'Combine all ingredients in a small saucepan over medium heat.',
   'Stir until sugar dissolves and sauce begins to simmer, about 5 minutes.',
   'Reduce heat and simmer uncovered 15 minutes, stirring occasionally, until slightly thickened.',
   'Taste and adjust sweetness, tanginess, or heat. Cool and refrigerate up to 2 weeks.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(teriyaki_id, 'curated', 'Teriyaki Sauce',
 'Glossy Japanese sauce of soy, mirin, and sake with a cornstarch finish. Use as a glaze, stir-fry sauce, or dipping sauce.',
 true, 'sauce', 5, 10, 6,
 '[{"amount":0.5,"unit":"cup","name":"soy sauce"},
   {"amount":0.25,"unit":"cup","name":"mirin"},
   {"amount":2,"unit":"tbsp","name":"sake (or dry sherry)"},
   {"amount":2,"unit":"tbsp","name":"brown sugar"},
   {"amount":1,"unit":"tsp","name":"cornstarch"},
   {"amount":1,"unit":"tbsp","name":"water"}]'::jsonb,
 ARRAY[
   'Whisk soy sauce, mirin, sake, and brown sugar in a small saucepan.',
   'Mix cornstarch with water to make a slurry.',
   'Heat sauce over medium heat until sugar dissolves. Whisk in cornstarch slurry.',
   'Simmer 2–3 minutes, stirring, until glossy and slightly thickened.',
   'Use immediately or refrigerate. Reheats well.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(enchilada_id, 'curated', 'Red Enchilada Sauce',
 'Deep, earthy red sauce of chili powder, cumin, and stock — the soul of classic enchiladas. Also excellent on huevos rancheros.',
 true, 'sauce', 10, 20, 4,
 '[{"amount":2,"unit":"tbsp","name":"vegetable oil"},
   {"amount":2,"unit":"tbsp","name":"plain flour"},
   {"amount":3,"unit":"tbsp","name":"chili powder"},
   {"amount":2,"unit":"cloves, minced","name":"garlic"},
   {"amount":2,"unit":"tbsp","name":"tomato paste"},
   {"amount":2,"unit":"cups","name":"chicken or vegetable stock"},
   {"amount":1,"unit":"tsp","name":"ground cumin"},
   {"amount":0.5,"unit":"tsp","name":"dried oregano"},
   {"amount":0,"unit":"to taste","name":"salt"}]'::jsonb,
 ARRAY[
   'Heat oil in a saucepan over medium heat. Whisk in flour and cook 1 minute until golden.',
   'Add chili powder, garlic, cumin, and oregano. Stir 30 seconds until fragrant.',
   'Whisk in tomato paste, then gradually add stock, removing lumps.',
   'Simmer uncovered 15–20 minutes until sauce coats the back of a spoon.',
   'Season with salt. Strain for a smoother texture.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(chimichurri_id, 'curated', 'Chimichurri',
 'Argentine herb sauce of flat-leaf parsley, garlic, red wine vinegar, and olive oil. The classic companion to grilled meat.',
 true, 'sauce', 10, 0, 6,
 '[{"amount":1,"unit":"cup packed","name":"flat-leaf parsley"},
   {"amount":4,"unit":"cloves","name":"garlic"},
   {"amount":3,"unit":"tbsp","name":"red wine vinegar"},
   {"amount":0.5,"unit":"cup","name":"extra virgin olive oil"},
   {"amount":0.5,"unit":"tsp","name":"dried chili flakes"},
   {"amount":1,"unit":"tsp","name":"dried oregano"},
   {"amount":0,"unit":"to taste","name":"salt and black pepper"}]'::jsonb,
 ARRAY[
   'Finely chop parsley and garlic by hand or pulse briefly in a food processor — leave some texture.',
   'Combine with red wine vinegar, olive oil, chili flakes, and oregano.',
   'Season generously with salt and pepper. Mix well.',
   'Rest 15 minutes before serving to let flavours meld.',
   'Keeps refrigerated 5 days. Bring to room temperature before use.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(buffalo_id, 'curated', 'Buffalo Sauce',
 'The five-ingredient wing classic — hot sauce and butter in perfect balance. Use as a glaze, dip, or sandwich spread.',
 true, 'sauce', 2, 5, 4,
 '[{"amount":0.5,"unit":"cup","name":"hot sauce (Frank''s RedHot style)"},
   {"amount":4,"unit":"tbsp","name":"unsalted butter"},
   {"amount":1,"unit":"tbsp","name":"white vinegar"},
   {"amount":0.25,"unit":"tsp","name":"garlic powder"},
   {"amount":0.25,"unit":"tsp","name":"Worcestershire sauce"}]'::jsonb,
 ARRAY[
   'Melt butter in a small saucepan over low heat.',
   'Whisk in hot sauce, white vinegar, Worcestershire, and garlic powder.',
   'Stir until combined and heated through — do not boil.',
   'Use immediately as a coating, or refrigerate up to 2 weeks and reheat before use.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(romesco_id, 'curated', 'Romesco Sauce',
 'Catalan sauce of roasted red peppers, toasted almonds, and smoked paprika. Outstanding with grilled vegetables, fish, or eggs.',
 true, 'sauce', 10, 0, 6,
 '[{"amount":2,"unit":"large, drained","name":"roasted red peppers (from jar)"},
   {"amount":0.5,"unit":"cup, toasted","name":"blanched almonds"},
   {"amount":2,"unit":"cloves","name":"garlic"},
   {"amount":2,"unit":"tbsp","name":"tomato paste"},
   {"amount":2,"unit":"tbsp","name":"sherry vinegar (or red wine vinegar)"},
   {"amount":1,"unit":"tsp","name":"smoked paprika"},
   {"amount":0.5,"unit":"tsp","name":"chili flakes"},
   {"amount":0.25,"unit":"cup","name":"extra virgin olive oil"},
   {"amount":0,"unit":"to taste","name":"salt"}]'::jsonb,
 ARRAY[
   'Blend roasted peppers, almonds, garlic, tomato paste, vinegar, smoked paprika, and chili flakes until roughly combined.',
   'With the blender running, stream in olive oil until emulsified.',
   'Season with salt. Adjust acidity with more vinegar if needed.',
   'Serve at room temperature. Refrigerates well for 5 days.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(hollandaise_id, 'curated', 'Hollandaise Sauce',
 'The classic French emulsion of egg yolks and clarified butter — rich, silky, and lemon-bright. Essential for eggs Benedict.',
 true, 'sauce', 10, 10, 4,
 '[{"amount":3,"unit":"large","name":"egg yolks"},
   {"amount":1,"unit":"tbsp","name":"cold water"},
   {"amount":1,"unit":"tbsp","name":"fresh lemon juice"},
   {"amount":150,"unit":"g, warm","name":"clarified butter"},
   {"amount":0,"unit":"pinch","name":"cayenne pepper"},
   {"amount":0,"unit":"to taste","name":"salt"}]'::jsonb,
 ARRAY[
   'Whisk egg yolks with cold water and lemon juice in a heatproof bowl.',
   'Set over a pan of barely simmering water (bowl should not touch water). Whisk constantly until pale, thick, and doubled in volume, about 3–4 minutes.',
   'Remove from heat. Very slowly drizzle in warm clarified butter, whisking constantly to emulsify.',
   'Season with cayenne and salt. Serve immediately — hollandaise does not reheat well.',
   'If it splits: whisk a fresh egg yolk in a clean bowl and slowly whisk the split sauce back in.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── DRESSINGS ─────────────────────────────────────────────────────────────────

(caesar_id, 'curated', 'Caesar Dressing',
 'The creamy anchovy-parmesan classic. Assertive, umami-laden, and balanced with lemon — made properly from scratch.',
 true, 'dressing', 10, 0, 4,
 '[{"amount":2,"unit":"cloves, minced","name":"garlic"},
   {"amount":2,"unit":"tsp","name":"anchovy paste (or 3 anchovy fillets, minced)"},
   {"amount":3,"unit":"tbsp","name":"fresh lemon juice"},
   {"amount":1,"unit":"tsp","name":"Dijon mustard"},
   {"amount":1,"unit":"tsp","name":"Worcestershire sauce"},
   {"amount":0.5,"unit":"cup","name":"mayonnaise"},
   {"amount":0.5,"unit":"cup","name":"finely grated parmesan"},
   {"amount":0,"unit":"to taste","name":"salt and black pepper"}]'::jsonb,
 ARRAY[
   'Whisk together garlic, anchovy paste, lemon juice, Dijon, and Worcestershire until combined.',
   'Stir in mayonnaise and parmesan. Thin with a splash of water or more lemon juice if needed.',
   'Season well with salt and pepper.',
   'Refrigerate at least 30 minutes before serving. Keeps 5 days.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(honey_mst_id, 'curated', 'Honey Mustard Dressing',
 'Tangy Dijon and sweet honey balanced with apple cider vinegar and olive oil. Works as a dressing, dip, or sandwich spread.',
 true, 'dressing', 5, 0, 4,
 '[{"amount":3,"unit":"tbsp","name":"Dijon mustard"},
   {"amount":2,"unit":"tbsp","name":"honey"},
   {"amount":2,"unit":"tbsp","name":"apple cider vinegar"},
   {"amount":4,"unit":"tbsp","name":"extra virgin olive oil"},
   {"amount":1,"unit":"clove, minced","name":"garlic"},
   {"amount":0,"unit":"to taste","name":"salt and black pepper"}]'::jsonb,
 ARRAY[
   'Whisk mustard, honey, vinegar, and garlic together.',
   'Gradually drizzle in olive oil, whisking until emulsified.',
   'Season with salt and pepper. Keeps refrigerated 1 week.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(ranch_id, 'curated', 'Ranch Dressing',
 'Creamy, herby American classic — mayo and sour cream base with buttermilk tang, fresh dill, and chives.',
 true, 'dressing', 5, 0, 6,
 '[{"amount":0.5,"unit":"cup","name":"mayonnaise"},
   {"amount":0.5,"unit":"cup","name":"sour cream"},
   {"amount":0.25,"unit":"cup","name":"buttermilk"},
   {"amount":2,"unit":"tbsp, chopped","name":"fresh chives"},
   {"amount":1,"unit":"tbsp, chopped","name":"fresh dill"},
   {"amount":1,"unit":"tsp","name":"garlic powder"},
   {"amount":0.5,"unit":"tsp","name":"onion powder"},
   {"amount":1,"unit":"tsp","name":"fresh lemon juice"},
   {"amount":0,"unit":"to taste","name":"salt and black pepper"}]'::jsonb,
 ARRAY[
   'Whisk all ingredients together until smooth.',
   'Taste and adjust — it should be tangy, herby, and creamy.',
   'Thin with more buttermilk for dipping vs. dressing consistency.',
   'Refrigerate at least 1 hour before serving. Keeps 5 days.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(miso_ginger_id, 'curated', 'Miso-Ginger Dressing',
 'Umami-forward Japanese-inspired dressing with white miso, fresh ginger, sesame, and rice vinegar. Perfect on salads, noodles, or roasted veg.',
 true, 'dressing', 5, 0, 4,
 '[{"amount":2,"unit":"tbsp","name":"white miso paste"},
   {"amount":1,"unit":"tbsp, grated","name":"fresh ginger"},
   {"amount":3,"unit":"tbsp","name":"rice wine vinegar"},
   {"amount":2,"unit":"tbsp","name":"sesame oil"},
   {"amount":1,"unit":"tbsp","name":"soy sauce"},
   {"amount":1,"unit":"tbsp","name":"honey"},
   {"amount":2,"unit":"tbsp","name":"neutral oil"},
   {"amount":1,"unit":"tbsp","name":"water"}]'::jsonb,
 ARRAY[
   'Whisk miso, ginger, rice vinegar, sesame oil, soy sauce, and honey until smooth.',
   'Whisk in neutral oil and water until emulsified.',
   'Taste — should be savory, bright, and gingery. Adjust with more vinegar or honey.',
   'Keeps refrigerated 1 week.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(balsamic_id, 'curated', 'Balsamic Glaze',
 'A reduction of balsamic vinegar and brown sugar to a thick, sweet-tart syrup. Drizzle over salads, strawberries, pizza, or bruschetta.',
 true, 'dressing', 2, 15, 8,
 '[{"amount":1,"unit":"cup","name":"balsamic vinegar"},
   {"amount":2,"unit":"tbsp","name":"brown sugar"}]'::jsonb,
 ARRAY[
   'Combine balsamic vinegar and brown sugar in a small saucepan.',
   'Bring to a simmer over medium heat, stirring until sugar dissolves.',
   'Reduce heat to low and simmer uncovered 15 minutes until reduced by half and coats a spoon.',
   'Cool completely — it thickens further as it cools. Store at room temperature up to 1 month.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── MARINADES ─────────────────────────────────────────────────────────────────

(yogurt_id, 'curated', 'Yogurt-Spice Marinade',
 'Indian and Middle Eastern workhorse marinade — yogurt tenderises while cumin, coriander, turmeric, and ginger penetrate deep.',
 true, 'marinade', 5, 0, 4,
 '[{"amount":1,"unit":"cup","name":"full-fat yogurt"},
   {"amount":1,"unit":"tsp","name":"ground cumin"},
   {"amount":1,"unit":"tsp","name":"ground coriander"},
   {"amount":0.5,"unit":"tsp","name":"turmeric"},
   {"amount":1,"unit":"tsp","name":"smoked paprika"},
   {"amount":1,"unit":"tbsp, grated","name":"fresh ginger"},
   {"amount":3,"unit":"cloves, minced","name":"garlic"},
   {"amount":2,"unit":"tbsp","name":"fresh lemon juice"},
   {"amount":1,"unit":"tsp","name":"salt"}]'::jsonb,
 ARRAY[
   'Combine all ingredients in a bowl and mix until smooth.',
   'Score proteins before marinating to allow deeper penetration.',
   'Marinate chicken or lamb 4–24 hours, fish 30–60 minutes, tofu 1–4 hours.',
   'Wipe off excess yogurt before cooking — residue burns on high heat.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(buttermilk_id, 'curated', 'Buttermilk Brine',
 'The secret behind ultra-tender fried chicken — buttermilk''s lactic acid breaks down proteins while hot sauce and spices season deeply.',
 true, 'marinade', 5, 0, 4,
 '[{"amount":2,"unit":"cups","name":"buttermilk"},
   {"amount":1,"unit":"tbsp","name":"hot sauce"},
   {"amount":1,"unit":"tsp","name":"salt"},
   {"amount":1,"unit":"tsp","name":"black pepper"},
   {"amount":1,"unit":"tsp","name":"garlic powder"},
   {"amount":0.5,"unit":"tsp","name":"onion powder"}]'::jsonb,
 ARRAY[
   'Whisk all ingredients together in a bowl or zip-lock bag.',
   'Submerge chicken pieces fully in the brine.',
   'Refrigerate 4–24 hours (overnight preferred for fried chicken).',
   'Drain excess brine before coating and frying — do not rinse.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(red_wine_id, 'curated', 'Red Wine Marinade',
 'A classic French-style marinade for beef and lamb — dry red wine, herbs, garlic, and olive oil with a long overnight soak.',
 true, 'marinade', 5, 0, 4,
 '[{"amount":1,"unit":"cup","name":"dry red wine"},
   {"amount":4,"unit":"cloves","name":"garlic"},
   {"amount":2,"unit":"sprigs","name":"fresh rosemary"},
   {"amount":4,"unit":"sprigs","name":"fresh thyme"},
   {"amount":3,"unit":"tbsp","name":"extra virgin olive oil"},
   {"amount":2,"unit":"leaves","name":"bay leaf"},
   {"amount":1,"unit":"tsp","name":"black peppercorns"},
   {"amount":0.5,"unit":"tsp","name":"salt"}]'::jsonb,
 ARRAY[
   'Combine all ingredients in a shallow dish or zip-lock bag.',
   'Add beef, lamb, or venison. Turn to coat.',
   'Marinate refrigerated: steaks 2–4 hours, whole cuts 4–12 hours.',
   'Pat the protein dry before cooking for a better sear. Discard the marinade.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(jerk_id, 'curated', 'Jerk Marinade',
 'Jamaican fire — scotch bonnets, allspice, thyme, ginger, and soy blended into an intense, aromatic paste for grilling.',
 true, 'marinade', 10, 0, 4,
 '[{"amount":2,"unit":"whole, stems removed","name":"scotch bonnet or habanero chillies"},
   {"amount":4,"unit":"cloves","name":"garlic"},
   {"amount":1,"unit":"tbsp","name":"ground allspice"},
   {"amount":2,"unit":"tsp","name":"dried thyme"},
   {"amount":1,"unit":"tbsp, grated","name":"fresh ginger"},
   {"amount":2,"unit":"tbsp","name":"brown sugar"},
   {"amount":3,"unit":"tbsp","name":"soy sauce"},
   {"amount":2,"unit":"tbsp","name":"lime juice"},
   {"amount":2,"unit":"tbsp","name":"vegetable oil"},
   {"amount":0.5,"unit":"tsp","name":"ground cinnamon"},
   {"amount":0.5,"unit":"tsp","name":"black pepper"}]'::jsonb,
 ARRAY[
   'Blend all ingredients to a rough paste — a few pulses, leave some texture.',
   'Score chicken, pork, or tofu deeply. Rub marinade all over and into cuts.',
   'Marinate 4–24 hours refrigerated. Overnight gives the most flavour.',
   'Grill over charcoal or bake at 200°C (400°F) for authentic char.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── BASES / STOCKS ────────────────────────────────────────────────────────────

(chicken_stk_id, 'curated', 'Chicken Stock',
 'A clear, golden stock drawn from roasted bones, aromatics, and herbs. The foundation of soups, risottos, braises, and pan sauces.',
 true, 'base', 15, 150, 8,
 '[{"amount":1.5,"unit":"kg","name":"chicken carcass or wings and backs"},
   {"amount":1,"unit":"large, halved","name":"onion"},
   {"amount":2,"unit":"roughly chopped","name":"carrots"},
   {"amount":2,"unit":"roughly chopped","name":"celery sticks"},
   {"amount":1,"unit":"head, halved crosswise","name":"garlic"},
   {"amount":1,"unit":"tbsp","name":"black peppercorns"},
   {"amount":3,"unit":"","name":"bay leaves"},
   {"amount":6,"unit":"sprigs","name":"fresh parsley"},
   {"amount":2,"unit":"sprigs","name":"fresh thyme"},
   {"amount":3,"unit":"litres","name":"cold water"}]'::jsonb,
 ARRAY[
   'Place chicken in a large stock pot, cover with cold water, bring to a boil, then discard the water. This removes impurities.',
   'Refill with 3 litres cold water. Add all vegetables, herbs, and peppercorns.',
   'Bring slowly to a simmer. Skim foam from surface during the first 20 minutes.',
   'Simmer uncovered 2.5–3 hours. Do not boil — a rolling boil clouds the stock.',
   'Strain through a fine sieve. Cool quickly over an ice bath. Refrigerate up to 5 days, freeze up to 3 months.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(veg_stk_id, 'curated', 'Vegetable Stock',
 'A light, versatile stock built from gently sweated vegetables, herbs, and peppercorns. Ready in under an hour.',
 true, 'base', 15, 45, 6,
 '[{"amount":1,"unit":"large, roughly chopped","name":"onion"},
   {"amount":2,"unit":"roughly chopped","name":"carrots"},
   {"amount":2,"unit":"roughly chopped","name":"celery sticks"},
   {"amount":1,"unit":"sliced","name":"leek (white and light green parts)"},
   {"amount":1,"unit":"head, halved","name":"garlic"},
   {"amount":6,"unit":"sprigs","name":"fresh parsley including stems"},
   {"amount":3,"unit":"","name":"bay leaves"},
   {"amount":1,"unit":"tsp","name":"black peppercorns"},
   {"amount":1,"unit":"tbsp","name":"olive oil"},
   {"amount":2.5,"unit":"litres","name":"cold water"}]'::jsonb,
 ARRAY[
   'Heat olive oil in a large pot. Saute all vegetables over medium-high heat 5–7 minutes until lightly golden.',
   'Add herbs, peppercorns, and cold water.',
   'Bring to a simmer and cook uncovered 45 minutes. Do not boil vigorously.',
   'Strain through a fine sieve, pressing vegetables gently. Discard solids.',
   'Season lightly with salt. Refrigerate up to 5 days, freeze up to 3 months.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(beef_stk_id, 'curated', 'Brown Beef Stock',
 'A deeply flavoured, slow-roasted bone stock — the base of French onion soup, demi-glace, and all great braising liquids.',
 true, 'base', 20, 300, 6,
 '[{"amount":1.5,"unit":"kg","name":"beef bones (knuckle, marrow, or short rib)"},
   {"amount":1,"unit":"large, quartered","name":"onion"},
   {"amount":2,"unit":"roughly chopped","name":"carrots"},
   {"amount":2,"unit":"roughly chopped","name":"celery sticks"},
   {"amount":2,"unit":"tbsp","name":"tomato paste"},
   {"amount":1,"unit":"cup","name":"dry red wine"},
   {"amount":3,"unit":"litres","name":"cold water"},
   {"amount":3,"unit":"","name":"bay leaves"},
   {"amount":1,"unit":"tsp","name":"black peppercorns"},
   {"amount":4,"unit":"sprigs","name":"fresh thyme"}]'::jsonb,
 ARRAY[
   'Roast bones in a 220°C (430°F) oven 45 minutes until dark brown. Add onion and carrots for last 20 minutes.',
   'Transfer to a stock pot. Add tomato paste and stir 2 minutes over high heat.',
   'Deglaze with red wine, scraping up all brown bits.',
   'Add cold water, celery, herbs, and peppercorns. Bring slowly to a simmer.',
   'Skim foam diligently during first 30 minutes. Simmer uncovered 4–6 hours.',
   'Strain, cool over ice bath, refrigerate overnight. Skim solidified fat from surface before using.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(mirepoix_id, 'curated', 'Mirepoix (French Aromatic Base)',
 'The French answer to soffritto — onion, carrot, and celery sweated slowly in butter. The flavour foundation of classical French cooking.',
 true, 'base', 5, 12, 4,
 '[{"amount":2,"unit":"large, finely diced","name":"onions"},
   {"amount":2,"unit":"finely diced","name":"carrots"},
   {"amount":2,"unit":"finely diced","name":"celery sticks"},
   {"amount":2,"unit":"tbsp","name":"unsalted butter"},
   {"amount":2,"unit":"sprigs","name":"fresh thyme"},
   {"amount":2,"unit":"","name":"bay leaves"},
   {"amount":0,"unit":"to taste","name":"salt and white pepper"}]'::jsonb,
 ARRAY[
   'Melt butter in a wide pan over medium-low heat.',
   'Add onion, carrot, and celery. Cook slowly 10–12 minutes, stirring occasionally, until very soft and translucent — not browned.',
   'Add thyme and bay leaves. Cook 2 minutes more.',
   'Season lightly. Remove herbs before adding to dishes.',
   'Classic ratio: 2:1:1 by weight (onion:carrot:celery). Mirepoix is a flavour base, not a dish.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(dashi_id, 'curated', 'Dashi (Japanese Kombu & Bonito Stock)',
 'The clear umami base of Japanese cooking — kombu and bonito steep in water for a delicate, mineral broth used in miso soup, ramen, and sauces.',
 true, 'base', 5, 20, 4,
 '[{"amount":20,"unit":"g","name":"kombu (dried kelp)"},
   {"amount":30,"unit":"g","name":"katsuobushi (bonito flakes)"},
   {"amount":1,"unit":"litre","name":"cold water"}]'::jsonb,
 ARRAY[
   'Wipe kombu gently with a damp cloth — do not rinse (the white powder is flavour-giving glutamates).',
   'Place kombu in cold water in a pot. Soak 30 minutes.',
   'Heat over medium. Remove kombu just before water reaches a boil — boiling kombu turns the stock bitter.',
   'Bring to a boil, add bonito flakes, reduce heat and simmer 2–3 minutes.',
   'Remove from heat. Let bonito sink 5 minutes, then strain through a fine sieve.',
   'Use immediately or refrigerate up to 3 days. Freeze up to 1 month.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── PASTES ────────────────────────────────────────────────────────────────────

(ginger_garlic_id, 'curated', 'Ginger-Garlic Paste',
 'The workhorse base of Indian cooking — equal parts ginger and garlic blended with oil. One jar does the work of peeling and mincing for weeks.',
 true, 'paste', 5, 0, 12,
 '[{"amount":100,"unit":"g, peeled","name":"fresh ginger"},
   {"amount":100,"unit":"g, peeled","name":"garlic cloves"},
   {"amount":2,"unit":"tbsp","name":"neutral oil"},
   {"amount":0,"unit":"pinch","name":"salt"}]'::jsonb,
 ARRAY[
   'Blend ginger, garlic, and oil together until a smooth paste forms.',
   'Add a splash more oil or water if blender struggles.',
   'Store in a sterilised jar with a thin layer of oil on top to prevent oxidation.',
   'Refrigerates up to 2 weeks. Freeze in tablespoon portions in an ice cube tray for 3 months.',
   '1:1 ginger to garlic is the standard Indian cooking ratio.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(green_curry_id, 'curated', 'Thai Green Curry Paste',
 'Vibrant, herbaceous, and fiery — the fresh aromatics of Thailand: green chillies, lemongrass, galangal, and kaffir lime.',
 true, 'paste', 15, 0, 4,
 '[{"amount":10,"unit":"deseeded for milder heat","name":"green chillies (bird''s eye or serrano)"},
   {"amount":2,"unit":"stalks, white part, roughly chopped","name":"lemongrass"},
   {"amount":3,"unit":"cloves","name":"garlic"},
   {"amount":3,"unit":"slices","name":"galangal or fresh ginger"},
   {"amount":4,"unit":"leaves, central stem removed","name":"kaffir lime leaves"},
   {"amount":1,"unit":"tsp","name":"shrimp paste (or fish sauce)"},
   {"amount":1,"unit":"bunch","name":"fresh coriander roots and stems"},
   {"amount":1,"unit":"tsp","name":"ground cumin"},
   {"amount":1,"unit":"tsp","name":"ground coriander"},
   {"amount":2,"unit":"tbsp","name":"neutral oil"}]'::jsonb,
 ARRAY[
   'Toast cumin and coriander seeds briefly in a dry pan until fragrant. Cool.',
   'Using a mortar: pound lemongrass, galangal, and chillies first (hardest), then add remaining ingredients.',
   'Alternatively: blend all ingredients until a smooth paste, adding oil to loosen.',
   'Paste keeps refrigerated 1 week, or freeze in tablespoon portions for 3 months.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(red_curry_id, 'curated', 'Thai Red Curry Paste',
 'Earthier and deeper than green — dried red chillies, lemongrass, galangal, and turmeric for aromatic Thai red curries.',
 true, 'paste', 15, 0, 4,
 '[{"amount":8,"unit":"soaked 30 min in hot water","name":"dried red chillies"},
   {"amount":2,"unit":"stalks, white part only","name":"lemongrass"},
   {"amount":4,"unit":"cloves","name":"garlic"},
   {"amount":2,"unit":"slices","name":"galangal or fresh ginger"},
   {"amount":1,"unit":"tsp","name":"shrimp paste"},
   {"amount":3,"unit":"slices","name":"fresh turmeric or 0.5 tsp ground"},
   {"amount":1,"unit":"tsp","name":"ground coriander"},
   {"amount":1,"unit":"tsp","name":"ground cumin"},
   {"amount":1,"unit":"tbsp","name":"lime zest"},
   {"amount":2,"unit":"tbsp","name":"neutral oil"}]'::jsonb,
 ARRAY[
   'Drain soaked chillies.',
   'Blend or pound all ingredients to a fine paste with oil.',
   'Red curry paste is deeper and earthier than green — less aromatic but more warming.',
   'Keeps refrigerated 1 week. Freeze in tablespoon portions.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(harissa_id, 'curated', 'Harissa Paste',
 'North African chili paste of dried peppers, caraway, cumin, and olive oil. A powerful condiment that adds depth to stews, eggs, and marinades.',
 true, 'paste', 15, 5, 6,
 '[{"amount":8,"unit":"soaked 30 min in hot water","name":"dried red chillies"},
   {"amount":1,"unit":"tsp","name":"caraway seeds"},
   {"amount":1,"unit":"tsp","name":"cumin seeds"},
   {"amount":1,"unit":"tsp","name":"coriander seeds"},
   {"amount":4,"unit":"cloves","name":"garlic"},
   {"amount":3,"unit":"tbsp","name":"extra virgin olive oil"},
   {"amount":1,"unit":"tbsp","name":"lemon juice"},
   {"amount":0,"unit":"to taste","name":"salt"}]'::jsonb,
 ARRAY[
   'Toast caraway, cumin, and coriander seeds in a dry pan until fragrant. Grind to a powder.',
   'Drain soaked chillies. Blend with ground spices, garlic, olive oil, and lemon juice until a smooth paste.',
   'Season with salt. Pour a thin layer of olive oil on top in the jar to preserve.',
   'Refrigerates 3 weeks. Stir into yogurt, rub onto chicken, or spoon into stews.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(sundried_id, 'curated', 'Sun-Dried Tomato Paste',
 'Intensely sweet-savoury paste of sun-dried tomatoes, garlic, basil, and olive oil. Excellent stirred into pasta, spread on pizza, or blended into dressings.',
 true, 'paste', 5, 0, 6,
 '[{"amount":100,"unit":"g, drained if in oil","name":"sun-dried tomatoes"},
   {"amount":3,"unit":"cloves","name":"garlic"},
   {"amount":4,"unit":"tbsp","name":"extra virgin olive oil"},
   {"amount":8,"unit":"leaves","name":"fresh basil"},
   {"amount":1,"unit":"tbsp","name":"lemon juice"},
   {"amount":0,"unit":"to taste","name":"salt and black pepper"}]'::jsonb,
 ARRAY[
   'Blend all ingredients until a smooth paste forms, scraping down sides.',
   'Add more olive oil to loosen if needed.',
   'Season generously — sun-dried tomatoes are sweet; lemon juice balances.',
   'Refrigerate up to 2 weeks covered with a thin layer of oil on top.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── SPICE BLENDS ──────────────────────────────────────────────────────────────

(garam_id, 'curated', 'Garam Masala',
 'The warming Northern Indian finishing spice — cumin, coriander, cardamom, cinnamon, and cloves toasted and ground fresh. Add at the end of cooking.',
 true, 'spice_blend', 5, 5, 16,
 '[{"amount":2,"unit":"tbsp","name":"cumin seeds"},
   {"amount":2,"unit":"tbsp","name":"coriander seeds"},
   {"amount":1,"unit":"tsp","name":"green cardamom pods"},
   {"amount":1,"unit":"tsp","name":"black peppercorns"},
   {"amount":1,"unit":"stick","name":"cinnamon"},
   {"amount":0.5,"unit":"tsp","name":"cloves"},
   {"amount":1,"unit":"blade","name":"mace"},
   {"amount":0.25,"unit":"tsp, freshly grated","name":"nutmeg"}]'::jsonb,
 ARRAY[
   'Toast all whole spices in a dry pan over medium heat 2–3 minutes until fragrant. Do not burn.',
   'Cool completely, then grind to a fine powder in a spice grinder or mortar.',
   'Store in an airtight jar away from light. Best within 3 months.',
   'Use as a finishing spice — add off the heat or at the very end of cooking, not as a base.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(ras_id, 'curated', 'Ras el Hanout',
 'The "top of the shop" Moroccan spice blend — a complex mix of warm, sweet, and floral spices. The soul of tagines and couscous dishes.',
 true, 'spice_blend', 5, 0, 16,
 '[{"amount":2,"unit":"tsp","name":"ground coriander"},
   {"amount":2,"unit":"tsp","name":"ground cumin"},
   {"amount":1,"unit":"tsp","name":"ground cinnamon"},
   {"amount":1,"unit":"tsp","name":"ground ginger"},
   {"amount":1,"unit":"tsp","name":"ground turmeric"},
   {"amount":1,"unit":"tsp","name":"smoked paprika"},
   {"amount":0.5,"unit":"tsp","name":"ground allspice"},
   {"amount":0.5,"unit":"tsp","name":"ground cloves"},
   {"amount":0.5,"unit":"tsp","name":"cayenne pepper"},
   {"amount":0.5,"unit":"tsp","name":"black pepper"}]'::jsonb,
 ARRAY[
   'Whisk or shake all ground spices together.',
   'Store in an airtight jar up to 3 months.',
   'Use in tagines, couscous, lamb dishes, and roasted root vegetables.',
   'This blend varies across North Africa — adjust warmth-to-heat ratio to taste.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(zaatar_id, 'curated', 'Za''atar',
 'The Lebanese and Palestinian herb-and-spice blend of dried thyme, sesame, and sumac. Iconic mixed with olive oil and spread on flatbread.',
 true, 'spice_blend', 5, 2, 12,
 '[{"amount":2,"unit":"tbsp","name":"dried thyme"},
   {"amount":2,"unit":"tbsp","name":"sesame seeds"},
   {"amount":1,"unit":"tbsp","name":"sumac"},
   {"amount":1,"unit":"tsp","name":"dried oregano"},
   {"amount":0.5,"unit":"tsp","name":"salt"}]'::jsonb,
 ARRAY[
   'Toast sesame seeds in a dry pan until golden. Cool.',
   'Combine with thyme, sumac, oregano, and salt. Mix well.',
   'Store in an airtight jar up to 3 months.',
   'Classic use: mix with olive oil as a spread on flatbread (manaqeesh). Also use as a rub for chicken or stirred into labneh.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(italian_id, 'curated', 'Italian Seasoning',
 'The pantry staple blend of basil, oregano, rosemary, and thyme. Versatile across pasta sauces, pizza, focaccia, and marinades.',
 true, 'spice_blend', 5, 0, 20,
 '[{"amount":2,"unit":"tbsp","name":"dried basil"},
   {"amount":2,"unit":"tbsp","name":"dried oregano"},
   {"amount":1,"unit":"tbsp","name":"dried rosemary, crumbled"},
   {"amount":1,"unit":"tbsp","name":"dried thyme"},
   {"amount":1,"unit":"tsp","name":"dried marjoram"},
   {"amount":0.5,"unit":"tsp","name":"dried red pepper flakes"}]'::jsonb,
 ARRAY[
   'Combine all herbs in a bowl and mix well.',
   'Store in an airtight jar up to 6 months.',
   'Use in pasta sauces, pizza dough, focaccia, marinades, and Italian soups.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(cajun_id, 'curated', 'Cajun Spice Blend',
 'Louisiana''s smoky-spicy seasoning of paprika, cayenne, garlic, and herbs. Essential for jambalaya, blackened fish, and shrimp dishes.',
 true, 'spice_blend', 5, 0, 16,
 '[{"amount":2,"unit":"tbsp","name":"smoked paprika"},
   {"amount":1,"unit":"tbsp","name":"garlic powder"},
   {"amount":1,"unit":"tbsp","name":"onion powder"},
   {"amount":1,"unit":"tsp","name":"cayenne pepper"},
   {"amount":1,"unit":"tsp","name":"dried thyme"},
   {"amount":1,"unit":"tsp","name":"dried oregano"},
   {"amount":1,"unit":"tsp","name":"black pepper"},
   {"amount":0.5,"unit":"tsp","name":"white pepper"}]'::jsonb,
 ARRAY[
   'Whisk all spices together.',
   'Store in an airtight jar up to 3 months.',
   'Use as a rub for shrimp, chicken, or catfish. Excellent in jambalaya and gumbo.',
   'Adjust cayenne to control heat level.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(taco_id, 'curated', 'Taco Seasoning',
 'The everyday Mexican-American spice blend — cumin, chili powder, smoked paprika, and oregano. Better and cheaper than the packet.',
 true, 'spice_blend', 5, 0, 12,
 '[{"amount":2,"unit":"tbsp","name":"ground cumin"},
   {"amount":1,"unit":"tbsp","name":"chili powder"},
   {"amount":1,"unit":"tbsp","name":"smoked paprika"},
   {"amount":1,"unit":"tsp","name":"garlic powder"},
   {"amount":1,"unit":"tsp","name":"onion powder"},
   {"amount":1,"unit":"tsp","name":"dried oregano"},
   {"amount":0.5,"unit":"tsp","name":"ground coriander"},
   {"amount":0.5,"unit":"tsp","name":"black pepper"}]'::jsonb,
 ARRAY[
   'Whisk all spices together.',
   'Store in an airtight jar up to 3 months.',
   'Use 2 tbsp per 500g of ground meat. Bloom in a hot pan with a splash of water for best flavour.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── CONDIMENTS ────────────────────────────────────────────────────────────────

(tzatziki_id, 'curated', 'Tzatziki',
 'The Greek cucumber-yogurt sauce — cool, garlicky, and herby. Essential with grilled meats, pita, falafel, and mezze spreads.',
 true, 'condiment', 10, 0, 4,
 '[{"amount":1,"unit":"cup","name":"full-fat Greek yogurt"},
   {"amount":0.5,"unit":"medium, grated and squeezed dry","name":"cucumber"},
   {"amount":1,"unit":"clove, minced","name":"garlic"},
   {"amount":2,"unit":"tbsp, chopped","name":"fresh dill"},
   {"amount":1,"unit":"tbsp","name":"fresh lemon juice"},
   {"amount":1,"unit":"tbsp","name":"extra virgin olive oil"},
   {"amount":0,"unit":"to taste","name":"salt"}]'::jsonb,
 ARRAY[
   'Grate cucumber and squeeze firmly in a clean cloth to remove all excess water.',
   'Combine yogurt, cucumber, garlic, dill, lemon juice, and olive oil.',
   'Season with salt. Refrigerate at least 30 minutes for flavours to meld.',
   'Drizzle with extra olive oil and a pinch of dill to serve.',
   'Use full-fat yogurt — low-fat versions become watery.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(pico_id, 'curated', 'Pico de Gallo',
 'Fresh Mexican tomato salsa — ripe tomatoes, red onion, jalapeño, coriander, and lime. Best made fresh; no cooking required.',
 true, 'condiment', 10, 0, 4,
 '[{"amount":3,"unit":"medium, deseeded and diced","name":"ripe tomatoes"},
   {"amount":0.5,"unit":"small, finely diced","name":"red onion"},
   {"amount":1,"unit":"deseeded and minced","name":"jalapeño"},
   {"amount":0.25,"unit":"cup, chopped","name":"fresh coriander"},
   {"amount":2,"unit":"tbsp","name":"fresh lime juice"},
   {"amount":0.5,"unit":"tsp","name":"salt"}]'::jsonb,
 ARRAY[
   'Combine all ingredients in a bowl. Toss gently.',
   'Season with salt and adjust lime to taste.',
   'Let stand 10 minutes for flavours to meld.',
   'Best served fresh. Keeps refrigerated 2 days — excess moisture accumulates over time.',
   'Tip: deseed tomatoes thoroughly for a less watery pico.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(pickled_id, 'curated', 'Pickled Red Onions',
 'Quick-pickled red onions in apple cider vinegar brine — ready in 1 hour, last 3 weeks. The easiest upgrade for tacos, grain bowls, and sandwiches.',
 true, 'condiment', 5, 0, 8,
 '[{"amount":1,"unit":"large, thinly sliced","name":"red onion"},
   {"amount":0.5,"unit":"cup","name":"apple cider vinegar"},
   {"amount":0.5,"unit":"cup","name":"water"},
   {"amount":1,"unit":"tbsp","name":"sugar"},
   {"amount":1,"unit":"tsp","name":"salt"}]'::jsonb,
 ARRAY[
   'Thinly slice onion using a mandoline or sharp knife.',
   'Heat vinegar, water, sugar, and salt in a small saucepan until sugar dissolves. Do not boil.',
   'Pack onion slices into a clean jar. Pour warm brine over, pressing onions down to submerge.',
   'Cool to room temperature, then refrigerate.',
   'Ready in 1 hour. Best after overnight. Keeps refrigerated 3 weeks.',
   'Optional: add peppercorns, a garlic clove, bay leaf, or coriander seeds.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

-- ── BATTERS / DOUGHS ──────────────────────────────────────────────────────────

(shortcrust_id, 'curated', 'Shortcrust Pastry',
 'The go-to tart and quiche pastry — cold butter rubbed into flour for a crumbly, buttery shell. Works sweet or savoury.',
 true, 'batter', 10, 0, 4,
 '[{"amount":200,"unit":"g","name":"plain flour"},
   {"amount":100,"unit":"g, cold and cubed","name":"unsalted butter"},
   {"amount":1,"unit":"","name":"egg yolk"},
   {"amount":2,"unit":"tbsp, ice cold","name":"water"},
   {"amount":0.5,"unit":"tsp","name":"salt"}]'::jsonb,
 ARRAY[
   'Rub cold butter into flour until mixture resembles fine breadcrumbs. Work quickly — warm hands melt butter.',
   'Add egg yolk to flour mixture. Add ice water 1 tablespoon at a time, mixing until dough just comes together.',
   'Do not overwork. Shape into a disc, wrap in cling film, and rest in the fridge 30 minutes.',
   'Roll on a lightly floured surface to 3mm thickness.',
   'For a sweet version: add 2 tbsp icing sugar and 0.5 tsp vanilla extract.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(rough_puff_id, 'curated', 'Rough Puff Pastry',
 'A shortcut laminated pastry with visible butter chunks — flaky enough for sausage rolls, turnovers, and tarts without the full puff technique.',
 true, 'batter', 15, 0, 4,
 '[{"amount":200,"unit":"g","name":"plain flour"},
   {"amount":150,"unit":"g, cold, cut into 1cm cubes","name":"unsalted butter"},
   {"amount":0.5,"unit":"tsp","name":"salt"},
   {"amount":100,"unit":"ml, ice cold","name":"water"}]'::jsonb,
 ARRAY[
   'Mix flour and salt. Add cold butter cubes — do not rub in. Leave visible chunks.',
   'Add ice cold water and mix with a knife until a shaggy dough forms. Butter pieces should still be visible.',
   'On a floured surface, roll into a long rectangle. Fold into thirds (like a letter). Rotate 90°. Repeat 3 times.',
   'Wrap and chill 30 minutes. Repeat the rolling-and-folding process twice more.',
   'Refrigerate at least 1 hour before use. The visible butter layers create flaky lift when baked.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(pancake_id, 'curated', 'Pancake Batter',
 'Classic thick-and-fluffy pancake batter — flour, baking powder, egg, and milk. Ready in 5 minutes; the trick is not overmixing.',
 true, 'batter', 5, 0, 4,
 '[{"amount":1,"unit":"cup (125 g)","name":"plain flour"},
   {"amount":2,"unit":"tsp","name":"baking powder"},
   {"amount":1,"unit":"tbsp","name":"sugar"},
   {"amount":0.25,"unit":"tsp","name":"salt"},
   {"amount":1,"unit":"cup (250 ml)","name":"milk"},
   {"amount":1,"unit":"large","name":"egg"},
   {"amount":2,"unit":"tbsp, melted","name":"unsalted butter"}]'::jsonb,
 ARRAY[
   'Whisk flour, baking powder, sugar, and salt in a bowl.',
   'Make a well and add milk, egg, and melted butter. Whisk until just smooth — small lumps are fine.',
   'Rest 5 minutes while pan heats to medium.',
   'Pour 1/4 cup per pancake onto a lightly greased hot pan. Flip when bubbles form on surface and edges look set.',
   'For fluffier pancakes: separate the egg, whisk white to stiff peaks, fold in at the end.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb),

(tempura_id, 'curated', 'Tempura Batter',
 'The Japanese secret to impossibly light, shatteringly crisp coating — ice-cold sparkling water and an under-mixed lumpy batter fried at precise temperature.',
 true, 'batter', 5, 0, 4,
 '[{"amount":1,"unit":"cup (120 g)","name":"plain flour or cake flour"},
   {"amount":1,"unit":"cup (240 ml), ice cold","name":"sparkling water"},
   {"amount":1,"unit":"large, chilled","name":"egg yolk"},
   {"amount":0,"unit":"pinch","name":"baking soda"}]'::jsonb,
 ARRAY[
   'Chill your mixing bowl in the freezer 15 minutes beforehand.',
   'Whisk egg yolk into ice cold sparkling water.',
   'Add flour and baking soda all at once. Mix with chopsticks or a fork — only a few strokes. Lumps are essential.',
   'Do not overmix. Keep batter cold throughout frying.',
   'Dip vegetables or seafood immediately before frying at 170–180°C (340–355°F).',
   'Use within 20 minutes — the batter deteriorates quickly.'
 ],
 true,false,false,false,false,true,false,false,true,'ok','{}'::jsonb)

ON CONFLICT (id) DO NOTHING;

END $$;
