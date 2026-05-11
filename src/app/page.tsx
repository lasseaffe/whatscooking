import Link from "next/link";
import { Sparkles, ExternalLink, BookOpen, Flame, Users, TrendingUp, Heart, Calendar, ShoppingBasket, UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReportButton } from "@/components/landing/ReportButton";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: trendingRecipes } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, dietary_tags")
    .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
    .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);
  return (
    <div className="min-h-screen flex flex-col" style={{ color: "var(--fg-primary, #fff)" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          background: "color-mix(in srgb, var(--bg-depth, #090908) 70%, transparent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid color-mix(in srgb, var(--wc-pal-accent, #B07040) 18%, transparent)",
        }}
      >
        {/* Logotype */}
        <div className="flex items-center gap-3">
          <UtensilsCrossed
            className="w-[18px] h-[18px]"
            strokeWidth={1.4}
            style={{ color: "var(--wc-accent-persimmon, #8B2635)" }}
          />
          <span
            className="font-serif-display text-sm tracking-[0.12em] uppercase"
            style={{ color: "var(--fg-primary, #EFE3CE)" }}
          >
            What&apos;s Cooking
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-10">
          {["Discover", "Recipes", "Plans", "Premium"].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase()}`}
              className="label-ornament transition-opacity opacity-55 hover:opacity-100"
              style={{ color: "var(--fg-primary, #EFE3CE)" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth + theme */}
        <div className="flex items-center gap-3">
          <ThemeToggle variant="compact" />
          <Link
            href="/login"
            className="label-ornament opacity-50 hover:opacity-90 transition-opacity hidden sm:block"
            style={{ color: "var(--fg-primary, #EFE3CE)" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="label-ornament px-5 py-2.5 transition-all hover:opacity-90"
            style={{
              background: "var(--wc-accent-persimmon, #8B2635)",
              color: "#F8F3E8",
              letterSpacing: "0.08em",
            }}
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero — full-bleed video ───────────────────────────── */}
      <section className="relative w-full" style={{ height: "100svh", minHeight: 600 }}>
        <div className="absolute inset-0 overflow-hidden">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/boiling-sauce.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(13,9,7,0.40) 0%, rgba(13,9,7,0.18) 28%, rgba(13,9,7,0.58) 68%, rgba(13,9,7,0.92) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 gap-7">
          {/* Eyebrow ornament */}
          <div className="flex items-center gap-4 animate-fade-in" style={{ color: "rgba(239,227,206,0.5)" }}>
            <span className="h-px w-8" style={{ background: "var(--wc-accent-persimmon, #8B2635)" }} />
            <span className="label-ornament">Established 2024 — Volume I</span>
            <span className="h-px w-8" style={{ background: "var(--wc-accent-persimmon, #8B2635)" }} />
          </div>

          {/* Headline */}
          <h1
            className="font-serif-display animate-fade-in-up"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 6rem)",
              lineHeight: 1.08,
              color: "#F5EDD8",
              maxWidth: "15ch",
              textShadow: "0 2px 40px rgba(0,0,0,0.6)",
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            The soul of the home is the{" "}
            <em style={{ color: "var(--wc-accent-persimmon, #8B2635)", fontStyle: "italic" }}>
              simmer of the stove.
            </em>
          </h1>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center animate-fade-in" style={{ animationDelay: "200ms" }}>
            <Link
              href="/discover"
              className="label-ornament px-8 py-3.5 transition-all hover:opacity-90 btn-primary-glow"
              style={{ background: "var(--wc-accent-persimmon, #8B2635)", color: "#F8F3E8", letterSpacing: "0.1em" }}
            >
              Explore the journal
            </Link>
            <Link
              href="/signup"
              className="label-ornament px-8 py-3.5 transition-all hover:bg-[var(--glow-on-neutral-hover)]"
              style={{
                border: "1px solid rgba(239,227,206,0.4)",
                color: "#EFE3CE",
                letterSpacing: "0.1em",
                background: "rgba(13,9,7,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              Today&apos;s specials
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: "rgba(239,227,206,0.35)" }}
          aria-hidden
        >
          <span className="label-ornament" style={{ fontSize: "0.55rem" }}>Scroll</span>
          <div className="w-px h-10" style={{ background: "linear-gradient(to bottom, rgba(239,227,206,0.28), transparent)" }} />
        </div>
      </section>

      {/* ── Section divider ornament ─────────────────────── */}
      <SectionDivider />

      {/* ── Features grid ────────────────────────────────── */}
      <section className="relative z-10 px-8 py-20 max-w-6xl mx-auto w-full">
        {/* Section label */}
        <div className="text-center mb-16 space-y-4">
          <p className="label-ornament" style={{ color: "var(--wc-accent-persimmon, #8B2635)", letterSpacing: "0.45em" }}>
            — The Kitchen, Reimagined —
          </p>
          <h2
            className="font-serif-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
              color: "var(--fg-primary, #EFE3CE)",
              fontWeight: 300,
              fontStyle: "italic",
            }}
          >
            Four courses of <em style={{ color: "var(--wc-accent-persimmon, #8B2635)" }}>software</em>
          </h2>
        </div>

        {/* Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{
            background: "color-mix(in srgb, var(--wc-pal-accent, #B07040) 15%, transparent)",
            border: "1px solid color-mix(in srgb, var(--wc-pal-accent, #B07040) 20%, transparent)",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="p-9 transition-colors feature-cell group"
              style={{ background: "var(--bg-primary, #121211)" }}
            >
              <div
                className="flex items-start justify-between mb-6"
              >
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--wc-accent-persimmon, #8B2635) 12%, transparent)" }}
                >
                  <f.icon
                    className="w-4 h-4"
                    strokeWidth={1.3}
                    style={{ color: "var(--wc-accent-persimmon, #8B2635)" }}
                  />
                </div>
                <span className="label-ornament opacity-40" style={{ fontSize: "0.58rem", letterSpacing: "0.3em" }}>
                  Course {(i + 1).toString().padStart(2, "0")}
                </span>
              </div>
              <h3
                className="font-serif-display mb-3 group-hover:text-claret transition-colors"
                style={{ color: "var(--fg-primary, #EFE3CE)", fontSize: "1.1rem", fontWeight: 400 }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--fg-tertiary, #9c9c9b)" }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Editorial quote ───────────────────────────────── */}
      <section className="relative z-10 px-8 py-20 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-6">
          <hr className="rule-editorial max-w-xs mx-auto" />
          <blockquote
            className="font-serif-display"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.8rem)",
              color: "var(--fg-primary, #EFE3CE)",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 1.35,
              maxWidth: "34ch",
              margin: "0 auto",
            }}
          >
            &ldquo;Cooking is at once child&apos;s play and adult joy.{" "}
            <em style={{ color: "var(--wc-accent-persimmon, #8B2635)" }}>
              And cooking done with care
            </em>{" "}
            is an act of love.&rdquo;
          </blockquote>
          <footer className="label-ornament opacity-40" style={{ fontSize: "0.6rem" }}>
            — Craig Claiborne
          </footer>
          <hr className="rule-editorial max-w-xs mx-auto" />
        </div>
      </section>

      {/* ── Plan Your Event teaser ────────────────────────── */}
      <section className="relative z-10 px-8 pb-12 max-w-6xl mx-auto w-full">
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-secondary, #171716), var(--bg-tertiary, #1f1f1e))",
            border: "1px solid color-mix(in srgb, var(--wc-pal-accent, #B07040) 18%, transparent)",
          }}
        >
          {/* Top accent rule */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "2px",
              background: "linear-gradient(to right, transparent, var(--wc-accent-persimmon, #8B2635), transparent)",
              opacity: 0.6,
            }}
          />
          <div className="px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1">
              <p className="label-ornament mb-3" style={{ color: "var(--wc-pal-accent, #B07040)", letterSpacing: "0.4em" }}>
                New feature
              </p>
              <h2
                className="font-serif-display text-2xl mb-3"
                style={{ color: "var(--fg-primary, #EFE3CE)", fontWeight: 300, fontStyle: "italic" }}
              >
                Plan the perfect occasion
              </h2>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--fg-tertiary, #9c9c9b)" }}>
                Date night, family brunch, birthday party — pick your occasion and get AI-curated recipes,
                decoration ideas, and a full itinerary.
              </p>
              <Link
                href="/events"
                className="inline-block mt-5 label-ornament px-5 py-2.5 transition-all hover:opacity-90"
                style={{ background: "var(--wc-accent-persimmon, #8B2635)", color: "#F8F3E8", letterSpacing: "0.08em" }}
              >
                Plan an event
              </Link>
            </div>
            {/* Editorial accent block */}
            <div
              className="shrink-0 hidden sm:flex items-center justify-center w-24 h-24"
              style={{
                border: "1px solid color-mix(in srgb, var(--wc-accent-persimmon, #8B2635) 30%, transparent)",
              }}
            >
              <Calendar
                className="w-8 h-8"
                strokeWidth={1}
                style={{ color: "var(--wc-accent-persimmon, #8B2635)", opacity: 0.6 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Flavour ad — Dirty Soda ───────────────────────── */}
      <section className="relative z-10 px-8 pb-24 max-w-6xl mx-auto w-full">
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(120deg, var(--bg-secondary, #171716) 0%, var(--bg-tertiary, #1f1f1e) 100%)",
            border: "1px solid color-mix(in srgb, var(--wc-pal-accent, #B07040) 15%, transparent)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=60")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1">
              <p className="label-ornament mb-3" style={{ color: "var(--wc-pal-accent, #B07040)", letterSpacing: "0.4em" }}>
                Trending in communities
              </p>
              <h2
                className="font-serif-display text-2xl mb-3"
                style={{ color: "var(--fg-primary, #EFE3CE)", fontWeight: 300, fontStyle: "italic" }}
              >
                Utah&apos;s Dirty Soda Culture
              </h2>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--fg-tertiary, #9c9c9b)" }}>
                Coconut cream, house-made syrups, zero alcohol — the soda-shop drinks that became a beloved
                community tradition. Explore the recipes, or discover AI-powered gospel content on HolyFlex.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/discover"
                  className="label-ornament px-5 py-2.5 transition-all hover:opacity-90"
                  style={{ background: "var(--wc-accent-persimmon, #8B2635)", color: "#F8F3E8", letterSpacing: "0.08em" }}
                >
                  See recipes
                </Link>
                <a
                  href="https://holyflex.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-ornament px-5 py-2.5 flex items-center gap-2 transition-all hover:opacity-80"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--wc-pal-accent, #B07040) 30%, transparent)",
                    color: "var(--wc-pal-accent, #B07040)",
                    letterSpacing: "0.08em",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  HolyFlex
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div
              className="shrink-0 hidden sm:flex items-center justify-center w-24 h-24"
              style={{
                border: "1px solid color-mix(in srgb, var(--wc-pal-accent, #B07040) 20%, transparent)",
              }}
            >
              <span
                className="font-serif-display"
                style={{ fontSize: "2.5rem", color: "var(--wc-pal-accent, #B07040)", opacity: 0.55, fontStyle: "italic" }}
              >
                🥤
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Recipes ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-text, #EFE3CE)" }}
        >
          Trending Right Now
        </h2>
        <p className="text-sm mb-8" style={{ color: "#7A5A40" }}>
          Fresh from the community — no paywalls, no sign-up required.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(trendingRecipes ?? []).map((r) => (
            <a
              key={r.id}
              href={`/recipes/${r.id}`}
              className="group relative rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <ReportButton
                recipeId={r.id}
                recipeTitle={r.title}
                imageUrl={r.image_url}
              />
              <div className="relative overflow-hidden" style={{ paddingBottom: "66%" }}>
                <img
                  src={r.image_url ?? ""}
                  alt={r.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 flex flex-col gap-1">
                <p className="text-sm font-semibold line-clamp-2 leading-snug" style={{ color: "#EFE3CE" }}>{r.title}</p>
                <p className="text-xs" style={{ color: "#6B5040" }}>
                  {[r.cuisine_type, r.prep_time_minutes ? `${r.prep_time_minutes}m` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
            style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1C0E04" }}
          >
            Browse all recipes
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        className="relative z-10 border-t py-10 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--wc-pal-accent, #B07040) 15%, transparent)",
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-12" style={{ background: "color-mix(in srgb, var(--wc-pal-accent, #B07040) 25%, transparent)" }} />
          <UtensilsCrossed
            className="w-3.5 h-3.5"
            strokeWidth={1.4}
            style={{ color: "var(--wc-accent-persimmon, #8B2635)", opacity: 0.5 }}
          />
          <span className="h-px w-12" style={{ background: "color-mix(in srgb, var(--wc-pal-accent, #B07040) 25%, transparent)" }} />
        </div>
        <p
          className="label-ornament opacity-35"
          style={{ fontSize: "0.58rem", color: "var(--fg-tertiary, #9c9c9b)" }}
        >
          What&apos;s Cooking · Plan smarter, cook better · MMXXIV
        </p>
      </footer>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="relative z-10 flex items-center gap-6 px-8 py-4 max-w-6xl mx-auto w-full">
      <div
        className="flex-1"
        style={{
          height: "1px",
          background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--wc-pal-accent, #B07040) 28%, transparent))",
        }}
      />
      <UtensilsCrossed
        className="w-3.5 h-3.5 shrink-0"
        strokeWidth={1.4}
        style={{ color: "var(--wc-accent-persimmon, #8B2635)", opacity: 0.45 }}
      />
      <div
        className="flex-1"
        style={{
          height: "1px",
          background: "linear-gradient(to left, transparent, color-mix(in srgb, var(--wc-pal-accent, #B07040) 28%, transparent))",
        }}
      />
    </div>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "AI Meal Planner",
    description: "Tell us your preferences and get a fully personalised weekly meal plan with shopping lists, built around your life.",
  },
  {
    icon: Flame,
    title: "Discover & Trending",
    description: "Browse trending recipes from the community. Filter by cuisine, cooking time, dietary needs, or mood.",
  },
  {
    icon: Heart,
    title: "Meal Swipe",
    description: "Swipe through recipes like never before. Like what you see, skip what you don't.",
  },
  {
    icon: BookOpen,
    title: "Social Recipe Import",
    description: "Spotted something on Instagram or TikTok? Paste the link and we extract every ingredient and step automatically.",
  },
  {
    icon: Calendar,
    title: "Events & Occasions",
    description: "Plan the perfect date night, birthday, or dinner party with AI-curated menus.",
  },
  {
    icon: ShoppingBasket,
    title: "Smart Pantry",
    description: "Track what you have, get alerts before things expire, zero food waste.",
  },
  {
    icon: Users,
    title: "Collaborative Cooking",
    description: "Plan meals with family or friends in real time. Share notes, assign courses, and prep together effortlessly.",
  },
  {
    icon: TrendingUp,
    title: "Smart Recommendations",
    description: "The more you cook, the smarter it gets. Suggestions shaped by your taste, goals, and favourite cuisines.",
  },
];
