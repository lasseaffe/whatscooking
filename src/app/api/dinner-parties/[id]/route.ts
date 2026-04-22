import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/dinner-parties/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: party } = await supabase
    .from("dinner_parties")
    .select("*")
    .eq("id", id)
    .single();

  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: guests }, { data: comments }] = await Promise.all([
    supabase
      .from("dinner_party_guests")
      .select("*")
      .eq("party_id", id)
      .order("invited_at", { ascending: true }),
    supabase
      .from("dinner_party_comments")
      .select("*, profile:profiles(full_name, id)")
      .eq("party_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({ party, guests: guests ?? [], comments: comments ?? [] });
}

// PATCH /api/dinner-parties/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("dinner_parties")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("host_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/dinner-parties/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("dinner_parties").delete().eq("id", id).eq("host_id", user.id);
  return NextResponse.json({ ok: true });
}
