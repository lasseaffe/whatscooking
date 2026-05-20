// scripts/backfill-descriptions.mjs
import { loadEnv, makeSupabase } from './lib/supabase-env.mjs';
import { callOpenRouter } from './lib/openrouter.mjs';
import { loadCheckpoint, saveCheckpoint, logFailed } from './lib/checkpoint.mjs';

const MODE = 'descriptions';
const DRY_RUN      = process.argv.includes('--dry-run');
const RESET        = process.argv.includes('--reset');
const LIMIT_ARG    = process.argv.find(a => a.startsWith('--limit='));
const LIMIT        = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;
const MODEL_ARG    = process.argv.find(a => a.startsWith('--model='));
const MODEL        = MODEL_ARG ? MODEL_ARG.split('=')[1] : 'meta-llama/llama-3.1-8b-instruct';
const CONC_ARG     = process.argv.find(a => a.startsWith('--concurrency='));
const CONCURRENCY  = CONC_ARG ? parseInt(CONC_ARG.split('=')[1]) : 2;
const BATCH_SIZE   = 50;

const SYSTEM_PROMPT = `You are a culinary copywriter for an editorial recipe app. Given recipe metadata, produce a two-tier description following these exact rules.

OUTPUT FORMAT — return ONLY this, no extra text:
HOOK: [1 sentence, ≤ 18 words, leads with sensory or cultural identity]
BODY: [2-3 sentences, 50-75 words total: (1) texture/flavour contrast from ingredients+method result, (2) cultural/occasion anchor, (3) concrete payoff detail]

HARD PROHIBITIONS — never write these phrases:
perfect for / bursting with / elevated / next level / packed with flavour / simple yet / a crowd-pleaser / comfort food at its finest / hearty and satisfying / bold and flavourful / delightfully / weeknight hero / effortless / incredibly / melt-in-your-mouth (unless braised meat)

STRUCTURAL RULES:
- No first-person (I, we, you'll love)
- No imperative openers (Try this..., Make this tonight...)
- No hedging (can be, might be, is often considered)
- No ingredient listing
- No invented specifics — only claim what title+ingredients make undeniable
- Max 1 em-dash per description
- HOOK forbidden openers: "This dish", "A delicious", "Perfect for", "Here is", "Introducing"

FIELD USAGE:
- KEY_INGREDIENTS: 1 ingredient max per sentence, sensory precision only
- METHOD result (not name): braised=yielding, roasted=crisp exterior, simmered=thick/velvety
- OCCASION: body sentence 2 only, one word max

EXAMPLE:
Input: TITLE: Smoky Black Bean Soup | KEY_INGREDIENTS: black beans, chipotle, smoked paprika, onion, garlic, cumin | METHOD: simmered | OCCASION: weeknight
Output:
HOOK: Dark, smoky, and deeply savoury — black beans carried by chipotle heat.
BODY: The beans yield into a thick, velvety broth with a slow-building warmth that sits at the back of the palate. A weeknight staple in Mexican home cooking, it asks for nothing more than a wedge of lime and a warm tortilla. Smoked paprika threads through every spoonful, giving the soup a campfire depth that canned beans alone never reach.`;

function buildUserPrompt(recipe) {
  const ingredients = (() => {
    const raw = recipe.ingredients || [];
    const arr = Array.isArray(raw) ? raw : String(raw).split('\n');
    return arr.map(i => (typeof i === 'object' ? i.name || JSON.stringify(i) : String(i)).replace(/^[\s\-*]+/, '').trim())
      .filter(Boolean).slice(0, 6).join(', ');
  })();
  const cuisine = recipe.cuisine_type || 'unknown';
  const occasion = (Array.isArray(recipe.dish_types) ? recipe.dish_types.find(t => !['premium','hack'].includes(t)) : null) || 'unknown';
  return `TITLE: ${recipe.title} | KEY_INGREDIENTS: ${ingredients || 'unknown'} | CUISINE: ${cuisine} | OCCASION: ${occasion}`;
}

function parseResponse(text) {
  const hookMatch = text.match(/HOOK:\s*(.+)/);
  const bodyMatch = text.match(/BODY:\s*([\s\S]+)/);
  if (!hookMatch || !bodyMatch) return null;
  const hook = hookMatch[1].trim();
  const body = bodyMatch[1].trim();
  const hookWords = hook.split(/\s+/).length;
  const bodyWords = body.split(/\s+/).length;
  if (hookWords > 25 || bodyWords < 30) return null;
  return `${hook}\n${body}`;
}

function isMissing(desc) {
  if (!desc) return true;
  const t = String(desc).trim().toLowerCase();
  return t === '' || t === 'description missing' || t === 'missing';
}

async function processBatch(batch, supabase) {
  for (const r of batch) {
    const { error } = await supabase.from('recipes').update({ description: r._generated }).eq('id', r.id);
    if (error) console.warn(`\n  ⚠️  Supabase write error for ${r.id}:`, error.message);
  }
}

async function main() {
  const env = loadEnv();
  const supabase = makeSupabase(env);
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) { console.error('Missing OPENROUTER_API_KEY in .env.local'); process.exit(1); }

  console.log(`\n📝 Description Backfill | model: ${MODEL} | concurrency: ${CONCURRENCY}`);
  if (DRY_RUN) console.log('🔍 DRY RUN — no API calls, no writes');

  // Fetch candidates
  let query = supabase.from('recipes').select('id, title, description, ingredients, cuisine_type, dish_types, difficulty_level').or('description.is.null,description.eq."",description.eq.description missing').order('id');
  if (LIMIT) query = query.limit(LIMIT);
  const { data: allRecipes, error } = await query;
  if (error) { console.error('Supabase fetch error:', error); process.exit(1); }

  const done = RESET ? new Set() : loadCheckpoint(MODE);
  const recipes = allRecipes.filter(r => isMissing(r.description) && !done.has(r.id));

  console.log(`📊 ${recipes.length} recipes need descriptions (${done.size} already done)\n`);
  if (recipes.length === 0) { console.log('✅ Nothing to do!'); return; }

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  let pendingBatch = [];

  async function processOne(recipe) {
    const label = `[${processed + failed + 1}/${recipes.length}] ${recipe.title.slice(0, 45).padEnd(45)}`;
    process.stdout.write(label + ' ... ');

    if (DRY_RUN) { console.log('(dry run)'); processed++; return; }

    const userPrompt = buildUserPrompt(recipe);
    let result = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callOpenRouter({ apiKey, model: MODEL, systemPrompt: SYSTEM_PROMPT, userPrompt, temperature: attempt === 0 ? 0.3 : 0.1, maxTokens: 300 });
        result = parseResponse(raw);
        if (result) break;
        process.stdout.write(' [parse fail, retry]');
      } catch (e) {
        process.stdout.write(` [${e.message.slice(0, 30)}]`);
        break;
      }
    }

    if (!result) {
      console.log(' ❌ FAILED');
      logFailed(MODE, recipe.id, recipe.title, 'parse failed after 2 attempts');
      failed++;
      return;
    }

    recipe._generated = result;
    pendingBatch.push(recipe);
    done.add(recipe.id);
    processed++;

    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(` ✅ (${elapsed}min total)`);

    if (pendingBatch.length >= BATCH_SIZE) {
      const batchToFlush = pendingBatch;
      pendingBatch = [];                          // reset immediately, before any await
      await processBatch(batchToFlush, supabase);
      saveCheckpoint(MODE, done);
    }
  }

  // Concurrency pool
  const queue = [...recipes];
  async function worker() {
    while (queue.length) {
      const recipe = queue.shift();
      if (recipe) await processOne(recipe);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Flush remaining
  if (pendingBatch.length && !DRY_RUN) {
    await processBatch(pendingBatch, supabase);
    saveCheckpoint(MODE, done);
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n🎉 Done! ${processed} generated, ${failed} failed in ${totalMin} minutes.`);
  if (failed > 0) console.log(`   Failed IDs → scripts/chunks/${MODE}-failed.txt`);
}

main().catch(e => { console.error(e); process.exit(1); });
