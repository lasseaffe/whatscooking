import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Curated Unsplash food photo IDs — deterministically assigned per recipe
const FOOD_PHOTOS = [
  "photo-1504674900247-0877df9cc836",
  "photo-1414235077428-338989a2e8c0",
  "photo-1476224203421-9ac39bcb3327",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1546069901-ba9599a7e63c",
  "photo-1512621776951-a57141f2eefd",
  "photo-1484723091739-30a097e8f929",
  "photo-1499028344343-cd173ffc68a9",
  "photo-1455619452474-d2be8b1e70cd",
  "photo-1432139509613-5c4255815697",
  "photo-1467003909585-2f8a72700288",
  "photo-1519708227418-c8fd9a32b7a2",
  "photo-1606851091851-e8c8c0fca5ba",
  "photo-1555939594-58d7cb561ad1",
  "photo-1567620905732-2d1ec7ab7445",
  "photo-1528735602780-2552fd46c7af",
  "photo-1567620832903-9fc6debc209f",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1504754524776-8f4f37790ca0",
  "photo-1473093295043-cdd812d0e601",
  "photo-1482049016688-2d3e1b311543",
  "photo-1505253716362-afaea1d3d1af",
  "photo-1563379926898-05f4575a45d8",
  "photo-1548940740-204726a19be3",
  "photo-1562802378-063ec186a863",
  "photo-1551183053-bf91798d9fe8",
  "photo-1549584526-c2a2e8dde7b0",
  "photo-1547592166-23ac45744acd",
  "photo-1601050690597-df0568f70950",
  "photo-1585937421612-70a008356fbe",
  "photo-1603133872878-684f208fb84b",
  "photo-1596560548464-f010549b84d7",
  "photo-1574484284002-952d92456975",
  "photo-1565958011703-44f9829ba187",
  "photo-1559847844-5315695dadae",
  "photo-1529042410759-befb1204b468",
  "photo-1498837167922-ddd27525d352",
  "photo-1484980972926-edee96e0960d",
  "photo-1571091718767-18b5b1457add",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickPhoto(recipeId: string): string {
  return `https://images.unsplash.com/${FOOD_PHOTOS[hashStr(recipeId) % FOOD_PHOTOS.length]}?w=800&q=80`;
}

/** Fetch the real Instagram caption via og:description — no browser needed. */
async function fetchInstagramCaption(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try og:description first (most reliable for IG)
    const ogMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
      ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);
    if (ogMatch) {
      return ogMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/");
    }
    return null;
  } catch {
    return null;
  }
}

/** Use Claude to structure a raw caption into recipe JSON. */
async function structureCaption(caption: string, hint: { title?: string; isHack?: boolean }): Promise<Record<string, unknown>> {
  const hackNote = hint.isHack
    ? "This is a cooking hack/technique post, not a traditional recipe."
    : "";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a culinary data extractor. ${hackNote}
Given this Instagram caption, extract a complete recipe.
${hint.title ? `Known title hint: ${hint.title}` : ""}

Return ONLY valid JSON. No markdown fences. No explanation.

{
  "title": "short descriptive recipe name",
  "description": "2-3 sentence appetising description",
  "cuisine_type": "one of: Italian, Asian, Mexican, American, Mediterranean, French, Indian, Middle Eastern, Japanese, Thai, Other",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 25,
  "calories": 420,
  "protein_g": 28,
  "carbs_g": 35,
  "fat_g": 18,
  "dietary_tags": [],
  "ingredients": [
    { "name": "ingredient name", "amount": 300, "unit": "g" }
  ],
  "instructions": [
    "Step 1: ...",
    "Step 2: ..."
  ]
}

Rules:
- dietary_tags only from: vegan, vegetarian, gluten-free, dairy-free, keto, paleo, low-carb, high-protein
- Include at least 5 ingredients and 4 steps
- Use null for unknown numeric fields

Caption:
${caption}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return start !== -1 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : {};
  }
}

/** Fallback: generate a plausible recipe from title + description alone. */
async function generateFromMeta(recipe: Record<string, unknown>): Promise<Record<string, unknown>> {
  const isHack = (recipe.dish_types as string[] | null)?.includes("hack") ?? false;
  const isPremiumPlaceholder =
    recipe.title === "Premium Recipe" ||
    String(recipe.description ?? "").includes("Exclusive recipe from our curated");

  let userPrompt: string;

  if (isHack) {
    userPrompt = `You are a professional chef. Write the full technique/hack as step-by-step instructions.

Title: ${recipe.title}
${recipe.description ? `Description: ${recipe.description}` : ""}
${recipe.source_url ? `Source: ${recipe.source_url}` : ""}

Return ONLY valid JSON:
{
  "title": "${recipe.title}",
  "description": "What this hack achieves (2-3 sentences)",
  "prep_time_minutes": 5,
  "cook_time_minutes": 0,
  "ingredients": [{ "name": "tool or ingredient needed", "amount": null, "unit": null }],
  "instructions": ["Step 1: ...", "Step 2: ..."]
}`;
  } else if (isPremiumPlaceholder) {
    const shortcode = String(recipe.source_url ?? "").match(/\/p\/([A-Za-z0-9_-]+)\//)?.[1]
      ?? String(recipe.id ?? "").slice(0, 8);
    userPrompt = `Invent a specific, real-sounding dish name inspired by code "${shortcode}" and write the full recipe.
Pick a style from: Italian pasta, Asian stir-fry, Mexican bowl, Mediterranean salad, French bistro, Indian curry, Japanese ramen, Middle Eastern mezze, American BBQ, Thai noodle.

Return ONLY valid JSON:
{
  "title": "Specific Dish Name",
  "cuisine_type": "Italian",
  "description": "Appetising 2-3 sentence description",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "calories": 480,
  "dietary_tags": [],
  "ingredients": [{ "name": "ingredient", "amount": 300, "unit": "g" }],
  "instructions": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."]
}
Include at least 6 ingredients and 5 steps.`;
  } else {
    userPrompt = `Create a complete recipe based on this Instagram post data.

Title: ${recipe.title}
${recipe.description ? `Description: ${recipe.description}` : ""}
${recipe.cuisine_type ? `Cuisine: ${recipe.cuisine_type}` : ""}
${recipe.source_url ? `Original post: ${recipe.source_url}` : ""}

Return ONLY valid JSON:
{
  "title": "${recipe.title}",
  "description": "2-3 sentence description",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 25,
  "calories": 420,
  "ingredients": [{ "name": "ingredient", "amount": 500, "unit": "g" }],
  "instructions": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}
Include at least 6 ingredients and 5 steps.`;
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return start !== -1 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : {};
  }
}

// POST /api/recipes/[id]/extract
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: recipe } = await supabase.from("recipes").select("*").eq("id", id).single();
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already fully extracted — return as-is
  if (
    recipe.instructions && (recipe.instructions as string[]).length > 2 &&
    recipe.ingredients && (recipe.ingredients as unknown[]).length >= 3 &&
    recipe.title !== "Premium Recipe"
  ) {
    return NextResponse.json({ recipe });
  }

  const isHack = (recipe.dish_types as string[] | null)?.includes("hack") ?? false;
  const isPremiumPlaceholder =
    recipe.title === "Premium Recipe" ||
    String(recipe.description ?? "").includes("Exclusive recipe from our curated");

  try {
    let extracted: Record<string, unknown> = {};

    // Step 1: Try to scrape the real Instagram caption
    const sourceUrl = recipe.source_url as string | null;
    if (sourceUrl?.includes("instagram.com")) {
      const caption = await fetchInstagramCaption(sourceUrl);
      if (caption && caption.length > 30) {
        extracted = await structureCaption(caption, {
          title: recipe.title !== "Premium Recipe" ? String(recipe.title ?? "") : undefined,
          isHack,
        });
      }
    }

    // Step 2: Fall back to generating from title/description if scrape failed
    if (!extracted.instructions || (extracted.instructions as unknown[]).length < 2) {
      extracted = await generateFromMeta(recipe as Record<string, unknown>);
    }

    const update: Record<string, unknown> = {};

    if (extracted.title && typeof extracted.title === "string" && isPremiumPlaceholder) {
      update.title = extracted.title;
    }
    if (extracted.cuisine_type && isPremiumPlaceholder) update.cuisine_type = extracted.cuisine_type;
    if (extracted.dietary_tags && isPremiumPlaceholder) update.dietary_tags = extracted.dietary_tags;

    if (extracted.description) update.description = extracted.description;
    if (extracted.servings) update.servings = extracted.servings;
    if (extracted.prep_time_minutes) update.prep_time_minutes = extracted.prep_time_minutes;
    if (extracted.cook_time_minutes) update.cook_time_minutes = extracted.cook_time_minutes;
    if (extracted.calories) update.calories = extracted.calories;
    if (extracted.protein_g) update.protein_g = extracted.protein_g;
    if (extracted.carbs_g) update.carbs_g = extracted.carbs_g;
    if (extracted.fat_g) update.fat_g = extracted.fat_g;
    if (extracted.ingredients) update.ingredients = extracted.ingredients;
    if (extracted.instructions) update.instructions = extracted.instructions;

    // Assign a fallback photo if there's no image yet
    if (!recipe.image_url || isPremiumPlaceholder) {
      update.image_url = pickPhoto(id);
    }

    // Derive difficulty from total time
    const totalTime =
      ((extracted.cook_time_minutes as number) ?? 0) +
      ((extracted.prep_time_minutes as number) ?? 0);
    update.difficulty_level = totalTime <= 25 ? "easy" : totalTime <= 60 ? "medium" : "hard";

    if (Object.keys(update).length > 0) {
      await supabase.from("recipes").update(update).eq("id", id);
    }

    return NextResponse.json({ recipe: { ...recipe, ...update } });
  } catch (err) {
    console.error("extract error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
