import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchMenuText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MenuScanner/1.0)",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 12000);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { restaurantName, url, menuText, dietaryFilters } = body as {
    restaurantName?: string;
    url?: string;
    menuText?: string;
    dietaryFilters?: string[];
  };

  if (!restaurantName && !menuText && !url) {
    return NextResponse.json({ error: "Provide at least a restaurant name, URL, or menu text" }, { status: 400 });
  }

  let rawContent = menuText ?? "";

  if (url && !menuText) {
    try {
      rawContent = await fetchMenuText(url);
    } catch (e) {
      return NextResponse.json({ error: `Could not fetch URL: ${e instanceof Error ? e.message : "unknown error"}` }, { status: 422 });
    }
  }

  const prompt = rawContent
    ? `The following is the raw content from a restaurant menu (possibly in a foreign language).
Parse it carefully, translate any non-English text to English (preserve original names too), and extract all dishes.

Restaurant: ${restaurantName ?? "Unknown"}
Raw menu content:
---
${rawContent.slice(0, 8000)}
---`
    : `Search your knowledge for the menu of this restaurant: "${restaurantName}".
If you don't know the exact menu, generate typical dishes that this type of restaurant would serve based on its name and likely cuisine.`;

  const dietNote = dietaryFilters && dietaryFilters.length > 0
    ? `\n\nFlag which dishes are suitable for these dietary preferences: ${dietaryFilters.join(", ")}.`
    : "";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: `You are a menu parsing and translation expert. Extract dishes from restaurant menus,
translate non-English text (Japanese, Arabic, Thai, Chinese, Korean, etc.) to English while preserving
original names, and provide helpful descriptions. Identify the cuisine type and provide dietary info.
Always respond with valid JSON only. No markdown fences.`,
    messages: [
      {
        role: "user",
        content: `${prompt}${dietNote}

Respond with this exact JSON structure (no markdown):
{
  "restaurant": {
    "name": "...",
    "cuisine": "...",
    "location": null
  },
  "dishes": [
    {
      "originalName": "...",
      "englishName": "...",
      "category": "starter|main|dessert|drink|side|snack|other",
      "description": "...",
      "price": null,
      "dietaryTags": [],
      "allergens": [],
      "spiceLevel": "mild|medium|hot|very_hot|none",
      "confidence": "high|medium|low"
    }
  ],
  "translationNote": null
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to parse menu" }, { status: 500 });
  }

  return NextResponse.json(parsed);
}
