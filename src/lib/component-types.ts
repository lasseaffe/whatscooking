import type { ComponentType } from "./types";

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  sauce:       "Sauce",
  dressing:    "Dressing",
  marinade:    "Marinade",
  base:        "Base / Stock",
  paste:       "Paste",
  spice_blend: "Spice Blend",
  condiment:   "Condiment",
  batter:      "Batter / Dough",
};

export const COMPONENT_TYPE_EMOJI: Record<ComponentType, string> = {
  sauce:       "🍅",
  dressing:    "🥗",
  marinade:    "🫙",
  base:        "🍲",
  paste:       "🧄",
  spice_blend: "🌶️",
  condiment:   "🫒",
  batter:      "🥣",
};

export const ALL_COMPONENT_TYPES: ComponentType[] = [
  'sauce','dressing','marinade','base','paste','spice_blend','condiment','batter',
];
