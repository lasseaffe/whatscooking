/**
 * fix-images-smart.mjs
 *
 * Retroactive image quality pass.
 * Replaces duplicate, fallback, missing, and broken recipe images
 * by searching each recipe title on Pixabay, Wikimedia, and Unsplash.
 *
 * Usage:
 *   node scripts/fix-images-smart.mjs
 *   node scripts/fix-images-smart.mjs --dry-run
 *   node scripts/fix-images-smart.mjs --limit 100
 *   node scripts/fix-images-smart.mjs --reset
 *
 * Env vars: PIXABAY_API_KEY, UNSPLASH_ACCESS_KEY (in .env.local)
 */

import { loadEnv, makeSupabase } from './lib/supabase-env.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = path.join(__dirname, '.fix-images-smart-progress.json');
const FETCH_TIMEOUT_MS = 10_000;
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 2_000;

const env = loadEnv();
const supabase = makeSupabase(env);
const PIXABAY_KEY = env.PIXABAY_API_KEY ?? null;
const UNSPLASH_KEY = env.UNSPLASH_ACCESS_KEY ?? null;

const DRY_RUN = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

// ── Progress checkpoint ───────────────────────────────────────────────────────

function loadProgress() {
  if (RESET || !fs.existsSync(PROGRESS_FILE)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')).processed ?? []);
  } catch { return new Set(); }
}

function saveProgress(ids) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processed: [...ids], updatedAt: new Date().toISOString() }, null, 2));
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function fetchJson(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', ...headers } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
  finally { clearTimeout(timer); }
}

// ── Food keyword filter ───────────────────────────────────────────────────────

const FOOD_KW = new Set([
  'food','dish','meal','recipe','cooking','cuisine','eat','eating','plate','bowl',
  'dinner','lunch','breakfast','dessert','baked','fried','grilled','roasted','soup',
  'salad','pasta','pizza','burger','steak','chicken','beef','fish','seafood',
  'vegetable','veggie','fruit','cheese','bread','cake','cookie','pie','sauce',
  'curry','rice','noodle','sushi','ramen','taco','sandwich','omelet','egg',
  'bacon','sausage','chocolate','spice','herb','garlic','onion','tomato','chef','cook',
]);

function hasFoodKw(text) {
  const words = text.toLowerCase().split(/[\s,./\\-]+/);
  return words.some((w) => FOOD_KW.has(w));
}

// ── Source functions ──────────────────────────────────────────────────────────

async function searchPixabay(query) {
  if (!PIXABAY_KEY) return null;
  // Pixabay requires the key as a URL param (their documented API).
  // This script runs server-side only — never use this function in client-side code.
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&category=food&orientation=horizontal&per_page=5&safesearch=true`;
  const data = await fetchJson(url);
  const hit = data?.hits?.find((h) => hasFoodKw(h.tags ?? ''));
  if (!hit) return null;
  return {
    imageUrl: hit.webformatURL,
    credit: { source: 'pixabay', author: hit.user, license: 'Pixabay License', licenseUrl: 'https://pixabay.com/service/license-summary/', sourcePageUrl: hit.pageURL },
    tier: 1,
  };
}

async function searchWikimedia(query) {
  const API = 'https://commons.wikimedia.org/w/api.php';
  const data = await fetchJson(`${API}?action=query&list=search&srsearch=${encodeURIComponent(query + ' food')}&srnamespace=6&format=json&srlimit=5&origin=*`);
  for (const result of data?.query?.search ?? []) {
    const t = result.title.toLowerCase();
    if (t.match(/map|logo|flag|icon|diagram|chart|coat_of_arms|emblem/)) continue;
    if (!hasFoodKw(t) && !hasFoodKw(query)) continue;
    const data2 = await fetchJson(`${API}?action=query&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`);
    const info = Object.values(data2?.query?.pages ?? {})[0]?.imageinfo?.[0];
    if (!info?.url || info.url.match(/\.svg$|\.pdf$/i)) continue;
    const meta = info.extmetadata ?? {};
    return {
      imageUrl: info.url,
      credit: {
        source: 'wikimedia',
        author: (meta['Artist']?.value ?? 'Wikimedia contributor').replace(/<[^>]+>/g, '').trim(),
        license: meta['LicenseShortName']?.value ?? 'CC',
        licenseUrl: meta['LicenseUrl']?.value ?? 'https://creativecommons.org/licenses/',
        sourcePageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(result.title)}`,
      },
      tier: 2,
    };
  }
  return null;
}

async function searchUnsplash(query) {
  if (!UNSPLASH_KEY) return null;
  const data = await fetchJson(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' food')}&per_page=5&orientation=landscape&content_filter=high`,
    { Authorization: `Client-ID ${UNSPLASH_KEY}` }
  );
  const photo = data?.results?.find((r) => hasFoodKw(`${r.alt_description ?? ''} ${r.description ?? ''}`));
  if (!photo) return null;
  return {
    imageUrl: photo.urls.regular,
    credit: { source: 'unsplash', author: photo.user.name, license: 'Unsplash License', licenseUrl: 'https://unsplash.com/license', sourcePageUrl: photo.links.html },
    tier: 2,
  };
}

const STRIP_PREFIXES = /^(easy|quick|best|simple|classic|homemade|traditional|authentic|perfect|amazing|delicious|creamy|crispy|crunchy|fluffy|cheesy|spicy|healthy|old-fashioned|restaurant.style|copycat|one.pot|slow.cooker|instant.pot|air.fryer)\s+/i;

async function findImage(title) {
  const queries = [title];
  const stripped = title.replace(STRIP_PREFIXES, '').trim();
  const words = stripped.split(/\s+/).filter((w) => w.length > 2);
  const fallback = words.slice(-3).join(' ');
  if (fallback !== title && fallback.length > 3) queries.push(fallback);

  for (const q of queries) {
    const r = await searchPixabay(q) ?? await searchWikimedia(q) ?? await searchUnsplash(q);
    if (r) return r;
  }
  return null;
}

// ── Deduplication check ───────────────────────────────────────────────────────

async function isUrlAlreadyUsed(url, seenUrls) {
  if (seenUrls.has(url)) return true;
  const { count } = await supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('image_url', url);
  return (count ?? 0) > 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[fix-images-smart] Starting${DRY_RUN ? ' (DRY RUN)' : ''}${LIMIT < Infinity ? ` limit=${LIMIT}` : ''}`);
  if (!PIXABAY_KEY) console.warn('[fix-images-smart] PIXABAY_API_KEY not set — skipping Pixabay');
  if (!UNSPLASH_KEY) console.warn('[fix-images-smart] UNSPLASH_ACCESS_KEY not set — skipping Unsplash');

  const processed = loadProgress();
  const seenUrls = new Set();
  let fixed = 0, skipped = 0, failed = 0;

  while (fixed + skipped + failed < LIMIT) {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, image_url, image_status, image_source_credit')
      .in('image_status', ['duplicate', 'fallback', 'missing', 'broken', 'needs_manual'])
      .order('id')
      .range(0, BATCH_SIZE - 1);

    if (error) { console.error('[fix-images-smart] DB error:', error.message); break; }
    if (!recipes?.length) { console.log('[fix-images-smart] No more recipes to process.'); break; }

    for (const recipe of recipes) {
      if (fixed + skipped + failed >= LIMIT) break;
      if (processed.has(recipe.id)) { skipped++; continue; }

      const result = await findImage(recipe.title);
      processed.add(recipe.id);

      if (!result) {
        console.log(`  ✗ no image found — ${recipe.title}`);
        if (!DRY_RUN) {
          const { error: markErr } = await supabase.from('recipes').update({ image_status: 'needs_manual' }).eq('id', recipe.id);
          if (markErr) console.error(`  [DB] needs_manual update failed for ${recipe.id}: ${markErr.message}`);
        }
        failed++;
        continue;
      }

      if (await isUrlAlreadyUsed(result.imageUrl, seenUrls)) {
        console.log(`  ~ duplicate URL skipped — ${recipe.title}`);
        skipped++;
        continue;
      }

      seenUrls.add(result.imageUrl);

      if (!DRY_RUN) {
        const { error: updateErr } = await supabase.from('recipes').update({
          image_url: result.imageUrl,
          image_status: 'ok',
          image_legal_tier: result.tier,
          image_source_credit: result.credit,
        }).eq('id', recipe.id);
        if (updateErr) console.error(`  [DB] image update failed for ${recipe.id}: ${updateErr.message}`);
      }

      console.log(`  ✓ [${result.credit.source}] ${recipe.title}`);
      fixed++;
    }

    saveProgress(processed);
    console.log(`  Batch done — fixed: ${fixed}, skipped: ${skipped}, failed: ${failed}`);

    if (recipes.length < BATCH_SIZE) break;
    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }

  console.log(`\n[fix-images-smart] Complete — fixed: ${fixed}, skipped: ${skipped}, failed: ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
