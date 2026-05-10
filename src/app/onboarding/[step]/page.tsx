"use client";

import { useRouter, useParams } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import WelcomeStep from "@/components/onboarding/steps/WelcomeStep";
import DiscoverStep from "@/components/onboarding/steps/DiscoverStep";
import PantryStep from "@/components/onboarding/steps/PantryStep";
import PlansStep from "@/components/onboarding/steps/PlansStep";
import KitchenStep from "@/components/onboarding/steps/KitchenStep";
import SocialStep from "@/components/onboarding/steps/SocialStep";
import DoneStep from "@/components/onboarding/steps/DoneStep";

const STEPS = [
  "welcome", "discover", "pantry", "plans", "kitchen", "social", "done",
] as const;
type Step = typeof STEPS[number];

const STEP_COMPONENTS: Record<Step, React.ComponentType> = {
  welcome: WelcomeStep,
  discover: DiscoverStep,
  pantry: PantryStep,
  plans: PlansStep,
  kitchen: KitchenStep,
  social: SocialStep,
  done: DoneStep,
};

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const step = params.step as string;
  const currentIndex = STEPS.indexOf(step as Step);

  if (currentIndex === -1) {
    router.replace("/onboarding/welcome");
    return null;
  }

  const StepComponent = STEP_COMPONENTS[step as Step];
  const isLast = currentIndex === STEPS.length - 1;

  function goNext() {
    if (isLast) {
      localStorage.setItem("wc-onboarding-done", "1");
      router.push("/dashboard");
    } else {
      router.push(`/onboarding/${STEPS[currentIndex + 1]}`);
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      router.push(`/onboarding/${STEPS[currentIndex - 1]}`);
    }
  }

  return (
    <OnboardingShell
      currentStep={step}
      onBack={goBack}
      onContinue={goNext}
      continueLabel={isLast ? "Go to Dashboard" : "Continue"}
    >
      <StepComponent />
    </OnboardingShell>
  );
}
