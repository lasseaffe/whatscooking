// ---------------------------------------------------------------------------
// Seasonal produce by climate zone + month
// ---------------------------------------------------------------------------

export type ClimateZone =
  | "temperate"     // Most of Europe, US Midwest/Northeast, Canada, China, Japan
  | "nordic"        // Scandinavia, Iceland, Scotland, Alaska
  | "mediterranean" // Southern Europe, California, Morocco, Turkey
  | "subtropical"   // Southern US, Florida, Northern India, Northern Africa
  | "tropical"      // SE Asia, Central America, sub-Saharan Africa, Caribbean
  | "southern"      // Australia, NZ, South Africa, Chile, Argentina (seasons reversed)
  | "arid";         // Middle East interior, North Africa, Utah/Nevada/Arizona

// ── Country & Region → Climate Zone ────────────────────────────────────────

export const COUNTRY_CLIMATE: Record<string, ClimateZone> = {
  // Nordic
  no: "nordic", se: "nordic", fi: "nordic", dk: "nordic", is: "nordic",
  norway: "nordic", sweden: "nordic", finland: "nordic", denmark: "nordic", iceland: "nordic",
  greenland: "nordic", scotland: "nordic", faroe: "nordic",

  // Mediterranean
  es: "mediterranean", it: "mediterranean", gr: "mediterranean", pt: "mediterranean",
  hr: "mediterranean", cy: "mediterranean", mt: "mediterranean", al: "mediterranean",
  ma: "mediterranean", tn: "mediterranean", dz: "mediterranean",
  tr: "mediterranean", lb: "mediterranean", il: "mediterranean", jo: "mediterranean",
  sy: "mediterranean", ps: "mediterranean", ly: "mediterranean",
  spain: "mediterranean", italy: "mediterranean", greece: "mediterranean",
  portugal: "mediterranean", turkey: "mediterranean", morocco: "mediterranean",
  croatia: "mediterranean", cyprus: "mediterranean", malta: "mediterranean",
  albania: "mediterranean", tunisia: "mediterranean", algeria: "mediterranean",
  lebanon: "mediterranean", israel: "mediterranean", jordan: "mediterranean",
  // Spanish regions
  catalonia: "mediterranean", "cataluña": "mediterranean", andalusia: "mediterranean",
  "andalucía": "mediterranean", valencia: "mediterranean", murcia: "mediterranean",
  "islas baleares": "mediterranean", balearic: "mediterranean",
  // Italian regions
  tuscany: "mediterranean", toscana: "mediterranean", sicily: "mediterranean",
  sicilia: "mediterranean", sardinia: "mediterranean", sardegna: "mediterranean",
  campania: "mediterranean", calabria: "mediterranean", apulia: "mediterranean",
  puglia: "mediterranean",
  // French regions
  provence: "mediterranean", "côte d'azur": "mediterranean", languedoc: "mediterranean",
  occitanie: "mediterranean",

  // Temperate northern
  gb: "temperate", ie: "temperate", fr: "temperate", de: "temperate",
  nl: "temperate", be: "temperate", at: "temperate", ch: "temperate",
  pl: "temperate", cz: "temperate", sk: "temperate", hu: "temperate",
  ro: "temperate", ua: "temperate", ru: "temperate",
  ca: "temperate", cn: "temperate", jp: "temperate", kr: "temperate",
  us: "temperate", si: "temperate", rs: "temperate", ba: "temperate",
  "united kingdom": "temperate", uk: "temperate", england: "temperate",
  wales: "temperate", ireland: "temperate", france: "temperate",
  germany: "temperate", netherlands: "temperate", belgium: "temperate",
  austria: "temperate", switzerland: "temperate", poland: "temperate",
  "czech republic": "temperate", czechia: "temperate", slovakia: "temperate",
  hungary: "temperate", romania: "temperate", ukraine: "temperate",
  russia: "temperate", canada: "temperate", china: "temperate",
  japan: "temperate", "south korea": "temperate", korea: "temperate",
  "united states": "temperate", usa: "temperate", america: "temperate",
  // French regions (temperate)
  normandy: "temperate", normandie: "temperate", brittany: "temperate",
  bretagne: "temperate", alsace: "temperate", lorraine: "temperate",
  "île-de-france": "temperate", burgundy: "temperate", bourgogne: "temperate",
  // German regions
  bavaria: "temperate", bayern: "temperate", "baden-württemberg": "temperate",
  // Canadian provinces
  ontario: "temperate", "british columbia": "temperate", quebec: "temperate",
  alberta: "temperate", manitoba: "temperate",

  // Subtropical
  mx: "subtropical", in: "subtropical", bd: "subtropical", pk: "subtropical",
  mexico: "subtropical", india: "subtropical", bangladesh: "subtropical",
  pakistan: "subtropical",
  // Southern US (handled via state lookup, but country-level fallback)
  // Northern Africa (Mediterranean coast handled above)

  // Tropical
  th: "tropical", vn: "tropical", id: "tropical", ph: "tropical",
  my: "tropical", sg: "tropical", br: "tropical", co: "tropical",
  pe: "tropical", ng: "tropical", gh: "tropical", ke: "tropical",
  et: "tropical", tz: "tropical", ug: "tropical", cm: "tropical",
  ci: "tropical", sn: "tropical", cd: "tropical",
  thailand: "tropical", vietnam: "tropical", indonesia: "tropical",
  philippines: "tropical", malaysia: "tropical", singapore: "tropical",
  brazil: "tropical", colombia: "tropical", peru: "tropical",
  nigeria: "tropical", kenya: "tropical", ghana: "tropical",
  ethiopia: "tropical", tanzania: "tropical",
  "costa rica": "tropical", panama: "tropical", guatemala: "tropical",
  jamaica: "tropical", cuba: "tropical", "puerto rico": "tropical",
  caribbean: "tropical", "sri lanka": "tropical",

  // Southern hemisphere temperate
  au: "southern", nz: "southern", za: "southern", cl: "southern", ar: "southern",
  australia: "southern", "new zealand": "southern", "south africa": "southern",
  chile: "southern", argentina: "southern",

  // Arid
  sa: "arid", ae: "arid", qa: "arid", kw: "arid", bh: "arid", om: "arid",
  eg: "arid", ir: "arid", iq: "arid",
  "saudi arabia": "arid", uae: "arid", dubai: "arid", qatar: "arid",
  kuwait: "arid", egypt: "arid", iran: "arid", iraq: "arid",
  oman: "arid", bahrain: "arid", yemen: "arid",
};

// US states with distinct climates (override the default "temperate" for US)
export const US_STATE_CLIMATE: Record<string, ClimateZone> = {
  california: "mediterranean",
  florida: "subtropical",
  hawaii: "tropical",
  texas: "subtropical",
  arizona: "arid",
  "new mexico": "arid",
  nevada: "arid",
  utah: "arid",
  alaska: "nordic",
  louisiana: "subtropical",
  georgia: "subtropical",
  "south carolina": "subtropical",
  "north carolina": "subtropical",
  alabama: "subtropical",
  mississippi: "subtropical",
  "virginia": "subtropical",
  arkansas: "subtropical",
  tennessee: "subtropical",
  // Southern California is Mediterranean but CA overall is already set above
};

// ── Seasonal produce per zone per month (0 = January, 11 = December) ────────
// Keywords matched (case-insensitive) against recipe title + description + ingredients

const T = "temperate";
const N = "nordic";
const M = "mediterranean";
const S = "subtropical";
const TR = "tropical";
const SO = "southern";
const A = "arid";

type MonthlyMap = Record<ClimateZone, string[]>;

export const SEASONAL_BY_MONTH: MonthlyMap[] = [
  // ── 0 January ──────────────────────────────────────────────────────────
  {
    [T]: ["carrot", "parsnip", "turnip", "swede", "rutabaga", "kale", "cabbage", "leek", "onion", "potato", "celeriac", "beetroot", "beet", "chicory", "endive", "brussels sprout", "sprout", "orange", "grapefruit", "lemon", "clementine", "mandarin"],
    [N]: ["potato", "carrot", "turnip", "swede", "kale", "cabbage", "onion", "leek", "beetroot", "beet", "celeriac", "orange"],
    [M]: ["orange", "mandarin", "clementine", "blood orange", "lemon", "grapefruit", "fennel", "artichoke", "broccoli", "cauliflower", "cabbage", "kale", "leek", "chard", "spinach", "turnip", "olive", "almond"],
    [S]: ["orange", "grapefruit", "strawberry", "broccoli", "cauliflower", "cabbage", "carrot", "lettuce", "spinach", "tomato", "pea"],
    [TR]: ["mango", "papaya", "banana", "pineapple", "coconut", "lychee", "starfruit", "jackfruit", "avocado", "chilli", "lime", "lemongrass", "ginger", "turmeric", "cassava", "yam"],
    [SO]: ["tomato", "zucchini", "courgette", "cucumber", "pepper", "corn", "sweetcorn", "aubergine", "eggplant", "peach", "nectarine", "plum", "cherry", "apricot", "fig", "watermelon", "melon", "raspberry", "blueberry", "mango", "avocado", "basil"],
    [A]: ["tomato", "cucumber", "eggplant", "aubergine", "pepper", "lettuce", "spinach", "carrot", "radish", "orange", "grapefruit", "lemon", "date"],
  },
  // ── 1 February ─────────────────────────────────────────────────────────
  {
    [T]: ["carrot", "parsnip", "turnip", "kale", "cabbage", "leek", "onion", "potato", "celeriac", "beetroot", "beet", "chicory", "endive", "orange", "grapefruit", "lemon", "clementine", "brussels sprout", "purple sprouting broccoli", "rhubarb"],
    [N]: ["potato", "carrot", "turnip", "kale", "cabbage", "onion", "leek", "beetroot", "beet", "celeriac", "rhubarb"],
    [M]: ["orange", "mandarin", "lemon", "blood orange", "strawberry", "artichoke", "broccoli", "cauliflower", "fennel", "chard", "spinach", "leek", "pea", "broad bean", "fava bean"],
    [S]: ["strawberry", "orange", "grapefruit", "broccoli", "cauliflower", "lettuce", "spinach", "pea", "blueberry", "asparagus"],
    [TR]: ["mango", "papaya", "banana", "pineapple", "coconut", "avocado", "chilli", "lime", "lemongrass", "ginger", "cassava", "yam"],
    [SO]: ["tomato", "pepper", "zucchini", "courgette", "cucumber", "fig", "grape", "plum", "pear", "corn", "sweetcorn", "aubergine", "eggplant", "melon", "watermelon", "avocado", "basil"],
    [A]: ["tomato", "cucumber", "eggplant", "pepper", "lettuce", "spinach", "carrot", "strawberry", "orange", "date"],
  },
  // ── 2 March ────────────────────────────────────────────────────────────
  {
    [T]: ["asparagus", "spring onion", "scallion", "rhubarb", "spinach", "radish", "leek", "cabbage", "kale", "watercress", "purple sprouting broccoli", "potato", "carrot", "parsnip", "lettuce"],
    [N]: ["potato", "carrot", "kale", "cabbage", "onion", "leek", "beetroot", "beet", "rhubarb", "spring onion", "scallion"],
    [M]: ["strawberry", "pea", "broad bean", "fava bean", "artichoke", "asparagus", "spinach", "chard", "lettuce", "fennel", "wild garlic", "lemon", "orange"],
    [S]: ["strawberry", "blueberry", "asparagus", "pea", "broccoli", "lettuce", "spinach", "radish", "herb"],
    [TR]: ["mango", "papaya", "banana", "pineapple", "coconut", "watermelon", "melon", "chilli", "lime", "lemongrass", "ginger", "cassava", "yam", "tomato"],
    [SO]: ["apple", "pear", "grape", "quince", "mushroom", "squash", "pumpkin", "tomato", "pepper", "leek", "broccoli", "cauliflower", "fig", "kiwi"],
    [A]: ["tomato", "cucumber", "melon", "strawberry", "mango", "lettuce", "pepper", "date"],
  },
  // ── 3 April ────────────────────────────────────────────────────────────
  {
    [T]: ["asparagus", "spring onion", "scallion", "rhubarb", "pea", "spinach", "radish", "watercress", "lettuce", "wild garlic", "garlic", "new potato", "potato", "herb", "mint", "parsley", "sorrel"],
    [N]: ["rhubarb", "spring onion", "scallion", "radish", "spinach", "kale", "leek", "carrot", "potato"],
    [M]: ["strawberry", "asparagus", "pea", "broad bean", "fava bean", "artichoke", "lettuce", "spinach", "rocket", "arugula", "wild garlic", "herb", "basil", "mint", "radish", "tomato"],
    [S]: ["strawberry", "blueberry", "tomato", "cucumber", "zucchini", "courgette", "pepper", "pea", "herb", "basil"],
    [TR]: ["mango", "papaya", "banana", "pineapple", "coconut", "watermelon", "jackfruit", "rambutan", "chilli", "lime", "ginger", "cassava"],
    [SO]: ["apple", "pear", "quince", "mushroom", "pumpkin", "squash", "butternut", "leek", "broccoli", "cauliflower", "kale", "spinach", "kiwi", "chestnut"],
    [A]: ["mango", "melon", "watermelon", "tomato", "cucumber", "pepper", "date"],
  },
  // ── 4 May ──────────────────────────────────────────────────────────────
  {
    [T]: ["asparagus", "broad bean", "fava bean", "pea", "strawberry", "spring onion", "scallion", "radish", "lettuce", "spinach", "herb", "mint", "basil", "chive", "watercress", "new potato", "rocket", "arugula", "courgette", "zucchini"],
    [N]: ["rhubarb", "asparagus", "spring onion", "scallion", "radish", "spinach", "pea", "new potato", "herb", "chive", "parsley"],
    [M]: ["tomato", "zucchini", "courgette", "pepper", "cucumber", "strawberry", "cherry", "apricot", "pea", "broad bean", "fava bean", "lettuce", "basil", "herb", "garlic"],
    [S]: ["blueberry", "peach", "tomato", "corn", "sweetcorn", "cucumber", "pepper", "zucchini", "courgette", "okra", "herb", "basil", "watermelon"],
    [TR]: ["mango", "lychee", "rambutan", "jackfruit", "banana", "papaya", "coconut", "durian", "longan", "chilli", "herb", "basil", "ginger", "cassava"],
    [SO]: ["apple", "pear", "kiwi", "pumpkin", "squash", "leek", "kale", "broccoli", "cauliflower", "carrot", "beetroot", "beet", "spinach", "orange"],
    [A]: ["mango", "watermelon", "fig", "date"],
  },
  // ── 5 June ─────────────────────────────────────────────────────────────
  {
    [T]: ["strawberry", "cherry", "pea", "broad bean", "fava bean", "courgette", "zucchini", "cucumber", "tomato", "lettuce", "spinach", "herb", "basil", "mint", "new potato", "gooseberry", "redcurrant", "elderflower", "radish", "fennel", "garlic"],
    [N]: ["strawberry", "asparagus", "pea", "new potato", "lettuce", "spinach", "herb", "chive", "parsley", "radish", "broad bean", "fava bean", "cloudberry"],
    [M]: ["tomato", "pepper", "zucchini", "courgette", "aubergine", "eggplant", "cucumber", "cherry", "apricot", "peach", "nectarine", "melon", "watermelon", "fig", "plum", "basil", "garlic", "onion"],
    [S]: ["peach", "blueberry", "blackberry", "watermelon", "melon", "corn", "sweetcorn", "tomato", "okra", "pepper", "zucchini", "eggplant", "aubergine"],
    [TR]: ["durian", "mangosteen", "rambutan", "lychee", "longan", "banana", "papaya", "coconut", "chilli", "herb", "basil", "ginger", "pineapple"],
    [SO]: ["orange", "grapefruit", "lemon", "mandarin", "kiwi", "carrot", "parsnip", "leek", "kale", "cabbage", "broccoli", "cauliflower", "beetroot", "beet", "potato", "fennel"],
    [A]: ["mango", "watermelon", "date", "fig"],
  },
  // ── 6 July ─────────────────────────────────────────────────────────────
  {
    [T]: ["tomato", "corn", "sweetcorn", "courgette", "zucchini", "cucumber", "pepper", "aubergine", "eggplant", "blueberry", "raspberry", "blackberry", "cherry", "strawberry", "peach", "nectarine", "plum", "pea", "french bean", "green bean", "runner bean", "lettuce", "basil", "fennel", "garlic", "new potato"],
    [N]: ["strawberry", "blueberry", "raspberry", "cloudberry", "chanterelle", "mushroom", "pea", "new potato", "carrot", "lettuce", "cucumber", "courgette", "zucchini", "herb", "dill"],
    [M]: ["tomato", "pepper", "aubergine", "eggplant", "zucchini", "courgette", "cucumber", "peach", "nectarine", "melon", "watermelon", "fig", "plum", "grape", "apricot", "corn", "sweetcorn", "basil", "oregano"],
    [S]: ["watermelon", "melon", "peach", "corn", "sweetcorn", "tomato", "okra", "pepper", "eggplant", "aubergine", "blackberry", "blueberry", "fig"],
    [TR]: ["mangosteen", "banana", "papaya", "longan", "coconut", "chilli", "herb", "ginger", "turmeric", "pineapple", "starfruit", "yam", "cassava"],
    [SO]: ["orange", "grapefruit", "lemon", "kiwi", "carrot", "parsnip", "leek", "kale", "cabbage", "broccoli", "cauliflower", "beetroot", "beet", "potato", "celeriac", "onion"],
    [A]: ["date", "watermelon", "fig"],
  },
  // ── 7 August ───────────────────────────────────────────────────────────
  {
    [T]: ["tomato", "corn", "sweetcorn", "pepper", "aubergine", "eggplant", "courgette", "zucchini", "cucumber", "plum", "fig", "melon", "watermelon", "blackberry", "raspberry", "blueberry", "peach", "nectarine", "pear", "apple", "green bean", "runner bean", "fennel", "basil", "beetroot", "beet", "broccoli"],
    [N]: ["blueberry", "raspberry", "blackberry", "lingonberry", "chanterelle", "mushroom", "porcini", "potato", "carrot", "beetroot", "beet", "cucumber", "tomato", "corn", "sweetcorn", "courgette", "zucchini", "apple"],
    [M]: ["tomato", "pepper", "aubergine", "eggplant", "fig", "grape", "peach", "nectarine", "melon", "plum", "pear", "corn", "sweetcorn", "basil", "oregano", "zucchini", "courgette"],
    [S]: ["fig", "peach", "plum", "pepper", "tomato", "okra", "sweet potato", "eggplant", "aubergine", "corn", "sweetcorn", "watermelon", "melon"],
    [TR]: ["banana", "papaya", "longan", "coconut", "chilli", "ginger", "lemongrass", "pineapple", "yam", "cassava", "eggplant", "aubergine", "tomato", "cucumber"],
    [SO]: ["orange", "grapefruit", "lemon", "kiwi", "carrot", "leek", "kale", "cabbage", "broccoli", "cauliflower", "potato", "celeriac", "onion", "brussels sprout"],
    [A]: ["date", "fig", "grape"],
  },
  // ── 8 September ────────────────────────────────────────────────────────
  {
    [T]: ["apple", "pear", "plum", "blackberry", "elderberry", "fig", "grape", "quince", "mushroom", "squash", "pumpkin", "courgette", "zucchini", "tomato", "corn", "sweetcorn", "fennel", "beetroot", "beet", "leek", "broccoli", "cauliflower", "kale", "chard"],
    [N]: ["apple", "pear", "lingonberry", "cranberry", "rosehip", "mushroom", "chanterelle", "porcini", "potato", "carrot", "swede", "rutabaga", "cabbage", "kale", "leek"],
    [M]: ["grape", "fig", "pomegranate", "pear", "apple", "quince", "plum", "mushroom", "butternut", "squash", "tomato", "pepper", "aubergine", "eggplant", "walnut", "chestnut"],
    [S]: ["sweet potato", "apple", "pear", "fig", "pomegranate", "grape", "pepper", "tomato", "okra", "pumpkin", "squash"],
    [TR]: ["banana", "papaya", "coconut", "chilli", "ginger", "lemongrass", "turmeric", "yam", "cassava", "sweet potato", "pineapple", "starfruit"],
    [SO]: ["asparagus", "spring onion", "scallion", "pea", "spinach", "lettuce", "radish", "rhubarb", "herb", "carrot", "leek", "broccoli"],
    [A]: ["date", "fig", "pomegranate", "grape", "tomato", "pepper"],
  },
  // ── 9 October ──────────────────────────────────────────────────────────
  {
    [T]: ["apple", "pear", "quince", "pumpkin", "squash", "butternut", "mushroom", "beetroot", "beet", "carrot", "parsnip", "leek", "kale", "brussels sprout", "sprout", "celeriac", "fennel", "potato", "cauliflower", "broccoli", "cabbage", "chestnut", "walnut"],
    [N]: ["apple", "pear", "potato", "carrot", "swede", "rutabaga", "cabbage", "kale", "leek", "beetroot", "beet", "celeriac", "mushroom", "pumpkin"],
    [M]: ["pomegranate", "quince", "apple", "pear", "chestnut", "walnut", "mushroom", "fennel", "artichoke", "broccoli", "cauliflower", "grape", "olive", "pumpkin", "squash"],
    [S]: ["sweet potato", "pumpkin", "apple", "pear", "pecan", "grape", "broccoli", "cauliflower", "kale", "collard", "turnip", "lettuce"],
    [TR]: ["banana", "papaya", "coconut", "pomelo", "chilli", "ginger", "lemongrass", "turmeric", "yam", "cassava", "sweet potato", "pineapple", "starfruit"],
    [SO]: ["asparagus", "strawberry", "pea", "broad bean", "fava bean", "zucchini", "courgette", "lettuce", "spinach", "herb", "basil", "new potato", "spring onion"],
    [A]: ["date", "pomegranate", "fig", "tomato", "cucumber", "pepper", "eggplant", "aubergine", "herb"],
  },
  // ── 10 November ────────────────────────────────────────────────────────
  {
    [T]: ["parsnip", "carrot", "turnip", "swede", "leek", "kale", "brussels sprout", "sprout", "celeriac", "beetroot", "beet", "squash", "pumpkin", "cabbage", "quince", "chestnut", "walnut", "potato", "onion", "cauliflower", "broccoli", "chicory"],
    [N]: ["potato", "carrot", "swede", "rutabaga", "cabbage", "kale", "leek", "beetroot", "beet", "celeriac", "turnip", "onion"],
    [M]: ["orange", "clementine", "mandarin", "lemon", "pomegranate", "quince", "artichoke", "fennel", "broccoli", "cauliflower", "spinach", "chard", "olive", "chestnut", "walnut"],
    [S]: ["sweet potato", "pumpkin", "broccoli", "cauliflower", "kale", "collard", "turnip", "lettuce", "spinach", "carrot", "orange", "grapefruit", "pecan"],
    [TR]: ["pomelo", "banana", "papaya", "coconut", "avocado", "chilli", "lime", "ginger", "lemongrass", "sweet potato", "yam", "cassava", "starfruit"],
    [SO]: ["strawberry", "cherry", "zucchini", "courgette", "cucumber", "tomato", "pea", "broad bean", "fava bean", "lettuce", "herb", "basil", "new potato", "spring onion", "corn"],
    [A]: ["tomato", "cucumber", "lettuce", "spinach", "carrot", "herb", "orange", "lemon", "pomegranate", "date"],
  },
  // ── 11 December ────────────────────────────────────────────────────────
  {
    [T]: ["parsnip", "carrot", "turnip", "swede", "leek", "kale", "brussels sprout", "sprout", "celeriac", "beetroot", "beet", "cabbage", "orange", "clementine", "mandarin", "grapefruit", "lemon", "potato", "onion", "chicory", "endive", "chestnut"],
    [N]: ["potato", "carrot", "swede", "rutabaga", "cabbage", "kale", "leek", "beetroot", "beet", "celeriac", "turnip", "onion", "orange", "clementine"],
    [M]: ["orange", "clementine", "mandarin", "blood orange", "lemon", "artichoke", "fennel", "broccoli", "cauliflower", "spinach", "chard", "leek", "olive", "walnut"],
    [S]: ["orange", "grapefruit", "strawberry", "broccoli", "cauliflower", "kale", "collard", "carrot", "lettuce", "spinach", "sweet potato"],
    [TR]: ["pomelo", "banana", "papaya", "coconut", "avocado", "lychee", "chilli", "lime", "ginger", "lemongrass", "cassava", "yam", "tomato"],
    [SO]: ["tomato", "zucchini", "courgette", "cucumber", "corn", "sweetcorn", "cherry", "strawberry", "peach", "apricot", "blueberry", "raspberry", "herb", "basil", "new potato", "pepper"],
    [A]: ["tomato", "cucumber", "lettuce", "spinach", "carrot", "herb", "orange", "grapefruit", "lemon", "date"],
  },
];

// ── Public API ──────────────────────────────────────────────────────────────

/** Resolve a free-text location string to a climate zone. */
export function detectClimateZone(locationStr: string): ClimateZone {
  const lower = locationStr.toLowerCase().trim();

  // US states first (more specific than country-level US)
  for (const [state, zone] of Object.entries(US_STATE_CLIMATE)) {
    if (lower.includes(state)) return zone;
  }

  // Check country/region names and ISO codes
  for (const [key, zone] of Object.entries(COUNTRY_CLIMATE)) {
    if (lower.includes(key)) return zone;
  }

  // Latitude heuristic from Nominatim lat field if present as "lat:XX"
  const latMatch = lower.match(/lat:([-\d.]+)/);
  if (latMatch) {
    const lat = parseFloat(latMatch[1]);
    if (Math.abs(lat) < 23.5) return "tropical";
    if (lat > 60) return "nordic";
    if (lat < -23.5) return "southern";
  }

  return "temperate"; // sensible global default
}

/** Get the list of seasonal keywords for a zone and (optional) month override. */
export function getSeasonalProduce(zone: ClimateZone, monthOverride?: number): string[] {
  const month = monthOverride ?? new Date().getMonth();
  return SEASONAL_BY_MONTH[month]?.[zone] ?? [];
}

/** Check whether a recipe contains at least one seasonal ingredient. */
export function isSeasonalRecipe(
  recipe: {
    title?: string;
    description?: string | null;
    ingredients?: Array<{ name: string }>;
  },
  seasonalProduce: string[]
): boolean {
  if (!seasonalProduce.length) return true;
  const haystack = [
    recipe.title ?? "",
    recipe.description ?? "",
    ...(recipe.ingredients ?? []).map((i) => i.name),
  ]
    .join(" ")
    .toLowerCase();
  return seasonalProduce.some((kw) => haystack.includes(kw.toLowerCase()));
}

/** Human-readable current season for a zone. */
export function getSeasonLabel(zone: ClimateZone): string {
  const month = new Date().getMonth();
  if (zone === "tropical") return month >= 4 && month <= 9 ? "wet season 🌧️" : "dry season ☀️";
  if (zone === "arid") return month >= 4 && month <= 9 ? "summer 🌵" : "growing season 🌿";
  const flip = zone === "southern";
  const m = flip ? (month + 6) % 12 : month;
  if (m <= 1 || m === 11) return flip ? "summer ☀️" : "winter ❄️";
  if (m <= 4) return flip ? "autumn 🍂" : "spring 🌸";
  if (m <= 7) return flip ? "winter ❄️" : "summer ☀️";
  return flip ? "spring 🌸" : "autumn 🍂";
}
