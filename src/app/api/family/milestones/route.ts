import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { MILESTONE_KEYS, type MilestoneKey } from "@/lib/family-types";

export const runtime = "nodejs";

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

    if (!member_id || !MILESTONE_KEYS.includes(milestone_key)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

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

    const { member_id, milestone_key } = await req.json() as {
      member_id: string;
      milestone_key: MilestoneKey;
    };

    if (!member_id || !MILESTONE_KEYS.includes(milestone_key)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabase
      .from("member_milestones")
      .delete()
      .eq("member_id", member_id)
      .eq("milestone_key", milestone_key);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/milestones DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
