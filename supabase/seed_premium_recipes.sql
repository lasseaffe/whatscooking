-- Auto-generated: seed premium recipe data
-- Paste into Supabase SQL Editor and run.

UPDATE recipes SET
  title = 'Saffron Seafood Risotto',
  cuisine_type = 'Italian',
  description = 'A silky, golden risotto fragrant with saffron and loaded with fresh clams, mussels, and prawns. Finished with a splash of white wine and a shower of fresh parsley, this is coastal Italian cooking at its finest.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 35,
  calories = 520,
  protein_g = 34,
  carbs_g = 58,
  fat_g = 14,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  ingredients = '[{"name":"arborio rice","amount":320,"unit":"g"},{"name":"fresh clams","amount":300,"unit":"g"},{"name":"mussels","amount":250,"unit":"g"},{"name":"king prawns","amount":200,"unit":"g"},{"name":"dry white wine","amount":150,"unit":"ml"},{"name":"fish stock","amount":1.2,"unit":"litres"},{"name":"saffron threads","amount":0.5,"unit":"g"},{"name":"shallots","amount":2,"unit":""},{"name":"garlic cloves","amount":3,"unit":""},{"name":"butter","amount":30,"unit":"g"},{"name":"parmesan","amount":40,"unit":"g"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"fresh parsley","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Warm the fish stock in a saucepan and add the saffron threads. Keep at a gentle simmer.','Heat olive oil in a wide heavy pan, add shallots and garlic, cook 3 minutes until soft.','Add arborio rice and toast for 2 minutes, stirring constantly until the edges look translucent.','Pour in white wine and stir until fully absorbed.','Add warm saffron stock one ladle at a time, stirring constantly and waiting until each addition is absorbed — about 20 minutes total.','Add clams, mussels, and prawns in the final 5 minutes, covering briefly until shells open and prawns are pink.','Remove from heat, stir in butter and parmesan, season with salt and white pepper.','Rest 2 minutes, scatter parsley, and serve immediately.']::text[]
WHERE id = '548af6a1-a80e-49af-a21c-ee498fec4d6d';

UPDATE recipes SET
  title = 'Crispy Pork Belly Ramen',
  cuisine_type = 'Japanese',
  description = 'A deeply rich tonkotsu-style broth topped with melt-in-the-mouth chashu pork belly, a perfect soft-boiled egg, and springy ramen noodles. Weekend cooking that rewards patience with pure umami bliss.',
  servings = 4,
  prep_time_minutes = 30,
  cook_time_minutes = 180,
  calories = 680,
  protein_g = 42,
  carbs_g = 62,
  fat_g = 26,
  dietary_tags = ARRAY[]::text[],
  image_url = 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=800&q=80',
  ingredients = '[{"name":"pork belly","amount":600,"unit":"g"},{"name":"ramen noodles","amount":400,"unit":"g"},{"name":"soft-boiled eggs","amount":4,"unit":""},{"name":"soy sauce","amount":80,"unit":"ml"},{"name":"mirin","amount":60,"unit":"ml"},{"name":"sake","amount":60,"unit":"ml"},{"name":"pork or chicken bones","amount":1,"unit":"kg"},{"name":"ginger","amount":40,"unit":"g"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"spring onions","amount":4,"unit":""},{"name":"sesame oil","amount":1,"unit":"tbsp"},{"name":"nori sheets","amount":4,"unit":""},{"name":"bamboo shoots","amount":100,"unit":"g"},{"name":"corn","amount":80,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Roast bones at 220°C for 30 minutes until caramelised. Transfer to a large stockpot with ginger, garlic, and 3 litres of water.','Simmer the broth uncovered for 3 hours, skimming regularly, until rich and milky.','Meanwhile roll pork belly tightly, tie with kitchen string, and sear in a hot pan on all sides.','Braise pork belly in soy sauce, mirin, sake, and 200ml water for 90 minutes until tender. Slice into medallions.','Marinate soft-boiled eggs (7 minutes) in the pork braising liquid for at least 30 minutes.','Strain the broth, season with salt and a little soy sauce to taste.','Cook ramen noodles per packet, drain, and divide between deep bowls.','Ladle hot broth over noodles. Top with chashu pork, halved marinated egg, nori, bamboo shoots, corn, and a drizzle of sesame oil.']::text[]
WHERE id = '355ddf5f-3c7d-4ee3-94f0-c51859f77f03';

UPDATE recipes SET
  title = 'Birria Tacos with Consommé',
  cuisine_type = 'Mexican',
  description = 'Tender, chile-braised beef folded into corn tortillas, dipped in rich consommé and griddled until crispy and caramelised. Served with a cup of the deeply spiced broth for dunking — one of Mexico''s most iconic street foods.',
  servings = 6,
  prep_time_minutes = 30,
  cook_time_minutes = 240,
  calories = 580,
  protein_g = 38,
  carbs_g = 44,
  fat_g = 22,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  ingredients = '[{"name":"beef chuck","amount":1.2,"unit":"kg"},{"name":"guajillo chiles","amount":6,"unit":""},{"name":"ancho chiles","amount":3,"unit":""},{"name":"chipotle in adobo","amount":2,"unit":"tbsp"},{"name":"tomatoes","amount":3,"unit":""},{"name":"white onion","amount":1,"unit":""},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"beef stock","amount":1,"unit":"litre"},{"name":"corn tortillas","amount":24,"unit":""},{"name":"Oaxaca cheese","amount":200,"unit":"g"},{"name":"apple cider vinegar","amount":2,"unit":"tbsp"},{"name":"cumin","amount":1,"unit":"tsp"},{"name":"dried oregano","amount":1,"unit":"tsp"},{"name":"white onion (garnish)","amount":0.5,"unit":""},{"name":"fresh cilantro","amount":1,"unit":"bunch"},{"name":"lime wedges","amount":3,"unit":""}]'::jsonb,
  instructions = ARRAY['Toast guajillo and ancho chiles in a dry pan 30 seconds each side. Soak in hot water 20 minutes then drain.','Blend chiles with tomatoes, half the onion, garlic, cumin, oregano, vinegar, and chipotle until smooth.','Season beef and sear in a Dutch oven until browned all over. Pour the chile sauce and stock over the meat.','Braise covered at 160°C for 3–4 hours until the meat shreds easily with two forks.','Shred the beef and reserve the consommé (braising liquid). Skim fat from the surface.','Heat a griddle or cast iron pan over high heat. Dip each tortilla briefly in the consommé fat layer.','Place two tortillas on the griddle, add shredded beef and cheese, fold in half and press until crispy.','Serve tacos with small cups of hot consommé, chopped onion, cilantro, and lime for squeezing.']::text[]
WHERE id = 'dc7e7b45-2152-46d2-b37c-6d25f3f52af0';

UPDATE recipes SET
  title = 'Miso Glazed Black Cod',
  cuisine_type = 'Japanese',
  description = 'A Nobu classic: silky black cod marinated for 48 hours in sweet white miso and mirin, then broiled until caramelised and flaking. Served with pickled cucumber and steamed rice for an effortlessly elegant dinner.',
  servings = 4,
  prep_time_minutes = 10,
  cook_time_minutes = 15,
  calories = 420,
  protein_g = 36,
  carbs_g = 28,
  fat_g = 16,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80',
  ingredients = '[{"name":"black cod fillets","amount":700,"unit":"g"},{"name":"white miso paste","amount":120,"unit":"g"},{"name":"mirin","amount":60,"unit":"ml"},{"name":"sake","amount":60,"unit":"ml"},{"name":"sugar","amount":2,"unit":"tbsp"},{"name":"Japanese cucumber","amount":1,"unit":""},{"name":"rice vinegar","amount":2,"unit":"tbsp"},{"name":"sesame seeds","amount":1,"unit":"tbsp"},{"name":"steamed rice","amount":300,"unit":"g"},{"name":"micro herbs","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Combine miso, mirin, sake, and sugar in a small saucepan. Heat gently until sugar dissolves. Cool completely.','Pat the cod fillets dry, coat generously in the miso marinade. Cover and refrigerate 48 hours (minimum 24 hours).','When ready to cook, scrape off excess marinade from the surface to prevent burning.','Place fillets on a foil-lined baking tray. Broil 6–8 minutes, watching carefully, until deeply caramelised and just cooked through.','Meanwhile slice cucumber paper-thin, toss with rice vinegar, a pinch of sugar, and sesame seeds.','Serve cod over steamed rice with pickled cucumber alongside. Garnish with micro herbs.']::text[]
WHERE id = '4efbb152-69bf-4f2e-a968-a3137335008f';

UPDATE recipes SET
  title = 'Lamb Tagine with Preserved Lemon',
  cuisine_type = 'Moroccan',
  description = 'Slow-cooked lamb shoulder in a beautifully spiced sauce with olives, preserved lemon, and golden raisins. The warm aromatics of ras el hanout and cinnamon make this a deeply comforting Moroccan classic.',
  servings = 6,
  prep_time_minutes = 20,
  cook_time_minutes = 150,
  calories = 540,
  protein_g = 38,
  carbs_g = 32,
  fat_g = 24,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800&q=80',
  ingredients = '[{"name":"lamb shoulder, cut into chunks","amount":1.2,"unit":"kg"},{"name":"onions","amount":2,"unit":""},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"preserved lemon","amount":1,"unit":""},{"name":"green olives","amount":100,"unit":"g"},{"name":"golden raisins","amount":60,"unit":"g"},{"name":"ras el hanout","amount":2,"unit":"tbsp"},{"name":"ground cumin","amount":1,"unit":"tsp"},{"name":"ground cinnamon","amount":0.5,"unit":"tsp"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"chicken stock","amount":400,"unit":"ml"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"fresh cilantro","amount":1,"unit":"bunch"},{"name":"toasted almonds","amount":40,"unit":"g"},{"name":"couscous","amount":300,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Season lamb with salt. Heat oil in a tagine or heavy casserole, brown the lamb in batches over high heat. Set aside.','In the same pot fry onions and garlic until softened, about 5 minutes.','Add ras el hanout, cumin, and cinnamon, stir 1 minute until fragrant.','Stir in tomato paste, then return the lamb with stock. Bring to a simmer.','Rinse preserved lemon, remove pulp, and slice the rind thinly. Add to the pot with raisins.','Cover and cook on low heat for 2–2.5 hours until the lamb is falling-apart tender.','Add olives in the last 15 minutes. Taste and adjust seasoning.','Prepare couscous per packet. Serve tagine over couscous with toasted almonds and cilantro.']::text[]
WHERE id = '7a3612db-3fcd-4e58-beae-ba86b2cf6b6b';

UPDATE recipes SET
  title = 'Shakshuka with Feta & Za''atar',
  cuisine_type = 'Middle Eastern',
  description = 'Eggs poached in a vibrant, harissa-spiked tomato and pepper sauce, crowned with crumbled feta and fragrant za''atar. A one-pan wonder equally brilliant for brunch or a quick weeknight dinner.',
  servings = 4,
  prep_time_minutes = 10,
  cook_time_minutes = 25,
  calories = 340,
  protein_g = 18,
  carbs_g = 24,
  fat_g = 18,
  dietary_tags = ARRAY['vegetarian','gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
  ingredients = '[{"name":"eggs","amount":6,"unit":""},{"name":"canned crushed tomatoes","amount":800,"unit":"g"},{"name":"red bell peppers","amount":2,"unit":""},{"name":"onion","amount":1,"unit":""},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"harissa paste","amount":2,"unit":"tbsp"},{"name":"ground cumin","amount":1,"unit":"tsp"},{"name":"sweet paprika","amount":1,"unit":"tsp"},{"name":"feta cheese","amount":120,"unit":"g"},{"name":"za''atar","amount":1,"unit":"tbsp"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"fresh parsley","amount":1,"unit":"handful"},{"name":"crusty bread","amount":1,"unit":"loaf"}]'::jsonb,
  instructions = ARRAY['Heat oil in a large deep frying pan over medium heat. Add onion and cook until golden, 6 minutes.','Add sliced peppers and garlic, cook 5 minutes until softened.','Stir in harissa, cumin, and paprika. Cook 1 minute until fragrant.','Pour in crushed tomatoes, season with salt and pepper. Simmer 10 minutes until slightly thickened.','Use a spoon to make 6 wells in the sauce. Crack an egg into each well.','Cover the pan and cook over medium-low heat for 6–8 minutes until whites are set but yolks still runny.','Remove from heat, crumble feta over the top, scatter za''atar and parsley.','Serve directly from the pan with plenty of crusty bread for scooping.']::text[]
WHERE id = '370ca5fa-2ff7-48e8-8623-e49c407de404';

UPDATE recipes SET
  title = 'Korean Gochujang Butter Noodles',
  cuisine_type = 'Korean',
  description = 'Quick, fiery butter noodles coated in a glossy gochujang and brown butter sauce with garlic, soy, and a squeeze of lime. Topped with crispy fried shallots and sesame seeds — intensely satisfying in under 20 minutes.',
  servings = 2,
  prep_time_minutes = 5,
  cook_time_minutes = 15,
  calories = 480,
  protein_g = 12,
  carbs_g = 68,
  fat_g = 18,
  dietary_tags = ARRAY['vegetarian']::text[],
  image_url = 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=800&q=80',
  ingredients = '[{"name":"thick ramen or udon noodles","amount":200,"unit":"g"},{"name":"butter","amount":50,"unit":"g"},{"name":"gochujang","amount":2,"unit":"tbsp"},{"name":"soy sauce","amount":2,"unit":"tbsp"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"brown sugar","amount":1,"unit":"tsp"},{"name":"sesame oil","amount":1,"unit":"tsp"},{"name":"lime","amount":1,"unit":""},{"name":"crispy fried shallots","amount":2,"unit":"tbsp"},{"name":"sesame seeds","amount":1,"unit":"tbsp"},{"name":"spring onions","amount":2,"unit":""},{"name":"soft-boiled egg","amount":2,"unit":""}]'::jsonb,
  instructions = ARRAY['Cook noodles per packet until al dente. Reserve 120ml pasta water before draining.','In a large frying pan, melt butter over medium-high heat until it starts to brown and smell nutty.','Add minced garlic and cook 30 seconds.','Stir in gochujang, soy sauce, and sugar. Toss the noodles into the sauce.','Add pasta water a splash at a time to reach a glossy coating consistency.','Remove from heat, add sesame oil and a squeeze of lime.','Top with halved soft-boiled eggs, crispy shallots, sesame seeds, and sliced spring onions.']::text[]
WHERE id = '5373c8e0-959f-4100-9b84-0a93d3c327f6';

UPDATE recipes SET
  title = 'Smash Burgers with Secret Sauce',
  cuisine_type = 'American',
  description = 'Two ultra-thin beef patties smashed hard against a scorching griddle, creating deeply caramelised, lacy-edged crusts. Stacked with American cheese, pickles, and a tangy secret sauce — this is the burger that changed everything.',
  servings = 4,
  prep_time_minutes = 10,
  cook_time_minutes = 15,
  calories = 720,
  protein_g = 42,
  carbs_g = 48,
  fat_g = 38,
  dietary_tags = ARRAY[]::text[],
  image_url = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
  ingredients = '[{"name":"80/20 beef mince","amount":600,"unit":"g"},{"name":"American cheese slices","amount":8,"unit":""},{"name":"brioche buns","amount":4,"unit":""},{"name":"dill pickles","amount":1,"unit":"jar"},{"name":"white onion","amount":1,"unit":""},{"name":"mayonnaise","amount":4,"unit":"tbsp"},{"name":"ketchup","amount":2,"unit":"tbsp"},{"name":"mustard","amount":1,"unit":"tbsp"},{"name":"garlic powder","amount":0.5,"unit":"tsp"},{"name":"smoked paprika","amount":0.5,"unit":"tsp"},{"name":"shredded iceberg lettuce","amount":1,"unit":"handful"},{"name":"beef tallow or butter","amount":2,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Make the secret sauce: mix mayonnaise, ketchup, mustard, garlic powder, paprika, and a splash of pickle brine. Refrigerate.','Divide beef into 8 loosely packed balls (75g each). Season with salt just before cooking.','Heat a cast-iron griddle or skillet over the highest heat until smoking hot. Add a little tallow.','Place 2 beef balls on the griddle, immediately smash flat with a burger press or metal spatula. Season tops.','Cook 1.5–2 minutes until the edges are deeply caramelised and lacy. Do NOT move the patties.','Flip once, immediately place a cheese slice on each patty. Cook 30 seconds.','Toast bun halves on the griddle.','Build each burger: sauce on both buns, pickles on bottom, onion, double smashed patties, shredded lettuce, more sauce.']::text[]
WHERE id = '24e2dd73-fc0e-4d01-9270-8a0882a0ec02';

UPDATE recipes SET
  title = 'Thai Green Curry with Aubergine',
  cuisine_type = 'Thai',
  description = 'A fragrant, coconut-rich green curry packed with silky aubergine, crisp green beans, and Thai basil. The homemade green curry paste — bright with lemongrass, galangal, and green chillies — makes all the difference.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 25,
  calories = 420,
  protein_g = 10,
  carbs_g = 36,
  fat_g = 28,
  dietary_tags = ARRAY['vegan','gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=800&q=80',
  ingredients = '[{"name":"Thai aubergines or regular aubergine","amount":400,"unit":"g"},{"name":"coconut milk","amount":400,"unit":"ml"},{"name":"vegetable stock","amount":200,"unit":"ml"},{"name":"green beans","amount":150,"unit":"g"},{"name":"Thai basil","amount":1,"unit":"large handful"},{"name":"lime leaves","amount":4,"unit":""},{"name":"lemongrass stalk","amount":2,"unit":""},{"name":"green chillies","amount":4,"unit":""},{"name":"galangal or ginger","amount":20,"unit":"g"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"shallots","amount":3,"unit":""},{"name":"coriander root and stems","amount":1,"unit":"handful"},{"name":"fish sauce or soy sauce","amount":2,"unit":"tbsp"},{"name":"coconut sugar","amount":1,"unit":"tsp"},{"name":"neutral oil","amount":2,"unit":"tbsp"},{"name":"jasmine rice","amount":300,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Make curry paste: blend chillies, lemongrass (white part), galangal, garlic, shallots, and coriander until smooth.','Heat oil in a wok over high heat. Fry the curry paste 2 minutes, stirring constantly until fragrant.','Add the thick cream from the top of the coconut milk can. Cook, stirring, until it splits and turns glossy.','Add aubergine chunks and stir-fry 3 minutes, coating in the paste.','Pour in remaining coconut milk, stock, and lime leaves. Simmer 10 minutes.','Add green beans and cook 3 more minutes until just tender.','Season with fish sauce (or soy) and coconut sugar. Taste and balance the flavours.','Remove from heat, stir in Thai basil, and serve over jasmine rice with extra lime.']::text[]
WHERE id = '5ef49de6-02a3-455a-9359-174212f9b6f8';

UPDATE recipes SET
  title = 'French Onion Soup Gratin',
  cuisine_type = 'French',
  description = 'Deeply caramelised onions slow-cooked for over an hour in beef broth and Cognac, ladled into crocks and blanketed with a gruyère-drenched crouton. Broiling transforms the cheese into a glorious molten lid.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 90,
  calories = 480,
  protein_g = 18,
  carbs_g = 42,
  fat_g = 22,
  dietary_tags = ARRAY['vegetarian']::text[],
  image_url = 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
  ingredients = '[{"name":"yellow onions","amount":1.2,"unit":"kg"},{"name":"butter","amount":60,"unit":"g"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"dry white wine","amount":200,"unit":"ml"},{"name":"Cognac or brandy","amount":2,"unit":"tbsp"},{"name":"beef or vegetable stock","amount":1.5,"unit":"litres"},{"name":"bay leaves","amount":2,"unit":""},{"name":"fresh thyme","amount":4,"unit":"sprigs"},{"name":"baguette","amount":8,"unit":"thick slices"},{"name":"Gruyère cheese","amount":200,"unit":"g"},{"name":"Emmental cheese","amount":80,"unit":"g"},{"name":"garlic","amount":1,"unit":"clove"},{"name":"flour","amount":1,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Slice onions thinly. Melt butter with oil in a large heavy pot over medium heat. Add onions and a pinch of salt.','Cook onions, stirring every 10 minutes, for 60–75 minutes until deeply golden and caramelised. Patience is essential.','Add flour and stir 2 minutes. Add Cognac and let it bubble away.','Pour in wine and stock, add bay leaves and thyme. Simmer 20 minutes, season.','Toast baguette slices in the oven until crisp, then rub with cut garlic.','Ladle soup into oven-proof crocks. Place 2 croutons on top, heap with grated Gruyère and Emmental.','Broil 3–5 minutes until cheese is bubbling, golden, and blistered at the edges.','Serve immediately, warning guests that the crocks are very hot.']::text[]
WHERE id = 'ca4372c0-c466-42d4-8ace-0d0e590ae038';

UPDATE recipes SET
  title = 'Peruvian Aji de Gallina',
  cuisine_type = 'Peruvian',
  description = 'Shredded chicken bathed in a rich, golden sauce of aji amarillo, walnuts, and bread, this is the ultimate Peruvian comfort food. Creamy, mildly spicy, and slightly nutty, served over rice with black olives and a hard-boiled egg.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 40,
  calories = 490,
  protein_g = 36,
  carbs_g = 38,
  fat_g = 20,
  dietary_tags = ARRAY['dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
  ingredients = '[{"name":"chicken breasts","amount":700,"unit":"g"},{"name":"aji amarillo paste","amount":4,"unit":"tbsp"},{"name":"white bread slices","amount":4,"unit":""},{"name":"evaporated milk","amount":200,"unit":"ml"},{"name":"walnuts","amount":80,"unit":"g"},{"name":"parmesan","amount":40,"unit":"g"},{"name":"onion","amount":1,"unit":""},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"chicken stock","amount":400,"unit":"ml"},{"name":"vegetable oil","amount":2,"unit":"tbsp"},{"name":"hard-boiled eggs","amount":4,"unit":""},{"name":"black olives","amount":80,"unit":"g"},{"name":"white rice","amount":300,"unit":"g"},{"name":"potatoes","amount":400,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Poach chicken breasts in salted water with a bay leaf for 20 minutes. Shred finely when cool. Reserve stock.','Soak bread in evaporated milk for 10 minutes. Blend with walnuts and parmesan to a smooth paste.','Fry onion and garlic in oil until golden. Add aji amarillo paste, cook 3 minutes.','Add the bread-walnut paste and stir to combine. Gradually add chicken stock, stirring until the sauce is smooth and coats a spoon.','Fold in the shredded chicken. Simmer 5 minutes to marry the flavours.','Season with salt, white pepper, and a squeeze of lime.','Boil potatoes until tender. Cook rice.','Serve aji de gallina over rice and potato slices, garnished with hard-boiled egg halves, olives, and parsley.']::text[]
WHERE id = 'a439adda-bc20-438f-acf5-dce50f5dcff0';

UPDATE recipes SET
  title = 'Focaccia with Olives and Rosemary',
  cuisine_type = 'Italian',
  description = 'A cloud-soft, olive-oil drenched Italian focaccia with a satisfying crispy bottom, dimpled top, and fragrant rosemary. The dough proves overnight for maximum flavour — worth every second of the wait.',
  servings = 8,
  prep_time_minutes = 20,
  cook_time_minutes = 25,
  calories = 310,
  protein_g = 7,
  carbs_g = 48,
  fat_g = 10,
  dietary_tags = ARRAY['vegan','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=800&q=80',
  ingredients = '[{"name":"strong white bread flour","amount":500,"unit":"g"},{"name":"instant yeast","amount":7,"unit":"g"},{"name":"salt","amount":10,"unit":"g"},{"name":"warm water","amount":375,"unit":"ml"},{"name":"extra virgin olive oil","amount":80,"unit":"ml"},{"name":"fresh rosemary","amount":3,"unit":"sprigs"},{"name":"pitted kalamata olives","amount":80,"unit":"g"},{"name":"flaky sea salt","amount":2,"unit":"tsp"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"cherry tomatoes","amount":100,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Mix flour, yeast, and salt. Add 375ml warm water and 2 tbsp olive oil. Mix until a rough dough forms.','Knead 10 minutes until smooth and elastic, or use a stand mixer with a dough hook for 7 minutes.','Coat a large bowl with olive oil, place dough inside, cover, and refrigerate overnight (12–24 hours).','Generously oil a rimmed baking sheet (30×40cm). Transfer dough, stretch gently to fit. Rest 2 hours at room temperature.','Press fingers deep into the dough all over to create dramatic dimples.','Drizzle generously with olive oil (it should pool in the dimples). Press in olives, halved cherry tomatoes, and rosemary sprigs.','Scatter flaky salt and sliced garlic over the top.','Bake at 220°C for 20–25 minutes until deeply golden. Cool 10 minutes before cutting.']::text[]
WHERE id = '5d6e4508-2a54-44c4-b069-12899ae4a864';

UPDATE recipes SET
  title = 'Vietnamese Pho Bo',
  cuisine_type = 'Vietnamese',
  description = 'A crystal-clear, star anise-perfumed beef broth ladled over silky rice noodles and tender slices of raw beef that cook gently in the steaming soup. The ritual of building your own bowl with fresh herbs, lime, and chilli is half the joy.',
  servings = 4,
  prep_time_minutes = 30,
  cook_time_minutes = 240,
  calories = 420,
  protein_g = 38,
  carbs_g = 44,
  fat_g = 8,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
  ingredients = '[{"name":"beef bones (marrow and knuckle)","amount":1.5,"unit":"kg"},{"name":"beef sirloin or eye round","amount":400,"unit":"g"},{"name":"rice noodles","amount":400,"unit":"g"},{"name":"star anise","amount":6,"unit":""},{"name":"cinnamon sticks","amount":2,"unit":""},{"name":"cloves","amount":5,"unit":""},{"name":"fish sauce","amount":3,"unit":"tbsp"},{"name":"ginger","amount":60,"unit":"g"},{"name":"white onion","amount":1,"unit":""},{"name":"beef brisket","amount":300,"unit":"g"},{"name":"bean sprouts","amount":200,"unit":"g"},{"name":"Thai basil","amount":1,"unit":"handful"},{"name":"fresh mint","amount":1,"unit":"handful"},{"name":"lime","amount":2,"unit":""},{"name":"bird''s eye chilli","amount":2,"unit":""},{"name":"hoisin sauce","amount":2,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Blanch beef bones in boiling water for 10 minutes to remove impurities. Rinse and clean the pot.','Char ginger and halved onion directly over gas flame or under a broiler until blackened in spots.','Toast star anise, cinnamon, and cloves in a dry pan until fragrant.','Add cleaned bones, charred ginger and onion, toasted spices, and brisket to a stockpot with 4 litres cold water.','Bring to a boil, then reduce to the gentlest possible simmer. Cook 4–6 hours, never letting it boil.','Remove brisket after 90 minutes when tender; slice thinly when cool. Season broth with fish sauce and salt.','Soak rice noodles in cold water 30 minutes; cook in boiling water 1 minute. Divide among bowls.','Slice raw sirloin paper-thin. Arrange brisket and raw sirloin in each bowl. Ladle boiling broth over (this cooks the raw beef). Serve with all the garnishes on the side.']::text[]
WHERE id = 'a91710b6-f573-4352-ab9b-9c4becde005b';

UPDATE recipes SET
  title = 'Baked Feta Pasta',
  cuisine_type = 'Greek',
  description = 'The viral pasta that broke the internet: cherry tomatoes and a block of feta roasted together until jammy and golden, then tossed with rigatoni into a creamy, tangy sauce studded with bursting tomatoes. Outrageously good for so little effort.',
  servings = 4,
  prep_time_minutes = 5,
  cook_time_minutes = 35,
  calories = 560,
  protein_g = 22,
  carbs_g = 72,
  fat_g = 18,
  dietary_tags = ARRAY['vegetarian']::text[],
  image_url = 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&q=80',
  ingredients = '[{"name":"cherry tomatoes","amount":600,"unit":"g"},{"name":"block feta","amount":200,"unit":"g"},{"name":"rigatoni or penne pasta","amount":400,"unit":"g"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"olive oil","amount":5,"unit":"tbsp"},{"name":"chilli flakes","amount":0.5,"unit":"tsp"},{"name":"dried oregano","amount":1,"unit":"tsp"},{"name":"fresh basil","amount":1,"unit":"large handful"},{"name":"black pepper","amount":1,"unit":"tsp"}]'::jsonb,
  instructions = ARRAY['Preheat oven to 200°C.','Place cherry tomatoes in a large baking dish. Nestle whole garlic cloves among the tomatoes.','Place the feta block in the centre. Drizzle everything generously with olive oil.','Scatter over chilli flakes, oregano, and plenty of black pepper.','Bake 35 minutes until tomatoes are blistered and jammy, and feta is golden on top.','Meanwhile cook pasta in well-salted boiling water until al dente. Reserve a cup of pasta water.','Crush the garlic and feta with a fork and stir everything together into a creamy sauce.','Add drained pasta and toss, adding pasta water as needed. Finish with torn fresh basil.']::text[]
WHERE id = '64ef8f5b-67db-4e27-bc22-93c16d61b401';

UPDATE recipes SET
  title = 'Chicken Tikka Masala',
  cuisine_type = 'Indian',
  description = 'Char-kissed chicken tikka in a velvety, cream-enriched masala sauce that''s simultaneously warming and gentle. Made with a proper toasted spice base, this is the most beloved curry in the world for very good reason.',
  servings = 4,
  prep_time_minutes = 30,
  cook_time_minutes = 45,
  calories = 520,
  protein_g = 44,
  carbs_g = 28,
  fat_g = 22,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  ingredients = '[{"name":"chicken thighs, boneless","amount":800,"unit":"g"},{"name":"full-fat yogurt","amount":200,"unit":"g"},{"name":"garam masala","amount":3,"unit":"tsp"},{"name":"ground cumin","amount":2,"unit":"tsp"},{"name":"ground coriander","amount":2,"unit":"tsp"},{"name":"turmeric","amount":1,"unit":"tsp"},{"name":"smoked paprika","amount":2,"unit":"tsp"},{"name":"tomato passata","amount":400,"unit":"ml"},{"name":"double cream","amount":150,"unit":"ml"},{"name":"onion","amount":2,"unit":""},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"fresh ginger","amount":30,"unit":"g"},{"name":"butter","amount":40,"unit":"g"},{"name":"fenugreek leaves (kasuri methi)","amount":1,"unit":"tsp"},{"name":"basmati rice","amount":300,"unit":"g"},{"name":"naan bread","amount":4,"unit":""}]'::jsonb,
  instructions = ARRAY['Mix half the spices, half the yogurt, and salt. Coat chicken thighs and marinate at least 1 hour (overnight preferred).','Grill or pan-fry chicken over high heat until charred and just cooked through. Rest and slice.','Melt butter in a heavy pan, fry onions until deeply golden (15 minutes), add garlic and ginger paste.','Add remaining spices and tomato paste, cook 2 minutes. Add passata and simmer 15 minutes.','Blend the sauce until smooth (optional for a silky result). Return to pan.','Add grilled chicken and cream. Simmer gently 10 minutes.','Crush kasuri methi between your palms and stir in — this is the secret to the restaurant flavour.','Serve over basmati rice with warm naan, topped with a swirl of cream and fresh cilantro.']::text[]
WHERE id = '63348d61-0ff7-47c6-9825-071c34b51b07';

UPDATE recipes SET
  title = 'Crispy Duck Legs Confit',
  cuisine_type = 'French',
  description = 'Duck legs slow-cooked submerged in their own fat until impossibly tender, then crisped in a screaming hot pan into a shattering golden crust. A Gascon technique that takes time but demands almost zero skill.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 150,
  calories = 640,
  protein_g = 48,
  carbs_g = 8,
  fat_g = 44,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  ingredients = '[{"name":"duck legs","amount":4,"unit":""},{"name":"duck fat or goose fat","amount":500,"unit":"g"},{"name":"coarse sea salt","amount":3,"unit":"tbsp"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"fresh thyme","amount":6,"unit":"sprigs"},{"name":"bay leaves","amount":3,"unit":""},{"name":"black peppercorns","amount":1,"unit":"tsp"},{"name":"lentils du Puy","amount":300,"unit":"g"},{"name":"shallots","amount":3,"unit":""},{"name":"red wine","amount":100,"unit":"ml"},{"name":"Dijon mustard","amount":1,"unit":"tbsp"},{"name":"chicken stock","amount":400,"unit":"ml"}]'::jsonb,
  instructions = ARRAY['Rub duck legs with salt, crushed garlic, thyme, and crushed peppercorns. Refrigerate uncovered 12–24 hours.','Rinse off the cure. Pat the duck dry.','Place duck legs in a snug ovenproof dish. Cover completely with melted duck fat.','Cook at 140°C for 2–2.5 hours until the meat pulls easily from the bone.','Cool duck in the fat. (At this stage it keeps refrigerated under fat for weeks.)','To serve: remove duck from fat, wipe off excess. Sear skin-side down in a dry, cold pan, then turn heat to high. Cook 8–10 minutes until the skin is golden and crackling.','For the lentils: sweat shallots, add lentils, wine, and stock. Simmer 25 minutes. Stir in mustard.','Serve duck legs over lentils with a simple green salad.']::text[]
WHERE id = '9ac43ce2-5aec-41f6-aa58-b6f657da996b';

UPDATE recipes SET
  title = 'Mango Habanero Ceviche',
  cuisine_type = 'Peruvian',
  description = 'Fresh sea bass cured in citrus, tossed with sweet mango, fiery habanero, red onion, and cilantro. Served in chilled glasses with tortilla chips, this ceviche achieves a perfect balance of heat, sweet, sour, and umami.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 0,
  calories = 220,
  protein_g = 28,
  carbs_g = 16,
  fat_g = 4,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  ingredients = '[{"name":"sea bass or halibut fillets","amount":500,"unit":"g"},{"name":"limes","amount":8,"unit":""},{"name":"lemon","amount":1,"unit":""},{"name":"ripe mango","amount":1,"unit":"large"},{"name":"habanero pepper","amount":0.5,"unit":""},{"name":"red onion","amount":0.5,"unit":""},{"name":"fresh cilantro","amount":1,"unit":"handful"},{"name":"sea salt","amount":1,"unit":"tsp"},{"name":"aji amarillo paste","amount":1,"unit":"tbsp"},{"name":"sweet potato","amount":1,"unit":""},{"name":"corn on the cob","amount":2,"unit":""},{"name":"tortilla chips","amount":1,"unit":"bag"}]'::jsonb,
  instructions = ARRAY['Dice fish into 2cm cubes. Place in a non-reactive bowl, season with salt.','Squeeze lime and lemon juice over the fish — enough to submerge. Mix in aji amarillo and habanero (de-seeded if you prefer less heat).','Cover and refrigerate 15 minutes — the citrus will ''cook'' the fish until opaque.','Drain most of the leche de tigre (citrus marinade) into a small glass — it''s the chef''s reward.','Toss fish with diced mango, finely sliced red onion, and cilantro.','Taste and adjust salt and lime balance.','Serve chilled in bowls or glasses with boiled sweet potato, charred corn, and tortilla chips alongside.']::text[]
WHERE id = '42b6b703-c699-4508-9847-b7eee16c0ae6';

UPDATE recipes SET
  title = 'Smoky Brisket Burnt Ends',
  cuisine_type = 'American',
  description = 'The most coveted cut in BBQ: brisket point slow-smoked until tender, cubed, sauced, and returned to the smoker until lacquered and caramelised into sticky, smoky bites. Pure barbecue nirvana.',
  servings = 8,
  prep_time_minutes = 30,
  cook_time_minutes = 480,
  calories = 580,
  protein_g = 52,
  carbs_g = 18,
  fat_g = 34,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  ingredients = '[{"name":"beef brisket point","amount":2.5,"unit":"kg"},{"name":"kosher salt","amount":3,"unit":"tbsp"},{"name":"black pepper","amount":3,"unit":"tbsp"},{"name":"garlic powder","amount":1,"unit":"tbsp"},{"name":"smoked paprika","amount":2,"unit":"tbsp"},{"name":"brown sugar","amount":60,"unit":"g"},{"name":"BBQ sauce","amount":200,"unit":"ml"},{"name":"butter","amount":60,"unit":"g"},{"name":"apple cider vinegar","amount":2,"unit":"tbsp"},{"name":"wood chips (oak or hickory)","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Mix salt, pepper, garlic powder, and smoked paprika. Apply generously to all sides of the brisket. Refrigerate overnight.','Set smoker to 120°C with oak or hickory wood. Smoke brisket fat-side up for 6 hours, spritzing with apple cider vinegar every hour after the first 2.','When the brisket reaches 75°C internal temp, wrap tightly in butcher paper. Continue cooking until 95°C, about 2 more hours.','Rest wrapped brisket for 1 hour, then separate the point from the flat.','Cube the point into 4cm pieces. Place in an aluminium tray.','Add BBQ sauce, butter, and brown sugar. Toss to coat every cube.','Return uncovered to the smoker at 120°C for 1.5–2 hours until each cube is sticky and lacquered.','Serve with pickles, white bread, and coleslaw.']::text[]
WHERE id = 'fdbf87e9-285e-4a22-b682-b807f2e8c72c';

UPDATE recipes SET
  title = 'Ethiopian Doro Wat',
  cuisine_type = 'Ethiopian',
  description = 'Ethiopia''s most celebrated dish — chicken slow-braised in a deeply spiced berbere sauce, with caramelised onions, niter kibbeh, and whole hard-boiled eggs. Served with spongy injera flatbread for scooping.',
  servings = 6,
  prep_time_minutes = 20,
  cook_time_minutes = 90,
  calories = 460,
  protein_g = 36,
  carbs_g = 24,
  fat_g = 22,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
  ingredients = '[{"name":"chicken legs and thighs","amount":1.2,"unit":"kg"},{"name":"red onions","amount":4,"unit":"large"},{"name":"berbere spice","amount":4,"unit":"tbsp"},{"name":"niter kibbeh or butter","amount":80,"unit":"g"},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"fresh ginger","amount":30,"unit":"g"},{"name":"hard-boiled eggs","amount":6,"unit":""},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"mead or dry red wine","amount":120,"unit":"ml"},{"name":"chicken stock","amount":200,"unit":"ml"},{"name":"injera flatbread","amount":4,"unit":"pieces"}]'::jsonb,
  instructions = ARRAY['Finely chop onions — do not add any oil. Cook in a dry heavy pot over medium heat for 30 minutes, stirring often, until deeply reduced and caramelised. This is crucial.','Add niter kibbeh and stir through the onions. Add minced garlic and ginger, cook 3 minutes.','Add berbere and tomato paste. Stir and cook 5 minutes over medium heat.','Pour in mead or wine and stock. Bring to a simmer.','Score chicken pieces deeply and add to the sauce. Cover and simmer 45–60 minutes until very tender.','Pierce the hard-boiled eggs all over with a fork. Add to the sauce for the last 10 minutes to absorb flavour and colour.','Taste and adjust seasoning with salt.','Serve on a large piece of injera, tearing more flatbread to use as utensils.']::text[]
WHERE id = '0db25f4a-2b14-419e-8015-5974fa37b0c5';

UPDATE recipes SET
  title = 'Pad Thai with Tiger Prawns',
  cuisine_type = 'Thai',
  description = 'The definitive street food noodle: rice noodles stir-fried with tiger prawns, bean sprouts, and eggs in a perfectly balanced tamarind and fish sauce glaze. Finished at the table with a squeeze of lime, crushed peanuts, and chilli.',
  servings = 2,
  prep_time_minutes = 15,
  cook_time_minutes = 10,
  calories = 480,
  protein_g = 34,
  carbs_g = 58,
  fat_g = 12,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  ingredients = '[{"name":"flat rice noodles","amount":200,"unit":"g"},{"name":"tiger prawns","amount":200,"unit":"g"},{"name":"eggs","amount":2,"unit":""},{"name":"bean sprouts","amount":100,"unit":"g"},{"name":"firm tofu","amount":80,"unit":"g"},{"name":"tamarind paste","amount":2,"unit":"tbsp"},{"name":"fish sauce","amount":2,"unit":"tbsp"},{"name":"palm sugar or brown sugar","amount":1,"unit":"tbsp"},{"name":"oyster sauce","amount":1,"unit":"tbsp"},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"shallots","amount":2,"unit":""},{"name":"roasted peanuts","amount":3,"unit":"tbsp"},{"name":"lime","amount":2,"unit":""},{"name":"spring onion","amount":2,"unit":""},{"name":"dried chilli flakes","amount":1,"unit":"tsp"},{"name":"neutral oil","amount":3,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Soak rice noodles in cold water for 30 minutes. Drain.','Mix tamarind paste, fish sauce, palm sugar, and oyster sauce in a bowl.','Heat wok over the highest possible heat until smoking. Add oil.','Add shallots and garlic, stir-fry 30 seconds. Add tofu cubes, fry until golden.','Add prawns and cook until just pink, about 2 minutes. Push to the side.','Crack eggs into the empty side of the wok. Scramble briefly, then mix everything together.','Add drained noodles and pour over the sauce. Toss vigorously for 2 minutes.','Add bean sprouts and spring onions. Toss 30 seconds more. Serve topped with crushed peanuts, with lime and chilli on the side.']::text[]
WHERE id = '29865f40-d49b-47ce-8892-da5de08c9e3e';

UPDATE recipes SET
  title = 'Osso Buco alla Milanese',
  cuisine_type = 'Italian',
  description = 'Slow-braised veal shanks in white wine, tomato, and gremolata — a Milanese classic that transforms a tough cut into silky, marrow-rich perfection. The traditional companion is a saffron risotto, served together in the same bowl.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 150,
  calories = 560,
  protein_g = 48,
  carbs_g = 24,
  fat_g = 24,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
  ingredients = '[{"name":"veal shanks, cross-cut","amount":4,"unit":"thick"},{"name":"flour for dusting","amount":3,"unit":"tbsp"},{"name":"onion","amount":1,"unit":""},{"name":"carrot","amount":1,"unit":""},{"name":"celery sticks","amount":2,"unit":""},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"dry white wine","amount":200,"unit":"ml"},{"name":"tomato passata","amount":200,"unit":"ml"},{"name":"chicken or veal stock","amount":400,"unit":"ml"},{"name":"lemon","amount":2,"unit":"zest"},{"name":"orange","amount":1,"unit":"zest"},{"name":"fresh parsley","amount":1,"unit":"large handful"},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"butter","amount":30,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Tie kitchen string around each shank to hold its shape during cooking. Season and dust with flour.','Sear shanks in olive oil and butter over high heat until deeply browned all over. Remove and set aside.','In the same pan, cook diced onion, carrot, and celery until softened, about 8 minutes.','Add garlic, cook 1 minute. Add white wine, scraping up all the browned bits.','Add passata and stock. Return shanks to the pan — they should be half-submerged.','Cover and braise at 160°C for 2–2.5 hours until meat falls from the bone.','Make the gremolata: finely chop parsley, mix with lemon and orange zest.','Serve shanks over saffron risotto, scatter generously with gremolata.']::text[]
WHERE id = 'e7eaa68d-0120-4dda-b5b7-9fa07d4ce33b';

UPDATE recipes SET
  title = 'Spiced Lentil and Spinach Soup',
  cuisine_type = 'Middle Eastern',
  description = 'A soul-warming red lentil soup bloomed with cumin, smoked paprika, and a drizzle of crimson chilli oil. Bright with lemon and finished with wilted spinach, it''s a nutritionally complete meal in a bowl.',
  servings = 6,
  prep_time_minutes = 10,
  cook_time_minutes = 35,
  calories = 310,
  protein_g = 18,
  carbs_g = 44,
  fat_g = 8,
  dietary_tags = ARRAY['vegan','gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
  ingredients = '[{"name":"red lentils","amount":350,"unit":"g"},{"name":"onions","amount":2,"unit":""},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"ground cumin","amount":2,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"turmeric","amount":0.5,"unit":"tsp"},{"name":"vegetable stock","amount":1.5,"unit":"litres"},{"name":"canned tomatoes","amount":400,"unit":"g"},{"name":"baby spinach","amount":150,"unit":"g"},{"name":"lemon","amount":2,"unit":""},{"name":"olive oil","amount":3,"unit":"tbsp"},{"name":"chilli oil","amount":1,"unit":"tbsp"},{"name":"fresh coriander","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Heat olive oil in a large pot. Fry onions until golden and soft, about 10 minutes.','Add garlic, cumin, paprika, and turmeric. Stir and cook 1 minute until fragrant.','Rinse lentils and add to the pot with canned tomatoes and stock.','Bring to a boil, then simmer 25 minutes until lentils are completely soft.','Use an immersion blender to partially blend — leave some texture.','Stir in spinach and cook until just wilted, 2 minutes.','Squeeze in lemon juice generously. Season with salt and pepper.','Ladle into bowls, drizzle with chilli oil, and scatter fresh coriander.']::text[]
WHERE id = 'e1178dd4-1a0a-4171-8da6-0537bfdd16c1';

UPDATE recipes SET
  title = 'Chocolate Fondant with Salted Caramel',
  cuisine_type = 'French',
  description = 'A perfectly timed chocolate fondant with a molten, fudgy centre, served with a ribbon of warm salted caramel sauce. The recipe that made Gordon Ramsay famous — and it''s far easier than it looks.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 12,
  calories = 580,
  protein_g = 9,
  carbs_g = 54,
  fat_g = 36,
  dietary_tags = ARRAY['vegetarian']::text[],
  image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  ingredients = '[{"name":"dark chocolate (70%)","amount":200,"unit":"g"},{"name":"butter","amount":120,"unit":"g"},{"name":"eggs","amount":4,"unit":""},{"name":"egg yolks","amount":4,"unit":""},{"name":"caster sugar","amount":120,"unit":"g"},{"name":"plain flour","amount":40,"unit":"g"},{"name":"cocoa powder","amount":2,"unit":"tbsp"},{"name":"vanilla extract","amount":1,"unit":"tsp"},{"name":"heavy cream","amount":150,"unit":"ml"},{"name":"salted butter","amount":30,"unit":"g"},{"name":"flaky sea salt","amount":0.5,"unit":"tsp"},{"name":"vanilla ice cream","amount":4,"unit":"scoops"}]'::jsonb,
  instructions = ARRAY['Melt chocolate and butter together over a bain-marie. Cool to room temperature.','Whisk eggs, yolks, and sugar until pale and tripled in volume, about 5 minutes.','Fold chocolate mixture into the egg mixture gently.','Sift in flour and fold until just combined.','Butter and dust 4 ramekins with cocoa powder. Fill ⅔ full. Refrigerate at least 20 minutes (or up to 2 days).','For the caramel: heat sugar in a dry saucepan until amber. Remove from heat, whisk in cream (it will bubble violently), then salted butter. Cool slightly.','Bake fondants at 200°C for 10–12 minutes: the sides should be set but the centre must still wobble.','Rest 1 minute, run a knife around the edge, invert onto plates. Serve immediately with caramel and ice cream.']::text[]
WHERE id = '297ff082-240c-4929-8255-26e15e1ab2ed';

UPDATE recipes SET
  title = 'Banh Mi with Lemongrass Pork',
  cuisine_type = 'Vietnamese',
  description = 'A Vietnamese sandwich that perfectly embodies East-meets-West: a crispy French baguette packed with juicy lemongrass pork, pickled daikon and carrot, cucumber, jalapeño, and a smear of Maggi-laced mayonnaise.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 10,
  calories = 520,
  protein_g = 32,
  carbs_g = 54,
  fat_g = 18,
  dietary_tags = ARRAY['dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
  ingredients = '[{"name":"pork shoulder or belly, thinly sliced","amount":500,"unit":"g"},{"name":"lemongrass stalks","amount":2,"unit":""},{"name":"fish sauce","amount":2,"unit":"tbsp"},{"name":"soy sauce","amount":1,"unit":"tbsp"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"sugar","amount":1,"unit":"tbsp"},{"name":"Vietnamese baguettes","amount":4,"unit":""},{"name":"daikon radish","amount":150,"unit":"g"},{"name":"carrot","amount":2,"unit":""},{"name":"rice vinegar","amount":60,"unit":"ml"},{"name":"cucumber","amount":1,"unit":""},{"name":"jalapeño","amount":1,"unit":""},{"name":"fresh cilantro","amount":1,"unit":"handful"},{"name":"mayonnaise","amount":4,"unit":"tbsp"},{"name":"Maggi seasoning sauce","amount":1,"unit":"tsp"},{"name":"pâté (optional)","amount":60,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Make pickled vegetables: julienne daikon and carrot, toss with rice vinegar, sugar, and a pinch of salt. Leave 30 minutes.','Blend lemongrass, garlic, fish sauce, soy, and sugar into a paste. Marinate pork slices at least 30 minutes.','Mix mayonnaise with Maggi seasoning.','Grill or pan-fry pork over high heat 2–3 minutes per side until caramelised and cooked through.','Slice baguettes lengthways, lightly toast the cut sides.','Spread Maggi mayo generously on both sides. Add pâté if using.','Layer pork, pickled vegetables, sliced cucumber, jalapeño, and cilantro.','Press together firmly and serve immediately — the contrast of warm pork and cool pickles is everything.']::text[]
WHERE id = 'afd95562-b196-4c3d-9822-1e5510877501';

UPDATE recipes SET
  title = 'Paneer Butter Masala',
  cuisine_type = 'Indian',
  description = 'Soft paneer cubes bathed in a luscious, orange-hued butter sauce fragrant with cardamom, fenugreek, and cream. A North Indian classic that''s richer than its cousin Tikka Masala, with a sauce so good you''ll want to eat it with a spoon.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 35,
  calories = 480,
  protein_g = 22,
  carbs_g = 26,
  fat_g = 32,
  dietary_tags = ARRAY['vegetarian','gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
  ingredients = '[{"name":"paneer","amount":400,"unit":"g"},{"name":"tomatoes","amount":4,"unit":"large"},{"name":"onion","amount":1,"unit":""},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"fresh ginger","amount":20,"unit":"g"},{"name":"butter","amount":60,"unit":"g"},{"name":"double cream","amount":100,"unit":"ml"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"garam masala","amount":1.5,"unit":"tsp"},{"name":"ground cumin","amount":1,"unit":"tsp"},{"name":"Kashmiri red chilli powder","amount":1,"unit":"tsp"},{"name":"cardamom pods","amount":4,"unit":""},{"name":"kasuri methi","amount":1,"unit":"tsp"},{"name":"sugar","amount":1,"unit":"tsp"},{"name":"basmati rice","amount":300,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Blend tomatoes, onion, garlic, and ginger to a smooth paste.','Melt butter in a heavy pan. Add cardamom pods and fry 30 seconds.','Add the tomato-onion paste. Cook over medium heat for 15–20 minutes, stirring regularly, until the paste deepens in colour and butter begins to separate.','Add tomato paste, chilli powder, cumin, and garam masala. Cook 3 minutes.','Add cream and sugar. Stir and simmer 5 minutes.','Cut paneer into cubes. Lightly pan-fry until golden on two sides, then add directly to the sauce.','Crush kasuri methi between your palms and stir in. Simmer 5 minutes.','Serve with basmati rice and naan, with a swirl of extra cream and fresh cilantro.']::text[]
WHERE id = 'bd1aa37d-05b8-497d-83ae-b308b58c8176';

UPDATE recipes SET
  title = 'Bouillabaisse',
  cuisine_type = 'French',
  description = 'Marseille''s legendary fisherman''s stew: a saffron-orange broth ladled over slabs of toasted bread spread with garlicky rouille, heaped with an oceanic array of fish and shellfish. One of the world''s most theatrical dishes.',
  servings = 6,
  prep_time_minutes = 30,
  cook_time_minutes = 60,
  calories = 460,
  protein_g = 48,
  carbs_g = 28,
  fat_g = 14,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1549584526-c2a2e8dde7b0?w=800&q=80',
  ingredients = '[{"name":"mixed firm fish fillets","amount":800,"unit":"g"},{"name":"mussels","amount":400,"unit":"g"},{"name":"clams","amount":300,"unit":"g"},{"name":"large prawns","amount":300,"unit":"g"},{"name":"fennel bulb","amount":1,"unit":""},{"name":"onion","amount":2,"unit":""},{"name":"tomatoes","amount":4,"unit":""},{"name":"garlic","amount":8,"unit":"cloves"},{"name":"saffron threads","amount":1,"unit":"g"},{"name":"dry white wine","amount":300,"unit":"ml"},{"name":"fish stock","amount":1.5,"unit":"litres"},{"name":"orange peel","amount":1,"unit":"strip"},{"name":"fennel seeds","amount":1,"unit":"tsp"},{"name":"Pernod","amount":2,"unit":"tbsp"},{"name":"baguette","amount":1,"unit":""},{"name":"mayonnaise","amount":120,"unit":"g"},{"name":"smoked paprika","amount":1,"unit":"tsp"}]'::jsonb,
  instructions = ARRAY['Make rouille: blend 4 garlic cloves with mayonnaise, smoked paprika, saffron pinch, and a little lemon. Set aside.','Heat oil in a very large pot. Sauté onion and fennel until soft. Add remaining garlic and cook 2 minutes.','Add fennel seeds, chopped tomatoes, tomato paste, and orange peel. Cook 5 minutes.','Add wine and Pernod, let bubble. Add fish stock and saffron. Simmer 20 minutes.','Blend the broth base until smooth. Pass through a sieve for an elegant result, or leave textured.','Bring the strained broth back to a vigorous boil. Add the firmest fish first, then shellfish, timing each so everything finishes at once.','Toast baguette slices and spread generously with rouille.','Serve the stew in wide bowls with the rouille toasts floating on top.']::text[]
WHERE id = 'b994869c-7c09-4b27-8b4a-1b8398e2756c';

UPDATE recipes SET
  title = 'Turkish Iskender Kebab',
  cuisine_type = 'Turkish',
  description = 'Thinly sliced döner meat draped over torn bread, drenched in a bright tomato sauce and browned butter. A plate of Turkish comfort from Bursa — the combination of textures and the hit of butter is extraordinary.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 30,
  calories = 620,
  protein_g = 44,
  carbs_g = 42,
  fat_g = 28,
  dietary_tags = ARRAY[]::text[],
  image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  ingredients = '[{"name":"lamb mince","amount":500,"unit":"g"},{"name":"beef mince","amount":300,"unit":"g"},{"name":"onion","amount":1,"unit":""},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"ground cumin","amount":1,"unit":"tsp"},{"name":"ground coriander","amount":1,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tsp"},{"name":"pita or flatbread","amount":4,"unit":""},{"name":"tomato passata","amount":400,"unit":"ml"},{"name":"butter","amount":80,"unit":"g"},{"name":"Turkish pepper paste","amount":2,"unit":"tbsp"},{"name":"full-fat yogurt","amount":300,"unit":"ml"},{"name":"garlic (for yogurt)","amount":2,"unit":"cloves"},{"name":"sumac","amount":1,"unit":"tsp"},{"name":"fresh mint","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Mix lamb and beef mince with grated onion, garlic, cumin, coriander, paprika, and salt.','Shape into thin oblong patties or mould around flat skewers. Refrigerate 30 minutes.','Grill kebabs over charcoal or under a broiler for 4–5 minutes per side until cooked through.','For the tomato sauce: sauté onion until soft, add pepper paste and passata. Simmer 15 minutes.','Tear pita into rough pieces. Toast in a dry pan or oven until crisp.','Make garlic yogurt: mix yogurt with crushed garlic and salt.','To serve: arrange pita pieces on plates. Layer sliced kebab over the bread.','Ladle hot tomato sauce over everything, then immediately pour over sizzling browned butter. Add garlic yogurt on the side, dust with sumac, and scatter fresh mint.']::text[]
WHERE id = 'c9f83048-76f7-4ced-a7ee-42110a19007f';

UPDATE recipes SET
  title = 'Shakshuka Verde',
  cuisine_type = 'Middle Eastern',
  description = 'A vibrant green twist on the classic shakshuka: eggs poached in a tomatillo, jalapeño, and spinach sauce spiced with cumin and coriander. Finished with crumbled cotija, avocado, and warm flatbread for a stunning brunch.',
  servings = 4,
  prep_time_minutes = 10,
  cook_time_minutes = 20,
  calories = 320,
  protein_g = 16,
  carbs_g = 22,
  fat_g = 18,
  dietary_tags = ARRAY['vegetarian','gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  ingredients = '[{"name":"eggs","amount":6,"unit":""},{"name":"tomatillos","amount":500,"unit":"g"},{"name":"jalapeño","amount":2,"unit":""},{"name":"poblano pepper","amount":1,"unit":""},{"name":"spinach","amount":150,"unit":"g"},{"name":"onion","amount":1,"unit":""},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"ground cumin","amount":1,"unit":"tsp"},{"name":"ground coriander","amount":1,"unit":"tsp"},{"name":"cotija or feta cheese","amount":80,"unit":"g"},{"name":"avocado","amount":1,"unit":""},{"name":"lime","amount":2,"unit":""},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"fresh cilantro","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Roast tomatillos, jalapeños, and poblano under a broiler until charred and soft, about 8 minutes.','Blend roasted vegetables with garlic until slightly chunky.','Heat oil in a wide pan. Cook onion until soft. Add cumin and coriander, stir 1 minute.','Pour in the tomatillo sauce. Simmer 5 minutes. Stir in spinach until wilted.','Season generously with salt and lime juice.','Make 6 wells in the sauce, crack an egg into each. Cover and cook 6–8 minutes until whites are just set.','Top with crumbled cotija, diced avocado, and cilantro. Serve with warm flatbread.']::text[]
WHERE id = '0500b759-b80e-4a9b-ac6e-d78644239c56';

UPDATE recipes SET
  title = 'Chilli Crab with Mantou Buns',
  cuisine_type = 'Singaporean',
  description = 'Singapore''s most iconic dish: whole mud crab stir-fried in a sweet, spicy, egg-thickened tomato and chilli sauce. The steamed mantou buns for sauce-dunking are not optional — they are the entire point.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 25,
  calories = 480,
  protein_g = 42,
  carbs_g = 36,
  fat_g = 18,
  dietary_tags = ARRAY['dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
  ingredients = '[{"name":"mud crab, cleaned and halved","amount":1.5,"unit":"kg"},{"name":"mantou buns","amount":8,"unit":""},{"name":"tomato ketchup","amount":4,"unit":"tbsp"},{"name":"chilli sauce","amount":3,"unit":"tbsp"},{"name":"sambal oelek","amount":2,"unit":"tbsp"},{"name":"eggs","amount":2,"unit":""},{"name":"garlic","amount":6,"unit":"cloves"},{"name":"ginger","amount":30,"unit":"g"},{"name":"shallots","amount":4,"unit":""},{"name":"oyster sauce","amount":2,"unit":"tbsp"},{"name":"sugar","amount":1,"unit":"tbsp"},{"name":"sesame oil","amount":1,"unit":"tsp"},{"name":"cornstarch","amount":1,"unit":"tbsp"},{"name":"spring onions","amount":2,"unit":""}]'::jsonb,
  instructions = ARRAY['Steam mantou buns for 10 minutes until soft and pillowy.','Blend garlic, ginger, and shallots to a paste.','Heat a large wok over high heat with oil until smoking. Stir-fry the aromatic paste 2 minutes.','Add crab pieces and stir-fry, tossing constantly, for 4 minutes.','Mix ketchup, chilli sauce, sambal, oyster sauce, and sugar with 200ml water. Pour over crab.','Cover and steam-cook 8 minutes, turning crab once.','Beat eggs. Stir cornstarch with a little water. Add cornstarch to the sauce, stir until glossy.','Remove from heat and stir in beaten eggs in slow circles — the heat will turn them into silky ribbons. Add sesame oil. Serve with mantou buns and spring onions.']::text[]
WHERE id = '36848976-c173-46fe-bcda-7f76c33a67c2';

UPDATE recipes SET
  title = 'Mushroom and Truffle Risotto',
  cuisine_type = 'Italian',
  description = 'Intensely earthy and luxurious: a silky risotto built on a mushroom stock base with sautéed porcini and chestnut mushrooms, finished with white truffle oil and a blizzard of Parmigiano. The ultimate date-night first course.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 40,
  calories = 480,
  protein_g = 14,
  carbs_g = 62,
  fat_g = 18,
  dietary_tags = ARRAY['vegetarian','gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=800&q=80',
  ingredients = '[{"name":"arborio rice","amount":320,"unit":"g"},{"name":"dried porcini mushrooms","amount":20,"unit":"g"},{"name":"chestnut mushrooms","amount":250,"unit":"g"},{"name":"shallots","amount":2,"unit":""},{"name":"garlic","amount":2,"unit":"cloves"},{"name":"dry white wine","amount":150,"unit":"ml"},{"name":"vegetable stock","amount":1.2,"unit":"litres"},{"name":"butter","amount":60,"unit":"g"},{"name":"Parmigiano Reggiano","amount":80,"unit":"g"},{"name":"white truffle oil","amount":1,"unit":"tbsp"},{"name":"fresh thyme","amount":3,"unit":"sprigs"},{"name":"olive oil","amount":2,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Soak dried porcini in 300ml boiling water for 20 minutes. Drain, reserving all the soaking liquid. Chop porcini.','Warm the vegetable stock with the mushroom soaking liquid (poured through a sieve) in a saucepan.','Sauté chestnut mushrooms in olive oil over high heat until golden and any liquid has evaporated. Add thyme. Set aside.','In a wide heavy pan, cook shallots in butter until soft. Add garlic and porcini, cook 2 minutes.','Add rice and toast 2 minutes. Add wine and stir until absorbed.','Add warm stock one ladle at a time, stirring constantly, 18–20 minutes until rice is creamy and just al dente.','Remove from heat. Beat in remaining cold butter and parmesan vigorously (this is the mantecatura).','Fold in sautéed mushrooms, add truffle oil, and rest 2 minutes. Serve immediately.']::text[]
WHERE id = '36a97b3e-fee4-4282-82e8-2a7418ff604f';

UPDATE recipes SET
  title = 'Beef Rendang',
  cuisine_type = 'Indonesian',
  description = 'The greatest dry curry: beef slowly simmered with lemongrass, galangal, and turmeric leaf until the coconut milk evaporates and the beef fries in its own aromatic fat, developing an impossibly complex, caramelised crust.',
  servings = 6,
  prep_time_minutes = 30,
  cook_time_minutes = 180,
  calories = 560,
  protein_g = 42,
  carbs_g = 14,
  fat_g = 36,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
  ingredients = '[{"name":"beef chuck, cut into large cubes","amount":1.2,"unit":"kg"},{"name":"coconut milk","amount":800,"unit":"ml"},{"name":"lemongrass stalks","amount":3,"unit":""},{"name":"galangal","amount":40,"unit":"g"},{"name":"turmeric","amount":20,"unit":"g (fresh)"},{"name":"kaffir lime leaves","amount":6,"unit":""},{"name":"dried red chillies","amount":8,"unit":""},{"name":"shallots","amount":6,"unit":""},{"name":"garlic","amount":5,"unit":"cloves"},{"name":"candlenuts or macadamias","amount":4,"unit":""},{"name":"desiccated coconut, toasted","amount":3,"unit":"tbsp"},{"name":"tamarind paste","amount":1,"unit":"tbsp"},{"name":"palm sugar","amount":1,"unit":"tbsp"},{"name":"neutral oil","amount":2,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Blend chillies, shallots, garlic, candlenuts, galangal, and fresh turmeric to a smooth paste.','Fry the paste in oil over medium heat for 5 minutes until deepened in colour.','Add beef and stir to coat completely in the paste.','Add coconut milk, lemongrass (bruised), lime leaves, tamarind, palm sugar, and toasted coconut.','Bring to a boil, then reduce heat and simmer uncovered for 2–3 hours, stirring occasionally.','Continue cooking and stirring more frequently as the coconut milk evaporates — the mixture will become thick and oily.','Once all liquid is gone, the beef will begin to fry in its own coconut oil. Stir continuously for 15 minutes until deeply caramelised and almost dry.','Serve with steamed white rice and cucumber.']::text[]
WHERE id = '8fc215ea-ee4b-4692-adbd-d50418be3168';

UPDATE recipes SET
  title = 'Tarte Tatin',
  cuisine_type = 'French',
  description = 'France''s greatest accidental dessert: apples caramelised in a copper pan until they collapse and candify, sealed under buttery puff pastry and dramatically inverted. The contrast of jammy apples and flaky pastry is unbeatable.',
  servings = 6,
  prep_time_minutes = 20,
  cook_time_minutes = 40,
  calories = 380,
  protein_g = 4,
  carbs_g = 58,
  fat_g = 16,
  dietary_tags = ARRAY['vegetarian']::text[],
  image_url = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  ingredients = '[{"name":"firm apples (Cox or Granny Smith)","amount":1.2,"unit":"kg"},{"name":"caster sugar","amount":180,"unit":"g"},{"name":"butter","amount":80,"unit":"g"},{"name":"vanilla pod","amount":1,"unit":""},{"name":"ready-rolled puff pastry","amount":320,"unit":"g"},{"name":"fleur de sel","amount":0.5,"unit":"tsp"},{"name":"crème fraîche or vanilla ice cream","amount":200,"unit":"g"},{"name":"lemon","amount":0.5,"unit":""}]'::jsonb,
  instructions = ARRAY['Peel, core, and quarter the apples. Toss with lemon juice.','In a 26cm ovenproof frying pan, melt butter and sugar over medium heat. Do not stir — let it caramelise to a deep amber.','Remove from heat immediately. Add the vanilla seeds and a pinch of fleur de sel.','Arrange apple quarters tightly in the pan, standing them on their edges in concentric circles.','Return to medium heat and cook the apples 10–12 minutes until they soften and the caramel becomes very thick.','Drape puff pastry over the apples, tucking the edges down around the fruit inside the pan.','Bake at 200°C for 25–30 minutes until the pastry is deeply golden.','Cool 5 minutes, then invert onto a plate in one confident motion. Serve warm with crème fraîche.']::text[]
WHERE id = '1f7106a7-09ad-4317-a7c9-ce4a1e8c794c';

UPDATE recipes SET
  title = 'Pulled Pork Tacos with Slaw',
  cuisine_type = 'American',
  description = 'Slow-roasted pork shoulder rubbed in ancho chilli and cumin, shredded into tender strands and piled into warm corn tortillas with a sharp apple and cabbage slaw. The smokiness and the crunch together are irresistible.',
  servings = 8,
  prep_time_minutes = 20,
  cook_time_minutes = 300,
  calories = 520,
  protein_g = 38,
  carbs_g = 44,
  fat_g = 18,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  ingredients = '[{"name":"pork shoulder bone-in","amount":2,"unit":"kg"},{"name":"ancho chilli powder","amount":2,"unit":"tbsp"},{"name":"ground cumin","amount":2,"unit":"tsp"},{"name":"garlic powder","amount":1,"unit":"tsp"},{"name":"smoked paprika","amount":1,"unit":"tbsp"},{"name":"brown sugar","amount":2,"unit":"tbsp"},{"name":"apple cider vinegar","amount":3,"unit":"tbsp"},{"name":"corn tortillas","amount":24,"unit":""},{"name":"red cabbage","amount":300,"unit":"g"},{"name":"apple","amount":1,"unit":""},{"name":"jalapeño","amount":1,"unit":""},{"name":"lime","amount":3,"unit":""},{"name":"fresh cilantro","amount":1,"unit":"bunch"},{"name":"mayonnaise","amount":4,"unit":"tbsp"},{"name":"sriracha","amount":1,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Mix all dry rub spices with sugar and salt. Coat pork shoulder generously all over.','Place fat-side up in a roasting dish with a splash of water. Cover tightly with foil.','Roast at 160°C for 4–5 hours until the meat falls apart when prodded.','Uncover, increase heat to 220°C, and roast 20 minutes more to caramelise the crust.','Shred meat with two forks, mixing in the pan juices and a splash of apple cider vinegar.','Make the slaw: shred red cabbage and apple, mix with sliced jalapeño, lime juice, cilantro, mayo, and sriracha.','Warm tortillas in a dry pan or wrapped in a damp towel in the microwave.','Fill tortillas with pulled pork and slaw. Serve with extra lime wedges.']::text[]
WHERE id = 'c36cf4e6-8382-48aa-83bb-a8fc765d75ea';

UPDATE recipes SET
  title = 'Butternut Squash and Coconut Soup',
  cuisine_type = 'Thai',
  description = 'A silky, warmly spiced soup where roasted butternut squash meets coconut milk, lemongrass, and a swirl of red curry paste. Topped with crispy coconut cream and toasted pumpkin seeds, it''s autumn in a bowl.',
  servings = 6,
  prep_time_minutes = 15,
  cook_time_minutes = 45,
  calories = 280,
  protein_g = 5,
  carbs_g = 36,
  fat_g = 14,
  dietary_tags = ARRAY['vegan','gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
  ingredients = '[{"name":"butternut squash","amount":1.2,"unit":"kg"},{"name":"coconut milk","amount":400,"unit":"ml"},{"name":"vegetable stock","amount":800,"unit":"ml"},{"name":"red curry paste","amount":2,"unit":"tbsp"},{"name":"lemongrass","amount":1,"unit":"stalk"},{"name":"garlic","amount":3,"unit":"cloves"},{"name":"fresh ginger","amount":20,"unit":"g"},{"name":"onion","amount":1,"unit":""},{"name":"lime leaves","amount":3,"unit":""},{"name":"lime","amount":2,"unit":""},{"name":"toasted pumpkin seeds","amount":3,"unit":"tbsp"},{"name":"coconut cream","amount":60,"unit":"ml"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"coriander","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Cut squash in half, brush with oil, roast cut-side down at 200°C for 40 minutes until deeply tender.','Scoop out the flesh and discard the skin.','Fry onion in oil until soft. Add garlic, ginger, and lemongrass (bruised). Cook 2 minutes.','Add red curry paste and cook 1 minute until fragrant.','Add squash flesh, coconut milk, stock, and lime leaves. Bring to a simmer.','Remove lemongrass. Blend until completely smooth.','Season with lime juice and salt. Add more stock if too thick.','Serve in bowls drizzled with coconut cream, scattered with pumpkin seeds and coriander.']::text[]
WHERE id = '145cea49-36a3-4b01-88af-d8b281e50a51';

UPDATE recipes SET
  title = 'Chimichurri Skirt Steak',
  cuisine_type = 'Argentinian',
  description = 'An Argentine asado classic: skirt steak cooked hard and fast over high heat until caramelised outside and gloriously pink within, draped in a herby, garlicky chimichurri that cuts through the richness perfectly.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 10,
  calories = 480,
  protein_g = 46,
  carbs_g = 6,
  fat_g = 28,
  dietary_tags = ARRAY['gluten-free','dairy-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  ingredients = '[{"name":"skirt steak","amount":800,"unit":"g"},{"name":"fresh flat-leaf parsley","amount":2,"unit":"large handfuls"},{"name":"fresh oregano","amount":1,"unit":"handful"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"red wine vinegar","amount":3,"unit":"tbsp"},{"name":"extra virgin olive oil","amount":80,"unit":"ml"},{"name":"dried chilli flakes","amount":0.5,"unit":"tsp"},{"name":"lemon","amount":1,"unit":""},{"name":"coarse sea salt","amount":2,"unit":"tsp"},{"name":"chimichurri red pepper","amount":0.5,"unit":""},{"name":"sweet potato","amount":3,"unit":""},{"name":"rocket leaves","amount":60,"unit":"g"}]'::jsonb,
  instructions = ARRAY['Make chimichurri: finely chop parsley, oregano, and garlic (do not blend — it should be textured). Mix with vinegar, olive oil, chilli flakes, and a squeeze of lemon. Season with salt.','Bring steak to room temperature. Pat dry, season generously with salt.','Heat a cast iron pan or griddle to the highest possible heat. No oil needed.','Sear steak for 3–4 minutes per side for medium-rare — do not move it until it releases naturally.','Rest the steak 5 minutes. Cut against the grain into thin slices.','Meanwhile roast sweet potato wedges at 200°C with oil and salt for 35 minutes.','Arrange sliced steak and sweet potato on a board or plate.','Spoon chimichurri generously over everything. Scatter rocket, and serve remaining chimichurri on the side.']::text[]
WHERE id = 'b8401d56-6930-4782-ab06-7e4431f5bd4d';

UPDATE recipes SET
  title = 'Lobster Bisque',
  cuisine_type = 'French',
  description = 'A restaurant-quality bisque with a deeply flavoured shell stock, enriched with Cognac and cream into a bisque of extraordinary depth. Finished at the table with a swirl of butter and a scattering of chives.',
  servings = 4,
  prep_time_minutes = 30,
  cook_time_minutes = 60,
  calories = 420,
  protein_g = 24,
  carbs_g = 18,
  fat_g = 28,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
  ingredients = '[{"name":"cooked lobster","amount":2,"unit":"(shells and meat)"},{"name":"double cream","amount":200,"unit":"ml"},{"name":"Cognac or brandy","amount":60,"unit":"ml"},{"name":"dry white wine","amount":200,"unit":"ml"},{"name":"fish stock","amount":800,"unit":"ml"},{"name":"onion","amount":1,"unit":""},{"name":"carrot","amount":1,"unit":""},{"name":"celery","amount":2,"unit":"stalks"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"butter","amount":60,"unit":"g"},{"name":"bay leaves","amount":2,"unit":""},{"name":"fresh thyme","amount":3,"unit":"sprigs"},{"name":"tarragon","amount":1,"unit":"tbsp"},{"name":"cayenne pepper","amount":0.25,"unit":"tsp"}]'::jsonb,
  instructions = ARRAY['Remove all lobster meat and reserve. Roughly crush the shells.','Roast shells on a baking tray at 200°C for 15 minutes until fragrant.','Melt butter in a large pot. Sauté onion, carrot, and celery until soft.','Add tomato paste and cook 2 minutes. Add roasted shells.','Add Cognac and carefully flambé, or simply let it cook off for 2 minutes.','Add wine, fish stock, bay, and thyme. Simmer 30 minutes. Strain through a fine sieve, pressing shells hard.','Return strained broth to the pot, add cream, cayenne, and tarragon. Simmer 10 minutes.','Blend until silky. Season and stir in cold butter for gloss. Serve with chopped lobster meat and chives.']::text[]
WHERE id = '2fd2fb4c-f370-4382-923f-559bcc184db6';

UPDATE recipes SET
  title = 'Mushroom Larb (Thai Herb Salad)',
  cuisine_type = 'Thai',
  description = 'A Lao-Thai salad of minced mushrooms toasted with ground rice, lime, fish sauce, and an avalanche of fresh mint and shallots. It''s punchy, herby, and intensely refreshing — one of the most exciting dishes in South-East Asian cooking.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 10,
  calories = 220,
  protein_g = 8,
  carbs_g = 24,
  fat_g = 8,
  dietary_tags = ARRAY['vegetarian','gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  ingredients = '[{"name":"oyster and king oyster mushrooms","amount":600,"unit":"g"},{"name":"toasted rice powder","amount":3,"unit":"tbsp"},{"name":"lime","amount":3,"unit":""},{"name":"fish sauce or soy sauce","amount":2,"unit":"tbsp"},{"name":"dried chilli flakes","amount":1,"unit":"tsp"},{"name":"shallots","amount":4,"unit":""},{"name":"fresh mint","amount":1,"unit":"large handful"},{"name":"fresh cilantro","amount":1,"unit":"handful"},{"name":"lemongrass","amount":1,"unit":"stalk"},{"name":"spring onions","amount":3,"unit":""},{"name":"sugar","amount":1,"unit":"tsp"},{"name":"sticky rice","amount":200,"unit":"g"},{"name":"neutral oil","amount":2,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Make toasted rice powder: toast raw jasmine rice in a dry pan until golden, cool, and grind to a coarse powder.','Roughly chop mushrooms. Heat oil in a wok until smoking hot. Fry mushrooms in batches until deeply caramelised and dry.','Transfer mushrooms to a bowl. Add toasted rice powder, dried chilli, fish sauce, and lime juice.','Toss with sliced shallots, finely chopped lemongrass, and spring onions.','Add sugar and taste — the dressing should be sour, salty, slightly sweet, and spicy.','At the last moment, tear in fresh mint and cilantro leaves. Toss once more.','Serve immediately — larb is a salad that should be eaten fresh — alongside sticky rice and raw vegetables for scooping.']::text[]
WHERE id = '27b9bc6d-3198-4e4f-897e-85884d83ef8d';

UPDATE recipes SET
  title = 'Wagyu Beef Tartare',
  cuisine_type = 'French',
  description = 'The king of tartares: hand-cut wagyu beef dressed with classical condiments — capers, cornichons, shallot, and Dijon — elevated by a quality of marbling that turns every bite buttery and unctuous. Served with crisped potato gaufrettes.',
  servings = 2,
  prep_time_minutes = 20,
  cook_time_minutes = 0,
  calories = 480,
  protein_g = 38,
  carbs_g = 8,
  fat_g = 32,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1551183053-bf91798d9fe8?w=800&q=80',
  ingredients = '[{"name":"wagyu beef fillet","amount":250,"unit":"g"},{"name":"egg yolks","amount":2,"unit":""},{"name":"Dijon mustard","amount":1,"unit":"tbsp"},{"name":"capers","amount":2,"unit":"tbsp"},{"name":"cornichons","amount":6,"unit":""},{"name":"shallot","amount":1,"unit":""},{"name":"flat-leaf parsley","amount":2,"unit":"tbsp"},{"name":"Worcestershire sauce","amount":0.5,"unit":"tsp"},{"name":"Tabasco","amount":4,"unit":"drops"},{"name":"extra virgin olive oil","amount":1,"unit":"tbsp"},{"name":"fleur de sel","amount":0.5,"unit":"tsp"},{"name":"black pepper","amount":0.5,"unit":"tsp"},{"name":"toasted sourdough or gaufrettes","amount":4,"unit":"slices"}]'::jsonb,
  instructions = ARRAY['Chill the beef thoroughly. Use a sharp knife to slice then chop by hand into very small dice — never use a food processor.','Finely mince shallot, capers, cornichons, and parsley.','In a bowl, combine Dijon, Worcestershire, Tabasco, and olive oil. Whisk smooth.','Add beef, shallot mixture, and fold gently together. Season with fleur de sel and pepper.','Taste and adjust — it should be well-seasoned, with a good hit of mustard and acidity.','Press into a ring mould on a chilled plate and unmould. Make a small indent in the centre.','Place an egg yolk in the indent. Serve immediately with toasted sourdough or gaufrette crisps, and allow diners to mix the yolk through at the table.']::text[]
WHERE id = '86f0135a-b0ab-4c59-848f-e53efdbdd80c';

UPDATE recipes SET
  title = 'Bibimbap with Gochujang Sauce',
  cuisine_type = 'Korean',
  description = 'Korea''s most beloved rice dish: a bowl of steamed rice topped with an artful arrangement of seasoned vegetables, marinated beef, and a jammy fried egg, mixed tableside with a fiery, sweet gochujang sauce.',
  servings = 4,
  prep_time_minutes = 30,
  cook_time_minutes = 30,
  calories = 540,
  protein_g = 28,
  carbs_g = 68,
  fat_g = 16,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=800&q=80',
  ingredients = '[{"name":"short-grain rice","amount":400,"unit":"g"},{"name":"beef sirloin","amount":300,"unit":"g"},{"name":"spinach","amount":200,"unit":"g"},{"name":"bean sprouts","amount":150,"unit":"g"},{"name":"carrot","amount":2,"unit":""},{"name":"zucchini","amount":1,"unit":""},{"name":"shiitake mushrooms","amount":150,"unit":"g"},{"name":"eggs","amount":4,"unit":""},{"name":"gochujang","amount":4,"unit":"tbsp"},{"name":"sesame oil","amount":3,"unit":"tbsp"},{"name":"soy sauce","amount":3,"unit":"tbsp"},{"name":"garlic","amount":4,"unit":"cloves"},{"name":"sugar","amount":1,"unit":"tbsp"},{"name":"sesame seeds","amount":2,"unit":"tbsp"},{"name":"neutral oil","amount":3,"unit":"tbsp"}]'::jsonb,
  instructions = ARRAY['Make gochujang sauce: mix gochujang, sesame oil, soy, sugar, and a minced garlic clove.','Marinate thinly sliced beef in soy, sesame oil, garlic, and sugar for 30 minutes.','Blanch spinach 30 seconds in boiling water, squeeze dry, season with sesame oil and salt.','Blanch bean sprouts 2 minutes, dress with sesame oil and salt.','Sauté julienned carrot, zucchini, and sliced mushrooms separately in oil — each vegetable gets its own quick stir-fry.','Stir-fry the marinated beef until caramelised, about 3 minutes.','Fry eggs sunny side up in a little oil.','Divide hot rice into bowls. Arrange each vegetable and the beef in neat sections over the rice. Top with a fried egg. Drizzle with gochujang sauce and serve — mixing everything together at the table.']::text[]
WHERE id = '11ac8d71-6e65-44a9-92a4-cf966e83a969';

UPDATE recipes SET
  title = 'Soufflé au Fromage',
  cuisine_type = 'French',
  description = 'The dish that terrifies home cooks and shouldn''t: a cloud-light, golden-crusted Gruyère soufflé that rises dramatically from its ramekin. Made with a proper béchamel base, it''s surprisingly forgiving and endlessly impressive.',
  servings = 4,
  prep_time_minutes = 20,
  cook_time_minutes = 30,
  calories = 380,
  protein_g = 18,
  carbs_g = 24,
  fat_g = 24,
  dietary_tags = ARRAY['vegetarian']::text[],
  image_url = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  ingredients = '[{"name":"butter","amount":60,"unit":"g"},{"name":"plain flour","amount":50,"unit":"g"},{"name":"whole milk","amount":250,"unit":"ml"},{"name":"Gruyère cheese","amount":120,"unit":"g"},{"name":"Parmesan (for dusting)","amount":30,"unit":"g"},{"name":"eggs","amount":4,"unit":""},{"name":"Dijon mustard","amount":1,"unit":"tsp"},{"name":"cayenne pepper","amount":0.25,"unit":"tsp"},{"name":"nutmeg","amount":0.25,"unit":"tsp"},{"name":"salt and white pepper","amount":1,"unit":"to taste"}]'::jsonb,
  instructions = ARRAY['Butter 4 ramekins generously. Dust with grated Parmesan, tapping out excess. Refrigerate.','Make béchamel: melt butter, whisk in flour, cook 1 minute. Gradually add milk, whisking until thick and smooth.','Remove from heat. Beat in egg yolks one at a time. Add mustard, cayenne, nutmeg, and grated Gruyère. Season.','In a clean bowl, whisk egg whites with a pinch of salt to stiff peaks.','Fold one-third of the whites into the cheese base vigorously. Fold in remaining whites gently in two additions — preserve the air.','Divide among ramekins, filling to within 1cm of the top. Run a thumb around the inside edge to help the soufflé rise straight.','Bake on a hot baking sheet at 190°C for 12–14 minutes until risen and golden but still slightly wobbly in the centre.','Serve absolutely immediately — the soufflé waits for no one.']::text[]
WHERE id = 'e7b16eed-a369-4200-9627-e8f854bd6f06';

UPDATE recipes SET
  title = 'Saffron Seafood Risotto',
  cuisine_type = 'Italian',
  description = 'A silky, golden risotto fragrant with saffron and loaded with fresh clams, mussels, and prawns. Finished with a splash of white wine and a shower of fresh parsley, this is coastal Italian cooking at its finest.',
  servings = 4,
  prep_time_minutes = 15,
  cook_time_minutes = 35,
  calories = 520,
  protein_g = 34,
  carbs_g = 58,
  fat_g = 14,
  dietary_tags = ARRAY['gluten-free']::text[],
  image_url = 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=800&q=80',
  ingredients = '[{"name":"arborio rice","amount":320,"unit":"g"},{"name":"fresh clams","amount":300,"unit":"g"},{"name":"mussels","amount":250,"unit":"g"},{"name":"king prawns","amount":200,"unit":"g"},{"name":"dry white wine","amount":150,"unit":"ml"},{"name":"fish stock","amount":1.2,"unit":"litres"},{"name":"saffron threads","amount":0.5,"unit":"g"},{"name":"shallots","amount":2,"unit":""},{"name":"garlic cloves","amount":3,"unit":""},{"name":"butter","amount":30,"unit":"g"},{"name":"parmesan","amount":40,"unit":"g"},{"name":"olive oil","amount":2,"unit":"tbsp"},{"name":"fresh parsley","amount":1,"unit":"handful"}]'::jsonb,
  instructions = ARRAY['Warm the fish stock in a saucepan and add the saffron threads. Keep at a gentle simmer.','Heat olive oil in a wide heavy pan, add shallots and garlic, cook 3 minutes until soft.','Add arborio rice and toast for 2 minutes, stirring constantly until the edges look translucent.','Pour in white wine and stir until fully absorbed.','Add warm saffron stock one ladle at a time, stirring constantly and waiting until each addition is absorbed — about 20 minutes total.','Add clams, mussels, and prawns in the final 5 minutes, covering briefly until shells open and prawns are pink.','Remove from heat, stir in butter and parmesan, season with salt and white pepper.','Rest 2 minutes, scatter parsley, and serve immediately.']::text[]
WHERE id = '9dc33798-aeb6-4860-b3e2-136d7b236c2b';
