// src/app/api/cook-posts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipe_id, photo_url, note } = await req.json();

    const { data: post, error } = await supabase
      .from("cook_posts")
      .insert({
        user_id: user.id,
        recipe_id: recipe_id ?? null,
        photo_url: photo_url ?? null,
        note: note?.trim() ?? null,
      })
      .select("id, user_id, recipe_id, photo_url, note, created_at")
      .single();

    if (error) throw error;

    // Side-effect: log to activity_feed
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      action_type: "cooked",
      recipe_id: recipe_id ?? null,
      metadata: { cook_post_id: post.id },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[cook-posts POST]", error);
    return NextResponse.json({ error: "Failed to create cook post" }, { status: 500 });
  }
}
