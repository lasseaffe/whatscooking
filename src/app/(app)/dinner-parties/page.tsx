import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, UtensilsCrossed } from "lucide-react";
import { DinnerPartyCalendar } from "./dinner-party-calendar";

export const dynamic = "force-dynamic";

export default async function DinnerPartiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: hosted }, { data: guestLinks }] = await Promise.all([
    supabase
      .from("dinner_parties")
      .select("*, dinner_party_guests(id, rsvp, display_name, user_id, email)")
      .eq("host_id", user.id)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("dinner_party_guests")
      .select("party_id, rsvp")
      .eq("user_id", user.id),
  ]);

  const invitedIds = (guestLinks ?? []).map((g) => g.party_id);
  let invited: typeof hosted = [];
  if (invitedIds.length > 0) {
    const { data } = await supabase
      .from("dinner_parties")
      .select("*, dinner_party_guests(id, rsvp, display_name, user_id, email)")
      .in("id", invitedIds)
      .neq("host_id", user.id)
      .order("scheduled_at", { ascending: true });
    invited = data ?? [];
  }

  const myRsvpMap: Record<string, string> = {};
  for (const g of guestLinks ?? []) myRsvpMap[g.party_id] = g.rsvp;

  const allParties = [
    ...(hosted ?? []).map((p) => ({ ...p, role: "host" as const })),
    ...(invited ?? []).map((p) => ({ ...p, role: "guest" as const, myRsvp: myRsvpMap[p.id] })),
  ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>Dinner Parties 🕯️</h1>
          <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>
            Plan gatherings, invite friends, and build a rhythm of shared meals.
          </p>
        </div>
        <Link href="/dinner-parties/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
          style={{ background: "#C85A2F", color: "#fff" }}>
          <Plus className="w-4 h-4" />
          Plan a party
        </Link>
      </div>

      {/* Calendar */}
      <DinnerPartyCalendar parties={allParties} userId={user.id} />

      {/* Empty state */}
      {allParties.length === 0 && (
        <div className="rounded-2xl border p-16 text-center mt-6"
          style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-4" style={{ color: "#C85A2F", opacity: 0.3 }} />
          <p className="text-base font-semibold mb-1" style={{ color: "#3D2817" }}>No dinner parties yet</p>
          <p className="text-sm mb-5" style={{ color: "#6B5B52" }}>
            Start planning your first gathering — set a date, pick recipes, invite friends.
          </p>
          <Link href="/dinner-parties/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C85A2F", color: "#fff" }}>
            <Plus className="w-4 h-4" />
            Plan your first dinner party
          </Link>
        </div>
      )}
    </div>
  );
}
