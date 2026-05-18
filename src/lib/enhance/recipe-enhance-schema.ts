// Validators for the recipe Autoenhance API. Hand-rolled (no zod).

import type { EnhancedStep, JargonTerm, EnhancedDescription, RecipeSkillLevel } from "@/lib/types";

export type EnhanceRequest = {
  title: string;
  ingredients: Array<{ name: string; amount?: number | string; unit?: string }>;
  instructions: string[];
  description?: string;
  target?: "instructions" | "description";
  step_index?: number;
  consolidate?: boolean;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const SKILL_LEVELS = new Set(["beginner", "intermediate", "advanced"]);

// ----------------------------------------------------------------------------
// Header verb-start allowlist (gerund or imperative) for instruction steps
// ----------------------------------------------------------------------------
const HEADER_VERB_OPENERS = new Set<string>([
  "sear","searing","bloom","blooming","caramelize","caramelizing","caramelise","caramelising",
  "deglaze","deglazing","fold","folding","toast","toasting","rest","resting","slice","slicing",
  "season","seasoning","render","rendering","saute","sauteing","sauté","sautéing",
  "whisk","whisking","build","building","reduce","reducing","emulsify","emulsifying",
  "plate","plating","cool","cooling","marinate","marinating","boil","boiling",
  "simmer","simmering","steam","steaming","roast","roasting","smash","smashing",
  "glaze","glazing","layer","layering","toss","tossing","drain","draining","garnish","garnishing",
  "blanch","blanching","braise","braising","brown","browning","char","charring","chop","chopping",
  "dice","dicing","grate","grating","grill","grilling","knead","kneading","mince","mincing",
  "mix","mixing","peel","peeling","poach","poaching","pour","pouring","press","pressing",
  "puree","pureeing","sift","sifting","sprinkle","sprinkling","stir","stirring","strain","straining",
  "stuff","stuffing","whip","whipping","zest","zesting","cure","curing","cut","cutting",
  "fry","frying","heat","heating","melt","melting","scoop","scooping","scrape","scraping",
  "shape","shaping","spread","spreading","temper","tempering","top","topping","prepare","preparing",
  "combine","combining","add","adding","wash","washing","rinse","rinsing","crush","crushing",
  "form","forming","portion","portioning","arrange","arranging","assemble","assembling",
  "ferment","fermenting","infuse","infusing","steep","steeping","thicken","thickening",
  "warm","warming","fill","filling","wrap","wrapping","roll","rolling","stretch","stretching",
  "crack","cracking","beat","beating","fluff","fluffing","skim","skimming","de-glaze","deveinning","devein","deveining",
]);

const DANGLING_PREPS = new Set<string>(["in","to","with","on","of","at","for","by","into","from","over","under"]);

function tokenizeWords(s: string): string[] {
  return s.replace(/[.,;:!?"'()\[\]{}]/g, " ").split(/\s+/).filter(Boolean);
}

export function validateHeader(header: string, bodyText: string): { ok: true } | { error: string } {
  const trimmed = header.trim();
  if (trimmed.length === 0) return { error: "header missing or empty" };
  const words = tokenizeWords(trimmed);
  if (words.length < 2) return { error: "header must be at least 2 words" };
  if (words.length > 8) return { error: "header must be at most 8 words" };
  const first = words[0].toLowerCase().replace(/[^a-zà-ÿ]/g, "");
  if (!HEADER_VERB_OPENERS.has(first)) {
    return { error: `header must start with an action verb (gerund or imperative); got "${words[0]}"` };
  }
  const last = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
  if (DANGLING_PREPS.has(last)) {
    return { error: `header ends on a dangling preposition "${last}" — finish the phrase` };
  }
  // Header MUST NOT appear as substring inside first 12 words of body_text
  const bodyHead = tokenizeWords(bodyText).slice(0, 12).join(" ").toLowerCase();
  if (bodyHead.length > 0 && bodyHead.includes(trimmed.toLowerCase())) {
    return { error: `header appears verbatim inside the first 12 words of body_text — abstract the action, don't copy it` };
  }
  return { ok: true };
}

export function parseEnhancedStep(raw: unknown): EnhancedStep | { error: string } {
  if (!isObj(raw)) return { error: "step is not an object" };
  const { header, body_text, skill, jargon, visual_strategy } = raw;

  if (typeof header !== "string" || !header.trim()) return { error: "header missing or empty" };
  if (typeof body_text !== "string" || !body_text.trim()) return { error: "body_text missing or empty" };
  if (typeof visual_strategy !== "string" || !visual_strategy.trim()) return { error: "visual_strategy missing or empty" };

  if (!isObj(skill)) return { error: "skill must be an object" };
  if (typeof skill.beginner !== "string" || !skill.beginner.trim()) return { error: "skill.beginner missing" };
  if (typeof skill.pro !== "string" || !skill.pro.trim()) return { error: "skill.pro missing" };

  const headerCheck = validateHeader(header, body_text);
  if ("error" in headerCheck) return { error: headerCheck.error };

  const jargonOut: JargonTerm[] = [];
  if (jargon !== undefined) {
    if (!Array.isArray(jargon)) return { error: "jargon must be an array" };
    if (jargon.length > 2) return { error: "jargon may not exceed 2 entries" };
    for (const j of jargon) {
      if (!isObj(j)) return { error: "jargon entry not an object" };
      if (typeof j.term !== "string" || !j.term.trim()) return { error: "jargon.term missing" };
      if (typeof j.definition !== "string" || !j.definition.trim()) return { error: "jargon.definition missing" };
      jargonOut.push({ term: j.term.trim(), definition: j.definition.trim() });
    }
  }

  return {
    header: header.trim(),
    body_text: body_text.trim(),
    skill: { beginner: skill.beginner.trim(), pro: skill.pro.trim() },
    jargon: jargonOut,
    visual_strategy: visual_strategy.trim(),
  };
}

// ----------------------------------------------------------------------------
// Banned-word checks (apply to both step body_text and description prose)
// ----------------------------------------------------------------------------
export const BANNED_ADJECTIVES = [
  "delicious","savory","savoury","tasty","mouthwatering","mouth-watering","perfect","amazing","incredible",
  "scrumptious","yummy","divine","heavenly","decadent","sumptuous","succulent",
];

export const BANNED_CHATTER_WORDS = [
  "just","actually","really","very","literally","honestly","basically","super","simply",
];

export const BANNED_SLOP_PHRASES = [
  "culinary journey","symphony of flavors","explosion of flavor","bursting with",
  "perfect for any occasion","crowd-pleaser","easy and delicious","your taste buds will thank you",
  "elevate your cooking","next-level","whip up","classic twist","without further ado","let's dive in",
  "trust me","hey friends","hands down",
];

export function findBannedTerms(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const adj of BANNED_ADJECTIVES) {
    const re = new RegExp(`\\b${adj.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) hits.push(adj);
  }
  for (const word of BANNED_CHATTER_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(lower)) hits.push(word);
  }
  for (const phrase of BANNED_SLOP_PHRASES) {
    if (lower.includes(phrase)) hits.push(phrase);
  }
  // Exclamation marks
  if (text.includes("!")) hits.push("exclamation mark");
  // "..." for dramatic pause (3+ dots, not at end-of-sentence)
  if (/\.{3,}/.test(text)) hits.push("ellipsis '...'");
  return Array.from(new Set(hits));
}

// Count sentence terminators (.!?) that aren't inside quotes
export function countSentences(text: string): number {
  let inQuote = false;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") inQuote = !inQuote;
    else if (!inQuote && (c === "." || c === "!" || c === "?")) {
      // Skip ellipsis runs
      if (c === "." && text[i + 1] === ".") continue;
      count++;
    }
  }
  return count;
}

// Soft check: rhythm — no two consecutive sentences with same word count.
// Returns conflicting pair indices, empty if rhythmic.
export function rhythmCheck(text: string): Array<[number, number]> {
  const sents = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const counts = sents.map((s) => tokenizeWords(s).length);
  const issues: Array<[number, number]> = [];
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] === counts[i - 1] && counts[i] > 0) issues.push([i - 1, i]);
  }
  return issues;
}

export function parseEnhancedDescription(raw: unknown): EnhancedDescription | { error: string } {
  if (!isObj(raw)) return { error: "description is not an object" };
  const { headnote_narrative, tagline, origin, technique_signature, ingredient_signature, audience, effort } = raw;

  if (typeof headnote_narrative !== "string" || !headnote_narrative.trim()) {
    return { error: "headnote_narrative missing or empty" };
  }
  const sentenceCount = countSentences(headnote_narrative);
  if (sentenceCount < 3) return { error: `headnote_narrative must be 3-10 sentences (got ${sentenceCount})` };
  if (sentenceCount > 10) return { error: `headnote_narrative must be 3-10 sentences (got ${sentenceCount})` };

  if (typeof tagline !== "string" || !tagline.trim()) return { error: "tagline missing or empty" };
  if (typeof technique_signature !== "string" || !technique_signature.trim()) return { error: "technique_signature missing" };
  if (typeof ingredient_signature !== "string" || !ingredient_signature.trim()) return { error: "ingredient_signature missing" };
  if (typeof audience !== "string" || !audience.trim()) return { error: "audience missing" };

  if (!isObj(origin)) return { error: "origin must be an object" };
  if (typeof origin.cuisine !== "string" || !origin.cuisine.trim()) return { error: "origin.cuisine missing" };
  if (typeof origin.tradition !== "string" || !origin.tradition.trim()) return { error: "origin.tradition missing" };

  if (!isObj(effort)) return { error: "effort must be an object" };
  if (typeof effort.time_feel !== "string" || !effort.time_feel.trim()) return { error: "effort.time_feel missing" };
  if (typeof effort.skill_level !== "string" || !SKILL_LEVELS.has(effort.skill_level)) {
    return { error: "effort.skill_level must be beginner|intermediate|advanced" };
  }
  if (typeof effort.forgiving !== "boolean") return { error: "effort.forgiving must be boolean" };

  // Banned-term scan across all prose fields
  const combinedProse = [headnote_narrative, tagline, origin.tradition, technique_signature, ingredient_signature, audience].join(" ");
  const banned = findBannedTerms(combinedProse);
  if (banned.length > 0) {
    return { error: `banned terms present: ${banned.join(", ")}` };
  }

  return {
    headnote_narrative: headnote_narrative.trim(),
    tagline: tagline.trim(),
    origin: { cuisine: origin.cuisine.trim(), tradition: origin.tradition.trim() },
    technique_signature: technique_signature.trim(),
    ingredient_signature: ingredient_signature.trim(),
    audience: audience.trim(),
    effort: {
      time_feel: effort.time_feel.trim(),
      skill_level: effort.skill_level as RecipeSkillLevel,
      forgiving: effort.forgiving,
    },
  };
}

// ----------------------------------------------------------------------------
// Consolidation pre-pass response parser
// ----------------------------------------------------------------------------
export function parseConsolidationResponse(raw: unknown, originalCount: number): string[] | { error: string } {
  if (!isObj(raw)) return { error: "consolidation response is not an object" };
  const arr = (raw as { consolidated_steps?: unknown }).consolidated_steps;
  if (!Array.isArray(arr)) return { error: "consolidated_steps must be an array" };
  if (arr.length === 0) return { error: "consolidated_steps is empty" };
  if (arr.length > originalCount) return { error: `consolidation must not increase step count (${arr.length} > ${originalCount})` };
  const out: string[] = [];
  for (const s of arr) {
    if (typeof s !== "string" || !s.trim()) return { error: "every consolidated step must be a non-empty string" };
    out.push(s.trim());
  }
  return out;
}

export function parseEnhanceRequest(raw: unknown): EnhanceRequest | { error: string } {
  if (!isObj(raw)) return { error: "body must be an object" };
  const { title, ingredients, instructions, description, target, step_index, consolidate } = raw;

  if (typeof title !== "string" || !title.trim()) return { error: "title required" };

  let resolvedTarget: "instructions" | "description" = "instructions";
  if (target !== undefined) {
    if (target !== "instructions" && target !== "description") return { error: "target must be 'instructions' or 'description'" };
    resolvedTarget = target;
  }

  let ings: EnhanceRequest["ingredients"] = [];
  if (ingredients !== undefined) {
    if (!Array.isArray(ingredients)) return { error: "ingredients must be an array" };
    ings = ingredients
      .filter((i): i is Record<string, unknown> => isObj(i))
      .map((i) => ({
        name: typeof i.name === "string" ? i.name : "",
        amount: typeof i.amount === "number" || typeof i.amount === "string" ? i.amount : undefined,
        unit: typeof i.unit === "string" ? i.unit : undefined,
      }))
      .filter((i) => i.name.trim().length > 0);
  }

  let stepsOut: string[] = [];
  if (instructions !== undefined) {
    if (!Array.isArray(instructions)) return { error: "instructions must be an array of strings" };
    stepsOut = instructions.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim());
    if (stepsOut.length > 40) return { error: "too many steps (max 40)" };
  }

  if (resolvedTarget === "instructions" && stepsOut.length === 0) {
    return { error: "instructions[] required for target=instructions" };
  }

  let idx: number | undefined;
  if (step_index !== undefined) {
    if (resolvedTarget !== "instructions") return { error: "step_index only valid with target=instructions" };
    if (typeof step_index !== "number" || !Number.isInteger(step_index) || step_index < 0) {
      return { error: "step_index must be a non-negative integer" };
    }
    if (step_index >= stepsOut.length) return { error: "step_index out of range" };
    idx = step_index;
  }

  let desc: string | undefined;
  if (description !== undefined) {
    if (typeof description !== "string") return { error: "description must be a string" };
    desc = description.trim();
  }

  // consolidate flag — default true for "all" mode, false for per-step
  let cons: boolean | undefined;
  if (consolidate !== undefined) {
    if (typeof consolidate !== "boolean") return { error: "consolidate must be boolean" };
    cons = consolidate;
  }

  return {
    title: title.trim(),
    ingredients: ings,
    instructions: stepsOut,
    description: desc,
    target: resolvedTarget,
    step_index: idx,
    consolidate: cons,
  };
}