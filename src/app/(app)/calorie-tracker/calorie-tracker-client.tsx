"use client";

import { useState, useMemo, useEffect } from "react";
import { Target, TrendingDown, TrendingUp, Minus, Plus, X, Scale, Dumbbell, Edit2, Check, Leaf, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

type CalorieGoal = {
  goal_type: "lose_weight" | "maintain" | "gain_weight";
  target_calories: number | null;
  target_weight_kg: number | null;
  current_weight_kg: number | null;
  height_cm: number | null;
  activity_level: string;
  notes: string | null;
};

type WeightLog = { id: string; weight_kg: number; note: string | null; logged_at: string };
type CalorieEntry = {
  id: string; meal_type: string | null; description: string;
  calories: number; protein_g?: number; carbs_g?: number; fat_g?: number;
  fiber_g?: number; logged_at: string;
};

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Lose weight",  icon: TrendingDown, color: "#2D7A4F", bg: "#F0FAF4" },
  { value: "maintain",    label: "Maintain",     icon: Minus,        color: "#5C5038", bg: "#F2F0E8" },
  { value: "gain_weight", label: "Gain / Bulk",  icon: TrendingUp,   color: "#C85A2F", bg: "#FFF0E6" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary",   label: "Sedentary",   desc: "Desk job, little exercise"   },
  { value: "light",       label: "Light",        desc: "1–3 workouts/week"            },
  { value: "moderate",    label: "Moderate",     desc: "3–5 workouts/week"            },
  { value: "active",      label: "Active",       desc: "6–7 workouts/week"            },
  { value: "very_active", label: "Very active",  desc: "Athlete / physical job"       },
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

const MACROS = [
  { key: "protein_g",  label: "Protein",  color: "#3D5030", unit: "g", tip: "Builds & repairs muscle" },
  { key: "carbs_g",    label: "Carbs",    color: "#E8724A", unit: "g", tip: "Primary energy source"   },
  { key: "fat_g",      label: "Fat",      color: "#F59E0B", unit: "g", tip: "Hormones & brain health" },
  { key: "fiber_g",    label: "Fiber",    color: "#2D7A4F", unit: "g", tip: "Gut health & satiety"    },
] as const;

function calculateTDEE(weightKg: number, heightCm: number, age = 30, activity = "moderate") {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.55));
}

// Macro defaults from goal & calories
function defaultMacros(goalType: string, calories: number): Record<string, number> {
  if (goalType === "gain_weight") {
    const p = Math.round((calories * 0.30) / 4);
    const f = Math.round((calories * 0.25) / 9);
    const c = Math.round((calories * 0.45) / 4);
    return { protein_g: p, carbs_g: c, fat_g: f, fiber_g: 30 };
  }
  if (goalType === "lose_weight") {
    const p = Math.round((calories * 0.35) / 4);
    const f = Math.round((calories * 0.30) / 9);
    const c = Math.round((calories * 0.35) / 4);
    return { protein_g: p, carbs_g: c, fat_g: f, fiber_g: 35 };
  }
  const p = Math.round((calories * 0.30) / 4);
  const f = Math.round((calories * 0.30) / 9);
  const c = Math.round((calories * 0.40) / 4);
  return { protein_g: p, carbs_g: c, fat_g: f, fiber_g: 28 };
}

// ── Macro ring (SVG donut) ──────────────────────────────────────
function MacroRing({
  label, consumed, target, unit, color, tip,
}: {
  label: string; consumed: number; target: number; unit: string; color: string; tip: string;
}) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((consumed / Math.max(target, 1)) * 100, 100);
  const dash = (pct / 100) * circ;
  const over = consumed > target;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-24 h-24 -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#F5E6D3" strokeWidth="9" />
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={over ? "#DC2626" : color} strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold" style={{ color: over ? "#DC2626" : "#3D2817" }}>
            {consumed}
          </span>
          <span className="text-[10px]" style={{ color: "#A69180" }}>{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: "#3D2817" }}>{label}</p>
        <p className="text-[10px]" style={{ color: "#A69180" }}>of {target}{unit}</p>
        <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: "#B8A898" }}>{tip}</p>
      </div>
    </div>
  );
}

// ── Weight Chart ──────────────────────────────────────────────
function WeightChart({ logs, targetWeight }: { logs: WeightLog[]; targetWeight: number | null }) {
  const W = 560; const H = 180; const PAD = { top: 12, right: 16, bottom: 40, left: 44 };

  if (logs.length < 2) return (
    <div className="flex items-center justify-center h-32 rounded-xl" style={{ background: "var(--wc-pal-lightest)" }}>
      <p className="text-sm" style={{ color: "var(--wc-pal-mid)" }}>Log at least 2 weight entries to see your chart</p>
    </div>
  );

  const weights = logs.map((l) => l.weight_kg);
  const minW = Math.min(...weights, targetWeight ?? Infinity) - 1;
  const maxW = Math.max(...weights, targetWeight ?? -Infinity) + 1;
  const xScale = (i: number) => PAD.left + (i / (logs.length - 1)) * (W - PAD.left - PAD.right);
  const yScale = (w: number) => PAD.top + ((maxW - w) / (maxW - minW)) * (H - PAD.top - PAD.bottom);
  const pathD = logs.map((l, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(l.weight_kg)}`).join(" ");
  const step = Math.max(1, Math.floor(logs.length / 5));
  const xLabels = logs.filter((_, i) => i % step === 0 || i === logs.length - 1);
  const yTicks = [minW + 0.5, (minW + maxW) / 2, maxW - 0.5].map(Math.round);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((y) => (
        <g key={y}>
          <line x1={PAD.left} y1={yScale(y)} x2={W - PAD.right} y2={yScale(y)} stroke="#F5E6D3" strokeWidth="1" strokeDasharray="4,4" />
          <text x={PAD.left - 4} y={yScale(y) + 4} textAnchor="end" fontSize="10" fill="#A69180">{y}</text>
        </g>
      ))}
      {targetWeight && (
        <>
          <line x1={PAD.left} y1={yScale(targetWeight)} x2={W - PAD.right} y2={yScale(targetWeight)} stroke="#2D7A4F" strokeWidth="1.5" strokeDasharray="6,3" />
          <text x={W - PAD.right + 4} y={yScale(targetWeight) + 4} fontSize="10" fill="#2D7A4F">goal</text>
        </>
      )}
      <path d={pathD} fill="none" stroke="#C85A2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${pathD} L ${xScale(logs.length - 1)} ${H - PAD.bottom} L ${xScale(0)} ${H - PAD.bottom} Z`} fill="url(#wGrad)" opacity="0.18" />
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C85A2F" />
          <stop offset="100%" stopColor="#C85A2F" stopOpacity="0" />
        </linearGradient>
      </defs>
      {logs.map((l, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(l.weight_kg)} r="3.5" fill="#fff" stroke="#C85A2F" strokeWidth="2" />
      ))}
      <text x={xScale(logs.length - 1)} y={yScale(logs[logs.length - 1].weight_kg) - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#C85A2F">
        {logs[logs.length - 1].weight_kg} kg
      </text>
      {xLabels.map((l) => {
        const i = logs.indexOf(l);
        const d = new Date(l.logged_at);
        return (
          <text key={l.id} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#A69180">
            {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        );
      })}
    </svg>
  );
}

const HEALTH_CONSENT_KEY = "wc_health_consent_v1";

function HealthConsentGate({ onConsent }: { onConsent: () => void }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{
        maxWidth: 480, width: "100%", borderRadius: 20, padding: "2rem",
        background: "rgba(26,16,8,0.9)", border: "1px solid rgba(176,125,86,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}>
            <Scale style={{ width: 18, height: 18, color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: "#EFE3CE" }}>
            Health Data Consent
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "rgba(239,227,206,0.7)", marginBottom: "1.25rem" }}>
          The Calorie &amp; Weight Tracker stores <strong>health data</strong> — calorie entries and body weight logs.
          Under EU GDPR Art.&nbsp;9 and German DSGVO, this requires your <strong>explicit consent</strong>.
        </p>
        <ul style={{ fontSize: "0.8rem", lineHeight: 1.75, color: "rgba(239,227,206,0.55)", marginBottom: "1.5rem", paddingLeft: "1.2rem" }}>
          <li>Your data is stored securely and only accessible to you.</li>
          <li>You can delete all health data at any time via Settings → Delete Account.</li>
          <li>You can withdraw this consent at any time.</li>
          <li>Data is not shared with third parties.</li>
        </ul>
        <p style={{ fontSize: "0.78rem", color: "rgba(239,227,206,0.35)", marginBottom: "1.25rem" }}>
          Full details in our{" "}
          <a href="/datenschutz" target="_blank" rel="noopener noreferrer" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
            Datenschutzerklärung
          </a>.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="/discover" style={{
            flex: 1, textAlign: "center", fontSize: "0.8rem", fontWeight: 600, padding: "0.6rem 1rem",
            borderRadius: 10, background: "rgba(26,16,8,0.6)", color: "#7A5A40",
            border: "1px solid rgba(58,36,22,0.5)", textDecoration: "none",
          }}>
            Decline
          </a>
          <button
            onClick={onConsent}
            style={{
              flex: 2, fontSize: "0.85rem", fontWeight: 700, padding: "0.6rem 1rem",
              borderRadius: 10, background: "linear-gradient(135deg, var(--wc-pal-accent, #B07D56), #8A5538)",
              color: "#fff", border: "none", cursor: "pointer",
            }}
          >
            I consent to storing my health data
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalorieTrackerClient({
  initialGoal, weightLogs, todayEntries, dailyCalories, today,
}: {
  initialGoal: CalorieGoal | null;
  weightLogs: WeightLog[];
  todayEntries: CalorieEntry[];
  dailyCalories: Record<string, number>;
  today: string;
}) {
  const [healthConsented, setHealthConsented] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(HEALTH_CONSENT_KEY) === "true";
  });

  function giveConsent() {
    localStorage.setItem(HEALTH_CONSENT_KEY, "true");
    setHealthConsented(true);
  }

  const [goal, setGoal] = useState<CalorieGoal>(initialGoal ?? {
    goal_type: "maintain", target_calories: null, target_weight_kg: null,
    current_weight_kg: null, height_cm: null, activity_level: "moderate", notes: null,
  });
  const [editingGoal, setEditingGoal] = useState(!initialGoal);
  const [savingGoal, setSavingGoal] = useState(false);

  // Macro targets (stored in goal.notes as JSON for now)
  const [macroTargets, setMacroTargets] = useState<Record<string, number>>(() => {
    try { return JSON.parse(goal.notes ?? "{}"); } catch { return {}; }
  });

  // Weight
  const [logs, setLogs] = useState<WeightLog[]>(weightLogs);
  const [newWeight, setNewWeight] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  // Food entries
  const [entries, setEntries] = useState<CalorieEntry[]>(todayEntries);
  const [entryDesc, setEntryDesc] = useState("");
  const [entryKcal, setEntryKcal] = useState("");
  const [entryProtein, setEntryProtein] = useState("");
  const [entryCarbs, setEntryCarbs] = useState("");
  const [entryFat, setEntryFat] = useState("");
  const [entryFiber, setEntryFiber] = useState("");
  const [entryMeal, setEntryMeal] = useState("dinner");
  const [addingEntry, setAddingEntry] = useState(false);
  const [showMacroInputs, setShowMacroInputs] = useState(false);

  const tdee = useMemo(() => {
    if (goal.current_weight_kg && goal.height_cm) {
      return calculateTDEE(goal.current_weight_kg, goal.height_cm, 30, goal.activity_level);
    }
    return null;
  }, [goal]);

  const suggestedTarget = useMemo(() => {
    if (!tdee) return null;
    if (goal.goal_type === "lose_weight") return tdee - 400;
    if (goal.goal_type === "gain_weight") return tdee + 300;
    return tdee;
  }, [tdee, goal.goal_type]);

  const targetKcal = goal.target_calories ?? suggestedTarget ?? 2000;
  const suggestedMacros = useMemo(() => defaultMacros(goal.goal_type, targetKcal), [goal.goal_type, targetKcal]);
  const effectiveMacros = { ...suggestedMacros, ...macroTargets };

  // Aggregate today's macros
  const todayMacros = useMemo(() => {
    const out = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    for (const e of entries) {
      out.calories += e.calories;
      out.protein_g += e.protein_g ?? 0;
      out.carbs_g += e.carbs_g ?? 0;
      out.fat_g += e.fat_g ?? 0;
      out.fiber_g += e.fiber_g ?? 0;
    }
    return out;
  }, [entries]);

  const goalInfo = GOAL_OPTIONS.find((g) => g.value === goal.goal_type)!;
  const reduced = usePrefersReducedMotion();;

  async function saveGoal() {
    setSavingGoal(true);
    const payload = { ...goal, notes: JSON.stringify(macroTargets) };
    const res = await fetch("/api/calorie-goal", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.goal) { setGoal(json.goal); setEditingGoal(false); }
    setSavingGoal(false);
  }

  async function logWeight() {
    if (!newWeight) return;
    setLoggingWeight(true);
    const res = await fetch("/api/weight-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_kg: parseFloat(newWeight), note: weightNote || null }),
    });
    const json = await res.json();
    if (json.log) {
      setLogs((prev) => [...prev.filter((l) => l.logged_at !== json.log.logged_at), json.log].sort((a, b) => a.logged_at.localeCompare(b.logged_at)));
      setNewWeight(""); setWeightNote("");
    }
    setLoggingWeight(false);
  }

  async function deleteWeight(id: string) {
    await fetch(`/api/weight-logs?id=${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  async function addEntry() {
    if (!entryDesc || !entryKcal) return;
    setAddingEntry(true);
    const res = await fetch("/api/calorie-entries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: entryDesc,
        calories: parseInt(entryKcal),
        meal_type: entryMeal,
        protein_g: entryProtein ? parseFloat(entryProtein) : null,
        carbs_g: entryCarbs ? parseFloat(entryCarbs) : null,
        fat_g: entryFat ? parseFloat(entryFat) : null,
        fiber_g: entryFiber ? parseFloat(entryFiber) : null,
      }),
    });
    const json = await res.json();
    if (json.entry) {
      setEntries((prev) => [...prev, json.entry]);
      setEntryDesc(""); setEntryKcal(""); setEntryProtein(""); setEntryCarbs(""); setEntryFat(""); setEntryFiber("");
    }
    setAddingEntry(false);
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/calorie-entries?id=${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (!healthConsented) {
    return <HealthConsentGate onConsent={giveConsent} />;
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--fg-primary)" }}>
            <Leaf className="w-6 h-6" style={{ color: "#2D7A4F" }} />
            Nutrient Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--fg-tertiary)" }}>
            Track your macros, log meals, and stay on course toward your nutrition goals.
          </p>
        </div>
      </div>

      {/* ── Persistent "What did you eat?" bar ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--wc-surface-2, #3A3430)", border: "1px solid var(--border-tertiary)" }}>
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-[0.13em] mb-3" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>
            What did you eat?
          </p>
          <div className="flex gap-2 flex-wrap">
            <select value={entryMeal} onChange={(e) => setEntryMeal(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
              {MEAL_TYPES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
            <input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)}
              placeholder="Food description…"
              className="flex-1 min-w-40 px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)", color: "var(--fg-primary)" }}
              onKeyDown={(e) => e.key === "Enter" && addEntry()} />
            <input value={entryKcal} onChange={(e) => setEntryKcal(e.target.value)} type="number"
              placeholder="kcal"
              className="w-20 px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)", color: "var(--fg-primary)" }} />
            <button
              type="button"
              onClick={() => setShowMacroInputs((v) => !v)}
              className="px-3 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: showMacroInputs ? "#2D7A4F" : "var(--border-tertiary)", background: showMacroInputs ? "#1A3A25" : "var(--bg-primary)", color: showMacroInputs ? "#4CAF76" : "var(--fg-tertiary)" }}>
              + Macros
            </button>
            <button onClick={addEntry} disabled={addingEntry || !entryDesc || !entryKcal}
              className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1A0E04" }}>
              <Plus className="w-4 h-4" /> Log
            </button>
          </div>
          {showMacroInputs && (
            <div className="flex gap-2 flex-wrap mt-2">
              {[
                { val: entryProtein, set: setEntryProtein, ph: "Protein g", color: "#4CAF76" },
                { val: entryCarbs,   set: setEntryCarbs,   ph: "Carbs g",   color: "#E8724A" },
                { val: entryFat,     set: setEntryFat,     ph: "Fat g",     color: "#F59E0B" },
                { val: entryFiber,   set: setEntryFiber,   ph: "Fiber g",   color: "#2D7A4F" },
              ].map(({ val, set, ph, color }) => (
                <input key={ph} value={val} onChange={(e) => set(e.target.value)} type="number"
                  placeholder={ph}
                  className="w-24 px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: color + "55", background: "var(--bg-primary)", color: "var(--fg-primary)" }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 2-column main layout ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
        {/* ── LEFT COL (60%) — Macro rings + entry log ── */}
        <div className="space-y-5">
          {/* ── Today's Macros ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-tertiary)" }}>
              <h2 className="font-semibold" style={{ color: "var(--fg-primary)" }}>Today&apos;s Nutrition</h2>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--wc-surface-2)", color: "var(--wc-accent-saffron, #F4A261)" }}>
                {today}
              </span>
            </div>
            <div className="p-5">
              {/* Slim kcal bar (max 8px) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--fg-primary)" }}>
                    <Zap className="w-4 h-4" style={{ color: "var(--wc-accent-saffron, #F4A261)" }} />
                    {todayMacros.calories} kcal
                  </span>
                  <span style={{ color: todayMacros.calories > targetKcal ? "var(--fg-destructive)" : "var(--fg-tertiary)", fontSize: "0.75rem" }}>
                    {todayMacros.calories > targetKcal
                      ? `${todayMacros.calories - targetKcal} over`
                      : `${targetKcal - todayMacros.calories} remaining`} / {targetKcal}
                  </span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--bg-secondary)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((todayMacros.calories / targetKcal) * 100, 100)}%`,
                      background: todayMacros.calories > targetKcal ? "var(--fg-destructive)" : "var(--wc-accent-saffron, #F4A261)",
                    }} />
                </div>
              </div>

              {/* Macro rings */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {MACROS.map(({ key, label, color, unit, tip }) => (
                  <MacroRing
                    key={key}
                    label={label}
                    consumed={Math.round(todayMacros[key as keyof typeof todayMacros] as number)}
                    target={effectiveMacros[key as keyof typeof effectiveMacros]}
                    unit={unit}
                    color={color}
                    tip={tip}
                  />
                ))}
              </div>

              {/* Entry list grouped by meal */}
              {MEAL_TYPES.map((meal) => {
                const mealEntries = entries.filter((e) => e.meal_type === meal);
                if (mealEntries.length === 0) return null;
                const mealKcal = mealEntries.reduce((s, e) => s + e.calories, 0);
                const mealProt = mealEntries.reduce((s, e) => s + (e.protein_g ?? 0), 0);
                return (
                  <div key={meal} className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-quaternary)" }}>{meal}</h4>
                      <div className="flex gap-3 text-xs" style={{ color: "var(--fg-quaternary)" }}>
                        <span>{mealKcal} kcal</span>
                        {mealProt > 0 && <span style={{ color: "#4CAF76" }}>{Math.round(mealProt)}g P</span>}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                    <div className="flex flex-col gap-1.5">
                      {mealEntries.map((e) => (
                        <motion.div
                          key={e.id}
                          initial={reduced ? false : { opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={reduced ? undefined : { opacity: 0, x: 12, transition: { duration: 0.18 } }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                          style={{ background: "var(--bg-secondary)" }}
                        >
                          <span className="flex-1" style={{ color: "var(--fg-primary)" }}>{e.description}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-semibold" style={{ color: "var(--wc-accent-saffron, #F4A261)" }}>{e.calories} kcal</span>
                            {e.protein_g != null && e.protein_g > 0 && <span style={{ color: "#4CAF76" }}>{e.protein_g}g P</span>}
                            {e.carbs_g != null && e.carbs_g > 0 && <span style={{ color: "#E8724A" }}>{e.carbs_g}g C</span>}
                            {e.fat_g != null && e.fat_g > 0 && <span style={{ color: "#F59E0B" }}>{e.fat_g}g F</span>}
                          </div>
                          <button onClick={() => deleteEntry(e.id)}><X className="w-3.5 h-3.5" style={{ color: "var(--fg-quaternary)" }} /></button>
                        </motion.div>
                      ))}
                    </div>
                    </AnimatePresence>
                  </div>
                );
              })}

              {entries.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--fg-quaternary)" }}>Log your first meal above.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COL (40%) — Weight sparkline + macro tips + goals ── */}
        <div className="space-y-5">
          {/* Weight Chart */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-tertiary)" }}>
              <h2 className="font-semibold flex items-center gap-2 text-sm" style={{ color: "var(--fg-primary)" }}>
                <Scale className="w-4 h-4" style={{ color: "var(--wc-accent-saffron, #F4A261)" }} /> Weight Log
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <WeightChart logs={logs} targetWeight={goal.target_weight_kg} />
              <div className="flex gap-2">
                <input value={newWeight} onChange={(e) => setNewWeight(e.target.value)} type="number" step="0.1"
                  placeholder="Weight (kg)"
                  className="w-32 px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-secondary)", color: "var(--fg-primary)" }}
                  onKeyDown={(e) => e.key === "Enter" && logWeight()} />
                <input value={weightNote} onChange={(e) => setWeightNote(e.target.value)}
                  placeholder="Note"
                  className="flex-1 px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-secondary)", color: "var(--fg-primary)" }}
                  onKeyDown={(e) => e.key === "Enter" && logWeight()} />
                <button onClick={logWeight} disabled={loggingWeight || !newWeight}
                  className="px-3 py-2 rounded-xl font-semibold text-sm flex items-center gap-1 disabled:opacity-50"
                  style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1A0E04" }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {logs.length > 0 && (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {[...logs].reverse().slice(0, 6).map((l) => (
                    <div key={l.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                      style={{ background: "var(--bg-secondary)" }}>
                      <Dumbbell className="w-3 h-3 shrink-0" style={{ color: "var(--fg-quaternary)" }} />
                      <span className="font-semibold text-xs" style={{ color: "var(--fg-primary)" }}>{l.weight_kg} kg</span>
                      <span className="text-xs" style={{ color: "var(--fg-quaternary)" }}>{new Date(l.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      {l.note && <span className="text-xs flex-1 truncate" style={{ color: "var(--fg-tertiary)" }}>{l.note}</span>}
                      <button onClick={() => deleteWeight(l.id)}><X className="w-3 h-3" style={{ color: "var(--fg-quaternary)" }} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Macro Tips */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)" }}>
            <h2 className="font-semibold text-sm" style={{ color: "var(--fg-primary)" }}>
              {goal.goal_type === "lose_weight" ? "Macro Tips: Fat Loss" :
               goal.goal_type === "gain_weight" ? "Macro Tips: Muscle Gain" : "Macro Tips: Maintenance"}
            </h2>
            {goal.goal_type === "lose_weight" && (
              <ul className="text-xs space-y-1.5" style={{ color: "var(--fg-tertiary)" }}>
                <li>Keep protein high (35%) — preserves muscle and keeps you full.</li>
                <li>Choose complex carbs over simple sugars.</li>
                <li>Don&apos;t cut fat too low — supports hormones.</li>
                <li>Aim for 30–35g fiber/day to reduce hunger.</li>
              </ul>
            )}
            {goal.goal_type === "gain_weight" && (
              <ul className="text-xs space-y-1.5" style={{ color: "var(--fg-tertiary)" }}>
                <li>Target 1.6–2g protein per kg bodyweight.</li>
                <li>Time carbs around workouts for energy.</li>
                <li>Calorie-dense fats make hitting targets easier.</li>
                <li>Liquid calories help when appetite is low.</li>
              </ul>
            )}
            {goal.goal_type === "maintain" && (
              <ul className="text-xs space-y-1.5" style={{ color: "var(--fg-tertiary)" }}>
                <li>Balance macros ~30P / 40C / 30F.</li>
                <li>1.2–1.6g protein per kg preserves muscle.</li>
                <li>Prioritize fiber-rich whole foods.</li>
                <li>7–9 hours sleep — poor sleep raises hunger hormones.</li>
              </ul>
            )}
          </div>

          {/* Nutrition Goals (collapsible) */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)" }}>
            <button
              onClick={() => setEditingGoal((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 border-b text-left"
              style={{ borderColor: "var(--border-tertiary)" }}>
              <h2 className="font-semibold text-sm" style={{ color: "var(--fg-primary)" }}>Nutrition Goals</h2>
              <div className="flex items-center gap-2">
                {!editingGoal && (
                  <span className="text-xs" style={{ color: "var(--fg-quaternary)" }}>
                    {targetKcal} kcal · {goalInfo.label}
                  </span>
                )}
                <Edit2 className="w-3.5 h-3.5" style={{ color: "var(--fg-tertiary)" }} />
              </div>
            </button>

            {editingGoal ? (
              <div className="p-5 space-y-5">
                {/* Goal type */}
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--fg-primary)" }}>What&apos;s your goal?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {GOAL_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                      <button key={value} onClick={() => setGoal((g) => ({ ...g, goal_type: value as CalorieGoal["goal_type"] }))}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                        style={{ borderColor: goal.goal_type === value ? color : "var(--border-tertiary)", background: goal.goal_type === value ? color + "22" : "var(--bg-secondary)", color }}>
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "current_weight_kg", label: "Current weight (kg)" },
                    { key: "target_weight_kg",  label: "Target weight (kg)"  },
                    { key: "height_cm",         label: "Height (cm)"         },
                    { key: "target_calories",   label: "Daily kcal target"   },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-tertiary)" }}>{label}</label>
                      <input type="number" value={(goal as Record<string, unknown>)[key] as string ?? ""}
                        onChange={(e) => setGoal((g) => ({ ...g, [key]: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                        style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-secondary)", color: "var(--fg-primary)" }}
                        placeholder={key === "target_calories" && suggestedTarget ? `~${suggestedTarget}` : ""} />
                    </div>
                  ))}
                </div>

                {/* Activity */}
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--fg-primary)" }}>Activity level</p>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
                      <button key={value} onClick={() => setGoal((g) => ({ ...g, activity_level: value }))}
                        className="text-xs px-3 py-1.5 rounded-xl border transition-all"
                        style={{ borderColor: goal.activity_level === value ? "var(--wc-accent-saffron, #F4A261)" : "var(--border-tertiary)", background: goal.activity_level === value ? "rgba(244,162,97,0.15)" : "var(--bg-secondary)", color: goal.activity_level === value ? "var(--wc-accent-saffron, #F4A261)" : "var(--fg-tertiary)" }}>
                        {label}
                        <span className="block" style={{ color: "var(--fg-quaternary)", fontSize: "10px" }}>{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {tdee && (
                  <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(45,122,79,0.12)", color: "#4CAF76", border: "1px solid rgba(45,122,79,0.3)" }}>
                    TDEE: <strong>{tdee} kcal/day</strong> · Suggested: <strong>{suggestedTarget} kcal</strong>
                  </div>
                )}

                {/* Macro targets */}
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--fg-primary)" }}>
                    Macro targets <span className="text-xs font-normal" style={{ color: "var(--fg-quaternary)" }}>(leave blank for auto)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {MACROS.map(({ key, label, unit, color }) => (
                      <div key={key}>
                        <label className="text-xs font-medium block mb-1" style={{ color }}>
                          {label} ({unit})
                        </label>
                        <input type="number"
                          value={macroTargets[key] ?? ""}
                          onChange={(e) => setMacroTargets((m) => { const next = { ...m }; if (e.target.value) { next[key] = parseFloat(e.target.value); } else { delete next[key]; } return next; })}
                          placeholder={String(suggestedMacros[key as keyof typeof suggestedMacros] ?? "")}
                          className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                          style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-secondary)", color: "var(--fg-primary)" }} />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveGoal} disabled={savingGoal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1A0E04" }}>
                  <Check className="w-4 h-4" /> {savingGoal ? "Saving…" : "Save goal"}
                </button>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <goalInfo.icon className="w-4 h-4" style={{ color: goalInfo.color }} />
                    <span className="font-semibold text-sm" style={{ color: goalInfo.color }}>{goalInfo.label}</span>
                  </div>
                  <span className="text-sm" style={{ color: "var(--fg-primary)" }}><strong>{targetKcal}</strong> <span style={{ color: "var(--fg-quaternary)" }}>kcal/day</span></span>
                  {goal.current_weight_kg && <span className="text-sm" style={{ color: "var(--fg-primary)" }}><strong>{goal.current_weight_kg}</strong> <span style={{ color: "var(--fg-quaternary)" }}>kg now</span></span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MACROS.map(({ key, label, unit, color }) => (
                    <div key={key} className="rounded-lg p-2 text-center border" style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-secondary)" }}>
                      <p className="text-sm font-bold" style={{ color }}>
                        {effectiveMacros[key as keyof typeof effectiveMacros]}{unit}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--fg-quaternary)" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close 2-column grid */}
    </div>
  );
}
