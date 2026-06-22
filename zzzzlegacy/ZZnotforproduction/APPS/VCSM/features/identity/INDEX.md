---
name: vcsm.identity.index
description: VCSM identity feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / identity

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 1 | ensureVcsmPlatformBootstrap.controller.js; refreshActorDirectory.controller.js is a thin re-export |
| DAL files | 3 | provision.rpc.dal.js, refreshActorDirectory.dal.js (exports 2 functions) |
| Hooks | 1 | useIdentityOps.js |
| Models | 0 | No model files — return shapes are inline; gap noted |
| Screens | 0 | No UI — identity is a platform-layer module |
| Components | 0 | No UI components |
| Adapters | 2 | identity.adapter.js (public surface), identityOps.adapter.js (ops re-export) |
| Barrels | 7 | Callgraph-detected barrel nodes across adapters, setup, and resolver |
| Tests | 0 | No test files — critical gap on auth-path code |
| Routes | 0 | No routes — this module has no screen entry points |
| Total source files | 9 | setup.js + 2 adapters + 2 controllers + 2 DAL + 1 hook + 1 resolver |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | platform | — | dalProvisionVcsmIdentity → provision_vcsm_identity |
| rpc | identity | — | refreshActorDirectoryRow → refresh_actor_directory_row |

## Security-Sensitive Surfaces

Both write surfaces are high-sensitivity:

- `platform.provision_vcsm_identity` — SECURITY DEFINER RPC that atomically creates/ensures 6 platform identity rows (user_app_access, user_app_accounts, user_app_preferences, user_app_state, user_app_actor_links, vc.actors bridge). Inputs are userId and actorId — both must be validated. Called on every login; idempotent but high-privilege.
- `identity.refresh_actor_directory_row` — updates the actor's row in the identity.actor_directory materialized view. Called after profile/vport mutations platform-wide. Fire-and-forget pattern means failures are silent by default.

VENOM audit recommended for the provisioning RPC input path.

## Engine Dependencies

- identity (configures + consumes — setup.js calls configureIdentityEngine)
- directory (referenced in adapter surface; identity.actor_directory is the target of refresh operations)
- hydration (listed by scanner as engine dependency)

## Routes

No routes in route-map for this feature. Identity has no screen or route entry points.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (placeholder — needs authoring) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
