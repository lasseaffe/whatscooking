// src/app/api/world-cup/watch-parties/route.ts
// Create a World Cup watch-party EVENT from a fixture: spins up a dinner_party,
// seeds the matchday menu into dinner_party_items, optionally invites a watch
// squad (kitchen_group), and records the wc_watch_parties link.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTeamByCode } from "@/lib/wc2026-teams";
import { buildMatchdayMenu, type MenuItem } from "@/lib/wc2026-matchday-menu";

export const dynamic = "force-dynamic";

type FixtureRow = { id: string; match_date: string; home_code: string; away_code: string; venue: string | null };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { fixture_id?: string; kitchen_group_id?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.fixture_id) return NextResponse.json({ error: "fixture_id required" }, { status: 400 });

  // 1. Resolve the fixture + teams.
  const { data: fixture } = await supabase
    .from("wc_fixtures")
    .select("id, match_date, home_code, away_code, venue")
    .eq("id", body.fixture_id)
    .single<FixtureRow>();
  if (!fixture) return NextResponse.json({ error: "Fixture not found" }, { status: 404 });

  const home = getTeamByCode(fixture.home_code);
  const away = getTeamByCode(fixture.away_code);
  const homeName = home?.name ?? fixture.home_code;
  const awayName = away?.name ?? fixture.away_code;
  const homeFlag = home?.flag ?? "";
  const awayFlag = away?.flag ?? "";

  // 2. Create the event.
  const { data: party, error: partyErr } = await supabase
    .from("dinner_parties")
    .insert({
      host_id: user.id,
      title: `${homeFlag} ${homeName} vs ${awayName} ${awayFlag} · Watch Party`.trim(),
      description: `World Cup matchday watch party. Half-time snacks plus signature dishes from ${homeName} and ${awayName} — everyone claim a dish to bring.`,
      scheduled_at: fixture.match_date,
      location: fixture.venue ? `Kickoff at ${fixture.venue}` : null,
      theme: "World Cup Watch Party ⚽",
      cover_color: "#C8522A",
    })
    .select()
    .single();
  if (partyErr || !party) {
    return NextResponse.json({ error: partyErr?.message ?? "Could not create party" }, { status: 500 });
  }

  // 3. Seed the matchday menu into the itinerary.
  const menu = await buildMatchdayMenu(supabase, fixture.home_code, fixture.away_code);
  if (menu) {
    let position = 0;
    const toRow = (item: MenuItem, category: "snack" | "meal") => ({
      party_id: party.id,
      category,
      title: item.title,
      recipe_id: item.recipeId ?? null,
      added_by: user.id,
      position: position++,
    });
    const rows = [
      ...menu.snacks.map((s) => toRow(s, "snack")),
      ...menu.homeDishes.map((d) => toRow(d, "meal")),
      ...menu.awayDishes.map((d) => toRow(d, "meal")),
    ];
    if (rows.length > 0) await supabase.from("dinner_party_items").insert(rows);
  }

  // 4. Invite squad members (if a squad was chosen).
  if (body.kitchen_group_id) {
    const { data: members } = await supabase
      .from("kitchen_group_members")
      .select("user_id")
      .eq("group_id", body.kitchen_group_id);
    const guestRows = (members ?? [])
      .filter((m) => m.user_id !== user.id)
      .map((m) => ({ party_id: party.id, user_id: m.user_id, rsvp: "invited", role: "editor" }));
    if (guestRows.length > 0) await supabase.from("dinner_party_guests").insert(guestRows);
  }

  // 5. Record the fixture↔event↔squad link. Non-fatal if the table isn't
  //    migrated yet — the event + menu are already created and usable.
  try {
    await supabase.from("wc_watch_parties").insert({
      fixture_id: fixture.id,
      kitchen_group_id: body.kitchen_group_id ?? null,
      dinner_party_id: party.id,
      host_user_id: user.id,
    });
  } catch {
    /* wc_watch_parties migration pending — link skipped */
  }

  return NextResponse.json({ party_id: party.id }, { status: 201 });
}
