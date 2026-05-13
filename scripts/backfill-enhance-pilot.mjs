#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const env = {};

try {
  const content = readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  });
} catch (err) {
  console.error("Failed to read .env.local:", err.message);
  process.exit(1);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OLLAMA_API = "http://localhost:11434/api/generate";
const MODEL = process.argv[2] || "qwen3:14b"; // Use qwen3:14b by default (best for structured text)
const PILOT_SIZE = 200;

console.log(`\n📚 Recipe Enhancement Pilot (Ollama: ${MODEL})`);
console.log(`🎯 Enhancing ${PILOT_SIZE} recipes...\n`);

async function callOllama(prompt, temperature = 0.3) {
  try {
    const response = await fetch(OLLAMA_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "";
  } catch (err) {
    console.error(`❌ Ollama error: ${err.message}`);
    throw err;
  }
}

async function enhanceInstructions(recipe) {
  const { title, ingredients, instructions } = recipe;
  const ingredientList = ingredients
    .slice(0, 10)
    .map((i) => `- ${i.name}${i.amount ? ` (${i.amount}${i.unit || ""})` : ""}`)
    .join("\n");

  const plainSteps = instructions.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join("\n");

  const prompt = `You are a cookbook editor enhancing recipe instructions. Transform each step into a structured JSON card with these fields:
- header: 3-5 word action title (e.g., "Sear the salmon")
- body_text: what to do, why, and a common pitfall
- skill: { beginner: sensory cue, pro: chef secret }
- jargon: [{term, definition}] (0-2 entries)
- visual_strategy: 1-sentence visual aid description

Recipe: "${title}"
Ingredients: ${ingredientList}
Steps to enhance:
${plainSteps}

Output ONLY a valid JSON array. No markdown, no code fences. Example structure:
[{"header":"Heat the oil","body_text":"...",skill:{...},jargon:[...],visual_strategy:"..."}]`;

  const response = await callOllama(prompt, 0.2);
  try {
    const cleaned = response.replace(/^```json\n?|\n?```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`  ⚠️ Failed to parse instructions JSON: ${err.message}`);
    return null;
  }
}

async function enhanceDescription(recipe) {
  const { title, description, ingredients, instructions } = recipe;
  const ingredientList = ingredients
    .slice(0, 5)
    .map((i) => i.name)
    .join(", ");

  const prompt = `You are a Senior Cookbook Editor writing a recipe headnote. Create editorial prose that weaves origin, technique, and mood.

Choose ONE opening hook (not always the same):
1. Sensory: "Listen for...", "The smell of...", "You'll know it's done when..."
2. Context: "This is the dish you make when...", "Perfect for..."
3. Technique: "The trick here isn't...", "The secret is..."

Rules:
- 3-10 sentences of narrative prose
- No banned adjectives (delicious, perfect, amazing, tasty, savory)
- Use tactile verbs (blister, sizzle, fold, bloom, collapse, shatter)
- Include ONE mentorship warning ("Don't be tempted to...", "It will look like...")
- Use contractions (don't, you'll, it's)
- No exclamation marks

Recipe: "${title}"
Ingredients: ${ingredientList}
Current description: "${description || '(none)'}"

Output ONLY a JSON object with these fields (no markdown):
{"headnote_narrative":"...","tagline":"...","origin":{"cuisine":"...","tradition":"..."},"technique_signature":"...","ingredient_signature":"...","audience":"...","effort":{"time_feel":"...","skill_level":"beginner|intermediate|advanced","forgiving":true|false}}`;

  const response = await callOllama(prompt, 0.3);
  try {
    const cleaned = response.replace(/^```json\n?|\n?```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`  ⚠️ Failed to parse description JSON: ${err.message}`);
    return null;
  }
}

async function backfillPilot() {
  // Fetch pilot recipes (first 200)
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, description, ingredients, instructions")
    .is("instructions_enhanced", null)
    .limit(PILOT_SIZE)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch recipes:", error);
    process.exit(1);
  }

  console.log(`Found ${recipes.length} recipes to enhance\n`);

  let enhanced = 0;
  let failed = 0;
  const failedRecipes = [];

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const progress = `[${i + 1}/${recipes.length}]`;

    try {
      process.stdout.write(`${progress} ${recipe.title.slice(0, 40).padEnd(40)} ... `);

      // Enhance instructions
      let instructionsEnhanced = null;
      if (recipe.instructions && recipe.instructions.length > 0) {
        instructionsEnhanced = await enhanceInstructions(recipe);
      }

      // Enhance description
      let descriptionEnhanced = null;
      if (recipe.description || recipe.ingredients.length > 0) {
        descriptionEnhanced = await enhanceDescription(recipe);
      }

      // Persist both
      if (instructionsEnhanced || descriptionEnhanced) {
        const { error: updateError } = await supabase
          .from("recipes")
          .update({
            instructions_enhanced: instructionsEnhanced,
            description_enhanced: descriptionEnhanced,
          })
          .eq("id", recipe.id);

        if (updateError) {
          console.log(`❌ UPDATE FAILED`);
          failed++;
          failedRecipes.push({ id: recipe.id, title: recipe.title, error: updateError.message });
        } else {
          console.log(`✅`);
          enhanced++;
        }
      } else {
        console.log(`⏭️ SKIPPED (no output)`);
      }
    } catch (err) {
      console.log(`❌ ERROR`);
      failed++;
      failedRecipes.push({ id: recipe.id, title: recipe.title, error: err.message });
    }

    // Small delay to avoid overwhelming Ollama
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n\n📊 Pilot Results:`);
  console.log(`✅ Enhanced: ${enhanced}/${recipes.length}`);
  console.log(`❌ Failed: ${failed}/${recipes.length}`);

  if (failedRecipes.length > 0) {
    console.log(`\n⚠️  Failed recipes (first 10):`);
    failedRecipes.slice(0, 10).forEach(({ id, title, error }) => {
      console.log(`  - ${title} (${id}): ${error}`);
    });
  }

  console.log(`\n✨ Pilot complete! Review results, then run full backfill with:`);
  console.log(`   npm run backfill:full`);
}

backfillPilot().catch(console.error);
