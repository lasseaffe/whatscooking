'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Check, Trash2 } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

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
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newItem.trim()) return;
    setAdding(true);
    await fetch(`/api/events/${eventId}/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItem.trim(), quantity: newQty.trim() || null }),
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

  const unchecked = shoppingItems.filter(i => !i.checked);
  const checked = shoppingItems.filter(i => i.checked);

  return (
    <div className="flex flex-col gap-5 pb-12">
      {canInteract && (
        <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(239,227,206,0.4)' }}>Add item</p>
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
        <div className="flex flex-col gap-2">
          {unchecked.map(item => (
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
