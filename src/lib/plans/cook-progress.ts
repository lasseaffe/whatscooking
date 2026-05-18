export interface CookableEntry {
  id: string;
  day_number: number;
  meal_type: string;
  recipe_id: string | null;
  recipe_title: string;
  is_leftover: boolean;
  cooked_at: string | null;
  parent_clientid?: string | null;
}

export interface CookProgress {
  total: number;
  cooked: number;
  reheated: number;
  pending: number;
  pctComplete: number;
}

export function summarizeCookProgress(entries: CookableEntry[]): CookProgress {
  const cookable = entries.filter(e => !e.is_leftover);
  const cooked = cookable.filter(e => e.cooked_at != null).length;
  const reheated = entries.filter(e => e.is_leftover && e.cooked_at != null).length;
  return {
    total: cookable.length,
    cooked,
    reheated,
    pending: cookable.length - cooked,
    pctComplete: cookable.length > 0 ? cooked / cookable.length : 0,
  };
}

export function todayDayNumber(weekStart: string | null, today = new Date()): number | null {
  if (!weekStart) return null;
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const diff = Math.floor((t.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return diff + 1;
}
