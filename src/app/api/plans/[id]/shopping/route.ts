import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase.from("meal_plans").select("user_id").eq("id", id).single();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: entries } = await supabase
    .from("meal_entries")
    .select("recipe_id, recipe_title, day_number, meal_type")
    .eq("meal_plan_id", id);

  const allEntries = entries ?? [];

  // Entries WITH recipe_id — look up their ingredients
  const linkedIds = [...new Set(allEntries.filter((e) => e.recipe_id).map((e) => e.recipe_id as string))];

  const { data: recipes } = linkedIds.length > 0
    ? await supabase.from("recipes").select("id, title, ingredients").in("id", linkedIds)
    : { data: [] };

  // Entries WITHOUT recipe_id — try to find by title
  const unlinkdTitles = [...new Set(allEntries.filter((e) => !e.recipe_id).map((e) => (e.recipe_title ?? "").toLowerCase().trim()).filter(Boolean))];
  const { data: titleMatches } = unlinkdTitles.length > 0
    ? await supabase.from("recipes").select("id, title, ingredients").in("title", allEntries.filter((e) => !e.recipe_id).map((e) => e.recipe_title))
    : { data: [] };

  const allRecipes = [...(recipes ?? []), ...(titleMatches ?? [])];

  type IngRow = { name: string; amount?: number | null; unit?: string | null; from: string[]; category?: string };
  const ingredientMap = new Map<string, IngRow>();

  for (const recipe of allRecipes) {
    const ings = (recipe.ingredients ?? []) as { name: string; amount?: number; unit?: string }[];
    for (const ing of ings) {
      if (!ing.name?.trim()) continue;
      const key = ing.name.toLowerCase().trim();
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit, from: [], category: categorize(ing.name) });
      }
      const existing = ingredientMap.get(key)!;
      if (!existing.from.includes(recipe.title)) existing.from.push(recipe.title);
    }
  }

  // Unknown entries = those with no recipe_id AND no title match
  const matchedTitles = new Set((titleMatches ?? []).map((r) => r.title?.toLowerCase().trim()));
  const unknownEntries = allEntries
    .filter((e) => !e.recipe_id && !matchedTitles.has((e.recipe_title ?? "").toLowerCase().trim()))
    .map((e) => ({ recipeTitle: e.recipe_title, dayNumber: e.day_number, mealType: e.meal_type }));

  // Pantry matching — use fuzzy substring match (both directions)
  const { data: pantryItems } = await supabase.from("pantry_items").select("name").eq("user_id", user.id);
  const pantryNames = (pantryItems ?? []).map((p) => p.name.toLowerCase().trim());

  function inPantry(ingredientName: string): boolean {
    if (pantryNames.length === 0) return false;
    const ingLower = ingredientName.toLowerCase().trim();
    return pantryNames.some((pn) => {
      // exact match, or pantry item contains ingredient word, or ingredient contains pantry item word
      const ingWords = ingLower.split(/\s+/);
      const pantryWords = pn.split(/\s+/);
      return pn === ingLower ||
        ingWords.some((w: string) => w.length > 3 && pn.includes(w)) ||
        pantryWords.some((w: string) => w.length > 3 && ingLower.includes(w));
    });
  }

  const needed = Array.from(ingredientMap.values());
  const have = needed.filter((i) => inPantry(i.name));
  const missing = needed.filter((i) => !inPantry(i.name));

  const totalRecipes = allRecipes.length;

  return NextResponse.json({ missing, have, unknownEntries, totalRecipes });
}

// Simple ingredient categorizer (client-side friendly)
function categorize(name: string): string {
  const n = name.toLowerCase();
  if (/chicken|beef|pork|lamb|turkey|bacon|sausage|ham|duck|venison|steak|mince|ground meat|veal/.test(n)) return "Meat";
  if (/fish|salmon|tuna|cod|tilapia|shrimp|prawn|crab|lobster|clam|mussel|squid|anchov/.test(n)) return "Fish & Seafood";
  if (/milk|cream|butter|cheese|yogurt|yoghurt|egg|ricotta|mozzarella|parmesan|cheddar|feta|brie|gouda/.test(n)) return "Dairy & Eggs";
  if (/onion|garlic|carrot|potato|broccoli|spinach|lettuce|pepper|capsicum|mushroom|zucchini|courgette|cucumber|celery|corn|pea|tomato|kale|cabbage|leek|fennel|beet|beetroot|squash|pumpkin|aubergine|eggplant|asparagus|radish|chard|artichoke|scallion|spring onion|turnip|parsnip|sweet potato|yam/.test(n)) return "Vegetables";
  if (/lemon|lime|orange|apple|banana|berry|strawberry|raspberry|blueberry|grape|peach|plum|mango|pineapple|avocado|fig|cherry|apricot|melon|watermelon|pear|kiwi/.test(n)) return "Fruit";
  if (/basil|parsley|thyme|rosemary|oregano|cilantro|coriander|dill|mint|sage|bay leaf|tarragon|chive/.test(n)) return "Fresh Herbs";
  if (/cumin|paprika|cinnamon|ginger|turmeric|chili|chilli|cayenne|pepper|nutmeg|cardamom|clove|coriander seed|star anise|saffron|allspice/.test(n)) return "Spices";
  if (/pasta|rice|flour|bread|noodle|couscous|quinoa|oat|barley|bulgur|polenta|tortilla|pita/.test(n)) return "Grains & Bread";
  if (/bean|lentil|chickpea|tofu|tempeh|edamame|soy|peanut|walnut|almond|cashew|pecan|hazelnut|pistachio|sesame|seed|nut/.test(n)) return "Legumes & Nuts";
  if (/oil|olive|vinegar|soy sauce|tamari|worcestershire|fish sauce|oyster sauce|ketchup|mustard|mayo|mayonnaise|hot sauce|tahini|miso|hoisin|teriyaki/.test(n)) return "Oils & Sauces";
  if (/sugar|honey|maple|syrup|chocolate|cocoa|vanilla|baking powder|baking soda|yeast|cornstarch|cornflour|gelatin/.test(n)) return "Baking";
  if (/stock|broth|water|wine|beer|juice|coconut milk|coconut cream/.test(n)) return "Liquids";
  if (/salt|pepper flake|msg/.test(n)) return "Seasoning";
  return "Other";
}
