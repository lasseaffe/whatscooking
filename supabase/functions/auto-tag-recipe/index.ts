import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { recipe_id } = await req.json();
    if (!recipe_id) return new Response(JSON.stringify({ error: "recipe_id required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: recipe }, { data: allTags }] = await Promise.all([
      supabase.from("recipes").select("title, description, ingredients, instructions, cuisine_type, dietary_tags").eq("id", recipe_id).single(),
      supabase.from("wc_feature_tags").select("id, name, label"),
    ]);

    if (!recipe) return new Response(JSON.stringify({ error: "recipe not found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });

    const tagList = (allTags ?? []).map((t: { id: string; name: string; label: string }) => `${t.name}: ${t.label}`).join("\n");
    const ingredients = (recipe.ingredients as { name: string }[] ?? []).map((i) => i.name).join(", ");
    const instructions = (recipe.instructions as string[] ?? []).slice(0, 5).join(" ");

    const prompt = `You are a recipe tagging assistant for a meal-planning app. Analyze this recipe and return a JSON object.

Recipe: ${recipe.title ?? "Untitled"}
Cuisine: ${recipe.cuisine_type ?? "unknown"}
Description: ${recipe.description ?? ""}
Ingredients: ${ingredients}
Instructions (first steps): ${instructions}

Available feature tags (name: label):
${tagList}

Also identify utensils required from this list: pot, pan, oven, blender, food processor, grill, air fryer, slow cooker, instant pot, wok, steamer, microwave

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "tag_names": ["name1", "name2"],
  "required_utensils": ["utensil1", "utensil2"]
}

Select only the most relevant tags (2-6 max). Only include utensils that are clearly required, not optional.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    let parsed: { tag_names: string[]; required_utensils: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "invalid AI response", raw }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const tagMap = new Map((allTags ?? []).map((t: { id: string; name: string; label: string }) => [t.name, t.id]));
    const tagInserts = (parsed.tag_names ?? [])
      .filter((name) => tagMap.has(name))
      .map((name) => ({ recipe_id, tag_id: tagMap.get(name)!, ai_assigned: true }));

    const ops: Promise<unknown>[] = [];

    if (tagInserts.length > 0) {
      ops.push(
        supabase.from("wc_recipe_feature_tags")
          .upsert(tagInserts, { onConflict: "recipe_id,tag_id" }),
      );
    }

    const utensils = (parsed.required_utensils ?? []).filter((u) =>
      ["pot", "pan", "oven", "blender", "food processor", "grill", "air fryer", "slow cooker", "instant pot", "wok", "steamer", "microwave"].includes(u)
    );

    if (utensils.length > 0) {
      ops.push(
        supabase.from("recipes").update({ required_utensils: utensils }).eq("id", recipe_id),
      );
    }

    await Promise.all(ops);

    return new Response(
      JSON.stringify({ assigned_tags: tagInserts.length, required_utensils: utensils }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
