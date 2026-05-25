'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const DIETARY_OPTIONS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'high-protein', 'keto', 'paleo', 'low-carb',
];

export default function NewPlanPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function toggleDiet(tag: string) {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function create() {
    if (!title.trim()) { setError('Give your plan a name.'); return; }
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          dietary_tags: dietaryFilters,
          tags: [],
          description: `${durationDays}-day plan, ${mealsPerDay} meals/day`,
          duration_days: durationDays,
          meals_per_day: mealsPerDay,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to create plan.');
        setCreating(false);
        return;
      }

      const plan = await res.json();
      router.push(`/plans/${plan.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setCreating(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      <header className="mb-7">
        <h1 className="text-2xl font-serif flex items-center gap-2" style={{ color: 'var(--fg-primary)' }}>
          <CalendarDays className="w-6 h-6" style={{ color: '#E67E22' }} />
          New Meal Plan
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-tertiary)' }}>
          Build your own from scratch — or start from a template on the Plans page. You&apos;ll land on the Pinboard to fill it out.
        </p>
      </header>

      <label className="flex flex-col gap-1 mb-4">
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--fg-tertiary)' }}>Plan name</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !creating) create(); }}
          placeholder="e.g. Cozy Sunday week"
          autoFocus
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--wc-border-subtle, #3A2A1A)', color: 'var(--fg-primary)' }}
        />
      </label>

      <section className="mb-6">
        <button
          onClick={() => setShowCustom((s) => !s)}
          className="flex items-center gap-2 mb-3 text-sm"
          style={{ color: 'var(--fg-primary)' }}
          aria-expanded={showCustom}
        >
          {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Duration, meals &amp; dietary tags
        </button>
        {showCustom && (
          <div className="flex flex-col gap-4 p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--wc-border-subtle, #3A2A1A)' }}>
            <div className="flex gap-4">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--fg-tertiary)' }}>Duration</span>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--wc-border-subtle, #3A2A1A)', color: 'var(--fg-primary)' }}
                >
                  {[3, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--fg-tertiary)' }}>Meals / day</span>
                <select
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--wc-border-subtle, #3A2A1A)', color: 'var(--fg-primary)' }}
                >
                  {[1, 2, 3, 4].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--fg-tertiary)' }}>Dietary tags</p>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map((d) => {
                  const on = dietaryFilters.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDiet(d)}
                      className="px-3 py-1 rounded-full text-xs border transition-colors"
                      style={{
                        background: on ? '#E67E22' : 'transparent',
                        borderColor: on ? '#E67E22' : 'var(--wc-border-subtle, #3A2A1A)',
                        color: on ? '#1A120A' : 'var(--fg-tertiary)',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm mb-3" style={{ color: '#E67E22' }}>{error}</p>}

      <button
        onClick={create}
        disabled={creating || !title.trim()}
        className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold disabled:opacity-40 transition-opacity"
        style={{ background: '#E67E22', color: '#1A120A' }}
      >
        {creating ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating…</span> : 'Create plan →'}
      </button>
    </div>
  );
}
