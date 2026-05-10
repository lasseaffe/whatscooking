// Maps ingredient names (lowercased substrings) to emoji
// Ordered from most specific to most general — first match wins.

const INGREDIENT_EMOJI_MAP: [string, string][] = [
  // Proteins – Meat
  ["chicken thigh", "🍗"], ["chicken breast", "🍗"], ["chicken", "🍗"],
  ["ground beef", "🥩"], ["beef", "🥩"], ["steak", "🥩"],
  ["ground pork", "🥩"], ["pork shoulder", "🥩"], ["pork", "🥩"],
  ["lamb", "🍖"], ["veal", "🍖"], ["bacon", "🥓"],
  ["pancetta", "🥓"], ["sausage", "🌭"], ["salami", "🥩"],
  ["prosciutto", "🥓"], ["ham", "🥓"], ["turkey", "🦃"],
  // Seafood
  ["salmon", "🐟"], ["tuna", "🐟"], ["shrimp", "🦐"],
  ["prawn", "🦐"], ["lobster", "🦞"], ["crab", "🦀"],
  ["scallop", "🐚"], ["clam", "🐚"], ["mussel", "🐚"],
  ["sardine", "🐟"], ["cod", "🐟"], ["tilapia", "🐟"],
  ["fish", "🐟"],
  // Dairy
  ["cream cheese", "🧀"], ["parmesan", "🧀"], ["mozzarella", "🧀"],
  ["cheddar", "🧀"], ["feta", "🧀"], ["gouda", "🧀"],
  ["ricotta", "🧀"], ["pecorino", "🧀"], ["brie", "🧀"],
  ["cheese", "🧀"], ["butter", "🧈"],
  ["heavy cream", "🥛"], ["double cream", "🥛"], ["sour cream", "🥛"],
  ["whipping cream", "🥛"], ["milk", "🥛"],
  ["yogurt", "🥛"], ["yoghurt", "🥛"],
  ["egg", "🥚"],
  // Vegetables
  ["tomato", "🍅"], ["cherry tomato", "🍅"],
  ["carrot", "🥕"], ["broccoli", "🥦"],
  ["spinach", "🥬"], ["kale", "🥬"], ["chard", "🥬"],
  ["lettuce", "🥬"], ["arugula", "🥬"], ["rocket", "🥬"],
  ["cabbage", "🥬"], ["bok choy", "🥬"],
  ["corn", "🌽"], ["pea", "🫛"], ["edamame", "🫛"],
  ["avocado", "🥑"], ["cucumber", "🥒"],
  ["pepper", "🫑"], ["bell pepper", "🫑"], ["chilli", "🌶️"], ["chili", "🌶️"],
  ["jalapeño", "🌶️"], ["habanero", "🌶️"],
  ["onion", "🧅"], ["shallot", "🧅"], ["leek", "🧅"],
  ["garlic", "🧄"], ["ginger", "🫚"],
  ["potato", "🥔"], ["sweet potato", "🍠"],
  ["mushroom", "🍄"], ["portobello", "🍄"], ["shiitake", "🍄"],
  ["zucchini", "🥒"], ["courgette", "🥒"], ["aubergine", "🍆"],
  ["eggplant", "🍆"], ["asparagus", "🌿"], ["celery", "🌿"],
  ["artichoke", "🌿"], ["cauliflower", "🥦"], ["beetroot", "🍠"],
  ["beet", "🍠"], ["radish", "🌶️"], ["turnip", "🥕"],
  ["pumpkin", "🎃"], ["butternut squash", "🎃"], ["squash", "🎃"],
  // Fruits
  ["lemon", "🍋"], ["lime", "🍋"], ["orange", "🍊"],
  ["grapefruit", "🍊"], ["strawberry", "🍓"], ["raspberry", "🍓"],
  ["blueberry", "🫐"], ["blackberry", "🍇"], ["grape", "🍇"],
  ["mango", "🥭"], ["pineapple", "🍍"], ["coconut", "🥥"],
  ["banana", "🍌"], ["apple", "🍎"], ["pear", "🍐"],
  ["peach", "🍑"], ["apricot", "🍑"], ["plum", "🍑"],
  ["cherry", "🍒"], ["watermelon", "🍉"], ["melon", "🍈"],
  // Grains & Carbs
  ["spaghetti", "🍝"], ["tagliatelle", "🍝"], ["fettuccine", "🍝"],
  ["lasagna", "🍝"], ["penne", "🍝"], ["rigatoni", "🍝"],
  ["pasta", "🍝"], ["noodle", "🍜"], ["ramen", "🍜"],
  ["rice", "🍚"], ["sushi rice", "🍚"], ["basmati", "🍚"],
  ["quinoa", "🌾"], ["oats", "🌾"], ["barley", "🌾"],
  ["bread", "🍞"], ["sourdough", "🍞"], ["baguette", "🥖"],
  ["tortilla", "🫓"], ["pita", "🫓"], ["naan", "🫓"],
  ["cracker", "🫓"], ["flour", "🌾"], ["bread flour", "🌾"],
  ["semolina", "🌾"], ["cornmeal", "🌽"],
  // Legumes
  ["black bean", "🫘"], ["kidney bean", "🫘"], ["chickpea", "🫘"],
  ["lentil", "🫘"], ["white bean", "🫘"], ["pinto bean", "🫘"],
  ["bean", "🫘"], ["tofu", "🫘"], ["tempeh", "🫘"],
  // Nuts & Seeds
  ["almond", "🥜"], ["walnut", "🥜"], ["pecan", "🥜"],
  ["cashew", "🥜"], ["pistachio", "🥜"], ["macadamia", "🥜"],
  ["peanut", "🥜"], ["peanut butter", "🥜"],
  ["sesame", "🌰"], ["chia", "🌰"], ["flax", "🌰"],
  ["sunflower seed", "🌻"], ["pine nut", "🌰"], ["nut", "🥜"],
  // Oils, Fats, Condiments
  ["olive oil", "🫒"], ["oil", "🫒"],
  ["soy sauce", "🫙"], ["fish sauce", "🫙"], ["oyster sauce", "🫙"],
  ["worcestershire", "🫙"], ["hot sauce", "🫙"], ["sriracha", "🌶️"],
  ["ketchup", "🍅"], ["mustard", "🫙"], ["mayonnaise", "🫙"],
  ["vinegar", "🫙"], ["balsamic", "🫙"],
  ["tahini", "🫙"], ["miso", "🫙"],
  ["stock", "🫙"], ["broth", "🫙"],
  ["honey", "🍯"], ["maple syrup", "🍯"],
  // Baking
  ["sugar", "🍬"], ["brown sugar", "🍬"], ["icing sugar", "🍬"],
  ["vanilla", "🌿"], ["cinnamon", "🌿"], ["cardamom", "🌿"],
  ["nutmeg", "🌿"], ["clove", "🌿"], ["star anise", "🌿"],
  ["baking powder", "🧁"], ["baking soda", "🧁"],
  ["yeast", "🧁"], ["chocolate", "🍫"], ["cocoa", "🍫"],
  ["cream of tartar", "🧁"],
  // Herbs & Spices
  ["basil", "🌿"], ["oregano", "🌿"], ["thyme", "🌿"],
  ["rosemary", "🌿"], ["sage", "🌿"], ["dill", "🌿"],
  ["cilantro", "🌿"], ["coriander", "🌿"], ["parsley", "🌿"],
  ["mint", "🌿"], ["chive", "🌿"], ["tarragon", "🌿"],
  ["cumin", "🌶️"], ["paprika", "🌶️"], ["turmeric", "🌿"],
  ["curry", "🌶️"], ["garam masala", "🌶️"], ["allspice", "🌿"],
  ["bay leaf", "🌿"], ["saffron", "🌿"], ["salt", "🧂"],
  ["black pepper", "🧂"], ["white pepper", "🧂"], ["pepper", "🧂"],
  // Beverages / Liquids
  ["water", "💧"], ["sparkling water", "💧"],
  ["coffee", "☕"], ["espresso", "☕"],
  ["tea", "🍵"], ["green tea", "🍵"],
  ["wine", "🍷"], ["white wine", "🍾"], ["red wine", "🍷"],
  ["beer", "🍺"], ["vodka", "🍸"], ["rum", "🍸"],
  ["coca-cola", "🥤"], ["coke", "🥤"], ["sprite", "🥤"],
  ["dr pepper", "🥤"], ["lemonade", "🍋"],
  ["juice", "🍹"], ["orange juice", "🍊"],
  ["coconut cream", "🥥"], ["coconut milk", "🥥"],
  ["syrup", "🍯"],
  // Category fallbacks (category name -> emoji)
  ["vegetable", "🥦"], ["fruit", "🍎"], ["meat", "🥩"],
  ["dairy", "🧀"], ["grain", "🌾"], ["spice", "🌿"],
  ["herb", "🌿"], ["seafood", "🐟"], ["dessert", "🍰"],
];

export function getIngredientEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of INGREDIENT_EMOJI_MAP) {
    if (lower.includes(key)) return emoji;
  }
  return "🍽️";
}
