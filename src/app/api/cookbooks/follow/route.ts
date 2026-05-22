// src/app/api/cookbooks/follow/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { following_id } = await req.json() as { following_id: string };
  if (!following_id) return NextResponse.json({ error: "missing following_id" }, { status: 400 });

  const { error } = await supabase
    .from("profile_follows")
    .insert({ follower_id: user.id, following_id });

  if (error && error.code !== "23505") { // 23505 = unique violation (already following)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
