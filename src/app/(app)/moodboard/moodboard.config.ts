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
      "Culinary Parchment. Warm, earthy, editorial. Recipes are objects worthy of typesetting — display serif headings, sturdy sans body, and a brass-and-stone palette that reads like the inside of a well-loved kitchen. Five palette personalities ship by default: Cast Iron & Thyme, Copper & Clove, Heirloom Orchard, Sage & Stone, Midnight Pantry. The site adapts; the voice stays.",
    pillars: [
      "Recipes are typography. Set them like a book, not a feed.",
      "Five palette personalities, one editorial voice.",
      "Brass accent over restaurant-signage red — restraint over alarm.",
      "Pantry-first matching. Discovery serves cooking, not the other way around.",
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
    { name: "Light", cssTrigger: 'html[data-theme="light"]', intent: "Bright butcher-paper kitchen. Cream paper, claret accents, warm brown text." },
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
      "Spring-based, kitchen-tactile. Recipe cards lift on hover (cubic-bezier(0.34, 1.56, 0.64, 1)). Cooking mode advances steps with a satisfying bounce. Backdrop-filter blurs are used for elevation rather than drop shadows.",
    namedAnimations: [
      { name: "wc-card-hover", duration: "0.2s", note: "Recipe card hover — scale 1.01 + shadow lift" },
      { name: "cook-step-advance", duration: "0.35s", note: "Cooking mode — step transition with bounce easing" },
      { name: "wc-shimmer-loading", duration: "1.4s", note: "Loading skeleton — diagonal shimmer" },
    ],
    easings: [
      { name: "Card hover", value: "cubic-bezier(0.34, 1.56, 0.64, 1)", note: "Springy — slight overshoot" },
      { name: "Step advance", value: "cubic-bezier(0.4, 0, 0.2, 1)", note: "Standard ease in/out" },
    ],
    reducedMotion: "Honored — all transitions clamped to 0.01ms under prefers-reduced-motion.",
  },
};

export type MoodboardConfig = typeof moodboard;
