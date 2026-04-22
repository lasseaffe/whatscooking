import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { occasion, guests, dietary, notes } = await req.json();

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Plan a perfect ${occasion} for ${guests || "4-6"} people${dietary ? ` (dietary: ${dietary})` : ""}${notes ? `. Notes: ${notes}` : ""}.

Return a JSON object with this structure:
{
  "theme": "string - creative theme name",
  "recipes": [{"name": "string", "description": "string", "course": "appetizer|main|dessert|drink"}],
  "decorations": ["string"],
  "activities": ["string"],
  "location": {"suggestion": "string", "alternatives": ["string"]},
  "timeline": [{"time": "string", "activity": "string"}],
  "shopping_highlights": ["string"],
  "ambiance": {"music": "string", "lighting": "string", "extras": "string"}
}

Respond with ONLY the JSON, no markdown.`
    }]
  });

  const response = await stream.finalMessage();
  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const plan = JSON.parse(text);
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Failed to parse plan" }, { status: 500 });
  }
}
