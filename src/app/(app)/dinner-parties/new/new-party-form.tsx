"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ArrowLeft, Repeat } from "lucide-react";
import Link from "next/link";

const THEMES = [
  "Italian Night 🍝", "BBQ Party 🔥", "Taco Tuesday 🌮", "French Bistro 🥐",
  "Japanese Feast 🍣", "Sunday Roast 🍖", "Moroccan Nights 🫖", "Greek Taverna 🫒",
  "Farm to Table 🌿", "Wine & Cheese 🧀", "Vegan Feast 🌱", "Comfort Food 🍲",
  "Cocktail Night 🍸", "Mocktail Party 🧃", "Speakeasy Night 🥃", "Aperitivo Hour 🍷",
  "Bottomless Brunch 🥂", "Tiki Night 🌴", "Garden Sangria Party 🍹",
  "Sports Night ⚽",
];

const COLORS = [
  "#C85A2F", "#4A6830", "#8C4A1A", "#1A4A8C",
  "#8C1A1A", "#2C6B1A", "#5C3C10", "#8C6820",
];

type Plan = { id: string; title: string };

interface GuestInput { email: string; display_name: string }

export function NewPartyForm({
  plans,
  defaultDate,
  watchPartyMatch,
  watchPartyHome,
  watchPartyAway,
}: {
  plans: Plan[];
  defaultDate?: string;
  watchPartyMatch?: string;
  watchPartyHome?: string;
  watchPartyAway?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState("");
  const [linkedPlanId, setLinkedPlanId] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("monthly");
  const [guests, setGuests] = useState<GuestInput[]>([{ email: "", display_name: "" }]);

  useEffect(() => {
    if (!watchPartyMatch || !watchPartyHome || !watchPartyAway) return;
    setTheme("Sports Night ⚽");
    setTitle(`${watchPartyHome} vs ${watchPartyAway} Watch Party ⚽`);
    setDescription(
      `World Cup 2026 match: ${watchPartyHome} vs ${watchPartyAway}. ` +
      `Suggest classic sports viewing foods (wings, nachos, sliders, dips, guacamole) ` +
      `plus 1–2 signature dishes from ${watchPartyHome} and ${watchPartyAway} cuisine.`
    );
  }, [watchPartyMatch, watchPartyHome, watchPartyAway]);

  function addGuest() { setGuests((g) => [...g, { email: "", display_name: "" }]); }
  function removeGuest(i: number) { setGuests((g) => g.filter((_, j) => j !== i)); }
  function updateGuest(i: number, field: keyof GuestInput, val: string) {
    setGuests((g) => g.map((guest, j) => j === i ? { ...guest, [field]: val } : guest));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setLoading(true);
    setError(null);

    const scheduled_at = new Date(`${date}T${time}:00`).toISOString();
    const validGuests = guests.filter((g) => g.email.trim()).map((g) => ({
      email: g.email.trim(),
      display_name: g.display_name.trim() || null,
    }));

    try {
      const res = await fetch("/api/dinner-parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          scheduled_at,
          location: location.trim() || undefined,
          theme: theme || undefined,
          linked_plan_id: linkedPlanId || undefined,
          max_guests: maxGuests ? parseInt(maxGuests) : undefined,
          cover_color: coverColor,
          is_recurring: isRecurring,
          recurrence_rule: isRecurring ? recurrenceRule : undefined,
          guests: validGuests,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create party");
      router.push(`/dinner-parties/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const inputStyle = {
    borderColor: "#E8D4C0",
    background: "#fff",
    color: "#3D2817",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Link href="/dinner-parties" className="flex items-center gap-1.5 text-xs" style={{ color: "#A69180" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to parties
      </Link>

      {/* Color picker */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#A69180" }}>
          Party Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setCoverColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: coverColor === c ? "#3D2817" : "transparent", transform: coverColor === c ? "scale(1.2)" : "scale(1)" }} />
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
          Party Name *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Friday Italian Night, Monthly Roast Club…"
          required
          className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
          style={inputStyle}
        />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Location + max guests */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Your place, a restaurant…"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
            Max Guests
          </label>
          <input
            type="number"
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
            placeholder="No limit"
            min={1}
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
          Theme
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {THEMES.map((t) => (
            <button key={t} type="button"
              onClick={() => setTheme(theme === t ? "" : t)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: theme === t ? coverColor : "#E8D4C0",
                background: theme === t ? `${coverColor}15` : "#fff",
                color: theme === t ? coverColor : "#6B5B52",
              }}>
              {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={THEMES.includes(theme) ? "" : theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Or type a custom theme…"
          className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What are you cooking? Any special notes for guests?"
          className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {/* Link to meal plan */}
      {plans.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#A69180" }}>
            Link Meal Plan (optional)
          </label>
          <select
            value={linkedPlanId}
            onChange={(e) => setLinkedPlanId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="">No meal plan linked</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Recurring */}
      <div className="rounded-xl border p-4" style={{ borderColor: "#E8D4C0", background: "#FFF8F0" }}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded"
          />
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4" style={{ color: "#C85A2F" }} />
            <span className="text-sm font-medium" style={{ color: "#3D2817" }}>Make this a recurring series</span>
          </div>
        </label>
        {isRecurring && (
          <div className="mt-3 pl-7">
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#6B5B52" }}>How often?</label>
            <div className="flex gap-2">
              {(["weekly", "biweekly", "monthly"] as const).map((rule) => (
                <button key={rule} type="button"
                  onClick={() => setRecurrenceRule(rule)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    borderColor: recurrenceRule === rule ? "#C85A2F" : "#E8D4C0",
                    background: recurrenceRule === rule ? "#FFF0E6" : "#fff",
                    color: recurrenceRule === rule ? "#C85A2F" : "#6B5B52",
                  }}>
                  {rule.charAt(0).toUpperCase() + rule.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "#A69180" }}>
              {recurrenceRule === "weekly" && "Every week on the same day"}
              {recurrenceRule === "biweekly" && "Every two weeks"}
              {recurrenceRule === "monthly" && "Same date each month"}
            </p>
          </div>
        )}
      </div>

      {/* Guests */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#A69180" }}>
          Invite Guests
        </label>
        <div className="flex flex-col gap-2">
          {guests.map((g, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={g.display_name}
                onChange={(e) => updateGuest(i, "display_name", e.target.value)}
                placeholder="Name"
                className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={inputStyle}
              />
              <input
                type="email"
                value={g.email}
                onChange={(e) => updateGuest(i, "email", e.target.value)}
                placeholder="Email address"
                className="flex-[2] px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={inputStyle}
              />
              {guests.length > 1 && (
                <button type="button" onClick={() => removeGuest(i)}
                  className="p-2 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" style={{ color: "#A69180" }} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addGuest}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border w-fit"
            style={{ borderColor: "#E8D4C0", color: "#6B5B52" }}>
            <Plus className="w-3.5 h-3.5" />
            Add guest
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading || !title.trim() || !date}
        className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        style={{ background: coverColor, color: "#fff" }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Creating party…" : "Create Dinner Party 🕯️"}
      </button>
    </form>
  );
}
