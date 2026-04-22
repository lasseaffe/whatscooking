import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/dinner-parties/[id]/comments
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabase
    .from("dinner_party_comments")
    .insert({ party_id: id, user_id: user.id, content: content.trim() })
    .select("*, profile:profiles(full_name, id)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/dinner-parties/[id]/comments?comment_id=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _partyId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("comment_id");
  if (!commentId) return NextResponse.json({ error: "comment_id required" }, { status: 400 });

  await supabase.from("dinner_party_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
