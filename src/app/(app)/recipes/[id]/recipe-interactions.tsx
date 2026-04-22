"use client";

import { useState } from "react";
import { Star, Heart, MessageSquare, X, ChevronDown, ChevronUp, Check } from "lucide-react";

type Comment = {
  id: string;
  user_id: string;
  content: string;
  interest_tag: string | null;
  show_tag: boolean;
  created_at: string;
  profile: { full_name: string | null; id: string } | null;
};

type Rating = {
  taste: number | null;
  difficulty: number | null;
  prep_time_rating: number | null;
  value_for_effort: number | null;
  presentation: number | null;
  would_make_again: boolean | null;
};

const TAG_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  not_tried_yet:    { label: "Not tried yet", color: "#8A6A4A", bg: "#2A1808" },
  interested:       { label: "Interested 👀", color: "#6B9FD4", bg: "#1A2A3A" },
  tried_it:         { label: "Tried it ✅",   color: "#828E6F", bg: "#1A2010" },
  loving_it:        { label: "Loving it 😍",  color: "#C8522A", bg: "#2A1808" },
  my_go_to:         { label: "My go-to 🔥",   color: "#C8A030", bg: "#2A1A08" },
  favorited:        { label: "Favourited ⭐",  color: "#C8A030", bg: "#2A1A08" },
  original_creator: { label: "Original Creator 👑", color: "#C8A030", bg: "#2A1808" },
};

const RATING_FIELDS: { key: keyof Rating; label: string; description: string }[] = [
  { key: "taste",            label: "Taste",         description: "How good did it taste?" },
  { key: "difficulty",       label: "Difficulty",    description: "1 = very easy, 5 = very hard" },
  { key: "prep_time_rating", label: "Time accuracy", description: "1 = took much longer, 5 = spot on" },
  { key: "value_for_effort", label: "Value",         description: "Worth the time and ingredients?" },
  { key: "presentation",     label: "Presentation",  description: "How did it look on the plate?" },
];

function StarRow({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(n)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star className="w-5 h-5" fill={(hovered ?? value ?? 0) >= n ? "#C8522A" : "none"}
            style={{ color: (hovered ?? value ?? 0) >= n ? "#C8522A" : "#3A2416" }} />
        </button>
      ))}
    </div>
  );
}

export function RecipeInteractions({
  recipeId,
  userId,
  initialComments,
  initialSaved,
  myExistingRating,
  isOriginalCreator,
}: {
  recipeId: string;
  userId: string;
  initialComments: Comment[];
  initialSaved: boolean;
  myExistingRating: Rating | null;
  isOriginalCreator: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [savingState, setSavingState] = useState(false);

  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(!!myExistingRating);
  const [rating, setRating] = useState<Rating>(
    myExistingRating ?? { taste: null, difficulty: null, prep_time_rating: null, value_for_effort: null, presentation: null, would_make_again: null }
  );
  const [submittingRating, setSubmittingRating] = useState(false);

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [commentTag, setCommentTag] = useState<string>("");
  const [showTag, setShowTag] = useState(true);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  async function toggleSave() {
    setSavingState(true);
    if (saved) {
      await fetch(`/api/saves?recipe_id=${recipeId}`, { method: "DELETE" });
      setSaved(false);
    } else {
      await fetch("/api/saves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe_id: recipeId }) });
      setSaved(true);
    }
    setSavingState(false);
  }

  async function submitRating() {
    setSubmittingRating(true);
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, ...rating }),
    });
    setRatingSubmitted(true);
    setShowRatingForm(false);
    setSubmittingRating(false);
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError("");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipeId,
        content: commentText,
        interest_tag: commentTag || null,
        show_tag: showTag,
      }),
    });
    const json = await res.json();
    if (json.comment) {
      setComments((prev) => [json.comment, ...prev]);
      setCommentText("");
      setCommentTag("");
    } else {
      setCommentError("Failed to post comment.");
    }
    setSubmittingComment(false);
  }

  async function deleteComment(id: string) {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const effectiveTag = isOriginalCreator ? "original_creator" : (commentTag || null);
  void effectiveTag;

  return (
    <div className="space-y-8">
      {/* ── Action bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={toggleSave} disabled={savingState}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-105"
          style={{ borderColor: saved ? "#C8522A" : "#3A2416", background: saved ? "#2A1808" : "#1C1209", color: saved ? "#C8522A" : "#8A6A4A" }}>
          <Heart className="w-4 h-4" fill={saved ? "#C8522A" : "none"} />
          {saved ? "Saved" : "Save recipe"}
        </button>

        <button onClick={() => setShowRatingForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-105"
          style={{ borderColor: ratingSubmitted ? "#828E6F" : "#3A2416", background: ratingSubmitted ? "#1A2010" : "#1C1209", color: ratingSubmitted ? "#828E6F" : "#8A6A4A" }}>
          <Star className="w-4 h-4" fill={ratingSubmitted ? "#828E6F" : "none"} />
          {ratingSubmitted ? "Edit my rating" : "Rate this recipe"}
        </button>
      </div>

      {/* ── Rating form ── */}
      {showRatingForm && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "#EFE3CE" }}>Your rating</h3>
            <button onClick={() => setShowRatingForm(false)}><X className="w-4 h-4" style={{ color: "#6B4E36" }} /></button>
          </div>
          {RATING_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>{label}</p>
                <p className="text-xs" style={{ color: "#6B4E36" }}>{description}</p>
              </div>
              <StarRow value={rating[key] as number | null} onChange={(v) => setRating((r) => ({ ...r, [key]: v }))} />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <label className="text-sm font-medium" style={{ color: "#EFE3CE" }}>Would make again?</label>
            <div className="flex gap-2 ml-auto">
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setRating((r) => ({ ...r, would_make_again: v }))}
                  className="px-3 py-1 rounded-lg text-sm font-medium border transition-all"
                  style={{ borderColor: rating.would_make_again === v ? "#C8522A" : "#3A2416", background: rating.would_make_again === v ? "#2A1808" : "#161009", color: rating.would_make_again === v ? "#C8522A" : "#8A6A4A" }}>
                  {v ? "Yes 👍" : "Not really"}
                </button>
              ))}
            </div>
          </div>
          <button onClick={submitRating} disabled={submittingRating}
            className="w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C8522A", color: "#fff" }}>
            {submittingRating ? "Saving…" : "Submit rating"}
          </button>
        </div>
      )}

      {/* ── Comments ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4" style={{ color: "#C8522A" }} />
          <h3 className="font-semibold" style={{ color: "#EFE3CE" }}>
            Comments {comments.length > 0 && <span style={{ color: "#6B4E36" }}>({comments.length})</span>}
          </h3>
        </div>

        {/* Write comment */}
        <div className="rounded-2xl border p-4 mb-5" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your experience, tips, or variations…"
            rows={3}
            suppressHydrationWarning
            className="w-full text-sm resize-none focus:outline-none bg-transparent"
            style={{ color: "#EFE3CE" }}
          />

          {/* Tag selector */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {isOriginalCreator ? (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: TAG_LABELS.original_creator.bg, color: TAG_LABELS.original_creator.color }}>
                {TAG_LABELS.original_creator.label}
              </span>
            ) : (
              <div className="relative">
                <button onClick={() => setShowTagPicker((v) => !v)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
                  style={{ borderColor: "#3A2416", color: commentTag ? TAG_LABELS[commentTag]?.color : "#6B4E36", background: commentTag ? TAG_LABELS[commentTag]?.bg : "#161009" }}>
                  {commentTag ? TAG_LABELS[commentTag]?.label : "Add a tag (optional)"}
                  {showTagPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showTagPicker && (
                  <div className="absolute top-full left-0 mt-1 z-20 rounded-xl border shadow-lg p-2 flex flex-col gap-1 min-w-48"
                    style={{ background: "#1C1209", borderColor: "#3A2416" }}>
                    <button onClick={() => { setCommentTag(""); setShowTagPicker(false); }}
                      className="text-left text-xs px-3 py-2 rounded-lg hover:opacity-70" style={{ color: "#8A6A4A" }}>
                      No tag
                    </button>
                    {Object.entries(TAG_LABELS).filter(([k]) => k !== "original_creator").map(([key, { label, color, bg }]) => (
                      <button key={key} onClick={() => { setCommentTag(key); setShowTagPicker(false); }}
                        className="text-left text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                        style={{ background: commentTag === key ? bg : "transparent", color }}>
                        {commentTag === key && <Check className="w-3 h-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Show tag toggle */}
            {(commentTag || isOriginalCreator) && (
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "#6B4E36" }}>
                <input type="checkbox" checked={showTag} onChange={(e) => setShowTag(e.target.checked)} className="rounded" />
                Show tag publicly
              </label>
            )}

            <button onClick={submitComment} disabled={submittingComment || !commentText.trim()}
              className="ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "#C8522A", color: "#fff" }}>
              {submittingComment ? "Posting…" : "Post"}
            </button>
          </div>
          {commentError && <p className="text-xs mt-2" style={{ color: "#DC2626" }}>{commentError}</p>}
        </div>

        {/* Comment list */}
        <div className="flex flex-col gap-4">
          {comments.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: "#6B4E36" }}>No comments yet. Be the first!</p>
          )}
          {comments.map((c) => {
            const tag = c.show_tag ? c.interest_tag : null;
            const tagInfo = tag ? TAG_LABELS[tag] : null;
            const isOwn = c.user_id === userId;
            return (
              <div key={c.id} className="rounded-xl border p-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>
                    {c.profile?.full_name ?? "Anonymous"}
                  </span>
                  {tagInfo && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: tagInfo.bg, color: tagInfo.color }}>
                      {tagInfo.label}
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: "#6B4E36" }}>
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {isOwn && (
                    <button onClick={() => deleteComment(c.id)} className="hover:text-red-500">
                      <X className="w-3.5 h-3.5" style={{ color: "#6B4E36" }} />
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#EFE3CE" }}>{c.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
