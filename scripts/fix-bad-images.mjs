/**
 * fix-bad-images.mjs
 *
 * Attempts to find a real image for every recipe with image_status != 'ok'.
 * Tries 3 free strategies per recipe in order:
 *
 *   1. Re-scrape og:image from source_url (fast, free)
 *   2. Google Images search via Playwright (free, can get rate-limited)
 *   3. Wikimedia Commons API (free, no key needed, Creative Commons licensed)
 *
 * If all strategies fail → sets image_status = 'hidden' (excluded from UI).
 *
 * Supports checkpointing — safe to stop and resume at any time.
 *
 * Usage:
 *   node scripts/fix-bad-images.mjs
 *   node scripts/fix-bad-images.mjs --limit 50               (test run)
 *   node scripts/fix-bad-images.mjs --dry-run                 (no DB writes)
 *   node scripts/fix-bad-images.mjs --status broken,missing   (target specific statuses)
 *   node scripts/fix-bad-images.mjs --reset-checkpoint        (start fresh)
 */

import { loadEnv, makeSupabase } from "./lib/supabase-env.mjs";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = path.join(__dirname, ".fix-images-checkpoint.json");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const RATE_LIMIT_MS = 2_000;
const FETCH_TIMEOUT_MS = 10_000;
const UNSPLASH_HOST = "images.unsplash.com";

const env = loadEnv();
const supabase = makeSupabase(env);

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const LIMIT = parseInt(getArg("--limit") ?? "0", 10) || Infinity;
const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset-checkpoint");
const TARGET_STATUSES = (getArg("--status") ?? "broken,duplicate,fallback,missing").split(",");

// ── Checkpoint ────────────────────────────────────────────────────────────────
function loadCheckpoint() {
  if (RESET || !fs.existsSync(CHECKPOINT_FILE)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
    return new Set(data.processed ?? []);
  } catch {
    return new Set();
  }
}

function saveCheckpoint(processedIds) {
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({ processed: [...processedIds], updatedAt: new Date().toISOString() }, null, 2)
  );
}

// ── Fetch recipes needing a fix ───────────────────────────────────────────────
async function fetchBadRecipes() {
  const PAGE = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, source_url, cuisine_type")
      .in("image_status", TARGET_STATUSES)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

// ── Strategy 1: Re-scrape og:image from source_url ───────────────────────────
async function scrapeOgImage(sourceUrl) {
  if (!sourceUrl) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[property="og:image:secure_url"]').attr("content"),
    ];

    for (const url of candidates) {
      if (url && url.startsWith("http") && !url.includes(UNSPLASH_HOST)) {
        return url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ── Strategy 2: Google Images via Playwright ──────────────────────────────────
async function searchGoogleImages(recipeTitle, browser) {
  const query = encodeURIComponent(`${recipeTitle} recipe food photo`);
  const url = `https://www.google.com/search?tbm=isch&q=${query}`;
  let page;
  try {
    page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForSelector('img[src^="https"]', { timeout: 8_000 });

    const imageUrls = await page.$$eval('img[src^="https"]', (imgs) =>
      imgs.map((img) => img.src)
    );

    for (const imgUrl of imageUrls) {
      // Skip Google's own tiny UI icons, tracking pixels, and data URIs
      if (
        imgUrl.includes("gstatic.com") ||
        imgUrl.includes("google.com") ||
        imgUrl.includes(".svg") ||
        imgUrl.includes(UNSPLASH_HOST)
      ) {
        continue;
      }
      // Skip thumbnails (Google's tiny base64-encoded previews come through as https sometimes)
      if (imgUrl.length > 200 && imgUrl.includes("encrypted-tbn")) continue;
      return imgUrl;
    }
    return null;
  } catch {
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── Strategy 3: Wikimedia Commons API ────────────────────────────────────────
async function searchWikimedia(recipeTitle) {
  try {
    // Search for files matching the recipe title
    const searchUrl =
      `${WIKIMEDIA_API}?action=query&list=search` +
      `&srsearch=${encodeURIComponent(recipeTitle + " food")}` +
      `&srnamespace=6&format=json&srlimit=5&origin=*`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json();
    const results = data?.query?.search ?? [];
    if (!results.length) return null;

    // Get the direct URL for the first result
    const title = results[0].title; // e.g. "File:Pasta carbonara.jpg"
    const infoUrl =
      `${WIKIMEDIA_API}?action=query&titles=${encodeURIComponent(title)}` +
      `&prop=imageinfo&iiprop=url&format=json&origin=*`;

    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), FETCH_TIMEOUT_MS);
    const res2 = await fetch(infoUrl, { signal: controller2.signal });
    clearTimeout(timer2);
    if (!res2.ok) return null;

    const data2 = await res2.json();
    const pages = Object.values(data2?.query?.pages ?? {});
    const imgUrl = pages[0]?.imageinfo?.[0]?.url;
    return imgUrl || null;
  } catch {
    return null;
  }
}

// ── Strategy chain for one recipe ────────────────────────────────────────────
async function fixRecipe(recipe, browser) {
  // Strategy 1: re-scrape og:image from source page
  const ogUrl = await scrapeOgImage(recipe.source_url);
  if (ogUrl) return { url: ogUrl, strategy: 1 };

  // Strategy 2: Google Images
  const googleUrl = await searchGoogleImages(recipe.title, browser);
  if (googleUrl) return { url: googleUrl, strategy: 2 };

  // Strategy 3: Wikimedia Commons
  const wikiUrl = await searchWikimedia(recipe.title);
  if (wikiUrl) return { url: wikiUrl, strategy: 3 };

  return null;
}

// ── Sleep ─────────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  if (DRY_RUN) console.log("[DRY RUN] No changes will be written to the database.\n");

  const processedIds = loadCheckpoint();
  console.log(
    `Checkpoint: ${processedIds.size} recipes already processed (use --reset-checkpoint to start fresh)\n`
  );

  console.log(`Fetching recipes with image_status in [${TARGET_STATUSES.join(", ")}]...`);
  let recipes = await fetchBadRecipes();
  const todo = recipes.filter((r) => !processedIds.has(r.id));
  const limited = LIMIT < Infinity ? todo.slice(0, LIMIT) : todo;

  console.log(
    `${recipes.length} total bad recipes, ${todo.length} unprocessed, processing ${limited.length}\n`
  );

  if (limited.length === 0) {
    console.log("Nothing to do. Run flag-image-issues.mjs first if this seems wrong.");
    return;
  }

  const browser = await chromium.launch({ headless: true });

  let fixed = 0;
  let hidden = 0;
  let errors = 0;

  for (let i = 0; i < limited.length; i++) {
    const recipe = limited[i];
    const progress = `[${i + 1}/${limited.length}]`;

    try {
      const result = await fixRecipe(recipe, browser);

      if (result) {
        if (!DRY_RUN) {
          const { error } = await supabase
            .from("recipes")
            .update({ image_url: result.url, image_status: "ok" })
            .eq("id", recipe.id);
          if (error) throw new Error(error.message);
        }
        console.log(`${progress} [s${result.strategy}] fixed: ${recipe.title}`);
        fixed++;
      } else {
        if (!DRY_RUN) {
          const { error } = await supabase
            .from("recipes")
            .update({ image_status: "hidden" })
            .eq("id", recipe.id);
          if (error) throw new Error(error.message);
        }
        console.log(`${progress} [hidden] no image found: ${recipe.title}`);
        hidden++;
      }
    } catch (err) {
      console.error(`${progress} [error] ${recipe.title}: ${err.message}`);
      errors++;
    }

    processedIds.add(recipe.id);
    if (!DRY_RUN) saveCheckpoint(processedIds);

    if (i < limited.length - 1) await sleep(RATE_LIMIT_MS);
  }

  await browser.close();

  console.log("\n──────────────────────────────────────────");
  console.log(`Fixed:  ${fixed}`);
  console.log(`Hidden: ${hidden}`);
  console.log(`Errors: ${errors}`);
  if (!DRY_RUN) {
    console.log("\nRun flag-image-issues.mjs to reconcile and update final counts.");
    if (errors > 0) {
      console.log(`Re-run this script to retry the ${errors} errored recipes (they are not checkpointed).`);
    }
  }
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
