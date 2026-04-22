"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  recipeTitle?: string;
  ingredients?: { name: string }[];
}

const QUICK_PROMPTS = [
  "My sauce is too salty",
  "I don't have this ingredient",
  "My sauce is broken/curdled",
  "How do I know it's cooked through?",
];

export function SOSCookingHelper({ recipeTitle, ingredients }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", text: "" };
    setMessages((m) => [...m, assistantMsg]);

    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          recipeTitle,
          ingredients,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((m) => {
          const updated = [...m];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: updated[updated.length - 1].text + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { role: "assistant", text: "Sorry, something went wrong. Try again." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #C85A2F 0%, #A84520 100%)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(200,90,47,0.4)",
          display: open ? "none" : "flex",
        }}
        aria-label="SOS Kitchen Help"
      >
        <span style={{ fontSize: 18 }}>🆘</span>
        <span>SOS Help</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "#FFFBF7",
              border: "1px solid #E8E0D4",
              maxHeight: "80vh",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ background: "linear-gradient(135deg, #C85A2F 0%, #A84520 100%)" }}
            >
              <span style={{ fontSize: 24 }}>🆘</span>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">SOS Kitchen Helper</p>
                {recipeTitle && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Cooking: {recipeTitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{ color: "#fff" }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 && (
                <div>
                  <p className="text-sm text-center mb-4" style={{ color: "#A69180" }}>
                    Stuck mid-cook? Ask anything — I&apos;m here.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="text-xs px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-80"
                        style={{ background: "#F5E6D3", color: "#5D4037", border: "1px solid #E8D5C0" }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <span className="text-lg mr-2 shrink-0 mt-0.5">👨‍🍳</span>
                  )}
                  <div
                    className="rounded-2xl px-4 py-3 text-sm max-w-[85%] leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "#C85A2F" : "#F5EDE6",
                      color: msg.role === "user" ? "#fff" : "#3D2817",
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    }}
                  >
                    {msg.text || (
                      <span className="flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 py-3 flex gap-2"
              style={{ borderTop: "1px solid #E8E0D4", background: "#FFFBF7" }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                placeholder="What's going wrong?"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  background: "#F5EDE6",
                  color: "#3D2817",
                  border: "1px solid #DDD5C8",
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                style={{ background: "#C85A2F", color: "#fff" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
