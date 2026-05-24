"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { VoiceState } from "@/lib/cooking-mode-context";

export type OracleCardType = null | "listening" | "answer" | "recovery";

export interface OracleCard {
  type: OracleCardType;
  text?: string;
}

interface Ingredient {
  name: string;
  amount?: number | null;
  unit?: string | null;
}

interface UseKitchenOracleVoiceOptions {
  voiceEnabled: boolean;
  voiceState: VoiceState;
  setVoiceState: (s: VoiceState) => void;
  stepText: string;
  stepIndex: number;
  recipeName: string;
  ingredients: Ingredient[];
  onNext: () => void;
  onPrev: () => void;
  onStartTimer: () => void;
}

const TIER1_NEXT = /\b(next|next step|go forward|forward)\b/i;
const TIER1_PREV = /\b(go back|back|previous|prev step)\b/i;
const TIER1_REPEAT = /\b(repeat|repeat that|say that again|read again)\b/i;
const TIER1_READ = /\b(read the step|read step|read it)\b/i;
const TIER1_TIMER = /\b(start timer|timer start|set timer)\b/i;
const TIER1_STOP = /\b(stop listening|stop voice|disable voice|stop)\b/i;
const TIER1_HOW_MUCH = /\bhow much (.+?)(\?|$)/i;

function isTier1(transcript: string): boolean {
  return (
    TIER1_NEXT.test(transcript) ||
    TIER1_PREV.test(transcript) ||
    TIER1_REPEAT.test(transcript) ||
    TIER1_READ.test(transcript) ||
    TIER1_TIMER.test(transcript) ||
    TIER1_STOP.test(transcript) ||
    TIER1_HOW_MUCH.test(transcript)
  );
}

export function useKitchenOracleVoice({
  voiceEnabled,
  voiceState,
  setVoiceState,
  stepText,
  stepIndex,
  recipeName,
  ingredients,
  onNext,
  onPrev,
  onStartTimer,
}: UseKitchenOracleVoiceOptions) {
  const [oracleCard, setOracleCard] = useState<OracleCard>({ type: null });
  const recogRef = useRef<SpeechRecognition | null>(null);
  const enabledRef = useRef(voiceEnabled);
  const cardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { enabledRef.current = voiceEnabled; }, [voiceEnabled]);

  const sttSupported =
    typeof window !== "undefined" &&
    !!(
      window.SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (enabledRef.current) setVoiceState("listening");
  }, [setVoiceState]);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.onstart = () => setVoiceState("speaking");
      utter.onend = () => {
        if (enabledRef.current) setVoiceState("listening");
        onDone?.();
      };
      utter.onerror = () => {
        if (enabledRef.current) setVoiceState("listening");
        onDone?.();
      };
      window.speechSynthesis.speak(utter);
    },
    [setVoiceState]
  );

  const showCard = useCallback((card: OracleCard, autoDismissMs = 8000) => {
    setOracleCard(card);
    if (cardTimeoutRef.current) clearTimeout(cardTimeoutRef.current);
    if (card.type !== "listening") {
      cardTimeoutRef.current = setTimeout(() => setOracleCard({ type: null }), autoDismissMs);
    }
  }, []);

  const callOracle = useCallback(
    async (query: string) => {
      showCard({ type: "listening" });
      try {
        const res = await fetch("/api/voice-oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, recipeName, stepIndex, stepText, ingredients }),
        });
        const data = (await res.json()) as { answer?: string; isRecovery?: boolean; error?: string };
        if (!res.ok || !data.answer) {
          const fallback = "I couldn't find an answer right now.";
          showCard({ type: "answer", text: fallback });
          speak(fallback);
          return;
        }
        showCard({ type: data.isRecovery ? "recovery" : "answer", text: data.answer });
        speak(data.answer);
      } catch {
        showCard({ type: "answer", text: "Something went wrong. Please try again." });
      }
    },
    [recipeName, stepIndex, stepText, ingredients, showCard, speak]
  );

  const handleTranscript = useCallback(
    (transcript: string) => {
      const t = transcript.toLowerCase().trim();

      if (TIER1_STOP.test(t)) { cancelSpeech(); setVoiceState("idle"); return; }
      if (TIER1_NEXT.test(t)) { cancelSpeech(); onNext(); return; }
      if (TIER1_PREV.test(t)) { cancelSpeech(); onPrev(); return; }
      if (TIER1_REPEAT.test(t) || TIER1_READ.test(t)) { speak(stepText); return; }
      if (TIER1_TIMER.test(t)) { cancelSpeech(); onStartTimer(); speak("Timer started."); return; }

      const howMuchMatch = TIER1_HOW_MUCH.exec(t);
      if (howMuchMatch) {
        const q = howMuchMatch[1].trim();
        const match = ingredients.find(
          (i) => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase())
        );
        if (match) {
          const qty = `${match.amount ?? ""} ${match.unit ?? ""} ${match.name}`.trim();
          showCard({ type: "answer", text: qty });
          speak(qty);
        } else {
          speak(`I don't see ${q} in this recipe.`);
        }
        return;
      }

      if (!isTier1(t)) void callOracle(transcript);
    },
    [cancelSpeech, setVoiceState, onNext, onPrev, speak, stepText, onStartTimer, ingredients, callOracle, showCard]
  );

  useEffect(() => {
    if (!sttSupported) return;

    if (!voiceEnabled) {
      recogRef.current?.abort();
      recogRef.current = null;
      cancelSpeech();
      setOracleCard({ type: null });
      return;
    }

    const SpeechRecog =
      window.SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecog) return;
    const recog = new SpeechRecog();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-US";

    recog.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        handleTranscript(transcript);
      }
    };

    recog.onend = () => {
      if (enabledRef.current) {
        try { recog.start(); } catch { /* already starting */ }
      }
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      console.warn("[voice] STT error:", e.error);
    };

    recogRef.current = recog;

    try {
      recog.start();
      setVoiceState("listening");
      speak(stepText);
    } catch {
      // Mic permission denied or unavailable
    }

    return () => {
      recog.onend = null;
      recog.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  useEffect(() => {
    if (voiceEnabled && sttSupported) speak(stepText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  return { oracleCard, sttSupported, cancelSpeech };
}
