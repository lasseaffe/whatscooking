"use client";

import { useState } from "react";
import {
  Refrigerator,
  Snowflake,
  Flame,
  Leaf,
  ShoppingCart,
  ChefHat,
  Check,
  PartyPopper,
  ChevronDown,
  ChevronUp,
  Container,
} from "lucide-react";

// ─── Data layer ──────────────────────────────────────────────────────────────

type RecipeCategory = "meat" | "fish" | "pasta" | "rice" | "soup" | "salad" | "baked" | "curry" | "general";

interface StorageGuide {
  category: RecipeCategory;
  label: string;
  emoji: string;
  fridgeDays: { min: number; max: number };
  freezerMonths: { min: number; max: number };
  container: string;
  reheatingMethod: string;
  zeroWasteTip: string;
  shoppingTip: string;
  cookAgainIdea: string;
  doNotStore?: string;
}

const STORAGE_DATA: Record<RecipeCategory, StorageGuide> = {
  meat: {
    category: "meat", label: "Meat Dish", emoji: "🥩",
    fridgeDays: { min: 3, max: 4 },
    freezerMonths: { min: 2, max: 3 },
    container: "Airtight glass or BPA-free container",
    reheatingMethod: "Oven at 165°C covered with foil to retain moisture, or low stovetop with a splash of broth",
    zeroWasteTip: "Slice leftovers thin for wraps and sandwiches the next day — avoids the 'same meal' feeling. Bones and scraps make rich stock.",
    shoppingTip: "Buy larger cuts and portion before cooking — whole chickens are ~40% cheaper per kg than breasts.",
    cookAgainIdea: "Turn into a taco filling, rice bowl, or add to fried rice.",
    doNotStore: "Never leave cooked meat at room temperature for more than 2 hours.",
  },
  fish: {
    category: "fish", label: "Fish / Seafood", emoji: "🐟",
    fridgeDays: { min: 1, max: 2 },
    freezerMonths: { min: 1, max: 2 },
    container: "Sealed container or wrap tightly in cling film",
    reheatingMethod: "Wrapped in damp paper towel in microwave at 50% power, or steamed gently — never reheat to full boil",
    zeroWasteTip: "Fish bones and heads make excellent light stock — simmer with aromatics for 20 min, strain and freeze.",
    shoppingTip: "Frozen fish fillets are equally nutritious and typically 30–50% cheaper than fresh.",
    cookAgainIdea: "Flake into fish cakes, pasta, or a Thai-style fish salad with lime and herbs.",
    doNotStore: "Fish deteriorates quickly — freeze if not eating within 24 hours.",
  },
  pasta: {
    category: "pasta", label: "Pasta Dish", emoji: "🍝",
    fridgeDays: { min: 3, max: 5 },
    freezerMonths: { min: 2, max: 2 },
    container: "Airtight container — store sauce separately if possible",
    reheatingMethod: "In a pan with a splash of pasta water or extra sauce over medium heat; microwave covered with a damp towel",
    zeroWasteTip: "Cold pasta makes an excellent frittata base — mix with beaten eggs, vegetables, and bake at 180°C for 20 min.",
    shoppingTip: "Dried pasta keeps for 2 years — bulk buy during sales. Make your own sauce and freeze in portions.",
    cookAgainIdea: "Bake with béchamel as a pasta gratin, or toss cold as a pasta salad.",
  },
  rice: {
    category: "rice", label: "Rice Dish", emoji: "🍚",
    fridgeDays: { min: 4, max: 6 },
    freezerMonths: { min: 1, max: 2 },
    container: "Shallow airtight container to cool quickly",
    reheatingMethod: "Microwave with a damp paper towel on top; or steam with a tablespoon of water",
    zeroWasteTip: "Cool rice within 1 hour of cooking and refrigerate immediately — day-old rice makes the best fried rice.",
    shoppingTip: "Buy rice in large bags — a 5 kg bag can be 60% cheaper per serving than small packets.",
    cookAgainIdea: "Day-old rice is perfect for fried rice, arancini balls, or rice pudding.",
    doNotStore: "Rice harbours Bacillus cereus — never leave at room temperature overnight.",
  },
  soup: {
    category: "soup", label: "Soup / Stew", emoji: "🍲",
    fridgeDays: { min: 4, max: 5 },
    freezerMonths: { min: 3, max: 4 },
    container: "Tall airtight container or freezer bags laid flat",
    reheatingMethod: "Stovetop over medium heat, stirring occasionally — soups heat evenly and gently this way",
    zeroWasteTip: "Freeze in muffin tins for perfect single-serve portions. Rinsed parmesan rinds add incredible depth to soups.",
    shoppingTip: "Soups are the best way to use up soft vegetables before they go off — they're budget meals by nature.",
    cookAgainIdea: "Blend leftover chunky soup into a smooth purée; add cream or coconut milk to transform the flavour.",
  },
  salad: {
    category: "salad", label: "Salad", emoji: "🥗",
    fridgeDays: { min: 1, max: 3 },
    freezerMonths: { min: 0, max: 0 },
    container: "Open bowl covered with a damp cloth, or sealed bag with air removed",
    reheatingMethod: "No reheat needed — dress just before eating to keep leaves crisp",
    zeroWasteTip: "Store dressing separately to prevent wilting. Wilted greens can be revived in ice water for 10 min.",
    shoppingTip: "Whole heads of lettuce last 2–3× longer than pre-cut bags and cost less per serving.",
    cookAgainIdea: "Wilted salad greens can be sautéed as a side or blended into a green smoothie.",
  },
  baked: {
    category: "baked", label: "Baked Good", emoji: "🍞",
    fridgeDays: { min: 3, max: 7 },
    freezerMonths: { min: 2, max: 3 },
    container: "Wrapped in beeswax wrap or stored in a bread bin for bread; airtight tin for cakes",
    reheatingMethod: "Oven at 160°C for 8–12 min brings bread back to life; microwave cake briefly with a glass of water next to it",
    zeroWasteTip: "Stale bread → breadcrumbs, croutons, panzanella, or French toast. Nothing needs to be wasted.",
    shoppingTip: "Bake double batches and freeze half — homemade is 3–5× cheaper than bakery per slice.",
    cookAgainIdea: "Stale cake crumbled makes a great trifle layer or ice cream topping.",
  },
  curry: {
    category: "curry", label: "Curry", emoji: "🍛",
    fridgeDays: { min: 3, max: 4 },
    freezerMonths: { min: 2, max: 3 },
    container: "Airtight container — curry stains plastic, so prefer glass",
    reheatingMethod: "Stovetop over low heat, adding a small splash of water or coconut milk to loosen the sauce",
    zeroWasteTip: "Curries deepen in flavour overnight — leftovers are often the best meal. Freeze in portions for a quick weeknight dinner.",
    shoppingTip: "Build a spice collection gradually — whole spices last years and grinding fresh is far cheaper than pre-ground.",
    cookAgainIdea: "Use leftover curry as a pie filling, jacket potato topping, or wrap with rice and chutney.",
  },
  general: {
    category: "general", label: "Mixed Dish", emoji: "🍽️",
    fridgeDays: { min: 3, max: 4 },
    freezerMonths: { min: 1, max: 3 },
    container: "Airtight container — label with today's date",
    reheatingMethod: "Reheat to 75°C internal temperature throughout; stir halfway if microwaving",
    zeroWasteTip: "Label all containers with the date. When in doubt, freeze rather than leave in the fridge.",
    shoppingTip: "Plan meals before shopping and buy only what you need — impulse buying causes most food waste.",
    cookAgainIdea: "Most leftovers can become a new meal with a different grain, sauce, or fresh herb.",
  },
};

// ─── Category detection ───────────────────────────────────────────────────────

function detectCategory(title: string, ingredients: { name: string }[]): RecipeCategory {
  const text = [title, ...ingredients.map((i) => i.name)].join(" ").toLowerCase();

  if (/curry|korma|tikka|masala|dal|rendang|vindaloo/.test(text)) return "curry";
  if (/soup|stew|broth|chowder|bisque|bouillabaisse/.test(text)) return "soup";
  if (/cake|bread|muffin|cookie|pastry|bak|scone|loaf|biscuit|tart|pie/.test(text)) return "baked";
  if (/salad|lettuce|greens|spinach bowl|coleslaw/.test(text)) return "salad";
  if (/pasta|spaghetti|penne|fettuccine|linguine|rigatoni|lasagna|gnocchi/.test(text)) return "pasta";
  if (/\bnoodle|ramen|udon|soba|pad thai/.test(text)) return "pasta";
  if (/rice|risotto|pilaf|paella|biryani|fried rice/.test(text)) return "rice";
  if (/fish|salmon|tuna|cod|trout|halibut|shrimp|prawn|seafood|crab|scallop/.test(text)) return "fish";
  if (/chicken|beef|pork|lamb|steak|turkey|veal|duck|mince|ground meat/.test(text)) return "meat";
  return "general";
}

// ─── Cleanup data ─────────────────────────────────────────────────────────────

const CLEANUP_TIPS = {
  dishwasher: {
    safe: ["Ceramic plates & bowls", "Glass containers & mugs", "Stainless steel pots & pans", "Silicone utensils & molds", "Plastic containers (top rack)"],
    noGo: ["Cast iron — strips seasoning", "Wooden boards & spoons — crack and warp", "Sharp knives — dulls the blade", "Non-stick pans — damages coating", "Copper & hand-painted items"],
  },
  handwash: {
    safe: ["Cast iron — rinse hot, dry immediately, thin oil coat", "Non-stick pans — soft cloth, cool before washing", "Sharp knives — warm soapy water, dry at once", "Wooden items — quick wash, never soak", "Copper — use specialty paste cleaner"],
    noGo: ["Soaking cast iron — causes rust", "Abrasive sponges on non-stick", "Leaving wooden items wet", "Dishsoap on seasoned cast iron"],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  title: string;
  ingredients: { name: string }[];
}

export function ZeroWasteGuide({ title, ingredients }: Props) {
  const [open, setOpen] = useState(true);
  const [cleanupMode, setCleanupMode] = useState<"dishwasher" | "handwash">("dishwasher");
  const [kitchenReset, setKitchenReset] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const category = detectCategory(title, ingredients);
  const guide = STORAGE_DATA[category];
  const cleanup = CLEANUP_TIPS[cleanupMode];

  function handleKitchenReset() {
    setKitchenReset(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }

  return (
    <div className="space-y-3">
      {/* ── Section header / toggle ─────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(130,142,111,0.15)" }}>
          <Leaf className="w-3.5 h-3.5" style={{ color: "#828E6F" }} />
        </div>
        <span className="flex-1 text-sm font-semibold" style={{ color: "#EFE3CE" }}>
          Storage & Zero-Waste Guide
        </span>
        {/* Category badge */}
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(42,24,8,0.7)", color: "#8A7060" }}>
          {guide.emoji} {guide.label}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "#4A3020" }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#4A3020" }} />
        }
      </button>

      {open && (
        <div className="space-y-3">

          {/* ── Storage cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Fridge */}
            <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Refrigerator className="w-3.5 h-3.5" style={{ color: "#6B9FD4" }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B9FD4" }}>Fridge</span>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: "#EFE3CE" }}>
                {guide.fridgeDays.min}–{guide.fridgeDays.max} days
              </p>
              <div className="flex items-start gap-1.5 mt-2">
                <Container className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#4A3020" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#6B4E36" }}>{guide.container}</p>
              </div>
            </div>

            {/* Freezer */}
            <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Snowflake className="w-3.5 h-3.5" style={{ color: "#93C5FD" }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#93C5FD" }}>Freezer</span>
              </div>
              {guide.freezerMonths.max > 0 ? (
                <>
                  <p className="text-sm font-bold mb-1" style={{ color: "#EFE3CE" }}>
                    {guide.freezerMonths.min === guide.freezerMonths.max
                      ? `${guide.freezerMonths.max} months`
                      : `${guide.freezerMonths.min}–${guide.freezerMonths.max} months`}
                  </p>
                  <p className="text-xs" style={{ color: "#6B4E36" }}>Thaw overnight in fridge</p>
                </>
              ) : (
                <p className="text-sm" style={{ color: "#6B4E36" }}>Not suitable for freezing</p>
              )}
            </div>

          </div>

          {/* Reheat method */}
          <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="w-3.5 h-3.5" style={{ color: "#C8522A" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#C8522A" }}>Best Reheat Method</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#EFE3CE" }}>{guide.reheatingMethod}</p>
          </div>

          {/* Do-not-store warning */}
          {guide.doNotStore && (
            <div className="rounded-xl px-3.5 py-2.5 flex items-start gap-2"
              style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <span className="text-xs font-medium leading-relaxed" style={{ color: "#EF9E9E" }}>
                ⚠ {guide.doNotStore}
              </span>
            </div>
          )}

          {/* Zero-waste tip */}
          <div className="rounded-xl px-3.5 py-3 flex items-start gap-2.5"
            style={{ background: "rgba(130,142,111,0.08)", border: "1px solid rgba(130,142,111,0.2)" }}>
            <Leaf className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#828E6F" }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#A8B89A" }}>Zero-Waste Tip</p>
              <p className="text-xs leading-relaxed" style={{ color: "#828E6F" }}>{guide.zeroWasteTip}</p>
            </div>
          </div>

          {/* ── Shopping & Cook-again actions ──────────────────────── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Shopping tip */}
            <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#D97706" }}>Shopping Tip</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#8A6A4A" }}>{guide.shoppingTip}</p>
            </div>

            {/* Cook again idea */}
            <div className="rounded-xl p-3.5" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <ChefHat className="w-3.5 h-3.5" style={{ color: "#C8522A" }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#C8522A" }}>Cook Again</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#8A6A4A" }}>{guide.cookAgainIdea}</p>
            </div>

          </div>

          {/* ── Cleanup Concierge ──────────────────────────────────── */}
          <div className="rounded-xl p-4" style={{ background: "rgba(14,9,5,0.7)", border: "1px solid rgba(42,24,8,0.7)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#EFE3CE" }}>🧹 Cleanup Concierge</p>

            {/* Toggle */}
            <div className="flex rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(42,24,8,0.8)" }}>
              {(["dishwasher", "handwash"] as const).map((mode) => (
                <button key={mode} onClick={() => setCleanupMode(mode)}
                  className="flex-1 py-1.5 text-xs font-semibold transition-all capitalize"
                  style={{
                    background: cleanupMode === mode ? "#3A2416" : "transparent",
                    color: cleanupMode === mode ? "#EFE3CE" : "#4A3020",
                  }}>
                  {mode === "dishwasher" ? "🍽️ Dishwasher" : "🫧 Hand Wash"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "#828E6F" }}>✅ Safe</p>
                <ul className="space-y-1">
                  {cleanup.safe.map((item, i) => (
                    <li key={i} className="text-xs leading-snug" style={{ color: "#6B4E36" }}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "#C8522A" }}>⛔ No-Go</p>
                <ul className="space-y-1">
                  {cleanup.noGo.map((item, i) => (
                    <li key={i} className="text-xs leading-snug" style={{ color: "#6B4E36" }}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Kitchen reset button */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(42,24,8,0.6)" }}>
              {!kitchenReset ? (
                <button onClick={handleKitchenReset}
                  className="w-full py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#3A2416", color: "#EFE3CE" }}>
                  ✓ Kitchen Reset Complete
                </button>
              ) : (
                <div className="w-full py-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2"
                  style={{ background: "rgba(130,142,111,0.12)", color: "#828E6F", border: "1px solid rgba(130,142,111,0.25)" }}>
                  {showConfetti
                    ? <><PartyPopper className="w-3.5 h-3.5" /> Kitchen is sparkling! 🎉</>
                    : <><Check className="w-3.5 h-3.5" /> Reset complete — well done!</>
                  }
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
