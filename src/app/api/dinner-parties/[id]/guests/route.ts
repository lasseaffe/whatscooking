import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/dinner-parties/[id]/guests — invite a guest
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, user_id, display_name } = body;

  if (!email && !user_id) {
    return NextResponse.json({ error: "email or user_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("dinner_party_guests")
    .insert({ party_id: id, email: email || null, user_id: user_id || null, display_name: display_name || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/dinner-parties/[id]/guests — update own RSVP
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rsvp, note } = await req.json();
  const { data, error } = await supabase
    .from("dinner_party_guests")
    .update({ rsvp, note, responded_at: new Date().toISOString() })
    .eq("party_id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/dinner-parties/[id]/guests?guest_id=xxx — remove guest (host only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const guestId = searchParams.get("guest_id");
  if (!guestId) return NextResponse.json({ error: "guest_id required" }, { status: 400 });

  // Only host can remove guests
  const { data: party } = await supabase
    .from("dinner_parties").select("host_id").eq("id", id).single();
  if (party?.host_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("dinner_party_guests").delete().eq("id", guestId);
  return NextResponse.json({ ok: true });
}
