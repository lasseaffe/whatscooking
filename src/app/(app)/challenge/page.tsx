import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChallengeClient } from './challenge-client';
import type { ChallengeDef, ChallengeCompletion } from './types';

export const dynamic = 'force-dynamic';

export default async function ChallengePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: challenges } = await supabase
    .from('challenge_definitions')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .returns<ChallengeDef[]>();

  const allChallenges = challenges ?? [];

  const byCategory = allChallenges.reduce<Record<string, ChallengeDef[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const daily = allChallenges.find(c => c.is_daily) ?? null;

  const { data: completions } = await supabase
    .from('challenge_completions')
    .select('*, challenge:challenge_definitions(*)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .returns<ChallengeCompletion[]>();

  const { data: householdMembersRaw } = await supabase
    .from('household_members')
    .select('linked_user_id, name')
    .not('linked_user_id', 'is', null);

  const householdIds = (householdMembersRaw ?? [])
    .map(m => m.linked_user_id as string)
    .filter(id => id !== user.id);
  const allHouseholdIds = [user.id, ...householdIds];

  const weekStart = new Date();
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - ((day + 6) % 7)); // Monday start (ISO)
  weekStart.setHours(0, 0, 0, 0);

  const { data: weekCompletions } = await supabase
    .from('challenge_completions')
    .select('user_id')
    .in('user_id', allHouseholdIds)
    .gte('completed_at', weekStart.toISOString());

  const countByUser: Record<string, number> = {};
  for (const w of weekCompletions ?? []) {
    countByUser[w.user_id] = (countByUser[w.user_id] ?? 0) + 1;
  }

  const nameMap = Object.fromEntries(
    (householdMembersRaw ?? []).map(m => [m.linked_user_id, m.name])
  );

  const leaderboard = allHouseholdIds.map(id => ({
    user_id: id,
    name: nameMap[id] ?? null,
    count: countByUser[id] ?? 0,
    is_me: id === user.id,
  })).sort((a, b) => b.count - a.count);

  const { data: feedRaw } = await supabase
    .from('challenge_completions')
    .select('*, challenge:challenge_definitions(*)')
    .in('user_id', allHouseholdIds)
    .order('completed_at', { ascending: false })
    .limit(30)
    .returns<ChallengeCompletion[]>();

  const feedIds = (feedRaw ?? []).map(f => f.id);
  const { data: reactionsRaw } = feedIds.length
    ? await supabase.from('challenge_reactions').select('completion_id, user_id').in('completion_id', feedIds)
    : { data: [] };

  const householdFeed = (feedRaw ?? []).map(f => {
    const reacts = (reactionsRaw ?? []).filter(r => r.completion_id === f.id);
    return {
      ...f,
      completer_name: nameMap[f.user_id] ?? null,
      reaction_count: reacts.length,
      i_reacted: reacts.some(r => r.user_id === user.id),
    };
  });

  const sortedDates = (completions ?? [])
    .map(c => new Date(c.completed_at).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streakDays = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    let check = new Date(sortedDates[0]);
    for (const d of sortedDates) {
      if (new Date(d).toDateString() === check.toDateString()) {
        streakDays++;
        check = new Date(check.getTime() - 86400000);
      } else break;
    }
  }

  return (
    <ChallengeClient
      allChallenges={allChallenges}
      byCategory={byCategory}
      daily={daily}
      completions={completions ?? []}
      leaderboard={leaderboard}
      householdFeed={householdFeed}
      currentUserId={user.id}
      streakDays={streakDays}
    />
  );
}
