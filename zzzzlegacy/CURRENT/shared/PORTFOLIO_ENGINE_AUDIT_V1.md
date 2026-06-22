# Portfolio Engine — Architecture Audit V1

**Version:** 1
**Date:** 2026-04-16
**Status:** Post-migration (schema migration from vc.vport_portfolio_* → vport.portfolio_*)

> This file is immutable. Do not modify. Future changes must produce V2.

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
  └─ dalGetProfileIdByActorId          → vport.profiles
  └─ dalInsertPortfolioItem            → vport.portfolio_items INSERT
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

**Key column note:** `vport.portfolio_items` and `vport.portfolio_media` use `profile_id` (not `actor_id`). The engine resolves `profile_id` from `actor_id` via `dalGetProfileIdByActorId` before all write paths and list reads.

---

## Dependencies

| Dependency | Source | Injected? |
|-----------|--------|-----------|
| `supabaseClient` | VCSM app | Yes — via `configurePortfolioEngine` |
| `isActorOwner` | VCSM app | Yes — via `configurePortfolioEngine` |
| `vc.actors` | DB | Indirectly (via `isActorOwner` in VCSM setup) |
| No other engines | — | — |

---

## File Map

```
engines/portfolio/
├── CLAUDE.md                               Scope rules + DB table list
├── docs/
│   └── PORTFOLIO_ENGINE_AUDIT_V1.md        This file
└── src/
    ├── adapters/
    │   └── index.js                        Public API surface
    ├── config.js                           DI container
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
    │   ├── createItem.controller.js        Item creation with tags
    │   ├── updateItem.controller.js        Item update + tags
    │   ├── deleteItem.controller.js        Soft-delete
    │   ├── addMedia.controller.js          Media attach
    │   ├── removeMedia.controller.js       Media remove
    │   └── manageTags.controller.js        Tag operations
    └── services/                           Reusable domain logic (internal)
```

---

## Changes Since Previous Version

**V1 is the inaugural audit.** This document captures the engine state after the schema migration from `vc.vport_portfolio_*` to `vport.portfolio_*`.

**Key changes made in this session (2026-04-16):**

| Category | Change |
|----------|--------|
| Schema | `.schema('vc')` → `.schema('vport')` across all 9 DAL files |
| Tables | `vport_portfolio_items` → `portfolio_items`, `vport_portfolio_media` → `portfolio_media`, `vport_portfolio_tags` → `portfolio_tags`, `vport_barber_portfolio_details` → `barber_portfolio_details`, `vport_locksmith_portfolio_details` → `locksmith_portfolio_details` |
| Columns | `actor_id` → `profile_id` in items and media tables (DALs + models) |
| New DAL | `dalGetProfileIdByActorId` — resolves `vport.profiles.id` from `actor_id` |
| Renamed | `dalListPortfolioItemsByActor` → `dalListPortfolioItemsByProfileId` |
| Removed | `dalRpcGetVportPortfolio` (RPC targeted old schema) — tombstoned |
| Controllers | `listPortfolio` rebuilt without RPC; `createItem`, `addMedia`, `updateItem`, `deleteItem` updated with profile resolution and corrected ownership checks |
| Model | `actorId: raw.actor_id` → `profileId: raw.profile_id` in both models |
| CLAUDE.md | Updated DB table list to reflect `vport.*` schema |

---

## Debug Notes

- If `dalGetProfileIdByActorId` returns null, the actor has no `vport.profiles` row. Verify vport creation pipeline (see DB-1/DB-2 in `.tp-ready.md`).
- All DAL functions accept `trace` for step-level reporting.
- `portfolioItems.rpc.dal.js` is tombstoned — delete once no callers remain outside the engine.
- `isActorOwner` failure → check `apps/VCSM/src/features/portfolio/setup.js`.

---

## Verification Notes

- All 17 changed files are inside `engines/portfolio/` — no cross-root changes.
- No app-level code was modified during the migration.
- `apps/VCSM/src/features/portfolio/setup.js` passes `actorId` to controllers — this is correct and unchanged. Profile resolution happens internally in the engine.

---

## Related Logan Docs

Canonical System Doc: `zNOTFORPRODUCTION/logan/engines/engines.portfolio.system-architecture.md`

Supporting Docs:
- `zNOTFORPRODUCTION/logan/architecture/dependency-map.md` (engine consumer map)
- `zNOTFORPRODUCTION/logan/vports/vcsm.vport.business-pipeline.v2.md` (vport context)
