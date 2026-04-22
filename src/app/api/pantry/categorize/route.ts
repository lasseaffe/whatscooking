import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredients } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ categorized: {} });
    }

    const supabase = await createClient();
    const { data: categories } = await supabase
      .from("ingredient_categories")
      .select("id, name, emoji, color");

    if (!categories || categories.length === 0) {
      return NextResponse.json({ categorized: {} });
    }

    const categoryList = categories.map((c) => c.name).join(", ");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Categorise each ingredient into exactly one of these categories: ${categoryList}.
Return JSON only, no markdown, format: { "ingredient_name": "Category Name" }
Ingredients: ${ingredients.join(", ")}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);
    const categoryMap = new Map(categories.map((c) => [c.name, c]));

    const categorized: Record<string, { id: string; name: string; emoji?: string; color?: string }> = {};
    for (const [name, catName] of Object.entries(parsed)) {
      const cat = categoryMap.get(catName as string);
      if (cat) categorized[name] = cat;
    }

    return NextResponse.json({ categorized });
  } catch (error) {
    console.error("[pantry/categorize]", error);
    return NextResponse.json({ categorized: {} });
  }
}
