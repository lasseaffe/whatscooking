import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/household/reactions/[recipeId]
// Returns reactions for all household members for this recipe
export async function GET(_req: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipeId } = await params;

  const { data, error } = await supabase
    .from("member_meal_reactions")
    .select("*, member:household_members!inner(id, display_name, avatar_emoji, owner_user_id)")
    .eq("recipe_id", recipeId)
    .eq("member.owner_user_id", user.id)
    .order("cooked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reactions: data });
}
