import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import type { MealPlan } from "@/lib/types";
import { PLAN_TEMPLATES, type PlanTemplate } from "./new/plan-templates";
import { PlansClient } from "./plans-client";
import { SuggestedTemplates } from "./suggested-templates";
import { BudgetTicker } from "@/components/budget-ticker";

function rankTemplates(userPrefs: string[]): PlanTemplate[] {
  const scored = PLAN_TEMPLATES.map((tpl) => ({
    tpl,
    score: userPrefs.length === 0
      ? 0
      : tpl.dietaryFilters.filter((f) => userPrefs.includes(f)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((s) => s.tpl);
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("meal_plans")
    .select("id, title, week_start, meals_per_day, duration_days, status, dietary_filters, nutritional_goals, tags, created_at, updated_at")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);

  const { data: plans } = await query;

  // Fetch up to 4 recipe images per plan for thumbnails
  const planIds = (plans ?? []).map((p) => p.id);
  let planImages: Record<string, string[]> = {};
  if (planIds.length > 0) {
    const { data: entries } = await supabase
      .from("meal_plan_entries")
      .select("plan_id, recipe:recipes(image_url)")
      .in("plan_id", planIds)
      .not("recipes.image_url", "is", null);

    if (entries) {
      for (const entry of entries) {
        const img = (entry.recipe as unknown as { image_url: string | null } | null)?.image_url;
        if (img && entry.plan_id) {
          if (!planImages[entry.plan_id]) planImages[entry.plan_id] = [];
          if (planImages[entry.plan_id].length < 4) planImages[entry.plan_id].push(img);
        }
      }
    }
  }

  // Infer user preferences from their existing plans' dietary_filters
  const allFilters = (plans ?? []).flatMap((p) => p.dietary_filters ?? []);
  const prefCounts: Record<string, number> = {};
  allFilters.forEach((f) => { prefCounts[f] = (prefCounts[f] ?? 0) + 1; });
  const userPrefs = Object.entries(prefCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => f);

  const suggested = rankTemplates(userPrefs);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <BudgetTicker />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>My Meal Plans</h1>
        <Link href="/plans/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm btn-primary-glow"
          style={{ background: "#C8522A", color: "#fff" }}>
          <Plus className="w-4 h-4" />
          New plan
        </Link>
      </div>

      {/* ── SUGGESTED PLANS ──────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "#C8522A" }} />
          <h2 className="text-base font-semibold" style={{ color: "#EFE3CE" }}>
            {userPrefs.length > 0 ? "Suggested for You" : "Popular Plans"}
          </h2>
          {userPrefs.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#2A1808", color: "#C8522A", border: "1px solid #C8522A30" }}>
              Based on your preferences
            </span>
          )}
        </div>

        <SuggestedTemplates templates={suggested} />
      </section>

      {/* Divider */}
      {plans && plans.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "#2A1A0C" }} />
          <span className="text-xs font-medium" style={{ color: "#6B4E36" }}>Your Plans</span>
          <div className="flex-1 h-px" style={{ background: "#2A1A0C" }} />
        </div>
      )}

      {/* ── EXISTING PLANS ───────────────────────────────────────── */}
      <PlansClient initialPlans={plans ?? []} planImages={planImages} />
    </div>
  );
}
