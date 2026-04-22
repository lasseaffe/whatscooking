import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CUISINES, CUISINE_REGIONS, CULINARY_REGIONS } from "@/lib/cuisines";
import { Globe2 } from "lucide-react";
import { CuisinesTabs } from "./cuisines-tabs";
import { CuisinesPageWrapper } from "./cuisines-page-wrapper";
import { CuisineNav } from "@/components/cuisine-nav";
import { continentId } from "@/lib/continent-id";

function flagEmoji(code: string): string {
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}

export const dynamic = "force-dynamic";

export default async function CuisinesPage() {
  const supabase = await createClient();

  const { data: counts } = await supabase
    .from("recipes")
    .select("cuisine_type")
    .not("cuisine_type", "is", null);

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    if (row.cuisine_type) {
      const key = (row.cuisine_type as string).toLowerCase();
      countMap[key] = (countMap[key] ?? 0) + 1;
    }
  }

  function getCount(cuisine: (typeof CUISINES)[0]) {
    return cuisine.dbValues.reduce((sum, v) => sum + (countMap[v.toLowerCase()] ?? 0), 0);
  }

  function getCulinaryRegionCount(slugs: string[]) {
    return slugs.reduce((total, slug) => {
      const c = CUISINES.find((x) => x.slug === slug);
      return total + (c ? getCount(c) : 0);
    }, 0);
  }

  const continents = CUISINE_REGIONS;

  const byCountryContent = (
    <>
      {/* Sticky continent nav */}
      <CuisineNav continents={continents} />

      {continents.map((region) => {
        const regionCuisines = CUISINES.filter((c) => c.region === region);
        const regionRecipeCount = regionCuisines.reduce((sum, c) => sum + getCount(c), 0);

        return (
          <section
            key={region}
            id={continentId(region)}
            className="mb-16"
            style={{ scrollMarginTop: "5rem" }}
          >
            {/* Continent header with gradient */}
            <div
              className="relative overflow-hidden rounded-2xl mb-6 px-6 py-8"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--wc-pal-accent, #B07D56) 20%, var(--wc-floor, #1F1B19)), var(--wc-floor, #1F1B19))",
                borderBottom: "1px solid var(--border-primary, rgba(255,255,255,0.08))",
              }}
            >
              {/* Decorative background text */}
              <div
                aria-hidden
                className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl font-black pointer-events-none select-none"
                style={{ opacity: 0.04, color: "var(--fg-primary, #fff)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {region}
              </div>

              <h2
                className="text-2xl font-extrabold mb-1"
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  color: "var(--fg-primary, #EFE3CE)",
                }}
              >
                {region}
              </h2>
              <p className="text-sm" style={{ color: "var(--fg-tertiary, rgba(239,227,206,0.55))" }}>
                {regionRecipeCount > 0
                  ? `${regionRecipeCount} recipes across ${regionCuisines.length} cuisines`
                  : `${regionCuisines.length} cuisines`}
              </p>
            </div>

            {/* Horizontal snap-scroll row */}
            <div className="cuisine-snap-row" data-continent={region}>
              {regionCuisines.map((cuisine) => {
                const count = getCount(cuisine);
                return (
                  <Link
                    key={cuisine.slug}
                    href={`/cuisines/${cuisine.slug}`}
                    className="cuisine-snap-card"
                    data-continent={region}
                  >
                    <div
                      className="cuisine-card-inner"
                      style={{
                        background: "var(--wc-surface-1, #2C2724)",
                        borderRadius: "12px",
                        borderTop: `2px solid ${cuisine.color}`,
                      }}
                    >
                      {/* Image */}
                      <div className="cuisine-card-img-wrap">
                        <img
                          src={cuisine.heroImage}
                          alt={`${cuisine.name} cuisine`}
                          className="cuisine-card-img"
                        />
                        <div
                          className="cuisine-card-img-overlay"
                          style={{ background: "linear-gradient(to top, rgba(14,8,3,0.85) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)" }}
                        />
                        <div className="cuisine-card-img-bottom">
                          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "4px" }}>
                            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2, margin: 0, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                              {cuisine.name}
                            </h3>
                            <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0 }}>{flagEmoji(cuisine.flag)}</span>
                          </div>
                          {count > 0 && (
                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", fontWeight: 500, marginTop: "2px", display: "block" }}>
                              {count} {count === 1 ? "recipe" : "recipes"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="cuisine-card-body">
                        <p
                          className="cuisine-card-tagline"
                          style={{ color: cuisine.color, fontStyle: "italic", fontSize: "0.72rem", lineHeight: 1.4, marginBottom: "auto" }}
                        >
                          &ldquo;{cuisine.tagline}&rdquo;
                        </p>

                        {/* Popular dishes — slide-up on hover */}
                        <div className="cuisine-card-dishes">
                          <span
                            className="cuisine-dishes-label"
                            style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, marginBottom: "4px", display: "block", color: "var(--fg-secondary, #e7e7e6)" }}
                          >
                            Popular Dishes
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {cuisine.keyDishes.slice(0, 3).map((dish) => (
                              <span
                                key={dish}
                                style={{
                                  background: cuisine.bg,
                                  color: cuisine.color,
                                  fontSize: "0.65rem",
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  fontWeight: 600,
                                }}
                              >
                                {dish}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <style>{`
        /* Snap-scroll row */
        .cuisine-snap-row {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 16px;
          padding-bottom: 16px;
          scrollbar-width: thin;
          scrollbar-color: var(--wc-surface-2, #3A3430) transparent;
        }
        .cuisine-snap-row::-webkit-scrollbar {
          height: 4px;
        }
        .cuisine-snap-row::-webkit-scrollbar-track {
          background: transparent;
        }
        .cuisine-snap-row::-webkit-scrollbar-thumb {
          background: var(--wc-surface-2, #3A3430);
          border-radius: 2px;
        }

        /* Each snap card */
        .cuisine-snap-card {
          flex-shrink: 0;
          scroll-snap-align: start;
          width: 38vw;
          max-width: 320px;
          min-width: 220px;
          text-decoration: none;
          display: block;
        }
        @media (max-width: 640px) {
          .cuisine-snap-card {
            width: 72vw;
          }
        }

        .cuisine-card-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .cuisine-snap-card:hover .cuisine-card-inner {
          transform: scale(1.02);
          background: var(--wc-surface-2, #3A3430) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        /* Image section */
        .cuisine-card-img-wrap {
          position: relative;
          height: 130px;
          overflow: hidden;
        }
        .cuisine-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .cuisine-snap-card:hover .cuisine-card-img {
          transform: scale(1.06);
        }
        .cuisine-card-img-overlay {
          position: absolute;
          inset: 0;
        }
        .cuisine-card-img-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0 12px 10px;
        }

        /* Card body */
        .cuisine-card-body {
          padding: 10px 12px 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 8px;
          min-height: 100px;
        }

        /* Dishes section — slide up on hover */
        .cuisine-card-dishes {
          margin-top: auto;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(8px);
          transition: max-height 0.25s ease, opacity 0.2s ease, transform 0.25s ease;
        }
        .cuisine-snap-card:hover .cuisine-card-dishes {
          max-height: 80px;
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </>
  );

  const byRegionContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {CULINARY_REGIONS.map((region) => {
        const count = getCulinaryRegionCount(region.cuisineSlugs);
        const cuisineCards = region.cuisineSlugs
          .map((s) => CUISINES.find((c) => c.slug === s))
          .filter(Boolean)
          .slice(0, 4) as typeof CUISINES;
        return (
          <div key={region.id}
            data-continent={region.name}
            className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              border: "1.5px solid var(--wc-border-subtle, rgba(90,50,20,0.25))",
              background: "var(--wc-bg-card, #F5EFE6)",
            }}
          >
            {/* Hero image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={region.heroImage}
                alt={region.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,5,2,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: region.color }} />

              {/* Floating emoji badge */}
              <div
                className="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
              >
                {region.emoji}
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <h3
                  className="text-white font-extrabold text-xl leading-tight drop-shadow mb-1"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {region.name}
                </h3>
                {count > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)" }}>
                    {count} recipes
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <p
                className="text-xs leading-relaxed mb-4"
                style={{ color: "var(--wc-text-3, #7A5A40)" }}
              >
                {region.description}
              </p>

              {/* Cuisine pills */}
              <div className="flex flex-wrap gap-2">
                {cuisineCards.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/cuisines/${c.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 hover:-translate-y-0.5"
                    style={{ background: c.bg, color: c.color }}
                  >
                    <span>{flagEmoji(c.flag)}</span>
                    {c.name}
                  </Link>
                ))}
                {region.cuisineSlugs.length > 4 && (
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: "var(--wc-bg-surface, #EDE4D8)",
                      color: "var(--wc-text-4, #8A7060)",
                    }}
                  >
                    +{region.cuisineSlugs.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const totalRecipes = Object.values(countMap).reduce((a, b) => a + b, 0);
  const totalCuisines = CUISINES.length;
  const totalRegions = CULINARY_REGIONS.length;

  return (
    <CuisinesPageWrapper>
      <div>
        {/* ── Hero banner ── */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, var(--wc-pal-darkest, #1A1208) 0%, var(--wc-pal-dark, #2E1E10) 50%, var(--wc-pal-mid, #5F3E2D) 100%)",
            borderBottom: "1px solid rgba(90,50,20,0.35)",
          }}
        >
          {/* Decorative food items */}
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
            <span className="absolute top-6 right-16 text-5xl opacity-10 rotate-12">🫕</span>
            <span className="absolute top-16 right-36 text-4xl opacity-8 -rotate-6">🍜</span>
            <span className="absolute bottom-6 right-10 text-5xl opacity-10 rotate-6">🥘</span>
            <span className="absolute top-8 left-8 text-3xl opacity-8 rotate-3">🌮</span>
            <span className="absolute bottom-8 left-24 text-4xl opacity-10 -rotate-8">🍛</span>
            <span className="absolute top-4 left-[40%] text-3xl opacity-6 rotate-12">🫙</span>
          </div>

          <div className="relative px-8 py-12 max-w-5xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-1"
                style={{ background: "linear-gradient(135deg, var(--wc-pal-accent, #B07D56), var(--wc-pal-mid, #5F3E2D))" }}
              >
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-3xl font-extrabold leading-tight mb-2"
                  style={{ color: "var(--wc-pal-lightest, #F3F1ED)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Cuisine Atlas
                </h1>
                <p className="text-sm leading-relaxed max-w-lg" style={{ color: "rgba(239,227,206,0.65)" }}>
                  Every cuisine is a conversation between land, climate, and the people who tend their fires. Explore traditions from{" "}
                  <span style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Moroccan tagines</span> to{" "}
                  <span style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Japanese ramen</span> — every dish has a story worth tasting.
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              {[
                { value: totalCuisines, label: "cuisines" },
                { value: totalRegions, label: "flavour regions" },
                ...(totalRecipes > 0 ? [{ value: totalRecipes, label: "recipes" }] : []),
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex items-baseline gap-1.5 px-4 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(176,125,86,0.2)" }}
                >
                  <span className="text-2xl font-bold" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>{value}</span>
                  <span className="text-xs" style={{ color: "rgba(239,227,206,0.5)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-8 max-w-5xl mx-auto">
          {/* Tabbed: By Country vs By Region */}
          <CuisinesTabs
            byCountryContent={byCountryContent}
            byRegionContent={byRegionContent}
          />
        </div>
      </div>
    </CuisinesPageWrapper>
  );
}
