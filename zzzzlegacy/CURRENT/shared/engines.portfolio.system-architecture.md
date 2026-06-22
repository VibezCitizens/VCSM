# Portfolio Engine — System Architecture

## 1 Purpose

The portfolio engine manages work showcase content for vport actors. It allows vport owners to create, manage, and display portfolio items — each composed of media files, tags, and optional category-specific detail records (barber, locksmith).

The engine is app-agnostic. It is consumed by VCSM via dependency injection. It has no knowledge of the app that calls it.

---

## 2 Scope

**Included:**
- Portfolio item CRUD (create, update, soft-delete, get)
- Media attachment management (insert, delete)
- Tag management (insert, delete, replace)
- Public portfolio listing (actor → profile resolution → items + media + tags)
- Category-specific detail reads (barber, locksmith)
- `isActorOwner` ownership enforcement via injected DI function

**Excluded:**
- Portfolio rendering UI (owned by VCSM app)
- Image upload to R2/S3 (owned by VCSM `uploadToCloudflare`)
- Portfolio public profiles page (owned by VCSM `PortfolioTab`)
- Analytics, metrics, or view counting
- Wentrex — not a consumer

---

## 3 Ownership

**Application Scope:** ENGINE (VCSM consumer only)

**Code Root:** `engines/portfolio/`

**VCSM Consumer Setup:** `apps/VCSM/src/features/portfolio/setup.js`

**Related Engines:** None (portfolio engine has no engine-level dependencies)

---

## 4 Entry Points

### Setup (DI)
`engines/portfolio/src/config.js` — `configurePortfolioEngine({ supabaseClient, isActorOwner, debugReporter })`

Called once at VCSM startup via `apps/VCSM/src/features/portfolio/setup.js`.

`debugReporter` is optional — `null` in production, a function in dev that routes engine trace events to `portfolioTraceStore`.

### Public API (adapters)
`engines/portfolio/src/adapters/index.js`

| Export | Purpose |
|--------|---------|
| `configurePortfolioEngine` | DI setup |
| `listPortfolio` | Public read — all items for an actor with media + tags |
| `getPortfolioItem` | Single item with full detail (media, tags, category details) |
| `createItem` | Create a new portfolio item |
| `updateItem` | Update item fields + optional tag replacement |
| `deleteItem` | Soft-delete an item |
| `addMedia` | Attach media to an item |
| `removeMedia` | Remove a media attachment |
| `manageTags` | Insert / delete specific tags |

### VCSM App Hook
`apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js`

Calls `ctrlListPortfolio` and `ctrlGetPortfolioItem` from the VCSM-local controller wrapper. Manages pagination state, tag filtering, selected item detail, and reload.

### VCSM App Screens
| Screen | Purpose |
|--------|---------|
| `VportDashboardPortfolioScreen.jsx` | Owner management (create, edit, delete) |
| `PortfolioItemModal.jsx` | Full-screen item viewer — image + content card (public + owner) |
| `VportPortfolioView.jsx` | Public grid view with tag filter, rendered inside profile tabs |
| `PortfolioTab.jsx` | Public profile view (read-only) |
| `PortfolioGrid.jsx` | Grid render of items |
| `PortfolioSection.jsx` | Section wrapper for profile page |

---

## 5 Data Flow

### Public List (read path)
```
useVportPortfolio(actorId)
  → ctrlListPortfolio(actorId)
    → listPortfolio({ actorId })           [engine controller]
      → dalGetProfileIdByActorId(actorId)  [DAL → vport.profiles]
      → dalListPortfolioItemsByProfileId(profileId)
                                           [DAL → vport.portfolio_items]
      → Promise.all([
          dalListMediaByItemIds(itemIds)   [DAL → vport.portfolio_media]
          dalListTagsByItemIds(itemIds)    [DAL → vport.portfolio_tags]
        ])
      → builds mediaMap + tagMap
      → derives coverUrl from media (cover role or first)
      → returns { items, hasMore }
```

### Create Item (write path)
```
VportDashboardPortfolioScreen → createItem({ actorId, ... })
  → createItem controller
    → isActorOwner(actorId)               [DI → vc.actors check]
    → dalGetProfileIdByActorId(actorId)   [DAL → vport.profiles]
    → debug?.({ step: 'CREATE_ITEM_INSERT_PAYLOAD', ... })  [DEV trace only]
    → dalInsertPortfolioItem({ profileId, createdByActorId: null, ... })
                                          [DAL → vport.portfolio_items INSERT]
    → dalInsertPortfolioTags({ itemId, tags })
                                          [DAL → vport.portfolio_tags UPSERT]
    → emit ITEM_CREATED event
```

**Note on `createdByActorId`:** Always `null` on insert. The RLS policy uses `vc.current_actor_id()` which resolves to the *user* actor (via `auth.uid()`), not the active vport actor. Passing the vport `actorId` here would cause an RLS mismatch and a 403. The INSERT policy explicitly allows `null`.

### Optimistic Delete (write path)
```
VportDashboardPortfolioScreen.handleDelete(item)
  → optimisticRemove(item.id)             [hook — removes from state, busts cache, returns rollback fn]
  → deleteItem({ itemId, actorId })       [server call]
  → on failure: rollback()                [restores state snapshot]
```

### Add Media (write path)
```
VportDashboardPortfolioScreen → addMedia({ itemId, actorId, url, ... })
  → addMedia controller
    → Promise.all([
        dalGetPortfolioItemById(itemId)       [DAL → vport.portfolio_items]
        dalGetProfileIdByActorId(actorId)     [DAL → vport.profiles]
      ])
    → ownership check: item.profile_id === callerProfileId
    → isActorOwner(actorId)
    → dalInsertPortfolioMedia({ portfolioItemId, profileId, url, ... })
                                              [DAL → vport.portfolio_media INSERT]
    → emit MEDIA_ADDED event
```

### Single Item Detail (read path)
```
useVportPortfolio.openItem(item)
  → ctrlGetPortfolioItem(itemId)
    → getPortfolioItem controller
      → dalGetPortfolioItemById(itemId)
      → Promise.all([
          dalListMediaByItemId(itemId)
          dalListTagsByItemId(itemId)
          dalGetBarberDetailsByItemId (if requested)
          dalGetLocksmithDetailsByItemId (if requested)
        ])
      → builds composite object
```

### Edit Item — Optimistic (write path)
```
VportDashboardPortfolioScreen.PortfolioItemForm (mode="edit")
  → onOptimisticUpdate(editItemId, { ...existingItem, title, description, portfolioKind, tags })
    → optimisticUpdate(itemId, updates)     [hook — merges updates into item by id, busts cache, returns rollback fn]
  → updateItem({ itemId, actorId, updates: { title, description, portfolioKind }, tags })
                                            [engine controller → vport.portfolio_items UPDATE + tags UPSERT]
  → addMedia({ itemId, ... }) * N           [for any new files uploaded in edit mode]
  → ctrlSavePortfolioDetail(itemId, {...})  [locksmith-only upsert → vport.locksmith_portfolio_details]
  → on success: onDone() → state already updated, reload() fires as background sync
  → on failure: rollback()                  [restores previous item snapshot from itemsRef]
```

**Note on optimistic edit:** The optimistic patch merges into the existing list item in-place — no duplicate is created. `itemsRef` mirrors `items` synchronously so the snapshot is always current at call time. Tags and locksmith details are not reflected in the list card (cards show title/tags/coverUrl only), so a background `reload()` after success brings the server state in without a visible flash.

### Public Item Detail Modal (read path — public profile)
```
VportPortfolioView → PortfolioItemCard.onOpen(item)
  → handleOpenItem(item) → openItem(item) + setShowModal(true)
    → openItem(item)
      → setSelectedItem(item)               [immediate — card data shown in modal]
      → ctrlGetPortfolioItem(itemId)        [async — enriches with full media + locksmith detail]
        → setSelectedItemDetail(detail)
  → PortfolioItemModal(item, detail, loadingDetail)
      renders: image (coverUrl from detail or item)
               content card (title, description, tags, locksmith details if present)
               loading shimmer while detail loads
```

---

## 6 Source of Truth

| Data | Table | Schema |
|------|-------|--------|
| Portfolio items | `portfolio_items` | `vport` |
| Portfolio media | `portfolio_media` | `vport` |
| Portfolio tags | `portfolio_tags` | `vport` |
| Barber-specific details | `barber_portfolio_details` | `vport` |
| Locksmith-specific details | `locksmith_portfolio_details` | `vport` |
| Portfolio item metrics | `portfolio_item_metrics` | `vport` |
| Portfolio item ↔ service links | `portfolio_item_services` | `vport` |
| Profile lookup (actor → profile_id) | `profiles` | `vport` |

**Note:** `vport.portfolio_items` keys by `profile_id` (not `actor_id`). The engine resolves `profile_id` from `actor_id` via a DAL lookup on `vport.profiles` before all write operations and list reads.

**Previous (stale — do not use):**
`vc.vport_portfolio_items`, `vc.vport_portfolio_media`, `vc.vport_portfolio_tags`, `vc.vport_barber_portfolio_details` — these tables no longer exist.

---

## 7 UI States

| State | Trigger |
|-------|---------|
| Loading | `useVportPortfolio` initial fetch or reload |
| Empty | Actor has no portfolio items (`allItems.length === 0`) |
| Success | Items array populated, rendered as grid or management list |
| Error | DAL throws or controller throws |
| Load-more | `hasMore === true` and user scrolls to bottom |
| Deleting | `deletingId === item.id` — button disabled, optimistic UI |
| Creating | `showCreate === true` — form visible, inline in dashboard screen |
| Editing | `editingItem !== null` — edit form visible; `loadingEdit` while fetching full detail |
| Detail loading | `loadingDetail === true` — after item tap; modal shows summary while enriching |
| Modal open | `showModal === true && selectedItem !== null` — `PortfolioItemModal` visible as fragment sibling |

---

## 8 Dependencies

### Internal Engine
| Module | Purpose |
|--------|---------|
| `config.js` | DI container — provides `supabaseClient`, `isActorOwner`, `debugReporter` |
| `events.js` | Domain events — `ITEM_CREATED`, `ITEM_UPDATED`, `ITEM_DELETED`, `MEDIA_ADDED`, `MEDIA_REMOVED` |
| `types/index.js` | JSDoc type definitions for `DomainPortfolioItem`, `DomainPortfolioMedia` |

### VCSM App Dependencies
| Module | Purpose |
|--------|---------|
| `@/services/supabase/supabaseClient` | Supabase client injected at setup |
| `vc.actors` | `isActorOwner` ownership check in setup.js |
| `uploadToCloudflare` | File upload before `addMedia` (not inside engine) |
| `compressIfNeeded` | Image compression before upload (not inside engine) |
| `portfolioTraceStore` | Dev-only pub/sub store in `setup.js` — receives engine trace events via `debugReporter` |

### External Services
- Supabase PostgreSQL (`vport` schema)

---

## 9 Rules / Invariants

1. **Engine has no app knowledge.** Never import from `apps/VCSM` or `apps/wentrex`.
2. **DAL only queries.** No business logic inside DAL functions.
3. **All writes require ownership check.** `isActorOwner(actorId)` must pass before any mutation.
4. **Profile resolution is required before writes.** `actorId` → `profile_id` via `dalGetProfileIdByActorId`. Throws if no profile found.
5. **Soft-delete only.** Items are never hard-deleted. `is_deleted = true`, `deleted_at = now()`.
6. **`profile_id` is the primary key for ownership.** Never compare `item.actorId` — compare `item.profileId` against the caller's resolved `callerProfileId`.
7. **Media ownership is verified via item's `profile_id`.** `item.profile_id !== callerProfileId` → 403-equivalent throw.
8. **No RPC dependency.** The old `get_vport_portfolio` RPC (which targeted `vc.vport_portfolio_items`) has been replaced with direct table queries.
9. **`createdByActorId` must always be `null` on INSERT.** `vc.current_actor_id()` resolves to the user actor (via `auth.uid()`), not the vport actor. Passing the vport actor id causes RLS to reject the insert. The INSERT policy explicitly allows `null`.
10. **Optimistic remove must always return a rollback function.** `useVportPortfolio.optimisticRemove(itemId)` returns `() => setItems(snapshot)`. The caller must invoke rollback on server failure.
11. **Optimistic update must always return a rollback function.** `useVportPortfolio.optimisticUpdate(itemId, updates)` merges `updates` into the matching item by id and returns `() => setItems(snapshot)`. If any part of the server write fails, the caller must invoke rollback.
12. **PortfolioItemModal must be rendered as a fragment sibling, never inside a styled card.** `position: fixed` elements inside containers with `backdrop-filter`, `transform`, or `overflow: hidden + border-radius` get trapped in the stacking context on iOS and fail to go fullscreen. Always render at fragment level.
13. **Portfolio item title is limited to 22 characters at the UI layer.** Enforced via `maxLength`, paste handler slice, and a hard guard on submit. No DB schema change required — the constraint is presentation-layer only.

---

## 10 Failure Risks

| Risk | Condition | Impact |
|------|-----------|--------|
| Null profileId | Actor exists in `vc.actors` but no `vport.profiles` row | `createItem`, `addMedia`, `listPortfolio` return null/empty — not a crash but silent empty state |
| RLS on `vport.profiles` | Supabase client cannot read profiles table | `dalGetProfileIdByActorId` throws — all write paths fail |
| `portfolio_items.rpc.dal.js` stale import | Any caller still importing `dalRpcGetVportPortfolio` | Named export is gone — import error at runtime |
| Media coverUrl null | Item has no media attached | `coverUrl` falls back to `null` — UI uses `ImageIcon` placeholder |
| `isActorOwner` misconfigured | Setup.js not called before engine use | All operations throw immediately |
| `actor_can_manage_profile` SQL migration not run | Function still uses old `p_actor_id` check | All vport write RLS policies fail — 403 on every insert/update/delete |
| `portfolio_media` RLS migration not run | No policies exist on `vport.portfolio_media` | `addMedia` inserts 403 |
| `PortfolioBugsBunnyPanel` inlined in screen | Current state — refactor to `zNOTFORPRODUCTION/debuggers/portfolio/` pending | Violates debugger architecture pattern; works correctly but wrong location |
| Rollback after optimistic remove | Server delete fails unexpectedly | `rollback()` restores previous `items` snapshot — state is consistent, no reload needed |
| Rollback after optimistic edit | Server `updateItem` or `ctrlSavePortfolioDetail` fails | `rollback?.()` restores snapshot; error shown in form; modal stays open |
| Partial edit failure (locksmith detail) | `updateItem` succeeds but `ctrlSavePortfolioDetail` throws | Main item is updated on server; detail is stale. Optimistic state may differ from server. Background `reload()` corrects the list. |
| `PortfolioItemModal` iOS stacking trap | Modal rendered inside a container with `backdrop-filter` or `transform` | Modal does not go fullscreen — appears clipped. Fix: render at React fragment level, not inside card div. |

---

## 11 Debug Notes

- `isActorOwner` is injected — if ownership checks are failing, inspect `apps/VCSM/src/features/portfolio/setup.js` first.
- Profile resolution failures will throw from `dalGetProfileIdByActorId`. Check that `vport.profiles.actor_id` is indexed and RLS allows reads.
- All DAL functions accept a `trace` parameter — pass a trace reporter for step-level observability.
- `portfolioItems.rpc.dal.js` is tombstoned — if it is somehow imported, the named export will not exist.
- **`portfolioTraceStore`** (dev): `import { portfolioTraceStore } from '@/features/portfolio/setup'` — call `.subscribe(fn)` to receive engine trace events; `.clear()` to reset. Populated via `debugReporter` DI param.
- **`PortfolioBugsBunnyPanel`**: DEV-only component inlined in `VportDashboardPortfolioScreen.jsx`. Runs identity probe (vport.profiles, profile_actor_access, actor_owners, auth session) and tails engine trace events. Returns `null` in production at top of component. Pending refactor to `zNOTFORPRODUCTION/debuggers/portfolio/`.
- **RLS 403 on createItem**: If create fails with 403 after `createdByActorId: null` fix is in place, run the `actor_can_manage_profile` SQL migration and verify `vport.profiles.owner_user_id` is populated for the vport actor.
- **Optimistic delete debugging**: If items flicker back after delete, rollback is firing — check that `deleteItem` is not throwing an unexpected error. `setDeletingId(null)` in `finally` is correct.

---

## 12 Files Map

| File | Responsibility |
|------|---------------|
| `engines/portfolio/src/config.js` | DI container |
| `engines/portfolio/src/events.js` | Domain event emitter |
| `engines/portfolio/src/adapters/index.js` | Public API surface |
| `engines/portfolio/src/dal/portfolioItems.read.dal.js` | Items read + `dalGetProfileIdByActorId` |
| `engines/portfolio/src/dal/portfolioItems.write.dal.js` | Items write (insert, update, soft-delete) |
| `engines/portfolio/src/dal/portfolioItems.rpc.dal.js` | Tombstoned — safe to delete |
| `engines/portfolio/src/dal/portfolioMedia.read.dal.js` | Media read |
| `engines/portfolio/src/dal/portfolioMedia.write.dal.js` | Media write |
| `engines/portfolio/src/dal/portfolioTags.read.dal.js` | Tags read |
| `engines/portfolio/src/dal/portfolioTags.write.dal.js` | Tags write |
| `engines/portfolio/src/dal/barberDetails.read.dal.js` | Barber detail reads |
| `engines/portfolio/src/dal/locksmithDetails.read.dal.js` | Locksmith detail reads |
| `engines/portfolio/src/model/PortfolioItem.model.js` | Row → `DomainPortfolioItem` |
| `engines/portfolio/src/model/PortfolioMedia.model.js` | Row → `DomainPortfolioMedia` |
| `engines/portfolio/src/model/BarberDetails.model.js` | Row → barber domain object |
| `engines/portfolio/src/model/LocksmithDetails.model.js` | Row → locksmith domain object |
| `engines/portfolio/src/controller/listPortfolio.controller.js` | Public list with enrichment |
| `engines/portfolio/src/controller/getPortfolioItem.controller.js` | Single item full detail |
| `engines/portfolio/src/controller/createItem.controller.js` | Item creation with tags |
| `engines/portfolio/src/controller/updateItem.controller.js` | Item field + tag update |
| `engines/portfolio/src/controller/deleteItem.controller.js` | Soft-delete |
| `engines/portfolio/src/controller/addMedia.controller.js` | Media attachment |
| `engines/portfolio/src/controller/removeMedia.controller.js` | Media removal |
| `engines/portfolio/src/controller/manageTags.controller.js` | Tag operations |
| `apps/VCSM/src/features/portfolio/setup.js` | VCSM DI wiring |
| `apps/VCSM/src/features/.../useVportPortfolio.js` | React hook — list state, pagination, tag filter, optimisticRemove/Add/Update |
| `apps/VCSM/src/features/.../VportDashboardPortfolioScreen.jsx` | Owner management — create, edit (optimistic), delete |
| `apps/VCSM/src/features/.../VportPortfolioView.jsx` | Public grid view with tag filter chips and item modal trigger |
| `apps/VCSM/src/features/.../PortfolioItemModal.jsx` | Full-screen item viewer (image + content card + locksmith details) |
| `apps/VCSM/src/features/.../PortfolioItemForm (inline)` | Dual-mode create/edit form — `mode="create"` or `mode="edit"` |
| `engines/portfolio/CLAUDE.md` | Engine scope rules |

---

## Audit References

Latest Engine Audit: `zNOTFORPRODUCTION/logan/engines/PORTFOLIO_ENGINE_AUDIT_V2.md`

Previous Engine Audit: `zNOTFORPRODUCTION/logan/engines/PORTFOLIO_ENGINE_AUDIT_V1.md`

---

## 13 Change Log

### 2026-04-16 10:30

Task: Portfolio engine schema migration — vc.vport_portfolio_* → vport.portfolio_*

Code Status Before:
All 9 DAL files used `.schema('vc')` and table names prefixed with `vport_`.
Items and media tables used `actor_id` column. The engine had no prior Logan documentation.

Summary:
- Fixed all schema/table references across 9 DAL files
- Fixed column `actor_id` → `profile_id` in items and media DALs and models
- Added `dalGetProfileIdByActorId` to resolve vport profile from actor_id
- Renamed `dalListPortfolioItemsByActor` → `dalListPortfolioItemsByProfileId`
- Replaced broken `get_vport_portfolio` RPC (targeted old schema) with direct table query
- Updated `listPortfolio`, `createItem`, `addMedia`, `updateItem`, `deleteItem` controllers for profile resolution and corrected ownership checks
- Tombstoned `portfolioItems.rpc.dal.js`
- Updated `engines/portfolio/CLAUDE.md` table list

Files Changed:
engines/portfolio/src/dal/portfolioItems.read.dal.js
engines/portfolio/src/dal/portfolioItems.write.dal.js
engines/portfolio/src/dal/portfolioItems.rpc.dal.js
engines/portfolio/src/dal/portfolioMedia.read.dal.js
engines/portfolio/src/dal/portfolioMedia.write.dal.js
engines/portfolio/src/dal/portfolioTags.read.dal.js
engines/portfolio/src/dal/portfolioTags.write.dal.js
engines/portfolio/src/dal/barberDetails.read.dal.js
engines/portfolio/src/dal/locksmithDetails.read.dal.js
engines/portfolio/src/model/PortfolioItem.model.js
engines/portfolio/src/model/PortfolioMedia.model.js
engines/portfolio/src/controller/listPortfolio.controller.js
engines/portfolio/src/controller/createItem.controller.js
engines/portfolio/src/controller/addMedia.controller.js
engines/portfolio/src/controller/updateItem.controller.js
engines/portfolio/src/controller/deleteItem.controller.js
engines/portfolio/CLAUDE.md

Validation:
No app-level files changed. Engine scope maintained. All file paths confirmed to exist.

---

### 2026-04-16 Session 2

Task: RLS mismatch fix, debug instrumentation, portfolio media RLS, optimistic delete

Code Status Before:
`createItem.controller.js` passed `createdByActorId: actorId` causing RLS 403 (vport actor ≠ user actor in `vc.current_actor_id()`).
`useVportPortfolio.js` had no optimistic delete — UI waited for server confirmation.
No dev trace instrumentation in the portfolio engine.

Summary:
- Fixed `createdByActorId: actorId` → `null` in `createItem.controller.js` — RLS INSERT policy explicitly allows null
- Added `getDebugReporter()` import to `createItem.controller.js`; added `debug?.()` calls at owner check, profile lookup, and insert payload steps
- Added `portfolioTraceStore` to `setup.js` — dev-only pub/sub store (last 50 events, pub/sub pattern matching identity debugger)
- Added `debugReporter` DI param to `configurePortfolioEngine` in `setup.js` — routes engine trace events to `portfolioTraceStore` in DEV, `null` in PROD
- Added `PortfolioBugsBunnyPanel` component to `VportDashboardPortfolioScreen.jsx` — DEV-only diagnostic panel with identity probe + engine trace tail (NOTE: incorrect location, should be `zNOTFORPRODUCTION/debuggers/portfolio/` — refactor pending)
- Added `itemsRef` to `useVportPortfolio.js` to mirror `items` state synchronously
- Added `optimisticRemove(itemId)` to `useVportPortfolio.js` — filters item immediately, busts TTL cache, returns rollback function
- Updated `handleDelete` in `VportDashboardPortfolioScreen.jsx` — calls `optimisticRemove` before server delete; calls `rollback()` on failure; removed `reload()` call after success
- Proposed SQL migrations (not yet run): `vport.portfolio_items` RLS policies, `actor_can_manage_profile` + `actor_can_view_profile` function fixes, `vport.portfolio_media` RLS policies

Files Changed:
engines/portfolio/src/controller/createItem.controller.js
apps/VCSM/src/features/portfolio/setup.js
apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js
apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx

Validation:
Engine change (createItem.controller.js) is inside `engines/portfolio/` — scope maintained.
App changes are inside `apps/VCSM/` — no cross-root modifications.
`debugReporter: null` in production — no trace overhead ships.
`optimisticRemove` rollback is pure state restore — no secondary server calls.

---

### 2026-04-26 Session 1

Task: Portfolio item edit support, portfolio item modal (content), "0 photos" fix, locksmith checkbox polish, service detail wiring, portfolio card title truncation fix

Code Status Before:
`VportDashboardPortfolioScreen.jsx` had create and delete only — no edit.
`useVportPortfolio.js` had `optimisticRemove` and `optimisticAdd` but no `optimisticUpdate`.
`VportPortfolioView.jsx` used `ImageViewerModal` (photo-only) for item taps.
`PortfolioItemModal.jsx` did not exist.
`VportDashboardLocksmithScreen.jsx` emergency checkbox used native `<input type="checkbox">`.
`upsertVportServicesController` did not provision `locksmith_service_details` rows.
Portfolio card titles in `VportPortfolioView.jsx` used `truncate` (single-line clip).

Summary:
- Added `PortfolioItemForm` (renamed from `CreateItemForm`) in `VportDashboardPortfolioScreen.jsx` — unified `mode="create"|"edit"` prop; edit mode: files optional, calls `updateItem`, then `addMedia` for new files, then `ctrlSavePortfolioDetail` (locksmith upsert)
- Added `buildInitialValues(detail)` — converts `ctrlGetPortfolioItem` result to form state including `locksmith` sub-object
- Added `handleEdit`, `handleEdited`, `handleCancelEdit` to main screen — fetches full detail, shows loading → form, calls `reload()` after save
- Added Pencil edit button to `PortfolioManagerCard`; fixed "0 photos" label to only render when `mediaCount > 0`
- Created `PortfolioItemModal.jsx` — full-screen modal with image + elevated content card (title, description, tags, `LocksmithSection`). Rendered as React fragment sibling to avoid iOS stacking context trap. Fade/slide animation, iOS scroll freeze, ESC key support. `selectedItem` shows immediately; `selectedItemDetail` enriches on load.
- Replaced `ImageViewerModal` usage in `VportPortfolioView.jsx` with `PortfolioItemModal`; updated grid `grid-cols-2 lg:grid-cols-3`; fixed title from `truncate` → `line-clamp-2 leading-snug`; improved tag contrast
- Fixed `VportDashboardLocksmithScreen.jsx` emergency service checkbox → `ConsentCheckbox`; added `gapServices` rendering (amber alert for enabled services with no detail row); updated Services count in quick summary
- Created `locksmithServiceDefaults.model.js` — maps 11 service keys to default `locksmith_service_details` fields + `_fallback`
- Added `dalInsertLocksmithServiceDetailDefaults` to `locksmithServiceDetails.write.dal.js` — upsert with `ignoreDuplicates: true` (INSERT ON CONFLICT DO NOTHING — never overwrites user edits)
- Updated `upsertVportServicesController` — after service save, provisions default detail rows for all enabled locksmith services via `Promise.allSettled` (non-blocking)
- Added `gapServices` computation to `useLocksmithProfile.js` — cross-references enabled services vs detail rows

Files Changed:
apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx
apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/PortfolioItemModal.jsx (NEW)
apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx
apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLocksmithScreen.jsx
apps/VCSM/src/features/profiles/kinds/vport/model/locksmith/locksmithServiceDefaults.model.js (NEW)
apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js
apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js
apps/VCSM/src/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile.js
apps/VCSM/src/features/profiles/styles/profiles-portfolio-modern.css

Validation:
No engine files changed. All changes in `apps/VCSM/`. `ignoreDuplicates: true` ensures user-customized detail rows are never overwritten. iOS fragment-sibling pattern maintained for modal.

---

### 2026-04-26 Session 2

Task: Portfolio modal visual contrast fix, optimistic update on edit, title 22-char constraint

Code Status Before:
`PortfolioItemModal.jsx` rendered text directly over the dark blurred backdrop — low contrast, content appeared merged with background.
`useVportPortfolio.js` had no `optimisticUpdate` — after a successful edit `handleEdited` called `reload()` and the list updated only after the network round-trip.
`PortfolioItemForm` title input had `maxLength={120}` with no visual feedback.

Summary:
- Rewrote `PortfolioItemModal.jsx` visual layer:
  - Backdrop: `rgba(0,0,0,0.88)` (was 0.92 — now darker for contrast)
  - Image: no text overlaid; bottom gradient fade (`transparent → rgba(0,0,0,0.55)`)
  - Content: dedicated card `rgba(10,10,20,0.85)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(255,255,255,0.08)` + `box-shadow: 0 10px 40px rgba(0,0,0,0.6)` — floats above the overlay
  - 16px gap between image and card
  - Text contrast: title `#fff`, description `rgba(255,255,255,0.75)`, labels `rgba(255,255,255,0.50)`, values `rgba(255,255,255,0.85)`
  - Content card only renders when `hasContent` — no empty card for image-only items
- Added `optimisticUpdate(itemId, updates)` to `useVportPortfolio.js` — snapshots `itemsRef.current`, patches matching item by id in-place, busts TTL cache, returns rollback fn
- Wired optimistic edit into `PortfolioItemForm.handleSubmit` (edit mode only):
  - Calls `onOptimisticUpdate(editItemId, mergedItem)` before the API call
  - Returns `rollback` fn; on catch: `rollback?.()` then `setError(e)`
  - `existingItem` prop passed to form so the merge includes all unchanged fields (coverUrl, mediaCount, isFeatured, etc.)
- Added 22-char title constraint:
  - `TITLE_MAX = 22` constant at module scope
  - `maxLength={22}` + `onChange` slices to max + `onPaste` handler slices to 22
  - Live `N / 22` counter below input; yellow (`#facc15`) at limit
  - Hard guard on submit: if `trimmedTitle.length > TITLE_MAX` → block + inline error

Files Changed:
apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/PortfolioItemModal.jsx
apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js
apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx

Validation:
No engine files changed. All changes in `apps/VCSM/`. `optimisticUpdate` follows same snapshot-restore pattern as `optimisticRemove`. Rollback is a pure state restore with no secondary server calls.
