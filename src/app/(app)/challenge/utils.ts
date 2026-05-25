import type { ActiveChallenge, ChallengeCategory, ChallengeDifficulty, ChallengeDef } from './types';

const STORAGE_KEY = 'wc_active_challenge';

// Snapshot a challenge definition into a live run object, carrying all the
// content the HUD + Run screen need so they render without a refetch.
export function toActiveChallenge(def: ChallengeDef): ActiveChallenge {
  return {
    challengeId: def.id,
    title: def.title,
    emoji: def.emoji,
    startedAt: new Date().toISOString(),
    requiresProof: def.requires_proof,
    category: def.category,
    difficulty: def.difficulty,
    objective: def.objective ?? null,
    rules: def.rules ?? [],
    targetSeconds: def.target_seconds ?? null,
    strategyTip: def.strategy_tip ?? null,
  };
}

export function getActiveChallenge(): ActiveChallenge | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveChallenge) : null;
  } catch {
    return null;
  }
}

export function setActiveChallenge(c: ActiveChallenge): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function clearActiveChallenge(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Live timer readout. Speedruns (target set) count DOWN with urgency tones;
// everything else counts UP. tone drives the colour ramp in HUD + Run screen.
export function timerView(
  elapsed: number,
  target: number | null,
): { text: string; tone: 'live' | 'warn' | 'over' } {
  if (target == null) return { text: formatElapsed(elapsed), tone: 'live' };
  const remaining = target - elapsed;
  if (remaining <= 0) return { text: `+${formatElapsed(-remaining)}`, tone: 'over' };
  if (remaining <= 60) return { text: formatElapsed(remaining), tone: 'warn' };
  return { text: formatElapsed(remaining), tone: 'live' };
}

export const TIMER_TONE_COLOR: Record<'live' | 'warn' | 'over', string> = {
  live: '#F4A261',
  warn: '#F2A900',
  over: '#ff6b6b',
};

// Speedrun par comparison shown on completion.
export function parResult(elapsed: number, target: number): { beat: boolean; label: string } {
  const delta = target - elapsed;
  if (delta >= 0) return { beat: true, label: `Beat par by ${formatElapsed(delta)} 🏆` };
  return { beat: false, label: `Over par by ${formatElapsed(-delta)}` };
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const CATEGORY_LABEL: Record<ChallengeCategory, string> = {
  handicap: '🦾 Handicap Mode',
  appliance: '🔌 Appliance Chaos',
  speedrun: '⚡ Speedrun',
  wildcard: '🎰 Wildcard',
  dare: '😈 Dare Challenges',
};

export const CATEGORY_SUBTITLE: Record<ChallengeCategory, string> = {
  handicap: 'Cook with physical limitations. Chaos guaranteed.',
  appliance: 'Only allowed to use the wrong tool for the job.',
  speedrun: 'Race the clock. Every second counts.',
  wildcard: 'Random rules. No previews. No mercy.',
  dare: 'Social stunts for the brave.',
};

export const CATEGORY_GRADIENT: Record<ChallengeCategory, string> = {
  handicap: 'linear-gradient(135deg,#2A1808,#1a1215)',
  appliance: 'linear-gradient(135deg,#0f1a2a,#0a1520)',
  speedrun: 'linear-gradient(135deg,#1a1a08,#1a1200)',
  wildcard: 'linear-gradient(135deg,#1a0f20,#120a1a)',
  dare: 'linear-gradient(135deg,#2a0808,#1a0808)',
};

export const DIFFICULTY_COLOR: Record<ChallengeDifficulty, { bg: string; text: string; label: string }> = {
  easy:   { bg: '#1a2e1a', text: '#7abd7a', label: 'EASY' },
  medium: { bg: '#2A1808', text: '#F4A261', label: 'MEDIUM' },
  hard:   { bg: '#2A2220', text: '#e07a7a', label: 'HARD' },
  insane: { bg: '#2A2220', text: '#ff6b6b', label: 'INSANE' },
};
