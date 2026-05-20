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
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  proof_url: string | null;
  note: string | null;
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
}
