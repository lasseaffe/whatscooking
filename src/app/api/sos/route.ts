import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message, recipeTitle, ingredients } = await req.json();

  const context = recipeTitle
    ? `The user is currently cooking: "${recipeTitle}"${ingredients?.length ? `. Ingredients in this recipe: ${ingredients.map((i: { name: string }) => i.name).join(", ")}.` : ""}`
    : "The user is in the kitchen and needs help.";

  const systemPrompt = `You are an SOS Kitchen Helper — a calm, expert chef available when home cooks hit a problem mid-cook. ${context}

Your role: give fast, practical fixes in 2–4 sentences max. No fluff. No lengthy intros.
Cover: ingredient substitutions, fixing mistakes (too salty, broken sauce, undercooked), technique questions, food safety.
Tone: confident, friendly, like a chef standing next to them.`;

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
