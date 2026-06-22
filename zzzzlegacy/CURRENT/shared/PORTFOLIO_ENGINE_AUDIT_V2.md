# Portfolio Engine — Architecture Audit V2

**Version:** 2
**Date:** 2026-04-16
**Status:** Post-RLS fix (createdByActorId null, debug instrumentation, optimistic delete)

> This file is immutable. Do not modify. Future changes must produce V3.

---

## Engine Root

`/Users/vcsm/Desktop/VCSM/engines/portfolio/`

---

## Purpose

Manages work showcase content for vport actors. Provides CRUD for portfolio items, media attachments, tag management, and type-specific detail records (barber, locksmith). App-agnostic — configured via dependency injection.

---

## Scope

**Included:**
- Portfolio item lifecycle (create, update, soft-delete, get, list)
- Media attachment (insert, delete)
- Tag management (insert, delete, replace)
- Public listing with media + tag enrichment
- Category-specific detail reads (barber, locksmith)
- Ownership enforcement via injected `isActorOwner`
- Dev trace observability via injected `debugReporter`

**Excluded:**
- File upload (app responsibility)
- UI rendering
- Public profile page layout
- Wentrex (not a consumer)

---

## Entry Points

| Type | Name | File |
|------|------|------|
| DI setup | `configurePortfolioEngine` | `src/config.js` |
| Public API | All controllers re-exported | `src/adapters/index.js` |
| Events | `EVENTS`, `onPortfolioEvent` | `src/events.js` |

---

## Data Flow

```
listPortfolio(actorId)
  └─ dalGetProfileIdByActorId          → vport.profiles
  └─ dalListPortfolioItemsByProfileId  → vport.portfolio_items
  └─ dalListMediaByItemIds             → vport.portfolio_media
  └─ dalListTagsByItemIds              → vport.portfolio_tags

createItem(actorId)
  └─ isActorOwner(actorId)             → vc.actors (via DI)
  └─ debug?.({ step: 'CREATE_ITEM_OWNER_CHECK' })   [DEV trace]
  └─ dalGetProfileIdByActorId          → vport.profiles
  └─ debug?.({ step: 'CREATE_ITEM_PROFILE_LOOKUP' }) [DEV trace]
  └─ dalInsertPortfolioItem({ ..., createdByActorId: null })
                                       → vport.portfolio_items INSERT
     NOTE: createdByActorId is always null — vc.current_actor_id() returns
     the user actor (auth.uid()), not the vport actor. RLS allows null explicitly.
  └─ debug?.({ step: 'CREATE_ITEM_INSERT_PAYLOAD' }) [DEV trace]
  └─ dalInsertPortfolioTags            → vport.portfolio_tags UPSERT

addMedia(itemId, actorId, url)
  └─ dalGetPortfolioItemById           → vport.portfolio_items
  └─ dalGetProfileIdByActorId          → vport.profiles
  └─ item.profile_id === callerProfileId  (ownership check)
  └─ isActorOwner(actorId)
  └─ dalInsertPortfolioMedia           → vport.portfolio_media INSERT

getPortfolioItem(itemId)
  └─ dalGetPortfolioItemById           → vport.portfolio_items
  └─ dalListMediaByItemId              → vport.portfolio_media
  └─ dalListTagsByItemId               → vport.portfolio_tags
  └─ dalGetBarberDetailsByItemId       → vport.barber_portfolio_details (optional)
  └─ dalGetLocksmithDetailsByItemId    → vport.locksmith_portfolio_details (optional)
```

---

## Source of Truth

| Data | Table | Schema |
|------|-------|--------|
| Items | `portfolio_items` | `vport` |
| Media | `portfolio_media` | `vport` |
| Tags | `portfolio_tags` | `vport` |
| Barber details | `barber_portfolio_details` | `vport` |
| Locksmith details | `locksmith_portfolio_details` | `vport` |
| Profile resolution | `profiles` | `vport` |

**Key column note:** `vport.portfolio_items` and `vport.portfolio_media` use `profile_id` (not `actor_id`). Engine resolves `profile_id` from `actor_id` via `dalGetProfileIdByActorId` before all write paths.

**RLS note:** `created_by_actor_id` on `vport.portfolio_items` must be `null` on INSERT. The DB function `vc.current_actor_id()` resolves to the user actor (via `auth.uid()`), not the active vport actor. Passing the vport `actor_id` here causes an RLS mismatch. INSERT policy: `(created_by_actor_id IS NULL OR created_by_actor_id = vc.current_actor_id())`.

---

## Dependencies

| Dependency | Source | Injected? |
|-----------|--------|-----------|
| `supabaseClient` | VCSM app | Yes — via `configurePortfolioEngine` |
| `isActorOwner` | VCSM app | Yes — via `configurePortfolioEngine` |
| `debugReporter` | VCSM app | Yes — via `configurePortfolioEngine` (null in production) |
| `vc.actors` | DB | Indirectly (via `isActorOwner` in VCSM setup) |
| No other engines | — | — |

---

## VCSM Consumer Architecture

```
apps/VCSM/src/features/portfolio/setup.js
  → configurePortfolioEngine({ supabaseClient, isActorOwner, debugReporter })
  → exports portfolioTraceStore (dev pub/sub, last 50 events)

apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js
  → 60s TTL cache wrapper around @portfolio engine
  → exports: ctrlListPortfolio, ctrlGetPortfolioItem, invalidatePortfolioCache

apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js
  → pagination state (items, loading, hasMore, filterTag)
  → optimisticRemove(itemId) — removes from state + busts cache + returns rollback fn
  → itemsRef mirrors items synchronously for rollback snapshot

apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx
  → owner CRUD (create, delete) + PortfolioBugsBunnyPanel (DEV diagnostic)
  → handleDelete: optimisticRemove → deleteItem → rollback on failure

Dev trace path (DEV only):
  engine → debugReporter → portfolioTraceStore → PortfolioBugsBunnyPanel
```

---

## File Map

```
engines/portfolio/
├── CLAUDE.md                               Scope rules + DB table list
└── src/
    ├── adapters/
    │   └── index.js                        Public API surface
    ├── config.js                           DI container (supabaseClient, isActorOwner, debugReporter)
    ├── events.js                           Domain event emitter
    ├── types/
    │   └── index.js                        JSDoc type definitions
    ├── dal/
    │   ├── portfolioItems.read.dal.js      Items read + dalGetProfileIdByActorId
    │   ├── portfolioItems.write.dal.js     Items write
    │   ├── portfolioItems.rpc.dal.js       TOMBSTONED — safe to delete
    │   ├── portfolioMedia.read.dal.js      Media read
    │   ├── portfolioMedia.write.dal.js     Media write
    │   ├── portfolioTags.read.dal.js       Tags read
    │   ├── portfolioTags.write.dal.js      Tags write
    │   ├── barberDetails.read.dal.js       Barber category details
    │   └── locksmithDetails.read.dal.js    Locksmith category details
    ├── model/
    │   ├── PortfolioItem.model.js          Row → DomainPortfolioItem
    │   ├── PortfolioMedia.model.js         Row → DomainPortfolioMedia
    │   ├── BarberDetails.model.js          Row → barber domain object
    │   └── LocksmithDetails.model.js       Row → locksmith domain object
    ├── controller/
    │   ├── listPortfolio.controller.js     Public list + enrichment
    │   ├── getPortfolioItem.controller.js  Single item full detail
    │   ├── createItem.controller.js        Item creation + debug trace (V2 change)
    │   ├── updateItem.controller.js        Item update + tags
    │   ├── deleteItem.controller.js        Soft-delete
    │   ├── addMedia.controller.js          Media attach
    │   ├── removeMedia.controller.js       Media remove
    │   └── manageTags.controller.js        Tag operations
    └── services/                           Reusable domain logic (internal)
```

---

## Changes Since V1

| Category | Change |
|----------|--------|
| `createItem.controller.js` | `createdByActorId: actorId` → `createdByActorId: null` — fixes RLS 403 caused by `vc.current_actor_id()` returning user actor, not vport actor |
| `createItem.controller.js` | Added `getDebugReporter()` import from `config.js`; added `debug?.()` calls at owner check, profile lookup, and insert payload steps |
| `config.js` | Added `debugReporter` as third DI parameter (nullable function) — already re-exported via `getDebugReporter()` |
| `apps/VCSM/src/features/portfolio/setup.js` | Added `portfolioTraceStore` (dev pub/sub, max 50 events); added `debugReporter` DI parameter that routes to `portfolioTraceStore` in DEV, `null` in PROD |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js` | Added `itemsRef` + `optimisticRemove(itemId)` + `invalidatePortfolioCache` import; exported `optimisticRemove` |
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx` | Updated `handleDelete` with optimistic removal + rollback; added `PortfolioBugsBunnyPanel` (DEV-only, pending refactor to `zNOTFORPRODUCTION/debuggers/portfolio/`) |

---

## Pending (Not Yet Executed)

| Item | Description |
|------|-------------|
| SQL migration | `vport.portfolio_items` RLS policies (INSERT/SELECT/UPDATE/DELETE via `actor_can_manage_profile`) |
| SQL migration | `vport.actor_can_manage_profile` + `actor_can_view_profile` — fix to use `auth.uid()` directly (Path 1: `owner_user_id = auth.uid()`; Path 2: `profile_actor_access JOIN actor_owners WHERE user_id = auth.uid()`) |
| SQL migration | `vport.portfolio_media` RLS policies (4 policies + INSERT consistency guard) |
| Refactor | Move `PortfolioBugsBunnyPanel` from `VportDashboardPortfolioScreen.jsx` to `zNOTFORPRODUCTION/debuggers/portfolio/` with 4-file structure (store.js, helpers.js, PortfolioDebugPanel.jsx, index.js) |
| DB-5 ready queue | Backfill `vc.actor_owners` for pre-migration vport actors (activates Path 2 of `actor_can_manage_profile`) |

---

## Debug Notes

- If `dalGetProfileIdByActorId` returns null, the actor has no `vport.profiles` row.
- All controller steps emit to `debugReporter` in DEV — subscribe via `portfolioTraceStore.subscribe(fn)`.
- `PortfolioBugsBunnyPanel` probe queries: `vport.profiles`, `vport.profile_actor_access`, `vc.actor_owners`, `supabase.auth.getSession()`.
- `portfolioItems.rpc.dal.js` is tombstoned — delete once confirmed no callers.
- `isActorOwner` failure → check `apps/VCSM/src/features/portfolio/setup.js`.

---

## Verification Notes

- Engine changes confined to `engines/portfolio/src/controller/createItem.controller.js`.
- App changes confined to `apps/VCSM/` — no cross-root modifications.
- `debugReporter: null` in production — zero trace overhead.
- `optimisticRemove` is a pure closure — no secondary server calls, no race conditions with `inFlightRef`.

---

## Related Logan Docs

Canonical System Doc: `zNOTFORPRODUCTION/logan/engines/engines.portfolio.system-architecture.md`

Supporting Docs:
- `zNOTFORPRODUCTION/logan/architecture/dependency-map.md` (engine consumer map)
- `zNOTFORPRODUCTION/logan/vports/vcsm.vport.business-pipeline.v2.md` (vport context)

Previous Audit: `zNOTFORPRODUCTION/logan/engines/PORTFOLIO_ENGINE_AUDIT_V1.md`
