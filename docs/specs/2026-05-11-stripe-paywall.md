# Spec: Stripe + RevenueCat Paywall Enforcement

**Date:** 2026-05-11 · **Derives from:** [docs/strategy/2026-05-11-ecosystem-audit.md](../strategy/2026-05-11-ecosystem-audit.md) Phase 7 item #1 · **Status:** Approved for implementation planning

---

## Context

The strategic audit identified that What's Cooking currently has zero revenue capture: the `/premium` page filters recipes by a `dish_types` tag but nothing is gated, no payment provider exists in the codebase, and no subscription state exists in `auth.users` or `user_preferences`. Until this changes, every other roadmap item compounds against a free product and the business model is theoretical.

This spec defines the v1 monetization layer. Scope is deliberately tight: web subscriptions only, two paid tiers, one trial window, one grandfather migration. Native iOS/Android IAP wiring is out of scope but the entitlement architecture (RevenueCat as source-of-truth) is chosen so the v2 migration is straightforward.

## Goals

1. Capture revenue from new and existing users without burning trust
2. Establish a single entitlement source-of-truth that survives the future mobile-app migration
3. Enforce gates at every backend route that creates premium-value state (AI generation, imports, household features) — never trust the client
4. Ship without breaking any existing user's currently-active feature in the first 30 days

## Non-goals

- iOS / Android IAP wiring (entitlement layer chosen to support this, but no SKUs configured)
- Coupon system beyond the one-shot grandfather offer
- B2B / team billing
- Refund automation beyond Stripe Customer Portal manual flow
- Pause / gift / multi-currency UI (Stripe Tax handles EU VAT server-side; UI shows USD)
- Cookbook Marketplace creator revenue split (deferred to Q3 per audit)

## Decisions (locked)

| Decision | Value | Rationale |
|---|---|---|
| Tiers | Free · Solo Plus · Household | 3-tier defers Lifetime per founder choice |
| Solo Plus pricing | $4.99/mo or $39.99/yr (33% off annual) | Matches Samsung Food Food+ |
| Household pricing | $7.99/mo or $59.99/yr (38% off annual) | 80% below NYT Family ($30/mo), 6× AnyList ceiling — defensible middle |
| Free tier | Browse + 25 saved + 1 active plan + solo pantry + shopping list | Generous; gate the moats (AI, import, household) not the activation |
| Free trial | 7-day Household trial on signup, no card required | Maximizes top-of-funnel; day-5 prompt; day-7 downgrade |
| Grandfather | All existing users → free Household for 30 days, then downgrade | 1-month conversion runway, generous but not permanent |
| Payment provider | Stripe (web) + RevenueCat (entitlement abstraction) | Founder confirmed native mobile is on 6-month horizon; RC earns its keep |
| Tax | Stripe Tax enabled for EU VAT | Required for compliance; auto-handled |
| Refund policy | 7-day money-back guarantee on first paid period only | Standard SaaS; bounded liability |
| Mobile timeline | iOS/Android within ~6 months | Drives the RC decision |

## Architecture

### Entitlement source-of-truth

RevenueCat is the canonical source. Stripe is registered as an RC store. Supabase holds a mirrored `subscriptions` row updated by RC webhooks. The app reads only from Supabase at runtime — never queries RC directly. On dispute, RC's record wins and a backfill job re-syncs Supabase.

```
[Stripe Checkout] → [Stripe webhook] → [RevenueCat] → [RC webhook]
                                                            │
                                                            ▼
                              [POST /api/webhooks/revenuecat]
                                                            │
                                                            ▼
                                   [Supabase subscriptions table]
                                                            │
                                                            ▼
                                       [app reads via RLS-protected query]
```

Why two webhook handlers? Stripe → RC handles 95% of events natively. The Supabase mirror is kept fresh by RC's webhook. A *secondary* `/api/webhooks/stripe` handler catches the few events RC doesn't relay (Stripe Tax invoice details, dispute opened, refund processed) and writes them to `subscription_events` for audit.

### Data model

```sql
-- supabase/migrations/20260511000000_subscriptions.sql

create type subscription_tier as enum ('free','solo_plus','household');
create type subscription_status as enum ('active','trialing','past_due','canceled','grandfathered','free');

create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  rc_user_id           text not null,                    -- RC app_user_id, equals our user_id
  tier                 subscription_tier not null default 'free',
  status               subscription_status not null default 'free',
  current_period_end   timestamptz,
  trial_end_at         timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id   text,
  rc_entitlement       text,                              -- last-seen RC entitlement id
  billing_period       text check (billing_period in ('monthly','annual')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.subscription_events (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  event_type  text not null,                              -- 'trial_started', 'subscription_renewed', etc.
  source      text not null,                              -- 'revenuecat' | 'stripe' | 'system'
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index on public.subscription_events (user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

create policy "users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "users read own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);

-- Writes are service-role only (webhooks). No insert/update/delete policies for authenticated role.
```

### Gating matrix (the product surface)

| Feature | Free | Solo Plus | Household | Backend route to gate |
|---|:-:|:-:|:-:|---|
| Recipe browse / search / detail | ✅ | ✅ | ✅ | — |
| Saved recipes | 25 cap | ∞ | ∞ | enforce on save POST — "saved" = rows in `saved_recipes` (the `/saved` collection); user-authored entries in `my_recipes` don't count against the cap |
| Active meal plans | 1 cap | ∞ | ∞ | enforce on plan creation — "active" = `meal_plans.status IN ('planning','active')`; archived/completed plans don't count against the cap |
| Solo pantry | ✅ | ✅ | ✅ | — |
| Shopping list | ✅ | ✅ | ✅ | — |
| AI recipe generation | ❌ | ✅ | ✅ | `/api/recipes/generate` |
| AI meal-plan auto-gen | ❌ | ✅ | ✅ | `/api/plans/generate` |
| URL recipe import | ❌ | ✅ | ✅ | (route TBD; placeholder gate) |
| Photo recipe import | ❌ | ✅ | ✅ | `/api/recipes/extract-from-image` |
| Pantry photo extract | ❌ | ✅ | ✅ | `/api/pantry/extract-from-photo` |
| Video import (TikTok/IG/YT) | ❌ | ✅ | ✅ | (future; gate stub) |
| Conversational Coach | ❌ | ✅ | ✅ | (future; gate stub) |
| Household members > 1 | ❌ | ❌ | ✅ | `/api/family/members` insert |
| Shared real-time pantry | ❌ | ❌ | ✅ | `/api/shared-pantry/*` |
| Dinner parties / events | ❌ | ❌ | ✅ | `/api/dinner-parties/*` |
| Family allergens + milestones | ❌ | ❌ | ✅ | `/api/family/allergens`, `/api/family/adapt-recipe` |

**Enforcement principle:** every gate runs server-side. The client `<Paywall>` component is for UX (showing upgrade modals) — never for security. A determined user hitting `/api/recipes/generate` directly must still get a 402 Payment Required.

### File layout

**New files:**
```
supabase/migrations/20260511000000_subscriptions.sql
supabase/migrations/20260511000001_grandfather_users.sql

src/lib/entitlements.ts                    # getEntitlement, requireTier, hasFeature
src/lib/stripe.ts                          # Stripe client + Price ID constants
src/lib/revenuecat.ts                      # RC server SDK wrapper

src/components/paywall.tsx                 # wraps premium CTAs
src/components/upgrade-modal.tsx           # tier comparison modal
src/components/trial-banner.tsx            # day-5 + day-7 banners

src/app/(app)/pricing/page.tsx             # public pricing + checkout entry
src/app/(app)/account/billing/page.tsx     # current sub + portal link

src/app/api/billing/checkout/route.ts      # POST → returns Stripe Checkout URL
src/app/api/billing/portal/route.ts        # POST → returns Stripe Customer Portal URL
src/app/api/webhooks/revenuecat/route.ts   # POST: HMAC verify + upsert subscriptions
src/app/api/webhooks/stripe/route.ts       # POST: secondary handler for non-relayed events

src/app/api/cron/trial-expirations/route.ts # daily job: downgrade expired trials/grandfathers

scripts/seed-stripe-products.ts            # one-off: create the 4 Stripe Prices
```

**Modified files (add `requireTier` gates):**
- `src/app/api/recipes/generate/route.ts` → `requireTier('solo_plus')`
- `src/app/api/plans/generate/route.ts` → `requireTier('solo_plus')`
- `src/app/api/recipes/extract-from-image/route.ts` → `requireTier('solo_plus')`
- `src/app/api/pantry/extract-from-photo/route.ts` → `requireTier('solo_plus')`
- `src/app/api/dinner-parties/route.ts` (all methods) → `requireTier('household')`
- `src/app/api/family/allergens/route.ts` → `requireTier('household')`
- `src/app/api/family/adapt-recipe/route.ts` → `requireTier('household')`
- `src/app/api/family/members/route.ts` → enforce `members.length < 1 OR tier=household` on POST
- `src/app/api/shared-pantry/*` → `requireTier('household')`
- `src/app/(app)/premium/page.tsx` → redirect to `/pricing`
- `src/app/layout.tsx` → mount `<TrialBanner />` for trialing/grandfathered users
- `src/middleware.ts` → hydrate entitlement into request context

### Entitlement API surface (`src/lib/entitlements.ts`)

```ts
export type Entitlement = {
  tier: 'free' | 'solo_plus' | 'household';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'grandfathered' | 'free';
  trialEndAt: Date | null;
  periodEnd: Date | null;
  canAccess: (feature: Feature) => boolean;
};

export type Feature =
  | 'ai_recipe_gen' | 'ai_plan_gen' | 'recipe_import' | 'coach_chat'
  | 'shared_pantry' | 'household_members' | 'dinner_parties' | 'family_allergens'
  | 'unlimited_saves' | 'unlimited_plans';

export async function getEntitlement(userId: string): Promise<Entitlement>;
export async function requireTier(tier: 'solo_plus' | 'household'): Promise<void>;
export async function hasFeature(userId: string, feature: Feature): Promise<boolean>;
```

`requireTier` is the canonical guard in route handlers — it throws a typed `PaywallError` that the API error boundary serializes as HTTP 402 with `{ tier_required, current_tier, upgrade_url }`.

Trial users and grandfathered users have `tier='household'` with `status='trialing'` or `status='grandfathered'`. The `canAccess` check treats them as Household for feature purposes; the status field is for UI badges and downgrade scheduling.

### Trial state machine

```
[signup]
   │
   ▼
INSERT subscriptions (tier='household', status='trialing', trial_end_at=now()+7d)
   │
   ▼
[day 0–6]  user has full Household access; `<TrialBanner>` shows days remaining
   │
   ▼  (day 5 marker)
   │  in-app banner: "Trial ends in 2 days — keep your household"
   │  email: same copy + checkout link
   │
   ▼  (day 7, daily cron)
   │  UPDATE subscriptions SET tier='free', status='free', trial_end_at=NULL
   │  in-app banner: "Trial ended — upgrade to keep your members"
   │  feature gates immediately re-engage
```

The cron job runs once daily at 03:00 UTC via Vercel Cron (`src/app/api/cron/trial-expirations/route.ts`), processes all rows where `trial_end_at < now() AND status IN ('trialing','grandfathered')`, downgrades them in a single transaction, and writes a `trial_expired_downgraded` or `grandfather_expired_downgraded` event.

### Grandfather migration

```sql
-- supabase/migrations/20260511000001_grandfather_users.sql
insert into public.subscriptions (user_id, rc_user_id, tier, status, trial_end_at)
select id, id::text, 'household', 'grandfathered', now() + interval '30 days'
from auth.users
where created_at < (select coalesce(max(created_at), now()) from auth.users)  -- run BEFORE going live to lock the cutoff
on conflict (user_id) do nothing;

insert into public.subscription_events (user_id, event_type, source, payload)
select user_id, 'grandfathered', 'system', jsonb_build_object('window_days', 30)
from public.subscriptions where status = 'grandfathered';
```

Differentiator vs trial: grandfathered users get a one-time email + persistent in-app banner offering **GRANDFATHER20** — a single-use Stripe coupon for 20% off the first year on either tier. The coupon is created via `scripts/seed-stripe-products.ts`.

### Stripe configuration

```ts
// Created by scripts/seed-stripe-products.ts
const products = [
  { id: 'prod_solo_plus',   name: "What's Cooking — Solo Plus" },
  { id: 'prod_household',   name: "What's Cooking — Household" },
];
const prices = [
  { lookup: 'solo_plus_monthly',  product: 'prod_solo_plus', unit_amount:  499, interval: 'month' },
  { lookup: 'solo_plus_annual',   product: 'prod_solo_plus', unit_amount: 3999, interval: 'year'  },
  { lookup: 'household_monthly',  product: 'prod_household', unit_amount:  799, interval: 'month' },
  { lookup: 'household_annual',   product: 'prod_household', unit_amount: 5999, interval: 'year'  },
];
const coupons = [
  { id: 'GRANDFATHER20', percent_off: 20, duration: 'once', max_redemptions: /* set at deploy time = SELECT count(*) FROM auth.users WHERE created_at < launch_cutoff */ 1000 },
];
```

Stripe settings:
- **Tax:** Stripe Tax enabled, customer location collected at Checkout
- **Customer Portal:** allow cancel, switch plan, update payment method, view invoices
- **Webhook events:** `customer.subscription.*`, `invoice.payment_*`, `customer.created`, `charge.refunded`
- **Test mode:** keys behind `STRIPE_MODE=test` env var; fixture users wired to test prices

### RevenueCat configuration

- **Entitlements:** `solo_plus`, `household`
- **Offerings:**
  - `default` offering exposes monthly + annual variants of each tier
- **Products:** mapped 1:1 to the four Stripe Prices via lookup keys
- **App User ID:** equals our Supabase `auth.users.id`
- **Webhook URL:** `https://whatscooking.app/api/webhooks/revenuecat`
- **Shared secret:** stored in Vercel as `REVENUECAT_WEBHOOK_SECRET`; verify HMAC SHA256 on every request

### UI surfaces

**`/pricing`** — public, indexable. Hero ("One app for everyone who eats at this address"), three columns (Free / Solo Plus / Household), monthly/annual toggle, "Start 7-day Household trial" CTA, FAQ, comparison table. Embeds `<UpgradeModal>` on CTA click.

**`<UpgradeModal>`** — invoked when a free user hits a paywall. Reads the *required tier* from the `PaywallError`, highlights that tier, lets user start trial or pay immediately. Always shows annual option toggleable.

**`<TrialBanner>`** — persistent at top of app shell when `status='trialing'` or `status='grandfathered'`. Variants:
- Trial day 0–4: `"You're on a 7-day Household trial — [N] days left"`
- Trial day 5+: `"Trial ends in [N] days — Keep your household"` (button: Upgrade)
- Grandfather: `"You have 30 days of free Household — use GRANDFATHER20 for 20% off your first year"`
- Past due: `"Payment failed — update your card to keep your household"`

**`/account/billing`** — current tier, next billing date, "Manage in Stripe" → Customer Portal redirect. Shows past invoices via Stripe Customer Portal (no PII storage in our DB).

### Rollout staging

1. **Phase A — Infrastructure dark launch (week 1)**
   - Ship migration, entitlements lib, webhooks, billing API routes, UI components
   - `PAYWALL_ENFORCED=false` env flag → `requireTier` is a no-op
   - Stripe + RC in test mode only
   - QA against 8 fixture users (free, trial day 0, trial day 6, solo monthly, solo annual, household monthly, household annual, grandfathered)

2. **Phase B — Internal preview (week 2)**
   - Flip `STRIPE_MODE=live`
   - Enforce for users with email matching `@whatscooking.app` only
   - Make real (refunded) test purchases on each SKU
   - Verify webhook flow, trial expiration cron, grandfather migration on staging clone

3. **Phase C — 10% canary (week 3)**
   - Enforce for 10% of free-tier users by `user_id` hash
   - Monitor: 402 error rate, paywall→upgrade conversion, support volume
   - Hold 48h before ramping

4. **Phase D — General availability (week 4)**
   - Enforce for 100%
   - Run grandfather migration in a transaction (idempotent — `on conflict do nothing`)
   - Send announcement email batch (single batch via Resend/Postmark, separate task)
   - Activate `GRANDFATHER20` coupon

### Testing

**Unit:**
- `entitlements.ts` — 12 cases (each tier × status × feature combination)
- Stripe Price ID lookup → tier resolution
- RC webhook payload → Supabase upsert (idempotency)

**Integration (Supabase local + Stripe test mode):**
- New signup → trial row written → day-7 cron downgrades → 402 on `/api/recipes/generate`
- Purchase Solo Plus monthly → webhook → `tier='solo_plus' status='active'` → 200 on `/api/recipes/generate`, 402 on `/api/shared-pantry/create`
- Upgrade Solo → Household via portal → webhook updates `tier='household'` → 200 on `/api/dinner-parties`
- Cancel at period end → `cancel_at_period_end=true` → access continues until `current_period_end` → cron downgrades
- Refund within 7 days → webhook → immediate downgrade + event logged
- Grandfather migration on a 100-user fixture DB → 100 rows inserted; second run inserts 0

**E2E (Playwright):**
- Free user hits `<Paywall>` on AI gen → modal → "Start trial" → trial active → AI gen succeeds
- Trial user on day 7 → cron runs → next request returns 402 → upgrade modal

### Analytics events

Written to `subscription_events` and forwarded to product analytics (PostHog/whatever ships):
- `trial_started`, `trial_day5_prompt_shown`, `trial_converted`, `trial_expired_downgraded`
- `subscription_created`, `subscription_canceled`, `subscription_renewed`, `subscription_upgraded`, `subscription_past_due`
- `paywall_hit` with `{ feature, current_tier, required_tier }`
- `upgrade_modal_shown`, `upgrade_modal_dismissed`, `upgrade_checkout_started`, `upgrade_completed`
- `grandfather_window_started`, `grandfather_coupon_redeemed`, `grandfather_expired_downgraded`

Dashboards: MRR (live), trial→paid conversion %, grandfather→paid conversion %, feature-level paywall→upgrade funnel, monthly churn %.

### Legal & compliance

- **Stripe Tax:** auto-enabled; collects customer location at Checkout
- **`/datenschutz`:** add Stripe + RevenueCat as data processors with their privacy URLs
- **`/impressum`:** add subscription provider statement (Stripe Payments Europe Ltd as required for EU)
- **`/terms` (new):** subscription terms, billing cadence, 7-day money-back guarantee on first paid period only, cancellation any time effective end-of-period
- **GDPR data deletion:** existing user-deletion flow must cancel active Stripe subscription via API and emit RC delete event
- **Email compliance:** trial-ending + grandfather emails are transactional (not marketing), no opt-in needed

### Environment variables (Vercel)

```
STRIPE_MODE=test|live
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

REVENUECAT_SECRET_KEY=
REVENUECAT_WEBHOOK_SECRET=
NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY=

PAYWALL_ENFORCED=false|true
TRIAL_LENGTH_DAYS=7
GRANDFATHER_WINDOW_DAYS=30
```

## Open questions for implementation planning

1. **Email provider:** WC doesn't currently ship transactional email. Resend ($20/mo) vs Postmark vs Supabase's built-in `auth.email`. Recommend Resend — best DX for one-off transactional flows.
2. **Cron host:** Vercel Cron is free and works on Hobby plan but limited frequency. If WC isn't on Vercel Pro, day-7 downgrade may need to be triggered by a Supabase Edge Function `pg_cron` job instead.
3. **PostHog or other product analytics:** the spec assumes one exists. If not, ship subscription_events only and add the analytics layer separately.

## Success criteria (acceptance)

- [ ] All 9 backend routes in the gating matrix return 402 for free-tier users in test mode
- [ ] Fixture user fixtures exist for all 8 entitlement states and pass integration tests
- [ ] Webhook handler is idempotent (re-sending the same RC event produces no state change)
- [ ] Trial expiration cron runs nightly and downgrades exactly the expected users in test fixtures
- [ ] Grandfather migration is idempotent (running twice inserts nothing the second run)
- [ ] `/pricing` page passes Lighthouse SEO ≥95 and ships schema.org/Product markup
- [ ] `<Paywall>` component is used at every place a free user could attempt a gated action (audited by grep of API routes + manual UI walk)
- [ ] Stripe Tax is collecting VAT correctly on a EU test purchase
- [ ] No regression in existing user flows when `PAYWALL_ENFORCED=false`
- [ ] First real EU customer's Stripe Tax invoice passes manual review
- [ ] Documentation: `docs/billing.md` (architecture overview), `docs/billing-runbook.md` (refund / dispute / dunning procedures)

## Out-of-scope reminder

This spec ships v1 monetization. The following are explicit follow-ups, not omissions:
- iOS / Android IAP + RC mobile SDK (separate spec when mobile app exists)
- Cookbook Marketplace creator revenue split (Q3 per audit)
- Lifetime tier ($99 one-time) — deferred per founder choice
- B2B / team billing
- Dunning email sequences beyond Stripe's built-in
- Gift / pause / multi-currency UI

---

*This spec was produced through the brainstorming flow. Next step: invoke `writing-plans` to produce an executable implementation plan with concrete tasks, sequencing, and test checkpoints.*
