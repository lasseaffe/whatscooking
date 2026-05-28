// src/app/api/profile/track-intake/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { track_intake } = await req.json() as { track_intake: boolean };
    const { error } = await supabase.from("profiles").update({ track_intake }).eq("id", user.id);
    if (error) {
      console.error("[profile/track-intake]", error);
      return NextResponse.json({ error: "Failed to update preference" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
