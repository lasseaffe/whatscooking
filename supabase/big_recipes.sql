-- ============================================================
-- What's Cooking — Big Recipe Expansion (~90 recipes)
-- Covers: Vegan, Vegetarian, Italian, Asian, Mexican,
--         Mediterranean, American, Breakfast, Soups,
--         Salads, Desserts, Baking, High-Protein, Indian
-- Run AFTER seed.sql, features.sql, more_recipes.sql
-- ============================================================

insert into recipes (
  source, source_name, source_url,
  title, description, image_url,
  cuisine_type, dish_types, dietary_tags,
  ingredients, instructions,
  prep_time_minutes, cook_time_minutes, servings,
  calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg
) values

-- ============================================================
-- VEGAN MAINS
-- ============================================================

('curated','Minimalist Baker','https://minimalistbaker.com/the-best-vegan-lentil-soup/',
 'The Best Red Lentil Soup',
 'Silky, warming, and deeply spiced — this red lentil soup comes together in 30 minutes and tastes like it simmered all day. A pantry-staple masterpiece.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
 'Mediterranean', ARRAY['soup','main course'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"red lentils","amount":300,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"turmeric","amount":1,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"diced tomatoes","amount":400,"unit":"g"},{"name":"vegetable broth","amount":1,"unit":"L"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"olive oil","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Sauté onion in olive oil until golden, ~8 min. Add garlic and spices; cook 1 min.','Add tomatoes, lentils, and broth. Bring to boil, reduce heat.','Simmer 20 min until lentils are completely soft.','Blend half the soup for a creamy texture (optional).','Stir in lemon juice. Season and serve with warm bread.'],
 10, 25, 4, 310, 18, 50, 6, 14, 6, 420),

('curated','Oh She Glows','https://ohsheglows.com/chickpea-coconut-curry/',
 'Chickpea Coconut Curry',
 'Rich coconut milk curry loaded with chickpeas and baby spinach. Ready in 20 minutes — weeknight vegan cooking at its absolute best.',
 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
 'Indian', ARRAY['main course'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"chickpeas","amount":800,"unit":"g (2 cans, drained)"},{"name":"coconut milk","amount":400,"unit":"ml"},{"name":"diced tomatoes","amount":400,"unit":"g"},{"name":"baby spinach","amount":100,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"fresh ginger","amount":1,"unit":"tbsp"},{"name":"curry powder","amount":2,"unit":"tbsp"},{"name":"garam masala","amount":1,"unit":"tsp"},{"name":"olive oil","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Sauté onion until soft. Add garlic, ginger, and spices; cook 2 min.','Add tomatoes and cook down 5 min.','Add chickpeas and coconut milk. Simmer 10 min.','Stir in spinach until wilted.','Serve over basmati rice with naan.'],
 8, 20, 4, 420, 16, 52, 18, 12, 8, 640),

('curated','Cookie and Kate','https://cookieandkate.com/best-vegan-burger-recipe/',
 'Black Bean Smash Burgers',
 'Smoky, satisfying black bean patties with crispy edges and a meaty chew. Top with avocado, pickled red onion, and chipotle mayo.',
 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80',
 'American', ARRAY['main course'], ARRAY['vegan','vegetarian','dairy-free'],
 '[{"name":"black beans","amount":800,"unit":"g (2 cans, drained)"},{"name":"oats","amount":80,"unit":"g"},{"name":"soy sauce","amount":2,"unit":"tbsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"garlic powder","amount":1,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"burger buns","amount":4,"unit":"whole wheat"},{"name":"avocado","amount":1,"unit":"large"},{"name":"red onion","amount":0.5,"unit":"small"}]'::jsonb,
 ARRAY['Drain and pat beans dry. Mash well leaving some texture.','Mix in oats, soy sauce, and spices. Form 4 patties.','Cook in a hot cast-iron pan 4 min per side, pressing flat.','Toast buns. Layer with avocado, pickled onion, chipotle mayo.'],
 15, 15, 4, 380, 16, 58, 10, 14, 4, 720),

('curated','Serious Eats','https://www.seriouseats.com/vegan-mushroom-ragu-pasta',
 'Mushroom & Walnut Ragu',
 'A rich, deeply umami ragu made entirely from mushrooms and walnuts — no meat needed. Serve over pappardelle for a showstopping vegan dinner.',
 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=800&q=80',
 'Italian', ARRAY['main course','pasta'], ARRAY['vegan','vegetarian','dairy-free'],
 '[{"name":"mixed mushrooms","amount":700,"unit":"g"},{"name":"walnuts","amount":100,"unit":"g"},{"name":"pappardelle","amount":400,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"red wine","amount":120,"unit":"ml"},{"name":"rosemary","amount":2,"unit":"sprigs"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"nutritional yeast","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Pulse mushrooms and walnuts in food processor until finely chopped.','Cook onion in olive oil until golden. Add garlic and rosemary.','Add mushroom-walnut mix; cook on high heat until all moisture evaporates (~12 min).','Add tomato paste, cook 2 min. Deglaze with red wine.','Simmer 10 min. Toss with cooked pasta and nutritional yeast.'],
 10, 30, 4, 580, 22, 72, 22, 8, 6, 420),

('curated','Minimalist Baker','https://minimalistbaker.com/1-pot-vegan-chili/',
 '1-Pot Vegan Chili',
 'Hearty, smoky, and packed with three kinds of beans. This one-pot wonder is even better the next day — make a big batch and eat all week.',
 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
 'American', ARRAY['main course','soup'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"kidney beans","amount":400,"unit":"g (1 can)"},{"name":"black beans","amount":400,"unit":"g (1 can)"},{"name":"pinto beans","amount":400,"unit":"g (1 can)"},{"name":"diced tomatoes","amount":800,"unit":"g"},{"name":"corn","amount":200,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"bell peppers","amount":2,"unit":"large"},{"name":"chili powder","amount":3,"unit":"tbsp"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Sauté onion and peppers until soft. Add spices; cook 1 min.','Add all beans, tomatoes, and corn. Stir well.','Simmer 30 min, stirring occasionally.','Adjust seasoning. Serve with corn bread, sour cream (vegan), or shredded cheese.'],
 10, 35, 6, 340, 18, 60, 4, 18, 10, 680),

('curated','Oh She Glows','https://ohsheglows.com/roasted-cauliflower-tacos/',
 'Crispy Cauliflower Tacos',
 'Caramelised spiced cauliflower in warm corn tortillas with quick pickled cabbage, creamy chipotle sauce, and fresh cilantro. Better than most meat tacos.',
 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
 'Mexican', ARRAY['main course'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"cauliflower","amount":1,"unit":"large head"},{"name":"corn tortillas","amount":8,"unit":"small"},{"name":"red cabbage","amount":200,"unit":"g (shredded)"},{"name":"apple cider vinegar","amount":2,"unit":"tbsp"},{"name":"chipotle in adobo","amount":2,"unit":"peppers"},{"name":"vegan mayo","amount":4,"unit":"tbsp"},{"name":"lime","amount":2,"unit":"whole"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"cilantro","amount":20,"unit":"g"}]'::jsonb,
 ARRAY['Toss cauliflower florets with oil, cumin, paprika, salt. Roast at 425°F (220°C) 25 min until caramelised.','Quick-pickle cabbage: toss with vinegar, lime juice, salt; set aside 15 min.','Blend chipotle peppers with mayo for sauce.','Warm tortillas. Fill with cauliflower, pickled cabbage, chipotle mayo, and cilantro.'],
 15, 25, 4, 320, 8, 48, 10, 10, 8, 540),

('curated','Cookie and Kate','https://cookieandkate.com/vegan-buddha-bowl-recipe/',
 'Rainbow Buddha Bowl',
 'A nourishing bowl of roasted sweet potato, brown rice, edamame, avocado, and red cabbage drizzled with a life-changing tahini lemon dressing.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'Asian', ARRAY['main course','salad'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"sweet potato","amount":2,"unit":"medium"},{"name":"brown rice","amount":200,"unit":"g"},{"name":"edamame","amount":150,"unit":"g (shelled)"},{"name":"avocado","amount":1,"unit":"large"},{"name":"red cabbage","amount":150,"unit":"g (shredded)"},{"name":"chickpeas","amount":400,"unit":"g (1 can)"},{"name":"tahini","amount":3,"unit":"tbsp"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"garlic","amount":1,"unit":"clove"},{"name":"maple syrup","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Cube sweet potato; toss with oil, salt. Roast at 400°F (200°C) 25 min.','Cook rice. Warm edamame.','Whisk tahini, lemon, garlic, maple syrup, and 3 tbsp water for dressing.','Assemble bowls: rice base, sweet potato, edamame, avocado, cabbage, chickpeas.','Drizzle generously with tahini dressing.'],
 15, 30, 2, 620, 22, 80, 24, 18, 8, 480),

-- ============================================================
-- VEGETARIAN MAINS
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/mushroom-bourguignon',
 'Mushroom Bourguignon',
 'The vegetarian take on the French classic — cremini and portobello mushrooms braised in red wine until meltingly tender. Serve over silky mashed potatoes.',
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
 'French', ARRAY['main course'], ARRAY['vegetarian'],
 '[{"name":"cremini mushrooms","amount":500,"unit":"g"},{"name":"portobello mushrooms","amount":300,"unit":"g"},{"name":"pearl onions","amount":200,"unit":"g"},{"name":"carrots","amount":2,"unit":"medium"},{"name":"red wine","amount":240,"unit":"ml"},{"name":"vegetable broth","amount":400,"unit":"ml"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"thyme","amount":4,"unit":"sprigs"},{"name":"butter","amount":3,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"}]'::jsonb,
 ARRAY['Brown mushrooms in butter in batches; set aside.','Cook pearl onions and carrots 5 min. Add garlic and tomato paste; cook 2 min.','Add wine; simmer 5 min. Add broth and thyme.','Return mushrooms; cover and simmer 25 min.','Thicken with a butter-flour paste if desired. Serve over mash.'],
 15, 40, 4, 320, 10, 28, 14, 6, 8, 580),

('curated','Cookie and Kate','https://cookieandkate.com/spinach-artichoke-lasagna/',
 'Spinach & Ricotta Lasagna',
 'Layers of creamy ricotta, wilted spinach, and tangy marinara between fresh pasta sheets. Vegetarian comfort food that satisfies everyone at the table.',
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
 'Italian', ARRAY['main course','pasta'], ARRAY['vegetarian'],
 '[{"name":"lasagna sheets","amount":12,"unit":"sheets"},{"name":"ricotta","amount":500,"unit":"g"},{"name":"frozen spinach","amount":300,"unit":"g (thawed, squeezed)"},{"name":"eggs","amount":2,"unit":"large"},{"name":"marinara sauce","amount":700,"unit":"ml"},{"name":"mozzarella","amount":250,"unit":"g"},{"name":"parmesan","amount":60,"unit":"g"},{"name":"nutmeg","amount":0.25,"unit":"tsp"},{"name":"garlic","amount":3,"unit":"cloves"}]'::jsonb,
 ARRAY['Mix ricotta, eggs, spinach, garlic, nutmeg, half the parmesan. Season well.','Spread thin layer of marinara in dish. Layer pasta, ricotta mix, marinara, mozzarella. Repeat.','Top with remaining marinara, mozzarella, and parmesan.','Cover with foil; bake 45 min at 375°F (190°C). Uncover last 15 min to brown.','Rest 15 min before serving.'],
 20, 60, 8, 480, 28, 48, 20, 4, 10, 840),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/eggplant-parmesan',
 'Classic Eggplant Parmesan',
 'Breaded, pan-fried eggplant layered with marinara and molten mozzarella. Salting the eggplant is the extra step that makes all the difference.',
 'https://images.unsplash.com/photo-1648146227349-2ea2f7fcb7d7?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY['vegetarian'],
 '[{"name":"eggplant","amount":2,"unit":"large"},{"name":"breadcrumbs","amount":150,"unit":"g"},{"name":"parmesan","amount":80,"unit":"g"},{"name":"eggs","amount":3,"unit":"large"},{"name":"marinara sauce","amount":600,"unit":"ml"},{"name":"mozzarella","amount":300,"unit":"g"},{"name":"olive oil","amount":6,"unit":"tbsp"},{"name":"basil","amount":20,"unit":"g"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
 ARRAY['Slice eggplant 1cm thick. Salt; rest 30 min. Pat very dry.','Dip in egg, then breadcrumb-parmesan mix. Pan-fry until golden; drain on paper towel.','Layer in baking dish: marinara, eggplant, mozzarella. Repeat.','Bake at 375°F (190°C) 35 min until bubbling and golden.','Finish with fresh basil.'],
 40, 35, 6, 420, 20, 36, 22, 8, 12, 920),

('curated','Cookie and Kate','https://cookieandkate.com/best-falafel-recipe/',
 'Crispy Homemade Falafel',
 'Crispy outside, fluffy inside — made the right way with dried (not canned) chickpeas. Serve in warm pita with tahini, cucumber, and pickled vegetables.',
 'https://images.unsplash.com/photo-1593001872095-7d5b3868dd20?w=800&q=80',
 'Mediterranean', ARRAY['main course','side dish'], ARRAY['vegan','vegetarian','dairy-free'],
 '[{"name":"dried chickpeas","amount":300,"unit":"g (soaked overnight)"},{"name":"fresh parsley","amount":30,"unit":"g"},{"name":"fresh cilantro","amount":20,"unit":"g"},{"name":"onion","amount":1,"unit":"small"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"coriander","amount":1,"unit":"tsp"},{"name":"baking powder","amount":1,"unit":"tsp"},{"name":"flour","amount":2,"unit":"tbsp"},{"name":"oil","amount":500,"unit":"ml (for frying)"}]'::jsonb,
 ARRAY['Do not cook the chickpeas — just soak overnight and drain.','Pulse chickpeas, herbs, onion, garlic, spices in food processor until fine but not paste.','Mix in flour and baking powder. Refrigerate 1 hr.','Form into balls or patties. Deep fry at 350°F (175°C) 3–4 min until dark golden.','Drain on paper towels. Serve immediately.'],
 20, 15, 4, 380, 16, 48, 14, 10, 4, 480),

('curated','Minimalist Baker','https://minimalistbaker.com/sweet-potato-black-bean-enchiladas/',
 'Sweet Potato & Black Bean Enchiladas',
 'Tender sweet potato and black beans rolled in corn tortillas, smothered in homemade enchilada sauce and melted cheese. A vegetarian crowd-pleaser.',
 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=800&q=80',
 'Mexican', ARRAY['main course'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"sweet potatoes","amount":2,"unit":"medium"},{"name":"black beans","amount":400,"unit":"g (1 can)"},{"name":"corn tortillas","amount":8,"unit":"large"},{"name":"enchilada sauce","amount":400,"unit":"ml"},{"name":"cheddar cheese","amount":180,"unit":"g"},{"name":"red onion","amount":1,"unit":"small"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"chili powder","amount":1,"unit":"tsp"},{"name":"cilantro","amount":20,"unit":"g"},{"name":"lime","amount":1,"unit":"whole"}]'::jsonb,
 ARRAY['Cube and roast sweet potato at 400°F 20 min. Mix with drained beans, onion, and spices.','Warm tortillas to make pliable. Fill each with potato-bean mix; roll up.','Place seam-down in baking dish. Pour enchilada sauce over top.','Top with cheese. Bake 20 min at 375°F until bubbly.','Serve with cilantro, lime, and sour cream.'],
 20, 40, 4, 450, 18, 62, 16, 12, 8, 780),

-- ============================================================
-- ASIAN MAINS
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/japanese-beef-gyudon',
 'Gyudon (Japanese Beef Bowl)',
 'Tender, sweet-savory beef and onions over steamed rice — Japan''s most beloved comfort food. Ready in 20 minutes, tastes like it simmered for hours.',
 'https://images.unsplash.com/photo-1569000030695-e27e7b79ecbd?w=800&q=80',
 'Japanese', ARRAY['main course'], ARRAY['dairy-free'],
 '[{"name":"thinly sliced beef ribeye","amount":400,"unit":"g"},{"name":"onion","amount":2,"unit":"medium"},{"name":"dashi stock","amount":200,"unit":"ml"},{"name":"soy sauce","amount":3,"unit":"tbsp"},{"name":"mirin","amount":3,"unit":"tbsp"},{"name":"sake","amount":2,"unit":"tbsp"},{"name":"sugar","amount":1,"unit":"tsp"},{"name":"steamed rice","amount":2,"unit":"cups"},{"name":"pickled ginger","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Combine dashi, soy, mirin, sake, and sugar in a wide pan. Bring to simmer.','Add sliced onions; cook 8 min until soft and translucent.','Add beef in a single layer; cook 3–4 min, gently turning.','Spoon over bowls of steamed rice. Top with pickled ginger.'],
 5, 20, 2, 580, 40, 62, 16, 2, 8, 980),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/miso-glazed-salmon',
 'Miso Glazed Salmon',
 'White miso, mirin, and sugar form a lacquer-like glaze that caramelises under the broiler. Five ingredients, five minutes of prep, restaurant-quality result.',
 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
 'Japanese', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"salmon fillets","amount":4,"unit":"150g each"},{"name":"white miso","amount":3,"unit":"tbsp"},{"name":"mirin","amount":2,"unit":"tbsp"},{"name":"sake","amount":1,"unit":"tbsp"},{"name":"sugar","amount":1,"unit":"tsp"},{"name":"sesame seeds","amount":1,"unit":"tbsp"},{"name":"scallions","amount":2,"unit":"stalks"}]'::jsonb,
 ARRAY['Whisk miso, mirin, sake, and sugar into a smooth paste.','Coat salmon fillets; marinate 30 min (or up to overnight).','Wipe off excess glaze. Broil 6–8 min until caramelised and just cooked through.','Top with sesame seeds and scallions. Serve with rice and steamed bok choy.'],
 5, 8, 4, 380, 42, 12, 16, 0, 8, 720),

('curated','Serious Eats','https://www.seriouseats.com/kung-pao-chicken',
 'Kung Pao Chicken',
 'The Sichuan classic done right: tender chicken, crunchy peanuts, dried chillies, and that addictive numbing kick from Sichuan peppercorns.',
 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80',
 'Chinese', ARRAY['main course'], ARRAY['dairy-free'],
 '[{"name":"chicken thigh","amount":500,"unit":"g"},{"name":"roasted peanuts","amount":80,"unit":"g"},{"name":"dried red chillies","amount":8,"unit":"whole"},{"name":"Sichuan peppercorns","amount":1,"unit":"tsp"},{"name":"soy sauce","amount":3,"unit":"tbsp"},{"name":"rice vinegar","amount":2,"unit":"tbsp"},{"name":"hoisin sauce","amount":1,"unit":"tbsp"},{"name":"sugar","amount":1,"unit":"tsp"},{"name":"cornstarch","amount":2,"unit":"tsp"},{"name":"scallions","amount":3,"unit":"stalks"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"ginger","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Dice chicken; marinate in soy sauce, cornstarch, a little sugar, 15 min.','Mix remaining soy, vinegar, hoisin, sugar for sauce.','Stir-fry chillies and peppercorns in smoking-hot oil 30 sec.','Add chicken; cook until golden. Add garlic and ginger.','Pour in sauce; toss. Finish with peanuts and scallions.'],
 20, 12, 3, 460, 38, 20, 24, 3, 6, 1100),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/ramen-tonkotsu',
 'Tonkotsu Ramen',
 'Creamy, rich pork bone broth, springy noodles, chashu pork, a soft-boiled egg, and nori. A weekend project that results in the best bowl of ramen you''ve ever had at home.',
 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&q=80',
 'Japanese', ARRAY['main course','soup'], ARRAY['dairy-free'],
 '[{"name":"pork neck bones","amount":1.5,"unit":"kg"},{"name":"ramen noodles","amount":400,"unit":"g"},{"name":"pork belly","amount":400,"unit":"g"},{"name":"eggs","amount":4,"unit":"large"},{"name":"soy sauce","amount":4,"unit":"tbsp"},{"name":"mirin","amount":3,"unit":"tbsp"},{"name":"sake","amount":3,"unit":"tbsp"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"ginger","amount":3,"unit":"slices"},{"name":"nori sheets","amount":4,"unit":"sheets"},{"name":"scallions","amount":4,"unit":"stalks"}]'::jsonb,
 ARRAY['Blanch bones 10 min; discard water. Cover with fresh water and boil hard 8 hrs, topping up as needed.','Meanwhile: roll and tie pork belly; braise in soy, mirin, sake, garlic, ginger 2 hrs. Slice when cool.','Marinate soft-boiled eggs (7 min) in braising liquid 4 hrs.','Season broth with soy and mirin. Portion into bowls.','Add cooked noodles, chashu slices, egg (halved), nori, scallions.'],
 30, 480, 4, 780, 52, 68, 28, 3, 4, 1600),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/korean-braised-short-ribs-galbi-jjim',
 'Korean Braised Short Ribs (Galbi Jjim)',
 'Fall-off-the-bone beef short ribs braised in a sweet-savory sauce with pear, soy, and sesame. A Korean celebration dish — now made for a Tuesday.',
 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
 'Korean', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"beef short ribs","amount":1.2,"unit":"kg"},{"name":"soy sauce","amount":6,"unit":"tbsp"},{"name":"Korean pear","amount":1,"unit":"medium (grated)"},{"name":"sesame oil","amount":2,"unit":"tbsp"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"ginger","amount":2,"unit":"tsp"},{"name":"brown sugar","amount":2,"unit":"tbsp"},{"name":"carrots","amount":2,"unit":"medium"},{"name":"shiitake mushrooms","amount":150,"unit":"g"},{"name":"scallions","amount":4,"unit":"stalks"}]'::jsonb,
 ARRAY['Soak ribs in cold water 1 hr; blanch 5 min. Rinse.','Mix soy, pear, garlic, ginger, sugar, sesame oil for marinade.','Place ribs and marinade in Dutch oven. Add enough water to cover halfway.','Braise covered at 325°F (165°C) for 2 hrs.','Add carrots and mushrooms; braise 30 min more. Garnish with scallions.'],
 20, 150, 4, 620, 48, 24, 34, 3, 12, 1200),

('curated','Serious Eats','https://www.seriouseats.com/thai-green-curry-chicken',
 'Thai Green Curry',
 'Fragrant, creamy, and fiery — a proper green curry made with store-bought paste elevated by fish sauce, palm sugar, and fresh Thai basil.',
 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
 'Thai', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"chicken breast","amount":500,"unit":"g"},{"name":"coconut milk","amount":400,"unit":"ml"},{"name":"green curry paste","amount":3,"unit":"tbsp"},{"name":"Thai eggplant","amount":200,"unit":"g"},{"name":"fish sauce","amount":2,"unit":"tbsp"},{"name":"palm sugar","amount":1,"unit":"tbsp"},{"name":"Thai basil","amount":20,"unit":"g"},{"name":"kaffir lime leaves","amount":4,"unit":"leaves"},{"name":"lemongrass","amount":2,"unit":"stalks"},{"name":"vegetable oil","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Fry curry paste in the thick top of the coconut milk 2–3 min until fragrant.','Add remaining coconut milk, lemongrass, lime leaves. Bring to gentle simmer.','Add chicken; cook 10 min. Add eggplant.','Season with fish sauce and palm sugar.','Finish with Thai basil. Serve with jasmine rice.'],
 10, 20, 4, 480, 40, 16, 28, 3, 8, 900),

-- ============================================================
-- MEXICAN & LATIN
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/chicken-enchiladas-red-sauce',
 'Red Enchiladas with Roasted Chicken',
 'Homemade ancho-guajillo sauce smothering pulled chicken enchiladas — this is the real deal, not the jarred-sauce version.',
 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=800&q=80',
 'Mexican', ARRAY['main course'], ARRAY['gluten-free'],
 '[{"name":"rotisserie chicken","amount":1,"unit":"whole (shredded)"},{"name":"corn tortillas","amount":12,"unit":"small"},{"name":"dried ancho chillies","amount":4,"unit":"whole"},{"name":"dried guajillo chillies","amount":4,"unit":"whole"},{"name":"diced tomatoes","amount":400,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"chicken broth","amount":240,"unit":"ml"},{"name":"cheddar cheese","amount":200,"unit":"g"},{"name":"cumin","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Toast dried chillies in a dry pan 30 sec; soak in hot water 20 min.','Blend chillies, tomatoes, onion, garlic, broth, cumin until smooth. Simmer 10 min.','Dip tortillas in warm sauce; fill with chicken and a little cheese; roll.','Place seam-down; pour remaining sauce over. Top with cheese.','Bake 20 min at 375°F. Serve with rice and beans.'],
 25, 35, 6, 480, 36, 44, 16, 5, 6, 860),

('curated','AllRecipes','https://www.allrecipes.com/recipe/fish-tacos-baja',
 'Baja Fish Tacos',
 'Beer-battered white fish with shredded cabbage, crema, pico de gallo, and avocado in warm corn tortillas. Instant vacation in a taco.',
 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800&q=80',
 'Mexican', ARRAY['main course'], ARRAY['dairy-free'],
 '[{"name":"cod or tilapia","amount":600,"unit":"g"},{"name":"corn tortillas","amount":12,"unit":"small"},{"name":"beer","amount":180,"unit":"ml"},{"name":"flour","amount":120,"unit":"g"},{"name":"cabbage","amount":200,"unit":"g (shredded)"},{"name":"avocado","amount":2,"unit":"large"},{"name":"lime","amount":2,"unit":"whole"},{"name":"pico de gallo","amount":200,"unit":"g"},{"name":"Mexican crema","amount":4,"unit":"tbsp"},{"name":"cumin","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Mix flour, cumin, and beer into a smooth batter.','Dip fish pieces in batter; fry at 350°F until golden and cooked through, ~4 min.','Warm tortillas.','Assemble: cabbage, fish, avocado, pico de gallo, crema, lime squeeze.'],
 15, 15, 4, 520, 34, 52, 18, 6, 4, 680),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/carne-asada',
 'Carne Asada',
 'Citrus-marinated, perfectly charred skirt steak sliced thin. Use it in tacos, burritos, or serve with rice and beans for a classic plate.',
 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=800&q=80',
 'Mexican', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"skirt steak","amount":700,"unit":"g"},{"name":"orange juice","amount":60,"unit":"ml"},{"name":"lime juice","amount":3,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"chili powder","amount":1,"unit":"tsp"},{"name":"fresh cilantro","amount":20,"unit":"g"},{"name":"jalapeño","amount":1,"unit":"whole"},{"name":"olive oil","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Blend marinade: citrus juices, garlic, cumin, chili, jalapeño, cilantro, oil.','Marinate steak 2–4 hrs (not overnight — the acid will cook the surface).','Grill on screaming-hot grill 3–4 min per side for medium-rare.','Rest 5 min. Slice against the grain into thin strips.','Serve in warm tortillas with guacamole and salsa.'],
 10, 10, 4, 440, 44, 6, 26, 1, 4, 560),

-- ============================================================
-- MEDITERRANEAN & MIDDLE EASTERN
-- ============================================================

('curated','Cookie and Kate','https://cookieandkate.com/moroccan-chickpea-soup/',
 'Moroccan Chickpea & Harissa Soup',
 'A bold, warming soup fragrant with cumin, cinnamon, harissa, and lemon. Dinner-party worthy but ready in 30 minutes.',
 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
 'Moroccan', ARRAY['soup','main course'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"chickpeas","amount":800,"unit":"g (2 cans)"},{"name":"diced tomatoes","amount":400,"unit":"g"},{"name":"vegetable broth","amount":800,"unit":"ml"},{"name":"harissa","amount":2,"unit":"tbsp"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"cinnamon","amount":0.5,"unit":"tsp"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"fresh cilantro","amount":20,"unit":"g"}]'::jsonb,
 ARRAY['Sauté onion until soft. Add garlic, cumin, cinnamon; cook 1 min.','Add harissa, tomatoes, chickpeas, and broth.','Simmer 20 min. Mash some chickpeas against the side of the pot.','Stir in lemon juice. Season.','Serve with cilantro and flatbread.'],
 8, 25, 4, 320, 16, 52, 8, 14, 8, 720),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/baked-feta-pasta',
 'Baked Feta Pasta',
 'The viral TikTok sensation that became a classic. A block of feta bakes down into a rich, creamy sauce with burst cherry tomatoes. Serve over rigatoni.',
 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
 'Mediterranean', ARRAY['main course','pasta'], ARRAY['vegetarian'],
 '[{"name":"cherry tomatoes","amount":600,"unit":"g"},{"name":"feta block","amount":200,"unit":"g"},{"name":"rigatoni","amount":400,"unit":"g"},{"name":"olive oil","amount":5,"unit":"tbsp"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"red pepper flakes","amount":0.5,"unit":"tsp"},{"name":"fresh basil","amount":20,"unit":"g"},{"name":"black pepper","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Place tomatoes in baking dish. Add whole garlic cloves. Drizzle with olive oil, season.','Place feta block in the centre. Drizzle with more oil, add pepper flakes.','Bake at 400°F (200°C) for 35 min until tomatoes burst and feta is golden.','Meanwhile cook pasta. Reserve ½ cup pasta water.','Smash feta and tomatoes into a sauce. Toss with pasta, adding pasta water to loosen. Top with basil.'],
 5, 35, 4, 540, 20, 72, 22, 4, 8, 780),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/baba-ganoush',
 'Smoky Baba Ganoush',
 'Charred eggplant blended with tahini, lemon, and garlic into a silky, smoky dip. Serve with warm pita and crudités — addictive doesn''t cover it.',
 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=800&q=80',
 'Mediterranean', ARRAY['side dish','dip'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"eggplants","amount":2,"unit":"large"},{"name":"tahini","amount":4,"unit":"tbsp"},{"name":"lemon juice","amount":3,"unit":"tbsp"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"cumin","amount":0.5,"unit":"tsp"},{"name":"smoked paprika","amount":0.5,"unit":"tsp"},{"name":"parsley","amount":10,"unit":"g"}]'::jsonb,
 ARRAY['Char eggplants directly over a gas flame or under broiler, turning, until completely collapsed and blackened, ~20 min.','Cool, then peel. Squeeze out excess liquid.','Mash flesh; mix with tahini, lemon, garlic, cumin, olive oil.','Serve in a bowl drizzled with olive oil and paprika. Finish with parsley.'],
 5, 20, 6, 160, 4, 14, 10, 5, 4, 280),

('curated','Serious Eats','https://www.seriouseats.com/lamb-kofta-kebabs',
 'Lamb Kofta Kebabs',
 'Spiced ground lamb on skewers, grilled until charred outside and juicy within. Serve with tzatziki, pita, and a fresh tomato salad.',
 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
 'Mediterranean', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"ground lamb","amount":700,"unit":"g"},{"name":"onion","amount":1,"unit":"small (grated)"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"coriander","amount":1,"unit":"tsp"},{"name":"cinnamon","amount":0.5,"unit":"tsp"},{"name":"cayenne","amount":0.25,"unit":"tsp"},{"name":"fresh parsley","amount":20,"unit":"g"},{"name":"fresh mint","amount":10,"unit":"g"},{"name":"salt","amount":1.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Mix all ingredients well — knead 2 min for good texture.','Form around flat metal skewers, squeezing firmly.','Grill on high heat 8–10 min, turning, until nicely charred.','Serve with warm pita, tzatziki, sliced tomato, and red onion.'],
 15, 10, 4, 480, 36, 4, 34, 1, 2, 680),

-- ============================================================
-- AMERICAN / COMFORT
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/southern-fried-chicken',
 'Southern Fried Chicken',
 'Double-dipped, cast-iron-fried chicken with an ultra-craggy crust and juicy, brined meat. The definitive version after years of testing.',
 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
 'American', ARRAY['main course'], ARRAY['dairy-free'],
 '[{"name":"chicken pieces","amount":1.5,"unit":"kg"},{"name":"buttermilk","amount":480,"unit":"ml"},{"name":"all-purpose flour","amount":300,"unit":"g"},{"name":"paprika","amount":2,"unit":"tsp"},{"name":"garlic powder","amount":1,"unit":"tsp"},{"name":"onion powder","amount":1,"unit":"tsp"},{"name":"cayenne","amount":0.5,"unit":"tsp"},{"name":"salt","amount":2,"unit":"tsp"},{"name":"vegetable oil","amount":1,"unit":"L (for frying)"}]'::jsonb,
 ARRAY['Salt chicken well; soak in buttermilk overnight.','Mix flour with all spices.','Dredge chicken in flour; dip back in buttermilk; dredge in flour again (double coat).','Fry at 325°F (165°C) turning once — thighs 15 min, breasts 12 min.','Drain and rest 5 min before serving.'],
 20, 30, 4, 680, 52, 36, 30, 2, 2, 1100),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/beef-stew',
 'Classic Beef Stew',
 'Chuck beef slow-braised with root vegetables in a rich red wine broth. The kind of stew your grandma made — and that ruins all other stews for you forever.',
 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&q=80',
 'American', ARRAY['main course','soup'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"beef chuck","amount":1,"unit":"kg"},{"name":"red wine","amount":240,"unit":"ml"},{"name":"beef broth","amount":600,"unit":"ml"},{"name":"carrots","amount":3,"unit":"large"},{"name":"potatoes","amount":4,"unit":"medium"},{"name":"onion","amount":2,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"thyme","amount":4,"unit":"sprigs"},{"name":"bay leaves","amount":2,"unit":"whole"}]'::jsonb,
 ARRAY['Season and brown beef in batches; set aside.','Cook onion until golden. Add garlic and tomato paste; cook 2 min.','Deglaze with wine; reduce 5 min. Add broth, thyme, bay.','Return beef; braise covered at 300°F (150°C) for 2 hrs.','Add carrots and potatoes; cook 40 min more. Season well.'],
 20, 180, 6, 560, 46, 32, 22, 5, 6, 760),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/macaroni-cheese',
 'The Ultimate Mac & Cheese',
 'Three cheeses, a roux-based sauce, toasted breadcrumb top. This is mac and cheese taken seriously — baked until golden and bubbling.',
 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80',
 'American', ARRAY['main course','side dish'], ARRAY['vegetarian'],
 '[{"name":"macaroni","amount":400,"unit":"g"},{"name":"sharp cheddar","amount":250,"unit":"g"},{"name":"gruyère","amount":150,"unit":"g"},{"name":"parmesan","amount":50,"unit":"g"},{"name":"whole milk","amount":600,"unit":"ml"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"flour","amount":4,"unit":"tbsp"},{"name":"mustard powder","amount":1,"unit":"tsp"},{"name":"nutmeg","amount":0.25,"unit":"tsp"},{"name":"panko breadcrumbs","amount":80,"unit":"g"}]'::jsonb,
 ARRAY['Cook pasta 2 min under al dente; drain.','Make roux: melt butter, add flour, cook 2 min. Gradually whisk in milk.','Simmer until thick; remove from heat. Add cheddar, gruyère, mustard, nutmeg.','Combine with pasta in baking dish. Top with parmesan and panko.','Bake at 400°F (200°C) 25 min until golden and bubbling.'],
 15, 30, 6, 620, 28, 64, 28, 3, 8, 880),

('curated','AllRecipes','https://www.allrecipes.com/recipe/chicken-pot-pie',
 'Chicken Pot Pie',
 'Creamy chicken and vegetable filling under a shattering golden crust — the ultimate American comfort food. Use store-bought pastry to make it weeknight-friendly.',
 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800&q=80',
 'American', ARRAY['main course'], ARRAY[''],
 '[{"name":"rotisserie chicken","amount":1,"unit":"whole (shredded)"},{"name":"frozen mixed vegetables","amount":300,"unit":"g"},{"name":"chicken broth","amount":400,"unit":"ml"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"flour","amount":4,"unit":"tbsp"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"thyme","amount":1,"unit":"tsp"},{"name":"puff pastry","amount":2,"unit":"sheets (store-bought)"}]'::jsonb,
 ARRAY['Cook onion in butter until soft. Add garlic, flour; cook 2 min.','Whisk in broth and cream. Simmer until thick.','Add chicken, vegetables, and thyme. Season well.','Pour into pie dish. Top with pastry; crimp edges, cut steam vents.','Brush with egg wash. Bake at 400°F (200°C) 30 min until golden.'],
 20, 35, 6, 560, 34, 44, 24, 4, 6, 840),

-- ============================================================
-- ITALIAN
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/carbonara',
 'Spaghetti Carbonara',
 'Silky eggs, cured pork, and Pecorino Romano in a sauce that''s never touched heat. The Roman technique that makes all the difference.',
 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
 'Italian', ARRAY['main course','pasta'], ARRAY[''],
 '[{"name":"spaghetti","amount":400,"unit":"g"},{"name":"guanciale (or pancetta)","amount":200,"unit":"g"},{"name":"Pecorino Romano","amount":80,"unit":"g"},{"name":"Parmesan","amount":40,"unit":"g"},{"name":"egg yolks","amount":4,"unit":"large"},{"name":"whole egg","amount":1,"unit":"large"},{"name":"black pepper","amount":2,"unit":"tsp"}]'::jsonb,
 ARRAY['Cook guanciale in a dry pan until crispy fat renders. Remove from heat; cool slightly.','Whisk egg yolks, whole egg, and both cheeses. Season with lots of pepper.','Cook pasta in well-salted water; reserve 1 cup pasta water.','Add hot pasta to guanciale pan OFF heat. Add egg mix, tossing vigorously.','Stream in pasta water to create a glossy sauce. Serve immediately.'],
 5, 12, 4, 620, 28, 72, 22, 3, 2, 960),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/osso-buco',
 'Osso Buco',
 'Braised veal shanks in white wine and tomato with a gremolata finish. The classic Milanese Sunday lunch — braise low and slow and you''ll be rewarded.',
 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY['gluten-free'],
 '[{"name":"veal shanks","amount":4,"unit":"thick-cut"},{"name":"white wine","amount":240,"unit":"ml"},{"name":"crushed tomatoes","amount":400,"unit":"g"},{"name":"beef broth","amount":240,"unit":"ml"},{"name":"onion","amount":1,"unit":"large"},{"name":"carrots","amount":2,"unit":"medium"},{"name":"celery","amount":2,"unit":"stalks"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"lemon zest","amount":1,"unit":"tsp"},{"name":"parsley","amount":3,"unit":"tbsp"},{"name":"flour","amount":4,"unit":"tbsp"}]'::jsonb,
 ARRAY['Tie shanks; dredge in flour; brown on all sides in olive oil. Set aside.','Cook onion, carrot, celery until soft. Add garlic 1 min.','Add wine; reduce half. Add tomatoes and broth.','Return shanks; braise covered at 325°F (165°C) for 90 min until fork-tender.','Serve topped with gremolata (lemon zest + garlic + parsley) over risotto or polenta.'],
 20, 100, 4, 560, 48, 18, 24, 4, 6, 780),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/pizza-margherita',
 'Neapolitan Pizza Margherita',
 'A thin, bubbly, charred-edge crust with san Marzano tomatoes, fresh mozzarella, and basil. A hot oven and a rested dough are all you need.',
 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY['vegetarian'],
 '[{"name":"pizza dough","amount":600,"unit":"g"},{"name":"San Marzano tomatoes","amount":400,"unit":"g"},{"name":"fresh mozzarella","amount":250,"unit":"g"},{"name":"fresh basil","amount":20,"unit":"g"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Rest dough at room temp 2 hrs. Preheat oven to its maximum (500°F+) with a baking steel or stone inside.','Crush tomatoes by hand; season with salt and olive oil.','Stretch dough thin on a floured surface.','Spoon tomato sauce, add torn mozzarella.','Bake 7–9 min until edges are charred. Finish with fresh basil and a drizzle of oil.'],
 15, 9, 3, 480, 22, 62, 16, 3, 6, 820),

('curated','Serious Eats','https://www.seriouseats.com/tiramisu',
 'Classic Tiramisu',
 'Espresso-soaked ladyfingers layered with a mascarpone cream that''s been whipped to airy perfection. The Italian dessert that everyone needs to make at least once.',
 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80',
 'Italian', ARRAY['dessert'], ARRAY['vegetarian'],
 '[{"name":"ladyfinger cookies","amount":200,"unit":"g"},{"name":"mascarpone","amount":500,"unit":"g"},{"name":"eggs","amount":4,"unit":"large"},{"name":"sugar","amount":100,"unit":"g"},{"name":"strong espresso","amount":240,"unit":"ml"},{"name":"coffee liqueur","amount":2,"unit":"tbsp"},{"name":"cocoa powder","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Whisk egg yolks and sugar until pale and thick.','Fold in mascarpone until smooth.','Whip whites to stiff peaks; fold into mascarpone mix.','Dip ladyfingers briefly in espresso-liqueur mix; layer in dish.','Spread cream; repeat. Dust heavily with cocoa. Refrigerate 6 hrs.'],
 30, 0, 8, 380, 8, 32, 26, 1, 22, 140),

-- ============================================================
-- BREAKFAST & BRUNCH
-- ============================================================

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/eggs-benedict',
 'Eggs Benedict',
 'Poached eggs on toasted English muffins with Canadian bacon and a silky, never-broken hollandaise. Master this and brunch is yours forever.',
 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
 'American', ARRAY['breakfast','brunch'], ARRAY[''],
 '[{"name":"eggs","amount":4,"unit":"large"},{"name":"English muffins","amount":2,"unit":"split"},{"name":"Canadian bacon","amount":4,"unit":"slices"},{"name":"egg yolks","amount":3,"unit":"for hollandaise"},{"name":"butter","amount":120,"unit":"g"},{"name":"lemon juice","amount":1,"unit":"tbsp"},{"name":"cayenne","amount":0.25,"unit":"tsp"},{"name":"white vinegar","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Make hollandaise: whisk yolks with 1 tbsp water in double boiler until thick. Slowly drizzle in clarified butter. Add lemon and cayenne.','Poach eggs: swirl acidulated water, drop in eggs, cook 3 min. Remove with slotted spoon.','Toast muffins; top with warm bacon.','Place egg on top; spoon hollandaise generously. Serve immediately.'],
 20, 20, 2, 540, 28, 28, 34, 1, 4, 1020),

('curated','Serious Eats','https://www.seriouseats.com/french-toast',
 'Custardy French Toast',
 'Thick brioche soaked in a vanilla-custard mix, fried in butter until golden. Top with maple syrup, fresh berries, and powdered sugar.',
 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
 'American', ARRAY['breakfast'], ARRAY['vegetarian'],
 '[{"name":"brioche bread","amount":6,"unit":"thick slices"},{"name":"eggs","amount":3,"unit":"large"},{"name":"whole milk","amount":120,"unit":"ml"},{"name":"heavy cream","amount":60,"unit":"ml"},{"name":"vanilla extract","amount":1,"unit":"tsp"},{"name":"cinnamon","amount":0.5,"unit":"tsp"},{"name":"butter","amount":3,"unit":"tbsp"},{"name":"maple syrup","amount":4,"unit":"tbsp"},{"name":"fresh berries","amount":150,"unit":"g"}]'::jsonb,
 ARRAY['Whisk eggs, milk, cream, vanilla, and cinnamon.','Soak bread slices 1 min per side until saturated.','Fry in butter over medium heat 3–4 min per side until deeply golden.','Serve topped with powdered sugar, berries, and maple syrup.'],
 10, 15, 3, 480, 14, 52, 22, 2, 22, 440),

('curated','Cookie and Kate','https://cookieandkate.com/avocado-toast/',
 'Perfect Avocado Toast',
 'The dish that ''started'' brunch culture — done right, with good sourdough, smashed avocado, everything bagel seasoning, and a soft fried egg on top.',
 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800&q=80',
 'American', ARRAY['breakfast','snack'], ARRAY['vegetarian','dairy-free'],
 '[{"name":"sourdough bread","amount":2,"unit":"thick slices"},{"name":"ripe avocados","amount":2,"unit":"medium"},{"name":"eggs","amount":2,"unit":"large"},{"name":"lemon juice","amount":1,"unit":"tbsp"},{"name":"everything bagel seasoning","amount":1,"unit":"tsp"},{"name":"red pepper flakes","amount":0.25,"unit":"tsp"},{"name":"olive oil","amount":1,"unit":"tsp"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Toast bread until golden and sturdy.','Mash avocado with lemon, salt — leave it chunky.','Fry eggs in olive oil over medium-low heat for runny yolks.','Pile avocado on toast; top with egg, bagel seasoning, and chilli flakes.'],
 5, 5, 2, 380, 14, 32, 24, 10, 2, 480),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/banana-foster-crepes',
 'Overnight Oats (4 Ways)',
 'No-cook, make-ahead, endlessly customisable breakfast. Mix before bed, wake up to a creamy, nutritious jar — it''s the best use of 5 minutes you''ll find.',
 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80',
 'American', ARRAY['breakfast'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"rolled oats","amount":80,"unit":"g"},{"name":"milk","amount":200,"unit":"ml"},{"name":"Greek yogurt","amount":100,"unit":"g"},{"name":"chia seeds","amount":1,"unit":"tbsp"},{"name":"honey","amount":1,"unit":"tbsp"},{"name":"vanilla extract","amount":0.5,"unit":"tsp"},{"name":"banana","amount":1,"unit":"medium"},{"name":"berries","amount":100,"unit":"g"},{"name":"nut butter","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Combine oats, milk, yogurt, chia, honey, and vanilla in a jar.','Stir well; cover and refrigerate overnight.','In the morning, stir — add milk to thin if desired.','Top with sliced banana, berries, and a swirl of nut butter.'],
 5, 0, 1, 420, 16, 64, 12, 8, 22, 120),

('curated','Serious Eats','https://www.seriouseats.com/best-waffles-recipe',
 'Crispy Raised Waffles',
 'Yeasted batter made the night before produces waffles with a crunch that holds for 30 minutes and a deep, complex flavour. Best waffles you''ll ever make.',
 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
 'American', ARRAY['breakfast'], ARRAY['vegetarian'],
 '[{"name":"all-purpose flour","amount":240,"unit":"g"},{"name":"whole milk","amount":480,"unit":"ml"},{"name":"butter","amount":115,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"instant yeast","amount":7,"unit":"g"},{"name":"sugar","amount":1,"unit":"tbsp"},{"name":"salt","amount":0.5,"unit":"tsp"},{"name":"vanilla extract","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Night before: melt butter into warm milk. Whisk in yeast, sugar, flour, salt, and vanilla.','Cover loosely; leave at room temp overnight.','Morning: whisk in eggs. Let rest 10 min.','Cook in a preheated, buttered waffle iron until deep golden and crisp.','Serve immediately with maple syrup and butter.'],
 10, 25, 6, 340, 10, 42, 14, 2, 8, 380),

-- ============================================================
-- SOUPS & STEWS
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/french-onion-soup',
 'French Onion Soup',
 'Three hours of slow-caramelised onions, a rich beef broth, and a broiled gruyère crouton on top. The classic that justifies slow cooking.',
 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
 'French', ARRAY['soup'], ARRAY['vegetarian'],
 '[{"name":"onions","amount":1.5,"unit":"kg"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"beef or vegetable broth","amount":1.5,"unit":"L"},{"name":"dry white wine","amount":120,"unit":"ml"},{"name":"thyme","amount":4,"unit":"sprigs"},{"name":"bay leaves","amount":2,"unit":"whole"},{"name":"baguette","amount":1,"unit":"small"},{"name":"gruyère cheese","amount":200,"unit":"g"},{"name":"cognac","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Slice onions 5mm thick. Melt butter in a Dutch oven; add onions and a pinch of salt.','Cook on medium-low 2–3 hrs, stirring occasionally, until deeply golden and caramelised.','Add wine; cook 5 min. Add broth, thyme, bay. Simmer 20 min. Add cognac.','Ladle into oven-safe bowls; top with baguette slices and heap of gruyère.','Broil until cheese is bubbling and browned.'],
 15, 180, 4, 380, 18, 36, 16, 4, 14, 960),

('curated','Minimalist Baker','https://minimalistbaker.com/cream-of-broccoli-soup/',
 'Cream of Broccoli Soup',
 'Bright green, velvety broccoli soup with sharp cheddar. Comforting, fast, and secretly nutritious. Ready in 30 minutes, serves a crowd.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
 'American', ARRAY['soup'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"broccoli","amount":700,"unit":"g"},{"name":"sharp cheddar","amount":150,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"vegetable broth","amount":800,"unit":"ml"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"butter","amount":2,"unit":"tbsp"},{"name":"nutmeg","amount":0.25,"unit":"tsp"},{"name":"Dijon mustard","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Cook onion in butter until soft. Add garlic 1 min.','Add broccoli and broth. Simmer 15 min until broccoli is very tender.','Blend until smooth with a hand blender.','Stir in cream, cheese, nutmeg, and mustard. Simmer 5 min.','Season and serve with crusty bread.'],
 10, 25, 4, 320, 16, 18, 20, 5, 6, 640),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/minestrone',
 'Classic Minestrone',
 'The Italian grandmother''s kitchen-sink soup — seasonal vegetables, white beans, and pasta in a rich tomato broth. Better the next day.',
 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&q=80',
 'Italian', ARRAY['soup'], ARRAY['vegan','vegetarian','dairy-free'],
 '[{"name":"cannellini beans","amount":400,"unit":"g (1 can)"},{"name":"diced tomatoes","amount":400,"unit":"g"},{"name":"zucchini","amount":1,"unit":"medium"},{"name":"carrots","amount":2,"unit":"medium"},{"name":"celery","amount":2,"unit":"stalks"},{"name":"onion","amount":1,"unit":"large"},{"name":"kale","amount":100,"unit":"g"},{"name":"small pasta","amount":100,"unit":"g"},{"name":"vegetable broth","amount":1.5,"unit":"L"},{"name":"parmesan rind","amount":1,"unit":"piece"},{"name":"garlic","amount":3,"unit":"cloves"}]'::jsonb,
 ARRAY['Sauté onion, carrot, celery until soft, 8 min. Add garlic 1 min.','Add tomatoes, broth, parmesan rind, and beans. Simmer 20 min.','Add zucchini, pasta, and kale. Cook 10 min until pasta is al dente.','Remove rind. Season generously with salt and pepper.','Serve with parmesan and good olive oil drizzled on top.'],
 15, 40, 6, 280, 12, 46, 6, 10, 8, 640),

('curated','Serious Eats','https://www.seriouseats.com/pho-bo-beef',
 'Vietnamese Beef Pho',
 'Deeply aromatic, star-anise-scented broth with silky rice noodles and tender beef. Charring the aromatics first is the secret to its complex flavour.',
 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80',
 'Vietnamese', ARRAY['soup','main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"beef bones","amount":2,"unit":"kg"},{"name":"beef brisket","amount":500,"unit":"g"},{"name":"rice noodles","amount":300,"unit":"g"},{"name":"onion","amount":2,"unit":"large"},{"name":"ginger","amount":5,"unit":"cm piece"},{"name":"star anise","amount":4,"unit":"whole"},{"name":"cinnamon stick","amount":1,"unit":"whole"},{"name":"fish sauce","amount":3,"unit":"tbsp"},{"name":"sugar","amount":1,"unit":"tbsp"},{"name":"bean sprouts","amount":200,"unit":"g"},{"name":"fresh herbs (Thai basil, cilantro)","amount":40,"unit":"g"}]'::jsonb,
 ARRAY['Blanch bones 10 min; rinse. Char onion and ginger under broiler until blackened.','Simmer bones, onion, ginger, star anise, cinnamon 6 hrs. Add brisket last 1.5 hrs.','Season broth with fish sauce and sugar.','Cook noodles. Slice brisket thin. Portion into bowls.','Pour boiling broth over noodles. Add raw sliced beef — the broth cooks it. Serve with sprouts and herbs.'],
 20, 360, 4, 480, 44, 48, 12, 2, 4, 1200),

-- ============================================================
-- SALADS
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/best-caesar-salad',
 'Caesar Salad (The Real Way)',
 'Romaine, raw egg yolk dressing, anchovies, real parmesan, and hand-made croutons. Once you make it this way, the bottled stuff is gone forever.',
 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
 'American', ARRAY['salad'], ARRAY[''],
 '[{"name":"romaine lettuce","amount":2,"unit":"large heads"},{"name":"parmesan","amount":80,"unit":"g"},{"name":"anchovies","amount":4,"unit":"fillets"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"egg yolks","amount":2,"unit":"large"},{"name":"Dijon mustard","amount":1,"unit":"tsp"},{"name":"Worcestershire sauce","amount":1,"unit":"tsp"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"olive oil","amount":120,"unit":"ml"},{"name":"sourdough","amount":150,"unit":"g (torn)"}]'::jsonb,
 ARRAY['Make croutons: toss torn bread with olive oil; bake at 375°F 15 min until golden.','Mince anchovy and garlic into a paste. Whisk with yolks, mustard, Worcestershire, lemon.','Stream in olive oil, whisking constantly, to emulsify. Season.','Tear romaine into large pieces. Toss with dressing and half the parmesan.','Top with croutons and remaining parmesan. Serve immediately.'],
 20, 15, 4, 360, 12, 24, 26, 4, 4, 680),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/kale-salad',
 'Massaged Kale & Farro Salad',
 'Hearty kale that''s been massaged until tender, nutty farro, dried cranberries, pepitas, and a lemony tahini dressing. The salad that keeps you full.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'American', ARRAY['salad'], ARRAY['vegan','vegetarian','dairy-free'],
 '[{"name":"kale","amount":200,"unit":"g"},{"name":"farro","amount":160,"unit":"g"},{"name":"dried cranberries","amount":50,"unit":"g"},{"name":"pepitas","amount":40,"unit":"g"},{"name":"tahini","amount":3,"unit":"tbsp"},{"name":"lemon juice","amount":3,"unit":"tbsp"},{"name":"garlic","amount":1,"unit":"clove"},{"name":"maple syrup","amount":1,"unit":"tsp"},{"name":"olive oil","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Cook farro per packet; cool.','Strip and roughly chop kale. Drizzle with olive oil and a pinch of salt; massage 3 min until dark green and tender.','Whisk tahini, lemon, garlic, maple, and 3 tbsp water for dressing.','Combine kale, farro, cranberries, and pepitas.','Drizzle with dressing; toss to coat.'],
 15, 25, 4, 360, 12, 52, 14, 8, 12, 280),

('curated','Cookie and Kate','https://cookieandkate.com/mediterranean-chickpea-salad/',
 'Mediterranean Chickpea Salad',
 'A no-cook, 15-minute salad full of protein — chickpeas, cucumber, tomatoes, olives, and feta in a bright lemon-herb dressing.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'Mediterranean', ARRAY['salad'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"chickpeas","amount":800,"unit":"g (2 cans, drained)"},{"name":"cucumber","amount":1,"unit":"large"},{"name":"cherry tomatoes","amount":250,"unit":"g"},{"name":"kalamata olives","amount":80,"unit":"g"},{"name":"feta cheese","amount":150,"unit":"g"},{"name":"red onion","amount":0.5,"unit":"small"},{"name":"fresh parsley","amount":20,"unit":"g"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"lemon juice","amount":3,"unit":"tbsp"},{"name":"oregano","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Dice cucumber, halve tomatoes, thinly slice red onion.','Combine chickpeas, vegetables, and olives.','Whisk olive oil, lemon, oregano, salt, and pepper for dressing.','Toss salad with dressing. Top with crumbled feta and parsley.','Serve immediately or refrigerate up to 3 days (dressing keeps it moist).'],
 15, 0, 4, 380, 14, 44, 18, 10, 6, 680),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/waldorf-salad',
 'Roasted Beet & Walnut Salad',
 'Earthy roasted beets, creamy goat cheese, candied walnuts, and bitter greens in a sherry vinaigrette. A salad that''s worth the effort.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'American', ARRAY['salad'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"beets","amount":6,"unit":"medium"},{"name":"goat cheese","amount":100,"unit":"g"},{"name":"walnuts","amount":80,"unit":"g"},{"name":"mixed greens","amount":150,"unit":"g"},{"name":"sherry vinegar","amount":2,"unit":"tbsp"},{"name":"honey","amount":1,"unit":"tbsp"},{"name":"Dijon mustard","amount":1,"unit":"tsp"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"sugar","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Roast beets: wrap in foil, bake at 400°F 45–60 min until tender. Cool, peel, slice.','Candy walnuts: cook with sugar in a dry pan until caramelised; cool on parchment.','Whisk vinegar, honey, mustard, oil for vinaigrette.','Toss greens with dressing; arrange beets on top.','Crumble goat cheese; scatter candied walnuts.'],
 15, 60, 4, 380, 10, 28, 28, 5, 16, 280),

-- ============================================================
-- DESSERTS
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/the-food-lab-best-chocolate-chip-cookies',
 'Perfect Chocolate Chip Cookies',
 'Brown butter, extra yolk, rested dough, and two kinds of chocolate. The cookies that have caused people to say "I don''t need to try any other recipe."',
 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
 'American', ARRAY['dessert','baking'], ARRAY['vegetarian'],
 '[{"name":"all-purpose flour","amount":240,"unit":"g"},{"name":"butter","amount":170,"unit":"g"},{"name":"brown sugar","amount":180,"unit":"g"},{"name":"granulated sugar","amount":100,"unit":"g"},{"name":"eggs","amount":1,"unit":"large + 1 yolk"},{"name":"vanilla extract","amount":2,"unit":"tsp"},{"name":"baking soda","amount":0.75,"unit":"tsp"},{"name":"salt","amount":0.75,"unit":"tsp"},{"name":"dark chocolate chips","amount":200,"unit":"g"},{"name":"milk chocolate chunks","amount":100,"unit":"g"}]'::jsonb,
 ARRAY['Brown butter until nutty and golden. Cool 30 min.','Beat with both sugars, then egg and yolk, then vanilla.','Fold in flour, baking soda, and salt. Fold in chocolate.','Refrigerate dough 24–72 hrs (non-negotiable for best flavour).','Scoop onto lined sheet; bake at 375°F (190°C) 11 min. Cool on tray.'],
 20, 11, 24, 180, 2, 24, 10, 1, 16, 140),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/flourless-chocolate-cake',
 'Flourless Chocolate Torte',
 'Dense, fudgy, and intensely chocolatey — this naturally gluten-free torte requires only 5 ingredients and 10 minutes of prep. Serve with crème fraîche.',
 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
 'American', ARRAY['dessert'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"dark chocolate (70%)","amount":250,"unit":"g"},{"name":"butter","amount":170,"unit":"g"},{"name":"sugar","amount":200,"unit":"g"},{"name":"eggs","amount":4,"unit":"large"},{"name":"cocoa powder","amount":2,"unit":"tbsp"},{"name":"salt","amount":0.5,"unit":"tsp"},{"name":"vanilla extract","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Melt chocolate and butter together; cool slightly.','Whisk sugar into chocolate mix, then eggs one at a time, then vanilla.','Add cocoa and salt; stir until smooth.','Pour into a buttered 9-inch springform pan.','Bake at 325°F (165°C) for 22–26 min. Centre will still jiggle — it firms as it cools.'],
 10, 24, 12, 320, 5, 28, 22, 2, 24, 120),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/creme-brulee',
 'Crème Brûlée',
 'Silky vanilla custard under a shattering caramel shell. Three ingredients, one technique — and the crack when you break through the top never gets old.',
 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800&q=80',
 'French', ARRAY['dessert'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"heavy cream","amount":500,"unit":"ml"},{"name":"egg yolks","amount":6,"unit":"large"},{"name":"sugar","amount":100,"unit":"g (+ 2 tsp per serving for brulee)"},{"name":"vanilla bean","amount":1,"unit":"whole"},{"name":"salt","amount":1,"unit":"pinch"}]'::jsonb,
 ARRAY['Heat cream with split vanilla bean and seeds until steaming. Steep 10 min.','Whisk yolks and sugar until pale. Temper in warm cream slowly.','Strain into ramekins. Bake in water bath at 300°F (150°C) 35–45 min until just set.','Refrigerate 4 hrs. Top with thin layer of sugar; brulee with torch.'],
 20, 45, 6, 440, 5, 28, 38, 0, 26, 60),

('curated','AllRecipes','https://www.allrecipes.com/recipe/banana-bread',
 'Brown Butter Banana Bread',
 'The upgrade on the classic: brown butter adds a nutty depth that makes this the only banana bread recipe you''ll ever need. Use blackened bananas.',
 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=800&q=80',
 'American', ARRAY['dessert','baking','breakfast'], ARRAY['vegetarian'],
 '[{"name":"very ripe bananas","amount":4,"unit":"large (blackened)"},{"name":"butter","amount":115,"unit":"g"},{"name":"brown sugar","amount":150,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"vanilla extract","amount":1,"unit":"tsp"},{"name":"all-purpose flour","amount":210,"unit":"g"},{"name":"baking soda","amount":1,"unit":"tsp"},{"name":"cinnamon","amount":0.5,"unit":"tsp"},{"name":"walnuts","amount":80,"unit":"g"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Brown butter until nutty; cool slightly.','Mash bananas with brown butter, sugar, eggs, and vanilla.','Fold in flour, baking soda, cinnamon, salt, and walnuts.','Pour into buttered loaf pan.','Bake at 350°F (175°C) 55–65 min until a toothpick comes out clean.'],
 15, 60, 10, 280, 5, 38, 12, 2, 20, 200),

('curated','Serious Eats','https://www.seriouseats.com/apple-pie-recipe',
 'Perfect Apple Pie',
 'Flaky all-butter crust, thick cinnamon-apple filling that''s never watery, with a hint of lemon and vanilla. The pie you make for Thanksgiving.',
 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&q=80',
 'American', ARRAY['dessert','baking'], ARRAY['vegetarian'],
 '[{"name":"apples","amount":1.2,"unit":"kg (mixed: granny smith + honeycrisp)"},{"name":"all-purpose flour","amount":300,"unit":"g"},{"name":"butter","amount":225,"unit":"g (cold)"},{"name":"sugar","amount":150,"unit":"g"},{"name":"cinnamon","amount":2,"unit":"tsp"},{"name":"nutmeg","amount":0.25,"unit":"tsp"},{"name":"lemon juice","amount":1,"unit":"tbsp"},{"name":"cornstarch","amount":3,"unit":"tbsp"},{"name":"ice water","amount":6,"unit":"tbsp"}]'::jsonb,
 ARRAY['Make crust: pulse butter and flour until pebbly; add ice water; form 2 discs. Refrigerate 2 hrs.','Peel and slice apples; toss with sugar, cornstarch, spices, and lemon.','Roll one disc; line pie dish. Fill with apple mixture, mounded high.','Top with second crust; crimp; cut vents; brush with egg wash; sprinkle sugar.','Bake at 425°F (220°C) 20 min, then 375°F 40 min.'],
 45, 60, 8, 420, 4, 60, 18, 4, 30, 240),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/lemon-tart',
 'Classic Lemon Tart',
 'A buttery, crumbly shortcrust shell filled with velvety, intensely lemony curd. Simple and elegant — the kind of dessert a Parisian pâtisserie would be proud of.',
 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1d5?w=800&q=80',
 'French', ARRAY['dessert'], ARRAY['vegetarian'],
 '[{"name":"lemons","amount":4,"unit":"large"},{"name":"eggs","amount":4,"unit":"large"},{"name":"sugar","amount":200,"unit":"g"},{"name":"butter","amount":120,"unit":"g"},{"name":"all-purpose flour","amount":200,"unit":"g"},{"name":"cold butter","amount":100,"unit":"g (for pastry)"},{"name":"icing sugar","amount":2,"unit":"tbsp"},{"name":"egg yolk","amount":1,"unit":"for pastry"}]'::jsonb,
 ARRAY['Make pastry: pulse flour, butter, icing sugar; add yolk and 2 tbsp water. Refrigerate 1 hr.','Blind bake at 375°F (190°C) for 15 min, then 10 min uncovered.','Make curd: whisk eggs, sugar, lemon juice and zest in double boiler. Add butter, stir until thick (~10 min).','Strain curd into tart shell while warm. Refrigerate 2 hrs.','Serve dusted with icing sugar.'],
 30, 30, 8, 340, 6, 46, 16, 1, 32, 120),

('curated','AllRecipes','https://www.allrecipes.com/recipe/chocolate-mousse',
 'Dark Chocolate Mousse',
 'Three ingredients. Silky, airy, intensely chocolatey. This French classic needs nothing more than good chocolate, eggs, and a careful fold.',
 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800&q=80',
 'French', ARRAY['dessert'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"dark chocolate (70%)","amount":200,"unit":"g"},{"name":"eggs","amount":4,"unit":"large"},{"name":"sugar","amount":30,"unit":"g"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"salt","amount":1,"unit":"pinch"}]'::jsonb,
 ARRAY['Melt chocolate gently; cool until just warm to the touch.','Separate eggs. Whisk yolks with half the sugar; stir into chocolate.','Whip cream to soft peaks; fold into chocolate.','Whip whites with salt to firm peaks; fold in gently in two additions.','Portion into glasses; chill 4 hrs before serving.'],
 20, 0, 6, 320, 6, 24, 22, 3, 18, 60),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/panna-cotta',
 'Vanilla Panna Cotta',
 'Trembling, cream-soft, and scented with vanilla — panna cotta is the dessert that looks impressive and is secretly effortless. Serve with berry compote.',
 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
 'Italian', ARRAY['dessert'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"heavy cream","amount":600,"unit":"ml"},{"name":"whole milk","amount":200,"unit":"ml"},{"name":"sugar","amount":80,"unit":"g"},{"name":"vanilla bean","amount":1,"unit":"whole"},{"name":"gelatin sheets","amount":4,"unit":"sheets (or 2.5 tsp powdered)"},{"name":"mixed berries","amount":200,"unit":"g"},{"name":"honey","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Bloom gelatin in cold water 5 min.','Warm cream, milk, and sugar with split vanilla bean. Remove from heat.','Squeeze out gelatin; whisk into warm cream until dissolved.','Strain into 6 lightly oiled ramekins. Refrigerate 4 hrs.','Make compote: simmer berries with honey 5 min. Unmould panna cotta; spoon compote over.'],
 15, 10, 6, 380, 4, 28, 30, 1, 24, 60),

('curated','Serious Eats','https://www.seriouseats.com/best-sticky-toffee-pudding',
 'Sticky Toffee Pudding',
 'The great British dessert — a moist date sponge drenched in warm toffee sauce. Serve with a generous pour of clotted cream or good vanilla ice cream.',
 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=800&q=80',
 'British', ARRAY['dessert'], ARRAY['vegetarian'],
 '[{"name":"medjool dates","amount":200,"unit":"g (pitted)"},{"name":"boiling water","amount":180,"unit":"ml"},{"name":"all-purpose flour","amount":175,"unit":"g"},{"name":"butter","amount":55,"unit":"g"},{"name":"sugar","amount":150,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"baking soda","amount":1,"unit":"tsp"},{"name":"vanilla","amount":1,"unit":"tsp"},{"name":"heavy cream","amount":240,"unit":"ml"},{"name":"brown sugar","amount":150,"unit":"g (for sauce)"},{"name":"butter","amount":85,"unit":"g (for sauce)"}]'::jsonb,
 ARRAY['Soak dates in boiling water + baking soda 10 min. Blend to a paste.','Cream butter and sugar. Add eggs and vanilla. Fold in date paste and flour.','Pour into buttered baking dish. Bake at 350°F (175°C) 25 min.','Make sauce: simmer cream, brown sugar, and butter 5 min.','Pour hot sauce over pudding before serving. Serve immediately.'],
 20, 25, 8, 480, 5, 68, 20, 2, 52, 280),

-- ============================================================
-- BAKING
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/no-knead-bread',
 'No-Knead Dutch Oven Bread',
 'Crackly crust, chewy open crumb, perfectly baked — this 4-ingredient loaf requires zero skill and zero kneading. You just need time and a Dutch oven.',
 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
 'American', ARRAY['baking'], ARRAY['vegan','vegetarian','dairy-free'],
 '[{"name":"bread flour","amount":400,"unit":"g"},{"name":"water","amount":300,"unit":"ml"},{"name":"instant yeast","amount":1,"unit":"g (¼ tsp)"},{"name":"salt","amount":8,"unit":"g"}]'::jsonb,
 ARRAY['Mix flour, yeast, and salt. Add water; stir until a shaggy dough forms. Cover.','Rest 12–18 hrs at room temperature.','Turn dough out; fold a few times; shape into a round. Rest 2 hrs on parchment.','Preheat Dutch oven at 450°F (230°C) for 30 min.','Lower dough into hot pot; bake covered 30 min, then uncovered 15 min until dark.'],
 15, 45, 8, 180, 6, 36, 0, 2, 0, 300),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/croissants',
 'Homemade Croissants',
 'Flaky, buttery, pull-apart croissants made over two days. A weekend project that results in the most impressive thing to ever come out of a home oven.',
 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
 'French', ARRAY['baking','breakfast'], ARRAY['vegetarian'],
 '[{"name":"bread flour","amount":500,"unit":"g"},{"name":"milk","amount":300,"unit":"ml"},{"name":"dry yeast","amount":7,"unit":"g"},{"name":"sugar","amount":60,"unit":"g"},{"name":"salt","amount":10,"unit":"g"},{"name":"butter","amount":250,"unit":"g (European, for lamination)"},{"name":"butter","amount":50,"unit":"g (in dough)"},{"name":"egg","amount":1,"unit":"for egg wash"}]'::jsonb,
 ARRAY['Make dough; knead until smooth; refrigerate overnight.','Beat lamination butter flat between parchment. Enclose in dough.','Perform 3 letter-folds with 30-min rests in fridge between each.','Cut into triangles; roll into croissant shapes. Proof 2–3 hrs.','Brush with egg wash. Bake at 400°F (200°C) 18–20 min until deeply golden.'],
 120, 20, 12, 320, 7, 36, 18, 1, 8, 340),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/cinnamon-rolls',
 'Fluffy Cinnamon Rolls',
 'Pull-apart, pillowy cinnamon rolls with a cream cheese glaze. Make the dough the night before and bake fresh in the morning.',
 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
 'American', ARRAY['baking','breakfast','dessert'], ARRAY['vegetarian'],
 '[{"name":"all-purpose flour","amount":500,"unit":"g"},{"name":"whole milk","amount":240,"unit":"ml"},{"name":"butter","amount":85,"unit":"g"},{"name":"sugar","amount":100,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"dry yeast","amount":7,"unit":"g"},{"name":"brown sugar","amount":200,"unit":"g"},{"name":"cinnamon","amount":3,"unit":"tbsp"},{"name":"cream cheese","amount":100,"unit":"g"},{"name":"icing sugar","amount":150,"unit":"g"}]'::jsonb,
 ARRAY['Make enriched dough; knead 8 min. Proof 1.5 hrs.','Roll out to 30×45cm rectangle. Spread with softened butter; dust with brown sugar and cinnamon.','Roll tightly from the long edge; cut into 12 rolls.','Place in greased dish; proof 1 hr (or overnight in fridge).','Bake at 375°F (190°C) 22 min. Frost while warm with cream cheese glaze.'],
 30, 22, 12, 380, 7, 58, 14, 2, 28, 320),

('curated','AllRecipes','https://www.allrecipes.com/recipe/blueberry-muffins',
 'Best Blueberry Muffins',
 'Domed, buttery muffins packed with juicy blueberries and a golden sugar-crust top. The recipe food bloggers have been trying to beat for years.',
 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80',
 'American', ARRAY['baking','breakfast'], ARRAY['vegetarian'],
 '[{"name":"all-purpose flour","amount":280,"unit":"g"},{"name":"blueberries","amount":250,"unit":"g (fresh)"},{"name":"butter","amount":115,"unit":"g"},{"name":"sugar","amount":200,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"buttermilk","amount":120,"unit":"ml"},{"name":"baking powder","amount":2,"unit":"tsp"},{"name":"vanilla extract","amount":1,"unit":"tsp"},{"name":"lemon zest","amount":1,"unit":"tsp"},{"name":"turbinado sugar","amount":2,"unit":"tbsp (for top)"}]'::jsonb,
 ARRAY['Cream butter and sugar. Add eggs and vanilla.','Mix in flour, baking powder, and salt alternating with buttermilk.','Fold in blueberries and lemon zest.','Fill greased muffin tin to the top. Sprinkle with turbinado sugar.','Bake at 425°F (220°C) for 5 min, then reduce to 375°F for 18 min.'],
 15, 23, 12, 240, 4, 36, 10, 1, 20, 180),

-- ============================================================
-- HIGH PROTEIN
-- ============================================================

('curated','AllRecipes','https://www.allrecipes.com/recipe/grilled-chicken-meal-prep',
 'Herb Grilled Chicken Meal Prep',
 'Juicy, perfectly seasoned chicken breasts grilled once and used all week — sliced over salads, stuffed in wraps, or eaten with rice and vegetables.',
 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&q=80',
 'American', ARRAY['main course'], ARRAY['high-protein','gluten-free','dairy-free'],
 '[{"name":"chicken breasts","amount":1,"unit":"kg (4 breasts)"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"garlic powder","amount":1,"unit":"tsp"},{"name":"onion powder","amount":1,"unit":"tsp"},{"name":"paprika","amount":1,"unit":"tsp"},{"name":"Italian herbs","amount":1,"unit":"tsp"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"black pepper","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Pound chicken to even thickness (2cm). Mix oil and spices; coat chicken.','Marinate 30 min at room temp or overnight in fridge.','Grill over medium-high heat 6 min per side or until internal temp reaches 165°F (74°C).','Rest 5 min. Slice or store whole in fridge up to 4 days.'],
 10, 15, 4, 280, 48, 2, 10, 0, 0, 480),

('curated','Serious Eats','https://www.seriouseats.com/salmon-teriyaki',
 'Salmon Teriyaki',
 'Glazed salmon with a sticky, sweet-savory teriyaki sauce made from scratch. One pan, 20 minutes, and infinitely better than the restaurant.',
 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
 'Japanese', ARRAY['main course'], ARRAY['high-protein','gluten-free','dairy-free'],
 '[{"name":"salmon fillets","amount":4,"unit":"150g each"},{"name":"soy sauce","amount":4,"unit":"tbsp"},{"name":"mirin","amount":3,"unit":"tbsp"},{"name":"sake","amount":2,"unit":"tbsp"},{"name":"honey","amount":1,"unit":"tbsp"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"sesame seeds","amount":1,"unit":"tbsp"},{"name":"vegetable oil","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Mix soy, mirin, sake, and honey for sauce.','Pat salmon dry. Cook skin-side down in oil 4 min; flip 2 min.','Add sauce to pan; cook on medium, spooning over fish, until sauce is thick and glossy (~2 min).','Serve over steamed rice with sesame seeds and steamed broccoli.'],
 5, 12, 4, 340, 40, 12, 14, 0, 8, 920),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/tuna-poke-bowl',
 'Ahi Tuna Poke Bowl',
 'Sushi-grade tuna marinated in soy, sesame, and ginger over sushi rice with avocado, cucumber, and edamame. Restaurant poke at home.',
 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
 'Hawaiian', ARRAY['main course'], ARRAY['high-protein','gluten-free','dairy-free'],
 '[{"name":"sushi-grade tuna","amount":400,"unit":"g"},{"name":"sushi rice","amount":300,"unit":"g"},{"name":"avocado","amount":1,"unit":"large"},{"name":"cucumber","amount":0.5,"unit":"large"},{"name":"edamame","amount":100,"unit":"g"},{"name":"soy sauce","amount":3,"unit":"tbsp"},{"name":"sesame oil","amount":1,"unit":"tsp"},{"name":"fresh ginger","amount":1,"unit":"tsp"},{"name":"rice vinegar","amount":1,"unit":"tbsp"},{"name":"sriracha","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Dice tuna into 1.5cm cubes. Marinate in soy, sesame oil, ginger, and sriracha for 10 min.','Cook sushi rice; season with rice vinegar, sugar, and salt while warm.','Slice avocado and cucumber.','Assemble bowls: rice, tuna, avocado, cucumber, edamame.','Drizzle with extra marinade. Top with sesame seeds.'],
 15, 20, 2, 520, 44, 56, 14, 6, 4, 860),

('curated','AllRecipes','https://www.allrecipes.com/recipe/greek-yogurt-chicken',
 'Greek Yogurt Baked Chicken',
 'Incredibly moist chicken marinated in Greek yogurt, garlic, and herbs — the yogurt acts as a tenderiser that locks in moisture through high-heat baking.',
 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&q=80',
 'Mediterranean', ARRAY['main course'], ARRAY['high-protein','gluten-free'],
 '[{"name":"chicken thighs","amount":800,"unit":"g (bone-in, skin-on)"},{"name":"Greek yogurt","amount":200,"unit":"g"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"paprika","amount":1,"unit":"tsp"},{"name":"cumin","amount":0.5,"unit":"tsp"},{"name":"oregano","amount":1,"unit":"tsp"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"salt","amount":1.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Mix yogurt with garlic, lemon, spices, and oil.','Coat chicken thoroughly; marinate 2 hrs or overnight.','Arrange in a single layer on a rack over a baking sheet.','Bake at 425°F (220°C) for 35–40 min until golden and internal temp is 165°F (74°C).','Rest 5 min before serving.'],
 10, 40, 4, 420, 46, 6, 24, 0, 2, 640),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/egg-white-frittata',
 'Egg White Veggie Frittata',
 'A light, protein-packed frittata loaded with spinach, cherry tomatoes, and feta. High protein, low calorie, genuinely delicious.',
 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&q=80',
 'Mediterranean', ARRAY['breakfast','main course'], ARRAY['high-protein','vegetarian','gluten-free'],
 '[{"name":"egg whites","amount":10,"unit":"large"},{"name":"whole eggs","amount":2,"unit":"large"},{"name":"baby spinach","amount":100,"unit":"g"},{"name":"cherry tomatoes","amount":150,"unit":"g"},{"name":"feta cheese","amount":80,"unit":"g"},{"name":"red onion","amount":0.5,"unit":"small"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"olive oil","amount":1,"unit":"tbsp"},{"name":"oregano","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Preheat oven to 375°F (190°C). Sauté onion and garlic in oven-safe pan.','Add spinach; cook until wilted. Add halved tomatoes.','Whisk egg whites, whole eggs, oregano, salt, and pepper.','Pour eggs over vegetables. Crumble feta on top.','Cook on stovetop 2 min, then bake 15 min until puffed and golden.'],
 10, 20, 4, 220, 28, 8, 8, 2, 4, 480),

-- ============================================================
-- INDIAN
-- ============================================================

('curated','Serious Eats','https://www.seriouseats.com/saag-paneer',
 'Saag Paneer',
 'Cubes of golden-fried paneer in a silky, spiced spinach gravy. A North Indian classic that''s secretly simple once you nail the spice order.',
 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
 'Indian', ARRAY['main course'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"paneer","amount":400,"unit":"g"},{"name":"frozen spinach","amount":500,"unit":"g (thawed)"},{"name":"onion","amount":1,"unit":"large"},{"name":"tomato","amount":2,"unit":"medium"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"fresh ginger","amount":2,"unit":"tsp"},{"name":"cumin seeds","amount":1,"unit":"tsp"},{"name":"garam masala","amount":1,"unit":"tsp"},{"name":"turmeric","amount":0.5,"unit":"tsp"},{"name":"heavy cream","amount":60,"unit":"ml"}]'::jsonb,
 ARRAY['Cube and pan-fry paneer until golden on all sides; set aside.','Cook cumin seeds until popping. Add onion; cook until golden.','Add garlic, ginger, tomato, and spices; cook until tomato breaks down.','Add spinach; simmer 5 min. Blend to a coarse sauce.','Stir in cream and paneer; simmer 5 min. Serve with naan.'],
 15, 25, 4, 420, 22, 14, 30, 6, 4, 640),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/dal-makhani',
 'Dal Makhani',
 'Black lentils and kidney beans slow-cooked with butter and cream until they become a rich, smooth, almost smoky stew. Slow is the secret.',
 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
 'Indian', ARRAY['main course','soup'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"black lentils","amount":200,"unit":"g (soaked overnight)"},{"name":"kidney beans","amount":200,"unit":"g (soaked overnight)"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"onion","amount":1,"unit":"large"},{"name":"tomato puree","amount":200,"unit":"ml"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"ginger","amount":2,"unit":"tsp"},{"name":"garam masala","amount":1,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Pressure-cook lentils and beans 30 min (or simmer 2 hrs).','Cook onion in butter until deeply golden. Add garlic, ginger, spices.','Add tomato puree; cook 10 min. Add cooked lentils.','Simmer 30 min, stirring often. Add cream and butter; simmer 10 min more.','The longer it simmers, the better. Serve with rice or naan.'],
 20, 120, 6, 360, 16, 52, 12, 14, 4, 480),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/palak-chicken',
 'Butter Chicken (Murgh Makhani)',
 'The gateway Indian dish — tender chicken in a velvety, mildly spiced tomato-butter sauce. Even better than your favourite Indian takeaway.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
 'Indian', ARRAY['main course'], ARRAY['gluten-free'],
 '[{"name":"chicken thighs","amount":700,"unit":"g"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"crushed tomatoes","amount":400,"unit":"g"},{"name":"yogurt","amount":120,"unit":"g"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"fresh ginger","amount":2,"unit":"tsp"},{"name":"garam masala","amount":2,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"kashmiri chilli powder","amount":1,"unit":"tsp"},{"name":"fenugreek leaves","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Marinate chicken in yogurt and half the spices 1 hr.','Grill or broil chicken until charred; set aside.','Cook garlic, ginger, tomatoes, and remaining spices in butter 15 min.','Blend sauce until smooth; return to pan. Add cream.','Add chicken; simmer 10 min. Finish with fenugreek leaves.'],
 20, 35, 4, 520, 44, 14, 30, 2, 6, 720),

('curated','AllRecipes','https://www.allrecipes.com/recipe/aloo-gobi',
 'Aloo Gobi',
 'Potatoes and cauliflower cooked with turmeric, cumin, and fresh ginger until perfectly tender and fragrant. A simple, beloved Indian comfort dish.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
 'Indian', ARRAY['main course','side dish'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"cauliflower","amount":1,"unit":"medium head"},{"name":"potatoes","amount":3,"unit":"medium"},{"name":"onion","amount":1,"unit":"large"},{"name":"tomatoes","amount":2,"unit":"medium"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"fresh ginger","amount":2,"unit":"tsp"},{"name":"turmeric","amount":0.5,"unit":"tsp"},{"name":"cumin seeds","amount":1,"unit":"tsp"},{"name":"coriander powder","amount":1,"unit":"tsp"},{"name":"garam masala","amount":0.5,"unit":"tsp"},{"name":"vegetable oil","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Cube potatoes; parboil 5 min; drain. Cut cauliflower into florets.','Cook cumin seeds until popping. Add onion; cook until golden.','Add garlic, ginger, tomatoes, and all spices; cook until paste forms.','Add potato and cauliflower; toss well. Cover and cook on low 20 min, stirring occasionally.','Finish with garam masala and fresh cilantro.'],
 15, 30, 4, 280, 8, 42, 10, 8, 6, 380),

-- ============================================================
-- ADDITIONAL VEGAN / VEGETARIAN SIDES
-- ============================================================

('curated','Cookie and Kate','https://cookieandkate.com/roasted-brussels-sprouts/',
 'Crispy Roasted Brussels Sprouts',
 'High-heat roasting transforms Brussels sprouts into crispy, caramelised little gems. Toss with balsamic and parmesan for an instant convert-maker.',
 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
 'American', ARRAY['side dish'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"Brussels sprouts","amount":700,"unit":"g"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"garlic powder","amount":0.5,"unit":"tsp"},{"name":"balsamic vinegar","amount":2,"unit":"tbsp"},{"name":"parmesan","amount":40,"unit":"g"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"black pepper","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Halve Brussels sprouts. Toss with oil, garlic powder, salt, and pepper.','Spread cut-side down on a hot sheet pan (425°F/220°C). Do not crowd.','Roast 20–25 min until cut sides are dark and crispy.','Drizzle with balsamic; toss. Top with parmesan.','Serve immediately.'],
 10, 25, 4, 160, 7, 18, 8, 6, 5, 380),

('curated','Minimalist Baker','https://minimalistbaker.com/garlic-herb-mashed-potatoes/',
 'Creamy Garlic Mashed Potatoes',
 'Silky, buttery mashed potatoes with roasted garlic folded through. The potato dish that ruins all others.',
 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
 'American', ARRAY['side dish'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"Yukon Gold potatoes","amount":1.2,"unit":"kg"},{"name":"butter","amount":85,"unit":"g"},{"name":"whole milk","amount":120,"unit":"ml"},{"name":"garlic","amount":6,"unit":"cloves (roasted)"},{"name":"cream cheese","amount":60,"unit":"g"},{"name":"salt","amount":1.5,"unit":"tsp"},{"name":"chives","amount":10,"unit":"g"}]'::jsonb,
 ARRAY['Peel and cube potatoes; boil in salted water until very tender, ~18 min.','Drain well; return to pot over low heat to steam dry 1 min.','Mash with butter, roasted garlic, and cream cheese.','Warm milk; gradually mix in until desired consistency.','Season generously. Top with chives and extra butter.'],
 15, 25, 6, 280, 5, 40, 12, 3, 3, 480),

('curated','Cookie and Kate','https://cookieandkate.com/simple-dressed-salad/',
 'The Best Simple Green Salad',
 'Mixed greens, radishes, cucumber, and a punchy Dijon vinaigrette. Proof that a great salad needs no more than a few good-quality ingredients.',
 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
 'Mediterranean', ARRAY['salad'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"mixed greens","amount":150,"unit":"g"},{"name":"cucumber","amount":0.5,"unit":"medium"},{"name":"radishes","amount":6,"unit":"whole"},{"name":"Dijon mustard","amount":1,"unit":"tsp"},{"name":"red wine vinegar","amount":2,"unit":"tbsp"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"garlic","amount":0.5,"unit":"clove (grated)"},{"name":"honey","amount":0.5,"unit":"tsp"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Whisk mustard, vinegar, garlic, honey, salt.','Stream in olive oil while whisking to emulsify.','Slice cucumber and radishes.','Toss greens with enough dressing to lightly coat.','Add cucumber and radishes. Serve immediately.'],
 10, 0, 2, 200, 2, 10, 16, 2, 4, 240),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/sweet-potato-fries',
 'Crispy Baked Sweet Potato Fries',
 'The trick to crispy baked sweet potato fries is cornstarch and a very hot oven. These actually get crispy — not the sad soggy kind.',
 'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=800&q=80',
 'American', ARRAY['side dish','snack'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"sweet potatoes","amount":4,"unit":"medium"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"cornstarch","amount":1,"unit":"tbsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"garlic powder","amount":0.5,"unit":"tsp"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"cayenne","amount":0.25,"unit":"tsp"}]'::jsonb,
 ARRAY['Preheat oven to 425°F (220°C) with a sheet pan inside.','Cut sweet potatoes into ½-inch sticks; pat completely dry.','Toss with cornstarch first, then oil and spices.','Spread in a single layer on the hot pan; do not overlap.','Bake 20 min; flip; bake 15 min more until crispy.'],
 15, 35, 4, 180, 2, 34, 6, 4, 8, 360),

-- ============================================================
-- SNACKS & DRINKS (NON-SODA)
-- ============================================================

('curated','Cookie and Kate','https://cookieandkate.com/guacamole/',
 'Perfect Guacamole',
 'Chunky, bright, limey guacamole made the right way — mashed with a fork, not blended. Salt at every stage is the secret.',
 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
 'Mexican', ARRAY['snack','side dish','dip'], ARRAY['vegan','vegetarian','gluten-free','dairy-free'],
 '[{"name":"ripe Hass avocados","amount":3,"unit":"large"},{"name":"lime juice","amount":2,"unit":"tbsp"},{"name":"red onion","amount":0.25,"unit":"small"},{"name":"jalapeño","amount":1,"unit":"whole"},{"name":"fresh cilantro","amount":15,"unit":"g"},{"name":"garlic","amount":1,"unit":"clove"},{"name":"salt","amount":0.75,"unit":"tsp"},{"name":"tomato","amount":1,"unit":"medium"}]'::jsonb,
 ARRAY['Halve avocados; scoop flesh into bowl.','Mash with a fork — leave it chunky.','Add lime juice, salt, minced garlic, jalapeño, onion, and cilantro.','Fold in diced tomato.','Taste and adjust salt and lime. Serve immediately.'],
 10, 0, 4, 220, 3, 12, 20, 8, 1, 300);
