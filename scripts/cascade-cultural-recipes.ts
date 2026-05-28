// Run once: npx tsx scripts/cascade-cultural-recipes.ts
// Idempotent — safe to re-run.

import { createClient } from "@supabase/supabase-js";
import { CUISINES } from "../src/lib/cuisines";
import { titleMatchesTerms } from "../src/lib/cascade-matching";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RecipeRow {
  id: string;
  title: string;
  cuisine_type: string | null;
}

async function main() {
  console.log("Fetching all recipes…");
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, cuisine_type");

  if (error) throw new Error(`Supabase error: ${error.message}`);
  const rows = (recipes ?? []) as RecipeRow[];
  console.log(`  Found ${rows.length} recipes`);

  let updated = 0;
  let skipped = 0;

  for (const cuisine of CUISINES) {
    if (!cuisine.crossCultureBridges?.length && !cuisine.keyDishes?.length) continue;

    const terms: string[] = [
      ...(cuisine.keyDishes ?? []),
      ...(cuisine.crossCultureBridges ?? [])
        .map((b) => b.recipeMatch)
        .filter((m): m is string => Boolean(m)),
    ];

    for (const recipe of rows) {
      if (!titleMatchesTerms(recipe.title, terms)) continue;

      const matchingBridge = cuisine.crossCultureBridges?.find((b) =>
        b.recipeMatch
          ? recipe.title.toLowerCase().includes(b.recipeMatch.toLowerCase())
          : false
      );

      let cultural_journey = null;
      if (matchingBridge) {
        cultural_journey = {
          period: "Historical → present",
          stops: [
            { emoji: "🌍", name: matchingBridge.from.split(" ")[0], note: matchingBridge.from },
            { emoji: "🌉", name: "Fusion", note: "Cultural bridge" },
            { emoji: "🍽️", name: cuisine.name, note: `${cuisine.name} tradition` },
            { emoji: "🌐", name: "Global", note: "Worldwide adoption" },
          ],
        };
      }

      const heritage_notes = matchingBridge
        ? {
            originStory: matchingBridge.story,
            culturalOccasion:
              cuisine.culturalOccasions?.[0]?.replace(/^[^\s]+ /, "") ??
              `Part of ${cuisine.name} culinary tradition`,
            keyIngredientNote: `This dish is a cornerstone of ${cuisine.name} cuisine, reflecting its distinctive character.`,
          }
        : null;

      const { error: updateErr } = await supabase
        .from("recipes")
        .update({
          is_culturally_significant: true,
          cultural_journey,
          heritage_notes,
        })
        .eq("id", recipe.id);

      if (updateErr) {
        console.warn(`  ✗ ${recipe.title}: ${updateErr.message}`);
        skipped++;
      } else {
        console.log(`  ✓ ${recipe.title} [${cuisine.name}]`);
        updated++;
      }
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
