import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HouseholdClient } from "./household-client";

export default async function HouseholdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });

  return <HouseholdClient initialMembers={members ?? []} />;
}
