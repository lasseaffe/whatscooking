export interface CultureItem {
  emoji: string;
  name: string;
  note: string;
}

export interface CultureBridge {
  dish: string;
  from: string;
  story: string;
  recipeMatch: string;
}

export interface CuisineInfo {
  slug: string;
  name: string;
  flag: string;
  region: string;
  tagline: string;
  description: string;
  keyDishes: string[];
  color: string; // accent
  bg: string;    // card background
  heroImage: string; // Unsplash photo URL for card header
  dbValues: string[]; // matches recipe.cuisine_type values
  // Cultural heritage fields (optional — enriched cuisines only)
  wikiTitle?: string;
  historyExtract?: string;
  historySource?: string;
  stapleIngredients?: CultureItem[];
  coreTechniques?: CultureItem[];
  culturalOccasions?: string[];
  crossCultureBridges?: CultureBridge[];
}

export const CUISINES: CuisineInfo[] = [
  // ── EUROPE ──────────────────────────────────────────────────
  {
    slug: "french",
    name: "French",
    flag: "FR",
    region: "Europe",
    tagline: "Butter, technique, and pure audacity.",
    description: "The mother cuisine of the Western world. France gave us beurre blanc, boeuf bourguignon, and the discipline to turn simple ingredients into serious art. The holy trinity of butter, wheat, and wine runs through every region — from Normandy's cream sauces to Burgundy's wine-braised classics. From rustic Provençal stews to Parisian pâtisserie — every bite has intention.",
    keyDishes: ["Coq au Vin", "Bouillabaisse", "Croissant", "Crème Brûlée", "Ratatouille"],
    color: "#2C4A8C",
    bg: "#EEF2FA",
    heroImage: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&q=80",
    dbValues: ["French", "french"],
    wikiTitle: "French cuisine",
    stapleIngredients: [
      { emoji: "🧈", name: "Butter", note: "Cultural core" },
      { emoji: "🍷", name: "Wine", note: "Identity symbol" },
      { emoji: "🧀", name: "Cheese", note: "400+ varieties" },
      { emoji: "🌿", name: "Herbes de Provence", note: "Southern staple" },
      { emoji: "🥖", name: "Bread", note: "Daily ritual" },
    ],
    coreTechniques: [
      { emoji: "🔥", name: "Confit", note: "Medieval preservation" },
      { emoji: "🥣", name: "Braise", note: "Low & slow" },
      { emoji: "🥞", name: "Laminate", note: "Pastry mastery" },
      { emoji: "🕯️", name: "Flambé", note: "Tableside drama" },
    ],
    culturalOccasions: [
      "☕ Morning café ritual",
      "🎭 Bastille Day feasts",
      "🍽️ Sunday family lunch",
      "💍 Wedding celebrations",
      "🥂 New Year's réveillon",
    ],
    crossCultureBridges: [
      {
        dish: "Croissant",
        from: "Ottoman Empire via Vienna",
        story: "When Ottoman forces lifted the Siege of Vienna in 1683, Viennese bakers shaped pastries into crescents to commemorate the victory. The 'kipferl' was adapted into the modern laminated croissant after Marie Antoinette brought the concept to Paris — where French bakers added butter-laminated dough to transform it into an icon.",
        recipeMatch: "croissant",
      },
      {
        dish: "Crème brûlée",
        from: "Catalonia",
        story: "Both France and Catalonia claim the caramelised sugar crust dessert — the Catalan 'crema catalana' predates the French recipe in documented records. The shared technique likely evolved in parallel along the Pyrenean border.",
        recipeMatch: "crème brûlée",
      },
      {
        dish: "Baguette",
        from: "Austria",
        story: "The long, thin bread shape was popularised in France partly through Viennese baking traditions brought by August Zang in the 1840s. Steam-injected ovens — an Austrian innovation — gave the baguette its characteristic crisp crust.",
        recipeMatch: "baguette",
      },
    ],
  },
  {
    slug: "italian",
    name: "Italian",
    flag: "IT",
    region: "Europe",
    tagline: "Five ingredients. Maximum soul.",
    description: "Italian cooking is the art of restraint. A perfect pasta needs nothing more than pasta water, cheese, and fat. From Naples' volcanic-kissed pizza to Bolognese slow-cooked since morning, Italy proves that simplicity is its own kind of genius.",
    keyDishes: ["Cacio e Pepe", "Risotto Milanese", "Osso Buco", "Tiramisu", "Pizza Napoletana"],
    color: "#C8371A",
    bg: "#FDF0EE",
    heroImage: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80",
    dbValues: ["Italian", "italian"],
    wikiTitle: "Italian cuisine",
    stapleIngredients: [
      { emoji: "🫒", name: "Olive oil", note: "Foundation of everything" },
      { emoji: "🍅", name: "Tomato", note: "Columbian exchange arrival" },
      { emoji: "🍝", name: "Pasta", note: "Arab-influenced dry pasta" },
      { emoji: "🧀", name: "Parmigiano", note: "Medieval monastery origin" },
    ],
    coreTechniques: [
      { emoji: "🌡️", name: "Al dente", note: "Precise pasta texture" },
      { emoji: "🥘", name: "Slow simmer", note: "Ragù patience" },
      { emoji: "🍚", name: "Risotto stir", note: "Starch-release method" },
      { emoji: "🔥", name: "Wood-fired", note: "Pizza Napoletana DOC" },
    ],
    culturalOccasions: [
      "🍝 Sunday family pranzo (lunch)",
      "🐟 Christmas Eve Feast of Seven Fishes",
      "🎭 Carnevale fritters & sweets",
      "🕊️ Easter colomba cake",
      "🍷 Harvest Vendemmia feasts",
    ],
    crossCultureBridges: [
      {
        dish: "Pasta",
        from: "Arab traders via Sicily",
        story: "Dry pasta was introduced to Sicily by Arab traders during the 9th–11th century Norman-Arab period. The Arabs brought dried durum wheat pasta ('itriyya') that could survive long sea voyages — Italy refined the shape vocabulary over centuries.",
        recipeMatch: "pasta",
      },
      {
        dish: "Pizza with tomato",
        from: "Americas (Columbian Exchange)",
        story: "The tomato arrived in Europe from Mesoamerica in the 16th century but was considered poisonous by many Europeans for 200 years. Neapolitan peasants adopted it as food first — the tomato-topped pizza was born in Naples in the 18th century.",
        recipeMatch: "pizza",
      },
      {
        dish: "Espresso",
        from: "Ottoman coffee culture",
        story: "Coffee arrived in Italy via Ottoman trade routes in the 16th century. Venice was the first European city with coffeehouses. Italian engineering later transformed the brewing method into the pressure-extracted espresso.",
        recipeMatch: "espresso",
      },
    ],
  },
  {
    slug: "spanish",
    name: "Spanish",
    flag: "ES",
    region: "Europe",
    tagline: "Tapas culture, saffron dreams, salt cod tradition.",
    description: "Spain's food is a celebration — small plates of jamón, tortilla, and patatas bravas shared over hours. Then comes the paella, the gazpacho, the churros at midnight. Diverse as its regions, bold as its people.",
    keyDishes: ["Paella", "Patatas Bravas", "Jamón Ibérico", "Gazpacho", "Churros"],
    color: "#C8881A",
    bg: "#FDF7EE",
    heroImage: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&q=80",
    dbValues: ["Spanish", "spanish"],
    wikiTitle: "Spanish cuisine",
    stapleIngredients: [
      { emoji: "🫒", name: "Olive oil", note: "Spain = world's largest producer" },
      { emoji: "🌶️", name: "Smoked paprika", note: "Pimentón — Moorish legacy" },
      { emoji: "🧄", name: "Garlic", note: "Sofrito foundation" },
      { emoji: "🍋", name: "Saffron", note: "Most expensive spice" },
      { emoji: "🥩", name: "Jamón ibérico", note: "36-month air-cured ritual" },
    ],
    coreTechniques: [
      { emoji: "🍳", name: "Socarrat (paella crust)", note: "Toasted rice base" },
      { emoji: "🍽️", name: "Tapas sharing culture", note: "Bar-to-bar hopping" },
      { emoji: "🏺", name: "Jamón curing", note: "Sierra microclimate aging" },
      { emoji: "🥣", name: "Cold emulsification", note: "Gazpacho technique" },
    ],
    culturalOccasions: [
      "🍅 La Tomatina tomato festival",
      "🐂 San Fermín running of the bulls feasts",
      "✝️ Holy Week torrijas (Spanish French toast)",
      "🎄 Christmas turrones & polvorones",
      "🍷 Harvest Vendimia wine festivals",
    ],
    crossCultureBridges: [
      {
        dish: "Tortilla española",
        from: "Americas (Columbian Exchange)",
        story: "The potato arrived in Spain from the Andes in the 16th century — considered poisonous for decades. Once adopted, the Spanish omelette (tortilla) became one of Spain's most iconic dishes. Without the Columbian exchange, Spain's national tapa would not exist.",
        recipeMatch: "tortilla española",
      },
      {
        dish: "Gazpacho",
        from: "Moorish Andalusia",
        story: "Gazpacho predates the tomato — the original Moorish version was a bread, olive oil, garlic, and vinegar paste. The Moors introduced sophisticated cold soup techniques to Andalusia during the 8th-15th century occupation. Tomatoes were added only after the Columbian exchange.",
        recipeMatch: "gazpacho",
      },
    ],
  },
  {
    slug: "portuguese",
    name: "Portuguese",
    flag: "PT",
    region: "Europe",
    tagline: "Salt cod, custard tarts, and Atlantic soul.",
    description: "Portugal's cuisine carries the weight of explorers who fed themselves across oceans. Bacalhau (salt cod) appears in 365 recipes. The pastel de nata is the world's most underrated pastry. Piri piri changed grilling forever.",
    keyDishes: ["Bacalhau à Brás", "Francesinha", "Pastel de Nata", "Caldo Verde", "Piri Piri Chicken"],
    color: "#1A6B3A",
    bg: "#EEF7F2",
    heroImage: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&q=80",
    dbValues: ["Portuguese", "portuguese"],
    wikiTitle: "Portuguese cuisine",
  },
  {
    slug: "greek",
    name: "Greek",
    flag: "GR",
    region: "Europe",
    tagline: "Mediterranean sunshine on a plate.",
    description: "Greek food is the original Mediterranean diet — olive oil, lemon, herbs, and fresh vegetables. A civilization that invented philosophy also perfected the slow-roasted lamb and the cold yogurt sauce. The herb-forward, fresh character of the cuisine emphasises seasonal produce, feta brine, and the holy trinity of olive oil, lemon, and oregano. Mezze is not just a meal — it's a way of life.",
    keyDishes: ["Moussaka", "Spanakopita", "Souvlaki", "Tzatziki", "Baklava"],
    color: "#1A4A8C",
    bg: "#EEF2FA",
    heroImage: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=800&q=80",
    dbValues: ["Greek", "greek", "Mediterranean"],
    wikiTitle: "Greek cuisine",
    stapleIngredients: [
      { emoji: "🫒", name: "Olive oil", note: "Liquid gold — gift of Athena" },
      { emoji: "🧀", name: "Feta", note: "PDO protected since 2002" },
      { emoji: "🍋", name: "Lemon", note: "Citrus of the Mediterranean" },
      { emoji: "🌿", name: "Oregano", note: "Mountain herb identity" },
      { emoji: "🐑", name: "Lamb", note: "Easter & feast animal" },
    ],
    coreTechniques: [
      { emoji: "🔥", name: "Kleftiko (sealed roast)", note: "Slow pit-roasting" },
      { emoji: "🫙", name: "Phyllo layering", note: "Paper-thin pastry" },
      { emoji: "🍽️", name: "Mezze sharing", note: "Small plates culture" },
      { emoji: "🍢", name: "Souvlaki spit", note: "2,500-year tradition" },
    ],
    culturalOccasions: [
      "✝️ Easter magiritsa soup (midnight feast)",
      "🎉 Name day celebrations (bigger than birthdays)",
      "🙏 Orthodox Lenten fasting dishes (nistisima)",
      "💍 Greek wedding koufeta almonds",
      "☀️ Summer panigyri village festival",
    ],
    crossCultureBridges: [
      {
        dish: "Baklava",
        from: "Ottoman Empire",
        story: "Baklava's layered phyllo and nut filling was perfected in the Ottoman imperial kitchens of Topkapı Palace. Greece, Turkey, and multiple Middle Eastern cuisines all claim it — in reality it evolved across the whole Eastern Mediterranean under Ottoman influence over 500 years.",
        recipeMatch: "baklava",
      },
      {
        dish: "Moussaka",
        from: "Ottoman & Arab culinary tradition",
        story: "The layered eggplant dish has roots in medieval Arab cuisine ('musaqqa'a'). The Ottoman version spread across the Balkans. The modern Greek moussaka with béchamel sauce was codified by chef Nikos Tselementes in the 1920s, influenced by French haute cuisine.",
        recipeMatch: "moussaka",
      },
    ],
  },

  // ── AMERICAS ─────────────────────────────────────────────────
  {
    slug: "mexican",
    name: "Mexican",
    flag: "MX",
    region: "Americas",
    tagline: "Ancient, vibrant, and impossible to eat quietly.",
    description: "Mexican cuisine is UNESCO-listed for a reason. Thousands of years of indigenous ingredients — corn, chiles, chocolate, vanilla — meet Spanish colonial influences. From Oaxacan mole to Yucatecan cochinita pibil, every region tells its own story.",
    keyDishes: ["Tacos al Pastor", "Mole Negro", "Cochinita Pibil", "Chiles en Nogada", "Elote"],
    color: "#1A7A30",
    bg: "#EEF7EF",
    heroImage: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
    dbValues: ["Mexican", "mexican"],
    wikiTitle: "Mexican cuisine",
    stapleIngredients: [
      { emoji: "🌽", name: "Corn (masa)", note: "Sacred Mesoamerican grain" },
      { emoji: "🌶️", name: "Chili", note: "10,000 years of cultivation" },
      { emoji: "🍫", name: "Chocolate", note: "Aztec cacao ritual" },
      { emoji: "🥑", name: "Avocado", note: "Originated in Mexico" },
      { emoji: "🫘", name: "Black beans", note: "Pre-Columbian staple" },
    ],
    coreTechniques: [
      { emoji: "🌽", name: "Nixtamalisation", note: "3,000-year lime process" },
      { emoji: "🫙", name: "Stone grinding", note: "Molcajete & metate" },
      { emoji: "♨️", name: "Comal grilling", note: "Clay griddle tradition" },
      { emoji: "🍲", name: "Mole building", note: "30+ ingredient depth" },
    ],
    culturalOccasions: [
      "💀 Día de los Muertos ofrendas (altar food)",
      "🎀 Quinceañera feasts",
      "🇲🇽 Independence Day chiles en nogada",
      "🎄 Christmas Eve tamales",
      "🌽 Harvest Día de la Santa Cruz",
    ],
    crossCultureBridges: [
      {
        dish: "Tacos al pastor",
        from: "Lebanese shawarma immigrants",
        story: "Lebanese immigrants arrived in Mexico in the 1920s-1930s, bringing the vertical spit-roasted shawarma tradition. Mexican cooks substituted lamb for pork, added chili and pineapple, and the trompo became the defining apparatus of tacos al pastor.",
        recipeMatch: "al pastor",
      },
      {
        dish: "Churros",
        from: "Spain / Portugal",
        story: "Churros arrived in Mexico during Spanish colonisation. Some historians trace the original pastry to Portuguese sailors who encountered Chinese youtiao (fried dough sticks) and adapted it. Mexico added chocolate dipping sauce — something not traditionally paired with churros in Spain.",
        recipeMatch: "churro",
      },
    ],
  },
  {
    slug: "tex-mex",
    name: "Tex-Mex",
    flag: "TX",
    region: "Americas",
    tagline: "The American Southwest's love letter to Mexico — louder, cheesier, unashamed.",
    description: "Tex-Mex is what happens when two great food cultures collide along a 3,000-km border. Fajitas were invented here. So was the flour tortilla burrito. Jalapeño poppers. Queso. Nachos. Tex-Mex doesn't apologize for anything.",
    keyDishes: ["Fajitas", "Chili con Carne", "Breakfast Tacos", "Queso Dip", "Loaded Nachos"],
    color: "#C85A2F",
    bg: "#FFF0E8",
    heroImage: "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=800&q=80",
    dbValues: ["Tex-Mex", "tex-mex", "Texmex"],
    wikiTitle: "Tex-Mex cuisine",
  },

  // ── EAST ASIA ────────────────────────────────────────────────
  {
    slug: "japanese",
    name: "Japanese",
    flag: "JP",
    region: "East Asia",
    tagline: "Precision, umami, and the philosophy of enough.",
    description: "Japanese cuisine is a study in mastery. A sushi chef trains for a decade before touching fish. Ramen broth simmers for 18 hours. Rice and fermentation form the backbone — sake, miso, and soy sauce are the holy trinity of umami — while ginger, sesame, and nashi pear perfume the rest. Washoku is art you eat.",
    keyDishes: ["Ramen", "Sushi", "Tonkatsu", "Takoyaki", "Miso Soup"],
    color: "#8C1A1A",
    bg: "#FAF0EE",
    heroImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80",
    dbValues: ["Japanese", "japanese"],
    wikiTitle: "Japanese cuisine",
    stapleIngredients: [
      { emoji: "🍚", name: "Rice", note: "Sacred grain, currency" },
      { emoji: "🍱", name: "Dashi", note: "Umami foundation" },
      { emoji: "🧂", name: "Soy sauce", note: "Ancient ferment" },
      { emoji: "🫙", name: "Miso", note: "Koji fermentation" },
      { emoji: "🍶", name: "Sake", note: "Ritual & cooking" },
    ],
    coreTechniques: [
      { emoji: "🔪", name: "Katachi knife work", note: "Form as philosophy" },
      { emoji: "🫙", name: "Fermentation", note: "Miso, tsukemono, shoyu" },
      { emoji: "♨️", name: "Umami layering", note: "5th taste mastery" },
      { emoji: "🍡", name: "Sticky rice steam", note: "Glutinous precision" },
    ],
    culturalOccasions: [
      "🎍 New Year's osechi ryōri boxes",
      "🌸 Cherry blossom hanami picnics",
      "👻 Obon festival offerings to ancestors",
      "🍱 Daily bento culture & craft",
      "🎑 Tsukimi moon-viewing dumplings",
    ],
    crossCultureBridges: [
      {
        dish: "Tempura",
        from: "Portuguese Jesuit missionaries",
        story: "Portuguese missionaries brought the technique of frying vegetables in seasoned batter to Japan in the 16th century. Japanese cooks refined it into tempura — adding rice flour for translucency and transforming a Catholic Friday tradition into one of Japan's most iconic dishes.",
        recipeMatch: "tempura",
      },
      {
        dish: "Ramen",
        from: "Chinese lamian noodles",
        story: "Ramen descends from Chinese wheat noodles brought to Japan by Chinese immigrants in the Meiji era. Japanese cooks localised the dish with tare seasoning, pork-bone broth, and regional variation — eventually creating something entirely distinct from its origin.",
        recipeMatch: "ramen",
      },
      {
        dish: "Tonkatsu",
        from: "German Wiener Schnitzel",
        story: "In the Meiji-era Westernisation push, Japanese chefs adapted the German breaded veal cutlet into tonkatsu using pork and panko breadcrumbs. The accompanying tonkatsu sauce is itself a Japanese riff on Worcestershire sauce — a British condiment.",
        recipeMatch: "tonkatsu",
      },
    ],
  },
  {
    slug: "vietnamese",
    name: "Vietnamese",
    flag: "VN",
    region: "East Asia",
    tagline: "Fresh herbs, bone broth clarity, bold contrast.",
    description: "Vietnamese food is the healthiest cuisine you'll ever crave obsessively. Pho is a bowl of philosophy — clear broth, tender beef, fresh herbs that you add yourself. Bánh mì is proof that East meets West can produce something greater than either. Everything is about balance.",
    keyDishes: ["Pho Bo", "Bánh Mì", "Gỏi Cuốn", "Bún Bò Huế", "Cơm Tấm"],
    color: "#2C6B1A",
    bg: "#EEF7EE",
    heroImage: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80",
    dbValues: ["Vietnamese", "vietnamese"],
    wikiTitle: "Vietnamese cuisine",
  },
  {
    slug: "chinese",
    name: "Chinese",
    flag: "CN",
    region: "East Asia",
    tagline: "A continent of flavor — Sichuan fire, Cantonese delicacy, dim sum ritual.",
    description: "China's cuisine isn't one — it's dozens. Sichuan's numbing mala spice, Cantonese dim sum precision, Shanghainese sweet-soy braising, Peking duck lacquered over cherry wood. The world's oldest continuous food culture has had 5,000 years to get very, very good.",
    keyDishes: ["Mapo Tofu", "Peking Duck", "Dim Sum", "Kung Pao Chicken", "Hot Pot"],
    color: "#8C1A1A",
    bg: "#FAF0EE",
    heroImage: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80",
    dbValues: ["Chinese", "chinese", "Cantonese", "Sichuan", "Szechuan"],
    wikiTitle: "Chinese cuisine",
    stapleIngredients: [
      { emoji: "🧂", name: "Soy sauce", note: "2,500-year ferment" },
      { emoji: "🫚", name: "Sesame oil", note: "Ancient finishing oil" },
      { emoji: "🌶️", name: "Doubanjiang", note: "Sichuan spice paste" },
      { emoji: "🧅", name: "Scallions & ginger", note: "Aromatic foundation" },
      { emoji: "🍚", name: "Rice & noodles", note: "North/South divide" },
    ],
    coreTechniques: [
      { emoji: "🔥", name: "Wok hei", note: "Breath of the wok" },
      { emoji: "🫙", name: "Fermentation", note: "Doubanjiang, baijiu, douchi" },
      { emoji: "🍲", name: "Red-braise", note: "Soy & sugar slow cook" },
      { emoji: "🥟", name: "Dim sum steam", note: "Yum cha tradition" },
    ],
    culturalOccasions: [
      "🧧 Lunar New Year dumplings (jiaozi)",
      "🌕 Mid-Autumn Festival mooncakes",
      "❄️ Winter Solstice tangyuan",
      "🎊 8-course wedding banquet",
      "🍵 Daily tea culture (cha)",
    ],
    crossCultureBridges: [
      {
        dish: "Chop suey",
        from: "Chinese-American railroad workers",
        story: "Chop suey was invented by Chinese immigrant workers in 19th-century America — a quick stir-fry of available scraps served to non-Chinese customers. It became a defining dish of Chinese-American cuisine with no direct equivalent in China.",
        recipeMatch: "chop suey",
      },
      {
        dish: "Peking duck",
        from: "Imperial court Yuan dynasty",
        story: "Peking duck was first documented in Yuan dynasty imperial manuals (1330 AD). The roasting method was refined across the Ming and Qing imperial courts before becoming available to the public in Beijing's restaurants in the 19th century.",
        recipeMatch: "peking duck",
      },
    ],
  },
  {
    slug: "korean",
    name: "Korean",
    flag: "KR",
    region: "East Asia",
    tagline: "Fermented, smoky, fiery — and everything on the table at once.",
    description: "Korean food rewards the bold. Kimchi ferments for months. Bulgogi grills table-side. Banchan — a dozen small dishes — arrives before the main. Gochujang is the world's most complex chili paste. Korean BBQ isn't a meal, it's an event.",
    keyDishes: ["Bibimbap", "Korean BBQ", "Kimchi Jjigae", "Japchae", "Tteokbokki"],
    color: "#8C3A1A",
    bg: "#FAF2EE",
    heroImage: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    dbValues: ["Korean", "korean"],
    wikiTitle: "Korean cuisine",
  },
  {
    slug: "thai",
    name: "Thai",
    flag: "TH",
    region: "East Asia",
    tagline: "Sweet, sour, spicy, salty — all four in every bite.",
    description: "Thai cooking is a balancing act of four flavors achieved simultaneously. Fish sauce brings salt and funk, tamarind brings sour, palm sugar brings sweet, chili brings fire. Lemongrass, galangal, and kaffir lime leaves add an aromatic freshness that makes Thai food instantly recognisable — clean, bright, and vibrant even in its heaviest curries. When it works — and it always works — the result is electric.",
    keyDishes: ["Pad Thai", "Tom Yum Goong", "Green Curry", "Som Tam", "Massaman Curry"],
    color: "#8C6B1A",
    bg: "#FAF7EE",
    heroImage: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80",
    dbValues: ["Thai", "thai"],
    wikiTitle: "Thai cuisine",
    stapleIngredients: [
      { emoji: "🐟", name: "Fish sauce", note: "Umami backbone" },
      { emoji: "🌿", name: "Lemongrass", note: "Aromatic identity" },
      { emoji: "🥥", name: "Coconut milk", note: "Southern richness" },
      { emoji: "🌶️", name: "Bird's eye chili", note: "Intense heat" },
      { emoji: "🍋", name: "Kaffir lime leaf", note: "Floral citrus note" },
    ],
    coreTechniques: [
      { emoji: "🔨", name: "Mortar pounding", note: "Paste by hand — not blender" },
      { emoji: "🔥", name: "Wok stir-fry", note: "High-heat speed" },
      { emoji: "🍚", name: "Sticky rice steam", note: "Bamboo basket method" },
      { emoji: "🎨", name: "Kae sa luk (carving)", note: "Royal fruit & vegetable art" },
    ],
    culturalOccasions: [
      "💧 Songkran water festival foods",
      "🏮 Loy Krathong lotus offerings",
      "🙏 Temple merit-making (tamboon) food",
      "👑 Royal ceremony ceremonial dishes",
      "🌙 Buddhist fasting & offering days",
    ],
    crossCultureBridges: [
      {
        dish: "Pad Thai",
        from: "WWII nationalism + Chinese noodle immigrants",
        story: "Pad Thai was invented as a nationalist project in the 1930s-40s — PM Plaek Phibunsongkhram promoted rice noodles to reduce rice consumption during wartime scarcity. The dish fused Chinese stir-fry technique with Thai flavours.",
        recipeMatch: "pad thai",
      },
      {
        dish: "Massaman curry",
        from: "Persian & Muslim traders",
        story: "Massaman curry (from 'Mussulman' — Muslim) was introduced to Thailand's royal court by Persian and Malay Muslim traders in the 17th century. The use of warm whole spices (cardamom, cinnamon, star anise) reflects the Persian spice trade route.",
        recipeMatch: "massaman",
      },
    ],
  },

  // ── SOUTH ASIA ───────────────────────────────────────────────
  {
    slug: "indian",
    name: "Indian",
    flag: "IN",
    region: "South Asia",
    tagline: "A symphony of spice — 29 states, infinite variations.",
    description: "India's cuisine is the most diverse on Earth. The north is rich with cream-based curries and tandoor-roasted meats; the south runs on rice, coconut, and tamarind. A spice powerhouse above all else — complex dry-spice layering with mustard seeds, fenugreek, and curry leaves builds depth that western cooking rarely achieves. Ghee and pulses anchor the diet, while centuries of Mughal, Portuguese, and British influence have added further layers. There is no 'Indian food' — there are hundreds.",
    keyDishes: ["Butter Chicken", "Biryani", "Dosa", "Dal Makhani", "Chaat"],
    color: "#C87A1A",
    bg: "#FDF7EE",
    heroImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    dbValues: ["Indian", "indian"],
    wikiTitle: "Indian cuisine",
    stapleIngredients: [
      { emoji: "💛", name: "Turmeric", note: "4,000 years of use" },
      { emoji: "🧈", name: "Ghee", note: "Vedic sacred fat" },
      { emoji: "🌿", name: "Cumin", note: "Ancient trade spice" },
      { emoji: "🫘", name: "Dal (lentils)", note: "Protein of the poor" },
      { emoji: "🌾", name: "Rice & Wheat", note: "Regional staple divide" },
    ],
    coreTechniques: [
      { emoji: "🔥", name: "Tadka (tempering)", note: "Blooming spices in fat" },
      { emoji: "🫙", name: "Fermentation", note: "Idli, dosa, lassi" },
      { emoji: "🏺", name: "Tandoor oven", note: "Clay pit at 480°C" },
      { emoji: "♨️", name: "Dum (sealed steam)", note: "Biryani technique" },
    ],
    culturalOccasions: [
      "🪔 Diwali sweets (mithai)",
      "🕌 Eid biryani & sewaiyan",
      "🎨 Holi thandai & gujiya",
      "💍 Shaadi (wedding) multi-day feasts",
      "🌙 Ramadan sehri & iftar spreads",
    ],
    crossCultureBridges: [
      {
        dish: "Biryani",
        from: "Persia via Mughal court",
        story: "Biryani descends from Persian pilaf. Mughal emperors brought Persian cooks to India in the 16th century — the dish evolved as it absorbed Indian spices, saffron, and dum cooking. Each region (Hyderabad, Lucknow, Kolkata) developed its own distinct style.",
        recipeMatch: "biryani",
      },
      {
        dish: "Vindaloo",
        from: "Portuguese Goa",
        story: "Vindaloo derives from the Portuguese 'carne de vinha d'alhos' — meat marinated in wine and garlic. Portuguese settlers brought the dish to Goa in the 15th century. Goan cooks replaced wine vinegar with toddy vinegar, added dried Kashmiri chilies, and intensified the spicing.",
        recipeMatch: "vindaloo",
      },
    ],
  },

  // ── NORTH AFRICA / MIDDLE EAST ───────────────────────────────
  {
    slug: "moroccan",
    name: "Moroccan",
    flag: "MA",
    region: "North Africa",
    tagline: "Saffron-scented tagines and the warmth of the spice market.",
    description: "Moroccan cuisine is North Africa's most celebrated, built around the tagine — a slow-cooked stew of meat, preserved lemon, olives and spice. Ras el hanout ('head of the shop') is a spice blend of 20+ ingredients. Couscous on Fridays is almost sacred.",
    keyDishes: ["Lamb Tagine", "Chicken B'stilla", "Couscous", "Harira", "Msemen"],
    color: "#8C4A1A",
    bg: "#FAF2EE",
    heroImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&q=80",
    dbValues: ["Moroccan", "moroccan"],
    wikiTitle: "Moroccan cuisine",
  },
  {
    slug: "tunisian",
    name: "Tunisian",
    flag: "TN",
    region: "North Africa",
    tagline: "Harissa heat, brik pastry, and North Africa's punchiest kitchen.",
    description: "Tunisia is small but its food is fierce. Harissa — a roasted chili paste — appears in nearly every dish. Brik (a thin pastry wrapped around egg and tuna) is addictive. The food sits at the crossroads of Berber, Arab, Andalusian, and French influence.",
    keyDishes: ["Shakshuka", "Brik", "Ojja", "Lablabi", "Mechouia"],
    color: "#8C1A1A",
    bg: "#FAF0EE",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    dbValues: ["Tunisian", "tunisian"],
    wikiTitle: "Tunisian cuisine",
  },
  {
    slug: "lebanese",
    name: "Lebanese",
    flag: "LB",
    region: "Middle East",
    tagline: "Mezze, generosity, and herbs that make everything green.",
    description: "Lebanese food is the original sharing culture — mezze means 'taste', and you're expected to order fifteen of them. Tabbouleh is more herb than grain. Hummus is a religious experience. Shawarma wraps the whole city in a single pita.",
    keyDishes: ["Hummus", "Kibbeh", "Tabbouleh", "Shawarma", "Fattoush"],
    color: "#1A6B3A",
    bg: "#EEF7F2",
    heroImage: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&q=80",
    dbValues: ["Lebanese", "lebanese", "Middle Eastern"],
    wikiTitle: "Middle Eastern cuisine",
    stapleIngredients: [
      { emoji: "🌿", name: "Za'atar", note: "Ancient herb blend" },
      { emoji: "🍋", name: "Sumac", note: "Tart berry spice" },
      { emoji: "🧄", name: "Tahini", note: "Sesame paste foundation" },
      { emoji: "🍎", name: "Pomegranate", note: "Symbol of fertility & plenty" },
      { emoji: "🐑", name: "Lamb", note: "Festive & ritual meat" },
    ],
    coreTechniques: [
      { emoji: "🔥", name: "Mangal grilling", note: "Open charcoal fire" },
      { emoji: "🍽️", name: "Mezze spreading", note: "Abundance display ritual" },
      { emoji: "🌯", name: "Flatbread wrapping", note: "Lavash & pita tradition" },
      { emoji: "🫙", name: "Preserved lemons", note: "North African technique" },
    ],
    culturalOccasions: [
      "🌙 Ramadan iftar breaking-fast spreads",
      "🐑 Eid al-Adha whole lamb feast",
      "🌸 Nowruz (Persian New Year) sabzi polo",
      "💍 Wedding mezze abundance tables",
      "☕ Arabic coffee ceremony (hospitality ritual)",
    ],
    crossCultureBridges: [
      {
        dish: "Shawarma → Tacos al pastor",
        from: "Lebanese diaspora to Mexico",
        story: "Lebanese immigrants brought the vertical rotisserie spit to Mexico in the 1920s. Mexican cooks adapted lamb shawarma into tacos al pastor using pork, dried chili marinades, and pineapple — creating one of the world's most successful food diaspora stories.",
        recipeMatch: "shawarma",
      },
      {
        dish: "Coffee ceremony",
        from: "Ethiopia & Yemen origin",
        story: "Coffee was first cultivated in Ethiopia's Kaffa region and Yemen's Mocha port. Arab traders spread it through the Ottoman empire, where the world's first coffeehouses opened in Constantinople in 1475 — a century before coffee reached Europe.",
        recipeMatch: "coffee",
      },
    ],
  },
  {
    slug: "egyptian",
    name: "Egyptian",
    flag: "EG",
    region: "North Africa",
    tagline: "Ancient grains, hearty legumes, and 5,000 years of recipes.",
    description: "Egyptian food is honest and sustaining — the food of a civilization that built the pyramids. Koshari (rice, lentils, pasta, tomato sauce, crispy onion) is chaotic perfection. Ful medames has been breakfast since the pharaohs. Ta'meya (fava falafel) is better than the chickpea kind.",
    keyDishes: ["Koshari", "Ful Medames", "Ta'meya", "Mulukhiyah", "Hawawshi"],
    color: "#8C6B1A",
    bg: "#FAF7EE",
    heroImage: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
    dbValues: ["Egyptian", "egyptian"],
    wikiTitle: "Egyptian cuisine",
  },

  // ── SUB-SAHARAN AFRICA ────────────────────────────────────────
  {
    slug: "nigerian",
    name: "Nigerian",
    flag: "NG",
    region: "West Africa",
    tagline: "Bold, spiced, and unapologetically rich.",
    description: "Nigerian cuisine is West Africa's most diverse and electric. Jollof rice is a national obsession — and a pan-African rivalry. The food belongs to the 'Spice and Starch' tradition: thick palm-oil-enriched soups poured over swallows like pounded yam, with umami-rich dried crayfish and stockfish providing depth. Egusi soup, suya skewers, and pepper soup are meals that command full attention.",
    keyDishes: ["Jollof Rice", "Egusi Soup", "Pounded Yam", "Suya", "Pepper Soup"],
    color: "#1A6B1A",
    bg: "#EEF7EE",
    heroImage: "https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80",
    dbValues: ["Nigerian", "nigerian"],
    wikiTitle: "Nigerian cuisine",
  },
  {
    slug: "ghanaian",
    name: "Ghanaian",
    flag: "GH",
    region: "West Africa",
    tagline: "Fufu, groundnut soup, and the warmth of West Africa.",
    description: "Ghanaian food is built around communal eating and bold stews. Fufu — pounded cassava and plantain — is eaten daily, torn by hand and dipped into soups. Groundnut (peanut) soup is silky and deeply spiced. Kelewele (fried spiced plantain) is street food perfection.",
    keyDishes: ["Fufu & Groundnut Soup", "Jollof Rice", "Kelewele", "Kontomire Stew", "Banku & Tilapia"],
    color: "#C8880A",
    bg: "#FDF8EE",
    heroImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80",
    dbValues: ["Ghanaian", "ghanaian"],
    wikiTitle: "Ghanaian cuisine",
  },
  {
    slug: "ethiopian",
    name: "Ethiopian",
    flag: "ET",
    region: "East Africa",
    tagline: "Injera, berbere, and the oldest coffee culture on earth.",
    description: "Ethiopian cuisine is ancient and ritualistic. Injera — a spongy sourdough flatbread — serves as both plate and utensil. The grain-heavy, berbere-spiced tradition reflects a high-altitude Horn of Africa heritage where teff, barley, and sorghum have been cultivated for millennia. Everything is piled on the injera: spiced lentils, lamb tibs, collard greens, and fragrant stews. Coffee originated here, and the ceremony is sacred.",
    keyDishes: ["Injera with Wot", "Doro Wot", "Misir Wot", "Tibs", "Kitfo"],
    color: "#8C2A1A",
    bg: "#FAF0EE",
    heroImage: "https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80",
    dbValues: ["Ethiopian", "ethiopian"],
    wikiTitle: "Ethiopian cuisine",
  },
  {
    slug: "senegalese",
    name: "Senegalese",
    flag: "SN",
    region: "West Africa",
    tagline: "Thieboudienne and the sophistication of West African cuisine.",
    description: "Senegal has one of West Africa's most refined food cultures. Thieboudienne — rice cooked in tomato-fish broth — is the national dish and likely the origin of many rice dishes across the continent. Yassa (lemon-marinated chicken or fish) is bright and addictive. The food rewards patience.",
    keyDishes: ["Thieboudienne", "Yassa Poulet", "Mafé", "Thiou", "Accara"],
    color: "#1A5A2A",
    bg: "#EEF7F0",
    heroImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    dbValues: ["Senegalese", "senegalese"],
    wikiTitle: "Senegalese cuisine",
  },
  {
    slug: "south-african",
    name: "South African",
    flag: "ZA",
    region: "Southern Africa",
    tagline: "Braai culture, bobotie, and the rainbow nation on a plate.",
    description: "South African cuisine is as diverse as its people — eleven official languages, countless food traditions. Braai (barbecue) is not just cooking, it's a social institution. Bobotie (spiced minced meat with egg custard) is Cape Malay influence at its finest. Biltong and boerewors are icons.",
    keyDishes: ["Bobotie", "Braai Boerewors", "Biltong", "Bunny Chow", "Malva Pudding"],
    color: "#1A4A8C",
    bg: "#EEF2FA",
    heroImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
    dbValues: ["South African", "south african"],
    wikiTitle: "South African cuisine",
  },
  {
    slug: "kenyan",
    name: "Kenyan",
    flag: "KE",
    region: "East Africa",
    tagline: "Nyama choma, ugali, and the flavours of the Great Rift Valley.",
    description: "Kenyan food is honest, hearty, and built for big appetites. Ugali — a stiff maize porridge — is the staple, eaten with sukuma wiki (braised kale) or nyama choma (roasted goat or beef). The Swahili coast brings coconut, cardamom, and Arabic influence. Chai here is the real thing.",
    keyDishes: ["Nyama Choma", "Ugali & Sukuma Wiki", "Pilau Rice", "Githeri", "Mandazi"],
    color: "#8C3A1A",
    bg: "#FAF2EE",
    heroImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
    dbValues: ["Kenyan", "kenyan"],
    wikiTitle: "Kenyan cuisine",
  },
  {
    slug: "ivorian",
    name: "Ivorian",
    flag: "CI",
    region: "West Africa",
    tagline: "Attiéké, sauce graine, and cocoa country cooking.",
    description: "Côte d'Ivoire is the world's largest cocoa producer, but its food is equally rich. Attiéké (fermented cassava couscous) is eaten at every meal. Sauce graine (palm nut soup) is deeply savory and warming. Alloco (fried plantain) sold on every street corner is irresistible.",
    keyDishes: ["Attiéké & Grilled Fish", "Sauce Graine", "Alloco", "Foutou Banane", "Kedjenou"],
    color: "#C87A1A",
    bg: "#FDF7EE",
    heroImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80",
    dbValues: ["Ivorian", "ivorian", "Côte d'Ivoire"],
    wikiTitle: "Ivorian cuisine",
  },
  // ── FUSION (sentinel — not shown in continent grid) ──────────
  {
    slug: "fusion",
    name: "Fusion Foods",
    flag: "🌐",
    region: "Fusion",
    tagline: "Where two flavor worlds collide and create a third.",
    description: "Fusion cuisine is born when immigrants, travellers, and curious chefs carry their traditions into new kitchens. Korean tacos emerged from LA food trucks. Miso carbonara from Tokyo trattorias rethinking Rome. Naan pizzas from British curry houses. These dishes aren't confusion — they're evolution.",
    keyDishes: ["Korean Tacos", "Sushi Burrito", "Naan Pizza", "Shakshuka Pizza", "Rasta Pasta"],
    color: "#7C3A8C",
    bg: "#F5EEF8",
    heroImage: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    dbValues: ["Fusion", "fusion", "Asian-Latin Fusion", "European-Asian Fusion", "Indian-Western Fusion", "Middle Eastern Fusion"],
  },
];

export const CUISINE_REGIONS = [...new Set(CUISINES.map((c) => c.region))];

// ── CULINARY REGIONS ─────────────────────────────────────────────────────────
// Flavour-based groupings that cut across geography — used as an alternative
// browse mode on the World Cuisines page.

export interface CulinaryRegion {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  bg: string;
  heroImage: string;
  cuisineSlugs: string[]; // which CUISINES entries belong here
}

export const CULINARY_REGIONS: CulinaryRegion[] = [
  {
    id: "mediterranean",
    name: "Mediterranean",
    emoji: "🫒",
    description: "Olive oil, fresh herbs, grilled seafood, and sun-drenched vegetables. The Mediterranean diet spans Italy, Spain, France, Greece, Turkey, and the Levant — united by simplicity and brilliant produce.",
    color: "#1B6CA8",
    bg: "#EEF6FB",
    heroImage: "https://images.unsplash.com/photo-1544025162-d76538497332?w=800&q=80",
    cuisineSlugs: ["italian", "spanish", "french", "greek", "turkish", "moroccan", "lebanese"],
  },
  {
    id: "east-asian",
    name: "East Asian",
    emoji: "🍜",
    description: "Umami-rich broths, precise knife work, fermented depth. Japan, China, Korea, and Vietnam each bring a distinct philosophy — from delicate Japanese dashi to bold Korean gochujang — all sharing a reverence for balance.",
    color: "#C8371A",
    bg: "#FDF0EE",
    heroImage: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
    cuisineSlugs: ["japanese", "chinese", "korean", "vietnamese", "thai"],
  },
  {
    id: "south-asian",
    name: "South Asian",
    emoji: "🌶️",
    description: "Complex spice blends, slow-cooked curries, and breads baked in tandoor ovens. India, Pakistan, Sri Lanka, and Bangladesh share a tradition of layering flavour through masalas, aromatics, and long cooking times.",
    color: "#B85C00",
    bg: "#FEF3E6",
    heroImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    cuisineSlugs: ["indian"],
  },
  {
    id: "latin-american",
    name: "Latin American",
    emoji: "🌮",
    description: "Fire, citrus, corn, and ancient technique. From Mexico's mole negro to the ceviche coastlines of Peru, Latin American food is built on indigenous ingredients shaped by centuries of creativity.",
    color: "#1A7C3E",
    bg: "#EDFAF3",
    heroImage: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
    cuisineSlugs: ["mexican", "american"],
  },
  {
    id: "middle-eastern",
    name: "Middle Eastern",
    emoji: "🧆",
    description: "Warm spices, flatbreads, slow-roasted meats, and vibrant mezze. Lebanon, Iran, Egypt, and the Gulf share a tradition of generous hospitality — food as an act of welcome.",
    color: "#8B5E0A",
    bg: "#FBF6EB",
    heroImage: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&q=80",
    cuisineSlugs: ["lebanese", "moroccan", "turkish"],
  },
  {
    id: "african",
    name: "African",
    emoji: "🥘",
    description: "Rich stews, fermented grains, plantain in every form, and spice blends that tell a continent's history. Ethiopia's injera, Nigeria's jollof, Senegal's thieboudienne — African cuisine is finally getting the global recognition it deserves.",
    color: "#7C3A0E",
    bg: "#FBF0E9",
    heroImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80",
    cuisineSlugs: ["ethiopian", "west-african", "moroccan"],
  },
];

const SLUG_ALIASES: Record<string, string> = {
  "american":      "north-american",
  "usa":           "north-american",
  "us":            "north-american",
  "english":       "british",
  "uk":            "british",
  "gb":            "british",
  "middle-east":   "lebanese",
  "arab":          "lebanese",
  "north-africa":  "moroccan",
  "latin":         "mexican",
  "latam":         "mexican",
  "west-african":  "nigerian",
  "west-africa":   "nigerian",
  "east-african":  "kenyan",
  "east-africa":   "kenyan",
  "south-africa":  "south-african",
  "cote-divoire":  "ivorian",
  "ivory-coast":   "ivorian",
};

export function getCuisineBySlug(slug: string): CuisineInfo | undefined {
  const normalized = slug.toLowerCase();
  const direct = CUISINES.find((c) => c.slug === normalized);
  if (direct) return direct;
  const aliasTarget = SLUG_ALIASES[normalized];
  if (aliasTarget) return CUISINES.find((c) => c.slug === aliasTarget);
  return undefined;
}

export function matchCuisine(cuisine_type: string | undefined, slugs: string[]): boolean {
  if (!cuisine_type) return false;
  const lower = cuisine_type.toLowerCase();
  return slugs.some((slug) => {
    const info = getCuisineBySlug(slug);
    if (!info) return false;
    return info.dbValues.some((v) => v.toLowerCase() === lower);
  });
}
