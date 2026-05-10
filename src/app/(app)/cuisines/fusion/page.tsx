import { createClient } from "@/lib/supabase/server";
import { FUSION_DISHES } from "@/lib/fusion-foods";
import { FusionClient } from "./fusion-client";

export const metadata = { title: "Fusion Foods — What's Cooking" };

export default async function FusionFoodsPage() {
  const supabase = await createClient();

  // Enrich static dishes with any scraped Supabase records
  const { data: dbDishes } = await supabase
    .from("recipes")
    .select("id, title, image_url")
    .in("cuisine_type", ["Fusion", "fusion", "Asian-Latin Fusion", "European-Asian Fusion", "Indian-Western Fusion", "Middle Eastern Fusion"]);

  const titleToId = new Map<string, string>();
  for (const row of dbDishes ?? []) {
    if (row.title) titleToId.set(row.title.toLowerCase(), row.id);
  }

  const enriched = FUSION_DISHES.map((d) => ({
    ...d,
    supabaseId: d.supabaseId ?? titleToId.get(d.name.toLowerCase()),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      {/* ── Hero ── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 mt-2"
        style={{
          background: "linear-gradient(135deg, #0F0702 0%, #1C0D06 50%, #0F0702 100%)",
          border: "1px solid rgba(200,82,42,0.3)",
        }}
      >
        {/* Mosaic background */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-25">
          {[
            "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=60",
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=60",
            "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=60",
            "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400&q=60",
          ].map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(15,7,2,0.9) 0%, rgba(28,13,6,0.85) 100%)" }}
        />

        <div className="relative z-10 px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(244,162,97,0.7)" }}>
            Cuisine Atlas
          </p>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Fusion Foods
          </h1>
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: "rgba(239,227,206,0.65)" }}>
            Where two flavor worlds collide and create a third. Fifty dishes born at cultural crossroads — Korean tacos from LA food trucks, miso carbonara from Tokyo trattorias, naan pizzas from British curry houses.
          </p>
          <div className="flex gap-6 mt-6">
            <div>
              <span className="text-2xl font-bold" style={{ color: "#F4A261" }}>{enriched.length}</span>
              <p className="text-xs" style={{ color: "rgba(239,227,206,0.45)" }}>dishes</p>
            </div>
            <div>
              <span className="text-2xl font-bold" style={{ color: "#F4A261" }}>5</span>
              <p className="text-xs" style={{ color: "rgba(239,227,206,0.45)" }}>fusion categories</p>
            </div>
            <div>
              <span className="text-2xl font-bold" style={{ color: "#F4A261" }}>7</span>
              <p className="text-xs" style={{ color: "rgba(239,227,206,0.45)" }}>culinary crossroads</p>
            </div>
          </div>
        </div>
      </div>

      <FusionClient dishes={enriched} />
    </div>
  );
}
