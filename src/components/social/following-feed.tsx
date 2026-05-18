// src/components/social/following-feed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CookPostCard } from "./cook-post-card";
import type { CookPost } from "@/lib/types";

interface SuggestedCook {
  user_id: string;
  post_count: number;
  profile: { username: string; full_name: string | null; avatar_url: string | null } | null;
}

interface FeedResponse {
  posts: CookPost[];
  suggested_cooks: SuggestedCook[];
}

interface Props {
  currentUserId?: string;
}

export function FollowingFeed({ currentUserId }: Props) {
  const [posts, setPosts] = useState<CookPost[]>([]);
  const [suggestedCooks, setSuggestedCooks] = useState<SuggestedCook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  async function fetchPage(cursor?: string) {
    const url = cursor
      ? `/api/feed?cursor=${encodeURIComponent(cursor)}&limit=20`
      : "/api/feed?limit=20";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load feed");
    return res.json() as Promise<FeedResponse>;
  }

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }
    setLoading(true);
    fetchPage()
      .then((data) => {
        setPosts(data.posts);
        setSuggestedCooks(data.suggested_cooks);
        cursorRef.current = data.posts[data.posts.length - 1]?.created_at ?? null;
        setHasMore(data.posts.length === 20);
      })
      .catch(() => setError("Couldn't load feed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(cursorRef.current);
      setPosts((prev) => [...prev, ...data.posts]);
      cursorRef.current = data.posts[data.posts.length - 1]?.created_at ?? null;
      setHasMore(data.posts.length === 20);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!currentUserId) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm mb-3" style={{ color: "#8A6A4A" }}>Sign in to see what people you follow are cooking.</p>
        <Link href="/login" className="text-sm font-semibold" style={{ color: "#C8956C" }}>Sign in →</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#C8956C" }} />
      </div>
    );
  }

  if (error) {
    return <div className="py-16 text-center text-sm" style={{ color: "#E05A2B" }}>{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="py-12">
        <p className="text-center text-sm mb-6" style={{ color: "#8A6A4A" }}>
          You&apos;re not following anyone yet.
        </p>
        {suggestedCooks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "#5A3A24" }}>
              Active cooks to follow
            </p>
            <div className="space-y-2">
              {suggestedCooks.map((cook) => (
                <Link
                  key={cook.user_id}
                  href={`/profile/${cook.profile?.username ?? cook.user_id}`}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-colors"
                  style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}
                >
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "#2A1808", color: "#C8956C" }}>
                    {(cook.profile?.full_name ?? cook.profile?.username ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>
                      {cook.profile?.full_name ?? cook.profile?.username}
                    </p>
                    <p className="text-xs" style={{ color: "#8A6A4A" }}>{cook.post_count} cooks this month</p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#C8956C" }}>Follow →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <CookPostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "#C8956C" }} />
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs py-4" style={{ color: "#5A3A24" }}>You&apos;re all caught up 🍳</p>
      )}
    </div>
  );
}
