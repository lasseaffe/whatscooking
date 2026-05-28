# AI Backfill Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two automated scripts (`backfill-descriptions.mjs` and `backfill-instructions.mjs`) that call OpenRouter to fill missing recipe descriptions and enhanced instructions in Supabase, with checkpointing, retry, and a shared lib layer.

**Architecture:** Three shared lib modules (env/supabase client, OpenRouter HTTP client with retry, checkpoint read/write) are built first. Each backfill script imports from lib, fetches only missing recipes from Supabase, runs a concurrency pool of 2 workers, validates LLM output, and batch-upserts every 50 recipes. A checkpoint JSON file per script enables safe resume after interruption.

**Tech Stack:** Node.js ESM (`*.mjs`), `@supabase/supabase-js` (already installed), native `https` module for OpenRouter calls, `.env.local` for credentials.

---

## File Map

| File | Role |
|---|---|
| `scripts/lib/supabase-env.mjs` | Load `.env.local`, export configured Supabase client + raw env vars |
| `scripts/lib/openrouter.mjs` | OpenRouter HTTPS call with 3× exponential backoff on 429/5xx |
| `scripts/lib/checkpoint.mjs` | Read/write/clear checkpoint JSON; read/append failed-ids txt |
| `scripts/backfill-descriptions.mjs` | Description backfill orchestrator |
| `scripts/backfill-instructions.mjs` | Instruction enhancement backfill orchestrator |

Output files (auto-created at runtime):
- `scripts/chunks/.checkpoint-descriptions.json`
- `scripts/chunks/.checkpoint-instructions.json`
- `scripts/chunks/descriptions-failed.txt`
- `scripts/chunks/instructions-failed.txt`

---

## Task 1: `scripts/lib/supabase-env.mjs` — env loader + Supabase client

**Files:**
- Create: `scripts/lib/supabase-env.mjs`

- [ ] **Step 1: Create the file**

```js
// scripts/lib/supabase-env.mjs
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

export function loadEnv() {
  const envPath = join(__dir, '../../.env.local');
  const env = {};
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      const commentIdx = val.indexOf(' #');
      if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
      env[key] = val;
    }
  } catch (e) {
    console.error('Could not read .env.local:', e.message);
    process.exit(1);
  }
  return env;
}

export function makeSupabase(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  return createClient(url, key);
}
```

- [ ] **Step 2: Smoke-test manually**

```bash
node -e "import('./scripts/lib/supabase-env.mjs').then(m => { const env = m.loadEnv(); console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL?.slice(0,30)); })"
```

Expected: prints the Supabase URL prefix — no crash.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/supabase-env.mjs
git commit -m "feat(backfill): add shared supabase-env lib"
```

---

## Task 2: `scripts/lib/openrouter.mjs` — HTTP client with retry

**Files:**
- Create: `scripts/lib/openrouter.mjs`

- [ ] **Step 1: Create the file**

```js
// scripts/lib/openrouter.mjs
import https from 'https';

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';
const BACKOFF_MS = [2000, 4000, 8000];

export async function callOpenRouter({ apiKey, model = DEFAULT_MODEL, systemPrompt, userPrompt, temperature = 0.3, maxTokens = 600 }) {
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    let statusCode;
    try {
      const text = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'openrouter.ai',
          path: '/api/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://whatscooking.app',
            'X-Title': 'WC Backfill',
            'Content-Length': Buffer.byteLength(body),
          },
        }, res => {
          statusCode = res.statusCode;
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => resolve(raw));
          res.on('error', reject);
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      if (statusCode === 429 || statusCode >= 500) {
        if (attempt < BACKOFF_MS.length) {
          process.stdout.write(` [${statusCode} retry ${attempt + 1}]`);
          await sleep(BACKOFF_MS[attempt]);
          continue;
        }
        throw new Error(`OpenRouter ${statusCode} after ${attempt + 1} attempts`);
      }

      const data = JSON.parse(text);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty OpenRouter response: ' + text.slice(0, 200));
      return content;
    } catch (e) {
      if (attempt < BACKOFF_MS.length && !String(e.message).startsWith('OpenRouter')) {
        process.stdout.write(` [err retry ${attempt + 1}]`);
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      throw e;
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

- [ ] **Step 2: Quick integration test (requires OPENROUTER_API_KEY in .env.local)**

```bash
node -e "
import('./scripts/lib/supabase-env.mjs').then(async ({ loadEnv }) => {
  const env = loadEnv();
  const { callOpenRouter } = await import('./scripts/lib/openrouter.mjs');
  const result = await callOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    systemPrompt: 'Reply with only: OK',
    userPrompt: 'ping',
    maxTokens: 5,
  });
  console.log('Response:', result);
});
"
```

Expected: prints `OK` or similar short response.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/openrouter.mjs
git commit -m "feat(backfill): add OpenRouter HTTP client with exponential backoff"
```

---

## Task 3: `scripts/lib/checkpoint.mjs` — resume + failure log

**Files:**
- Create: `scripts/lib/checkpoint.mjs`

- [ ] **Step 1: Create the file**

```js
// scripts/lib/checkpoint.mjs
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dir, '../chunks');

function ensureDir() { mkdirSync(CHUNKS_DIR, { recursive: true }); }

export function checkpointPath(mode) {
  return join(CHUNKS_DIR, `.checkpoint-${mode}.json`);
}

export function failedPath(mode) {
  return join(CHUNKS_DIR, `${mode}-failed.txt`);
}

export function loadCheckpoint(mode) {
  const p = checkpointPath(mode);
  if (!existsSync(p)) return new Set();
  try {
    const ids = JSON.parse(readFileSync(p, 'utf8'));
    return new Set(ids);
  } catch { return new Set(); }
}

export function saveCheckpoint(mode, doneIds) {
  ensureDir();
  writeFileSync(checkpointPath(mode), JSON.stringify([...doneIds]), 'utf8');
}

export function logFailed(mode, id, title, reason) {
  ensureDir();
  appendFileSync(failedPath(mode), `${id}\t${title}\t${reason}\n`, 'utf8');
}

export function clearCheckpoint(mode) {
  const p = checkpointPath(mode);
  if (existsSync(p)) writeFileSync(p, '[]', 'utf8');
}
```

- [ ] **Step 2: Smoke-test**

```bash
node -e "
import('./scripts/lib/checkpoint.mjs').then(m => {
  m.saveCheckpoint('test', new Set(['id-1','id-2']));
  const loaded = m.loadCheckpoint('test');
  console.log('Loaded:', [...loaded]);
  m.logFailed('test', 'id-3', 'Some Recipe', 'timeout');
  m.clearCheckpoint('test');
  console.log('After clear:', [...m.loadCheckpoint('test')]);
});
"
```

Expected:
```
Loaded: [ 'id-1', 'id-2' ]
After clear: []
```

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/checkpoint.mjs
git commit -m "feat(backfill): add checkpoint + failure-log lib"
```

---

## Task 4: `scripts/backfill-descriptions.mjs`

**Files:**
- Create: `scripts/backfill-descriptions.mjs`

- [ ] **Step 1: Create the file**

```js
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
  return `TITLE: ${recipe.title} | KEY_INGREDIENTS: ${ingredients || 'unknown'} | METHOD: ${recipe.cook_method || 'unknown'} | OCCASION: ${recipe.occasion || 'unknown'}`;
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
  const updates = batch.map(r => ({ id: r.id, description: r._generated }));
  const { error } = await supabase.from('recipes').upsert(updates, { onConflict: 'id' });
  if (error) console.warn('\n  ⚠️  Supabase write error:', error.message);
}

async function main() {
  const env = loadEnv();
  const supabase = makeSupabase(env);
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) { console.error('Missing OPENROUTER_API_KEY in .env.local'); process.exit(1); }

  console.log(`\n📝 Description Backfill | model: ${MODEL} | concurrency: ${CONCURRENCY}`);
  if (DRY_RUN) console.log('🔍 DRY RUN — no API calls, no writes');

  // Fetch candidates
  let query = supabase.from('recipes').select('id, title, description, ingredients, cook_method, occasion').order('id');
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
      await processBatch(pendingBatch, supabase);
      saveCheckpoint(MODE, done);
      pendingBatch = [];
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
```

- [ ] **Step 2: Dry-run test**

```bash
cd C:\Users\lasse\Desktop\whatscooking
node scripts/backfill-descriptions.mjs --dry-run --limit=5
```

Expected: prints 5 recipe titles with `(dry run)` — no API calls, no errors.

- [ ] **Step 3: Live test with 3 recipes**

```bash
node scripts/backfill-descriptions.mjs --limit=3 --reset
```

Expected: 3 recipes processed, `✅` for each, checkpoint written.

- [ ] **Step 4: Verify DB write**

```bash
node -e "
import('./scripts/lib/supabase-env.mjs').then(async ({ loadEnv, makeSupabase }) => {
  const env = loadEnv();
  const sb = makeSupabase(env);
  const { data } = await sb.from('recipes').select('title, description').not('description', 'is', null).limit(3);
  data.forEach(r => console.log(r.title, '\\n', r.description, '\\n'));
});
"
```

Expected: 3 recipes with hook + body descriptions.

- [ ] **Step 5: Commit**

```bash
git add scripts/backfill-descriptions.mjs
git commit -m "feat(backfill): add description backfill script with OpenRouter + checkpoint"
```

---

## Task 5: `scripts/backfill-instructions.mjs`

**Files:**
- Create: `scripts/backfill-instructions.mjs`

- [ ] **Step 1: Create the file**

```js
// scripts/backfill-instructions.mjs
import { loadEnv, makeSupabase } from './lib/supabase-env.mjs';
import { callOpenRouter } from './lib/openrouter.mjs';
import { loadCheckpoint, saveCheckpoint, logFailed } from './lib/checkpoint.mjs';

const MODE = 'instructions';
const DRY_RUN      = process.argv.includes('--dry-run');
const RESET        = process.argv.includes('--reset');
const LIMIT_ARG    = process.argv.find(a => a.startsWith('--limit='));
const LIMIT        = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;
const MODEL_ARG    = process.argv.find(a => a.startsWith('--model='));
const MODEL        = MODEL_ARG ? MODEL_ARG.split('=')[1] : 'meta-llama/llama-3.1-8b-instruct';
const CONC_ARG     = process.argv.find(a => a.startsWith('--concurrency='));
const CONCURRENCY  = CONC_ARG ? parseInt(CONC_ARG.split('=')[1]) : 2;
const BATCH_SIZE   = 50;

const SYSTEM_PROMPT = `You are a culinary writing assistant. Given a recipe step, produce a JSON object with EXACTLY these fields:

{
  "header": "short imperative title (3-6 words, verb first, e.g. 'Sear the chicken thighs')",
  "body_text": "one paragraph, 3-6 sentences covering: (1) TECHNIQUE - exactly how to do it with tool/motion/heat/timing; (2) WHY - the reason this step matters (Maillard, gluten, emulsification etc); (3) PITFALL - the single most common mistake and what goes wrong; (4) SENSORY CUE - one concrete sight/sound/smell/touch signal that tells the cook the step is done. Direct address. Vary cadence. Never start sentences with 'Then' or 'Next'.",
  "skill": {
    "beginner": "one sentence tip for beginners",
    "pro": "one sentence advanced technique or shortcut"
  },
  "jargon": [{"term": "any technical word used", "definition": "plain English explanation"}],
  "visual_strategy": "one sentence describing what the cook should look for visually at this step"
}

Respond with ONLY the JSON object. No explanation, no markdown fences, no prose before or after.`;

function buildUserPrompt(title, stepText, stepIndex, totalSteps) {
  return `Recipe: ${title}\nStep ${stepIndex + 1} of ${totalSteps}: ${stepText}`;
}

function parseSteps(raw) {
  if (Array.isArray(raw)) {
    return raw.map(s => (typeof s === 'object' ? s.text || s.step || JSON.stringify(s) : String(s))).filter(s => s.trim().length > 10);
  }
  return String(raw || '').split(/\n+/).map(s => s.trim()).filter(s => s.length > 10);
}

function extractJSON(text) {
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

function isValidStep(obj) {
  return obj && typeof obj.header === 'string' && obj.header.trim().length > 0
    && typeof obj.body_text === 'string' && obj.body_text.trim().length > 0
    && obj.skill && typeof obj.skill.beginner === 'string' && typeof obj.skill.pro === 'string'
    && Array.isArray(obj.jargon)
    && typeof obj.visual_strategy === 'string';
}

function fallbackStep(stepText) {
  return {
    header: stepText.split('.')[0].slice(0, 60).trim() || 'Prepare step',
    body_text: stepText,
    skill: { beginner: '', pro: '' },
    jargon: [],
    visual_strategy: '',
  };
}

async function enhanceStep(apiKey, title, stepText, stepIndex, totalSteps) {
  const userPrompt = buildUserPrompt(title, stepText, stepIndex, totalSteps);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenRouter({ apiKey, model: MODEL, systemPrompt: SYSTEM_PROMPT, userPrompt, temperature: attempt === 0 ? 0.3 : 0.1, maxTokens: 500 });
      const parsed = extractJSON(raw);
      if (isValidStep(parsed)) return parsed;
      process.stdout.write(' [parse fail]');
    } catch (e) {
      process.stdout.write(` [${e.message.slice(0, 20)}]`);
      if (attempt === 0) continue;
    }
  }
  return fallbackStep(stepText);
}

async function processBatch(batch, supabase) {
  const updates = batch.map(r => ({ id: r.id, instructions_enhanced: r._generated }));
  const { error } = await supabase.from('recipes').upsert(updates, { onConflict: 'id' });
  if (error) console.warn('\n  ⚠️  Supabase write error:', error.message);
}

async function main() {
  const env = loadEnv();
  const supabase = makeSupabase(env);
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) { console.error('Missing OPENROUTER_API_KEY in .env.local'); process.exit(1); }

  console.log(`\n📚 Instruction Enhancement Backfill | model: ${MODEL} | concurrency: ${CONCURRENCY}`);
  if (DRY_RUN) console.log('🔍 DRY RUN — no API calls, no writes');

  let query = supabase.from('recipes').select('id, title, instructions').is('instructions_enhanced', null).order('id');
  if (LIMIT) query = query.limit(LIMIT);
  const { data: allRecipes, error } = await query;
  if (error) { console.error('Supabase fetch error:', error); process.exit(1); }

  const done = RESET ? new Set() : loadCheckpoint(MODE);
  const recipes = allRecipes.filter(r => !done.has(r.id));

  console.log(`📊 ${recipes.length} recipes need instruction enhancement (${done.size} already done)\n`);
  if (recipes.length === 0) { console.log('✅ Nothing to do!'); return; }

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  let pendingBatch = [];

  async function processOne(recipe) {
    const label = `[${processed + failed + 1}/${recipes.length}] ${recipe.title.slice(0, 45).padEnd(45)}`;
    process.stdout.write(label + ' ... ');

    const steps = parseSteps(recipe.instructions);
    if (steps.length === 0) {
      console.log('⏭️  no steps');
      done.add(recipe.id);
      processed++;
      return;
    }

    if (DRY_RUN) { console.log(`(dry run, ${steps.length} steps)`); processed++; return; }

    const enhanced = [];
    for (let i = 0; i < steps.length; i++) {
      const step = await enhanceStep(apiKey, recipe.title, steps[i], i, steps.length);
      enhanced.push(step);
    }

    recipe._generated = enhanced;
    pendingBatch.push(recipe);
    done.add(recipe.id);
    processed++;

    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(` ✅ (${steps.length} steps, ${elapsed}min total)`);

    if (pendingBatch.length >= BATCH_SIZE) {
      await processBatch(pendingBatch, supabase);
      saveCheckpoint(MODE, done);
      pendingBatch = [];
    }
  }

  const queue = [...recipes];
  async function worker() {
    while (queue.length) {
      const recipe = queue.shift();
      if (recipe) await processOne(recipe);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (pendingBatch.length && !DRY_RUN) {
    await processBatch(pendingBatch, supabase);
    saveCheckpoint(MODE, done);
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n🎉 Done! ${processed} enhanced, ${failed} failed in ${totalMin} minutes.`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Dry-run test**

```bash
node scripts/backfill-instructions.mjs --dry-run --limit=5
```

Expected: 5 recipes printed with step counts — no API calls, no errors.

- [ ] **Step 3: Live test with 2 recipes**

```bash
node scripts/backfill-instructions.mjs --limit=2 --reset
```

Expected: 2 recipes with `✅ (N steps, ...)`.

- [ ] **Step 4: Verify DB write**

```bash
node -e "
import('./scripts/lib/supabase-env.mjs').then(async ({ loadEnv, makeSupabase }) => {
  const env = loadEnv();
  const sb = makeSupabase(env);
  const { data } = await sb.from('recipes').select('title, instructions_enhanced').not('instructions_enhanced', 'is', null).limit(2);
  data.forEach(r => {
    console.log('\\nTitle:', r.title);
    console.log('Steps:', r.instructions_enhanced.length);
    console.log('Step 1 header:', r.instructions_enhanced[0]?.header);
  });
});
"
```

Expected: 2 recipes with step arrays, each step having a `header` field.

- [ ] **Step 5: Commit**

```bash
git add scripts/backfill-instructions.mjs
git commit -m "feat(backfill): add instruction enhancement backfill script with OpenRouter + checkpoint"
```

---

## Task 6: Final validation + full run instructions

- [ ] **Step 1: Test resume behaviour for descriptions**

```bash
# Start, kill after 2 recipes, then restart — should skip the 2 already done
node scripts/backfill-descriptions.mjs --limit=4
# Ctrl+C after 2 complete
node scripts/backfill-descriptions.mjs --limit=4
# Should only process 2 more, not repeat the first 2
```

Expected: second run prints `(N already done)` and only processes remaining recipes.

- [ ] **Step 2: Test --model flag**

```bash
node scripts/backfill-descriptions.mjs --dry-run --limit=1 --model=anthropic/claude-haiku-4-5
```

Expected: dry run output shows the model name in the header line — no crash.

- [ ] **Step 3: Full production run (descriptions — run overnight)**

```bash
node scripts/backfill-descriptions.mjs
```

Monitor: watch for `❌ FAILED` lines. Check `scripts/chunks/descriptions-failed.txt` after completion.

- [ ] **Step 4: Full production run (instructions — run overnight, after descriptions complete)**

```bash
node scripts/backfill-instructions.mjs
```

- [ ] **Step 5: Final commit**

```bash
git add scripts/lib/
git commit -m "feat(backfill): complete AI backfill automation — descriptions + instructions via OpenRouter"
```
