-- ══════════════════════════════════════════════════════════════════
-- FIX DUPLICATES — deduplicate by title (keep oldest row per title)
-- Run this in Supabase SQL editor BEFORE adding new recipes
-- ══════════════════════════════════════════════════════════════════

-- Step 1: Remove exact-title duplicates (keep oldest created_at)
DELETE FROM recipes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY lower(trim(title))
        ORDER BY created_at ASC
      ) AS rn
    FROM recipes
  ) sub
  WHERE rn > 1
);

-- Step 2: Tag dirty sodas properly so they can be categorised in the Drinks page
UPDATE recipes
SET dish_types = array_append(dish_types, 'dirty-soda')
WHERE
  (lower(title) LIKE '%dirty%' OR source_name ILIKE '%swig%' OR source_name ILIKE '%sodalicious%' OR source_name ILIKE '%fiiz%')
  AND dish_types @> ARRAY['drink']
  AND NOT (dish_types @> ARRAY['dirty-soda']);

-- Step 3: Fix images for the remaining dirty sodas
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&q=80'
WHERE lower(title) = 'classic dirty dr pepper';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80'
WHERE lower(title) = 'raspberry coconut dirty sprite';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1529598460810-4e44f4d47b9b?w=800&q=80'
WHERE lower(title) = 'mango habanero dirty lemonade';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80'
WHERE lower(title) = 'peach green tea dirty soda';

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80'
WHERE lower(title) = 'brown sugar vanilla dirty coke';

-- Step 4: Null out any still-broken Unsplash URLs (photo ID too short)
UPDATE recipes
SET image_url = NULL
WHERE image_url LIKE 'https://images.unsplash.com/photo-%'
  AND length(regexp_replace(image_url, '.*photo-([^?]+).*', '\1')) < 10;

-- Verify: count recipes by dish_type
-- SELECT unnest(dish_types) AS dt, count(*) FROM recipes GROUP BY dt ORDER BY count DESC;
