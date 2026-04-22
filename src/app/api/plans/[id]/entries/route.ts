import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/plans/[id]/entries
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase.from("meal_plans").select("user_id").eq("id", id).single();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: entries } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("meal_plan_id", id)
    .order("day_number")
    .order("position");

  return NextResponse.json(entries ?? []);
}

// PUT /api/plans/[id]/entries — replace all entries for this plan
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase.from("meal_plans").select("user_id").eq("id", id).single();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { entries } = await req.json();
  if (!Array.isArray(entries)) return NextResponse.json({ error: "entries must be an array" }, { status: 400 });

  // Replace all entries atomically
  await supabase.from("meal_entries").delete().eq("meal_plan_id", id);

  if (entries.length > 0) {
    const rows = entries.map((e, i) => ({
      meal_plan_id: id,
      recipe_id: e.recipe_id ?? null,
      day_number: e.day_number,
      meal_type: e.meal_type ?? "dinner",
      recipe_title: e.recipe_title ?? "",
      description: e.description ?? null,
      calories: e.calories ?? null,
      protein_g: e.protein_g ?? null,
      carbs_g: e.carbs_g ?? null,
      fat_g: e.fat_g ?? null,
      fiber_g: e.fiber_g ?? null,
      position: e.position ?? i,
    }));
    const { error } = await supabase.from("meal_entries").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Touch updated_at
  await supabase.from("meal_plans").update({ updated_at: new Date().toISOString() }).eq("id", id);

  return NextResponse.json({ ok: true });
}
