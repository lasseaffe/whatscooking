-- Challenge Mode: structured rules + objectives + smart timer support
-- Adds rich, on-screen content for the live Challenge Run experience.

alter table challenge_definitions
  add column if not exists rules          text[]  not null default '{}',
  add column if not exists objective      text,
  add column if not exists target_seconds integer,
  add column if not exists strategy_tip   text;

-- Record how long each completed run took (enables "fastest time" + history detail)
alter table challenge_completions
  add column if not exists elapsed_seconds integer;
