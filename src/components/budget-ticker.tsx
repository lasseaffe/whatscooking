"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, Target, AlertTriangle, CheckCircle, Pencil } from "lucide-react";

interface BudgetData {
  weekly_budget: number | null;
  estimated_spent: number;
  currency: string;
}

export function BudgetTicker() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/budget")
      .then((r) => r.json())
      .then((d: BudgetData) => { setData(d); setInputVal(String(d.weekly_budget ?? "")); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function saveBudget() {
    const val = parseFloat(inputVal);
    if (!inputVal || isNaN(val) || val <= 0) { setEditing(false); return; }
    setSaving(true);
    const res = await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekly_budget: val }),
    });
    const updated = await res.json() as { weekly_budget: number };
    setData((prev) => prev ? { ...prev, weekly_budget: updated.weekly_budget } : prev);
    setEditing(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border p-4 mb-6 animate-pulse" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
        <div className="h-4 w-48 rounded-full mb-3" style={{ background: "#2A1A0C" }} />
        <div className="h-2.5 w-full rounded-full" style={{ background: "#2A1A0C" }} />
      </div>
    );
  }

  const budget = data?.weekly_budget ?? null;
  const spent = data?.estimated_spent ?? 0;
  const pct = budget && budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget != null ? budget - spent : null;
  const overBudget = budget != null && spent > budget;

  let barColor = "#16A34A"; // green
  if (pct >= 100) barColor = "#DC2626"; // red
  else if (pct >= 80) barColor = "#D97706"; // amber

  return (
    <div
      className="rounded-2xl border p-4 mb-6"
      style={{ borderColor: overBudget ? "#DC262640" : "#3A2416", background: "#1C1209" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: overBudget ? "#DC262620" : "#C8522A20" }}
          >
            {overBudget
              ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
              : <Target className="w-3.5 h-3.5" style={{ color: "#C8522A" }} />
            }
          </div>
          <span className="text-sm font-semibold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Weekly Budget
          </span>
        </div>

        {/* Set / edit budget */}
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#6B4E36" }}>$</span>
            <input
              ref={inputRef}
              type="number"
              min="1"
              step="0.01"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditing(false); }}
              className="w-20 text-sm rounded-lg px-2 py-1 outline-none"
              style={{ background: "#2A1808", border: "1px solid #C8522A60", color: "#EFE3CE" }}
              placeholder="0.00"
            />
            <button
              onClick={saveBudget}
              disabled={saving}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80"
              style={{ background: "#C8522A", color: "#fff" }}
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: "#6B4E36" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#2A1808", color: "#C8522A", border: "1px solid #C8522A30" }}
          >
            <Pencil className="w-3 h-3" />
            {budget ? "Edit" : "Set Budget"}
          </button>
        )}
      </div>

      {budget == null ? (
        /* No budget set yet */
        <p className="text-xs" style={{ color: "#6B4E36" }}>
          Set a weekly grocery budget to track your meal plan spending in real time.
        </p>
      ) : (
        <>
          {/* Spend numbers */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" style={{ color: barColor }} />
              <span className="text-base font-bold" style={{ color: "#EFE3CE" }}>
                ${spent.toFixed(2)}
              </span>
              <span className="text-xs" style={{ color: "#6B4E36" }}>estimated</span>
            </div>
            <span className="text-xs font-medium" style={{ color: "#6B4E36" }}>
              of ${budget.toFixed(2)} / week
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#2A1808" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: barColor,
                transition: "width 0.5s ease",
              }}
            />
          </div>

          {/* Status line */}
          <div className="mt-2 flex items-center gap-1.5">
            {overBudget ? (
              <>
                <AlertTriangle className="w-3 h-3" style={{ color: "#DC2626" }} />
                <span className="text-xs font-medium" style={{ color: "#DC2626" }}>
                  ${(spent - budget).toFixed(2)} over budget this week
                </span>
              </>
            ) : remaining !== null && remaining <= budget * 0.20 ? (
              <>
                <AlertTriangle className="w-3 h-3" style={{ color: "#D97706" }} />
                <span className="text-xs font-medium" style={{ color: "#D97706" }}>
                  Only ${remaining.toFixed(2)} left — plan carefully
                </span>
              </>
            ) : remaining !== null ? (
              <>
                <CheckCircle className="w-3 h-3" style={{ color: "#16A34A" }} />
                <span className="text-xs font-medium" style={{ color: "#4ADE80" }}>
                  ${remaining.toFixed(2)} remaining — on track
                </span>
              </>
            ) : null}
            <span className="ml-auto text-xs" style={{ color: "#4A3020" }}>
              {Math.round(pct)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
