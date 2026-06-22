# ARCHITECT MODULE REPORT
## Module: VPORT Dashboard — Portfolio Card
**Date:** 2026-05-23
**Reviewer:** ARCHITECT
**Application Scope:** VCSM + ENGINE
**Module Independence:** MOSTLY INDEPENDENT

---

## 1. Dashboard Card Definition

**Key:** `portfolio`
**Title:** `"Portfolio"`
**Body:** `"Add, edit, and organize your work showcase with photos and details."`
**handlerKey:** `"openPortfolio"`
**getLocked:** Not defined — never locked (no desktop/mobile restriction)

**VPORT type presets that include the `portfolio` card:**

| Preset ID | VPORT Types Mapped To It |
|---|---|
| `service` | Beauty & Wellness, Education & Care, Health & Medical, Home/Maintenance/Trades, Professional & Business, Sports & Fitness, Transport & Logistics, Animal Care |
| `barber` | `barber` (explicit type override) |
| `barbershop` | `barbershop` (explicit type override) |
| `locksmith` | `locksmith` (explicit type override) |

**Excluded presets:** `default` (Arts/Media, Retail), `food`, `gas`, `exchange` — none of these include the `portfolio` card key.

---

## 2. Navigation / Entry Point

The portfolio card tap fires `openPortfolio` in `VportDashboardScreen.jsx`:

```js
const openPortfolio = useCallback(() =>
  actorId && navigate(`/actor/${actorId}/dashboard/portfolio`),
[navigate, actorId]);
```

**Route registration** (in `apps/VCSM/src/app/routes/protected/app.routes.jsx`, line 212):
```
{ path: "/actor/:actorId/dashboard/portfolio", element: <VportDashboardPortfolioScreen /> }
```

The route is a protected app route. `VportDashboardPortfolioScreen` is the entry screen — it reads `actorId` from `useParams()`, checks ownership via `useVportOwnership`, and renders the management UI.

---

## 3. File Inventory

### Engine: `engines/portfolio/`

| File | Layer | Purpose |
|---|---|---|
| `index.js` | Entry | Re-exports public API from `src/adapters/index.js` |
| `src/adapters/index.js` | Adapter | Public API surface — re-exports all controllers, models, config, and events |
| `src/config.js` | Config/DI | Holds injected Supabase client and `isActorOwner` resolver; exposes `configurePortfolioEngine()`, `getConfig()`, `getSupabaseClient()`, `isActorOwner()`, `getDebugReporter()` |
| `src/events.js` | Events | Pub/sub domain event bus; defines `EVENTS` constants, `emit()`, `on()` |
| `src/types/index.js` | Types | JSDoc typedefs for `DomainPortfolioItem`, `DomainPortfolioMedia`, `DomainBarberDetails`, `DomainPortfolioListResult` |
| `src/controller/listPortfolio.controller.js` | Controller | Lists all portfolio items for an actor; resolves profileId, enriches with media and tags |
| `src/controller/getPortfolioItem.controller.js` | Controller | Fetches a single item with media, tags, and optional barber/locksmith details |
| `src/controller/createItem.controller.js` | Controller | Creates a new portfolio item; calls `isActorOwner` DI gate; emits `ITEM_CREATED` |
| `src/controller/updateItem.controller.js` | Controller | Updates item fields and replaces tags; calls `isActorOwner` DI gate; emits `ITEM_UPDATED` |
| `src/controller/deleteItem.controller.js` | Controller | Soft-deletes an item after profile ownership check and `isActorOwner` DI gate; emits `ITEM_DELETED` |
| `src/controller/addMedia.controller.js` | Controller | Adds a media row to a portfolio item; ownership-gated; emits `MEDIA_ADDED` |
| `src/controller/removeMedia.controller.js` | Controller | Hard-deletes a media row; ownership-gated; emits `MEDIA_REMOVED` |
| `src/controller/manageTags.controller.js` | Controller | Replaces all tags for an item; ownership-gated; emits `TAGS_UPDATED` |
| `src/dal/portfolioItems.read.dal.js` | DAL | `dalGetPortfolioItemById`, `dalListPortfolioItemsByProfileId`, `dalGetProfileIdByActorId` — reads from `vport.portfolio_items` and `vport.profiles` |
| `src/dal/portfolioItems.write.dal.js` | DAL | `dalInsertPortfolioItem`, `dalUpdatePortfolioItem`, `dalSoftDeletePortfolioItem` — writes to `vport.portfolio_items` |
| `src/dal/portfolioItems.rpc.dal.js` | DAL | DEPRECATED. Empty. Previously used an RPC targeting a removed table. |
| `src/dal/portfolioMedia.read.dal.js` | DAL | `dalListMediaByItemId`, `dalListMediaByItemIds` — reads from `vport.portfolio_media` |
| `src/dal/portfolioMedia.write.dal.js` | DAL | `dalInsertPortfolioMedia`, `dalDeletePortfolioMedia` — writes to `vport.portfolio_media` |
| `src/dal/portfolioTags.read.dal.js` | DAL | `dalListTagsByItemId`, `dalListTagsByItemIds` — reads from `vport.portfolio_tags` |
| `src/dal/portfolioTags.write.dal.js` | DAL | `dalInsertPortfolioTags`, `dalDeletePortfolioTags`, `dalReplacePortfolioTags` — writes to `vport.portfolio_tags` |
| `src/dal/barberDetails.read.dal.js` | DAL | `dalGetBarberDetailsByItemId`, `dalListBarberDetailsByItemIds` — reads from `vport.barber_portfolio_details` |
| `src/dal/locksmithDetails.read.dal.js` | DAL | `dalGetLocksmithDetailsByItemId`, `dalListLocksmithDetailsByItemIds` — reads from `vport.locksmith_portfolio_details` |
| `src/model/PortfolioItem.model.js` | Model | Pure transform: raw `vport.portfolio_items` row → `DomainPortfolioItem` |
| `src/model/PortfolioMedia.model.js` | Model | Pure transform: raw `vport.portfolio_media` row → `DomainPortfolioMedia` |
| `src/model/BarberDetails.model.js` | Model | Pure transform: raw `vport.barber_portfolio_details` row → `DomainBarberDetails` |
| `src/model/LocksmithDetails.model.js` | Model | Pure transform: raw `vport.locksmith_portfolio_details` row → `DomainLocksmithDetails` |
| `src/services/portfolioService.js` | Service | `itemExists()` and `resolveItem()` — utility helpers used internally; not part of public API |

### App: `apps/VCSM/src/`

| File | Layer | Purpose |
|---|---|---|
| `features/portfolio/setup.js` | Bootstrap | Calls `configurePortfolioEngine()` at app startup; injects Supabase client and a custom `isActorOwner` resolver; exports `portfolioTraceStore` (dev-only in-memory event log) |
| `features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js` | Controller (VCSM-side) | `ctrlListPortfolio`, `ctrlGetPortfolioItem`, `invalidatePortfolioCache` — wraps engine calls with a 60-second TTL in-memory cache for the list |
| `features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js` | Hook | Full portfolio state manager: loads list, paginates, optimistic add/remove/update, per-item detail fetch. Calls `ctrlListPortfolio` and `ctrlGetPortfolioItem` |
| `features/profiles/adapters/profiles.adapter.js` | Adapter | Re-exports `useVportPortfolio` and `usePublishBarbershopPortfolioPost` — the only correct cross-feature boundary |
| `features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx` | Screen (View) | Portfolio management screen: renders portfolio list, create form, edit form, delete; calls `useVportPortfolio`, `useVportOwnership`, `deleteItem` (direct engine import — see Section 9) |
| `features/dashboard/vport/screens/components/portfolio/PortfolioItemForm.jsx` | Component | Create/edit form with title, description, kind selector, tags, media file picker, locksmith fields; delegates to `usePortfolioItemSubmit` and `usePortfolioMediaUpload` |
| `features/dashboard/vport/screens/components/portfolio/PortfolioManagerCard.jsx` | Component | Presentational card for a single portfolio item — shows thumbnail, title, tags, photo count; emits `onEdit` / `onDelete` |
| `features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioItemSubmit.js` | Hook | Submit logic for create and edit: calls `createItem`, `updateItem`, `addPortfolioMediaWithRecord`, `ctrlSavePortfolioDetail` (locksmith), `publishLocksmithPortfolioUpdateAsPostController`; manages saving/error state |
| `features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioMediaUpload.js` | Hook | Wraps `@media` engine's `useMediaUpload` with `scope: 'portfolio_media'` |
| `features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller.js` | Controller | Composite: calls engine `addMedia`, then non-blocking records asset ID in `platform.media_assets` via VCSM media adapter; returns same `PortfolioMediaModel` shape |
| `features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal.js` | DAL | `updatePortfolioMediaAssetIdDAL` — updates `portfolio_media.media_asset_id` after platform media asset record creation |
| `features/dashboard/vport/controller/probeVportPortfolio.controller.js` | Controller (Dev) | Dev-only diagnostic probe: checks `vport.profiles`, `profile_actor_access`, and `vc.actor_owners` for a given actorId; returns structured assertion results |
| `features/dashboard/vport/hooks/useVportPortfolioProbe.js` | Hook (Dev) | Dev-only: wires `probeVportPortfolioController` to UI state; subscribes to `portfolioTraceStore` for engine events |
| `features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx` | Component (Dev) | DEV-ONLY panel (guarded by `import.meta.env.DEV`): renders probe and trace UI; calls `useVportPortfolioProbe` |
| `features/dashboard/vport/screens/model/buildDashboardCards.model.js` | Model | Builds the ordered list of dashboard cards for a given VPORT type; maps `handlerKey` to an `onClick`; evaluates `getLocked` |
| `features/dashboard/vport/screens/model/dashboardViewByVportType.model.js` | Model | Maps VPORT type and group to a dashboard view preset containing ordered `cardKeys`; `portfolio` is present in `service`, `barber`, `barbershop`, and `locksmith` presets |

---

## 4. Layer Map

### DAL

#### Engine DALs (`engines/portfolio/src/dal/`)

**`portfolioItems.read.dal.js`**
| Function | Table | Schema | Query | Columns | Auth Check |
|---|---|---|---|---|---|
| `dalGetPortfolioItemById` | `portfolio_items` | `vport` | SELECT by id | Explicit (20 cols) | None — RLS assumed |
| `dalListPortfolioItemsByProfileId` | `portfolio_items` | `vport` | SELECT by profile_id, ordered | Explicit (20 cols) | None — RLS assumed |
| `dalGetProfileIdByActorId` | `profiles` | `vport` | SELECT by actor_id | `id` only | None — RLS assumed |

**`portfolioItems.write.dal.js`**
| Function | Table | Query | Columns Written | Return Columns | Auth Check |
|---|---|---|---|---|---|
| `dalInsertPortfolioItem` | `portfolio_items` | INSERT | 8 fields | Explicit (18 cols) | None — caller responsible |
| `dalUpdatePortfolioItem` | `portfolio_items` | UPDATE by id | Up to 8 fields | Explicit (18 cols) | None — caller responsible |
| `dalSoftDeletePortfolioItem` | `portfolio_items` | UPDATE by id | `is_deleted`, `deleted_at` | Explicit (18 cols) | None — caller responsible |

**`portfolioMedia.read.dal.js`**
| Function | Table | Query | Columns | Auth Check |
|---|---|---|---|---|
| `dalListMediaByItemId` | `portfolio_media` | SELECT by item_id, is_active=true | Explicit (14 cols) | None — RLS assumed |
| `dalListMediaByItemIds` | `portfolio_media` | SELECT .in(item_ids), is_active=true | Explicit (14 cols) | None — RLS assumed |

**`portfolioMedia.write.dal.js`**
| Function | Table | Query | Auth Check |
|---|---|---|---|
| `dalInsertPortfolioMedia` | `portfolio_media` | INSERT with explicit return | None — caller responsible |
| `dalDeletePortfolioMedia` | `portfolio_media` | DELETE by id | None — comment states "RLS enforces ownership" |

**`portfolioTags.read.dal.js`**
| Function | Table | Columns |
|---|---|---|
| `dalListTagsByItemId` | `vport.portfolio_tags` | `portfolio_item_id, tag, created_at` |
| `dalListTagsByItemIds` | `vport.portfolio_tags` | Same |

**`portfolioTags.write.dal.js`**
- `dalInsertPortfolioTags`: INSERT + upsert (ignore duplicates)
- `dalDeletePortfolioTags`: DELETE by item_id + tag list
- `dalReplacePortfolioTags`: DELETE all then re-insert — no auth check, caller responsible

**`barberDetails.read.dal.js`** — `vport.barber_portfolio_details`, 12 explicit columns, read-only
**`locksmithDetails.read.dal.js`** — `vport.locksmith_portfolio_details`, 13 explicit columns, read-only

#### App DALs (`apps/VCSM/`)

**`features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal.js`**
- Function: `updatePortfolioMediaAssetIdDAL({ portfolioMediaId, mediaAssetId })`
- Table: `portfolio_media`, schema default (uses `vportClient`)
- Query: UPDATE `media_asset_id` by id
- No auth check — called from within `addPortfolioMediaWithRecord.controller.js` after engine call succeeds

**`features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`**
- Function: `dalUpsertLocksmithPortfolioDetail(row)`
- Table: `vport.locksmith_portfolio_details`
- Query: UPSERT on conflict `portfolio_item_id`
- Return columns: explicit (14 cols)
- No auth check in DAL — ownership enforced at `ctrlSavePortfolioDetail` in `locksmithOwner.controller.js`

**No `select('*')` violations found in any portfolio DAL.**

---

### Model

| Function | Input | Output |
|---|---|---|
| `PortfolioItemModel(raw)` | `vport.portfolio_items` row | `DomainPortfolioItem` — camelCased domain object with defaults |
| `PortfolioMediaModel(raw)` | `vport.portfolio_media` row | `DomainPortfolioMedia` — camelCased with media role/type defaults |
| `BarberDetailsModel(raw)` | `vport.barber_portfolio_details` row | `DomainBarberDetails` — camelCased barber metadata |
| `LocksmithDetailsModel(raw)` | `vport.locksmith_portfolio_details` row | Domain locksmith detail object |

All models are pure functions with no side effects and no DB access.

---

### Controller

#### Engine Controllers

| Function | Ownership Gate | Callers |
|---|---|---|
| `listPortfolio({ actorId })` | None — public read | `ctrlListPortfolio` (VCSM controller) |
| `getPortfolioItem({ itemId })` | None — public read | `ctrlGetPortfolioItem` (VCSM controller) |
| `createItem({ actorId, ... })` | `isActorOwner(actorId)` — DI injected | `usePortfolioItemSubmit` hook |
| `updateItem({ itemId, actorId, ... })` | Profile ownership check + `isActorOwner(actorId)` | `usePortfolioItemSubmit` hook |
| `deleteItem({ itemId, actorId })` | Profile ownership check + `isActorOwner(actorId)` | `VportDashboardPortfolioScreen` direct import |
| `addMedia({ itemId, actorId, url, ... })` | Profile ownership check + `isActorOwner(actorId)` | `addPortfolioMediaWithRecord.controller.js` |
| `removeMedia({ mediaId, actorId })` | `isActorOwner(actorId)` only (no profile check) | Not currently used in dashboard UI |
| `manageTags({ itemId, actorId, tags })` | `isActorOwner(actorId)` — but ownership check uses `item.actor_id` which does not exist on the portfolio items row (field is `profile_id`) — **ARCHITECTURE NOTE: dead gate** | Not called from dashboard UI |

**Note on `isActorOwner` DI implementation (`features/portfolio/setup.js`):**
The injected `isActorOwner` function checks if the actorId exists and `is_void=false` in `vc.actors` — it does NOT verify `actor_owners`. This is a weaker check than `assertActorOwnsVportActorController` used elsewhere in the dashboard. See Section 8.

#### VCSM App Controllers

| Function | Ownership Gate | Callers |
|---|---|---|
| `ctrlListPortfolio(actorId, options)` | None (wraps public read) | `useVportPortfolio` hook |
| `ctrlGetPortfolioItem(itemId, options)` | None (wraps public read) | `useVportPortfolio` hook |
| `invalidatePortfolioCache(actorId)` | N/A | `useVportPortfolio` hook (optimistic ops) |
| `addPortfolioMediaWithRecord({ itemId, actorId, url, ... })` | Delegates to engine `addMedia` which gates ownership | `usePortfolioItemSubmit` hook |
| `probeVportPortfolioController({ actorId, identity, userId, email })` | None — diagnostic only | `useVportPortfolioProbe` hook |
| `ctrlSavePortfolioDetail(portfolioItemId, detail)` | None explicitly — no actorId parameter | `usePortfolioItemSubmit` hook |

---

### Hooks

**`useVportPortfolio(actorId)` — `features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js`**
- Props consumed: `actorId` (string)
- State managed: `items`, `loading`, `loadingMore`, `hasMore`, `error`, `selectedItem`, `selectedItemDetail`, `loadingDetail`, `filterTag`
- Controller called: `ctrlListPortfolio`, `ctrlGetPortfolioItem`, `invalidatePortfolioCache`
- Returns: full surface — `items`, `allItems`, `loading`, `hasMore`, `error`, `loadMore`, `reload`, `allTags`, `filterTag`, `setFilterTag`, `selectedItem`, `selectedItemDetail`, `loadingDetail`, `openItem`, `closeItem`, `optimisticRemove`, `optimisticAdd`, `optimisticUpdate`, `getItem`

**`usePortfolioItemSubmit({ isEdit, editItemId, ... })` — component-local hook**
- Props consumed: form values, file list, actorId, vportType flags, upload callback
- State managed: `saving`, `error`
- Controllers called: `createItem` / `updateItem` (engine, direct), `addPortfolioMediaWithRecord`, `ctrlSavePortfolioDetail` (locksmith only), `publishLocksmithPortfolioUpdateAsPostController` (locksmith share-to-feed)
- Returns: `{ saving, error, handleSubmit }`

**`usePortfolioMediaUpload({ actorId })` — component-local hook**
- Props consumed: `actorId`
- State managed: none (delegates to `@media` engine)
- Engine called: `useMediaUpload` from `@media` engine with `scope: 'portfolio_media'`
- Returns: `{ upload, uploading, error, reset }`

**`useVportOwnership(viewerActorId, targetActorId)` — used in screen**
- Returns `{ isOwner, ownershipLoading }` — gates the entire portfolio screen

**`useVportPortfolioProbe({ actorId, identity })` — DEV ONLY**
- State managed: `probe`, `probing`, `traceEvents`
- Controller called: `probeVportPortfolioController`
- Returns: `{ probe, probing, traceEvents, runProbe, clearTrace }`

**`usePublishBarbershopPortfolioPost({ actorId })`**
- Returns: `{ publishBarbershopPortfolioPost }` — non-blocking post publish on portfolio create

---

### Screens / Components

**`VportDashboardScreen.jsx`**
- Hooks: `useIdentity`, `useVportPublicDetails`, `useProfilesOps`, `useDesktopBreakpoint`, `useVportOwnership`
- Renders: `DashboardCard` grid; tapping "Portfolio" card fires `openPortfolio` → `navigate(/actor/:actorId/dashboard/portfolio)`
- Ownership gate: `isOwner` check before rendering any content

**`VportDashboardPortfolioScreen.jsx`**
- Hooks: `useIdentity`, `useDesktopBreakpoint`, `useVportOwnership`, `useVportPortfolio` (via profiles adapter), `usePublishBarbershopPortfolioPost` (via profiles adapter)
- Renders: add button → `PortfolioItemForm` (create mode), edit click → `PortfolioItemForm` (edit mode), list → `PortfolioManagerCard[]`, dev-only `PortfolioBugsBunnyPanel`
- Navigation: back button → `/actor/:actorId/dashboard`
- Direct engine import: `deleteItem from "@portfolio"` — calls engine controller directly without going through `ctrlListPortfolio`/adapter

**`PortfolioItemForm.jsx`**
- Hooks: `usePortfolioMediaUpload`, `usePortfolioItemSubmit`
- Renders: kind picker, title/description/tags inputs, locksmith detail fields (conditional), file picker, share-to-feed checkbox, save/cancel buttons
- No navigation

**`PortfolioManagerCard.jsx`**
- No hooks
- Renders: thumbnail, title, tags, photo count, edit/delete buttons
- Emits: `onEdit(item)`, `onDelete(item)` — purely presentational

**`PortfolioBugsBunnyPanel.jsx`** — DEV ONLY
- Hook: `useVportPortfolioProbe`
- Renders: collapsible probe panel; assertions, raw JSON fields, engine trace events
- Only mounted when `import.meta.env.DEV` is true

---

## 5. Engine Dependency

**Engine Name:** `engines/portfolio`
**Entry Point:** `engines/portfolio/index.js` → `src/adapters/index.js`

**What it provides:**
- Full CRUD lifecycle for portfolio items (`createItem`, `updateItem`, `deleteItem`, `getPortfolioItem`, `listPortfolio`)
- Media management (`addMedia`, `removeMedia`)
- Tag management (`manageTags`)
- Domain models (`PortfolioItemModel`, `PortfolioMediaModel`, `BarberDetailsModel`, `LocksmithDetailsModel`)
- Domain event bus (`EVENTS`, `on`, `emit`)
- Dependency injection interface (`configurePortfolioEngine`)

**How VCSM wires it in:**
1. `apps/VCSM/src/features/portfolio/setup.js` calls `configurePortfolioEngine({ supabaseClient, isActorOwner, debugReporter })` at boot via `main.jsx`
2. The `@portfolio` path alias resolves to `engines/portfolio/index.js`
3. VCSM app consumers import through:
   - `@/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js` for read operations (with TTL cache)
   - Direct `@portfolio` imports in `addPortfolioMediaWithRecord.controller.js` and `usePortfolioItemSubmit.js`
   - Direct `@portfolio` import for `deleteItem` in `VportDashboardPortfolioScreen.jsx`

**Engine-to-App dependency direction:** Correct — engine never imports from app.

---

## 6. Data Contract

### Tables Read

| Table | Schema | Columns Read | Where |
|---|---|---|---|
| `portfolio_items` | `vport` | `id, profile_id, service_id, title, description, portfolio_kind, visibility, cover_media_id, is_featured, is_pinned, is_active, is_deleted, sort_order, source_post_id, created_by_actor_id, published_at, created_at, updated_at, deleted_at` | Engine DAL |
| `portfolio_media` | `vport` | `id, portfolio_item_id, profile_id, url, media_type, media_role, alt_text, width, height, duration_seconds, sort_order, is_active, created_at, updated_at` | Engine DAL |
| `portfolio_tags` | `vport` | `portfolio_item_id, tag, created_at` | Engine DAL |
| `barber_portfolio_details` | `vport` | `portfolio_item_id, haircut_style, fade_type, beard_service, hair_length, client_age_group, has_design, has_color, has_beard, notes, created_at, updated_at` | Engine DAL |
| `locksmith_portfolio_details` | `vport` | `portfolio_item_id, job_type, property_type, lock_type, hardware_brand, service_mode, has_before_after, is_emergency_job, is_security_upgrade, estimated_duration_minutes, display_in_portfolio, notes, created_at, updated_at` | Engine DAL |
| `profiles` | `vport` | `id` (profile_id lookup by actor_id) | Engine DAL |
| `actors` | `vc` | `id` (used in `isActorOwner` DI resolver) | `portfolio/setup.js` |

### Tables Written

| Table | Schema | Operation | Columns Written | Where |
|---|---|---|---|---|
| `portfolio_items` | `vport` | INSERT | `profile_id, title, description, portfolio_kind, service_id, visibility, source_post_id, created_by_actor_id, published_at` | Engine DAL |
| `portfolio_items` | `vport` | UPDATE | `title, description, portfolio_kind, service_id, visibility, is_featured, is_pinned, sort_order` | Engine DAL |
| `portfolio_items` | `vport` | Soft DELETE | `is_deleted, deleted_at` | Engine DAL |
| `portfolio_media` | `vport` | INSERT | `portfolio_item_id, profile_id, url, media_type, media_role, alt_text, width, height, duration_seconds, sort_order` | Engine DAL |
| `portfolio_media` | `vport` | UPDATE | `media_asset_id` | App DAL (`portfolioMediaRecord.write.dal.js`) |
| `portfolio_media` | `vport` | DELETE (hard) | by id | Engine DAL |
| `portfolio_tags` | `vport` | UPSERT/DELETE | `portfolio_item_id, tag` | Engine DAL |
| `locksmith_portfolio_details` | `vport` | UPSERT | 13 fields | App DAL (`locksmithPortfolioDetails.write.dal.js`) |

---

## 7. Cross-Feature Dependency Map

### What portfolio feature imports from other features

| Import Source | Imported In | Via Adapter? | Verdict |
|---|---|---|---|
| `@/features/profiles/adapters/profiles.adapter` | `VportDashboardPortfolioScreen.jsx` | YES — adapter | COMPLIANT |
| `@/features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller` | `usePortfolioItemSubmit.js` | Internal (same feature) | COMPLIANT |
| `@/features/auth/adapters/auth.adapter` (`ConsentCheckbox`) | `PortfolioItemForm.jsx` | YES — adapter | COMPLIANT |
| `@/features/media/adapters/media.adapter` | `addPortfolioMediaWithRecord.controller.js` | YES — adapter | COMPLIANT |
| `@/features/media/adapters/mediaAppId.adapter` | `addPortfolioMediaWithRecord.controller.js` | YES — adapter | COMPLIANT |
| `@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller` | `usePortfolioItemSubmit.js` | NO — direct cross-feature import | **VIOLATION** |
| `@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller` | `usePortfolioItemSubmit.js` | NO — direct cross-feature import | **VIOLATION** |
| `@portfolio` (`deleteItem`) | `VportDashboardPortfolioScreen.jsx` | NO — direct engine import bypassing VCSM controller | **ARCHITECTURE NOTE** |
| `@portfolio` (`createItem`, `updateItem`) | `usePortfolioItemSubmit.js` | NO — direct engine import bypassing VCSM controller | **ARCHITECTURE NOTE** |

### What imports the portfolio feature from outside

| Consumer | What It Uses | Via Adapter? |
|---|---|---|
| `apps/VCSM/src/main.jsx` | `setupVcsmPortfolioEngine` from `features/portfolio/setup` | N/A — bootstrap |
| Other screens using the public portfolio tab | `useVportPortfolio` from `profiles.adapter` | YES |
| `usePublishBarbershopPortfolioPost` consumers | via `profiles.adapter` | YES |

---

## 8. Security Surface (read-only observations)

### Write Path: `createItem`
- **Ownership gate:** `isActorOwner(actorId)` — DI-injected in `portfolio/setup.js`
- **DI implementation:** Checks `vc.actors` WHERE `id = actorId AND is_void = false` — confirms actor exists but does NOT verify the caller actually owns this actor via `actor_owners`
- **Risk:** Any authenticated session that can resolve an actorId and that actor is not voided passes this check. This is weaker than the `assertActorOwnsVportActorController` pattern used elsewhere in the dashboard (which explicitly queries `actor_owners`).
- **RLS assumed:** Yes. Engine comments and README indicate RLS is the final enforcement layer.

### Write Path: `updateItem`
- **Ownership gate:** Profile ownership cross-check (`existing.profile_id !== callerProfileId`) + `isActorOwner`. Same DI weakness as above.
- **RLS assumed:** Yes.

### Write Path: `deleteItem`
- **Ownership gate:** Same two-step profile + DI check.
- **Called from:** `VportDashboardPortfolioScreen.jsx` directly imports `deleteItem from "@portfolio"` — bypasses the VCSM `VportPortfolio.controller.js` wrapper. The engine controller handles its own gate.
- **RLS assumed:** Yes.

### Write Path: `addMedia`
- **Ownership gate:** Profile ownership check + `isActorOwner` DI.
- **RLS assumed:** Yes.

### Write Path: `dalDeletePortfolioMedia` (in `removeMedia`)
- **Ownership gate:** Only `isActorOwner` — no profile cross-check. Comment in file: "RLS enforces ownership."
- **Note:** `removeMedia` is not currently wired to any UI in the dashboard portfolio screen.

### Write Path: `manageTags`
- **Ownership gate:** `item.actor_id !== actorId` check — **ARCHITECTURE NOTE:** `portfolio_items` has no `actor_id` column; the row field is `profile_id`. This ownership check will always pass (both sides undefined/null evaluate equal or one is null), making this gate non-functional as written. The `isActorOwner` DI call still runs but the profile-level check is dead.
- **Note:** `manageTags` is not currently wired to any UI in the dashboard.

### Write Path: `ctrlSavePortfolioDetail` (locksmith details)
- **Ownership gate:** None. The function accepts `portfolioItemId` and `detail` only — no `actorId` parameter. Relies on screen-level `isOwner` check and RLS.

### Write Path: `updatePortfolioMediaAssetIdDAL`
- **Ownership gate:** None. Called as a non-blocking fire-and-forget from `addPortfolioMediaWithRecord.controller.js` after the media row already exists.

### Screen-Level Gate
`VportDashboardPortfolioScreen.jsx` calls `useVportOwnership` and returns early if `!isOwner`. This provides a UI-layer gate but is not a substitute for controller-level ownership verification.

---

## 9. Dev / Debug Tooling

### In-Screen Panel
- **`PortfolioBugsBunnyPanel.jsx`** — located at `apps/VCSM/src/features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx`
- **Protection:** `if (!import.meta.env.DEV) return null` — will not render in production
- **Capabilities:** Run diagnostic probe (calls `probeVportPortfolioController`), view engine trace events from `portfolioTraceStore`, clear trace
- **NOTE:** This panel is inlined inside the production screen file at `VportDashboardPortfolioScreen.jsx`. It is conditionally rendered but the import is not tree-shaken unless the bundler eliminates the dead branch. Per CLAUDE.md, debuggers should live in `zNOTFORPRODUCTION/debuggers/` — this panel is inside the production feature tree.

### Trace Store
- **`apps/VCSM/src/features/portfolio/setup.js`** exports `portfolioTraceStore` — in-memory pub/sub store, populated by engine `debugReporter` only in DEV mode

### Probe Controller
- **`apps/VCSM/src/features/dashboard/vport/controller/probeVportPortfolio.controller.js`** — a dev diagnostic controller used only by `useVportPortfolioProbe`. Not protected by an `import.meta.env.DEV` guard in the file itself — the guard is in the hook that calls it.

### No entries in `apps/VCSM/src/dev/diagnostics/` reference portfolio. No portfolio group in the dev diagnostics panel system.

---

## 10. MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Card in CARD_CATALOG with title/body/handlerKey; engine CLAUDE.md documents scope | None |
| Owner defined | PARTIAL | Engine has CLAUDE.md scope rules; VCSM feature has no owner declaration | No explicit feature owner or team assignment documented |
| Entry points mapped | PASS | Route `/actor/:actorId/dashboard/portfolio` registered; card navigation wired | None |
| Controllers present/delegated | PASS | Engine controllers cover full CRUD; VCSM has wrapper controller with TTL cache | `manageTags` has a dead ownership gate; `ctrlSavePortfolioDetail` has no actorId param |
| DAL/repository present/delegated | PASS | All tables have explicit-column DALs; no `select('*')` violations | `portfolioItems.rpc.dal.js` is a dead empty file — should be deleted |
| Models/transformers present | PASS | All 4 entity types have pure transform models | `DomainPortfolioListResult` typedef references `actorId` which `PortfolioItemModel` does not output (outputs `profileId`) — type drift |
| Hooks/view models present | PASS | `useVportPortfolio` is comprehensive; `usePortfolioItemSubmit` handles submit logic | `usePortfolioItemSubmit` contains orchestration logic that arguably belongs in a controller |
| Screens/components present | PASS | Portfolio screen, item form, manager card all present and functional | No skeleton/shimmer state on individual `PortfolioManagerCard` during operations |
| Services/adapters present | PASS | `profiles.adapter.js` correctly exports hooks; engine adapters index is clean | Direct `@portfolio` imports in screen and hook bypass VCSM controller layer |
| Database objects mapped | PASS | 8 tables documented; columns explicitly selected | `vport.portfolio_item_metrics` and `vport.portfolio_item_services` referenced in engine CLAUDE.md but no DAL files exist for them |
| Authorization path mapped | PARTIAL | Engine DI `isActorOwner` + profile cross-check documented; screen-level gate documented | DI `isActorOwner` does not check `actor_owners`; `manageTags` ownership gate is dead code; `ctrlSavePortfolioDetail` has no actorId |
| Cache/runtime behavior mapped | PASS | 60-second TTL list cache in `VportPortfolio.controller.js`; optimistic updates in `useVportPortfolio`; cache invalidated on optimistic ops | Cache only covers page 1 (offset=0); edit/delete do not force a fresh fetch — rely on optimistic state |
| Error/loading/empty states mapped | PARTIAL | Loading spinner and error banner in screen; empty state with icon; delete uses optimistic rollback | `PortfolioManagerCard` has no loading state during delete (relies on `deleting` prop but card doesn't show spinner); edit loading is a full-section overlay, not per-card |
| Documentation linked | FAIL | Engine has a CLAUDE.md scoping doc; no logan documentation file exists for this module | No `logan/` doc file for the portfolio feature or engine integration |
| Tests/validation noted | FAIL | No test files found for portfolio feature or engine | Zero test coverage; no diagnostic group in dev panel |
| Native parity noted | N/A | Not applicable — no iOS native build in scope | — |
| Engine dependencies mapped | PASS | `engines/portfolio` fully mapped; DI configuration documented; `@media` engine used for upload | `@media` engine dependency not documented in engine CLAUDE.md |

---

## 11. Missing Pieces

- **Dead DAL file:** `engines/portfolio/src/dal/portfolioItems.rpc.dal.js` is an empty deprecated file. Safe to delete.

- **Dead ownership gate in `manageTags`:** The check `item.actor_id !== actorId` will always be non-functional because `portfolio_items` has no `actor_id` column — the field is `profile_id`. The `isActorOwner` DI gate still runs, but the profile-level authz is broken. `manageTags` is not wired to UI yet — but this must be fixed before exposure.

- **Weak `isActorOwner` DI implementation:** `portfolio/setup.js` injects an `isActorOwner` that only checks `vc.actors.id` + `is_void=false`. It does not consult `actor_owners`. The correct check for VPORT dashboard write paths is `assertActorOwnsVportActorController` (via `booking.adapter`). Reliance on RLS alone creates a risk if RLS policies have gaps.

- **`ctrlSavePortfolioDetail` has no actorId param:** The locksmith portfolio detail save path (`locksmithOwner.controller.js:ctrlSavePortfolioDetail`) does not accept or validate `actorId`. Authorization relies entirely on the screen-level ownership gate and RLS. This is out of contract with the controller layer's responsibility for ownership verification.

- **Direct `@portfolio` imports bypassing VCSM controller:** `VportDashboardPortfolioScreen.jsx` imports `deleteItem` directly from `@portfolio`. `usePortfolioItemSubmit.js` imports `createItem` and `updateItem` directly from `@portfolio`. These bypass the VCSM-side `VportPortfolio.controller.js` wrapper which provides caching. Deletes and creates do not go through the cache-aware layer, meaning the cache is only busted via the optimistic operation's explicit `invalidatePortfolioCache()` call.

- **Cross-feature direct imports (VIOLATIONS):** `usePortfolioItemSubmit.js` imports directly from `@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller` and `@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller`. These are internal controller paths in the `profiles/kinds/vport` feature and should only be accessed through an adapter.

- **`PortfolioBugsBunnyPanel` in production tree:** The dev panel lives at `features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx` — inside the production feature tree. Per workspace rules, debuggers must live in `zNOTFORPRODUCTION/debuggers/`. It is DEV-guarded but is not in the correct location.

- **No portfolio diagnostic group in `dev/diagnostics/`:** Other features (bookings, profiles, chat) have dedicated diagnostic groups. Portfolio has no group — debugging relies only on the inline `PortfolioBugsBunnyPanel`.

- **Unimplemented tables:** `vport.portfolio_item_metrics` and `vport.portfolio_item_services` are listed in the engine's CLAUDE.md as in-scope tables but have no DAL files, no models, and are not referenced in any controller.

- **No logan documentation:** There is no `logan/` file documenting the portfolio module, its architecture, its DI setup, or its engine integration contract.

- **Type drift:** `types/index.js` `DomainPortfolioItem` typedef declares `actorId` as a field, but `PortfolioItemModel` outputs `profileId`, not `actorId`. The typedef and model are out of sync.

- **`usePortfolioItemSubmit` contains orchestration logic:** The hook manages the multi-step sequence (create item → upload media → save locksmith detail → publish post) that belongs in a controller by VCSM architecture contract. Business orchestration in hooks is a contract violation.

---

## 12. Build Priority Recommendations

**Priority 1 — Security / Authorization**
1. Fix the `isActorOwner` DI implementation in `portfolio/setup.js` to check `actor_owners` (not just `vc.actors`). This aligns the engine gate with the platform ownership contract.
2. Add `actorId` param to `ctrlSavePortfolioDetail` in `locksmithOwner.controller.js` and verify ownership before calling the locksmith portfolio DAL.
3. Fix the dead ownership gate in `manageTags` — change `item.actor_id` to `item.profile_id` and compare against `callerProfileId`.

**Priority 2 — Architecture Violations**
4. Create a `locksmith.adapter.js` (or extend an existing profiles adapter) to expose `ctrlSavePortfolioDetail` and `publishLocksmithPortfolioUpdateAsPostController` through an adapter boundary. Remove direct cross-feature imports from `usePortfolioItemSubmit.js`.
5. Extract the multi-step submit orchestration in `usePortfolioItemSubmit.js` into a VCSM-side controller (e.g., `submitPortfolioItem.controller.js`). The hook should call the controller; not directly call multiple engine + feature controllers in sequence.
6. Move `deleteItem`, `createItem`, and `updateItem` calls to go through the VCSM `VportPortfolio.controller.js` wrapper (or a new write-side equivalent) so all portfolio mutations are centralized.

**Priority 3 — Dev Tooling / Hygiene**
7. Move `PortfolioBugsBunnyPanel.jsx` to `zNOTFORPRODUCTION/debuggers/portfolio/` and update the import in `VportDashboardPortfolioScreen.jsx` to reference it outside the production feature tree.
8. Delete `engines/portfolio/src/dal/portfolioItems.rpc.dal.js`.
9. Fix the `DomainPortfolioItem` typedef — replace `actorId` with `profileId` to match what `PortfolioItemModel` actually returns.

**Priority 4 — Feature Completeness**
10. Implement DALs, models, and controller support for `vport.portfolio_item_metrics` and `vport.portfolio_item_services` if those tables are live — or remove them from the engine CLAUDE.md scope if they are deferred.
11. Add a portfolio diagnostic group to `src/dev/diagnostics/groups/` for consistent dev observability coverage.
12. Create a `logan/` documentation file for the portfolio module covering DI setup, engine integration, authorization design, and known constraints.
