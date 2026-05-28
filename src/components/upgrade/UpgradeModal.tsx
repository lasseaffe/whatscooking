"use client"

import { useEffect, useState } from "react"
import { X, Zap } from "lucide-react"

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  resetsAt?: string  // ISO date string
}

export function UpgradeModal({ open, onClose, resetsAt }: UpgradeModalProps) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const resetDate = resetsAt
    ? new Date(resetsAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : null

  async function handleUpgrade(plan: "monthly" | "annual") {
    setLoading(plan)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error("checkout failed")
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="text-base font-semibold">Weekly import used</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Free accounts get 1 AI import per week.
          {resetDate && (
            <>
              {" "}
              Yours resets <strong className="text-neutral-700 dark:text-neutral-200">{resetDate}</strong>.
            </>
          )}
        </p>

        {/* Usage bar */}
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 mb-6">
          <div className="bg-orange-500 h-1.5 rounded-full w-full" />
        </div>

        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Upgrade to Pro Cook
        </p>

        <button
          onClick={() => handleUpgrade("annual")}
          disabled={loading !== null}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-500 text-white font-medium text-sm mb-2 hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {loading === "annual" ? "Loading…" : (
            <>Annual — $45/year <span className="opacity-70 font-normal">(3 months free)</span></>
          )}
        </button>

        <button
          onClick={() => handleUpgrade("monthly")}
          disabled={loading !== null}
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm mb-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 transition-colors"
        >
          {loading === "monthly" ? "Loading…" : "Monthly — $5/month"}
        </button>

        <button
          onClick={onClose}
          className="w-full text-xs text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
