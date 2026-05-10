/**
 * fix_dish_types.mjs
 *
 * Classifies all premium recipes into food categories using keyword matching.
 * No API needed — runs instantly and for free.
 *
 * Usage:
 *   node fix_dish_types.mjs
 *   node fix_dish_types.mjs --dry-run
 *   node fix_dish_types.mjs --limit 100
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oruplzhfmtehsjbnsoms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT   = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Keyword rules — checked in order, first match wins
const RULES = [
  // Ice cream / frozen — before dessert
  { type: 'ice cream',   keywords: ['ice cream', 'gelato', 'sorbet', 'frozen yogurt', 'nice cream'] },

  // Drinks — before smoothie
  { type: 'drink',       keywords: ['juice', 'lemonade', 'cocktail', 'mocktail', ' tea', 'matcha latte', 'hot choc', 'golden milk'] },
  { type: 'smoothie',    keywords: ['smoothie'] },

  // Baked goods — specific before generic baking
  { type: 'cake',        keywords: ['cake', 'cheesecake', 'cupcake', 'bundt', 'loaf cake', 'coffee cake', 'crumb cake'] },
  { type: 'cookies',     keywords: ['cookie', 'cookies', 'biscuit', 'shortbread', 'linzer', 'snickerdoodle', 'brownie'] },
  { type: 'bread',       keywords: ['bread', 'focaccia', 'sourdough', 'bagel', 'flatbread', 'naan', 'pita', 'pitta', 'msemmen', 'schiacciata', 'baguette', 'rolls', 'challah', 'ciabatta', 'pretzel'] },
  { type: 'baking',      keywords: ['muffin', 'scone', 'croissant', 'danish', 'cinnamon roll', 'babka', 'strudel', 'pastry', 'tart', 'pie', 'galette', 'crumble bar', 'slice', 'baked oat', 'oat cake', 'oat bar', 'protein bar', 'granola bar'] },

  // Desserts
  { type: 'dessert',     keywords: ['dessert', 'pudding', 'mousse', 'panna cotta', 'tiramisu', 'fudge', 'truffle', 'praline', 'halva', 'cannoli', 'eclair', 'profiterole', 'mochi', 'crumble', 'cobbler', 'parfait', 'trifle', 'raffaello', 'bounty', 'reese', 'snickers', 'ferrero', 'caramel slice', 'popcorn caramel', 'bliss ball', 'energy ball', 'protein ball', 'no-bake', 'raw cake'] },

  // Breakfast
  { type: 'breakfast',   keywords: ['pancake', 'waffle', 'french toast', 'scramble', 'frittata', 'omelet', 'omelette', 'oats', 'porridge', 'granola', 'muesli', 'bircher', 'chia pudding', 'overnight oat', 'baked oat', 'egg muffin', 'breakfast', 'shakshuka', 'acai bowl'] },

  // Snacks
  { type: 'snack',       keywords: ['snack', 'popcorn', 'chip', 'cracker', 'nachos', 'nacho', 'energy bite', 'protein bite', 'bliss bite', '3-step', '3 ingredient', '2 ingredient', 'onion ring'] },

  // Dips & sauces
  { type: 'dip',         keywords: ['hummus', 'guacamole', 'tzatziki', 'baba ganoush', 'muhammara', 'mutabal', 'toum', 'salsa', 'dip', 'spread', 'butter bean dip'] },
  { type: 'sauce',       keywords: ['sauce', 'gravy', 'pesto', 'marinara', 'aioli', 'mayo', 'mayonnaise', 'dressing', 'vinaigrette', 'chimichurri', 'romesco', 'harissa'] },

  // Pasta — before main course
  { type: 'pasta',       keywords: ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'tagliatelle', 'rigatoni', 'carbonara', 'bolognese', 'lasagne', 'lasagna', 'mac and cheese', 'mac n cheese', 'mac & cheese', 'alfredo', 'arrabiata', 'amatriciana', 'cacio', 'gnocchi', 'orzo', 'orzotto', 'risoni'] },

  // Noodles
  { type: 'noodles',     keywords: ['noodle', 'ramen', 'udon', 'soba', 'pad thai', 'lo mein', 'chow mein', 'glass noodle', 'rice noodle', 'vermicelli', 'stir fry noodle'] },

  // Rice
  { type: 'rice',        keywords: ['rice', 'risotto', 'pilaf', 'fried rice', 'jollof', 'congee', 'onigiri', 'arancini', 'bibimbap', 'arroz'] },

  // Soup
  { type: 'soup',        keywords: ['soup', 'broth', 'chowder', 'bisque', 'gazpacho', 'ramen', 'pho', 'minestrone', 'bouillabaisse', 'clam chowder', 'tom yum', 'miso soup'] },

  // Salad
  { type: 'salad',       keywords: ['salad', 'slaw', 'coleslaw', 'tabbouleh', 'fattoush', 'niçoise', 'caprese', 'panzanella', 'shirazi'] },

  // Bowl
  { type: 'bowl',        keywords: ['bowl', 'poke', 'nourish bowl', 'grain bowl', 'lunch bowl', 'buddha bowl', 'burrito bowl'] },

  // Curry
  { type: 'curry',       keywords: ['curry', 'masala', 'korma', 'tikka', 'dal', 'dhal', 'daal', 'saag', 'chana', 'aloo', 'vindaloo', 'rendang'] },

  // Pizza
  { type: 'pizza',       keywords: ['pizza', 'calzone', 'pizza bread'] },

  // Burger
  { type: 'burger',      keywords: ['burger', 'smashburger'] },

  // Sandwich & wraps
  { type: 'sandwich',    keywords: ['sandwich', 'sub', 'hoagie', 'panini', 'club sandwich', 'grilled cheese', 'toast', 'open-face', 'bruschetta', 'tartine', 'pitta sandwich', 'pittas'] },
  { type: 'wrap',        keywords: ['wrap', 'burrito', 'gyro', 'shawarma', 'falafel wrap', 'taquito'] },

  // Tacos
  { type: 'tacos',       keywords: ['taco', 'tacos', 'fajita'] },

  // Side dish
  { type: 'side dish',   keywords: ['fries', 'chips', 'roasted potato', 'smashed potato', 'mashed potato', 'potato wedge', 'onion ring', 'roasted veg', 'roasted carrot', 'stuffed mushroom', 'stuffed pepper', 'garlic bread', 'couscous salad', 'polenta'] },

  // Main course — fallback for protein-heavy dishes
  { type: 'main course', keywords: ['stew', 'casserole', 'braise', 'roast', 'schnitzel', 'katsu', 'kebab', 'kofta', 'meatball', 'fritter', 'hash', 'gratin', 'bake', 'traybake', 'tray bake', 'one pan', 'one pot', 'stuffed', 'wellington', 'pie (savoury)', 'quiche', 'frittata'] },
];

function classifyTitle(title) {
  const t = title.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(kw => t.includes(kw))) {
      return rule.type;
    }
  }
  return 'main course'; // safe fallback
}

async function run() {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, dish_types')
    .filter('dish_types', 'cs', '{"premium"}')
    .not('dish_types', 'cs', '{"hack"}')
    .not('title', 'ilike', 'instagram recipe')
    .not('title', 'ilike', 'premium recipe')
    .order('created_at', { ascending: false });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  const toProcess = (recipes ?? []).slice(0, LIMIT);
  console.log(`\n🏷️  Classifying ${toProcess.length} premium recipes into categories`);
  console.log(`${DRY_RUN ? '(DRY RUN — no changes saved)\n' : ''}`);

  // Preview distribution
  const counts = {};
  for (const r of toProcess) {
    const cat = classifyTitle(r.title);
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  console.log('  Category breakdown:');
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
    console.log(`    ${cat.padEnd(14)} ${n}`);
  });
  console.log();

  let updated = 0, failed = 0;

  for (const recipe of toProcess) {
    const category = classifyTitle(recipe.title);
    const existing = (recipe.dish_types ?? []).filter(t => t !== category);
    const newTypes = [...new Set([...existing, category])];

    if (!DRY_RUN) {
      const { error: updateErr } = await supabase
        .from('recipes')
        .update({ dish_types: newTypes })
        .eq('id', recipe.id);
      if (updateErr) { failed++; continue; }
    }
    updated++;
  }

  console.log(`✅ Categorised: ${updated}`);
  if (failed) console.log(`❌ Failed:      ${failed}`);
  if (DRY_RUN) console.log('(dry run — no changes saved)');
}

run().catch(err => { console.error('\n💥 Fatal:', err); process.exit(1); });
