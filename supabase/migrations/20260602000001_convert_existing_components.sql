-- Track B: Convert 11 existing DB recipes to is_component = true
-- User reviewed and approved this list (excluding Basic BBQ Sauce — replaced by fresh version)

UPDATE recipes SET is_component = true, component_type = 'sauce'
WHERE id IN (
  'd445b9c3-d4e0-5aa3-8483-5213dc0692ec', -- basic bechamel white sauce
  'ac493f2b-b343-41f7-995f-20bdceaec86b', -- Basic Marinara Sauce
  '6ed44087-526e-40ec-95aa-4934023bc84e', -- Basic Pesto
  'cb4dd264-ab28-49cd-b859-a60e71b4ef52'  -- Basic Vinaigrette (converted below to dressing)
);

-- Correct vinaigrette to dressing type
UPDATE recipes SET component_type = 'dressing'
WHERE id = 'cb4dd264-ab28-49cd-b859-a60e71b4ef52';

-- Condiments
UPDATE recipes SET is_component = true, component_type = 'condiment'
WHERE id IN (
  'b0fde837-fd1f-43f4-950a-f8626247181c', -- Aioli (Garlic Mayonnaise)
  '5ed7580d-52db-4f17-9190-871774fc0852', -- Authentic Hummus
  'cc6c2c0a-58ec-400d-9cf7-2c915dce671c'  -- Basic Guacamole
);

-- Batters / Doughs
UPDATE recipes SET is_component = true, component_type = 'batter'
WHERE id IN (
  '5eae3f3a-f617-4032-8ade-4e56597ed1c6', -- Basic Pizza Dough
  '94110218-d54f-42c6-8c64-d3072e9850a4', -- Basic Pie Crust I
  '2a9c5cdf-8d29-4f42-8219-5ebce5c5a75e'  -- Basic Crepe Batter
);
