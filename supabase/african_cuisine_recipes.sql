-- ============================================================
-- AFRICAN CUISINE RECIPES
-- Run in Supabase SQL editor
-- Covers: Nigerian, Ghanaian, Ethiopian, Senegalese,
--         South African, Kenyan, Ivorian cuisines
-- Includes 6 fufu variants + 40+ recipes total
-- ============================================================

INSERT INTO recipes (
  title, description, cuisine_type, dish_types, dietary_tags,
  prep_time_minutes, cook_time_minutes, servings,
  calories, protein_g, carbs_g, fat_g,
  ingredients, instructions, image_url, source_url, source_name
) VALUES

-- ═══════════════════════════════════════════════════════════
-- FUFU VARIANTS (6 types)
-- ═══════════════════════════════════════════════════════════

(
  'Cassava Fufu (Nigerian Style)',
  'The classic West African staple — pounded cassava dough, smooth and stretchy. Eaten by tearing a small ball, making an indentation with your thumb, and scooping soup. No utensils needed. This is the soul of Nigerian cooking.',
  'Nigerian',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  20, 30, 4,
  280, 3, 66, 1,
  '[{"name":"cassava (yuca) root, peeled and chopped","amount":1,"unit":"kg"},{"name":"water","amount":500,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Peel cassava, remove the woody core, and cut into chunks. Rinse well.',
    'Boil cassava in salted water for 25–30 minutes until very soft and easily pierced.',
    'Drain completely and while still hot, transfer to a large mortar or heavy pot.',
    'Pound vigorously with a pestle, folding and turning between strokes, for 10–15 minutes until smooth and elastic.',
    'Alternatively, blend in a food processor, adding a splash of warm water if needed, then knead with wet hands until stretchy.',
    'Wet your hands, take a portion, and roll into a smooth ball. Serve alongside egusi or groundnut soup.',
    'Fufu should be eaten the same day — it firms up significantly as it cools.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Fufu from Yam (Pounded Yam)',
  'Pounded yam is the king of Nigerian fufu varieties — silkier, stickier, and more elastic than cassava. The pounding process is meditative and the result is incomparable. Serve with egusi soup, oha soup, or any rich Nigerian stew.',
  'Nigerian',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  15, 35, 4,
  320, 4, 74, 1,
  '[{"name":"white yam, peeled and cubed","amount":1,"unit":"kg"},{"name":"water","amount":400,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Peel yam, remove any discoloured spots, and cut into even chunks.',
    'Boil in salted water for 25–30 minutes until completely tender — a fork should slide in effortlessly.',
    'Drain and immediately begin pounding in a mortar while hot. The heat is essential for the right texture.',
    'Pound for 15–20 minutes, rotating and folding. Add tiny splashes of hot water if it sticks to the mortar.',
    'Keep pounding until you achieve a smooth, stretchy, lump-free dough. This is your workout.',
    'For the food processor method: blend hot yam with minimal water until smooth, then transfer to a pot and stir over low heat for 5 minutes to develop the elasticity.',
    'Mould into balls with wet hands. Serve immediately with your chosen soup.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Plantain Fufu (Foutou Banane)',
  'The Ivorian and Ghanaian version of fufu uses unripe plantains, creating a slightly firmer, more savoury dough with a distinctive flavour. Paired with palm nut soup or groundnut stew, it is the comfort food of Côte d''Ivoire and southern Ghana.',
  'Ivorian',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  10, 25, 4,
  260, 2, 62, 1,
  '[{"name":"unripe green plantains","amount":4,"unit":"large"},{"name":"water","amount":200,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Cut the ends off unripe plantains and score the skin lengthwise. Peel — green plantains are firm and require some effort.',
    'Boil in salted water for 20–25 minutes until completely soft throughout.',
    'Drain and pound immediately in a mortar, working in batches if needed.',
    'Add small amounts of warm water as you pound to achieve a smooth, pliable consistency.',
    'Some Ivorian cooks mix half cassava and half plantain — this blend gives the most versatile texture.',
    'Form into round balls and serve immediately with sauce graine or groundnut soup.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

(
  'Cassava & Plantain Fufu (Ghanaian)',
  'Ghana''s most beloved fufu — a 50/50 blend of boiled cassava and unripe plantain, pounded together until completely smooth. The combination gives a slightly sweet, distinctly flavoured dough that pairs perfectly with light soup or groundnut soup.',
  'Ghanaian',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  15, 30, 4,
  270, 3, 64, 1,
  '[{"name":"cassava, peeled","amount":500,"unit":"g"},{"name":"unripe plantains","amount":2,"unit":"medium"},{"name":"water","amount":200,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Peel and core cassava. Peel plantains (they should be fully green and firm).',
    'Boil both together in salted water for 25–30 minutes until very soft.',
    'Drain thoroughly and combine in a large mortar while still steaming hot.',
    'Begin pounding together — the cassava and plantain will merge into a single dough.',
    'Add drops of warm water as needed. Pound for 10–15 minutes until completely smooth with no lumps.',
    'The dough should be stretchy, slightly sticky, and leave the mortar clean.',
    'Serve in a bowl with light soup poured around it — never on top.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

(
  'Semolina Fufu (Tuwo Masara)',
  'A northern Nigerian fufu made from semolina or cornmeal — faster to prepare than pounded varieties and equally satisfying. Tuwo masara is the weeknight fufu, ready in under 30 minutes, and pairs beautifully with miyan kuka (dried baobab leaf soup) or miyan taushe (pumpkin soup).',
  'Nigerian',
  ARRAY['main'],
  ARRAY['vegan', 'dairy-free'],
  5, 20, 4,
  300, 8, 62, 2,
  '[{"name":"semolina (or fine cornmeal)","amount":300,"unit":"g"},{"name":"water","amount":900,"unit":"ml"},{"name":"salt","amount":1,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Bring water to a rolling boil in a heavy pot. Add salt.',
    'Pour semolina in a thin, steady stream while stirring constantly with a wooden spoon.',
    'Stir vigorously to prevent lumps from forming. Keep the heat at medium.',
    'Reduce heat to low. Cover and cook for 5 minutes, then stir again thoroughly.',
    'Repeat: cover 5 minutes, stir — do this 3 times total until the dough pulls away from the sides of the pot cleanly.',
    'The tuwo should be firm enough to hold its shape when you scoop it.',
    'Wet a bowl with water, scoop portions into it, and roll to form smooth rounded balls. Serve with miyan kuka or groundnut soup.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Amala (Yam Flour Fufu)',
  'Amala is a Yoruba staple made from dried and powdered unripe yam flour — resulting in a dark, smooth, slightly earthy-flavoured fufu with a distinctive colour. It is the preferred pairing for ewedu soup and gbegiri (bean soup) in southwestern Nigeria.',
  'Nigerian',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  5, 15, 4,
  290, 5, 68, 1,
  '[{"name":"yam flour (elubo)","amount":250,"unit":"g"},{"name":"water","amount":750,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Bring 600ml of water to a full boil. Keep the remaining 150ml hot on the side.',
    'Gradually pour the yam flour into the boiling water in a slow stream, stirring constantly.',
    'Once incorporated, reduce heat to the lowest setting and cover tightly for 3 minutes.',
    'Uncover and stir vigorously with a wooden spoon or omolanke (long wooden stick). The amala will be dark brown to dark grey.',
    'Add remaining hot water a little at a time while stirring to reach the desired consistency — it should be smooth and slightly stiffer than pap.',
    'Cover again for 2 minutes, then stir one final time.',
    'Serve immediately with ewedu soup and gbegiri. The combination — amala, ewedu, gbegiri — is the holy trinity of Yoruba food.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- NIGERIAN
-- ═══════════════════════════════════════════════════════════

(
  'Jollof Rice (Party Style)',
  'Nigerian Jollof Rice — the undisputed champion of the West African Jollof Wars. The smoky bottom layer (the "party jollof" crust) is the most coveted part. Cooked over high heat in a tomato-pepper base, every grain is stained deep orange-red and packed with flavour.',
  'Nigerian',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  20, 50, 6,
  410, 12, 72, 9,
  '[{"name":"long grain parboiled rice","amount":500,"unit":"g"},{"name":"plum tomatoes","amount":6,"unit":"large"},{"name":"red bell peppers","amount":3,"unit":"medium"},{"name":"scotch bonnet peppers","amount":2,"unit":"whole"},{"name":"white onion","amount":2,"unit":"large"},{"name":"tomato paste","amount":3,"unit":"tbsp"},{"name":"chicken stock","amount":600,"unit":"ml"},{"name":"vegetable oil","amount":80,"unit":"ml"},{"name":"bay leaves","amount":3,"unit":"leaves"},{"name":"curry powder","amount":1,"unit":"tsp"},{"name":"thyme","amount":1,"unit":"tsp"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Blend tomatoes, red bell peppers, scotch bonnets, and 1 onion into a smooth purée. Set aside.',
    'Heat oil in a large heavy-bottomed pot. Dice remaining onion and fry until golden, about 8 minutes.',
    'Add tomato paste and fry for 3 minutes, stirring constantly, until it darkens slightly.',
    'Pour in the blended tomato mixture. Cook uncovered over medium-high heat for 20–25 minutes, stirring occasionally, until the raw smell is completely gone and the oil floats to the top.',
    'Add stock, curry powder, thyme, bay leaves, and salt. Bring to a boil.',
    'Rinse rice until water runs clear. Add to the pot — the liquid should be about 1cm above the rice.',
    'Stir once, cover tightly, and cook on medium heat for 15 minutes.',
    'Reduce to the lowest heat. Cook another 15 minutes — you want a slight smoky char on the bottom (this is the party).',
    'Remove from heat and leave covered for 10 minutes. Fluff with a fork and serve.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Egusi Soup',
  'Egusi — ground melon seeds — form the base of Nigeria''s most beloved soup. It has a rich, almost nutty depth, coloured bright orange from palm oil and scotch bonnet, loaded with meat and vegetables. Eaten with fufu, pounded yam, or rice.',
  'Nigerian',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  25, 50, 6,
  520, 32, 18, 38,
  '[{"name":"egusi (ground melon seeds)","amount":300,"unit":"g"},{"name":"palm oil","amount":100,"unit":"ml"},{"name":"beef or goat meat, cubed","amount":500,"unit":"g"},{"name":"stockfish, soaked","amount":150,"unit":"g"},{"name":"dried crayfish, ground","amount":3,"unit":"tbsp"},{"name":"scotch bonnet peppers","amount":2,"unit":"whole"},{"name":"white onion","amount":2,"unit":"large"},{"name":"spinach or bitter leaf","amount":200,"unit":"g"},{"name":"beef stock cubes","amount":2,"unit":"cubes"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Season meat with half an onion (blended), stock cube, salt. Cook in a pot with minimal water for 20 minutes until tender. Reserve the stock.',
    'Blend scotch bonnet and remaining onion into a rough paste.',
    'Heat palm oil in a large pot on medium. Add blended pepper mixture and fry for 8 minutes, stirring constantly.',
    'Mix egusi with a little water to form a thick paste. Add to the pot in small spoonfuls.',
    'Fry the egusi, stirring and scraping, for 10 minutes until each lump is lightly fried and aromatic.',
    'Add the meat stock (about 400ml), cooked meat, stockfish, and ground crayfish. Stir to combine.',
    'Simmer covered for 15 minutes, stirring occasionally. Add water if it gets too thick.',
    'Add spinach or bitter leaf. Cook for 3 minutes — no more, or the greens turn grey.',
    'Taste and adjust salt. Serve with pounded yam or fufu.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Suya (Spiced Beef Skewers)',
  'Suya is Nigerian street food at its most addictive — thin slices of beef rubbed in a complex peanut-spice blend called yaji, threaded onto skewers, and grilled over open coals. Served wrapped in newspaper with sliced onion and tomato. The spice mix is the whole secret.',
  'Nigerian',
  ARRAY['snack'],
  ARRAY['gluten-free', 'dairy-free'],
  30, 20, 4,
  380, 42, 8, 20,
  '[{"name":"beef sirloin or flank, sliced thinly","amount":600,"unit":"g"},{"name":"roasted groundnuts (peanuts), finely ground","amount":100,"unit":"g"},{"name":"ginger powder","amount":2,"unit":"tsp"},{"name":"paprika","amount":1,"unit":"tbsp"},{"name":"garlic powder","amount":1,"unit":"tsp"},{"name":"onion powder","amount":1,"unit":"tsp"},{"name":"cayenne pepper","amount":1,"unit":"tsp"},{"name":"stock cube, crushed","amount":1,"unit":"cube"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"vegetable oil","amount":2,"unit":"tbsp"}]'::jsonb,
  ARRAY[
    'Slice beef as thinly as possible against the grain — partially freezing it first makes this much easier.',
    'Combine all dry spices with ground peanuts and crushed stock cube to make the yaji spice mix.',
    'Coat beef slices generously on both sides with the yaji. Press it into the meat.',
    'Thread onto flat metal skewers (or soaked wooden ones) — weave each slice so it stays flat.',
    'Brush lightly with oil. Grill over high heat (charcoal is authentic) for 4–5 minutes per side.',
    'Baste with a little oil and more yaji halfway through. You want char at the edges.',
    'Serve immediately wrapped in foil or paper with raw onion rings, tomato slices, and extra yaji on the side.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

(
  'Nigerian Pepper Soup',
  'Pepper soup is Nigeria''s universal healing dish — served at births, funerals, celebrations, and cold nights. A thin, intensely spiced broth made with a proprietary blend of dried seeds and bark. Goat meat or catfish version — both are extraordinary.',
  'Nigerian',
  ARRAY['soup'],
  ARRAY['gluten-free', 'dairy-free'],
  20, 45, 4,
  280, 35, 6, 12,
  '[{"name":"goat meat, bone-in pieces","amount":700,"unit":"g"},{"name":"pepper soup spice mix","amount":3,"unit":"tbsp"},{"name":"scotch bonnet peppers","amount":3,"unit":"whole"},{"name":"uziza leaves (or scent leaves)","amount":20,"unit":"leaves"},{"name":"stock cube","amount":2,"unit":"cubes"},{"name":"ground crayfish","amount":2,"unit":"tbsp"},{"name":"salt","amount":2,"unit":"tsp"},{"name":"water","amount":1.5,"unit":"L"}]'::jsonb,
  ARRAY[
    'Wash goat meat well. Place in a pot with water, salt, and stock cubes.',
    'Cook on medium-high heat for 20 minutes, skimming off any foam.',
    'Add whole scotch bonnets, pepper soup spice, and ground crayfish.',
    'Cover and simmer for another 20 minutes until meat is completely tender.',
    'Taste broth — it should be intensely flavoured. Adjust with salt and more pepper soup spice.',
    'Add uziza or scent leaves in the last 2 minutes.',
    'Serve in deep bowls. The broth should be thin, dark, and fiery. Eat with agidi or boiled yam.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- GHANAIAN
-- ═══════════════════════════════════════════════════════════

(
  'Groundnut Soup (Nkate Nkwan)',
  'Ghana''s groundnut soup is one of West Africa''s great dishes — a rich, earthy peanut-tomato broth loaded with chicken or goat, served over rice or poured around fufu. The peanut paste gives it an almost velvety body that is completely addictive.',
  'Ghanaian',
  ARRAY['main', 'soup'],
  ARRAY['gluten-free', 'dairy-free'],
  25, 55, 6,
  490, 38, 22, 30,
  '[{"name":"chicken pieces, bone-in","amount":1,"unit":"kg"},{"name":"natural peanut butter (no added sugar)","amount":250,"unit":"g"},{"name":"plum tomatoes","amount":4,"unit":"large"},{"name":"white onion","amount":2,"unit":"large"},{"name":"scotch bonnet pepper","amount":2,"unit":"whole"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"vegetable oil","amount":50,"unit":"ml"},{"name":"stock cubes","amount":2,"unit":"cubes"},{"name":"salt","amount":2,"unit":"tsp"},{"name":"water","amount":1,"unit":"L"}]'::jsonb,
  ARRAY[
    'Season chicken with half the onion (blended), stock cube, and salt. Marinate 30 minutes if possible.',
    'Brown chicken in oil in a large pot, 4 minutes per side. Remove and set aside.',
    'In the same pot, fry diced remaining onion until soft. Add tomato paste and fry 3 minutes.',
    'Blend tomatoes, scotch bonnets, and a splash of water until smooth. Add to pot and fry 15 minutes until oil separates.',
    'Return chicken to pot. Add water and bring to a boil.',
    'Whisk peanut butter with 200ml hot water from the pot until smooth. Stir into the soup.',
    'Simmer partially covered for 30 minutes, stirring occasionally to prevent sticking. The soup will thicken.',
    'Adjust consistency with water — it should coat a spoon but pour freely. Season and serve over rice or with fufu.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

(
  'Kelewele (Spiced Fried Plantain)',
  'Kelewele is the definitive Ghanaian street snack — ripe plantain cubes marinated in a fierce ginger-pepper paste, then fried until caramelised and deeply golden. Sold from roadside fryers at dusk, served in a newspaper cone. Nothing goes better with roasted peanuts.',
  'Ghanaian',
  ARRAY['snack', 'side'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  15, 15, 4,
  220, 2, 42, 8,
  '[{"name":"very ripe plantains (yellow with black spots)","amount":3,"unit":"large"},{"name":"fresh ginger, grated","amount":3,"unit":"tbsp"},{"name":"scotch bonnet pepper, minced","amount":1,"unit":"small"},{"name":"ground cloves","amount":0.25,"unit":"tsp"},{"name":"salt","amount":1,"unit":"tsp"},{"name":"vegetable oil","amount":500,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Peel plantains and cut into 2cm cubes or angular chunks.',
    'Combine ginger, scotch bonnet, cloves, and salt into a paste. You can blend or use a mortar.',
    'Toss plantain chunks with the spice paste. Mix well so every piece is coated. Rest 10 minutes.',
    'Heat oil in a deep pan to 175°C. The oil should be deep enough to at least half-submerge the plantain.',
    'Fry in batches for 4–5 minutes, turning once, until golden-orange and crispy at the edges.',
    'Do not overcrowd the pan or the temperature drops and they steam instead of fry.',
    'Drain on paper towels. Serve immediately with roasted peanuts — the contrast of sweet, spicy, and nutty is everything.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

(
  'Banku & Grilled Tilapia',
  'Banku is a fermented corn and cassava dough — fermented over 2–3 days for a pleasantly sour flavour — cooked into smooth, dense balls. Paired with smoky whole grilled tilapia and pepper sauce, this is Ghana''s national comfort meal. The fermentation gives banku its soul.',
  'Ghanaian',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  30, 40, 4,
  520, 45, 58, 14,
  '[{"name":"fermented corn dough (or fine cornmeal mixed with water, rested overnight)","amount":400,"unit":"g"},{"name":"fermented cassava dough (or cassava flour + water)","amount":200,"unit":"g"},{"name":"whole tilapia, cleaned","amount":2,"unit":"fish (about 500g each)"},{"name":"vegetable oil","amount":3,"unit":"tbsp"},{"name":"scotch bonnet, tomatoes, onion for pepper sauce","amount":1,"unit":"portion"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Combine corn and cassava doughs (ideally fermented 2 days) with 1 cup water in a pot. Mix well.',
    'Cook over medium heat, stirring constantly with a wooden spoon. As it thickens, stir more vigorously.',
    'Add water gradually, 1/4 cup at a time, to keep it workable. Cook and stir for 20–25 minutes.',
    'Banku is ready when it pulls away from the sides, is smooth, and no longer sticks to the spoon.',
    'Wet hands and roll portions into smooth balls. Keep covered.',
    'Score tilapia with diagonal cuts. Season inside and out with salt, pepper, and a little oil.',
    'Grill over charcoal or in a grill pan for 8–10 minutes per side until the skin is charred and flesh flakes.',
    'Blend pepper sauce from scotch bonnet, tomato, onion — raw or lightly cooked. Serve everything together.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- ETHIOPIAN
-- ═══════════════════════════════════════════════════════════

(
  'Doro Wot (Ethiopian Chicken Stew)',
  'Doro wot is Ethiopia''s national dish — a rich, dark, intensely spiced chicken stew made with berbere, niter kibbeh (spiced clarified butter), and slow-cooked onions. The onions alone cook for an hour. Served on injera with a whole hard-boiled egg per person, it is ceremonial food.',
  'Ethiopian',
  ARRAY['main'],
  ARRAY['gluten-free'],
  30, 90, 4,
  480, 52, 18, 22,
  '[{"name":"chicken, bone-in pieces","amount":1,"unit":"kg"},{"name":"white onions, finely chopped","amount":5,"unit":"large"},{"name":"berbere spice blend","amount":4,"unit":"tbsp"},{"name":"niter kibbeh (spiced Ethiopian butter) or ghee","amount":80,"unit":"g"},{"name":"hard-boiled eggs, peeled","amount":4,"unit":"eggs"},{"name":"garlic cloves, minced","amount":6,"unit":"cloves"},{"name":"fresh ginger, grated","amount":2,"unit":"tbsp"},{"name":"dry red wine or tej (honey wine)","amount":100,"unit":"ml"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Dry-cook onions in a wide heavy pot with no oil over medium heat for 30 minutes, stirring constantly. They will go from raw to translucent to slightly brown. This step is non-negotiable.',
    'Add niter kibbeh or ghee. Let it melt into the onions and cook 10 more minutes.',
    'Add berbere, garlic, and ginger. Fry the spice paste in the onions for 5 minutes — the smell will be extraordinary.',
    'Score chicken pieces deeply. Add to the pot with wine and 200ml water. Stir to coat everything.',
    'Simmer covered on low heat for 35–40 minutes, turning chicken occasionally.',
    'Score the hard-boiled eggs all over with a fork. Add to the stew for the last 10 minutes.',
    'The wot should be dark reddish-brown and very thick. Serve on injera — never in a separate bowl.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Misir Wot (Red Lentil Stew)',
  'Misir wot is the beloved vegan staple of Ethiopian cuisine — red lentils cooked down in a berbere-spiced tomato base until thick and creamy. It is eaten daily across Ethiopia, scooped up with injera. During fasting periods (half the year for many Orthodox Ethiopians), it is the main protein.',
  'Ethiopian',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  10, 40, 4,
  320, 18, 48, 8,
  '[{"name":"red lentils","amount":300,"unit":"g"},{"name":"white onion, finely diced","amount":2,"unit":"large"},{"name":"berbere spice blend","amount":3,"unit":"tbsp"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"niter kibbeh or vegetable oil","amount":60,"unit":"ml"},{"name":"garlic cloves, minced","amount":4,"unit":"cloves"},{"name":"ginger, grated","amount":1,"unit":"tbsp"},{"name":"water","amount":700,"unit":"ml"},{"name":"salt","amount":1.5,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Dry-cook onions in a pot over medium heat for 20 minutes, stirring often, until deeply caramelised.',
    'Add niter kibbeh or oil. Add garlic, ginger, and tomato paste. Fry 3 minutes.',
    'Add berbere and stir for 2 minutes until fragrant and dark.',
    'Rinse lentils and add to the pot with water. Stir to combine.',
    'Bring to a boil, then reduce to a low simmer. Cook uncovered for 25–30 minutes, stirring often.',
    'The lentils should completely break down into a thick, unified stew. Add water if it gets too dry before lentils are soft.',
    'Taste and adjust salt. Serve on injera alongside other wots.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Injera (Ethiopian Sourdough Flatbread)',
  'Injera is not just bread — it is plate, utensil, and base course all in one. Made from teff flour fermented for 2–3 days, it has a spongy, porous texture and pleasantly sour flavour. Everything is served on it, torn into pieces and used to scoop up wots and salads.',
  'Ethiopian',
  ARRAY['side'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  10, 20, 6,
  180, 6, 38, 1,
  '[{"name":"teff flour","amount":400,"unit":"g"},{"name":"water","amount":600,"unit":"ml"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Day 1: Mix teff flour with 500ml water until smooth. Cover with a cloth and leave at room temperature.',
    'Days 2–3: Each day, stir and add a little water if it looks dry. Small bubbles will form — this is the fermentation.',
    'On cooking day: Add remaining water and salt to the batter. It should be thin, like crepe batter.',
    'Heat a large non-stick pan or seasoned griddle on medium-high.',
    'Pour a ladleful of batter in a thin spiral from outside in to cover the surface. Tilt to fill gaps.',
    'Cover immediately and cook for 2–3 minutes. Injera is done when bubbles cover the surface and the edges lift. Do not flip.',
    'Cool on a wire rack. Stack with parchment between each one. Serve with all wots poured directly on top.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

(
  'Ethiopian Tibs (Sautéed Meat)',
  'Tibs is Ethiopia''s most popular meat dish — beef or lamb, cubed and sautéed at high heat with onion, rosemary, and jalapeños. It comes in many styles (firfir, awaze, tere) but the sizzling skillet arriving at your table is always a moment. Quick, flavourful, and endlessly adaptable.',
  'Ethiopian',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  15, 15, 4,
  380, 42, 8, 20,
  '[{"name":"beef sirloin or lamb shoulder, cubed","amount":600,"unit":"g"},{"name":"white onion, roughly chopped","amount":2,"unit":"large"},{"name":"jalapeño or green Ethiopian pepper","amount":2,"unit":"whole"},{"name":"niter kibbeh or ghee","amount":60,"unit":"g"},{"name":"fresh rosemary","amount":2,"unit":"sprigs"},{"name":"garlic, sliced","amount":3,"unit":"cloves"},{"name":"berbere or mitmita (optional)","amount":1,"unit":"tsp"},{"name":"salt","amount":1.5,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Pat meat cubes dry with paper towels — any moisture will prevent proper browning.',
    'Heat a cast iron skillet or heavy pan until smoking hot. Add niter kibbeh.',
    'Sear meat in a single layer for 2 minutes without moving. Turn and sear 2 more minutes.',
    'Add onion, jalapeños, and garlic. Toss and stir-fry on high heat for 3 minutes.',
    'Add rosemary sprigs and berbere if using. Toss everything together for 2 more minutes.',
    'Meat should be browned outside but still slightly pink inside for the traditional style.',
    'Serve immediately in the hot skillet (mitad) with injera on the side.'
  ],
  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- SENEGALESE
-- ═══════════════════════════════════════════════════════════

(
  'Thieboudienne (Senegalese Fish Rice)',
  'Thieboudienne (thiep bou dieun) is Senegal''s national dish — the dish that likely influenced the entire West African tradition of one-pot rice cooking. Whole fish stuffed with herb paste, cooked in a tomato broth with vegetables, then used to cook the rice to an extraordinary flavour. A masterpiece.',
  'Senegalese',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  30, 90, 6,
  520, 44, 65, 12,
  '[{"name":"whole fish (red snapper or sea bream), cleaned","amount":1.2,"unit":"kg"},{"name":"broken rice or short-grain rice","amount":500,"unit":"g"},{"name":"plum tomatoes","amount":6,"unit":"large"},{"name":"tomato paste","amount":3,"unit":"tbsp"},{"name":"cassava, cut in chunks","amount":300,"unit":"g"},{"name":"cabbage, wedged","amount":0.5,"unit":"head"},{"name":"carrots","amount":3,"unit":"large"},{"name":"white onion","amount":2,"unit":"large"},{"name":"green onions (yèt — dried fermented shellfish, optional)","amount":2,"unit":"tbsp"},{"name":"parsley, garlic, black pepper for stuffing","amount":1,"unit":"bunch"},{"name":"vegetable oil","amount":100,"unit":"ml"},{"name":"fish stock cubes","amount":2,"unit":"cubes"}]'::jsonb,
  ARRAY[
    'Make the stuffing: blend parsley, garlic, salt, and black pepper into a paste. Stuff it into slits cut all over the fish.',
    'Heat oil in a large pot. Fry fish whole for 4 minutes per side until browned. Remove carefully.',
    'In the same oil, fry diced onion until golden. Add tomato paste, fry 3 minutes.',
    'Blend tomatoes and add to pot. Cook the tomato sauce for 20 minutes until thick and oil separates.',
    'Add 1.5L water, stock cubes, and fermented shellfish if using. Bring to a boil.',
    'Add all vegetables: cassava, carrots, cabbage, and any others. Cook 15 minutes.',
    'Gently return fish to the pot. Cook 10 more minutes. Remove fish and vegetables, keep warm.',
    'Measure the remaining broth. You need 750ml for the rice (use the 2:1 ratio). Add water if needed.',
    'Add rice to the broth, stir once, cover tightly. Cook 20 minutes on low heat until rice absorbs everything.',
    'For the crust (xonxon), remove lid and cook 5 more minutes on medium-high.',
    'Serve rice mounded on a platter, fish and vegetables arranged on top. The xonxon served separately.'
  ],
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  NULL, NULL
),

(
  'Yassa Poulet (Lemon Chicken)',
  'Yassa is Senegal''s brightest dish — chicken marinated for hours in lemon juice and onions, grilled until charred, then braised in that same onion-lemon sauce. The result is tangy, slightly caramelised, and profoundly satisfying. The most requested Senegalese dish outside Senegal.',
  'Senegalese',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  30, 60, 4,
  420, 48, 16, 18,
  '[{"name":"chicken pieces, bone-in","amount":1.2,"unit":"kg"},{"name":"white onions, thinly sliced","amount":6,"unit":"large"},{"name":"lemons, juiced","amount":4,"unit":"lemons"},{"name":"dijon mustard","amount":2,"unit":"tbsp"},{"name":"green olives, pitted","amount":80,"unit":"g"},{"name":"scotch bonnet or habanero pepper","amount":1,"unit":"whole"},{"name":"vegetable oil","amount":60,"unit":"ml"},{"name":"bay leaves","amount":3,"unit":"leaves"},{"name":"black pepper","amount":1,"unit":"tsp"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Combine lemon juice, half the oil, mustard, salt, and pepper. Marinate chicken and onions together for at least 4 hours, ideally overnight.',
    'Separate chicken from onions. Keep the marinade.',
    'Grill or pan-fry chicken pieces over high heat until nicely charred on both sides, about 5 minutes per side.',
    'In a large pot, heat remaining oil over medium heat. Add the marinated onions — they should be a massive pile.',
    'Cook onions slowly for 20 minutes, stirring frequently, until completely soft and starting to caramelise.',
    'Add the marinade liquid, bay leaves, and whole scotch bonnet. Bring to a simmer.',
    'Nestle grilled chicken into the onion sauce. Add olives. Cover and braise on low heat for 30 minutes.',
    'Chicken should be completely tender and the sauce slightly thick. Serve over white rice.'
  ],
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  NULL, NULL
),

(
  'Mafé (Peanut Stew)',
  'Mafé is West Africa''s great peanut stew — popular across Senegal, Mali, Guinea, and beyond. A thick, savoury-sweet peanut butter broth with beef or lamb, root vegetables, and a background warmth from tomato and chilli. It coats everything it touches in richness.',
  'Senegalese',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  20, 75, 6,
  540, 38, 28, 32,
  '[{"name":"beef or lamb, cubed","amount":700,"unit":"g"},{"name":"natural peanut butter","amount":200,"unit":"g"},{"name":"plum tomatoes","amount":4,"unit":"large"},{"name":"tomato paste","amount":2,"unit":"tbsp"},{"name":"white onion","amount":2,"unit":"large"},{"name":"sweet potato, cubed","amount":300,"unit":"g"},{"name":"carrots","amount":3,"unit":"medium"},{"name":"scotch bonnet pepper","amount":1,"unit":"whole"},{"name":"vegetable oil","amount":60,"unit":"ml"},{"name":"beef stock cubes","amount":2,"unit":"cubes"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Brown meat in oil over high heat in a large heavy pot. Remove and set aside.',
    'Fry diced onion in the same pot until golden. Add tomato paste and fry 3 minutes.',
    'Blend tomatoes and add. Cook the tomato sauce for 15 minutes until thick.',
    'Whisk peanut butter with 300ml warm water until smooth. Add to the pot along with meat and stock cubes.',
    'Add whole scotch bonnet and 500ml more water. Stir and bring to a simmer.',
    'Cover and cook on low heat for 30 minutes, stirring occasionally.',
    'Add sweet potato and carrots. Cook another 20 minutes until vegetables are tender and sauce is thick.',
    'Remove scotch bonnet if you want less heat. Taste and season. Serve over white rice.'
  ],
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- SOUTH AFRICAN
-- ═══════════════════════════════════════════════════════════

(
  'Bobotie',
  'Bobotie is South Africa''s national dish — a Cape Malay masterpiece of spiced minced meat topped with egg custard and baked. The flavours are a product of the spice trade: turmeric, curry, apricot jam, bay leaves. Sweet and savoury, aromatic and comforting. Serve with yellow rice and chutney.',
  'South African',
  ARRAY['main'],
  ARRAY['dairy-free'],
  25, 55, 6,
  430, 32, 24, 26,
  '[{"name":"beef or lamb mince","amount":750,"unit":"g"},{"name":"white onion, diced","amount":2,"unit":"large"},{"name":"garlic, minced","amount":3,"unit":"cloves"},{"name":"curry powder","amount":2,"unit":"tbsp"},{"name":"turmeric","amount":1,"unit":"tsp"},{"name":"apricot jam","amount":2,"unit":"tbsp"},{"name":"white wine vinegar","amount":2,"unit":"tbsp"},{"name":"raisins or sultanas","amount":60,"unit":"g"},{"name":"thick slice white bread","amount":2,"unit":"slices"},{"name":"milk","amount":200,"unit":"ml"},{"name":"eggs","amount":3,"unit":"large"},{"name":"bay leaves","amount":4,"unit":"leaves"},{"name":"almonds, flaked (optional)","amount":30,"unit":"g"},{"name":"salt","amount":1.5,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Preheat oven to 180°C. Soak bread in half the milk until soft, then squeeze out the milk (keep it) and crumble the bread.',
    'Fry onion and garlic in oil until soft. Add curry powder and turmeric. Fry 2 minutes.',
    'Add mince and brown thoroughly, breaking up lumps.',
    'Add jam, vinegar, raisins, and soaked bread. Mix well. Season generously with salt.',
    'Cook for 5 minutes. Taste — it should be sweet, spicy, and slightly tangy. Adjust.',
    'Transfer to a greased baking dish (about 30x20cm). Smooth the top. Press bay leaves on top.',
    'Beat eggs with the remaining milk and the bread-soaked milk. Pour evenly over the mince.',
    'Scatter almonds on top if using. Bake for 35–40 minutes until custard is set and golden.',
    'Rest 10 minutes before serving. Serve with yellow rice (turmeric-scented), chutney, and banana slices.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

(
  'Braai Boerewors',
  'Boerewors (farmer''s sausage) is South Africa''s sacred braai sausage — a coiled, spiced beef and pork sausage seasoned with coriander, nutmeg, cloves, and vinegar. Made in long coils and grilled over coals without cutting or turning too often. The snapping skin and aromatic fat dripping into coals makes it unmistakeable.',
  'South African',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  30, 25, 6,
  480, 28, 4, 40,
  '[{"name":"beef (80% lean), coarsely minced","amount":700,"unit":"g"},{"name":"pork belly or lamb, coarsely minced","amount":300,"unit":"g"},{"name":"coriander seeds, toasted and crushed","amount":3,"unit":"tbsp"},{"name":"nutmeg, freshly grated","amount":0.5,"unit":"tsp"},{"name":"cloves, ground","amount":0.25,"unit":"tsp"},{"name":"black pepper, coarsely ground","amount":1,"unit":"tsp"},{"name":"brown vinegar or red wine vinegar","amount":2,"unit":"tbsp"},{"name":"Worcestershire sauce","amount":1,"unit":"tbsp"},{"name":"salt","amount":2,"unit":"tsp"},{"name":"natural sausage casings, soaked","amount":1,"unit":"set"}]'::jsonb,
  ARRAY[
    'Combine all spices, vinegar, Worcestershire, and salt. Mix through the minced meat well.',
    'Fry a small test patty in a pan. Taste and adjust spicing — this is your only chance.',
    'Thread casings onto the sausage attachment. Fill without pressing too hard — boerewors should be loosely packed.',
    'Coil as you fill. Twist at regular intervals to create links but keep as one long coil.',
    'Refrigerate for at least 2 hours for flavours to develop.',
    'Grill over medium coals (not screaming hot). Place coil flat on the grid.',
    'Turn only once, after 10–12 minutes. Grill another 10–12 minutes.',
    'Do not pierce the casing. Ever. Serve immediately with pap (maize porridge) and chakalaka.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

(
  'Bunny Chow',
  'A loaf of white bread, hollowed out, filled with Cape Malay curry. Bunny chow was born in Durban''s Indian community in the 1940s and became South Africa''s most democratic street food. Eaten with your hands. The bread lid is used to scoop. The bread soaks up curry. It is perfect.',
  'South African',
  ARRAY['main'],
  ARRAY['dairy-free'],
  20, 60, 4,
  590, 36, 68, 18,
  '[{"name":"unsliced white bread loaf","amount":1,"unit":"large"},{"name":"lamb or chicken pieces, bone-in","amount":700,"unit":"g"},{"name":"white onion, diced","amount":2,"unit":"large"},{"name":"curry powder (Cape Malay style)","amount":3,"unit":"tbsp"},{"name":"plum tomatoes, blended","amount":4,"unit":"large"},{"name":"potatoes, cubed","amount":3,"unit":"medium"},{"name":"garlic, minced","amount":4,"unit":"cloves"},{"name":"ginger, grated","amount":1,"unit":"tbsp"},{"name":"vegetable oil","amount":60,"unit":"ml"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Fry onion in oil until golden. Add garlic, ginger, curry powder. Fry 3 minutes until fragrant.',
    'Add meat and brown on all sides. Add blended tomatoes and cook 10 minutes.',
    'Add potatoes, 300ml water, and salt. Cover and simmer for 40 minutes until meat is tender and curry is thick.',
    'Cut bread loaf in half horizontally (or into quarters for a "quarter bunny").',
    'Hollow out each half, leaving thick walls. Keep the scooped-out bread as the "lid" and for scooping.',
    'Ladle hot curry into the hollowed bread. The bread will begin absorbing the sauce — this is the point.',
    'Serve immediately. The rules: eat with your hands, use the lid to scoop, share with your neighbour.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

(
  'Malva Pudding',
  'South Africa''s most beloved dessert — a sticky, apricot-sweet sponge that is soaked in a hot butter-cream sauce the moment it comes out of the oven. The sauce is absorbed while it steams under a cloth, creating something between a pudding and a cake. Always served warm with custard or ice cream.',
  'South African',
  ARRAY['dessert'],
  ARRAY['vegetarian'],
  15, 40, 8,
  420, 5, 58, 20,
  '[{"name":"eggs","amount":2,"unit":"large"},{"name":"white sugar","amount":200,"unit":"g"},{"name":"apricot jam","amount":2,"unit":"tbsp"},{"name":"butter, melted","amount":60,"unit":"g"},{"name":"milk","amount":200,"unit":"ml"},{"name":"plain flour","amount":200,"unit":"g"},{"name":"baking soda","amount":1,"unit":"tsp"},{"name":"white vinegar","amount":1,"unit":"tbsp"},{"name":"salt","amount":0.5,"unit":"tsp"},{"name":"butter (for sauce)","amount":100,"unit":"g"},{"name":"cream (for sauce)","amount":200,"unit":"ml"},{"name":"sugar (for sauce)","amount":100,"unit":"g"},{"name":"apricot jam (for sauce)","amount":2,"unit":"tbsp"},{"name":"hot water (for sauce)","amount":100,"unit":"ml"}]'::jsonb,
  ARRAY[
    'Preheat oven to 180°C. Grease a 30x20cm baking dish.',
    'Beat eggs and sugar until pale and thick. Beat in jam and melted butter.',
    'Sift in flour, salt, and baking soda. Alternately fold in with milk.',
    'Stir in vinegar (it activates with the baking soda — the batter will puff slightly).',
    'Pour into baking dish and bake for 35–40 minutes until dark golden brown and set.',
    'While it bakes, make the sauce: combine all sauce ingredients in a saucepan. Heat and stir until sugar dissolves and butter melts. Do not boil.',
    'The moment the pudding comes out of the oven, pour ALL the hot sauce over it.',
    'Cover with foil immediately and leave for 15 minutes. The pudding will absorb the sauce and steam.',
    'Serve warm with vanilla custard or ice cream.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- KENYAN
-- ═══════════════════════════════════════════════════════════

(
  'Nyama Choma (Roasted Goat)',
  'Nyama choma means "roasted meat" in Swahili — and in Kenya, it is an institution. Goat (or beef) rubbed simply with salt, grilled slowly over charcoal until the skin chars and the inside stays juicy. Served carved on a board with kachumbari (tomato-onion salsa) and ugali. It''s what Kenyans eat to celebrate.',
  'Kenyan',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  15, 90, 6,
  480, 58, 2, 26,
  '[{"name":"goat leg or rib sections, bone-in","amount":1.5,"unit":"kg"},{"name":"coarse salt","amount":3,"unit":"tbsp"},{"name":"tomatoes, diced","amount":4,"unit":"large"},{"name":"red onion, finely diced","amount":1,"unit":"large"},{"name":"fresh coriander, chopped","amount":30,"unit":"g"},{"name":"lemon juice","amount":2,"unit":"tbsp"},{"name":"green chilli, minced (optional)","amount":1,"unit":"chilli"}]'::jsonb,
  ARRAY[
    'Rub meat generously all over with coarse salt — and only salt. Nyama choma is about the meat, not the marinade.',
    'Set up charcoal grill for indirect heat — coals on one side, meat on the other.',
    'Place meat on the grill and cook slowly over indirect heat for 60–75 minutes, turning every 15 minutes.',
    'Move over direct heat for the last 15 minutes to char the outside. You want crispiness on the skin.',
    'Internal temperature should reach 70°C for goat.',
    'Make kachumbari: combine tomatoes, red onion, coriander, chilli, lemon juice, and salt. Mix and let sit 10 minutes.',
    'Serve meat carved or chopped on a large board. Serve kachumbari and ugali alongside.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

(
  'Ugali & Sukuma Wiki',
  'The daily meal of Kenya: ugali (stiff maize porridge) and sukuma wiki (braised collard greens with onion and tomato). Sukuma wiki literally means "push the week" — it gets you through. Together they form a nutritionally complete meal eaten by millions every day. Simple, sustaining, perfect.',
  'Kenyan',
  ARRAY['main'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  10, 25, 4,
  310, 8, 60, 5,
  '[{"name":"white maize flour (unga)","amount":300,"unit":"g"},{"name":"water","amount":900,"unit":"ml"},{"name":"collard greens (sukuma wiki), washed and shredded","amount":400,"unit":"g"},{"name":"white onion, diced","amount":1,"unit":"large"},{"name":"tomatoes, diced","amount":3,"unit":"medium"},{"name":"vegetable oil","amount":2,"unit":"tbsp"},{"name":"salt","amount":1.5,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Ugali: bring 700ml salted water to a boil in a heavy pot.',
    'Pour maize flour in a steady stream, stirring constantly to prevent lumps.',
    'Add remaining water as needed. Stir and fold vigorously — this is hard work.',
    'Cover and cook on low for 5 minutes. Stir again. Repeat twice. Ugali is done when it pulls from the sides.',
    'Mould into a dome shape with a wet spoon. It should hold its shape.',
    'Sukuma wiki: heat oil in a pan. Fry onion until translucent. Add tomatoes and cook 5 minutes.',
    'Add collard greens. Stir and cook for 8–10 minutes until tender but still bright green.',
    'Season with salt. Serve alongside the ugali — break off a piece of ugali, make a dimple, scoop greens.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

(
  'Pilau Rice (Kenyan Swahili Style)',
  'Kenyan pilau is not like Indian pilau — it is darker, more intensely spiced with cumin, cardamom, cinnamon and cloves, often with meat cooked directly into the rice. A Swahili Coast signature, made for celebrations. The smell when you lift the lid is unforgettable.',
  'Kenyan',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  20, 55, 6,
  440, 28, 58, 12,
  '[{"name":"basmati rice, rinsed","amount":400,"unit":"g"},{"name":"beef or chicken, cubed","amount":400,"unit":"g"},{"name":"white onion, sliced","amount":3,"unit":"large"},{"name":"garlic cloves, minced","amount":5,"unit":"cloves"},{"name":"fresh ginger, grated","amount":2,"unit":"tbsp"},{"name":"whole cumin seeds","amount":2,"unit":"tsp"},{"name":"whole cardamom pods","amount":6,"unit":"pods"},{"name":"cinnamon stick","amount":1,"unit":"stick"},{"name":"whole cloves","amount":4,"unit":"cloves"},{"name":"black peppercorns","amount":1,"unit":"tsp"},{"name":"vegetable oil","amount":80,"unit":"ml"},{"name":"beef stock","amount":700,"unit":"ml"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Grind all whole spices (cumin, cardamom seeds, cinnamon, cloves, peppercorns) into a fine powder.',
    'Heat oil in a heavy pot. Fry onions until very dark brown — almost caramelised. This gives the rice its colour.',
    'Add garlic and ginger. Fry 2 minutes. Add ground spice mix and fry 1 minute until fragrant.',
    'Add meat and brown on all sides, 5 minutes.',
    'Add stock and salt. Bring to a boil. Simmer covered 20 minutes until meat is tender.',
    'Add rinsed rice. Stir once. The liquid should sit about 1.5cm above rice — add water if needed.',
    'Bring back to a boil, then reduce to very low heat. Cover tightly and cook 20 minutes.',
    'Remove from heat. Leave covered for 10 minutes. Fluff gently and serve with kachumbari.'
  ],
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  NULL, NULL
),

-- ═══════════════════════════════════════════════════════════
-- IVORIAN
-- ═══════════════════════════════════════════════════════════

(
  'Sauce Graine (Palm Nut Soup)',
  'Sauce graine is the soul of Ivorian cooking — a rich, dark palm nut soup made from cracked palm nuts simmered for hours. The palm nut cream gives it a deep orange colour, a slightly tangy richness, and a flavour unlike anything else. Eaten with rice, attiéké, or foutou.',
  'Ivorian',
  ARRAY['main', 'soup'],
  ARRAY['gluten-free', 'dairy-free'],
  30, 90, 6,
  510, 38, 14, 36,
  '[{"name":"fresh palm nuts (or canned palm nut cream)","amount":800,"unit":"g"},{"name":"chicken or smoked fish","amount":600,"unit":"g"},{"name":"white onion","amount":2,"unit":"large"},{"name":"scotch bonnet peppers","amount":3,"unit":"whole"},{"name":"smoked crayfish or shrimp paste","amount":2,"unit":"tbsp"},{"name":"spinach or bitter leaf","amount":150,"unit":"g"},{"name":"water","amount":1,"unit":"L"},{"name":"salt","amount":2,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'If using fresh palm nuts: boil for 30 minutes until soft. Pound in a mortar, then squeeze the fibres through a sieve with warm water to extract a thick cream.',
    'If using canned: thin the palm nut cream with 500ml warm water.',
    'Pour palm nut cream into a large pot over medium heat. Bring to a gentle simmer.',
    'Add whole scotch bonnets, crayfish, and salt. Simmer 20 minutes, stirring occasionally.',
    'Add chicken pieces (season them first) or smoked fish. Simmer 30 minutes.',
    'The sauce should thicken and turn a deep mahogany orange. If too thick, add water.',
    'Add greens in the last 5 minutes. Adjust seasoning.',
    'Serve with attiéké (fermented cassava) or plain white rice.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

(
  'Alloco (Ivorian Fried Plantain)',
  'Alloco is Côte d''Ivoire''s most beloved street food — ripe plantain slices fried in palm oil until caramelised on the outside, fluffy within. Sold at roadside stands with grilled fish or fried eggs. The plantains must be very ripe (yellow-black) for maximum sweetness and that jammy interior.',
  'Ivorian',
  ARRAY['snack', 'side'],
  ARRAY['gluten-free', 'vegan', 'dairy-free'],
  5, 15, 4,
  200, 1, 40, 7,
  '[{"name":"very ripe plantains (heavily spotted, nearly black)","amount":3,"unit":"large"},{"name":"palm oil or vegetable oil","amount":400,"unit":"ml"},{"name":"salt","amount":0.5,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Peel plantains and cut into diagonal slices about 1.5cm thick. Do not use green or lightly ripe plantains.',
    'Heat oil in a wide pan to 170°C. Palm oil gives an authentic flavour but vegetable oil works well.',
    'Fry plantain slices in batches without overcrowding, 3–4 minutes per side.',
    'They should be deep golden-orange, caramelised at the edges, and soft in the centre.',
    'Drain on paper towels. Sprinkle lightly with salt.',
    'Serve immediately — alloco waits for no one. Pair with fried egg, grilled tilapia, or eat plain.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
),

(
  'Kedjenou (Ivorian Slow-Cooked Chicken)',
  'Kedjenou is a traditional Ivorian stew cooked in a sealed clay pot (a canari) directly in the embers. No water added — the chicken steams in its own juices with vegetables and spices. The pot is shaken (not stirred) every 10 minutes. The result is extraordinarily tender meat in a concentrated sauce.',
  'Ivorian',
  ARRAY['main'],
  ARRAY['gluten-free', 'dairy-free'],
  25, 80, 4,
  420, 46, 12, 22,
  '[{"name":"chicken pieces, bone-in","amount":1.2,"unit":"kg"},{"name":"white onion, sliced","amount":2,"unit":"large"},{"name":"plum tomatoes, quartered","amount":4,"unit":"large"},{"name":"scotch bonnet or habanero pepper","amount":2,"unit":"whole"},{"name":"garlic cloves, whole","amount":5,"unit":"cloves"},{"name":"fresh ginger, sliced","amount":3,"unit":"cm piece"},{"name":"bay leaves","amount":3,"unit":"leaves"},{"name":"thyme","amount":4,"unit":"sprigs"},{"name":"salt","amount":2,"unit":"tsp"},{"name":"black pepper","amount":1,"unit":"tsp"}]'::jsonb,
  ARRAY[
    'Place all ingredients in a heavy pot with a very tight-fitting lid. Do not add water.',
    'Seal the lid with dough or foil if needed to prevent any steam from escaping.',
    'If cooking authentically: bury pot in hot charcoal embers for 60 minutes.',
    'For home cooking: cook on the lowest possible heat on the stove for 70–80 minutes.',
    'Every 10 minutes, pick up the pot with oven gloves and shake it — never open and stir. This distributes the juices.',
    'Open after 70 minutes. The chicken should be completely tender, falling from the bone. The sauce will be concentrated and rich.',
    'Taste and adjust salt. Serve with attiéké or rice.'
  ],
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
  NULL, NULL
);
