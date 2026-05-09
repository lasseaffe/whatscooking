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
  real_uid uuid := 'ff6f52af-df0b-4c5e-84ad-0d3eb16a2154';

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

INSERT INTO cookbook_recipes (id, cookbook_id, chapter_id, recipe_id, position, chef_note)
VALUES
  -- ── Weeknight Wins / Under 30 Minutes ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001',
   'bcee5950-aefb-4b1f-b741-1b95fa66a0a9', 1,
   'Use chili crisp from a jar if you don''t have time to make the oil — Laoganma is my go-to. These are done in 10 minutes flat.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001',
   '59bf9fdf-fe91-4533-826e-21c0cec4f23a', 2,
   'Reserve a full cup of pasta water before you drain — the starch is what makes the sauce silky. Don''t skip it.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001',
   '366ee682-35ea-47e2-841a-1ae7ae509a34', 3,
   'Swap the tofu for a fried egg on top if you want extra protein without extra prep. Either way, make double the sauce.'),

  -- ── Weeknight Wins / One Pan Wonders ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002',
   '09da10f6-4fb9-43e9-b9fa-e991946a7ee7', 1,
   'The caramelisation is everything here — don''t rush the onions. Low heat, 40 minutes minimum. The pasta practically seasons itself after that.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002',
   '64ef8f5b-67db-4e27-bc22-93c16d61b401', 2,
   'Use a block of good feta, not crumbled — it melts into a proper sauce. Cherry tomatoes from the vine have the best flavour here.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002',
   '467ee606-ccbd-4187-b28c-deafba9ae638', 3,
   'I make this every time the fridge looks bare. Throw in whatever veg needs using — courgette, peppers, spinach — it all works.'),

  -- ── Weeknight Wins / Fridge Cleaners ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003',
   'ae0f7917-02cc-4489-86e5-454f63fed0f2', 1,
   'This is my template for using up the random veg at the end of the week. Any roasted root + bitter leaves + sharp cheese = a great autumn salad.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003',
   'c213ea47-13d9-4324-a07b-b7b89939ca84', 2,
   'Make on Sunday, eat all week. Gets better as the dressing soaks in. Add whatever protein you have going spare.'),

  -- ── Plant & Proud / Morning Bowls ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000004',
   '38279576-128d-4fd5-9480-dab867c0ff76', 1,
   'Freeze your banana the night before for a thicker base. Add a tablespoon of almond butter for staying power that gets you past lunch.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000004',
   '367c3a55-80bd-4f9e-bf7b-e6f88bc28368', 2,
   'Soak the oats overnight — it cuts morning prep to literally zero. I make 5 jars on Sunday and grab one each day.'),

  -- ── Plant & Proud / Hearty Mains ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000005',
   '3db162d4-35d5-4df1-be91-61441ef88669', 1,
   'Use arborio and don''t skip the white wine — it''s what gives risotto its backbone. Finish with a generous knob of vegan butter and extra nutritional yeast.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000005',
   'b82411dc-efce-4023-ba4a-11d2bff69851', 2,
   'Bloom the spices in oil before adding anything else — 60 seconds in a hot pan transforms the whole dish. Don''t rush this step.'),

  -- ── Plant & Proud / Snacks That Slap ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000006',
   '31ced2b1-9b72-4c4f-9d48-f0ac65a2e7cf', 1,
   'Char the aubergine directly on a gas flame if you can — the smoky flavour is what separates great baba ganoush from mediocre. No gas? Max oven grill, as close to the element as possible.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000006',
   'ec1d66d3-fb47-491a-a8fb-dee5913a6fe5', 2,
   'Sounds too simple to be good. It''s not. Great for when you want something crunchy without the deep-fry. Season immediately out of the air fryer while they''re still hot.'),

  -- ── Fire & Smoke / The Rubs & Marinades ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000007',
   '3987e9fe-5a2b-439f-98cf-7fe3d5c82c66', 1,
   'The achiote marinade here is the same base I use for competition chicken. Marinate overnight minimum — the acid needs time to work through the fish. Works just as well on shrimp.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000007',
   '4af5f64f-d94e-430c-8bec-bcc03c484354', 2,
   'The salt cod technique here — the desalting process — is the same principle behind dry brining meat. Patience is the ingredient. Don''t skip the 24-hour soak.'),

  -- ── Fire & Smoke / Low & Slow ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000008',
   'b904702c-1115-4dcd-9e98-d74346266dfb', 1,
   'The 24-hour process here mirrors what I do with brisket prep. Your body knows when food has been given time. So does everyone at the table.'),

  -- ── Fire & Smoke / Sides Worth Making ──
  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000009',
   'cdd3f458-6205-45b2-863e-6ef08c8f69a2', 1,
   'I serve this alongside smoked meats instead of a thin broth — the 30-clove depth holds its own next to heavy BBQ flavours. Make it the night before and reheat slowly.'),

  (gen_random_uuid(), '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000009',
   '8d306d98-9bd7-467b-8e9f-a618ba0c1f10', 2,
   'Classic for a reason. I make mine with smoked salt and a splash of bourbon in the crumble. Serve warm with the fat from the resting brisket drizzled over. Don''t knock it.')
ON CONFLICT DO NOTHING;

-- =============================================================
-- STEP 5 (optional): Seed reader meal photos.
-- Uncomment after step 4 — needs real recipe_ids from above.
-- =============================================================

INSERT INTO cookbook_meal_photos (id, cookbook_id, recipe_id, user_id, photo_url, caption, is_featured, created_at)
VALUES
  (gen_random_uuid(),
   '00000000-0000-0000-0001-000000000001', 'bcee5950-aefb-4b1f-b741-1b95fa66a0a9',
   'ff6f52af-df0b-4c5e-84ad-0d3eb16a2154',
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
   'Made this on a Monday and my partner thought I''d ordered in. High praise.',
   true, now() - interval '3 weeks'),

  (gen_random_uuid(),
   '00000000-0000-0000-0001-000000000002', '38279576-128d-4fd5-9480-dab867c0ff76',
   'ff6f52af-df0b-4c5e-84ad-0d3eb16a2154',
   'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600',
   'Added some toasted pepitas on top — 10/10 would recommend.',
   true, now() - interval '2 weeks'),

  (gen_random_uuid(),
   '00000000-0000-0000-0001-000000000003', '3987e9fe-5a2b-439f-98cf-7fe3d5c82c66',
   'ff6f52af-df0b-4c5e-84ad-0d3eb16a2154',
   'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600',
   '14 hour cook. Zero regrets. The bark on this was unreal.',
   true, now() - interval '5 weeks')
ON CONFLICT DO NOTHING;
