import { CUISINE_COUNTRIES } from "./country-cuisine-map";
import { CUISINES } from "./cuisines";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tier: BadgeTier;
  /** Returns true if the badge is earned given the user's context */
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  pinnedSlugs: Set<string>;       // cuisine slugs the user has cooked
  savedCount: number;             // total saved recipes
  ratedCount: number;             // total rated recipes
  ownRecipeCount: number;         // user-created recipes
  publishedRecipeCount: number;   // published user recipes
  communityFaveSaves: number;     // max saves any user recipe has received
  topRating: number;              // best average rating on own recipe (0-5)
}

const EUROPE_SLUGS = CUISINES.filter(c => c.region === "Europe").map(c => c.slug);
const EAST_ASIA_SLUGS = CUISINES.filter(c => c.region === "East Asia").map(c => c.slug);
const SOUTH_ASIA_SLUGS = CUISINES.filter(c => c.region === "South Asia").map(c => c.slug);
const AFRICA_SLUGS = CUISINES.filter(c => c.region === "North Africa").map(c => c.slug);
const MIDDLE_EAST_SLUGS = CUISINES.filter(c => c.region === "Middle East").map(c => c.slug);
const AMERICAS_SLUGS = CUISINES.filter(c => c.region === "Americas").map(c => c.slug);
const ALL_SLUGS = CUISINES.map(c => c.slug);

function hasAll(set: Set<string>, slugs: string[]): boolean {
  return slugs.every(s => set.has(s));
}

function countIn(set: Set<string>, slugs: string[]): number {
  return slugs.filter(s => set.has(s)).length;
}

export const BADGES: Badge[] = [
  // ── EXPLORATION — Countries ──────────────────────────────────────
  {
    id: "first-pin",
    name: "First Stamp",
    description: "Cooked your first world cuisine.",
    emoji: "🌐",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.size >= 1,
  },
  {
    id: "world-traveler",
    name: "World Traveler",
    description: "Cooked from 5 different countries.",
    emoji: "✈️",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.size >= 5,
  },
  {
    id: "globe-trotter",
    name: "Globe Trotter",
    description: "Cooked from 10 different countries.",
    emoji: "🌍",
    tier: "silver",
    check: ({ pinnedSlugs }) => pinnedSlugs.size >= 10,
  },
  {
    id: "worldly-chef",
    name: "Worldly Chef",
    description: "Cooked from every cuisine in the collection.",
    emoji: "🏆",
    tier: "gold",
    check: ({ pinnedSlugs }) => hasAll(pinnedSlugs, ALL_SLUGS),
  },

  // ── CONTINENTAL BADGES ─────────────────────────────────────────
  {
    id: "european-tour",
    name: "European Tour",
    description: "Cooked all European cuisines in the collection.",
    emoji: "🇪🇺",
    tier: "silver",
    check: ({ pinnedSlugs }) => hasAll(pinnedSlugs, EUROPE_SLUGS),
  },
  {
    id: "asia-explorer",
    name: "Asia Explorer",
    description: "Cooked all East Asian cuisines in the collection.",
    emoji: "🏯",
    tier: "silver",
    check: ({ pinnedSlugs }) => hasAll(pinnedSlugs, EAST_ASIA_SLUGS),
  },
  {
    id: "spice-route",
    name: "Spice Route",
    description: "Cooked all South Asian & Middle Eastern cuisines.",
    emoji: "🌶️",
    tier: "silver",
    check: ({ pinnedSlugs }) =>
      hasAll(pinnedSlugs, [...SOUTH_ASIA_SLUGS, ...MIDDLE_EAST_SLUGS]),
  },
  {
    id: "africa-rising",
    name: "Africa Rising",
    description: "Cooked all North African cuisines in the collection.",
    emoji: "🌅",
    tier: "silver",
    check: ({ pinnedSlugs }) => hasAll(pinnedSlugs, AFRICA_SLUGS),
  },
  {
    id: "new-world",
    name: "New World",
    description: "Cooked all Americas cuisines in the collection.",
    emoji: "🌎",
    tier: "bronze",
    check: ({ pinnedSlugs }) => hasAll(pinnedSlugs, AMERICAS_SLUGS),
  },

  // ── COUNTRY GURU BADGES ────────────────────────────────────────
  {
    id: "france-guru",
    name: "France Guru",
    description: "Saved or cooked French cuisine.",
    emoji: "🥐",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("french"),
  },
  {
    id: "japan-guru",
    name: "Japan Guru",
    description: "Saved or cooked Japanese cuisine.",
    emoji: "🍱",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("japanese"),
  },
  {
    id: "india-guru",
    name: "India Guru",
    description: "Saved or cooked Indian cuisine.",
    emoji: "🍛",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("indian"),
  },
  {
    id: "mexico-guru",
    name: "Mexico Guru",
    description: "Saved or cooked Mexican cuisine.",
    emoji: "🌮",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("mexican"),
  },
  {
    id: "italy-guru",
    name: "Italy Guru",
    description: "Saved or cooked Italian cuisine.",
    emoji: "🍝",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("italian"),
  },
  {
    id: "korea-guru",
    name: "Korea Guru",
    description: "Saved or cooked Korean cuisine.",
    emoji: "🥘",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("korean"),
  },
  {
    id: "thai-guru",
    name: "Thailand Guru",
    description: "Saved or cooked Thai cuisine.",
    emoji: "🍜",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("thai"),
  },
  {
    id: "morocco-guru",
    name: "Morocco Guru",
    description: "Saved or cooked Moroccan cuisine.",
    emoji: "🫙",
    tier: "bronze",
    check: ({ pinnedSlugs }) => pinnedSlugs.has("moroccan"),
  },

  // ── COMMUNITY & SOCIAL ─────────────────────────────────────────
  {
    id: "community-favorite",
    name: "Community Favorite",
    description: "One of your recipes was saved 5+ times by others.",
    emoji: "❤️",
    tier: "silver",
    check: ({ communityFaveSaves }) => communityFaveSaves >= 5,
  },
  {
    id: "viral-dish",
    name: "Viral Dish",
    description: "One of your recipes was saved 20+ times.",
    emoji: "🔥",
    tier: "gold",
    check: ({ communityFaveSaves }) => communityFaveSaves >= 20,
  },
  {
    id: "top-rated",
    name: "Top Rated Chef",
    description: "One of your recipes holds a 4.5+ star average.",
    emoji: "⭐",
    tier: "gold",
    check: ({ topRating }) => topRating >= 4.5,
  },

  // ── COOKING VOLUME ─────────────────────────────────────────────
  {
    id: "recipe-collector",
    name: "Recipe Collector",
    description: "Saved 10 or more recipes.",
    emoji: "📚",
    tier: "bronze",
    check: ({ savedCount }) => savedCount >= 10,
  },
  {
    id: "recipe-hoarder",
    name: "Recipe Hoarder",
    description: "Saved 50 or more recipes.",
    emoji: "🗃️",
    tier: "silver",
    check: ({ savedCount }) => savedCount >= 50,
  },
  {
    id: "home-chef",
    name: "Home Chef",
    description: "Published your first recipe.",
    emoji: "👨‍🍳",
    tier: "bronze",
    check: ({ publishedRecipeCount }) => publishedRecipeCount >= 1,
  },
  {
    id: "recipe-author",
    name: "Recipe Author",
    description: "Published 5 or more recipes.",
    emoji: "📖",
    tier: "silver",
    check: ({ publishedRecipeCount }) => publishedRecipeCount >= 5,
  },
  {
    id: "critic",
    name: "The Critic",
    description: "Rated 20 or more recipes.",
    emoji: "🧐",
    tier: "bronze",
    check: ({ ratedCount }) => ratedCount >= 20,
  },
];

export const TIER_ORDER: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];

export const TIER_STYLES: Record<BadgeTier, { bg: string; border: string; text: string; label: string }> = {
  bronze:   { bg: "#FDF0E8", border: "#CD7F32", text: "#92400E", label: "Bronze"   },
  silver:   { bg: "#F5F5F5", border: "#9CA3AF", text: "#4B5563", label: "Silver"   },
  gold:     { bg: "#FFFBEB", border: "#D97706", text: "#92400E", label: "Gold"     },
  platinum: { bg: "#F0F9FF", border: "#0284C7", text: "#0369A1", label: "Platinum" },
};

export function computeBadges(ctx: AchievementContext): Badge[] {
  return BADGES.filter(b => b.check(ctx));
}
