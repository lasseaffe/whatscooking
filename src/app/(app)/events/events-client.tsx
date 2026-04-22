"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, Calendar, MapPin, Music, ShoppingBag, Clock, Star } from "lucide-react";
import Link from "next/link";

const OCCASIONS = [
  { id: "date-night", label: "Date Night", emoji: "🌹", desc: "Romantic evening for two" },
  { id: "family-brunch", label: "Family Brunch", emoji: "🥞", desc: "Weekend gathering" },
  { id: "birthday-party", label: "Birthday Party", emoji: "🎂", desc: "Celebration for all ages" },
  { id: "movie-night", label: "Movie Night", emoji: "🎬", desc: "Snacks & cozy vibes" },
  { id: "dinner-party", label: "Dinner Party", emoji: "🍷", desc: "Elegant evening gathering" },
  { id: "game-night", label: "Game Night", emoji: "🎮", desc: "Fun for the whole crew" },
];

const COURSE_COLORS: Record<string, { bg: string; color: string }> = {
  appetizer: { bg: "#FEF3C7", color: "#92400E" },
  main: { bg: "#DCFCE7", color: "#166534" },
  dessert: { bg: "#FCE7F3", color: "#9D174D" },
  drink: { bg: "#DBEAFE", color: "#1E40AF" },
};

type EventPlan = {
  theme: string;
  recipes: { name: string; description: string; course: string }[];
  decorations: string[];
  activities: string[];
  location: { suggestion: string; alternatives: string[] };
  timeline: { time: string; activity: string }[];
  shopping_highlights: string[];
  ambiance: { music: string; lighting: string; extras: string };
};

export function EventsClient() {
  const [occasion, setOccasion] = useState<string | null>(null);
  const [guests, setGuests] = useState("4-6");
  const [dietary, setDietary] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePlan() {
    if (!occasion) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/events/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, guests, dietary, notes }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed");
      setPlan(json.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate plan");
    }
    setLoading(false);
  }

  const selectedOccasion = OCCASIONS.find(o => o.id === occasion);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0D0907", color: "#EFE3CE" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background: "rgba(13,9,7,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/discover"
          className="flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "#EFE3CE" }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-semibold tracking-widest uppercase" style={{ letterSpacing: "0.14em" }}>
            Event Planner
          </h1>
        </div>
        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        {!plan ? (
          <>
            {/* Occasion picker */}
            <div className="mb-8">
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontStyle: "italic", fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Plan your occasion
              </h2>
              <p className="text-sm mb-6 opacity-50">Pick the vibe and we'll craft the full experience.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {OCCASIONS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o.id)}
                    className="relative p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: occasion === o.id ? "rgba(200,82,42,0.15)" : "rgba(255,255,255,0.04)",
                      borderColor: occasion === o.id ? "#C8522A" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="text-3xl block mb-2">{o.emoji}</span>
                    <span className="font-semibold text-sm block" style={{ color: "#EFE3CE" }}>{o.label}</span>
                    <span className="text-xs opacity-50">{o.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="text-xs uppercase tracking-widest opacity-50 mb-2 block">Guests</label>
                <select
                  value={guests}
                  onChange={e => setGuests(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#EFE3CE",
                  }}
                >
                  {["2", "4-6", "6-8", "8-12", "12+"].map(g => (
                    <option key={g} value={g}>{g} people</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest opacity-50 mb-2 block">
                  Dietary needs (optional)
                </label>
                <input
                  value={dietary}
                  onChange={e => setDietary(e.target.value)}
                  placeholder="e.g. vegetarian, gluten-free, nut allergy..."
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#EFE3CE",
                  }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest opacity-50 mb-2 block">
                  Extra notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests, theme ideas, budget notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none resize-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#EFE3CE",
                  }}
                />
              </div>
            </div>

            {error && <p className="text-sm mb-4 text-red-400">{error}</p>}

            <button
              onClick={handlePlan}
              disabled={!occasion || loading}
              className="w-full py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg, #C8522A, #E8834A)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Crafting your experience...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Plan my {selectedOccasion?.label || "event"}
                </>
              )}
            </button>
          </>
        ) : (
          <div>
            {/* Reset */}
            <button
              onClick={() => { setPlan(null); setOccasion(null); }}
              className="flex items-center gap-2 text-sm mb-6 opacity-60 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" /> Plan a different event
            </button>

            {/* Theme header */}
            <div className="mb-8 text-center">
              <span className="text-4xl">{selectedOccasion?.emoji}</span>
              <h2
                className="mt-3 text-3xl font-bold"
                style={{
                  fontStyle: "italic",
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  color: "#EFE3CE",
                }}
              >
                {plan.theme}
              </h2>
              <p className="text-sm opacity-50 mt-1">{selectedOccasion?.label} · {guests} guests</p>
            </div>

            {/* Recipes */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                <Star className="w-3.5 h-3.5" /> Menu
              </h3>
              <div className="flex flex-col gap-2">
                {plan.recipes.map((r, i) => {
                  const c = COURSE_COLORS[r.course] ?? { bg: "#F5EDE4", color: "#3D2817" };
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {r.course}
                      </span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>{r.name}</p>
                        <p className="text-xs opacity-50">{r.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Timeline
              </h3>
              <div className="relative pl-4">
                <div
                  className="absolute left-0 top-0 bottom-0 w-px"
                  style={{ background: "rgba(200,82,42,0.3)" }}
                />
                {plan.timeline.map((t, i) => (
                  <div key={i} className="relative mb-3 pl-5">
                    <div
                      className="absolute left-[-3px] top-1.5 w-2 h-2 rounded-full"
                      style={{ background: "#C8522A" }}
                    />
                    <span className="text-xs font-bold" style={{ color: "#C8522A" }}>{t.time}</span>
                    <p className="text-sm opacity-70">{t.activity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorations + Activities */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3">Decorations</h3>
                <ul className="flex flex-col gap-1.5">
                  {plan.decorations.map((d, i) => (
                    <li key={i} className="text-xs opacity-70 flex items-start gap-1.5">
                      <span style={{ color: "#C8522A" }}>✦</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3">Activities</h3>
                <ul className="flex flex-col gap-1.5">
                  {plan.activities.map((a, i) => (
                    <li key={i} className="text-xs opacity-70 flex items-start gap-1.5">
                      <span style={{ color: "#C8522A" }}>✦</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Location */}
            <div
              className="mb-6 p-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Location
              </h3>
              <p className="text-sm" style={{ color: "#EFE3CE" }}>{plan.location.suggestion}</p>
              {plan.location.alternatives.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {plan.location.alternatives.map((alt, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(239,227,206,0.6)" }}
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ambiance */}
            <div
              className="mb-6 p-4 rounded-2xl"
              style={{
                background: "rgba(200,82,42,0.08)",
                border: "1px solid rgba(200,82,42,0.2)",
              }}
            >
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                <Music className="w-3.5 h-3.5" /> Ambiance
              </h3>
              <div className="flex flex-col gap-2">
                <p className="text-xs">
                  <span className="opacity-50">Music: </span>{plan.ambiance.music}
                </p>
                <p className="text-xs">
                  <span className="opacity-50">Lighting: </span>{plan.ambiance.lighting}
                </p>
                {plan.ambiance.extras && (
                  <p className="text-xs">
                    <span className="opacity-50">Extras: </span>{plan.ambiance.extras}
                  </p>
                )}
              </div>
            </div>

            {/* Shopping */}
            <div
              className="mb-8 p-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" /> Shopping Highlights
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {plan.shopping_highlights.map((item, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: "rgba(200,82,42,0.3)",
                      color: "#C8522A",
                      background: "rgba(200,82,42,0.05)",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handlePlan}
              className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 mb-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#EFE3CE",
              }}
            >
              <Loader2 className="w-4 h-4" /> Regenerate plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
