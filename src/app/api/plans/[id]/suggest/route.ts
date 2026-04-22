import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/plans/[id]/suggest
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase.from("meal_plans").select("*").eq("id", id).single();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { day_number, existing_titles = [], all_plan_titles = [], dietary_filters = [], nutritional_goals = {}, prompt = "" } = body;

  const { data: sampleRecipes } = await supabase
    .from("recipes")
    .select("title, calories, dietary_tags, dish_types")
    .in("source", ["curated", "ai", "spoonacular"])
    .not("dish_types", "cs", "{drink}")
    .not("dish_types", "cs", "{hack}")
    .not("dish_types", "cs", "{premium}")
    .limit(80);

  const recipeList = (sampleRecipes ?? [])
    .map((r) => {
      const tags = r.dietary_tags ?? [];
      const isMealPrep = tags.some((t: string) => t.toLowerCase().includes("meal prep") || t.toLowerCase().includes("batch"));
      return `- ${r.title}${isMealPrep ? " ★MEAL-PREP" : ""}${r.calories ? ` (${r.calories} kcal)` : ""}${tags.length ? ` [${tags.join(", ")}]` : ""}`;
    })
    .join("\n");

  const usedElsewhere = all_plan_titles.filter((t: string) => !existing_titles.includes(t));

  const message = `
You are a helpful meal planning assistant. Suggest meals for Day ${day_number} of a ${plan.duration_days}-day meal plan called "${plan.title}".

Dietary preferences: ${dietary_filters.length > 0 ? dietary_filters.join(", ") : "none specified"}
${nutritional_goals.calories ? `Daily calorie target: ${nutritional_goals.calories} kcal` : ""}
${nutritional_goals.protein_g ? `Protein target: ${nutritional_goals.protein_g}g` : ""}
${prompt ? `Special request: ${prompt}` : ""}

Already planned for TODAY (do not duplicate): ${existing_titles.length > 0 ? existing_titles.join(", ") : "nothing yet"}
Used on OTHER days (avoid repeating): ${usedElsewhere.length > 0 ? usedElsewhere.join(", ") : "none yet"}

★MEAL-PREP = great for batch cooking, good for lunch slots in a meal plan.

Available recipes from our database (prefer ★MEAL-PREP for lunch/dinner slots, suggest FROM these where possible):
${recipeList}

Return a JSON array of ${plan.meals_per_day ?? 3} meal suggestions for the day (covering breakfast, lunch, dinner and optionally snacks).
Return ONLY the JSON array, no markdown:
[
  {
    "meal_type": "breakfast",
    "recipe_title": "Name of dish",
    "description": "One sentence description with key ingredients",
    "calories": 450,
    "from_database": true
  }
]

IMPORTANT: Do NOT suggest any recipe already used today or on other days. Be varied across cuisines and protein sources.
`.trim();

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: message }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    let suggestions;
    try { suggestions = JSON.parse(cleaned); } catch {
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      suggestions = start !== -1 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : [];
    }
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("suggest error:", err);
    return NextResponse.json({ error: "AI unavailable" }, { status: 500 });
  }
}
