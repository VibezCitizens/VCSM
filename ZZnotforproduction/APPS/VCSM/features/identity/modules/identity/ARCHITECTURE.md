---
title: Identity Module — Architecture
status: STUB
feature: identity
module: identity
source: architect-derived
created: 2026-06-05
---

# identity / modules / identity — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04 report. Verification required.

## Layer Stack (unverified)

### Login Bootstrap Flow
```
[app auth hook / login handler]
  └── identity.adapter.js (public surface)
        └── ensureVcsmPlatformBootstrap.controller.js
              └── engines/identity → configureIdentityEngine (setup.js)
              └── dal/provision.rpc.dal.js
                    └── platform.provision_vcsm_identity RPC (SECURITY DEFINER)
                          └── atomically creates/ensures:
                              ├── platform.user_app_access
                              ├── platform.user_app_accounts
                              ├── platform.user_app_preferences
                              ├── platform.user_app_state
                              ├── platform.user_app_actor_links
                              └── vc.actors (bridge row)
```

### Revoked User Self-Heal Path (SECURITY FINDING)
```
ensureVcsmPlatformBootstrap.controller.js
  └── engines/identity → ACCESS_DENIED
        └── catch → return null
              └── re-triggers bootstrap (re-provisions revoked user)
```

### Actor Directory Refresh Flow
```
[profile/vport mutation handler (cross-feature call)]
  └── identityOps.adapter.js
        └── refreshActorDirectory.controller.js (thin re-export)
              └── dal/refreshActorDirectory.dal.js
                    └── identity.refresh_actor_directory_row RPC
                          └── identity.actor_directory (materialized view UPDATE)
  [fire-and-forget — failure is silent]
```

### UI Ops Surface
```
[UI component]
  └── useIdentityOps.js
        └── refreshVcActorDirectory → identityOps.adapter.js
              └── refreshActorDirectory.controller.js → DAL → RPC
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| setup.js | Engine setup | ARCHITECT-derived |
| adapters/identity.adapter.js | Public adapter (inbound surface) | ARCHITECT-derived |
| adapters/identityOps.adapter.js | Ops re-export adapter | ARCHITECT-derived |
| controller/ensureVcsmPlatformBootstrap.controller.js | Controller (bootstrap) | ARCHITECT-derived |
| controller/refreshActorDirectory.controller.js | Controller (directory refresh) | ARCHITECT-derived |
| dal/provision.rpc.dal.js | DAL (SECURITY DEFINER RPC) | ARCHITECT-derived |
| dal/refreshActorDirectory.dal.js | DAL (directory RPC) | ARCHITECT-derived |
| hooks/useIdentityOps.js | Hook (UI ops surface) | ARCHITECT-derived |

## Write Surfaces

| Surface | Schema | RPC | Security Class |
|---|---|---|---|
| dalProvisionVcsmIdentity | platform | provision_vcsm_identity | SECURITY DEFINER — highest privilege |
| refreshActorDirectoryRow | identity | refresh_actor_directory_row | Standard RPC |

## Module Boundaries

- This module owns all bootstrap, provisioning, and directory refresh operations
- Resolver pattern (identity lookups by consuming features) is owned by the resolvers module
- identity.adapter.js is the only approved public surface — direct imports of controllers/DAL by other features are not approved

## TODO

- [ ] Confirm ownership assertion in ensureVcsmPlatformBootstrap — does it verify session userId === actorId before calling RPC?
- [ ] Confirm provision_vcsm_identity RPC signature — what inputs does it require?
- [ ] Document error handling for the bootstrap path — what happens if RPC fails on login?
- [ ] Confirm fire-and-forget failure mode — does refreshActorDirectory have a catch block?
- [ ] Confirm setup.js initialization timing — is it called at module load or lazily?
