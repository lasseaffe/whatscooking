# What's Cooking — Strategic Ecosystem Audit
**Date:** 2026-05-11 · **Geo:** Global English-first · **Ambition:** Category-killer ecosystem reimagination

---

## Executive Summary

What's Cooking is materially better positioned in the meal-planning + recipe-app market than its founder probably realizes. After a nine-dimension benchmark against ten competitors (Samsung Food, Paprika, Mealime, AnyList, NYT Cooking, Kitchen Stories, Plant Jammer, ChefGPT, Crouton, and the late Yummly), three findings stand out:

1. **The category's incumbents are leaking trust.** Yummly was shut down Dec 20, 2024 with no migration path. Samsung Food's Chrome extension has been broken since the 2023 rebrand. Crouton's iCloud sync has been losing user libraries. Plant Jammer's consumer app is dormant. Mealime users churn at week 6–8 from recipe repetition. NYT Cooking's standalone meal-planning is thin. **No competitor currently combines household-grade multi-user state, real recipe quality, and a working business model.**
2. **WC's actual moat is household-first cooking, not AI or recipes.** Every competitor — including the AI-native ones — treats cooking as a single-user activity. WC is the only product in the set that natively models multiple humans of different ages, milestones, allergens, and preferences sharing one kitchen, one pantry, one plan, in real time. This is not a feature; this is the wedge.
3. **WC is dangerously close to shipping a complete product without a working monetization layer.** Premium recipes are tagged but not gated. There is no Stripe, no Paddle, no RevenueCat in the codebase. The single highest-leverage 90-day move is **enforcing the existing premium tier with a real payment system.** Everything else compounds; nothing compounds without revenue.

The reimagination proposed below compresses 25+ existing routes into **5 product pillars** (Kitchen, Recipes, Plan, Learn, Household), proposes a **monetization model anchored at $4.99/month solo + $7.99/month household + $99 lifetime** (the latter explicitly designed to convert Yummly refugees who no longer trust subscription cooking apps), and identifies **10 prioritized 90-day moves** ranked by `impact × confidence ÷ effort`.

The one-sentence positioning: **"What's Cooking is the only cooking app built around your household, not your phone."**

---

## Phase 1 — Competitor Profiles

Ten competitors across three tiers. Pricing and scale figures are sourced; weaknesses are pulled from user reviews and comparison articles, not editorial opinion.

### Tier 1 — All-in-one / direct competitors

**Samsung Food (formerly Whisk)** — Samsung's AI-powered meal planner, rebranded Aug 2023.
- **Pricing:** Free ad-supported; Food+ $4.99/mo or $39.99/yr
- **Scale:** 160,000+ recipes across 104 countries; crossed 500K MAU for the first time in Aug 2025
- **Top 3 features:** Vision AI ingredient recognition from photos · Samsung kitchen-appliance integration (oven, fridge, Galaxy TVs) · URL recipe import with auto shopping list + meal plan
- **Top 3 weaknesses:** Chrome extension broken since 2023 rebrand · Best experience requires Samsung hardware · Pantry awareness is shallow — recipes don't reliably reflect on-hand ingredients
- **Signature UX moment:** Photo of fridge → AI returns cookable recipes
- **Signature failure mode:** Public bug reports go unaddressed for years
- **Sources:** [Plan to Eat review](https://www.plantoeat.com/blog/2026/01/samsung-food-review-pros-and-cons/) · [MealThinker analysis](https://mealthinker.com/blog/samsung-food-alternative) · [SamMobile coverage](https://www.sammobile.com/news/samsung-food-update-massive-gift-free-users/)

**Yummly** — *Sunset Dec 20, 2024.* Whirlpool-owned recipe app; consumer service terminated, asset partially repurposed as KitchenAid-branded recipe property. Included as a cautionary case study and a marketing wedge: every former Yummly user is a homeless cooking-app user who lost their library with no export path. [Plan to Eat sunset notice](https://www.plantoeat.com/blog/2024/12/yummly-is-closing-discover-the-best-meal-planning-alternative/) · [The Spoon layoff report](https://thespoon.tech/whirlpool-lays-off-entire-team-for-cooking-and-recipe-app-yummly/)

**Paprika Recipe Manager 3** — Pay-once power-user recipe library with no subscription.
- **Pricing:** One-time per platform ($4.99–$29.99); Paprika Cloud Sync free with purchase
- **Scale:** Not publicly disclosed; long-running indie
- **Top 3 features:** Industry-best URL recipe scraper (~95% accuracy) · Auto-consolidating grocery list across meal-plan recipes · Cross-device sync (iOS/Android/Mac/Windows)
- **Top 3 weaknesses:** Per-platform purchase — owning on phone + laptop = pay twice · Dated visual design vs Crouton / Kitchen Stories · No social, AI, or discovery layer
- **Signature UX moment:** In-app browser on any recipe blog → clean structured recipe in your library
- **Signature failure mode:** Users buy on iPhone, discover they have to pay again for iPad/Mac
- **Sources:** [eathealthy365 review](https://eathealthy365.com/paprika-recipe-manager-a-deep-dive-review/) · [Paprika on App Store](https://apps.apple.com/us/app/paprika-recipe-manager-3/id1303222868)

### Tier 2 — Vertical leaders

**Mealime** — Personalized weekly meal plans optimized for ~30-min cooking.
- **Pricing:** Free; Pro $5.99/mo or $49.99/yr (restructured 2026)
- **Scale:** Not publicly disclosed
- **Top 3 features:** Three-tap auto-generated weekly plan tuned to diet + household size + dislikes · Aisle-grouped shopping list · Pro nutrition view with calorie-target filtering
- **Top 3 weaknesses:** "30-minute" recipes take 45–60 minutes per repeat reviewers · No pantry awareness whatsoever · Editing a plan resets the entire grocery list
- **Signature UX moment:** Three-tap onboarding → full week + grocery list in under a minute
- **Signature failure mode:** Users churn at week 6–8 from recipe repetition
- **Sources:** [MealThinker 2026 review](https://mealthinker.com/blog/mealime-alternative) · [Plan to Eat review](https://www.plantoeat.com/blog/2023/04/mealime-app-review-pros-and-cons/)

**AnyList** — Shared grocery + recipe + meal-plan utility; iOS household standard.
- **Pricing:** Free core; AnyList Complete $9.99/yr individual or $14.99/yr household
- **Scale:** Not publicly disclosed; consistently top-ranked in Lifestyle category
- **Top 3 features:** Real-time shared lists with auto-aisle sort · Recipe URL import + scaling + meal calendar · Mac/Web/iOS/Android/Watch parity + shared family calendar
- **Top 3 weaknesses:** Visually utilitarian, no editorial layer · Recipe library is bring-your-own · Mac/Web behind paywall
- **Signature UX moment:** Spouse adds "milk" on the bus → appears instantly on the other phone, sorted into Dairy
- **Signature failure mode:** Power users hit "great list, not a great meal planner" ceiling and pair AnyList with a second app
- **Sources:** [AnyList Features](https://www.anylist.com/features) · [The Kitchn review](https://www.thekitchn.com/anylist-app-review-23004503)

**NYT Cooking** — Editorial-led recipe destination from The New York Times.
- **Pricing:** $5/mo or $40/yr standalone; included in All Access; new **All Access Family $30/mo** for up to 4 users (launched Sept 2025)
- **Scale:** 22,000+ curated recipes; parent NYT 12.3M+ subscribers (Cooking not broken out)
- **Top 3 features:** Editorial curation with named-chef bylines (Melissa Clark, Sam Sifton, Eric Kim) · Community "Notes" — annotations operating as a crowdsourced cookbook layer · Recipe Box + collections + SMS taste-test growth experiments
- **Top 3 weaknesses:** Thin meal-planning / shopping-list tooling · Closed garden — no sync with external apps · Hard paywall comparisons unfavorably to free recipes
- **Signature UX moment:** Reading Notes and finding the one tweak that makes the recipe work
- **Signature failure mode:** Subscribers who stop reading the newspaper question paying for Cooking alone
- **Sources:** [Bloomberg feature](https://www.bloomberg.com/news/features/2025-03-18/new-york-times-cooking-app-helps-lure-more-subscribers) · [Nieman Lab on Family tier](https://www.niemanlab.org/2025/09/the-new-york-times-launches-a-family-subscription-with-separate-wordles-for-everyone/)

**Kitchen Stories** — Berlin-based editorial cooking app, video-first.
- **Pricing:** Free with no ads; Plus €7.99/mo or €79.99/yr
- **Scale:** "Millions of users worldwide"; precise MAU undisclosed
- **Top 3 features:** Cinematography-grade recipe photography + how-to videos · Plus ingredient-based search + personalized For You feed · Unlimited recipe import (Plus)
- **Top 3 weaknesses:** Shopping list was a work-in-progress as recently as Dec 2023; still weak · Many videos not in English (DE-first) · Recurring stability bugs (favorites disappearing, forced profile recreation)
- **Signature UX moment:** Polished 60-second how-to video before starting the recipe
- **Signature failure mode:** Users return after a year to find their saved favorites gone
- **Sources:** [Kitchen Stories Plus](https://www.kitchenstories.com/en/stories/kitchen-stories-plus-our-new-premium-subscription) · [Stuff review](https://www.stuff.tv/review/app-of-the-week-kitchen-stories-review/)

### Tier 3 — AI-native / emerging

**Plant Jammer** — *Consumer app effectively dormant; pivoted to B2B widgets.* AI ingredient-driven recipe generation with a "flavor graph" engine. Last meaningful update June 2024; primary domain redirects to unrelated content. Threat level: low. [Crunchbase](https://www.crunchbase.com/organization/plant-jammer)

**ChefGPT** — Pure-AI recipe generator at ~$2.99/month — cheapest in the category.
- **Top 3 features:** PantryChef ingredient-to-recipe · MasterChef / MacroChef skill+macro modes · Multi-language output
- **Top 3 weaknesses:** Recipes are unvalidated LLM output — wrong cook times, incompatible flavors · No cooking-experience layer (timers, video, pacing) · Brand confusion vs ChatGPT itself with a prompt
- **Signature failure mode:** Generated recipe asks for 45 min at 425°F for something needing 15 — user wastes ingredients
- **Sources:** [ChefGPT](https://www.chefgpt.xyz/) · [Kitchee comparison](https://kitchee.app/ai-recipe-apps-comparison.html)

**Crouton** — Apple-Design-Award-winning indie recipe manager.
- **Pricing:** Free with 20-recipe cap; $3 one-time Plus removes cap; separate **Discover subscription $8.99/yr** unlocks AI import + Discover tab
- **Top 3 features:** Native iOS/iPadOS/macOS/visionOS/watchOS with award-winning UI · Share-sheet import auto-parses ingredients + instructions + nutrition · Camera/AI scanning of cookbook pages into structured recipes
- **Top 3 weaknesses:** iCloud sync has lost user libraries · Plus tier still missing features users assume are included · Zero in-app documentation; some buttons are non-functional placeholders
- **Signature UX moment:** Share-sheet a recipe URL → fully parsed, watchOS step-by-step on your wrist while cooking
- **Signature failure mode:** Paid user opens a new iPad → library half-empty after iCloud sync
- **Sources:** [Crouton on App Store](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987) · [MacStories review](https://www.macstories.net/reviews/crouton-review-an-elegant-modern-recipe-manager-and-cooking-aid/)

---

## Phase 2 — Feature Gap Matrix

Scored 0–3 per dimension: **0** = missing/dead · **1** = basic stub · **2** = competitive · **3** = best-in-class.

| Dimension | Samsung Food | Yummly | Paprika | Mealime | AnyList | NYT Cooking | Kitchen Stories | Plant Jammer | ChefGPT | Crouton | **WC today** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1. Recipe content depth | 2 | 1 | 1 | 1 | 0 | **3** | **3** | 0 | 0 | 1 | **1** |
| 2. Recipe acquisition / import | 2 | 0 | **3** | 0 | 2 | 0 | 2 | 0 | 1 | **3** | **2** |
| 3. AI assistance | **3** | 1 | 0 | 1 | 0 | 0 | 1 | 2 | 2 | 2 | **2** |
| 4. Meal planning | 2 | 0 | 2 | **3** | 2 | 1 | 0 | 0 | 1 | 1 | **3** |
| 5. Pantry & grocery | 1 | 0 | 2 | 0 | **3** | 0 | 1 | 1 | 1 | 1 | **2** |
| 6. Household / social | 2 | 1 | 1 | 1 | **3** | 1 | 1 | 0 | 0 | 0 | **3** |
| 7. Nutrition & health | 2 | 1 | 1 | 2 | 0 | 1 | 1 | 1 | 2 | 1 | **2** |
| 8. Editorial / cultural | 1 | 1 | 0 | 0 | 0 | **3** | **3** | 0 | 0 | 1 | **2** |
| 9. Monetization | 2 | 0 | 2 | 2 | **3** | **3** | 2 | 1 | 1 | 2 | **0** |
| **Total / 27** | **17** | **5** | **12** | **10** | **14** | **12** | **14** | **5** | **8** | **12** | **17** |

### Where WC already leads (3 — best-in-class)
- **Meal planning (4):** Full templates + AI auto-gen with nutritional goals + share-link + duration. Only Mealime competes, and Mealime has no pantry / household awareness, so WC's plans are strictly more capable.
- **Household / social (6):** Real-time shared pantry channels + multi-user household + family members with age groups, milestones, allergens + dinner parties. AnyList wins on grocery-list sharing, but no competitor models people the way WC does.

### Where WC is at parity (2 — competitive)
- Recipe acquisition (matches Samsung Food / Kitchen Stories; behind Paprika and Crouton on URL-parsing accuracy)
- AI assistance (matches ChefGPT/Crouton on generation; behind Samsung Food's Vision AI calorie estimation; ahead of all on substitution scoring system)
- Pantry & grocery (matches Paprika; behind AnyList on real-time list sharing UX; far behind on barcode + delivery integrations)
- Nutrition & health (matches Mealime Pro / ChefGPT MacroChef; behind on wearables)
- Editorial / cultural (matches nobody exactly — 100+ cuisine atlas + WC2026 + cookbooks is a unique combination; behind NYT/Kitchen Stories on individual-recipe storytelling)

### Where WC is materially behind (0–1)
- **Recipe content depth (1):** ~50 curated seed recipes vs Samsung Food 160K, NYT 22K, Yummly historical 2M+. This is the single most-visible competitive weakness.
- **Monetization (0):** Premium tag exists in the schema; no payment integration, no paywall enforcement. **This is the leading risk to the business.**

---

## Phase 3 — Code Audit (Current State, File-Cited)

Source: direct inspection of `C:\Users\lasse\Desktop\whatscooking\src\` and `supabase\schema.sql`. **Legend: ✅ built · ⚠️ partial · ❌ missing.**

### Dim 1 — Recipe content depth & quality ⚠️ PARTIAL
- Schema includes `cuisine_type`, `dish_types`, `dietary_tags`, full macro fields (`protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`, `sodium_mg`), `prep_time_minutes`, `cook_time_minutes`, `ingredients` (JSONB) — `supabase/schema.sql:106–131`
- Instructions are a flat string array — `core_instruction` / `culinary_logic` / `pro_technique` fields **do not exist** in current schema despite earlier strategy docs assuming they did
- Only ~50 curated seed recipes — `supabase/seed.sql:1–100`

### Dim 2 — Recipe acquisition / import ✅ BUILT
- Photo extraction with Claude vision — `src/app/api/recipes/extract-from-image/route.ts:1–70`
- Pantry photo extraction (fridge/receipt) — `src/app/api/pantry/extract-from-photo/route.ts:1–70`
- Manual entry — `src/app/(app)/my-recipes/new`
- Social URL signal in UI (Instagram/TikTok/YouTube placeholders) — `src/components/social-import-form.tsx` — **no backend video import API**

### Dim 3 — AI assistance ✅ BUILT
- Recipe generation — `src/app/api/recipes/generate/route.ts:1–76`
- Meal-plan auto-gen with nutritional goals — `src/app/api/plans/generate/route.ts:1–100`
- Ingredient-based recipe search — `src/app/api/recipes/by-ingredients/route.ts:1–50`
- Substitution scoring (40+ groups, 0–1 sub_score) — `src/lib/ingredient-substitutes.ts:1–50`
- Dietary swap logic — `src/lib/dietary-substitutions.ts`
- **No conversational chat UI** despite a local LLM proxy stack being available

### Dim 4 — Meal planning ✅ BUILT
- Templates — `src/app/(app)/plans/new/plan-templates.ts`
- Detail / day-grid — `src/app/(app)/plans/[id]/page.tsx`
- Public sharing — `src/app/(app)/plans/share/[id]/page.tsx:1–60`
- Schema — `supabase/schema.sql:140–184`

### Dim 5 — Pantry & grocery ⚠️ PARTIAL
- Pantry UX — `src/app/(app)/pantry`
- Shared real-time pantry with Supabase channels — `src/app/(app)/pantry/shared-pantry-tab.tsx:1–60`
- Shopping list — `src/app/(app)/shopping-list/page.tsx`
- `pantry_items.expires_at` field exists but no UI / logic surfaces expiry — **expiry intelligence is a present-but-unused field**
- **No barcode scanning** (zero grep hits)
- **No grocery delivery integration** (Instacart / Amazon Fresh / Kroger / Walmart — zero grep hits)

### Dim 6 — Household / social ✅ BUILT
- Multi-user household — `src/app/(app)/household/page.tsx:1–17`
- Family hub — `src/app/(app)/family/page.tsx:1–50`
- Age groups + milestones + allergens — `src/lib/family-types.ts:1–100`
- Allergen API — `src/app/api/family/allergens/route.ts:1–80`
- Dinner parties — `src/app/api/dinner-parties/route.ts:1–60`
- Realtime collaboration — `src/app/(app)/pantry/shared-pantry-tab.tsx`
- **No public profile or follow/feed system** — sharing is link-based only

### Dim 7 — Nutrition & health ⚠️ PARTIAL
- Calorie tracker, daily/weekly graphs, weight logs — `src/app/(app)/calorie-tracker/page.tsx:1–37`
- Nutritional goals on user + plan — `src/lib/types.ts:27–43`
- Allergen safety + baby-adaptation — `src/app/api/family/adapt-recipe`
- **No wearable integration** (HealthKit / Apple Health / Fitbit / Garmin — zero grep hits)

### Dim 8 — Editorial / cultural ✅ BUILT
- Cuisine atlas with 100+ entries grouped by region — `src/app/(app)/cuisines/page.tsx:1–80`
- World Cup 2026 nations + cuisine mappings — `src/app/(app)/world-cup-2026/page.tsx:1–60`
- Cookbooks (user-created collections, chapters) — `src/app/(app)/cookbooks/page.tsx`
- YouTube embed component — `src/components/cooking-tip.tsx`
- **No seasonality / occasion tagging** in recipe schema

### Dim 9 — Monetization & business model ⚠️ PARTIAL → effectively ❌
- Premium page filters recipes by `dish_types` containing `"premium"` — `src/app/(app)/premium/page.tsx:1–17`
- **No Stripe / Paddle / RevenueCat integration** (zero grep hits)
- **No paywall enforcement** — premium recipes are tagged but accessible to anyone
- **No subscription state in user_preferences or auth**

**Score the score:** Built ✅×5 · Partial ⚠️×4 · Missing ❌×0. The "partials" mask the single business-critical gap: monetization is functionally missing despite being labeled partial.

---

## Phase 4 — Ecosystem Reimagination

### The unifying narrative

> **What's Cooking is the only cooking app built around your household, not your phone.**

Everyone else — Samsung Food, Paprika, NYT Cooking, Crouton, ChefGPT, Mealime — treats cooking as a single user, a single device, a single recipe. AnyList is the only product that models a household, and only on grocery lists. WC is the only product that models the *whole kitchen as a shared space*: real-time pantry, ages-and-milestones-aware family members, allergen-safe planning, multi-user dinner parties, shared meal plans. The narrative is not "AI in the kitchen" or "recipes you'll love" — it's **"one app for everyone who eats at this address."**

### From 25+ routes to 5 pillars

Current information architecture is sprawling: `dashboard`, `discover`, `recipes`, `recipes/[id]`, `pantry`, `shopping-list`, `plans`, `plans/[id]`, `plans/share/[id]`, `saved`, `household`, `household/[id]`, `family`, `family/members`, `family/recipes`, `family/guides`, `dinner-parties`, `dinner-parties/[id]`, `events`, `events/[id]`, `cuisines`, `cuisines/[slug]`, `world-cup-2026`, `menu-scanner`, `swipe`, `cookbooks`, `cookbooks/[slug]`, `my-recipes`, `meals`, `meals/[id]`, `calorie-tracker`, `drinks`, `profile`, `settings`, `premium`, `reports`. That's a 30+ surface with overlap and unclear hierarchy.

Compress into **5 pillars + a personal lobby:**

```
What's Cooking
├── Today          ← personal lobby: what's for dinner, what's expiring, what's missing
│
├── 1. KITCHEN     ← the shared household state
│   ├── Pantry (shared, real-time, expiry-aware)
│   ├── Shopping List (shared, real-time, aisle-sorted)
│   └── Fridge Scan (photo → pantry)
│
├── 2. RECIPES     ← everything recipe-shaped
│   ├── Browse (curated + cuisine atlas + cookbooks + WC2026)
│   ├── My Recipes (manual + imported + AI-generated)
│   ├── Import (URL · photo · social video · book scan)
│   └── Make Now (ingredient-led, "what can I cook tonight?")
│
├── 3. PLAN        ← time-anchored cooking
│   ├── Week (auto-gen + templates + drag-drop)
│   ├── Occasions (merge: dinner parties + events + WC2026 fixtures)
│   └── History (past meals + ratings + leftovers)
│
├── 4. LEARN       ← editorial + technique + culture
│   ├── Cuisines (100+ regional + WC2026 atlas)
│   ├── Techniques (videos, knife skills, fermentation)
│   └── Coach (conversational AI chef — chat UI on local LLM stack)
│
└── 5. HOUSEHOLD   ← people, not features
    ├── Members (ages, milestones, allergens, preferences)
    ├── Family Milestones (kids cooking progression)
    └── Profile & Settings
```

**Routes that collapse or sunset:**
- `dinner-parties` + `events` + `world-cup-2026` fixtures → **PLAN > Occasions** (one calendar surface; event type is metadata, not a separate app)
- `family/recipes` + `family/guides` + `family/members` → **HOUSEHOLD > Members** (recipes filter by milestone, not by a separate route)
- `saved` + `my-recipes` + `cookbooks` → **RECIPES > My Recipes** with a "Cookbook" view-mode (don't make users learn three save mechanisms)
- `swipe` → soft-deprecate; becomes a *mode* of RECIPES > Browse, not a destination
- `menu-scanner` → **RECIPES > Import > From Photo** (it's an import vector, not a feature category)
- `meals` → **PLAN > History** (eating happens on the time axis)
- `drinks` → just a cuisine/category filter, not a separate pillar
- `calorie-tracker` → **TODAY** widget + optional drawer (most users won't engage daily; surface it where it gets ambient attention)

**Pillars worth adding (with leverage rationale):**
- **Coach (under LEARN):** Conversational AI chef chat UI. The local LLM stack already exists. ChefGPT charges $2.99/mo for a worse version. This is a 2-week build that unlocks a major premium feature.
- **Make Now (under RECIPES):** Hero-mode for "I'm hungry and have these ingredients" — already exists as `/api/recipes/by-ingredients` but is not surfaced as a first-class moment. This is the single most-shared cooking-app moment on TikTok ("what to make with X, Y, Z"). It deserves a dedicated pillar entry.
- **Import unification (under RECIPES):** Today there are 3 import vectors (URL, photo, manual) and 2 placeholder vectors (TikTok/Instagram video, cookbook scan). Crouton's whole differentiation is share-sheet + AI book scan. WC has the AI to match; just needs the UX.

**Pillars to NOT add (false leverage):**
- **No public social feed.** Adds moderation overhead, doesn't compound the household moat, and Samsung Food's Communities feature is a documented weakness, not a strength.
- **No wearable / HealthKit integration.** Low engagement vs effort; MyFitnessPal owns this category and meal-plan apps that try to compete consistently lose.
- **No first-party grocery delivery.** Instacart and Amazon Fresh are commodity integrations; building one is high-lift; the *aggregation* moment (assemble shopping list, then hand off) is already covered.

---

## Phase 5 — SEO + Content Gap Brief

### Where the traffic actually goes

Of the top 5 SEO competitors:
- **NYT Cooking** owns **editorial collections + holiday hubs + named-author SEO** (Melissa Clark, Sam Sifton, Eric Kim, Ottolenghi) and the *Fast Dinners* newsletter. Their irreplaceable asset is named-byline trust.
- **Yummly** (now KitchenAid) historically owned **semantic faceted search** — dietary restriction × cuisine × prep-time × technique combinations. Still ranks on legacy URLs.
- **Samsung Food** plays a weak SEO game — they're a product story, not a content destination. Their long-tail is community-uploaded recipes with inconsistent quality.
- **Kitchen Stories** owns **video-first technique tutorials** and **European baking depth** (cupcakes, tiramisu, knödel, schnitzel).
- **Mealime** has effectively zero SEO surface — they compete on product, not Google.

### 15 evergreen content topics that consistently rank

| # | Topic | Why it ranks | Current owner | WC differentiation angle |
|---|---|---|---|---|
| 1 | 30-minute weeknight dinners | Universal time-poor demand | NYT, Food Network | Filter by **what's in fridge** (uses real pantry) |
| 2 | Meal prep / Sunday prep | Steady year-round, January spike | Budget Bytes, EatingWell | Household-scaled prep + shopping-list export |
| 3 | Leftover [protein] recipes | Predictable Mon/Tue + Nov–Dec | Taste of Home, Inspired Taste | Reverse-search from pantry inventory |
| 4 | "What to make with [ingredient]" | Highest-intent recipe class | AllRecipes, Food Network | Multi-ingredient combos from real pantry |
| 5 | Sheet-pan / one-pot dinners | Minimal-cleanup angle | Budget Bytes, NYT | Difficulty + equipment filter |
| 6 | Slow-cooker / Instant Pot | Appliance-anchored long-tail | AllRecipes | Cross-appliance conversion (built once, ranks forever) |
| 7 | Thanksgiving / Christmas menus | Q4 traffic monster | NYT (dominant) | Oven-Tetris timer + household-scaled servings |
| 8 | Keto / low-carb | Stable diet demand | Diet Doctor, AllRecipes | Macro-tunable variants per member |
| 9 | High-protein meal prep | Rising '24–'26 (GLP-1 era) | EatingWell, Tasty | Per-serving macros + grocery cost |
| 10 | Vegan / vegetarian dinners | Steady + Veganuary spike | Minimalist Baker, Kitchen Stories | Plant-based-by-default substitution engine |
| 11 | Gluten-free [category] | Long-tail, monetizes well | King Arthur, Minimalist Baker | Cross-tag with kid-friendly + quick |
| 12 | Air-fryer recipes | Persistent since 2019 | AllRecipes, Skinnytaste | "Convert any recipe to air-fryer" mode |
| 13 | 5-ingredient / beginner recipes | Beginner entry, high CTR | Pinch of Yum, BBC Good Food | Skill-progression learning path tied to family milestones |
| 14 | Healthy [cuisine] bowls | Bowl format = engagement | EatingWell, NYT | Build-your-own bowl generator |
| 15 | Budget dinners under $X | Recession-proof, permanent | Budget Bytes (definitive) | Live grocery-price-aware tier |

### Schema.org / structured-data table stakes

All top-5 publishers ship `schema.org/Recipe` JSON-LD with `name`, `image`, `recipeIngredient`, `recipeInstructions`, `prepTime`, `cookTime`, `totalTime`, `recipeYield`, `aggregateRating`, `NutritionInformation`, and on Kitchen Stories + NYT, `VideoObject`. Pages with full schema see ~82% higher CTR vs unmarked ([recipekit.com](https://recipekit.com/pages/recipe-seo-structured-data)). **Current WC recipe pages do not appear to emit JSON-LD** — Phase 7 includes this as a quick win.

### Ranked content opportunities for WC (the gap brief)

The intersection of "what ranks evergreen" + "where WC has a unique angle" produces this ordered opportunity list. **Topic → effort → est. traffic value → why WC has an angle:**

1. **"What to cook with [ingredient X]" programmatic pages** — L · ★★★★★ · WC has live pantry-driven search. Build 200 programmatic landing pages (200 most-searched ingredients).
2. **Leftover [protein] hub** — M · ★★★★ · WC's by-ingredients API is purpose-built for this.
3. **Household-scaled holiday menus** — M · ★★★★ · WC's household + dinner-parties + Occasions pillar unique here.
4. **Air-fryer / Instant Pot conversion tool + content** — M · ★★★ · LLM substitution + technique conversion already in stack.
5. **Cuisine atlas evergreen pages** — S · ★★★ · 100+ cuisines × structured-data overhaul = SEO arbitrage on existing content.
6. **WC2026 sponsored recipe content** — S · ★★ · Already built; needs SEO finish + structured data. Q1 2026 traffic spike imminent.
7. **Beginner skill paths tied to family milestones** — L · ★★ · Unique angle nobody covers (kid-progression cooking content). Slow burn.

---

## Phase 6 — Marketing Positioning + Monetization

### One-liner / three-liner / elevator

- **One-liner:** *What's Cooking is the only cooking app built around your household, not your phone.*
- **Three-liner:** *Most cooking apps assume one user, one fridge, one taste. What's Cooking knows there are kids, allergens, schedules, and someone who hates cilantro — and it plans around all of them. Real-time shared pantry, AI meal plans that respect every member, one app for everyone who eats at this address.*
- **Elevator (60s):** "Cooking apps treat you like a single user. But real kitchens have toddlers learning to eat solids, a partner on keto, a teenager allergic to peanuts, and Sunday dinners with guests. What's Cooking is the first app that models all of it — a real-time shared pantry every household member can update, AI meal plans tuned to everyone's diet and milestones, dinner parties with built-in guest management, and a recipe library that respects allergens. Solo apps charge you to be alone. We charge one household price, and everyone in the kitchen gets it."

### Acquisition channels ranked by fit (highest signal first)

1. **Yummly refugee campaign** — Live, urgent, addressable. A demonstrable migration path ("Lost your Yummly favorites? Here's why this won't happen again.") with a free lifetime tier for verified former Yummly users. **Launch within 30 days.**
2. **TikTok "what's in my fridge → recipe" virality** — Native to the platform; the by-ingredients flow is literally the meme format. Partner with 3 mid-tier food creators on a "fridge scan" stitch trend.
3. **Reddit seeding (r/MealPrepSunday, r/EatCheapAndHealthy, r/MealPlanning, r/SlowCooking, r/Cooking)** — Long-term, not paid; one detailed post per week from a real account in the right subreddits about specific household-cooking problems WC solves. Compounds slowly but cheaply.
4. **App Store SEO** — Title keyword pack: "Meal Plan · Pantry · Family · Shopping List · Recipes" — match category-leader keyword stacks. Refresh every 60 days based on rankings.
5. **Cookware-brand partnership (long-shot)** — One Le Creuset / KitchenAid / Lodge co-branded content drop for legitimacy halo. Higher status game; only worth it once monetization is live.
6. **YouTube creator partnerships** — Hand creators a "branded shopping list" feature: their recipes auto-import to WC with one click. Drives signups + recipe library growth simultaneously.

### Monetization model recommendation

**Three tiers, anchored on the household price point because the household is the moat:**

| Tier | Price | What's included | Target |
|---|---|---|---|
| **Free** | $0 | 1 user, up to 25 saved recipes, 1 meal plan at a time, manual pantry, basic recipe search | Trial / passive users |
| **Solo Plus** | $4.99/mo or $39.99/yr | Unlimited recipes, AI gen, plan auto-gen, import, conversational Coach | Single users (matches Samsung Food) |
| **Household** | $7.99/mo or $59.99/yr | Everything in Solo Plus + unlimited members + shared pantry + dinner parties + family milestones | Households (the moat tier) |
| **Lifetime** | $99 one-time | Everything in Household, forever | Yummly refugees + Paprika fans who hate subscriptions |

**Rationale:**
- Solo Plus at $4.99/mo matches Samsung Food's price exactly — anchoring you in the market without a price war.
- Household at $7.99/mo is **80% below NYT Cooking Family's $30/mo** and **6× AnyList's $14.99/yr ceiling** — that's a defensible middle: cheap enough to feel fair for a household, expensive enough that ARPU works.
- Lifetime at $99 is the **trust play**. Yummly's shutdown burned a generation of users. Paprika's $30 lifetime model is widely beloved. A $99 lifetime tier signals "we will not vanish on you" — which is the single most valuable marketing message in the category right now.
- **No free tier with shared pantry.** The household feature is the moat; gate it behind paid. Free users get the discovery + saving experience; everything that compounds the household state is paid.

### Creator / marketplace proposal

Echoing VenturePath's VentureVault model, add a **Cookbook Marketplace v1** in Q3 2026:
- Verified Architects (creators) publish Cookbooks (curated recipe collections with chapters + Architect intro essay + suggested meal plan)
- Free Cookbooks ship in the regular library
- Premium Cookbooks ($2.99–$9.99 one-time) gated behind purchase, **70/30 revenue split to the creator**
- Two leverage points: (1) brings creator gravity into the app, (2) gives WC a non-subscription revenue line that scales with content, not seats

**Risk:** marketplaces are heavy lifts. Do **NOT** launch this in 90 days. Tee it up in roadmap quarter 3 once monetization v1 is enforced and the user base is large enough that creators have an audience.

### 10 growth experiments ranked by 30-day testability

| # | Experiment | Effort | Hypothesis |
|---|---|---|---|
| 1 | Yummly refugee landing page + import flow | S | 5–10% of refugees who land convert to free; 15% of those upgrade in 30 days |
| 2 | TikTok "fridge scan" creator stitch (3 creators) | S | Drives 50K impressions, 2K signups in first cohort |
| 3 | Programmatic 200 "what to cook with X" pages | M | Compound SEO; first traffic in 60 days |
| 4 | Conversational Coach chat UI release | M | Premium upgrade conversion +15% (anchor product moment) |
| 5 | Lifetime tier launch on Product Hunt | S | One-day spike + permanent "trust" marketing asset |
| 6 | Reddit "shared pantry saved my marriage" testimonial post in r/MealPrepSunday | S | Free; 10K upvotes ceiling; signals product-market fit |
| 7 | Add schema.org/Recipe JSON-LD across all recipe pages | S | SERP CTR +30% by week 6 |
| 8 | Holiday meal-plan campaign (Thanksgiving 2026, US English) | M | One-shot annual; demonstrates household scaling |
| 9 | Free for 1 year for verified teachers (Q3 campaign) | S | Word-of-mouth via the most-recommend-y demographic |
| 10 | Embed-anywhere recipe widget for food bloggers (white-labeled) | L | Long-tail backlinks + B2B optionality |

---

## Phase 7 — Prioritized 90-Day Roadmap

Sorted by `(impact × confidence) ÷ effort`. Effort: S = 1–3 days · M = 1–2 weeks · L = 3–6 weeks. Impact and confidence on 1–5 scales.

| # | Move | Tag | Effort | Impact | Confidence | Score | Why it matters |
|---|---|---|:-:|:-:|:-:|:-:|---|
| 1 | Stripe integration + enforce premium paywall | feature/pricing | M | 5 | 5 | **25/M** | Currently zero revenue capture. Premium tag exists; gating is missing. Unblocks the entire business. |
| 2 | Schema.org/Recipe JSON-LD on all recipe pages | SEO | S | 4 | 5 | **20/S** | One-day work; +30% SERP CTR by week 6. Required to compete on Google at all. |
| 3 | Yummly refugee landing page + free-tier import flow | growth/marketing | S | 5 | 4 | **20/S** | Addressable, urgent, fading. Hook lapsed users into the lifetime tier. |
| 4 | Expiry intelligence on pantry (sort, warn, suggest) | feature | S | 4 | 5 | **20/S** | `expires_at` field already exists. Pure UI/logic surface. Unique vs Mealime (zero pantry intel). |
| 5 | Conversational Coach chat UI (uses existing local LLM proxy) | feature | M | 4 | 4 | **16/M** | 2-week build that lets WC charge what ChefGPT charges, with better quality. Premium-tier anchor moment. |
| 6 | Scale recipe library 50 → 5,000 (Spoonacular import + AI fill) | content | M | 5 | 4 | **20/M** | Single biggest competitive weakness on the matrix. Closes Dim-1 gap from 1 → 2.5. |
| 7 | Lifetime tier launch ($99) — Product Hunt drop | growth/pricing | S | 5 | 3 | **15/S** | One-shot trust-signal launch; permanent marketing asset; PR-friendly post-Yummly. |
| 8 | Make Now hero surface (`/api/recipes/by-ingredients` promoted to pillar) | design/feature | M | 4 | 4 | **16/M** | The TikTok-native cooking moment. WC's by-ingredients API is best-in-class but invisible. |
| 9 | Top 50 programmatic SEO pages ("what to cook with [X]") | SEO/content | M | 4 | 3 | **12/M** | First 50 of a 200-page batch. Compounds for years. Tests the pattern before scaling to 200. |
| 10 | Video recipe import (TikTok / Instagram / YouTube → recipe) | feature | L | 4 | 3 | **12/L** | Highest virality moment in the category. Unblocks creator partnerships. Long build but defensible. |

### Why this order

- The top 4 are all `S/M` effort, ≥4 impact, ≥4 confidence. **None of them is interesting.** They're table-stakes: charge money, get SEO basics right, claim refugees, surface a field you already have. Boring is correct here.
- The next 4 are bets, not table stakes: Coach, recipe scaling, Lifetime tier, Make Now pillar.
- The final 2 are larger bets that need the prior 8 in place to be worth the effort.
- **Total estimated effort:** 11 weeks of one engineer, fits in 90 days with one focused builder.

### Explicit do-NOT list

- **Do not** build wearable / HealthKit integration. Low engagement, MyFitnessPal owns it, doesn't compound household moat.
- **Do not** integrate grocery delivery APIs (Instacart, Kroger). High partnership lift, US-only, doesn't compound moat.
- **Do not** launch a public social feed / follow graph. Adds moderation overhead. Samsung Food's Communities is a documented weakness.
- **Do not** invest in first-party video tutorials in Q1–Q2. Kitchen Stories owns the category; partner with creators instead.
- **Do not** launch the Cookbook Marketplace in Q1. Right idea, wrong quarter — needs monetization v1 enforced + user base scale first.
- **Do not** rename pillars or refactor IA before charging money. Pillar reimagination (Phase 4) is the Q2 project, not Q1. Currency comes first; clarity second.

---

## Appendix A — Source data integrity notes

- Yummly status: shut down as a consumer app Dec 20, 2024 ([Plan to Eat](https://www.plantoeat.com/blog/2024/12/yummly-is-closing-discover-the-best-meal-planning-alternative/)). Domain partially relaunched as KitchenAid-branded property; treat as inactive competitor for product purposes but **a live marketing opportunity** as a refugee pool.
- Samsung Food 500K MAU figure: source month is ambiguous in [SamMobile coverage](https://www.sammobile.com/news/samsung-food-update-massive-gift-free-users/); treat as 2025 milestone.
- Plant Jammer "200M cooks" figure cited in some 2024 press is from a self-described *fictional future-state* press release. Excluded from this audit's calculus.
- NYT Cooking subscriber count is not broken out publicly; only parent NYT 12.3M+ is disclosed.
- The agent that ran Phase 5 SEO had WebFetch disabled; schema.org confirmation on competitor pages is inferred from documented patterns (Google Recipe rich-result requirements + competitor publishing practices), not direct DOM inspection. Re-verifying with live JSON-LD dumps is recommended before committing to a competitive schema strategy.

## Appendix B — Verification checklist for review

Before any roadmap item moves to implementation:
- [ ] User has read the executive summary and either accepts or revises the one-sentence positioning
- [ ] User has accepted, modified, or rejected the 5-pillar IA reimagination
- [ ] User has accepted, modified, or rejected the three-tier pricing structure ($4.99 / $7.99 / $99)
- [ ] Each Phase 7 item that gets greenlit goes through its own `/brainstorming` → spec → plan → implement cycle. **No skipping the design loop on the basis that the audit already approved the move.**
- [ ] Phase 7 item #1 (Stripe + paywall enforcement) is shipped before any other Phase 7 item. The audit's central thesis is that monetization is the gating risk; allowing other items to ship first concedes the thesis.
