import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import type { MealPlan } from "@/lib/types";
import { PLAN_TEMPLATES, type PlanTemplate } from "./new/plan-templates";
import { PlansClient } from "./plans-client";
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {suggested.map((tpl) => (
            <Link key={tpl.id} href={`/plans/new?template=${tpl.id}`}>
              <div className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 h-full border" style={{ borderColor: "#3A2416" }}>
                <div className="h-20 relative overflow-hidden">
                  {tpl.meals?.[0]?.image ? (
                    <>
                      <img src={tpl.meals[0].image} alt={tpl.title} className="w-full h-full object-cover" style={{ filter: "brightness(0.8) saturate(0.9)" }} />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.7) 0%, transparent 60%)" }} />
                      <span className="absolute bottom-1.5 left-2 text-lg">{tpl.emoji}</span>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: tpl.gradient }}>
                      {tpl.emoji}
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-b-2xl" style={{ background: "#1C1209" }}>
                  <p className="font-semibold text-xs leading-snug" style={{ color: "#EFE3CE" }}>{tpl.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B4E36" }}>{tpl.subtitle}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tpl.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: "#2A1808", color: "#C8522A" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
