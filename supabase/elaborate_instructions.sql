-- ============================================================
-- What's Cooking — Elaborate instructions for seed recipes
-- Run AFTER seed.sql
-- ============================================================

-- Beef Bolognese
update recipes set instructions = ARRAY[
  'Bring a large, heavy-bottomed pot or Dutch oven to medium-high heat. Add the olive oil and let it shimmer. Add the pancetta and cook, stirring occasionally, until the fat renders and it turns golden and slightly crispy, about 5 minutes. The goal is flavour, not crunch.',
  'Add the finely diced onion, carrot, and celery (the soffritto). Season with a generous pinch of salt — this draws out moisture and helps them soften without browning. Cook on medium-low, stirring every few minutes, for 10–12 minutes until completely soft and translucent. Patience here pays dividends.',
  'Add the ground beef and pork. Increase heat to high and break the meat into fine crumbles with a wooden spoon. Do not stir too frequently — let it sit and develop a golden-brown crust before breaking it up. This Maillard browning is where most of the flavour comes from. Season well with salt and black pepper.',
  'Pour in the white wine. It will sizzle dramatically — scrape any browned bits (fond) from the bottom of the pot with a wooden spoon. These are pure flavour. Let the wine bubble away completely, about 5 minutes, until the pot smells of cooked wine rather than raw.',
  'Add the whole milk. This is the Bolognese secret — milk tenderises the meat and rounds out the acidity. Simmer, stirring occasionally, until the milk has completely absorbed into the meat, about 15 minutes.',
  'Stir in the tomato paste and cook, stirring, for 2–3 minutes. Add the crushed tomatoes, bay leaf, and a pinch of nutmeg. Stir to combine. Bring to a gentle simmer.',
  'Reduce heat to the lowest setting. Partially cover and cook for at least 2 hours, ideally 3–4, stirring every 30 minutes. Add a splash of water or beef stock if it looks too dry. The sauce is ready when the fat rises to the surface and the colour deepens from red to a rich auburn.',
  'Taste and adjust seasoning aggressively — Bolognese needs more salt than you think. Cook your pasta until al dente. Reserve 1 cup pasta water before draining. Toss pasta with the ragu, adding pasta water a little at a time to emulsify and create a silky sauce. Serve with finely grated Parmigiano-Reggiano.'
]
where title = 'Classic Beef Bolognese';

-- Shakshuka (from more_recipes / seed)
update recipes set instructions = ARRAY[
  'Warm the olive oil in a large, wide skillet or cast-iron pan over medium heat. Add the thinly sliced onion and a pinch of salt. Cook, stirring occasionally, for 8–10 minutes until soft and golden at the edges. Do not rush this step — well-cooked onions form the flavour base of the entire dish.',
  'Add the diced red pepper and cook for another 4–5 minutes until softened. Add the minced garlic, cumin, smoked paprika, and chilli flakes. Stir constantly for 60 seconds until the spices are fragrant and the garlic smells toasty but not burnt. Burnt garlic is bitter — watch it closely.',
  'Pour in the crushed tomatoes. Season with salt, a pinch of sugar (balances the acidity), and black pepper. Stir to incorporate the spice paste fully. Simmer on medium for 10–12 minutes, stirring occasionally, until the sauce thickens and the colour deepens. The sauce should hold its shape on a spoon.',
  'Taste the sauce and adjust — it should be bold, savoury, and slightly spicy. Make 6 wells in the sauce with the back of a spoon. Crack one egg into a small bowl first (to check for shell fragments), then gently lower into each well. Season each egg yolk with a pinch of salt.',
  'Cover the pan with a tight-fitting lid. Cook on medium-low for 5–7 minutes. Check at 5 minutes — the whites should be just set and opaque, the yolks still trembling and runny. If you prefer firm yolks, cook 2 minutes longer. Remove from heat the moment they look done — residual heat will finish them.',
  'Scatter roughly torn fresh parsley and crumbled feta (optional) directly over the pan. Serve immediately from the skillet with crusty bread or warm pita for dunking. Shakshuka waits for no one.'
]
where title = 'Shakshuka';

-- Dirty Soda base recipe (strawberry)
update recipes set instructions = ARRAY[
  'Fill a large glass (at least 16 oz) completely to the top with ice — the ice is structural. It prevents dilution, keeps the cream from sinking too fast, and provides the satisfying crunch when you finally reach the bottom.',
  'Pour the coconut cream or heavy cream slowly over the back of a spoon held at the surface of the ice. The spoon disperses the pour gently, so the cream floats in distinct ribbons rather than sinking and mixing immediately. This layering is the visual signature of a dirty soda.',
  'Add the strawberry syrup. If using store-bought, choose a flavoured simple syrup rather than a fruit juice — the syrup is sweeter, more concentrated, and holds its colour better. Pour it over the cream.',
  'Gently pour the chilled sparkling water or club soda down the inside edge of the glass. Pouring down the edge rather than directly over the ice preserves carbonation and prevents foaming. Fill to just below the rim.',
  'Add the lime juice last. The acidity cuts through the cream and brightens the entire drink. Give it one or two very gentle stirs — you want three distinct layers visible: cream on top, syrup in the middle, bubbles rising from the bottom.',
  'Garnish with a fresh lime wedge on the rim and a paper straw. Drink immediately while the carbonation is at its peak. The cream will gradually melt down and the flavours will evolve as you drink — every sip is slightly different.'
]
where title ilike '%strawberry%' and source = 'curated' and dish_types @> ARRAY['drink'];

-- Chicken Tikka Masala
update recipes set instructions = ARRAY[
  'In a large bowl, combine the yogurt with half the garam masala, the cumin, turmeric, and a generous amount of salt. Cut the chicken thighs into large chunks (about 5cm). Add to the marinade and toss to coat every surface. Cover and refrigerate for at least 2 hours, or ideally overnight — the longer, the more tender.',
  'When ready to cook, arrange the marinated chicken on a foil-lined baking sheet. Broil on high, 10–15cm from the heat source, for 12–15 minutes, turning once halfway. You want significant charring — the black spots are not burnt, they are essential flavour. Set chicken aside.',
  'Melt the butter in a large, heavy pan over medium heat. Add the finely diced onions and cook slowly for 15 minutes until they are deeply golden. Do not rush this — undercooked onions make a watery, raw-tasting sauce.',
  'Add the garlic and freshly grated ginger. Cook 2 minutes, stirring constantly. Add the remaining garam masala, cumin, coriander, and the Kashmiri chilli powder (for colour and mild heat). Stir for 60–90 seconds until the spices bloom and the mixture smells fragrant and complex.',
  'Add the crushed tomatoes. Stir everything together and simmer on medium for 15 minutes until the sauce darkens and the oil begins to separate and pool on the surface — this is called the "bhuno" stage and it means the base is properly cooked.',
  'Use a hand blender to blend the sauce smooth directly in the pan (or transfer to a blender in batches, carefully). Return to medium-low heat. Stir in the heavy cream. Taste — it should be rich, gently spiced, and a deep orange-red.',
  'Add the broiled chicken pieces. Simmer gently for 10–12 minutes so the chicken absorbs the sauce flavours. Stir in the dried fenugreek leaves (kasuri methi) by rubbing them between your palms first — this releases their aromatic oils. Taste once more and adjust salt.',
  'Serve in bowls with basmati rice and warm naan. Scatter fresh cilantro over the top. The sauce improves dramatically the next day as the flavours meld overnight.'
]
where title = 'Chicken Tikka Masala';

-- Pad Thai
update recipes set instructions = ARRAY[
  'Soak the rice noodles in warm (not boiling) water for 20–30 minutes until they are pliable and flexible but still have resistance when you bite them — they should be about 70% cooked. They will finish cooking in the wok. Drain and rinse under cold water. Toss with a little oil to prevent sticking.',
  'In a small bowl, whisk together the tamarind paste, fish sauce, brown sugar, and a tablespoon of water. Taste — it should be a complex balance of sour, salty, and sweet. Adjust to your preference. This is the soul of the dish.',
  'Prepare all your ingredients and place them within arm''s reach of the stove. Pad Thai cooks in under 3 minutes — there is no time to chop mid-cook. Have your noodles, sauce, eggs, shrimp, bean sprouts, scallions, and peanuts all ready to go.',
  'Heat a wok or large, heavy skillet over the highest heat your stove can produce for 2 minutes. Add the vegetable oil. When it shimmers and wisps of smoke appear, add the shrimp in a single layer. Cook undisturbed 90 seconds until pink and curved. Push to the side.',
  'Crack the eggs directly into the hot oil in the centre of the wok. Scramble briskly with a spatula — they should set in about 30 seconds. Break them into rough pieces and combine with the shrimp.',
  'Add the drained noodles. Pour the sauce over everything. Toss continuously using tongs or a wooden spatula, pulling noodles from the bottom. The high heat caramelises the sauce and coats every strand. Cook 2 minutes, tossing constantly.',
  'Add the bean sprouts and half the scallions. Toss for 30 more seconds — just enough to warm them without losing their crunch. Remove from heat.',
  'Divide between plates immediately. Top with crushed roasted peanuts, remaining scallions, and a wedge of lime. Serve with extra fish sauce, chilli flakes, and sugar on the side so diners can personalise their bowl.'
]
where title = 'Pad Thai';

-- Perfect Smash Burger
update recipes set instructions = ARRAY[
  'Take the ground beef (80/20 fat ratio is non-negotiable — anything leaner will be dry and flavourless) and divide into 140–150g balls. Do not season yet, do not compact — handle as little as possible. Loose balls smash more easily and create more craggy edges, which means more crust.',
  'Place your cast iron skillet or griddle over the highest heat possible. Heat for at least 3 minutes until it is genuinely smoking. This is not optional — insufficient heat means steaming instead of searing. The surface should be dry (no oil needed — the fat in the beef is enough).',
  'Place 2 beef balls in the pan at a time, spacing them well apart. Immediately place a piece of parchment paper over one ball and press down firmly and quickly with a heavy spatula, metal pan, or burger press. Apply your full body weight. The patty should be 10–12cm wide and about 5mm thin.',
  'Cook without moving for 90 seconds to 2 minutes until the edges are deeply brown and the top surface is no longer bright red — it should look grey about halfway up the patty. This is the visual cue that the underside has a proper crust.',
  'Flip once using a thin metal spatula, working the blade underneath the browned crust. Immediately lay a slice of American cheese on top. Cook 30–45 seconds — just enough to melt the cheese. American cheese melts perfectly; do not substitute.',
  'Meanwhile, slice and toast the brioche buns cut-side down in the fat remaining in the pan for 30–45 seconds until golden. This is crucial — a soggy bun ruins the whole thing.',
  'Build the burger: smear both bun halves with special sauce (or mayo + ketchup + pickle juice + garlic powder). Add lettuce to the bottom bun, then the patty, then pickles, then sliced tomato, then the top bun. Eat immediately — smash burgers do not improve with time.'
]
where title = 'The Perfect Smash Burger';

-- NY Cheesecake
update recipes set instructions = ARRAY[
  'Make the crust: combine the crushed graham crackers with melted butter and 2 tablespoons of sugar. The mixture should hold its shape when squeezed in your palm — if too dry, add a little more butter. Press firmly and evenly into the bottom of a 9-inch springform pan, using the flat bottom of a measuring cup to compact it. Bake at 325°F (165°C) for 10 minutes. Cool completely.',
  'In a large bowl, beat the room-temperature cream cheese (this is essential — cold cream cheese lumps and never fully smooths out) on medium speed for 3–4 minutes until completely smooth and fluffy. Scrape the sides and bottom of the bowl several times. Add the sugar and beat 2 more minutes.',
  'Add the eggs one at a time, beating on low speed just until each is incorporated — over-beating eggs incorporates too much air, which causes cracking. Add the sour cream, vanilla, and lemon zest. Mix on low speed until just combined. Scrape the bowl once more and mix 10 seconds.',
  'Pour the filling over the cooled crust. Tap the pan gently on the counter 5–6 times to release any air bubbles. Smooth the top with an offset spatula.',
  'Wrap the bottom and sides of the springform pan tightly in two layers of heavy-duty foil — this waterproofs it for the water bath. Place in a large roasting pan. Pour boiling water into the roasting pan until it reaches halfway up the sides of the springform. The water bath ensures the cheesecake bakes gently and evenly.',
  'Bake at 325°F (165°C) for 65–75 minutes. The edges should be set, but the centre 8–10cm should still jiggle when you shake the pan — it looks underdone but it is not. It will firm up as it cools.',
  'Turn off the oven. Prop the door open 2–3cm with a wooden spoon and leave the cheesecake inside for 1 hour. This gradual cooling prevents the dramatic temperature change that causes cracking.',
  'Remove from the water bath. Run a thin knife around the edge (this releases it from the pan and prevents cracking as it contracts). Cool to room temperature, then refrigerate uncovered for at least 6 hours, preferably overnight. Remove the springform ring to serve. The cheesecake will keep, covered, for 5 days.'
]
where title = 'New York Cheesecake';
