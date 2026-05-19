import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  let query = supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (type && type !== "all") query = query.eq("plan_type", type);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, cuisine, plan_type, serves, start_date, end_date, description, is_public, dietary_tags, tags, duration_days, meals_per_day, template_meals, pinboard_filters } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      title,
      cuisine: cuisine ?? null,
      plan_type: plan_type ?? null,
      serves: serves ?? 2,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      description: description ?? null,
      is_public: is_public ?? false,
      dietary_tags: dietary_tags ?? [],
      tags: tags ?? [],
      status: "draft",
      duration_days: duration_days ?? null,
      meals_per_day: meals_per_day ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Seed pins from template meal titles (exact match, then ilike fallback)
  if (Array.isArray(template_meals) && template_meals.length > 0) {
    const titles = template_meals.map((t: string) => t.toLowerCase().trim()).filter(Boolean);

    const { data: exact } = await supabase
      .from("recipes")
      .select("id, title")
      .in("title", template_meals);

    const matchedIds = new Set<string>((exact ?? []).map((r: { id: string; title: string }) => r.id));
    const matchedTitlesLower = new Set((exact ?? []).map((r: { id: string; title: string }) => (r.title ?? "").toLowerCase().trim()));
    const missing = titles.filter((t) => !matchedTitlesLower.has(t));
    for (const t of missing) {
      const { data: fuzzy } = await supabase
        .from("recipes")
        .select("id")
        .ilike("title", `%${t}%`)
        .limit(1);
      if (fuzzy?.[0]?.id) matchedIds.add(fuzzy[0].id);
    }

    if (matchedIds.size > 0) {
      await supabase
        .from("meal_plan_pins")
        .insert(Array.from(matchedIds).map((rid, i) => ({
          meal_plan_id: plan.id,
          recipe_id: rid,
          priority: 100 - i,
        })));
    }
  }

  if (pinboard_filters && typeof pinboard_filters === "object") {
    await supabase
      .from("meal_plans")
      .update({ pinboard_filters })
      .eq("id", plan.id);
  }

  return NextResponse.json(plan, { status: 201 });
}
