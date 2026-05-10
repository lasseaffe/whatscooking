export type DietaryRestriction = "vegan" | "vegetarian" | "gluten-free" | "dairy-free" | "nut-free" | "egg-free" | "halal" | "kosher";

export const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-Free",
  "dairy-free": "Dairy-Free",
  "nut-free": "Nut-Free",
  "egg-free": "Egg-Free",
  halal: "Halal",
  kosher: "Kosher",
};

export const DIETARY_COLORS: Record<DietaryRestriction, { color: string; bg: string }> = {
  vegan:         { color: "#14532D", bg: "#BBF7D0" }, // dark forest green
  vegetarian:    { color: "#16A34A", bg: "#DCFCE7" }, // medium green
  "gluten-free": { color: "#92400E", bg: "#FEF3C7" }, // amber
  "dairy-free":  { color: "#1D4ED8", bg: "#DBEAFE" }, // blue
  "nut-free":    { color: "#7C3AED", bg: "#EDE9FE" }, // purple
  "egg-free":    { color: "#C85A2F", bg: "#FFF0E6" }, // terracotta
  halal:         { color: "#065F46", bg: "#D1FAE5" }, // deep green
  kosher:        { color: "#1E3A8A", bg: "#DBEAFE" }, // deep blue
};

export interface Substitution {
  /** Pattern to match against ingredient name (case-insensitive) */
  match: RegExp;
  /** Display name of the original ingredient (for UI purposes) */
  originalLabel: string;
  /** What to use instead */
  replacement: string;
  /** Usage note to show in parentheses */
  note?: string;
  /** How well the substitution works: 0–1 */
  confidence: number;
}

export const SUBSTITUTIONS: Record<DietaryRestriction, Substitution[]> = {
  vegan: [
    { match: /\bmilk\b/i, originalLabel: "milk", replacement: "oat milk", note: "same quantity", confidence: 0.95 },
    { match: /\bcream\b/i, originalLabel: "cream", replacement: "coconut cream", note: "same quantity", confidence: 0.82 },
    { match: /\bwhipped cream\b/i, originalLabel: "whipped cream", replacement: "coconut whipped cream", confidence: 0.85 },
    { match: /\bbutter\b/i, originalLabel: "butter", replacement: "vegan butter or coconut oil", note: "same quantity", confidence: 0.88 },
    { match: /\begg(s)?\b/i, originalLabel: "eggs", replacement: "flax egg (1 tbsp ground flax + 3 tbsp water per egg)", note: "works for binding; not ideal for meringue", confidence: 0.70 },
    { match: /\bhoney\b/i, originalLabel: "honey", replacement: "maple syrup or agave nectar", note: "same quantity", confidence: 0.95 },
    { match: /\bcheese\b/i, originalLabel: "cheese", replacement: "vegan cheese or nutritional yeast", note: "adjust to taste", confidence: 0.62 },
    { match: /\bparmesan\b/i, originalLabel: "parmesan", replacement: "nutritional yeast", note: "3 tbsp per 1 oz", confidence: 0.70 },
    { match: /\bmozzarella\b/i, originalLabel: "mozzarella", replacement: "vegan mozzarella", confidence: 0.68 },
    { match: /\byogurt\b/i, originalLabel: "yogurt", replacement: "coconut yogurt", note: "same quantity", confidence: 0.88 },
    { match: /\bgelatin\b/i, originalLabel: "gelatin", replacement: "agar-agar", note: "use half the amount", confidence: 0.82 },
    { match: /\bbeef\b/i, originalLabel: "beef", replacement: "lentils or plant-based beef", note: "recipe may vary", confidence: 0.55 },
    { match: /\bchicken\b/i, originalLabel: "chicken", replacement: "chickpeas or tofu", note: "recipe will change", confidence: 0.52 },
    { match: /\bpork\b/i, originalLabel: "pork", replacement: "tempeh or jackfruit", confidence: 0.50 },
    { match: /\banchov/i, originalLabel: "anchovies", replacement: "capers or miso paste", note: "for umami flavor", confidence: 0.72 },
    { match: /\bfish sauce\b/i, originalLabel: "fish sauce", replacement: "soy sauce + lime juice", note: "1:1 ratio", confidence: 0.80 },
    { match: /\bworcestershire\b/i, originalLabel: "Worcestershire sauce", replacement: "vegan Worcestershire or soy sauce", confidence: 0.85 },
    { match: /\bbacon\b/i, originalLabel: "bacon", replacement: "smoked tofu or coconut bacon", confidence: 0.58 },
    { match: /\bsour cream\b/i, originalLabel: "sour cream", replacement: "cashew sour cream or coconut yogurt", confidence: 0.78 },
    { match: /\bcream cheese\b/i, originalLabel: "cream cheese", replacement: "vegan cream cheese", confidence: 0.75 },
    { match: /\bbuttermilk\b/i, originalLabel: "buttermilk", replacement: "oat milk + 1 tbsp vinegar", note: "let sit 5 min", confidence: 0.88 },
    { match: /\blard\b/i, originalLabel: "lard", replacement: "coconut oil or vegan shortening", confidence: 0.85 },
  ],
  vegetarian: [
    { match: /\bbeef\b/i, originalLabel: "beef", replacement: "portobello mushrooms or lentils", confidence: 0.60 },
    { match: /\bchicken\b/i, originalLabel: "chicken", replacement: "chickpeas, tofu, or cauliflower", confidence: 0.55 },
    { match: /\bpork\b/i, originalLabel: "pork", replacement: "tempeh or jackfruit", confidence: 0.55 },
    { match: /\banchov/i, originalLabel: "anchovies", replacement: "capers or extra salt", note: "for umami", confidence: 0.72 },
    { match: /\bfish sauce\b/i, originalLabel: "fish sauce", replacement: "soy sauce", confidence: 0.80 },
    { match: /\bgelatin\b/i, originalLabel: "gelatin", replacement: "agar-agar", note: "half the amount", confidence: 0.82 },
    { match: /\bworcestershire\b/i, originalLabel: "Worcestershire sauce", replacement: "vegetarian Worcestershire sauce", confidence: 0.90 },
    { match: /\bbacon\b/i, originalLabel: "bacon", replacement: "smoked paprika + mushrooms", confidence: 0.60 },
    { match: /\bbroth|stock\b/i, originalLabel: "broth/stock", replacement: "vegetable broth", confidence: 0.92 },
    { match: /\blard\b/i, originalLabel: "lard", replacement: "butter or vegetable shortening", confidence: 0.90 },
  ],
  "gluten-free": [
    { match: /\bflour\b/i, originalLabel: "flour", replacement: "rice flour or 1:1 gluten-free flour blend", note: "add ¼ tsp xanthan gum if blend doesn't include it", confidence: 0.82 },
    { match: /\bbread crumb/i, originalLabel: "breadcrumbs", replacement: "gluten-free breadcrumbs or ground oats", confidence: 0.88 },
    { match: /\bpasta\b/i, originalLabel: "pasta", replacement: "rice pasta or chickpea pasta", confidence: 0.90 },
    { match: /\bsoy sauce\b/i, originalLabel: "soy sauce", replacement: "tamari (GF soy sauce)", note: "same quantity", confidence: 0.98 },
    { match: /\bbread\b/i, originalLabel: "bread", replacement: "gluten-free bread", confidence: 0.92 },
    { match: /\btortilla\b/i, originalLabel: "tortilla", replacement: "corn tortilla", confidence: 0.90 },
    { match: /\bpita\b/i, originalLabel: "pita", replacement: "gluten-free pita or rice cakes", confidence: 0.78 },
    { match: /\bwrapp?/i, originalLabel: "wrap", replacement: "rice paper or lettuce wrap", confidence: 0.80 },
    { match: /\bcornstarch\b/i, originalLabel: "cornstarch", replacement: "arrowroot powder or tapioca starch", confidence: 0.92 },
    { match: /\bcouscous\b/i, originalLabel: "couscous", replacement: "quinoa", confidence: 0.85 },
    { match: /\bbarley\b/i, originalLabel: "barley", replacement: "quinoa or buckwheat", confidence: 0.80 },
    { match: /\bbeer\b/i, originalLabel: "beer", replacement: "gluten-free beer or apple cider", confidence: 0.85 },
    { match: /\boat(s|meal)?\b/i, originalLabel: "oats", replacement: "certified gluten-free oats", confidence: 0.90 },
    { match: /\bworcestershire\b/i, originalLabel: "Worcestershire sauce", replacement: "gluten-free Worcestershire", confidence: 0.88 },
    { match: /\bpanko\b/i, originalLabel: "panko", replacement: "gluten-free panko", confidence: 0.90 },
  ],
  "dairy-free": [
    { match: /\bmilk\b/i, originalLabel: "milk", replacement: "oat milk or almond milk", note: "same quantity", confidence: 0.95 },
    { match: /\bbutter\b/i, originalLabel: "butter", replacement: "dairy-free butter or coconut oil", note: "same quantity", confidence: 0.88 },
    { match: /\bcream\b/i, originalLabel: "cream", replacement: "coconut cream", note: "same quantity", confidence: 0.82 },
    { match: /\bcheese\b/i, originalLabel: "cheese", replacement: "dairy-free cheese", confidence: 0.68 },
    { match: /\bparmesan\b/i, originalLabel: "parmesan", replacement: "nutritional yeast", note: "3 tbsp per 1 oz", confidence: 0.72 },
    { match: /\byogurt\b/i, originalLabel: "yogurt", replacement: "coconut yogurt", confidence: 0.88 },
    { match: /\bsour cream\b/i, originalLabel: "sour cream", replacement: "coconut yogurt", confidence: 0.78 },
    { match: /\bcream cheese\b/i, originalLabel: "cream cheese", replacement: "dairy-free cream cheese", confidence: 0.78 },
    { match: /\bbuttermilk\b/i, originalLabel: "buttermilk", replacement: "oat milk + 1 tbsp vinegar", note: "let sit 5 min", confidence: 0.90 },
    { match: /\bghee\b/i, originalLabel: "ghee", replacement: "coconut oil", confidence: 0.88 },
    { match: /\bwhipped cream\b/i, originalLabel: "whipped cream", replacement: "coconut whipped cream", confidence: 0.85 },
    { match: /\bricotta\b/i, originalLabel: "ricotta", replacement: "tofu ricotta", note: "blend silken tofu with lemon & salt", confidence: 0.72 },
    { match: /\bmozzarella\b/i, originalLabel: "mozzarella", replacement: "dairy-free mozzarella", confidence: 0.70 },
    { match: /\bcheddar\b/i, originalLabel: "cheddar", replacement: "dairy-free cheddar", confidence: 0.68 },
    { match: /\bhalf([ -]and[ -]half)\b/i, originalLabel: "half and half", replacement: "oat milk", confidence: 0.80 },
  ],
  "nut-free": [
    { match: /\bpeanut butter\b/i, originalLabel: "peanut butter", replacement: "sunflower seed butter", note: "same quantity", confidence: 0.85 },
    { match: /\bpeanut\b/i, originalLabel: "peanuts", replacement: "sunflower seeds or pumpkin seeds", confidence: 0.82 },
    { match: /\balmond(s)?\b/i, originalLabel: "almonds", replacement: "sunflower seeds", confidence: 0.78 },
    { match: /\bwalnut(s)?\b/i, originalLabel: "walnuts", replacement: "pumpkin seeds", confidence: 0.78 },
    { match: /\bcashew(s)?\b/i, originalLabel: "cashews", replacement: "sunflower seeds or hemp hearts", confidence: 0.75 },
    { match: /\bpecan(s)?\b/i, originalLabel: "pecans", replacement: "pumpkin seeds", confidence: 0.78 },
    { match: /\bhazelnut(s)?\b/i, originalLabel: "hazelnuts", replacement: "sunflower seeds", confidence: 0.72 },
    { match: /\bpistachio(s)?\b/i, originalLabel: "pistachios", replacement: "pumpkin seeds or sunflower seeds", confidence: 0.75 },
    { match: /\bmacadamia\b/i, originalLabel: "macadamia nuts", replacement: "hemp hearts", confidence: 0.70 },
    { match: /\balmond milk\b/i, originalLabel: "almond milk", replacement: "oat milk or rice milk", confidence: 0.95 },
    { match: /\balmond flour\b/i, originalLabel: "almond flour", replacement: "sunflower seed flour or oat flour", confidence: 0.80 },
    { match: /\btahini\b/i, originalLabel: "tahini", replacement: "sunflower seed butter", confidence: 0.82 },
    { match: /\bpesto\b/i, originalLabel: "pesto", replacement: "nut-free pesto (use sunflower seeds instead of pine nuts)", confidence: 0.85 },
    { match: /\bpine nut(s)?\b/i, originalLabel: "pine nuts", replacement: "pumpkin seeds", confidence: 0.80 },
    { match: /\bpeanut oil\b/i, originalLabel: "peanut oil", replacement: "sunflower oil", confidence: 0.95 },
  ],
  "egg-free": [
    { match: /\begg(s)?\b/i, originalLabel: "eggs", replacement: "flax egg (1 tbsp ground flax + 3 tbsp water) for baking, or aquafaba for meringue", note: "let flax egg sit 5 min before using", confidence: 0.72 },
    { match: /\begg wash\b/i, originalLabel: "egg wash", replacement: "oat milk or maple syrup brush", note: "for browning", confidence: 0.80 },
    { match: /\bwhole egg\b/i, originalLabel: "whole egg", replacement: "flax egg or chia egg", confidence: 0.72 },
    { match: /\begg yolk\b/i, originalLabel: "egg yolk", replacement: "2 tbsp silken tofu blended smooth", confidence: 0.60 },
    { match: /\begg white\b/i, originalLabel: "egg white", replacement: "aquafaba (liquid from canned chickpeas)", note: "3 tbsp per egg white", confidence: 0.75 },
    { match: /\bmayonnaise\b/i, originalLabel: "mayonnaise", replacement: "vegan mayo (egg-free)", confidence: 0.92 },
    { match: /\bcustard\b/i, originalLabel: "custard", replacement: "cornstarch-thickened coconut milk", confidence: 0.68 },
    { match: /\bmeringue\b/i, originalLabel: "meringue", replacement: "aquafaba meringue", note: "whip aquafaba to stiff peaks", confidence: 0.75 },
    { match: /\bhollandaise\b/i, originalLabel: "hollandaise", replacement: "vegan hollandaise sauce", confidence: 0.65 },
  ],
  halal: [
    { match: /\bpork\b/i, originalLabel: "pork", replacement: "chicken or halal beef", confidence: 0.85 },
    { match: /\bbacon\b/i, originalLabel: "bacon", replacement: "halal turkey bacon or beef strips", confidence: 0.80 },
    { match: /\bham\b/i, originalLabel: "ham", replacement: "halal turkey or chicken", confidence: 0.80 },
    { match: /\bpepperoni\b/i, originalLabel: "pepperoni", replacement: "halal beef pepperoni", confidence: 0.88 },
    { match: /\bsausage\b/i, originalLabel: "sausage", replacement: "halal chicken or beef sausage", confidence: 0.82 },
    { match: /\bwine\b/i, originalLabel: "wine", replacement: "grape juice or halal cooking stock", note: "adjust sweetness to taste", confidence: 0.78 },
    { match: /\bbeer\b/i, originalLabel: "beer", replacement: "non-alcoholic beer or apple cider", confidence: 0.75 },
    { match: /\brum\b|\bwhisky\b|\bvodka\b|\bbrandy\b|\bkahlua\b/i, originalLabel: "alcohol", replacement: "fruit juice or vanilla extract", confidence: 0.70 },
    { match: /\bgelatin\b/i, originalLabel: "gelatin", replacement: "halal gelatin or agar-agar", note: "use same quantity", confidence: 0.85 },
    { match: /\blard\b/i, originalLabel: "lard", replacement: "vegetable oil or halal beef fat", confidence: 0.88 },
    { match: /\bworcestershire\b/i, originalLabel: "Worcestershire sauce", replacement: "halal Worcestershire sauce", note: "standard may contain anchovies/tamarind", confidence: 0.80 },
  ],
  kosher: [
    { match: /\bpork\b/i, originalLabel: "pork", replacement: "kosher beef or lamb", confidence: 0.85 },
    { match: /\bbacon\b/i, originalLabel: "bacon", replacement: "kosher beef fry or turkey bacon", confidence: 0.80 },
    { match: /\bham\b/i, originalLabel: "ham", replacement: "kosher turkey or beef", confidence: 0.80 },
    { match: /\bshrimp\b|\bprawn\b/i, originalLabel: "shrimp/prawns", replacement: "kosher white fish or tofu", confidence: 0.72 },
    { match: /\blockster\b|\bcrab\b/i, originalLabel: "shellfish", replacement: "kosher white fish or salmon", confidence: 0.70 },
    { match: /\bclam\b|\boyster\b|\bmussel\b/i, originalLabel: "shellfish", replacement: "kosher fish or mushrooms", confidence: 0.68 },
    { match: /\bgelatin\b/i, originalLabel: "gelatin", replacement: "kosher gelatin or agar-agar", note: "ensure it's certified kosher", confidence: 0.85 },
    { match: /\bscallop\b/i, originalLabel: "scallops", replacement: "kosher white fish", confidence: 0.70 },
    { match: /\bsquid\b|\boctopus\b/i, originalLabel: "squid/octopus", replacement: "white fish or chicken", confidence: 0.68 },
  ],
};

export interface AdaptedIngredient {
  original: { name: string; amount?: number | null; unit?: string | null };
  adapted: boolean;
  replacement?: string;
  note?: string;
  confidence?: number;
}

export interface AdaptationResult {
  ingredients: AdaptedIngredient[];
  /** 0–1, average confidence across all substitutions made */
  overallConfidence: number;
  /** number of substitutions made */
  substitutionCount: number;
  /** "high" | "medium" | "low" | "none" */
  confidenceLabel: "high" | "medium" | "low" | "none";
}

export function adaptIngredients(
  ingredients: { name: string; amount?: number | null; unit?: string | null }[],
  restriction: DietaryRestriction
): AdaptationResult {
  const rules = SUBSTITUTIONS[restriction] ?? [];
  const adapted: AdaptedIngredient[] = [];
  const scores: number[] = [];

  for (const ing of ingredients) {
    let matched: Substitution | null = null;
    for (const rule of rules) {
      if (rule.match.test(ing.name)) {
        matched = rule;
        break;
      }
    }
    if (matched) {
      adapted.push({
        original: ing,
        adapted: true,
        replacement: matched.replacement,
        note: matched.note,
        confidence: matched.confidence,
      });
      scores.push(matched.confidence);
    } else {
      adapted.push({ original: ing, adapted: false });
    }
  }

  const overallConfidence =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
  const confidenceLabel =
    scores.length === 0
      ? "none"
      : overallConfidence >= 0.85
      ? "high"
      : overallConfidence >= 0.65
      ? "medium"
      : "low";

  return {
    ingredients: adapted,
    overallConfidence,
    substitutionCount: scores.length,
    confidenceLabel,
  };
}
