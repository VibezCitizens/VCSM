# VCSM VPORT Menu Pipeline

> **Version:** 1
> **Created:** 2026-04-16
> **Scope:** `vport.*` menu tables, DAL layer, RLS, owner mutations, public read, optimistic UI

---

## 1. Purpose

The VPORT menu system lets restaurant/food VPORTs manage a structured menu of categories and items visible on their public profile. Owners can create, edit, and delete categories and items in real time. The public can browse the menu without authentication.

---

## 2. Scope

**In scope:**
- `vport.menu_categories` — category rows per VPORT profile
- `vport.menu_items` — item rows per category
- `vport.menu_item_media` — media attachments per item
- Owner management DAL, controllers, and hooks under `features/profiles/kinds/vport`
- Public read DAL under `features/public/vportMenu`
- Optimistic UI in `VportActorMenuManagePanel`

**Out of scope:**
- Ordering/cart — not implemented
- External-facing menu API (Tripoint integration reads public details, not menu directly)

---

## 3. Ownership

**Application Scope:** VCSM  
**Code Roots:** `apps/VCSM/src/features/profiles/kinds/vport/`, `apps/VCSM/src/features/public/vportMenu/`  
**Schema:** `vport`  
**Identity anchor:** `vport.profiles.actor_id` → `vc.actors`

---

## 4. Database Schema

### `vport.menu_categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid | FK → `vport.profiles.id` |
| `key` | text | optional slug (user-provided or auto) |
| `name` | text | display name |
| `description` | text | optional |
| `sort_order` | integer | display order |
| `is_active` | boolean | hidden from public when false |
| `meta` | jsonb | reserved |

### `vport.menu_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid | FK → `vport.profiles.id` |
| `category_id` | uuid | FK → `vport.menu_categories.id` |
| `key` | text | optional slug |
| `name` | text | display name |
| `description` | text | optional |
| `price_cents` | integer | price in cents |
| `currency_code` | text | default `USD` |
| `image_url` | text | primary image URL |
| `sort_order` | integer | display order |
| `is_active` | boolean | hidden from public when false |
| `meta` | jsonb | reserved |

### `vport.menu_item_media`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid | FK → `vport.profiles.id` |
| `item_id` | uuid | FK → `vport.menu_items.id` |
| `url` | text | media URL |
| `kind` | text | `image` / `video` |
| `sort_order` | integer | display order |
| `is_active` | boolean | |

**Key invariant:** All three tables are keyed by `profile_id`, NOT `actor_id`. To resolve actor_id → profile_id use `vport.profiles WHERE actor_id = ?`.

---

## 5. RLS Status (as of 2026-04-18)

### Public Read — via view (anon + authenticated)

Public menu reads are served through `vport.public_menu_read_model_v` — a view that joins `vport.profiles`, `vport.profile_public_details`, `vport.menu_categories`, and `vport.menu_items` with the active/non-deleted filters baked in.

```sql
GRANT SELECT ON vport.public_menu_read_model_v TO anon;
GRANT SELECT ON vport.public_menu_read_model_v TO authenticated;
```

Views created by `postgres` bypass RLS on underlying tables. `anon` never touches the raw tables directly. This eliminates the need for anon SELECT policies on individual tables.

**Key invariant:** Grants must be reapplied after every `DROP` + `CREATE` of the view.

### Write Policies — authenticated owner (profile_public_details, menu_categories, menu_items)

All write policies use inline `auth.uid()` — no SECURITY DEFINER helpers.

`vport.profile_public_details`:
```sql
-- INSERT
EXISTS (SELECT 1 FROM vport.profiles p WHERE p.id = profile_id AND p.owner_user_id = (SELECT auth.uid()) AND p.is_deleted = false)
-- UPDATE (USING + WITH CHECK both use same expression)
```

`vport.menu_categories` and `vport.menu_items`:
```sql
-- FOR ALL (owner)
EXISTS (SELECT 1 FROM vport.profiles p WHERE p.id = profile_id AND p.owner_user_id = (SELECT auth.uid()))
```

### Authenticated read — profiles table

`vport.profiles` has a SELECT policy for `authenticated` that allows reading:
- Active non-deleted profiles (public read)
- Own profile (owner reads their profile even if inactive)

```sql
USING (
  (is_active = true AND is_deleted = false)
  OR owner_user_id = (SELECT auth.uid())
)
```

---

## 6. Owner Management DAL Layer

All owner DAL files live under:
`apps/VCSM/src/features/profiles/kinds/vport/dal/menu/`

### Pattern: actor_id → profile_id resolution
Because `menu_categories` and `menu_items` use `profile_id` (not `actor_id`), every write DAL resolves the profile first:

```js
async function resolveProfileId(actorId) {
  const { data } = await vportSchema.from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}
```

### Read DALs — actor_id join
`readVportActorMenuCategoryDAL` and `readVportActorMenuItemDAL` use a PostgREST foreign table embed to return `actor_id` on the row:

```js
.select("id,profile_id,...,profiles!inner(actor_id)")
```
The `profiles` join is then flattened: `{ ...rest, actor_id: data.profiles?.actor_id ?? null }`.

**Why:** Controllers check `entity.actor_id !== actorId` for ownership enforcement. Without the join, `actor_id` was always `undefined` and the check always threw.

### DAL files
| File | Responsibility |
|---|---|
| `createVportActorMenuCategory.dal.js` | Insert category, resolves actor → profile |
| `updateVportActorMenuCategory.dal.js` | Patch category by id |
| `deleteVportActorMenuCategory.dal.js` | Soft or hard delete by id |
| `listVportActorMenuCategories.dal.js` | List all categories for actorId |
| `readVportActorMenuCategories.dal.js` | Read single category by id, returns actor_id via join |
| `createVportActorMenuItem.dal.js` | Insert item, resolves actor → profile |
| `updateVportActorMenuItem.dal.js` | Patch item by id |
| `deleteVportActorMenuItem.dal.js` | Delete item by id |
| `listVportActorMenuItems.dal.js` | List items for actorId (+ optional categoryId filter) |
| `readVportActorMenuItems.dal.js` | Read single item by id, returns actor_id via join |

---

## 7. Owner Controller Layer

`apps/VCSM/src/features/profiles/kinds/vport/controller/menu/`

| Controller | Responsibility |
|---|---|
| `saveVportActorMenuCategory.controller.js` | Create or update a category. UPDATE flow: reads existing, verifies `actor_id`, patches. CREATE flow: delegates to create DAL. |
| `saveVportActorMenuItem.controller.js` | Create or update an item. Validates category exists and `category.actor_id === actorId` before writing. |
| `deleteVportActorMenuCategory.controller.js` | Deletes category after ownership check. |
| `deleteVportActorMenuItem.controller.js` | Deletes item after ownership check. |
| `getVportActorMenu.controller.js` | Reads full menu (categories + items grouped) for owner view. |

**Ownership check pattern:**
Controllers call `readVportActorMenuCategoriesDAL` or `readVportActorMenuItemsDAL` which now return `actor_id` via the profiles join. The check `entity.actor_id !== actorId` is the app-layer guard. RLS is the DB-layer guard.

---

## 8. Owner Hook Layer

`apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/`

| Hook | Responsibility |
|---|---|
| `useVportActorMenu.js` | Loads menu state. Exposes `categories`, `loading`, `error`, `refresh`, `patchMenu`. |
| `useVportActorMenuCategoriesMutations.js` | Owns saving/deleting categories with UI state (`saving`, `deleting`, `error`). |
| `useVportActorMenuItemsMutations.js` | Owns saving/deleting items with UI state. |

### `patchMenu`
`useVportActorMenu` exposes a `patchMenu(updater)` function that directly updates the in-memory menu state. Used for optimistic UI without requiring a refetch.

---

## 9. Optimistic UI — Item Creation

When the owner creates a new item, it appears in the list **immediately** before the DB confirms:

**Location:** `VportActorMenuManagePanel.jsx` → `handleSaveItem`

**Flow:**
1. On CREATE (no `itemId`): build a temp item with `id = _opt_${Date.now()}`, `_optimistic: true`
2. Call `patchMenu` to inject it into the correct category's `items` array
3. Fire `itemsMut.saveItem(payload)` to the DB
4. On success: `onSuccess → refresh()` replaces the temp item with the real DB row
5. On error: `refresh()` reverts the list to DB state and throws so the form can display the error

**Pattern:** optimistic-inject → DB write → full refresh (not partial replace). The temp id is discarded; the refresh cycle brings the canonical row.

---

## 10. Public Read DAL

`apps/VCSM/src/features/public/vportMenu/dal/`

### Architecture

All public menu reads now go through `vport.public_menu_read_model_v` — a single view query replaces the previous multi-step resolution pattern. The view is accessible to `anon` via GRANT on the view (not on underlying tables).

### `readVportPublicMenuRpcDAL`

Single query against the view, filtered by `actor_id`:

```js
supabase.schema("vport").from("public_menu_read_model_v").select("*").eq("actor_id", actorId)
```

Returns `{ ok, actor_id, rows: data }`. The model's `mapFromJoinedViewRows` deduplicates categories and items from the flat row array.

### `readVportPublicDetailsRpcDAL`

Single query against the view (limit 1), selects only profile + details columns:

```js
supabase.schema("vport").from("public_menu_read_model_v")
  .select("profile_id,actor_id,profile_slug,profile_name,profile_bio,profile_avatar_url,profile_banner_url,public_menu_url,location_text,logo_url,website_url,phone_public,email_public,address,lat,lng,social_links,hours,booking_url")
  .eq("actor_id", actorId).limit(1).maybeSingle()
```

Returns `{ ok, actor_id, details: row }`.

### `resolveMenuSlugDAL` (NEW — 2026-04-18)

`apps/VCSM/src/features/public/vportMenu/dal/resolveMenuSlug.dal.js`

Resolves a slug → actorId specifically for the public menu page. Queries the view (anon-accessible) instead of `vport.profiles` directly (which anon cannot read). 10-minute TTL cache.

**Why this exists instead of the generic `resolveActorBySlugOrUsernameDAL`:**
The generic DAL queries `vport.profiles` directly — anon has no grant on that table. The menu-specific DAL uses the view, which is anon-accessible. It only resolves slugs for vports that have at least one active menu category + item (by design — if there's no menu, the page should show "Menu not found.").

### View — `vport.public_menu_read_model_v`

```sql
SELECT
  vp.id AS profile_id, vp.actor_id, vp.slug AS profile_slug,
  vp.name AS profile_name, vp.bio AS profile_bio,
  vp.avatar_url AS profile_avatar_url, vp.banner_url AS profile_banner_url,
  ('/profile/' || vp.slug || '/menu') AS public_menu_url,
  ppd.location_text, ppd.logo_url, ppd.website_url, ppd.phone_public,
  ppd.email_public, ppd.address, ppd.lat, ppd.lng, ppd.social_links,
  ppd.hours, ppd.booking_url,
  mc.id AS menu_category_id, mc.key AS menu_category_key,
  mc.name AS menu_category_name, mc.description AS menu_category_description,
  mc.sort_order AS menu_category_sort_order, mc.meta AS menu_category_meta,
  mi.id AS menu_item_id, mi.category_id AS menu_item_category_id,
  mi.key AS menu_item_key, mi.name AS menu_item_name,
  mi.description AS menu_item_description, mi.price_cents, mi.currency_code,
  mi.image_url, mi.sort_order AS menu_item_sort_order, mi.meta AS menu_item_meta
FROM vport.profiles vp
LEFT JOIN vport.profile_public_details ppd ON ppd.profile_id = vp.id
JOIN vport.menu_categories mc ON mc.profile_id = vp.id
JOIN vport.menu_items mi ON mi.profile_id = vp.id AND mi.category_id = mc.id
WHERE vp.is_active = true AND vp.is_deleted = false
  AND mc.is_active = true AND mi.is_active = true;
```

**Column naming convention:** Profile fields use `profile_*` prefix. Category fields use `menu_category_*` prefix. Item fields use `menu_item_*` prefix. The model mappers handle both the view prefixes and legacy bare names.

**`public_menu_url` field:** The canonical menu URL (`/profile/:slug/menu`) is computed inside the view — the DAL does not construct it in JS.

---

## 11. Rules / Invariants

1. All menu writes must include a valid `profile_id` that `auth.uid()` owns — RLS enforces this at DB level
2. `actor_id` is never stored on menu tables — always resolved via `vport.profiles` join
3. `vc_public` schema does not exist — do not add any DALs querying it
4. The public DAL must check `is_active = true AND is_deleted = false` on `vport.profiles` before serving menu to public
5. Optimistic items carry `_optimistic: true` flag — rendering logic must not persist or submit them as real IDs
6. RLS write policies must use **inline** `auth.uid()` in the policy body — never via SECURITY DEFINER helper functions on these tables

---

## 12. Failure Risks

1. **PostgREST schema cache lag** — after DB grant changes, send `NOTIFY pgrst, 'reload schema'` to avoid stale permission cache
2. **SECURITY DEFINER + auth.uid()** — helper functions called from RLS WITH CHECK clauses may shadow `auth.uid()` in some Supabase configurations — always inline the check directly for write policies
3. **`profiles!inner` join in read DALs** — if the FK relationship name changes (e.g. after migration), the `!inner` embed may fail silently and return null for `actor_id`, breaking ownership checks
4. **Optimistic temp IDs** — if a component uses the item `id` to key a DB lookup before `refresh()` completes, it will get a 404 for the temp id
5. **Orphaned items** — deleting a category does not cascade-delete its items unless a DB FK cascade is set

---

## 13. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/` | Owner CRUD DALs |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal.js` | Menu dedup check (`hasRecentMenuUpdatePostDAL`) + restaurant name resolution (`resolveVportRestaurantNameDAL`) for feed share |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/` | Owner controllers with app-level ownership enforcement |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` | Publishes `post_type = menu_update` to the public feed on item/category save; 1-hour dedup, non-blocking, uses `resolvePublicRealmIdDAL` |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/usePublishMenuPost.js` | Thin hook wrapping `publishMenuUpdateAsPostController`; consumed by `VportActorMenuManagePanel` |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/useVportActorMenu.js` | Menu state, refresh, patchMenu |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations.js` | Item save/delete UI state |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js` | Category save/delete UI state |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel.jsx` | Owner management panel — optimistic UI lives here |
| `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js` | Single query against `public_menu_read_model_v` view |
| `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js` | Single query against `public_menu_read_model_v` view (limit 1) |
| `apps/VCSM/src/features/public/vportMenu/dal/resolveMenuSlug.dal.js` | Anon-safe slug → actorId resolution via view |
| `apps/VCSM/src/features/public/vportMenu/screen/VportPublicMenuBySlugScreen.jsx` | Public menu screen — uses resolveMenuSlugDAL |
| `apps/VCSM/src/features/public/vportMenu/model/vportPublicMenu.model.js` | Public menu normalization |
| `apps/VCSM/src/features/public/vportMenu/model/vportPublicDetails.model.js` | Public details normalization |

---

## 15. Canonical Menu URL System

Updated: 2026-04-19

### Canonical URL Shapes
```
/profile/:slug/menu       — public menu page
/profile/:slug/menu/qr    — QR code screen
```
`slug` = the actor's canonical slug (e.g. `yankee-gasolina-laredo-tx`), resolved via `buildActorCanonicalSlugController(actorId)`.

### URL Generation — QR View
`VportPublicMenuQrView` (`features/public/vportMenu/view/VportPublicMenuQrView.jsx`) uses `useActorCanonicalSlug(actorId)` to resolve the slug, then builds:
```js
`${window.location.origin}/profile/${canonicalSlug}/menu`
```
Fallback to `/m/${actorId}` only while slug is still loading.

**Note:** `VportActorMenuQrView` and its wrapper `VportActorMenuQrScreen` (in `features/dashboard/qrcode/menu/`) were confirmed dead code — the router never imported them. Both files were deleted on 2026-04-18.

### URL Generation — Flyer
`VportActorMenuFlyerView` uses the same `useActorCanonicalSlug(actorId)` pattern — slug-based URL with the same fallback.

### Public Screen — Menu Slug Route
`VportPublicMenuBySlugScreen` (`/profile/:slug/menu`):
- Reads `:slug` from URL params
- Calls `resolveMenuSlugDAL(slug)` directly — queries `public_menu_read_model_v` (anon-safe, no raw `vport.profiles` access)
- Shows nothing (null) while slug is resolving — no loading flash
- Renders `<VportPublicMenuView actorId={resolvedActorId} />` once resolved
- Shows "Menu not found." if the view returns no match (vport either has no menu or does not exist)
- Does NOT use `useResolveActorBySlug` — that DAL queries `vport.profiles` directly which anon cannot read

### Public Screen — QR Slug Route
`VportPublicMenuQrBySlugScreen` (`/profile/:slug/menu/qr`):
- Same pattern as `VportPublicMenuBySlugScreen` — resolves slug via `resolveMenuSlugDAL`
- Renders `<VportPublicMenuQrView actorId={resolvedActorId} />` once resolved
- Shows "Menu not found." if slug does not resolve

### Legacy Redirect — `/m/:actorId`
`VportPublicMenuRedirectScreen` resolves the canonical slug via `buildActorCanonicalSlugController(actorId)` and redirects to `/profile/${canonicalSlug}/menu`. Falls back to `/actor/${actorId}/menu` only if slug resolution fails.

### Legacy Redirect — `/actor/:actorId/menu`
`VportPublicMenuScreen` calls `useActorCanonicalSlug(actorId)`. Once slug resolves, issues `<Navigate to={/profile/${canonicalSlug}/menu} replace />`. While loading, renders menu content (no flash).

### Legacy Redirect — `/actor/:actorId/menu/qr`
`VportPublicMenuQrScreen` calls `useActorCanonicalSlug(actorId)`. Once slug resolves, issues `<Navigate to={/profile/${canonicalSlug}/menu/qr} replace />`. While loading, renders QR view (no flash).

### Dashboard Entry Points
`VportDashboardScreen` `openQr` and `openOnlineMenuPreview` resolve the slug from `dashboardDetails.slug` (sourced from `vport.profiles.slug`) and navigate directly to the canonical slug URL. Fall back to actor-based paths only when the slug field is empty.

### Manage Header Entry Point
`VportActorMenuManageHeader` uses `useActorCanonicalSlug(actorId)` to resolve the canonical slug. The QR button navigates to `/profile/${canonicalSlug}/menu/qr` once resolved, falling back to `/actor/${actorId}/menu/qr`.

### Hard Rule
Raw UUIDs (`actorId`, `profileId`) must never appear in public-facing URLs. All public menu entry points (QR, Open Menu, Copy Link, share links, dashboard buttons) must use the canonical slug URL.

---

## 16. Public Reviews Pipeline

> Added: 2026-05-11. Documents the anon-safe review loading system inside the public menu feature.

### Overview

The public menu exposes a full review surface — summary, paginated card list, and per-dimension ratings — to unauthenticated visitors. This is completely separate from the authenticated owner review pipeline under `features/profiles/kinds/vport/`. It uses its own DB views, DAL files, model, controller, and hook.

**Key architectural rule:** All queries go directly against `reviews.*` schema views via PostgREST — no RPC wrapper. This eliminates any risk of column name collision between view columns and SQL output parameters.

---

### DB Views (reviews schema)

Three views power the public review surface. All three grant SELECT to `anon` and `authenticated`. Backing tables (`reviews.reviews`, `reviews.review_ratings`, `reviews.review_dimensions`) each have permissive anon SELECT RLS policies.

| View | Key | Purpose |
|---|---|---|
| `reviews.public_vport_review_summary_v` | `target_actor_id` | Aggregate per VPORT: `review_count`, `average_rating`, `first_review_at`, `last_review_activity_at` |
| `reviews.public_vport_reviews_v` | `target_actor_id` | Active non-deleted review cards with author snapshot columns, ordered by `review_activity_at DESC` |
| `reviews.public_vport_review_dimensions_v` | `target_actor_id` | Active dimensions for the VPORT's type with per-dimension `rating_count` and `average_rating`, ordered by `sort_order` |

---

### DAL Layer

All three DALs use `supabase.schema("reviews").from("<view>")` — direct view queries, no RPC.

**`readPublicVportReviewSummaryDAL(targetActorId)`**
- File: `features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js`
- View: `reviews.public_vport_review_summary_v`
- Select: `target_actor_id, review_count, average_rating, first_review_at, last_review_activity_at`
- Filter: `.eq("target_actor_id", targetActorId).maybeSingle()`
- Cache: 60s TTL keyed on `targetActorId`
- Returns: raw row or `null` when no reviews exist

**`readPublicVportReviewsDAL(targetActorId, { limit, cursor })`**
- File: `features/public/vportMenu/dal/readPublicVportReviews.dal.js`
- View: `reviews.public_vport_reviews_v`
- Select: `review_id, target_actor_id, author_actor_id, verification_status, overall_rating, body, author_display_name_snapshot, author_username_snapshot, author_avatar_url_snapshot, review_activity_at, created_at`
- Filter: `.eq("target_actor_id", targetActorId).order("review_activity_at", { ascending: false }).limit(limit + 1)`
- Cursor: `.lt("review_activity_at", cursor)` for pagination
- Cache: none — paginated results always fresh
- Returns: `{ rows, hasMore }` — fetches `limit + 1` rows to detect next page

**`readPublicVportReviewDimensionsDAL(targetActorId)`**
- File: `features/public/vportMenu/dal/readPublicVportReviewDimensions.dal.js`
- View: `reviews.public_vport_review_dimensions_v`
- Select: `target_actor_id, dimension_id, dimension_key, dimension_label, sort_order, rating_count, average_rating`
- Filter: `.eq("target_actor_id", targetActorId).order("sort_order", { ascending: true })`
- Cache: 60s TTL keyed on `targetActorId`
- Returns: array of raw rows (empty array when no dimensions)

---

### Model Layer

File: `features/public/vportMenu/model/vportPublicReviews.model.js`

| Function | Input | Output |
|---|---|---|
| `normalizePublicReviewSummary(raw)` | Raw summary row or null | `{ reviewCount, averageRating, firstReviewAt, lastReviewActivityAt }` — safe defaults when null |
| `normalizePublicReviewCard(raw)` | Single review row | `{ id, targetActorId, authorActorId, verificationStatus, overallRating, body, authorDisplayName, authorUsername, authorAvatarUrl, reviewActivityAt, createdAt }` |
| `normalizePublicReviewCards(rows)` | Array of raw rows | Array of normalized cards, null-filtered |
| `normalizePublicReviewDimension(raw)` | Single dimension row | `{ id, key, label, sortOrder, ratingCount, averageRating }` |
| `normalizePublicReviewDimensions(rows)` | Array of raw rows | Array of normalized dimensions sorted by `sortOrder`, null-filtered |

`normalizePublicReviewSummary` always returns a safe shape — `reviewCount: 0, averageRating: null` — even when the DB has no row for the actor. Callers never need to null-check the summary object.

---

### Controller Layer

File: `features/public/vportMenu/controller/getVportPublicReviews.controller.js`

**`getVportPublicReviewsController(targetActorId)`** — mount load
- Fires all three DAL calls in `Promise.all` (parallel)
- Returns: `{ summary, reviews, hasMore, dimensions }`
- All three calls are independent — no sequential dependency

**`getVportPublicReviewsPageController(targetActorId, { cursor })`** — pagination
- Calls `readPublicVportReviewsDAL` with cursor from last loaded review's `reviewActivityAt`
- Returns: `{ reviews, hasMore }`

---

### Hook Layer

File: `features/public/vportMenu/hooks/useVportPublicReviews.js`

```js
const { summary, reviews, dimensions, hasMore, loading, loadingMore, error, loadMore }
  = useVportPublicReviews({ actorId })
```

- Calls `getVportPublicReviewsController` on mount and when `actorId` changes
- `loadMore()` appends next page via `getVportPublicReviewsPageController` using cursor from last review's `reviewActivityAt`
- `loading` covers initial mount; `loadingMore` covers pagination
- Both error states share `error`

---

### Component Layer

All components live under `features/public/vportMenu/components/`.

| Component | Purpose |
|---|---|
| `VportPublicReviewsPanel.jsx` | Top-level composer — renders summary + dimensions + card list + empty state + load more. Auth-gates the write CTA via `supabase.auth.getSession()`. |
| `VportPublicReviewSummary.jsx` | Large `averageRating` number + `StarDisplay` + `reviewCount` label |
| `VportPublicReviewDimensions.jsx` | Progress bar row per dimension; hidden when `dimensions` is empty |
| `VportPublicReviewCard.jsx` | Author avatar / display name / @username / verified badge / star chip / `reviewActivityAt` time-ago / body text |
| `VportPublicReviewEmptyState.jsx` | "Be the first to review" copy + write CTA |

---

### Integration in VportPublicMenuView

`useVportPublicReviews({ actorId })` is instantiated once at the view level (`VportPublicMenuView`). The single hook instance is shared between:
- The **compact header summary** — `reviewCount` + `averageRating` amber stars inline below the VPORT name, visible on both the Menu tab and the Reviews tab
- The **Reviews tab panel** — full `VportPublicReviewsPanel`

This means only one set of network calls fires regardless of which tab the visitor is on.

---

### Why Direct View Queries (Not RPC)

The public menu review system deliberately avoids wrapping review reads in a PostgreSQL function. Reasons:

1. **No column collision risk** — PostgREST constructs the SQL from explicit `.select()` columns. There is no `RETURNS TABLE` output parameter scope that could conflict with view column names.
2. **Simpler grants** — a single `GRANT SELECT ON <view> TO anon` is all that's needed. No `GRANT EXECUTE ON FUNCTION` chain.
3. **Independent cacheability** — each of the three DALs has its own TTL cache. Summary and dimensions cache at 60s; paginated reviews do not cache (intentional — fresh per visit).
4. **No cross-schema join inside a function** — the views are in the `reviews` schema and are fully self-contained. There's nothing to join externally.

This pattern is the reference implementation for any other public surface that needs to display review data.

---

## 14. Change Log

### 2026-04-16 14:00

**Task:** Fix menu RLS, public DAL alignment, ownership check bug, optimistic item creation  
**Code Status Before:** Broken — 403 on INSERT, "Not allowed to use this category" on item create, public menu queried non-existent `vc_public` views  

**Summary:**
- Granted `INSERT, UPDATE, DELETE` to `authenticated` on `vport.menu_categories`, `vport.menu_items`, `vport.menu_item_media`
- Replaced `actor_can_manage_profile` helper-based write policies with inline `auth.uid()` checks on all three tables — resolves SECURITY DEFINER `auth.uid()` interference
- Fixed `readVportActorMenuCategoriesDAL` and `readVportActorMenuItemsDAL` to join `profiles!inner(actor_id)` — fixes "Not allowed to use this category" ownership check
- Rewrote `readVportPublicMenuRpcDAL` to query `vport.menu_categories` and `vport.menu_items` directly (no longer queries non-existent `vc_public.vport_menu_public`)
- Rewrote `readVportPublicDetailsRpcDAL` to query `vport.profiles` + `vport.profile_public_details` (no longer queries non-existent `vc_public.vports_public`)
- Added `patchMenu` to `useVportActorMenu` and implemented optimistic item creation in `VportActorMenuManagePanel`

**Files Changed:**
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/readVportActorMenuCategories.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/useVportActorMenu.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel.jsx`
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js`
- DB: `vport.menu_categories`, `vport.menu_items`, `vport.menu_item_media` — RLS policies rewritten + grants applied

**Validation:** CREATE category no longer 403s, item create no longer throws ownership error, public menu screen no longer crashes on missing view

### 2026-04-18

**Task:** Canonical menu URL system — replace raw actorId-based public URLs with slug-based canonical URLs

**Summary:**
- Created `VportPublicMenuBySlugScreen` — canonical public menu screen at `/profile/:slug/menu`
- Updated `VportPublicMenuQrView` to use `useActorCanonicalSlug(actorId)` for the QR payload, Open Menu, and Copy Link URLs
- Updated `VportActorMenuFlyerView` to use `useActorCanonicalSlug(actorId)` for flyer menuUrl
- Updated `VportPublicMenuRedirectScreen` (`/m/:actorId`) to resolve slug via `buildActorCanonicalSlugController` and redirect to `/profile/${slug}/menu`
- Updated `VportPublicMenuScreen` (`/actor/:actorId/menu`) to redirect to canonical slug URL once resolved
- Added `/profile/:slug/menu` route to `vportMenu.routes.jsx`
- Deleted `VportActorMenuQrView.jsx` and `VportActorMenuQrScreen.jsx` — confirmed dead code, never wired into the router

**Hard rule established:** Raw `actorId` UUIDs must never appear in public-facing menu URLs.

**Files Changed:**
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuQrView.jsx` — slug-based menuUrl
- `apps/VCSM/src/features/public/vportMenu/screen/VportPublicMenuBySlugScreen.jsx` — NEW
- `apps/VCSM/src/features/public/vportMenu/screen/VportPublicMenuRedirectScreen.jsx` — slug redirect
- `apps/VCSM/src/features/public/vportMenu/screen/VportPublicMenuScreen.jsx` — slug redirect
- `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx` — slug-based menuUrl
- `apps/VCSM/src/app/routes/public/vportMenu.routes.jsx` — added `/profile/:slug/menu`
- `apps/VCSM/src/app/routes/index.jsx` — lazy import for new screen
- DELETED: `apps/VCSM/src/features/dashboard/qrcode/menu/VportActorMenuQrView.jsx`
- DELETED: `apps/VCSM/src/features/dashboard/qrcode/menu/VportActorMenuQrScreen.jsx`

### 2026-04-18 (Session 2)

**Task:** RLS build for `vport.profile_public_details` + public menu anon access via view + splash fix + slug resolution fix

**Summary:**
- Created `vport.public_menu_read_model_v` — joins profiles + profile_public_details + menu_categories + menu_items, filtered to active/non-deleted records. Canonical menu URL (`/profile/:slug/menu`) baked in as computed column.
- Granted SELECT on view to `anon` and `authenticated` — eliminates need for anon policies on individual tables
- Built RLS write policies for `vport.profile_public_details` (INSERT + UPDATE owner-only, SELECT via view for anon)
- Built RLS write policies for `vport.menu_categories` and `vport.menu_items` (FOR ALL owner-only for authenticated)
- Added SELECT policy on `vport.profiles` for `authenticated` (own profile always readable, active profiles publicly readable)
- Rewrote `readVportPublicMenuRpcDAL` — single query against view, returns `{ ok, actor_id, rows: data }`
- Rewrote `readVportPublicDetailsRpcDAL` — single query against view (limit 1), returns `{ ok, actor_id, details: row }`
- Updated model mappers (`normalizeCategoryFromViewRow`, `normalizeItemFromViewRow`) to handle `menu_category_*` / `menu_item_*` column prefixes from view while preserving backward compatibility with legacy shapes
- Updated `vportPublicDetails.model.js` — added `profile_name`, `profile_slug`, `profile_bio`, `profile_banner_url` to fallback chains
- Created `resolveMenuSlug.dal.js` — anon-safe slug resolution via view (does not touch `vport.profiles` directly)
- Updated `VportPublicMenuBySlugScreen` — uses `resolveMenuSlugDAL`, removed loading flash (shows null during resolution)
- Fixed `index.html` splash bypass — added `/profile/:slug/menu` regex to immediate-hide routes
- Added `address`, `lat`, `lng`, `social_links`, `hours`, `booking_url` to view and DAL select — enables Directions button and hours display

**Files Changed:**
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js` — view-based single query
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js` — view-based single query
- `apps/VCSM/src/features/public/vportMenu/dal/resolveMenuSlug.dal.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/screen/VportPublicMenuBySlugScreen.jsx` — resolveMenuSlugDAL, no loading flash
- `apps/VCSM/src/features/public/vportMenu/model/vportPublicMenu.model.js` — menu_* prefix support in mappers
- `apps/VCSM/src/features/public/vportMenu/model/vportPublicDetails.model.js` — profile_* prefix fallbacks, profile_banner_url
- `apps/VCSM/index.html` — splash bypass regex for `/profile/:slug/menu`
- DB: `vport.public_menu_read_model_v` — created (DROP + CREATE + GRANT)
- DB: `vport.profile_public_details` — RLS enabled, SELECT/INSERT/UPDATE policies added
- DB: `vport.menu_categories` — RLS enabled, owner FOR ALL policy added
- DB: `vport.menu_items` — RLS enabled, owner FOR ALL policy added

### 2026-04-19 (Session 3)

**Task:** Public reviews tab + compact review summary in public menu header

**Summary:**
- Added Menu / Reviews tab bar to `VportPublicMenuView`. Tabs share the same profile header card; search input conditionally renders only on the Menu tab.
- Built a full public reviews data stack under `features/public/vportMenu/`:
  - `dal/readPublicVportReviewSummary.dal.js` — queries `reviews.public_vport_review_summary_v` (60s TTL cache, returns null when no reviews)
  - `dal/readPublicVportReviews.dal.js` — paginated by `review_activity_at` cursor, no cache
  - `dal/readPublicVportReviewDimensions.dal.js` — ordered by `sort_order`, 60s TTL cache
  - `model/vportPublicReviews.model.js` — `normalizePublicReviewSummary`, `normalizePublicReviewCards`, `normalizePublicReviewDimensions`
  - `controller/getVportPublicReviews.controller.js` — parallel load on mount, separate page controller for pagination
  - `hooks/useVportPublicReviews.js` — exposes `{ summary, reviews, dimensions, hasMore, loading, loadingMore, error, loadMore }`
- Built public review UI components:
  - `components/VportPublicReviewSummary.jsx` — avg rating (large) + StarDisplay + count
  - `components/VportPublicReviewDimensions.jsx` — progress bar per dimension
  - `components/VportPublicReviewCard.jsx` — author avatar/name/stars/body/verified badge/time-ago
  - `components/VportPublicReviewEmptyState.jsx` — "Be the first to review" CTA
  - `components/VportPublicReviewsPanel.jsx` — composes all; auth-gates write CTA via `supabase.auth.getSession()`
- Added compact review summary inline in the profile header (below display name / @username), visible on both tabs:
  - When reviews exist: `4.0 ★★★★☆ (1)` — amber stars, rating number, count in parens
  - When no reviews: muted "No reviews yet" label
  - Loaded via `useVportPublicReviews({ actorId })` at view level (shared with Reviews tab panel; single hook call)
- DB: Added anon-safe SELECT policies on `reviews.reviews`, `reviews.review_ratings`, `reviews.review_dimensions` backing tables. Views (`public_vport_reviews_v`, `public_vport_review_summary_v`, `public_vport_review_dimensions_v`) grant SELECT to `anon` and `authenticated`.
- Fixed review notification routing: `linkPath` in `VportReviews.controller.js` changed from `/profile/${targetActorId}?tab=reviews` (public profile) to `/actor/${targetActorId}/dashboard/reviews` (owner dashboard).

**Files Changed:**
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuView.jsx` — tabs, compact summary, review panel, removed Review action button
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviews.dal.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewDimensions.dal.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/model/vportPublicReviews.model.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/controller/getVportPublicReviews.controller.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/hooks/useVportPublicReviews.js` — NEW
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewSummary.jsx` — NEW
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewDimensions.jsx` — NEW
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewCard.jsx` — NEW
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewEmptyState.jsx` — NEW
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewsPanel.jsx` — NEW
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js` — notification linkPath fix
- DB: `reviews.public_vport_reviews_v`, `reviews.public_vport_review_summary_v`, `reviews.public_vport_review_dimensions_v` — created with anon grants
- DB: anon SELECT policies on `reviews.reviews`, `reviews.review_ratings`, `reviews.review_dimensions`
- DB: `vport.profiles` — RLS enabled, authenticated SELECT policy added

### 2026-04-20

**Task:** Menu stale state fixes + delete item bug fix + photo field cleanup + reviews page profile fallback

**Summary:**

**Cache invalidation (stale menu after mutations):**
- `getVportActorMenuController` has a 60-second TTL cache keyed on `actorId` when `includeInactive=false`. After any mutation (add/edit/delete item, delete category), the cache was not invalidated before `refresh()`, causing stale data to persist for up to 60s.
- Fix: Added `invalidateMenuCache(actorId)` call (exported from `getVportActorMenu.controller.js`) before every `refresh()` call in `VportActorMenuManagePanel.jsx` — both in `itemsMut.onSuccess` and `categoriesMut.onSuccess`.

**Delete item bug (`deleteVportActorMenuItemController: itemId required`):**
- Root cause: `requestDeleteItem` in `VportActorMenuManagePanel.jsx` destructured `{ itemId }` from its argument. `VportActorMenuCategoryItemRow` calls `onDeleteItem?.(safeItem)` — passing the full item object with `.id`, not `.itemId`.
- Fix: Changed signature to `(arg)` with `const itemId = arg?.itemId ?? arg?.id ?? null`.

**Reviews page profile data fallback:**
- `readVportPublicDetailsRpcDAL` queried only `vport.public_menu_read_model_v`, which uses an INNER JOIN on `vport.menu_categories` + `vport.menu_items`. VPORTs without menu items return no rows from the view, causing the reviews page to show "Business" / "VC" placeholders instead of real profile data.
- Fix: Added fallback query to `vport.profiles` when the view returns null. The model's `mapVportPublicDetailsRpcResult` already handles `name`, `slug`, `avatar_url`, `banner_url` field names from the profiles table directly.

**Photo field cleanup:**
- Removed visible raw CDN URL from the menu item add/edit modal photo section.
- Removed "Uploads to Cloudflare R2 and saves the URL on the item." helper text.
- Upload, preview, Choose image, and Remove actions are all preserved unchanged.

**Files Changed:**
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel.jsx` — `invalidateMenuCache` calls, `requestDeleteItem` arg normalization
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js` — fallback to `vport.profiles` when view returns null
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormPhotoField.jsx` — removed CDN URL display and R2 helper text
