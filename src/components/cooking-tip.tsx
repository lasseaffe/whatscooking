"use client";

import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Play, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

// ---------------------------------------------------------------------------
// Technique database
// Each entry has:
//   keywords: matched (case-insensitive) against the instruction step
//   tip: the pro tip text
//   illustration: optional JSX path for SVG diagram (rendered as inline SVG string key)
//   videoId: optional YouTube video ID (verified popular cooking tutorials)
//   videoTitle: title of the video
//   videoChannel: channel name
// ---------------------------------------------------------------------------
export interface Technique {
  id: string;
  icon: string;
  title: string;
  tip: string;
  detail: string;
  keywords: string[];
  videoId?: string;
  videoTitle?: string;
  videoChannel?: string;
  svgKey?: string; // references an illustration below
}

export const TECHNIQUES: Technique[] = [
  {
    id: "dice-onion",
    icon: "🧅",
    title: "How to dice an onion without crying",
    tip: "Chill the onion in the freezer for 15 minutes before cutting. Keep the root end intact while slicing — it holds the layers together.",
    detail: "Cut off the top, halve through the root, peel. Slice vertically toward the root (don't cut through), then horizontally, then crosswise for a perfect dice. A sharp knife is the biggest factor — a dull blade crushes cells and releases more irritants.",
    keywords: ["onion", "onions", "shallot", "shallots"],
    videoId: "7IXPK_c__6Y",
    videoTitle: "How to Chop an Onion",
    videoChannel: "Gordon Ramsay",
    svgKey: "onion-dice",
  },
  {
    id: "saute",
    icon: "🍳",
    title: "The secret to perfect sautéing",
    tip: "Hot pan, cold oil. The pan must be hot before the oil goes in — then the oil heats in seconds. Add food only when the oil shimmers, never when it smokes.",
    detail: "\"Sauté\" means to jump (French: sauter). The high heat creates the Maillard reaction — the browning that creates flavour. Don't crowd the pan: too much food drops the temperature and you steam instead of sear. Work in batches if needed.",
    keywords: ["sauté", "saute", "sautéing", "sauteing", "sauteed", "sautéed"],
    videoId: "Sd8PLfzEmrs",
    videoTitle: "How to Sauté",
    videoChannel: "America's Test Kitchen",
    svgKey: "saute",
  },
  {
    id: "caramelise-onion",
    icon: "🟤",
    title: "True caramelised onions take time",
    tip: "Real caramelised onions take 40–60 minutes on medium-low heat — not 10 minutes. Rushing on high heat burns the sugars instead of caramelising them.",
    detail: "Start with more onions than you think — they shrink to about ¼ of their volume. Add a pinch of salt early to draw out moisture. Stir every few minutes but resist the urge to crank the heat. A splash of balsamic or a tiny bit of sugar near the end deepens the colour.",
    keywords: ["caramelise", "caramelize", "caramelised", "caramelized", "caramelizing"],
    svgKey: "caramelise",
  },
  {
    id: "deglaze",
    icon: "🍷",
    title: "Deglazing — capturing all the flavour",
    tip: "The browned bits stuck to the pan (the fond) are the most flavourful part. Add your liquid to a hot pan and scrape immediately — it lifts instantly.",
    detail: "Wine, stock, vinegar, even water can deglaze. The liquid should sizzle dramatically when it hits the pan. Use a wooden spoon to scrape every bit of fond from the bottom. This is where soups and braises get their depth.",
    keywords: ["deglaze", "deglazing", "fond"],
    videoId: "fCqI0NuNY_A",
    videoTitle: "Deglazing a Pan",
    videoChannel: "Serious Eats",
  },
  {
    id: "sear",
    icon: "🥩",
    title: "The perfect sear",
    tip: "Pat meat completely dry before searing — moisture is the enemy of browning. A wet surface steams instead of searing, leaving you with grey, flavourless meat.",
    detail: "Use a heavy pan (cast iron is best). Get it screaming hot — a drop of water should evaporate instantly. Add a high smoke-point oil. Season generously just before the meat hits the pan. Don't move the meat for 2–3 minutes — let it release naturally.",
    keywords: ["sear", "searing", "brown the", "browning", "brown in batches", "browned"],
    videoId: "yEwzUV4VRlY",
    videoTitle: "How to Sear Meat",
    videoChannel: "Serious Eats",
    svgKey: "sear",
  },
  {
    id: "pasta-water",
    icon: "🍝",
    title: "Why pasta water is liquid gold",
    tip: "Save at least a cup of pasta water before draining. The starchy water is an emulsifier — it binds oil and sauce into a silky coating rather than a greasy puddle.",
    detail: "The starch released from pasta as it cooks is what makes the sauce cling. Add pasta water a little at a time while tossing — it thickens as it cools. This is why restaurant pasta is silkier: they use this technique religiously.",
    keywords: ["pasta water", "reserve", "pasta cooking water"],
  },
  {
    id: "rest-meat",
    icon: "⏱️",
    title: "Always rest your meat",
    tip: "Resting allows muscle fibres to relax and reabsorb juices. Cut immediately and those juices pour onto the board instead of staying in the meat.",
    detail: "Rule of thumb: rest for half the cooking time, minimum 5 minutes for a steak, 15 minutes for a roast, 30 minutes for a large bird. Tent loosely with foil to keep warm without steaming the crust.",
    keywords: ["rest", "resting", "let it rest", "rest before"],
  },
  {
    id: "fold",
    icon: "🥣",
    title: "Folding vs stirring",
    tip: "Folding means using a rubber spatula to gently turn the mixture over itself — never stir in circles. You're incorporating without deflating air.",
    detail: "Cut down through the middle with the spatula, scoop along the bottom, fold over the top. Rotate the bowl a quarter turn each stroke. Undermixing is better than overmixing — a few streaks are fine and will disappear in the oven.",
    keywords: ["fold", "folding", "fold in", "gently fold"],
  },
  {
    id: "garlic",
    icon: "🧄",
    title: "Getting the most out of garlic",
    tip: "Mince garlic and let it rest 10 minutes before cooking — this allows alliinase enzymes to develop allicin, the compound responsible for garlic's health benefits and depth of flavour.",
    detail: "Raw garlic is sharp and aggressive; briefly cooked (30 sec) is nutty and fragrant; long-cooked is sweet and mellow; burnt is bitter and ruins a dish. Watch it closely — garlic goes from perfect to burnt in under a minute.",
    keywords: ["garlic", "garlic clove", "minced garlic"],
    svgKey: "garlic",
  },
  {
    id: "blanch",
    icon: "🥦",
    title: "Blanching keeps vegetables vibrant",
    tip: "Plunge blanched vegetables immediately into ice water (shocking) to stop cooking. This preserves the brilliant green colour and crisp texture.",
    detail: "Blanching in generously salted water seasons the vegetables as they cook. The rapid temperature drop from ice water collapses enzymes that would otherwise cause fading and softening. This is also how restaurants keep broccoli looking electric green.",
    keywords: ["blanch", "blanching", "ice water", "shock"],
  },
  {
    id: "emulsify",
    icon: "🥗",
    title: "Making a stable emulsion",
    tip: "To emulsify oil and acid (for dressings, hollandaise), add the oil drop by drop at first while whisking constantly. Once stable, you can pour faster.",
    detail: "An emulsifier (mustard, egg yolk, lecithin) helps bind oil and water-based liquids that naturally separate. Mustard in a vinaigrette, yolk in mayo — both contain lecithin molecules with a fat-loving end and water-loving end that bridge the two phases.",
    keywords: ["emulsify", "emulsifying", "emulsification", "whisk in", "stream in", "drizzle in"],
  },
  {
    id: "season",
    icon: "🧂",
    title: "Season in layers, not just at the end",
    tip: "Add salt at every stage of cooking — to the oil, to the onions, to the liquid, to the final dish. Layering builds complexity; salting only at the end gives flat, surface-salty food.",
    detail: "Salt doesn't just make things taste salty — it suppresses bitterness, amplifies sweetness, and draws out moisture. Use kosher or flaked salt for seasoning (not table salt — the fine grains are denser and easy to over-season with). Taste as you go.",
    keywords: ["season", "seasoning", "generously", "adjust seasoning"],
  },
  {
    id: "knife-skills",
    icon: "🔪",
    title: "Knife safety & the claw grip",
    tip: "Curl your fingertips under to form a claw. The knuckles guide the blade — they act as a guard. This technique is taught in every culinary school worldwide.",
    detail: "The non-dominant hand should always use the claw grip: fingertips curled, thumb tucked, knuckles resting against the flat of the blade. Keep the tip of the knife on the board and rock the blade — don't chop up and down. A sharp knife is safer than a dull one.",
    keywords: ["chop", "chopping", "slice", "slicing", "dice", "dicing", "mince", "mincing", "julienne", "cut"],
    videoId: "XbZ3FpEA6-E",
    videoTitle: "Knife Skills 101",
    videoChannel: "Ethan Chlebowski",
    svgKey: "knife",
  },
  {
    id: "brown-butter",
    icon: "🧈",
    title: "Brown butter — the easiest upgrade",
    tip: "Brown butter (beurre noisette) is regular butter cooked until the milk solids toast to a nutty, hazelnut aroma. It takes 3 minutes and improves almost anything.",
    detail: "Use a light-coloured pan so you can see the colour change. Melt butter over medium heat, swirling constantly. It will foam, the foam will subside, then brown flecks will appear on the bottom and the smell becomes nutty. Take off the heat immediately — it goes from brown to burnt in seconds.",
    keywords: ["brown butter", "browning butter", "beurre noisette"],
  },
  {
    id: "boil-pasta",
    icon: "🫙",
    title: "Properly salting pasta water",
    tip: "Pasta water should taste like the sea — genuinely salty, not just a pinch. Use about 10g salt per litre. This is your only chance to season the pasta itself.",
    detail: "Despite the myth, salt does not meaningfully raise the boiling point of water. Its only job here is flavour. Well-salted pasta water means you need less sauce and less added salt at the table. The water should taste pleasantly salty when you dip a spoon in.",
    keywords: ["salted water", "well-salted", "boiling water", "salt the water", "pasta"],
  },
  {
    id: "whisk-eggs",
    icon: "🥚",
    title: "Tempering eggs to avoid scrambling",
    tip: "When adding eggs to a hot liquid, add the hot liquid to the eggs slowly, a little at a time, while whisking — never the other way around. This gradually raises their temperature without cooking them.",
    detail: "Eggs scramble at around 73°C (163°F). Tempering bridges the temperature gap: you add a spoonful of hot liquid to the yolks, whisk, add another spoonful, and so on. After 3–4 additions, the egg mixture is warm enough to add back to the hot pan without curdling.",
    keywords: ["temper", "tempering", "whisk in", "egg yolk", "yolk", "eggs"],
  },
];

// ---------------------------------------------------------------------------
// Detect which tips apply to a given instruction step
// ---------------------------------------------------------------------------
export function detectTechniques(step: string): Technique[] {
  const lower = step.toLowerCase();
  return TECHNIQUES.filter((tech) =>
    tech.keywords.some((kw) => lower.includes(kw))
  ).slice(0, 2); // max 2 tips per step to avoid overload
}

// ---------------------------------------------------------------------------
// Simple SVG illustrations
// ---------------------------------------------------------------------------
function KnifeSVG() {
  return (
    <svg viewBox="0 0 200 80" className="w-full max-w-xs" style={{ height: 60 }}>
      {/* Hand/claw */}
      <ellipse cx="40" cy="50" rx="28" ry="18" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="24" y="32" width="7" height="22" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="33" y="28" width="7" height="26" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="42" y="30" width="7" height="24" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="51" y="33" width="6" height="20" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      {/* Knife blade */}
      <path d="M70 42 L190 42 L190 48 Q150 56 70 52 Z" fill="#B0B8C0" stroke="#8a9099" strokeWidth="1" />
      <rect x="70" y="38" width="12" height="16" rx="2" fill="#4a4a4a" />
      {/* Label */}
      <text x="100" y="72" textAnchor="middle" fontSize="9" fill="#6B5B52">Knuckle guides the blade</text>
    </svg>
  );
}

function SauteSVG() {
  return (
    <svg viewBox="0 0 200 90" className="w-full max-w-xs" style={{ height: 70 }}>
      {/* Flames */}
      <ellipse cx="80" cy="78" rx="50" ry="6" fill="#FF6B00" opacity="0.3" />
      <path d="M55 78 Q58 60 65 55 Q62 70 70 65 Q68 50 78 42 Q76 62 85 58 Q84 48 90 42 Q92 58 98 60 Q95 72 100 68 Q97 78 55 78 Z" fill="#FF6B00" opacity="0.85" />
      <path d="M60 78 Q63 65 68 62 Q65 72 72 68 Q70 58 78 52 Q79 65 84 63 Q83 55 88 50 Q90 63 94 65 Q92 74 98 72 Q97 78 60 78 Z" fill="#FFAD00" opacity="0.9" />
      {/* Pan */}
      <ellipse cx="80" cy="76" rx="52" ry="8" fill="#4a4a4a" />
      <rect x="28" y="68" width="104" height="10" rx="3" fill="#3a3a3a" />
      <rect x="28" y="68" width="16" height="5" rx="2" fill="#2a2a2a" />
      {/* Handle */}
      <rect x="140" y="70" width="50" height="8" rx="4" fill="#5a4030" />
      {/* Food bits */}
      {[55,70,85,100].map((x, i) => (
        <ellipse key={i} cx={x} cy={72} rx="6" ry="3" fill={["#FF8C42","#FFB347","#FFA07A","#FFD700"][i]} />
      ))}
      <text x="80" y="92" textAnchor="middle" fontSize="9" fill="#6B5B52">Hot pan → shimmer oil → add food</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CookingTip component
// ---------------------------------------------------------------------------
interface CookingTipProps {
  technique: Technique;
}

export function CookingTip({ technique }: CookingTipProps) {
  const { t } = useLanguage();
  // Default open — user can collapse to hide everything
  const [open, setOpen] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden border"
      style={{ borderColor: "#FDECD6", background: "#FFFBF5" }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-orange-50"
      >
        <span className="text-base">{technique.icon}</span>
        <Lightbulb className="w-3.5 h-3.5 shrink-0" style={{ color: "#C85A2F" }} />
        <span className="text-xs font-semibold flex-1" style={{ color: "#C85A2F" }}>
          {t("recipe.tip")}: {technique.title}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "#A69180" }} />
          : <ChevronDown className="w-3.5 h-3.5" style={{ color: "#A69180" }} />}
      </button>

      {/* Body — hidden when collapsed */}
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          <p className="text-xs leading-relaxed" style={{ color: "#6B5B52" }}>{technique.tip}</p>
          <p className="text-xs leading-relaxed" style={{ color: "#8A7060" }}>{technique.detail}</p>

          {/* SVG illustration */}
          {technique.svgKey === "knife" && (
            <div className="flex justify-center py-1">
              <KnifeSVG />
            </div>
          )}
          {technique.svgKey === "saute" && (
            <div className="flex justify-center py-1">
              <SauteSVG />
            </div>
          )}

          {/* YouTube embed / link */}
          {technique.videoId && (
            <div className="rounded-xl overflow-hidden" style={{ background: "#1a1a1a" }}>
              {videoOpen ? (
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${technique.videoId}?autoplay=1&rel=0`}
                  title={technique.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="block"
                />
              ) : (
                <button
                  onClick={() => setVideoOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FF0000" }}>
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{technique.videoTitle}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{technique.videoChannel} · YouTube</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
