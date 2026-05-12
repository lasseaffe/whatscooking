// src/app/api/recipes/finder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VibeKey = "lazy" | "date-night" | "fuel" | "comfort" | "clean" | "impress";

const VIBE_BOOST: Record<VibeKey, string[]> = {
  lazy:          ["dinner", "pasta", "soup", "casserole", "stew"],
  "date-night":  ["french", "italian", "seafood", "steak"],
  fuel:          ["breakfast", "snack", "salad", "sandwich", "bowl"],
  comfort:       ["soup", "pasta", "bake", "curry", "pie", "chowder"],
  clean:         ["salad", "vegan", "vegetarian", "bowl", "smoothie"],
  impress:       ["french", "seafood", "tart", "risotto"],
};

const VIBE_SUPPRESS: Record<string, string[]> = {
  lazy:          ["salad"],
  "date-night":  ["snack"],
  clean:         ["fried", "dessert"],
};

const VIBE_LABELS: Record<string, string> = {
  lazy:          "Lazy night in",
  "date-night":  "Date night vibes",
  fuel:          "Quick fuel",
  comfort:       "Comfort food",
  clean:         "Clean eating",
  impress:       "Impress guests",
};

interface FinderBody {
  vibe?: VibeKey;
  maxMinutes?: number | null;
  dietary?: string[];
  pantryMode?: "pantry" | "shop" | "any";
  excludeKeywords?: string[];
  dishHint?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body: FinderBody = await req.json().catch(() => ({}));
  const { vibe, maxMinutes, dietary, pantryMode, excludeKeywords, dishHint } = body;

  // ── 1. Build SQL query ──────────────────────────────────────
  let query = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes"
    )
    .not("dish_types", "cs", '{"drink"}')
    .not("dish_types", "cs", '{"hack"}')
    .not("dish_types", "cs", '{"premium"}');

  // Dietary hard filter
  if (dietary?.length) {
    for (const d of dietary) {
      query = query.contains("dietary_tags", [d]);
    }
  }

  // Time proxy filter — JS pass below is the precise gate
  if (maxMinutes) {
    query = query.lte("prep_time_minutes", maxMinutes);
  }

  // Exclude keyword titles
  if (excludeKeywords?.length) {
    for (const kw of excludeKeywords) {
      query = query.not("title", "ilike", `%${kw}%`);
    }
  }

  const { data: candidates } = await query.limit(300);
  if (!candidates?.length) {
    return NextResponse.json({ results: [], profile: null });
  }

  // ── 2. JS-level precise time filter ─────────────────────────
  const pool = maxMinutes
    ? candidates.filter(
        (r) => (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0) <= maxMinutes
      )
    : candidates;

  // ── 3. Pantry items (title-level match) ─────────────────────
  let pantryNames: string[] = [];
  if (pantryMode === "pantry" && user) {
    const { data: items } = await supabase
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id);
    pantryNames = (items ?? []).map((i: { name: string }) => i.name.toLowerCase());
  }

  // ── 4. Score candidates ─────────────────────────────────────
  const boosts = vibe ? (VIBE_BOOST[vibe] ?? []) : [];
  const suppresses = vibe ? (VIBE_SUPPRESS[vibe] ?? []) : [];

  type Candidate = (typeof pool)[number];
  const scored = pool.map((r: Candidate) => {
    let score = 0;

    for (const t of r.dish_types ?? []) {
      const tl = t.toLowerCase();
      if (boosts.some((b) => tl.includes(b))) score += 3;
      if (suppresses.some((s) => tl.includes(s))) score -= 2;
    }

    if (r.cuisine_type) {
      const cl = r.cuisine_type.toLowerCase();
      if (boosts.some((b) => cl.includes(b))) score += 2;
      if (suppresses.some((s) => cl.includes(s))) score -= 1;
    }

    if (dishHint) {
      if (r.title.toLowerCase().includes(dishHint)) score += 3;
      else if (r.description?.toLowerCase().includes(dishHint)) score += 1;
    }

    if (pantryNames.length > 0) {
      const titleLower = r.title.toLowerCase();
      const matches = pantryNames.filter((p) => titleLower.includes(p)).length;
      score += Math.min(matches * 2, 4);
    }

    if (r.image_url) score += 1;

    return { ...r, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  // ── 5. Build result set: top-12 deterministic + 8 shuffled ──
  const top12 = scored.slice(0, 12);
  const restPool = [...scored.slice(12, 32)];
  for (let i = restPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [restPool[i], restPool[j]] = [restPool[j], restPool[i]];
  }
  const results = [...top12, ...restPool.slice(0, 8)].map(
    ({ _score: _, ...r }) => r
  );

  return NextResponse.json({
    results,
    profile: {
      vibeLabel: vibe ? (VIBE_LABELS[vibe] ?? null) : null,
      timeLabel: maxMinutes ? `≤ ${maxMinutes} min` : null,
      pantrySkipped: pantryMode === "pantry" && !user,
    },
  });
}
