/**
 * fix-bad-images-v2.mjs
 *
 * Improved image fixer — 5-strategy chain per recipe:
 *
 *   1. Re-scrape og:image / JSON-LD / article img from source_url
 *      (full browser-mimic headers + cookie consent bypass)
 *   2. DuckDuckGo image search via stealth Playwright
 *      (replaces Google Images which is bot-blocked)
 *   3. Pexels API (optional — set PEXELS_API_KEY in .env.local)
 *   4. Wikimedia Commons API (same as v1)
 *   5. Screenshot source page + upload to Supabase Storage
 *      (last resort — captures actual food photo from the recipe page)
 *
 * Usage:
 *   node scripts/fix-bad-images-v2.mjs
 *   node scripts/fix-bad-images-v2.mjs --limit 20
 *   node scripts/fix-bad-images-v2.mjs --dry-run
 *   node scripts/fix-bad-images-v2.mjs --status broken,missing
 *   node scripts/fix-bad-images-v2.mjs --status duplicate
 *   node scripts/fix-bad-images-v2.mjs --reset-checkpoint
 *   node scripts/fix-bad-images-v2.mjs --skip-screenshot   (skip strategy 5)
 */

import { loadEnv, makeSupabase } from "./lib/supabase-env.mjs";
import { launchStealthBrowser, closeBrowser } from "./lib/playwright-stealth.mjs";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = path.join(__dirname, ".fix-images-v2-checkpoint.json");
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const UNSPLASH_HOST = "images.unsplash.com";
const RATE_LIMIT_MS = 2_500;
const SCREENSHOT_EXTRA_MS = 5_000;
const FETCH_TIMEOUT_MS = 12_000;

const env = loadEnv();
const supabase = makeSupabase(env);
const PEXELS_KEY = env.PEXELS_API_KEY ?? null;

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const LIMIT = parseInt(getArg("--limit") ?? "0", 10) || Infinity;
const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset-checkpoint");
const SKIP_SCREENSHOT = process.argv.includes("--skip-screenshot");
const TARGET_STATUSES = (getArg("--status") ?? "broken,missing,fallback").split(",");

// ── Checkpoint ────────────────────────────────────────────────────────────────
function loadCheckpoint() {
  if (RESET || !fs.existsSync(CHECKPOINT_FILE)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8")).processed ?? []);
  } catch { return new Set(); }
}

function saveCheckpoint(ids) {
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({ processed: [...ids], updatedAt: new Date().toISOString() }, null, 2)
  );
}

// ── Fetch recipes ─────────────────────────────────────────────────────────────
async function fetchBadRecipes() {
  const PAGE = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, source_url, cuisine_type, image_status")
      .in("image_status", TARGET_STATUSES)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function isGoodUrl(url) {
  if (!url) return false;
  if (!url.startsWith("http")) return false;
  if (url.includes(UNSPLASH_HOST)) return false;
  if (url.includes("gstatic.com") || url.includes("google.com")) return false;
  if (url.includes(".svg")) return false;
  return true;
}

async function fetchWithHeaders(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
        ...opts.headers,
      },
      ...opts,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── Strategy 1: og:image + JSON-LD + article img ──────────────────────────────
async function scrapeSourceUrl(sourceUrl) {
  if (!sourceUrl) return null;
  try {
    const res = await fetchWithHeaders(sourceUrl);
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Meta tags
    const metaCandidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[property="og:image:secure_url"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      $('link[rel="image_src"]').attr("href"),
    ];

    for (const url of metaCandidates) {
      if (isGoodUrl(url)) return url;
    }

    // JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "{}");
        const entries = Array.isArray(data) ? data : [data];
        for (const entry of entries) {
          const img = entry.image;
          const candidates = Array.isArray(img) ? img : [img];
          for (const c of candidates) {
            const u = typeof c === "string" ? c : c?.url;
            if (isGoodUrl(u)) return u;
          }
        }
      } catch {}
      return undefined;
    });

    // Re-check after JSON-LD (structured return is tricky with cheerio .each)
    let jsonLdUrl = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      if (jsonLdUrl) return;
      try {
        const data = JSON.parse($(el).html() ?? "{}");
        const entries = Array.isArray(data) ? data : [data];
        for (const entry of entries) {
          const img = entry.image;
          const candidates = Array.isArray(img) ? img : [img];
          for (const c of candidates) {
            const u = typeof c === "string" ? c : c?.url;
            if (isGoodUrl(u)) { jsonLdUrl = u; return; }
          }
        }
      } catch {}
    });
    if (jsonLdUrl) return jsonLdUrl;

    // First <article> or <main> img with a real src
    const articleImg = $("article img[src^='https'], main img[src^='https'], .recipe img[src^='https']")
      .filter((_, el) => {
        const src = $(el).attr("src") ?? "";
        const w = parseInt($(el).attr("width") ?? "0", 10);
        const h = parseInt($(el).attr("height") ?? "0", 10);
        // Prefer larger images
        return isGoodUrl(src) && (w === 0 || w >= 200) && (h === 0 || h >= 150);
      })
      .first()
      .attr("src");

    if (articleImg) return articleImg;

    // Largest img by pixel count (width * height attrs)
    let bestImg = null;
    let bestPx = 0;
    $("img[src^='https']").each((_, el) => {
      const src = $(el).attr("src") ?? "";
      if (!isGoodUrl(src)) return;
      const w = parseInt($(el).attr("width") ?? "0", 10);
      const h = parseInt($(el).attr("height") ?? "0", 10);
      const px = w * h;
      if (px > bestPx) { bestPx = px; bestImg = src; }
    });
    return bestImg;
  } catch {
    return null;
  }
}

// ── Strategy 2: DuckDuckGo image search via stealth Playwright ────────────────
async function searchDuckDuckGo(recipeTitle, newStealthPage) {
  const query = `${recipeTitle} recipe food photo`;
  let page;
  try {
    page = await newStealthPage();

    // DuckDuckGo image search
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });

    // Wait for image tiles to appear
    await page.waitForSelector("[data-testid='result-image'] img, img.tile--img__img, .tile--img__img", {
      timeout: 10_000,
    }).catch(() => {});

    // Extract image URLs from result tiles
    const urls = await page.evaluate(() => {
      const imgs = document.querySelectorAll("[data-testid='result-image'] img, img.tile--img__img, .tile--img__img");
      const results = [];
      for (const img of imgs) {
        const src = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
        if (src.startsWith("https://") && !src.includes("duckduckgo.com")) {
          results.push(src);
        }
      }
      return results;
    });

    for (const url of urls) {
      if (isGoodUrl(url) && !url.includes("encrypted-tbn")) return url;
    }

    // Fallback: try DDG JSON API via vqd token
    const vqdMatch = await page.content().then((html) => html.match(/vqd=["']?([^"'&\s]+)/));
    if (vqdMatch?.[1]) {
      const vqd = vqdMatch[1];
      const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1&v7exp=a`;
      try {
        const res = await fetch(apiUrl, {
          headers: { "Referer": "https://duckduckgo.com/" },
        });
        if (res.ok) {
          const data = await res.json();
          const results = data?.results ?? [];
          for (const r of results) {
            if (isGoodUrl(r.image)) return r.image;
          }
        }
      } catch {}
    }

    return null;
  } catch {
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── Strategy 3: Pexels API ────────────────────────────────────────────────────
async function searchPexels(recipeTitle) {
  if (!PEXELS_KEY) return null;
  try {
    const query = `${recipeTitle} food`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetchWithHeaders(url, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.photos?.[0]?.src?.large ?? null;
  } catch {
    return null;
  }
}

// ── Strategy 4: Wikimedia Commons ────────────────────────────────────────────
async function searchWikimedia(recipeTitle) {
  try {
    const searchUrl =
      `${WIKIMEDIA_API}?action=query&list=search` +
      `&srsearch=${encodeURIComponent(recipeTitle + " food")}` +
      `&srnamespace=6&format=json&srlimit=5&origin=*`;

    const res = await fetchWithHeaders(searchUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const results = data?.query?.search ?? [];
    if (!results.length) return null;

    const title = results[0].title;
    const infoUrl =
      `${WIKIMEDIA_API}?action=query&titles=${encodeURIComponent(title)}` +
      `&prop=imageinfo&iiprop=url&format=json&origin=*`;

    const res2 = await fetchWithHeaders(infoUrl);
    if (!res2.ok) return null;

    const data2 = await res2.json();
    const pages = Object.values(data2?.query?.pages ?? {});
    return pages[0]?.imageinfo?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

// ── Strategy 5: Screenshot source page → Supabase Storage ────────────────────
async function screenshotSourcePage(recipe, newStealthPage) {
  if (SKIP_SCREENSHOT || !recipe.source_url) return null;

  let page;
  try {
    page = await newStealthPage();

    await page.goto(recipe.source_url, {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });

    // Wait for images to load
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    // Find the largest visible img in the top 800px of the page
    const imgInfo = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      let best = null;
      let bestArea = 0;

      for (const img of imgs) {
        if (!img.complete || !img.naturalWidth) continue;
        const rect = img.getBoundingClientRect();
        if (rect.top > 800) continue; // only top of page
        if (rect.width < 200 || rect.height < 150) continue;
        const area = rect.width * rect.height;
        if (area > bestArea) {
          bestArea = area;
          best = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            src: img.src,
          };
        }
      }
      return best;
    });

    if (!imgInfo || imgInfo.width < 200) return null;

    // Screenshot just the image element's bounding box
    const clip = {
      x: Math.max(0, Math.round(imgInfo.x)),
      y: Math.max(0, Math.round(imgInfo.y)),
      width: Math.round(imgInfo.width),
      height: Math.round(imgInfo.height),
    };

    const screenshotBuffer = await page.screenshot({ clip, type: "jpeg", quality: 85 });

    // Upload to Supabase Storage
    const filename = `${recipe.id}-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(filename, screenshotBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error(`  [screenshot] upload error: ${uploadError.message}`);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(filename);

    return publicUrl?.publicUrl ?? null;
  } catch (err) {
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── Strategy chain ────────────────────────────────────────────────────────────
async function fixRecipe(recipe, newStealthPage) {
  // 1. og:image + JSON-LD + article img
  const s1 = await scrapeSourceUrl(recipe.source_url);
  if (s1) return { url: s1, strategy: 1 };

  // 2. DuckDuckGo stealth search
  const s2 = await searchDuckDuckGo(recipe.title, newStealthPage);
  if (s2) return { url: s2, strategy: 2 };

  // 3. Pexels API
  const s3 = await searchPexels(recipe.title);
  if (s3) return { url: s3, strategy: 3 };

  // 4. Wikimedia Commons
  const s4 = await searchWikimedia(recipe.title);
  if (s4) return { url: s4, strategy: 4 };

  // 5. Screenshot source page → Storage
  const s5 = await screenshotSourcePage(recipe, newStealthPage);
  if (s5) return { url: s5, strategy: 5 };

  return null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  if (DRY_RUN) console.log("[DRY RUN] No changes will be written.\n");
  if (!PEXELS_KEY) console.log("[INFO] PEXELS_API_KEY not set — strategy 3 (Pexels) will be skipped.\n");
  if (SKIP_SCREENSHOT) console.log("[INFO] --skip-screenshot set — strategy 5 (page screenshot) disabled.\n");

  const processedIds = loadCheckpoint();
  console.log(`Checkpoint: ${processedIds.size} already processed (--reset-checkpoint to start fresh)\n`);

  console.log(`Fetching recipes with image_status in [${TARGET_STATUSES.join(", ")}]...`);
  const recipes = await fetchBadRecipes();
  const todo = recipes.filter((r) => !processedIds.has(r.id));
  const limited = LIMIT < Infinity ? todo.slice(0, LIMIT) : todo;

  console.log(`${recipes.length} total, ${todo.length} unprocessed, processing ${limited.length}\n`);

  if (!limited.length) {
    console.log("Nothing to do. Run flag-image-issues.mjs first if this seems wrong.");
    return;
  }

  const strategyNames = ["", "og:image/JSON-LD", "DuckDuckGo", "Pexels", "Wikimedia", "screenshot→Storage"];
  const { browser, newStealthPage } = await launchStealthBrowser();

  let fixed = 0, hidden = 0, errors = 0;
  const strategyCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let i = 0; i < limited.length; i++) {
    const recipe = limited[i];
    const progress = `[${i + 1}/${limited.length}]`;

    try {
      const result = await fixRecipe(recipe, newStealthPage);

      if (result) {
        if (!DRY_RUN) {
          const { error } = await supabase
            .from("recipes")
            .update({ image_url: result.url, image_status: "ok" })
            .eq("id", recipe.id);
          if (error) throw new Error(error.message);
        }
        const stratName = strategyNames[result.strategy] ?? `s${result.strategy}`;
        console.log(`${progress} [${stratName}] fixed: ${recipe.title}`);
        fixed++;
        strategyCounts[result.strategy]++;
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

    // Extra sleep after screenshot strategy (heavier operation)
    const lastStrategy = 5;
    const delay = RATE_LIMIT_MS + (fixed > 0 && strategyCounts[lastStrategy] > 0 ? SCREENSHOT_EXTRA_MS : 0);
    if (i < limited.length - 1) await sleep(RATE_LIMIT_MS);
  }

  await closeBrowser(browser);

  console.log("\n──────────────────────────────────────────");
  console.log(`Fixed:  ${fixed}`);
  console.log(`  via og:image/JSON-LD:  ${strategyCounts[1]}`);
  console.log(`  via DuckDuckGo:        ${strategyCounts[2]}`);
  console.log(`  via Pexels:            ${strategyCounts[3]}`);
  console.log(`  via Wikimedia:         ${strategyCounts[4]}`);
  console.log(`  via screenshot:        ${strategyCounts[5]}`);
  console.log(`Hidden: ${hidden}`);
  console.log(`Errors: ${errors}`);
  if (!DRY_RUN) {
    console.log("\nRun flag-image-issues.mjs to reconcile and update final counts.");
  }
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
