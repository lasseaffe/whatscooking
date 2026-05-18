// src/components/social/cook-post-card.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageSquare, ChefHat, Clock } from "lucide-react";
import type { CookPost } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface Props {
  post: CookPost;
  currentUserId?: string;
}

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  const initials = (name ?? "?")[0].toUpperCase();
  if (url) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[rgba(180,120,60,0.3)]">
        <Image src={url} alt={name ?? "avatar"} width={36} height={36} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold border border-[rgba(180,120,60,0.3)]"
      style={{ background: "#2A1808", color: "#C8956C" }}
    >
      {initials}
    </div>
  );
}

export function CookPostCard({ post, currentUserId }: Props) {
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Array<{ id: string; content: string; created_at: string; profile: { username: string; full_name: string | null } | null }>>([]);
  const [replyInput, setReplyInput] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const username = post.profile?.username ?? "unknown";
  const displayName = post.profile?.full_name ?? username;
  const recipeName = post.recipe?.title ?? "a recipe";
  const recipeId = post.recipe?.id;
  const postTimeAgo = timeAgo(post.created_at);

  async function toggleLike() {
    if (!currentUserId) return;
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikeCount((c) => c + (optimisticLiked ? 1 : -1));
    try {
      await fetch(`/api/cook-posts/${post.id}/likes`, {
        method: optimisticLiked ? "POST" : "DELETE",
      });
    } catch {
      // Revert on error
      setLiked(!optimisticLiked);
      setLikeCount((c) => c + (optimisticLiked ? -1 : 1));
    }
  }

  async function loadReplies() {
    if (showReplies) { setShowReplies(false); return; }
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/cook-posts/${post.id}/replies`);
      const { replies: data } = await res.json();
      setReplies(data ?? []);
      setShowReplies(true);
    } finally {
      setLoadingReplies(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyInput.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/cook-posts/${post.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyInput }),
      });
      if (res.ok) {
        const { reply } = await res.json();
        setReplies((prev) => [...prev, reply]);
        setReplyInput("");
      }
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}
    >
      {/* Header: avatar + "[Name] cooked [Recipe]" */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Link href={`/profile/${username}`}>
          <Avatar url={post.profile?.avatar_url ?? null} name={displayName} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug" style={{ color: "#EFE3CE" }}>
            <Link href={`/profile/${username}`} className="font-semibold hover:underline">
              {displayName}
            </Link>
            {" cooked "}
            {recipeId ? (
              <Link href={`/recipes/${recipeId}`} className="font-semibold hover:underline" style={{ color: "#C8956C" }}>
                {recipeName}
              </Link>
            ) : (
              <span className="font-semibold" style={{ color: "#C8956C" }}>{recipeName}</span>
            )}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#5A3A24" }}>{postTimeAgo}</p>
        </div>
      </div>

      {/* Recipe chip */}
      {post.recipe && (
        <Link href={`/recipes/${post.recipe.id}`} className="flex items-center gap-3 mx-4 mb-3 rounded-xl p-3 transition-colors hover:opacity-90" style={{ background: "#2A1808" }}>
          {post.recipe.image_url && (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={post.recipe.image_url} alt={post.recipe.title} width={48} height={48} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>{post.recipe.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {post.recipe.cuisine_type && (
                <span className="text-xs" style={{ color: "#8A6A4A" }}>{post.recipe.cuisine_type}</span>
              )}
              {(post.recipe.prep_time_minutes ?? 0) + (post.recipe.cook_time_minutes ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "#8A6A4A" }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {(post.recipe.prep_time_minutes ?? 0) + (post.recipe.cook_time_minutes ?? 0)} min
                </span>
              )}
            </div>
          </div>
          <ChefHat style={{ width: 16, height: 16, color: "#5A3A24", flexShrink: 0 }} />
        </Link>
      )}

      {/* Note bubble */}
      {post.note && (
        <div className="mx-4 mb-3 rounded-xl px-4 py-3" style={{ background: "#221208" }}>
          <p className="text-sm italic leading-relaxed" style={{ color: "#C8956C" }}>&ldquo;{post.note}&rdquo;</p>
        </div>
      )}

      {/* Photo */}
      {post.photo_url && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden aspect-video relative">
          <Image src={post.photo_url} alt="Cook photo" fill className="object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: liked ? "#E05A2B" : "#5A3A24" }}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            style={{ width: 16, height: 16, fill: liked ? "#E05A2B" : "transparent", color: liked ? "#E05A2B" : "#5A3A24" }}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          type="button"
          onClick={loadReplies}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#5A3A24" }}
        >
          <MessageSquare style={{ width: 16, height: 16 }} />
          {(post.reply_count ?? 0) > 0 && <span>{post.reply_count}</span>}
          <span className="text-xs">{loadingReplies ? "Loading…" : showReplies ? "Hide" : "Reply"}</span>
        </button>
      </div>

      {/* Inline reply thread */}
      {showReplies && (
        <div className="border-t px-4 pt-3 pb-4 space-y-3" style={{ borderColor: "rgba(180,120,60,0.1)" }}>
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "#2A1808", color: "#C8956C" }}>
                {(reply.profile?.full_name ?? reply.profile?.username ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold mr-1.5" style={{ color: "#C8956C" }}>
                  {reply.profile?.full_name ?? reply.profile?.username}
                </span>
                <span className="text-xs" style={{ color: "#8A6A4A" }}>{reply.content}</span>
              </div>
            </div>
          ))}
          {currentUserId && (
            <form onSubmit={submitReply} className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Add a reply…"
                className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid rgba(180,120,60,0.2)" }}
                maxLength={280}
              />
              <button
                type="submit"
                disabled={!replyInput.trim() || submittingReply}
                className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                style={{ background: "#C8956C", color: "#1A0E04" }}
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
