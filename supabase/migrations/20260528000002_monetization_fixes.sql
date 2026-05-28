-- Fix C1: explicitly block client-side inserts to ai_usage_log
-- Service role bypasses RLS and does not need an INSERT policy.
-- WITH CHECK (false) prevents any authenticated client from writing usage rows directly.
DROP POLICY IF EXISTS "Service role inserts ai_usage_log" ON ai_usage_log;
CREATE POLICY "No client inserts to ai_usage_log"
  ON ai_usage_log FOR INSERT
  WITH CHECK (false);

-- Fix I2: index for LemonSqueezy webhook lookups (sequential scan on every payment event otherwise)
CREATE INDEX IF NOT EXISTS idx_profiles_lemon_customer_id
  ON profiles (lemon_customer_id)
  WHERE lemon_customer_id IS NOT NULL;
