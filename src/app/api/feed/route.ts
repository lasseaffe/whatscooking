// src/app/api/feed/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    // Get the list of users the current user follows
    const { data: follows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = (follows ?? []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      // Return suggested cooks when not following anyone
      const { data: suggested } = await supabase
        .from("cook_posts")
        .select(`
          user_id,
          profiles!cook_posts_user_id_fkey(username, full_name, avatar_url)
        `)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .neq("user_id", user.id)
        .limit(100);

      // Count posts per user and return top 3
      const countMap = new Map<string, { count: number; profile: unknown }>();
      for (const row of suggested ?? []) {
        const existing = countMap.get(row.user_id);
        countMap.set(row.user_id, {
          count: (existing?.count ?? 0) + 1,
          profile: row.profiles,
        });
      }
      const suggestedCooks = [...countMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([user_id, { count, profile }]) => ({ user_id, post_count: count, profile }));

      return NextResponse.json({ posts: [], suggested_cooks: suggestedCooks });
    }

    // Fetch paginated posts from followed users
    let query = supabase
      .from("cook_posts")
      .select(`
        id, user_id, recipe_id, photo_url, note, created_at,
        profile:profiles!cook_posts_user_id_fkey(username, full_name, avatar_url),
        recipe:recipes(id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes),
        like_count:cook_post_likes(count),
        reply_count:recipe_comments(count)
      `)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    // Check which posts the current user has liked
    const postIds = (posts ?? []).map((p) => p.id);
    const { data: myLikes } = postIds.length > 0
      ? await supabase
          .from("cook_post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)
      : { data: [] };

    const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

    const enriched = (posts ?? []).map((p) => ({
      ...p,
      like_count: (p.like_count as unknown as { count: number }[])?.[0]?.count ?? 0,
      reply_count: (p.reply_count as unknown as { count: number }[])?.[0]?.count ?? 0,
      liked_by_me: likedSet.has(p.id),
    }));

    return NextResponse.json({ posts: enriched, suggested_cooks: [] });
  } catch (error) {
    console.error("[feed GET]", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
