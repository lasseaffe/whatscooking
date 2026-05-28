// src/lib/drinks.ts

export type DrinkCulture = "cafe" | "bar" | "wine" | "wellness" | "zero-proof";

// dish_types tags that map each recipe to a culture
export const CULTURE_TAGS: Record<DrinkCulture, string[]> = {
  cafe: ["espresso", "pour-over", "coffee", "matcha", "brewed"],
  bar: ["cocktail"],
  wine: ["wine", "spirits"],
  wellness: ["smoothie", "juice", "wellness"],
  "zero-proof": ["mocktail", "dirty-soda", "tea", "sparkling"],
};

export interface FilterGroup {
  label: string;
  options: string[];
}

export interface CultureConfig {
  slug: DrinkCulture;
  name: string;
  emoji: string;
  eyebrow: string;
  desc: string;
  proTags: string[];
  accentColor: string;
  // hex with alpha, e.g. "rgba(200,160,48,1)"
  accentRgba: string;
  photoQuery: string;
  photoSig: number;
  // CSS gradient strings for the three animated layers
  gradients: { a: string; b: string; c: string };
  // CSS animation values for each layer
  animations: { a: string; b: string; c: string };
}

export const CULTURES: CultureConfig[] = [
  {
    slug: "cafe",
    name: "Café Culture",
    emoji: "☕",
    eyebrow: "For the barista",
    desc: "Espresso · Pour-over · Cold brew · Matcha",
    proTags: ["Brew ratio", "Temp", "Origin", "Grind"],
    accentColor: "#C8A030",
    accentRgba: "rgba(200,160,48,0.4)",
    photoQuery: "coffee espresso barista",
    photoSig: 1,
    gradients: {
      a: "radial-gradient(ellipse 60% 70% at 70% 20%, rgba(200,140,40,0.45) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 20% 80%, rgba(140,70,20,0.5) 0%, transparent 55%)",
      b: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(80,40,10,0.55) 0%, transparent 70%)",
      c: "linear-gradient(160deg, rgba(26,15,4,0.7) 0%, rgba(44,26,8,0.6) 40%, rgba(15,8,4,0.5) 100%)",
    },
    animations: {
      a: "drift-ne 13s ease-in-out infinite",
      b: "breathe 9s ease-in-out infinite 1s, drift-nw 18s ease-in-out infinite reverse",
      c: "drift-sw 16s ease-in-out infinite 2s",
    },
  },
  {
    slug: "bar",
    name: "Bar Craft",
    emoji: "🍸",
    eyebrow: "For the mixologist",
    desc: "Cocktails · Spirits · Technique · Bitters",
    proTags: ["ABV", "Technique", "Glassware", "Base spirit"],
    accentColor: "#6AAAC8",
    accentRgba: "rgba(100,160,200,0.4)",
    photoQuery: "cocktail bar mixology",
    photoSig: 2,
    gradients: {
      a: "radial-gradient(ellipse 50% 60% at 80% 30%, rgba(80,140,180,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 10% 70%, rgba(20,60,100,0.55) 0%, transparent 60%)",
      b: "radial-gradient(ellipse 100% 50% at 50% 100%, rgba(10,30,60,0.8) 0%, transparent 50%)",
      c: "linear-gradient(160deg, rgba(4,10,20,0.7) 0%, rgba(10,24,40,0.6) 45%, rgba(4,10,16,0.5) 100%)",
    },
    animations: {
      a: "drift-nw 11s ease-in-out infinite",
      b: "breathe 13s ease-in-out infinite 3s, drift-ne 20s ease-in-out infinite",
      c: "drift-se 15s ease-in-out infinite 1s",
    },
  },
  {
    slug: "wine",
    name: "Wine & Spirits",
    emoji: "🍷",
    eyebrow: "For the sommelier",
    desc: "Tasting notes · Pairings · Regions · Vintages",
    proTags: ["Varietal", "Body", "Tannins", "Pairing"],
    accentColor: "#A878C8",
    accentRgba: "rgba(160,100,200,0.4)",
    photoQuery: "wine cellar sommelier",
    photoSig: 3,
    gradients: {
      a: "radial-gradient(ellipse 55% 65% at 30% 20%, rgba(120,40,80,0.45) 0%, transparent 55%), radial-gradient(ellipse 45% 55% at 75% 75%, rgba(80,20,60,0.55) 0%, transparent 60%)",
      b: "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(40,10,40,0.7) 0%, transparent 50%)",
      c: "linear-gradient(160deg, rgba(14,4,8,0.7) 0%, rgba(28,10,20,0.6) 45%, rgba(10,4,12,0.5) 100%)",
    },
    animations: {
      a: "drift-sw 17s ease-in-out infinite 2s",
      b: "breathe 11s ease-in-out infinite, drift-ne 22s ease-in-out infinite reverse",
      c: "drift-nw 14s ease-in-out infinite 3s",
    },
  },
  {
    slug: "wellness",
    name: "Wellness Bar",
    emoji: "🌿",
    eyebrow: "For the wellness maker",
    desc: "Smoothies · Juices · Adaptogens · Tonics",
    proTags: ["Benefit", "Superfood", "Raw", "Adaptogen"],
    accentColor: "#58B068",
    accentRgba: "rgba(80,180,80,0.4)",
    photoQuery: "green smoothie health wellness",
    photoSig: 4,
    gradients: {
      a: "radial-gradient(ellipse 60% 70% at 20% 30%, rgba(40,100,50,0.45) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 80% 70%, rgba(20,80,40,0.4) 0%, transparent 55%)",
      b: "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(60,120,60,0.25) 0%, transparent 45%)",
      c: "linear-gradient(160deg, rgba(4,10,4,0.7) 0%, rgba(8,20,8,0.6) 45%, rgba(5,8,5,0.5) 100%)",
    },
    animations: {
      a: "drift-ne 19s ease-in-out infinite 1s",
      b: "breathe 7s ease-in-out infinite 2s, drift-sw 24s ease-in-out infinite",
      c: "drift-se 13s ease-in-out infinite",
    },
  },
  {
    slug: "zero-proof",
    name: "Zero Proof",
    emoji: "🥤",
    eyebrow: "For everyone",
    desc: "Dirty sodas · Mocktails · Tea · Sparkling — all the craft, none of the ABV",
    proTags: ["No-ABV", "Dirty soda", "Tea", "Mocktail", "Sparkling"],
    accentColor: "#C080B0",
    accentRgba: "rgba(200,100,180,0.4)",
    photoQuery: "mocktail sparkling drink colorful",
    photoSig: 5,
    gradients: {
      a: "radial-gradient(ellipse 70% 100% at 10% 50%, rgba(80,40,120,0.45) 0%, transparent 55%), radial-gradient(ellipse 50% 80% at 90% 50%, rgba(160,60,120,0.35) 0%, transparent 55%)",
      b: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(100,40,80,0.45) 0%, transparent 50%)",
      c: "linear-gradient(90deg, rgba(8,4,16,0.7) 0%, rgba(20,8,32,0.6) 30%, rgba(16,4,16,0.5) 100%)",
    },
    animations: {
      a: "drift-ne 23s ease-in-out infinite",
      b: "breathe 15s ease-in-out infinite 4s, drift-nw 12s ease-in-out infinite reverse",
      c: "drift-se 18s ease-in-out infinite 2s",
    },
  },
];

export function detectCulture(dishTypes: string[]): DrinkCulture | null {
  for (const [culture, tags] of Object.entries(CULTURE_TAGS) as [DrinkCulture, string[]][]) {
    if (tags.some((t) => dishTypes.includes(t))) return culture;
  }
  return null;
}

export function isDrink(dishTypes: string[]): boolean {
  return (
    dishTypes.includes("drink") ||
    Object.values(CULTURE_TAGS)
      .flat()
      .some((t) => dishTypes.includes(t))
  );
}

// TypeScript shapes for drink_meta per culture
export interface CafeMeta {
  method?: string;
  dose_g?: number;
  yield_g?: number;
  temp_c?: number;
  time_s?: number;
  ratio?: string;
  grind?: string;
  origin?: string;
  roast?: string;
}
export interface BarMeta {
  technique?: string;
  glassware?: string;
  abv_pct?: number;
  base_spirit?: string;
  garnish?: string;
  ice?: string;
}
export interface WineMeta {
  varietal?: string;
  region?: string;
  vintage?: number;
  body?: "light" | "medium" | "full";
  tannins?: "low" | "medium" | "high";
  acidity?: "low" | "medium" | "high";
  sweetness?: "dry" | "off-dry" | "sweet";
  serving_temp_c?: number;
  pairings?: string[];
  tasting_notes?: string;
}
export interface WellnessMeta {
  benefits?: string[];
  superfoods?: string[];
  is_raw?: boolean;
}
export interface ZeroProofMeta {
  style?: string;
  carbonation?: "still" | "light" | "heavy";
  occasion?: string[];
}
export type DrinkMeta = CafeMeta | BarMeta | WineMeta | WellnessMeta | ZeroProofMeta;

// Per-culture filter definitions for the filter bar
export const CULTURE_FILTERS: Record<DrinkCulture, FilterGroup[]> = {
  cafe: [
    { label: "Method", options: ["Espresso", "Pour-over", "Cold brew", "AeroPress", "Moka", "French press"] },
    { label: "Roast", options: ["Light", "Medium", "Dark"] },
    { label: "Origin", options: ["Africa", "Americas", "Asia"] },
  ],
  bar: [
    { label: "Technique", options: ["Stirred", "Shaken", "Built", "Blended"] },
    { label: "Spirit", options: ["Gin", "Whisky", "Rum", "Tequila", "Vodka", "Mezcal"] },
    { label: "Occasion", options: ["Aperitif", "Digestif", "Party", "Date night"] },
  ],
  wine: [
    { label: "Colour", options: ["Red", "White", "Rosé", "Orange", "Sparkling"] },
    { label: "Body", options: ["Light", "Medium", "Full"] },
    { label: "Region", options: ["Europe", "Americas", "Oceania"] },
  ],
  wellness: [
    { label: "Benefit", options: ["Energy", "Immunity", "Recovery", "Focus", "Calm"] },
    { label: "Diet", options: ["Raw", "Vegan", "High-protein", "Keto"] },
  ],
  "zero-proof": [
    { label: "Style", options: ["Dirty soda", "Mocktail", "Tea", "Sparkling", "Shrub"] },
    { label: "Carbonation", options: ["Still", "Light", "Heavy"] },
    { label: "Occasion", options: ["Brunch", "Party", "Everyday", "Seasonal"] },
  ],
};
