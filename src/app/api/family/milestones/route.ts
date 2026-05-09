import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { MILESTONE_KEYS, type MilestoneKey } from "@/lib/family-types";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST — confirm a milestone for a member
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { member_id, milestone_key } = await req.json() as {
      member_id: string;
      milestone_key: MilestoneKey;
    };

    if (!member_id || !UUID_RE.test(member_id) || !MILESTONE_KEYS.includes(milestone_key)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify caller belongs to the member's kitchen group
    const { data: memberRow } = await supabase
      .from("household_members")
      .select("kitchen_group_id")
      .eq("id", member_id)
      .maybeSingle();

    if (!memberRow) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const { data: membership } = await supabase
      .from("kitchen_group_members")
      .select("id")
      .eq("group_id", memberRow.kitchen_group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabase
      .from("member_milestones")
      .upsert(
        { member_id, milestone_key, confirmed_by: user.id },
        { onConflict: "member_id,milestone_key" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ milestone: data }, { status: 201 });
  } catch (err) {
    console.error("[family/milestones POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — un-confirm a milestone (remove)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const member_id = searchParams.get("member_id") ?? "";
    const milestone_key = (searchParams.get("milestone_key") ?? "") as MilestoneKey;

    if (!member_id || !UUID_RE.test(member_id) || !MILESTONE_KEYS.includes(milestone_key)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify caller belongs to the member's kitchen group
    const { data: memberRow } = await supabase
      .from("household_members")
      .select("kitchen_group_id")
      .eq("id", member_id)
      .maybeSingle();

    if (!memberRow) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const { data: membership } = await supabase
      .from("kitchen_group_members")
      .select("id")
      .eq("group_id", memberRow.kitchen_group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error, count } = await supabase
      .from("member_milestones")
      .delete({ count: "exact" })
      .eq("member_id", member_id)
      .eq("milestone_key", milestone_key);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (count === 0) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/milestones DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
