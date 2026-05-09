import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { MemberDetailClient } from "./member-detail-client";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("household_members")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (!member) notFound();

  const [{ data: preferences }, { data: reactions }] = await Promise.all([
    supabase.from("member_ingredient_preferences").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("member_meal_reactions")
      .select("*, recipe:recipes(id, title, image_url)")
      .eq("member_id", id)
      .order("cooked_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <MemberDetailClient
      member={member}
      initialPreferences={preferences ?? []}
      initialReactions={reactions ?? []}
    />
  );
}
