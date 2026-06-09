/**
 * generate-wc-recipes.ts — World Cup 2026 recipe generator (local-LLM driven)
 * ---------------------------------------------------------------------------
 * Generates ≥10 full recipes for every WC 2026 nation (48 × 10 = 480) by asking
 * a local LLM (Ollama-compatible /api/generate) to author an authentic recipe
 * for each dish already listed in src/lib/wc2026.ts. Emits TWO artifacts from a
 * single source of truth so they never drift:
 *
 *   1. supabase/migrations/<ts>_wc2026_recipes_seed.sql  (recipes table; powers
 *      discover/search + the per-country recipe count & grid)
 *   2. src/lib/wc2026-recipes.ts  (WC_RECIPES map; powers the dish-detail pages)
 *
 * Resumable: every accepted recipe is cached to scripts/.wc-recipes-cache.json,
 * so re-running only fills gaps. Both output files are re-emitted in full from
 * the cache on every run, so output is deterministic and idempotent.
 *
 * Usage:
 *   npx tsx scripts/generate-wc-recipes.ts                 # full run (needs LLM)
 *   WC_LLM_MODEL=qwen2.5vl:7b npx tsx scripts/...           # override model
 *   npx tsx scripts/generate-wc-recipes.ts --limit 5       # first 5 dishes only
 *   npx tsx scripts/generate-wc-recipes.ts --only egypt     # one nation
 *   npx tsx scripts/generate-wc-recipes.ts --dry-run        # no LLM; stub recipes
 *
 * Env:
 *   WC_LLM_URL   default http://localhost:11434
 *   WC_LLM_MODEL default llama3.1:8b   (pull it, or point at an installed model)
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WC2026_NATIONS } from "../src/lib/wc2026";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const LLM_URL = process.env.WC_LLM_URL ?? "http://localhost:11434";
const LLM_MODEL = process.env.WC_LLM_MODEL ?? "llama3.1:8b";
const CACHE_PATH = resolve(__dirname, ".wc-recipes-cache.json");
const SQL_PATH = resolve(ROOT, "supabase/migrations/20260602010000_wc2026_recipes_seed.sql");
const MAP_PATH = resolve(ROOT, "src/lib/wc2026-recipes.ts");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

// ── Shapes ──────────────────────────────────────────────────────────────────
interface GenRecipe {
  title: string;
  description: string;
  cuisine_type: string;
  dish_types: string[];
  dietary_tags: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

// key → recipe
type Cache = Record<string, GenRecipe & { _country: string; _dish: string; _slug: string }>;

// ── Helpers ─────────────────────────────────────────────────────────────────
function dishSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function sqlStr(s: string): string {
  return `'${String(s ?? "").replace(/'/g, "''")}'`;
}
function sqlTextArr(arr: string[]): string {
  if (!arr?.length) return "ARRAY[]::text[]";
  return `ARRAY[${arr.map(sqlStr).join(",")}]`;
}
function sqlJsonb(v: unknown): string {
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

function loadCache(): Cache {
  if (existsSync(CACHE_PATH)) {
    try { return JSON.parse(readFileSync(CACHE_PATH, "utf8")); } catch { /* fall through */ }
  }
  return {};
}
function saveCache(cache: Cache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function buildPrompt(nation: { name: string; cuisine: string }, dish: { name: string; description: string }): string {
  return `You are a professional recipe developer. Write ONE authentic ${nation.cuisine} recipe for the classic dish "${dish.name}" (${dish.description}).

Return ONLY a valid JSON object, no markdown, with this exact schema:
{
  "title": "string — the dish name, optionally with a short flourish",
  "description": "string — 2-3 engaging present-tense sentences",
  "cuisine_type": "${nation.cuisine}",
  "dish_types": ["string — e.g. main course, dessert, drink, side"],
  "dietary_tags": ["string — only if truly applicable, else empty array"],
  "ingredients": [{"name":"string","amount":number,"unit":"string"}],
  "instructions": ["string — each a complete step sentence"],
  "prep_time_minutes": number,
  "cook_time_minutes": number,
  "servings": number,
  "difficulty": "Easy|Medium|Hard",
  "calories": number, "protein_g": number, "carbs_g": number,
  "fat_g": number, "fiber_g": number, "sugar_g": number, "sodium_mg": number
}

Rules: amounts numeric (no string fractions); calories>0; servings>0; 5-12 instruction steps; authentic ingredients for ${nation.cuisine} cuisine. Return ONLY the JSON object.`;
}

function stubRecipe(nation: { cuisine: string }, dish: { name: string; description: string }): GenRecipe {
  // Deterministic placeholder used by --dry-run to verify emission wiring only.
  return {
    title: dish.name,
    description: `${dish.description}. A placeholder generated in --dry-run mode; replace with a real LLM run.`,
    cuisine_type: nation.cuisine,
    dish_types: ["main course"],
    dietary_tags: [],
    ingredients: [{ name: "placeholder ingredient", amount: 1, unit: "unit" }],
    instructions: ["Placeholder step one.", "Placeholder step two."],
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    servings: 4,
    difficulty: "Medium",
    calories: 400, protein_g: 20, carbs_g: 40, fat_g: 15, fiber_g: 4, sugar_g: 6, sodium_mg: 500,
  };
}

function extractJson(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    const parts = t.split("```");
    if (parts.length >= 2) { t = parts[1]; if (t.startsWith("json")) t = t.slice(4); }
  }
  if (t.endsWith("```")) t = t.slice(0, -3);
  // grab the outermost {...}
  const first = t.indexOf("{"); const last = t.lastIndexOf("}");
  return first >= 0 && last > first ? t.slice(first, last + 1) : t.trim();
}

async function callLLM(prompt: string): Promise<GenRecipe | null> {
  try {
    const res = await fetch(`${LLM_URL}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: LLM_MODEL, prompt, stream: false, options: { temperature: 0.7, num_predict: 1800 } }),
    });
    if (!res.ok) { console.error(`  [llm] HTTP ${res.status}`); return null; }
    const data = await res.json() as { response?: string };
    const obj = JSON.parse(extractJson(data.response ?? "")) as GenRecipe;
    return validate(obj) ? obj : null;
  } catch (e) {
    console.error(`  [llm] failed: ${(e as Error).message}`);
    return null;
  }
}

function validate(r: GenRecipe): boolean {
  return !!r && typeof r.title === "string" && r.title.length > 0
    && Array.isArray(r.ingredients) && r.ingredients.length > 0
    && Array.isArray(r.instructions) && r.instructions.length > 0
    && Number(r.calories) > 0 && Number(r.servings) > 0;
}

// ── Emit: migration SQL ──────────────────────────────────────────────────────
function emitSql(cache: Cache): void {
  const rows = Object.values(cache);
  const lines: string[] = [
    "-- World Cup 2026 recipe seed — generated by scripts/generate-wc-recipes.ts",
    `-- ${rows.length} recipes across ${new Set(rows.map(r => r.cuisine_type)).size} cuisines`,
    "-- Idempotent: ON CONFLICT (source_url) DO NOTHING. Images backfilled separately.",
    "",
  ];
  for (const r of rows) {
    const sourceUrl = `https://whatscooking.app/wc2026/${r._slug}`;
    lines.push(
      "insert into recipes (source, source_name, source_url, title, description, image_url, " +
      "cuisine_type, dish_types, dietary_tags, ingredients, instructions, " +
      "prep_time_minutes, cook_time_minutes, servings, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg) values (",
      `  'curated', 'What''s Cooking — World Cup 2026', ${sqlStr(sourceUrl)},`,
      `  ${sqlStr(r.title)}, ${sqlStr(r.description)}, NULL,`,
      `  ${sqlStr(r.cuisine_type)}, ${sqlTextArr(r.dish_types)}, ${sqlTextArr(r.dietary_tags)},`,
      `  ${sqlJsonb(r.ingredients)}, ${sqlTextArr(r.instructions)},`,
      `  ${r.prep_time_minutes}, ${r.cook_time_minutes}, ${r.servings}, ${r.calories}, ${r.protein_g}, ${r.carbs_g}, ${r.fat_g}, ${r.fiber_g}, ${r.sugar_g}, ${r.sodium_mg}`,
      ") on conflict (source_url) where source_url is not null do nothing;",
      "",
    );
  }
  mkdirSync(dirname(SQL_PATH), { recursive: true });
  writeFileSync(SQL_PATH, lines.join("\n"));
  console.log(`→ wrote ${rows.length} INSERTs to ${SQL_PATH}`);
}

// ── Emit: WC_RECIPES static map ──────────────────────────────────────────────
function emitMap(cache: Cache): void {
  const byCountry: Record<string, GenRecipe[] & { _dish?: string }[]> = {};
  const grouped: Record<string, (GenRecipe & { _dish: string })[]> = {};
  for (const r of Object.values(cache)) {
    (grouped[r._country] ??= []).push(r);
  }
  const mapEntries = Object.entries(grouped).map(([country, recipes]) => {
    const dishes = recipes.map((r) => {
      const ingredients = r.ingredients.map((i) => `${i.amount} ${i.unit} ${i.name}`.trim());
      const entry = {
        name: r._dish,
        description: r.description,
        prepTime: `${r.prep_time_minutes} min`,
        cookTime: `${r.cook_time_minutes} min`,
        servings: r.servings,
        difficulty: r.difficulty,
        ingredients,
        instructions: r.instructions,
      };
      return "    " + JSON.stringify(entry);
    });
    return `  ${JSON.stringify(country)}: [\n${dishes.join(",\n")}\n  ]`;
  });

  const file = `export interface WCDishRecipe {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  instructions: string[];
  tip?: string;
}

export type WCRecipeMap = Record<string, WCDishRecipe[]>;

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getDishRecipe(countrySlug: string, dishSlug: string): WCDishRecipe | undefined {
  const nation = WC_RECIPES[countrySlug];
  if (!nation) return undefined;
  return nation.find((d) => slug(d.name) === dishSlug);
}

export function getDishSlug(name: string) {
  return slug(name);
}

// AUTO-GENERATED by scripts/generate-wc-recipes.ts — do not edit by hand.
export const WC_RECIPES: WCRecipeMap = {
${mapEntries.join(",\n")}
};
`;
  writeFileSync(MAP_PATH, file);
  console.log(`→ wrote WC_RECIPES map (${Object.keys(grouped).length} nations) to ${MAP_PATH}`);
}

// ── Main ──────────────────────────────────────────────────────────────────--
async function main() {
  const cache = loadCache();
  let attempted = 0, added = 0, failed = 0;

  const nations = ONLY ? WC2026_NATIONS.filter((n) => n.countrySlug === ONLY) : WC2026_NATIONS;
  if (ONLY && nations.length === 0) { console.error(`No nation with slug "${ONLY}"`); process.exit(1); }

  outer: for (const nation of nations) {
    for (const dish of nation.dishes) {
      const slug = `${nation.countrySlug}/${dishSlug(dish.name)}`;
      if (cache[slug]) continue;            // resume: already done
      if (attempted >= LIMIT) break outer;
      attempted++;
      console.log(`[${attempted}] ${nation.name} — ${dish.name}`);
      const recipe = DRY_RUN ? stubRecipe(nation, dish) : await callLLM(buildPrompt(nation, dish));
      if (recipe && validate(recipe)) {
        cache[slug] = { ...recipe, cuisine_type: nation.cuisine, _country: nation.countrySlug, _dish: dish.name, _slug: slug };
        added++;
        saveCache(cache);                   // checkpoint after each success
      } else {
        failed++;
        console.warn(`    ✗ skipped (no valid recipe)`);
      }
    }
  }

  // Always re-emit both artifacts in full from the cache.
  if (Object.keys(cache).length > 0) { emitSql(cache); emitMap(cache); }
  console.log(`\nDone. attempted=${attempted} added=${added} failed=${failed} cached_total=${Object.keys(cache).length}`);
  if (failed > 0) console.log("Re-run to retry the skipped dishes (cache keeps the good ones).");
}

main();
