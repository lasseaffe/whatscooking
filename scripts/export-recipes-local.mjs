/**
 * export-recipes-local.mjs
 *
 * Downloads all recipes from Supabase and saves each one as a JSON file
 * in ./recipes-local/<id>.json
 *
 * Usage (from the whatscooking directory):
 *   node scripts/export-recipes-local.mjs
 *   node scripts/export-recipes-local.mjs --premium-only
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dir, '..', 'recipes-local');

const SUPABASE_URL = 'https://oruplzhfmtehsjbnsoms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4';

const PREMIUM_ONLY = process.argv.includes('--premium-only');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let query = supabase.from('recipes').select('*').order('created_at', { ascending: false });
  if (PREMIUM_ONLY) query = query.filter('dish_types', 'cs', '{"premium"}');

  const { data: recipes, error } = await query;
  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  console.log(`\n📦 Exporting ${recipes.length} recipes to ${OUT_DIR}/\n`);

  let saved = 0;
  for (const recipe of recipes) {
    // Use URL shortcode as filename if available, otherwise UUID
    const shortcode = recipe.source_url?.match(/\/p\/([A-Za-z0-9_-]+)\//)?.[1];
    const filename = shortcode ? `${shortcode}.json` : `${recipe.id}.json`;
    fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(recipe, null, 2), 'utf-8');
    saved++;
    if (saved % 50 === 0) console.log(`  ... ${saved}/${recipes.length}`);
  }

  console.log(`\n✅ Saved ${saved} files to recipes-local/`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
