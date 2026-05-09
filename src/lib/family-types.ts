export type MemberType = "baby" | "toddler" | "child" | "adult";

export type MilestoneKey =
  | "started_solids"
  | "handles_soft_lumps"
  | "finger_foods"
  | "family_table";

export type AllergenKey =
  | "egg"
  | "dairy"
  | "gluten"
  | "peanut"
  | "tree_nut"
  | "soy"
  | "fish"
  | "shellfish";

export const MILESTONE_KEYS: MilestoneKey[] = [
  "started_solids",
  "handles_soft_lumps",
  "finger_foods",
  "family_table",
];

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  started_solids:     "Started Solids",
  handles_soft_lumps: "Handles Soft Lumps",
  finger_foods:       "Finger Foods",
  family_table:       "Family Table",
};

export const MILESTONE_DESCRIPTIONS: Record<MilestoneKey, string> = {
  started_solids:     "Ready for single-ingredient purées — smooth, runny textures only.",
  handles_soft_lumps: "Can manage mashed textures and soft food combinations.",
  finger_foods:       "Self-feeds soft pieces; baby-led weaning compatible.",
  family_table:       "Eating adapted versions of whatever the family is having.",
};

export const ALLERGEN_KEYS: AllergenKey[] = [
  "egg", "dairy", "gluten", "peanut", "tree_nut", "soy", "fish", "shellfish",
];

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  egg:       "Egg",
  dairy:     "Dairy",
  gluten:    "Gluten",
  peanut:    "Peanut",
  tree_nut:  "Tree Nut",
  soy:       "Soy",
  fish:      "Fish",
  shellfish: "Shellfish",
};

export interface HouseholdMember {
  id: string;
  kitchen_group_id: string;
  name: string;
  member_type: MemberType;
  date_of_birth?: string | null;
  created_by: string;
  created_at: string;
  milestones?: MemberMilestone[];
  allergens?: MemberAllergen[];
}

export interface MemberMilestone {
  id: string;
  member_id: string;
  milestone_key: MilestoneKey;
  confirmed_at: string;
  confirmed_by: string;
}

export interface MemberAllergen {
  id: string;
  member_id: string;
  allergen_key: AllergenKey;
  introduced_at: string;
  introduced_by: string;
}

/** Returns the highest confirmed milestone for a member, or null if none */
export function currentMilestone(milestones: MemberMilestone[]): MilestoneKey | null {
  const confirmed = new Set(milestones.map((m) => m.milestone_key));
  for (let i = MILESTONE_KEYS.length - 1; i >= 0; i--) {
    if (confirmed.has(MILESTONE_KEYS[i])) return MILESTONE_KEYS[i];
  }
  return null;
}

/** Returns age in human-readable form ("8 months", "2 years") or null */
export function ageLabel(dateOfBirth: string | null | undefined): string | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months <= 0) return null;
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""}`;
}
