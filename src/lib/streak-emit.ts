export interface StreakEvent {
  user_id: string;
  action_id: string;
  source: 'whatscooking';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function emitStreakEvent(event: StreakEvent): Promise<void> {
  // CROSS-APP: streak event integration point.
  // Today: no-op stub. When HolyFlex streak surface lands in WC, replace
  // this body with the actual emission (Supabase insert into shared
  // streak_events table, or HTTP call to HF's /api/streak/tick).
  if (process.env.NODE_ENV === 'development') {
    console.log('[streak]', event.action_id, event.user_id, event.metadata);
  }
}
