import Link from "next/link";
import { Sparkles, ExternalLink, BookOpen, Flame, Users, TrendingUp, Heart, Calendar, ShoppingBasket } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0D0907", color: "#EFE3CE" }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(13,9,7,0.55)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="10" stroke="#C8522A" strokeWidth="1.5" />
            <path d="M7 11 C7 8 11 6 15 11 C11 16 7 14 7 11Z" fill="#C8522A" opacity="0.7" />
          </svg>
          <span className="font-serif-display text-sm tracking-widest uppercase" style={{ color: "#EFE3CE", letterSpacing: "0.12em" }}>
            What&apos;s Cooking
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {["Discover", "Recipes", "Plans", "Premium"].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase()}`}
              className="text-xs tracking-widest uppercase transition-opacity hover:opacity-100 opacity-70"
              style={{ color: "#EFE3CE", letterSpacing: "0.1em" }}
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
            className="text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity hidden sm:block"
            style={{ color: "#EFE3CE" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-xs tracking-widest uppercase px-4 py-2 rounded-sm transition-all hover:opacity-90"
            style={{ background: "#C8522A", color: "#fff", letterSpacing: "0.08em" }}
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative w-full" style={{ height: "100svh", minHeight: 600 }}>

        {/* Full-bleed video background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/boiling-sauce.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(13,9,7,0.45) 0%, rgba(13,9,7,0.22) 30%, rgba(13,9,7,0.60) 70%, rgba(13,9,7,0.90) 100%)",
            }}
          />
        </div>

        {/* Hero copy — centred */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 gap-8">

          {/* Eyebrow */}
          <p
            className="text-xs tracking-widest uppercase animate-fade-in"
            style={{ color: "rgba(239,227,206,0.6)", letterSpacing: "0.18em" }}
          >
            Established 2024
          </p>

          {/* Headline */}
          <h1
            className="font-serif-display animate-fade-in-up"
            style={{
              fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)",
              lineHeight: 1.12,
              color: "#F5EDD8",
              maxWidth: "14ch",
              textShadow: "0 2px 32px rgba(0,0,0,0.55)",
              fontStyle: "italic",
            }}
          >
            The soul of the home is the simmer of the stove.
          </h1>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center animate-fade-in delay-200">
            <Link
              href="/discover"
              className="px-7 py-3 text-xs tracking-widest uppercase font-medium transition-all hover:opacity-90 btn-primary-glow"
              style={{ background: "#C8522A", color: "#fff", letterSpacing: "0.1em" }}
            >
              Explore the journal
            </Link>
            <Link
              href="/signup"
              className="px-7 py-3 text-xs tracking-widest uppercase font-medium transition-all hover:bg-white/10"
              style={{
                border: "1px solid rgba(239,227,206,0.5)",
                color: "#EFE3CE",
                letterSpacing: "0.1em",
                background: "rgba(13,9,7,0.25)",
                backdropFilter: "blur(6px)",
              }}
            >
              Today&apos;s specials
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-500"
          style={{ color: "rgba(239,227,206,0.4)" }}
          aria-hidden
        >
          <span className="text-xs tracking-widest uppercase" style={{ letterSpacing: "0.14em", fontSize: "0.6rem" }}>Scroll</span>
          <div className="w-px h-10" style={{ background: "linear-gradient(to bottom, rgba(239,227,206,0.3), transparent)" }} />
        </div>
      </section>

      {/* ── Features strip ──────────────────────────────── */}
      <section className="px-8 py-24 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-14">
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #3A2416)" }} />
          <h2
            className="font-serif-display text-center"
            style={{ color: "#8A6A4A", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            The kitchen, reimagined
          </h2>
          <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #3A2416)" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "#261708" }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="p-8 transition-colors feature-cell"
            >
              <div className="w-8 h-8 flex items-center justify-center mb-5 rounded-sm" style={{ background: "#1C1209" }}>
                <f.icon className="w-4 h-4" style={{ color: "#C8522A" }} />
              </div>
              <h3
                className="font-serif-display mb-3"
                style={{ color: "#EFE3CE", fontSize: "1.05rem" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B4E36" }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Plan Your Event teaser ───────────────────────── */}
      <section className="px-8 pb-16 max-w-6xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-sm" style={{background:"linear-gradient(135deg,#1C0E06,#2A1206)", border:"1px solid #3A2416"}}>
          <div className="px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1">
              <p className="text-xs tracking-widest uppercase mb-3" style={{color:"#8A6A4A",letterSpacing:"0.16em"}}>New feature</p>
              <h2 className="font-serif-display text-2xl mb-3" style={{color:"#EFE3CE"}}>Plan the perfect occasion</h2>
              <p className="text-sm leading-relaxed max-w-lg" style={{color:"#8A6A4A"}}>Date night, family brunch, birthday party — pick your occasion and get AI-curated recipes, decoration ideas, and a full itinerary.</p>
              <Link href="/events" className="inline-block mt-5 text-xs px-5 py-2.5 tracking-widest uppercase" style={{background:"#C8522A",color:"#fff",letterSpacing:"0.08em"}}>Plan an event</Link>
            </div>
            <div className="text-6xl shrink-0 hidden sm:block select-none opacity-70">🎉</div>
          </div>
        </div>
      </section>

      {/* ── Flavour ad ──────────────────────────────────── */}
      <section className="px-8 pb-24 max-w-6xl mx-auto w-full">
        <div
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(120deg, #1C0E06 0%, #2A1206 50%, #3A1A08 100%)", border: "1px solid #3A2416" }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=60")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#8A6A4A", letterSpacing: "0.16em" }}>
                Trending in communities
              </p>
              <h2 className="font-serif-display text-2xl mb-3" style={{ color: "#EFE3CE" }}>
                Utah&apos;s Dirty Soda Culture
              </h2>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: "#8A6A4A" }}>
                Coconut cream, house-made syrups, zero alcohol — the soda-shop drinks that became a beloved
                community tradition. Explore the recipes, or discover AI-powered gospel content on HolyFlex.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/discover"
                  className="text-xs px-5 py-2.5 tracking-widest uppercase transition-all hover:opacity-90"
                  style={{ background: "#C8522A", color: "#fff", letterSpacing: "0.08em" }}
                >
                  See recipes
                </Link>
                <a
                  href="https://holyflex.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-5 py-2.5 tracking-widest uppercase flex items-center gap-2 transition-all hover:opacity-80"
                  style={{ border: "1px solid #3A2416", color: "#8A6A4A", letterSpacing: "0.08em" }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  HolyFlex
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="text-6xl shrink-0 hidden sm:block select-none opacity-70">🥤</div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer
        className="border-t py-8 text-center"
        style={{ borderColor: "#261708", color: "#3D2A1A" }}
      >
        <p className="text-xs tracking-widest uppercase" style={{ letterSpacing: "0.14em", fontSize: "0.6rem" }}>
          What&apos;s Cooking — Plan smarter, cook better.
        </p>
      </footer>
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
