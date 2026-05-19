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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <LanguageProvider>
      <DietaryModeProvider>
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
        <OnboardingEngine config={wcOnboardingConfig} />
      </DietaryModeProvider>
    </LanguageProvider>
  );
}
