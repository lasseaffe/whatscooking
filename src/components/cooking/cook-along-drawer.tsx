"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { springGentle } from "@/lib/motion";
import type { Ingredient } from "@/app/(app)/recipes/[id]/cooking-mode-screen";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CookAlongDrawerProps {
  recipeId: string;
  recipeTitle: string;
  ingredients: Ingredient[];
  steps: string[];
  currentStepIndex: number;
  prefillMessage?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CookAlongDrawer({
  recipeId,
  recipeTitle,
  ingredients,
  steps,
  currentStepIndex,
  prefillMessage,
  isOpen,
  onClose,
}: CookAlongDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [hadPriorSession, setHadPriorSession] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Load history on first open
  useEffect(() => {
    if (!isOpen || loadedHistory) return;
    setLoadedHistory(true);
    fetch(`/api/cook-along?recipe_id=${encodeURIComponent(recipeId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: m.content,
          })));
          setHadPriorSession(true);
        }
      })
      .catch(() => {});
  }, [isOpen, loadedHistory, recipeId]);

  // Apply prefill when drawer opens
  useEffect(() => {
    if (isOpen && prefillMessage) {
      setInput(prefillMessage);
    }
  }, [isOpen, prefillMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { role: "user", content: text };
    // Build history including the new user turn before setState (which is async)
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/cook-along", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          recipeId,
          recipeTitle,
          ingredients,
          steps,
          stepIndex: currentStepIndex,
          messages: nextMessages,
          message: text,
        }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Try again." },
        ]);
        return;
      }

      // Stream the response character by character
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, recipeId, recipeTitle, ingredients, steps, currentStepIndex, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80) onClose();
  };

  const currentStepPreview = steps[currentStepIndex]?.slice(0, 40) ?? "";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={springGentle}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "55vh",
        background: "#FFFBF7",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Drag handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#D1C5B8" }} />
      </div>

      {/* Step context pill */}
      {currentStepPreview && (
        <div
          style={{
            margin: "0 16px 8px",
            padding: "4px 10px",
            background: "#FEF3C7",
            borderRadius: 20,
            fontSize: 11,
            color: "#92400E",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Context: Step {currentStepIndex + 1} — {currentStepPreview}{currentStepPreview.length === 40 ? "…" : ""}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {hadPriorSession && messages.length > 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#A89080", marginTop: 4 }}>
            — Continued from last time —
          </div>
        )}

        {messages.length === 0 && !sending && (
          <div style={{ textAlign: "center", color: "#A89080", fontSize: 13, marginTop: 24 }}>
            Ask your chef assistant anything about this recipe
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            {msg.role === "assistant" && (
              <span style={{ fontSize: 18, lineHeight: 1 }}>👨‍🍳</span>
            )}
            <div
              style={{
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#F59E0B" : "#F3F0EB",
                color: msg.role === "user" ? "#fff" : "#2D1F0E",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {msg.content || <span style={{ opacity: 0.5 }}>…</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 16px 20px",
          borderTop: "1px solid #EDE8E3",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this recipe…"
          disabled={sending}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 24,
            border: "1px solid #D1C5B8",
            background: "#FAF7F4",
            fontSize: 14,
            outline: "none",
            color: "#2D1F0E",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          aria-label="Send message"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: sending || !input.trim() ? "#D1C5B8" : "#F59E0B",
            border: "none",
            cursor: sending || !input.trim() ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            transition: "background 0.15s",
          }}
        >
          {sending ? "…" : "↑"}
        </button>
      </div>
    </motion.div>
  );
}
