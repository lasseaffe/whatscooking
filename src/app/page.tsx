import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { SwiperSection } from "@/components/landing/SwiperSection";
import { MealPlannerDemo } from "@/components/landing/feature-demos/MealPlannerDemo";
import { DiscoverDemo } from "@/components/landing/feature-demos/DiscoverDemo";
import { MealSwipeDemo } from "@/components/landing/feature-demos/MealSwipeDemo";
import { ImportDemo } from "@/components/landing/feature-demos/ImportDemo";
import { EventsDemo } from "@/components/landing/feature-demos/EventsDemo";
import { PantryDemo } from "@/components/landing/feature-demos/PantryDemo";
import { CollabDemo } from "@/components/landing/feature-demos/CollabDemo";
import { RecsDemo } from "@/components/landing/feature-demos/RecsDemo";
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

const FEATURES = [
  { id: 'planner',  label: 'AI Meal Planner',        desc: 'A fully personalised weekly meal plan with shopping lists, built around your life.', Demo: MealPlannerDemo, href: '/plans' },
  { id: 'swipe',    label: 'Meal Swipe',              desc: "Swipe through recipes. Like what you see, skip what you don't.",                    Demo: MealSwipeDemo,   href: '/discover' },
  { id: 'discover', label: 'Discover & Trending',     desc: 'Browse trending recipes by cuisine, cooking time, dietary needs, or mood.',          Demo: DiscoverDemo,    href: '/discover' },
  { id: 'import',   label: 'Social Recipe Import',    desc: 'Spotted something on Instagram or TikTok? Paste the link, get every ingredient.',   Demo: ImportDemo,      href: '/my-recipes/new' },
  { id: 'events',   label: 'Events & Occasions',      desc: 'Plan the perfect date night, birthday, or dinner party with AI-curated menus.',      Demo: EventsDemo,      href: '/events' },
  { id: 'pantry',   label: 'Smart Pantry',            desc: 'Track what you have, get alerts before things expire, zero food waste.',             Demo: PantryDemo,      href: '/pantry' },
  { id: 'collab',   label: 'Collaborative Cooking',   desc: 'Plan meals with family or friends in real time.',                                    Demo: CollabDemo,      href: '/plans' },
  { id: 'recs',     label: 'Smart Recommendations',   desc: 'The more you cook, the smarter it gets.',                                            Demo: RecsDemo,        href: '/discover' },
] as const;

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: topRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .not("image_url", "is", null)
    .not("image_status", "eq", "bad")
    .order("like_count", { ascending: false })
    .limit(20);

  const heroRecipe: Recipe = topRecipes && topRecipes.length > 0
    ? topRecipes[Math.floor(Math.random() * topRecipes.length)]
    : { id: '', title: "Tonight's Recipe", image_url: null, cuisine_type: null, cook_time_minutes: null, calories: null };

  const { data: stripRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url")
    .not("image_url", "is", null)
    .not("image_status", "eq", "bad")
    .neq("id", heroRecipe.id)
    .order("like_count", { ascending: false })
    .limit(30);

  const { data: swiperRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .not("image_url", "is", null)
    .not("image_status", "eq", "bad")
    .neq("id", heroRecipe.id)
    .order("like_count", { ascending: false })
    .limit(10);

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

      {/* Hero: Ken Burns + Scroll Strip */}
      <HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes ?? []} />

      {/* In-page swiper */}
      <SwiperSection heroRecipe={heroRecipe} moreRecipes={swiperRecipes ?? []} />

      {/* Features bento grid */}
      <section style={{ background: 'color-mix(in srgb, var(--wc-pal-accent, #B07040) 6%, #0a0503)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: 5, color: 'rgba(244,162,97,0.5)', marginBottom: 16, textTransform: 'uppercase' }}>What&apos;s inside</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px,4vw,48px)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.9)', marginBottom: 48 }}>
            Four courses of software
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'rgba(244,162,97,0.08)' }}>
            {FEATURES.map(({ id, label, desc, Demo, href }) => (
              <Link
                key={id}
                href={href}
                style={{ background: 'var(--bg-primary,#0a0503)', padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ marginBottom: 4 }}>
                  <Demo />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(239,227,206,0.9)' }}>{label}</h3>
                <p style={{ fontSize: 13, color: 'rgba(239,227,206,0.5)', lineHeight: 1.6 }}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-primary,#0a0503)', borderTop: '1px solid rgba(244,162,97,0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(239,227,206,0.3)', textTransform: 'uppercase' }}>
          What&apos;s Cooking — Est. 2024 — Volume I
        </p>
      </footer>
    </>
  );
}
