"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardOnboardingGate() {
  const router = useRouter();

  // Migrate old key 'wc-onboarding-done' to new 'wc-onboarding' format
  useEffect(() => {
    const oldDone = localStorage.getItem('wc-onboarding-done')
    if (oldDone === 'true') {
      const existing = localStorage.getItem('wc-onboarding')
      if (!existing) {
        localStorage.setItem('wc-onboarding', JSON.stringify({
          mode: 'done', wizardStep: 0, tourStep: 0,
          wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
        }))
      }
      localStorage.removeItem('wc-onboarding-done')
    }
  }, [])

  useEffect(() => {
    if (!localStorage.getItem("wc-onboarding-done")) {
      router.push("/onboarding/welcome");
    }
  }, [router]);

  return null;
}
