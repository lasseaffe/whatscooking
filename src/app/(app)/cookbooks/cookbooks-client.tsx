// src/app/(app)/cookbooks/cookbooks-client.tsx
"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { CookbookCover } from "@/components/cookbook-cover";

export type CookbookRow = {
  id: string; title: string; tagline: string | null; cover_image_url: string | null;
  theme_color: string; title_font: string; price: number; slug: string;
  view_count: number; created_at: string; recipeCount: number; recipeImages: string[];
  profiles: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

type Tab = "following" | "trending" | "newest" | "free" | "paid";

const TABS: { label: string; value: Tab }[] = [
  { label: "Following", value: "following" },
  { label: "Trending",  value: "trending" },
  { label: "Newest",    value: "newest" },
  { label: "Free",      value: "free" },
  { label: "Paid",      value: "paid" },
];

interface Props {
  initialCookbooks: CookbookRow[];
  userId: string | null;
  initialFollowedCreatorIds: string[];
}

export function CookbooksClient({ initialCookbooks, userId, initialFollowedCreatorIds }: Props) {
  const anyFollowed = initialFollowedCreatorIds.length > 0;
  const [tab, setTab] = useState<Tab>(anyFollowed ? "following" : "trending");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowedCreatorIds));
  const pendingRef = useRef<Set<string>>(new Set());

  const filtered = useMemo(() =>
    initialCookbooks
      .filter((cb) => {
        const creatorId = cb.profiles?.id ?? "";
        if (tab === "following") return followedIds.has(creatorId);
        if (tab === "free")      return cb.price === 0;
        if (tab === "paid")      return cb.price > 0;
        return true; // trending / newest show all
      })
      .sort((a, b) =>
        tab === "trending"
          ? b.view_count - a.view_count
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [initialCookbooks, tab, followedIds]
  );

  const toggleFollow = useCallback(async (creatorId: string) => {
    if (!userId || pendingRef.current.has(creatorId)) return;
    pendingRef.current.add(creatorId);

    let wasFollowing = false;
    setFollowedIds(prev => {
      wasFollowing = prev.has(creatorId);
      const next = new Set(prev);
      wasFollowing ? next.delete(creatorId) : next.add(creatorId);
      return next;
    });

    try {
      const res = await fetch("/api/cookbooks/follow", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: creatorId }),
      });
      if (!res.ok) throw new Error(`follow request failed: ${res.status}`);
    } catch {
      // rollback on error
      setFollowedIds(prev => {
        const next = new Set(prev);
        wasFollowing ? next.add(creatorId) : next.delete(creatorId);
        return next;
      });
    } finally {
      pendingRef.current.delete(creatorId);
    }
  }, [userId]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1 rounded-xl p-1 flex-wrap" style={{ background: "var(--wc-bg-card)" }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.value ? "var(--wc-terracotta)" : "transparent",
                color: tab === t.value ? "#fff" : "var(--wc-text)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link
          href="/cookbooks/new"
          className="ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--wc-terracotta)" }}
        >
          + New Cookbook
        </Link>
      </div>

      {/* Empty state for Following tab with no follows */}
      {tab === "following" && filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "var(--wc-border-subtle)" }}>
          <p className="text-2xl mb-3">👨‍🍳</p>
          <p className="font-semibold mb-1" style={{ color: "var(--wc-text)" }}>No cookbooks from people you follow yet</p>
          <p className="text-sm" style={{ color: "var(--wc-text-2)" }}>
            Switch to Trending or Newest and hit <strong>+ Follow</strong> on a creator.
          </p>
        </div>
      )}

      {tab !== "following" && filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "var(--wc-border-subtle)" }}>
          <p className="text-sm" style={{ color: "var(--wc-text-2)" }}>No cookbooks here yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cb) => {
          const creatorId = cb.profiles?.id ?? "";
          const isFollowing = followedIds.has(creatorId);
          const creatorName = cb.profiles?.username ?? cb.profiles?.full_name ?? "creator";

          return (
            <div key={cb.id} className="group relative block">
              <Link href={`/cookbooks/${cb.slug}`}>
                <CookbookCover
                  cookbook={cb}
                  recipeCount={cb.recipeCount}
                  creatorName={cb.profiles?.username ?? cb.profiles?.full_name ?? null}
                  creatorAvatar={cb.profiles?.avatar_url ?? null}
                  recipeImages={cb.recipeImages}
                />
              </Link>

              {/* Follow button — sits outside the Link to avoid nested <a> */}
              {userId && creatorId && cb.profiles?.id !== userId && (
                <button
                  onClick={() => toggleFollow(creatorId)}
                  aria-label={isFollowing ? `Unfollow ${creatorName}` : `Follow ${creatorName}`}
                  aria-pressed={isFollowing}
                  className="absolute bottom-3 right-3 text-xs font-semibold px-3 py-1 rounded-full transition-all"
                  style={{
                    background: isFollowing ? "rgba(255,255,255,0.15)" : "rgba(200,90,47,0.9)",
                    color: "white",
                    backdropFilter: "blur(4px)",
                    border: isFollowing ? "1px solid rgba(255,255,255,0.3)" : "none",
                  }}
                >
                  {isFollowing ? "Following ✓" : "+ Follow"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
