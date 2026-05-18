export interface InspirationTag {
  id: string;
  label: string;
  category: 'cuisine' | 'mood' | 'season' | 'chef';
}

export const INSPIRATION_TAGS: InspirationTag[] = [
  // cuisines
  { id: 'italian',  label: 'Italian',  category: 'cuisine' },
  { id: 'thai',     label: 'Thai',     category: 'cuisine' },
  { id: 'korean',   label: 'Korean',   category: 'cuisine' },
  { id: 'mexican',  label: 'Mexican',  category: 'cuisine' },
  { id: 'french',   label: 'French',   category: 'cuisine' },
  { id: 'mediterranean', label: 'Mediterranean', category: 'cuisine' },
  { id: 'middle-eastern', label: 'Middle Eastern', category: 'cuisine' },
  { id: 'indian',   label: 'Indian',   category: 'cuisine' },
  // moods
  { id: 'cozy',     label: 'Cozy',         category: 'mood' },
  { id: 'quick',    label: 'Quick',        category: 'mood' },
  { id: 'impress',  label: 'Impress guests', category: 'mood' },
  { id: 'comfort',  label: 'Comfort',      category: 'mood' },
  { id: 'fresh',    label: 'Fresh & light', category: 'mood' },
  // seasons
  { id: 'spring',   label: 'Spring produce', category: 'season' },
  { id: 'summer',   label: 'Summer',        category: 'season' },
  { id: 'autumn',   label: 'Autumn',        category: 'season' },
  { id: 'winter',   label: 'Winter',        category: 'season' },
];
