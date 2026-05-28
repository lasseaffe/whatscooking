"use client"

import { useEffect, useState } from "react"

interface UsageData {
  tier: "free" | "pro"
  extract: {
    remaining: number | null
    limit: number
    resets_at: string
  }
}

export function UsageMeter() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((d: UsageData) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
  }

  if (!data) return null

  if (data.tier === "pro") {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Pro Cook — unlimited AI imports
      </p>
    )
  }

  const used = data.extract.limit - (data.extract.remaining ?? 0)
  const pct = Math.min(100, (used / data.extract.limit) * 100)
  const resetDate = new Date(data.extract.resets_at).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>AI imports this week</span>
        <span>
          {used}/{data.extract.limit} used · resets {resetDate}
        </span>
      </div>
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
        <div
          className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
