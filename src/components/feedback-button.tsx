"use client";

import { useState } from "react";
import { MessageSquare, X, Star, ThumbsUp, ThumbsDown, Send, Loader2, Gift, Users, ChevronRight } from "lucide-react";

interface FeedbackData {
  rating: number | null;
  would_recommend: boolean | null;
  category: string;
  message: string;
  email: string;
}

const CATEGORIES = [
  { value: "general",     label: "General feedback",      emoji: "💬" },
  { value: "feature",     label: "Feature wish",          emoji: "✨" },
  { value: "bug",         label: "Technical issue",       emoji: "🐛" },
  { value: "content",     label: "Recipe / content",      emoji: "🍽️" },
  { value: "design",      label: "Design & UX",           emoji: "🎨" },
];

const INCENTIVE_COPY = [
  "Leave a written review and unlock",
  "1 month Premium free",
  "just for sharing your thoughts!",
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "affiliate" | "done">("form");
  const [data, setData] = useState<FeedbackData>({
    rating: null,
    would_recommend: null,
    category: "general",
    message: "",
    email: "",
  });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  function reset() {
    setStep("form");
    setData({ rating: null, would_recommend: null, category: "general", message: "", email: "" });
    setAffiliateLink("");
    setCopiedLink(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  const isWrittenReview = data.message.trim().length >= 30;
  const canSubmit = data.rating !== null || data.would_recommend !== null || data.message.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      // Generate a mock affiliate link (server should return a real one)
      const code = json.affiliate_code ?? Math.random().toString(36).slice(2, 8).toUpperCase();
      setAffiliateLink(`${typeof window !== "undefined" ? window.location.origin : ""}/join?ref=${code}`);
    } catch {
      // Still proceed to done state on error
    }
    setSubmitting(false);
    setStep(isWrittenReview ? "affiliate" : "done");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
        style={{ background: "linear-gradient(135deg, #C8522A, #B07D56)", color: "#fff" }}
        aria-label="Give feedback"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Feedback</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(30,18,8,0.6)", backdropFilter: "blur(4px)" }}
            onClick={close}
          />

          {/* Modal */}
          <div
            className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl"
            style={{ background: "#1C1209" }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  {step === "done" ? "Thank you! 🎉" : step === "affiliate" ? "Share & earn Premium" : "Share your thoughts"}
                </h2>
                {step === "form" && (
                  <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>
                    Help us improve What's Cooking — your feedback matters
                  </p>
                )}
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
                style={{ background: "rgba(42,24,8,0.6)" }}>
                <X className="w-4 h-4" style={{ color: "#8A6A4A" }} />
              </button>
            </div>

            {/* ── Step: Form ── */}
            {step === "form" && (
              <div className="p-6 space-y-5">
                {/* Premium incentive banner */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #2A1A08, #3A2410)", border: "1px solid rgba(176,125,86,0.3)" }}>
                  <Gift className="w-5 h-5 shrink-0" style={{ color: "#C9A84C" }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#C9A84C" }}>
                      {INCENTIVE_COPY[0]} <span style={{ textDecoration: "underline" }}>{INCENTIVE_COPY[1]}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A6A4A" }}>{INCENTIVE_COPY[2]} Write 30+ characters to qualify.</p>
                  </div>
                </div>

                {/* Overall rating */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>Overall rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button"
                        onMouseEnter={() => setHoveredStar(n)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => setData((d) => ({ ...d, rating: n }))}
                        className="p-0.5 transition-transform hover:scale-110">
                        <Star className="w-8 h-8"
                          fill={(hoveredStar ?? data.rating ?? 0) >= n ? "#C8522A" : "none"}
                          style={{ color: (hoveredStar ?? data.rating ?? 0) >= n ? "#C8522A" : "#3A2416" }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Would recommend */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>Would you recommend What's Cooking?</p>
                  <div className="flex gap-2">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} onClick={() => setData((d) => ({ ...d, would_recommend: v }))}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                        style={{
                          background: data.would_recommend === v
                            ? v ? "rgba(130,142,111,0.2)" : "rgba(200,82,42,0.15)"
                            : "rgba(42,24,8,0.5)",
                          border: `1px solid ${data.would_recommend === v ? (v ? "#828E6F" : "#C8522A") : "#3A2416"}`,
                          color: data.would_recommend === v ? (v ? "#828E6F" : "#C8522A") : "#6B4E36",
                        }}>
                        {v ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                        {v ? "Yes!" : "Not yet"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>What type of feedback?</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button key={c.value} onClick={() => setData((d) => ({ ...d, category: c.value }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: data.category === c.value ? "var(--wc-pal-accent, #B07D56)" : "rgba(42,24,8,0.5)",
                          color: data.category === c.value ? "#fff" : "#6B4E36",
                          border: `1px solid ${data.category === c.value ? "#B07D56" : "#3A2416"}`,
                        }}>
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Written feedback */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: "#8A6A4A" }}>
                      Your message
                      {isWrittenReview && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C" }}>
                          ✓ Qualifies for free Premium
                        </span>
                      )}
                    </p>
                    <span className="text-xs" style={{ color: data.message.length >= 30 ? "#828E6F" : "#5A3A28" }}>
                      {data.message.length}/30 min
                    </span>
                  </div>
                  <textarea
                    value={data.message}
                    onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
                    placeholder="Tell us what you love, what could be better, or what features you'd like to see…"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none"
                    style={{ background: "#161009", borderColor: "#3A2416", color: "#EFE3CE" }}
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>
                    Your email <span style={{ color: "#5A3A28", fontWeight: 400 }}>(optional — to receive your free Premium)</span>
                  </p>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: "#161009", borderColor: "#3A2416", color: "#EFE3CE" }}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #C8522A, #B07D56)", color: "#fff" }}
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : <><Send className="w-4 h-4" /> Send feedback</>
                  }
                </button>
              </div>
            )}

            {/* ── Step: Affiliate ── */}
            {step === "affiliate" && (
              <div className="p-6 space-y-5">
                <div className="rounded-xl p-4 text-center"
                  style={{ background: "linear-gradient(135deg, #2A1A08, #3A2410)", border: "1px solid rgba(201,168,76,0.3)" }}>
                  <Gift className="w-10 h-10 mx-auto mb-3" style={{ color: "#C9A84C" }} />
                  <p className="text-base font-bold mb-1" style={{ color: "#C9A84C" }}>
                    You've unlocked 1 month of Premium! 🎉
                  </p>
                  <p className="text-xs" style={{ color: "#8A6A4A" }}>
                    We'll activate it on your account (or send it to your email) shortly.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" style={{ color: "#B07D56" }} />
                    <p className="text-sm font-bold" style={{ color: "#EFE3CE" }}>Share with a friend & both earn Premium</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#6B4E36" }}>
                    When a friend signs up through your link, you each get 1 month of Premium — completely free.
                  </p>

                  {affiliateLink && (
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-xl border text-xs truncate"
                        style={{ background: "#161009", borderColor: "#3A2416", color: "#8A6A4A" }}>
                        {affiliateLink}
                      </div>
                      <button
                        onClick={copyLink}
                        className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                        style={{ background: copiedLink ? "rgba(130,142,111,0.2)" : "rgba(176,125,86,0.2)", color: copiedLink ? "#828E6F" : "#B07D56", border: `1px solid ${copiedLink ? "#828E6F" : "#B07D56"}` }}>
                        {copiedLink ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-3 border" style={{ borderColor: "#3A2416", background: "rgba(42,24,8,0.3)" }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#8A6A4A" }}>How the affiliate works</p>
                  <div className="space-y-1.5 text-xs" style={{ color: "#5A3A28" }}>
                    <p>1. Share your unique link with friends</p>
                    <p>2. They sign up using your link</p>
                    <p>3. Both of you receive 1 month Premium free, automatically</p>
                    <p>4. No limits — share with as many people as you like</p>
                  </div>
                </div>

                <button onClick={() => setStep("done")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Step: Done ── */}
            {step === "done" && (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: "rgba(176,125,86,0.15)", border: "2px solid rgba(176,125,86,0.3)" }}>
                  <span style={{ fontSize: "2rem" }}>🙏</span>
                </div>
                <div>
                  <p className="text-base font-bold mb-2" style={{ color: "#EFE3CE" }}>Feedback received!</p>
                  <p className="text-sm" style={{ color: "#6B4E36" }}>
                    Your feedback helps us build a better cooking experience for everyone. We read every message.
                  </p>
                </div>
                <button onClick={close}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#fff" }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
