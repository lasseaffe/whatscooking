-- Run this in Supabase SQL editor to diagnose the premium issue

-- 1. How many premium recipes exist?
SELECT count(*) AS premium_count FROM recipes WHERE dish_types @> ARRAY['premium']::text[];

-- 2. Show a sample (first 5)
SELECT id, title, source_url, dish_types, is_premium
FROM recipes
WHERE dish_types @> ARRAY['premium']::text[]
LIMIT 5;

-- 3. How many total recipes?
SELECT count(*) FROM recipes;

-- 4. Breakdown by dish_types
SELECT dish_types, count(*) FROM recipes GROUP BY dish_types ORDER BY count(*) DESC LIMIT 20;
