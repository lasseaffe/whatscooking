export type ChallengeCategory = 'handicap' | 'appliance' | 'speedrun' | 'wildcard' | 'dare';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'insane';

export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  requires_proof: boolean;
  is_daily: boolean;
  is_active: boolean;
  created_at: string;
  rules: string[];
  objective: string | null;
  target_seconds: number | null;
  strategy_tip: string | null;
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  proof_url: string | null;
  note: string | null;
  elapsed_seconds: number | null;
  challenge?: ChallengeDef;
  completer_name?: string | null;
  completer_avatar?: string | null;
}

export interface ChallengeReaction {
  id: string;
  completion_id: string;
  user_id: string;
  created_at: string;
}

export interface ActiveChallenge {
  challengeId: string;
  title: string;
  emoji: string;
  startedAt: string;
  requiresProof: boolean;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  objective: string | null;
  rules: string[];
  targetSeconds: number | null;
  strategyTip: string | null;
}
