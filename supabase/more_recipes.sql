-- ============================================================
-- What's Cooking — More Curated Recipes (Mains / Sides / etc.)
-- Run AFTER seed.sql and features.sql
-- ============================================================

insert into recipes (source, source_name, source_url, title, description, image_url, cuisine_type, dish_types, dietary_tags, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg) values

-- ITALIAN
('curated', 'Serious Eats', 'https://www.seriouseats.com/the-best-lasagna-recipe',
 'The Ultimate Lasagna',
 'Rich béchamel, slow-cooked Bolognese, and fresh pasta sheets. Worth the effort — this is the lasagna you make for people you love.',
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
 'Italian', ARRAY['main course','pasta'], ARRAY[]::text[],
 '[{"name":"lasagna sheets","amount":12,"unit":"sheets"},{"name":"ground beef","amount":400,"unit":"g"},{"name":"tomato passata","amount":500,"unit":"ml"},{"name":"whole milk","amount":500,"unit":"ml"},{"name":"butter","amount":50,"unit":"g"},{"name":"flour","amount":50,"unit":"g"},{"name":"parmesan","amount":80,"unit":"g"},{"name":"mozzarella","amount":200,"unit":"g"},{"name":"onion","amount":1,"unit":"medium"},{"name":"garlic","amount":3,"unit":"cloves"}]'::jsonb,
 ARRAY['Brown beef with onion and garlic. Add passata; simmer 30 min.','Make béchamel: melt butter, whisk in flour, gradually add milk, simmer until thick.','Layer: pasta → meat → béchamel → cheese. Repeat 3×.','Top with parmesan. Bake 45 min at 375°F (190°C). Rest 15 min before cutting.'],
 40, 45, 6, 720, 44, 58, 32, 3, 8, 960),

('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1016021-cacio-e-pepe',
 'Cacio e Pepe',
 'Rome''s most iconic pasta — just spaghetti, Pecorino, Parmesan, and lots of black pepper. Deceptively simple, endlessly satisfying.',
 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
 'Italian', ARRAY['main course','pasta'], ARRAY['vegetarian'],
 '[{"name":"spaghetti","amount":400,"unit":"g"},{"name":"Pecorino Romano","amount":100,"unit":"g"},{"name":"Parmesan","amount":50,"unit":"g"},{"name":"black pepper","amount":2,"unit":"tsp"},{"name":"salt","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Cook pasta in well-salted water until just under al dente. Reserve 1 cup pasta water.','Toast pepper in a dry pan 1 min.','Add ½ cup pasta water to pan. Add pasta, toss.','Remove from heat. Rain in cheeses, tossing and adding water to form a silky sauce.','Serve immediately with more pepper.'],
 5, 12, 4, 580, 24, 78, 18, 3, 2, 820),

-- ASIAN
('curated', 'Serious Eats', 'https://www.seriouseats.com/the-food-lab-better-than-take-out-fried-rice',
 'Better-Than-Takeout Fried Rice',
 'Day-old rice, high heat, and the right technique. Kenji''s foolproof fried rice beats takeout every time — ready in 15 minutes.',
 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
 'Asian', ARRAY['main course','side dish'], ARRAY['dairy-free'],
 '[{"name":"cooked rice","amount":3,"unit":"cups (day-old)"},{"name":"eggs","amount":3,"unit":"large"},{"name":"soy sauce","amount":3,"unit":"tbsp"},{"name":"sesame oil","amount":1,"unit":"tsp"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"scallions","amount":4,"unit":"stalks"},{"name":"frozen peas","amount":120,"unit":"g"},{"name":"vegetable oil","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Heat wok until smoking. Add oil.','Add rice; press flat and let sit 1 min to crisp. Toss.','Push rice aside; scramble eggs in the centre.','Add garlic, peas, soy sauce, sesame oil. Toss everything.','Top with scallions and serve immediately.'],
 5, 10, 4, 420, 14, 62, 14, 3, 4, 880),

('curated', 'Bon Appétit', 'https://www.bonappetit.com/recipe/chicken-tikka-masala',
 'Chicken Tikka Masala',
 'Tender marinated chicken in a smoky, creamy tomato sauce. The most-ordered dish in British restaurants — and now yours.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
 'Indian', ARRAY['main course'], ARRAY['gluten-free'],
 '[{"name":"chicken thighs","amount":700,"unit":"g"},{"name":"yogurt","amount":200,"unit":"g"},{"name":"crushed tomatoes","amount":400,"unit":"g"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"onion","amount":2,"unit":"large"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"fresh ginger","amount":2,"unit":"tsp"},{"name":"garam masala","amount":2,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"turmeric","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Marinate chicken in yogurt and spices 2 hrs or overnight.','Grill or broil chicken until charred; set aside.','Cook onion, garlic, ginger until golden. Add spices 1 min.','Add tomatoes; simmer 15 min. Blend until smooth.','Stir in cream; add chicken. Simmer 10 min. Serve with rice or naan.'],
 20, 35, 4, 540, 46, 18, 28, 3, 8, 780),

('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/20144/pad-thai',
 'Pad Thai',
 'Street-food-style pad thai: chewy rice noodles, shrimp, egg, bean sprouts, peanuts, and that tangy tamarind sauce.',
 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80',
 'Thai', ARRAY['main course'], ARRAY['dairy-free','gluten-free'],
 '[{"name":"rice noodles","amount":200,"unit":"g"},{"name":"shrimp","amount":300,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"bean sprouts","amount":120,"unit":"g"},{"name":"tamarind paste","amount":3,"unit":"tbsp"},{"name":"fish sauce","amount":2,"unit":"tbsp"},{"name":"brown sugar","amount":1,"unit":"tbsp"},{"name":"crushed peanuts","amount":3,"unit":"tbsp"},{"name":"lime","amount":1,"unit":"whole"},{"name":"scallions","amount":3,"unit":"stalks"}]'::jsonb,
 ARRAY['Soak rice noodles per package. Mix tamarind, fish sauce, sugar for sauce.','Stir-fry shrimp until pink; push aside, scramble eggs.','Add noodles, sauce; toss on high heat.','Add bean sprouts. Top with peanuts, scallions, lime. Serve immediately.'],
 15, 12, 2, 490, 38, 54, 14, 3, 12, 1100),

-- AMERICAN/COMFORT
('curated', 'Serious Eats', 'https://www.seriouseats.com/best-american-cheeseburger-recipe',
 'The Perfect Smash Burger',
 'Thin, crispy-edged patties with maximum crust — the smash technique gives you a burger with more flavour per bite than anything else.',
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
 'American', ARRAY['main course'], ARRAY[]::text[],
 '[{"name":"ground beef","amount":600,"unit":"g (80/20)"},{"name":"burger buns","amount":4,"unit":"brioche"},{"name":"American cheese","amount":4,"unit":"slices"},{"name":"butter","amount":2,"unit":"tbsp"},{"name":"lettuce","amount":4,"unit":"leaves"},{"name":"tomato","amount":1,"unit":"large"},{"name":"pickles","amount":8,"unit":"slices"},{"name":"special sauce","amount":4,"unit":"tbsp"},{"name":"salt","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Divide beef into 150g balls. Season.','Heat cast iron until smoking. Add balls; smash flat with spatula. Season.','Cook 90 sec until edges are crispy. Flip; add cheese. Cook 45 sec.','Toast buns in butter. Assemble with sauce, lettuce, tomato, pickles.'],
 10, 10, 4, 680, 42, 38, 38, 2, 8, 1100),

('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1021494-roasted-chicken',
 'Perfect Roast Chicken',
 'Crispy golden skin, incredibly juicy meat. A well-roasted chicken is one of the most satisfying things you can cook — and this method never fails.',
 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&q=80',
 'American', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"whole chicken","amount":1.8,"unit":"kg"},{"name":"butter","amount":3,"unit":"tbsp"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"thyme","amount":6,"unit":"sprigs"},{"name":"lemon","amount":1,"unit":"whole"},{"name":"salt","amount":2,"unit":"tsp"},{"name":"black pepper","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Dry-brine chicken with salt in fridge overnight.','Bring to room temp 30 min. Stuff cavity with lemon, garlic, thyme.','Rub butter under and over skin. Season.','Roast at 425°F (220°C) for 50–60 min until juices run clear.','Rest 15 min before carving.'],
 15, 60, 4, 580, 52, 2, 38, 0, 0, 740),

-- MEXICAN
('curated', 'Serious Eats', 'https://www.seriouseats.com/carnitas-mexican-slow-cooked-pulled-pork-recipe',
 'Crispy Carnitas',
 'Mexican slow-braised pork that''s tender inside, shatteringly crisp outside. Made in one pot — perfect for tacos, burritos, or just eating straight from the pan.',
 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=800&q=80',
 'Mexican', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"pork shoulder","amount":1.5,"unit":"kg"},{"name":"orange juice","amount":120,"unit":"ml"},{"name":"lime juice","amount":2,"unit":"tbsp"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"oregano","amount":1,"unit":"tsp"},{"name":"bay leaves","amount":3,"unit":"pieces"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
 ARRAY['Cut pork into 8cm chunks. Season with salt, cumin, oregano.','Place in Dutch oven with garlic, orange juice, lime, bay leaves.','Cook covered at 300°F (150°C) for 3–4 hrs until fall-apart tender.','Remove lid. Increase heat to 450°F (230°C). Crisp pork 15–20 min.','Shred and serve in tacos with salsa and lime.'],
 15, 240, 6, 480, 46, 4, 28, 0, 2, 680),

-- MEDITERRANEAN
('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1017161-shakshuka',
 'Shakshuka',
 'Eggs poached in a spiced tomato sauce with peppers and onions. A Middle-Eastern classic that works for breakfast, lunch, or dinner.',
 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80',
 'Mediterranean', ARRAY['breakfast','main course'], ARRAY['vegetarian','vegan','gluten-free'],
 '[{"name":"eggs","amount":6,"unit":"large"},{"name":"crushed tomatoes","amount":400,"unit":"g"},{"name":"red pepper","amount":1,"unit":"large"},{"name":"onion","amount":1,"unit":"medium"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"chilli flakes","amount":0.5,"unit":"tsp"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"fresh parsley","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Sauté onion and pepper until soft. Add garlic and spices; cook 1 min.','Add tomatoes; simmer 10 min until thickened.','Make 6 wells; crack an egg into each.','Cover; simmer 5–7 min until whites are set, yolks runny.','Top with parsley. Serve with crusty bread.'],
 10, 20, 3, 280, 18, 22, 14, 5, 10, 560),

('curated', 'Bon Appétit', 'https://www.bonappetit.com/recipe/hummus',
 'Silky Smooth Hummus',
 'Restaurant-quality hummus at home — the secret is cooking dried chickpeas from scratch and blending them while still warm. Serve with olive oil, paprika, and warm pita.',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80',
 'Mediterranean', ARRAY['side dish','dip'], ARRAY['vegetarian','vegan','gluten-free'],
 '[{"name":"dried chickpeas","amount":250,"unit":"g"},{"name":"tahini","amount":80,"unit":"g"},{"name":"lemon juice","amount":3,"unit":"tbsp"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"cumin","amount":0.5,"unit":"tsp"},{"name":"ice water","amount":4,"unit":"tbsp"},{"name":"salt","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Soak chickpeas overnight; cook with baking soda 1 hr until very soft.','Drain; peel skins (optional but worth it).','Blend warm chickpeas until fine. Add tahini, lemon, garlic, cumin, salt.','Stream in ice water while blending 3–4 min until very smooth.','Serve with olive oil, paprika, and warm pita.'],
 20, 60, 8, 180, 8, 20, 9, 5, 2, 340),

-- BREAKFAST
('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1021244-fluffy-pancakes',
 'Extra-Fluffy Buttermilk Pancakes',
 'Tall, cloud-like pancakes with crispy edges and a tender, tangy crumb. The kind of weekend breakfast you think about all week.',
 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80',
 'American', ARRAY['breakfast'], ARRAY['vegetarian'],
 '[{"name":"all-purpose flour","amount":240,"unit":"g"},{"name":"buttermilk","amount":360,"unit":"ml"},{"name":"eggs","amount":2,"unit":"large"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"baking powder","amount":2,"unit":"tsp"},{"name":"baking soda","amount":0.5,"unit":"tsp"},{"name":"sugar","amount":2,"unit":"tbsp"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Whisk dry ingredients. Whisk wet ingredients separately.','Fold wet into dry until just combined (lumps are fine).','Rest batter 5 min.','Cook on buttered griddle over medium heat until bubbles form; flip once.','Serve immediately with maple syrup.'],
 10, 15, 8, 220, 6, 32, 8, 1, 10, 380),

-- SOUPS
('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/tomato-basil-soup',
 'Roasted Tomato Basil Soup',
 'Sweet, concentrated roasted tomatoes blended with basil and cream. Serve with a grilled cheese for the ultimate comfort meal.',
 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
 'Italian', ARRAY['soup'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"cherry tomatoes","amount":1,"unit":"kg"},{"name":"fresh basil","amount":30,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"vegetable broth","amount":400,"unit":"ml"},{"name":"heavy cream","amount":120,"unit":"ml"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"balsamic vinegar","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Halve tomatoes; toss with oil, garlic, salt. Roast at 400°F 35 min until caramelised.','Sauté onion until soft.','Add roasted tomatoes (and all juices), broth, balsamic. Simmer 10 min.','Blend until smooth. Stir in cream and basil.','Season; serve with crusty bread or grilled cheese.'],
 10, 45, 4, 260, 5, 24, 16, 4, 14, 580),

-- SALADS
('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/greek-salad',
 'Classic Greek Salad',
 'Juicy tomatoes, crisp cucumber, briny olives, and generous feta in a punchy oregano dressing. No lettuce needed — this is the real deal.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'Mediterranean', ARRAY['salad'], ARRAY['vegetarian','gluten-free'],
 '[{"name":"tomatoes","amount":4,"unit":"large"},{"name":"cucumber","amount":1,"unit":"large"},{"name":"red onion","amount":0.5,"unit":"medium"},{"name":"kalamata olives","amount":80,"unit":"g"},{"name":"feta cheese","amount":200,"unit":"g"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"red wine vinegar","amount":1,"unit":"tbsp"},{"name":"dried oregano","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Chop tomatoes and cucumber into large chunks.','Slice red onion thinly; add olives.','Dress with olive oil, vinegar, oregano, salt.','Top with a slab (not crumbled!) of feta.','Serve immediately.'],
 10, 0, 4, 280, 9, 14, 22, 3, 8, 780),

-- DESSERTS
('curated', 'Serious Eats', 'https://www.seriouseats.com/creamy-new-york-cheesecake-recipe',
 'New York Cheesecake',
 'Dense, creamy, lightly tangy — the definitive New York cheesecake. A water bath ensures crack-free perfection every time.',
 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',
 'American', ARRAY['dessert'], ARRAY['vegetarian'],
 '[{"name":"cream cheese","amount":900,"unit":"g"},{"name":"sour cream","amount":240,"unit":"g"},{"name":"sugar","amount":300,"unit":"g"},{"name":"eggs","amount":4,"unit":"large"},{"name":"vanilla extract","amount":2,"unit":"tsp"},{"name":"lemon zest","amount":1,"unit":"tsp"},{"name":"graham crackers","amount":200,"unit":"g (crushed)"},{"name":"butter","amount":6,"unit":"tbsp"}]'::jsonb,
 ARRAY['Mix crumbs and butter; press into 9-inch springform. Bake 10 min.','Beat cream cheese and sugar until smooth. Add eggs one at a time.','Add sour cream, vanilla, lemon. Mix gently.','Pour into pan. Bake in water bath at 325°F (165°C) for 65–75 min.','Cool in oven 1 hr. Chill overnight. Remove springform to serve.'],
 25, 75, 12, 420, 8, 32, 30, 0, 28, 340),

-- HIGH PROTEIN
('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/turkey-meatballs',
 'Lean Turkey Meatballs',
 'Light, herby turkey meatballs that are tender (not dry). Batch-cook and freeze — a week of high-protein meals sorted.',
 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY['high-protein','dairy-free'],
 '[{"name":"ground turkey","amount":700,"unit":"g"},{"name":"breadcrumbs","amount":60,"unit":"g"},{"name":"egg","amount":1,"unit":"large"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"fresh parsley","amount":3,"unit":"tbsp"},{"name":"Italian seasoning","amount":1,"unit":"tsp"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"olive oil","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Mix turkey, breadcrumbs, egg, garlic, herbs, salt.','Roll into 40g balls.','Brown in batches in olive oil 5–6 min, turning.','Finish in tomato sauce 15 min, or bake at 400°F (200°C) for 20 min.'],
 15, 20, 5, 280, 36, 8, 12, 1, 2, 580);
