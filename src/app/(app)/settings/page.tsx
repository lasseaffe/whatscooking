import Link from "next/link";
import { Settings, Palette } from "lucide-react";
import { SettingsClient } from "./settings-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("track_intake").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold flex items-center gap-2.5 mb-1"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          <Settings className="w-6 h-6" style={{ color: "var(--wc-pal-accent, #B07D56)" }} />
          Settings
        </h1>
        <p className="text-sm" style={{ color: "#7A5A40" }}>
          Customise your What&apos;s Cooking experience.
        </p>
      </div>

      <Link
        href="/moodboard"
        className="block rounded-2xl p-5 mb-4 transition-transform hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, rgba(176,125,86,0.18) 0%, rgba(26,16,8,0.6) 100%)",
          border: "1px solid rgba(176,125,86,0.35)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(176,125,86,0.18)", border: "1px solid rgba(176,125,86,0.4)" }}
          >
            <Palette className="w-4 h-4" style={{ color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
              Design system
            </p>
            <h2 className="text-base font-bold mb-1" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              Design Moodboard
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: "#A8896A" }}>
              The Culinary Parchment system — color tokens, typography, components, voice, motion — rendered live from the same source the app uses. Switch palette and theme to see everything repaint.
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] shrink-0" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Open →</span>
        </div>
      </Link>

      <SettingsClient trackIntake={profile?.track_intake ?? false} userId={user?.id ?? null} />
    </div>
  );
}
