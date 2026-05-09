import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST /api/household/reactions
// Body: { recipe_id, reactions: Array<{ member_id, rating, notes?, disliked_ingredients?: string[] }> }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { recipe_id, reactions } = body as {
    recipe_id: string;
    reactions: Array<{
      member_id: string;
      rating: 1 | 2 | 3;
      notes?: string;
      disliked_ingredients?: string[];
    }>;
  };

  if (!recipe_id || !Array.isArray(reactions)) {
    return NextResponse.json({ error: "recipe_id and reactions array required" }, { status: 400 });
  }

  // Verify all member_ids belong to this user
  const memberIds = reactions.map((r) => r.member_id);
  const { data: ownedMembers } = await supabase
    .from("household_members")
    .select("id")
    .eq("owner_user_id", user.id)
    .in("id", memberIds);

  const ownedIds = new Set((ownedMembers ?? []).map((m: { id: string }) => m.id));
  const validReactions = reactions.filter((r) => ownedIds.has(r.member_id));

  if (!validReactions.length) return NextResponse.json({ saved: 0 });

  // Insert reactions
  const inserts = validReactions.map(({ member_id, rating, notes }) => ({
    member_id,
    recipe_id,
    rating,
    notes: notes ?? null,
    reported_by: user.id,
  }));

  const { data: saved, error } = await supabase
    .from("member_meal_reactions")
    .upsert(inserts, { onConflict: "member_id,recipe_id" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save any newly reported ingredient dislikes
  const preferenceInserts = validReactions.flatMap(({ member_id, disliked_ingredients }) =>
    (disliked_ingredients ?? []).map((ingredient_text) => ({
      member_id,
      ingredient_text,
      sentiment: "dislike" as const,
      source: "reported" as const,
    }))
  );

  if (preferenceInserts.length) {
    await supabase.from("member_ingredient_preferences").upsert(preferenceInserts, {
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({ saved: saved?.length ?? 0 });
}
