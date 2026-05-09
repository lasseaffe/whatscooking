import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET — list all household_members for the user's kitchen groups
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find all kitchen_group_ids the user belongs to
    const { data: memberships } = await supabase
      .from("kitchen_group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberships?.length) return NextResponse.json({ members: [] });

    const groupIds = memberships.map((m) => m.group_id);

    const { data: members, error } = await supabase
      .from("household_members")
      .select(`
        *,
        milestones: member_milestones(*),
        allergens: member_allergens(*)
      `)
      .in("kitchen_group_id", groupIds)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ members: members ?? [] });
  } catch (err) {
    console.error("[family/members GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create a new household_member
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      kitchen_group_id: string;
      name: string;
      member_type: string;
      date_of_birth?: string;
    };

    if (!body.kitchen_group_id || !body.name || !body.member_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from("kitchen_group_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("group_id", body.kitchen_group_id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: member, error } = await supabase
      .from("household_members")
      .insert({
        kitchen_group_id: body.kitchen_group_id,
        name: body.name,
        member_type: body.member_type,
        date_of_birth: body.date_of_birth ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error("[family/members POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
