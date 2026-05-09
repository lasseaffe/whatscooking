import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { MILESTONE_LABELS, type MilestoneKey } from "@/lib/family-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipe_title, ingredients, milestone, member_name, context } = await req.json() as {
      recipe_title: string;
      ingredients: string[];
      milestone: MilestoneKey;
      member_name: string;
      context: "recipe_page" | "planner";
    };

    if (!recipe_title || !milestone || !member_name || !context) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stageLabel = MILESTONE_LABELS[milestone];
    if (!stageLabel) {
      return NextResponse.json({ error: "Invalid milestone" }, { status: 400 });
    }

    const systemPrompt = `You are a pediatric nutrition assistant for a family cooking app. You give practical, warm, evidence-based advice aligned with WHO and AAP guidelines. You never provide medical diagnoses, never contradict "consult your pediatrician" advice, and never present allergen introduction schedules as guaranteed safe. Always end with: "Always consult your pediatrician before introducing new foods."`;

    const userPrompt = context === "planner"
      ? `The family is making "${recipe_title}" tonight. ${member_name} is at the "${stageLabel}" stage. In 2 sentences, describe how to adapt this meal for ${member_name}. Be specific to the ingredients: ${ingredients.join(", ")}.`
      : `Ingredients: ${ingredients.join(", ")}. ${member_name} is at the "${stageLabel}" stage. Write a short preparation note (2-3 sentences) for preparing this recipe safely for ${member_name}. Be specific: texture, size, what to remove or substitute.`;

    const completion = await ai.chat.completions.create({
      model: "gpt-4o-mini", // will be overridden by ai.ts smart routing to local model
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = (completion as { choices: Array<{ message: { content: string | null } }> })
      .choices[0]?.message?.content ?? "";

    return NextResponse.json({ adaptation: text });
  } catch (err) {
    console.error("[family/adapt-recipe POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
