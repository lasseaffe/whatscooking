"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface FeatureGateBannerProps {
  feature: string        // e.g. "Shared pantry"
  description: string   // e.g. "Plan meals together with your household."
}

export function FeatureGateBanner({ feature, description }: FeatureGateBannerProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "annual" }),
      })
      if (!res.ok) throw new Error("checkout failed")
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4 flex items-start gap-3">
      <div className="shrink-0 mt-0.5 text-orange-500">
        <Star className="w-4 h-4 fill-current" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
          {feature} is a Pro Cook feature
        </p>
        <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
      >
        {loading ? "…" : "Upgrade"}
      </button>
    </div>
  )
}
