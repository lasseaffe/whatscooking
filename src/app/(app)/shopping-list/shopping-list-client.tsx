"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Trash2, CheckCircle2, Circle, X, PackageCheck } from "lucide-react";
import {
  type ShoppingItem,
  loadShoppingList,
  toggleShoppingItem,
  removeShoppingItem,
  clearCheckedItems,
} from "@/lib/shopping-list";

export function ShoppingListClient() {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    setItems(loadShoppingList());
  }, []);

  const handleToggle = useCallback((id: string) => {
    setItems(toggleShoppingItem(id));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems(removeShoppingItem(id));
  }, []);

  const handleClearChecked = useCallback(() => {
    setItems(clearCheckedItems());
  }, []);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const byRecipe = unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.recipeTitle ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8"
      style={{ background: "var(--wc-bg-base, #1A0E06)" }}
    >
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(176,125,86,0.18)", border: "1px solid rgba(176,125,86,0.3)" }}
          >
            <ShoppingCart style={{ width: 18, height: 18, color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              My Shopping List
            </h1>
            <p className="text-xs" style={{ color: "#6B4E36" }}>
              {unchecked.length} item{unchecked.length !== 1 ? "s" : ""} to buy
            </p>
          </div>
          {checked.length > 0 && (
            <button
              onClick={handleClearChecked}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{
                background: "rgba(42,24,8,0.6)",
                border: "1px solid rgba(58,36,22,0.6)",
                color: "#8A6A4A",
              }}
            >
              <Trash2 style={{ width: 11, height: 11 }} />
              Clear {checked.length} done
            </button>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
            style={{ background: "rgba(26,16,8,0.5)", border: "1px dashed rgba(42,24,8,0.7)" }}
          >
            <PackageCheck style={{ width: 36, height: 36, color: "#3A2416" }} />
            <p className="text-sm font-semibold" style={{ color: "#6B4E36" }}>
              Your list is empty
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#4A3020" }}>
              Open a recipe and use{" "}
              <strong style={{ color: "#8A6A4A" }}>Add all to list</strong> or{" "}
              <strong style={{ color: "#8A6A4A" }}>Add missing</strong> to populate it.
            </p>
          </div>
        )}

        {/* Unchecked grouped by recipe */}
        {Object.entries(byRecipe).map(([recipe, recipeItems]) => (
          <div key={recipe}>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
              style={{ color: "#6B4E36" }}
            >
              {recipe}
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(42,24,8,0.6)", background: "rgba(26,16,8,0.6)" }}
            >
              {recipeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: idx < recipeItems.length - 1 ? "1px solid rgba(42,24,8,0.5)" : "none",
                  }}
                >
                  <button onClick={() => handleToggle(item.id)} className="shrink-0 hover:opacity-80" aria-label="Mark as bought">
                    <Circle style={{ width: 20, height: 20, color: "#3A2416" }} />
                  </button>
                  <span className="flex-1 text-sm" style={{ color: "var(--wc-text, #EFE3CE)" }}>
                    {[item.amount, item.unit, item.name].filter(Boolean).join(" ")}
                  </span>
                  <button onClick={() => handleRemove(item.id)} className="shrink-0 hover:opacity-70" aria-label="Remove">
                    <X style={{ width: 14, height: 14, color: "#5A3A28" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Checked / in-cart */}
        {checked.length > 0 && (
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
              style={{ color: "#4A3020" }}
            >
              In cart ({checked.length})
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(42,24,8,0.4)", background: "rgba(18,12,7,0.5)" }}
            >
              {checked.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: idx < checked.length - 1 ? "1px solid rgba(42,24,8,0.4)" : "none",
                    opacity: 0.5,
                  }}
                >
                  <button onClick={() => handleToggle(item.id)} className="shrink-0 hover:opacity-80" aria-label="Unmark">
                    <CheckCircle2 style={{ width: 20, height: 20, color: "#828E6F" }} />
                  </button>
                  <span className="flex-1 text-sm line-through" style={{ color: "#5A3A28" }}>
                    {[item.amount, item.unit, item.name].filter(Boolean).join(" ")}
                  </span>
                  <button onClick={() => handleRemove(item.id)} className="shrink-0 hover:opacity-70" aria-label="Remove">
                    <X style={{ width: 14, height: 14, color: "#3A2416" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
