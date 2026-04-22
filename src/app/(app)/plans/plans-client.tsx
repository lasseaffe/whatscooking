"use client";

import { useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { MealPlan } from "@/lib/types";

type Plan = Pick<MealPlan, "id" | "title" | "week_start" | "meals_per_day" | "duration_days" | "status" | "dietary_filters" | "nutritional_goals" | "tags" | "created_at" | "updated_at">;

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
      <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "#2A1A0C", borderStyle: "dashed" }}>
        <p className="text-sm mb-4" style={{ color: "#8A6A4A" }}>No meal plans yet. Pick a template above to get started!</p>
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
        {plans.map((plan) => (
          <div key={plan.id} className="group rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 relative"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}>
            <Link href={`/plans/${plan.id}`} className="block">
              {(() => {
                const imgs = planImages[plan.id] ?? [];
                if (imgs.length === 0) {
                  return (
                    <div className="h-24 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #241809 0%, #2A1B0D 100%)" }}>
                      <UtensilsCrossed className="w-7 h-7" style={{ color: "#3A2416" }} />
                    </div>
                  );
                }
                if (imgs.length === 1) {
                  return (
                    <div className="h-24 overflow-hidden relative">
                      <img src={imgs[0]} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.85) saturate(0.9)" }} />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.55) 0%, transparent 60%)" }} />
                    </div>
                  );
                }
                return (
                  <div className="h-24 grid gap-0.5 overflow-hidden"
                    style={{ gridTemplateColumns: imgs.length >= 3 ? "1fr 1fr" : "1fr 1fr" }}>
                    {imgs.slice(0, 4).map((src, i) => (
                      <div key={i} className="relative overflow-hidden"
                        style={{ gridRow: imgs.length === 3 && i === 0 ? "1 / 3" : undefined }}>
                        <img src={src} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.85) saturate(0.9)" }} />
                      </div>
                    ))}
                  </div>
                );
              })()}
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

            {/* Delete button */}
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
