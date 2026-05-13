-- Add 'dataset' as valid source and dataset_name tracking column
-- Required for Food.com + RecipeNLG bulk ingestion

alter table recipes drop constraint if exists recipes_source_check;

alter table recipes add constraint recipes_source_check
  check (source in ('spoonacular', 'ai', 'curated', 'user', 'social', 'dataset'));

alter table recipes add column if not exists dataset_name text;

create index if not exists recipes_dataset_name_idx on recipes(dataset_name);
