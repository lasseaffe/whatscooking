// src/lib/plans/squad-resolve.ts
//
// Resolve household squad preferences for a given user. Pulls from the
// existing household_members + member_ingredient_preferences + member_allergens
// tables. No new schema introduced.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SquadMember {
  id: string;
  name: string;
  member_type: 'baby' | 'toddler' | 'child' | 'adult';
  avoid: string[];
  dislike: string[];
  love: string[];
}

export interface SquadPreferences {
  members: SquadMember[];
  avoid: string[]; // union of all members' avoid + allergens, lowercased
  dislike: string[]; // union of all members' dislike, lowercased
  love: string[]; // union of all members' love, lowercased
}

function norm(s: string): string {
  return s.toLowerCase().trim();
}

export async function resolveSquadPreferences(
  supabase: SupabaseClient,
  user_id: string,
): Promise<SquadPreferences> {
  // Use the canonical kitchen_group_members table (same pattern as /api/family/members).
  const { data: memberships } = await supabase
    .from('kitchen_group_members')
    .select('group_id')
    .eq('user_id', user_id);

  const groupIds = (memberships ?? []).map((m: { group_id: string }) => m.group_id);
  if (groupIds.length === 0) {
    return { members: [], avoid: [], dislike: [], love: [] };
  }

  const { data: rawMembers } = await supabase
    .from('household_members')
    .select('id, name, display_name, member_type, kitchen_group_id')
    .in('kitchen_group_id', groupIds);

  const memberIds = (rawMembers ?? []).map((m: { id: string }) => m.id);
  if (memberIds.length === 0) {
    return { members: [], avoid: [], dislike: [], love: [] };
  }

  const [{ data: prefs }, { data: allergens }] = await Promise.all([
    supabase
      .from('member_ingredient_preferences')
      .select('member_id, ingredient_text, sentiment')
      .in('member_id', memberIds),
    supabase
      .from('member_allergens')
      .select('member_id, allergen')
      .in('member_id', memberIds),
  ]);

  type PrefRow = { member_id: string; ingredient_text: string; sentiment: string };
  type AllergenRow = { member_id: string; allergen: string };
  type MemberRow = {
    id: string;
    name: string | null;
    display_name: string | null;
    member_type: SquadMember['member_type'];
    kitchen_group_id: string;
  };

  const prefRows = (prefs ?? []) as PrefRow[];
  const allergenRows = (allergens ?? []) as AllergenRow[];

  const members: SquadMember[] = (rawMembers ?? []).map((raw: unknown) => {
    const m = raw as MemberRow;
    const myPrefs = prefRows.filter((p) => p.member_id === m.id);
    const myAllergens = allergenRows.filter((a) => a.member_id === m.id);
    return {
      id: m.id,
      name: m.display_name || m.name || 'Member',
      member_type: m.member_type,
      avoid: [
        ...myPrefs
          .filter((p) => p.sentiment === 'avoid')
          .map((p) => norm(p.ingredient_text)),
        ...myAllergens.map((a) => norm(a.allergen)),
      ].filter(Boolean),
      dislike: myPrefs
        .filter((p) => p.sentiment === 'dislike')
        .map((p) => norm(p.ingredient_text))
        .filter(Boolean),
      love: myPrefs
        .filter((p) => p.sentiment === 'love')
        .map((p) => norm(p.ingredient_text))
        .filter(Boolean),
    };
  });

  const union = (sel: (m: SquadMember) => string[]) =>
    Array.from(new Set(members.flatMap(sel)));

  return {
    members,
    avoid: union((m) => m.avoid),
    dislike: union((m) => m.dislike),
    love: union((m) => m.love),
  };
}
