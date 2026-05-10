/**
 * MOVED — use scripts/scraping/scrape_to_supabase.mjs instead.
 *
 * The active version (Llama 3.2:3B, local Ollama) is at:
 *   scripts/scraping/scrape_to_supabase.mjs
 */
console.error('⚠️  This script has moved. Run: node scripts/scraping/scrape_to_supabase.mjs');
process.exit(1);
// ── original source below (for reference) ────────────────────────────────────
import fs from 'fs';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const supabase = createClient('https://oruplzhfmtehsjbnsoms.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4');
const OLLAMA_URL = 'http://localhost:11434/v1/chat/completions';

async function run() {
    const urls = fs.readFileSync('Premium recipes_.txt', 'utf-8')
                   .split('\n')
                   .filter(line => line.trim() !== '');

    const browser = await chromium.launch({ headless: false }); // Set to true once working
    const context = await browser.newContext();
    const page = await context.newPage();

  for (const url of urls) {
        console.log(`\n🔍 Scraping: ${url}`);
        try {
            // 1. Visit the page
            await page.goto(url.trim(), { waitUntil: 'networkidle' });
            
            // 2. PASTE THE NEW CODE HERE (Replacing the old 'const caption' line)
            const caption = await page.evaluate(() => {
                // Try to find the 'description' meta tag
                const meta = document.querySelector('meta[property="og:description"]');
                if (meta) return meta.content;

                // Fallback: Look for the first <h1> on the page
                const h1 = document.querySelector('h1');
                return h1 ? h1.innerText : null;
            });

            // 3. Keep the rest of your logic below
            if (!caption) {
                console.log("⚠️ No caption found, skipping...");
                continue;
            }

            console.log("📝 Caption found! Sending to AI...");
            const structuredData = await cleanWithAI(caption);

            const { error } = await supabase.from('recipes').insert([{
                source: 'social',
                source_name: 'Instagram',
                source_url: url.trim(),
                title: structuredData.title,
                ingredients: structuredData.ingredients ?? [],
                instructions: structuredData.instructions ? [structuredData.instructions] : [],
                dish_types: ['premium'],
                dietary_tags: [],
                is_premium: true,
                is_hack: false,
                prep_time_minutes: 0,
                cook_time_minutes: 0,
                servings: 1,
            }]);

            if (error) throw error;
            console.log(`✅ Successfully saved: ${structuredData.title}`);

            // Wait 10 seconds to avoid ban
            await new Promise(r => setTimeout(r, 10000));
            
        } catch (err) {
            console.error(`❌ Failed ${url}:`, err.message);
        }
    }
    await browser.close();
}

async function cleanWithAI(rawText) {
    const prompt = `Extract the recipe title, ingredients, and instructions from this Instagram caption.
    Return ONLY a JSON object with keys "title", "ingredients" (an array), and "instructions" (string).
    Text: ${rawText}`;

    const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen3:8b',
            stream: false,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    let text = (json.choices?.[0]?.message?.content ?? '').trim();
    // Strip <think>...</think> reasoning block that qwen3 may emit
    text = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    return JSON.parse(text.replace(/```json|```/g, "").trim());
}

run();