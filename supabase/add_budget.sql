-- Add weekly_budget to user_preferences
-- Run this in the Supabase SQL editor

alter table user_preferences
  add column if not exists weekly_budget decimal(8,2) default null;

comment on column user_preferences.weekly_budget is
  'User''s weekly grocery budget in USD. Null means no budget set.';
