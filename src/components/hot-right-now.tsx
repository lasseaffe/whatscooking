import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getCategoryFallback } from "@/lib/recipe-image";

export async function HotRightNow() {
  const supabase = await createClient();

  // Fetch highest-rated / most-saved recipes as "trending"
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, calories, prep_time_minutes, cook_time_minutes, ranked_score")
    .not("dish_types", "cs", '{"drink"}')
    .not("dish_types", "cs", '{"hack"}')
    .not("dish_types", "cs", '{"premium"}')
    .order("ranked_score", { ascending: false })
    .limit(12);

  if (!recipes || recipes.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        {/* Sage green pulse indicator */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#828E6F" }} />
          <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "#828E6F" }} />
        </span>
        <h2 className="text-base font-bold" style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Hot Right Now
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#828E6F15", color: "#828E6F" }}>
          Trending
        </span>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide">
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          const imgUrl = r.image_url ?? getCategoryFallback(r.id, r.title, r.cuisine_type);
          return (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex-none group relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl"
              style={{ width: 160, borderRadius: 16 }}
            >
              <div style={{ aspectRatio: "3/4", position: "relative" }}>
                <img
                  src={imgUrl}
                  alt={r.title}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 16 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    borderRadius: 16,
                    background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)",
                  }}
                />

                {/* Trending badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1"
                    style={{ background: "rgba(130,142,111,0.9)", color: "#fff", fontSize: 10 }}
                  >
                    🔥 Trending
                  </span>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white font-semibold leading-snug line-clamp-2" style={{ fontSize: 12 }}>
                    {r.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {totalTime > 0 && (
                      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>⏱ {totalTime}m</span>
                    )}
                    {r.calories && (
                      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>🔥 {r.calories}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
