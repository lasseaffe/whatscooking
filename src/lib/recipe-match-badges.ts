import type { PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';
import { squadDislikeHits } from './recipe-match';

export interface MatchBadge {
  label: string;
  tone: 'pantry' | 'diet' | 'time' | 'batch' | 'inspiration' | 'squad';
}

export interface SquadHint {
  dislike: string[];
}

export function buildMatchBadges(
  recipe: any,
  filters: PinboardFilters,
  squad?: SquadHint,
): MatchBadge[] {
  const badges: MatchBadge[] = [];
  if (typeof recipe.pantry_match === 'number' && recipe.pantry_match > 0.5) {
    badges.push({ label: `${Math.round(recipe.pantry_match * 100)}% pantry`, tone: 'pantry' });
  }
  if (filters.diet.length > 0 && (recipe.dietary_tags ?? []).some((t: string) => filters.diet.includes(t))) {
    badges.push({ label: '✓ diet', tone: 'diet' });
  }
  const total = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  if (total > 0 && total <= filters.time_weeknight) {
    badges.push({ label: `${total}m`, tone: 'time' });
  }
  if (recipe.batch_friendly && filters.batch_enabled) {
    badges.push({ label: '🍳 batch', tone: 'batch' });
  }
  if (filters.squad_aware && squad && squad.dislike.length > 0) {
    const hits = squadDislikeHits(recipe, squad.dislike);
    if (hits.length > 0) {
      badges.push({ label: `👥 ${hits.slice(0, 2).join(', ')}`, tone: 'squad' });
    }
  }
  return badges;
}
