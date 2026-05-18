import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Flame, Star } from "lucide-react";

function getDayGrid(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    days.push({ date: iso, label });
  }
  return days;
}

export async function CookingHistoryWidget({ userId }: { userId: string }) {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: events }, { data: latestCook }] = await Promise.all([
    supabase
      .from("streak_events")
      .select("day")
      .eq("user_id", userId)
      .eq("action_id", "recipe_cooked")
      .gte("day", thirtyDaysAgo.toISOString().slice(0, 10))
      .order("day", { ascending: false }),
    supabase
      .from("cook_log")
      .select("id, recipe_id, recipe_title, cooked_at, rating, photo_url")
      .eq("user_id", userId)
      .order("cooked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!events || events.length === 0) return null;

  const cookedDays = new Set((events ?? []).map((e) => e.day as string));
  const grid = getDayGrid();

  // Streak calculation
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const check = new Date();
  while (true) {
    const d = check.toISOString().slice(0, 10);
    if (cookedDays.has(d)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (d === today) {
      // Today not cooked yet — check yesterday too
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
    if (streak > 30) break;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4" style={{ color: "#C85A2F" }} />
          <h2 className="text-base font-bold" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
            Cooking History
          </h2>
        </div>
        {streak > 1 && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: "rgba(200,90,47,0.15)", color: "#F4A261", border: "1px solid rgba(200,90,47,0.3)" }}
          >
            🔥 {streak}-day streak
          </span>
        )}
      </div>

      {/* Latest cook row */}
      {latestCook && (
        <Link
          href="/journal"
          className="block rounded-2xl p-3 mb-3 hover:opacity-90 transition-opacity"
          style={{ background: "rgba(28,18,9,0.8)", border: "1px solid rgba(58,36,22,0.5)" }}
        >
          <div className="flex items-center gap-3">
            {latestCook.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latestCook.photo_url as string}
                alt={latestCook.recipe_title as string}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-0.5" style={{ color: "#5A3A28" }}>Last cooked</p>
              <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>
                {latestCook.recipe_title as string}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: "#5A3A28" }}>
                  {new Date(latestCook.cooked_at as string).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
                {latestCook.rating && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className="w-3 h-3"
                        style={{
                          color: n <= (latestCook.rating as number) ? "#F4A261" : "rgba(58,36,22,0.3)",
                          fill: n <= (latestCook.rating as number) ? "#F4A261" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* 30-day heatmap */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(28,18,9,0.8)", border: "1px solid rgba(58,36,22,0.5)" }}
      >
        <div className="flex gap-1.5 flex-wrap">
          {grid.map(({ date, label }) => {
            const cooked = cookedDays.has(date);
            return (
              <div
                key={date}
                title={`${label}${cooked ? " — cooked!" : ""}`}
                className="w-5 h-5 rounded-sm transition-all"
                style={{
                  background: cooked
                    ? "linear-gradient(135deg, #C85A2F, #F4A261)"
                    : "rgba(58,36,22,0.4)",
                  boxShadow: cooked ? "0 0 6px rgba(244,162,97,0.3)" : "none",
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs" style={{ color: "#5A3A28" }}>
            {cookedDays.size} cook{cookedDays.size !== 1 ? "s" : ""} in the last 30 days
          </p>
          <Link
            href="/plans"
            className="text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: "#C85A2F" }}
          >
            View plans →
          </Link>
        </div>
      </div>
    </section>
  );
}
