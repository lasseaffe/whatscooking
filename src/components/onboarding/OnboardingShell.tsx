"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepProgress from "./StepProgress";

const STEPS = [
  "welcome", "discover", "pantry", "plans", "kitchen", "social", "done",
] as const;
type Step = typeof STEPS[number];

interface Props {
  currentStep: string;
  children: React.ReactNode;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}

export default function OnboardingShell({
  currentStep,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
}: Props) {
  const router = useRouter();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const currentIndex = STEPS.indexOf(currentStep as Step);
  const isFirst = currentIndex === 0;

  function handleSkip() {
    localStorage.setItem("wc-onboarding-done", "1");
    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0F0905" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(58,36,22,0.4)" }}
      >
        <span
          className="font-bold text-lg"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          What&apos;s Cooking
        </span>
        <StepProgress currentStep={currentStep} />
        <button
          onClick={() => setShowSkipConfirm(true)}
          className="text-xs font-mono tracking-widest uppercase transition-colors"
          style={{ color: "#5A3A28" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#9A7A5A")}
          onMouseLeave={e => (e.currentTarget.style.color = "#5A3A28")}
        >
          Skip tour
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-10 overflow-y-auto">
        <div className="w-full max-w-[640px]">{children}</div>
      </main>

      {/* Bottom nav */}
      <footer
        className="px-6 py-4 flex justify-between items-center"
        style={{ borderTop: "1px solid rgba(58,36,22,0.4)" }}
      >
        <button
          onClick={onBack}
          disabled={isFirst}
          className="px-5 py-2 text-sm font-mono rounded transition-colors disabled:opacity-30"
          style={{
            color: "#9A7A5A",
            border: "1px solid rgba(58,36,22,0.4)",
            background: "transparent",
          }}
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={continueDisabled}
          className="px-6 py-2 text-sm font-mono rounded font-semibold transition-colors disabled:opacity-40"
          style={{
            background: "var(--wc-pal-accent, #B07D56)",
            color: "#0F0905",
          }}
        >
          {continueLabel} →
        </button>
      </footer>

      {/* Skip confirm */}
      {showSkipConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ background: "#1a1008", border: "1px solid rgba(58,36,22,0.6)" }}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Skip the tour?
            </h3>
            <p className="text-sm mb-6" style={{ color: "#7A5A40" }}>
              You can always restart it from Settings → App Tour.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="px-4 py-2 text-sm font-mono rounded transition-colors"
                style={{ color: "#9A7A5A", border: "1px solid rgba(58,36,22,0.4)", background: "transparent" }}
              >
                Keep going
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-mono rounded font-semibold"
                style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#0F0905" }}
              >
                Skip tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
