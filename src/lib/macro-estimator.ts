// src/lib/macro-estimator.ts
//
// Display-time per-portion macro estimator. Uses Anthropic Haiku directly via
// @anthropic-ai/sdk. Bump ESTIMATOR_VERSION to invalidate cached estimates en
// masse when the prompt or schema changes.

import Anthropic from "@anthropic-ai/sdk";

export const ESTIMATOR_VERSION = "v1-2026-05";

export interface EstimatedMacros {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sat_fat_g: number | null;
  sodium_mg: number | null;
}

const FIELDS: (keyof EstimatedMacros)[] = [
  "calories",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "sugar_g",
  "sat_fat_g",
  "sodium_mg",
];

function coerceField(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "number") return null;
  if (!Number.isFinite(raw)) return null;
  return raw;
}

function parseMacros(text: string): EstimatedMacros {
  // Strip code fences if present
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      raw = JSON.parse(cleaned.slice(start, end + 1));
    } else {
      throw new Error("estimator returned non-JSON text");
    }
  }

  const out = {} as EstimatedMacros;
  for (const f of FIELDS) {
    out[f] = coerceField(raw[f]);
  }
  return out;
}

export async function estimateMacros(input: {
  title: string;
  ingredients: unknown;
  servings: number | null;
}): Promise<EstimatedMacros> {
  // Instantiate inside the function — module-level init has caused deploy
  // failures (commit 1664856).
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPayload = {
    title: input.title,
    servings: input.servings ?? 1,
    ingredients: input.ingredients,
  };

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:
      "You estimate per-portion nutrition from an ingredient list. Be conservative. " +
      "Use null for fields you cannot reasonably estimate. " +
      "Return ONLY a single JSON object with these numeric (or null) fields: " +
      "calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sat_fat_g, sodium_mg. " +
      "All values are per single serving. No prose, no code fences.",
    messages: [
      {
        role: "user",
        content: JSON.stringify(userPayload),
      },
    ],
  });

  const block = message.content[0];
  const text = block && block.type === "text" ? block.text : "{}";
  return parseMacros(text);
}
