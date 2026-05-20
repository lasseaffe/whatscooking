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
  for (const r of batch) {
    const { error } = await supabase.from('recipes').update({ instructions_enhanced: r._generated }).eq('id', r.id);
    if (error) console.warn('\n  WARNING  Supabase write error:', error.message);
  }
}

async function main() {
  const env = loadEnv();
  const supabase = makeSupabase(env);
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) { console.error('Missing OPENROUTER_API_KEY in .env.local'); process.exit(1); }

  console.log(`\nInstruction Enhancement Backfill | model: ${MODEL} | concurrency: ${CONCURRENCY}`);
  if (DRY_RUN) console.log('DRY RUN -- no API calls, no writes');

  let query = supabase.from('recipes').select('id, title, instructions').is('instructions_enhanced', null).order('id');
  if (LIMIT) query = query.limit(LIMIT);
  const { data: allRecipes, error } = await query;
  if (error) { console.error('Supabase fetch error:', error); process.exit(1); }

  const done = RESET ? new Set() : loadCheckpoint(MODE);
  const recipes = allRecipes.filter(r => !done.has(r.id));

  console.log(`${recipes.length} recipes need instruction enhancement (${done.size} already done)\n`);
  if (recipes.length === 0) { console.log('Nothing to do!'); return; }

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  let pendingBatch = [];

  async function processOne(recipe) {
    const label = `[${processed + failed + 1}/${recipes.length}] ${recipe.title.slice(0, 45).padEnd(45)}`;
    process.stdout.write(label + ' ... ');

    const steps = parseSteps(recipe.instructions);
    if (steps.length === 0) {
      console.log('no steps');
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
    console.log(` done (${steps.length} steps, ${elapsed}min total)`);

    if (pendingBatch.length >= BATCH_SIZE) {
      const batchToFlush = pendingBatch;
      pendingBatch = [];
      await processBatch(batchToFlush, supabase);
      saveCheckpoint(MODE, done);
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
  console.log(`\nDone! ${processed} enhanced, ${failed} failed in ${totalMin} minutes.`);
}

main().catch(e => { console.error(e); process.exit(1); });
