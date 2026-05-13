'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Check, Trash2 } from 'lucide-react';
import type { FullEventData, ShoppingCategory } from '@/lib/event-types';

const CATEGORIES: { value: ShoppingCategory; label: string; icon: string }[] = [
  { value: 'ingredient', label: 'Ingredient', icon: '🥕' },
  { value: 'beverage',   label: 'Beverage',   icon: '🍷' },
  { value: 'equipment',  label: 'Equipment',  icon: '🍳' },
  { value: 'other',      label: 'Other',      icon: '📦' },
];

const CATEGORY_COLOR: Record<ShoppingCategory, string> = {
  ingredient: 'rgba(34,197,94,0.7)',
  beverage:   'rgba(99,102,241,0.7)',
  equipment:  'rgba(234,179,8,0.7)',
  other:      'rgba(239,227,206,0.3)',
};

export function ShoppingTab({ data, canInteract, eventId, userId, onReload }: {
  data: FullEventData;
  canInteract: boolean;
  eventId: string;
  userId: string;
  onReload: () => void;
}) {
  const { shoppingItems } = data;
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCat, setNewCat] = useState<ShoppingCategory>('other');
  const [adding, setAdding] = useState(false);

  const [showRecipePanel, setShowRecipePanel] = useState(false);
  const [recipeGroups, setRecipeGroups] = useState<{
    menuItemId: string;
    menuItemName: string;
    recipeId: string;
    servings: number | null;
    ingredients: { name: string; quantity: string | null; rawQuantity: number | null; unit: string | null }[];
  }[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const guestCount = data.guests.filter(g => g.rsvp === 'accepted').length || 1;
  const [scaleTo, setScaleTo] = useState<number>(guestCount);
  const [importingRecipes, setImportingRecipes] = useState(false);

  async function handleAdd() {
    if (!newItem.trim()) return;
    setAdding(true);
    await fetch(`/api/events/${eventId}/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItem.trim(), quantity: newQty.trim() || null, category: newCat }),
    });
    setNewItem('');
    setNewQty('');
    setAdding(false);
    onReload();
  }

  async function handleToggle(itemId: string, checked: boolean) {
    await fetch(`/api/events/${eventId}/shopping/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !checked }),
    });
    onReload();
  }

  async function handleDelete(itemId: string) {
    await fetch(`/api/events/${eventId}/shopping/${itemId}`, { method: 'DELETE' });
    onReload();
  }

  async function openRecipePanel() {
    setLoadingRecipes(true);
    setShowRecipePanel(true);
    const res = await fetch(`/api/events/${eventId}/recipe-ingredients`);
    const groups = await res.json();
    setRecipeGroups(groups);
    const all = new Set<string>();
    groups.forEach((g: typeof recipeGroups[0]) => g.ingredients.forEach(ing => all.add(`${g.menuItemId}::${ing.name}`)));
    setSelectedIngredients(all);
    setLoadingRecipes(false);
  }

  function scaleQuantity(ing: { rawQuantity: number | null; unit: string | null; quantity: string | null }, recipeServings: number | null): string | null {
    if (!ing.rawQuantity || !recipeServings || recipeServings <= 0) return ing.quantity;
    const scaled = (ing.rawQuantity / recipeServings) * scaleTo;
    const rounded = Math.round(scaled * 100) / 100;
    return ing.unit ? `${rounded} ${ing.unit}` : String(rounded);
  }

  async function importSelected() {
    setImportingRecipes(true);
    const toImport: { name: string; quantity: string | null }[] = [];
    recipeGroups.forEach(g => {
      g.ingredients.forEach(ing => {
        if (selectedIngredients.has(`${g.menuItemId}::${ing.name}`)) {
          toImport.push({ name: ing.name, quantity: scaleQuantity(ing, g.servings) });
        }
      });
    });
    await Promise.all(toImport.map(item =>
      fetch(`/api/events/${eventId}/shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, quantity: item.quantity, category: 'ingredient' }),
      })
    ));
    setShowRecipePanel(false);
    setRecipeGroups([]);
    setSelectedIngredients(new Set());
    setImportingRecipes(false);
    onReload();
  }

  const unchecked = shoppingItems.filter(i => !i.checked);
  const checked = shoppingItems.filter(i => i.checked);

  const grouped = CATEGORIES
    .map(cat => ({ ...cat, items: unchecked.filter(i => (i.category ?? 'other') === cat.value) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5 pb-12">
      {canInteract && data.menuItems.some(m => m.recipe_id) && (
        <button
          onClick={openRecipePanel}
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-2xl w-full justify-center font-semibold"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px dashed rgba(34,197,94,0.3)', color: 'rgba(34,197,94,0.8)' }}>
          🥕 Add from recipe
        </button>
      )}

      {showRecipePanel && (
        <div className="rounded-2xl p-4 border flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.5)' }}>
              Import from recipes
            </p>
            <button onClick={() => setShowRecipePanel(false)} className="text-xs opacity-40 hover:opacity-80" style={{ color: '#EFE3CE' }}>✕</button>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-xs" style={{ color: 'rgba(239,227,206,0.6)' }}>Scale for</span>
            <input
              type="number"
              min={1}
              max={200}
              value={scaleTo}
              onChange={e => setScaleTo(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 text-center rounded-lg px-2 py-1 text-sm font-semibold"
              style={{ background: 'rgba(200,82,42,0.15)', border: '1px solid rgba(200,82,42,0.3)', color: '#EFE3CE' }}
            />
            <span className="text-xs" style={{ color: 'rgba(239,227,206,0.6)' }}>guests <span style={{ color: 'rgba(239,227,206,0.35)' }}>({guestCount} confirmed)</span></span>
          </div>
          {loadingRecipes ? (
            <p className="text-sm opacity-40">Loading…</p>
          ) : recipeGroups.length === 0 ? (
            <p className="text-sm opacity-40">No linked recipes found</p>
          ) : (
            recipeGroups.map(group => (
              <div key={group.menuItemId}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#C8522A' }}>{group.menuItemName}</p>
                {group.ingredients.map(ing => {
                  const key = `${group.menuItemId}::${ing.name}`;
                  const selected = selectedIngredients.has(key);
                  return (
                    <label key={key} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const next = new Set(selectedIngredients);
                          if (selected) next.delete(key); else next.add(key);
                          setSelectedIngredients(next);
                        }}
                      />
                      <span className="text-sm" style={{ color: '#EFE3CE' }}>{ing.name}</span>
                      {ing.quantity && (
                        <span className="text-xs opacity-40" style={{ color: '#EFE3CE' }}>
                          {scaleQuantity(ing, group.servings)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            ))
          )}
          <button
            onClick={importSelected}
            disabled={importingRecipes || selectedIngredients.size === 0}
            className="text-sm py-2 rounded-xl font-semibold disabled:opacity-40"
            style={{ background: 'rgba(34,197,94,0.2)', color: 'rgba(34,197,94,0.9)' }}>
            {importingRecipes ? 'Importing…' : `Import ${selectedIngredients.size} ingredient${selectedIngredients.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {canInteract && (
        <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(239,227,206,0.4)' }}>Add item</p>
          <div className="flex gap-2 mb-3 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setNewCat(cat.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: newCat === cat.value ? 'rgba(200,82,42,0.25)' : 'rgba(255,255,255,0.05)',
                  color: newCat === cat.value ? '#C8522A' : 'rgba(239,227,206,0.5)',
                  border: `1px solid ${newCat === cat.value ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Item name"
              className="flex-1 rounded-xl px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
            />
            <input
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              placeholder="Qty"
              className="w-20 rounded-xl px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newItem.trim()}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-40"
            style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      )}

      {shoppingItems.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'rgba(239,227,206,0.3)' }}>
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No shopping items yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(group => (
            <div key={group.value}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: CATEGORY_COLOR[group.value] }}>
                {group.icon} {group.label}
              </p>
              <div className="flex flex-col gap-2">
                {group.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => handleToggle(item.id, item.checked)}
                      className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0"
                      style={{ borderColor: 'rgba(239,227,206,0.3)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: '#EFE3CE' }}>{item.name}</p>
                      {item.quantity && <p className="text-xs" style={{ color: 'rgba(239,227,206,0.4)' }}>{item.quantity}</p>}
                    </div>
                    {canInteract && (
                      <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-80">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#EFE3CE' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {checked.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-widest mt-2 mb-1" style={{ color: 'rgba(239,227,206,0.3)' }}>Got it</p>
              {checked.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-50"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <button onClick={() => handleToggle(item.id, item.checked)}
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(200,82,42,0.25)', border: '1px solid rgba(200,82,42,0.4)' }}>
                    <Check className="w-3 h-3" style={{ color: '#C8522A' }} />
                  </button>
                  <p className="text-sm line-through flex-1" style={{ color: 'rgba(239,227,206,0.5)' }}>{item.name}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
