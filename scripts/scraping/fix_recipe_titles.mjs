/**
 * fix_recipe_titles.mjs
 *
 * Finds all recipes in Supabase with generic titles ("Instagram Recipe",
 * "Premium Recipe", etc.), re-scrapes their Instagram source_url for the
 * real caption, extracts a proper title with Llama 3.1:8B, and updates the DB.
 *
 * Usage:
 *   node scripts/scraping/fix_recipe_titles.mjs
 *   node scripts/scraping/fix_recipe_titles.mjs --headless
 *   node scripts/scraping/fix_recipe_titles.mjs --limit 50
 *   node scripts/scraping/fix_recipe_titles.mjs --dry-run
 *
 * Requires llama.cpp server running at localhost:8080.
 * Start with: llama-server -m <model.gguf> -c 4096 --host 0.0.0.0 --port 8080
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://oruplzhfmtehsjbnsoms.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4';
// llama.cpp server — context set at launch with -c flag
const LLAMA_URL     = 'http://localhost:8080/v1/chat/completions';
const AI_MODEL      = 'llama-3.1-8b'; // label only
const CAPTION_MAX_CHARS = 600;        // stay within -c 4096 context window
const DELAY_MS      = 3_000;

const HEADLESS = process.argv.includes('--headless');
const DRY_RUN  = process.argv.includes('--dry-run');
const LIMIT    = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const GENERIC_TITLES = ['instagram recipe', 'premium recipe', 'untitled recipe', 'recipe', ''];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseTitleHint(ogTitle) {
  if (!ogTitle) return null;
  const match = ogTitle.match(/["""](.{4,80})["""]/);
  if (match) return match[1].split('\n')[0].replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  return null;
}

async function scrapeUrl(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  return await page.evaluate(() => {
    const get = (s) => document.querySelector(s)?.content ?? null;
    return {
      caption:  get('meta[property="og:description"]') ?? document.querySelector('h1')?.innerText ?? null,
      ogTitle:  get('meta[property="og:title"]'),
      imageUrl: get('meta[property="og:image"]'),
    };
  });
}

async function extractTitleAndData(caption, ogTitle) {
  const titleHint = parseTitleHint(ogTitle);
  const firstLine = caption.split('\n')[0].replace(/[^\w\s,&'()-]/g, '').trim();
  const captionSnippet = caption.slice(0, CAPTION_MAX_CHARS);

  // Compact prompt to fit llama.cpp context window (-c 4096)
  const prompt = `Extract recipe JSON from this Instagram caption. Return ONLY valid JSON, no markdown.

Fields: title (dish name, NOT "Instagram Recipe"/"Recipe"/"Untitled"), ingredients (array of {name,amount,unit}), instructions (array), cuisine_type (Italian/Asian/Mexican/American/Mediterranean/French/Indian/Middle Eastern/Japanese/Thai/Other), prep_time_minutes, cook_time_minutes, calories, dietary_tags (vegan/vegetarian/gluten-free/dairy-free/keto/paleo/low-carb).

First line: "${firstLine}"${titleHint ? `\nHint: "${titleHint}"` : ''}

Caption: ${captionSnippet}`;

  const res = await fetch(LLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      stream: false,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  let text = (json.choices?.[0]?.message?.content ?? '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(text);
}

async function run() {
  try {
    const ping = await fetch('http://localhost:8080/health');
    if (!ping.ok) throw new Error(`status ${ping.status}`);
  } catch {
    console.error('⚠️  llama.cpp server not running at localhost:8080.');
    console.error('    Start with: llama-server -m <model.gguf> -c 4096 --host 0.0.0.0 --port 8080');
    process.exit(1);
  }

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, source_url, source_name')
    .eq('source_name', 'Instagram')
    .or(
      GENERIC_TITLES.map(t => `title.ilike.${t}`).join(',') +
      ',title.ilike.instagram recipe,title.ilike.premium recipe,title.ilike.untitled%'
    )
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  const toFix = (recipes ?? []).slice(0, LIMIT);
  console.log(`\n🔧 Found ${recipes?.length ?? 0} recipes with generic titles`);
  console.log(`🔜 Will fix: ${toFix.length}${DRY_RUN ? ' (DRY RUN — no changes saved)' : ''}`);
  console.log(`🤖 llama.cpp @ :8080 — input capped at ${CAPTION_MAX_CHARS} chars\n`);

  if (toFix.length === 0) { console.log('Nothing to fix!'); return; }

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  let fixed = 0, failed = 0;

  for (let i = 0; i < toFix.length; i++) {
    const recipe = toFix[i];
    const pct = `[${i + 1}/${toFix.length}]`;
    console.log(`\n${pct} 🔍 ${recipe.source_url}`);
    console.log(`     Old title: "${recipe.title}"`);

    try {
      const scraped = await scrapeUrl(page, recipe.source_url);

      if (!scraped.caption) {
        console.log('  ⚠️  No caption found — skipping');
        failed++;
        continue;
      }

      const ai = await extractTitleAndData(scraped.caption, scraped.ogTitle);
      const newTitle = ai.title;

      if (!newTitle || GENERIC_TITLES.includes(newTitle.toLowerCase())) {
        console.log(`  ⚠️  Still generic title: "${newTitle}" — skipping`);
        failed++;
        continue;
      }

      console.log(`     New title: "${newTitle}"`);

      if (!DRY_RUN) {
        const update = {
          title: newTitle,
          ...(ai.ingredients?.length > 0 && { ingredients: ai.ingredients }),
          ...(ai.instructions?.length > 0 && { instructions: ai.instructions }),
          ...(ai.cuisine_type && { cuisine_type: ai.cuisine_type }),
          ...(ai.prep_time_minutes && { prep_time_minutes: ai.prep_time_minutes }),
          ...(ai.cook_time_minutes && { cook_time_minutes: ai.cook_time_minutes }),
          ...(ai.calories && { calories: ai.calories }),
          ...(ai.dietary_tags?.length > 0 && { dietary_tags: ai.dietary_tags }),
          ...(scraped.imageUrl && { image_url: scraped.imageUrl }),
        };
        const { error: updateErr } = await supabase.from('recipes').update(update).eq('id', recipe.id);
        if (updateErr) throw new Error(updateErr.message);
        console.log('  ✅ Updated');
      } else {
        console.log('  ✅ (dry run — not saved)');
      }

      fixed++;
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      failed++;
    }

    if (i < toFix.length - 1) {
      process.stdout.write(`  ⏳ Waiting ${DELAY_MS / 1000}s...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
      process.stdout.write(' done\n');
    }
  }

  await browser.close();
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Fixed:  ${fixed}`);
  console.log(`❌ Failed: ${failed}`);
  if (DRY_RUN) console.log('(dry run — no changes were saved)');
}

run().catch(err => { console.error('\n💥 Fatal:', err); process.exit(1); });
