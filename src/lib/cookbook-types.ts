// src/lib/cookbook-types.ts

export type CookbookFont = 'serif' | 'sans' | 'script';
export type CookbookStatus = 'draft' | 'published';

export interface Cookbook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  theme_color: string;
  title_font: CookbookFont;
  tagline: string | null;
  price: number;
  status: CookbookStatus;
  slug: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
  cookbook_chapters?: CookbookChapter[];
}

export interface CookbookChapter {
  id: string;
  cookbook_id: string;
  title: string;
  intro_text: string | null;
  cover_image_url: string | null;
  position: number;
  cookbook_recipes?: CookbookRecipe[];
}

export interface CookbookRecipe {
  id: string;
  chapter_id: string;
  cookbook_id: string;
  recipe_id: string;
  position: number;
  chef_note: string | null;
  creator_meal_photo_url: string | null;
  recipes?: {
    id: string;
    title: string;
    image_url: string | null;
    cuisine_type: string | null;
    dietary_tags: string[] | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
  };
}

export interface CookbookPurchase {
  id: string;
  user_id: string;
  cookbook_id: string;
  purchased_at: string;
  amount_paid: number;
}

export interface CookbookMealPhoto {
  id: string;
  cookbook_id: string;
  recipe_id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  is_featured: boolean;
  is_flagged: boolean;
  reported_at: string | null;
  created_at: string;
  profiles?: { username: string | null; avatar_url: string | null };
}
