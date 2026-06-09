/**
 * resolve-duplicates.mjs
 *
 * Resolves duplicate image URLs in the recipes table.
 *
 * For each group of recipes sharing the same image_url:
 *   1. Score each recipe by content completeness (ingredients + instructions + description)
 *   2. Promote the highest-scoring recipe → set image_status = 'ok' (keeps the URL)
 *   3. Demote all others → set image_status = 'missing' so fix-bad-images-v2.mjs
 *      will find them unique images on the next pass
 *
 * Usage:
 *   node scripts/resolve-duplicates.mjs
 *   node scripts/resolve-duplicates.mjs --dry-run
 *   node scripts/resolve-duplicates.mjs --limit 100
 */

import { loadEnv, makeSupabase } from "./lib/supabase-env.mjs";

const env = loadEnv();
const supabase = makeSupabase(env);

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = parseInt(process.argv.find((a, i) => process.argv[i - 1] === "--limit") ?? "0", 10) || Infinity;

if (DRY_RUN) console.log("[DRY RUN] No changes will be written.\n");

// ── Fetch all duplicate recipes ───────────────────────────────────────────────
async function fetchDuplicates() {
  const PAGE = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, image_status, ingredients, instructions, description, source")
      .eq("image_status", "duplicate")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

// ── Content quality score (0–3) for a recipe ─────────────────────────────────
function contentScore(r) {
  let score = 0;
  if (Array.isArray(r.ingredients) && r.ingredients.length >= 3) score++;
  if (Array.isArray(r.instructions) && r.instructions.filter((s) => s?.length >= 15).length >= 2) score++;
  if (typeof r.description === "string" && r.description.trim().length >= 30) score++;
  // Bonus for curated source (human-verified)
  if (r.source === "curated") score += 0.5;
  return score;
}

// ── Batch update helper ───────────────────────────────────────────────────────
async function batchUpdate(updates) {
  const CHUNK = 50;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map(({ id, image_status }) =>
        supabase.from("recipes").update({ image_status }).eq("id", id)
      )
    );
    process.stdout.write(`\r  Writing: ${Math.min(i + CHUNK, updates.length)}/${updates.length}`);
  }
  console.log();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("Fetching duplicate recipes...");
  const duplicates = await fetchDuplicates();
  console.log(`${duplicates.length} duplicate recipes found\n`);

  if (!duplicates.length) {
    console.log("No duplicates to resolve. Run flag-image-issues.mjs first if this seems wrong.");
    return;
  }

  // Group by image_url
  const groups = new Map();
  for (const r of duplicates) {
    if (!r.image_url) continue;
    if (!groups.has(r.image_url)) groups.set(r.image_url, []);
    groups.get(r.image_url).push(r);
  }

  console.log(`${groups.size} unique duplicate URLs across ${duplicates.length} recipes\n`);

  let promoted = 0;
  let demoted = 0;
  const toPromote = [];
  const toDemote = [];

  let processed = 0;
  for (const [url, group] of groups) {
    if (processed >= LIMIT) break;
    processed++;

    // Sort by content score desc, then by id asc (stable tiebreak)
    group.sort((a, b) => {
      const scoreDiff = contentScore(b) - contentScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.id.localeCompare ? a.id.localeCompare(b.id) : a.id - b.id;
    });

    const winner = group[0];
    const losers = group.slice(1);

    toPromote.push({ id: winner.id, image_status: "ok" });
    for (const loser of losers) {
      toDemote.push({ id: loser.id, image_status: "missing" });
    }

    promoted++;
    demoted += losers.length;
  }

  console.log(`Will promote: ${promoted} recipes (keep their URL, set image_status='ok')`);
  console.log(`Will demote:  ${demoted} recipes (set image_status='missing' — needs unique image)\n`);

  if (!DRY_RUN) {
    console.log("Writing promotions...");
    await batchUpdate(toPromote);

    console.log("Writing demotions...");
    await batchUpdate(toDemote);
  }

  console.log("\n──────────────────────────────────────────");
  console.log(`Promoted: ${promoted}  (image_status → ok)`);
  console.log(`Demoted:  ${demoted}   (image_status → missing)`);
  if (!DRY_RUN) {
    console.log("\n► Next: run fix-bad-images-v2.mjs --status missing,broken,fallback");
    console.log("  to find unique images for the demoted recipes.");
  }
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
