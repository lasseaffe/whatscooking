"use client";

import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle, Clock, Trash2, RefrigeratorIcon as Fridge, Snowflake, ChefHat, Archive } from "lucide-react";

interface LeftoverItem {
  id: string;
  name: string;
  storedAt: string; // ISO date
  storageType: "fridge" | "freezer";
  customShelfLifeDays?: number;
  notes?: string;
}

const STORAGE_KEY = "wc_leftover_storage_v1";

// Default shelf life guidelines (days)
const SHELF_LIFE: Record<"fridge" | "freezer", number> = {
  fridge: 4,
  freezer: 90,
};

// Typical shelf life by keyword
function guessShelfLife(name: string, type: "fridge" | "freezer"): number {
  const lower = name.toLowerCase();
  if (type === "freezer") {
    if (lower.includes("fish") || lower.includes("shrimp")) return 60;
    if (lower.includes("meat") || lower.includes("beef") || lower.includes("chicken") || lower.includes("pork")) return 90;
    if (lower.includes("soup") || lower.includes("stew")) return 90;
    if (lower.includes("rice") || lower.includes("pasta") || lower.includes("grain")) return 60;
    return 90;
  }
  // Fridge
  if (lower.includes("fish") || lower.includes("shrimp") || lower.includes("seafood")) return 2;
  if (lower.includes("meat") || lower.includes("beef") || lower.includes("chicken") || lower.includes("pork")) return 3;
  if (lower.includes("dairy") || lower.includes("cream") || lower.includes("milk")) return 3;
  if (lower.includes("salad") || lower.includes("greens") || lower.includes("lettuce")) return 2;
  if (lower.includes("soup") || lower.includes("stew") || lower.includes("broth")) return 4;
  if (lower.includes("rice") || lower.includes("pasta") || lower.includes("noodle")) return 4;
  if (lower.includes("vegetable") || lower.includes("veggie") || lower.includes("roasted")) return 5;
  return 4;
}

function getDaysRemaining(storedAt: string, shelfLifeDays: number): number {
  const stored = new Date(storedAt);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - stored.getTime()) / (1000 * 60 * 60 * 24));
  return shelfLifeDays - elapsed;
}

function getStatusColor(days: number): { color: string; bg: string; border: string; label: string } {
  if (days < 0) return { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Expired" };
  if (days === 0) return { color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", label: "Use today!" };
  if (days <= 1) return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Use soon" };
  if (days <= 3) return { color: "#CA8A04", bg: "#FEFCE8", border: "#FEF08A", label: `${days}d left` };
  return { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", label: `${days}d left` };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface LeftoverStorageProps {
  /** Pre-fill the form with this name and open it immediately (used from recipe detail). */
  prefillName?: string;
}

export function LeftoverStorage({ prefillName }: LeftoverStorageProps = {}) {
  const [items, setItems] = useState<LeftoverItem[]>([]);
  const [showForm, setShowForm] = useState(!!prefillName);
  const [name, setName] = useState(prefillName ?? "");
  const [storageType, setStorageType] = useState<"fridge" | "freezer">("fridge");
  const [customDays, setCustomDays] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  function save(updated: LeftoverItem[]) {
    setItems(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }

  function handleAdd() {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    const item: LeftoverItem = {
      id: generateId(),
      name: trimmedName,
      storedAt: new Date().toISOString(),
      storageType,
      customShelfLifeDays: customDays ? parseInt(customDays) : undefined,
      notes: notes.trim() || undefined,
    };
    save([item, ...items]);
    setName("");
    setCustomDays("");
    setNotes("");
    setShowForm(false);
    setAddedToast(trimmedName);
    setTimeout(() => setAddedToast(null), 2800);
  }

  function handleRemove(id: string) {
    setConfirmDelete(null);
    save(items.filter((i) => i.id !== id));
  }

  // Sort: expired first, then by days remaining
  const sorted = [...items].sort((a, b) => {
    const aDays = getDaysRemaining(a.storedAt, a.customShelfLifeDays ?? guessShelfLife(a.name, a.storageType));
    const bDays = getDaysRemaining(b.storedAt, b.customShelfLifeDays ?? guessShelfLife(b.name, b.storageType));
    return aDays - bDays;
  });

  const expiredCount = sorted.filter((i) => {
    const days = getDaysRemaining(i.storedAt, i.customShelfLifeDays ?? guessShelfLife(i.name, i.storageType));
    return days < 0;
  }).length;

  const expiringSoonCount = sorted.filter((i) => {
    const days = getDaysRemaining(i.storedAt, i.customShelfLifeDays ?? guessShelfLife(i.name, i.storageType));
    return days >= 0 && days <= 2;
  }).length;

  return (
    <div>
      {/* Success toast */}
      {addedToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
          style={{
            background: "var(--wc-surface-1, #2C2724)",
            color: "var(--fg-primary, #EFE3CE)",
            border: "1px solid rgba(244,162,97,0.3)",
          }}
        >
          <Archive style={{ width: 15, height: 15, color: "var(--wc-accent-saffron, #F4A261)" }} />
          Added &quot;{addedToast}&quot; to your pantry!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5" style={{ color: "#C85A2F" }} />
          <h2 className="text-lg font-bold" style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Leftovers & Storage
          </h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "#C85A2F", color: "#fff" }}
        >
          <Plus className="w-4 h-4" /> Add meal
        </button>
      </div>

      {/* Alerts */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="mb-4 rounded-xl border p-3 flex items-start gap-2.5"
          style={{
            background: expiredCount > 0 ? "#FEF2F2" : "#FFFBEB",
            borderColor: expiredCount > 0 ? "#FECACA" : "#FDE68A",
          }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: expiredCount > 0 ? "#DC2626" : "#D97706" }} />
          <p className="text-xs font-medium" style={{ color: expiredCount > 0 ? "#DC2626" : "#D97706" }}>
            {expiredCount > 0 && `${expiredCount} item${expiredCount !== 1 ? "s" : ""} have expired — please discard.`}
            {expiredCount > 0 && expiringSoonCount > 0 && " "}
            {expiringSoonCount > 0 && `${expiringSoonCount} item${expiringSoonCount !== 1 ? "s" : ""} expiring within 2 days.`}
          </p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-5 rounded-2xl border p-4" style={{ borderColor: "#E8D4C0", background: "#FFF8F3" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "#3D2817" }}>Store a meal or leftover</p>

          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Pasta bolognese, Roasted chicken…"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }}
              autoFocus
            />

            {/* Storage type */}
            <div className="flex gap-2">
              {(["fridge", "freezer"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setStorageType(type)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: storageType === type ? "#C85A2F" : "#FAF7F2",
                    color: storageType === type ? "#fff" : "#3D2817",
                    border: `1px solid ${storageType === type ? "#C85A2F" : "#E8D4C0"}`,
                  }}
                >
                  {type === "fridge" ? <Fridge className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
                  {type === "fridge" ? "Fridge" : "Freezer"}
                  <span className="text-xs opacity-70">
                    ({type === "fridge" ? "~4 days" : "~3 months"})
                  </span>
                </button>
              ))}
            </div>

            {/* Custom shelf life */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder={`Default: ${name ? guessShelfLife(name, storageType) : SHELF_LIFE[storageType]} days`}
                min="1"
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
                style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }}
              />
              <span className="text-sm" style={{ color: "#6B5B52" }}>days shelf life</span>
            </div>

            {/* Notes */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)…"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#E8D4C0", background: "#fff", color: "#3D2817" }}
            />

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: "#C85A2F", color: "#fff" }}
              >
                Store meal
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: "#FAF7F2", color: "#6B5B52", border: "1px solid #E8D4C0" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
          <Fridge className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "#C85A2F" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "#3D2817" }}>No stored meals yet</p>
          <p className="text-xs" style={{ color: "#6B5B52" }}>Track leftovers and prepped meals — get reminded before they expire.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs underline font-medium" style={{ color: "#C85A2F" }}>
            Add your first meal
          </button>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2.5">
        {sorted.map((item) => {
          const shelfLife = item.customShelfLifeDays ?? guessShelfLife(item.name, item.storageType);
          const days = getDaysRemaining(item.storedAt, shelfLife);
          const status = getStatusColor(days);
          const storedDate = formatDate(item.storedAt);
          const isExpired = days < 0;

          return (
            <div key={item.id}
              className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
              style={{ background: "#FFF8F3", borderColor: "#E8D4C0" }}>

              {/* Storage type icon */}
              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: item.storageType === "freezer" ? "#EFF6FF" : "#FFF7ED", border: "1px solid #E8D4C0" }}>
                {item.storageType === "freezer"
                  ? <Snowflake className="w-4 h-4" style={{ color: "#2563EB" }} />
                  : <Fridge className="w-4 h-4" style={{ color: "#C85A2F" }} />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{
                  color: isExpired ? "#9CA3AF" : "#3D2817",
                  textDecoration: isExpired ? "line-through" : "none",
                }}>
                  {item.name}
                </p>
                <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "#A69180" }}>
                  <Clock className="w-3 h-3" />
                  Stored {storedDate}
                  {item.notes && <span>· {item.notes}</span>}
                </p>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                  {status.label}
                </span>

                {/* Shelf life bar */}
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#F5E6D3" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, (days / shelfLife) * 100))}%`,
                      background: status.color,
                    }}
                  />
                </div>

                {confirmDelete === item.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleRemove(item.id)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ background: "#DC2626", color: "#fff" }}>Yes</button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: "#F5E6D3", color: "#6B5B52" }}>No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(item.id)} className="hover:opacity-70 transition-opacity">
                    <Trash2 className="w-4 h-4" style={{ color: "#A69180" }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guidelines */}
      {items.length > 0 && (
        <div className="mt-4 rounded-xl p-3 border" style={{ borderColor: "#F5E6D3", background: "#FFF8F3" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "#6B5B52" }}>Shelf life guidelines</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: "#A69180" }}>
            <span>🍗 Cooked meat/fish: 3–4 days fridge</span>
            <span>🥦 Cooked vegetables: 3–5 days fridge</span>
            <span>🍝 Cooked pasta/rice: 3–5 days fridge</span>
            <span>🍲 Soups & stews: 3–4 days fridge</span>
            <span>❄️ Freezer (most meals): 2–3 months</span>
            <span>🐟 Fish/seafood: 2 days fridge max</span>
          </div>
        </div>
      )}
    </div>
  );
}
