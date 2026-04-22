import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type SupportedMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const ALLOWED_TYPES: SupportedMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { image, mediaType } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const safeMediaType: SupportedMediaType = ALLOWED_TYPES.includes(mediaType)
      ? mediaType
      : "image/jpeg";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: safeMediaType,
                data: image,
              },
            },
            {
              type: "text",
              text: `Extract all food ingredients or grocery items visible in this image.
This can be a photo of a fridge, pantry, counter, or a grocery receipt — all are supported.
Return a JSON array of ingredient names only: lowercase, singular, no quantities.
Example: ["eggs","milk","cheddar","tomato","pasta"]
Return ONLY the JSON array, no markdown, no explanation.`,
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    let ingredients: string[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      ingredients = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      ingredients = [];
    }

    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error("[pantry/extract-from-photo]", error);
    return NextResponse.json({ error: "Failed to extract ingredients" }, { status: 500 });
  }
}
