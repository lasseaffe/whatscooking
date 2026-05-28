import { NextRequest, NextResponse } from "next/server";
import { ai, getModel } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface Ingredient {
  name: string;
  amount?: number | null;
  unit?: string | null;
}

interface VoiceOracleRequest {
  query: string;
  recipeName: string;
  stepIndex: number;
  stepText: string;
  ingredients: Ingredient[];
}

export async function POST(req: NextRequest) {
  try {
    const body: VoiceOracleRequest = await req.json();
    const { query, recipeName, stepIndex, stepText, ingredients } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }
    if (query.length > 500) {
      return NextResponse.json({ error: "query too long" }, { status: 400 });
    }

    const sanitize = (s: string) => s.replace(/[\n\r]/g, " ").slice(0, 500);
    const safeQuery = sanitize(query);
    const safeRecipe = sanitize(recipeName ?? "");
    const safeStep = sanitize(stepText ?? "");

    const ingredientList = (ingredients ?? [])
      .map((i) => `${i.amount ?? ""}${i.unit ? " " + i.unit : ""} ${i.name}`.trim())
      .join(", ");

    const isRecovery =
      /too much|added too|messed up|wrong amount|mistake|burned|burnt|overcooked|oversalted/i.test(safeQuery);

    const completion = await ai.chat.completions.create({
      model: getModel(),
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: isRecovery
            ? "You are a calm, experienced chef helping someone recover from a cooking mistake. Give one specific, actionable rescue tip (2–3 sentences max). Be reassuring and practical. No lists, no headers."
            : "You are the Kitchen Oracle — a warm, knowledgeable cooking assistant. Answer the cook's question concisely (2–3 sentences max). Be specific to the recipe and current step. No lists, no headers.",
        },
        {
          role: "user",
          content: `Recipe: ${safeRecipe}\nStep ${stepIndex + 1}: ${safeStep}\nIngredients: ${ingredientList}\n\nQuestion: ${safeQuery}`,
        },
      ],
    });

    const answer = (completion as { choices: Array<{ message: { content: string } }> })
      .choices[0]?.message?.content?.trim() ?? "";

    if (!answer) {
      return NextResponse.json({ error: "No answer generated" }, { status: 500 });
    }

    return NextResponse.json({ answer, isRecovery });
  } catch (error) {
    console.error("[voice-oracle]", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
