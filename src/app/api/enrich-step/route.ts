import { ai, getModel } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { stepText } = await req.json();
  if (!stepText) return NextResponse.json({ text: "" }, { status: 400 });

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 250,
    messages: [
      {
        role: "system",
        content: `You are a culinary instructor writing cooking step explanations for home cooks.
Given a single recipe instruction, write 2–5 sentences that explain:
1. What the cook is doing
2. Why this step matters (flavour, texture, food safety, etc.)
3. The best technique or tip to do it well

Rules:
- Begin with the instruction itself, then expand it.
- Write in second person ("you"), present tense.
- Be practical and specific — mention sensory cues (colour, sound, smell) where relevant.
- Do NOT repeat words verbatim from the instruction more than once.
- Output plain prose only — no bullet points, no headers.`,
      },
      { role: "user", content: stepText },
    ],
  });

  const text = response.choices[0]?.message?.content ?? stepText;
  return NextResponse.json({ text });
}
