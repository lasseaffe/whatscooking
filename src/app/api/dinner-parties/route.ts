import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/dinner-parties — list user's parties (hosted + invited)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Hosted parties
  const { data: hosted } = await supabase
    .from("dinner_parties")
    .select("*, dinner_party_guests(id, rsvp, display_name, user_id, email)")
    .eq("host_id", user.id)
    .order("scheduled_at", { ascending: true });

  // Invited parties (where user is a guest)
  const { data: invitedLinks } = await supabase
    .from("dinner_party_guests")
    .select("party_id, rsvp")
    .eq("user_id", user.id);

  const invitedIds = (invitedLinks ?? []).map((g) => g.party_id);
  let invited: unknown[] = [];
  if (invitedIds.length > 0) {
    const { data } = await supabase
      .from("dinner_parties")
      .select("*, dinner_party_guests(id, rsvp, display_name, user_id, email)")
      .in("id", invitedIds)
      .not("host_id", "eq", user.id)
      .order("scheduled_at", { ascending: true });
    invited = data ?? [];
  }

  return NextResponse.json({ hosted: hosted ?? [], invited });
}

// POST /api/dinner-parties — create a new party
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, description, scheduled_at, location, theme,
    linked_plan_id, max_guests, is_recurring, recurrence_rule,
    cover_color, guests,
  } = body;

  if (!title?.trim() || !scheduled_at) {
    return NextResponse.json({ error: "title and scheduled_at are required" }, { status: 400 });
  }

  // If recurring, generate a series_id
  const series_id = is_recurring ? crypto.randomUUID() : null;

  const { data: party, error } = await supabase
    .from("dinner_parties")
    .insert({
      host_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      scheduled_at,
      location: location?.trim() || null,
      theme: theme?.trim() || null,
      linked_plan_id: linked_plan_id || null,
      max_guests: max_guests || null,
      is_recurring: !!is_recurring,
      recurrence_rule: is_recurring ? recurrence_rule : null,
      series_id,
      cover_color: cover_color || "#C85A2F",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add invited guests
  if (guests && guests.length > 0 && party) {
    const guestRows = guests
      .filter((g: { email?: string; user_id?: string; display_name?: string }) => g.email || g.user_id)
      .map((g: { email?: string; user_id?: string; display_name?: string }) => ({
        party_id: party.id,
        email: g.email || null,
        user_id: g.user_id || null,
        display_name: g.display_name || null,
        rsvp: "invited",
      }));
    if (guestRows.length > 0) {
      await supabase.from("dinner_party_guests").insert(guestRows);
    }
  }

  return NextResponse.json(party, { status: 201 });
}
