/**
 * Substitutability system
 *
 * sub_score: 0–1
 *   1.0 = perfect substitute (e.g. olive oil ↔ vegetable oil)
 *   0.7 = close substitute with minor flavour difference
 *   0.4 = passable substitute, noticeable difference
 *   0.0 = not substitutable — missing it matters a lot
 *
 * criticality: inverse of substitutability — used for sorting
 */

export interface SubGroup {
  canonical: string;
  members: string[];       // all names that belong to this group
  sub_score: number;       // how substitutable the group is (0–1)
}

export const SUBSTITUTE_GROUPS: SubGroup[] = [
  // ── Oils & fats ────────────────────────────────────────────
  { canonical: "oil", sub_score: 0.95,
    members: ["olive oil","vegetable oil","rapeseed oil","canola oil","sunflower oil",
               "avocado oil","coconut oil","grapeseed oil","neutral oil"] },
  { canonical: "butter", sub_score: 0.75,
    members: ["butter","margarine","vegan butter","plant butter","ghee"] },

  // ── Stocks & broths ────────────────────────────────────────
  { canonical: "broth", sub_score: 0.85,
    members: ["chicken broth","vegetable broth","beef broth","chicken stock",
               "vegetable stock","beef stock","broth","stock","bouillon"] },

  // ── Milk & cream ───────────────────────────────────────────
  { canonical: "milk", sub_score: 0.8,
    members: ["whole milk","milk","oat milk","almond milk","soy milk","plant milk",
               "skimmed milk","semi-skimmed milk"] },
  { canonical: "cream", sub_score: 0.7,
    members: ["heavy cream","double cream","single cream","whipping cream",
               "sour cream","crème fraîche","coconut cream"] },

  // ── Cheese ─────────────────────────────────────────────────
  { canonical: "hard cheese", sub_score: 0.65,
    members: ["parmesan","pecorino","pecorino romano","grana padano","grated cheese"] },
  { canonical: "mozzarella", sub_score: 0.5,
    members: ["mozzarella","fresh mozzarella","burrata"] },

  // ── Flour ──────────────────────────────────────────────────
  { canonical: "flour", sub_score: 0.8,
    members: ["all-purpose flour","plain flour","bread flour","00 flour","flour"] },

  // ── Sugar ──────────────────────────────────────────────────
  { canonical: "sugar", sub_score: 0.85,
    members: ["sugar","granulated sugar","caster sugar","white sugar","brown sugar",
               "dark brown sugar","light brown sugar","muscovado"] },

  // ── Vinegar ────────────────────────────────────────────────
  { canonical: "vinegar", sub_score: 0.7,
    members: ["red wine vinegar","white wine vinegar","apple cider vinegar",
               "rice vinegar","balsamic vinegar","sherry vinegar","vinegar"] },

  // ── Soy sauce ──────────────────────────────────────────────
  { canonical: "soy sauce", sub_score: 0.75,
    members: ["soy sauce","tamari","coconut aminos","light soy sauce","dark soy sauce"] },

  // ── Citrus juice ───────────────────────────────────────────
  { canonical: "citrus juice", sub_score: 0.6,
    members: ["lemon juice","lime juice","lemon","lime"] },

  // ── Dried herbs (very interchangeable) ─────────────────────
  { canonical: "dried herbs", sub_score: 0.8,
    members: ["thyme","oregano","marjoram","italian seasoning","mixed herbs",
               "herbes de provence","dried thyme","dried oregano"] },

  // ── Chilli / heat ──────────────────────────────────────────
  { canonical: "chilli", sub_score: 0.8,
    members: ["chilli flakes","red pepper flakes","cayenne","dried chilli",
               "chili powder","hot sauce","sriracha"] },

  // ── Canned tomatoes ────────────────────────────────────────
  { canonical: "canned tomatoes", sub_score: 0.85,
    members: ["canned tomatoes","crushed tomatoes","diced tomatoes","chopped tomatoes",
               "tomato passata","passata","tomato puree","tomato paste"] },

  // ── Beans ──────────────────────────────────────────────────
  { canonical: "beans", sub_score: 0.75,
    members: ["kidney beans","black beans","cannellini beans","chickpeas","white beans",
               "pinto beans","borlotti beans","navy beans"] },

  // ── Leafy greens ───────────────────────────────────────────
  { canonical: "leafy greens", sub_score: 0.7,
    members: ["spinach","baby spinach","kale","chard","swiss chard","cavolo nero","rocket",
               "arugula","spring greens"] },

  // ── Nuts (for texture) ─────────────────────────────────────
  { canonical: "nuts", sub_score: 0.65,
    members: ["walnuts","pecans","almonds","cashews","pine nuts","hazelnuts"] },

  // ── Pepper ─────────────────────────────────────────────────
  { canonical: "pepper", sub_score: 0.9,
    members: ["black pepper","white pepper","ground pepper","cracked pepper","pepper"] },

  // ── Salt (always substitutable) ────────────────────────────
  { canonical: "salt", sub_score: 1.0,
    members: ["salt","sea salt","kosher salt","table salt","flaky salt","maldon"] },

  // ── Garlic ─────────────────────────────────────────────────
  { canonical: "garlic", sub_score: 0.5,
    members: ["garlic","garlic cloves","garlic powder","garlic granules"] },

  // ── Onion family ───────────────────────────────────────────
  { canonical: "onion", sub_score: 0.6,
    members: ["onion","yellow onion","white onion","red onion","shallots","spring onions",
               "scallions","leek","onion powder"] },

  // ── Eggs ───────────────────────────────────────────────────
  { canonical: "egg", sub_score: 0.3,
    members: ["egg","eggs","egg yolk","egg yolks","egg white","egg whites"] },

  // ── Pasta ──────────────────────────────────────────────────
  { canonical: "pasta", sub_score: 0.85,
    members: ["spaghetti","penne","rigatoni","fusilli","tagliatelle","fettuccine",
               "linguine","pappardelle","pasta","macaroni"] },

  // ── Rice ───────────────────────────────────────────────────
  { canonical: "rice", sub_score: 0.6,
    members: ["rice","basmati rice","jasmine rice","long grain rice","short grain rice",
               "brown rice","sushi rice","arborio"] },
];

// ---------------------------------------------------------------------------
// Build lookup maps once at module level
// ---------------------------------------------------------------------------
const KEYWORD_TO_SCORE = new Map<string, number>();
const KEYWORD_TO_CANONICAL = new Map<string, string>();

for (const group of SUBSTITUTE_GROUPS) {
  for (const member of group.members) {
    KEYWORD_TO_SCORE.set(member.toLowerCase(), group.sub_score);
    KEYWORD_TO_CANONICAL.set(member.toLowerCase(), group.canonical);
  }
}

/** Returns how substitutable an ingredient is (0 = critical, 1 = easily replaced) */
export function getSubScore(ingredientName: string): number {
  const lower = ingredientName.toLowerCase();
  // Exact match
  if (KEYWORD_TO_SCORE.has(lower)) return KEYWORD_TO_SCORE.get(lower)!;
  // Partial match
  for (const [key, score] of KEYWORD_TO_SCORE.entries()) {
    if (lower.includes(key) || key.includes(lower)) return score;
  }
  // Default: somewhat critical
  return 0.25;
}

/** Returns the canonical substitute group name (for display) */
export function getCanonical(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  if (KEYWORD_TO_CANONICAL.has(lower)) return KEYWORD_TO_CANONICAL.get(lower)!;
  for (const [key, canonical] of KEYWORD_TO_CANONICAL.entries()) {
    if (lower.includes(key) || key.includes(lower)) return canonical;
  }
  return ingredientName;
}

/**
 * Check whether a pantry item fuzzy-matches a recipe ingredient.
 * Returns true if the user likely has it.
 */
export function pantryHasIngredient(
  ingredientName: string,
  pantryNames: string[]
): boolean {
  const lower = ingredientName.toLowerCase();
  const canonical = getCanonical(lower);

  for (const pantry of pantryNames) {
    const p = pantry.toLowerCase();
    // Direct substring match
    if (lower.includes(p) || p.includes(lower)) return true;
    // Match via canonical group
    if (getCanonical(p) === canonical) return true;
  }
  return false;
}
