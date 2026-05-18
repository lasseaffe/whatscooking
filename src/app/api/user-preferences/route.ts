import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// PATCH /api/user-preferences — update arbitrary user preference fields
// Supports: baby_track_visible (boolean), share_activity (boolean)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.baby_track_visible === "boolean") {
      updates.baby_track_visible = body.baby_track_visible;
    }

    if (typeof body.share_activity === "boolean") {
      updates.share_activity = body.share_activity;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[user-preferences PATCH]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
