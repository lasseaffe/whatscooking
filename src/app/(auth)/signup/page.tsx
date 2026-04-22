"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DIETARY_PREFERENCES = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "low-carb", label: "Low-Carb" },
  { value: "high-protein", label: "High-Protein" },
  { value: "mediterranean", label: "Mediterranean" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "preferences">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function togglePref(value: string) {
    setSelectedPrefs((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("preferences");
  }

  async function handleFinish() {
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Could not create account. Please try again.");
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError("Check your email to confirm your account, then log in.");
      setLoading(false);
      return;
    }

    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      dietary_preferences: selectedPrefs,
    });
    await supabase.from("user_preferences").upsert({
      user_id: data.user.id,
      dietary_preferences: selectedPrefs,
    });

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFBF7" }}>
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <ChefHat className="w-6 h-6" style={{ color: "#C85A2F" }} />
            <span className="font-semibold text-lg" style={{ color: "#3D2817" }}>What&apos;s Cooking</span>
          </Link>
          {step === "account" ? (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>Create your account</h1>
              <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>Start cooking smarter</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>Your preferences</h1>
              <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>Pick what works for you</p>
            </>
          )}
        </div>

        {step === "account" ? (
          <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#3D2817" }}>Full name</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }} placeholder="Jordan Smith" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#3D2817" }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }} placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#3D2817" }}>Password</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }} placeholder="Min. 8 characters" />
            </div>
            <button type="submit" className="py-2.5 rounded-xl font-semibold text-sm btn-primary-glow" style={{ background: "#C85A2F", color: "#fff" }}>
              Continue
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            {error && (
              <div className="text-sm px-4 py-3 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                {error}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {DIETARY_PREFERENCES.map((pref) => {
                const selected = selectedPrefs.includes(pref.value);
                return (
                  <button key={pref.value} type="button" onClick={() => togglePref(pref.value)}
                    className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
                    style={{ borderColor: selected ? "#C85A2F" : "#E8D4C0", background: selected ? "#FFF0E6" : "#fff", color: selected ? "#C85A2F" : "#6B5B52" }}>
                    {pref.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("account")}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm border"
                style={{ borderColor: "#E8D4C0", color: "#6B5B52" }}>
                Back
              </button>
              <button type="button" onClick={handleFinish} disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm btn-primary-glow disabled:opacity-60"
                style={{ background: "#C85A2F", color: "#fff" }}>
                {loading ? "Creating account..." : "Let's cook!"}
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-center mt-6" style={{ color: "#6B5B52" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "#C85A2F" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}