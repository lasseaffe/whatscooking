import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/household/preferences?member_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("member_id");
  if (!memberId) return NextResponse.json({ error: "member_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("member_ingredient_preferences")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}

// POST /api/household/preferences
// Body: { member_id, ingredient_text, sentiment, ingredient_id? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { member_id, ingredient_text, sentiment, ingredient_id } = body;

  if (!member_id || !ingredient_text || !sentiment) {
    return NextResponse.json({ error: "member_id, ingredient_text, sentiment required" }, { status: 400 });
  }

  // Verify ownership
  const { data: member } = await supabase
    .from("household_members")
    .select("id, filter_strictness")
    .eq("id", member_id)
    .eq("owner_user_id", user.id)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("member_ingredient_preferences")
    .insert({ member_id, ingredient_text: ingredient_text.trim(), sentiment, ingredient_id: ingredient_id ?? null, source: "reported" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Run inference check after insert (fire-and-forget)
  runInferenceCheck(supabase, member_id).catch(() => {});

  return NextResponse.json({ preference: data }, { status: 201 });
}

// DELETE /api/household/preferences?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefId = req.nextUrl.searchParams.get("id");
  if (!prefId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("member_ingredient_preferences")
    .delete()
    .eq("id", prefId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Lightweight inference: if member has 3+ dislikes/avoids in the same parent category,
// insert an inferred category-level preference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runInferenceCheck(supabase: any, memberId: string) {
  // Get all reported dislikes/avoids for this member with ingredient_id set
  const { data: prefs } = await supabase
    .from("member_ingredient_preferences")
    .select("ingredient_id, sentiment")
    .eq("member_id", memberId)
    .in("sentiment", ["dislike", "avoid"])
    .eq("source", "reported")
    .not("ingredient_id", "is", null);

  if (!prefs?.length) return;

  const ingredientIds = prefs.map((p: { ingredient_id: string }) => p.ingredient_id!);

  // Look up their parent categories
  const { data: cats } = await supabase
    .from("ingredient_categories")
    .select("id, name, parent_category_id")
    .in("id", ingredientIds);

  if (!cats) return;

  // Count by parent
  const parentCounts: Record<string, { count: number; name: string }> = {};
  for (const cat of cats) {
    if (!cat.parent_category_id) continue;
    if (!parentCounts[cat.parent_category_id]) {
      parentCounts[cat.parent_category_id] = { count: 0, name: "" };
    }
    parentCounts[cat.parent_category_id].count++;
  }

  for (const [parentId, { count }] of Object.entries(parentCounts)) {
    if (count < 3) continue;

    // Check no inferred preference for this category already exists
    const { data: existing } = await supabase
      .from("member_ingredient_preferences")
      .select("id")
      .eq("member_id", memberId)
      .eq("ingredient_id", parentId)
      .eq("source", "inferred")
      .maybeSingle();

    if (existing) continue;

    // Get parent category name
    const { data: parentCat } = await supabase
      .from("ingredient_categories")
      .select("name")
      .eq("id", parentId)
      .single();

    if (!parentCat) continue;

    await supabase.from("member_ingredient_preferences").insert({
      member_id: memberId,
      ingredient_text: parentCat.name,
      ingredient_id: parentId,
      sentiment: "dislike",
      source: "inferred",
    });
  }
}
