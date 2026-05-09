# Cookbook Feature — Design Spec
**Date:** 2026-05-09  
**Project:** What's Cooking  
**Status:** Approved

---

## Overview

A creator-grade cookbook system that lets users curate recipes into structured, shareable, optionally-paid collections. Cookbooks are the primary vehicle for a marketplace ecosystem — creators build audiences, readers discover content, and the platform earns on paid transactions (Stripe wired later).

Cookbooks are not "saved recipe lists." They are editorial publications with chapters, rich text, and visual customization — closer to a digital magazine than a playlist.

---

## Data Model

### `cookbooks`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | Creator |
| `title` | text | |
| `description` | text | |
| `cover_image_url` | text | Uploaded or picked from recipes |
| `theme_color` | text | Hex, tints overlay + chapter headers + CTAs |
| `title_font` | text | `serif` \| `sans` \| `script` |
| `tagline` | text | 1 line shown under title on cover |
| `price` | numeric(10,2) | 0.00 = free |
| `status` | text | `draft` \| `published` |
| `slug` | text unique | URL-safe, e.g. `weeknight-wins` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `cookbook_chapters`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `cookbook_id` | uuid FK → cookbooks | |
| `title` | text | |
| `intro_text` | text | Rich text (stored as HTML) |
| `cover_image_url` | text | Optional; falls back to first recipe image |
| `position` | int | Drag-to-reorder |

### `cookbook_recipes`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `chapter_id` | uuid FK → cookbook_chapters | |
| `cookbook_id` | uuid FK → cookbooks | Denormalized for simpler queries |
| `recipe_id` | uuid FK → recipes | |
| `position` | int | Within chapter |
| `chef_note` | text | Creator's note, max 280 chars |
| `creator_meal_photo_url` | text | Creator's own photo of the dish |

### `cookbook_purchases`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | Buyer |
| `cookbook_id` | uuid FK → cookbooks | |
| `purchased_at` | timestamptz | |
| `amount_paid` | numeric(10,2) | 0.00 for free unlocks |

### `cookbook_meal_photos` (UGC)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `cookbook_id` | uuid FK → cookbooks | |
| `recipe_id` | uuid FK → recipes | |
| `user_id` | uuid FK → profiles | Reader who cooked it |
| `photo_url` | text | |
| `caption` | text | |
| `is_featured` | boolean | Creator can pin one per recipe |
| `is_flagged` | boolean | Moderation |
| `reported_at` | timestamptz | |
| `created_at` | timestamptz | |

---

## Routes

| Route | Purpose |
|---|---|
| `/cookbooks` | Discovery feed — browseable grid, filters, sort |
| `/cookbooks/[slug]` | Public cookbook page — cover, chapters, purchase CTA |
| `/cookbooks/[slug]/chapter/[chapterId]` | Chapter view — recipes, chef notes, meal photos |
| `/cookbooks/new` | Multi-step creator builder |
| `/cookbooks/[slug]/edit` | Same builder in edit mode |
| `/profile/[username]/cookbooks` | Creator's public cookbook shelf |
| `/dashboard` | "My Cookbooks" widget added |

---

## Creator Builder (Multi-Step Wizard)

**Step 1 — Cover Design**
- Upload or select cover image (picker shows images from recipes already added)
- Theme color: 6 presets + custom hex input
- Title font: Serif / Sans / Script (live preview)
- Title + tagline fields

**Step 2 — Chapters**
- Add/remove/reorder chapters (drag handle)
- Per chapter: title, optional cover image, intro rich text (bold, italic, h2, h3, links — toolbar, not raw markdown)

**Step 3 — Recipes**
- Per chapter: search + add recipes from the platform's recipe DB
- Per recipe: drag to reorder within chapter, write chef note (280 char), upload creator meal photo

**Step 4 — Pricing & Publish**
- Price input (0.00 = free label shown)
- Paid cookbooks: chapter 1 always free to preview, rest locked
- Publish / Save as Draft

---

## Public Cookbook Page (`/cookbooks/[slug]`)

- Full-bleed cover (image + color tint overlay + title + tagline + creator avatar)
- Chapter list with recipe count previews
- "Get Cookbook" CTA (shows price or "Free")
- Soft auth gate for non-authenticated visitors after chapter 1 preview
- "Made it?" reader meal photos gallery at bottom (UGC)
- Social share: OG meta tags generated from cover image, title, creator name
- "Clone cookbook" button (free cookbooks only) — forks to user's shelf with attribution

---

## Discovery Feed (`/cookbooks`)

- Image-dominant card grid: cover photo, title, creator avatar + name, price badge, recipe count
- Filters: cuisine tag, dietary tag, price (free / paid / all)
- Sort: Newest / Trending (views + saves + purchases, 7-day window)
- Trending score computed column or nightly function — TBD at implementation

---

## Customization System

| Element | Options |
|---|---|
| Cover image | Upload or pick from cookbook's recipe images |
| Theme color | 6 presets + custom hex |
| Title font | Serif, Sans, Script |
| Tagline | 1-line text field |
| Chapter cover image | Upload (optional) |
| Chapter intro | Rich text toolbar (bold, italic, h2, h3, link) |
| Chef note per recipe | Plain text, 280 char max, styled callout card |
| Creator meal photo | Upload per recipe entry |

---

## Reader Meal Photos (UGC)

- Any authenticated user with cookbook access can upload a photo per recipe
- Shown in "Made it?" gallery on the recipe within the cookbook chapter view
- Creator can feature/pin one photo per recipe (`is_featured`)
- Flagging: `is_flagged` + `reported_at` for moderation
- Unmoderated UGC never shown to unauthenticated users

---

## Seed Cookbooks (3 creator-style)

All seeded with a fake creator profile to model UGC tone.

### "Weeknight Wins" by @sophiakitchen
- Theme: warm amber, serif font
- Chapters: "Under 30 Minutes", "One Pan Wonders", "Fridge Cleaners"
- ~12 recipes from existing DB, casual home-cook chef notes
- 2–3 seeded reader meal photos

### "Plant & Proud" by @greenplateco
- Theme: sage green, sans font
- Chapters: "Morning Bowls", "Hearty Mains", "Snacks That Slap"
- ~10 vegan/vegetarian recipes, substitution-tip notes
- 2–3 seeded reader meal photos

### "Fire & Smoke" by @pitmaster_lars
- Theme: deep charcoal + orange, serif font
- Chapters: "The Rubs & Marinades", "Low & Slow", "Sides Worth Making"
- ~8 BBQ/grilling recipes, technique-heavy notes
- 2–3 seeded reader meal photos

---

## Marketplace & Monetization

- Price editable post-publish (creators can run "free for a week" promos)
- `cookbook_purchases` tracks `amount_paid` — Stripe integration slot is clear, not wired yet
- Creator dashboard widget: views, saves, purchases, revenue (revenue shows $0 until Stripe)
- All cookbooks free at launch; paid infrastructure ready to activate

---

## Access Control (RLS)

- `cookbooks`: anyone can read `published`; owner can read/write drafts
- `cookbook_chapters` / `cookbook_recipes`: readable if cookbook is published OR user owns it
- `cookbook_purchases`: user can read own rows; insert on purchase
- `cookbook_meal_photos`: authenticated users can insert; readable if cookbook is accessible; `is_flagged` rows hidden from non-owners

---

## Out of Scope (This Spec)

- Stripe payment processing
- Email notifications (new purchase, new meal photo)
- Cookbook comments/reviews
- Co-creator / collab authoring
- Mobile-native deep links
