-- ══════════════════════════════════════════════════════════════════
-- MORE WORLD CUISINE RECIPES — French, Italian, Greek, Japanese,
-- Vietnamese, Korean, Thai, Indian, Moroccan, Lebanese, Mexican,
-- Chinese, Spanish, Portuguese, Egyptian, Tunisian
-- ══════════════════════════════════════════════════════════════════

INSERT INTO recipes (source, source_name, source_url, title, description, image_url, cuisine_type, dish_types, dietary_tags, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg) VALUES

-- ══ FRENCH ════════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/coq-au-vin',
 'Coq au Vin',
 'Chicken braised in red wine with mushrooms, lardons, and pearl onions. The definitive French braise — deeply savory and made for crusty bread.',
 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
 'French',ARRAY['dinner','braise'],ARRAY[]::text[],
 '[{"name":"chicken thighs and drumsticks","amount":1.5,"unit":"kg"},{"name":"red wine","amount":750,"unit":"ml (Burgundy)"},{"name":"lardons or bacon","amount":200,"unit":"g"},{"name":"mushrooms","amount":250,"unit":"g"},{"name":"pearl onions","amount":200,"unit":"g"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"thyme","amount":4,"unit":"sprigs"},{"name":"bay leaves","amount":2,"unit":"whole"},{"name":"chicken stock","amount":200,"unit":"ml"},{"name":"flour","amount":2,"unit":"tbsp"},{"name":"butter","amount":30,"unit":"g"}]'::jsonb,
 ARRAY['Marinate chicken in wine, thyme, bay, garlic overnight or 4 hours.','Remove chicken, pat dry, reserve marinade.','Brown lardons in Dutch oven, remove.','Brown chicken in batches in bacon fat — deep golden. Remove.','Sauté onions and mushrooms until golden.','Add tomato paste, cook 1 min.','Sprinkle flour over vegetables, stir.','Add marinade and stock. Scrape up all fond.','Return chicken and lardons. Simmer 45 min covered until chicken is very tender.','Remove chicken, reduce sauce to coating consistency.','Swirl in butter.'],
 20,90,4,520,45,18,28,2,6,780),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/french-onion-soup',
 'French Onion Soup',
 'Three hours of caramelised onions, good beef broth, a crouton, and a blanket of melted Gruyère. The greatest soup in the world.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
 'French',ARRAY['soup'],ARRAY[]::text[],
 '[{"name":"yellow onions","amount":1.5,"unit":"kg (sliced thin)"},{"name":"unsalted butter","amount":60,"unit":"g"},{"name":"dry white wine","amount":200,"unit":"ml"},{"name":"beef stock","amount":1.5,"unit":"L"},{"name":"Gruyère","amount":200,"unit":"g (grated)"},{"name":"baguette","amount":4,"unit":"thick slices"},{"name":"thyme","amount":4,"unit":"sprigs"},{"name":"bay leaves","amount":2,"unit":"whole"},{"name":"Worcestershire sauce","amount":1,"unit":"tbsp"},{"name":"flour","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Melt butter in large pot. Add onions and pinch of salt.','Cook on medium, stirring every 10 min, for 60–90 min until deep mahogany.','Add flour, cook 1 min.','Add wine, scrape bottom.','Add stock, thyme, bay, Worcestershire. Simmer 30 min.','Toast baguette slices until dry.','Ladle soup into oven-safe bowls. Place crouton on top. Pile on Gruyère.','Broil until cheese bubbles and browns.'],
 15,120,4,380,18,32,18,4,12,1100),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/nicoise-salad',
 'Salade Niçoise',
 'Tuna, hard-boiled eggs, green beans, potatoes, olives, and anchovies with a Dijon vinaigrette. Nice''s signature — better than any version in the rest of France.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'French',ARRAY['salad','lunch'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"sushi-grade tuna","amount":300,"unit":"g (or 2 cans quality tuna)"},{"name":"small potatoes","amount":400,"unit":"g"},{"name":"green beans","amount":200,"unit":"g"},{"name":"eggs","amount":4,"unit":"whole"},{"name":"cherry tomatoes","amount":200,"unit":"g"},{"name":"niçoise olives","amount":80,"unit":"g"},{"name":"anchovy fillets","amount":8,"unit":"whole"},{"name":"Dijon mustard","amount":2,"unit":"tsp"},{"name":"red wine vinegar","amount":2,"unit":"tbsp"},{"name":"extra virgin olive oil","amount":5,"unit":"tbsp"}]'::jsonb,
 ARRAY['Boil potatoes until just tender.','Blanch green beans 3 min.','Boil eggs 7 min; peel and halve.','Make vinaigrette: whisk mustard, vinegar, then whisk in oil.','Arrange all components on a platter.','Drizzle vinaigrette over everything.'],
 20,15,4,420,32,28,20,5,6,680),

('curated','Serious Eats','https://www.seriouseats.com/croque-monsieur',
 'Croque Monsieur',
 'Ham and Gruyère toasted sandwich with béchamel. France''s answer to the toastie — and the correct answer.',
 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80',
 'French',ARRAY['lunch','sandwich'],ARRAY[]::text[],
 '[{"name":"sourdough or pain de mie","amount":4,"unit":"thick slices"},{"name":"Gruyère","amount":120,"unit":"g (grated)"},{"name":"cooked ham","amount":120,"unit":"g (sliced)"},{"name":"Dijon mustard","amount":2,"unit":"tsp"},{"name":"butter","amount":30,"unit":"g"},{"name":"flour","amount":20,"unit":"g"},{"name":"whole milk","amount":200,"unit":"ml"},{"name":"nutmeg","amount":1,"unit":"pinch"}]'::jsonb,
 ARRAY['Make béchamel: melt butter, stir in flour, cook 1 min, add milk gradually, stir until thick. Season with salt and nutmeg.','Spread mustard on 2 bread slices. Layer ham and half the Gruyère.','Spread béchamel on the other slices. Sandwich together.','Heat butter in pan, toast sandwiches until golden on both sides.','Spoon remaining béchamel on top, add remaining cheese.','Grill/broil 3–4 min until bubbly and golden.'],
 10,15,2,620,32,42,34,2,6,1100),

-- ══ ITALIAN ═══════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/carbonara-recipe',
 'Spaghetti alla Carbonara',
 'Pasta, guanciale, eggs, Pecorino Romano, black pepper. Five ingredients, extraordinary result. The Roman trinity.',
 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
 'Italian',ARRAY['dinner','pasta'],ARRAY[]::text[],
 '[{"name":"spaghetti","amount":400,"unit":"g"},{"name":"guanciale or pancetta","amount":150,"unit":"g"},{"name":"eggs","amount":4,"unit":"whole"},{"name":"egg yolks","amount":2,"unit":"extra"},{"name":"Pecorino Romano","amount":100,"unit":"g (finely grated)"},{"name":"black pepper","amount":2,"unit":"tsp (coarsely ground)"},{"name":"salt","amount":1,"unit":"tbsp (for pasta water)"}]'::jsonb,
 ARRAY['Render guanciale in a dry pan until fat has rendered and edges are crispy. Remove from heat.','Whisk eggs, yolks, and Pecorino with plenty of black pepper until smooth.','Cook pasta in well-salted boiling water until al dente.','Reserve 200ml pasta water.','Add hot pasta to guanciale pan (off heat).','Working quickly, add egg mixture and toss vigorously, adding pasta water splash by splash to create a creamy sauce. Never let it scramble.','Serve immediately with more Pecorino.'],
 5,15,4,580,28,70,20,2,2,780),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/pizza-margherita',
 'Pizza Margherita',
 'Neapolitan dough, San Marzano tomatoes, fior di latte mozzarella, and fresh basil. The pizza that all others are measured against.',
 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
 'Italian',ARRAY['dinner','pizza'],ARRAY['vegetarian'],
 '[{"name":"pizza dough","amount":280,"unit":"g"},{"name":"San Marzano tomatoes","amount":200,"unit":"g (crushed by hand)"},{"name":"fior di latte mozzarella","amount":150,"unit":"g"},{"name":"fresh basil","amount":8,"unit":"leaves"},{"name":"extra virgin olive oil","amount":2,"unit":"tbsp"},{"name":"sea salt","amount":1,"unit":"pinch"},{"name":"semolina","amount":2,"unit":"tbsp (for launching)"}]'::jsonb,
 ARRAY['Preheat oven to maximum temperature (ideally 280°C/550°F) with a baking steel or stone on top rack.','Season crushed tomatoes with salt and a drizzle of olive oil. Do not cook.','Stretch dough on semolina to a 30cm circle.','Spread tomato sauce leaving a 1cm border.','Tear mozzarella over pizza.','Launch onto hot steel/stone.','Bake 8–10 min until crust is charred and cheese is bubbling.','Top with fresh basil and olive oil.'],
 20,10,2,480,22,62,16,3,8,640),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/osso-buco',
 'Osso Buco alla Milanese',
 'Veal shanks braised with white wine, stock, and vegetables until the bone marrow melts into the sauce. Served with gremolata and saffron risotto.',
 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
 'Italian',ARRAY['dinner','braise'],ARRAY['gluten-free'],
 '[{"name":"veal shanks","amount":4,"unit":"cross-cut (5cm thick)"},{"name":"white wine","amount":250,"unit":"ml"},{"name":"chicken stock","amount":400,"unit":"ml"},{"name":"canned tomatoes","amount":200,"unit":"g"},{"name":"onion","amount":1,"unit":"diced"},{"name":"carrot","amount":1,"unit":"diced"},{"name":"celery","amount":2,"unit":"stalks, diced"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"gremolata (lemon zest, garlic, parsley)","amount":1,"unit":"batch"}]'::jsonb,
 ARRAY['Tie kitchen twine around each shank to hold shape. Season, dust with flour.','Brown shanks deeply on all sides in olive oil — 4 min per side.','Remove. Sauté onion, carrot, celery until soft.','Add garlic and tomato paste, cook 1 min.','Add wine, reduce by half.','Add stock and tomatoes. Return shanks. Liquid should reach halfway up meat.','Braise at 160°C/325°F for 2 hours covered, 30 min uncovered.','Serve with gremolata scattered over.'],
 20,160,4,480,45,14,24,3,6,620),

-- ══ GREEK ═════════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/moussaka-recipe',
 'Moussaka',
 'Layers of spiced lamb mince, roasted aubergine, and a thick béchamel crust. The Greek lasagne and infinitely superior.',
 'https://images.unsplash.com/photo-1599021419847-d8a7a6aba5b4?w=800&q=80',
 'Greek',ARRAY['dinner'],ARRAY[]::text[],
 '[{"name":"aubergine","amount":2,"unit":"large (sliced 1cm)"},{"name":"minced lamb","amount":600,"unit":"g"},{"name":"onion","amount":1,"unit":"large, diced"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"canned tomatoes","amount":400,"unit":"g"},{"name":"cinnamon","amount":1,"unit":"tsp"},{"name":"allspice","amount":0.5,"unit":"tsp"},{"name":"red wine","amount":100,"unit":"ml"},{"name":"butter","amount":60,"unit":"g"},{"name":"flour","amount":60,"unit":"g"},{"name":"whole milk","amount":600,"unit":"ml"},{"name":"eggs","amount":2,"unit":"whole"},{"name":"Parmesan","amount":50,"unit":"g"}]'::jsonb,
 ARRAY['Salt aubergine slices and leave 20 min. Rinse, pat dry, grill or roast until golden.','Brown lamb with onion and garlic.','Add tomatoes, wine, cinnamon, allspice. Simmer 20 min.','Make béchamel: melt butter, add flour, gradually add milk, stir until thick. Cool slightly, beat in eggs and Parmesan.','Layer in baking dish: lamb, aubergine, lamb, aubergine, béchamel on top.','Bake 180°C/350°F for 45 min until golden.','Rest 20 min before cutting.'],
 30,100,6,520,32,30,32,5,8,680),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/spanakopita',
 'Spanakopita',
 'Crisp phyllo pastry filled with spinach, feta, dill, and egg. A Greek classic — flaky on the outside, savory and herby inside.',
 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80',
 'Greek',ARRAY['appetizer','lunch'],ARRAY['vegetarian'],
 '[{"name":"phyllo pastry","amount":250,"unit":"g"},{"name":"spinach","amount":800,"unit":"g (fresh or frozen)"},{"name":"feta","amount":300,"unit":"g"},{"name":"eggs","amount":2,"unit":"whole"},{"name":"onion","amount":1,"unit":"large, finely chopped"},{"name":"spring onions","amount":4,"unit":"chopped"},{"name":"fresh dill","amount":1,"unit":"large bunch"},{"name":"olive oil","amount":100,"unit":"ml"},{"name":"butter","amount":50,"unit":"g (melted)"}]'::jsonb,
 ARRAY['Wilt spinach. Squeeze out ALL moisture.','Sauté onion until soft. Cool.','Mix spinach, onion, spring onions, feta, eggs, dill. Season.','Brush baking tin with butter.','Layer 6 phyllo sheets, brushing each with butter/olive oil.','Add filling. Fold overhanging phyllo over.','Layer remaining phyllo on top, each brushed, tucking in edges.','Score top with a knife. Brush with egg wash.','Bake 180°C/350°F for 40–45 min until deep golden.'],
 30,45,8,340,12,28,20,3,2,620),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/greek-lamb-souvlaki',
 'Lamb Souvlaki with Tzatziki',
 'Marinated lamb skewers grilled over high heat, served with homemade tzatziki in warm flatbread. The street food that launched a thousand kebab shops.',
 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80',
 'Greek',ARRAY['dinner','bbq'],ARRAY['gluten-free'],
 '[{"name":"lamb shoulder","amount":700,"unit":"g (cubed)"},{"name":"olive oil","amount":4,"unit":"tbsp"},{"name":"lemon juice","amount":3,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"dried oregano","amount":2,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"Greek yogurt","amount":250,"unit":"g"},{"name":"cucumber","amount":0.5,"unit":"grated + squeezed"},{"name":"dill","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Marinate lamb in olive oil, lemon, garlic, oregano, cumin for at least 4 hours.','Make tzatziki: combine yogurt, cucumber, dill, garlic, salt. Chill.','Thread lamb onto skewers.','Grill on high heat 8–10 min, turning every 2 min.','Rest 5 min.','Serve with tzatziki, flatbread, and lemon wedges.'],
 20,15,4,420,35,6,28,1,4,450),

-- ══ JAPANESE ══════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/tonkotsu-ramen',
 'Tonkotsu Ramen',
 'Pork bones simmered for 12 hours until the broth is milky white and impossibly rich. Topped with chashu pork, soft-boiled egg, nori, and bamboo shoots.',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
 'Japanese',ARRAY['soup','dinner'],ARRAY['dairy-free'],
 '[{"name":"pork neck bones","amount":1.5,"unit":"kg"},{"name":"pork belly","amount":500,"unit":"g (for chashu)"},{"name":"ramen noodles","amount":400,"unit":"g"},{"name":"eggs","amount":4,"unit":"whole"},{"name":"soy sauce","amount":6,"unit":"tbsp"},{"name":"mirin","amount":3,"unit":"tbsp"},{"name":"sake","amount":3,"unit":"tbsp"},{"name":"nori","amount":4,"unit":"sheets"},{"name":"bamboo shoots","amount":100,"unit":"g"},{"name":"spring onions","amount":4,"unit":"sliced"},{"name":"sesame oil","amount":2,"unit":"tsp"}]'::jsonb,
 ARRAY['Blanch bones in boiling water 10 min, drain, rinse.','Simmer bones in fresh water at rolling boil 12 hours, adding water as needed. Broth should turn milky white.','Season with salt.','Make chashu: roll pork belly, tie, braise in soy/mirin/sake/water 2 hours.','Marinate soft-boiled eggs in leftover chashu liquid 6+ hours.','Assemble: hot broth, cooked noodles, sliced chashu, halved egg, nori, bamboo shoots, spring onions.'],
 30,720,4,680,42,58,28,2,6,1200),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/chicken-katsu-curry',
 'Chicken Katsu Curry',
 'Crispy panko-breaded chicken cutlet on rice with sweet Japanese curry sauce. Comfort food at its most approachable.',
 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
 'Japanese',ARRAY['dinner'],ARRAY['dairy-free'],
 '[{"name":"chicken breasts","amount":4,"unit":"whole (butterflied)"},{"name":"panko breadcrumbs","amount":200,"unit":"g"},{"name":"eggs","amount":2,"unit":"beaten"},{"name":"flour","amount":60,"unit":"g"},{"name":"Japanese curry blocks","amount":2,"unit":"blocks (S&B Golden)"},{"name":"onion","amount":1,"unit":"large, diced"},{"name":"carrot","amount":1,"unit":"diced"},{"name":"potato","amount":1,"unit":"diced"},{"name":"Japanese short-grain rice","amount":300,"unit":"g"}]'::jsonb,
 ARRAY['Make curry sauce: sauté onion, add carrots and potato, add 600ml water.','Simmer 15 min until vegetables tender.','Add curry blocks, stir until dissolved. Simmer 5 min.','Bread chicken: flour → egg → panko, pressing firmly.','Shallow fry at 170°C until golden, 3 min per side.','Drain and slice diagonally.','Serve sliced katsu over rice with curry poured alongside.'],
 20,30,4,620,42,72,18,4,8,980),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/gyoza',
 'Pork & Cabbage Gyoza',
 'Juicy pork and cabbage dumplings pan-fried until one side is deeply golden, then steamed — the classic Japanese potsticker technique.',
 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80',
 'Japanese',ARRAY['appetizer','dinner'],ARRAY['dairy-free'],
 '[{"name":"gyoza wrappers","amount":40,"unit":"whole"},{"name":"pork mince","amount":300,"unit":"g"},{"name":"cabbage","amount":150,"unit":"g (finely shredded + salted)"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"ginger","amount":2,"unit":"cm"},{"name":"soy sauce","amount":2,"unit":"tbsp"},{"name":"sesame oil","amount":1,"unit":"tbsp"},{"name":"spring onions","amount":3,"unit":"finely sliced"},{"name":"vegetable oil","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Salt cabbage, leave 10 min, squeeze out all moisture.','Mix pork, cabbage, garlic, ginger, soy, sesame oil, spring onions.','Place 1 tsp filling in wrapper centre. Moisten edge with water, fold and pleat.','Heat oil in non-stick pan. Arrange gyoza flat-side down in single layer.','Cook until golden underneath, 2–3 min.','Add 60ml water, cover immediately. Steam 3 min.','Remove lid, let water evaporate, cook 1 more min.','Serve with dipping sauce: soy + rice vinegar + chilli oil.'],
 40,15,4,380,22,42,14,2,4,840),

-- ══ VIETNAMESE ════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/beef-pho-recipe',
 'Beef Pho (Phở Bò)',
 'Rich, aromatic beef broth with star anise, cinnamon, and charred ginger, ladled over rice noodles and thinly sliced beef. The soul of Vietnamese cooking.',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80',
 'Vietnamese',ARRAY['soup','dinner'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"beef marrow bones","amount":1.5,"unit":"kg"},{"name":"beef brisket","amount":500,"unit":"g"},{"name":"flat rice noodles","amount":400,"unit":"g"},{"name":"white onion","amount":1,"unit":"halved, charred"},{"name":"ginger","amount":5,"unit":"cm, charred"},{"name":"star anise","amount":5,"unit":"whole"},{"name":"cinnamon","amount":1,"unit":"stick"},{"name":"coriander seeds","amount":1,"unit":"tbsp"},{"name":"fish sauce","amount":3,"unit":"tbsp"},{"name":"bean sprouts","amount":200,"unit":"g"},{"name":"fresh basil","amount":1,"unit":"bunch"},{"name":"lime","amount":2,"unit":"wedged"}]'::jsonb,
 ARRAY['Blanch bones and brisket in boiling water 10 min. Drain, rinse.','Char onion and ginger directly over flame.','Toast star anise, cinnamon, coriander in dry pan.','Simmer bones with spices, charred vegetables, and fish sauce for 4–6 hours.','Strain broth. Slice brisket thin.','Cook noodles per package.','Ladle hot broth over noodles. Add brisket and raw thinly sliced beef (raw beef cooks in the hot broth).','Serve with bean sprouts, basil, lime on the side.'],
 30,360,4,420,32,50,8,2,4,1100),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/bun-bo-nam-bo',
 'Vietnamese Lemongrass Beef Noodle Bowl',
 'Rice vermicelli topped with caramelised lemongrass beef, pickled vegetables, herbs, and a fish sauce dressing. Hanoi on a plate.',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80',
 'Vietnamese',ARRAY['dinner','salad'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"beef sirloin","amount":400,"unit":"g (thin sliced)"},{"name":"lemongrass","amount":3,"unit":"stalks"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"shallots","amount":3,"unit":"whole"},{"name":"rice vermicelli","amount":200,"unit":"g"},{"name":"fish sauce","amount":4,"unit":"tbsp"},{"name":"lime juice","amount":3,"unit":"tbsp"},{"name":"sugar","amount":2,"unit":"tbsp"},{"name":"carrot","amount":1,"unit":"julienned and pickled"},{"name":"bean sprouts","amount":150,"unit":"g"},{"name":"mint and coriander","amount":1,"unit":"large bunch"}]'::jsonb,
 ARRAY['Make nuoc cham dressing: mix fish sauce, lime, sugar, water, chilli.','Marinate beef in minced lemongrass, garlic, shallots, fish sauce, sugar.','Sear beef in very hot pan until caramelised — 2 min max. Set aside.','Soak and cook vermicelli per package.','Assemble: noodles, beef, bean sprouts, pickled carrots, fresh herbs.','Drizzle generously with nuoc cham.'],
 30,10,4,380,28,48,8,3,6,980),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/banh-mi',
 'Bánh Mì Thịt Nướng',
 'A Vietnamese baguette filled with grilled pork, pâté, pickled daikon and carrot, fresh herbs, jalapeño, and mayo. The world''s greatest sandwich.',
 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80',
 'Vietnamese',ARRAY['lunch','sandwich'],ARRAY['dairy-free'],
 '[{"name":"Vietnamese baguette or demi baguette","amount":4,"unit":"whole"},{"name":"pork shoulder","amount":500,"unit":"g (sliced thin)"},{"name":"lemongrass","amount":2,"unit":"stalks"},{"name":"fish sauce","amount":3,"unit":"tbsp"},{"name":"daikon","amount":100,"unit":"g julienned"},{"name":"carrot","amount":1,"unit":"julienned"},{"name":"rice vinegar","amount":3,"unit":"tbsp"},{"name":"sugar","amount":2,"unit":"tbsp"},{"name":"pâté","amount":80,"unit":"g"},{"name":"mayonnaise","amount":4,"unit":"tbsp"},{"name":"jalapeño","amount":1,"unit":"sliced"},{"name":"coriander","amount":1,"unit":"large bunch"}]'::jsonb,
 ARRAY['Quick pickle: combine daikon, carrot, vinegar, sugar, salt. Let sit 30 min.','Marinate pork in lemongrass, fish sauce, sugar, garlic for 2 hours.','Grill pork over high heat until caramelised.','Warm baguettes in oven.','Spread mayo then pâté on bread.','Layer pork, pickled vegetables, jalapeño, coriander.'],
 30,15,4,520,28,52,22,3,8,980),

-- ══ KOREAN ════════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/korean-bbq-bulgogi',
 'Bulgogi (Korean BBQ Beef)',
 'Thinly sliced marinated beef grilled over charcoal — the quintessential Korean BBQ. Sweet, savoury, and smoky.',
 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
 'Korean',ARRAY['dinner','bbq'],ARRAY['dairy-free'],
 '[{"name":"beef ribeye or sirloin","amount":600,"unit":"g (sliced 3mm)"},{"name":"gochujang","amount":1,"unit":"tbsp"},{"name":"soy sauce","amount":4,"unit":"tbsp"},{"name":"sesame oil","amount":2,"unit":"tbsp"},{"name":"pear or Asian pear","amount":0.5,"unit":"grated"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"ginger","amount":2,"unit":"cm"},{"name":"sugar","amount":2,"unit":"tbsp"},{"name":"sesame seeds","amount":2,"unit":"tbsp"},{"name":"spring onions","amount":4,"unit":"sliced"}]'::jsonb,
 ARRAY['Blend pear with soy, sesame oil, garlic, ginger, gochujang, sugar to make marinade.','Add beef, coat thoroughly. Marinate 30 min minimum, up to overnight.','Cook on screaming hot griddle or BBQ, 1–2 min per side — don''t overcrowd.','Serve with lettuce leaves for wrapping, steamed rice, kimchi, banchan (side dishes).'],
 15,10,4,420,32,18,24,1,14,820),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/kimchi-jjigae',
 'Kimchi Jjigae (Kimchi Stew)',
 'Sour, aged kimchi simmered with pork belly, tofu, and gochugaru into a fiery, funky, deeply savoury stew. Better with older kimchi.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
 'Korean',ARRAY['soup','dinner'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"aged kimchi","amount":300,"unit":"g (aged 2+ weeks)"},{"name":"pork belly","amount":200,"unit":"g"},{"name":"firm tofu","amount":300,"unit":"g"},{"name":"gochugaru","amount":2,"unit":"tbsp"},{"name":"gochujang","amount":1,"unit":"tbsp"},{"name":"soy sauce","amount":2,"unit":"tbsp"},{"name":"sesame oil","amount":1,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"spring onions","amount":3,"unit":"sliced"},{"name":"anchovy stock or water","amount":400,"unit":"ml"}]'::jsonb,
 ARRAY['Sauté pork belly until slightly golden.','Add garlic and gochugaru, stir 1 min.','Add kimchi and kimchi juice. Stir-fry 3 min.','Add stock, gochujang, soy sauce. Bring to boil.','Add tofu cut in cubes. Simmer 15 min.','Drizzle sesame oil, top with spring onions.','Serve with steamed rice.'],
 10,25,3,380,22,14,28,3,4,1100),

-- ══ THAI ══════════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/pad-thai-recipe',
 'Pad Thai',
 'Stir-fried rice noodles with egg, shrimp, tofu, and the indispensable tamarind-fish sauce dressing. The most ordered Thai dish in the world, for excellent reason.',
 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80',
 'Thai',ARRAY['dinner'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"rice noodles (5mm)","amount":200,"unit":"g"},{"name":"shrimp","amount":200,"unit":"g"},{"name":"firm tofu","amount":150,"unit":"g (cubed)"},{"name":"eggs","amount":3,"unit":"whole"},{"name":"bean sprouts","amount":150,"unit":"g"},{"name":"tamarind paste","amount":3,"unit":"tbsp"},{"name":"fish sauce","amount":3,"unit":"tbsp"},{"name":"palm sugar","amount":2,"unit":"tbsp"},{"name":"dried shrimp","amount":2,"unit":"tbsp"},{"name":"spring onions","amount":4,"unit":"sliced"},{"name":"peanuts","amount":60,"unit":"g (crushed)"},{"name":"lime","amount":2,"unit":"wedged"}]'::jsonb,
 ARRAY['Soak noodles in warm water 30 min.','Mix tamarind, fish sauce, palm sugar to make the sauce.','Fry tofu in oil until golden. Remove.','Fry dried shrimp and garlic 30 seconds.','Add shrimp, cook 1 min.','Push to side, scramble eggs.','Add drained noodles and sauce. Toss constantly.','Add tofu, bean sprouts, spring onions. Toss 1 min.','Serve with peanuts, lime, chilli flakes.'],
 20,15,2,520,28,62,18,3,14,1100),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/green-papaya-salad',
 'Som Tam (Green Papaya Salad)',
 'Shredded unripe papaya pounded with garlic, chillies, fish sauce, lime, and palm sugar. Thailand''s most eaten salad — and most addictive.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'Thai',ARRAY['salad'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"green papaya","amount":400,"unit":"g (shredded)"},{"name":"cherry tomatoes","amount":100,"unit":"g"},{"name":"green beans","amount":80,"unit":"g"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"bird''s eye chillies","amount":3,"unit":"whole"},{"name":"fish sauce","amount":3,"unit":"tbsp"},{"name":"lime juice","amount":3,"unit":"tbsp"},{"name":"palm sugar","amount":2,"unit":"tbsp"},{"name":"dried shrimp","amount":2,"unit":"tbsp"},{"name":"peanuts","amount":40,"unit":"g"}]'::jsonb,
 ARRAY['Pound garlic and chillies in mortar to a rough paste.','Add tomatoes and green beans, lightly bruise.','Add papaya, toss.','Add fish sauce, lime, sugar. Pound and toss until well combined.','Taste — it should be simultaneously spicy, sour, sweet, and salty.','Transfer to plate, top with peanuts.'],
 15,0,2,180,8,28,4,4,18,840),

-- ══ INDIAN ════════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/chicken-tikka-masala',
 'Chicken Tikka Masala',
 'Charred yogurt-marinated chicken in a creamy tomato-spice sauce. Britain''s national dish by popular vote, and India''s most globally beloved recipe.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
 'Indian',ARRAY['dinner','curry'],ARRAY['gluten-free'],
 '[{"name":"chicken thighs","amount":700,"unit":"g"},{"name":"full-fat yogurt","amount":200,"unit":"g"},{"name":"garam masala","amount":3,"unit":"tsp"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"smoked paprika","amount":2,"unit":"tsp"},{"name":"turmeric","amount":1,"unit":"tsp"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"ginger","amount":3,"unit":"cm"},{"name":"canned tomatoes","amount":400,"unit":"g"},{"name":"double cream","amount":150,"unit":"ml"},{"name":"onion","amount":1,"unit":"large"},{"name":"fenugreek leaves","amount":1,"unit":"tsp (dried)"}]'::jsonb,
 ARRAY['Marinate chicken in yogurt, half the spices, garlic, ginger for 4+ hours.','Grill or broil chicken until charred and cooked through. Cut into chunks.','Sauté onion until deep golden, 15 min.','Add remaining spices and cook 2 min.','Add tomatoes, simmer 15 min.','Blend sauce until smooth.','Add cream and fenugreek. Simmer 5 min.','Add chicken. Simmer 5 min. Serve with naan.'],
 20,40,4,480,38,18,28,3,8,680),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/saag-paneer',
 'Saag Paneer',
 'Creamy spiced spinach with cubes of fresh Indian cheese. A Punjabi masterpiece that converts even spinach sceptics.',
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
 'Indian',ARRAY['dinner','vegetarian'],ARRAY['vegetarian','gluten-free'],
 '[{"name":"spinach","amount":800,"unit":"g (fresh)"},{"name":"paneer","amount":250,"unit":"g (cubed)"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"ginger","amount":3,"unit":"cm"},{"name":"cumin seeds","amount":1,"unit":"tsp"},{"name":"garam masala","amount":2,"unit":"tsp"},{"name":"turmeric","amount":0.5,"unit":"tsp"},{"name":"double cream","amount":100,"unit":"ml"},{"name":"butter","amount":2,"unit":"tbsp"}]'::jsonb,
 ARRAY['Blanch spinach 2 min, drain and blend coarsely.','Pan-fry paneer cubes in oil until golden. Set aside.','Sauté cumin seeds in butter until they pop.','Add onion, cook golden. Add garlic and ginger.','Add spices, cook 1 min.','Add spinach purée. Simmer 10 min.','Add cream and paneer.','Simmer 5 min. Adjust seasoning.'],
 10,30,4,380,18,14,28,5,4,520),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/dal-makhani',
 'Dal Makhani',
 'Black lentils and kidney beans slow-cooked overnight, finished with cream and butter. Delhi''s greatest dal — smoky, velvety, and utterly comforting.',
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
 'Indian',ARRAY['dinner'],ARRAY['vegetarian','gluten-free'],
 '[{"name":"whole black lentils (urad)","amount":300,"unit":"g"},{"name":"red kidney beans","amount":100,"unit":"g"},{"name":"butter","amount":80,"unit":"g"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"ginger","amount":3,"unit":"cm"},{"name":"canned tomatoes","amount":400,"unit":"g"},{"name":"garam masala","amount":2,"unit":"tsp"},{"name":"kashmiri chilli powder","amount":2,"unit":"tsp"},{"name":"double cream","amount":150,"unit":"ml"},{"name":"fenugreek leaves","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Soak lentils and kidney beans overnight.','Cook in fresh water until completely tender — about 1 hour pressure cooker or 3 hours pot.','Sauté onion in butter until deep golden — 20 min.','Add garlic, ginger, tomatoes, and spices. Cook 15 min.','Add lentils. Simmer 1 hour, stirring often.','Add cream and fenugreek. Simmer 20 more min.','The longer it cooks, the better it gets.'],
 20,180,6,380,16,48,14,12,4,420),

-- ══ MOROCCAN ══════════════════════════════════════════════════════

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/lamb-tagine',
 'Lamb Tagine with Apricots & Almonds',
 'Slow-braised lamb shoulder with saffron, preserved lemon, apricots, and almonds. The quintessential Moroccan feast.',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80',
 'Moroccan',ARRAY['dinner','braise'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"lamb shoulder","amount":1.2,"unit":"kg (bone-in cubed)"},{"name":"dried apricots","amount":150,"unit":"g"},{"name":"blanched almonds","amount":80,"unit":"g"},{"name":"ras el hanout","amount":3,"unit":"tsp"},{"name":"cinnamon","amount":1,"unit":"stick"},{"name":"saffron","amount":1,"unit":"pinch"},{"name":"onions","amount":2,"unit":"large"},{"name":"preserved lemon","amount":1,"unit":"quarter"},{"name":"honey","amount":1,"unit":"tbsp"},{"name":"chicken stock","amount":300,"unit":"ml"}]'::jsonb,
 ARRAY['Brown lamb in batches in oil. Remove.','Sauté onion until soft.','Add ras el hanout, cinnamon, saffron. Cook 1 min.','Add stock, preserved lemon, and lamb.','Braise 1.5 hours on low heat.','Add apricots and honey. Cook 30 more min.','Toast almonds in dry pan until golden.','Serve over couscous, topped with almonds and coriander.'],
 20,120,4,560,38,30,32,5,16,480),

('curated','Serious Eats','https://www.seriouseats.com/harira',
 'Harira',
 'Morocco''s most iconic soup — lamb, chickpeas, lentils, tomatoes, and spices finished with egg and lemon. The soup that breaks the Ramadan fast.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
 'Moroccan',ARRAY['soup'],ARRAY['dairy-free'],
 '[{"name":"lamb shoulder","amount":300,"unit":"g (diced)"},{"name":"chickpeas","amount":200,"unit":"g (cooked)"},{"name":"red lentils","amount":100,"unit":"g"},{"name":"canned tomatoes","amount":400,"unit":"g"},{"name":"celery","amount":2,"unit":"stalks"},{"name":"onion","amount":1,"unit":"diced"},{"name":"fresh ginger","amount":2,"unit":"cm"},{"name":"turmeric","amount":1,"unit":"tsp"},{"name":"cinnamon","amount":0.5,"unit":"tsp"},{"name":"saffron","amount":1,"unit":"pinch"},{"name":"fresh coriander","amount":1,"unit":"bunch"},{"name":"eggs","amount":2,"unit":"beaten"},{"name":"lemon juice","amount":3,"unit":"tbsp"},{"name":"flour","amount":2,"unit":"tbsp (for thickening)"}]'::jsonb,
 ARRAY['Brown lamb in olive oil.','Add onion, celery, ginger, and spices.','Add tomatoes and 1.5L water.','Add lentils. Simmer 20 min.','Add chickpeas. Simmer 20 more min.','Mix flour with water to a paste, stir in to thicken.','Stream in beaten eggs while stirring.','Add lemon juice and coriander. Serve with dates and bread.'],
 15,60,6,320,22,36,8,8,6,480),

-- ══ LEBANESE ══════════════════════════════════════════════════════

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/kibbeh',
 'Kibbeh',
 'Ground lamb mixed with bulgur wheat and spices, shaped around a filling of caramelised onions, pine nuts, and more lamb. Lebanon''s national dish.',
 'https://images.unsplash.com/photo-1628557021224-f1e9f69c9bb4?w=800&q=80',
 'Lebanese',ARRAY['dinner'],ARRAY['dairy-free'],
 '[{"name":"lean lamb mince","amount":600,"unit":"g"},{"name":"fine bulgur wheat","amount":150,"unit":"g"},{"name":"onion","amount":2,"unit":"large"},{"name":"pine nuts","amount":60,"unit":"g"},{"name":"allspice","amount":2,"unit":"tsp"},{"name":"cinnamon","amount":1,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"mint","amount":2,"unit":"tbsp (dried)"}]'::jsonb,
 ARRAY['Soak bulgur in cold water 15 min, drain, squeeze dry.','Mix half the mince with bulgur, grated onion, allspice, cinnamon. Process until paste-like.','For filling: cook remaining mince with diced onion, pine nuts, cinnamon, salt.','Shape outer mixture into ovals. Hollow out. Fill. Seal.','Deep fry at 175°C until deep brown, about 5 min.','Alternatively, bake at 200°C/400°F for 25 min.','Serve with yogurt and salad.'],
 40,30,4,480,34,32,22,4,4,480),

('curated','Serious Eats','https://www.seriouseats.com/tabbouleh',
 'Tabbouleh',
 'Mostly parsley, some bulgur, tomatoes, spring onion, mint, lemon, and olive oil. Not the sad grain salad served elsewhere — this is the Lebanese way.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
 'Lebanese',ARRAY['salad'],ARRAY['vegetarian','vegan','dairy-free'],
 '[{"name":"flat-leaf parsley","amount":3,"unit":"large bunches"},{"name":"fine bulgur wheat","amount":40,"unit":"g"},{"name":"cherry tomatoes","amount":200,"unit":"g"},{"name":"spring onions","amount":5,"unit":"whole"},{"name":"fresh mint","amount":1,"unit":"small bunch"},{"name":"lemon juice","amount":60,"unit":"ml"},{"name":"extra virgin olive oil","amount":60,"unit":"ml"},{"name":"sea salt","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Soak bulgur in cold water 20 min. Drain thoroughly.','Finely chop ALL the parsley — it should be the dominant ingredient.','Finely dice tomatoes and spring onions.','Chiffonade mint finely.','Mix everything together.','Dress with lemon and oil.','Season generously. Rest 15 min before serving.'],
 25,0,4,185,4,18,12,5,3,320),

-- ══ MEXICAN ═══════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/birria-tacos',
 'Birria de Res (Birria Tacos)',
 'Beef short ribs braised in a rich chile broth until falling apart, served as consommé-dunked tacos with crispy griddle-fried tortillas and melted cheese.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
 'Mexican',ARRAY['dinner','tacos'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"beef short ribs","amount":1.5,"unit":"kg"},{"name":"dried guajillo chiles","amount":5,"unit":"whole"},{"name":"dried ancho chiles","amount":3,"unit":"whole"},{"name":"dried chipotle","amount":2,"unit":"whole"},{"name":"onion","amount":1,"unit":"large"},{"name":"garlic","amount":8,"unit":"cloves"},{"name":"cinnamon","amount":1,"unit":"stick"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"corn tortillas","amount":16,"unit":"small"},{"name":"Oaxacan cheese","amount":200,"unit":"g"},{"name":"white onion","amount":0.5,"unit":"finely diced (garnish)"},{"name":"coriander","amount":1,"unit":"bunch (garnish)"}]'::jsonb,
 ARRAY['Toast dried chiles in dry pan, then soak in hot water 20 min.','Blend soaked chiles with onion, garlic, and spices. Strain.','Brown beef short ribs deeply.','Add chile sauce and water. Braise 3 hours covered until meat falls off bone.','Shred beef. Reserve consommé.','Dip tortillas in consommé fat, griddle until crispy.','Add cheese and beef. Fold. Griddle until cheese melts.','Serve with consommé for dipping, garnished with onion and coriander.'],
 30,200,6,520,38,30,30,4,4,780),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/mole-negro',
 'Mole Negro',
 'Oaxaca''s master sauce — over 20 ingredients including dried chiles, chocolate, and charred tortilla, simmered for hours. The most complex sauce in world cuisine.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
 'Mexican',ARRAY['dinner','sauce'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"dried mulato chiles","amount":5,"unit":"whole"},{"name":"dried ancho chiles","amount":3,"unit":"whole"},{"name":"dried pasilla negro chiles","amount":3,"unit":"whole"},{"name":"dark chocolate","amount":60,"unit":"g"},{"name":"tomatillos","amount":300,"unit":"g"},{"name":"plantain","amount":1,"unit":"ripe"},{"name":"stale tortilla","amount":1,"unit":"charred"},{"name":"sesame seeds","amount":3,"unit":"tbsp"},{"name":"pumpkin seeds","amount":3,"unit":"tbsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"chicken thighs","amount":8,"unit":"whole"},{"name":"turkey stock","amount":1,"unit":"L"}]'::jsonb,
 ARRAY['Toast chiles, soak in hot water.','Char onion, garlic, tortilla, and plantain directly over flame.','Fry sesame and pumpkin seeds until golden.','Blend all in batches until smooth.','Fry mole paste in oil, stirring constantly, 5 min.','Add stock gradually, chocolate. Simmer 45 min stirring constantly.','Add poached chicken. Simmer 20 min.','Serve with rice, beans, and warm tortillas.'],
 45,90,6,580,42,36,28,6,8,680),

-- ══ CHINESE ═══════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/dan-dan-noodles',
 'Dan Dan Noodles',
 'Thin wheat noodles in a Sichuan sauce of sesame paste, chilli oil, black vinegar, and pork mince. One of the world''s ten greatest noodle dishes.',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
 'Chinese',ARRAY['dinner','noodles'],ARRAY['dairy-free'],
 '[{"name":"thin wheat noodles","amount":300,"unit":"g"},{"name":"pork mince","amount":200,"unit":"g"},{"name":"Chinese sesame paste or tahini","amount":3,"unit":"tbsp"},{"name":"Sichuan chilli oil","amount":4,"unit":"tbsp"},{"name":"black rice vinegar","amount":2,"unit":"tbsp"},{"name":"soy sauce","amount":3,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"Sichuan pepper","amount":1,"unit":"tsp (toasted)"},{"name":"spring onions","amount":4,"unit":"sliced"},{"name":"ya cai (preserved mustard greens)","amount":40,"unit":"g"},{"name":"sesame oil","amount":1,"unit":"tbsp"}]'::jsonb,
 ARRAY['Make sauce: mix sesame paste, chilli oil, vinegar, soy, garlic, Sichuan pepper.','Fry pork mince with ya cai until crispy and golden.','Cook noodles per package.','Thin sauce with hot pasta water to coating consistency.','Toss hot noodles in sauce.','Top with pork, spring onions, and extra chilli oil.'],
 10,15,2,560,28,62,22,3,4,980),

('curated','Bon Appétit','https://www.bonappetit.com/recipe/mapo-tofu',
 'Mapo Tofu',
 'Silken tofu in a fiery Sichuan sauce of doubanjiang, black beans, and minced meat, finished with face-numbing Sichuan pepper. The most famous Sichuan dish.',
 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
 'Chinese',ARRAY['dinner'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"silken tofu","amount":600,"unit":"g"},{"name":"pork mince","amount":150,"unit":"g"},{"name":"doubanjiang (fermented bean paste)","amount":2,"unit":"tbsp"},{"name":"black bean garlic sauce","amount":1,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"ginger","amount":2,"unit":"cm"},{"name":"chicken stock","amount":200,"unit":"ml"},{"name":"Sichuan pepper","amount":1,"unit":"tsp (toasted + ground)"},{"name":"cornstarch","amount":2,"unit":"tsp"},{"name":"sesame oil","amount":1,"unit":"tsp"},{"name":"spring onions","amount":3,"unit":"sliced"}]'::jsonb,
 ARRAY['Cut tofu into 2cm cubes. Simmer gently in lightly salted water 2 min. Drain.','Stir-fry pork mince until cooked. Set aside.','Fry doubanjiang and black bean sauce in oil, stirring, 1 min.','Add garlic and ginger.','Add stock. Bring to simmer.','Gently slide in tofu — do not stir, only fold.','Add pork. Thicken with cornstarch slurry.','Finish with sesame oil.','Top with Sichuan pepper and spring onions.'],
 5,15,3,320,18,12,22,2,2,980),

-- ══ SPANISH ═══════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/traditional-paella-valenciana',
 'Paella Valenciana',
 'The original Valencia paella — chicken, rabbit, white beans, and green beans cooked over wood fire until the rice forms a crispy socarrat crust at the bottom.',
 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80',
 'Spanish',ARRAY['dinner'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"short-grain rice (Bomba)","amount":400,"unit":"g"},{"name":"chicken thighs","amount":600,"unit":"g"},{"name":"rabbit","amount":400,"unit":"g (cut)"},{"name":"white beans (garrofó)","amount":150,"unit":"g"},{"name":"flat green beans","amount":150,"unit":"g"},{"name":"ripe tomatoes","amount":3,"unit":"grated"},{"name":"saffron","amount":1,"unit":"good pinch"},{"name":"sweet paprika","amount":2,"unit":"tsp"},{"name":"rosemary","amount":2,"unit":"sprigs"},{"name":"olive oil","amount":80,"unit":"ml"},{"name":"water or stock","amount":1.2,"unit":"L"}]'::jsonb,
 ARRAY['Brown chicken and rabbit deeply in olive oil in paella pan.','Push to edges, add tomatoes, paprika, cook until concentrated.','Add beans, stir.','Add stock and saffron, bring to boil.','Add rice in a cross pattern, spread evenly. Do not stir from this point.','Cook on high 5 min, then medium 10 min, then low 5 min.','Raise heat 2 min at end to form socarrat crust.','Rest 5 min, covered with newspaper.'],
 20,30,4,520,38,52,18,5,4,580),

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/gambas-al-ajillo',
 'Gambas al Ajillo',
 'Shrimp sizzled in olive oil with vast amounts of garlic, chilli, and sherry. Spain''s greatest tapas — bread mandatory for the sauce.',
 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
 'Spanish',ARRAY['appetizer','tapas'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"large shrimp","amount":500,"unit":"g"},{"name":"garlic","amount":8,"unit":"cloves (thinly sliced)"},{"name":"dried guindilla or chilli","amount":2,"unit":"whole"},{"name":"dry sherry (Fino)","amount":60,"unit":"ml"},{"name":"olive oil","amount":80,"unit":"ml"},{"name":"parsley","amount":1,"unit":"tbsp"},{"name":"crusty bread","amount":1,"unit":"loaf"}]'::jsonb,
 ARRAY['Heat olive oil in small clay pot or pan.','Add garlic and chilli. Sizzle until garlic is golden.','Add shrimp — they should immediately sizzle.','Cook 90 seconds per side.','Add sherry — be careful of flare.','Cook 30 more seconds.','Remove from heat, scatter parsley.','Serve sizzling with crusty bread.'],
 5,8,4,280,24,4,16,0,0,540),

-- ══ PORTUGUESE ════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/bacalhau-a-bras',
 'Bacalhau à Brás',
 'Salted cod, matchstick potatoes, and scrambled eggs bound together with parsley and olives. Portugal''s most beloved salt cod dish of 365.',
 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
 'Portuguese',ARRAY['dinner'],ARRAY['gluten-free','dairy-free'],
 '[{"name":"desalted bacalhau (salt cod)","amount":400,"unit":"g (soaked 24h)"},{"name":"potatoes","amount":500,"unit":"g (julienned and fried)"},{"name":"onions","amount":2,"unit":"large, sliced thin"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"eggs","amount":5,"unit":"beaten"},{"name":"black olives","amount":60,"unit":"g"},{"name":"olive oil","amount":60,"unit":"ml"},{"name":"fresh parsley","amount":3,"unit":"tbsp"}]'::jsonb,
 ARRAY['Flake desalted cod into chunks, removing bones.','Fry julienned potatoes until golden and crispy.','Sauté onion and garlic in olive oil until golden.','Add cod, cook 3 min.','Add fried potatoes, stir gently.','Add beaten eggs and stir over low heat until just set — very soft curds.','Season with pepper and parsley.','Garnish with olives.'],
 30,15,4,480,35,34,22,3,2,980),

-- ══ EGYPTIAN ══════════════════════════════════════════════════════

('curated','NYT Cooking','https://cooking.nytimes.com/recipes/koshari',
 'Koshari',
 'Egypt''s beloved street food: lentils, rice, macaroni, crispy onions, and two sauces — a spiced tomato sauce and a sharp vinegar-garlic sauce.',
 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
 'Egyptian',ARRAY['dinner'],ARRAY['vegetarian','vegan','dairy-free'],
 '[{"name":"brown lentils","amount":200,"unit":"g"},{"name":"short-grain rice","amount":200,"unit":"g"},{"name":"macaroni","amount":150,"unit":"g"},{"name":"onions","amount":3,"unit":"large, sliced"},{"name":"canned tomatoes","amount":400,"unit":"g"},{"name":"white vinegar","amount":3,"unit":"tbsp"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"cumin","amount":2,"unit":"tsp"},{"name":"coriander","amount":1,"unit":"tsp"},{"name":"chilli flakes","amount":1,"unit":"tsp"},{"name":"vegetable oil","amount":100,"unit":"ml for frying"}]'::jsonb,
 ARRAY['Cook lentils until tender. Drain.','Cook rice. Cook macaroni.','Fry onions in plenty of oil until deep brown and crispy — 20+ min. Drain.','Make tomato sauce: sauté garlic, add tomatoes and spices. Simmer 15 min.','Make vinegar sauce: mix vinegar, garlic, cumin, water.','Layer in bowls: rice+lentils mix, macaroni, tomato sauce, crispy onions.','Drizzle vinegar sauce.'],
 20,45,4,520,18,82,14,10,6,480),

-- ══ TUNISIAN ══════════════════════════════════════════════════════

('curated','Serious Eats','https://www.seriouseats.com/shakshuka-recipe',
 'Shakshuka',
 'Eggs poached in a spiced tomato and pepper sauce. Tunisia''s most famous export — made in one pan, ready in 20 minutes, perfect any time of day.',
 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
 'Tunisian',ARRAY['breakfast','lunch','dinner'],ARRAY['vegetarian','gluten-free','dairy-free'],
 '[{"name":"eggs","amount":6,"unit":"whole"},{"name":"canned tomatoes","amount":800,"unit":"g"},{"name":"red peppers","amount":2,"unit":"diced"},{"name":"onion","amount":1,"unit":"diced"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"harissa paste","amount":2,"unit":"tsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"paprika","amount":2,"unit":"tsp"},{"name":"turmeric","amount":0.5,"unit":"tsp"},{"name":"feta","amount":80,"unit":"g (optional)"},{"name":"fresh coriander","amount":1,"unit":"bunch"}]'::jsonb,
 ARRAY['Sauté onion and pepper in oil until soft.','Add garlic, harissa, and spices. Cook 1 min.','Add tomatoes, breaking them up. Simmer 15 min.','Make wells in the sauce.','Crack eggs into wells. Cover.','Cook on medium-low until whites are just set — 8–10 min.','Top with feta and coriander.','Serve with bread.'],
 5,25,3,280,16,22,14,5,8,680)

ON CONFLICT DO NOTHING;
