"use client";

const STEPS = [
  "welcome", "discover", "pantry", "plans", "kitchen", "social", "done",
] as const;

const STEP_LABELS: Record<string, string> = {
  welcome: "Welcome",
  discover: "Discover",
  pantry: "Pantry",
  plans: "Plans",
  kitchen: "Kitchen",
  social: "Social",
  done: "Ready",
};

export default function StepProgress({ currentStep }: { currentStep: string }) {
  const currentIndex = STEPS.indexOf(currentStep as typeof STEPS[number]);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#9A7A5A" }}>
        {STEP_LABELS[currentStep] ?? currentStep} — {currentIndex + 1} of {STEPS.length}
      </p>
      <div className="flex gap-1">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className="h-1 w-6 rounded-full transition-all duration-300"
            style={{
              background:
                i < currentIndex
                  ? "var(--wc-pal-accent, #B07D56)"
                  : i === currentIndex
                  ? "var(--wc-pal-accent, #B07D56)"
                  : "rgba(90,58,40,0.3)",
              opacity: i === currentIndex ? 0.7 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
