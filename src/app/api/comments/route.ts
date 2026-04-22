import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipe_id, content, interest_tag, show_tag } = await req.json();
    if (!recipe_id || !content?.trim()) {
      return NextResponse.json({ error: "recipe_id and content required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("recipe_comments")
      .insert({
        user_id: user.id,
        recipe_id,
        content: content.trim(),
        interest_tag: interest_tag ?? null,
        show_tag: show_tag !== false,
      })
      .select("*, profile:profiles(full_name)")
      .single();

    if (error) throw error;
    return NextResponse.json({ comment: data });
  } catch (error) {
    console.error("[comments POST]", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const recipe_id = searchParams.get("recipe_id");
    if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

    const { data: comments } = await supabase
      .from("recipe_comments")
      .select("*, profile:profiles(full_name)")
      .eq("recipe_id", recipe_id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ comments: comments ?? [] });
  } catch (error) {
    console.error("[comments GET]", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await supabase.from("recipe_comments").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[comments DELETE]", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
