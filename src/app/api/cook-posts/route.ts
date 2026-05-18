// src/app/api/cook-posts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { recipe_id, photo_url, note } = body;

    // Validate inputs at the API boundary
    if (recipe_id !== undefined && recipe_id !== null && !UUID_RE.test(String(recipe_id))) {
      return NextResponse.json({ error: "Invalid recipe_id" }, { status: 400 });
    }
    if (photo_url !== undefined && photo_url !== null && typeof photo_url !== "string") {
      return NextResponse.json({ error: "Invalid photo_url" }, { status: 400 });
    }
    if (note !== undefined && note !== null && typeof note !== "string") {
      return NextResponse.json({ error: "Invalid note" }, { status: 400 });
    }

    const trimmedNote = typeof note === "string" ? note.trim().slice(0, 280) : null;

    const { data: post, error } = await supabase
      .from("cook_posts")
      .insert({
        user_id: user.id,
        recipe_id: recipe_id ?? null,
        photo_url: photo_url ?? null,
        note: trimmedNote || null,
      })
      .select("id, user_id, recipe_id, photo_url, note, created_at")
      .single();

    if (error) throw error;

    // Fire-and-forget side-effect: log to activity_feed
    supabase.from("activity_feed").insert({
      user_id: user.id,
      action_type: "cooked",
      recipe_id: recipe_id ?? null,
      metadata: { cook_post_id: post.id },
    }).then(({ error: feedError }) => {
      if (feedError) console.error("[cook-posts activity_feed]", feedError);
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[cook-posts POST]", error);
    return NextResponse.json({ error: "Failed to create cook post" }, { status: 500 });
  }
}
