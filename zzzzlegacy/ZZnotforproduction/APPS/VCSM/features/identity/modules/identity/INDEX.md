---
title: Identity Module — Index
status: STUB
feature: identity
module: identity
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/identity/
scanner-version: 1.1.0
---

# identity / modules / identity

Bootstrap and ops layer for platform identity. Owns the authentication bootstrap lifecycle, actor directory refresh, and the public adapter surface consumed by the rest of the platform. Called on every login — auth-critical path with zero test coverage and multiple THOR blockers.

## Module Summary

| Field | Value |
|---|---|
| Module | identity |
| Feature | identity |
| Source Path | apps/VCSM/src/features/identity/ |
| Screens | 0 — no UI |
| Routes | 0 |
| Write Surfaces | 2 (platform.provision_vcsm_identity RPC, identity.refresh_actor_directory_row RPC) |
| Controllers | 2 |
| DAL Files | 2 |
| Hooks | 1 |
| Adapters | 2 |
| Setup | 1 |
| THOR Blockers | 4 (BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, VEN-IDENTITY-002) |

## Known Source Files (ARCHITECT-verified)

### Setup
| File | Role |
|---|---|
| setup.js | Configures and registers the identity engine |

### Controllers
| File | Role | Security Flag |
|---|---|---|
| controller/ensureVcsmPlatformBootstrap.controller.js | Called on every login; idempotent provisioning of 6 platform identity rows | THOR BLOCKER — accepts arbitrary actorId, no ownership pre-check; self-heal path re-provisions revoked users |
| controller/refreshActorDirectory.controller.js | Thin re-export; triggers directory row refresh after profile/vport mutations | Fire-and-forget — silent failures |

### DAL
| File | Role | Notes |
|---|---|---|
| dal/provision.rpc.dal.js | dalProvisionVcsmIdentity → platform.provision_vcsm_identity RPC | SECURITY DEFINER — high privilege; atomically creates 6 rows |
| dal/refreshActorDirectory.dal.js | refreshActorDirectoryRow → identity.refresh_actor_directory_row RPC | Fire-and-forget; failure is silent |

### Hooks
| File | Role | Security Flag |
|---|---|---|
| hooks/useIdentityOps.js | Exposes refreshVcActorDirectory to UI | BW-IDENT-007: no ownership guard — any component can trigger refresh for arbitrary actorId |

### Adapters
| File | Role |
|---|---|
| adapters/identity.adapter.js | Public surface — exposes bootstrap + identity ops to consuming features |
| adapters/identityOps.adapter.js | Ops re-export surface |

## Write Surfaces

| Operation | Schema | RPC | Notes |
|---|---|---|---|
| rpc | platform | provision_vcsm_identity | SECURITY DEFINER; creates user_app_access, user_app_accounts, user_app_preferences, user_app_state, user_app_actor_links, vc.actors bridge |
| rpc | identity | refresh_actor_directory_row | Updates identity.actor_directory materialized view |

## Engine Dependencies

| Engine | Usage |
|---|---|
| identity | configureIdentityEngine called in setup.js |
| hydration | Scanner-detected dependency |

## Security Flags

- THOR BLOCKER: BW-IDENT-001 — ensureVcsmPlatformBootstrap accepts arbitrary actorId without ownership pre-check; identity.adapter.js exposes directly to UI
- THOR BLOCKER: BW-IDENT-002 / VEN-IDENTITY-003 — null engineMeta.userId silently skips cross-user ownership guard
- THOR BLOCKER: BW-IDENT-006 / VEN-IDENTITY-002 — self-heal replay: ACCESS_DENIED from engine caught and returns null, re-triggering bootstrap for revoked users
- HIGH: BW-IDENT-007 — useIdentityOps.js exposes refreshVcActorDirectory with no ownership guard
- MEDIUM: BW-IDENT-004 — refreshActorDirectoryRow accepts arbitrary actorId without ownership check
- MEDIUM: VEN-IDENTITY-004 — 120s result cache is SPA-safe only; risky in SSR context

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm exact 6 rows created by provision_vcsm_identity RPC
- [ ] Document self-heal guard — what condition triggers re-provision vs blocks it for revoked users?
- [ ] Confirm ownership assertion path in ensureVcsmPlatformBootstrap — does it verify session userId matches actorId?
- [ ] Document fire-and-forget failure pattern for refreshActorDirectory — is there any retry or error logging?
- [ ] Run ELEKTRA (never run on this feature)
