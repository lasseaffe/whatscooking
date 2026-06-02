-- Ecosystem cross-app linking: connects What's Cooking users to their Tillr accounts
create table ecosystem_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  linked_app  text not null,       -- 'tillr'
  linked_user_id text not null,    -- user_id in the linked app's auth.users
  linked_at   timestamptz default now(),
  unique(user_id, linked_app)
);

alter table ecosystem_links enable row level security;

create policy "ecosystem_links: own rows only"
  on ecosystem_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lookup table mapping cookable ingredient slugs to growable plant names
create table ingredient_plant_map (
  ingredient_slug    text primary key,
  plant_common_names text[] not null,
  grow_weeks_min     int,
  grow_weeks_max     int,
  category           text not null
);

insert into ingredient_plant_map (ingredient_slug, plant_common_names, grow_weeks_min, grow_weeks_max, category) values
  ('basil',       array['Sweet Basil','Thai Basil','Basil','Genovese Basil'],       6,  10, 'herb'),
  ('rosemary',    array['Rosemary'],                                                 8,  12, 'herb'),
  ('thyme',       array['Thyme','Common Thyme','Lemon Thyme'],                       8,  12, 'herb'),
  ('mint',        array['Mint','Spearmint','Peppermint','Apple Mint'],               4,   8, 'herb'),
  ('chives',      array['Chives','Garlic Chives'],                                   8,  10, 'herb'),
  ('parsley',     array['Parsley','Flat Leaf Parsley','Curly Parsley'],             10,  12, 'herb'),
  ('cilantro',    array['Cilantro','Coriander'],                                     6,   8, 'herb'),
  ('dill',        array['Dill'],                                                     6,   8, 'herb'),
  ('oregano',     array['Oregano','Greek Oregano'],                                  8,  12, 'herb'),
  ('sage',        array['Sage','Common Sage'],                                      10,  14, 'herb'),
  ('tarragon',    array['Tarragon','French Tarragon'],                              10,  12, 'herb'),
  ('lavender',    array['Lavender','English Lavender'],                             12,  16, 'herb'),
  ('tomatoes',    array['Tomato','Cherry Tomato','Roma Tomato','Beefsteak Tomato','Plum Tomato'], 10, 14, 'vegetable'),
  ('lettuce',     array['Lettuce','Butterhead Lettuce','Romaine','Iceberg Lettuce'], 6,   8, 'vegetable'),
  ('spinach',     array['Spinach','Baby Spinach'],                                   5,   8, 'vegetable'),
  ('kale',        array['Kale','Curly Kale','Lacinato Kale','Tuscan Kale'],          8,  10, 'vegetable'),
  ('zucchini',    array['Zucchini','Courgette'],                                     6,  10, 'vegetable'),
  ('cucumber',    array['Cucumber','English Cucumber','Persian Cucumber'],           8,  12, 'vegetable'),
  ('peppers',     array['Bell Pepper','Sweet Pepper','Capsicum'],                   10,  14, 'vegetable'),
  ('chilli',      array['Chilli','Hot Pepper','Jalapeño','Cayenne','Chili Pepper'],10,  14, 'vegetable'),
  ('garlic',      array['Garlic','Hardneck Garlic','Softneck Garlic'],             20,  36, 'vegetable'),
  ('onion',       array['Onion','Spring Onion','Red Onion','White Onion'],         12,  20, 'vegetable'),
  ('leek',        array['Leek'],                                                    20,  28, 'vegetable'),
  ('carrot',      array['Carrot','Baby Carrot'],                                    10,  16, 'vegetable'),
  ('beetroot',    array['Beetroot','Beet'],                                          8,  12, 'vegetable'),
  ('peas',        array['Pea','Snow Pea','Sugar Snap Pea','Garden Pea'],            8,  12, 'vegetable'),
  ('beans',       array['Green Bean','Runner Bean','French Bean','Broad Bean'],     8,  12, 'vegetable'),
  ('aubergine',   array['Aubergine','Eggplant'],                                    10,  16, 'vegetable'),
  ('broccoli',    array['Broccoli','Calabrese'],                                    10,  14, 'vegetable'),
  ('cauliflower', array['Cauliflower'],                                             12,  16, 'vegetable'),
  ('cabbage',     array['Cabbage','Savoy Cabbage','Red Cabbage'],                  12,  16, 'vegetable'),
  ('sweetcorn',   array['Sweetcorn','Corn','Sweet Corn'],                           10,  14, 'vegetable'),
  ('pumpkin',     array['Pumpkin','Butternut Squash','Squash'],                    14,  20, 'vegetable'),
  ('potato',      array['Potato','New Potato','Sweet Potato'],                      12,  20, 'vegetable'),
  ('strawberries',array['Strawberry','Garden Strawberry'],                           8,  16, 'fruit'),
  ('raspberries', array['Raspberry','Autumn Raspberry'],                            52, 104, 'fruit'),
  ('blueberries', array['Blueberry','Highbush Blueberry'],                         104, 208, 'fruit'),
  ('lemon',       array['Lemon Tree','Meyer Lemon'],                               104, 260, 'fruit'),
  ('apple',       array['Apple Tree','Cox Apple','Bramley Apple'],                 156, 312, 'fruit'),
  ('courgette',   array['Courgette','Zucchini'],                                     6,  10, 'vegetable');
