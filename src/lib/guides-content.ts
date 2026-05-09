export type MilestoneRelevance =
  | "pre_solids"
  | "started_solids"
  | "started_solids_to_soft_lumps"
  | "handles_soft_lumps"
  | "finger_foods"
  | "family_table"
  | "all_stages";

export interface GuideArticle {
  slug: string;
  title: string;
  milestoneRelevance: MilestoneRelevance;
  summary: string;
  body: string; // markdown
}

export const GUIDES: GuideArticle[] = [
  {
    slug: "signs-of-readiness",
    title: "Starting Solids: Signs of Readiness",
    milestoneRelevance: "pre_solids",
    summary: "How to know your baby is ready to start solid foods — what to look for and what to ignore.",
    body: `
## Is Your Baby Ready?

Most babies are developmentally ready for solid foods around 6 months, but readiness is about signs — not age.

### Three signs to look for (all three should be present)

1. **Head control** — Your baby can hold their head steady and upright without support.
2. **Sitting with minimal support** — They can sit in a high chair without slumping.
3. **Interest in food** — They watch you eat, reach for food, and open their mouth when food approaches.

### Signs that are NOT indicators of readiness

- Waking at night (all babies do this; it is not a sign of hunger for solids)
- Chewing fists (normal oral development)
- Being a "big baby"

### What to do next

Talk to your pediatrician at the 4–6 month visit. If all three readiness signs are present, start with a single-ingredient smooth purée once a day.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "first-foods-purees",
    title: "First Foods: Single-Ingredient Purées",
    milestoneRelevance: "started_solids",
    summary: "The best first foods to try, how to prepare them, and how to introduce them safely.",
    body: `
## Starting With Purées

The goal of early solids is exposure, not nutrition — breast milk or formula remains the primary nutrition source until 12 months.

### Best first foods

- **Vegetables:** sweet potato, carrot, pea, butternut squash, parsnip
- **Fruit:** pear, apple, banana, avocado
- **Grains:** baby rice, oat porridge (iron-fortified)
- **Protein:** well-cooked lentils, chicken, beef (puréed smooth)

### How to prepare

1. Steam or roast until very soft.
2. Blend with enough breast milk, formula, or water to achieve a smooth, runny consistency — thinner than ketchup.
3. Serve at room temperature. Never microwave — stir and test temperature before serving.

### Introducing new foods

- Offer one new food every 2–3 days so you can spot any reaction.
- A reaction to watch for: hives, vomiting, or swelling within 2 hours of eating.
- Mild face-pulling is normal — it takes 10–15 exposures before a baby accepts a new flavour.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "introducing-allergens",
    title: "Introducing the Top 8 Allergens Safely",
    milestoneRelevance: "started_solids_to_soft_lumps",
    summary: "Current guidance from WHO and AAP on when and how to introduce the 8 major allergens.",
    body: `
## Allergen Introduction

Current evidence from the LEAP study and AAP guidance (2024) supports early introduction of allergens — delay increases risk.

### The 8 allergens to introduce

Egg, dairy, gluten, peanut, tree nuts, soy, fish, shellfish.

### How to introduce each

1. Introduce allergens one at a time, with 2–3 days between each new one.
2. Start with a small amount — ¼ teaspoon of peanut butter thinned with water, for example.
3. Offer at home, not at childcare, so you can observe for 2 hours.
4. If tolerated, continue offering that allergen regularly (2–3 times per week) to maintain tolerance.

### When to call a doctor immediately

Difficulty breathing, throat tightening, widespread hives, or loss of consciousness after eating.

> This guide is informational only. Always consult your pediatrician for a personalised allergen introduction plan, especially if there is a family history of allergies.
    `.trim(),
  },
  {
    slug: "blw-vs-spoon-feeding",
    title: "Baby-Led Weaning vs. Spoon Feeding",
    milestoneRelevance: "started_solids",
    summary: "The pros, cons, and practical considerations of each approach — and why you do not have to choose.",
    body: `
## Two approaches, one goal

Both baby-led weaning (BLW) and spoon feeding lead to healthy eaters. The best approach is the one that works for your family.

### Spoon feeding

- **Pros:** Easier portion control, you know how much they ate, less mess in early stages.
- **Cons:** Can override hunger cues if pushed; requires more prep (blending).
- **Best for:** Families who want structure, or babies with lower muscle tone.

### Baby-led weaning (BLW)

- **Pros:** Encourages self-regulation, develops pincer grip, makes family meals easier as baby eats what you eat.
- **Cons:** Messier, harder to know intake, requires baby to be at "finger foods" readiness stage.
- **Best for:** Families who eat together regularly and have flexible mealtimes.

### The hybrid approach

Start with purées, transition to mashed textures, then offer soft finger foods alongside spoon-fed portions. Most families do this naturally.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "mashed-lumpy-textures",
    title: "Moving to Mashed & Lumpy Textures",
    milestoneRelevance: "handles_soft_lumps",
    summary: "How to progress from smooth purées to mashed and textured foods without stress.",
    body: `
## Why texture matters

Exposure to lumpy textures before 9–10 months is associated with better food acceptance at age 7. Staying on smooth purées too long can make the transition harder.

### Texture progression

1. **Smooth purée** — no lumps, runny
2. **Thick mash** — lumps present but squash between fingers easily
3. **Fork-mashed** — visible pieces, soft enough to gum
4. **Soft chunks** — pieces about 1cm, soft throughout

### Foods that mash well

Banana, avocado, cooked potato, soft-cooked carrot, lentils, scrambled egg, soft cheese, yoghurt with fruit pieces.

### Foods to avoid at this stage

Raw hard vegetables, whole grapes, whole nuts, large chunks of meat, sticky foods like peanut butter from a spoon.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "finger-foods-safe-shapes",
    title: "Finger Foods: Safe Shapes & Sizes",
    milestoneRelevance: "finger_foods",
    summary: "The correct size and shape for every common finger food to minimise choking risk.",
    body: `
## The finger food rule

Cut all foods so they either dissolve quickly in the mouth OR are too large to fully enter the airway. The danger zone is 1–3cm spherical shapes — grapes, cherry tomatoes, whole blueberries.

### Safe shapes by food type

| Food | Safe preparation |
|------|-----------------|
| Grapes / cherry tomatoes | Quarter lengthways |
| Blueberries | Halve or squash flat |
| Strawberries | Quarter |
| Banana | Spear shape, 5cm long |
| Cooked carrot | Thin sticks or small dice, very soft |
| Toast / bread | Finger-length strips |
| Meat | Shredded or minced — never large chunks |
| Cheese | Thin strips or small cubes |
| Pasta | Shorter shapes (penne, fusilli) |

### Foods to avoid until age 4

Whole nuts, popcorn, hard raw vegetables, large chunks of apple, hot dogs (unless quartered lengthways), hard sweets.

### What to do if your baby gags

Gagging is normal and different from choking. Gagging is noisy and baby resolves it themselves. Choking is silent. Learn infant first aid before starting finger foods.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "foods-to-avoid-first-year",
    title: "Foods to Avoid in the First Year",
    milestoneRelevance: "all_stages",
    summary: "A definitive list of foods that are unsafe for babies under 12 months and why.",
    body: `
## Foods to avoid under 12 months

### Honey (all forms — including cooked)
Risk of infant botulism. Clostridium botulinum spores survive cooking. Absolute no until 12 months.

### Whole cow's milk as a drink
Fine in cooking and yoghurt/cheese, but not as the main drink — displaces iron-rich formula or breast milk.

### Added salt
Babies' kidneys cannot process adult salt levels. Do not add salt to any food. Check labels on bread, stock, and cheese.

### Added sugar
No nutritional benefit, creates preference for sweet foods. Avoid fruit juice, squash, and sugary snacks.

### Unpasteurised foods
Unpasteurised cheese, raw milk, smoked salmon, pâté — listeria risk.

### Certain fish
Shark, swordfish, marlin — high mercury. Limit tuna to 2 portions per week.

### Rice drinks
Not suitable under 4.5 years due to arsenic content.

### Whole nuts
Choking hazard under 4 years. Smooth nut butters are fine from 6 months (thinned for early stages).

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
  {
    slug: "eating-at-family-table",
    title: "Eating at the Family Table",
    milestoneRelevance: "family_table",
    summary: "How to transition your toddler to eating adapted family meals and make mealtimes enjoyable.",
    body: `
## Eating together

Shared mealtimes are consistently associated with better food acceptance, healthier eating habits, and stronger family relationships.

### How to adapt family meals for toddlers

1. **Cook once, adjust before seasoning.** Add salt and spices to the adult portion after setting aside the baby's portion.
2. **Texture:** Toddlers can handle most adult textures by 12–18 months. Cut into appropriate pieces; avoid hard raw vegetables.
3. **Spice:** Mild herbs and spices are fine and encouraged for flavour exposure. Chilli and very hot food — introduce gradually.
4. **Portion size:** Toddler stomachs are small. A tablespoon per year of age per food item is a rough guide. Do not pressure them to finish.

### Meals that adapt easily

- Pasta dishes (remove salt, serve sauce on the side early on)
- Roasted vegetables (soft-roasted)
- Fish (remove bones, flake)
- Soups (blend for younger babies, serve chunky for toddlers)
- Stews and casseroles (remove large bone pieces)

### Division of responsibility (Ellyn Satter)

- **Your job:** decide what food is offered, when, and where.
- **Their job:** decide whether to eat and how much.

Pressure and coercion reliably make picky eating worse. Consistent exposure without pressure is the evidence-based approach.

> Always consult your pediatrician before introducing new foods.
    `.trim(),
  },
];

/** Map milestone key to the guides relevant for that stage */
export const MILESTONE_GUIDE_MAP: Record<string, string[]> = {
  pre_solids:     ["signs-of-readiness"],
  started_solids: ["first-foods-purees", "introducing-allergens", "blw-vs-spoon-feeding", "foods-to-avoid-first-year"],
  handles_soft_lumps: ["mashed-lumpy-textures", "introducing-allergens", "foods-to-avoid-first-year"],
  finger_foods:   ["finger-foods-safe-shapes", "foods-to-avoid-first-year"],
  family_table:   ["eating-at-family-table", "foods-to-avoid-first-year"],
};
