/**
 * flag-image-issues.mjs
 *
 * Full-sweep audit that classifies every recipe's image_status in the DB.
 * Safe to re-run any time — it resets 'ok' for recipes that were previously
 * fixed, so the status always reflects current reality.
 *
 * Statuses written:
 *   missing   — image_url IS NULL
 *   fallback  — image_url is an Unsplash CDN URL (no real photo was scraped)
 *   duplicate — same URL shared by 2+ recipes (all but the first occurrence)
 *   broken    — HEAD ping returns non-2xx or times out
 *   ok        — everything else (also resets previously-flagged fixed recipes)
 *
 * Usage:
 *   node scripts/flag-image-issues.mjs
 *   node scripts/flag-image-issues.mjs --limit 100   (test on first 100 rows)
 *   node scripts/flag-image-issues.mjs --concurrency 20
 */

import { loadEnv, makeSupabase } from "./lib/supabase-env.mjs";

const env = loadEnv();
const supabase = makeSupabase(env);

const CONCURRENCY = parseInt(getArg("--concurrency") ?? "50", 10);
const LIMIT = parseInt(getArg("--limit") ?? "0", 10) || Infinity;
const TIMEOUT_MS = 8_000;
const UNSPLASH_HOST = "images.unsplash.com";
const BATCH_SIZE = 100;

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

// ── Fetch all recipes ─────────────────────────────────────────────────────────
async function fetchRecipes() {
  const PAGE = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, source_url, cuisine_type, image_status")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
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

// ── Batch write image_status to DB ───────────────────────────────────────────
async function writeStatuses(updates) {
  let written = 0;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(({ id, image_status }) =>
        supabase.from("recipes").update({ image_status }).eq("id", id)
      )
    );
    written += chunk.length;
    process.stdout.write(`\r   Writing: ${written}/${updates.length}`);
  }
  console.log();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("Fetching recipes from Supabase...");
  let recipes = await fetchRecipes();
  if (LIMIT < Infinity) recipes = recipes.slice(0, LIMIT);
  console.log(`${recipes.length} recipes loaded\n`);

  // Track which recipes have been assigned a status this run
  const statusMap = new Map(); // id -> image_status

  // Pass 1: missing
  for (const r of recipes) {
    if (!r.image_url) {
      statusMap.set(r.id, "missing");
    }
  }

  // Pass 2: fallback (Unsplash URL)
  for (const r of recipes) {
    if (statusMap.has(r.id)) continue;
    if (r.image_url && r.image_url.includes(UNSPLASH_HOST)) {
      statusMap.set(r.id, "fallback");
    }
  }

  // Pass 3: duplicate (same URL on 2+ recipes; keep first occurrence, flag the rest)
  const urlFirstSeen = new Map(); // url -> first recipe id
  for (const r of recipes) {
    if (statusMap.has(r.id) || !r.image_url) continue;
    if (urlFirstSeen.has(r.image_url)) {
      statusMap.set(r.id, "duplicate");
    } else {
      urlFirstSeen.set(r.image_url, r.id);
    }
  }

  // Pass 4: broken (HEAD ping — only unflagged recipes, dedup URLs)
  const unflagged = recipes.filter((r) => r.image_url && !statusMap.has(r.id));
  const uniqueUrls = [...new Set(unflagged.map((r) => r.image_url))];

  console.log(`Pinging ${uniqueUrls.length} unique URLs (concurrency=${CONCURRENCY})...`);
  let done = 0;
  const pingResults = await runPool(
    uniqueUrls.map((url) => async () => {
      const result = await ping(url);
      done++;
      if (done % 100 === 0 || done === uniqueUrls.length) {
        process.stdout.write(`\r   Progress: ${done}/${uniqueUrls.length}`);
      }
      return { url, ...result };
    }),
    CONCURRENCY
  );
  console.log("\n");

  const brokenUrls = new Set(pingResults.filter((p) => !p.ok).map((p) => p.url));
  for (const r of unflagged) {
    if (brokenUrls.has(r.image_url)) {
      statusMap.set(r.id, "broken");
    }
  }

  // Pass 5: ok — all remaining (explicit reset catches recipes fixed since last run)
  for (const r of recipes) {
    if (!statusMap.has(r.id)) {
      statusMap.set(r.id, "ok");
    }
  }

  // Build update list — skip recipes already at correct status to reduce writes
  const updates = [];
  for (const r of recipes) {
    const newStatus = statusMap.get(r.id);
    if (r.image_status !== newStatus) {
      updates.push({ id: r.id, image_status: newStatus });
    }
  }

  console.log(`Writing ${updates.length} status updates (${recipes.length - updates.length} unchanged)...`);
  if (updates.length > 0) {
    await writeStatuses(updates);
  }

  // Summary
  const counts = { ok: 0, missing: 0, fallback: 0, duplicate: 0, broken: 0 };
  for (const [, status] of statusMap) {
    counts[status] = (counts[status] ?? 0) + 1;
  }

  console.log("\n──────────────────────────────────────────");
  console.log("Image status summary:");
  console.table(counts);

  const issues = counts.missing + counts.fallback + counts.duplicate + counts.broken;
  const hideable = issues;
  console.log(`${counts.ok} recipes have good images`);
  console.log(`${hideable} recipes need fixing (run fix-bad-images.mjs next)`);
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
