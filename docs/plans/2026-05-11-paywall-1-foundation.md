# Paywall Plan 1 of 5 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the entitlement-layer foundation (Supabase tables, TypeScript types, `entitlements.ts` library, API error boundary) so subsequent plans can wire Stripe, gate routes, and build UI on top of a stable, fully-tested base.

**Architecture:** Two new Supabase tables (`subscriptions`, `subscription_events`) with RLS limiting reads to row owner. A single library `src/lib/entitlements.ts` exposes `getEntitlement`, `requireTier`, `hasFeature`. Gate violations throw a typed `PaywallError` that an API error boundary serializes as HTTP 402. No Stripe, no RevenueCat, no UI in this plan — those land in Plans 2–5.

**Tech Stack:** Next.js 16 App Router · Supabase (Postgres + RLS) · TypeScript · Jest 30 + ts-jest + Testing Library · `@/` alias = `src/`

**Derived from:** [docs/specs/2026-05-11-stripe-paywall.md](../specs/2026-05-11-stripe-paywall.md) · [docs/strategy/2026-05-11-ecosystem-audit.md](../strategy/2026-05-11-ecosystem-audit.md)

---

## Scope of this plan

| In scope | Out of scope (later plans) |
|---|---|
| Supabase migration for `subscriptions` + `subscription_events` | Stripe / RevenueCat wiring (Plan 2) |
| RLS policies + service-role write boundary | Webhook handlers (Plan 2) |
| `getEntitlement`, `requireTier`, `hasFeature` lib | `requireTier` gates on real routes (Plan 3) |
| `PaywallError` + Next.js API error boundary | Paywall / upgrade modal UI (Plan 4) |
| Test fixture seeding helpers for the 8 entitlement states | Trial cron + grandfather migration (Plan 5) |
| Unit tests covering all entitlement combinations | Rollout flags + analytics (Plan 5) |

**Acceptance for this plan:** All Jest tests pass. The lib can be imported and used by future plans without modification. No production code yet calls `requireTier`. The migration has been applied to a local Supabase instance.

---

## File structure

**New files (this plan only):**
```
supabase/migrations/20260511000000_subscriptions.sql      [migration]
src/lib/entitlements.ts                                    [the lib]
src/lib/entitlements.test.ts                               [unit tests]
src/lib/paywall-error.ts                                   [typed error]
src/lib/paywall-error.test.ts                              [error tests]
src/lib/test-helpers/entitlement-fixtures.ts               [test-only seeding]
src/lib/api-error-boundary.ts                              [402 serializer]
src/lib/api-error-boundary.test.ts                         [boundary tests]
```

**Modified files (this plan only):**
```
src/lib/supabase/types.ts          (or wherever DB types live — add Subscription type)
```

No application route or component is modified. The lib is dormant until Plan 3 calls it.

---

## Task 1: Migration — create `subscriptions` and `subscription_events` tables

**Files:**
- Create: `supabase/migrations/20260511000000_subscriptions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260511000000_subscriptions.sql

create type subscription_tier as enum ('free','solo_plus','household');
create type subscription_status as enum ('active','trialing','past_due','canceled','grandfathered','free');

create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  rc_user_id           text not null,
  tier                 subscription_tier not null default 'free',
  status               subscription_status not null default 'free',
  current_period_end   timestamptz,
  trial_end_at         timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id   text,
  rc_entitlement       text,
  billing_period       text check (billing_period in ('monthly','annual')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_trial_end_idx on public.subscriptions (trial_end_at) where trial_end_at is not null;

create table public.subscription_events (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  event_type  text not null,
  source      text not null check (source in ('revenuecat','stripe','system')),
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index subscription_events_user_idx on public.subscription_events (user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

create policy "users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "users read own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);

-- Trigger to keep updated_at fresh on writes
create or replace function public.set_subscription_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_subscription_updated_at();
```

- [ ] **Step 2: Apply the migration locally**

Run: `npx supabase db reset` (if using local Supabase CLI) or `npx supabase migration up`
Expected: migration applies without error; `\d public.subscriptions` in psql shows the table.

- [ ] **Step 3: Verify RLS prevents writes from the authenticated role**

In Supabase Studio SQL editor (run as authenticated, not service_role):
```sql
insert into public.subscriptions (user_id, rc_user_id, tier, status)
values (auth.uid(), auth.uid()::text, 'household', 'active');
```
Expected: `new row violates row-level security policy` — confirming only service_role can write.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260511000000_subscriptions.sql
git commit -m "feat(billing): add subscriptions + subscription_events tables with RLS"
```

---

## Task 2: TypeScript types for Subscription

**Files:**
- Modify: `src/lib/supabase/types.ts` (or the generated types file — if types are generated via `supabase gen types typescript`, regenerate)

- [ ] **Step 1: Locate the database types file**

Run: `grep -r "export type Database" src/lib/supabase/ | head -3`
If types are generated, regenerate: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`
If hand-maintained, open the file and proceed to step 2.

- [ ] **Step 2: Add the Subscription types (hand-maintained path)**

Append to `src/lib/supabase/types.ts`:
```ts
export type SubscriptionTier = 'free' | 'solo_plus' | 'household';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'grandfathered'
  | 'free';

export type BillingPeriod = 'monthly' | 'annual';

export interface SubscriptionRow {
  user_id: string;
  rc_user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  trial_end_at: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  rc_entitlement: string | null;
  billing_period: BillingPeriod | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionEventRow {
  id: number;
  user_id: string | null;
  event_type: string;
  source: 'revenuecat' | 'stripe' | 'system';
  payload: Record<string, unknown>;
  created_at: string;
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors. (If errors surface in unrelated files, that's pre-existing — note but don't fix in this task.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat(billing): add SubscriptionTier/Status/Row types"
```

---

## Task 3: `PaywallError` — the typed error

**Files:**
- Create: `src/lib/paywall-error.ts`
- Create: `src/lib/paywall-error.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/paywall-error.test.ts`:
```ts
import { PaywallError } from './paywall-error';

describe('PaywallError', () => {
  it('captures required tier and current tier', () => {
    const err = new PaywallError({
      requiredTier: 'household',
      currentTier: 'free',
      feature: 'shared_pantry',
    });
    expect(err.name).toBe('PaywallError');
    expect(err.requiredTier).toBe('household');
    expect(err.currentTier).toBe('free');
    expect(err.feature).toBe('shared_pantry');
    expect(err.message).toMatch(/shared_pantry/);
  });

  it('is an instance of Error', () => {
    const err = new PaywallError({
      requiredTier: 'solo_plus',
      currentTier: 'free',
      feature: 'ai_recipe_gen',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PaywallError);
  });

  it('serializes to a 402-shaped JSON body', () => {
    const err = new PaywallError({
      requiredTier: 'household',
      currentTier: 'solo_plus',
      feature: 'dinner_parties',
    });
    expect(err.toJSON()).toEqual({
      error: 'payment_required',
      feature: 'dinner_parties',
      required_tier: 'household',
      current_tier: 'solo_plus',
      upgrade_url: '/pricing?tier=household&feature=dinner_parties',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/paywall-error.test.ts`
Expected: FAIL with "Cannot find module './paywall-error'"

- [ ] **Step 3: Write minimal implementation**

`src/lib/paywall-error.ts`:
```ts
import type { SubscriptionTier } from './supabase/types';

export type GatedFeature =
  | 'ai_recipe_gen'
  | 'ai_plan_gen'
  | 'recipe_import'
  | 'coach_chat'
  | 'shared_pantry'
  | 'household_members'
  | 'dinner_parties'
  | 'family_allergens'
  | 'unlimited_saves'
  | 'unlimited_plans';

export interface PaywallErrorInput {
  requiredTier: Exclude<SubscriptionTier, 'free'>;
  currentTier: SubscriptionTier;
  feature: GatedFeature;
}

export class PaywallError extends Error {
  readonly requiredTier: Exclude<SubscriptionTier, 'free'>;
  readonly currentTier: SubscriptionTier;
  readonly feature: GatedFeature;

  constructor(input: PaywallErrorInput) {
    super(`Feature "${input.feature}" requires ${input.requiredTier} tier (current: ${input.currentTier})`);
    this.name = 'PaywallError';
    this.requiredTier = input.requiredTier;
    this.currentTier = input.currentTier;
    this.feature = input.feature;
    Object.setPrototypeOf(this, PaywallError.prototype);
  }

  toJSON() {
    return {
      error: 'payment_required',
      feature: this.feature,
      required_tier: this.requiredTier,
      current_tier: this.currentTier,
      upgrade_url: `/pricing?tier=${this.requiredTier}&feature=${this.feature}`,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/paywall-error.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/paywall-error.ts src/lib/paywall-error.test.ts
git commit -m "feat(billing): add PaywallError with 402-shaped JSON serializer"
```

---

## Task 4: Test fixture seeding helpers

**Files:**
- Create: `src/lib/test-helpers/entitlement-fixtures.ts`

This helper is used by Task 5+ tests to seed `subscriptions` rows for each of the 8 entitlement states without re-writing INSERTs.

- [ ] **Step 1: Write the helper**

`src/lib/test-helpers/entitlement-fixtures.ts`:
```ts
import type { SubscriptionRow, SubscriptionTier, SubscriptionStatus, BillingPeriod } from '@/lib/supabase/types';

export type FixtureState =
  | 'free'
  | 'trialing'
  | 'solo_monthly'
  | 'solo_annual'
  | 'household_monthly'
  | 'household_annual'
  | 'grandfathered'
  | 'past_due'
  | 'canceled';

export function fixtureRow(userId: string, state: FixtureState): SubscriptionRow {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString();
  const inOneYear = new Date(now.getTime() + 365 * 86400000).toISOString();

  const base: SubscriptionRow = {
    user_id: userId,
    rc_user_id: userId,
    tier: 'free',
    status: 'free',
    current_period_end: null,
    trial_end_at: null,
    cancel_at_period_end: false,
    stripe_customer_id: null,
    rc_entitlement: null,
    billing_period: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  switch (state) {
    case 'free':
      return base;
    case 'trialing':
      return { ...base, tier: 'household', status: 'trialing', trial_end_at: in7Days };
    case 'solo_monthly':
      return {
        ...base,
        tier: 'solo_plus',
        status: 'active',
        current_period_end: in30Days,
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test_solo_m',
        rc_entitlement: 'solo_plus',
      };
    case 'solo_annual':
      return {
        ...base,
        tier: 'solo_plus',
        status: 'active',
        current_period_end: inOneYear,
        billing_period: 'annual',
        stripe_customer_id: 'cus_test_solo_a',
        rc_entitlement: 'solo_plus',
      };
    case 'household_monthly':
      return {
        ...base,
        tier: 'household',
        status: 'active',
        current_period_end: in30Days,
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test_hh_m',
        rc_entitlement: 'household',
      };
    case 'household_annual':
      return {
        ...base,
        tier: 'household',
        status: 'active',
        current_period_end: inOneYear,
        billing_period: 'annual',
        stripe_customer_id: 'cus_test_hh_a',
        rc_entitlement: 'household',
      };
    case 'grandfathered':
      return { ...base, tier: 'household', status: 'grandfathered', trial_end_at: in30Days };
    case 'past_due':
      return {
        ...base,
        tier: 'household',
        status: 'past_due',
        current_period_end: in30Days,
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test_pd',
      };
    case 'canceled':
      return {
        ...base,
        tier: 'household',
        status: 'canceled',
        current_period_end: in30Days,
        cancel_at_period_end: true,
        billing_period: 'monthly',
      };
  }
}

export const ALL_FIXTURE_STATES: FixtureState[] = [
  'free', 'trialing', 'solo_monthly', 'solo_annual',
  'household_monthly', 'household_annual', 'grandfathered',
  'past_due', 'canceled',
];
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/test-helpers/entitlement-fixtures.ts
git commit -m "test(billing): add fixture row builder for 9 entitlement states"
```

---

## Task 5: `entitlements.ts` — `getEntitlement`

**Files:**
- Create: `src/lib/entitlements.ts`
- Create: `src/lib/entitlements.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/entitlements.test.ts`:
```ts
import { getEntitlement } from './entitlements';
import { fixtureRow } from './test-helpers/entitlement-fixtures';
import type { SubscriptionRow } from './supabase/types';

// Mock the Supabase client at module boundary. The lib must accept an injected client
// so tests don't need a real Supabase instance.
function mockSupabaseWithRow(row: SubscriptionRow | null) {
  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
  } as any;
}

describe('getEntitlement', () => {
  it('returns the free default for a user with no subscription row', async () => {
    const supabase = mockSupabaseWithRow(null);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('free');
    expect(ent.status).toBe('free');
    expect(ent.trialEndAt).toBeNull();
    expect(ent.periodEnd).toBeNull();
  });

  it('returns the row values for an active solo subscriber', async () => {
    const row = fixtureRow('user_xyz', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('solo_plus');
    expect(ent.status).toBe('active');
    expect(ent.periodEnd).toBeInstanceOf(Date);
  });

  it('reports household tier for a trialing user', async () => {
    const row = fixtureRow('user_xyz', 'trialing');
    const supabase = mockSupabaseWithRow(row);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('household');
    expect(ent.status).toBe('trialing');
    expect(ent.trialEndAt).toBeInstanceOf(Date);
  });

  it('reports household tier for a grandfathered user', async () => {
    const row = fixtureRow('user_xyz', 'grandfathered');
    const supabase = mockSupabaseWithRow(row);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('household');
    expect(ent.status).toBe('grandfathered');
  });

  it('throws on a database error rather than silently returning free', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
          }),
        }),
      }),
    } as any;
    await expect(getEntitlement('user_xyz', supabase)).rejects.toThrow(/boom/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/entitlements.test.ts`
Expected: FAIL with "Cannot find module './entitlements'"

- [ ] **Step 3: Implement `getEntitlement`**

`src/lib/entitlements.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionRow, SubscriptionTier, SubscriptionStatus } from './supabase/types';

export interface Entitlement {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndAt: Date | null;
  periodEnd: Date | null;
}

const FREE_DEFAULT: Entitlement = {
  tier: 'free',
  status: 'free',
  trialEndAt: null,
  periodEnd: null,
};

export async function getEntitlement(
  userId: string,
  supabase: SupabaseClient,
): Promise<Entitlement> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`getEntitlement failed: ${error.message}`);
  }

  if (!data) {
    return FREE_DEFAULT;
  }

  const row = data as SubscriptionRow;
  return {
    tier: row.tier,
    status: row.status,
    trialEndAt: row.trial_end_at ? new Date(row.trial_end_at) : null,
    periodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/entitlements.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/entitlements.ts src/lib/entitlements.test.ts
git commit -m "feat(billing): add getEntitlement reading from Supabase subscriptions"
```

---

## Task 6: `entitlements.ts` — `requireTier` and `hasFeature`

**Files:**
- Modify: `src/lib/entitlements.ts`
- Modify: `src/lib/entitlements.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `src/lib/entitlements.test.ts`:
```ts
import { requireTier, hasFeature } from './entitlements';
import { PaywallError } from './paywall-error';

describe('requireTier', () => {
  it('returns void when current tier meets requirement', async () => {
    const row = fixtureRow('u', 'household_monthly');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });

  it('returns void when solo user accesses solo feature', async () => {
    const row = fixtureRow('u', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).resolves.toBeUndefined();
  });

  it('returns void when household user accesses solo feature', async () => {
    const row = fixtureRow('u', 'household_monthly');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).resolves.toBeUndefined();
  });

  it('treats trialing as household for require purposes', async () => {
    const row = fixtureRow('u', 'trialing');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });

  it('treats grandfathered as household for require purposes', async () => {
    const row = fixtureRow('u', 'grandfathered');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });

  it('throws PaywallError when free user hits solo gate', async () => {
    const supabase = mockSupabaseWithRow(null);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).rejects.toBeInstanceOf(PaywallError);
  });

  it('throws PaywallError when solo user hits household gate', async () => {
    const row = fixtureRow('u', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    try {
      await requireTier('u', 'household', 'dinner_parties', supabase);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(PaywallError);
      expect((e as PaywallError).currentTier).toBe('solo_plus');
      expect((e as PaywallError).requiredTier).toBe('household');
      expect((e as PaywallError).feature).toBe('dinner_parties');
    }
  });

  it('throws PaywallError when past_due household user hits gate', async () => {
    const row = fixtureRow('u', 'past_due');
    const supabase = mockSupabaseWithRow(row);
    // past_due means we should NOT grant entitlement
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).rejects.toBeInstanceOf(PaywallError);
  });

  it('throws PaywallError when canceled household user hits gate AFTER period end', async () => {
    const row = fixtureRow('u', 'canceled');
    // Force period end in the past to simulate truly expired
    row.current_period_end = new Date(Date.now() - 86400000).toISOString();
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).rejects.toBeInstanceOf(PaywallError);
  });

  it('GRANTS access for canceled user whose period has not yet ended', async () => {
    const row = fixtureRow('u', 'canceled');
    // Default fixture has period 30 days in future — access continues until then
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });
});

describe('hasFeature', () => {
  it('maps ai_recipe_gen to solo_plus tier', async () => {
    const row = fixtureRow('u', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    expect(await hasFeature('u', 'ai_recipe_gen', supabase)).toBe(true);
  });

  it('denies ai_recipe_gen for free user', async () => {
    const supabase = mockSupabaseWithRow(null);
    expect(await hasFeature('u', 'ai_recipe_gen', supabase)).toBe(false);
  });

  it('maps shared_pantry to household tier', async () => {
    const soloRow = fixtureRow('u', 'solo_monthly');
    const soloSupabase = mockSupabaseWithRow(soloRow);
    expect(await hasFeature('u', 'shared_pantry', soloSupabase)).toBe(false);

    const hhRow = fixtureRow('u', 'household_monthly');
    const hhSupabase = mockSupabaseWithRow(hhRow);
    expect(await hasFeature('u', 'shared_pantry', hhSupabase)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/lib/entitlements.test.ts`
Expected: FAIL — `requireTier is not a function` and `hasFeature is not a function`.

- [ ] **Step 3: Implement `requireTier` and `hasFeature`**

Append to `src/lib/entitlements.ts`:
```ts
import { PaywallError, type GatedFeature } from './paywall-error';

// Maps each gated feature to the minimum tier that unlocks it.
// This is the single source of truth for feature→tier mapping.
const FEATURE_TIER: Record<GatedFeature, Exclude<SubscriptionTier, 'free'>> = {
  ai_recipe_gen:     'solo_plus',
  ai_plan_gen:       'solo_plus',
  recipe_import:     'solo_plus',
  coach_chat:        'solo_plus',
  unlimited_saves:   'solo_plus',
  unlimited_plans:   'solo_plus',
  shared_pantry:     'household',
  household_members: 'household',
  dinner_parties:    'household',
  family_allergens:  'household',
};

// Determines whether an entitlement actually grants access right now.
// trialing + grandfathered are treated as their stored tier.
// canceled retains access until current_period_end.
// past_due is denied immediately (Stripe will retry; if it recovers, status flips back to active).
function isEntitlementActive(ent: Entitlement, now = new Date()): boolean {
  switch (ent.status) {
    case 'active':
    case 'trialing':
    case 'grandfathered':
      return true;
    case 'canceled':
      return ent.periodEnd !== null && ent.periodEnd > now;
    case 'past_due':
    case 'free':
      return false;
  }
}

// Tier ordering for comparison: free < solo_plus < household.
// Used so requireTier('solo_plus') accepts household users.
const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  solo_plus: 1,
  household: 2,
};

function meetsRequirement(ent: Entitlement, required: Exclude<SubscriptionTier, 'free'>): boolean {
  if (!isEntitlementActive(ent)) return false;
  return TIER_RANK[ent.tier] >= TIER_RANK[required];
}

export async function requireTier(
  userId: string,
  required: Exclude<SubscriptionTier, 'free'>,
  feature: GatedFeature,
  supabase: SupabaseClient,
): Promise<void> {
  const ent = await getEntitlement(userId, supabase);
  if (meetsRequirement(ent, required)) {
    return;
  }
  throw new PaywallError({
    requiredTier: required,
    currentTier: ent.tier,
    feature,
  });
}

export async function hasFeature(
  userId: string,
  feature: GatedFeature,
  supabase: SupabaseClient,
): Promise<boolean> {
  const required = FEATURE_TIER[feature];
  const ent = await getEntitlement(userId, supabase);
  return meetsRequirement(ent, required);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/lib/entitlements.test.ts`
Expected: all 16 tests passing (5 from Task 5 + 11 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/entitlements.ts src/lib/entitlements.test.ts
git commit -m "feat(billing): add requireTier + hasFeature with tier ranking and status semantics"
```

---

## Task 7: API error boundary — serialize `PaywallError` as HTTP 402

**Files:**
- Create: `src/lib/api-error-boundary.ts`
- Create: `src/lib/api-error-boundary.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/api-error-boundary.test.ts`:
```ts
import { withPaywallErrorBoundary } from './api-error-boundary';
import { PaywallError } from './paywall-error';
import { NextResponse } from 'next/server';

describe('withPaywallErrorBoundary', () => {
  it('returns the wrapped handler result on success', async () => {
    const handler = async () => NextResponse.json({ ok: true });
    const wrapped = withPaywallErrorBoundary(handler);
    const res = await wrapped(new Request('http://localhost/api/x'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('serializes PaywallError as 402 with the toJSON body', async () => {
    const handler = async () => {
      throw new PaywallError({
        requiredTier: 'household',
        currentTier: 'free',
        feature: 'shared_pantry',
      });
    };
    const wrapped = withPaywallErrorBoundary(handler);
    const res = await wrapped(new Request('http://localhost/api/x'));
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({
      error: 'payment_required',
      feature: 'shared_pantry',
      required_tier: 'household',
      current_tier: 'free',
      upgrade_url: '/pricing?tier=household&feature=shared_pantry',
    });
  });

  it('rethrows non-PaywallError errors unchanged so existing handlers still log them', async () => {
    const handler = async () => {
      throw new Error('something else');
    };
    const wrapped = withPaywallErrorBoundary(handler);
    await expect(wrapped(new Request('http://localhost/api/x'))).rejects.toThrow('something else');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/api-error-boundary.test.ts`
Expected: FAIL — `Cannot find module './api-error-boundary'`.

- [ ] **Step 3: Implement the boundary**

`src/lib/api-error-boundary.ts`:
```ts
import { NextResponse } from 'next/server';
import { PaywallError } from './paywall-error';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

// Wraps a Next.js App Router route handler so that throwing a PaywallError
// is turned into a 402 Payment Required response with the upgrade payload.
// Any other thrown error propagates unchanged.
export function withPaywallErrorBoundary(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof PaywallError) {
        return NextResponse.json(e.toJSON(), { status: 402 });
      }
      throw e;
    }
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/lib/api-error-boundary.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-error-boundary.ts src/lib/api-error-boundary.test.ts
git commit -m "feat(billing): add withPaywallErrorBoundary serializing PaywallError as HTTP 402"
```

---

## Task 8: Full-suite green check + plan handoff

**Files:** *(no code changes)*

- [ ] **Step 1: Run the full Jest suite**

Run: `npx jest`
Expected: all suites pass. Existing onboarding tests should not regress. Pre-existing failures (if any) noted but not fixed in this plan.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by this plan. (Pre-existing TS errors are out of scope.)

- [ ] **Step 3: Verify migration applied**

Run: `npx supabase db diff` (or equivalent)
Expected: no pending changes — the migration has been applied cleanly.

- [ ] **Step 4: Tag the foundation commit**

```bash
git tag -a paywall-foundation-v1 -m "Paywall foundation: tables, types, lib, error boundary"
```
(Push the tag once Plan 2 is ready to start.)

- [ ] **Step 5: Update task log**

Append to `C:\Users\lasse\Desktop\holyflex\logs\YYYY-MM-DD.md` (today's date):
```
## [HH:MM] WC paywall foundation (Plan 1 of 5)
- Migration applied: subscriptions + subscription_events tables with RLS
- Types added: SubscriptionTier, SubscriptionStatus, BillingPeriod, SubscriptionRow, SubscriptionEventRow
- New lib: entitlements.ts (getEntitlement, requireTier, hasFeature), paywall-error.ts (PaywallError), api-error-boundary.ts
- 16 unit tests passing
- No production routes call requireTier yet — that's Plan 3
```

---

## Self-review notes

- **Spec coverage:** This plan covers spec sections "Data model" and "Entitlement API surface" + the `PaywallError` portion of "Server flow". Sections "Stripe configuration", "RevenueCat configuration", "Trial state machine", "Grandfather migration", "UI surfaces", "Rollout staging", "Analytics" are deliberately out of scope (Plans 2–5).
- **Placeholder scan:** No TBDs, TODOs, or "implement appropriate error handling" — every step has concrete code.
- **Type consistency:** `SubscriptionTier`, `SubscriptionStatus`, `GatedFeature`, `Entitlement` types are defined in Task 2/3 and used consistently in Tasks 5–7. `requireTier` signature `(userId, required, feature, supabase)` is identical across Task 6 implementation and Task 7 test usage.
- **Status semantics decision documented in code:** `past_due` denies immediately; `canceled` grants until `current_period_end`. This is a meaningful business rule that Plans 2 and 5 must respect.

---

## Plan series

| Plan | Scope | Status |
|---|---|---|
| **1. Foundation** *(this plan)* | Tables, types, entitlements lib, error boundary | Ready to execute |
| 2. Stripe + RevenueCat wiring | SDKs, Price seed, checkout/portal API, webhook handlers | Not started |
| 3. API route gates | `requireTier` calls on 9 routes + saved/plan caps | Not started |
| 4. UI surfaces | `/pricing`, Paywall component, Upgrade modal, Trial banner, `/account/billing` | Not started |
| 5. Trial + Grandfather + Rollout | Cron, migration, env flags, canary, docs, legal | Not started |
