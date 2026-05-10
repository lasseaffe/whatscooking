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
