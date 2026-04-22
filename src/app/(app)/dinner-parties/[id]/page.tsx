import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PartyDetail } from "./party-detail";

export const dynamic = "force-dynamic";

export default async function DinnerPartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: party }, { data: guests }, { data: comments }, { data: profile }, { data: items }] = await Promise.all([
    supabase.from("dinner_parties").select("*").eq("id", id).single(),
    supabase.from("dinner_party_guests").select("*").eq("party_id", id).order("invited_at"),
    supabase.from("dinner_party_comments")
      .select("*, profile:profiles(full_name, id)")
      .eq("party_id", id)
      .order("created_at"),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("dinner_party_items")
      .select("*, recipe:recipes(id,title,image_url,cuisine_type)")
      .eq("party_id", id)
      .order("position")
      .order("created_at"),
  ]);

  if (!party) notFound();

  // Check if user is host or guest
  const isHost = party.host_id === user.id;
  const myGuest = (guests ?? []).find((g: { user_id: string | null; role?: string }) => g.user_id === user.id);
  if (!isHost && !myGuest) notFound(); // no access
  const canEdit = isHost || myGuest?.role === "editor";

  // Load linked meal plan if any
  let linkedPlan = null;
  if (party.linked_plan_id) {
    const { data } = await supabase
      .from("meal_plans")
      .select("id, title, meals_per_day, duration_days")
      .eq("id", party.linked_plan_id)
      .single();
    linkedPlan = data;
  }

  return (
    <PartyDetail
      party={party}
      guests={guests ?? []}
      comments={comments ?? []}
      items={items ?? []}
      linkedPlan={linkedPlan}
      isHost={isHost}
      canEdit={canEdit}
      myGuest={myGuest ?? null}
      userId={user.id}
      userName={profile?.full_name ?? "You"}
    />
  );
}
