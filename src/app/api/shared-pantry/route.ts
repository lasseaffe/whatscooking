import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "create") {
    const code = generateCode();
    const { data: pantry, error } = await supabase
      .from("shared_pantries")
      .insert({ name: body.name ?? "Shared Pantry", created_by: user.id, invite_code: code })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("shared_pantry_members").insert({
      pantry_id: pantry.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({ pantry, code });
  }

  if (body.action === "join") {
    const code = String(body.code ?? "").toUpperCase();
    if (!code || code.length !== 6) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    const { data: pantry } = await supabase
      .from("shared_pantries")
      .select("*")
      .eq("invite_code", code)
      .single();
    if (!pantry) return NextResponse.json({ error: "Pantry not found" }, { status: 404 });

    const { data: existing } = await supabase
      .from("shared_pantry_members")
      .select("pantry_id")
      .eq("pantry_id", pantry.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("shared_pantry_members").insert({
        pantry_id: pantry.id,
        user_id: user.id,
        role: "editor",
      });
    }

    return NextResponse.json({ pantry });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("shared_pantry_members")
    .select("role, shared_pantries(id, name, invite_code, created_by, created_at)")
    .eq("user_id", user.id);

  const pantries = (memberships ?? []).map((m) => ({
    ...(m.shared_pantries as Record<string, unknown>),
    role: m.role,
  }));

  return NextResponse.json(pantries);
}
