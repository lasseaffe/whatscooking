import { NextRequest, NextResponse } from "next/server";
import { ai, getModel } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Ingredient {
  name: string;
  amount?: number | null;
  unit?: string | null;
}

interface SOSTipsRequest {
  recipeTitle: string;
  ingredients: Ingredient[];
  steps: string[];
}

/**
 * POST /api/sos-tips
 * Generate one rescue tip per cooking step using AI
 *
 * Body:
 * {
 *   "recipeTitle": "Pasta Carbonara",
 *   "ingredients": [
 *     {"name": "eggs", "amount": 3, "unit": "whole"},
 *     {"name": "pasta", "amount": 1, "unit": "lb"}
 *   ],
 *   "steps": ["Boil water", "Cook pasta"]
 * }
 *
 * Response:
 * {
 *   "tips": ["Tip for step 1", "Tip for step 2"]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body: SOSTipsRequest = await req.json();
    const { recipeTitle, ingredients, steps } = body;

    if (!steps?.length) {
      return NextResponse.json({ error: "steps required" }, { status: 400 });
    }

    const ingredientList = ingredients
      .map((i) => `${i.amount ?? ""}${i.unit ? " " + i.unit : ""} ${i.name}`.trim())
      .join(", ");

    const stepsText = steps
      .map((s, i) => `Step ${i + 1}: ${s}`)
      .join("\n");

    const completion = await ai.chat.completions.create({
      model: getModel(),
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            "You are a calm, experienced chef assistant. For each cooking step provided, write one concise rescue tip (1–2 sentences) addressing the most common problem a home cook encounters at that exact step. Be specific to the ingredients listed. Write in second person, present tense. Respond ONLY with a JSON object with a \"tips\" key containing an array of strings — one string per step, in order. No markdown, no extra keys.",
        },
        {
          role: "user",
          content: `Recipe: ${recipeTitle}\nIngredients: ${ingredientList}\n\n${stepsText}`,
        },
      ],
    });

    let tips: string[] = [];
    try {
      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);
      tips = Array.isArray(parsed) ? parsed : (parsed.tips ?? []);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ tips });
  } catch (error) {
    console.error("[sos-tips]", error);
    return NextResponse.json(
      { error: "Failed to generate SOS tips" },
      { status: 500 }
    );
  }
}
