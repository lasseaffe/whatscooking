# Image Controls: Crop + Chevron Switching
**Date:** 2026-05-12  
**Status:** Approved  
**Scope:** What's Cooking (primary) + VenturePath Supabase sync addition

---

## Context

WC stores a single `image_url` per recipe. There is no way for admins/creators to manually fix a bad image crop or switch to a better image variant. VenturePath has this feature (inline per-component), but it only persists to localStorage and lacks Supabase sync. This spec adds a consistent crop + chevron system across all image surfaces in WC, and retrofits Supabase persistence into VP's existing crop feature.

---

## Architecture

### Provider (global, single instance)
**`src/providers/image-controls-provider.tsx`**

Wraps the app layout once. Holds a single `cropEditorTarget` in React context:
```ts
type CropEditorTarget = {
  entityId: string
  entityType: 'recipe' | 'cookbook' | 'chapter'
  imageUrl: string
  images: string[]   // full array for this entity
}
```
When `cropEditorTarget` is non-null, renders `CropEditorModal`. Exposes `openCropEditor(target)` and `closeCropEditor()` via context.

### Hook
**`src/hooks/use-image-controls.ts`**

```ts
useImageControls(
  entityId: string,
  entityType: 'recipe' | 'cookbook' | 'chapter',
  images: string[]
) => {
  currentIndex: number
  currentUrl: string
  cropPos: { x: number; y: number }   // live (localStorage → Supabase)
  goPrev: () => void
  goNext: () => void
  openCropEditor: () => void          // calls context
}
```

On mount: read localStorage key `wc-img-prefs::{entityId}::{imageUrl}`, then fire `GET /api/image-prefs?entityId=...` to hydrate from Supabase (updates state when response arrives).

### Wrapper component
**`src/components/image-with-controls.tsx`**

Props:
```ts
{
  images: string[]
  entityId: string
  entityType: 'recipe' | 'cookbook' | 'chapter'
  size: 'full' | 'card' | 'small'
  className?: string
  style?: React.CSSProperties
  // ...remaining img props forwarded
}
```

Renders:
- `<img>` (or Next.js `<Image>`) with `objectPosition: "${cropPos.x}% ${cropPos.y}%"`
- Left/right chevron buttons — `opacity-0 group-hover:opacity-100`, absolute at vertical center
- Dot indicators at bottom-center (hidden for `size="small"`)
- Crop icon top-right (admin/creator only, hidden for `size="small"`)

### Global modal
**`src/components/crop-editor-modal.tsx`**

- Full-screen backdrop `rgba(0,0,0,0.85)`
- Image rendered at `max 90vw × 80vh`, `object-fit: cover`
- `objectPosition` updates live during drag (both X and Y axes)
- "DRAG TO REFRAME" label fades after first drag movement
- Dashed amber `#F59E0B` border on the image container during drag
- Bottom toolbar: **Cancel** (ghost) | **Save** (filled amber)
- On Save: write localStorage → fire POST `/api/image-prefs` (fire-and-forget)

#### Drag math (both axes)
```ts
const dx = ((e.clientX - origin.mouseX) / rect.width)  * 100
const dy = ((e.clientY - origin.mouseY) / rect.height) * 100
x = clamp(0, 100, origin.startX - dx)
y = clamp(0, 100, origin.startY - dy)
```

---

## Data Model

### WC — DB migrations

**Migration 1:** Add image array to recipes
```sql
ALTER TABLE recipes ADD COLUMN image_urls text[] DEFAULT '{}';
```

**Migration 2:** Crop position preferences
```sql
CREATE TABLE recipe_image_prefs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id   uuid NOT NULL REFERENCES recipes ON DELETE CASCADE,
  image_url   text NOT NULL,
  x           float8 NOT NULL DEFAULT 50,
  y           float8 NOT NULL DEFAULT 50,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id, image_url)
);
-- RLS: select/insert/update own rows only
```

### localStorage (optimistic)
Key: `wc-img-prefs::{entityId}::{imageUrl}` → `{ x: number, y: number }`  
Written on Save before Supabase round-trip completes.

### VP — Supabase addition
New table in VP's Supabase project:
```sql
CREATE TABLE expedition_image_prefs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  expedition_id   text NOT NULL,
  image_url       text NOT NULL,
  x               float8 NOT NULL DEFAULT 50,
  y               float8 NOT NULL DEFAULT 40,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, expedition_id, image_url)
);
```
VP's `useImagePositions.js` gets a `syncToSupabase(expeditionId, imageUrl, pos)` call added to `setPos()` (fire-and-forget), and a `loadFromSupabase(expeditionId)` call on mount.

---

## API Routes (WC)

### `GET /api/image-prefs?entityType=recipe|cookbook|chapter&entityId=...`
Returns all prefs rows for the current user + entity.  
Auth: any authenticated user (reads own prefs).

### `POST /api/image-prefs`
Body: `{ entityType: 'recipe' | 'cookbook' | 'chapter', entityId: string, imageUrl: string, x: number, y: number }`  
Auth: admin/creator role only (session check against user `role` column + RLS policy).  
Action: upsert on `(user_id, entity_type, entity_id, image_url)`.

> **Note:** The DB migration above uses a `recipe_id` FK for simplicity. The route normalizes `entityType + entityId` to the appropriate FK column, or we can generalize the table to `entity_type text + entity_id uuid` without FK constraints for flexibility across entity types.

---

## Integration — Components to Wrap

| Component | File | Size param |
|---|---|---|
| `RecipeHeroImage` | `src/app/(app)/recipes/[id]/recipe-hero-image.tsx` | `full` |
| `RecipeCard` | `src/components/recipe-card.tsx` | `card` |
| `SwipeCards` (card + preview) | `src/components/swipe/swipe-cards.tsx` | `card` |
| `CookbookCover` | `src/components/cookbook-cover.tsx` | `card` |
| Chapter page image | `src/app/(app)/cookbooks/[slug]/chapter/[chapterId]/page.tsx` | `card` |
| `MealPhotoGallery` | `src/components/meal-photo-gallery.tsx` | `small` |
| `QuickEasySection` | `src/app/(app)/discover/quick-easy-section.tsx` | `small` |
| `SavedClient` | `src/app/(app)/saved/saved-client.tsx` | `card` |
| `SavedRecipeFit` | `src/app/(app)/plans/[id]/saved-recipe-fit.tsx` | `small` |

---

## Playwright Tests
**File:** `tests/image-controls.spec.ts`

Seed: test recipe row with `image_urls = [url1, url2, url3]`, known `recipe_id`.

1. **Chevron navigation** — verify img src cycles through array, wraps around
2. **Crop modal open/close** — crop icon click → modal visible; Cancel → modal gone, no change
3. **Crop drag + save** — synthesize mousedown/mousemove/mouseup on modal image → Save → verify `objectPosition` updated, localStorage key written
4. **Crop persistence** — reload page → verify `objectPosition` matches saved value
5. **Supabase sync** — intercept network → verify POST `/api/image-prefs` fired after Save
6. **Admin gate** — log out → crop icon not visible; chevrons still visible

---

## Build Order

1. DB migrations (both WC and VP)
2. `use-image-controls.ts` hook + localStorage layer
3. `ImageControlsProvider` + context
4. `CropEditorModal` (2D drag, save/cancel)
5. `ImageWithControls` wrapper
6. Add `POST /api/image-prefs` + `GET /api/image-prefs` routes
7. Wrap all 9 WC components
8. VP: add Supabase sync to `useImagePositions.js`
9. Playwright test suite
