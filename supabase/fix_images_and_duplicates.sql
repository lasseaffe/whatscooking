-- ══════════════════════════════════════════════════════════════════
-- FIX: Remove duplicates, fix broken images, correct mismatched photos
-- Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. REMOVE EXACT DUPLICATE TITLES (keep oldest) ──────────────
DELETE FROM recipes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY lower(trim(title)) ORDER BY created_at ASC) AS rn
    FROM recipes
  ) sub
  WHERE rn > 1
);

-- ── 2. FIX BROKEN UNSPLASH URLS (malformed short IDs) ────────────
-- Dirty sodas — proper drink/soda images
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&q=80'
WHERE title = 'Classic Dirty Dr Pepper';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80'
WHERE title = 'Raspberry Coconut Dirty Sprite';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1529598460810-4e44f4d47b9b?w=800&q=80'
WHERE title = 'Mango Habanero Dirty Lemonade';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80'
WHERE title = 'Peach Green Tea Dirty Soda';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80'
WHERE title = 'Brown Sugar Vanilla Dirty Coke';

-- ── 3. ADD DRINK RECIPES FOR BROADER DRINKS SECTION ─────────────
INSERT INTO recipes (source, source_name, source_url, title, description, image_url, cuisine_type, dish_types, dietary_tags, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg)
VALUES

-- COCKTAILS
('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1022185-negroni',
 'Classic Negroni',
 'Equal parts gin, sweet vermouth, and Campari — stirred, never shaken. The most perfect cocktail ever invented. Orange peel essential.',
 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
 'Italian', ARRAY['drink','cocktail'], ARRAY[]::text[],
 '[{"name":"gin","amount":30,"unit":"ml"},{"name":"sweet vermouth","amount":30,"unit":"ml"},{"name":"Campari","amount":30,"unit":"ml"},{"name":"orange peel","amount":1,"unit":"strip"},{"name":"ice","amount":1,"unit":"handful"}]'::jsonb,
 ARRAY['Fill a mixing glass with ice.','Add gin, vermouth, and Campari.','Stir for 30 seconds until well chilled.','Strain into a rocks glass over a large ice cube.','Express orange peel over the glass, run around the rim, drop in.'],
 3, 0, 1, 180, 0, 8, 0, 0, 6, 5),

('curated', 'Serious Eats', 'https://www.seriouseats.com/perfect-margarita-recipe',
 'Perfect Margarita',
 'Fresh lime juice, good tequila, and triple sec — no sweet-and-sour mix, no nonsense. Salt rim optional but recommended.',
 'https://images.unsplash.com/photo-1609345265499-2b5cb6b6b5f8?w=800&q=80',
 'Mexican', ARRAY['drink','cocktail'], ARRAY['vegan','dairy-free'],
 '[{"name":"blanco tequila","amount":60,"unit":"ml"},{"name":"fresh lime juice","amount":30,"unit":"ml"},{"name":"Cointreau","amount":30,"unit":"ml"},{"name":"salt","amount":1,"unit":"pinch"},{"name":"lime wedge","amount":1,"unit":"whole"},{"name":"ice","amount":1,"unit":"cup"}]'::jsonb,
 ARRAY['Run lime wedge around rim of glass; dip in salt.','Fill shaker with ice.','Add tequila, lime juice, and Cointreau.','Shake hard for 15 seconds.','Strain over fresh ice into prepared glass.'],
 5, 0, 1, 210, 0, 14, 0, 0, 10, 300),

('curated', 'Bon Appétit', 'https://www.bonappetit.com/recipe/aperol-spritz',
 'Aperol Spritz',
 'Italy''s most exported drink — Aperol, prosecco, and a splash of soda. Light, bitter-sweet, and endlessly refreshing.',
 'https://images.unsplash.com/photo-1567206563114-c179706a56k?w=800&q=80',
 'Italian', ARRAY['drink','cocktail'], ARRAY['vegan','dairy-free'],
 '[{"name":"Aperol","amount":60,"unit":"ml"},{"name":"prosecco","amount":90,"unit":"ml"},{"name":"sparkling water","amount":30,"unit":"ml"},{"name":"orange slice","amount":1,"unit":"whole"},{"name":"ice","amount":1,"unit":"cup"}]'::jsonb,
 ARRAY['Fill a large wine glass with ice.','Pour in Aperol.','Add prosecco.','Top with a splash of sparkling water.','Garnish with orange slice.'],
 2, 0, 1, 155, 0, 12, 0, 0, 8, 5),

-- MOCKTAILS
('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/virgin-mojito',
 'Virgin Mojito',
 'All the freshness of a mojito — muddled mint, lime, and fizz — without the rum. Perfect for any occasion.',
 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
 'American', ARRAY['drink','mocktail'], ARRAY['vegetarian','vegan','dairy-free'],
 '[{"name":"fresh mint leaves","amount":12,"unit":"leaves"},{"name":"lime","amount":1,"unit":"whole"},{"name":"sugar syrup","amount":2,"unit":"tbsp"},{"name":"sparkling water","amount":200,"unit":"ml"},{"name":"crushed ice","amount":1,"unit":"cup"}]'::jsonb,
 ARRAY['Muddle mint leaves with sugar syrup in a glass.','Cut lime into wedges and squeeze all juice in; add wedges.','Fill with crushed ice.','Top with sparkling water.','Stir gently and garnish with mint sprig.'],
 5, 0, 1, 95, 0, 24, 0, 0, 20, 10),

('curated', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1023000-watermelon-agua-fresca',
 'Watermelon Agua Fresca',
 'Mexico''s most refreshing summer drink — blended watermelon, lime, and a hint of mint. No alcohol, maximum satisfaction.',
 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
 'Mexican', ARRAY['drink','mocktail'], ARRAY['vegetarian','vegan','gluten-free','dairy-free'],
 '[{"name":"watermelon","amount":4,"unit":"cups cubed"},{"name":"lime juice","amount":3,"unit":"tbsp"},{"name":"sugar","amount":2,"unit":"tbsp"},{"name":"water","amount":1,"unit":"cup"},{"name":"mint","amount":6,"unit":"leaves"},{"name":"ice","amount":1,"unit":"cup"}]'::jsonb,
 ARRAY['Blend watermelon until smooth.','Strain through fine mesh sieve.','Add lime juice, sugar, and water; stir.','Taste and adjust sweetness.','Serve over ice with mint leaves.'],
 10, 0, 4, 65, 1, 16, 0, 0, 13, 5),

-- BREWED / HOT DRINKS
('curated', 'Serious Eats', 'https://www.seriouseats.com/how-to-make-cold-brew-coffee',
 'Perfect Cold Brew Coffee',
 'Coarse-ground coffee, cold water, 18 hours. The result is smooth, low-acid, and far stronger than you expect. The formula that converted a generation.',
 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
 'American', ARRAY['drink','brewed'], ARRAY['vegetarian','vegan','gluten-free','dairy-free'],
 '[{"name":"coarsely ground coffee","amount":100,"unit":"g"},{"name":"cold filtered water","amount":750,"unit":"ml"}]'::jsonb,
 ARRAY['Combine ground coffee and cold water in a large jar.','Stir to ensure all grounds are saturated.','Cover and refrigerate 18–24 hours.','Strain through a coffee filter or cheesecloth.','Dilute 1:1 with water or milk to serve. Store up to 2 weeks.'],
 5, 0, 3, 5, 1, 0, 0, 0, 0, 5),

('curated', 'Bon Appétit', 'https://www.bonappetit.com/recipe/matcha-latte',
 'Matcha Latte',
 'Ceremonial-grade matcha whisked smooth, topped with steamed oat milk. Earthy, creamy, and a gentler caffeine than coffee.',
 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800&q=80',
 'Japanese', ARRAY['drink','brewed'], ARRAY['vegetarian','vegan','gluten-free','dairy-free'],
 '[{"name":"ceremonial matcha powder","amount":2,"unit":"tsp"},{"name":"hot water","amount":60,"unit":"ml (not boiling)"},{"name":"oat milk","amount":200,"unit":"ml"},{"name":"honey","amount":1,"unit":"tsp"}]'::jsonb,
 ARRAY['Sift matcha into a bowl.','Add hot water (80°C/175°F) and whisk in a W-pattern until frothy.','Steam or heat oat milk until hot.','Pour matcha into a mug.','Gently pour oat milk over, holding back foam, then spoon foam on top.'],
 5, 3, 1, 90, 3, 12, 2, 0, 8, 80),

('curated', 'AllRecipes', 'https://www.allrecipes.com/recipe/fresh-lemonade',
 'Classic Homemade Lemonade',
 'Simple syrup, fresh-squeezed lemons, ice water. The ratio that makes it taste like summer.',
 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=800&q=80',
 'American', ARRAY['drink','mocktail'], ARRAY['vegetarian','vegan','gluten-free','dairy-free'],
 '[{"name":"lemons","amount":6,"unit":"large"},{"name":"sugar","amount":150,"unit":"g"},{"name":"water","amount":1.5,"unit":"L"},{"name":"ice","amount":2,"unit":"cups"},{"name":"mint","amount":4,"unit":"sprigs (optional)"}]'::jsonb,
 ARRAY['Make simple syrup: combine sugar and 250ml water in a pan, heat until sugar dissolves. Cool.','Juice all lemons (you need about 240ml juice).','Combine juice, syrup, and remaining cold water.','Taste and adjust sweetness/tartness.','Serve over ice with mint if desired.'],
 10, 5, 6, 120, 0, 30, 0, 0, 28, 5)

ON CONFLICT DO NOTHING;

-- ── 4. FIX OBVIOUSLY WRONG IMAGES (spot checks) ──────────────────
-- Watermelon image for watermelon recipes
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'
WHERE lower(title) LIKE '%watermelon%' AND image_url NOT LIKE '%watermelon%';

-- Lemonade images
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=800&q=80'
WHERE lower(title) LIKE '%lemonade%' AND (image_url IS NULL OR image_url NOT LIKE 'https://images.unsplash.com/photo-%');

-- Matcha images
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800&q=80'
WHERE lower(title) LIKE '%matcha%' AND (image_url IS NULL OR image_url NOT LIKE 'https://images.unsplash.com/photo-%');

-- Fix any remaining broken Unsplash URLs (too-short photo IDs are invalid)
UPDATE recipes
SET image_url = NULL
WHERE image_url LIKE 'https://images.unsplash.com/photo-%'
  AND length(substring(image_url FROM 'photo-([^?]+)')) < 10;

-- ── 5. VERIFY: show recipes with null images ──────────────────────
-- SELECT id, title, dish_types FROM recipes WHERE image_url IS NULL ORDER BY created_at DESC;
