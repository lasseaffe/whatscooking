import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: reports } = await supabase
    .from("recipe_bug_reports")
    .select("*")
    .order("created_at", { ascending: false });

  return <ReportsClient reports={reports ?? []} />;
}
