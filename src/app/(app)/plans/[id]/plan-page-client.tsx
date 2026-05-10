"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import { PlanBuilder, type BuilderEntry } from "./plan-builder";
import { PlanGrid } from "./plan-grid";

interface PlanMeta {
  id: string;
  title: string;
  duration_days: number;
  week_start: string | null;
  dietary_filters: string[];
  nutritional_goals: Record<string, number>;
  status: string;
  meals_per_day: number;
}

interface Props {
  plan: PlanMeta;
  initialEntries: BuilderEntry[];
}

export function PlanPageClient({ plan, initialEntries }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("planViewMode") as "grid" | "list") ?? "grid";
  });

  useEffect(() => {
    localStorage.setItem("planViewMode", viewMode);
  }, [viewMode]);

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="inline-flex rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(90,50,20,0.4)" }}
        >
          {([
            { key: "grid", Icon: LayoutGrid, label: "Grid" },
            { key: "list", Icon: List,        label: "List" },
          ] as const).map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: viewMode === key ? "rgba(200,90,47,0.2)" : "transparent",
                color: viewMode === key ? "#C85A2F" : "#8A6A4A",
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "grid" ? (
        <PlanGrid
          planId={plan.id}
          planTitle={plan.title}
          durationDays={plan.duration_days ?? 7}
          weekStart={plan.week_start}
          dietaryFilters={plan.dietary_filters ?? []}
          nutritionalGoals={plan.nutritional_goals ?? {}}
          initialEntries={initialEntries}
        />
      ) : (
        <PlanBuilder
          planId={plan.id}
          planTitle={plan.title}
          durationDays={plan.duration_days ?? 7}
          dietaryFilters={plan.dietary_filters ?? []}
          nutritionalGoals={plan.nutritional_goals ?? {}}
          initialEntries={initialEntries}
        />
      )}
    </div>
  );
}
