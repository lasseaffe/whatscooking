-- =============================================================
-- Seed: 3 creator-style cookbooks
-- Run in Supabase SQL Editor as the postgres / service role user
-- =============================================================
-- STEP 1: Run the block below to see what user IDs exist in auth.users.
--         Pick one (your own account) and paste it into the DO $$ block.
--
--   SELECT id, email FROM auth.users LIMIT 10;
--
-- STEP 2: Replace 'YOUR-REAL-USER-UUID-HERE' with your actual user ID.
-- STEP 3: Run the full script.
-- =============================================================

DO $$
DECLARE
  -- !! Replace this with a real UUID from: SELECT id FROM auth.users LIMIT 5;
  real_uid uuid := 'YOUR-REAL-USER-UUID-HERE';

  cb1 uuid := '00000000-0000-0000-0001-000000000001';
  cb2 uuid := '00000000-0000-0000-0001-000000000002';
  cb3 uuid := '00000000-0000-0000-0001-000000000003';

  ch1 uuid := '00000000-0000-0000-0002-000000000001';
  ch2 uuid := '00000000-0000-0000-0002-000000000002';
  ch3 uuid := '00000000-0000-0000-0002-000000000003';
  ch4 uuid := '00000000-0000-0000-0002-000000000004';
  ch5 uuid := '00000000-0000-0000-0002-000000000005';
  ch6 uuid := '00000000-0000-0000-0002-000000000006';
  ch7 uuid := '00000000-0000-0000-0002-000000000007';
  ch8 uuid := '00000000-0000-0000-0002-000000000008';
  ch9 uuid := '00000000-0000-0000-0002-000000000009';
BEGIN

  -- ── Cookbooks ────────────────────────────────────────────────
  INSERT INTO cookbooks (id, user_id, title, tagline, description, slug, theme_color, title_font, price, status, created_at, updated_at)
  VALUES
    (cb1, real_uid,
     'Weeknight Wins',
     'Real food. Real fast. No stress.',
     'A collection of weeknight recipes I actually cook for my family — nothing fancy, just reliable, delicious meals you can pull off on a Tuesday after a long day.',
     'weeknight-wins', '#C8752A', 'serif', 0.00, 'published',
     now() - interval '6 weeks', now() - interval '3 days'),

    (cb2, real_uid,
     'Plant & Proud',
     'Whole food. Big flavour. Zero compromise.',
     'Every recipe here proves that plant-based cooking doesn''t mean boring. High-protein, nutrient-dense, and designed to satisfy even the most committed meat-eaters at the table.',
     'plant-and-proud', '#4A7A52', 'sans', 0.00, 'published',
     now() - interval '4 weeks', now() - interval '1 week'),

    (cb3, real_uid,
     'Fire & Smoke',
     'Patience. Heat. Perfection.',
     'Everything I''ve learned from 15 years of competition BBQ. Rubs, timing, wood selection, and the sides that make people ask for the recipe before they''ve finished eating.',
     'fire-and-smoke', '#1A1A1A', 'serif', 0.00, 'published',
     now() - interval '10 weeks', now() - interval '2 weeks')
  ON CONFLICT (id) DO NOTHING;

  -- ── Chapters ─────────────────────────────────────────────────

  -- Weeknight Wins
  INSERT INTO cookbook_chapters (id, cookbook_id, title, intro_text, position)
  VALUES
    (ch1, cb1, 'Under 30 Minutes',
     '<p>These are my <strong>emergency recipes</strong> — the ones I reach for when it''s 6pm, everyone is hungry, and I haven''t thought about dinner yet. Every single one clocks in under 30 minutes from fridge to table.</p><p>The trick? Mise en place, even for weeknights. Spend two minutes chopping before you heat the pan and suddenly everything moves fast.</p>',
     1),
    (ch2, cb1, 'One Pan Wonders',
     '<p>Less washing up, more eating. These recipes cook entirely in <strong>one pan</strong> — sheet pans, skillets, Dutch ovens — whatever minimises cleanup without cutting corners on flavour.</p><p>I developed most of these after my dishwasher broke for three weeks and I refused to order takeaway every night.</p>',
     2),
    (ch3, cb1, 'Fridge Cleaners',
     '<p>The best recipes are the ones that use up whatever''s about to go off. This chapter is built around <strong>flexible templates</strong> — swap in whatever vegetables you have, use any protein, make it yours.</p><p>Think of each recipe here as a suggestion, not a rule.</p>',
     3)
  ON CONFLICT (id) DO NOTHING;

  -- Plant & Proud
  INSERT INTO cookbook_chapters (id, cookbook_id, title, intro_text, position)
  VALUES
    (ch4, cb2, 'Morning Bowls',
     '<p>Breakfast should set the tone for the day. These bowls are <strong>nutrient-dense, high-fibre, and actually filling</strong> — no mid-morning crash, no reaching for a biscuit by 10am.</p><p>Most take under 15 minutes. A few require overnight prep — worth every minute.</p>',
     1),
    (ch5, cb2, 'Hearty Mains',
     '<p>This is where I push back against the idea that vegan food is "light." These mains are <strong>substantial, protein-forward, and built to satisfy</strong>. Lentils, tempeh, legumes, whole grains — the building blocks of food that actually holds you.</p>',
     2),
    (ch6, cb2, 'Snacks That Slap',
     '<p>I hate the word "healthy snack." It implies compromise. These snacks are just <strong>good snacks</strong> that happen to be entirely plant-based — dips, bites, handheld things that disappear at parties before anyone asks what''s in them.</p>',
     3)
  ON CONFLICT (id) DO NOTHING;

  -- Fire & Smoke
  INSERT INTO cookbook_chapters (id, cookbook_id, title, intro_text, position)
  VALUES
    (ch7, cb3, 'The Rubs & Marinades',
     '<p>Everything starts here. A great rub or marinade is the <strong>foundation of BBQ</strong> — get this wrong and no amount of technique saves you. Get it right and even a simple cut of meat becomes something people remember.</p><p>I give you my competition dry rubs and the wet marinades I use for overnight prep. The ratios are exact — adjust heat level to taste, but don''t mess with the salt balance.</p>',
     1),
    (ch8, cb3, 'Low & Slow',
     '<p>This is the heart of the cookbook. <strong>Low and slow BBQ</strong> is not a technique — it''s a philosophy. You''re not cooking against time, you''re cooking with it. The collagen breaks, the fat renders, the smoke penetrates, and the result is something that cannot be rushed.</p><p>Expect cook times of 6–14 hours. Plan accordingly. It''s worth it.</p>',
     2),
    (ch9, cb3, 'Sides Worth Making',
     '<p>The sides are not an afterthought. At any great BBQ, someone always asks about the <strong>coleslaw, the beans, the cornbread</strong>. These are the recipes that get requested — the ones that hold up next to 14-hour brisket without disappearing into the background.</p>',
     3)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- =============================================================
-- STEP 4: Add recipes to chapters.
-- First find real recipe UUIDs:
--   SELECT id, title FROM recipes ORDER BY title LIMIT 60;
--
-- Then run this block with real UUIDs filled in:
-- =============================================================

/*
INSERT INTO cookbook_recipes (id, cookbook_id, chapter_id, recipe_id, position, chef_note)
VALUES
  -- Weeknight Wins / Under 30 Minutes
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001',
   '<RECIPE_UUID_1>', 1,
   'I add a splash of fish sauce here instead of salt — totally optional but it adds a depth you can''t quite identify.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001',
   '<RECIPE_UUID_2>', 2,
   'Make double the sauce. You''ll want it on everything for the rest of the week.'),

  -- Weeknight Wins / One Pan Wonders
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002',
   '<RECIPE_UUID_3>', 1,
   'Use the heaviest pan you own — better browning, less steaming.'),

  -- Plant & Proud / Morning Bowls
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000004',
   '<RECIPE_UUID_4>', 1,
   'Soak the oats overnight if you have time. Cuts cooking time in half and improves texture.'),

  -- Plant & Proud / Hearty Mains
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000005',
   '<RECIPE_UUID_5>', 1,
   'Swap tempeh for chickpeas if you can''t find it — the texture holds up well.'),

  -- Fire & Smoke / The Rubs & Marinades
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000007',
   '<RECIPE_UUID_6>', 1,
   'Apply the rub 24 hours ahead minimum. 48 hours if you can. The dry brine effect is real.'),

  -- Fire & Smoke / Low & Slow
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000008',
   '<RECIPE_UUID_7>', 1,
   'Pull at 203°F internal, not 190°F. That extra 13 degrees is where the magic happens.');
*/

-- =============================================================
-- STEP 5 (optional): Seed reader meal photos.
-- Uncomment after step 4 — needs real recipe_ids from above.
-- =============================================================

/*
INSERT INTO cookbook_meal_photos (id, cookbook_id, recipe_id, user_id, photo_url, caption, is_featured, created_at)
VALUES
  (gen_random_uuid(),
   '00000000-0000-0000-0001-000000000001', '<RECIPE_UUID_1>',
   (SELECT id FROM auth.users LIMIT 1),
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
   'Made this on a Monday and my partner thought I''d ordered in. High praise.',
   true, now() - interval '3 weeks'),

  (gen_random_uuid(),
   '00000000-0000-0000-0001-000000000002', '<RECIPE_UUID_4>',
   (SELECT id FROM auth.users LIMIT 1),
   'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600',
   'Added some toasted pepitas on top — 10/10 would recommend.',
   true, now() - interval '2 weeks'),

  (gen_random_uuid(),
   '00000000-0000-0000-0001-000000000003', '<RECIPE_UUID_6>',
   (SELECT id FROM auth.users LIMIT 1),
   'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600',
   '14 hour cook. Zero regrets. The bark on this was unreal.',
   true, now() - interval '5 weeks');
*/
