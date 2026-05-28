# LemonSqueezy Setup — Manual Steps

Complete these steps before testing the billing flow end-to-end.
All code is already wired — this is just dashboard configuration.

## Step 1: Create a LemonSqueezy account and store

1. Sign up at https://lemonsqueezy.com
2. Create a store called **"What's Cooking"**
3. Note the Store ID (visible in Settings → Store or from the URL)

## Step 2: Create the subscription product

1. Go to Products → New Product
2. Name: **"Pro Cook"**
3. Add Variant 1: **Monthly** — $5.00/month recurring
4. Add Variant 2: **Annual** — $45.00/year recurring
5. Note both **Variant IDs** from the variants list

## Step 3: Configure the webhook endpoint

1. Go to Settings → Webhooks → Add endpoint
2. **URL:** `https://your-domain.com/api/billing/webhook`
   - For local testing: use `npx ngrok http 3002` and use the ngrok URL temporarily
3. **Events to subscribe:**
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_resumed`
4. Copy the **Signing Secret** shown after creation

## Step 4: Get your API key

1. Settings → API → Create API Key
2. Name it "What's Cooking Production"
3. Copy the key (shown only once)

## Step 5: Fill in .env.local

Add these values to `C:\Users\lasse\Desktop\whatscooking\.env.local`:

```
LS_API_KEY=your_api_key_here
LS_STORE_ID=your_store_id_here
LS_MONTHLY_VARIANT_ID=your_monthly_variant_id_here
LS_ANNUAL_VARIANT_ID=your_annual_variant_id_here
LS_WEBHOOK_SECRET=your_webhook_signing_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3002
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

Get `SUPABASE_SERVICE_ROLE_KEY` from: Supabase dashboard → Project Settings → API → service_role key.

## Step 6: Test the full billing flow locally

```bash
# Terminal 1: run What's Cooking
cd C:/Users/lasse/Desktop/whatscooking
npm run dev

# Terminal 2: expose webhook endpoint to LemonSqueezy
npx ngrok http 3002
# Copy the ngrok HTTPS URL and update the webhook endpoint in LS dashboard
```

1. Go to `http://localhost:3002/settings`
2. Click "$45/yr" or "$5/mo"
3. Should redirect to LemonSqueezy hosted checkout
4. Use test card: `4242 4242 4242 4242` (any future expiry, any CVV)
5. After checkout, confirm `profiles.tier = 'pro'` in Supabase dashboard
6. Return to settings — should show "You're now a Pro Cook"
7. Try importing a second recipe — should work without hitting the limit

## Step 7: Test the referral flow

1. Copy your invite link from Settings → Plan & Billing
2. Open in an incognito window: `http://localhost:3002/signup?ref=YOUR_CODE`
3. Complete signup
4. Subscribe with test card
5. Check Supabase: new user's `profiles.referred_by` should match your user ID

## Verification Checklist

- [ ] `profiles.tier` updates to `pro` after checkout
- [ ] AI import limit removed for pro users (no 402 on extract)
- [ ] Settings shows "Pro Cook — unlimited AI imports" in UsageMeter
- [ ] Subscription cancellation: `profiles.tier` stays `pro` until `tier_expires_at`
- [ ] Subscription expiry: `profiles.tier` reverts to `free`
- [ ] Second plan creation blocked for free users (402 → FeatureGateBanner)
- [ ] Referral signup sets `profiles.referred_by` correctly
