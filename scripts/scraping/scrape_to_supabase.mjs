/**
 * scrape_to_supabase.mjs
 *
 * Simple Instagram scraper: reads URLs from Premium recipes_.txt,
 * extracts captions via Playwright, structures them with Llama 3.2:3B
 * (local Ollama), and inserts into Supabase.
 *
 * Usage:
 *   node scripts/scraping/scrape_to_supabase.mjs
 *
 * Requires Ollama running at localhost:11434 with llama3.2:3b pulled.
 * For full-featured scraping with progress tracking, use scrape_instagram.mjs instead.
 */

import fs from 'fs';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase  = createClient(
  'https://oruplzhfmtehsjbnsoms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4'
);
// llama.cpp server — start with: llama-server -m <model.gguf> -c 2048 --port 8080
const LLAMA_URL  = 'http://localhost:8080/v1/chat/completions';
const AI_MODEL   = 'llama-3.2-3b'; // label only; llama.cpp uses whatever GGUF is loaded
const CAPTION_MAX_CHARS = 500;     // stay within -c 2048 context window for 3B model

async function run() {
  const urls = fs.readFileSync('Premium recipes_.txt', 'utf-8')
                 .split('\n')
                 .filter(line => line.trim() !== '');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page    = await context.newPage();

  for (const url of urls) {
    console.log(`\n🔍 Scraping: ${url}`);
    try {
      await page.goto(url.trim(), { waitUntil: 'networkidle' });

      const caption = await page.evaluate(() => {
        const meta = document.querySelector('meta[property="og:description"]');
        if (meta) return meta.content;
        const h1 = document.querySelector('h1');
        return h1 ? h1.innerText : null;
      });

      if (!caption) {
        console.log('⚠️ No caption found, skipping...');
        continue;
      }

      console.log('📝 Caption found! Sending to AI...');
      const structuredData = await cleanWithAI(caption);

      const { error } = await supabase.from('recipes').insert([{
        source:            'social',
        source_name:       'Instagram',
        source_url:        url.trim(),
        title:             structuredData.title,
        ingredients:       structuredData.ingredients ?? [],
        instructions:      structuredData.instructions ? [structuredData.instructions] : [],
        dish_types:        ['premium'],
        dietary_tags:      [],
        is_premium:        true,
        is_hack:           false,
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings:          1,
      }]);

      if (error) throw error;
      console.log(`✅ Successfully saved: ${structuredData.title}`);

      await new Promise(r => setTimeout(r, 10000));

    } catch (err) {
      console.error(`❌ Failed ${url}:`, err.message);
    }
  }
  await browser.close();
}

async function cleanWithAI(rawText) {
  const snippet = rawText.slice(0, CAPTION_MAX_CHARS);
  const prompt = `Extract recipe JSON from this caption. Return ONLY a JSON object with keys "title", "ingredients" (array of strings), "instructions" (string). No markdown.
Caption: ${snippet}`;

  const res = await fetch(LLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      stream: false,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = (json.choices?.[0]?.message?.content ?? '').trim();
  return JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
}

run();
