"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Utensils } from "lucide-react";

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "high-protein", "keto", "paleo", "low-carb",
];

export default function ScratchPlanPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function toggleDiet(tag) {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function create() {
    if (!title.trim()) { setError("Give your plan a name."); return; }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dietary_tags: dietaryFilters,
          tags: [],
          description: `${durationDays}-day plan, ${mealsPerDay} meals/day`,
          duration_days: durationDays,
          meals_per_day: mealsPerDay,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create plan.");
        setCreating(false);
        return;
      }
      const plan = await res.json();
      router.push(`/plans/${plan.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-7 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-xs px-3 py-1.5 rounded-xl border"
          style={{ borderColor: "#3A2416", color: "#6B4E36" }}
        >
          ← Back
        </button>
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            <CalendarDays className="w-6 h-6" style={{ color: "#C8522A" }} />
            Build from Scratch
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
            Set your own parameters and start planning.
          </p>
        </div>
      </div>

      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{ borderColor: "#3A2416", background: "#1C1209" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Utensils className="w-4 h-4" style={{ color: "#C8522A" }} />
          <span className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>Plan details</span>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
            Plan name *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Custom Week"
            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
              Duration (days)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>
              Meals per day
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "#8A6A4A" }}>
            Dietary filters
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDiet(tag)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: dietaryFilters.includes(tag) ? "#C8522A" : "#3A2416",
                  background: dietaryFilters.includes(tag) ? "#2A1010" : "#130C05",
                  color: dietaryFilters.includes(tag) ? "#C8522A" : "#6B4E36",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <p className="mt-3 text-sm" style={{ color: "#DC2626" }}>{error}</p>
      )}

      <div className="mt-6">
        <button
          onClick={create}
          disabled={creating || !title.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          style={{ background: "#C8522A", color: "#fff" }}
        >
          {creating ? "Creating…" : "Create plan →"}
        </button>
      </div>
    </div>
  );
}
