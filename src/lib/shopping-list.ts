"use client";

export type ShoppingItem = {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
  recipeTitle?: string;
  checked: boolean;
  isBaby?: boolean;  // true when this item was added as a baby-specific ingredient
};

const KEY = "wc_shopping_list_v1";

export function loadShoppingList(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShoppingItem[]) : [];
  } catch {
    return [];
  }
}

export function saveShoppingList(items: ShoppingItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function addToShoppingList(
  incoming: Omit<ShoppingItem, "id" | "checked">[],
): ShoppingItem[] {
  const current = loadShoppingList();
  const added: ShoppingItem[] = [];
  for (const item of incoming) {
    const exists = current.some(
      (c) => c.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (!exists) {
      added.push({ ...item, id: crypto.randomUUID(), checked: false });
    }
  }
  const next = [...current, ...added];
  saveShoppingList(next);
  return next;
}

export function toggleShoppingItem(id: string): ShoppingItem[] {
  const current = loadShoppingList();
  const next = current.map((c) =>
    c.id === id ? { ...c, checked: !c.checked } : c,
  );
  saveShoppingList(next);
  return next;
}

export function removeShoppingItem(id: string): ShoppingItem[] {
  const next = loadShoppingList().filter((c) => c.id !== id);
  saveShoppingList(next);
  return next;
}

export function clearCheckedItems(): ShoppingItem[] {
  const next = loadShoppingList().filter((c) => !c.checked);
  saveShoppingList(next);
  return next;
}
