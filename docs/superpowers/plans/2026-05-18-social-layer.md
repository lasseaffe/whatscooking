# Social Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a follow/feed/share/profile social layer to What's Cooking so users can follow other cooks, share what they've cooked, and browse public profiles.

**Architecture:** New `cook_posts` table is the public social surface (anyone can read); the existing private `cook_log` table remains for personal history. `activity_feed` is populated as a side-effect of cook_post creation. The social feed lives inside Discover as a "Following" tab toggle.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS + Storage), React 19, Tailwind CSS 4, framer-motion, TypeScript, lucide-react

---

## File Map

**New files:**
- `supabase/migrations/20260518d_social_layer.sql` — all schema changes
- `src/app/api/profiles/[username]/route.ts` — GET public profile + stats
- `src/app/api/profiles/[username]/follow/route.ts` — POST follow / DELETE unfollow
- `src/app/api/feed/route.ts` — GET paginated following feed
- `src/app/api/cook-posts/route.ts` — POST create cook post
- `src/app/api/cook-posts/[id]/likes/route.ts` — POST like / DELETE unlike
- `src/app/api/cook-posts/[id]/replies/route.ts` — GET thread / POST reply
- `src/components/social/cook-post-card.tsx` — feed item component
- `src/components/social/cook-post-sheet.tsx` — bottom sheet share flow
- `src/components/social/following-feed.tsx` — paginated Following tab
- `src/components/social/profile-header.tsx` — public profile top section
- `src/components/social/profile-tabs.tsx` — tabbed Cooks/Recipes/Cookbooks
- `src/app/(app)/profile/[username]/page.tsx` — public profile page

**Modified files:**
- `src/lib/types.ts` — add `CookPost`, `PublicProfile`, `ProfileStats` types
- `src/app/(app)/discover/discover-feed-client.tsx` — add For You / Following toggle
- `src/app/(app)/recipes/[id]/recipe-interactions.tsx` — add Share this cook button
- `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx` — extend `donePhase` to include `"share"`
- `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx` — pass `recipeId` down
- `src/app/api/saves/route.ts` — write `saved` to `activity_feed` when `share_activity` is on
- `src/app/api/cookbooks/[slug]/route.ts` — write `published` to `activity_feed` on status flip

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260518d_social_layer.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260518d_social_layer.sql

-- ── 1. cook_posts (public social surface) ────────────────────
create table public.cook_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipe_id   uuid references public.recipes(id) on delete set null,
  photo_url   text,
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now()
);

create index idx_cook_posts_user_id  on public.cook_posts(user_id, created_at desc);
create index idx_cook_posts_recipe_id on public.cook_posts(recipe_id);

alter table public.cook_posts enable row level security;

create policy "cook_posts public read"
  on public.cook_posts for select using (true);

create policy "cook_posts owner insert"
  on public.cook_posts for insert
  with check (auth.uid() = user_id);

create policy "cook_posts owner delete"
  on public.cook_posts for delete
  using (auth.uid() = user_id);

-- ── 2. cook_post_likes ────────────────────────────────────────
create table public.cook_post_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.cook_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.cook_post_likes enable row level security;

create policy "cook_post_likes public read"
  on public.cook_post_likes for select using (true);

create policy "cook_post_likes owner write"
  on public.cook_post_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. recipe_comments: add post_id ──────────────────────────
alter table public.recipe_comments
  add column if not exists post_id uuid references public.cook_posts(id) on delete cascade;

create index if not exists idx_recipe_comments_post_id
  on public.recipe_comments(post_id, created_at desc);

-- ── 4. profiles: enforce username not null ────────────────────
do $$
declare
  r record;
  candidate text;
  counter int;
begin
  for r in select id from public.profiles where username is null loop
    candidate := 'user_' || substring(r.id::text, 1, 8);
    counter := 2;
    while exists (select 1 from public.profiles where username = candidate) loop
      candidate := 'user_' || substring(r.id::text, 1, 8) || '_' || counter;
      counter := counter + 1;
    end loop;
    update public.profiles set username = candidate where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column username set not null;

-- ── 5. user_preferences: add share_activity ──────────────────
alter table public.user_preferences
  add column if not exists share_activity boolean not null default false;
```

- [ ] **Step 2: Apply the migration to your local Supabase**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx supabase db push
```

Expected: migration applies without error. If `supabase` CLI isn't available, paste the SQL directly into the Supabase dashboard SQL editor.

- [ ] **Step 3: Verify tables exist**

In Supabase dashboard or via SQL:
```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('cook_posts', 'cook_post_likes');
-- Expected: 2 rows

select column_name from information_schema.columns
where table_name = 'recipe_comments' and column_name = 'post_id';
-- Expected: 1 row

select column_name from information_schema.columns
where table_name = 'profiles' and column_name = 'username';
-- Check: is_nullable = 'NO'
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518d_social_layer.sql
git commit -m "feat(db): add social layer migration — cook_posts, cook_post_likes, profiles.username NOT NULL"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add social types to types.ts**

Open `src/lib/types.ts` and append at the end of the file:

```typescript
// ============================================================
// Social Layer
// ============================================================

export interface CookPost {
  id: string;
  user_id: string;
  recipe_id: string | null;
  photo_url: string | null;
  note: string | null;
  created_at: string;
  // Joined fields (from API)
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  recipe?: {
    id: string;
    title: string;
    image_url: string | null;
    cuisine_type: string | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
  } | null;
  like_count?: number;
  reply_count?: number;
  liked_by_me?: boolean;
}

export interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface ProfileStats {
  follower_count: number;
  following_count: number;
  cook_count: number;
  recipe_count: number;
  cookbook_count: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to the new types.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add CookPost, PublicProfile, ProfileStats"
```

---

## Task 3: API — GET /api/profiles/[username]

**Files:**
- Create: `src/app/api/profiles/[username]/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/profiles/[username]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [
    { count: follower_count },
    { count: following_count },
    { count: cook_count },
    { count: recipe_count },
    { count: cookbook_count },
  ] = await Promise.all([
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("cook_posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("recipes").select("*", { count: "exact", head: true }).eq("created_by", profile.id).eq("is_published", true),
    supabase.from("cookbooks").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "published"),
  ]);

  // Check if the requesting user is following this profile
  const { data: { user } } = await supabase.auth.getUser();
  let is_following = false;
  if (user) {
    const { data: follow } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single();
    is_following = !!follow;
  }

  return NextResponse.json({
    profile,
    stats: {
      follower_count: follower_count ?? 0,
      following_count: following_count ?? 0,
      cook_count: cook_count ?? 0,
      recipe_count: recipe_count ?? 0,
      cookbook_count: cookbook_count ?? 0,
    },
    is_following,
  });
}
```

- [ ] **Step 2: Test the route in browser**

Start the dev server (`npm run dev` in `C:\Users\lasse\Desktop\whatscooking`) and open:
```
http://localhost:3002/api/profiles/YOUR_USERNAME
```
Expected: JSON with `profile`, `stats`, and `is_following` fields.

Try a non-existent username:
```
http://localhost:3002/api/profiles/doesnotexist999
```
Expected: `{ "error": "Profile not found" }` with status 404.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profiles/[username]/route.ts
git commit -m "feat(api): GET /api/profiles/[username] — public profile + stats"
```

---

## Task 4: API — Follow / Unfollow

**Files:**
- Create: `src/app/api/profiles/[username]/follow/route.ts`

- [ ] **Step 1: Create the follow route**

```typescript
// src/app/api/profiles/[username]/follow/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await supabase
    .from("user_follows")
    .upsert({ follower_id: user.id, following_id: target.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ following: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", target.id);

  return NextResponse.json({ following: false });
}
```

- [ ] **Step 2: Test (requires auth — use browser with logged-in session)**

```bash
# Follow
curl -X POST http://localhost:3002/api/profiles/some_username/follow \
  -H "Cookie: YOUR_SESSION_COOKIE"
# Expected: { "following": true }

# Unfollow
curl -X DELETE http://localhost:3002/api/profiles/some_username/follow \
  -H "Cookie: YOUR_SESSION_COOKIE"
# Expected: { "following": false }
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/profiles/[username]/follow/route.ts"
git commit -m "feat(api): POST/DELETE /api/profiles/[username]/follow"
```

---

## Task 5: API — POST /api/cook-posts

**Files:**
- Create: `src/app/api/cook-posts/route.ts`

- [ ] **Step 1: Create the cook-posts route**

```typescript
// src/app/api/cook-posts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipe_id, photo_url, note } = await req.json();

    const { data: post, error } = await supabase
      .from("cook_posts")
      .insert({
        user_id: user.id,
        recipe_id: recipe_id ?? null,
        photo_url: photo_url ?? null,
        note: note?.trim() ?? null,
      })
      .select("id, user_id, recipe_id, photo_url, note, created_at")
      .single();

    if (error) throw error;

    // Side-effect: log to activity_feed
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      action_type: "cooked",
      recipe_id: recipe_id ?? null,
      metadata: { cook_post_id: post.id },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[cook-posts POST]", error);
    return NextResponse.json({ error: "Failed to create cook post" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test**

```bash
curl -X POST http://localhost:3002/api/cook-posts \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"recipe_id": "SOME_RECIPE_UUID", "note": "Turned out great!"}'
# Expected: 201 with { post: { id, user_id, recipe_id, photo_url, note, created_at } }
```

Check Supabase: row exists in `cook_posts` AND `activity_feed` (action_type = 'cooked').

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cook-posts/route.ts
git commit -m "feat(api): POST /api/cook-posts with activity_feed side-effect"
```

---

## Task 6: API — GET /api/feed

**Files:**
- Create: `src/app/api/feed/route.ts`

- [ ] **Step 1: Create the feed route**

```typescript
// src/app/api/feed/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    // Get the list of users the current user follows
    const { data: follows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = (follows ?? []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      // Return suggested cooks when not following anyone
      const { data: suggested } = await supabase
        .from("cook_posts")
        .select(`
          user_id,
          profiles!cook_posts_user_id_fkey(username, full_name, avatar_url)
        `)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .neq("user_id", user.id)
        .limit(100);

      // Count posts per user and return top 3
      const countMap = new Map<string, { count: number; profile: unknown }>();
      for (const row of suggested ?? []) {
        const existing = countMap.get(row.user_id);
        countMap.set(row.user_id, {
          count: (existing?.count ?? 0) + 1,
          profile: row.profiles,
        });
      }
      const suggestedCooks = [...countMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([user_id, { count, profile }]) => ({ user_id, post_count: count, profile }));

      return NextResponse.json({ posts: [], suggested_cooks: suggestedCooks });
    }

    // Fetch paginated posts from followed users
    let query = supabase
      .from("cook_posts")
      .select(`
        id, user_id, recipe_id, photo_url, note, created_at,
        profile:profiles!cook_posts_user_id_fkey(username, full_name, avatar_url),
        recipe:recipes(id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes),
        like_count:cook_post_likes(count),
        reply_count:recipe_comments(count)
      `)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    // Check which posts the current user has liked
    const postIds = (posts ?? []).map((p) => p.id);
    const { data: myLikes } = postIds.length > 0
      ? await supabase
          .from("cook_post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)
      : { data: [] };

    const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

    const enriched = (posts ?? []).map((p) => ({
      ...p,
      like_count: (p.like_count as unknown as { count: number }[])?.[0]?.count ?? 0,
      reply_count: (p.reply_count as unknown as { count: number }[])?.[0]?.count ?? 0,
      liked_by_me: likedSet.has(p.id),
    }));

    return NextResponse.json({ posts: enriched, suggested_cooks: [] });
  } catch (error) {
    console.error("[feed GET]", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test**

```bash
# With session (following someone who has cook_posts):
curl http://localhost:3002/api/feed \
  -H "Cookie: YOUR_SESSION_COOKIE"
# Expected: { posts: [...], suggested_cooks: [] }

# Without following anyone:
# Expected: { posts: [], suggested_cooks: [{ user_id, post_count, profile }] }

# Pagination:
curl "http://localhost:3002/api/feed?cursor=2026-05-17T12:00:00Z" \
  -H "Cookie: YOUR_SESSION_COOKIE"
# Expected: posts older than the cursor timestamp
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/feed/route.ts
git commit -m "feat(api): GET /api/feed — paginated following feed with suggested cooks fallback"
```

---

## Task 7: API — Cook Post Likes & Replies

**Files:**
- Create: `src/app/api/cook-posts/[id]/likes/route.ts`
- Create: `src/app/api/cook-posts/[id]/replies/route.ts`

- [ ] **Step 1: Create likes route**

```typescript
// src/app/api/cook-posts/[id]/likes/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("cook_post_likes")
    .upsert({ user_id: user.id, post_id: id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ liked: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("cook_post_likes")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", id);

  return NextResponse.json({ liked: false });
}
```

- [ ] **Step 2: Create replies route**

```typescript
// src/app/api/cook-posts/[id]/replies/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: replies, error } = await supabase
    .from("recipe_comments")
    .select("id, user_id, content, created_at, profile:profiles(username, full_name, avatar_url)")
    .eq("post_id", id)
    .is("recipe_id", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: replies ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recipe_comments")
    .insert({
      user_id: user.id,
      post_id: id,
      recipe_id: null,
      content: content.trim(),
    })
    .select("id, user_id, content, created_at, profile:profiles(username, full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reply: data }, { status: 201 });
}
```

- [ ] **Step 3: Test likes**

```bash
# Like a post:
curl -X POST http://localhost:3002/api/cook-posts/POST_UUID/likes \
  -H "Cookie: YOUR_SESSION_COOKIE"
# Expected: { "liked": true }

# Unlike:
curl -X DELETE http://localhost:3002/api/cook-posts/POST_UUID/likes \
  -H "Cookie: YOUR_SESSION_COOKIE"
# Expected: { "liked": false }
```

- [ ] **Step 4: Test replies**

```bash
# Post a reply:
curl -X POST http://localhost:3002/api/cook-posts/POST_UUID/replies \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"content": "Looks amazing!"}'
# Expected: 201 with reply object (recipe_id must be null in DB)

# Get replies:
curl http://localhost:3002/api/cook-posts/POST_UUID/replies
# Expected: { "replies": [...] }
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/cook-posts/[id]/likes/route.ts" "src/app/api/cook-posts/[id]/replies/route.ts"
git commit -m "feat(api): cook post likes and replies endpoints"
```

---

## Task 8: API — Side-effects on saves and cookbook publish

**Files:**
- Modify: `src/app/api/saves/route.ts`
- Modify: `src/app/api/cookbooks/[slug]/route.ts`

- [ ] **Step 1: Update saves route to log to activity_feed**

In `src/app/api/saves/route.ts`, replace the `POST` handler with:

```typescript
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipe_id } = await req.json();
    if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

    await supabase.from("recipe_saves").upsert({ user_id: user.id, recipe_id });

    // Log to activity_feed only if user opted in
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("share_activity")
      .eq("user_id", user.id)
      .single();

    if (prefs?.share_activity) {
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        action_type: "saved",
        recipe_id,
      });
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[saves POST]", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update cookbook PATCH route to log publish**

In `src/app/api/cookbooks/[slug]/route.ts`, replace the `PATCH` handler with:

```typescript
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Fetch current status before update to detect publish flip
  const { data: current } = await supabase
    .from("cookbooks")
    .select("id, status")
    .eq("slug", slug)
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("cookbooks")
    .update(body)
    .eq("slug", slug)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to activity_feed when status flips to published
  if (current?.status !== "published" && body.status === "published") {
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      action_type: "published",
      metadata: { cookbook_id: data.id, cookbook_title: data.title },
    });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 3: Verify saves still work**

Open the app at `http://localhost:3002`, log in, go to any recipe, and click the save button. Check the Network tab — should return `{ saved: true }`. Check Supabase: no `activity_feed` row yet (share_activity defaults to false).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/saves/route.ts "src/app/api/cookbooks/[slug]/route.ts"
git commit -m "feat(api): log saved/published events to activity_feed with opt-in guard"
```

---

## Task 9: CookPostCard Component

**Files:**
- Create: `src/components/social/cook-post-card.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/social/cook-post-card.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageSquare, ChefHat, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CookPost } from "@/lib/types";

interface Props {
  post: CookPost;
  currentUserId?: string;
}

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  const initials = (name ?? "?")[0].toUpperCase();
  if (url) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[rgba(180,120,60,0.3)]">
        <Image src={url} alt={name ?? "avatar"} width={36} height={36} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold border border-[rgba(180,120,60,0.3)]"
      style={{ background: "#2A1808", color: "#C8956C" }}
    >
      {initials}
    </div>
  );
}

export function CookPostCard({ post, currentUserId }: Props) {
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Array<{ id: string; content: string; created_at: string; profile: { username: string; full_name: string | null } | null }>>([]);
  const [replyInput, setReplyInput] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const username = post.profile?.username ?? "unknown";
  const displayName = post.profile?.full_name ?? username;
  const recipeName = post.recipe?.title ?? "a recipe";
  const recipeId = post.recipe?.id;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  async function toggleLike() {
    if (!currentUserId) return;
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikeCount((c) => c + (optimisticLiked ? 1 : -1));
    try {
      await fetch(`/api/cook-posts/${post.id}/likes`, {
        method: optimisticLiked ? "POST" : "DELETE",
      });
    } catch {
      // Revert on error
      setLiked(!optimisticLiked);
      setLikeCount((c) => c + (optimisticLiked ? -1 : 1));
    }
  }

  async function loadReplies() {
    if (showReplies) { setShowReplies(false); return; }
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/cook-posts/${post.id}/replies`);
      const { replies: data } = await res.json();
      setReplies(data ?? []);
      setShowReplies(true);
    } finally {
      setLoadingReplies(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyInput.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/cook-posts/${post.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyInput }),
      });
      if (res.ok) {
        const { reply } = await res.json();
        setReplies((prev) => [...prev, reply]);
        setReplyInput("");
      }
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}
    >
      {/* Header: avatar + "[Name] cooked [Recipe]" */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Link href={`/profile/${username}`}>
          <Avatar url={post.profile?.avatar_url ?? null} name={displayName} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug" style={{ color: "#EFE3CE" }}>
            <Link href={`/profile/${username}`} className="font-semibold hover:underline">
              {displayName}
            </Link>
            {" cooked "}
            {recipeId ? (
              <Link href={`/recipes/${recipeId}`} className="font-semibold hover:underline" style={{ color: "#C8956C" }}>
                {recipeName}
              </Link>
            ) : (
              <span className="font-semibold" style={{ color: "#C8956C" }}>{recipeName}</span>
            )}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#5A3A24" }}>{timeAgo}</p>
        </div>
      </div>

      {/* Recipe chip */}
      {post.recipe && (
        <Link href={`/recipes/${post.recipe.id}`} className="flex items-center gap-3 mx-4 mb-3 rounded-xl p-3 transition-colors hover:opacity-90" style={{ background: "#2A1808" }}>
          {post.recipe.image_url && (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={post.recipe.image_url} alt={post.recipe.title} width={48} height={48} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>{post.recipe.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {post.recipe.cuisine_type && (
                <span className="text-xs" style={{ color: "#8A6A4A" }}>{post.recipe.cuisine_type}</span>
              )}
              {(post.recipe.prep_time_minutes ?? 0) + (post.recipe.cook_time_minutes ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "#8A6A4A" }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {(post.recipe.prep_time_minutes ?? 0) + (post.recipe.cook_time_minutes ?? 0)} min
                </span>
              )}
            </div>
          </div>
          <ChefHat style={{ width: 16, height: 16, color: "#5A3A24", flexShrink: 0 }} />
        </Link>
      )}

      {/* Note bubble */}
      {post.note && (
        <div className="mx-4 mb-3 rounded-xl px-4 py-3" style={{ background: "#221208" }}>
          <p className="text-sm italic leading-relaxed" style={{ color: "#C8956C" }}>"{post.note}"</p>
        </div>
      )}

      {/* Photo */}
      {post.photo_url && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden aspect-video">
          <Image src={post.photo_url} alt="Cook photo" fill className="object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: liked ? "#E05A2B" : "#5A3A24" }}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            style={{ width: 16, height: 16, fill: liked ? "#E05A2B" : "transparent", color: liked ? "#E05A2B" : "#5A3A24" }}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          type="button"
          onClick={loadReplies}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#5A3A24" }}
        >
          <MessageSquare style={{ width: 16, height: 16 }} />
          {(post.reply_count ?? 0) > 0 && <span>{post.reply_count}</span>}
          <span className="text-xs">{loadingReplies ? "Loading…" : showReplies ? "Hide" : "Reply"}</span>
        </button>
      </div>

      {/* Inline reply thread */}
      {showReplies && (
        <div className="border-t px-4 pt-3 pb-4 space-y-3" style={{ borderColor: "rgba(180,120,60,0.1)" }}>
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "#2A1808", color: "#C8956C" }}>
                {(reply.profile?.full_name ?? reply.profile?.username ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold mr-1.5" style={{ color: "#C8956C" }}>
                  {reply.profile?.full_name ?? reply.profile?.username}
                </span>
                <span className="text-xs" style={{ color: "#8A6A4A" }}>{reply.content}</span>
              </div>
            </div>
          ))}
          {currentUserId && (
            <form onSubmit={submitReply} className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Add a reply…"
                className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                style={{ background: "#2A1808", color: "#EFE3CE", border: "1px solid rgba(180,120,60,0.2)" }}
                maxLength={280}
              />
              <button
                type="submit"
                disabled={!replyInput.trim() || submittingReply}
                className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                style={{ background: "#C8956C", color: "#1A0E04" }}
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Install date-fns if not present**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npm list date-fns 2>/dev/null || npm install date-fns
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "cook-post-card"
# Expected: no output (no errors)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/social/cook-post-card.tsx
git commit -m "feat(ui): CookPostCard — activity story feed card with likes and inline replies"
```

---

## Task 10: CookPostSheet Component

**Files:**
- Create: `src/components/social/cook-post-sheet.tsx`

- [ ] **Step 1: Create the bottom sheet component**

```typescript
// src/components/social/cook-post-sheet.tsx
"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Props {
  recipeId: string;
  recipeTitle: string;
  recipeImageUrl?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CookPostSheet({ recipeId, recipeTitle, recipeImageUrl, onClose, onSuccess }: Props) {
  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("cook-photos").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("cook-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        photo_url = await uploadPhoto(photoFile);
        // Photo upload failure is non-blocking — post without photo
      }

      const res = await fetch("/api/cook-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          note: note.trim() || null,
          photo_url,
        }),
      });

      if (!res.ok) throw new Error("Failed to share");
      onSuccess?.();
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
        <motion.div
          className="w-full rounded-t-3xl overflow-hidden"
          style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.3)", borderBottom: "none" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(180,120,60,0.3)" }} />
          </div>

          <div className="px-6 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)", color: "#EFE3CE" }}>
                Share your cook
              </h2>
              <button type="button" onClick={onClose} style={{ color: "#5A3A24" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recipe chip */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#2A1808" }}>
                {recipeImageUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={recipeImageUrl} alt={recipeTitle} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "#3A2010" }}>
                    🍳
                  </div>
                )}
                <span className="text-sm font-semibold flex-1 truncate" style={{ color: "#EFE3CE" }}>{recipeTitle}</span>
                <span className="text-xs" style={{ color: "#5A3A24" }}>✓</span>
              </div>

              {/* Photo + note row */}
              <div className="flex gap-3">
                {/* Photo slot */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                  style={{ border: "2px dashed rgba(180,120,60,0.3)", background: "#221208" }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera style={{ width: 20, height: 20, color: "#5A3A24" }} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                {/* Note */}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note… (optional)"
                  maxLength={280}
                  rows={3}
                  className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none leading-relaxed"
                  style={{ background: "#221208", color: "#EFE3CE", border: "1px solid rgba(180,120,60,0.15)" }}
                />
              </div>
              {note.length > 240 && (
                <p className="text-xs text-right" style={{ color: "#8A6A4A" }}>{280 - note.length} left</p>
              )}

              {error && <p className="text-xs" style={{ color: "#E05A2B" }}>{error}</p>}

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "#C8956C", color: "#1A0E04" }}
              >
                {submitting ? (
                  <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> Sharing…</>
                ) : (
                  "Share with followers"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "cook-post-sheet"
# Expected: no output
```

- [ ] **Step 3: Commit**

```bash
git add src/components/social/cook-post-sheet.tsx
git commit -m "feat(ui): CookPostSheet — bottom sheet share flow with optional photo + note"
```

---

## Task 11: FollowingFeed Component

**Files:**
- Create: `src/components/social/following-feed.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/social/following-feed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CookPostCard } from "./cook-post-card";
import type { CookPost } from "@/lib/types";

interface SuggestedCook {
  user_id: string;
  post_count: number;
  profile: { username: string; full_name: string | null; avatar_url: string | null } | null;
}

interface FeedResponse {
  posts: CookPost[];
  suggested_cooks: SuggestedCook[];
}

interface Props {
  currentUserId?: string;
}

export function FollowingFeed({ currentUserId }: Props) {
  const [posts, setPosts] = useState<CookPost[]>([]);
  const [suggestedCooks, setSuggestedCooks] = useState<SuggestedCook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  async function fetchPage(cursor?: string) {
    const url = cursor
      ? `/api/feed?cursor=${encodeURIComponent(cursor)}&limit=20`
      : "/api/feed?limit=20";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load feed");
    return res.json() as Promise<FeedResponse>;
  }

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }
    setLoading(true);
    fetchPage()
      .then((data) => {
        setPosts(data.posts);
        setSuggestedCooks(data.suggested_cooks);
        cursorRef.current = data.posts[data.posts.length - 1]?.created_at ?? null;
        setHasMore(data.posts.length === 20);
      })
      .catch(() => setError("Couldn't load feed"))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(cursorRef.current);
      setPosts((prev) => [...prev, ...data.posts]);
      cursorRef.current = data.posts[data.posts.length - 1]?.created_at ?? null;
      setHasMore(data.posts.length === 20);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!currentUserId) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm mb-3" style={{ color: "#8A6A4A" }}>Sign in to see what people you follow are cooking.</p>
        <Link href="/login" className="text-sm font-semibold" style={{ color: "#C8956C" }}>Sign in →</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#C8956C" }} />
      </div>
    );
  }

  if (error) {
    return <div className="py-16 text-center text-sm" style={{ color: "#E05A2B" }}>{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="py-12">
        <p className="text-center text-sm mb-6" style={{ color: "#8A6A4A" }}>
          You're not following anyone yet.
        </p>
        {suggestedCooks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "#5A3A24" }}>
              Active cooks to follow
            </p>
            <div className="space-y-2">
              {suggestedCooks.map((cook) => (
                <Link
                  key={cook.user_id}
                  href={`/profile/${cook.profile?.username ?? cook.user_id}`}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-colors"
                  style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}
                >
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "#2A1808", color: "#C8956C" }}>
                    {(cook.profile?.full_name ?? cook.profile?.username ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#EFE3CE" }}>
                      {cook.profile?.full_name ?? cook.profile?.username}
                    </p>
                    <p className="text-xs" style={{ color: "#8A6A4A" }}>{cook.post_count} cooks this month</p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#C8956C" }}>Follow →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <CookPostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "#C8956C" }} />
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs py-4" style={{ color: "#5A3A24" }}>You're all caught up 🍳</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "following-feed"
# Expected: no output
```

- [ ] **Step 3: Commit**

```bash
git add src/components/social/following-feed.tsx
git commit -m "feat(ui): FollowingFeed — infinite scroll feed with empty state + suggested cooks"
```

---

## Task 12: ProfileHeader and ProfileTabs Components

**Files:**
- Create: `src/components/social/profile-header.tsx`
- Create: `src/components/social/profile-tabs.tsx`

- [ ] **Step 1: Create ProfileHeader**

```typescript
// src/components/social/profile-header.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { PublicProfile, ProfileStats } from "@/lib/types";

interface Props {
  profile: PublicProfile;
  stats: ProfileStats;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
}

export function ProfileHeader({ profile, stats, isOwnProfile, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(stats.follower_count);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (loading) return;
    setLoading(true);
    const optimistic = !isFollowing;
    setIsFollowing(optimistic);
    setFollowerCount((c) => c + (optimistic ? 1 : -1));
    try {
      await fetch(`/api/profiles/${profile.username}/follow`, {
        method: optimistic ? "POST" : "DELETE",
      });
    } catch {
      setIsFollowing(!optimistic);
      setFollowerCount((c) => c + (optimistic ? -1 : 1));
    } finally {
      setLoading(false);
    }
  }

  const statItems = [
    { label: "Followers", value: followerCount },
    { label: "Cooks", value: stats.cook_count },
    { label: "Recipes", value: stats.recipe_count },
    { label: "Books", value: stats.cookbook_count },
  ];

  return (
    <div>
      {/* Cover banner */}
      <div
        className="h-24 w-full"
        style={{ background: "linear-gradient(135deg, #3A2010 0%, #1A100A 100%)" }}
      />

      <div className="px-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden border-4 flex-shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{ borderColor: "#0A0604", background: "#2A1808", color: "#C8956C" }}
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name ?? profile.username} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              (profile.full_name ?? profile.username)[0].toUpperCase()
            )}
          </div>

          {!isOwnProfile && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={loading}
              className="px-5 py-2 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
              style={
                isFollowing
                  ? { background: "#2A1808", color: "#C8956C", border: "1px solid rgba(180,120,60,0.4)" }
                  : { background: "#C8956C", color: "#1A0E04" }
              }
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Name + username */}
        <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)", color: "#EFE3CE" }}>
          {profile.full_name ?? profile.username}
        </h1>
        <p className="text-sm mb-2" style={{ color: "#5A3A24" }}>@{profile.username}</p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#8A6A4A" }}>{profile.bio}</p>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-4 rounded-2xl overflow-hidden mb-4" style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}>
          {statItems.map((item, i) => (
            <div
              key={item.label}
              className="py-3 text-center"
              style={{ borderRight: i < 3 ? "1px solid rgba(180,120,60,0.1)" : "none" }}
            >
              <div className="text-base font-bold" style={{ color: "#EFE3CE" }}>{item.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#5A3A24" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ProfileTabs**

```typescript
// src/components/social/profile-tabs.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { CookPostCard } from "./cook-post-card";
import { RecipeCard } from "@/components/recipe-card";
import type { CookPost, Recipe } from "@/lib/types";

type Tab = "cooks" | "recipes" | "cookbooks";

interface Cookbook {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  theme_color: string | null;
  tagline: string | null;
  price: number;
}

interface Props {
  username: string;
  userId: string;
  currentUserId?: string;
  initialTab?: Tab;
}

export function ProfileTabs({ username, userId, currentUserId, initialTab = "cooks" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [cooks, setCooks] = useState<CookPost[] | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [cookbooks, setCookbooks] = useState<Cookbook[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadTab(t: Tab) {
    setLoading(true);
    try {
      if (t === "cooks" && cooks === null) {
        const res = await fetch(`/api/profiles/${username}/cooks`);
        const data = await res.json();
        setCooks(data.posts ?? []);
      } else if (t === "recipes" && recipes === null) {
        const res = await fetch(`/api/recipes/list?created_by=${userId}&is_published=true&limit=24`);
        const data = await res.json();
        setRecipes(data.recipes ?? []);
      } else if (t === "cookbooks" && cookbooks === null) {
        const res = await fetch(`/api/cookbooks?user_id=${userId}`);
        const data = await res.json();
        setCookbooks(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTab(tab);
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "cooks", label: "Cooks" },
    { key: "recipes", label: "Recipes" },
    { key: "cookbooks", label: "Cookbooks" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b px-4 mb-4" style={{ borderColor: "rgba(180,120,60,0.15)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="px-4 py-3 text-sm font-medium transition-colors relative"
            style={{ color: tab === t.key ? "#C8956C" : "#5A3A24" }}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#C8956C" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#C8956C" }} />
          </div>
        )}

        {!loading && tab === "cooks" && (
          <div className="space-y-4">
            {(cooks ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#5A3A24" }}>No cooks shared yet.</p>
            ) : (
              (cooks ?? []).map((post) => (
                <CookPostCard key={post.id} post={post} currentUserId={currentUserId} />
              ))
            )}
          </div>
        )}

        {!loading && tab === "recipes" && (
          <div className="grid grid-cols-2 gap-3">
            {(recipes ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center col-span-2" style={{ color: "#5A3A24" }}>No published recipes yet.</p>
            ) : (
              (recipes ?? []).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>
        )}

        {!loading && tab === "cookbooks" && (
          <div className="space-y-3">
            {(cookbooks ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#5A3A24" }}>No published cookbooks yet.</p>
            ) : (
              (cookbooks ?? []).map((cb) => (
                <a
                  key={cb.id}
                  href={`/cookbooks/${cb.slug}`}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}
                >
                  <div className="w-12 h-14 rounded-lg flex-shrink-0" style={{ background: cb.theme_color ?? "#2A1808" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{cb.title}</p>
                    {cb.tagline && <p className="text-xs mt-0.5" style={{ color: "#8A6A4A" }}>{cb.tagline}</p>}
                    {cb.price > 0 && <p className="text-xs mt-1 font-semibold" style={{ color: "#C8956C" }}>${cb.price}</p>}
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the /api/profiles/[username]/cooks route** (needed by ProfileTabs)

Create `src/app/api/profiles/[username]/cooks/route.ts`:

```typescript
// src/app/api/profiles/[username]/cooks/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("cook_posts")
    .select(`
      id, user_id, recipe_id, photo_url, note, created_at,
      profile:profiles!cook_posts_user_id_fkey(username, full_name, avatar_url),
      recipe:recipes(id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes),
      like_count:cook_post_likes(count),
      reply_count:recipe_comments(count)
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: myLikes } = user && postIds.length > 0
    ? await supabase.from("cook_post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
    : { data: [] };

  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    like_count: (p.like_count as unknown as { count: number }[])?.[0]?.count ?? 0,
    reply_count: (p.reply_count as unknown as { count: number }[])?.[0]?.count ?? 0,
    liked_by_me: likedSet.has(p.id),
  }));

  return NextResponse.json({ posts: enriched });
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "profile-header|profile-tabs|cooks/route"
# Expected: no output
```

- [ ] **Step 5: Commit**

```bash
git add src/components/social/profile-header.tsx src/components/social/profile-tabs.tsx "src/app/api/profiles/[username]/cooks/route.ts"
git commit -m "feat(ui): ProfileHeader + ProfileTabs components + /api/profiles/[username]/cooks"
```

---

## Task 13: Public Profile Page

**Files:**
- Create: `src/app/(app)/profile/[username]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/(app)/profile/[username]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/social/profile-header";
import { ProfileTabs } from "@/components/social/profile-tabs";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Fetch stats in parallel
  const [
    { count: follower_count },
    { count: following_count },
    { count: cook_count },
    { count: recipe_count },
    { count: cookbook_count },
  ] = await Promise.all([
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("cook_posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("recipes").select("*", { count: "exact", head: true }).eq("created_by", profile.id).eq("is_published", true),
    supabase.from("cookbooks").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "published"),
  ]);

  // Check if current user follows this profile
  const { data: { user } } = await supabase.auth.getUser();
  let isFollowing = false;
  let isOwnProfile = false;

  if (user) {
    isOwnProfile = user.id === profile.id;
    if (!isOwnProfile) {
      const { data: follow } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single();
      isFollowing = !!follow;
    }
  }

  const stats = {
    follower_count: follower_count ?? 0,
    following_count: following_count ?? 0,
    cook_count: cook_count ?? 0,
    recipe_count: recipe_count ?? 0,
    cookbook_count: cookbook_count ?? 0,
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0A0604" }}>
      <ProfileHeader
        profile={profile}
        stats={stats}
        isOwnProfile={isOwnProfile}
        initialIsFollowing={isFollowing}
      />
      <ProfileTabs
        username={profile.username}
        userId={profile.id}
        currentUserId={user?.id}
        initialTab="cooks"
      />
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Navigate to `http://localhost:3002/profile/YOUR_USERNAME`.
- Expected: profile page renders with banner, avatar, stats strip, and Cooks tab
- Test non-existent username: `http://localhost:3002/profile/doesnotexist999` → 404 page

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/profile/[username]/page.tsx"
git commit -m "feat(page): /profile/[username] — public profile page (SSR)"
```

---

## Task 14: Discover — For You / Following Toggle

**Files:**
- Modify: `src/app/(app)/discover/discover-feed-client.tsx`

- [ ] **Step 1: Add the tab toggle and FollowingFeed to DiscoverFeedClient**

At the top of `src/app/(app)/discover/discover-feed-client.tsx`, add the import:

```typescript
import { FollowingFeed } from "@/components/social/following-feed";
```

Inside the `Props` interface, add:
```typescript
currentUserId?: string;
```

In the `DiscoverFeedClient` function signature, destructure `currentUserId`:
```typescript
export function DiscoverFeedClient({
  swipeRecipes,
  trendingRecipes,
  trendingTotal,
  pantryMatches,
  pantryMatchTotal,
  pantryItemCount,
  quickRecipes,
  cuisines,
  gridRecipes,
  gridTotal,
  pantryNames: _pantryNames,
  isLoggedIn,
  currentUserId,
}: Props) {
```

Add a `feedTab` state at the top of the function body (after existing state declarations):
```typescript
const [feedTab, setFeedTab] = useState<"for-you" | "following">("for-you");
```

Then wrap the existing `return (` content. Replace the opening `return (` and first JSX element (the outer `<div>` or `<>`) with:

```tsx
return (
  <div>
    {/* For You / Following toggle */}
    <div className="flex items-center gap-1 px-4 pt-4 pb-2">
      {(["for-you", "following"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setFeedTab(t)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={
            feedTab === t
              ? { background: "#C8956C", color: "#1A0E04" }
              : { background: "transparent", color: "#5A3A24" }
          }
        >
          {t === "for-you" ? "For You" : "Following"}
        </button>
      ))}
    </div>

    {feedTab === "following" ? (
      <div className="px-4 pt-2">
        <FollowingFeed currentUserId={currentUserId} />
      </div>
    ) : (
      <div>
        {/* existing content goes here — move existing JSX inside this div */}
```

Close the new wrapper at the very end of the return statement:
```tsx
      </div>
    )}
  </div>
);
```

- [ ] **Step 2: Pass currentUserId from the Discover server page**

In `src/app/(app)/discover/page.tsx`, update the `DiscoverFeedClient` usage. Find where `<DiscoverFeedClient` is rendered and add `currentUserId={user?.id}`. First, ensure `user` is fetched:

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

Then pass it:
```tsx
<DiscoverFeedClient
  ...existing props...
  currentUserId={user?.id ?? undefined}
/>
```

- [ ] **Step 3: Test**

Open `http://localhost:3002/discover`. You should see "For You" and "Following" pill toggles at the top. Clicking "Following" renders the `FollowingFeed`. Clicking "For You" returns to the existing algorithmic feed.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/discover/discover-feed-client.tsx src/app/(app)/discover/page.tsx
git commit -m "feat(discover): add For You / Following feed tab toggle"
```

---

## Task 15: Wire Share Button into RecipeInteractions

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-interactions.tsx`

- [ ] **Step 1: Add the Share this cook button**

At the top of `src/app/(app)/recipes/[id]/recipe-interactions.tsx`, add imports:

```typescript
import { Share2 } from "lucide-react";
import { CookPostSheet } from "@/components/social/cook-post-sheet";
```

Add props to the `RecipeInteractions` component interface. Find the component's props type and add:

```typescript
recipeId: string;
recipeImageUrl?: string | null;
currentUserId?: string | null;
```

Inside the component function, add state:
```typescript
const [showShareSheet, setShowShareSheet] = useState(false);
```

Find the existing action buttons section (Save/bookmark area) and add the Share button nearby. The exact location will depend on the current layout — add it where the save button row is:

```tsx
{currentUserId && (
  <button
    type="button"
    onClick={() => setShowShareSheet(true)}
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
    style={{ background: "#1A100A", color: "#C8956C", border: "1px solid rgba(180,120,60,0.2)" }}
  >
    <Share2 style={{ width: 15, height: 15 }} />
    Share this cook
  </button>
)}

{showShareSheet && (
  <CookPostSheet
    recipeId={recipeId}
    recipeTitle={recipeTitle}
    recipeImageUrl={recipeImageUrl}
    onClose={() => setShowShareSheet(false)}
  />
)}
```

(Note: `recipeTitle` already exists in the component — check the exact prop name used in the file and use the same.)

- [ ] **Step 2: Pass new props from the recipe page**

In `src/app/(app)/recipes/[id]/page.tsx`, find the `<RecipeInteractions` usage and add:

```tsx
recipeId={recipe.id}
recipeImageUrl={recipe.image_url}
currentUserId={user?.id ?? null}
```

(Ensure `user` is already fetched from `supabase.auth.getUser()` — it should be, for save state.)

- [ ] **Step 3: Test**

Open `http://localhost:3002/recipes/SOME_ID` while logged in. A "Share this cook" button should appear. Clicking it opens the bottom sheet. Fill in an optional note, click "Share with followers" → should POST to `/api/cook-posts` and dismiss.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/recipes/[id]/recipe-interactions.tsx src/app/(app)/recipes/[id]/page.tsx
git commit -m "feat(recipe): add Share this cook button wired to CookPostSheet"
```

---

## Task 16: Wire Share into Cooking Mode Completion

**Files:**
- Modify: `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx`
- Modify: `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx`

- [ ] **Step 1: Add recipeId prop to CookingModeWrapperProps**

In `src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx`, add to the `CookingModeWrapperProps` interface:

```typescript
recipeId: string;
```

Pass it through to `CookingModeScreen`:
```tsx
<CookingModeScreen
  recipeTitle={recipeTitle}
  recipeId={recipeId}          // add this
  ...other existing props...
  onExit={deactivate}
/>
```

- [ ] **Step 2: Extend donePhase to include "share" in cooking-mode-screen.tsx**

Find the `donePhase` state declaration:
```typescript
const [donePhase, setDonePhase] = useState<null | "pantry" | "rating">(null);
```
Change to:
```typescript
const [donePhase, setDonePhase] = useState<null | "pantry" | "rating" | "share">(null);
```

Add `recipeId` to `CookingModeScreenProps` (the interface at the top of the component):
```typescript
recipeId: string;
```

And destructure it in the function:
```typescript
export function CookingModeScreen({
  recipeTitle,
  recipeId,
  ...rest
```

Find the "Submit & finish" button (in the `donePhase === "rating"` block, around line 1353):
```typescript
onClick={async () => {
  if (doneRating > 0) {
    try {
      await fetch(`/api/recipes/${encodeURIComponent(recipeTitle)}/rating`, { ... });
    } catch { /* fire-and-forget */ }
  }
  setDonePhase(null);
  onExit();
}}
```
Change to:
```typescript
onClick={async () => {
  if (doneRating > 0) {
    try {
      await fetch(`/api/recipes/${encodeURIComponent(recipeTitle)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: doneRating }),
      });
    } catch { /* fire-and-forget */ }
  }
  setDonePhase("share");
}}
```

Add the share phase dialog after the rating phase block (after the closing `}` of `donePhase === "rating"`):

```tsx
{/* ── Done dialog — Phase 3: Share ── */}
{donePhase === "share" && (
  <CookPostSheet
    recipeId={recipeId}
    recipeTitle={recipeTitle}
    onClose={() => { setDonePhase(null); onExit(); }}
    onSuccess={() => { setDonePhase(null); onExit(); }}
  />
)}
```

Add the import at the top of the file:
```typescript
import { CookPostSheet } from "@/components/social/cook-post-sheet";
```

Also update the "Skip" button in the rating phase to go to share instead of exiting:
```typescript
onClick={() => {
  setDonePhase("share");
}}
```

- [ ] **Step 3: Pass recipeId from the recipe page**

In `src/app/(app)/recipes/[id]/page.tsx`, find `<CookingModeWrapper` and add:
```tsx
recipeId={recipe.id}
```

- [ ] **Step 4: Test**

Open `http://localhost:3002/recipes/SOME_ID`, enter cooking mode, complete all steps. After the rating dialog, the `CookPostSheet` should open automatically. Skip → dismisses. Share → posts and exits.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/recipes/[id]/cooking-mode-screen.tsx src/app/(app)/recipes/[id]/cooking-mode-wrapper.tsx src/app/(app)/recipes/[id]/page.tsx
git commit -m "feat(cooking-mode): open CookPostSheet after completing a recipe"
```

---

## Task 17: Username Links on RecipeCard and Cookbook Page

**Files:**
- Modify: `src/components/recipe-card.tsx`
- Modify: `src/app/(app)/cookbooks/[slug]/page.tsx` (or equivalent cookbook detail component)

- [ ] **Step 1: Add creator link to RecipeCard**

In `src/components/recipe-card.tsx`, check if `recipe.created_by` and `recipe.profile` (joined username) are in scope. The `Recipe` type in `src/lib/types.ts` has `created_by`. The card currently doesn't show creator attribution — add it.

Add an optional `creatorUsername` prop to `RecipeCardProps`:
```typescript
interface RecipeCardProps {
  recipe: Recipe;
  featured?: boolean;
  rating?: number | null;
  mealPlanMatch?: boolean;
  index?: number;
  wcNationCode?: string;
  creatorUsername?: string;   // add this
}
```

Inside the card JSX, find the bottom area with cuisine/time chips and add (only when `creatorUsername` is present):
```tsx
{creatorUsername && (
  <Link
    href={`/profile/${creatorUsername}`}
    onClick={(e) => e.stopPropagation()}
    className="text-xs mt-1 transition-colors hover:underline"
    style={{ color: "#8A6A4A" }}
  >
    by @{creatorUsername}
  </Link>
)}
```

- [ ] **Step 2: Add creator link to cookbook detail page**

Find the cookbook detail page. It's likely at `src/app/(app)/cookbooks/[slug]/page.tsx`. Search for where `profiles.username` is displayed:

```bash
grep -rn "profiles.*username\|chef.*name\|author" "C:/Users/lasse/Desktop/whatscooking/src/app/(app)/cookbooks" | head -10
```

Wrap any existing username display with a `Link` to `/profile/[username]`:
```tsx
<Link href={`/profile/${cookbook.profiles.username}`} className="text-sm hover:underline" style={{ color: "#C8956C" }}>
  @{cookbook.profiles.username}
</Link>
```

- [ ] **Step 3: Test**

On the Discover page, any recipe with `creatorUsername` passed should show "by @username" linking to their profile. On a cookbook detail page, the author name should link to their profile.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe-card.tsx
git add "src/app/(app)/cookbooks/[slug]/page.tsx"  # or whichever file was modified
git commit -m "feat(wiring): username links on RecipeCard and cookbook detail → /profile/[username]"
```

---

## Task 18: Settings — Share Activity Toggle

**Files:**
- Modify: `src/app/(app)/settings/page.tsx` (or the settings client component)

- [ ] **Step 1: Locate settings page**

```bash
find "C:/Users/lasse/Desktop/whatscooking/src/app/(app)/settings" -type f | head -5
```

- [ ] **Step 2: Add Sharing section**

In the settings page/component, add a new "Sharing" section. Find where other toggle settings are rendered and add:

```tsx
{/* Sharing section */}
<section>
  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#5A3A24" }}>
    Sharing
  </h2>
  <div className="rounded-2xl overflow-hidden" style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}>
    <label className="flex items-start justify-between gap-4 p-4 cursor-pointer">
      <div>
        <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>Share saves to feed</p>
        <p className="text-xs mt-0.5" style={{ color: "#8A6A4A" }}>
          When you save a recipe, it appears in your followers' feeds.
        </p>
      </div>
      <input
        type="checkbox"
        checked={shareActivity}
        onChange={async (e) => {
          const newVal = e.target.checked;
          setShareActivity(newVal);
          await fetch("/api/preferences", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ share_activity: newVal }),
          });
        }}
        className="mt-1 flex-shrink-0"
      />
    </label>
  </div>
</section>
```

Add `shareActivity` state (initialized from fetched preferences):
```typescript
const [shareActivity, setShareActivity] = useState(preferences?.share_activity ?? false);
```

- [ ] **Step 3: Ensure /api/preferences PATCH supports share_activity**

```bash
find "C:/Users/lasse/Desktop/whatscooking/src/app/api/preferences" -name "route.ts" 2>/dev/null || find "C:/Users/lasse/Desktop/whatscooking/src/app/api" -name "route.ts" | xargs grep -l "user_preferences" | head -5
```

Find the preferences PATCH route and verify it passes through `share_activity` to `user_preferences`. If no PATCH route exists for preferences, create `src/app/api/preferences/route.ts`:

```typescript
// src/app/api/preferences/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["share_activity", "dietary_preferences", "favorite_cuisines", "difficulty_level"];
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, ...update });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Test**

Open `http://localhost:3002/settings`. A "Sharing" section should appear. Toggle "Share saves to feed" on. Save a recipe. Check `activity_feed` in Supabase — a `saved` row should appear.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/settings/page.tsx"  # or relevant file
git add src/app/api/preferences/route.ts   # if created
git commit -m "feat(settings): add share_activity toggle in Sharing section"
```

---

## Spec Coverage Self-Review

| Spec requirement | Covered by task |
|---|---|
| `cook_posts` table + RLS | Task 1 |
| `cook_post_likes` table | Task 1 |
| `recipe_comments.post_id` | Task 1 |
| `profiles.username NOT NULL` | Task 1 |
| `user_preferences.share_activity` | Task 1 |
| TypeScript types: CookPost, PublicProfile, ProfileStats | Task 2 |
| GET /api/profiles/[username] | Task 3 |
| POST/DELETE /api/profiles/[username]/follow | Task 4 |
| POST /api/cook-posts + activity_feed side-effect | Task 5 |
| GET /api/feed with cursor pagination + suggested cooks | Task 6 |
| POST/DELETE /api/cook-posts/[id]/likes | Task 7 |
| GET/POST /api/cook-posts/[id]/replies | Task 7 |
| saves route: activity_feed opt-in | Task 8 |
| cookbooks PATCH: activity_feed on publish | Task 8 |
| CookPostCard (activity story style) | Task 9 |
| CookPostSheet (bottom sheet) | Task 10 |
| FollowingFeed (infinite scroll + empty state) | Task 11 |
| ProfileHeader (banner + stats + follow) | Task 12 |
| ProfileTabs (Cooks/Recipes/Cookbooks) | Task 12 |
| GET /api/profiles/[username]/cooks | Task 12 |
| /profile/[username] page (SSR, public, 404) | Task 13 |
| Discover For You / Following toggle | Task 14 |
| RecipeInteractions share button | Task 15 |
| CookingModeWrapper completion → share sheet | Task 16 |
| Username links on RecipeCard + cookbook page | Task 17 |
| Settings share_activity toggle | Task 18 |
| Error cases (404, empty feed, photo failure, self-follow) | Tasks 3–18 (inline) |
