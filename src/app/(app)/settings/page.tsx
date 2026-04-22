import { Settings, Palette, Moon, Globe2, Bell, Shield, ChefHat } from "lucide-react";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
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

      <SettingsClient />
    </div>
  );
}
