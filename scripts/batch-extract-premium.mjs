/**
 * Batch-extracts all premium recipe stubs from the database.
 * For every row with title = 'Premium Recipe' it generates a real
 * dish name + full recipe via OpenAI and writes the result back.
 *
 * Usage:
 *   node scripts/batch-extract-premium.mjs
 *
 * Optional env overrides (falls back to .env.local):
 *   CONCURRENCY=5   how many parallel OpenAI calls (default 4)
 *   DRY_RUN=1       print what would be written without touching the DB
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── load .env.local manually (no dotenv dep needed) ──────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");
try {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch { /* .env.local not found — rely on process.env */ }

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_KEY      = process.env.OPENAI_API_KEY;
const CONCURRENCY     = parseInt(process.env.CONCURRENCY  ?? "4", 10);
const DRY_RUN         = process.env.DRY_RUN === "1";

if (!SUPABASE_URL || !SUPABASE_ANON || !OPENAI_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or OPENAI_API_KEY");
  process.exit(1);
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
    },
  });
  return r.json();
}

async function sbPatch(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`PATCH ${id} failed: ${r.status} ${text}`);
  }
}

// ── OpenAI helper ─────────────────────────────────────────────────────────────
const FOOD_PHOTOS = [
  "photo-1504674900247-0877df9cc836","photo-1414235077428-338989a2e8c0",
  "photo-1476224203421-9ac39bcb3327","photo-1565299624946-b28f40a0ae38",
  "photo-1546069901-ba9599a7e63c", "photo-1512621776951-a57141f2eefd",
  "photo-1484723091739-30a097e8f929","photo-1499028344343-cd173ffc68a9",
  "photo-1455619452474-d2be8b1e70cd","photo-1432139509613-5c4255815697",
  "photo-1467003909585-2f8a72700288","photo-1519708227418-c8fd9a32b7a2",
  "photo-1606851091851-e8c8c0fca5ba","photo-1555939594-58d7cb561ad1",
  "photo-1567620905732-2d1ec7ab7445","photo-1528735602780-2552fd46c7af",
  "photo-1567620832903-9fc6debc209f","photo-1540189549336-e6e99c3679fe",
  "photo-1504754524776-8f4f37790ca0","photo-1473093295043-cdd812d0e601",
  "photo-1482049016688-2d3e1b311543","photo-1505253716362-afaea1d3d1af",
  "photo-1563379926898-05f4575a45d8","photo-1548940740-204726a19be3",
  "photo-1562802378-063ec186a863","photo-1551183053-bf91798d9fe8",
  "photo-1549584526-c2a2e8dde7b0","photo-1547592166-23ac45744acd",
  "photo-1601050690597-df0568f70950","photo-1585937421612-70a008356fbe",
  "photo-1603133872878-684f208fb84b","photo-1596560548464-f010549b84d7",
  "photo-1574484284002-952d92456975","photo-1565958011703-44f9829ba187",
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickPhoto(id) {
  return `https://images.unsplash.com/${FOOD_PHOTOS[hashStr(id) % FOOD_PHOTOS.length]}?w=800&q=80`;
}

// Cuisine styles for variety — deterministically picked from recipe id
const STYLES = [
  "Italian pasta dish", "Japanese ramen or noodle bowl", "Mexican taco or bowl",
  "Mediterranean salad or grain bowl", "French bistro main course",
  "Indian curry or dal", "Middle Eastern mezze or main",
  "American BBQ or comfort food", "Thai noodle or curry",
  "Spanish tapas or paella", "Moroccan tagine or couscous",
  "Greek main course", "Korean BBQ or bibimbap",
  "Vietnamese pho or banh mi", "Chinese stir-fry or dumpling dish",
  "Peruvian ceviche or rice dish", "Ethiopian stew with injera",
  "Turkish kebab or pide", "Brazilian churrasco side",
  "Scandinavian open-faced sandwich or fish dish",
];

async function generateRecipe(recipe) {
  const styleIdx = hashStr(recipe.id) % STYLES.length;
  const style = STYLES[styleIdx];

  // Use the shortcode from the Instagram URL as a unique seed
  const m = (recipe.source_url ?? "").match(/\/p\/([A-Za-z0-9_-]+)\//);
  const seed = m?.[1] ?? recipe.id.slice(0, 8);

  const prompt = `You are a creative culinary expert. Invent a specific, appetising dish inspired by the style "${style}". Use the code "${seed}" as a creative seed for uniqueness — let it influence the dish name, key ingredient, or technique.

Requirements:
- Give the dish a specific, appealing name (e.g. "Saffron Seafood Risotto with Crispy Capers", not just "Pasta")
- Write a realistic, home-cook-friendly recipe
- Be creative but plausible

Return valid JSON ONLY — no markdown, no code fences:
{
  "title": "Specific Dish Name",
  "cuisine_type": "Italian",
  "description": "Appetising 2-3 sentence description of the dish",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "calories": 480,
  "protein_g": 28,
  "carbs_g": 42,
  "fat_g": 18,
  "dietary_tags": [],
  "ingredients": [
    { "name": "ingredient", "amount": 300, "unit": "g" }
  ],
  "instructions": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ]
}

Include at least 6 ingredients and 5 steps with specific amounts. Return ONLY the JSON.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a culinary expert. Return only valid JSON with no markdown or code fences." },
        { role: "user", content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 1800,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? "{}";

  let extracted;
  try {
    extracted = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      extracted = JSON.parse(raw.slice(start, end + 1));
    } else {
      throw new Error(`Could not parse JSON from OpenAI: ${raw.slice(0, 100)}`);
    }
  }

  return extracted;
}

// ── concurrency pool ──────────────────────────────────────────────────────────
async function runPool(items, fn, concurrency) {
  let idx = 0;
  let done = 0;
  const results = new Array(items.length);

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = { error: e.message };
      }
      done++;
      if (done % 10 === 0) {
        process.stdout.write(`  ${done}/${items.length} done\r`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching premium stubs from Supabase…");

  // Fetch all premium stubs that still have the placeholder title
  const stubs = await sbGet(
    `/recipes?select=id,title,source_url,cuisine_type,dietary_tags,dish_types` +
    `&dish_types=cs.%7B%22premium%22%7D` +  // dish_types @> ["premium"]
    `&title=eq.Premium%20Recipe` +
    `&limit=1000`
  );

  if (!Array.isArray(stubs)) {
    console.error("Unexpected response:", stubs);
    process.exit(1);
  }

  console.log(`Found ${stubs.length} unextracted premium stubs.`);
  if (stubs.length === 0) {
    console.log("Nothing to do — all premium recipes already have real titles.");
    return;
  }

  if (DRY_RUN) {
    console.log("DRY RUN — would process:", stubs.slice(0, 3).map(r => r.id));
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  await runPool(stubs, async (recipe, i) => {
    let extracted;
    try {
      extracted = await generateRecipe(recipe);
    } catch (e) {
      console.error(`  [${i + 1}] generateRecipe failed for ${recipe.id}: ${e.message}`);
      errorCount++;
      return;
    }

    const update = {};

    if (extracted.title)        update.title        = extracted.title;
    if (extracted.cuisine_type) update.cuisine_type = extracted.cuisine_type;
    if (extracted.dietary_tags) update.dietary_tags = extracted.dietary_tags;
    if (extracted.description)  update.description  = extracted.description;
    if (extracted.servings)     update.servings     = extracted.servings;
    if (extracted.prep_time_minutes) update.prep_time_minutes = extracted.prep_time_minutes;
    if (extracted.cook_time_minutes) update.cook_time_minutes = extracted.cook_time_minutes;
    if (extracted.calories)     update.calories     = extracted.calories;
    if (extracted.protein_g)    update.protein_g    = extracted.protein_g;
    if (extracted.carbs_g)      update.carbs_g      = extracted.carbs_g;
    if (extracted.fat_g)        update.fat_g        = extracted.fat_g;
    if (Array.isArray(extracted.ingredients) && extracted.ingredients.length > 0)
      update.ingredients = extracted.ingredients;
    if (Array.isArray(extracted.instructions) && extracted.instructions.length > 0)
      update.instructions = extracted.instructions;

    // Assign difficulty from time
    const total = (extracted.prep_time_minutes ?? 0) + (extracted.cook_time_minutes ?? 0);
    update.difficulty_level = total <= 25 ? "easy" : total <= 60 ? "medium" : "hard";

    // Assign a curated Unsplash food photo
    update.image_url = pickPhoto(recipe.id);

    try {
      await sbPatch("recipes", recipe.id, update);
      successCount++;
      console.log(`  [${i + 1}/${stubs.length}] ✓ ${update.title ?? "?"} (${update.cuisine_type ?? "?"})`);
    } catch (e) {
      console.error(`  [${i + 1}] sbPatch failed for ${recipe.id}: ${e.message}`);
      errorCount++;
    }
  }, CONCURRENCY);

  console.log(`\nDone! ${successCount} extracted, ${errorCount} errors.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
