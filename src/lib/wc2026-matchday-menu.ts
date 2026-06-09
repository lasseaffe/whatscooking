// World Cup 2026 — single-evening MATCHDAY MENU generator.
//
// A matchday = one evening in front of the game. The menu pairs a pool of
// universal sports-viewing snacks with 1–2 signature dishes from each of the
// two competing nations. Snacks and nation dishes are resolved to real recipes
// in the `recipes` table by title / cuisine match (mirroring the title-match
// seeding in src/app/api/plans/route.ts and the cuisine-explorer query); when
// no DB recipe matches, curated fallbacks keep the menu complete so it never
// renders empty.
//
// Pure helpers (snack pool, fallbacks) are exported for unit testing; the
// async builder is used server-side (hub page + watch-party seeding).

import type { createClient } from "@/lib/supabase/server";
import { getTeamByCode, type WCTeam } from "./wc2026-teams";
import { getNationBySlug } from "./wc2026";
import { getDishSlug } from "./wc2026-recipes";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface MenuItem {
  /** recipe id when matched to a real DB recipe (clickable); undefined for curated fallback. */
  recipeId?: string;
  title: string;
  imageUrl?: string | null;
  /** cuisine-explorer dish link for nation fallbacks, when available. */
  cuisineHref?: string;
}

export interface MatchdayMenu {
  home: WCTeam;
  away: WCTeam;
  snacks: MenuItem[];
  homeDishes: MenuItem[];
  awayDishes: MenuItem[];
}

// Universal sports-viewing snacks. `keyword` is the lowercase fragment used to
// match a real recipe title; `title` is the display/fallback label.
export const SNACK_POOL: { title: string; keyword: string; emoji: string }[] = [
  { title: "Buffalo Wings", keyword: "wing", emoji: "🍗" },
  { title: "Loaded Nachos", keyword: "nacho", emoji: "🧀" },
  { title: "Guacamole & Chips", keyword: "guacamole", emoji: "🥑" },
  { title: "Sliders", keyword: "slider", emoji: "🍔" },
  { title: "Spinach Artichoke Dip", keyword: "artichoke dip", emoji: "🥬" },
  { title: "Soft Pretzels", keyword: "pretzel", emoji: "🥨" },
  { title: "Loaded Potato Skins", keyword: "potato skin", emoji: "🥔" },
  { title: "Queso Dip", keyword: "queso", emoji: "🫕" },
];

/** How many snack ideas a matchday menu surfaces. */
export const SNACK_COUNT = 5;
/** Signature dishes per nation. */
export const DISHES_PER_NATION = 2;

/** Curated signature-dish fallbacks for a team, pulled from the cuisine catalog. */
export function teamSignatureFallback(team: WCTeam): MenuItem[] {
  if (!team.countrySlug) return [];
  const nation = getNationBySlug(team.countrySlug);
  if (!nation) return [];
  return nation.dishes.slice(0, DISHES_PER_NATION).map((d) => ({
    title: d.name,
    cuisineHref: `/cuisines/world-cup-2026/${team.countrySlug}/${getDishSlug(d.name)}`,
  }));
}

type RecipeRow = { id: string; title: string; image_url: string | null };

/** Resolve a team's signature dishes: prefer real recipes, fall back to curated. */
async function resolveNationDishes(supabase: SupabaseServer, team: WCTeam): Promise<MenuItem[]> {
  if (team.cuisine) {
    try {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, image_url")
        .ilike("cuisine_type", team.cuisine)
        .limit(DISHES_PER_NATION);
      const rows = (data ?? []) as RecipeRow[];
      if (rows.length > 0) {
        return rows.map((r) => ({ recipeId: r.id, title: r.title, imageUrl: r.image_url }));
      }
    } catch {
      // fall through to curated
    }
  }
  return teamSignatureFallback(team);
}

/** Resolve the snack pool: attach a real recipe to each curated snack where one exists. */
async function resolveSnacks(supabase: SupabaseServer): Promise<MenuItem[]> {
  const pool = SNACK_POOL.slice(0, SNACK_COUNT);
  let matches: RecipeRow[] = [];
  try {
    const orFilter = pool.map((s) => `title.ilike.%${s.keyword}%`).join(",");
    const { data } = await supabase
      .from("recipes")
      .select("id, title, image_url")
      .or(orFilter)
      .limit(30);
    matches = (data ?? []) as RecipeRow[];
  } catch {
    matches = [];
  }
  return pool.map((snack) => {
    const hit = matches.find((r) => r.title.toLowerCase().includes(snack.keyword));
    return hit
      ? { recipeId: hit.id, title: hit.title, imageUrl: hit.image_url }
      : { title: snack.title };
  });
}

/** Build the full single-evening menu for a fixture. */
export async function buildMatchdayMenu(
  supabase: SupabaseServer,
  homeCode: string,
  awayCode: string,
): Promise<MatchdayMenu | null> {
  const home = getTeamByCode(homeCode);
  const away = getTeamByCode(awayCode);
  if (!home || !away) return null;

  const [snacks, homeDishes, awayDishes] = await Promise.all([
    resolveSnacks(supabase),
    resolveNationDishes(supabase, home),
    resolveNationDishes(supabase, away),
  ]);

  return { home, away, snacks, homeDishes, awayDishes };
}
