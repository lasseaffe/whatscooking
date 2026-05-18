# Social Layer — Design Spec
**Date:** 2026-05-18  
**App:** What's Cooking (port 3002, Next.js App Router, Supabase)  
**Status:** Approved, ready for implementation

---

## Context

What's Cooking has recipes, cookbooks, meal plans, household members, ratings, and saves — but no social layer. Users cook in isolation. This spec adds the ambient everyday sharing layer: follow other cooks, see what they're making, share your own cooks, and browse public profiles. It is explicitly **not** event planning (dinner-parties and events already exist).

The goal is to make the app feel like a community without turning it into a social media product. The sharing action is lightweight — one tap — and the feed is a timeline of real cooks, not a content marketing surface.

---

## Decisions

| Question | Decision |
|---|---|
| Audience | Both everyday cooks and recipe creators; visually distinct on profiles |
| Share flow | Everything optional — one tap to share; bottom sheet UI |
| Profile visibility | Fully public (no login required to view) |
| Feed content | Hybrid: cooks auto-logged; saves/likes opt-in via preferences |
| Feed location | Inside Discover as a "Following" tab toggle |
| Feed interactions | Inline likes + quick reply thread per post |
| Architecture | New `cook_posts` table as social surface; `activity_feed` for analytics |

---

## Data Model

### New table: `cook_posts`

```sql
create table public.cook_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipe_id   uuid references public.recipes(id) on delete set null,
  photo_url   text,
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now()
);

create index idx_cook_posts_user_id on public.cook_posts(user_id, created_at desc);
create index idx_cook_posts_recipe_id on public.cook_posts(recipe_id);
```

RLS:
- Anyone can read (public)
- Only owner can insert / delete

### New table: `cook_post_likes`

```sql
create table public.cook_post_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.cook_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
```

### Modified: `recipe_comments`

Add nullable `post_id` column alongside existing `recipe_id`. A comment belongs to either a post thread or the main recipe thread — never both. Both are nullable at the DB level; application enforces exactly one must be set.

```sql
alter table public.recipe_comments
  add column post_id uuid references public.cook_posts(id) on delete cascade;
```

### Modified: `profiles`

Add `NOT NULL` constraint to `username` via migration. Generate fallback `user_` + first 8 chars of UUID for any existing nulls. Check for collisions and append counter if needed.

```sql
update public.profiles
  set username = 'user_' || substring(id::text, 1, 8)
  where username is null;

alter table public.profiles
  alter column username set not null;
```

### Existing tables used (no changes)

- `user_follows` — `(follower_id, following_id, followed_at)` with self-follow check constraint. Already has correct RLS (followers see each other's activity).
- `activity_feed` — `(user_id, action_type, recipe_id, meal_plan_id, metadata, created_at)`. Already has RLS scoped to followed users. Populated as side-effect of cook_post creation and cookbook publish.
- `user_preferences` — add `share_activity boolean default false` for opt-in saves/likes logging. Toggled by user in `/settings` under a new "Sharing" section.

---

## API Routes

### New routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/profiles/[username]` | optional | Public profile + stats (follower count, cook count, recipe count, cookbook count) |
| POST | `/api/profiles/[username]/follow` | required | Follow a user |
| DELETE | `/api/profiles/[username]/follow` | required | Unfollow a user |
| GET | `/api/feed` | required | Paginated cook_posts from followed users. Query params: `cursor` (timestamptz), `limit` (default 20) |
| POST | `/api/cook-posts` | required | Create a cook post. Body: `{ recipe_id, photo_url?, note? }` |
| POST | `/api/cook-posts/[id]/likes` | required | Like a post |
| DELETE | `/api/cook-posts/[id]/likes` | required | Unlike a post |
| GET | `/api/cook-posts/[id]/replies` | optional | Get reply thread for a post. Always sets `post_id`; `recipe_id` is null on these comments. |
| POST | `/api/cook-posts/[id]/replies` | required | Post a reply. Always sets `post_id`; `recipe_id` is null. |

### Modified routes

- `POST /api/cook-posts` → side-effect: inserts `cooked` row into `activity_feed`
- `PATCH /api/cookbooks/[slug]` → when `status` flips to `published`, inserts `published` row into `activity_feed`
- `POST /api/saves` → if `user_preferences.share_activity = true`, inserts `saved` row into `activity_feed`

---

## Pages & Routes

### New: `/profile/[username]`

Fully public, server-rendered. Layout:

1. **Cover banner** — gradient fallback if no cover image
2. **Avatar** with border, display name, `@username`
3. **Bio** (from `profiles.bio`)
4. **Stats strip** — Followers / Cooks / Recipes / Books (four equal columns)
5. **Follow / Unfollow button** — client island; hidden on own profile
6. **Cookbooks hero row** — horizontal scroll of published cookbook covers; "+N" chip if more than 4
7. **Tabs** — Cooks / Recipes / Cookbooks
   - **Cooks tab** (default): `CookPostCard` timeline, paginated, infinite scroll
   - **Recipes tab**: published user-created recipes using existing `RecipeCard`
   - **Cookbooks tab**: published cookbooks using existing cookbook card

Graceful 404 if username not found.

### Modified: `/discover`

Adds a pill toggle at the top: **For You** | **Following**

- **For You** — existing algorithmic discover feed (unchanged)
- **Following** — `FollowingFeed` component; shows cook_posts from followed users
  - Empty state when no follows: "You're not following anyone yet" + 3 suggested cooks (users with most cook_posts in last 30 days)

---

## Components

### `CookPostCard`
**Purpose:** Single feed item in the Activity Story style.  
**Renders:** Avatar → "[name] cooked [Recipe]" header + timestamp → recipe thumbnail + note bubble → star rating (if present) → inline like button + reply count  
**Interactions:** Tapping recipe name → `/recipes/[id]`. Tapping reply count → expands inline reply thread. Like button optimistic update.  
**Props:** `post: CookPost`, `currentUserId?: string`

### `CookPostSheet`
**Purpose:** Bottom sheet share flow.  
**Trigger:** "Share this cook" button on recipe page (`RecipeInteractions`) and cooking mode completion screen (`CookingModeWrapper`).  
**Contains:** Recipe chip (read-only), photo upload slot (optional, uploads to `cook-photos` Supabase Storage bucket), 280-char note textarea (optional), "Share with followers" CTA.  
**Behaviour:** If photo upload fails, post goes through without photo. Dismisses on success with toast. Submits to `POST /api/cook-posts`.  
**Props:** `recipeId: string`, `recipeTitle: string`, `recipeImageUrl?: string`, `onClose: () => void`

### `ProfileHeader`
**Purpose:** Top section of `/profile/[username]`.  
**Contains:** Cover banner, avatar, display name + username, bio, stats strip, Follow/Unfollow button.  
**Server-rendered** except Follow button (client island using `use client`).  
**Props:** `profile: PublicProfile`, `stats: ProfileStats`, `isOwnProfile: boolean`, `isFollowing: boolean`

### `ProfileTabs`
**Purpose:** Tabbed content below ProfileHeader.  
**Tabs:** Cooks / Recipes / Cookbooks. Lazy-loaded per tab.  
**Reuses:** Existing `RecipeCard` and cookbook card — no new card designs.  
**Props:** `username: string`, `initialTab?: 'cooks' | 'recipes' | 'cookbooks'`

### `FollowingFeed`
**Purpose:** "Following" tab content inside Discover.  
**Behaviour:** Infinite scroll, cursor-based pagination (page size 20). Calls `GET /api/feed`.  
**Empty state:** "You're not following anyone yet" + 3 suggested cooks.  
**No props** — reads auth from Supabase client.

---

## Wiring Existing Systems

### Recipe page (`/recipes/[id]`)
- Add "Share this cook" button to `RecipeInteractions` component
- Button opens `CookPostSheet` with current recipe pre-filled
- Only shown when user is authenticated

### Cooking mode (`CookingModeWrapper`)
- Completion screen (after last step "Done") shows brief celebration
- Immediately opens `CookPostSheet` — highest-intent sharing moment

### Profile discovery
- Username on `RecipeCard` (for user-created recipes) becomes a link to `/profile/[username]`
- Username on cookbook detail page becomes a link to `/profile/[username]`

---

## Error Handling & Edge Cases

| Case | Behaviour |
|---|---|
| No followers | `GET /api/feed` returns `[]`; Following tab shows empty state with suggested cooks |
| Username collision (migration) | Append `_2`, `_3` etc. until unique |
| Cook post without recipe | Not allowed — `recipe_id` NOT NULL; `CookPostSheet` always pre-fills from context |
| Photo upload failure | Post goes through without photo; no blocking error shown |
| Deleted recipe | Post remains; recipe renders as "a recipe" (null recipe_id graceful fallback) |
| Own profile | Follow button hidden; stats still shown |
| Self-follow attempt | Blocked by existing DB `CHECK (follower_id != following_id)` constraint |
| Unauthenticated feed request | 401; Following tab not shown unless logged in |
| Feed pagination | Cursor on `cook_posts.created_at DESC`; page size 20 |

---

## Out of Scope

- Push notifications for new followers / likes (separate feature)
- Direct messaging / recipe recommendations UI (backend table exists; UI deferred)
- Private profiles (all profiles are public)
- Verified badges or creator tiers
- Algorithmic feed ranking (Following feed is strictly chronological)
- Hashtags or topic tagging on posts
