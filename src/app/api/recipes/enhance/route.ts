import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  RECIPE_ENHANCE_SYSTEM_PROMPT,
  RECIPE_DESCRIPTION_ENHANCE_PROMPT,
  RECIPE_STEP_CONSOLIDATION_PROMPT,
} from "@/lib/enhance/recipe-enhance-prompt";
import {
  parseEnhanceRequest,
  parseEnhancedStep,
  parseEnhancedDescription,
  parseConsolidationResponse,
  findBannedTerms,
} from "@/lib/enhance/recipe-enhance-schema";
import type { EnhancedStep, EnhancedDescription } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory rate limit. Resets on cold start. Promote to a Supabase row for multi-instance prod.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_CALLS = 60;
const rateBuckets = new Map<string, number[]>();

function checkAndConsumeRate(userId: string, cost: number): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const bucket = (rateBuckets.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.length + cost > RATE_MAX_CALLS) {
    const oldest = bucket[0] ?? now;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000)) };
  }
  for (let i = 0; i < cost; i++) bucket.push(now);
  rateBuckets.set(userId, bucket);
  return { ok: true };
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
}

// ----------------------------------------------------------------------------
// Consolidation pre-pass (one LLM call, optional)
// ----------------------------------------------------------------------------
async function consolidateSteps(plain: string[]): Promise<string[] | { error: string }> {
  if (plain.length <= 6) return plain; // nothing to consolidate
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    system: RECIPE_STEP_CONSOLIDATION_PROMPT,
    messages: [
      {
        role: "user",
        content: `Plain steps (${plain.length} total):\n${plain.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nReturn only the JSON object with the consolidated_steps array.`,
      },
    ],
  });
  const block = msg.content[0];
  const text = block?.type === "text" ? block.text : "";
  let cleaned = stripFences(text);
  try {
    const parsed = parseConsolidationResponse(JSON.parse(cleaned), plain.length);
    if (Array.isArray(parsed)) return parsed;
    return parsed;
  } catch (e) {
    return { error: `consolidation unparseable: ${(e as Error).message}` };
  }
}

// ----------------------------------------------------------------------------
// Step enhance (one per step, parallel-safe)
// ----------------------------------------------------------------------------
function buildStepUserMessage(args: {
  title: string;
  ingredients: Array<{ name: string; amount?: number | string; unit?: string }>;
  instructions: string[];
  index: number;
}) {
  const ingLines = args.ingredients.map((i) => `- ${[i.amount, i.unit, i.name].filter(Boolean).join(" ")}`).join("\n") || "(none provided)";
  const stepLines = args.instructions.map((s, i) => `${i === args.index ? ">> " : "   "}${i + 1}. ${s}`).join("\n");
  return `RECIPE: ${args.title}

INGREDIENTS:
${ingLines}

ALL STEPS (the one marked ">>" is the one to enhance):
${stepLines}

Enhance step ${args.index + 1} only. Return ONLY the JSON object for that single step matching the schema in the system prompt. No markdown fences, no commentary. Pay attention to the HEADER RULES.`;
}

async function enhanceStep(args: {
  title: string;
  ingredients: Array<{ name: string; amount?: number | string; unit?: string }>;
  instructions: string[];
  index: number;
}): Promise<EnhancedStep | { error: string }> {
  const userMsg = buildStepUserMessage(args);

  const callOnce = async (followup?: string) => {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: RECIPE_ENHANCE_SYSTEM_PROMPT,
      messages: followup
        ? [
            { role: "user", content: userMsg },
            { role: "assistant", content: "{}" },
            { role: "user", content: followup },
          ]
        : [{ role: "user", content: userMsg }],
    });
    const block = msg.content[0];
    return block?.type === "text" ? block.text : "";
  };

  let text = await callOnce();
  let cleaned = stripFences(text);
  let lastError = "";
  try {
    const parsed = parseEnhancedStep(JSON.parse(cleaned));
    if (!("error" in parsed)) return parsed;
    lastError = parsed.error;
  } catch (e) {
    lastError = (e as Error).message;
  }

  // Retry once with the specific error called out
  text = await callOnce(
    `Your previous response was invalid: ${lastError}. Reply now with ONLY a JSON object matching the exact schema. The header must start with an action verb (gerund or imperative), be 3-6 words, end on a noun (not a preposition), and NOT appear as a substring inside the first 12 words of body_text.`,
  );
  cleaned = stripFences(text);
  try {
    const parsed = parseEnhancedStep(JSON.parse(cleaned));
    if (!("error" in parsed)) return parsed;
    return { error: `validation failed after retry: ${parsed.error}` };
  } catch (e) {
    return { error: `unparseable JSON after retry: ${(e as Error).message}` };
  }
}

// ----------------------------------------------------------------------------
// Description enhance (one LLM call, with banned-word retry)
// ----------------------------------------------------------------------------
function buildDescriptionUserMessage(args: {
  title: string;
  ingredients: Array<{ name: string; amount?: number | string; unit?: string }>;
  instructions: string[];
  description?: string;
}) {
  const ingLines = args.ingredients.map((i) => `- ${[i.amount, i.unit, i.name].filter(Boolean).join(" ")}`).join("\n") || "(none provided)";
  const stepLines = args.instructions.length > 0
    ? args.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "(no steps provided)";
  const prior = args.description?.trim()
    ? `\n\nEXISTING DESCRIPTION (may be empty, messy, or full of slop - rewrite, do not extend):\n${args.description}`
    : "\n\nEXISTING DESCRIPTION: (none - infer from the title, ingredients, and steps)";
  return `TITLE: ${args.title}

INGREDIENTS:
${ingLines}

STEPS:
${stepLines}${prior}

Produce the headnote_narrative (3-10 sentences) plus the structured fields. Choose ONE opening hook (Sensory, Context, or Technique). Use tactile verbs. Include one mentorship warning. Use contractions. Strip every banned adjective, every banned chatter word, every banned slop phrase. Return ONLY the JSON.`;
}

async function enhanceDescription(args: {
  title: string;
  ingredients: Array<{ name: string; amount?: number | string; unit?: string }>;
  instructions: string[];
  description?: string;
}): Promise<EnhancedDescription | { error: string }> {
  const userMsg = buildDescriptionUserMessage(args);

  const callOnce = async (followup?: string) => {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: RECIPE_DESCRIPTION_ENHANCE_PROMPT,
      messages: followup
        ? [
            { role: "user", content: userMsg },
            { role: "assistant", content: "{}" },
            { role: "user", content: followup },
          ]
        : [{ role: "user", content: userMsg }],
    });
    const block = msg.content[0];
    return block?.type === "text" ? block.text : "";
  };

  let text = await callOnce();
  let cleaned = stripFences(text);
  let lastError = "";
  let bannedHits: string[] = [];
  try {
    const obj = JSON.parse(cleaned) as Record<string, unknown>;
    // Pre-flight banned scan across the prose fields for a sharper retry message
    const proseFields = [obj.headnote_narrative, obj.tagline, obj.technique_signature, obj.ingredient_signature, obj.audience];
    const proseJoined = proseFields.filter((v): v is string => typeof v === "string").join(" ");
    bannedHits = findBannedTerms(proseJoined);
    const parsed = parseEnhancedDescription(obj);
    if (!("error" in parsed)) return parsed;
    lastError = parsed.error;
  } catch (e) {
    lastError = (e as Error).message;
  }

  const followup = bannedHits.length > 0
    ? `Your previous response contained banned terms: ${bannedHits.join(", ")}. Rewrite the prose so NONE of these words or phrases appear, while keeping the same six fields and 3-10 sentence headnote. Return ONLY the JSON.`
    : `Your previous response was invalid: ${lastError}. Reply now with ONLY the JSON matching the schema. headnote_narrative must be 3-10 sentences, no banned adjectives or chatter words, no exclamation marks, no "...". All structured fields required.`;

  text = await callOnce(followup);
  cleaned = stripFences(text);
  try {
    const parsed = parseEnhancedDescription(JSON.parse(cleaned));
    if (!("error" in parsed)) return parsed;
    return { error: `validation failed after retry: ${parsed.error}` };
  } catch (e) {
    return { error: `unparseable JSON after retry: ${(e as Error).message}` };
  }
}

// ----------------------------------------------------------------------------
// Route
// ----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const json = await req.json().catch(() => null);
    const parsed = parseEnhanceRequest(json);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    // ----- DESCRIPTION TARGET -----
    if (parsed.target === "description") {
      const rate = checkAndConsumeRate(user.id, 1);
      if (!rate.ok) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again later.", retry_after_seconds: rate.retryAfter },
          { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
        );
      }
      const out = await enhanceDescription({
        title: parsed.title,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        description: parsed.description,
      });
      if ("error" in out) return NextResponse.json({ error: out.error }, { status: 502 });
      return NextResponse.json({ description: out });
    }

    // ----- INSTRUCTIONS TARGET -----

    // Per-step enhance — skip consolidation
    if (parsed.step_index !== undefined) {
      const rate = checkAndConsumeRate(user.id, 1);
      if (!rate.ok) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again later.", retry_after_seconds: rate.retryAfter },
          { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
        );
      }
      const out = await enhanceStep({
        title: parsed.title,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        index: parsed.step_index,
      });
      if ("error" in out) return NextResponse.json({ error: out.error }, { status: 502 });
      return NextResponse.json({ step: out, index: parsed.step_index });
    }

    // All-mode: optional consolidation pre-pass
    const wantConsolidate = parsed.consolidate !== false; // default true
    const originalCount = parsed.instructions.length;

    let workingSteps = parsed.instructions;
    let consolidated_steps: string[] | undefined;

    if (wantConsolidate && originalCount > 6) {
      // Pre-flight rate check including the consolidation call
      const rate = checkAndConsumeRate(user.id, 1);
      if (!rate.ok) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again later.", retry_after_seconds: rate.retryAfter },
          { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
        );
      }
      const out = await consolidateSteps(parsed.instructions);
      if (Array.isArray(out)) {
        workingSteps = out;
        consolidated_steps = out;
      } else {
        // Consolidation failed — fall back to original list, log only
        console.warn("[enhance] consolidation failed, using original steps:", out.error);
      }
    }

    // Now charge for the per-step calls
    const rate = checkAndConsumeRate(user.id, workingSteps.length);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", retry_after_seconds: rate.retryAfter },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const results = await Promise.all(
      workingSteps.map((_, i) =>
        enhanceStep({
          title: parsed.title,
          ingredients: parsed.ingredients,
          instructions: workingSteps,
          index: i,
        }),
      ),
    );
    const firstError = results.find((r): r is { error: string } => "error" in r);
    if (firstError) return NextResponse.json({ error: firstError.error }, { status: 502 });

    return NextResponse.json({
      steps: results as EnhancedStep[],
      original_count: originalCount,
      ...(consolidated_steps ? { consolidated_steps } : {}),
    });
  } catch (err) {
    console.error("/api/recipes/enhance error:", err);
    return NextResponse.json({ error: "Failed to enhance recipe" }, { status: 500 });
  }
}