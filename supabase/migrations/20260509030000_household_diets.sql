alter table user_preferences
  add column if not exists household_dietary_tags text[] default '{}';
