import { createClient } from "@/lib/supabase/server";
import { NewPartyForm } from "./new-party-form";

export const dynamic = "force-dynamic";

export default async function NewDinnerPartyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Load user's meal plans to optionally link
  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#3D2817" }}>Plan a Dinner Party 🕯️</h1>
      <p className="text-sm mb-8" style={{ color: "#6B5B52" }}>
        Set the date, theme, and invite your people.
      </p>
      <NewPartyForm plans={plans ?? []} defaultDate={date} />
    </div>
  );
}
