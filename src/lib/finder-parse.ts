export interface ParsedFinderHints {
  maxMinutes?: 15 | 30 | 60;
  dietary?: string[];
  excludeKeywords?: string[];
  dishHint?: string;
  pantryMode?: "pantry";
  vibe?: "lazy" | "date-night" | "fuel" | "comfort" | "clean" | "impress";
}

const DISH_HINTS = [
  "pasta", "curry", "soup", "salad", "steak", "pizza", "burger",
  "sushi", "risotto", "tacos", "ramen", "bowl", "stew", "sandwich",
];

export function parseFinderText(text: string): ParsedFinderHints {
  if (!text.trim()) return {};
  const t = text.toLowerCase();
  const hints: ParsedFinderHints = {};

  // Time
  if (/\b(15 min|under 15|super quick|5 min|10 min)\b/.test(t)) {
    hints.maxMinutes = 15;
  } else if (/\b(quick|fast|speedy|30 min|half.?hour)\b/.test(t)) {
    hints.maxMinutes = 30;
  } else if (/\b(60 min|1 hour|one hour)\b/.test(t)) {
    hints.maxMinutes = 60;
  }

  // Dietary
  const dietary: string[] = [];
  if (/\bvegan\b/.test(t)) dietary.push("vegan");
  if (/\bvegetarian\b/.test(t)) dietary.push("vegetarian");
  if (/\bgluten.?free\b/.test(t)) dietary.push("gluten-free");
  if (/\bdairy.?free\b/.test(t)) dietary.push("dairy-free");
  if (/\bhalal\b/.test(t)) dietary.push("halal");
  if (dietary.length > 0) hints.dietary = dietary;

  // Exclude keywords
  const exclude: string[] = [];
  if (/\b(no spice|not spicy|mild|no heat|no chilli|no chili|no pepper)\b/.test(t)) {
    exclude.push("spicy");
  }
  if (exclude.length > 0) hints.excludeKeywords = exclude;

  // Pantry mode
  if (/\b(use what|from the fridge|pantry|what i.?ve got|ingredients? i have|leftovers?)\b/.test(t)) {
    hints.pantryMode = "pantry";
  }

  // Vibe — evaluated in priority order; first match wins
  if (/\b(fancy|impress|dinner party|guests?|special occasion|showstopper)\b/.test(t)) {
    hints.vibe = "impress";
  } else if (/\b(date|romantic|nice dinner|intimate)\b/.test(t)) {
    hints.vibe = "date-night";
  } else if (/\b(comfort|cosy|cozy|warming|hearty)\b/.test(t)) {
    hints.vibe = "comfort";
  } else if (/\b(healthy|light|clean|fresh|lean)\b/.test(t)) {
    hints.vibe = "clean";
  } else if (/\b(fuel|energy|protein|post.?workout|power)\b/.test(t)) {
    hints.vibe = "fuel";
  } else if (/\b(lazy|easy|simple|effortless|couch)\b/.test(t)) {
    hints.vibe = "lazy";
  }

  // Dish hint — first match wins
  for (const dish of DISH_HINTS) {
    if (new RegExp(`\\b${dish}\\b`).test(t)) {
      hints.dishHint = dish;
      break;
    }
  }

  return hints;
}
