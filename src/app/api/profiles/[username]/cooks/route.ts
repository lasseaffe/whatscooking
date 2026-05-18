// src/app/api/profiles/[username]/cooks/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20") || 20, 50);

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("cook_posts")
    .select(`
      id, user_id, recipe_id, photo_url, note, created_at,
      profile:profiles!cook_posts_user_id_fkey(username, full_name, avatar_url),
      recipe:recipes(id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes),
      like_count:cook_post_likes(count),
      reply_count:recipe_comments!recipe_comments_post_id_fkey(count)
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: myLikes } = user && postIds.length > 0
    ? await supabase.from("cook_post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
    : { data: [] };

  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    like_count: (p.like_count as unknown as { count: number }[])?.[0]?.count ?? 0,
    reply_count: (p.reply_count as unknown as { count: number }[])?.[0]?.count ?? 0,
    liked_by_me: likedSet.has(p.id),
  }));

  return NextResponse.json({ posts: enriched });
}
