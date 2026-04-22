"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Palette, Moon, Sun, Bell, ChefHat, Check, Trash2, AlertTriangle, Loader2, Shield, ExternalLink } from "lucide-react";
import { PaletteSwitcher } from "@/components/palette-switcher";
import { useTheme } from "@/lib/theme-context";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: "rgba(26,16,8,0.6)", border: "1px solid rgba(58,36,22,0.6)" }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}>
          <span style={{ color: "var(--wc-pal-accent, #B07D56)" }}>{icon}</span>
        </div>
        <h2 className="font-bold text-sm" style={{ color: "#EFE3CE" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "deleting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDelete() {
    setStep("deleting");
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.detail ?? body.error ?? "Deletion failed. Please try again.");
        setStep("error");
        return;
      }
      setStep("done");
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl p-5" style={{ background: "rgba(26,16,8,0.6)", border: "1px solid rgba(115,190,89,0.3)" }}>
        <p className="text-sm font-semibold" style={{ color: "#73be59" }}>Account deleted. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(26,16,8,0.6)", border: "1px solid rgba(176,58,42,0.3)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(176,58,42,0.15)", border: "1px solid rgba(176,58,42,0.3)" }}>
          <Trash2 style={{ width: 14, height: 14, color: "#B03A2A" }} />
        </div>
        <h2 className="font-bold text-sm" style={{ color: "#EFE3CE" }}>Delete Account</h2>
      </div>

      {step === "idle" && (
        <>
          <p className="text-xs mb-4" style={{ color: "#7A5A40", lineHeight: 1.6 }}>
            Permanently deletes your account and all personal data — pantry, meal logs, weight entries, saves, and ratings.
            Your published recipes will be anonymised and remain visible. This cannot be undone.
          </p>
          <button
            onClick={() => setStep("confirm")}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: "rgba(176,58,42,0.15)", color: "#B03A2A", border: "1px solid rgba(176,58,42,0.35)" }}
          >
            Request account deletion
          </button>
        </>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(176,58,42,0.1)", border: "1px solid rgba(176,58,42,0.25)" }}>
            <AlertTriangle style={{ width: 14, height: 14, color: "#B03A2A", flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: "#c0604a" }}>
              This will permanently delete your account and all personal data. Published recipes will be kept anonymously.
              You will be signed out immediately and cannot undo this.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("idle")}
              className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(26,16,8,0.8)", color: "#7A5A40", border: "1px solid rgba(58,36,22,0.5)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all hover:opacity-90"
              style={{ background: "rgba(176,58,42,0.8)", color: "#fff" }}
            >
              Yes, delete my account
            </button>
          </div>
        </div>
      )}

      {step === "deleting" && (
        <div className="flex items-center gap-2">
          <Loader2 style={{ width: 14, height: 14, color: "#B03A2A" }} className="animate-spin" />
          <p className="text-xs" style={{ color: "#7A5A40" }}>Deleting account and all personal data…</p>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: "#B03A2A" }}>{errorMsg}</p>
          <button
            onClick={() => setStep("idle")}
            className="text-xs font-semibold px-4 py-2 rounded-lg w-fit"
            style={{ background: "rgba(26,16,8,0.8)", color: "#7A5A40", border: "1px solid rgba(58,36,22,0.5)" }}
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}

export function SettingsClient() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      {/* ── Appearance ── */}
      <Section icon={<Palette style={{ width: 16, height: 16 }} />} title="Colour Palette">
        <p className="text-xs mb-4" style={{ color: "#7A5A40" }}>
          Choose a palette that sets the mood for your kitchen. Changes apply instantly everywhere.
        </p>
        <PaletteSwitcher />
      </Section>

      {/* ── Theme ── */}
      <Section icon={<Moon style={{ width: 16, height: 16 }} />} title="Light / Dark Mode">
        <p className="text-xs mb-4" style={{ color: "#7A5A40" }}>
          Light mode flips the darkest and lightest palette colours.
        </p>
        <div className="flex gap-3">
          {(["dark", "light"] as const).map((t) => {
            const active = theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex-1 flex flex-col items-center gap-2.5 py-4 rounded-xl transition-all"
                style={{
                  background: active ? "rgba(42,24,8,0.9)" : "rgba(26,16,8,0.5)",
                  border: `1px solid ${active ? "rgba(176,125,86,0.5)" : "rgba(58,36,22,0.4)"}`,
                }}
              >
                {t === "dark"
                  ? <Moon style={{ width: 20, height: 20, color: active ? "var(--wc-pal-accent, #B07D56)" : "#5A3A28" }} />
                  : <Sun  style={{ width: 20, height: 20, color: active ? "var(--wc-pal-accent, #B07D56)" : "#5A3A28" }} />
                }
                <span className="text-xs font-semibold capitalize" style={{ color: active ? "#EFE3CE" : "#7A5A40" }}>
                  {t === "dark" ? "Dark (default)" : "Light"}
                </span>
                {active && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--wc-pal-accent, #B07D56)" }}>
                    <Check style={{ width: 11, height: 11, color: "#fff" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Notifications placeholder ── */}
      <Section icon={<Bell style={{ width: 16, height: 16 }} />} title="Notifications">
        <p className="text-xs" style={{ color: "#7A5A40" }}>
          Notification preferences — coming soon.
        </p>
      </Section>

      {/* ── Privacy & Legal ── */}
      <Section icon={<Shield style={{ width: 16, height: 16 }} />} title="Privacy & Legal">
        <p className="text-xs mb-4" style={{ color: "#7A5A40", lineHeight: 1.6 }}>
          Your data is processed in accordance with the EU General Data Protection Regulation (GDPR) and the German
          Bundesdatenschutzgesetz (BDSG).
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Datenschutzerklärung (Privacy Policy)", href: "/datenschutz" },
            { label: "Impressum (Legal Notice)", href: "/impressum" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(42,24,8,0.5)", color: "#9A7A5A", border: "1px solid rgba(58,36,22,0.4)" }}
            >
              {label}
              <ExternalLink style={{ width: 12, height: 12, opacity: 0.5 }} />
            </a>
          ))}
        </div>
      </Section>

      {/* ── Danger Zone ── */}
      <DeleteAccountSection />

      {/* ── About ── */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4 mt-4"
        style={{ background: "rgba(14,9,5,0.5)", border: "1px solid rgba(42,24,8,0.5)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--wc-pal-accent, #B07D56), var(--wc-pal-mid, #5F3E2D))" }}>
          <ChefHat style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#EFE3CE" }}>What&apos;s Cooking</p>
          <p className="text-xs" style={{ color: "#5A3A28" }}>AI-powered meal planning & recipe discovery</p>
        </div>
      </div>
    </div>
  );
}
