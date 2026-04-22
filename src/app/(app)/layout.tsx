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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <LanguageProvider>
      <DietaryModeProvider>
        <div
          className="min-h-screen flex"
          style={{ background: "var(--bg-base)" }}
        >
          {/* Sidebar — hidden on mobile, visible sm+ */}
          <div className="hidden sm:contents">
            <AppNav />
            {/* 4px gap between sidebar right-edge and main content */}
            <div style={{ width: 4, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.04)" }} />
          </div>

          <DietaryTint>
            <div className="flex flex-col min-h-screen flex-1 min-w-0">
              {/* Top bar — desktop only; mobile uses bottom nav */}
              <div className="hidden sm:block">
                <TopBar />
              </div>
              <DietaryBanner />
              <main
                className="flex-1 pb-16 sm:pb-0"
                style={{ background: "var(--bg-base)" }}
              >
                {children}
              </main>
              <FeedbackButton />
            </div>
          </DietaryTint>
        </div>

        {/* Mobile bottom nav — hidden sm+ */}
        <MobileBottomNav />
      </DietaryModeProvider>
    </LanguageProvider>
  );
}
