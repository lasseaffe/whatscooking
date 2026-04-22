-- Verify premium flags
SELECT
  count(*) FILTER (WHERE is_premium = true AND is_hack = false) AS premium_only,
  count(*) FILTER (WHERE is_premium = true AND is_hack = true)  AS hacks,
  count(*) FILTER (WHERE is_premium IS NULL)                    AS null_premium,
  count(*) FILTER (WHERE is_premium = false)                    AS not_premium
FROM recipes;
