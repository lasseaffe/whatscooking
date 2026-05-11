"use client";

import { useEffect } from "react";
import { Flame } from "lucide-react";

export default function DoneStep() {
  useEffect(() => {
    localStorage.setItem("wc-onboarding", JSON.stringify({
      mode: 'done', wizardStep: 0, tourStep: 0,
      wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
    }));
  }, []);

  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center gap-6"
      style={{ background: "rgba(26,16,8,0.7)", border: "1px solid rgba(58,36,22,0.5)" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}
      >
        <Flame style={{ width: 40, height: 40, color: "var(--wc-pal-accent, #B07D56)" }} />
      </div>
      <div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          You&apos;re ready to cook
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#9A7A5A" }}>
          You know the kitchen — Discover, Pantry, Plans, Cookbooks, Dinner Parties.
          Your dashboard is your home base. You can always revisit this tour from Settings → App Tour.
          Now let&apos;s cook something.
        </p>
      </div>
    </div>
  );
}
