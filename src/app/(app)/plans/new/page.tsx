'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, CalendarDays, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { PLAN_TEMPLATES, type PlanTemplate } from './plan-templates';
import { TemplateCard } from './template-card';

const DIETARY_OPTIONS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'high-protein', 'keto', 'paleo', 'low-carb',
];

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get('template');

  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId) ?? null : null,
  );
  const [title, setTitle] = useState<string>(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId)?.title ?? '' : '',
  );
  const [durationDays, setDurationDays] = useState<number>(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId)?.durationDays ?? 7 : 7,
  );
  const [mealsPerDay, setMealsPerDay] = useState<number>(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId)?.mealsPerDay ?? 3 : 3,
  );
  const [dietaryFilters, setDietaryFilters] = useState<string[]>(
    presetId ? PLAN_TEMPLATES.find((t) => t.id === presetId)?.dietaryFilters ?? [] : [],
  );
  const [showCustom, setShowCustom] = useState<boolean>(!presetId);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function toggleDiet(tag: string) {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function applyTemplate(t: PlanTemplate | null) {
    setSelectedTemplate(t);
    if (t) {
      setTitle(t.title);
      setDurationDays(t.durationDays);
      setMealsPerDay(t.mealsPerDay);
      setDietaryFilters(t.dietaryFilters);
      setShowCustom(false);
    } else {
      setTitle('');
    }
  }

  async function create() {
    if (!title.trim()) { setError('Give your plan a name.'); return; }
    setCreating(true);
    setError('');

    const template_meals = selectedTemplate ? selectedTemplate.meals.map((m) => m.title) : undefined;
    const pinboard_filters = selectedTemplate ? { diet: selectedTemplate.dietaryFilters } : undefined;

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          dietary_tags: dietaryFilters,
          tags: selectedTemplate ? selectedTemplate.tags : [],
          description: selectedTemplate
            ? selectedTemplate.description
            : `${durationDays}-day plan, ${mealsPerDay} meals/day`,
          duration_days: durationDays,
          meals_per_day: mealsPerDay,
          template_meals,
          pinboard_filters,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <header className="mb-7">
        <h1 className="text-2xl font-serif flex items-center gap-2" style={{ color: '#EFE3CE' }}>
          <CalendarDays className="w-6 h-6" style={{ color: '#E67E22' }} />
          New Meal Plan
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A6A4A' }}>
          Start from a template or build your own. You&apos;ll land on the Pinboard to fine-tune.
        </p>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" style={{ color: '#E67E22' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#EFE3CE' }}>Choose a template</h2>
          <span className="text-xs" style={{ color: '#6B4E36' }}>— optional</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLAN_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              selected={selectedTemplate?.id === tpl.id}
              onSelect={() => applyTemplate(selectedTemplate?.id === tpl.id ? null : tpl)}
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <button
          onClick={() => setShowCustom((s) => !s)}
          className="flex items-center gap-2 mb-3 text-sm"
          style={{ color: '#EFE3CE' }}
          aria-expanded={showCustom}
        >
          {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Custom settings
        </button>
        {showCustom && (
          <div className="flex flex-col gap-4 p-4 rounded-lg border" style={{ background: '#1A120A', borderColor: '#3A2A1A' }}>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Plan name</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cozy Sunday week"
                className="px-3 py-2 rounded border text-sm focus:outline-none"
                style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
              />
            </label>
            <div className="flex gap-4">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Duration</span>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="px-3 py-2 rounded border text-sm"
                  style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
                >
                  {[3, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Meals / day</span>
                <select
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
                  className="px-3 py-2 rounded border text-sm"
                  style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
                >
                  {[1, 2, 3, 4].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6B4E36' }}>Dietary tags</p>
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
                        borderColor: on ? '#E67E22' : '#3A2A1A',
                        color: on ? '#1A120A' : '#8A6A4A',
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

      {!showCustom && (
        <label className="flex flex-col gap-1 mb-4">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Plan name</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={selectedTemplate?.title ?? 'e.g. Cozy Sunday week'}
            className="px-3 py-2 rounded border text-sm focus:outline-none"
            style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
          />
        </label>
      )}

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
