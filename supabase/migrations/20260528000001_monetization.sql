-- supabase/migrations/20260528000000_monetization.sql

-- AI usage tracking for weekly rate limiting
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature     text NOT NULL CHECK (feature IN ('recipe_extract', 'meal_weave', 'batch_import')),
  used_at     timestamptz NOT NULL DEFAULT now(),
  metadata    jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_feature_time
  ON ai_usage_log (user_id, feature, used_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (for the settings meter)
CREATE POLICY "Users read own ai_usage_log"
  ON ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- Block client-side inserts; service role bypasses RLS entirely and needs no policy.
-- WITH CHECK (false) documents intent: no authenticated client may write usage rows directly.
CREATE POLICY "No client inserts to ai_usage_log"
  ON ai_usage_log FOR INSERT
  WITH CHECK (false);

-- Tier and billing fields on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS tier_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS lemon_customer_id text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE
    DEFAULT substr(md5(random()::text), 1, 8);

-- Index for LemonSqueezy webhook lookups (profile by customer id)
CREATE INDEX IF NOT EXISTS idx_profiles_lemon_customer_id
  ON profiles (lemon_customer_id)
  WHERE lemon_customer_id IS NOT NULL;
