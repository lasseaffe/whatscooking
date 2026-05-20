# Challenge Mode — Design Spec
**Date:** 2026-05-20  
**Project:** What's Cooking  
**Route:** `/challenge`

---

## Overview

Challenge Mode is a standalone fun gimmick page where users accept cooking rulesets — handicaps, appliance restrictions, speedruns, dares — independent of any specific recipe. Completing challenges earns badges, builds streaks, and appears in a social feed. It lives at `/challenge` as a first-class top-level page in the app nav.

---

## Architecture

### Route
- **Path:** `/challenge`  
- **Type:** Next.js App Router page under `src/app/(app)/challenge/`
- **Rendering:** Server component (initial data) + client components (carousel, timer, tabs, social interactions)

### Data Model (Supabase)

**`challenge_definitions`** — static seed table (admin-managed, not user-created)
```
id            uuid PK
title         text
description   text
emoji         text
category      text  -- 'handicap' | 'appliance' | 'speedrun' | 'wildcard' | 'dare'
difficulty    text  -- 'easy' | 'medium' | 'hard' | 'insane'
requires_proof boolean
is_daily      boolean
is_active     boolean
created_at    timestamptz
```

**`challenge_completions`** — user completions
```
id                uuid PK
user_id           uuid FK → auth.users
challenge_id      uuid FK → challenge_definitions
completed_at      timestamptz
proof_url         text | null    -- Supabase Storage path
note              text | null    -- optional user comment
```

**Note:** No follow system exists. "Friends" in the social tab = household members from the `household_members` table. Leaderboard shows all household members for the current user.

**`challenge_reactions`** — claps on social feed
```
id             uuid PK
completion_id  uuid FK → challenge_completions
user_id        uuid FK → auth.users
created_at     timestamptz
```

### RLS
- `challenge_definitions`: public read, admin-only write
- `challenge_completions`: users read own + friends', insert own only
- `challenge_reactions`: authenticated read/insert, delete own

---

## Page Structure

### Layout: Tabbed Hub

```
/challenge
├── Page header ("Challenge Mode" + streak badge)
├── Hero: Spin the Wheel (always visible)
├── Active Challenge Banner (conditional — only when one is in progress)
├── Tabs: [Browse] [My Progress] [Social]
│
├── Browse Tab
│   ├── Category section: 🦾 Handicap Mode
│   │   └── 3-card auto-carousel (5s interval, dot indicators)
│   ├── Category section: 🔌 Appliance Chaos
│   │   └── 3-card auto-carousel
│   ├── Category section: ⚡ Speedrun
│   │   └── 3-card auto-carousel
│   ├── Category section: 🎰 Wildcard
│   │   └── 3-card auto-carousel
│   └── Category section: 😈 Dare Challenges
│       └── 3-card auto-carousel
│
├── My Progress Tab
│   ├── Stats bar: streak · completed count · categories · leaderboard rank
│   ├── Badge wall: earned (glowing saffron border) + locked (greyed, grayscale)
│   └── History log: list of past completions with proof indicator
│
└── Social Tab
    ├── Leaderboard: top 10 this week, "You" row highlighted in saffron
    └── Friends feed: completion cards with proof photo, note, clap count, Challenge them CTA
```

---

## Component Breakdown

### `ChallengeHeroSpinner` (client)
- Two buttons: "🎲 Spin the Wheel" (random challenge from any category) + "View Daily Challenge"
- On spin: animates a slot-machine style reveal, then shows a modal with the challenge details and an Accept button
- Gradient radial glow on background, no carousel — static decorative section

### `ActiveChallengeBanner` (client)
- Conditionally rendered only when `localStorage` has an active challenge start time
- Shows challenge name + elapsed time counting up
- "✓ Done" button opens completion modal (proof upload optional or required per challenge)
- Stored in `localStorage` (start time + challenge ID) — no server round-trip until completion

### `ChallengeCarousel` (client, reusable)
- Props: `challenges: ChallengeDef[]`, `autoInterval: 5000`
- Renders 3 cards at a time (desktop), 1 (mobile)
- Auto-advances every 5s, pauses on hover
- Dot indicators below

### `ChallengeCard` (client)
- Tall card with gradient header (color varies by category), emoji, title, description
- Difficulty badge (Easy=green, Medium=saffron, Hard=red, Insane=bright red)
- Proof required indicator
- "Accept" button → sets active challenge in localStorage, shows confirmation toast

### `CompletionModal` (client)
- Triggered by "✓ Done" on the active banner
- Self-report: "I did it!" confirm button
- Optional proof: drag-drop / file input → uploads to Supabase Storage → stores URL in completion
- Proof-required challenges: upload field is mandatory, confirm is disabled until file selected
- Optional note field
- On confirm: `INSERT` into `challenge_completions`, emits streak event, closes modal

### `BadgeWall` (client)
- Grid of circular badge icons
- Earned: saffron border + glow shadow
- Locked: grayscale + 0.35 opacity
- Tap earned badge → tooltip with challenge name + completion date

### `HistoryLog` (client)
- Paginated list (10 per page)
- Each row: emoji + title + date + proof indicator + done badge
- Server component renders first page, client handles pagination

### `Leaderboard` (client)
- This week's top 10 by completion count
- Current user row always visible (sticky at bottom if not in top 10), highlighted with saffron border
- Pulls from `challenge_completions` grouped by `user_id`, filtered to current ISO week

### `FriendsFeed` (client)
- Real-time Supabase subscription on `challenge_completions` for household members (the existing social graph — no separate follow system exists; use `household_members` table to scope the feed)
- Each card: avatar + name + timestamp + challenge name + difficulty badge
- Optional proof photo (full-width image if proof_url present)
- Optional note text
- Clap button (toggle reaction) + reply (future) + "⚔️ Challenge them" (deep links to that challenge in Browse)

---

## Challenge Categories & Seed Data

| Category | Color theme | Example challenges |
|---|---|---|
| 🦾 Handicap | Brown/maroon gradient | One Arm Bandit, Shock Collar Cook, Blindfolded Prep, Oven Mitts Only |
| 🔌 Appliance | Dark blue gradient | Microwave Only, Toaster Only, Rice Cooker Only, Random Roll |
| ⚡ Speedrun | Dark yellow gradient | 15-Min Meal, 5-Min Breakfast, 3-Course in 20 |
| 🎰 Wildcard | Mixed/purple | Mystery Box (random rules stack), Daily Challenge |
| 😈 Dare | Dark red gradient | Cook with eyes closed for 5 min, Narrate everything you do, Cook in a costume |

Minimum seed: **5 challenges per category** (25 total) so every carousel has content from day one.

---

## Badge System

One badge per challenge definition. Badge = challenge emoji + short title.

**Badge states:**
- **Locked:** grayscale, 0.35 opacity, no glow
- **Earned:** saffron border, radial glow `rgba(244,162,97,0.3)`, full color

**Special badges (cross-category milestones):**
- 🔥 "On Fire" — 7-day streak
- 🏆 "Legend" — complete one challenge from every category
- 💀 "Insane Mode" — complete 3 INSANE-difficulty challenges
- 🎲 "Gambler" — complete 5 Wildcard challenges

---

## Streak & HolyFlex Integration

On each `challenge_completions` INSERT, call `emitStreakEvent({ action_id: 'challenge_completed', source: 'whatscooking' })` from `src/lib/streak-emit.ts`. This feeds into the HolyFlex streak surface when that integration is active.

---

## Navigation Wiring

### Desktop sidebar (`src/components/app-nav.tsx`)
Add to the "Discover" group:
```ts
{ href: '/challenge', label: 'Challenge Mode', icon: Swords, desc: 'Cooking with rules' }
```

### Mobile bottom nav (`src/components/mobile-bottom-nav.tsx`)
Add to the `MORE_ITEMS` grid (not primary tabs — 4 primary tabs are already set).

---

## Proof Upload

- Storage bucket: `challenge-proofs` (public read for social feed, RLS insert = own user only)
- File types: image/jpeg, image/png, image/webp, video/mp4 (max 50MB)
- Path pattern: `{user_id}/{completion_id}.{ext}`
- On social feed: images render inline; video renders as `<video autoplay muted loop>`

---

## Active Challenge State

Stored in `localStorage` (key: `wc_active_challenge`):
```json
{
  "challengeId": "uuid",
  "title": "15-Min Speedrun",
  "startedAt": "2026-05-20T14:32:00Z",
  "requiresProof": false
}
```
No server round-trip on accept — only on completion. The `ActiveChallengeBanner` reads this on mount and shows a live elapsed timer.

---

## Design Tokens

All challenge UI uses existing WC tokens:
- Card background: `var(--rc-surface)` `#1F1B19` / `var(--rc-rim)` `#3A3430` border
- Accent / CTA: `var(--wc-accent-saffron)` `#F4A261`
- Difficulty Easy: `#7abd7a` on `#1a2e1a`
- Difficulty Hard/Insane: `#e07a7a` / `#ff6b6b` on `#2A2220`
- Category gradient headers: per-category dark gradients (brown, dark-blue, dark-yellow, purple, dark-red)
- Badge glow: `box-shadow: 0 0 10px rgba(244,162,97,0.3)`

---

## Verification

1. Navigate to `/challenge` — page loads with hero, active challenge banner hidden, Browse tab active
2. Click "Spin the Wheel" → slot-machine animation → modal with random challenge → Accept → banner appears with timer
3. Click "✓ Done" → completion modal opens → proof upload (if required) → confirm → completion saved, streak emitted, badge wall updates
4. Switch to "My Progress" → stats bar reflects new completion, badge earned if applicable
5. Switch to "Social" → own completion appears in feed, leaderboard rank updates
6. Desktop sidebar shows "Challenge Mode" link; mobile "More" sheet shows it
7. Carousels auto-advance every 5s, pause on hover
8. Proof-required challenges: confirm button disabled until file selected
