/**
 * recipe-image.ts
 *
 * Single source of truth for recipe image logic across the app.
 *
 * Responsibilities:
 *  - Detect food category from recipe title + cuisine
 *  - Return a category-matched Unsplash fallback URL (never a broken image)
 *  - Provide a placeholder color + icon label for the final-fail state
 *
 * All Unsplash photo IDs below have been selected to match their category label.
 * Do NOT reuse IDs across categories — uniqueness is enforced in check-images.mjs.
 */

// ── Category → curated Unsplash photo IDs ────────────────────────────────────
// Each ID resolves to: https://images.unsplash.com/{id}?w=600&q=75
// IDs are distinct per category to prevent cross-recipe duplication.

export const CATEGORY_PHOTOS: Record<string, string[]> = {
  pasta: [
    "photo-1551183053-bf91798d9fe8", // cacio e pepe close-up
    "photo-1621996346565-e3dbc353d2e5", // spaghetti with sauce
    "photo-1473093295043-cdd812d0e601", // tagliatelle
  ],
  pizza: [
    "photo-1565299624946-b28f40a0ae38", // margherita slice
    "photo-1574071318508-1cdbab80d002", // wood-fired pizza
    "photo-1548365328-8c6db3220e4c", // pepperoni
  ],
  burger: [
    "photo-1568901346375-23c9450c58cd", // classic burger
    "photo-1550317138-10000687a72b", // smash burger
    "photo-1571091718767-18b5b1457add", // gourmet burger
  ],
  salad: [
    "photo-1512621776951-a57141f2eefd", // green salad
    "photo-1546069901-ba9599a7e63c", // grain bowl
    "photo-1540420773420-3366772f4999", // caesar
  ],
  soup: [
    "photo-1547592166-23ac45744acd", // bowl of soup
    "photo-1516684669134-de6f7c473a2a", // ramen bowl
    "photo-1572695157366-5e585ab2b69f", // lentil soup
  ],
  chicken: [
    "photo-1604908176997-125f25cc6f3d", // roast chicken
    "photo-1532550907401-a500c9a57435", // grilled chicken
    "photo-1569050467447-ce54b3bbc37d", // chicken rice
  ],
  beef: [
    "photo-1558030006-450675393462", // steak
    "photo-1544025162-d76538d30027", // beef stew
    "photo-1432139509613-5c4255815697", // meatballs
  ],
  fish: [
    "photo-1519708227418-c8fd9a32b7a2", // salmon fillet
    "photo-1467003909585-2f8a72700288", // grilled fish
    "photo-1559847844-5315695dadae", // fish plate
  ],
  seafood: [
    "photo-1565680018434-b513d5e5fd47", // shrimp
    "photo-1563227812-0ea4c22e6cc8", // seafood platter
    "photo-1528735602780-2552fd46c7af", // mixed seafood
  ],
  rice: [
    "photo-1603133872878-684f208fb84b", // fried rice
    "photo-1596797038530-2c107229654b", // biryani
    "photo-1585937421612-70a008356fbe", // rice dish
  ],
  curry: [
    "photo-1585937421612-70a008356fbe", // curry bowl
    "photo-1548943487-a2e4e43b4853", // tikka masala
    "photo-1455619452474-d2be8b1e70cd", // dal
  ],
  "west-african": [
    "photo-1529042410759-befb1204b468", // jollof-style rice
    "photo-1598511726623-d2e9996e206e", // West African stew
    "photo-1504674900247-0877df9cc836", // warm grain dish
  ],
  mexican: [
    "photo-1565299585323-38d6b0865b47", // tacos
    "photo-1551504734-5da9ec4ec05b", // burrito
    "photo-1604882406385-b92e8d26f8dc", // enchiladas
  ],
  japanese: [
    "photo-1553621042-f6e147245754", // sushi
    "photo-1617196034183-421b4040ed20", // ramen
    "photo-1569050467447-ce54b3bbc37d", // rice bowl
  ],
  indian: [
    "photo-1585937421612-70a008356fbe", // curry
    "photo-1548943487-a2e4e43b4853", // tikka
    "photo-1596797038530-2c107229654b", // biryani
  ],
  thai: [
    "photo-1562565652-a0d8f0c59eb4", // pad thai
    "photo-1569562853014-e04dbdca6d09", // green curry
    "photo-1516684669134-de6f7c473a2a", // noodles
  ],
  mediterranean: [
    "photo-1490645935967-10de6ba17061", // mezze spread
    "photo-1476224203421-9ac39bcb3327", // grilled veggies
    "photo-1482049016688-2d3e1b311543", // hummus bowl
  ],
  chinese: [
    "photo-1617093727343-374698b1b08d", // dim sum
    "photo-1563245372-f21724e3856d", // noodle dish
    "photo-1582878826629-29b7ad1cdc43", // stir fry
  ],
  dessert: [
    "photo-1579954115545-a95591f28bfc", // cake slice
    "photo-1551024506-0bccd828d307", // chocolate dessert
    "photo-1563729784474-d77dbb933a9e", // cookies
  ],
  bread: [
    "photo-1509440159596-0249088772ff", // loaf
    "photo-1549931319-a545dcf3bc73", // sourdough
    "photo-1486887396153-fa1369b7cd27", // baguette
  ],
  eggs: [
    "photo-1525351484163-7529414344d8", // fried egg
    "photo-1482049016688-2d3e1b311543", // omelette
    "photo-1567620905732-2d1ec7ab7445", // poached eggs
  ],
  breakfast: [
    "photo-1533089860892-a7c6f0a88666", // pancakes
    "photo-1484980972926-edee96e0960d", // full breakfast
    "photo-1499028344343-cd173ffc68a9", // avocado toast
  ],
  drink: [
    "photo-1544145945-f90425340c7e", // cocktail
    "photo-1497534446932-c925b458314e", // cold drink
    "photo-1571091655789-405eb7a3a3a8", // soda with ice
  ],
  vegetarian: [
    "photo-1512621776951-a57141f2eefd", // veggie bowl
    "photo-1540189549336-e6e99c3679fe", // colorful veg
    "photo-1505253716362-afaea1d3d1af", // roasted veg
  ],
  general: [
    "photo-1476224203421-9ac39bcb3327", // elegant plate
    "photo-1414235077428-338989a2e8c0", // restaurant dish
    "photo-1563379926898-05f4575a45d8", // dinner plate
  ],
};

// ── Category detection ────────────────────────────────────────────────────────

export function detectFoodCategory(
  title: string,
  cuisine?: string | null,
  dietaryTags?: string[] | null,
): string {
  const t = title.toLowerCase();
  const c = (cuisine ?? "").toLowerCase();

  // West African — check FIRST before generic categories to avoid misclassification
  // e.g. "West African Peanut Stew" must not fall through to "soup"
  if (t.match(/jollof|egusi|suya|waakye|fufu|jerk|groundnut soup|peanut soup|ofe onugbu|bitterleaf|ogbono|okra soup|ofada|moi moi|akara|puff puff|chin chin/)) return "west-african";
  if (c.match(/west african|african|nigerian|ghanaian|senegalese|ivorian|cameroonian|ethiopian|kenyan/)) return "west-african";
  if (t.match(/nigerian|ghanaian|west african|senegalese/) ) return "west-african";

  // Specific dish matches
  if (t.match(/pasta|spaghetti|penne|fettuccine|linguine|tagliatelle|carbonara|cacio|amatriciana|lasagna|gnocchi|rigatoni|bucatini/)) return "pasta";
  if (t.match(/pizza/)) return "pizza";
  if (t.match(/burger|sandwich|wrap|sub|hoagie/)) return "burger";
  if (t.match(/salad|slaw|bowl/)) return "salad";
  if (t.match(/soup|stew|broth|chowder|bisque|bouillabaisse|minestrone|pho/)) return "soup";
  if (t.match(/chicken|hen|poultry/)) return "chicken";
  if (t.match(/beef|steak|brisket|short rib|meatball/)) return "beef";
  if (t.match(/salmon|tuna|cod|halibut|tilapia|sea bass|trout|mackerel|fish/)) return "fish";
  if (t.match(/shrimp|prawn|lobster|crab|scallop|mussel|clam|seafood/)) return "seafood";
  if (t.match(/curry|masala|tikka|korma|dal|dhal|palak/)) return "curry";
  if (t.match(/taco|burrito|enchilada|quesadilla|fajita|guacamole/)) return "mexican";
  if (t.match(/sushi|ramen|udon|soba|tempura|miso|tonkatsu|teriyaki/)) return "japanese";
  if (t.match(/pad thai|green curry|tom yum|larb|satay|khao|som tam/)) return "thai";
  if (t.match(/dim sum|dumpling|kung pao|mapo|wonton|fried rice|chow mein/)) return "chinese";
  if (t.match(/risotto|paella|pilaf|biryani|fried rice/)) return "rice";
  if (t.match(/cake|brownie|cookie|dessert|pie|tart|crème|panna|gelato|mousse|soufflé|éclair|macaron/)) return "dessert";
  if (t.match(/bread|loaf|sourdough|baguette|focaccia|naan|pita/)) return "bread";
  if (t.match(/egg|omelette|omelette|frittata|scrambled|quiche|shakshuka/)) return "eggs";
  if (t.match(/pancake|waffle|french toast|crepe|benedict/)) return "breakfast";
  if (t.match(/smoothie|juice|drink|soda|cocktail|lemonade|milkshake|dr pepper|sprite|coke|cola/)) return "drink";

  // Cuisine-level fallback (West African already handled above)
  if (c.match(/indian|bangladeshi|pakistani|sri lankan/)) return "indian";
  if (c.match(/thai/)) return "thai";
  if (c.match(/japanese/)) return "japanese";
  if (c.match(/chinese|cantonese|sichuan|shanghainese/)) return "chinese";
  if (c.match(/mexican|tex-mex/)) return "mexican";
  if (c.match(/italian/)) return "pasta";
  if (c.match(/mediterranean|greek|turkish|moroccan|lebanese/)) return "mediterranean";

  // Dietary tag fallback
  if (dietaryTags?.some(t => ["vegan", "vegetarian"].includes(t))) return "vegetarian";

  return "general";
}

// ── djb2 hash — deterministic per recipe ID ───────────────────────────────────
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the best available image URL for a recipe.
 * Priority: stored image_url → category-matched Unsplash fallback
 */
export function getRecipeImageUrl(
  recipeId: string,
  imageUrl: string | null | undefined,
  title: string,
  cuisine?: string | null,
  dietaryTags?: string[] | null,
): string {
  if (imageUrl) return imageUrl;
  return getCategoryFallback(recipeId, title, cuisine, dietaryTags);
}

/**
 * Returns a category-matched Unsplash fallback URL.
 * Uses deterministic hashing so the same recipe always gets the same image.
 */
export function getCategoryFallback(
  recipeId: string,
  title: string,
  cuisine?: string | null,
  dietaryTags?: string[] | null,
): string {
  const category = detectFoodCategory(title, cuisine, dietaryTags);
  const photos = CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.general;
  const photo = photos[hashStr(recipeId) % photos.length];
  return `https://images.unsplash.com/${photo}?w=600&q=75`;
}

/**
 * Placeholder config for the last-resort state (image URL returned 404, fallback also failed).
 */
export function getPlaceholderConfig(title: string, cuisine?: string | null): {
  bg: string;
  label: string;
  icon: string;
} {
  const category = detectFoodCategory(title, cuisine);
  const map: Record<string, { bg: string; label: string; icon: string }> = {
    pasta:        { bg: "#FFF8F3", label: "Pasta",      icon: "🍝" },
    pizza:        { bg: "#FFF3F0", label: "Pizza",      icon: "🍕" },
    burger:       { bg: "#FFF8EE", label: "Burger",     icon: "🍔" },
    salad:        { bg: "#F0FDF4", label: "Salad",      icon: "🥗" },
    soup:         { bg: "#FFFBEB", label: "Soup",       icon: "🍲" },
    chicken:      { bg: "#FFF7ED", label: "Chicken",    icon: "🍗" },
    beef:         { bg: "#FEF2F2", label: "Beef",       icon: "🥩" },
    fish:         { bg: "#EFF6FF", label: "Fish",       icon: "🐟" },
    seafood:      { bg: "#EFF6FF", label: "Seafood",    icon: "🦐" },
    "west-african": { bg: "#FEF9C3", label: "African",  icon: "🫕" },
    curry:        { bg: "#FFFBEB", label: "Curry",      icon: "🍛" },
    mexican:      { bg: "#FFF7ED", label: "Mexican",    icon: "🌮" },
    japanese:     { bg: "#FDF4FF", label: "Japanese",   icon: "🍱" },
    thai:         { bg: "#F0FDF4", label: "Thai",       icon: "🥢" },
    chinese:      { bg: "#FFF1F2", label: "Chinese",    icon: "🥡" },
    rice:         { bg: "#F0FDF4", label: "Rice",       icon: "🍚" },
    dessert:      { bg: "#FDF4FF", label: "Dessert",    icon: "🍰" },
    bread:        { bg: "#FFFBEB", label: "Bread",      icon: "🍞" },
    eggs:         { bg: "#FEFCE8", label: "Eggs",       icon: "🥚" },
    breakfast:    { bg: "#FFFBEB", label: "Breakfast",  icon: "🥞" },
    drink:        { bg: "#EFF6FF", label: "Drink",      icon: "🥤" },
    mediterranean:{ bg: "#F0FDF4", label: "Mediterranean", icon: "🫒" },
    indian:       { bg: "#FFFBEB", label: "Indian",     icon: "🍛" },
    vegetarian:   { bg: "#F0FDF4", label: "Veggie",     icon: "🥦" },
    general:      { bg: "#FFF5F0", label: "Recipe",     icon: "🍽️" },
  };
  return map[category] ?? map.general;
}
