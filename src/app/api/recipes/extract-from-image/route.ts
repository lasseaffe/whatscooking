import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif") || "image/jpeg";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Extract the recipe from this image. Return ONLY valid JSON with no markdown or explanation.

{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "cuisine_type": "e.g. Italian, Mexican, Asian",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "ingredients": [
    { "name": "ingredient name", "amount": "2", "unit": "cups" }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "dietary_tags": ["vegetarian", "gluten-free"],
  "dish_types": ["main course"]
}

Rules:
- If a field is unclear, use null or empty array
- dietary_tags only from: vegetarian, vegan, gluten-free, dairy-free, high-protein, keto, paleo, low-carb
- dish_types only from: main course, side dish, breakfast, soup, salad, dessert, snack, baking, drink
- Return valid JSON only, no commentary`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip any accidental markdown code fences
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const recipe = JSON.parse(cleaned);

    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("extract-from-image error:", err);
    return NextResponse.json({ error: "Failed to extract recipe from image" }, { status: 500 });
  }
}
