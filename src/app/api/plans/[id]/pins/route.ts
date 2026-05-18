// src/app/api/plans/[id]/pins/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: planId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("user_id")
    .eq("id", planId)
    .single();
  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("meal_plan_pins")
    .select(`
      id, recipe_id, priority, pinned_at,
      recipe:recipes (id, title, image_url, cuisine_type, dietary_tags, dish_types,
                      prep_time_minutes, cook_time_minutes, calories,
                      protein_g, carbs_g, fat_g, batch_friendly)
    `)
    .eq("meal_plan_id", planId)
    .order("priority", { ascending: false })
    .order("pinned_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pins: data ?? [] });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: planId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("user_id")
    .eq("id", planId)
    .single();
  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const recipe_id = body?.recipe_id;
  const priority = typeof body?.priority === "number" ? body.priority : 0;
  if (!recipe_id) {
    return NextResponse.json({ error: "recipe_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meal_plan_pins")
    .upsert(
      { meal_plan_id: planId, recipe_id, priority },
      { onConflict: "meal_plan_id,recipe_id" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pin: data }, { status: 201 });
}
