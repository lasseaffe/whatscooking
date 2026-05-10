/**
 * scrape_instagram.mjs
 *
 * Scrapes Instagram recipe URLs, extracts captions via Playwright,
 * structures them with Llama 3.1:8B (local Ollama), upserts into Supabase,
 * and saves each recipe as a local JSON file in ./recipes-local/
 *
 * Usage:
 *   node scripts/scraping/scrape_instagram.mjs
 *   node scripts/scraping/scrape_instagram.mjs --headless
 *   node scripts/scraping/scrape_instagram.mjs --limit 20
 *
 * Progress is saved to scrape_progress.json — safe to Ctrl+C and resume.
 * Requires Ollama running at localhost:11434 with llama3.1:8b pulled.
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://oruplzhfmtehsjbnsoms.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4';
// llama.cpp server — start with: llama-server -m model.gguf -c 4096
const LLAMA_URL     = 'http://localhost:8080/v1/chat/completions';
const AI_MODEL      = 'llama-3.1-8b'; // label only; llama.cpp uses whatever GGUF is loaded
// Context budget: keep prompt under ~1800 tokens so output has room within -c 4096
const CAPTION_MAX_CHARS = 600;
const INPUT_FILE    = 'Premium recipes_.txt';
const PROGRESS_FILE = 'scrape_progress.json';
const LOCAL_DIR     = './recipes-local';
const DELAY_MS      = 3_000;

const HEADLESS = process.argv.includes('--headless');
const LIMIT    = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── URL PARSING ───────────────────────────────────────────────────────────────
function parseUrlFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^﻿/, '');
  const lines = raw.split('\n').map(l => l.trim());

  const premiumUrls = [];
  const hackUrls    = [];
  let section       = null;

  for (const line of lines) {
    if (/^Premium recipes/i.test(line)) { section = 'premium'; continue; }
    if (/^Hacks/i.test(line))           { section = 'hack';    continue; }
    if (line.startsWith('https://www.instagram.com/p/')) {
      if (section === 'premium') premiumUrls.push(line);
      else if (section === 'hack') hackUrls.push(line);
    }
  }

  return { premiumUrls, hackUrls };
}

// ── PROGRESS TRACKING ─────────────────────────────────────────────────────────
function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return { done: [] };
  return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
}

function markDone(url, progress) {
  progress.done.push(url);
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ── TITLE HINT ────────────────────────────────────────────────────────────────
function parseTitleHint(ogTitle) {
  if (!ogTitle) return null;
  const match = ogTitle.match(/["""](.{4,80})["""]/);
  if (match) return match[1].split('\n')[0].replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  return null;
}

// ── AI STRUCTURING (llama.cpp at localhost:8080) ──────────────────────────────
async function structureWithAI(caption, ogTitle) {
  const titleHint = parseTitleHint(ogTitle);
  const firstLine = caption.split('\n')[0].replace(/[^\w\s,&'-]/g, '').trim();
  // Truncate caption to stay within llama.cpp context window
  const captionSnippet = caption.slice(0, CAPTION_MAX_CHARS);

  // Compact prompt — every token counts with a fixed context window
  const prompt = `Extract recipe JSON from this Instagram caption. Return ONLY valid JSON, no markdown.

Fields: title (dish name, not "Instagram Recipe"), ingredients (array of {name,amount,unit}), instructions (array of strings), cuisine_type (Italian/Asian/Mexican/American/Mediterranean/French/Indian/Middle Eastern/Japanese/Thai/Other), prep_time_minutes, cook_time_minutes, calories, dietary_tags (vegan/vegetarian/gluten-free/dairy-free/keto/paleo/low-carb).

First line (likely dish name): "${firstLine}"${titleHint ? `\nTitle hint: "${titleHint}"` : ''}

Caption: ${captionSnippet}`;

  let text = '';
  try {
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
    text = (json.choices?.[0]?.message?.content ?? '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('  ⚠️  AI parse error:', err.message);
    console.error('  Raw response:', text.slice(0, 300));
    return {
      title: 'Instagram Recipe',
      ingredients: [],
      instructions: [],
      cuisine_type: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      calories: null,
      dietary_tags: [],
    };
  }
}

// ── SCRAPE ONE URL ────────────────────────────────────────────────────────────
async function scrapeUrl(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  return await page.evaluate(() => {
    const get = (selector) => document.querySelector(selector)?.content ?? null;
    return {
      caption:  get('meta[property="og:description"]') ?? document.querySelector('h1')?.innerText ?? null,
      imageUrl: get('meta[property="og:image"]'),
      title:    get('meta[property="og:title"]'),
    };
  });
}

// ── SAVE LOCAL JSON FILE ──────────────────────────────────────────────────────
function saveLocalFile(record) {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const shortcode = (record.source_url ?? '').match(/\/p\/([A-Za-z0-9_-]+)\//)?.[1] ?? Date.now().toString();
  const filePath = path.join(LOCAL_DIR, `${shortcode}.json`);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
}

// ── UPSERT TO SUPABASE ────────────────────────────────────────────────────────
async function upsertRecipe(url, scraped, ai, dishTypes) {
  const instructions = Array.isArray(ai.instructions)
    ? ai.instructions
    : typeof ai.instructions === 'string'
      ? ai.instructions.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

  const record = {
    source:            'social',
    source_name:       'Instagram',
    source_url:        url,
    title:             ai.title ?? 'Instagram Recipe',
    description:       scraped.caption ? scraped.caption.slice(0, 500) : null,
    image_url:         scraped.imageUrl ?? null,
    ingredients:       ai.ingredients ?? [],
    instructions,
    dish_types:        dishTypes,
    dietary_tags:      ai.dietary_tags ?? [],
    cuisine_type:      ai.cuisine_type ?? null,
    prep_time_minutes: ai.prep_time_minutes ?? 0,
    cook_time_minutes: ai.cook_time_minutes ?? 0,
    calories:          ai.calories ?? null,
    servings:          1,
    is_premium:        dishTypes.includes('premium'),
    is_hack:           dishTypes.includes('hack'),
  };

  saveLocalFile(record);

  const { data: existing } = await supabase
    .from('recipes')
    .select('id')
    .eq('source_url', url)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('recipes').update(record).eq('id', existing.id);
    if (error) throw new Error(error.message);
    console.log('  (updated existing record)');
  } else {
    const { error } = await supabase.from('recipes').insert(record);
    if (error) throw new Error(error.message);
  }

  return record.title;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
  // Verify llama.cpp server is reachable
  try {
    const ping = await fetch('http://localhost:8080/health');
    if (!ping.ok) throw new Error(`status ${ping.status}`);
  } catch {
    console.error('⚠️  llama.cpp server not running at localhost:8080.');
    console.error('    Start with: llama-server -m <model.gguf> -c 4096 --host 0.0.0.0 --port 8080');
    process.exit(1);
  }

  const { premiumUrls, hackUrls } = parseUrlFile(INPUT_FILE);
  const progress = loadProgress();
  const done     = new Set(progress.done);

  const seen = new Set();
  const queue = [
    ...hackUrls.map(url    => ({ url, dishTypes: ['hack', 'premium'] })),
    ...premiumUrls.map(url => ({ url, dishTypes: ['premium'] })),
  ].filter(({ url }) => {
    if (done.has(url) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  const toProcess = queue.slice(0, LIMIT);
  console.log(`\n📋 ${premiumUrls.length} premium + ${hackUrls.length} hack URLs in file`);
  console.log(`✅ ${done.size} already done, 🔜 ${toProcess.length} queued`);
  console.log(`🤖 Model: ${AI_MODEL} (llama.cpp @ :8080, context cap: ${CAPTION_MAX_CHARS} chars input)\n`);

  if (toProcess.length === 0) {
    console.log('Nothing to do — all URLs already processed!');
    return;
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  let succeeded = 0;
  let failed    = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const { url, dishTypes } = toProcess[i];
    const pct = `[${i + 1}/${toProcess.length}]`;
    console.log(`\n${pct} 🔍 ${url}`);

    try {
      const scraped = await scrapeUrl(page, url);

      if (!scraped.caption) {
        console.log(`  ⚠️  No caption found — skipping`);
        markDone(url, progress);
        continue;
      }

      const captionLen = scraped.caption.length;
      console.log(`  📝 Caption (${captionLen} chars${captionLen > CAPTION_MAX_CHARS ? `, truncated to ${CAPTION_MAX_CHARS}` : ''}) — sending to llama.cpp...`);

      const ai = await structureWithAI(scraped.caption, scraped.title);
      const title = await upsertRecipe(url, scraped, ai, dishTypes);
      console.log(`  ✅ Saved: "${title}"`);
      markDone(url, progress);
      succeeded++;

    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      failed++;
    }

    if (i < toProcess.length - 1) {
      process.stdout.write(`  ⏳ Waiting ${DELAY_MS / 1000}s...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
      process.stdout.write(' done\n');
    }
  }

  await browser.close();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed:    ${failed}`);
  console.log(`📁 Progress saved to ${PROGRESS_FILE}`);
}

run().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
