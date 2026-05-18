-- tests/e2e/seed-fixture.sql
-- Run once in the Supabase SQL Editor (WC project) before running Playwright tests.

INSERT INTO recipes (id, title, source, image_url, image_urls, created_at)
VALUES (
  '00000000-0000-0000-0000-00000000e2e1',
  'E2E Test Recipe',
  'manual',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  ARRAY[
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600'
  ],
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  image_url  = EXCLUDED.image_url;
