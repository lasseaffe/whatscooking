/**
 * score-recipes.mjs
 *
 * Read-only quality audit. Evaluates every recipe across 4 independent
 * dimensions and prints sample recipes per tier so the user can sign off
 * on pruning thresholds before any data is deleted.
 *
 * Dimensions (independent — a recipe enters only the pipelines it fails):
 *   image        — image_status is 'ok' or a usable duplicate
 *   ingredients  — JSONB array has ≥ 3 items
 *   instructions — text array has ≥ 2 steps each ≥ 15 chars
 *   description  — non-null, ≥ 30 chars
 *
 * Usage:
 *   node scripts/score-recipes.mjs
 *   node scripts/score-recipes.mjs --samples 5     (more samples per tier)
 *   node scripts/score-recipes.mjs --json           (write quality-report.json only)
 */

import { loadEnv, makeSupabase } from "./lib/supabase-env.mjs";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = loadEnv();
const supabase = makeSupabase(env);

const SAMPLES = parseInt(process.argv.find((a, i) => process.argv[i - 1] === "--samples") ?? "3", 10);
const JSON_ONLY = process.argv.includes("--json");

// ── Fetch all recipes ─────────────────────────────────────────────────────────
async function fetchAll() {
  const PAGE = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, source, source_url, image_url, image_status, ingredients, instructions, description, cuisine_type")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
    process.stdout.write(`\r  Loading: ${all.length} recipes...`);
  }

  console.log(`\r  Loaded: ${all.length} recipes        `);
  return all;
}

// ── Dimension checks ──────────────────────────────────────────────────────────
function checkImage(r) {
  if (r.image_status === "ok") return true;
  // A duplicate with a real URL is potentially promotable
  if (r.image_status === "duplicate" && r.image_url) return "duplicate";
  return false;
}

function checkIngredients(r) {
  if (!Array.isArray(r.ingredients)) return false;
  return r.ingredients.length >= 3;
}

function checkInstructions(r) {
  if (!Array.isArray(r.instructions)) return false;
  const good = r.instructions.filter((s) => typeof s === "string" && s.trim().length >= 15);
  return good.length >= 2;
}

function checkDescription(r) {
  return typeof r.description === "string" && r.description.trim().length >= 30;
}

// ── Random sample from array ──────────────────────────────────────────────────
function sample(arr, n) {
  const copy = [...arr];
  const result = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(i, 1)[0]);
  }
  return result;
}

// ── Print a recipe table ──────────────────────────────────────────────────────
function printRecipeTable(recipes) {
  if (!recipes.length) {
    console.log("    (none)");
    return;
  }
  for (const r of recipes) {
    const ing = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
    const ins = Array.isArray(r.instructions) ? r.instructions.length : 0;
    const desc = r.description ? Math.min(r.description.length, 60) : 0;
    const src = r.source_url ? r.source_url.replace(/^https?:\/\//, "").slice(0, 40) : "(no source)";
    console.log(`    • "${r.title}"`);
    console.log(`      source=${r.source ?? "?"} | ${ing} ingredients | ${ins} steps | desc=${desc}ch | ${src}`);
    console.log(`      image_status=${r.image_status ?? "?"} | image_url=${r.image_url ? "yes" : "null"}`);
    console.log();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\nFetching recipes from Supabase...");
  const recipes = await fetchAll();

  // Score each recipe per dimension
  const scored = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    source: r.source,
    source_url: r.source_url,
    image_url: r.image_url,
    image_status: r.image_status,
    ingredients: r.ingredients,
    instructions: r.instructions,
    description: r.description,
    dim_image: checkImage(r),
    dim_ingredients: checkIngredients(r),
    dim_instructions: checkInstructions(r),
    dim_description: checkDescription(r),
  }));

  if (!JSON_ONLY) {
    // ── IMAGE dimension breakdown ─────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  DIMENSION: image");
    console.log("══════════════════════════════════════════════════════");

    const statusGroups = {};
    for (const r of scored) {
      const s = r.image_status ?? "null";
      if (!statusGroups[s]) statusGroups[s] = [];
      statusGroups[s].push(r);
    }

    const statusOrder = ["ok", "duplicate", "broken", "missing", "fallback", "hidden", "null"];
    for (const status of statusOrder) {
      const group = statusGroups[status] ?? [];
      if (!group.length) continue;
      console.log(`\n  [${status.toUpperCase()}] — ${group.length} recipes`);
      const samples = sample(group, SAMPLES);
      printRecipeTable(samples);
    }

    // ── INGREDIENTS dimension ─────────────────────────────────────────────────
    const ingPass = scored.filter((r) => r.dim_ingredients);
    const ingFail = scored.filter((r) => !r.dim_ingredients);
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  DIMENSION: ingredients");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  PASS: ${ingPass.length}  |  FAIL: ${ingFail.length}`);
    if (ingFail.length) {
      console.log(`\n  Sample FAILING recipes (need ingredients backfill):`);
      printRecipeTable(sample(ingFail, SAMPLES));
    }

    // ── INSTRUCTIONS dimension ────────────────────────────────────────────────
    const insPass = scored.filter((r) => r.dim_instructions);
    const insFail = scored.filter((r) => !r.dim_instructions);
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  DIMENSION: instructions");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  PASS: ${insPass.length}  |  FAIL: ${insFail.length}`);
    if (insFail.length) {
      console.log(`\n  Sample FAILING recipes (need instructions backfill):`);
      printRecipeTable(sample(insFail, SAMPLES));
    }

    // ── DESCRIPTION dimension ─────────────────────────────────────────────────
    const descPass = scored.filter((r) => r.dim_description);
    const descFail = scored.filter((r) => !r.dim_description);
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  DIMENSION: description");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  PASS: ${descPass.length}  |  FAIL: ${descFail.length}`);
    if (descFail.length) {
      console.log(`\n  Sample FAILING recipes (need description backfill):`);
      printRecipeTable(sample(descFail, SAMPLES));
    }

    // ── Summary table ─────────────────────────────────────────────────────────
    const totalOk = scored.filter((r) => r.dim_image && r.dim_ingredients && r.dim_instructions && r.dim_description);
    const imageOnly = scored.filter((r) => !r.dim_image && r.dim_ingredients && r.dim_instructions && r.dim_description);
    const contentOnly = scored.filter((r) => r.dim_image && (!r.dim_ingredients || !r.dim_instructions || !r.dim_description));

    console.log("\n══════════════════════════════════════════════════════");
    console.log("  SUMMARY");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  Total recipes:                    ${scored.length}`);
    console.log(`  All 4 dimensions pass:            ${totalOk.length}`);
    console.log(`  Image only failing:               ${imageOnly.length}  ← image pipeline`);
    console.log(`  Content only failing:             ${contentOnly.length}  ← backfill pipelines`);
    console.log(`  Both image + content failing:     ${scored.length - totalOk.length - imageOnly.length - contentOnly.length}`);
    console.log();
    console.log("  Per-dimension breakdown:");
    const imgPass = scored.filter((r) => r.dim_image);
    console.log(`    image:        PASS=${imgPass.length}  FAIL=${scored.length - imgPass.length}`);
    console.log(`    ingredients:  PASS=${ingPass.length}  FAIL=${ingFail.length}`);
    console.log(`    instructions: PASS=${insPass.length}  FAIL=${insFail.length}`);
    console.log(`    description:  PASS=${descPass.length}  FAIL=${descFail.length}`);
    console.log();
  }

  // ── Write JSON report ─────────────────────────────────────────────────────
  const reportPath = join(__dirname, "quality-report.json");
  const report = {
    generatedAt: new Date().toISOString(),
    totalRecipes: scored.length,
    summary: {
      image: { pass: scored.filter((r) => r.dim_image).length, fail: scored.filter((r) => !r.dim_image).length },
      ingredients: { pass: scored.filter((r) => r.dim_ingredients).length, fail: scored.filter((r) => !r.dim_ingredients).length },
      instructions: { pass: scored.filter((r) => r.dim_instructions).length, fail: scored.filter((r) => !r.dim_instructions).length },
      description: { pass: scored.filter((r) => r.dim_description).length, fail: scored.filter((r) => !r.dim_description).length },
    },
    imageStatusBreakdown: {},
    recipes: scored.map(({ id, title, source, image_status, dim_image, dim_ingredients, dim_instructions, dim_description }) => ({
      id, title, source, image_status, dim_image, dim_ingredients, dim_instructions, dim_description,
    })),
  };

  // Count by image status
  for (const r of scored) {
    const s = r.image_status ?? "null";
    report.imageStatusBreakdown[s] = (report.imageStatusBreakdown[s] ?? 0) + 1;
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  Quality report written to: scripts/quality-report.json`);
  console.log("\n  ► Next step: review the sample recipes above, then run fix-bad-images-v2.mjs\n");
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
