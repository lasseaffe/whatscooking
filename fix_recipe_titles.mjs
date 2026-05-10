/**
 * MOVED — use scripts/scraping/fix_recipe_titles.mjs instead.
 *
 * This file is kept for backwards compatibility.
 * The active version (Llama 3.1:8B, local Ollama) is at:
 *   scripts/scraping/fix_recipe_titles.mjs
 */
console.error('⚠️  This script has moved. Run: node scripts/scraping/fix_recipe_titles.mjs');
process.exit(1);

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL   = 'https://oruplzhfmtehsjbnsoms.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4';
const OLLAMA_URL     = 'http://localhost:11434/v1/chat/completions';
const DELAY_MS       = 4_000;

const HEADLESS = process.argv.includes('--headless');
const DRY_RUN  = process.argv.includes('--dry-run');
const LIMIT    = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const GENERIC_TITLES = ['instagram recipe', 'premium recipe', 'untitled recipe', 'recipe', ''];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── HELPERS ───────────────────────────────────────────────────────────────────
function parseTitleHint(ogTitle) {
  if (!ogTitle) return null;
  const match = ogTitle.match(/["""](.{4,80})["""]/);
  if (match) return match[1].split('\n')[0].replace(/[🍳🥘🍲🍜🍝🍛🍱🌮🌯🥙🍔🍕🥗🫕🥩🍗🍖]+/g, '').trim();
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

  const prompt = `You are a culinary data extractor. Extract the recipe from this Instagram post.

TITLE RULES:
- The title is the NAME OF THE DISH only (e.g. "Creamy Tuscan Chicken")
- First line of caption (usually the dish name): "${firstLine}"
${titleHint ? `- Instagram title hint: "${titleHint}"` : ''}
- NEVER use "Instagram Recipe", "Recipe", "Untitled", or any generic name
- Clean up emoji and hashtags from the title

Also extract:
- ingredients: array of { "name", "amount" (number|null), "unit" (string|null) }
- instructions: array of step strings
- cuisine_type: "Italian"|"Asian"|"Mexican"|"American"|"Mediterranean"|"French"|"Indian"|"Middle Eastern"|"Japanese"|"Thai"|"Other"
- prep_time_minutes: number or null
- cook_time_minutes: number or null
- calories: number or null
- dietary_tags: array from ["vegan","vegetarian","gluten-free","dairy-free","keto","paleo","low-carb"]

Return ONLY valid JSON. No markdown.

Caption:
${caption}`;

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3:8b',
      stream: false,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  let text = (json.choices?.[0]?.message?.content ?? '').trim();
  // Strip any <think>...</think> block that qwen3 may emit before the JSON
  text = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(text);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
  // Verify Ollama is reachable before doing any work
  try {
    const ping = await fetch('http://localhost:11434/api/tags');
    if (!ping.ok) throw new Error(`status ${ping.status}`);
  } catch (e) {
    console.error('⚠️  Ollama is not running at localhost:11434. Start the Ollama desktop app first.');
    process.exit(1);
  }

  // Fetch all recipes with generic titles that have an Instagram source_url
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
  console.log(`🔜 Will fix: ${toFix.length}${DRY_RUN ? ' (DRY RUN — no changes saved)' : ''}\n`);

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
