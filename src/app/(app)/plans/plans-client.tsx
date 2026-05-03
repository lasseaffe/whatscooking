"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UtensilsCrossed, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { MealPlan } from "@/lib/types";

type Plan = Pick<MealPlan, "id" | "title" | "week_start" | "meals_per_day" | "duration_days" | "status" | "dietary_filters" | "nutritional_goals" | "tags" | "created_at" | "updated_at">;

// ── Image carousel for plan thumbnail ────────────────────────────
function PlanThumbnail({ imgs }: { imgs: string[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (imgs.length <= 1 || paused) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [imgs.length, paused]);

  const prev = (e: React.MouseEvent) => { e.preventDefault(); setIdx((i) => (i - 1 + imgs.length) % imgs.length); };
  const next = (e: React.MouseEvent) => { e.preventDefault(); setIdx((i) => (i + 1) % imgs.length); };

  if (imgs.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #241809 0%, #2A1B0D 100%)" }}>
        <UtensilsCrossed className="w-7 h-7" style={{ color: "#3A2416" }} />
      </div>
    );
  }

  return (
    <div
      className="h-28 relative overflow-hidden group/thumb"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {imgs.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ filter: "brightness(0.85) saturate(0.9)", opacity: i === idx ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.55) 0%, transparent 60%)" }} />
      {imgs.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity"
            style={{ width: 22, height: 22, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity"
            style={{ width: 22, height: 22, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer" }}>
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {imgs.map((_, i) => (
              <button key={i} onClick={(e) => { e.preventDefault(); setIdx(i); }}
                className="rounded-full transition-all"
                style={{ width: i === idx ? 14 : 6, height: 6, background: i === idx ? "#fff" : "rgba(255,255,255,0.45)", border: "none", cursor: "pointer", padding: 0 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PlansClient({ initialPlans, planImages = {} }: { initialPlans: Plan[]; planImages?: Record<string, string[]> }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [pending, setPending] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setPending(null);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
  }

  if (plans.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Empty state card */}
        <div
          className="rounded-2xl border p-10 text-center col-span-full flex flex-col items-center gap-4"
          style={{ borderColor: "#2A1A0C", borderStyle: "dashed", background: "rgba(26,16,8,0.3)" }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(200,82,42,0.1)", border: "1px solid rgba(200,82,42,0.2)" }}>
            <UtensilsCrossed className="w-7 h-7" style={{ color: "#C8522A" }} />
          </div>
          <div>
            <p className="text-lg font-bold mb-1" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              No meal plans yet
            </p>
            <p className="text-sm" style={{ color: "#8A6A4A" }}>
              Pick a template below to get started, or create your own
            </p>
          </div>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm btn-primary-glow"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            Create your first plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDeleteDialog
        open={!!pending}
        title="Delete meal plan?"
        description="This will permanently delete the meal plan and all its entries. This cannot be undone."
        confirmLabel="Delete plan"
        onConfirm={() => pending && handleDelete(pending)}
        onCancel={() => setPending(null)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New plan card */}
        <Link href="/plans/new">
          <div
            className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 hover:border-opacity-60 h-full flex flex-col items-center justify-center gap-3 min-h-[180px]"
            style={{ borderColor: "#3A2416", borderStyle: "dashed", background: "rgba(26,16,8,0.3)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(200,82,42,0.12)", border: "1px solid rgba(200,82,42,0.25)" }}>
              <Plus className="w-6 h-6" style={{ color: "#C8522A" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#8A6A4A" }}>New plan</span>
          </div>
        </Link>

        {plans.map((plan) => (
          <div key={plan.id} className="group rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 relative"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}>
            <Link href={`/plans/${plan.id}`} className="block">
              <PlanThumbnail imgs={planImages[plan.id] ?? []} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 pr-6">
                  <h3 className="font-semibold text-sm" style={{ color: "#EFE3CE" }}>{plan.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: plan.status === "active" ? "#2A1808" : "#1A1A08", color: plan.status === "active" ? "#C8522A" : "#C89818", border: `1px solid ${plan.status === "active" ? "#C8522A30" : "#C8981830"}` }}>
                    {plan.status}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#6B4E36" }}>
                  {plan.duration_days ?? 7} days · {plan.meals_per_day ?? 3} meals/day
                </p>
                {plan.dietary_filters && plan.dietary_filters.length > 0 && (
                  <p className="text-xs mt-1 truncate" style={{ color: "#6B4E36" }}>{plan.dietary_filters.join(", ")}</p>
                )}
              </div>
            </Link>

            <button
              onClick={(e) => { e.preventDefault(); setPending(plan.id); }}
              className="absolute top-2 right-2 p-1.5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              style={{ background: "rgba(220,38,38,0.85)", color: "#fff" }}
              title="Delete plan"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
