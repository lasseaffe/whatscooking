// What's Cooking — Living Moodboard Configuration
// EDITORIAL CONTENT ONLY. Mechanical tokens (hex, font-family) are read live
// from CSS via lib/readCssVar.ts. Update this file when design *intent* changes
// (new principle, new pattern name, new vocabulary, new do/don't pair).

export type ColorToken = {
  cssVar: string;
  name: string;
  usage: string;
  group: "semantic" | "wc" | "palette";
};

export type DoDontPair = {
  topic: string;
  wrong: { label: string; html: string };
  right: { label: string; html: string };
};

export type IconNote = { name: string; usage: string };

export const moodboard = {
  identity: {
    name: "What's Cooking",
    tagline: "Plan, cook, and discover — Culinary Parchment design system",
    philosophy:
      "Culinary Parchment. Warm, earthy, editorial. Recipes are objects worthy of typesetting — display serif headings, sturdy sans body, and a brass-and-stone palette that reads like the inside of a well-loved kitchen. Five dark palette personalities + one Tactile Elegance light mode ship by default. The site adapts; the voice stays.",
    pillars: [
      "Recipes are typography. Set them like a book, not a feed — see §12 Recipe Page Template for the full spatial contract.",
      "Six palette personalities: five dark + Tactile Elegance light mode (terracotta/linen/forest green).",
      "Context-sensitive backgrounds: hero pages at full opacity, functional pages dimmed, cooking mode near-invisible.",
      "Pantry-first matching. Discovery serves cooking, not the other way around.",
      "Plan builder: pinboard is the hero of the planning view, not a sidebar widget.",
    ],
  },

  colors: [
    // Foreground / background semantic
    { cssVar: "--bg-base", name: "Base", usage: "Default page ground (dark)", group: "semantic" },
    { cssVar: "--bg-primary", name: "Surface 1", usage: "Cards, primary surfaces", group: "semantic" },
    { cssVar: "--bg-secondary", name: "Surface 2", usage: "Inputs, secondary surfaces", group: "semantic" },
    { cssVar: "--bg-tertiary", name: "Surface 3", usage: "Hover / elevated", group: "semantic" },
    { cssVar: "--bg-accent", name: "Accent (blue)", usage: "Primary actions, links", group: "semantic" },
    { cssVar: "--bg-special", name: "Special (purple)", usage: "Highlights, premium tier", group: "semantic" },
    { cssVar: "--bg-destructive", name: "Destructive", usage: "Delete, remove — used sparingly", group: "semantic" },
    { cssVar: "--bg-positive", name: "Positive", usage: "Confirmations, in-pantry matches", group: "semantic" },
    { cssVar: "--bg-attention", name: "Attention", usage: "Warnings, low stock", group: "semantic" },
    { cssVar: "--fg-primary", name: "Text Primary", usage: "Body copy", group: "semantic" },
    { cssVar: "--fg-secondary", name: "Text Secondary", usage: "Subheads, metadata", group: "semantic" },
    { cssVar: "--fg-tertiary", name: "Text Tertiary", usage: "Captions", group: "semantic" },
    { cssVar: "--fg-quaternary", name: "Text Quaternary", usage: "Disabled, faint", group: "semantic" },

    // WC namespace
    { cssVar: "--wc-pal-accent", name: "Palette Accent", usage: "Active palette CTA / focus — set by data-palette", group: "wc" },
    { cssVar: "--wc-accent-saffron", name: "Saffron", usage: "Warm accent — pantry highlights", group: "wc" },
    { cssVar: "--wc-accent-persimmon", name: "Persimmon", usage: "Hot accent — featured callouts", group: "wc" },
    { cssVar: "--wc-text", name: "WC Text", usage: "Alias of --fg-primary", group: "wc" },
    { cssVar: "--wc-text-2", name: "WC Text 2", usage: "Alias of --fg-secondary", group: "wc" },
    { cssVar: "--wc-text-3", name: "WC Text 3", usage: "Alias of --fg-tertiary", group: "wc" },
    { cssVar: "--wc-border-default", name: "WC Border", usage: "Default border", group: "wc" },
  ] satisfies ColorToken[],

  fonts: [
    { cssVar: "--font-fraunces", role: "Display / Serif", note: "Fraunces — recipe headings, hero display. Variable axes are used selectively.", specimen: "Slow-Roasted Lamb Shoulder" },
    { cssVar: "--font-plus-jakarta-sans", role: "Body / UI", note: "Plus Jakarta Sans — UI sans, tight tracking, all interface chrome.", specimen: "Whisk butter and flour until smooth" },
    { cssVar: "--font-libre-baskerville", role: "Editorial", note: "Libre Baskerville — recipe card body, long-form cooking prose.", specimen: "Heat the oven to 220°C / 425°F" },
    { cssVar: "--font-geist-mono", role: "Monospace", note: "Geist Mono — quantities, units, timers, ingredient ratios.", specimen: "350g · 2 tbsp · 45 min · 220°C" },
  ],

  spacing: {
    scale: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80],
    radii: [
      { name: "Sharp", value: "0.3rem", note: "Borders, dividers" },
      { name: "Default", value: "0.5rem", note: "Buttons, inputs, badges (--radius)" },
      { name: "Medium", value: "0.75rem", note: "Cards, dropdowns" },
      { name: "Large", value: "1rem", note: "Hero cards, modal sheets" },
      { name: "Pill", value: "9999px", note: "Filter chips, avatars" },
    ],
  },

  modes: [
    { name: "Dark (default)", cssTrigger: "no attribute", intent: "Cast-iron kitchen at night. Deep neutral surfaces, blue/special accents." },
    { name: "Tactile Elegance (Light)", cssTrigger: 'html[data-theme="light"]', intent: "Sun-bleached linen surfaces, terracotta accent, forest green positive signals, charcoal text. Warm artisan afternoon." },
    { name: "Cast Iron & Thyme", cssTrigger: 'data-palette="cast-iron"', intent: "Moody dark kitchen — saffron brass accent." },
    { name: "Copper & Clove", cssTrigger: 'data-palette="copper-clove"', intent: "Warm amber spice — copper highlights." },
    { name: "Heirloom Orchard", cssTrigger: 'data-palette="heirloom-orchard"', intent: "Sophisticated warm tones — sage + walnut." },
    { name: "Sage & Stone", cssTrigger: 'data-palette="sage-stone"', intent: "Cool earthy greens — herb-forward." },
    { name: "Midnight Pantry", cssTrigger: 'data-palette="midnight-pantry"', intent: "Deep cool blues — restrained, late-night." },
  ],

  voice: {
    pillars: [
      "Specific over generic. 'Whisk the egg whites to stiff peaks' beats 'mix until ready.'",
      "Editorial over feedy. Recipe titles are typeset, not click-bait.",
      "Pantry-first. Surface what the user *can* cook before what they *might* want.",
    ],
    do: [
      "Slow-Roasted Lamb Shoulder",
      "Whisk butter and flour until smooth",
      "Heat the oven to 220°C / 425°F",
      "What's in your pantry tonight?",
    ],
    dont: [
      "OMG you NEED this recipe!",
      "Mix the stuff together",
      "Click here to view recipe",
      "Top 10 dinners you won't believe",
    ],
  },

  doDont: [
    {
      topic: "Recipe card heading",
      wrong: { label: "All-caps generic", html: '<h3 style="font-family:sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:0.05em">QUICK & EASY DINNER!!!</h3>' },
      right: { label: "Editorial Fraunces", html: '<h3 style="font-family:Fraunces,Georgia,serif;font-weight:600;font-size:24px;letter-spacing:-0.01em">Slow-Roasted Lamb Shoulder</h3>' },
    },
    {
      topic: "Quantity display",
      wrong: { label: "Inline plain", html: '<p style="font-family:sans-serif">350 grams of flour and 2 tablespoons butter</p>' },
      right: { label: "Mono with units", html: '<p style="font-family:ui-monospace,Consolas,monospace;font-size:14px">350g flour · 2 tbsp butter</p>' },
    },
    {
      topic: "CTA",
      wrong: { label: "Marketing shout", html: '<button style="background:#FF0033;color:#fff;border-radius:999px;padding:14px 24px;font-weight:900;text-transform:uppercase">UNLOCK RECIPE</button>' },
      right: { label: "Brass-accent action", html: '<button style="background:var(--wc-pal-accent,#B07D56);color:#1A1208;border-radius:8px;padding:10px 18px;font-weight:600">Open Recipe</button>' },
    },
    {
      topic: "Active challenge presence",
      wrong: {
        label: "Dim olive banner — easy to miss it's even running",
        html: '<div style="background:#1a2010;border:1px solid #3a5020;border-radius:12px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center"><div><div style="color:#7abd7a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px">⚡ Active Challenge — 0:12</div><div style="color:#EFE3CE;font-size:14px;font-weight:600">🎰 Appliance Roulette</div></div><span style="background:#7abd7a;color:#0d0d0c;border-radius:8px;padding:8px 16px;font-weight:700;font-size:12px">✓ Done</span></div>',
      },
      right: {
        label: "Bold LIVE bar — pulsing dot, persimmon, mono timer",
        html: '<div style="background:linear-gradient(135deg,#241712,#1F1B19);border:1px solid #F4A26155;border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 0 24px #F4A26122"><span style="width:10px;height:10px;border-radius:50%;background:#F4A261;flex-shrink:0"></span><span style="font-size:22px">🎰</span><span style="flex:1"><span style="display:block;color:#EFE3CE;font-size:14px;font-weight:700">Appliance Roulette</span><span style="color:#A08060;font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Live challenge · tap to open</span></span><span style="font-family:ui-monospace,monospace;font-size:18px;font-weight:700;color:#F4A261">0:12</span><span style="background:#E85D20;color:#0d0d0c;border-radius:10px;padding:8px 14px;font-weight:800;font-size:13px">✓ Done</span></div>',
      },
    },
    {
      topic: "Day density ribbon",
      wrong: {
        label: "Noisy multicolor chips",
        html: '<div style="display:flex;gap:6px;padding:8px;background:#1A120A"><span style="background:#FF3333;color:#fff;padding:3px 8px;border-radius:9999px;font-size:10px;font-weight:800">HEAVY COOK!</span><span style="background:#00CC44;color:#fff;padding:3px 8px;border-radius:9999px;font-size:10px;font-weight:800">LEFTOVERS</span><span style="background:#3366FF;color:#fff;padding:3px 8px;border-radius:9999px;font-size:10px;font-weight:800">PANTRY 60%</span></div>',
      },
      right: {
        label: "Three thin bands, scannable at a glance",
        html: '<div style="display:flex;flex-direction:column;gap:1px;width:96px;padding:8px;background:#1A120A"><div style="height:4px;border-radius:2px;background:color-mix(in srgb,#C8522A 14%,transparent);position:relative"><div style="position:absolute;inset:0;width:70%;background:#C8522A;border-radius:2px"></div></div><div style="height:4px;border-radius:2px;background:color-mix(in srgb,#4A8C5C 14%,transparent);position:relative"><div style="position:absolute;inset:0;width:100%;background:color-mix(in srgb,#4A8C5C 70%,transparent);border-radius:2px"></div></div><div style="height:4px;border-radius:2px;background:color-mix(in srgb,#6B4E36 35%,transparent);position:relative"><div style="position:absolute;inset:0;width:55%;background:#D7A04A;border-radius:2px"></div></div></div>',
      },
    },
    {
      topic: "World Cup matchday (allegiance, not generic hype)",
      wrong: {
        label: "Generic 'big game' hype card",
        html: '<div style="background:#10131A;border:1px solid #2A3550;border-radius:12px;padding:16px;text-align:center"><div style="color:#6E8BFF;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px">⚽ Big Game Tonight!</div><div style="color:#fff;font-size:18px;font-weight:900;margin:4px 0">Don\'t miss the action</div><button style="background:#6E8BFF;color:#fff;border:none;border-radius:999px;padding:10px 20px;font-weight:800;text-transform:uppercase;margin-top:8px">Watch Now</button></div>',
      },
      right: {
        label: "Allegiance matchday row — flags, your-team tag, ready-to-cook",
        html: '<div style="background:rgba(12,9,5,0.6);border:1px solid rgba(244,162,97,0.3);border-radius:16px;padding:12px 14px"><div style="display:flex;justify-content:space-between;color:#F4A261;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px"><span>Your matchday · Group D</span><span style="color:rgba(239,227,206,0.55);font-family:ui-monospace,monospace">20:00</span></div><div style="display:flex;align-items:center;gap:8px;margin-top:8px;color:#EFE3CE;font-weight:700;font-size:14px"><span>🇧🇷 Brazil</span><span style="color:rgba(239,227,206,0.35);font-size:11px">VS</span><span style="margin-left:auto">Australia 🇦🇺</span></div><div style="margin-top:8px;color:rgba(239,227,206,0.45);font-size:11px">🍿 Half-time snacks + signature dishes from both nations</div></div>',
      },
    },
    {
      topic: "Planner controls (recipe-first, not control-first)",
      wrong: {
        label: "A wall of filter chips burying the food",
        html: '<div style="background:#1A120A;padding:10px"><div style="display:flex;flex-wrap:wrap;gap:6px"><span style="border:1px solid #E67E22;color:#E67E22;border-radius:999px;padding:5px 10px;font-size:11px">Diet: high-protein</span><span style="border:1px solid #E67E22;color:#E67E22;border-radius:999px;padding:5px 10px;font-size:11px">Weeknight ≤30m</span><span style="border:1px solid #E67E22;color:#E67E22;border-radius:999px;padding:5px 10px;font-size:11px">Weekend ≤120m</span><span style="border:1px solid #E67E22;color:#E67E22;border-radius:999px;padding:5px 10px;font-size:11px">Squad 2</span><span style="border:1px solid #3A2A1A;color:#8A6A4A;border-radius:999px;padding:5px 10px;font-size:11px">Pantry-aware</span><span style="border:1px solid #E67E22;color:#E67E22;border-radius:999px;padding:5px 10px;font-size:11px">Anti-repeat: moderate</span><span style="border:1px solid #3A2A1A;color:#8A6A4A;border-radius:999px;padding:5px 10px;font-size:11px">Batch</span></div></div>',
      },
      right: {
        label: "One “Tune” control + a quiet summary line",
        html: '<div style="background:linear-gradient(180deg,#1C140D,#15100B);border:1px solid #3A2A1B;border-radius:14px;padding:14px"><div style="display:flex;gap:10px;align-items:center"><div style="flex:1;background:#0C0907;border:1px solid #3A2A1B;border-radius:10px;padding:10px 14px;color:#6E573D;font-size:13px">⌕ Search recipes…</div><span style="display:inline-flex;align-items:center;gap:7px;background:#241A11;border:1px solid #3A2A1B;border-radius:10px;padding:8px 12px;color:#EFE3CE;font-family:ui-monospace,monospace;font-size:12px"><span style="width:6px;height:6px;border-radius:50%;background:#E67E22"></span>Tune · 4 active</span></div><div style="margin-top:10px;color:#9A7E5E;font-family:ui-monospace,monospace;font-size:11px">◆ high-protein · ⏱ weeknights ≤30m · 👥 squad 2 · ↻ moderate</div></div>',
      },
    },
    {
      topic: "Empty meal results",
      wrong: {
        label: "Three stacked “No matches” blocks — reads as broken",
        html: '<div style="background:#1A120A;padding:10px;font-family:sans-serif"><p style="color:#6B4E36;font-size:11px;text-transform:uppercase;letter-spacing:1px">Lunch</p><p style="color:#4A3020;font-size:12px;margin:4px 0 12px">No matches — try different filters</p><p style="color:#6B4E36;font-size:11px;text-transform:uppercase;letter-spacing:1px">Dinner</p><p style="color:#4A3020;font-size:12px;margin-top:4px">No matches — try different filters</p></div>',
      },
      right: {
        label: "One small, branded nudge with an action",
        html: '<div style="display:flex;align-items:center;gap:12px;background:rgba(28,20,13,0.4);border:1px dashed #3A2A1B;border-radius:16px;padding:14px 18px"><span>✨</span><p style="flex:1;color:#9A7E5E;font-size:13px;font-family:sans-serif">Nothing new for <span style="font-family:Fraunces,Georgia,serif;font-style:italic;color:#EFE3CE">lunch &amp; dinner</span> under your filters.</p><span style="color:#E67E22;font-family:ui-monospace,monospace;font-size:11px;border:1px solid #3A2A1B;border-radius:8px;padding:6px 10px">Loosen filters →</span></div>',
      },
    },
  ] satisfies DoDontPair[],

  icons: [
    { name: "ChefHat", usage: "App logo, primary brand mark" },
    { name: "Utensils", usage: "Recipe — neutral surface" },
    { name: "Soup", usage: "Meal plan, weekly hub" },
    { name: "ShoppingCart", usage: "Shopping list, pantry actions" },
    { name: "Refrigerator", usage: "My Pantry" },
    { name: "CalendarDays", usage: "Plans, scheduled meals" },
    { name: "Flame", usage: "Trending, featured cuisine" },
    { name: "Heart", usage: "Saved recipes" },
    { name: "Search", usage: "Discover, recipe search" },
    { name: "Settings", usage: "Settings entry" },
    { name: "Palette", usage: "Palette switcher" },
  ] satisfies IconNote[],
  iconLibrary: "lucide-react",
  iconNote: "Stroke 1.5–2, sized 14 in chrome, 18–24 in primary surfaces. Avoid food emojis in interface — reserve for marketing.",

  motion: {
    intent:
      "Spring-based, kitchen-tactile. Recipe cards lift on hover (cubic-bezier(0.34, 1.56, 0.64, 1)). Cooking mode advances steps with a satisfying bounce. Backdrop-filter blurs are used for elevation rather than drop shadows. A running challenge is always *alive*: a pulsing LIVE dot and a ticking mono timer signal an active session, and speedrun timers ramp colour from saffron to amber to red as par approaches.",
    namedAnimations: [
      { name: "wc-card-hover", duration: "0.2s", note: "Recipe card hover — scale 1.01 + shadow lift" },
      { name: "cook-step-advance", duration: "0.35s", note: "Cooking mode — step transition with bounce easing" },
      { name: "wc-shimmer-loading", duration: "1.4s", note: "Loading skeleton — diagonal shimmer" },
      { name: "challenge-live-pulse", duration: "1.4s", note: "Active challenge LIVE dot — expanding ring, infinite loop" },
      { name: "challenge-countdown-urgency", duration: "1s", note: "Speedrun timer — colour ramps saffron→amber→red as par nears" },
    ],
    easings: [
      { name: "Card hover", value: "cubic-bezier(0.34, 1.56, 0.64, 1)", note: "Springy — slight overshoot" },
      { name: "Step advance", value: "cubic-bezier(0.4, 0, 0.2, 1)", note: "Standard ease in/out" },
    ],
    reducedMotion: "Honored — all transitions clamped to 0.01ms under prefers-reduced-motion.",
  },
};

export type MoodboardConfig = typeof moodboard;
