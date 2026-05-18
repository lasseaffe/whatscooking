import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { parseEnhancedStep, parseEnhancedDescription } from "@/lib/enhance/recipe-enhance-schema";
import type { EnhancedStep, EnhancedDescription } from "@/lib/types";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: recipe } = await supabase
    .from("recipes")
    .select("created_by, source")
    .eq("id", id)
    .single();

  if (!recipe || recipe.source !== "user" || recipe.created_by !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase.from("recipe_saves").delete().eq("recipe_id", id);
  await supabase.from("recipe_ratings").delete().eq("recipe_id", id);
  await supabase.from("recipes").delete().eq("id", id);
  return NextResponse.json({ deleted: true });
}

// PATCH updates instructions, instructions_enhanced, and/or description_enhanced for an owner-controlled recipe.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const id = (body as { id?: unknown }).id;
  const rawSteps = (body as { instructions_enhanced?: unknown }).instructions_enhanced;
  const rawDesc  = (body as { description_enhanced?: unknown }).description_enhanced;
  const rawPlain = (body as { instructions?: unknown }).instructions;
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = {};

  if (rawPlain !== undefined) {
    if (!Array.isArray(rawPlain)) return NextResponse.json({ error: "instructions must be array" }, { status: 400 });
    const cleaned = rawPlain
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());
    if (cleaned.length > 40) return NextResponse.json({ error: "too many steps (max 40)" }, { status: 400 });
    update.instructions = cleaned;
  }

  if (rawSteps !== undefined) {
    if (!Array.isArray(rawSteps)) return NextResponse.json({ error: "instructions_enhanced must be array" }, { status: 400 });
    const validated: EnhancedStep[] = [];
    for (let i = 0; i < rawSteps.length; i++) {
      const result = parseEnhancedStep(rawSteps[i]);
      if ("error" in result) return NextResponse.json({ error: `step ${i}: ${result.error}` }, { status: 400 });
      validated.push(result);
    }
    update.instructions_enhanced = validated;
  }

  if (rawDesc !== undefined) {
    if (rawDesc === null) {
      update.description_enhanced = null;
    } else {
      const result = parseEnhancedDescription(rawDesc);
      if ("error" in result) return NextResponse.json({ error: `description: ${result.error}` }, { status: 400 });
      update.description_enhanced = result as EnhancedDescription;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("created_by, source")
    .eq("id", id)
    .single();

  if (!recipe || recipe.source !== "user" || recipe.created_by !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase.from("recipes").update(update).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ updated: true, fields: Object.keys(update) });
}