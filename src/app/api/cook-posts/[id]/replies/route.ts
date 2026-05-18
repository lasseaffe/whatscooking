// src/app/api/cook-posts/[id]/replies/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: replies, error } = await supabase
    .from("recipe_comments")
    .select("id, user_id, content, created_at, profile:profiles(username, full_name, avatar_url)")
    .eq("post_id", id)
    .is("recipe_id", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: replies ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recipe_comments")
    .insert({
      user_id: user.id,
      post_id: id,
      recipe_id: null,
      content: content.trim(),
    })
    .select("id, user_id, content, created_at, profile:profiles(username, full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reply: data }, { status: 201 });
}
