// src/app/api/world-cup/teams/route.ts
// Manage the nations a user roots for (wc_user_teams).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTeamByCode } from "@/lib/wc2026-teams";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ teams: [] });

  const { data, error } = await supabase
    .from("wc_user_teams")
    .select("nation_code, is_primary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teams: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { nation_code?: string; is_primary?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const code = body.nation_code?.trim();
  if (!code || !getTeamByCode(code)) {
    return NextResponse.json({ error: "Unknown team code" }, { status: 400 });
  }
  const isPrimary = body.is_primary === true;

  // Only one primary per user — clear existing primaries first.
  if (isPrimary) {
    await supabase
      .from("wc_user_teams")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .eq("is_primary", true);
  }

  const { error } = await supabase
    .from("wc_user_teams")
    .upsert(
      { user_id: user.id, nation_code: code, is_primary: isPrimary },
      { onConflict: "user_id,nation_code" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const code = new URL(request.url).searchParams.get("nation_code")?.trim();
  if (!code) return NextResponse.json({ error: "Missing nation_code" }, { status: 400 });

  const { error } = await supabase
    .from("wc_user_teams")
    .delete()
    .eq("user_id", user.id)
    .eq("nation_code", code);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
