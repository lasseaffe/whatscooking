# Manual To-Do — What's Cooking

> This file tracks everything that requires YOUR manual action to go live.
> Claude cannot do these for you — they require dashboard access, secret keys, or external service accounts.
>
> **Reminder:** Whenever you ask Claude about any of these features, say "check manual_to_do.md" or Claude will remind you proactively.

---

## 1. Collaborative Kitchen / Shopping Groups

These steps are required for the kitchen groups and shared shopping list to function.

### 1a. Apply the Supabase migration

```bash
supabase db push
```

Or manually: Supabase Dashboard → SQL Editor → paste contents of:
`supabase/migrations/20260427_collaborative_kitchen.sql`

**Creates:** kitchen_groups, kitchen_group_members, personal_shopping_items, group_shopping_items, kitchen_group_invites, push_subscriptions

---

### 1b. Enable Realtime on group_shopping_items

Supabase Dashboard → Database → Replication → toggle **group_shopping_items** ON

Or via CLI:
```sql
alter publication supabase_realtime add table group_shopping_items;
```

**Why:** Without this, members won't see each other's items live — the Realtime subscription will silently receive nothing.

---

### 1c. Generate VAPID keys for Web Push

```bash
npx web-push generate-vapid-keys
```

Copy the output and add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:your@email.com
```

Also add `VAPID_PRIVATE_KEY` and `VAPID_PUBLIC_KEY` (without NEXT_PUBLIC_ prefix) to your Supabase Edge Function environment:
Supabase Dashboard → Edge Functions → notify-group-shopping → Secrets

---

### 1d. Deploy the notify-group-shopping Edge Function

```bash
supabase functions deploy notify-group-shopping
```

---

### 1e. Wire the Database Webhook

Supabase Dashboard → Database → Webhooks → Create new webhook:

| Field | Value |
|-------|-------|
| Table | group_shopping_items |
| Event | INSERT |
| Type | Supabase Edge Function |
| Function | notify-group-shopping |

---

## 2. Recipe Ingestion Pipeline (weekly scraper)

### 2a. Create local .env for the ingestion scripts

Create `scripts/ingestion/.env` (do NOT commit):
```
SUPABASE_URL=<from Supabase Dashboard → Project Settings → API>
SUPABASE_SERVICE_KEY=<service_role secret key>
GOOGLE_CSE_KEY=<optional — Google Custom Search API key>
GOOGLE_CSE_ID=<optional — Google Custom Search Engine ID>
```

Service role key location: Supabase Dashboard → Project Settings → API → `service_role`

---

### 2b. Add GitHub Secrets for the weekly cron

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret name | Value |
|-------------|-------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `GOOGLE_CSE_KEY` | (optional) Google CSE API key |
| `GOOGLE_CSE_ID` | (optional) Google CSE ID |

---

### 2c. Create the recipe-ingestion label in GitHub

```bash
gh label create "recipe-ingestion" --color "E8A87C" --description "Weekly recipe scrape reminders"
```

**Why:** The weekly GitHub Actions workflow opens an issue with this label after each scrape run.

---

### 2d. Test the scraper manually (first run)

GitHub repo → Actions tab → "Weekly Recipe Scrape" → Run workflow

Then: Supabase Dashboard → Table Editor → recipes → filter by `source = 'scraped'` to confirm rows were inserted.

---

## 3. Image Monitor (daily Vercel Cron)

### 3a. Add MONITOR_SECRET to .env.local

```
MONITOR_SECRET=<any random long string, e.g. from openssl rand -hex 32>
```

---

### 3b. Add environment variables to Vercel

Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `MONITOR_SECRET` | Same value as above |
| `SUPABASE_SERVICE_KEY` | Service role key |

---

### 3c. Confirm vercel.json has the daily cron

Check `vercel.json` in the project root includes:
```json
{
  "crons": [{
    "path": "/api/admin/monitor-images",
    "schedule": "0 3 * * *"
  }]
}
```

If the file doesn't exist or is missing this entry, Claude can add it — just ask.

---

## 4. One-time Data Seeding

### 4a. Seed fusion recipes (if not already done)

```bash
npx ts-node scripts/seed-fusion-recipes.ts
```

Only needs to run once. Check Supabase recipes table before running to avoid duplicates.

---

## Status tracker

Update this as you complete each item:

- [ ] 1a — Supabase migration applied
- [ ] 1b — Realtime enabled on group_shopping_items
- [ ] 1c — VAPID keys generated and in .env.local + Edge Function secrets
- [ ] 1d — notify-group-shopping Edge Function deployed
- [ ] 1e — Database Webhook wired
- [ ] 2a — scripts/ingestion/.env created
- [ ] 2b — GitHub Secrets added
- [ ] 2c — recipe-ingestion label created in GitHub
- [ ] 2d — Weekly scraper tested (first run)
- [ ] 3a — MONITOR_SECRET in .env.local
- [ ] 3b — Vercel env vars set
- [ ] 3c — vercel.json cron confirmed
- [ ] 4a — Fusion recipes seeded
