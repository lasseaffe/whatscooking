/**
 * seed-fusion-recipes.mjs
 * Seeds 20 fusion recipes into the `recipes` table.
 * Safe to re-run — upserts on title.
 *
 * Run from project root:
 *   node scripts/seed-fusion-recipes.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    console.error("Could not read .env.local — make sure it exists at project root.");
    process.exit(1);
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FUSION_RECIPES = [
  {
    title: "Korean BBQ Tacos",
    cuisine_type: "Korean-Mexican",
    description: "Bulgogi-marinated beef short ribs with kimchi slaw, gochujang crema, and pickled daikon in warm corn tortillas.",
    servings: 4, prep_time_minutes: 25, cook_time_minutes: 15,
    calories: 520, protein_g: 34, carbs_g: 42, fat_g: 18,
    dietary_tags: ["gluten-free"], difficulty_level: "easy",
    ingredients: [
      { name: "beef short rib strips", amount: 600, unit: "g" },
      { name: "soy sauce", amount: 60, unit: "ml" },
      { name: "sesame oil", amount: 2, unit: "tbsp" },
      { name: "gochujang", amount: 2, unit: "tbsp" },
      { name: "corn tortillas", amount: 12, unit: "" },
      { name: "kimchi", amount: 200, unit: "g" },
      { name: "daikon radish", amount: 150, unit: "g" },
      { name: "sour cream", amount: 120, unit: "ml" },
      { name: "lime", amount: 2, unit: "" },
      { name: "coriander", amount: 1, unit: "handful" },
    ],
    instructions: [
      "Blend soy sauce, sesame oil, garlic, ginger, and 1 tbsp gochujang. Marinate beef at least 2 hours.",
      "Pickle julienned daikon in rice vinegar, salt, and sugar for 30 minutes.",
      "Mix sour cream with remaining gochujang and lime juice for crema.",
      "Grill beef strips over high heat 2–3 minutes per side until charred.",
      "Warm tortillas. Build tacos: beef, kimchi slaw, pickled daikon, crema, coriander, lime.",
    ],
  },
  {
    title: "Miso Butter Pasta",
    cuisine_type: "Japanese-Italian",
    description: "White miso and browned butter create an irresistible umami sauce for al-dente spaghetti.",
    servings: 2, prep_time_minutes: 5, cook_time_minutes: 15,
    calories: 610, protein_g: 18, carbs_g: 82, fat_g: 22,
    dietary_tags: ["vegetarian"], difficulty_level: "easy",
    ingredients: [
      { name: "spaghetti", amount: 200, unit: "g" },
      { name: "unsalted butter", amount: 60, unit: "g" },
      { name: "white miso paste", amount: 2, unit: "tbsp" },
      { name: "garlic cloves", amount: 2, unit: "" },
      { name: "parmesan", amount: 40, unit: "g" },
      { name: "lemon", amount: 1, unit: "" },
      { name: "chives", amount: 10, unit: "g" },
    ],
    instructions: [
      "Cook spaghetti until al dente. Reserve 150ml pasta water before draining.",
      "Brown butter over medium heat until golden and nutty, about 4 minutes.",
      "Off heat, add minced garlic. Whisk in miso with a splash of pasta water.",
      "Toss pasta in the sauce, adding pasta water to emulsify.",
      "Finish with parmesan, lemon juice, black pepper, and chives.",
    ],
  },
  {
    title: "Thai Green Curry Shakshuka",
    cuisine_type: "Thai-Middle Eastern",
    description: "Eggs poached in a fragrant Thai green curry coconut base — lemongrass, kaffir lime, and fresh basil. Serve with warm flatbread.",
    servings: 4, prep_time_minutes: 10, cook_time_minutes: 20,
    calories: 390, protein_g: 18, carbs_g: 22, fat_g: 26,
    dietary_tags: ["vegetarian", "gluten-free"], difficulty_level: "easy",
    ingredients: [
      { name: "eggs", amount: 8, unit: "" },
      { name: "coconut milk", amount: 400, unit: "ml" },
      { name: "Thai green curry paste", amount: 3, unit: "tbsp" },
      { name: "kaffir lime leaves", amount: 4, unit: "" },
      { name: "lemongrass stalk", amount: 1, unit: "" },
      { name: "cherry tomatoes", amount: 200, unit: "g" },
      { name: "baby spinach", amount: 80, unit: "g" },
      { name: "fish sauce", amount: 1, unit: "tbsp" },
      { name: "Thai basil", amount: 1, unit: "handful" },
      { name: "flatbread", amount: 4, unit: "" },
    ],
    instructions: [
      "Fry curry paste 2 minutes until fragrant.",
      "Add coconut milk, lemongrass, lime leaves, fish sauce. Simmer 5 minutes.",
      "Add cherry tomatoes and cook 3 minutes until softened.",
      "Create wells and crack in eggs. Cover and simmer 6–8 minutes until whites are set.",
      "Stir in spinach, scatter Thai basil, serve with flatbread.",
    ],
  },
  {
    title: "Jerk Chicken Ramen",
    cuisine_type: "Jamaican-Japanese",
    description: "Smoky jerk chicken thighs over a clear ginger broth with ramen noodles, pickled scotch bonnet, and scallion oil.",
    servings: 2, prep_time_minutes: 20, cook_time_minutes: 40,
    calories: 620, protein_g: 48, carbs_g: 54, fat_g: 18,
    dietary_tags: [], difficulty_level: "medium",
    ingredients: [
      { name: "chicken thighs, bone-in", amount: 4, unit: "" },
      { name: "jerk seasoning paste", amount: 3, unit: "tbsp" },
      { name: "chicken stock", amount: 1.2, unit: "litres" },
      { name: "fresh ginger", amount: 30, unit: "g" },
      { name: "ramen noodles", amount: 200, unit: "g" },
      { name: "scotch bonnet", amount: 1, unit: "" },
      { name: "spring onions", amount: 4, unit: "" },
      { name: "soy sauce", amount: 2, unit: "tbsp" },
      { name: "lime", amount: 1, unit: "" },
    ],
    instructions: [
      "Coat chicken in jerk paste and marinate 2 hours minimum.",
      "Grill or roast at 200°C 30–35 minutes until charred. Slice off the bone.",
      "Simmer stock with ginger and garlic 20 minutes. Season with soy sauce.",
      "Pickle sliced scotch bonnet in rice vinegar with allspice.",
      "Pour very hot oil over sliced spring onions for scallion oil. Add lime juice.",
      "Cook noodles, divide into bowls. Ladle broth, top with chicken, pickled scotch bonnet, scallion oil.",
    ],
  },
  {
    title: "Peking Duck Quesadillas",
    cuisine_type: "Chinese-Mexican",
    description: "Crispy confit duck with hoisin, cucumber, and spring onion in flour tortillas, pan-fried until golden.",
    servings: 4, prep_time_minutes: 10, cook_time_minutes: 15,
    calories: 490, protein_g: 28, carbs_g: 38, fat_g: 22,
    dietary_tags: [], difficulty_level: "easy",
    ingredients: [
      { name: "cooked duck confit or rotisserie duck", amount: 400, unit: "g" },
      { name: "large flour tortillas", amount: 4, unit: "" },
      { name: "hoisin sauce", amount: 4, unit: "tbsp" },
      { name: "cucumber", amount: 1, unit: "" },
      { name: "spring onions", amount: 4, unit: "" },
      { name: "shredded mozzarella", amount: 120, unit: "g" },
    ],
    instructions: [
      "Shred duck and crisp in a hot dry pan 3–4 minutes.",
      "Spread hoisin over half a tortilla. Layer with duck, cucumber, spring onion, mozzarella.",
      "Fold and cook in an oiled pan 2–3 minutes per side until golden.",
      "Slice into wedges. Serve with extra hoisin.",
    ],
  },
  {
    title: "Tandoori Cauliflower Tacos",
    cuisine_type: "Indian-Mexican",
    description: "Yoghurt-tandoori roasted cauliflower in tortillas with mango salsa, cucumber raita, and crispy chickpeas.",
    servings: 4, prep_time_minutes: 20, cook_time_minutes: 30,
    calories: 420, protein_g: 16, carbs_g: 58, fat_g: 12,
    dietary_tags: ["vegetarian", "vegan"], difficulty_level: "easy",
    ingredients: [
      { name: "cauliflower", amount: 1, unit: "head" },
      { name: "Greek yoghurt", amount: 150, unit: "g" },
      { name: "tandoori masala", amount: 2, unit: "tbsp" },
      { name: "corn tortillas", amount: 12, unit: "" },
      { name: "canned chickpeas", amount: 400, unit: "g" },
      { name: "mango", amount: 1, unit: "" },
      { name: "red onion", amount: 0.5, unit: "" },
      { name: "cucumber", amount: 0.5, unit: "" },
      { name: "coriander", amount: 1, unit: "handful" },
      { name: "lime", amount: 2, unit: "" },
    ],
    instructions: [
      "Toss cauliflower florets in yoghurt, tandoori masala, garlic, salt. Roast at 220°C 25–30 minutes.",
      "Toss chickpeas with oil and cumin. Roast alongside cauliflower until crisp.",
      "Dice mango, red onion, coriander, lime juice for salsa.",
      "Grate cucumber, mix with remaining yoghurt and cumin for raita.",
      "Fill warm tortillas with cauliflower, chickpeas, mango salsa, raita.",
    ],
  },
  {
    title: "Sichuan Beef Empanadas",
    cuisine_type: "Chinese-South American",
    description: "Mapo tofu-inspired minced beef with doubanjiang and Sichuan peppercorns inside flaky empanada pastry.",
    servings: 6, prep_time_minutes: 45, cook_time_minutes: 25,
    calories: 480, protein_g: 24, carbs_g: 42, fat_g: 22,
    dietary_tags: [], difficulty_level: "medium",
    ingredients: [
      { name: "empanada discs", amount: 12, unit: "" },
      { name: "minced beef", amount: 400, unit: "g" },
      { name: "silken tofu", amount: 200, unit: "g" },
      { name: "doubanjiang", amount: 2, unit: "tbsp" },
      { name: "soy sauce", amount: 2, unit: "tbsp" },
      { name: "Sichuan peppercorns", amount: 1, unit: "tsp" },
      { name: "garlic", amount: 4, unit: "cloves" },
      { name: "spring onions", amount: 3, unit: "" },
      { name: "egg", amount: 1, unit: "" },
    ],
    instructions: [
      "Toast and crush Sichuan peppercorns.",
      "Brown minced beef. Add doubanjiang, garlic, ginger — cook 2 minutes.",
      "Add soy sauce, peppercorns, crumbled tofu. Stir gently. Cool completely.",
      "Fill discs with 2 tbsp filling, fold, crimp edges.",
      "Brush with beaten egg. Bake at 200°C for 20–25 minutes until golden.",
    ],
  },
  {
    title: "Pho-Spiced French Onion Soup",
    cuisine_type: "Vietnamese-French",
    description: "Classic French onion soup deepened with pho spices — star anise, cloves, coriander seed, charred ginger — and finished with fish sauce and a melted gruyere crouton.",
    servings: 4, prep_time_minutes: 15, cook_time_minutes: 75,
    calories: 440, protein_g: 18, carbs_g: 36, fat_g: 22,
    dietary_tags: [], difficulty_level: "medium",
    ingredients: [
      { name: "large white onions", amount: 6, unit: "" },
      { name: "beef bone broth", amount: 1.5, unit: "litres" },
      { name: "star anise", amount: 3, unit: "" },
      { name: "whole cloves", amount: 4, unit: "" },
      { name: "fresh ginger", amount: 40, unit: "g" },
      { name: "dry sherry", amount: 100, unit: "ml" },
      { name: "fish sauce", amount: 1, unit: "tbsp" },
      { name: "butter", amount: 40, unit: "g" },
      { name: "baguette", amount: 1, unit: "" },
      { name: "gruyere", amount: 150, unit: "g" },
    ],
    instructions: [
      "Char ginger cut-side down in a dry pan 4 minutes.",
      "Toast star anise and cloves. Wrap in muslin.",
      "Caramelise sliced onions in butter over low heat 50–60 minutes.",
      "Deglaze with sherry. Add broth, ginger, spice sachet, fish sauce. Simmer 20 minutes.",
      "Ladle into oven-safe bowls. Top with baguette rounds and gruyere. Grill until bubbling.",
    ],
  },
  {
    title: "Harissa Lamb Dumplings",
    cuisine_type: "North African-Chinese",
    description: "Spiced lamb and pine nut filling in wonton wrappers, steamed then pan-fried, served with rose water harissa yoghurt.",
    servings: 4, prep_time_minutes: 45, cook_time_minutes: 15,
    calories: 460, protein_g: 28, carbs_g: 36, fat_g: 20,
    dietary_tags: [], difficulty_level: "medium",
    ingredients: [
      { name: "wonton wrappers", amount: 36, unit: "" },
      { name: "minced lamb", amount: 400, unit: "g" },
      { name: "harissa paste", amount: 2, unit: "tbsp" },
      { name: "pine nuts", amount: 40, unit: "g" },
      { name: "preserved lemon rind", amount: 1, unit: "tbsp" },
      { name: "cumin", amount: 1, unit: "tsp" },
      { name: "fresh mint", amount: 1, unit: "handful" },
      { name: "Greek yoghurt", amount: 200, unit: "g" },
      { name: "rose water", amount: 1, unit: "tsp" },
    ],
    instructions: [
      "Toast and chop pine nuts.",
      "Mix lamb, harissa, pine nuts, preserved lemon, cumin, mint. Fill wrappers, seal into half-moons.",
      "Steam dumplings 6 minutes. Then pan-fry flat-side down until golden.",
      "Mix yoghurt with garlic, rose water, and a swirl of harissa.",
      "Serve immediately with dipping sauce and fresh mint.",
    ],
  },
  {
    title: "Coconut Dal Gnocchi",
    cuisine_type: "Indian-Italian",
    description: "Store-bought gnocchi tossed in a creamy red lentil coconut dal, finished with crispy curry leaf oil and mustard seeds.",
    servings: 4, prep_time_minutes: 20, cook_time_minutes: 35,
    calories: 540, protein_g: 20, carbs_g: 74, fat_g: 16,
    dietary_tags: ["vegetarian", "vegan", "gluten-free"], difficulty_level: "medium",
    ingredients: [
      { name: "gnocchi", amount: 500, unit: "g" },
      { name: "red lentils", amount: 150, unit: "g" },
      { name: "coconut milk", amount: 400, unit: "ml" },
      { name: "vegetable stock", amount: 400, unit: "ml" },
      { name: "turmeric", amount: 1, unit: "tsp" },
      { name: "garam masala", amount: 1, unit: "tsp" },
      { name: "tomatoes", amount: 2, unit: "" },
      { name: "curry leaves", amount: 12, unit: "" },
      { name: "mustard seeds", amount: 1, unit: "tsp" },
      { name: "coconut oil", amount: 3, unit: "tbsp" },
    ],
    instructions: [
      "Simmer lentils in coconut milk, stock, turmeric, garlic, ginger, tomatoes — 20 minutes.",
      "Blend half the dal smooth. Season with garam masala and salt.",
      "Cook gnocchi in salted water until floating. Drain.",
      "Heat coconut oil until smoking. Fry mustard seeds and curry leaves until crisp.",
      "Toss gnocchi in dal sauce. Top with crispy curry leaf oil.",
    ],
  },
  {
    title: "Mole Negro Short Rib Bao",
    cuisine_type: "Mexican-Chinese",
    description: "Slow-braised short ribs glazed in a complex chile-dark chocolate mole stuffed into fluffy steamed bao buns with pickled red cabbage.",
    servings: 4, prep_time_minutes: 30, cook_time_minutes: 210,
    calories: 660, protein_g: 44, carbs_g: 56, fat_g: 24,
    dietary_tags: [], difficulty_level: "hard",
    ingredients: [
      { name: "beef short ribs", amount: 1.2, unit: "kg" },
      { name: "steamed bao buns", amount: 8, unit: "" },
      { name: "dried ancho chiles", amount: 4, unit: "" },
      { name: "dark chocolate (70%)", amount: 30, unit: "g" },
      { name: "beef stock", amount: 500, unit: "ml" },
      { name: "tomatoes", amount: 3, unit: "" },
      { name: "red cabbage", amount: 200, unit: "g" },
      { name: "rice vinegar", amount: 4, unit: "tbsp" },
      { name: "sesame seeds", amount: 1, unit: "tbsp" },
    ],
    instructions: [
      "Toast and soak chiles. Blend with tomatoes, onion, garlic, cumin, paprika.",
      "Brown ribs. Cook mole base 5 minutes. Add stock and dark chocolate.",
      "Braise at 160°C for 3 hours. Shred meat. Reduce braising liquid for glaze.",
      "Pickle red cabbage in rice vinegar, salt, sugar.",
      "Steam bao. Fill with glazed rib, pickled cabbage, sesame seeds.",
    ],
  },
  {
    title: "Kimchi Fried Rice Arancini",
    cuisine_type: "Korean-Italian",
    description: "Kimchi fried rice balls stuffed with mozzarella, panko-coated and fried golden. Served with gochujang aioli.",
    servings: 4, prep_time_minutes: 30, cook_time_minutes: 20,
    calories: 510, protein_g: 18, carbs_g: 62, fat_g: 18,
    dietary_tags: ["vegetarian"], difficulty_level: "medium",
    ingredients: [
      { name: "cooked cold rice", amount: 400, unit: "g" },
      { name: "kimchi", amount: 150, unit: "g" },
      { name: "mozzarella", amount: 120, unit: "g" },
      { name: "eggs", amount: 2, unit: "" },
      { name: "panko breadcrumbs", amount: 150, unit: "g" },
      { name: "plain flour", amount: 50, unit: "g" },
      { name: "mayonnaise", amount: 100, unit: "g" },
      { name: "gochujang", amount: 1, unit: "tbsp" },
    ],
    instructions: [
      "Stir-fry kimchi in sesame oil, add rice and soy sauce. Cool completely.",
      "Shape into 12 balls with a mozzarella cube inside each.",
      "Coat: flour, egg, panko. Deep-fry at 175°C for 3–4 minutes.",
      "Mix mayonnaise and gochujang for dipping sauce. Serve immediately.",
    ],
  },
  {
    title: "Rendang Shepherd's Pie",
    cuisine_type: "Indonesian-British",
    description: "Slow-cooked beef rendang topped with lemongrass-scented mash and baked until golden. Deeply spiced comfort food.",
    servings: 6, prep_time_minutes: 30, cook_time_minutes: 150,
    calories: 620, protein_g: 38, carbs_g: 52, fat_g: 26,
    dietary_tags: ["gluten-free"], difficulty_level: "hard",
    ingredients: [
      { name: "beef chuck, diced", amount: 800, unit: "g" },
      { name: "coconut milk", amount: 400, unit: "ml" },
      { name: "lemongrass stalks", amount: 3, unit: "" },
      { name: "kaffir lime leaves", amount: 6, unit: "" },
      { name: "dried red chillies", amount: 6, unit: "" },
      { name: "shallots", amount: 5, unit: "" },
      { name: "turmeric", amount: 1, unit: "tsp" },
      { name: "floury potatoes", amount: 1, unit: "kg" },
      { name: "butter", amount: 60, unit: "g" },
      { name: "whole milk", amount: 100, unit: "ml" },
    ],
    instructions: [
      "Blend shallots, garlic, galangal, chillies, turmeric into a paste.",
      "Fry paste, add beef, brown well. Add coconut milk, lemongrass, lime leaves.",
      "Simmer uncovered 90–120 minutes until coconut milk evaporates and beef is caramelised.",
      "Boil and mash potatoes with butter, milk, and minced inner lemongrass.",
      "Layer rendang in a baking dish, top with mash. Bake at 200°C for 25 minutes.",
    ],
  },
  {
    title: "Banh Mi Grilled Cheese",
    cuisine_type: "Vietnamese-American",
    description: "Pate, pickled daikon and carrot, jalapeno, and fresh coriander sealed inside a buttery grilled cheese sandwich.",
    servings: 2, prep_time_minutes: 15, cook_time_minutes: 8,
    calories: 560, protein_g: 24, carbs_g: 38, fat_g: 30,
    dietary_tags: [], difficulty_level: "easy",
    ingredients: [
      { name: "sourdough bread", amount: 4, unit: "slices" },
      { name: "chicken liver pate", amount: 60, unit: "g" },
      { name: "gruyere", amount: 80, unit: "g" },
      { name: "daikon radish", amount: 80, unit: "g" },
      { name: "carrot", amount: 1, unit: "" },
      { name: "jalapeno", amount: 1, unit: "" },
      { name: "fresh coriander", amount: 1, unit: "handful" },
      { name: "sriracha mayo", amount: 2, unit: "tbsp" },
      { name: "butter", amount: 30, unit: "g" },
    ],
    instructions: [
      "Pickle julienned daikon and carrot in rice vinegar and sugar 10 minutes.",
      "Build sandwich: sriracha mayo, cheese, pate, pickled veg, jalapeno, coriander.",
      "Butter outsides. Grill in a pan 3–4 minutes per side until golden and melted.",
    ],
  },
  {
    title: "Mango Lassi Panna Cotta",
    cuisine_type: "Indian-Italian",
    description: "Cardamom-scented yoghurt panna cotta set over a chilled mango coulis with rose water and crushed pistachios.",
    servings: 6, prep_time_minutes: 20, cook_time_minutes: 5,
    calories: 280, protein_g: 8, carbs_g: 32, fat_g: 12,
    dietary_tags: ["vegetarian", "gluten-free"], difficulty_level: "easy",
    ingredients: [
      { name: "Greek yoghurt", amount: 400, unit: "g" },
      { name: "double cream", amount: 200, unit: "ml" },
      { name: "caster sugar", amount: 60, unit: "g" },
      { name: "gelatine sheets", amount: 3, unit: "" },
      { name: "cardamom pods", amount: 6, unit: "" },
      { name: "rose water", amount: 1, unit: "tsp" },
      { name: "ripe mangoes", amount: 2, unit: "" },
      { name: "lime", amount: 1, unit: "" },
      { name: "pistachios", amount: 30, unit: "g" },
    ],
    instructions: [
      "Heat cream with crushed cardamom and sugar until steaming. Dissolve soaked gelatine in warm cream.",
      "Cool, whisk in yoghurt and rose water. Pour into glasses. Refrigerate 4+ hours.",
      "Blend mango with lime juice. Chill separately.",
      "To serve, spoon mango coulis over set panna cotta. Scatter crushed pistachios.",
    ],
  },
  {
    title: "Gochujang Bolognese",
    cuisine_type: "Korean-Italian",
    description: "Slow-simmered Italian ragu with gochujang and doenjang replacing parmesan rind for fermented, spicy umami depth. Serve over tagliatelle.",
    servings: 4, prep_time_minutes: 15, cook_time_minutes: 90,
    calories: 580, protein_g: 36, carbs_g: 64, fat_g: 18,
    dietary_tags: [], difficulty_level: "medium",
    ingredients: [
      { name: "minced beef", amount: 400, unit: "g" },
      { name: "minced pork", amount: 200, unit: "g" },
      { name: "tagliatelle", amount: 400, unit: "g" },
      { name: "gochujang", amount: 2, unit: "tbsp" },
      { name: "doenjang (Korean miso)", amount: 1, unit: "tbsp" },
      { name: "carrot", amount: 1, unit: "" },
      { name: "celery stalks", amount: 2, unit: "" },
      { name: "onion", amount: 1, unit: "" },
      { name: "canned tomatoes", amount: 400, unit: "g" },
      { name: "red wine", amount: 150, unit: "ml" },
      { name: "whole milk", amount: 100, unit: "ml" },
    ],
    instructions: [
      "Soften diced carrot, celery, and onion in oil 10 minutes.",
      "Brown minced meats thoroughly.",
      "Add gochujang and doenjang, cook 2 minutes.",
      "Add wine and reduce. Add tomatoes and simmer 60–90 minutes on lowest heat.",
      "Stir in milk for the final 15 minutes. Toss with cooked tagliatelle.",
    ],
  },
  {
    title: "Zaatar Flatbread Pizza",
    cuisine_type: "Lebanese-Italian",
    description: "Crisp flatbread with zaatar-olive oil paste, labneh, roasted cherry tomatoes, Kalamata olives, and fresh mint.",
    servings: 2, prep_time_minutes: 10, cook_time_minutes: 12,
    calories: 450, protein_g: 16, carbs_g: 48, fat_g: 20,
    dietary_tags: ["vegetarian"], difficulty_level: "easy",
    ingredients: [
      { name: "flatbreads", amount: 2, unit: "" },
      { name: "zaatar", amount: 3, unit: "tbsp" },
      { name: "olive oil", amount: 4, unit: "tbsp" },
      { name: "labneh", amount: 150, unit: "g" },
      { name: "cherry tomatoes", amount: 200, unit: "g" },
      { name: "Kalamata olives", amount: 60, unit: "g" },
      { name: "fresh mint", amount: 1, unit: "handful" },
      { name: "sumac", amount: 1, unit: "tsp" },
      { name: "lemon", amount: 1, unit: "" },
    ],
    instructions: [
      "Mix zaatar with olive oil. Spread over flatbreads with halved cherry tomatoes.",
      "Bake at 220°C for 10–12 minutes until edges are crisp and tomatoes are blistered.",
      "Dollop labneh over hot flatbreads. Add olives, mint, sumac, and lemon.",
    ],
  },
  {
    title: "Jollof Rice Risotto",
    cuisine_type: "West African-Italian",
    description: "Arborio rice slow-stirred into a smoky, deeply spiced West African pepper and tomato broth for a brilliantly orange vegan risotto.",
    servings: 4, prep_time_minutes: 15, cook_time_minutes: 40,
    calories: 490, protein_g: 12, carbs_g: 82, fat_g: 10,
    dietary_tags: ["vegetarian", "vegan", "gluten-free"], difficulty_level: "medium",
    ingredients: [
      { name: "arborio rice", amount: 300, unit: "g" },
      { name: "plum tomatoes", amount: 400, unit: "g" },
      { name: "red bell peppers", amount: 2, unit: "" },
      { name: "scotch bonnet", amount: 1, unit: "" },
      { name: "vegetable stock", amount: 1.2, unit: "litres" },
      { name: "red onion", amount: 1, unit: "" },
      { name: "smoked paprika", amount: 1, unit: "tsp" },
      { name: "thyme", amount: 4, unit: "sprigs" },
    ],
    instructions: [
      "Blend tomatoes, red peppers, and scotch bonnet.",
      "Fry onion, add tomato puree and blended pepper. Cook 15 minutes until darkened.",
      "Add arborio rice, toast 2 minutes.",
      "Add warm stock one ladle at a time with thyme, stirring constantly — 20 minutes.",
      "Season generously. Rest 2 minutes before serving.",
    ],
  },
  {
    title: "Kimchi Croque Madame",
    cuisine_type: "Korean-French",
    description: "Sourdough with kimchi, gochujang bechamel, ham, and gruyere baked until golden, topped with a fried egg.",
    servings: 2, prep_time_minutes: 15, cook_time_minutes: 20,
    calories: 650, protein_g: 32, carbs_g: 38, fat_g: 36,
    dietary_tags: [], difficulty_level: "medium",
    ingredients: [
      { name: "sourdough bread", amount: 4, unit: "thick slices" },
      { name: "kimchi, squeezed dry", amount: 100, unit: "g" },
      { name: "cooked ham", amount: 120, unit: "g" },
      { name: "gruyere", amount: 120, unit: "g" },
      { name: "eggs", amount: 2, unit: "" },
      { name: "butter", amount: 40, unit: "g" },
      { name: "plain flour", amount: 20, unit: "g" },
      { name: "whole milk", amount: 200, unit: "ml" },
      { name: "gochujang", amount: 1, unit: "tbsp" },
      { name: "dijon mustard", amount: 1, unit: "tsp" },
    ],
    instructions: [
      "Make bechamel: melt butter, add flour 1 minute, whisk in milk. Stir in gochujang and dijon.",
      "Spread bechamel on two slices. Layer ham, kimchi, half the gruyere.",
      "Top with remaining bread. Spread bechamel on tops and scatter remaining gruyere.",
      "Bake at 200°C for 15 minutes until golden.",
      "Top each sandwich with a fried egg. Serve immediately.",
    ],
  },
  {
    title: "Matcha Tiramisu",
    cuisine_type: "Japanese-Italian",
    description: "Classic tiramisu with ceremonial matcha instead of espresso, white chocolate mascarpone cream, and a thick matcha dust finish.",
    servings: 8, prep_time_minutes: 30, cook_time_minutes: 0,
    calories: 390, protein_g: 8, carbs_g: 42, fat_g: 20,
    dietary_tags: ["vegetarian"], difficulty_level: "easy",
    ingredients: [
      { name: "savoiardi ladyfingers", amount: 24, unit: "" },
      { name: "mascarpone", amount: 500, unit: "g" },
      { name: "eggs, separated", amount: 4, unit: "" },
      { name: "caster sugar", amount: 100, unit: "g" },
      { name: "ceremonial matcha powder", amount: 3, unit: "tbsp" },
      { name: "hot water", amount: 300, unit: "ml" },
      { name: "white chocolate", amount: 80, unit: "g" },
      { name: "double cream", amount: 100, unit: "ml" },
    ],
    instructions: [
      "Dissolve matcha in hot water with 1 tbsp sugar. Cool completely.",
      "Melt white chocolate. Beat yolks and remaining sugar until pale. Fold in mascarpone and chocolate.",
      "Whip egg whites to stiff peaks. Fold into mascarpone mixture.",
      "Dip ladyfingers briefly in matcha syrup (2 seconds). Layer in dish with mascarpone cream. Repeat.",
      "Refrigerate overnight. Dust generously with sifted matcha before serving.",
    ],
  },
];

async function main() {
  console.log(`Seeding ${FUSION_RECIPES.length} fusion recipes...`);

  // Fetch existing titles so we can skip duplicates (recipes.title has no unique constraint)
  const titles = FUSION_RECIPES.map((r) => r.title);
  const { data: existing, error: fetchErr } = await supabase
    .from("recipes")
    .select("title")
    .in("title", titles);

  if (fetchErr) {
    console.error("Failed to check existing recipes:", fetchErr.message);
    process.exit(1);
  }

  const existingTitles = new Set((existing ?? []).map((r) => r.title));
  const newRecipes = FUSION_RECIPES.filter((r) => !existingTitles.has(r.title));

  if (newRecipes.length === 0) {
    console.log("All fusion recipes already exist — nothing to insert.");
    return;
  }

  console.log(`Skipping ${existingTitles.size} existing, inserting ${newRecipes.length} new...`);

  const rows = newRecipes.map((r) => ({
    ...r,
    source: "curated",
    // ingredients is jsonb — pass as plain object; instructions is text[] — pass as plain array
    ingredients: r.ingredients,
    instructions: r.instructions,
  }));

  const { data, error } = await supabase
    .from("recipes")
    .insert(rows)
    .select("id, title");

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(`Done: ${data.length} fusion recipes seeded.`);
  data.forEach((r) => console.log(`  - ${r.title} (${r.id})`));
}

main();
