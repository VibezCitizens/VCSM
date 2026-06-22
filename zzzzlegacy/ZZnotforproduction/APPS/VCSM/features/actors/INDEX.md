---
name: vcsm.actors.index
description: VCSM actors feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / actors

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-07
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 1 | searchActors.controller.js |
| DAL files | 1 | searchActors.dal.js |
| Hooks | 0 | None — consumers own search wiring |
| Models | 2 | mapSearchActorRow + mapSearchActorsRows (single file: searchActors.model.js) |
| Screens | 0 | API-only module |
| Components | 0 | API-only module |
| Adapters | 1 | actors.adapter.js |
| Barrels | 0 | None |
| Tests | 0 | No test coverage |
| Routes | 0 | No routes registered |
| Total source files | 4 | adapter, controller, dal, model |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | identity | — | searchActorsDAL → search_actor_directory |

## Security-Sensitive Surfaces

The `identity.search_actor_directory` RPC controls actor discovery visibility. The DAL enforces a `public`-only filter when `viewerActorId` is null, meaning unauthenticated callers cannot receive non-public actors. The DB function itself is the final authority on result filtering. Any change to the `p_filter` parameter logic or the RPC's SECURITY DEFINER grants would be a security-sensitive surface change. No financial, auth-mutation, or moderation tables are touched.

## Engine Dependencies

- directory (identity.search_actor_directory RPC)

## Routes

No routes in route-map for this feature. The actors module is consumed programmatically by other features; it has no standalone screen or route entry point.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (content is PLACEHOLDER — needs authoring) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
