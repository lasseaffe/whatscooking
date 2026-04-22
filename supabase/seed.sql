-- ============================================================
-- What's Cooking — Curated Recipe Seed Data
-- Run AFTER schema.sql
-- Sources are linked for attribution; recipes are summarized
-- for inspiration, not wholesale reproduction.
-- ============================================================

-- Migration: add source columns if not present (safe to re-run)
alter table recipes add column if not exists source_name text;
alter table recipes add column if not exists source_url  text;
-- Widen source check to allow all sources
alter table recipes drop constraint if exists recipes_source_check;
alter table recipes add constraint recipes_source_check
  check (source in ('spoonacular', 'ai', 'curated', 'user', 'social'));

-- ============================================================
-- DIRTY SODAS (Utah / LDS community favourite)
-- ============================================================

insert into recipes (source, source_name, source_url, title, description, image_url, cuisine_type, dish_types, dietary_tags, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg) values

('curated', 'Swig (Original Utah Dirty Soda)', 'https://www.swigdrinks.com',
 'Classic Dirty Dr Pepper',
 'The original Utah dirty soda that started the craze. Dr Pepper over crushed ice with coconut cream and fresh lime — refreshing, indulgent, and completely non-alcoholic.',
 'https://images.unsplash.com/photo-6ztrgaqQzpQ?w=800&q=80',
 'American', ARRAY['drink','beverage'], ARRAY['vegetarian','vegan'],
 '[{"name":"Dr Pepper","amount":20,"unit":"oz"},{"name":"coconut cream","amount":2,"unit":"tbsp"},{"name":"lime","amount":0.5,"unit":"whole"},{"name":"crushed ice","amount":2,"unit":"cups"}]'::jsonb,
 ARRAY['Fill a large cup with crushed ice.','Pour Dr Pepper over ice.','Add coconut cream — do not stir, let it float.','Squeeze lime over top. Serve with a straw.'],
 3, 0, 1, 280, 1, 52, 7, 0, 48, 65),

('curated', 'NYT Cooking — Inspired', 'https://cooking.nytimes.com',
 'Raspberry Coconut Dirty Sprite',
 'A favourite at Utah soda shops — Sprite with raspberry syrup, coconut cream, and fresh lemon. The tartness balances the sweetness perfectly.',
 'https://images.unsplash.com/photo-CBwoyP69nAU?w=800&q=80',
 'American', ARRAY['drink','beverage'], ARRAY['vegetarian','vegan'],
 '[{"name":"Sprite","amount":20,"unit":"oz"},{"name":"raspberry syrup","amount":2,"unit":"tbsp"},{"name":"coconut cream","amount":2,"unit":"tbsp"},{"name":"lemon","amount":0.5,"unit":"whole"},{"name":"crushed ice","amount":2,"unit":"cups"}]'::jsonb,
 ARRAY['Fill a large cup with crushed ice.','Add raspberry syrup.','Pour Sprite over ice.','Float coconut cream on top.','Finish with a squeeze of lemon.'],
 3, 0, 1, 310, 1, 58, 7, 0, 52, 55),

('curated', 'Sodalicious', 'https://www.sodaliciousdrinks.com',
 'Mango Habanero Dirty Lemonade',
 'A bold Utah soda-shop staple — fresh lemonade with mango syrup, a touch of habanero heat, and a coconut cream float. Sweet, sour, and spicy in every sip.',
 'https://images.unsplash.com/photo-Noqu6R1-aNs?w=800&q=80',
 'American', ARRAY['drink','beverage'], ARRAY['vegetarian','vegan'],
 '[{"name":"lemonade","amount":16,"unit":"oz"},{"name":"mango syrup","amount":2,"unit":"tbsp"},{"name":"habanero syrup","amount":0.5,"unit":"tsp"},{"name":"coconut cream","amount":2,"unit":"tbsp"},{"name":"crushed ice","amount":2,"unit":"cups"}]'::jsonb,
 ARRAY['Fill cup with crushed ice.','Add mango and habanero syrups.','Pour lemonade over ice.','Float coconut cream on top.','Stir gently and serve immediately.'],
 3, 0, 1, 295, 1, 55, 7, 0, 49, 60),

('curated', 'Fiiz Drinks', 'https://www.fiizdrinks.com',
 'Peach Green Tea Dirty Soda',
 'Crisp green tea meets peach nectar and a silky coconut cream float. A lighter dirty soda that feels almost virtuous.',
 'https://images.unsplash.com/photo-dXRRaiF_b_U?w=800&q=80',
 'American', ARRAY['drink','beverage'], ARRAY['vegetarian','vegan'],
 '[{"name":"green tea","amount":12,"unit":"oz"},{"name":"peach syrup","amount":2,"unit":"tbsp"},{"name":"coconut cream","amount":1,"unit":"tbsp"},{"name":"crushed ice","amount":2,"unit":"cups"},{"name":"peach slices","amount":2,"unit":"pieces"}]'::jsonb,
 ARRAY['Brew and chill green tea.','Fill cup with crushed ice.','Add peach syrup.','Pour green tea over ice.','Float coconut cream and garnish with peach slices.'],
 5, 0, 1, 180, 1, 35, 4, 0, 30, 20),

('curated', 'Dirty Dough & Friends (TikTok trend)', 'https://www.tiktok.com/search?q=dirty+soda',
 'Brown Sugar Vanilla Dirty Coke',
 'The TikTok dirty soda that blew up — Coca-Cola with brown sugar syrup, vanilla cream, and lime. Tastes like a dessert in a cup.',
 'https://images.unsplash.com/photo-vRDsrwOl_G4?w=800&q=80',
 'American', ARRAY['drink','beverage'], ARRAY['vegetarian'],
 '[{"name":"Coca-Cola","amount":20,"unit":"oz"},{"name":"brown sugar syrup","amount":2,"unit":"tbsp"},{"name":"heavy cream","amount":2,"unit":"tbsp"},{"name":"vanilla extract","amount":0.25,"unit":"tsp"},{"name":"lime","amount":0.5,"unit":"whole"},{"name":"crushed ice","amount":2,"unit":"cups"}]'::jsonb,
 ARRAY['Mix heavy cream and vanilla extract in a small cup.','Fill a large cup with crushed ice.','Add brown sugar syrup.','Pour Coca-Cola over ice.','Float vanilla cream on top.','Squeeze lime over and serve.'],
 4, 0, 1, 350, 2, 58, 8, 0, 54, 70),

-- ============================================================
-- TRENDING MEALS — AllRecipes / Serious Eats / NYT Cooking
-- ============================================================

('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1020234-sheet-pan-chicken-thighs-with-potatoes-and-arugula',
 'Sheet-Pan Chicken Thighs with Potatoes & Arugula',
 'Crispy skin-on chicken thighs roasted over potatoes until golden, finished with a peppery arugula salad. One pan, big flavour.',
 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=800&q=80',
 'American', ARRAY['main course'], ARRAY['gluten-free','dairy-free'],
 '[{"name":"chicken thighs","amount":4,"unit":"bone-in skin-on"},{"name":"baby potatoes","amount":500,"unit":"g"},{"name":"arugula","amount":60,"unit":"g"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"lemon","amount":1,"unit":"whole"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"black pepper","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Preheat oven to 425°F (220°C).','Halve potatoes and toss with olive oil, salt, and pepper on a sheet pan.','Nestle chicken thighs skin-side up over potatoes.','Roast 40–45 min until skin is crispy and chicken reaches 165°F.','Squeeze lemon over pan, top with arugula and serve immediately.'],
 10, 45, 4, 520, 38, 28, 28, 3, 2, 680),

('curated', 'Serious Eats', 'https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe',
 'Slow-Cooked Bolognese',
 'J. Kenji Lopez-Alt''s definitive bolognese — a rich, deeply savoury meat sauce built with three meats, milk, and a long slow braise. Worth every minute.',
 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=800&q=80',
 'Italian', ARRAY['main course','pasta'], ARRAY[]::text[],
 '[{"name":"ground beef","amount":250,"unit":"g"},{"name":"ground pork","amount":250,"unit":"g"},{"name":"pancetta","amount":100,"unit":"g"},{"name":"onion","amount":1,"unit":"medium"},{"name":"carrot","amount":1,"unit":"medium"},{"name":"celery","amount":2,"unit":"stalks"},{"name":"whole milk","amount":240,"unit":"ml"},{"name":"white wine","amount":240,"unit":"ml"},{"name":"crushed tomatoes","amount":400,"unit":"g"},{"name":"tagliatelle","amount":400,"unit":"g"},{"name":"parmesan","amount":50,"unit":"g"}]'::jsonb,
 ARRAY['Cook pancetta until fat renders. Add onion, carrot, celery; cook until soft.','Add beef and pork; brown well.','Add milk; simmer until absorbed. Add wine; simmer until absorbed.','Add tomatoes; cook on lowest heat 3–4 hours, stirring occasionally.','Season and serve over tagliatelle with parmesan.'],
 20, 240, 6, 680, 42, 55, 28, 4, 8, 890),

('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/8701/garlic-butter-salmon',
 'Garlic Butter Salmon',
 'Pan-seared salmon fillets in a rich garlic butter sauce with lemon and fresh dill. Restaurant quality in under 20 minutes.',
 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
 'American', ARRAY['main course'], ARRAY['gluten-free','high-protein'],
 '[{"name":"salmon fillets","amount":4,"unit":"6oz each"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"lemon","amount":1,"unit":"whole"},{"name":"fresh dill","amount":2,"unit":"tbsp"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"black pepper","amount":0.5,"unit":"tsp"}]'::jsonb,
 ARRAY['Season salmon with salt and pepper.','Melt butter in skillet over medium-high heat.','Add salmon skin-side up; cook 4 min. Flip; cook 3 min more.','Add garlic; cook 1 min until fragrant.','Squeeze lemon over fish, finish with dill and serve.'],
 5, 15, 4, 420, 46, 2, 24, 0, 1, 580),

('curated', 'Bon Appétit', 'https://www.bonappetit.com/recipe/crispy-smashed-potatoes',
 'Crispy Smashed Potatoes',
 'Baby potatoes boiled until tender, smashed flat, then roasted until the edges are shatteringly crisp. A BA classic that never gets old.',
 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
 'American', ARRAY['side dish'], ARRAY['vegetarian','vegan','gluten-free'],
 '[{"name":"baby potatoes","amount":700,"unit":"g"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"flaky salt","amount":1,"unit":"tsp"},{"name":"rosemary","amount":2,"unit":"sprigs"},{"name":"garlic","amount":3,"unit":"cloves"}]'::jsonb,
 ARRAY['Boil potatoes until just tender, about 20 min. Drain and cool slightly.','Preheat oven to 450°F (230°C).','Place potatoes on oiled sheet pan; smash each one flat with a mug.','Drizzle generously with olive oil; top with garlic and rosemary.','Roast 25–30 min until golden and crispy. Season with flaky salt.'],
 5, 50, 4, 280, 4, 40, 12, 4, 2, 420),

('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1015819-black-bean-soup',
 'Smoky Black Bean Soup',
 'A deeply flavoured, completely vegan black bean soup with smoked paprika, cumin, and chipotle. Cheap, fast, and endlessly satisfying.',
 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
 'Mexican', ARRAY['soup'], ARRAY['vegetarian','vegan','gluten-free'],
 '[{"name":"black beans","amount":2,"unit":"cans (drained)"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"smoked paprika","amount":2,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"chipotle in adobo","amount":1,"unit":"tbsp"},{"name":"vegetable broth","amount":750,"unit":"ml"},{"name":"lime","amount":1,"unit":"whole"},{"name":"cilantro","amount":0.25,"unit":"cup"}]'::jsonb,
 ARRAY['Sauté onion until soft. Add garlic, paprika, and cumin; cook 1 min.','Add beans, chipotle, and broth. Simmer 20 min.','Blend half the soup for body; return to pot.','Season, squeeze in lime, top with cilantro.'],
 10, 30, 4, 340, 18, 52, 4, 14, 4, 640),

('curated', 'Serious Eats', 'https://www.seriouseats.com/pan-pizza-recipe',
 'Foolproof Pan Pizza',
 'Kenji''s legendary pan pizza — thick, crispy-bottomed, pillowy-topped. No pizza oven needed. The secret is a well-oiled cast iron pan and a hot oven.',
 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY['vegetarian'],
 '[{"name":"bread flour","amount":300,"unit":"g"},{"name":"instant yeast","amount":1,"unit":"tsp"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"water","amount":225,"unit":"ml"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"crushed tomatoes","amount":200,"unit":"g"},{"name":"mozzarella","amount":200,"unit":"g"},{"name":"fresh basil","amount":10,"unit":"leaves"}]'::jsonb,
 ARRAY['Mix flour, yeast, salt, and water until shaggy. Knead 5 min.','Oil a 10-inch cast iron pan generously. Place dough in pan, stretch to edges.','Rest 2 hours at room temp.','Top with crushed tomatoes and mozzarella.','Bake at 550°F (285°C) for 12–15 min. Finish with basil.'],
 20, 15, 2, 680, 28, 82, 22, 4, 6, 1100),

('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/45609/honey-garlic-shrimp',
 'Honey Garlic Shrimp',
 'Juicy shrimp in a sticky honey garlic sauce — ready in 15 minutes and absolutely addictive over rice or noodles.',
 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
 'Asian', ARRAY['main course'], ARRAY['gluten-free','high-protein'],
 '[{"name":"large shrimp","amount":500,"unit":"g"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"honey","amount":3,"unit":"tbsp"},{"name":"soy sauce","amount":2,"unit":"tbsp"},{"name":"butter","amount":2,"unit":"tbsp"},{"name":"fresh ginger","amount":1,"unit":"tsp"},{"name":"scallions","amount":3,"unit":"stalks"}]'::jsonb,
 ARRAY['Pat shrimp dry and season with salt and pepper.','Melt butter in a large skillet over high heat.','Add shrimp; cook 1 min per side until pink.','Push shrimp to the side. Add garlic and ginger; cook 30 seconds.','Pour in honey and soy sauce. Toss everything together. Top with scallions.'],
 5, 10, 4, 310, 35, 22, 8, 0, 18, 720),

('curated', 'Bon Appétit', 'https://www.bonappetit.com/recipe/spicy-cucumber-salad',
 'Spicy Smashed Cucumber Salad',
 'A BA viral hit — cucumbers smashed to absorb the dressing, tossed with chilli oil, rice vinegar, and sesame. Light, crunchy, and fiery.',
 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&q=80',
 'Asian', ARRAY['salad','side dish'], ARRAY['vegetarian','vegan','gluten-free'],
 '[{"name":"English cucumbers","amount":2,"unit":"large"},{"name":"chilli oil","amount":2,"unit":"tbsp"},{"name":"rice vinegar","amount":1,"unit":"tbsp"},{"name":"soy sauce","amount":1,"unit":"tbsp"},{"name":"sesame oil","amount":1,"unit":"tsp"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"sesame seeds","amount":1,"unit":"tbsp"},{"name":"salt","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Smash cucumbers with flat of a knife; tear into chunks.','Salt cucumbers; rest 10 min. Drain liquid.','Whisk chilli oil, vinegar, soy sauce, sesame oil, and garlic.','Toss cucumbers in dressing. Top with sesame seeds.'],
 15, 0, 4, 95, 2, 8, 6, 1, 4, 580),

('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1023400-creamy-white-beans-with-greens',
 'Creamy White Beans with Greens',
 'A 30-minute dinner that feels deeply nourishing — white beans simmered with garlic and broth until creamy, piled high with wilted kale.',
 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&q=80',
 'Mediterranean', ARRAY['main course','vegetarian main'], ARRAY['vegetarian','vegan','gluten-free','high-protein'],
 '[{"name":"white beans","amount":2,"unit":"cans"},{"name":"kale","amount":200,"unit":"g"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"vegetable broth","amount":400,"unit":"ml"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"lemon","amount":1,"unit":"whole"},{"name":"chilli flakes","amount":0.5,"unit":"tsp"},{"name":"parmesan rind","amount":1,"unit":"piece"}]'::jsonb,
 ARRAY['Heat olive oil; add garlic and chilli flakes. Cook 1 min.','Add beans, broth, and parmesan rind. Simmer 15 min until creamy.','Add kale; stir until wilted, about 3 min.','Squeeze in lemon, adjust seasoning. Serve with crusty bread.'],
 5, 25, 4, 420, 22, 55, 12, 14, 3, 740),

('curated', 'Serious Eats', 'https://www.seriouseats.com/recipes/2011/02/perfect-chocolate-chip-cookies-recipe.html',
 'The Perfect Chocolate Chip Cookie',
 'Kenji''s iconic brown butter, two-chocolate chip cookie. Crispy edges, chewy centre, puddles of chocolate. The benchmark cookie recipe.',
 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
 'American', ARRAY['dessert','baking'], ARRAY['vegetarian'],
 '[{"name":"all-purpose flour","amount":270,"unit":"g"},{"name":"baking soda","amount":1,"unit":"tsp"},{"name":"salt","amount":1.5,"unit":"tsp"},{"name":"brown butter","amount":225,"unit":"g"},{"name":"brown sugar","amount":200,"unit":"g"},{"name":"white sugar","amount":100,"unit":"g"},{"name":"eggs","amount":2,"unit":"large"},{"name":"vanilla extract","amount":2,"unit":"tsp"},{"name":"chocolate chips","amount":340,"unit":"g"}]'::jsonb,
 ARRAY['Brown butter until nutty and golden. Cool completely.','Beat butter and sugars until fluffy. Add eggs and vanilla.','Fold in flour, baking soda, and salt. Add chocolate chips.','Rest dough in fridge 24–72 hours for best flavour.','Bake at 375°F (190°C) for 10–12 min. Centres should look underdone.'],
 20, 12, 36, 190, 2, 24, 10, 1, 16, 150),

('curated', 'Instagram @minimalistbaker', 'https://www.instagram.com/minimalistbaker',
 '1-Bowl Vegan Banana Bread',
 'Dana''s legendary banana bread — one bowl, no mixer, naturally sweetened. Perfectly moist and packed with banana flavour.',
 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800&q=80',
 'American', ARRAY['baking','breakfast'], ARRAY['vegetarian','vegan','dairy-free'],
 '[{"name":"ripe bananas","amount":3,"unit":"large"},{"name":"coconut oil","amount":3,"unit":"tbsp"},{"name":"maple syrup","amount":3,"unit":"tbsp"},{"name":"flax egg","amount":1,"unit":"(1 tbsp flax + 3 tbsp water)"},{"name":"vanilla extract","amount":1,"unit":"tsp"},{"name":"baking soda","amount":1,"unit":"tsp"},{"name":"salt","amount":0.5,"unit":"tsp"},{"name":"all-purpose flour","amount":190,"unit":"g"},{"name":"walnuts","amount":60,"unit":"g"}]'::jsonb,
 ARRAY['Preheat oven to 350°F (175°C). Prepare flax egg; rest 5 min.','Mash bananas. Mix in oil, maple syrup, flax egg, and vanilla.','Add flour, baking soda, and salt. Fold in walnuts.','Pour into greased loaf pan.','Bake 55–65 min until a toothpick comes out clean.'],
 10, 60, 10, 195, 3, 30, 8, 2, 12, 160),

('curated', 'TikTok @nisha.vora', 'https://www.tiktok.com/search?q=viral+marry+me+chicken',
 'Viral Marry Me Chicken',
 'The TikTok recipe that''s closing deals — juicy chicken in a sun-dried tomato cream sauce so good, legend has it proposals follow.',
 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY[]::text[],
 '[{"name":"chicken breasts","amount":4,"unit":"boneless"},{"name":"sun-dried tomatoes","amount":60,"unit":"g"},{"name":"heavy cream","amount":240,"unit":"ml"},{"name":"chicken broth","amount":120,"unit":"ml"},{"name":"parmesan","amount":50,"unit":"g"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"fresh thyme","amount":4,"unit":"sprigs"},{"name":"chilli flakes","amount":0.5,"unit":"tsp"},{"name":"olive oil","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Season and sear chicken in olive oil 4 min per side. Remove.','Add garlic and sun-dried tomatoes; cook 1 min.','Add broth and cream; simmer 5 min. Stir in parmesan.','Return chicken; simmer 10 min until cooked through.','Top with thyme and chilli flakes. Serve over pasta or mashed potato.'],
 10, 25, 4, 560, 48, 8, 36, 1, 4, 820),

('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/228823/quick-chicken-piccata',
 'Classic Chicken Piccata',
 'Thin chicken cutlets in a bright lemon-butter-caper sauce. An Italian-American staple that takes 20 minutes start to finish.',
 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
 'Italian', ARRAY['main course'], ARRAY[]::text[],
 '[{"name":"chicken cutlets","amount":4,"unit":"thin"},{"name":"flour","amount":4,"unit":"tbsp"},{"name":"lemon","amount":2,"unit":"whole"},{"name":"capers","amount":2,"unit":"tbsp"},{"name":"white wine","amount":120,"unit":"ml"},{"name":"chicken broth","amount":120,"unit":"ml"},{"name":"butter","amount":4,"unit":"tbsp"},{"name":"fresh parsley","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Dredge cutlets in flour. Brown in olive oil 2–3 min per side. Remove.','Add wine and broth; reduce by half.','Squeeze in lemon; add capers.','Swirl in butter off heat.','Return chicken to pan, top with parsley.'],
 10, 15, 4, 420, 38, 14, 22, 1, 2, 680)

;

-- ============================================================
-- Update discover index
-- ============================================================
create index if not exists recipes_source_name_idx on recipes(source_name);
create index if not exists recipes_dish_types_idx on recipes using gin(dish_types);
create index if not exists recipes_dietary_tags_idx on recipes using gin(dietary_tags);
