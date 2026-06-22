---
title: Resolvers Module — Index
status: STUB
feature: identity
module: resolvers
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/identity/resolvers/
scanner-version: 1.1.0
---

# identity / modules / resolvers

Identity resolution layer. Provides the injectable resolver pattern consumed by other features to perform actor identity lookups without direct engine coupling. Single file — high cross-feature consumption surface.

## Module Summary

| Field | Value |
|---|---|
| Module | resolvers |
| Feature | identity |
| Source Path | apps/VCSM/src/features/identity/resolvers/ |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | 0 (read-only) |
| Resolver Files | 1 |
| THOR Blockers | Indirect — resolver is invoked in the bootstrap path that carries THOR blockers |

## Known Source Files (ARCHITECT-verified)

### Resolvers
| File | Role |
|---|---|
| resolvers/vcsmIdentity.resolver.js | Injectable resolver — consumed by other features for actor identity resolution; wraps identity engine read access |

## Write Surfaces

None. This module is read-only — it resolves existing identity state, does not create or mutate it.

## Engine Dependencies

| Engine | Usage |
|---|---|
| identity | Identity engine read access via resolver pattern |

## Security Flags (ARCHITECT + VENOM/BW derived)

- MEDIUM: VEN-IDENTITY-003 — cross-user identity commit guard silently skipped when `_engineMeta.userId` is null; resolver may return identity context for wrong session user
- MEDIUM: VEN-IDENTITY-004 — identity engine 120s result cache is SPA-safe only; if resolver is consumed in an SSR context, stale identity data may be returned
- MEDIUM: VEN-IDENTITY-005 — Wentrex role resolution (organization_memberships, parent_student_links) not scoped to organizationId — cross-org role bleed possible (may be resolver-layer)
- MEDIUM: BW-IDENT-003 — no actor-kind gate enforcement at controller level; booking eligibility (canCitizenBook) is selector-only; resolver consumers not verified to enforce kind checks

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Read vcsmIdentity.resolver.js — confirm resolver interface (what does it expose, what does it return?)
- [ ] Identify all cross-feature consumers of vcsmIdentity.resolver.js
- [ ] Confirm whether 120s cache is in the resolver itself or in the identity engine layer
- [ ] Assess VEN-IDENTITY-005 — is Wentrex role resolution in this resolver or in the identity engine?
- [ ] Confirm whether resolver is ever called in an SSR context
