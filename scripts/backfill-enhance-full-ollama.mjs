/**
 * Backfill instructions_enhanced for all recipes where it is null.
 * Uses local Ollama for free, CPU-optimized inference.
 *
 * Usage:
 *   node scripts/backfill-enhance-full-ollama.mjs
 *   node scripts/backfill-enhance-full-ollama.mjs --dry-run
 *   node scripts/backfill-enhance-full-ollama.mjs --limit=20
 */

import http from "http";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ─── Config ────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1]) : null;
const CONCURRENCY = 1; // sequential — safest for slow CPU
const TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes per step

// ─── Load env ──────────────────────────────────────────────────────────────
function loadEnv(path) {
  const env = {};
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      // Strip inline comments
      const commentIdx = val.indexOf(" #");
      if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
      env[key] = val;
    }
  } catch {}
  return env;
}

const env = loadEnv(new URL("../.env.local", import.meta.url).pathname.slice(1));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL = env.OLLAMA_MODEL || "qwen3:8b";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Ollama call (native http, avoids IPv6 issues on Windows) ──────────────
function callOllama(prompt, temperature = 0.3, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    function done(fn, val) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      fn(val);
    }

    const body = JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      temperature,
      options: { think: false, num_predict: 400 },
    });

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 11434,
        path: "/api/generate",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          try {
            const data = JSON.parse(raw);
            done(resolve, data.response || "");
          } catch (e) {
            done(reject, new Error(`Ollama JSON parse error: ${e.message}`));
          }
        });
        res.on("error", (e) => done(reject, new Error(`Ollama response error: ${e.message}`)));
      }
    );

    // Print a dot every 10s so the terminal shows the script is alive
    const heartbeat = setInterval(() => process.stdout.write("."), 10_000);
    // Unref so the interval never prevents Node from exiting
    heartbeat.unref();

    // Timer fires if Ollama never finishes within the window.
    // NOTE: do NOT clear this on req "close" — that event fires when response
    // headers arrive (before the body), which would make us wait forever.
    const timer = setTimeout(() => {
      req.destroy();
      done(reject, new Error(`Ollama inference timeout (${timeoutMs / 1000}s)`));
    }, timeoutMs);

    req.on("error", (e) => {
      // ECONNRESET is expected when we destroy the socket on timeout — ignore it
      // if we've already settled (the timeout reject already fired).
      if (!settled) done(reject, new Error(`Ollama error: ${e.message}`));
    });
    req.write(body);
    req.end();
  });
}

// ─── JSON extraction ───────────────────────────────────────────────────────
function extractJSON(text) {
  // Strip <think>...</think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip markdown fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  // Find first { ... }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function isValidEnhancedStep(obj) {
  if (!obj || typeof obj !== "object") return false;
  return (
    typeof obj.header === "string" && obj.header.trim().length > 0 &&
    typeof obj.body_text === "string" && obj.body_text.trim().length > 0 &&
    obj.skill &&
    typeof obj.skill.beginner === "string" &&
    typeof obj.skill.pro === "string" &&
    Array.isArray(obj.jargon) &&
    typeof obj.visual_strategy === "string"
  );
}

// ─── Per-step enhancement ──────────────────────────────────────────────────
async function enhanceStep(stepText, title, stepIndex, totalSteps) {
  const prompt = `You are a culinary writing assistant. Given a recipe step, produce a JSON object with exactly these fields:

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

Recipe: ${title}
Step ${stepIndex + 1} of ${totalSteps}: ${stepText}

Respond with ONLY the JSON object. No explanation, no markdown, no prose before or after. /no_think`;

  const fallback = {
    header: stepText.split(".")[0].slice(0, 60).trim() || "Prepare step",
    body_text: stepText,
    skill: { beginner: "", pro: "" },
    jargon: [],
    visual_strategy: "",
  };

  // Attempt 1
  try {
    const raw = await callOllama(prompt, 0.3);
    const parsed = extractJSON(raw);
    if (isValidEnhancedStep(parsed)) return parsed;
  } catch (e) {
    process.stdout.write(` [timeout]`);
    return fallback;
  }

  // Attempt 2 (lower temp)
  process.stdout.write(" [retry]");
  try {
    const raw2 = await callOllama(prompt, 0.1);
    const parsed2 = extractJSON(raw2);
    if (isValidEnhancedStep(parsed2)) return parsed2;
  } catch (e) {
    process.stdout.write(` [timeout]`);
  }

  // Fallback — save original text so recipe isn't lost
  return fallback;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📚 Full Recipe Enhancement Backfill (Ollama: ${MODEL})`);
  if (DRY_RUN) console.log("🔍 DRY RUN — no writes");
  console.log(`🎯 Using local model - FREE!\n`);

  // Fetch recipes needing enhancement
  let query = supabase
    .from("recipes")
    .select("id, title, ingredients, instructions")
    .is("instructions_enhanced", null)
    .order("id");

  if (LIMIT) query = query.limit(LIMIT);

  const { data: recipes, error } = await query;
  if (error) { console.error("Supabase fetch error:", error); process.exit(1); }
  if (!recipes || recipes.length === 0) {
    console.log("✅ All recipes already enhanced!");
    return;
  }

  const total = recipes.length;
  const startTime = Date.now();
  console.log(`📊 Found ${total} recipes to enhance\n`);

  let done = 0;
  let skipped = 0;

  for (const recipe of recipes) {
    const recipeStart = Date.now();
    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    const title = (recipe.title || "Untitled").slice(0, 40).padEnd(40);
    process.stdout.write(`[${done + skipped + 1}/${total}] (${elapsed}min) ${title} ... `);

    // Parse instructions into steps — handle string or array
    const raw = recipe.instructions || "";
    let steps;
    if (Array.isArray(raw)) {
      steps = raw.map((s) => (typeof s === "object" ? s.text || s.step || JSON.stringify(s) : String(s))).filter((s) => s.trim().length > 10);
    } else {
      steps = String(raw).split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 10);
    }

    if (steps.length === 0) {
      console.log("⏭️ SKIPPED (no steps)");
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`🔍 would enhance ${steps.length} steps`);
      done++;
      continue;
    }

    // Enhance each step sequentially — skip recipe after 2 consecutive timeouts
    const enhanced = [];
    let consecutiveTimeouts = 0;
    let skipRecipe = false;
    for (let i = 0; i < steps.length; i++) {
      const step = await enhanceStep(steps[i], recipe.title || "", i, steps.length);
      // Fallback steps have empty skill/visual — count them as timeouts
      if (!step.skill.beginner && !step.visual_strategy) {
        consecutiveTimeouts++;
        if (consecutiveTimeouts >= 3) { skipRecipe = true; break; }
      } else {
        consecutiveTimeouts = 0;
      }
      enhanced.push(step);
    }
    if (skipRecipe) {
      console.log(` ⏭️ SKIPPED (Ollama unresponsive on this recipe)`);
      skipped++;
      continue;
    }

    // Write to Supabase
    const { error: updateErr } = await supabase
      .from("recipes")
      .update({ instructions_enhanced: enhanced })
      .eq("id", recipe.id);

    const stepTime = ((Date.now() - recipeStart) / 1000).toFixed(1);
    if (updateErr) {
      console.log(`\n    ⚠️ Supabase write error: ${updateErr.message}`);
    } else {
      console.log(`✅ (${stepTime}s, ${steps.length} steps)`);
    }
    done++;
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n🎉 Done! ${done} enhanced, ${skipped} skipped in ${totalMin} minutes.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
