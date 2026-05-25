import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { TopBar } from "@/components/top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { LanguageProvider } from "@/lib/language-context";
import { DietaryModeProvider } from "@/lib/dietary-mode-context";
import { DietaryBanner } from "@/components/dietary-banner";
import { DietaryTint } from "@/components/dietary-tint";
import { FeedbackButton } from "@/components/feedback-button";
import { OnboardingEngine } from '@/components/onboarding/OnboardingEngine';
import { wcOnboardingConfig } from '@/config/whatscooking.onboarding.config';
import { BgModeProvider } from "@/lib/bg-mode-context";
import { BackgroundDecorations } from "@/components/background-decorations";
import { ChallengeRunProvider } from "@/lib/challenge-run-context";
import { ChallengeHUD } from "@/app/(app)/challenge/components/challenge-hud";
import DashboardOnboardingGate from "@/components/onboarding/DashboardOnboardingGate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <BgModeProvider>
    <LanguageProvider>
      <DietaryModeProvider>
      <ChallengeRunProvider>
        <BackgroundDecorations />
        <div
          className="min-h-screen flex"
          style={{ background: "transparent" }}
        >
          {/* Sidebar — hidden on mobile, visible sm+ */}
          <div className="hidden sm:block">
            <AppNav />
          </div>

          <DietaryTint>
            <div className="wc-main-content flex flex-col min-h-screen flex-1 min-w-0">
              {/* Top bar — desktop only; mobile uses bottom nav */}
              <div className="hidden sm:block">
                <TopBar />
              </div>
              <DietaryBanner />
              <main
                className="flex-1 pb-16 sm:pb-0"
                style={{ background: "transparent" }}
              >
                {children}
              </main>
              <FeedbackButton />
            </div>
          </DietaryTint>
        </div>

        {/* Mobile bottom nav — hidden sm+ */}
        <MobileBottomNav />
        <DashboardOnboardingGate />
        <OnboardingEngine config={wcOnboardingConfig} />
        {/* Persistent LIVE challenge bar — follows the user app-wide, incl. Cooking Mode */}
        <ChallengeHUD />
      </ChallengeRunProvider>
      </DietaryModeProvider>
    </LanguageProvider>
    </BgModeProvider>
  );
}
