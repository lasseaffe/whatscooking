-- Unique index on source_url to enable idempotent dataset upserts.
-- Partial index (WHERE source_url IS NOT NULL) so NULLs don't conflict.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_source_url_unique
  ON recipes (source_url)
  WHERE source_url IS NOT NULL;
