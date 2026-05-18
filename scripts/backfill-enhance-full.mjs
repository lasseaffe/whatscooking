#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
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
const anthropicKey = env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseKey || !anthropicKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Import the prompts from the codebase
import fs from "fs";
const promptContent = fs.readFileSync(
  resolve(__dirname, "../src/lib/enhance/recipe-enhance-prompt.ts"),
  "utf-8"
);

const COOKBOOK_VOICE_CONTRACT = `
Required Tone:
- Authoritative but not arrogant. The writer has cooked this dish many times.
- Concrete over abstract. Real times, real temperatures, real visual cues.
- Editorial second person ("you") or pure imperative. Never "we." Never "I."
- Restraint. Every word earns its place.

Voice Exemplars (learn from):
- Marcella Hazan: precise, opinionated, unsentimental
- Diana Henry: warm without gushing, story compressed into one line
- J. Kenji Lopez-Alt: technique-first, "here is why this works"
- Yotam Ottolenghi: ingredient-led, sensory, never purple

Anti-Models (NEVER):
- SEO recipe blogs ("Hey friends! Let's dive in!")
- Travel-writer purple prose ("sun-soaked hills of Provence")
- Bon Appetit-bro chumminess ("trust me on this one")
- Restaurant menu copy ("hand-crafted seasonal ingredients")

Banned Chatter Words:
just, actually, really, very, literally, honestly, basically, super, simply, without further ado, let's dive in, trust me, hey friends, guys, y'all, hands down

Banned Adjectives:
delicious, savory, tasty, mouthwatering, perfect, amazing, incredible, scrumptious, yummy, divine, heavenly, decadent, sumptuous, succulent

Punctuation:
- Proper capitalization, full sentences, one period per sentence
- Em-dashes in moderation. NO "..." for dramatic pause
- NO exclamation marks anywhere
- Inline foreign-language terms in plain text (renderer adds italics)
- Contractions required: don't, you'll, it's
`;

const RECIPE_DESCRIPTION_ENHANCE_PROMPT = `You are a Senior Cookbook Editor. Your goal is to write "Headnotes"—3 to 10 sentences of narrative prose that weave together the origin, technique, and mood of a recipe.

${COOKBOOK_VOICE_CONTRACT}

For every recipe, choose a DIFFERENT "Opening Hook" (rotate between these three):
1. The Sensory Hook: Start with a sound, smell, or texture (e.g., "Listen for the specific crackle...").
2. The Context Hook: Start with where this dish belongs (e.g., "This is the dish you make when the fridge is empty but the soul is tired...").
3. The Technique Hook: Start with the "secret" (e.g., "The trick here isn't the heat, but the patience...").

WRITING CONSTRAINTS:
- Tactile Verbs Only: Use: blister, lacquer, seep, collapse, shatter, fold, bloom, sizzle, puddle, crust, render, rest, weep, snap, crackle.
- Direct Address: Talk to the cook. Use "You're looking for...", "Don't be tempted to...", "You'll know it's done when..."
- Data Integration: Extract facts from the recipe (ingredients, origin, time) and weave them into prose naturally.
- Humanizer Post-Processor:
  1. Sentence Length Rhythm: Ensure no two consecutive sentences have the same word count.
  2. The "Warning": Include ONE honest "mentorship" moment (e.g., "It will look like a mess until the very last minute, but trust the process").
  3. Contractions: Always use "don't," "it's," "you'll" to keep the tone conversational.

OUTPUT FORMAT:
Provide ONLY a JSON object (no markdown, no code fences):
{
  "headnote_narrative": "3-10 sentences of prose",
  "tagline": "short hook <=25 words",
  "origin": {"cuisine": "specific label", "tradition": "1-sentence cultural role"},
  "technique_signature": "1-sentence defining method",
  "ingredient_signature": "1-sentence: 2-3 key ingredients + flavor logic",
  "audience": "1-sentence: who/when",
  "effort": {"time_feel": "e.g. 60 minutes, mostly hands-off", "skill_level": "beginner|intermediate|advanced", "forgiving": true|false}
}`;

const RECIPE_ENHANCE_SYSTEM_PROMPT = `You are a professional cookbook editor specializing in clear, authoritative recipe instructions. Your role is to enhance each step with a 5-field card structure that helps cooks succeed.

${COOKBOOK_VOICE_CONTRACT}

For each step, create:
- header: 3-6 word action title, verb-led (e.g., "Sear the salmon"). Must start with an action verb.
- body_text: What to do + why it matters + common pitfall. 2-4 sentences.
- skill: { beginner: "sensory cue", pro: "chef secret" }
- jargon: array of { term, definition } (0-2 entries max)
- visual_strategy: 1-sentence visual aid description

OUTPUT FORMAT:
Provide ONLY a JSON array of step objects (no markdown, no code fences):
[{"header":"...","body_text":"...","skill":{...},"jargon":[...],"visual_strategy":"..."}]`;

console.log("\n🔬 Full Recipe Enhancement Backfill (Claude Sonnet 4.6)");
console.log("⚠️  This will run on ALL recipes without instructions_enhanced or description_enhanced.\n");

async function enhanceWithClaude(recipe, target) {
  if (target === "instructions") {
    const prompt = `Recipe: "${recipe.title}"
Ingredients: ${recipe.ingredients.map((i) => `${i.name}${i.amount ? ` (${i.amount}${i.unit || ""})` : ""}`).join(", ")}

Steps to enhance:
${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: RECIPE_ENHANCE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```json\n?|\n?```$/g, "").trim();
    return JSON.parse(cleaned);
  } else {
    const prompt = `Recipe: "${recipe.title}"
Ingredients: ${recipe.ingredients
      .slice(0, 5)
      .map((i) => i.name)
      .join(", ")}
Current description: "${recipe.description || "(none)"}"`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: RECIPE_DESCRIPTION_ENHANCE_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```json\n?|\n?```$/g, "").trim();
    return JSON.parse(cleaned);
  }
}

async function backfillFull() {
  // Count total unenhanced recipes
  const { data: countData, error: countError } = await supabase
    .from("recipes")
    .select("id", { count: "exact" })
    .or("instructions_enhanced.is.null,description_enhanced.is.null");

  if (countError) {
    console.error("❌ Failed to count recipes:", countError);
    process.exit(1);
  }

  const totalToEnhance = countData.length;
  console.log(`📊 Found ${totalToEnhance} recipes to enhance\n`);
  console.log(`💰 Estimated cost: ~$${(totalToEnhance * 0.006).toFixed(2)} (at $0.006/recipe)`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(totalToEnhance / 60)} minutes (at 60 recipes/min)\n`);

  // Fetch recipes in batches
  let processed = 0;
  let enhanced = 0;
  let failed = 0;
  const failedRecipes = [];

  const batchSize = 100;
  let offset = 0;

  while (offset < totalToEnhance) {
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("id, title, description, ingredients, instructions")
      .or("instructions_enhanced.is.null,description_enhanced.is.null")
      .order("created_at", { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("❌ Failed to fetch batch:", error);
      break;
    }

    if (!recipes || recipes.length === 0) break;

    for (const recipe of recipes) {
      const progress = `[${processed + 1}/${totalToEnhance}]`;
      process.stdout.write(`${progress} ${recipe.title.slice(0, 40).padEnd(40)} ... `);

      try {
        let instructionsEnhanced = null;
        let descriptionEnhanced = null;

        // Enhance instructions if missing
        if (recipe.instructions && recipe.instructions.length > 0) {
          try {
            instructionsEnhanced = await enhanceWithClaude(recipe, "instructions");
          } catch (err) {
            console.error(`\n    Instructions error: ${err.message}`);
          }
        }

        // Enhance description if missing
        if (recipe.description || recipe.ingredients.length > 0) {
          try {
            descriptionEnhanced = await enhanceWithClaude(recipe, "description");
          } catch (err) {
            console.error(`\n    Description error: ${err.message}`);
          }
        }

        // Persist
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
          console.log(`⏭️ SKIPPED`);
        }
      } catch (err) {
        console.log(`❌ ERROR`);
        failed++;
        failedRecipes.push({ id: recipe.id, title: recipe.title, error: err.message });
      }

      processed++;
    }

    offset += batchSize;
  }

  console.log(`\n\n📊 Full Backfill Complete:`);
  console.log(`✅ Enhanced: ${enhanced}/${processed}`);
  console.log(`❌ Failed: ${failed}/${processed}`);

  if (failedRecipes.length > 0) {
    console.log(`\n⚠️  Failed recipes (first 20):`);
    failedRecipes.slice(0, 20).forEach(({ id, title, error }) => {
      console.log(`  - ${title} (${id}): ${error.slice(0, 60)}`);
    });
  }

  console.log(`\n✨ Backfill complete!`);
}

backfillFull().catch(console.error);
