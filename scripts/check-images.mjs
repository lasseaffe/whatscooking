/**
 * check-images.mjs
 *
 * Audits every image_url stored in the Supabase recipes table.
 * Flags:
 *   - 404 / non-200 responses
 *   - Duplicate URLs assigned to multiple distinct recipes
 *   - Recipes with null image_url (no image assigned at all)
 *
 * Usage:
 *   node scripts/check-images.mjs
 *   node scripts/check-images.mjs --limit 50    (test on first 50 rows)
 *   node scripts/check-images.mjs --concurrency 5
 *
 * Output: console + writes audit-report.json to project root.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://oruplzhfmtehsjbnsoms.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAzNTYsImV4cCI6MjA5MDYzNjM1Nn0.NFZN5psyD8Fkq4QOxVq41Yg-plrYa7DAUAxAmduAkN4";
const CONCURRENCY = parseInt(getArg("--concurrency") ?? "8", 10);
const LIMIT = parseInt(getArg("--limit") ?? "0", 10) || Infinity;
const TIMEOUT_MS = 8_000;

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Fetch all recipes ─────────────────────────────────────────────────────────
async function fetchRecipes() {
  const PAGE = 1000;
  let all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, cuisine_type")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

// ── HEAD ping with timeout ────────────────────────────────────────────────────
async function ping(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: err.name === "AbortError" ? "TIMEOUT" : "ERROR" };
  }
}

// ── Concurrency pool ──────────────────────────────────────────────────────────
async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("🔍 Fetching recipes from Supabase…");
  let recipes = await fetchRecipes();
  if (LIMIT < Infinity) recipes = recipes.slice(0, LIMIT);
  console.log(`📋 ${recipes.length} recipes loaded\n`);

  // ── 1. Null image audit ──────────────────────────────────────────────────
  const nullImages = recipes.filter((r) => !r.image_url);
  console.log(`⚠️  ${nullImages.length} recipes have no image_url (will use category fallback)`);
  if (nullImages.length > 0) {
    nullImages.slice(0, 10).forEach((r) => console.log(`   • [${r.id.slice(0, 8)}] ${r.title}`));
    if (nullImages.length > 10) console.log(`   … and ${nullImages.length - 10} more`);
  }

  // ── 2. Duplicate URL audit ────────────────────────────────────────────────
  const urlToRecipes = new Map();
  for (const r of recipes) {
    if (!r.image_url) continue;
    const list = urlToRecipes.get(r.image_url) ?? [];
    list.push(r);
    urlToRecipes.set(r.image_url, list);
  }
  const duplicates = [...urlToRecipes.entries()].filter(([, list]) => list.length > 1);
  console.log(`\n🔁 ${duplicates.length} duplicate image URLs (shared by multiple recipes)`);
  if (duplicates.length > 0) {
    duplicates.slice(0, 5).forEach(([url, list]) => {
      console.log(`   URL: ${url.slice(0, 80)}…`);
      list.forEach((r) => console.log(`     → ${r.title}`));
    });
    if (duplicates.length > 5) console.log(`   … and ${duplicates.length - 5} more duplicate groups`);
  }

  // ── 3. HTTP ping audit ────────────────────────────────────────────────────
  const withImages = recipes.filter((r) => r.image_url);
  // Deduplicate URLs for pinging — no need to ping same URL twice
  const uniqueUrls = [...new Set(withImages.map((r) => r.image_url))];
  console.log(`\n🌐 Pinging ${uniqueUrls.length} unique image URLs (concurrency=${CONCURRENCY})…`);

  let done = 0;
  const pingResults = await runPool(
    uniqueUrls.map((url) => async () => {
      const result = await ping(url);
      done++;
      if (done % 50 === 0 || done === uniqueUrls.length) {
        process.stdout.write(`\r   Progress: ${done}/${uniqueUrls.length}`);
      }
      return { url, ...result };
    }),
    CONCURRENCY,
  );
  console.log("\n");

  const failed = pingResults.filter((r) => !r.ok);
  const broken = failed.filter((r) => r.status === 404 || r.status === 410);
  const errored = failed.filter((r) => r.status === "ERROR" || r.status === "TIMEOUT");

  console.log(`✅ OK:       ${pingResults.length - failed.length}`);
  console.log(`❌ Broken:   ${broken.length} (404/410)`);
  console.log(`⏱  Timeout:  ${errored.length} (network error / timeout)`);

  if (broken.length > 0) {
    console.log("\n❌ Broken URLs:");
    broken.forEach(({ url, status }) => {
      const recipes = (urlToRecipes.get(url) ?? []).map((r) => r.title).join(", ");
      console.log(`   [${status}] ${url.slice(0, 80)} → ${recipes}`);
    });
  }

  // ── 4. Write JSON report ──────────────────────────────────────────────────
  const report = {
    generatedAt: new Date().toISOString(),
    totalRecipes: recipes.length,
    nullImageCount: nullImages.length,
    duplicateGroups: duplicates.length,
    uniqueUrlsChecked: uniqueUrls.length,
    okCount: pingResults.length - failed.length,
    brokenCount: broken.length,
    timeoutCount: errored.length,
    nullImages: nullImages.map((r) => ({ id: r.id, title: r.title })),
    duplicates: duplicates.map(([url, list]) => ({
      url,
      recipes: list.map((r) => ({ id: r.id, title: r.title })),
    })),
    broken: broken.map(({ url, status }) => ({
      status,
      url,
      recipes: (urlToRecipes.get(url) ?? []).map((r) => ({ id: r.id, title: r.title })),
    })),
  };

  const outPath = path.join(__dirname, "..", "audit-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`\n📁 Full report saved to audit-report.json`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const issues = nullImages.length + duplicates.length + broken.length;
  if (issues === 0) {
    console.log("🎉 All images are healthy — no issues found!");
  } else {
    console.log(`⚠️  ${issues} issue(s) found. Review audit-report.json for details.`);
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error("💥 Fatal:", err.message);
  process.exit(1);
});
