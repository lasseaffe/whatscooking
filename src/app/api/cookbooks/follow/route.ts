// src/app/api/cookbooks/follow/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { following_id } = await req.json() as { following_id: string };
    if (!following_id) return NextResponse.json({ error: "missing following_id" }, { status: 400 });

    const { error } = await supabase
      .from("profile_follows")
      .insert({ follower_id: user.id, following_id });

    if (error && error.code !== "23505") { // 23505 = unique violation (already following)
      console.error("[cookbooks/follow POST]", error);
      return NextResponse.json({ error: "Failed to update follow" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { following_id } = await req.json() as { following_id: string };
    if (!following_id) return NextResponse.json({ error: "missing following_id" }, { status: 400 });

    const { error } = await supabase
      .from("profile_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", following_id);

    if (error) {
      console.error("[cookbooks/follow DELETE]", error);
      return NextResponse.json({ error: "Failed to update follow" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
