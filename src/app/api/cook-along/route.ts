import { NextRequest, NextResponse } from "next/server";
import { ai, getModel } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CookAlongRequest {
  recipeId: string;
  recipeTitle: string;
  ingredients: { name: string; amount?: number | null; unit?: string | null }[];
  steps: string[];
  stepIndex: number;
  messages: ChatMessage[];
  message: string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipeId = req.nextUrl.searchParams.get("recipe_id");
  if (!recipeId) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("cook_along_messages")
    .select("role, content, step_index, created_at")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: CookAlongRequest = await req.json();
  const { recipeId, recipeTitle, ingredients, steps, stepIndex, messages, message } = body;

  if (!recipeTitle?.trim()) return NextResponse.json({ error: "recipeTitle required" }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });
  if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });

  const currentStep = steps[stepIndex] ?? steps[0] ?? "";
  const ingredientList = ingredients
    .map((i) => `${i.amount ?? ""}${i.unit ? " " + i.unit : ""} ${i.name}`.trim())
    .join(", ");

  const systemPrompt = `You are a calm, experienced chef assistant helping someone cook "${recipeTitle}" right now. They are on step ${stepIndex + 1} of ${steps.length}: "${currentStep}". Full ingredient list: ${ingredientList}. Answer concisely in 1-3 sentences. Be specific to this recipe and the current step. Write in second person, present tense.`;

  const allMessages: ChatMessage[] = [
    ...messages.slice(-10),
    { role: "user", content: message },
  ];

  const userId = user.id;

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        // The ai client's smartCreate wraps a non-streaming OpenAI call,
        // so we call without stream:true and emit the full response as one chunk.
        const completion = await ai.chat.completions.create({
          model: getModel(),
          max_tokens: 300,
          messages: [
            { role: "system", content: systemPrompt },
            ...allMessages,
          ],
        });

        fullResponse = completion.choices[0]?.message?.content ?? "";
        if (fullResponse) {
          controller.enqueue(new TextEncoder().encode(fullResponse));
        }
      } catch (err) {
        console.error("[cook-along] AI call failed:", err);
        fullResponse = "";
      } finally {
        controller.close();

        // Persist both turns after streaming completes
        if (fullResponse) {
          try {
            const serviceClient = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            await serviceClient.from("cook_along_messages").insert([
              { user_id: userId, recipe_id: recipeId, role: "user", content: message, step_index: stepIndex },
              { user_id: userId, recipe_id: recipeId, role: "assistant", content: fullResponse, step_index: stepIndex },
            ]);
          } catch (persistErr) {
            console.error("[cook-along] persist failed:", persistErr);
          }
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
