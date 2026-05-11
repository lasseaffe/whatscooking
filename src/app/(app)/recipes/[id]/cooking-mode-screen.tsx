"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Lightbulb, List, Home, UtensilsCrossed, Plus, Star, CheckCircle2, Trash2 } from "lucide-react";
import { StepVisualization } from "@/components/step-visualization";
import { TypewriterText } from "@/components/ui/TypewriterText";

// ── Types ────────────────────────────────────────────────────
export interface Ingredient {
  name: string;
  amount?: number | null;
  unit?: string | null;
}

export interface CookingModeScreenProps {
  recipeTitle: string;
  chefName?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  imageUrl?: string | null;
  baseServings: number;
  instructions: string[];
  ingredients?: Ingredient[];
  onExit: () => void;
}

// ── Culinary glossary ────────────────────────────────────────
interface GlossaryEntry {
  term: string;
  explanation: string;
  buyTip?: string;
}

const GLOSSARY: GlossaryEntry[] = [
  {
    term: "sauté",
    explanation: "Cook quickly in a small amount of fat over medium-high heat, stirring or tossing frequently. The word means 'jumped' in French — the food should almost jump in the pan.",
  },
  {
    term: "sear",
    explanation: "Apply very high, dry heat to create a deep brown crust via the Maillard reaction. Pat the surface completely dry first — water is the enemy of a good sear.",
  },
  {
    term: "deglaze",
    explanation: "Add cold liquid to a hot pan after searing to dissolve the caramelised browned bits (fond) stuck to the bottom. That fond is pure concentrated flavour.",
  },
  {
    term: "caramelise",
    explanation: "Heat sugars until they melt and turn golden-brown, developing complex, slightly bitter-sweet flavour. Works both for sugar directly and for onions (which release their own sugars).",
  },
  {
    term: "caramelize",
    explanation: "Heat sugars until they melt and turn golden-brown, developing complex, slightly bitter-sweet flavour. Works both for sugar directly and for onions (which release their own sugars).",
  },
  {
    term: "fold",
    explanation: "Gently incorporate an ingredient using a wide, sweeping under-and-over motion. The goal is to combine without deflating trapped air — crucial for soufflés, mousses, and batters.",
  },
  {
    term: "emulsify",
    explanation: "Combine two liquids that normally repel (like oil and water) into a stable, creamy mixture. Add the oil in a very thin, slow stream while whisking constantly.",
  },
  {
    term: "bloom",
    explanation: "Toast spices briefly in hot fat before adding other ingredients. Heat releases fat-soluble aroma compounds that wouldn't dissolve in water, making the flavour far more intense.",
  },
  {
    term: "blanch",
    explanation: "Plunge into rapidly boiling salted water for a short time, then immediately transfer to ice water to stop cooking. Preserves bright colour and sets texture.",
  },
  {
    term: "reduce",
    explanation: "Simmer a liquid uncovered so water evaporates, concentrating flavour and thickening the consistency. Don't rush it — low and slow gives you more control.",
  },
  {
    term: "fond",
    explanation: "The browned bits stuck to the pan after searing meat or vegetables. Rich in flavour from the Maillard reaction — always deglaze to capture it.",
  },
  {
    term: "maillard",
    explanation: "A chemical reaction between amino acids and sugars at high heat (above ~140 °C / 285 °F) that creates hundreds of flavour compounds and a brown crust.",
  },
  {
    term: "mise en place",
    explanation: "French for 'everything in its place'. Prep and measure all ingredients before you start cooking. Professional kitchens live by this — it prevents scrambling and burning things.",
  },
  {
    term: "al dente",
    explanation: "Italian for 'to the tooth'. Pasta or rice cooked until just tender with a slight firmness in the centre. It will continue cooking briefly after you drain it.",
  },
  {
    term: "baste",
    explanation: "Spoon or brush hot fat or cooking juices over the surface of food as it cooks. Keeps it moist and builds flavour on the outside.",
  },
  {
    term: "sweat",
    explanation: "Cook aromatics (onions, garlic, celery) gently in a little fat over low-medium heat without browning. The goal is to soften them and coax out moisture and sweetness.",
  },
  {
    term: "render",
    explanation: "Slowly melt fat out of fatty meat (like bacon or duck) by cooking gently over low heat. The released fat is the cooking medium for whatever comes next.",
  },
  {
    term: "rest",
    explanation: "Let cooked meat sit off the heat before cutting. During this time, contracted muscle fibres relax and reabsorb juices — cutting too soon loses all that moisture.",
  },
  // Obscure ingredients
  {
    term: "cognac",
    explanation: "A premium French brandy distilled from white wine, produced in the Cognac region. Adds deep, slightly fruity warmth to sauces.",
    buyTip: "Found in the spirits section of most supermarkets or wine shops. A VS (Very Special) grade bottle works perfectly for cooking.",
  },
  {
    term: "tarragon",
    explanation: "A herb with a distinctive anise-like flavour. French tarragon is far superior to Russian tarragon for cooking — check the label.",
    buyTip: "Available fresh in the herb section of well-stocked supermarkets, or dried in the spice aisle.",
  },
  {
    term: "miso",
    explanation: "Fermented soybean paste from Japan. Adds deep umami, saltiness, and complexity. White (shiro) miso is mild; red (aka) miso is intense.",
    buyTip: "Found in the Asian foods section of most supermarkets or any Asian grocery store. Keeps for months refrigerated.",
  },
  {
    term: "tahini",
    explanation: "A paste made from ground sesame seeds. Essential in hummus and many Middle Eastern dishes — adds richness and a faint bitterness.",
    buyTip: "Available in most supermarkets (often near nut butters or in the international aisle) or in Middle Eastern grocery stores.",
  },
  {
    term: "mirin",
    explanation: "A sweet Japanese rice wine used only for cooking. Adds a subtle sweetness and glossy sheen to sauces and glazes.",
    buyTip: "Found in Asian grocery stores or the Asian foods aisle. Look for 'hon mirin' for the real thing; 'aji mirin' is a cheaper substitute.",
  },
  {
    term: "fish sauce",
    explanation: "A pungent, salty liquid made from fermented fish. It adds deep umami without tasting 'fishy' once cooked — a secret weapon in many cuisines.",
    buyTip: "Available in most supermarkets (Asian aisle) or any Asian grocery store. Tiparos and Megachef are reliable brands.",
  },
  {
    term: "sumac",
    explanation: "A deep red, tangy spice made from ground dried berries. Brings bright, lemony acidity without liquid — excellent sprinkled on salads or labneh.",
    buyTip: "Available in Middle Eastern grocery stores or specialty spice shops. Increasingly found in the spice aisle of larger supermarkets.",
  },
  {
    term: "harissa",
    explanation: "A North African chilli paste made with roasted red peppers, hot chillies, garlic, and spices. Ranges from mild to very spicy depending on the brand.",
    buyTip: "Found in the condiment section of most supermarkets. The Moulins Mahjoub or Belazu brands are excellent quality.",
  },
  {
    term: "ghee",
    explanation: "Clarified butter with all milk solids removed. Has a higher smoke point than butter, a rich nutty flavour, and stores at room temperature.",
    buyTip: "Available in Indian grocery stores and increasingly in mainstream supermarkets (often near cooking oils or in the international aisle).",
  },
  {
    term: "za'atar",
    explanation: "A Middle Eastern spice blend of dried thyme/oregano, toasted sesame seeds, and sumac. Earthy, tangy, and herby all at once.",
    buyTip: "Find it in Middle Eastern grocery stores or specialty food shops. You can also blend your own: dried thyme + sesame seeds + sumac.",
  },
];

// Build lookup map: lowercase term → entry
const GLOSSARY_MAP = new Map<string, GlossaryEntry>(
  GLOSSARY.map((e) => [e.term.toLowerCase(), e])
);

// Sorted by length descending so longer terms (e.g. "mise en place") match before sub-terms
const GLOSSARY_TERMS_SORTED = [...GLOSSARY_MAP.keys()].sort((a, b) => b.length - a.length);

// ── Time parser ───────────────────────────────────────────────
function parseStepSeconds(text: string): number | null {
  const colonMatch = text.match(/\b(\d+):(\d{2})\b/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  const wordMatch = text.match(/\b(\d+)\s*(minute|min|second|sec)/i);
  if (wordMatch) {
    const n = parseInt(wordMatch[1]);
    return /sec/i.test(wordMatch[2]) ? n : n * 60;
  }
  return null;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Multi-timer tray types + helpers ─────────────────────────
interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remaining: number;
  running: boolean;
  done: boolean;
}

function extractTimerLabel(stepText: string): string {
  // Grab first verb phrase: up to 4 words starting at a capital or sentence start
  const m = stepText.trim().match(/^[A-Z][a-zA-Z]+(?:\s+\w+){0,3}/);
  return m ? m[0].slice(0, 28) : "Timer";
}

// ── Timer Tray ────────────────────────────────────────────────
function TimerTray({
  timers,
  onAdd,
  onToggle,
  onReset,
  onRemove,
  stepText,
}: {
  timers: ActiveTimer[];
  onAdd: () => void;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
  stepText: string;
}) {
  const canAdd = timers.length < 4 && parseStepSeconds(stepText) !== null;

  if (timers.length === 0) {
    if (!canAdd) return null;
    return (
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
        style={{ background: "rgba(244,162,97,0.12)", color: "#D4956A", border: "1.5px solid rgba(244,162,97,0.3)" }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Start Timer
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {timers.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: t.done
              ? "rgba(130,142,111,0.15)"
              : "rgba(28,18,9,0.9)",
            border: t.done
              ? "1px solid rgba(130,142,111,0.3)"
              : "1px solid rgba(244,162,97,0.25)",
            animation: t.done ? "pulse 0.8s ease-in-out 3" : undefined,
          }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[90px]" style={{ color: t.done ? "#828E6F" : "#8A6A4A" }}>
              {t.label}
            </p>
            <p
              className="font-bold leading-none tabular-nums"
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: "1.4rem",
                color: t.done ? "#828E6F" : "#EFE3CE",
              }}
            >
              {t.done ? "Done!" : formatTime(t.remaining)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {!t.done && (
              <>
                <button
                  type="button"
                  onClick={() => onToggle(t.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
                  style={{ background: "var(--wc-accent-saffron, #F4A261)" }}
                >
                  {t.running
                    ? <Pause style={{ width: 13, height: 13, color: "#1A0E04" }} />
                    : <Play style={{ width: 13, height: 13, color: "#1A0E04", marginLeft: 1 }} />}
                </button>
                <button
                  type="button"
                  onClick={() => onReset(t.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-60"
                  style={{ background: "rgba(42,24,8,0.6)" }}
                >
                  <RotateCcw style={{ width: 11, height: 11, color: "#8A6A4A" }} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-60"
              style={{ background: "rgba(42,24,8,0.4)" }}
            >
              <X style={{ width: 10, height: 10, color: "#5A3A28" }} />
            </button>
          </div>
        </div>
      ))}
      {canAdd && timers.length < 4 && (
        <button
          type="button"
          onClick={onAdd}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "rgba(244,162,97,0.1)", border: "1.5px dashed rgba(244,162,97,0.35)" }}
          aria-label="Add another timer"
        >
          <Plus style={{ width: 14, height: 14, color: "#D4956A" }} />
        </button>
      )}
    </div>
  );
}

// ── Pro-tip keyword map ────────────────────────────────────────
const PRO_TIP_KEYWORDS = [
  { pattern: /\b(sear|searing)\b/i, tip: "Pat dry before searing — moisture is the enemy of a good crust." },
  { pattern: /\b(season|seasoning)\b/i, tip: "Season in layers, not just at the end." },
  { pattern: /\b(rest(ing)?)\b/i, tip: "Resting allows juices to redistribute — don't skip it." },
  { pattern: /\b(emulsify|emulsion)\b/i, tip: "Add oil in a thin stream while whisking to achieve a stable emulsion." },
  { pattern: /\b(fold(ing)?)\b/i, tip: "Fold gently from the bottom up to preserve air in the batter." },
  { pattern: /\b(carameli[sz]e)\b/i, tip: "Don't rush caramelization — medium-low heat and patience." },
  { pattern: /\b(deglaze)\b/i, tip: "Cold liquid into a hot pan makes the fond release — all that flavour is gold." },
  { pattern: /\b(bloom(ing)?)\b/i, tip: "Blooming spices in fat unlocks fat-soluble flavour compounds." },
];

function getProTip(step: string): string | null {
  for (const { pattern, tip } of PRO_TIP_KEYWORDS) {
    if (pattern.test(step)) return tip;
  }
  return null;
}

// ── Inject ingredient amounts into step text ──────────────────
// e.g. "Add wine" → "Add 120 ml wine"
function injectAmounts(text: string, ingredients: Ingredient[], servingsRatio: number): string {
  let result = text;
  for (const ing of ingredients) {
    if (!ing.name) continue;
    // Escape special regex chars in ingredient name
    const escaped = ing.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b(${escaped})\\b`, "gi");
    if (!regex.test(result)) continue;
    // Build amount prefix
    if (ing.amount != null) {
      const scaled = Math.round(ing.amount * servingsRatio * 10) / 10;
      const unit = ing.unit ? ` ${ing.unit}` : "";
      result = result.replace(
        new RegExp(`\\b(${escaped})\\b`, "gi"),
        `${scaled}${unit} $1`
      );
    }
  }
  return result;
}

// ── Annotate text: split into segments with glossary term spans ─
interface TextSegment {
  type: "text" | "glossary";
  value: string;
  termKey?: string;
}

function annotateText(text: string): TextSegment[] {
  if (GLOSSARY_TERMS_SORTED.length === 0) return [{ type: "text", value: text }];

  const pattern = GLOSSARY_TERMS_SORTED.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "glossary", value: match[0], termKey: match[0].toLowerCase() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}

// ── Glossary tooltip popover ──────────────────────────────────
interface TooltipState {
  termKey: string;
  x: number;
  y: number;
}

function GlossaryPopover({ state, onClose }: { state: TooltipState; onClose: () => void }) {
  const entry = GLOSSARY_MAP.get(state.termKey);
  if (!entry) return null;

  // Keep in viewport
  const popoverWidth = 280;
  const left = Math.min(state.x, window.innerWidth - popoverWidth - 16);
  const top = state.y + 12;

  return (
    <>
      {/* Backdrop click */}
      <div className="fixed inset-0 z-[200]" onClick={onClose} />
      <div
        className="fixed z-[201] rounded-xl shadow-2xl"
        style={{
          left,
          top,
          width: popoverWidth,
          background: "rgba(22,14,8,0.97)",
          border: "1px solid rgba(180,120,60,0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span
              className="font-bold text-sm"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "#F4A261" }}
            >
              {entry.term.charAt(0).toUpperCase() + entry.term.slice(1)}
            </span>
            <button type="button" onClick={onClose} className="opacity-50 hover:opacity-100 mt-0.5">
              <X style={{ width: 12, height: 12, color: "#EFE3CE" }} />
            </button>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#C8B49A" }}>
            {entry.explanation}
          </p>
          {entry.buyTip && (
            <div
              className="mt-2.5 px-3 py-2 rounded-lg text-xs leading-relaxed"
              style={{ background: "rgba(58,36,22,0.5)", color: "#A08060", borderLeft: "2px solid rgba(180,120,60,0.4)" }}
            >
              <span style={{ color: "#F4A261", fontWeight: 600 }}>Where to buy: </span>
              {entry.buyTip}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Annotated step text renderer ──────────────────────────────
function AnnotatedText({
  text,
  onGlossaryClick,
}: {
  text: string;
  onGlossaryClick: (termKey: string, x: number, y: number) => void;
}) {
  const segments = useMemo(() => annotateText(text), [text]);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "glossary") {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                onGlossaryClick(seg.termKey!, rect.left, rect.bottom);
              }}
              className="relative cursor-pointer transition-colors"
              style={{
                color: "#E8C97A",
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "rgba(232,201,122,0.5)",
                textUnderlineOffset: "3px",
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                lineHeight: "inherit",
              }}
            >
              {seg.value}
            </button>
          );
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </>
  );
}

// ── Inline SOS helper ─────────────────────────────────────────
function SOSHelper({
  stepIndex,
  stepText,
  recipeTitle,
  ingredients,
  prefetchedTip,
  prefetchDone,
}: {
  stepIndex: number;
  stepText: string;
  recipeTitle: string;
  ingredients: Ingredient[];
  prefetchedTip: string | undefined;
  prefetchDone: boolean;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  // Reset when step changes
  useEffect(() => {
    setTip(null);
    setFetching(false);
  }, [stepIndex]);

  async function fetchTip() {
    if (prefetchedTip) {
      setTip(prefetchedTip);
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/api/sos-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeTitle,
          ingredients,
          steps: [stepText],
        }),
      });
      const data = await res.json();
      setTip(data.tips?.[0] ?? "No tip available for this step.");
    } catch {
      setTip("Couldn't load a tip right now. Try again.");
    } finally {
      setFetching(false);
    }
  }

  return (
    <div
      style={{
        background: "#fdf6e3",
        border: "1px solid #e8d080",
        borderTop: "2px dashed #c8a200",
        borderRadius: "0 0 12px 12px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "#8a6a00",
          letterSpacing: "2px",
          marginBottom: 6,
        }}
      >
        ★ CHEF&apos;S TIP
      </div>
      {tip ? (
        <TypewriterText
          text={tip}
          speed={46}
          cursorColor="#c8a200"
          className="text-xs italic"
          style={{ color: "#4a3800", fontFamily: "serif", lineHeight: 1.7 }}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#bba060", fontFamily: "serif", fontStyle: "italic" }}>
            {fetching ? "fetching tip…" : "Struggling with this step?"}
          </span>
          {!fetching && (
            <button
              type="button"
              onClick={fetchTip}
              disabled={!prefetchDone && !prefetchedTip}
              style={{
                background: "#fdf6e3",
                border: "1.5px solid #c8a200",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "monospace",
                color: "#7a6000",
                cursor: "pointer",
                letterSpacing: 1,
                opacity: !prefetchDone && !prefetchedTip ? 0.5 : 1,
              }}
            >
              Get tip ↓
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step heading: first full sentence; fallback to first 7 words ─────────────
function stepHeading(text: string): string {
  const m = text.trim().match(/^.+?[.!?]/);
  if (m) return m[0].trim();
  return text.trim().split(/\s+/).slice(0, 7).join(" ");
}

function stepBody(text: string): string {
  const m = text.trim().match(/^.+?[.!?]\s*([\s\S]*)$/);
  if (m) return m[1].trim();
  const words = text.trim().split(/\s+/);
  return words.length > 7 ? words.slice(7).join(" ") : "";
}

// ── Main screen component ─────────────────────────────────────
export function CookingModeScreen({
  recipeTitle,
  chefName,
  rating,
  reviewCount,
  imageUrl,
  baseServings,
  instructions,
  ingredients = [],
  onExit,
}: CookingModeScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [servings, setServings] = useState(baseServings);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  // Done dialog: null | "pantry" | "rating"
  const [donePhase, setDonePhase] = useState<null | "pantry" | "rating">(null);
  const [doneRating, setDoneRating] = useState(0);
  const [doneHoverRating, setDoneHoverRating] = useState(0);
  // Cache enriched body text per step index so we don't re-call the API on navigation
  const [enrichedBodies, setEnrichedBodies] = useState<Record<number, string>>({});
  const [bodyLoading, setBodyLoading] = useState(false);
  // Pre-fetched SOS tips for all steps
  const [prefetchedTips, setPrefetchedTips] = useState<string[]>([]);
  const [prefetchDone, setPrefetchDone] = useState(false);

  useEffect(() => {
    if (!instructions.length) return;
    fetch("/api/sos-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeTitle,
        ingredients: ingredients ?? [],
        steps: instructions,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.tips)) {
          setPrefetchedTips(data.tips);
        }
      })
      .catch(() => {/* silently fall back to on-demand */})
      .finally(() => setPrefetchDone(true));
  }, [recipeTitle, instructions, ingredients]);

  // Multi-timer tray
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const timerTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const servingsRatio = baseServings > 0 ? servings / baseServings : 1;

  // Global timer tick — runs whenever any timer is running
  useEffect(() => {
    const hasRunning = timers.some((t) => t.running);
    if (hasRunning) {
      timerTickRef.current = setInterval(() => {
        setTimers((prev) =>
          prev.map((t) => {
            if (!t.running) return t;
            if (t.remaining <= 1) {
              try { navigator.vibrate?.([200, 100, 200]); } catch { /* noop */ }
              return { ...t, remaining: 0, running: false, done: true };
            }
            return { ...t, remaining: t.remaining - 1 };
          })
        );
      }, 1000);
    } else {
      if (timerTickRef.current) clearInterval(timerTickRef.current);
    }
    return () => { if (timerTickRef.current) clearInterval(timerTickRef.current); };
  }, [timers]);

  function addTimer() {
    const secs = parseStepSeconds(enrichedText);
    if (secs === null || timers.length >= 4) return;
    const label = extractTimerLabel(enrichedText);
    setTimers((prev) => [
      ...prev,
      { id: `${Date.now()}`, label, totalSeconds: secs, remaining: secs, running: true, done: false },
    ]);
  }

  function toggleTimer(id: string) {
    setTimers((prev) => prev.map((t) => t.id === id ? { ...t, running: !t.running } : t));
  }

  function resetTimer(id: string) {
    setTimers((prev) => prev.map((t) => t.id === id ? { ...t, remaining: t.totalSeconds, running: false, done: false } : t));
  }

  function removeTimer(id: string) {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }

  const current = instructions[step] ?? "";
  const total = instructions.length;
  const proTip = getProTip(current);
  const progress = total > 0 ? ((step + 1) / total) * 100 : 0;

  // Enrich step text with ingredient amounts
  const enrichedText = useMemo(
    () => injectAmounts(current, ingredients, servingsRatio),
    [current, ingredients, servingsRatio]
  );

  const heading = stepHeading(enrichedText);
  const body = stepBody(enrichedText);

  function go(i: number) {
    setStep(Math.max(0, Math.min(total - 1, i)));
    setDrawerOpen(false);
    setTooltip(null);
  }

  function next() { if (step < total - 1) go(step + 1); }
  function prev() { if (step > 0) go(step - 1); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "Escape") { if (donePhase) setDonePhase(null); else if (tooltip) setTooltip(null); else onExit(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Fetch enriched body for the current step (cached per index)
  useEffect(() => {
    if (enrichedBodies[step] !== undefined) return;
    const raw = stepBody(enrichedText);
    if (!raw) return;
    setBodyLoading(true);
    fetch("/api/enrich-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepText: enrichedText }),
    })
      .then((r) => r.json())
      .then(({ text }: { text: string }) => {
        setEnrichedBodies((prev) => ({ ...prev, [step]: text || raw }));
      })
      .catch(() => {
        setEnrichedBodies((prev) => ({ ...prev, [step]: raw }));
      })
      .finally(() => setBodyLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, enrichedText]);

  function handleGlossaryClick(termKey: string, x: number, y: number) {
    setTooltip((prev) => (prev?.termKey === termKey ? null : { termKey, x, y }));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "#0d0d0c", color: "#EFE3CE" }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-10" style={{ background: "rgba(42,24,8,0.5)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #C8522A, #F4A261)" }}
        />
      </div>

      {/* Glossary popover (portal-like, position:fixed) */}
      {tooltip && <GlossaryPopover state={tooltip} onClose={() => setTooltip(null)} />}

      {/* Main 3-column layout — desktop */}
      <div className="flex flex-1 min-h-0 pt-[3px]">

        {/* ── LEFT PANEL ── */}
        <div
          className="hidden md:flex flex-col w-[300px] shrink-0 overflow-y-auto"
          style={{ borderRight: "1px solid rgba(42,24,8,0.6)", background: "rgba(14,9,5,0.6)" }}
        >
          <div className="p-5 pb-3">
            <button
              type="button"
              onClick={onExit}
              className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--wc-pal-accent, #B07D56)" }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
              Exit
            </button>
          </div>

          <div className="px-5 pb-5 flex flex-col gap-4 flex-1">
            <div>
              <h2
                className="font-bold leading-snug"
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  fontSize: "1.2rem",
                  color: "#EFE3CE",
                }}
              >
                {recipeTitle}
              </h2>
              {(chefName || rating) && (
                <p className="text-xs mt-1.5" style={{ color: "#6B5B52" }}>
                  {chefName && <span>By {chefName} · </span>}
                  {rating && <span>★ {rating}{reviewCount ? ` · ${reviewCount} reviews` : ""}</span>}
                </p>
              )}
            </div>

            {/* Servings */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#5A3A28" }}>Servings</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all hover:opacity-70 active:scale-90"
                  style={{ background: "rgba(42,24,8,0.7)", color: "#B07D56", border: "1px solid rgba(58,36,22,0.6)" }}
                >
                  −
                </button>
                <span className="text-xl font-bold w-8 text-center" style={{ color: "#EFE3CE" }}>{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all hover:opacity-70 active:scale-90"
                  style={{ background: "rgba(42,24,8,0.7)", color: "#B07D56", border: "1px solid rgba(58,36,22,0.6)" }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Recipe image */}
            {imageUrl && (
              <div className="rounded-2xl overflow-hidden relative" style={{ aspectRatio: "4/3" }}>
                <Image src={imageUrl} alt={recipeTitle} fill className="object-cover" sizes="280px" />
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-2"
                  style={{ background: "linear-gradient(to top, rgba(14,9,5,0.85) 0%, transparent 100%)" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "#EFE3CE" }}>{recipeTitle}</p>
                </div>
              </div>
            )}

            {/* Glossary legend */}
            <div
              className="mt-auto px-3 py-2.5 rounded-xl text-xs"
              style={{ background: "rgba(30,20,10,0.6)", border: "1px solid rgba(58,36,22,0.4)" }}
            >
              <p className="font-bold uppercase tracking-widest mb-1" style={{ color: "#5A3A28", fontSize: "0.6rem" }}>
                Tap to learn
              </p>
              <p style={{ color: "#6B5B52", lineHeight: 1.5 }}>
                Words in{" "}
                <span
                  style={{
                    color: "#E8C97A",
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: "rgba(232,201,122,0.5)",
                    textUnderlineOffset: "2px",
                  }}
                >
                  golden
                </span>{" "}
                are culinary terms or special ingredients. Tap them for an explanation.
              </p>
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Mobile top bar */}
          <div
            className="flex md:hidden items-center justify-between px-4 py-3 shrink-0"
            style={{ background: "rgba(13,13,12,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(42,24,8,0.4)" }}
          >
            <button type="button" onClick={onExit} className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#B07D56" }}>
              <X style={{ width: 15, height: 15 }} /> Exit
            </button>
            <span className="text-xs font-semibold" style={{ color: "#5A3A28" }}>
              {recipeTitle.length > 22 ? recipeTitle.slice(0, 22) + "…" : recipeTitle}
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: "#B07D56" }}
            >
              <List style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Step content — scrolls independently */}
          <div className="flex-1 overflow-y-auto px-8 md:px-12 lg:px-16 py-10 max-w-2xl mx-auto w-full">
            {/* Step badge + SOS helper (top row) */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(244,162,97,0.15)", color: "#F4A261", border: "1px solid rgba(244,162,97,0.3)" }}
              >
                {step + 1} / {total}
              </span>
              <SOSHelper
                key={step}
                stepIndex={step}
                stepText={enrichedText}
                recipeTitle={recipeTitle}
                ingredients={ingredients ?? []}
                prefetchedTip={prefetchedTips[step]}
                prefetchDone={prefetchDone}
              />
            </div>

            {/* Step heading */}
            <h1
              className="mb-5 leading-tight"
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "#EFE3CE",
                fontWeight: 700,
              }}
            >
              <AnnotatedText text={heading} onGlossaryClick={handleGlossaryClick} />
            </h1>

            {/* Step body — enriched 2-5 sentence explanation */}
            {(enrichedBodies[step] || body) && (
              <p
                className="mb-6 leading-relaxed"
                style={{
                  fontSize: "1.15rem",
                  color: "#C8B49A",
                  lineHeight: 1.9,
                  opacity: bodyLoading ? 0.5 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                <AnnotatedText
                  text={enrichedBodies[step] || body}
                  onGlossaryClick={handleGlossaryClick}
                />
              </p>
            )}

            {/* Step visualization — SVG technique diagram when applicable */}
            <StepVisualization stepText={enrichedText} />

            {/* Mobile glossary hint */}
            <p
              className="flex md:hidden text-xs mb-4"
              style={{ color: "#4A3020" }}
            >
              Tap{" "}
              <span
                className="mx-1"
                style={{
                  color: "#E8C97A",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                }}
              >
                golden words
              </span>{" "}
              to learn what they mean.
            </p>

            {/* Pro tip */}
            {proTip && (
              <div
                className="flex items-start gap-2 mt-5 px-4 py-3 rounded-xl text-sm leading-relaxed"
                style={{ background: "rgba(58,52,48,0.8)", borderLeft: "3px solid #F4A261" }}
              >
                <Lightbulb style={{ width: 14, height: 14, color: "#F4A261", flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: "#e7e7e6" }}>
                  <strong style={{ color: "#F4A261" }}>Chef tip:</strong> {proTip}
                </span>
              </div>
            )}
          </div>

          {/* ── Sticky bottom bar: Timer + Prev / Next ── */}
          <div
            className="shrink-0 px-8 md:px-12 lg:px-16 py-4 flex flex-col gap-3 max-w-2xl mx-auto w-full"
            style={{
              borderTop: "1px solid rgba(42,24,8,0.5)",
              background: "rgba(13,13,12,0.97)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Persistent multi-timer tray */}
            <TimerTray
              timers={timers}
              onAdd={addTimer}
              onToggle={toggleTimer}
              onReset={resetTimer}
              onRemove={removeTimer}
              stepText={enrichedText}
            />

            {/* Prev / Next */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-125 disabled:opacity-25 active:scale-95"
                style={{ background: "rgba(244,162,97,0.12)", color: "#D4956A", border: "1.5px solid rgba(244,162,97,0.35)" }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} /> Prev
              </button>
              <button
                type="button"
                onClick={step >= total - 1 ? () => setDonePhase("pantry") : next}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: step >= total - 1
                    ? "linear-gradient(135deg, #828E6F, #6B7A5C)"
                    : "var(--wc-accent-saffron, #F4A261)",
                  color: "#1A0E04",
                }}
              >
                {step >= total - 1 ? "All Done! 🎉" : <>Next Step <ChevronRight style={{ width: 17, height: 17 }} /></>}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div
          className="hidden md:flex flex-col w-[210px] shrink-0 overflow-y-auto py-6 px-4"
          style={{ borderLeft: "1px solid rgba(42,24,8,0.6)", background: "rgba(14,9,5,0.4)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#5A3A28" }}>
            All Steps
          </p>
          <ol className="flex flex-col gap-1">
            {instructions.map((s, i) => {
              const isActive = i === step;
              const isDone = i < step;
              const stepTime = parseStepSeconds(s);
              const label = s.trim().split(/\s+/).slice(0, 5).join(" ");
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    className="w-full flex items-start gap-2 py-2 px-2 rounded-lg text-left transition-all hover:opacity-90"
                    style={{
                      background: isActive ? "rgba(244,162,97,0.1)" : "transparent",
                      opacity: isDone ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{
                        background: isDone
                          ? "rgba(130,142,111,0.3)"
                          : isActive
                            ? "var(--wc-accent-saffron, #F4A261)"
                            : "rgba(42,24,8,0.6)",
                        color: isDone ? "#828E6F" : isActive ? "#1A0E04" : "#5A3A28",
                        border: isDone
                          ? "1px solid rgba(130,142,111,0.3)"
                          : isActive
                            ? "none"
                            : "1px solid #3A2416",
                      }}
                    >
                      {isDone ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-xs leading-snug"
                        style={{
                          color: isActive ? "#EFE3CE" : "#6B5B52",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {label}
                      </p>
                      {stepTime && (
                        <p className="text-[10px] mt-0.5" style={{ color: "#4A3020" }}>
                          {formatTime(stepTime)}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Mobile step drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden" onClick={() => setDrawerOpen(false)}>
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <div
            className="relative rounded-t-3xl overflow-hidden"
            style={{ background: "#1F1B19", maxHeight: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(42,24,8,0.5)" }}>
              <p className="text-sm font-bold" style={{ color: "#EFE3CE" }}>All Steps</p>
              <button type="button" onClick={() => setDrawerOpen(false)}>
                <X style={{ width: 16, height: 16, color: "#8A6A4A" }} />
              </button>
            </div>
            <ol className="overflow-y-auto flex flex-col p-4 gap-1" style={{ maxHeight: "calc(70vh - 56px)" }}>
              {instructions.map((s, i) => {
                const isActive = i === step;
                const isDone = i < step;
                const label = s.trim().split(/\s+/).slice(0, 6).join(" ");
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-left transition-all"
                      style={{
                        background: isActive ? "rgba(244,162,97,0.1)" : "transparent",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      <span
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: isDone ? "rgba(130,142,111,0.3)" : isActive ? "#F4A261" : "rgba(42,24,8,0.6)",
                          color: isDone ? "#828E6F" : isActive ? "#1A0E04" : "#5A3A28",
                        }}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      <p className="text-sm" style={{ color: isActive ? "#EFE3CE" : "#8A6A4A", fontWeight: isActive ? 600 : 400 }}>
                        {label}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {/* ── Done dialog — Phase 1: Pantry actions ── */}
      {donePhase === "pantry" && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.3)" }}
          >
            <div className="px-7 pt-8 pb-4 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <h2
                className="font-bold mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.5rem", color: "#EFE3CE" }}
              >
                You&apos;re done cooking!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#8A6A4A" }}>
                Update your pantry before you go?
              </p>
            </div>

            <div className="px-6 pb-3 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/pantry/items", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        items: ingredients.map((ing) => ({ name: ing.name, action: "remove_used" })),
                      }),
                    });
                  } catch { /* fire-and-forget */ }
                  setDonePhase("rating");
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "rgba(244,162,97,0.15)", color: "#F4A261", border: "1.5px solid rgba(244,162,97,0.35)" }}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
                Remove used ingredients from pantry
              </button>

              <button
                type="button"
                onClick={() => {
                  // Navigate to pantry add-leftovers flow (best-effort)
                  onExit();
                  router.push("/pantry?action=add_leftovers");
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ background: "rgba(130,142,111,0.12)", color: "#828E6F", border: "1px solid rgba(130,142,111,0.25)" }}
              >
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                Add leftovers to pantry
              </button>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2 mt-1">
              <button
                type="button"
                onClick={() => setDonePhase("rating")}
                className="text-xs font-medium text-center transition-opacity hover:opacity-80 py-2"
                style={{ color: "#4A3020" }}
              >
                Skip — go to rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done dialog — Phase 2: Star rating ── */}
      {donePhase === "rating" && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.3)" }}
          >
            <div className="px-7 pt-8 pb-5 text-center">
              <p className="text-4xl mb-3">🍽️</p>
              <h2
                className="font-bold mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.5rem", color: "#EFE3CE" }}
              >
                How did it turn out?
              </h2>
              <p className="text-sm" style={{ color: "#8A6A4A" }}>Rate {recipeTitle}</p>

              {/* Star picker */}
              <div className="flex items-center justify-center gap-3 mt-5 mb-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (doneHoverRating || doneRating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDoneRating(star)}
                      onMouseEnter={() => setDoneHoverRating(star)}
                      onMouseLeave={() => setDoneHoverRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                      aria-label={`${star} star`}
                    >
                      <Star
                        style={{
                          width: 36, height: 36,
                          color: filled ? "#F4A261" : "#3A2416",
                          fill: filled ? "#F4A261" : "transparent",
                          transition: "color 0.15s, fill 0.15s",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-7 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={doneRating === 0}
                onClick={async () => {
                  if (doneRating > 0) {
                    try {
                      await fetch(`/api/recipes/${encodeURIComponent(recipeTitle)}/rating`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ rating: doneRating }),
                      });
                    } catch { /* fire-and-forget */ }
                  }
                  setDonePhase(null);
                  onExit();
                }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1A0E04" }}
              >
                <UtensilsCrossed style={{ width: 18, height: 18 }} />
                Submit &amp; finish
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonePhase(null);
                  onExit();
                  router.push("/discover");
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ background: "rgba(42,24,8,0.6)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.6)" }}
              >
                <Home style={{ width: 16, height: 16 }} />
                Back to Homepage
              </button>

              <button
                type="button"
                onClick={() => setDonePhase(null)}
                className="text-xs font-medium text-center transition-opacity hover:opacity-80 mt-1"
                style={{ color: "#4A3020" }}
              >
                Stay in cooking mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
