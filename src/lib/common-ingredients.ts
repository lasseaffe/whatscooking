// Common pantry ingredients for autocomplete (English)
export const COMMON_INGREDIENTS = [
  // Vegetables
  "Tomatoes","Cherry tomatoes","Onion","Red onion","Garlic","Ginger",
  "Carrot","Celery","Bell pepper","Red pepper","Green pepper","Chilli",
  "Jalapeño","Broccoli","Cauliflower","Spinach","Kale","Arugula",
  "Lettuce","Cucumber","Zucchini","Aubergine / eggplant","Mushrooms",
  "Portobello mushrooms","Sweetcorn","Peas","Green beans","Asparagus",
  "Avocado","Potato","Sweet potato","Spring onions / scallions","Leek",
  "Pumpkin","Butternut squash","Beetroot","Radish","Artichoke",
  // Fruits
  "Lemon","Lime","Orange","Grapefruit","Apple","Pear","Banana",
  "Strawberries","Raspberries","Blueberries","Mango","Pineapple",
  "Coconut","Peach","Apricot","Grapes","Watermelon",
  // Proteins – Meat
  "Chicken breast","Chicken thighs","Ground beef","Beef steak","Pork chops",
  "Pork shoulder","Bacon","Ham","Sausages","Ground turkey","Lamb chops",
  // Seafood
  "Salmon fillets","Tuna","Shrimp / prawns","Cod","Tilapia",
  "Sardines","Mussels","Scallops",
  // Dairy & Eggs
  "Eggs","Whole milk","Butter","Heavy cream","Sour cream","Yogurt",
  "Cheddar cheese","Mozzarella","Parmesan","Feta cheese","Cream cheese",
  "Ricotta","Brie",
  // Grains & Pasta
  "Spaghetti","Penne","Rigatoni","Tagliatelle","Lasagna sheets",
  "White rice","Brown rice","Basmati rice","Quinoa","Oats","Couscous",
  "Bread flour","All-purpose flour","Whole wheat flour","Sourdough bread",
  "White bread","Tortillas","Pita bread",
  // Legumes
  "Black beans","Kidney beans","Chickpeas","Green lentils","Red lentils",
  "White beans","Pinto beans","Tofu","Tempeh",
  // Nuts & Seeds
  "Almonds","Walnuts","Cashews","Peanuts","Peanut butter","Sesame seeds",
  "Chia seeds","Flaxseeds","Pine nuts","Sunflower seeds",
  // Oils & Fats
  "Olive oil","Vegetable oil","Coconut oil","Butter","Ghee",
  // Condiments & Sauces
  "Soy sauce","Fish sauce","Oyster sauce","Hot sauce","Sriracha",
  "Ketchup","Mustard","Mayonnaise","Balsamic vinegar","Red wine vinegar",
  "Apple cider vinegar","Tahini","Miso paste","Honey","Maple syrup",
  "Worcestershire sauce","Tomato paste","Crushed tomatoes","Tomato passata",
  "Coconut milk","Coconut cream",
  // Baking
  "White sugar","Brown sugar","Powdered sugar","Vanilla extract",
  "Baking powder","Baking soda","Yeast","Dark chocolate","Cocoa powder",
  "Cinnamon","Cardamom","Nutmeg",
  // Herbs & Spices
  "Fresh basil","Fresh parsley","Fresh cilantro / coriander",
  "Fresh thyme","Fresh rosemary","Fresh dill","Fresh mint","Fresh chives",
  "Dried oregano","Dried thyme","Dried rosemary","Bay leaves","Cumin",
  "Smoked paprika","Turmeric","Curry powder","Garam masala","Chilli flakes",
  "Black pepper","White pepper","Salt","Flaky sea salt",
  // Stocks & Liquids
  "Chicken broth / stock","Vegetable broth","Beef broth","White wine",
  "Red wine","Beer",
  // Beverages
  "Whole milk","Oat milk","Almond milk","Orange juice","Apple juice",
  "Dr Pepper","Coca-Cola","Sprite","Lemonade","Green tea",
];

export function searchIngredients(query: string, limit = 8): string[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return COMMON_INGREDIENTS.filter((ing) =>
    ing.toLowerCase().includes(lower)
  ).slice(0, limit);
}
