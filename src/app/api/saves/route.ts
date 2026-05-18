import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipe_id } = await req.json();
    if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

    await supabase.from("recipe_saves").upsert({ user_id: user.id, recipe_id });

    // Fire-and-forget: log to activity_feed only if user opted in
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("share_activity")
      .eq("user_id", user.id)
      .single();

    if (prefs?.share_activity) {
      supabase.from("activity_feed").insert({
        user_id: user.id,
        action_type: "saved",
        recipe_id,
      }).then(({ error: feedError }) => {
        if (feedError) console.error("[saves activity_feed]", feedError);
      });
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[saves POST]", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const recipe_id = searchParams.get("recipe_id");
    if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

    await supabase.from("recipe_saves").delete().eq("user_id", user.id).eq("recipe_id", recipe_id);
    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("[saves DELETE]", error);
    return NextResponse.json({ error: "Failed to unsave" }, { status: 500 });
  }
}
