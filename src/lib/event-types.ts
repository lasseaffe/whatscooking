// src/lib/event-types.ts

export type EventMenuItem = {
  id: string;
  party_id: string;
  name: string;
  description: string | null;
  course: 'appetizer' | 'main' | 'dessert' | 'drink' | 'side';
  recipe_id: string | null;
  sort_order: number;
  created_at: string;
};

export type EventTimelineItem = {
  id: string;
  party_id: string;
  time_label: string;
  activity: string;
  sort_order: number;
};

export type ShoppingCategory = 'ingredient' | 'beverage' | 'equipment' | 'other';

export type EventShoppingItem = {
  id: string;
  party_id: string;
  name: string;
  quantity: string | null;
  category: ShoppingCategory;
  assigned_to: string | null;
  checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  created_by: string;
  created_at: string;
};

export type LocationType = 'private' | 'restaurant' | 'public' | 'other';

export type EventLocationOption = {
  id: string;
  party_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  location_type: LocationType | null;
  is_winner: boolean;
  vote_count?: number;
  user_voted?: boolean;
};

export type EventPlaylistTrack = {
  id: string;
  party_id: string;
  submitted_by: string;
  spotify_uri: string;
  track_name: string | null;
  artist_name: string | null;
  album_art_url: string | null;
  added_to_spotify: boolean;
  created_at: string;
  submitter_name?: string;
};

export type GuestRole = 'editor' | 'viewer';

export type DinnerPartyGuest = {
  id: string;
  party_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  rsvp: 'invited' | 'accepted' | 'declined' | 'maybe';
  role: GuestRole;
  invited_at: string;
  responded_at: string | null;
};

export type EventDetail = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  location: string | null;
  theme: string | null;
  max_guests: number | null;
  status: string;
  cover_color: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  spotify_playlist_id: string | null;
  invite_token: string | null;
  created_at: string;
  updated_at: string;
};

export type FullEventData = {
  party: EventDetail;
  guests: DinnerPartyGuest[];
  menuItems: EventMenuItem[];
  timelineItems: EventTimelineItem[];
  shoppingItems: EventShoppingItem[];
  locationOptions: EventLocationOption[];
  tracks: EventPlaylistTrack[];
  userRole: 'host' | 'accepted' | 'invited' | 'maybe' | 'none';
  guestRole: GuestRole | null;
};
