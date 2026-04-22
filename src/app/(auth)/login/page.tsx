"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFBF7" }}>
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <ChefHat className="w-6 h-6" style={{ color: "#C85A2F" }} />
            <span className="font-semibold text-lg" style={{ color: "#3D2817" }}>What's Cooking</span>
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#3D2817" }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="text-sm px-4 py-3 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#3D2817" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#3D2817" }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 rounded-xl font-semibold text-sm btn-primary-glow disabled:opacity-60"
            style={{ background: "#C85A2F", color: "#fff" }}
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "#6B5B52" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium" style={{ color: "#C85A2F" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
