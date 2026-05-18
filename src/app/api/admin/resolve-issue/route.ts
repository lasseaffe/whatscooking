import { NextRequest } from "next/server";
import { ai, getModel } from "@/lib/ai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const LOG_FILE = path.join(process.cwd(), "logs", "admin-complex-fixes.log");

function appendToLog(entry: string) {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, entry + "\n\n");
  } catch (e) {
    console.error("Failed to write to log:", e);
  }
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const issue: string = body.issue ?? "";
  const recipeId: string | null = body.recipeId ?? null;

  if (!issue.trim()) {
    return new Response(JSON.stringify({ error: "Issue description required" }), { status: 400 });
  }

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a technical assistant for the "What's Cooking" recipe app (Next.js + Supabase).

A user has reported this issue${recipeId ? ` for recipe ID ${recipeId}` : ""}:

${issue}

Analyze the issue and provide:
1. Root cause diagnosis (2-3 sentences)
2. Recommended fix — be specific about what file/query/field to change
3. SQL or code snippet if applicable
4. Risk level: Low / Medium / High

Format as:
## Root Cause
...

## Recommended Fix
...

## Code/SQL
\`\`\`
...
\`\`\`

## Risk
...`,
      },
    ],
  });

  const proposal = response.choices[0]?.message?.content?.trim() ?? "No proposal generated.";
  const timestamp = new Date().toISOString();

  const logEntry = `## [${timestamp}] Issue Report
${recipeId ? `Recipe ID: ${recipeId}\n` : ""}
### Issue
${issue}

### AI Proposal
${proposal}
---`;

  appendToLog(logEntry);

  return new Response(JSON.stringify({ proposal, timestamp }), {
    headers: { "Content-Type": "application/json" },
  });
}
