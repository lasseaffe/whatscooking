"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardOnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("wc-onboarding-done")) {
      router.push("/onboarding/welcome");
    }
  }, [router]);

  return null;
}
