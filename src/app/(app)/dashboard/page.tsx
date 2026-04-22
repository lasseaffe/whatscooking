import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Sparkles, UtensilsCrossed, ShoppingBasket, ChefHat,
  Clock, Flame, ArrowRight, Heart, BookOpen, Target,
} from "lucide-react";
import type { MealPlan } from "@/lib/types";
import { DirtySodaSlideshow, type SodaSlide } from "./dirty-soda-slideshow";
import { DashboardScramble } from "./dashboard-scramble";
import { ScrollReveal } from "@/components/scroll-reveal";

type FeaturedRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  dish_types: string[] | null;
  dietary_tags: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  source_name: string | null;
  source_url: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: recentPlans },
    { count: pantryCount },
    { data: sodaRows },
    { data: featuredRows },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase
      .from("meal_plans")
      .select("id, title, week_start, meals_per_day, duration_days, status, dietary_filters")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("pantry_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("recipes")
      .select("id, title, description, image_url, source_name, source_url")
      .eq("source", "curated")
      .contains("dish_types", ["drink"])
      .limit(5),
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, calories, source_name, source_url")
      .eq("source", "curated")
      .not("dish_types", "cs", '["drink"]')
      .limit(4),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const hasPantry = (pantryCount ?? 0) >= 2;
  const sodaSlides: SodaSlide[] = (sodaRows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    image_url: r.image_url,
    source_name: r.source_name,
    source_url: r.source_url,
  }));
  const featuredRecipes: FeaturedRecipe[] = (featuredRows ?? []) as FeaturedRecipe[];

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── Video Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: "38vh" }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.45)" }}
        >
          <source src="/boiling-sauce.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,4,2,0.3) 0%, rgba(8,4,2,0.75) 100%)" }} />
        <div className="relative px-6 py-14 flex flex-col justify-end" style={{ minHeight: "38vh" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(239,227,206,0.55)" }}>
            Welcome back
          </p>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            Hey, {firstName}
          </h1>
          <p className="text-base" style={{ color: "rgba(239,227,206,0.7)" }}>
            What are you cooking this week?
          </p>
        </div>
      </div>

      <div className="px-6 space-y-10">

      {/* ── Scramble widget ── */}
      {hasPantry && <ScrollReveal><DashboardScramble /></ScrollReveal>}

      {/* ── Dirty Soda Slideshow ── */}
      {sodaSlides.length > 0 && <ScrollReveal delay={60}><DirtySodaSlideshow slides={sodaSlides} /></ScrollReveal>}

      {/* ── Feature cards ── */}
      <ScrollReveal>
      <div>
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-5"
          style={{ color: "#6B4E36" }}
        >
          What do you want to do?
        </h2>
        <ScrollReveal group className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* AI Meal Plans */}
          <Link
            href="/plans/new"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #2A1808 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#C8522A" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  AI Meal Planner
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  Describe your week — AI builds a full meal plan in seconds.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#C8522A" }}>
                Generate plan <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Find Recipes */}
          <Link
            href="/discover"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #1E2010 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#828E6F" }}>
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  Find Recipes
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  Browse curated recipes from NYT Cooking, Serious Eats, Bon Appétit, TikTok and more.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#828E6F" }}>
                Browse recipes <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* My Pantry */}
          <Link
            href="/pantry"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #241A08 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#B07A52" }}>
                <ShoppingBasket className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                    My Pantry
                  </h3>
                  {pantryCount != null && pantryCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#2A1808", color: "#B07A52", border: "1px solid #B07A5230" }}>
                      {pantryCount} items
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  Track what&apos;s in your fridge. We&apos;ll suggest recipes using exactly what you have.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#B07A52" }}>
                {pantryCount ? "View pantry" : "Add ingredients"}{" "}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Meal Plans */}
          <Link
            href="/plans"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #1E1A08 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#5D4037" }}>
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  My Meal Plans
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  View, edit, and track all your meal plans with nutrition totals.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#C89818" }}>
                View plans <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Saved Recipes */}
          <Link
            href="/saved"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #2A1410 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#8C3A28" }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  Saved Recipes
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  Your bookmarked recipes — your personal collection.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#C8522A" }}>
                View saved <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* My Recipes */}
          <Link
            href="/my-recipes"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #18201A 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#3D5030" }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  My Recipes
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  Create and publish your own recipes. Build your fan community.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#828E6F" }}>
                Manage recipes <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Calorie Tracker */}
          <Link
            href="/calorie-tracker"
            className="group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-1"
            style={{ borderColor: "#3A2416", background: "#1C1209" }}
          >
            <div className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #162018 0%, #1C1209 100%)" }} />
            <div className="relative p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#4A6830" }}>
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  Calorie Tracker
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A6A4A" }}>
                  Set goals, log meals, track weight and get personalised tips.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#828E6F" }}>
                Track progress <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

        </ScrollReveal>
      </div>
      </ScrollReveal>

      {/* ── Featured Recipes ── */}
      {featuredRecipes.length > 0 && (
        <ScrollReveal>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-bold text-lg"
              style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Trending this week
            </h2>
            <Link href="/discover" className="text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{ color: "#C8522A" }}>
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredRecipes.map((recipe) => {
              const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
              return (
                <Link
                  key={recipe.id}
                  href="/discover"
                  className="group rounded-2xl overflow-hidden border flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: "#3A2416", background: "#1C1209" }}
                >
                  <div className="relative h-36 overflow-hidden shrink-0" style={{ background: "#241809" }}>
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: "brightness(0.88) saturate(0.9)" }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8" style={{ color: "#3A2416" }} />
                      </div>
                    )}
                    <div className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(13,9,7,0.7) 0%, transparent 55%)" }} />
                    {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: "rgba(13,9,7,0.75)", color: "#EFE3CE", backdropFilter: "blur(4px)" }}>
                          {recipe.dietary_tags[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "#EFE3CE" }}>
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-auto">
                      {totalTime > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#6B4E36" }}>
                          <Clock className="w-3 h-3" />{totalTime}m
                        </span>
                      )}
                      {recipe.calories && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#6B4E36" }}>
                          <Flame className="w-3 h-3" />{recipe.calories}
                        </span>
                      )}
                      {recipe.cuisine_type && (
                        <span className="text-xs ml-auto truncate" style={{ color: "#6B4E36" }}>
                          {recipe.cuisine_type}
                        </span>
                      )}
                    </div>
                    {recipe.source_name && (
                      <p className="text-xs truncate" style={{ color: "#4A3020" }}>
                        {recipe.source_name}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        </ScrollReveal>
      )}

      {/* ── Recent Meal Plans ── */}
      <ScrollReveal delay={80}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold text-lg"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Your meal plans
          </h2>
          <Link href="/plans" className="text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ color: "#C8522A" }}>
            View all →
          </Link>
        </div>

        {recentPlans && recentPlans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentPlans.map((plan: Pick<MealPlan, "id" | "title" | "week_start" | "meals_per_day" | "duration_days" | "status" | "dietary_filters">) => (
              <Link key={plan.id} href={`/plans/${plan.id}`}>
                <div className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-1"
                  style={{ borderColor: "#3A2416", background: "#1C1209" }}>
                  <div className="h-16 w-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #241809 0%, #2A1B0D 100%)" }}>
                    <ChefHat className="w-6 h-6" style={{ color: "#4A3020" }} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-snug" style={{ color: "#EFE3CE" }}>
                        {plan.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: plan.status === "active" ? "#2A1808" : "#1A1A08",
                          color: plan.status === "active" ? "#C8522A" : "#C89818",
                          border: `1px solid ${plan.status === "active" ? "#C8522A20" : "#C8981820"}`,
                        }}>
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#6B4E36" }}>
                      {plan.duration_days ?? 7}d · {plan.meals_per_day ?? 3} meals/day
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-10 text-center"
            style={{ borderColor: "#2A1A0C", borderStyle: "dashed", background: "#161009" }}>
            <ChefHat className="w-8 h-8 mx-auto mb-3" style={{ color: "#3A2416" }} />
            <p className="text-sm mb-1 font-semibold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              No meal plans yet
            </p>
            <p className="text-xs mb-4" style={{ color: "#6B4E36" }}>
              Let AI build your first week in seconds.
            </p>
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm btn-primary-glow"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              <Sparkles className="w-4 h-4" />
              Generate meal plan
            </Link>
          </div>
        )}
      </div>
      </ScrollReveal>
    </div>
    </div>
  );
}
