// src/app/api/plans/[id]/pins/[recipeId]/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; recipeId: string }> },
) {
  const { id: planId, recipeId } = await ctx.params;
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

  const { error } = await supabase
    .from("meal_plan_pins")
    .delete()
    .eq("meal_plan_id", planId)
    .eq("recipe_id", recipeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; recipeId: string }> },
) {
  const { id: planId, recipeId } = await ctx.params;
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
  const priority = body?.priority;
  if (typeof priority !== "number") {
    return NextResponse.json({ error: "priority must be a number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meal_plan_pins")
    .update({ priority })
    .eq("meal_plan_id", planId)
    .eq("recipe_id", recipeId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pin: data });
}
