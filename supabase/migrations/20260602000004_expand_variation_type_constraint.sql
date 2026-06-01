-- Expand variation_type to include component variation types
-- Original constraint only allowed dietary values (vegetarian, vegan, etc.)
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_variation_type_check;
ALTER TABLE recipes ADD CONSTRAINT recipes_variation_type_check
  CHECK (variation_type = ANY (ARRAY[
    'vegetarian','vegan','gluten-free','dairy-free','halal','kosher','nut-free','low-carb','keto',
    'profile_swap','dietary','regional','twist'
  ]));
