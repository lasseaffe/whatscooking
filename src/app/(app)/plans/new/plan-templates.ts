export interface PlanTemplate {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  tagKeys: string[]; // for translation
  dietaryFilters: string[];
  durationDays: number;
  mealsPerDay: number;
  gradient: string;
  accentColor: string;
  meals: {
    title: string;
    image: string;
    tags: string[];
    time: string;
    calories: number;
  }[];
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "high-protein",
    emoji: "💪",
    title: "High-Protein Week",
    subtitle: "Build muscle, feel full",
    description: "30g+ protein per meal. Grilled chicken, salmon, eggs, Greek yogurt, and lean beef. Every meal fuels your workout.",
    tags: ["High Protein", "Meal Prep", "Under 30 min"],
    tagKeys: ["tag.high_protein", "tag.meal_prep", "tag.under_30"],
    dietaryFilters: ["high-protein"],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #1a2a1a 0%, #2d4a2d 100%)",
    accentColor: "#4ade80",
    meals: [
      { title: "Grilled Herb Chicken", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["High Protein", "Quick Cook"], time: "20 min", calories: 380 },
      { title: "Miso Glazed Salmon", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", tags: ["High Protein", "Gluten-Free"], time: "15 min", calories: 340 },
      { title: "Ahi Tuna Poke Bowl", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", tags: ["High Protein", "Quick Cook"], time: "20 min", calories: 520 },
      { title: "Egg White Frittata", image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80", tags: ["High Protein", "Vegetarian"], time: "25 min", calories: 220 },
      { title: "Lean Turkey Meatballs", image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80", tags: ["High Protein", "Meal Prep"], time: "35 min", calories: 280 },
    ],
  },
  {
    id: "plant-based",
    emoji: "🌱",
    title: "Plant-Based Week",
    subtitle: "100% vegan, 100% delicious",
    description: "A week of vibrant, satisfying vegan meals. Chickpea curries, Buddha bowls, black bean tacos — proving plant-based is never boring.",
    tags: ["Vegan", "High Fiber", "Budget"],
    tagKeys: ["tag.vegan", "tag.meal_prep", "tag.low_cost"],
    dietaryFilters: ["vegan", "dairy-free"],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #0d2818 0%, #1a4a2e 100%)",
    accentColor: "#86efac",
    meals: [
      { title: "Chickpea Coconut Curry", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80", tags: ["Vegan", "Budget"], time: "20 min", calories: 420 },
      { title: "Rainbow Buddha Bowl", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tags: ["Vegan", "Meal Prep"], time: "30 min", calories: 620 },
      { title: "Crispy Cauliflower Tacos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80", tags: ["Vegan", "Quick Cook"], time: "30 min", calories: 320 },
      { title: "Mushroom & Walnut Ragu", image: "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=600&q=80", tags: ["Vegan", "Hearty"], time: "35 min", calories: 580 },
      { title: "Red Lentil Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", tags: ["Vegan", "Budget", "Batch Cook"], time: "30 min", calories: 310 },
    ],
  },
  {
    id: "quick-weeknights",
    emoji: "⚡",
    title: "Quick Weeknight Meals",
    subtitle: "Dinner on the table in 30 min",
    description: "Every recipe under 30 minutes. Real food for real busy people — no shortcuts on flavour, only on time.",
    tags: ["Under 30 min", "Quick Cook", "Weeknight"],
    tagKeys: ["tag.under_30", "tag.quick_cook", "tag.family"],
    dietaryFilters: [],
    durationDays: 5,
    mealsPerDay: 2,
    gradient: "linear-gradient(135deg, #2a1a00 0%, #4a3000 100%)",
    accentColor: "#fbbf24",
    meals: [
      { title: "Cacio e Pepe", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80", tags: ["Quick Cook", "Vegetarian"], time: "15 min", calories: 580 },
      { title: "Better-Than-Takeout Fried Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80", tags: ["Quick Cook", "Budget"], time: "15 min", calories: 420 },
      { title: "Salmon Teriyaki", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", tags: ["Quick Cook", "High Protein"], time: "20 min", calories: 340 },
      { title: "Shakshuka", image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80", tags: ["Quick Cook", "Vegetarian"], time: "25 min", calories: 280 },
      { title: "Smash Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", tags: ["Quick Cook", "Under 30 min"], time: "20 min", calories: 680 },
    ],
  },
  {
    id: "mediterranean",
    emoji: "🫒",
    title: "Mediterranean Diet",
    subtitle: "The world's healthiest cuisine",
    description: "Olive oil, fresh vegetables, lean protein, and whole grains. Linked to longevity and heart health — and it tastes incredible.",
    tags: ["Mediterranean", "Heart Healthy", "Gluten-Free"],
    tagKeys: ["tag.mediterranean", "tag.gluten_free", "tag.vegetarian"],
    dietaryFilters: ["gluten-free"],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #001a2c 0%, #002d4a 100%)",
    accentColor: "#38bdf8",
    meals: [
      { title: "Shakshuka", image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80", tags: ["Mediterranean", "Vegetarian"], time: "25 min", calories: 280 },
      { title: "Greek Yogurt Baked Chicken", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["Mediterranean", "High Protein"], time: "50 min", calories: 420 },
      { title: "Classic Greek Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tags: ["Mediterranean", "Quick Cook"], time: "10 min", calories: 280 },
      { title: "Lamb Kofta Kebabs", image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80", tags: ["Mediterranean", "High Protein"], time: "25 min", calories: 480 },
      { title: "Silky Smooth Hummus", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80", tags: ["Mediterranean", "Vegan"], time: "80 min", calories: 180 },
    ],
  },
  {
    id: "budget-friendly",
    emoji: "💰",
    title: "Budget Friendly Week",
    subtitle: "Feed 4 for under $50",
    description: "Hearty, filling meals that cost next to nothing. Lentils, beans, eggs, and smart protein — proving you don't need to spend to eat well.",
    tags: ["Budget", "Batch Cook", "High Fiber"],
    tagKeys: ["tag.low_cost", "tag.batch_cook", "tag.meal_prep"],
    dietaryFilters: [],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #2a1a0a 0%, #4a2e10 100%)",
    accentColor: "#fb923c",
    meals: [
      { title: "1-Pot Vegan Chili", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80", tags: ["Budget", "Batch Cook"], time: "40 min", calories: 340 },
      { title: "Classic Minestrone", image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&q=80", tags: ["Budget", "Vegan"], time: "45 min", calories: 280 },
      { title: "Lean Turkey Meatballs", image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80", tags: ["Budget", "High Protein"], time: "35 min", calories: 280 },
      { title: "Better-Than-Takeout Fried Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80", tags: ["Budget", "Quick Cook"], time: "15 min", calories: 420 },
      { title: "Red Lentil Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", tags: ["Budget", "Vegan"], time: "30 min", calories: 310 },
    ],
  },
  {
    id: "family-feast",
    emoji: "👨‍👩‍👧‍👦",
    title: "Family Feast Week",
    subtitle: "Everyone at the table, happy",
    description: "Crowd-pleasing classics the whole family will love. No complicated techniques, no unusual ingredients — just reliable, delicious dinners.",
    tags: ["Family", "Kid-Friendly", "Comfort Food"],
    tagKeys: ["tag.family", "tag.quick_cook", "tag.low_cost"],
    dietaryFilters: [],
    durationDays: 7,
    mealsPerDay: 3,
    gradient: "linear-gradient(135deg, #1a0a2a 0%, #2d1a45 100%)",
    accentColor: "#c084fc",
    meals: [
      { title: "The Ultimate Lasagna", image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80", tags: ["Family", "Make Ahead"], time: "85 min", calories: 720 },
      { title: "Chicken Pot Pie", image: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80", tags: ["Family", "Comfort"], time: "55 min", calories: 560 },
      { title: "Ultimate Mac & Cheese", image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&q=80", tags: ["Family", "Kid-Friendly"], time: "40 min", calories: 620 },
      { title: "Perfect Roast Chicken", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["Family", "Weekend"], time: "75 min", calories: 580 },
      { title: "Extra-Fluffy Pancakes", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&q=80", tags: ["Family", "Breakfast"], time: "25 min", calories: 220 },
    ],
  },
  {
    id: "meal-prep-sunday",
    emoji: "📦",
    title: "Meal Prep Sunday",
    subtitle: "Cook once, eat all week",
    description: "Five batch-friendly recipes cooked on Sunday that provide lunches and dinners through Friday. Minimum effort, maximum variety.",
    tags: ["Meal Prep", "Batch Cook", "Budget"],
    tagKeys: ["tag.meal_prep", "tag.batch_cook", "tag.low_cost"],
    dietaryFilters: [],
    durationDays: 5,
    mealsPerDay: 2,
    gradient: "linear-gradient(135deg, #0a1a2a 0%, #1a2d45 100%)",
    accentColor: "#67e8f9",
    meals: [
      { title: "Herb Grilled Chicken Meal Prep", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80", tags: ["Meal Prep", "High Protein"], time: "25 min", calories: 280 },
      { title: "Classic Beef Stew", image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&q=80", tags: ["Batch Cook", "Comfort"], time: "3 hrs", calories: 560 },
      { title: "Massaged Kale & Farro Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tags: ["Meal Prep", "Vegan"], time: "30 min", calories: 360 },
      { title: "1-Pot Vegan Chili", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80", tags: ["Batch Cook", "Budget"], time: "40 min", calories: 340 },
      { title: "Brown Butter Banana Bread", image: "https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=600&q=80", tags: ["Meal Prep", "Snack"], time: "75 min", calories: 280 },
    ],
  },
];
