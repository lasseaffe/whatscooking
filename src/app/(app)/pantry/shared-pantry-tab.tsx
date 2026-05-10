"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Users, Copy, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SharedPantryItem {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  added_by?: string | null;
  updated_at: string;
  ingredient_categories?: { id: string; name: string; emoji: string; color: string } | null;
}

interface SharedPantry {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  role: string;
}

export function SharedPantryTab({ userId }: { userId: string }) {
  const [pantries, setPantries] = useState<SharedPantry[]>([]);
  const [activePantryId, setActivePantryId] = useState<string | null>(null);
  const [items, setItems] = useState<SharedPantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");

  // userId is available for future use (e.g. showing who added each item)
  void userId;

  const activePantry = pantries.find((p) => p.id === activePantryId);

  useEffect(() => {
    fetch("/api/shared-pantry")
      .then((r) => r.json())
      .then((data: SharedPantry[]) => {
        setPantries(data ?? []);
        if (data?.length > 0) setActivePantryId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadItems = useCallback(async () => {
    if (!activePantryId) return;
    const res = await fetch(`/api/shared-pantry/${activePantryId}/items`);
    if (res.ok) setItems(await res.json());
  }, [activePantryId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (!activePantryId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`shared-pantry-${activePantryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_pantry_items", filter: `pantry_id=eq.${activePantryId}` },
        () => { loadItems(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activePantryId, loadItems]);

  async function createPantry() {
    if (!newName.trim()) return;
    const res = await fetch("/api/shared-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: newName }),
    });
    if (res.ok) {
      const { pantry } = await res.json();
      setPantries((prev) => [...prev, { ...pantry, role: "owner" }]);
      setActivePantryId(pantry.id);
      setShowCreate(false);
      setNewName("");
    }
  }

  async function joinPantry() {
    if (!joinCode.trim()) return;
    const res = await fetch("/api/shared-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code: joinCode }),
    });
    if (res.ok) {
      const { pantry } = await res.json();
      setPantries((prev) => [...prev, { ...pantry, role: "editor" }]);
      setActivePantryId(pantry.id);
      setShowJoin(false);
      setJoinCode("");
    }
  }

  async function addItem() {
    if (!addName.trim() || !activePantryId) return;
    setAdding(true);
    const res = await fetch(`/api/shared-pantry/${activePantryId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setAddName("");
    }
    setAdding(false);
  }

  async function removeItem(itemId: string) {
    if (!activePantryId) return;
    await fetch(`/api/shared-pantry/${activePantryId}/items?itemId=${itemId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function copyCode() {
    if (!activePantry) return;
    await navigator.clipboard.writeText(activePantry.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#8A6A4A" }} />
      </div>
    );
  }

  if (pantries.length === 0 && !showCreate && !showJoin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <Users style={{ width: 40, height: 40, color: "#3A2416", opacity: 0.4 }} />
        <p className="text-base font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Shared Pantry
        </p>
        <p className="text-sm max-w-xs" style={{ color: "#7A5A40" }}>
          Share your pantry with a partner or housemate. See each other&apos;s ingredients in real time.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#C85A2F", color: "#fff" }}>
            Create pantry
          </button>
          <button onClick={() => setShowJoin(true)} className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: "rgba(90,50,20,0.4)", color: "#C8A882", background: "transparent" }}>
            Join with code
          </button>
        </div>
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="flex flex-col gap-4 py-8 max-w-sm mx-auto">
        <h3 className="text-base font-bold" style={{ color: "#EFE3CE" }}>Create shared pantry</h3>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createPantry()}
          placeholder="e.g. Our Kitchen" autoFocus
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
        />
        <div className="flex items-center gap-2">
          <button onClick={createPantry} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#C85A2F", color: "#fff" }}>Create</button>
          <button onClick={() => setShowCreate(false)} className="text-sm" style={{ color: "#6B5040" }}>Cancel</button>
        </div>
      </div>
    );
  }

  if (showJoin) {
    return (
      <div className="flex flex-col gap-4 py-8 max-w-sm mx-auto">
        <h3 className="text-base font-bold" style={{ color: "#EFE3CE" }}>Join with invite code</h3>
        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && joinPantry()}
          placeholder="ABC123" maxLength={6} autoFocus
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none font-mono tracking-widest"
          style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
        />
        <div className="flex items-center gap-2">
          <button onClick={joinPantry} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#C85A2F", color: "#fff" }}>Join</button>
          <button onClick={() => setShowJoin(false)} className="text-sm" style={{ color: "#6B5040" }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activePantry && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(42,24,8,0.5)", border: "1px solid rgba(90,50,20,0.3)" }}>
          <Users style={{ width: 16, height: 16, color: "#8A6A4A", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{activePantry.name}</p>
            <p className="text-xs" style={{ color: "#6B5040" }}>
              Invite code: <span className="font-mono font-bold tracking-widest" style={{ color: "#C8A882" }}>{activePantry.invite_code}</span>
            </p>
          </div>
          <button onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: codeCopied ? "rgba(130,142,111,0.2)" : "rgba(90,50,20,0.3)", color: codeCopied ? "#828E6F" : "#C8A882" }}>
            {codeCopied ? <><Check style={{ width: 12, height: 12 }} /> Copied</> : <><Copy style={{ width: 12, height: 12 }} /> Copy code</>}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add ingredient…"
          className="flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
        />
        <button onClick={addItem} disabled={adding || !addName.trim()}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "#C85A2F", color: "#fff" }}>
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "#6B5040" }}>No items yet — add something above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl group"
              style={{ background: "rgba(42,24,8,0.4)", border: "1px solid rgba(90,50,20,0.2)" }}>
              <span className="text-lg w-7 text-center shrink-0">{item.ingredient_categories?.emoji ?? "🍽️"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{item.name}</p>
                {(item.quantity || item.unit) && (
                  <p className="text-xs" style={{ color: "#6B5040" }}>{item.quantity} {item.unit}</p>
                )}
              </div>
              <button onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                style={{ color: "#A69180" }} aria-label="Remove">
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => setShowCreate(true)} className="text-xs" style={{ color: "#6B5040" }}>+ Create another</button>
        <button onClick={() => setShowJoin(true)} className="text-xs" style={{ color: "#6B5040" }}>+ Join another</button>
      </div>
    </div>
  );
}
