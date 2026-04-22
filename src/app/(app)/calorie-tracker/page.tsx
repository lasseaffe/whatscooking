import { createClient } from "@/lib/supabase/server";
import { CalorieTrackerClient } from "./calorie-tracker-client";

export default async function CalorieTrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: goal },
    { data: weightLogs },
    { data: todayEntries },
    { data: recentEntries },
  ] = await Promise.all([
    supabase.from("calorie_goals").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("weight_logs").select("id, weight_kg, note, logged_at").eq("user_id", user!.id).order("logged_at", { ascending: true }).limit(90),
    supabase.from("calorie_entries").select("*").eq("user_id", user!.id).eq("logged_at", today).order("created_at"),
    supabase.from("calorie_entries").select("logged_at, calories").eq("user_id", user!.id).gte("logged_at", new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0]).order("logged_at"),
  ]);

  // Aggregate calories per day for the last 30 days
  const dailyCalories: Record<string, number> = {};
  for (const e of recentEntries ?? []) {
    dailyCalories[e.logged_at] = (dailyCalories[e.logged_at] ?? 0) + e.calories;
  }

  return (
    <CalorieTrackerClient
      initialGoal={goal ?? null}
      weightLogs={weightLogs ?? []}
      todayEntries={todayEntries ?? []}
      dailyCalories={dailyCalories}
      today={today}
    />
  );
}
