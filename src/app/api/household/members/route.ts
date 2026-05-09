import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/household/members — list current user's household members
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("household_members")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

// POST /api/household/members — create a new household member
// Body: { display_name, avatar_emoji?, age_group?, filter_strictness? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { display_name, avatar_emoji = "🧑", age_group = "adult", filter_strictness = "dislike" } = body;

  if (!display_name?.trim()) {
    return NextResponse.json({ error: "display_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("household_members")
    .insert({ owner_user_id: user.id, display_name: display_name.trim(), avatar_emoji, age_group, filter_strictness })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}
