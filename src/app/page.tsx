import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScrollStrip } from "@/components/landing/ScrollStrip";
import { SwiperSection } from "@/components/landing/SwiperSection";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { RecipeShowcase } from "@/components/landing/RecipeShowcase";
import { CookbookShelf } from "@/components/landing/CookbookShelf";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  cook_time_minutes: number | null;
  calories: number | null;
};

type TrendingRecipe = Recipe & { likes_count: number | null };

export default async function LandingPage() {
  const supabase = await createClient();

  // Hero recipe — still pulled from DB for metadata (title, cuisine, time, kcal)
  // but the image is replaced by the curated allowlist in HeroSection
  const { data: topRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .eq("image_status", "ok")
    .ilike("image_url", "%supabase%")
    .order("created_at", { ascending: false })
    .limit(20);

  const heroRecipe: Recipe = topRecipes && topRecipes.length > 0
    ? topRecipes[Math.floor(Math.random() * topRecipes.length)]
    : { id: '', title: "Birria Tacos", image_url: null, cuisine_type: "Mexican", cook_time_minutes: 75, calories: 620 };

  // Curated index — server-randomised so it's stable per SSR render
  const curatedIndex = Math.floor(Math.random() * 9);

  const { data: stripRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url")
    .not("image_url", "is", null)
    .neq("id", heroRecipe.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: swiperRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .not("image_url", "is", null)
    .neq("id", heroRecipe.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Trending — try likes_count, fall back to most recent
  const { data: trendingRaw } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories, likes_count")
    .not("image_url", "is", null)
    .order("likes_count", { ascending: false, nullsFirst: false })
    .limit(5);

  const trendingRecipes: TrendingRecipe[] = (trendingRaw && trendingRaw.length >= 3)
    ? trendingRaw
    : (swiperRecipes ?? []).slice(0, 5).map(r => ({ ...r, likes_count: null }));

  return (
    <>
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(rgba(10,5,3,0.8),transparent)', backdropFilter: 'blur(2px)' }}>
        <Link href="/" style={{ fontSize: 13, letterSpacing: 4, color: 'rgba(239,227,206,0.9)', textDecoration: 'none', textTransform: 'uppercase' }}>
          What&apos;s Cooking
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.6)', textDecoration: 'none', textTransform: 'uppercase' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.9)', textDecoration: 'none', textTransform: 'uppercase', background: '#8B2635', padding: '8px 16px', borderRadius: 2 }}>Get Started</Link>
        </div>
      </header>

      {/* Hero — 70svh, cinematic image left + cooking mode panel right */}
      <HeroSection heroRecipe={heroRecipe} curatedIndex={curatedIndex} />

      {/* Scroll strip — hidden on mobile, decorative on desktop */}
      <div className="hidden md:block" style={{ position: 'relative', overflow: 'hidden', height: 220, borderTop: '1px solid rgba(201,169,110,0.08)', background: 'var(--bg-primary, #0a0503)' }}>
        <ScrollStrip recipes={stripRecipes ?? []} />
      </div>

      {/* Swiper section — 60vh, card left + trending right */}
      <SwiperSection heroRecipe={heroRecipe} moreRecipes={swiperRecipes ?? []} trendingRecipes={trendingRecipes} />

      <FeatureCarousel />

      <RecipeShowcase />

      <CookbookShelf />

      <footer style={{ background: 'var(--bg-primary,#0a0503)', borderTop: '1px solid rgba(244,162,97,0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(239,227,206,0.3)', textTransform: 'uppercase' }}>
          What&apos;s Cooking — Est. 2024 — Volume I
        </p>
      </footer>
    </>
  );
}
