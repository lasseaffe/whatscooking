import OpenAI from "openai";
import { execFile, spawn } from "child_process";

// ---------------------------------------------------------------------------
// Local inference servers
// ---------------------------------------------------------------------------

const LLAMACPP_EXE =
  process.env.LLAMACPP_EXE ??
  "C:\\Users\\lasse\\Downloads\\llama-b9090-bin-win-cpu-x64\\llama-server.exe";
const LLAMACPP_MODEL_PATH =
  process.env.LLAMACPP_MODEL_PATH ??
  "C:\\Users\\lasse\\.cache\\huggingface\\hub\\models--hugging-quants--Llama-3.2-3B-Instruct-Q4_K_M-GGUF\\snapshots\\eb72f2a08dd2b9edd07ffacfe5aa56938b7939b0\\llama-3.2-3b-instruct-q4_k_m.gguf";
const LLAMACPP_PORT = 8080;
const LLAMACPP_THREADS = 6;
const LLAMACPP_CTX_MAX = 8192; // hard cap to avoid OOM on a 3B Q4 model

const LLAMACPP_BASE = `http://localhost:${LLAMACPP_PORT}/v1`;
const LLAMACPP_MODEL = "llama-3.2-3b-instruct-q4_k_m.gguf";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const OLLAMA_TEXT_MODEL = "qwen3:8b";
const OLLAMA_VISION_MODEL = "gemma4:latest";

const aiLlamaCpp = new OpenAI({ apiKey: "not-needed", baseURL: LLAMACPP_BASE });
const aiOllama = new OpenAI({ apiKey: "not-needed", baseURL: OLLAMA_BASE });

// ---------------------------------------------------------------------------
// Model selectors
// ---------------------------------------------------------------------------

export function getModel(): string {
  return LLAMACPP_MODEL;
}

export function getVisionModel(): string {
  return OLLAMA_VISION_MODEL;
}

// ---------------------------------------------------------------------------
// Context-exceeded detection
// ---------------------------------------------------------------------------

function isContextExceeded(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes("context full") ||
    msg.includes("context_length_exceeded") ||
    msg.includes("tokens exceed") ||
    msg.includes("too many tokens") ||
    msg.includes("prompt is too long") ||
    msg.includes("kv cache")
  );
}

// ---------------------------------------------------------------------------
// llama.cpp process management
// ---------------------------------------------------------------------------

// Tracks the context size the running server was launched with.
// Seeded conservatively; overwritten after the first /v1/models probe.
let currentCtxSize = 512;
let ctxSizeDiscovered = false;

async function discoverCtxSize(): Promise<void> {
  if (ctxSizeDiscovered) return;
  try {
    const res = await fetch(`http://localhost:${LLAMACPP_PORT}/v1/models`);
    const json = (await res.json()) as {
      data?: Array<{ meta?: { n_ctx?: number } }>;
    };
    const ctx = json.data?.[0]?.meta?.n_ctx;
    if (ctx) {
      currentCtxSize = ctx;
      ctxSizeDiscovered = true;
    }
  } catch {
    // server not running — will be caught later
  }
}

function killLlamaCpp(): Promise<void> {
  return new Promise((resolve) => {
    // execFile avoids shell injection; args are passed as an array
    execFile("taskkill", ["/F", "/IM", "llama-server.exe"], () => resolve());
  });
}

async function waitForLlamaCpp(timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${LLAMACPP_PORT}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`llama-server did not become healthy within ${timeoutMs}ms`);
}

function startLlamaCpp(ctxSize: number): void {
  console.log(`[ai] Starting llama-server --ctx-size ${ctxSize}`);
  const child = spawn(
    LLAMACPP_EXE,
    [
      "-m", LLAMACPP_MODEL_PATH,
      "--host", "0.0.0.0",
      "--port", String(LLAMACPP_PORT),
      "--ctx-size", String(ctxSize),
      "--threads", String(LLAMACPP_THREADS),
      "-n", "-1",
    ],
    { detached: true, stdio: "ignore" }
  );
  child.unref();
}

async function restartWithLargerContext(): Promise<boolean> {
  const newCtx = Math.min(currentCtxSize * 2, LLAMACPP_CTX_MAX);
  if (newCtx <= currentCtxSize) {
    console.warn(`[ai] Already at max context (${LLAMACPP_CTX_MAX}), skipping restart`);
    return false;
  }
  console.log(`[ai] Restarting llama-server: ctx ${currentCtxSize} → ${newCtx}`);
  await killLlamaCpp();
  await new Promise((r) => setTimeout(r, 1000)); // let the port release
  startLlamaCpp(newCtx);
  await waitForLlamaCpp();
  currentCtxSize = newCtx;
  ctxSizeDiscovered = true;
  return true;
}

// ---------------------------------------------------------------------------
// Smart proxy client
// ---------------------------------------------------------------------------
// All existing call sites use `ai.chat.completions.create(...)` unchanged.
//
// Routing:
//   vision calls (image_url in messages) → Ollama gemma4
//   text calls → llama.cpp
//     on context-exceeded → restart with 2× ctx, retry
//     on any failure → Ollama qwen3 fallback

function hasImageContent(messages: OpenAI.Chat.ChatCompletionMessageParam[]): boolean {
  return messages.some((m) => {
    if (!Array.isArray(m.content)) return false;
    return (m.content as OpenAI.Chat.ChatCompletionContentPart[]).some(
      (p) => p.type === "image_url"
    );
  });
}

type CompletionCreateParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming &
  Partial<OpenAI.Chat.ChatCompletionCreateParamsStreaming>;

type CompletionResult =
  | OpenAI.Chat.ChatCompletion
  | AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;

async function llamaCppCreate(params: CompletionCreateParams): Promise<CompletionResult> {
  return (
    aiLlamaCpp.chat.completions.create as (
      p: CompletionCreateParams
    ) => Promise<OpenAI.Chat.ChatCompletion>
  )({ ...params, model: LLAMACPP_MODEL });
}

async function ollamaTextCreate(params: CompletionCreateParams): Promise<CompletionResult> {
  return (
    aiOllama.chat.completions.create as (
      p: CompletionCreateParams
    ) => Promise<OpenAI.Chat.ChatCompletion>
  )({ ...params, model: OLLAMA_TEXT_MODEL });
}

async function smartCreate(params: CompletionCreateParams): Promise<CompletionResult> {
  if (hasImageContent(params.messages)) {
    return (
      aiOllama.chat.completions.create as (
        p: CompletionCreateParams
      ) => Promise<OpenAI.Chat.ChatCompletion>
    )({ ...params, model: OLLAMA_VISION_MODEL });
  }

  await discoverCtxSize();

  // Attempt 1: llama.cpp at current context size
  try {
    return await llamaCppCreate(params);
  } catch (firstErr) {
    if (isContextExceeded(firstErr)) {
      // Auto-resize: kill → restart with 2× ctx → retry
      const restarted = await restartWithLargerContext();
      if (restarted) {
        try {
          return await llamaCppCreate(params);
        } catch (retryErr) {
          if (!isContextExceeded(retryErr)) {
            console.warn("[ai] llama.cpp retry failed:", (retryErr as Error).message);
          }
          // context still too small or hard error — fall through to Ollama
        }
      }
    } else {
      console.warn("[ai] llama.cpp error, falling back to Ollama:", (firstErr as Error).message);
    }
  }

  return ollamaTextCreate(params);
}

export const ai = {
  chat: {
    completions: {
      create: smartCreate,
    },
  },
} as unknown as OpenAI;
