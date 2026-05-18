import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import Link from "next/link";

interface CookHistoryProps {
  recipeId: string;
  userId: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="w-3 h-3"
          style={{
            color: n <= rating ? "#F4A261" : "rgba(58,36,22,0.3)",
            fill: n <= rating ? "#F4A261" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

export async function CookHistory({ recipeId, userId }: CookHistoryProps) {
  const supabase = await createClient();

  const { data: entries, count } = await supabase
    .from("cook_log")
    .select("id, cooked_at, rating, notes, photo_url", { count: "exact" })
    .eq("recipe_id", recipeId)
    .eq("user_id", userId)
    .order("cooked_at", { ascending: false })
    .limit(5);

  if (!entries || entries.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-base font-bold"
          style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}
        >
          Your cook history
        </h3>
        {(count ?? 0) > 5 && (
          <Link
            href={`/journal?recipe=${recipeId}`}
            className="text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#C85A2F" }}
          >
            See all →
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((entry) => {
          const date = new Date(entry.cooked_at as string).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={entry.id as string}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: "rgba(28,18,9,0.6)", border: "1px solid rgba(58,36,22,0.4)" }}
            >
              {entry.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.photo_url as string}
                  alt="Cook photo"
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs" style={{ color: "#5A3A28" }}>{date}</span>
                  {entry.rating && <StarRow rating={entry.rating as number} />}
                </div>
                {entry.notes && (
                  <p className="text-sm leading-snug" style={{ color: "#C8A882" }}>
                    {(entry.notes as string).length > 80
                      ? (entry.notes as string).slice(0, 80) + "…"
                      : (entry.notes as string)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
