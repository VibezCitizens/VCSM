---
title: Resolvers Module — Security
status: STUB
feature: identity
module: resolvers
source: venom-bw-derived
created: 2026-06-05
---

# identity / modules / resolvers — SECURITY

## Status

STUB. Findings below are attributed to the resolver layer based on VENOM and BlackWidow review of the identity feature (2026-06-04). This module is read-only — its security risk derives from correctness failures in the identity it resolves, not from mutations.

## Active Security Reviews

| Review | Status | Report |
|---|---|---|
| VENOM | COMPLETE (2026-06-04) | `features/identity/outputs/2026/06/04/Venom/` |
| BlackWidow | COMPLETE (2026-06-04) | `features/identity/outputs/2026/06/04/BlackWidow/` |
| ELEKTRA | NEVER RUN | — |

## Open Findings Attributed to This Module

### RESOLVERS-SEC-001 — VEN-IDENTITY-003 / BW-IDENT-002

| Field | Value |
|---|---|
| Finding IDs | VEN-IDENTITY-003 (VENOM), BW-IDENT-002 (BlackWidow) |
| Severity | MEDIUM |
| Status | OPEN |
| Surface | resolvers/vcsmIdentity.resolver.js (identity engine context path) |
| Description | Cross-user identity commit guard silently skipped when _engineMeta.userId is null. Resolver may return identity context for the wrong session user. |
| Risk | Consuming features that gate on resolved identity may operate with incorrect actor context |

### RESOLVERS-SEC-002 — VEN-IDENTITY-004

| Field | Value |
|---|---|
| Finding ID | VEN-IDENTITY-004 |
| Severity | MEDIUM |
| Status | OPEN |
| Surface | resolvers/vcsmIdentity.resolver.js (120s engine cache) |
| Description | Identity engine 120s result cache is SPA-safe only. If this resolver is ever consumed outside a React SPA context (SSR, worker, test runner), stale identity is served without invalidation. |

### RESOLVERS-SEC-003 — BW-IDENT-003

| Field | Value |
|---|---|
| Finding ID | BW-IDENT-003 |
| Severity | MEDIUM |
| Status | UNRESOLVED (open) |
| Surface | Resolver consumers (features that use actorKind from resolver) |
| Description | No actor-kind gate enforcement at controller level — canCitizenBook and similar eligibility checks are selector-only. Resolver returns actorKind but consuming controllers are not verified to enforce kind gates before processing requests. |

### RESOLVERS-SEC-004 — VEN-IDENTITY-005

| Field | Value |
|---|---|
| Finding ID | VEN-IDENTITY-005 |
| Severity | MEDIUM |
| Status | OPEN |
| Surface | Wentrex role resolution path (if in resolver layer) |
| Description | Wentrex role resolution via organization_memberships / parent_student_links not scoped to organizationId — cross-org role bleed possible. May reside in identity engine rather than resolver. Attribution unconfirmed. |

## TODO

- [ ] Read vcsmIdentity.resolver.js — confirm which findings are in this file vs the engine layer
- [ ] Run ELEKTRA on identity feature
- [ ] Confirm whether VEN-IDENTITY-005 applies to VCSM or Wentrex only
- [ ] Enumerate consuming features and verify actor-kind gate enforcement (BW-IDENT-003)
- [ ] Confirm SSR usage — is resolver ever called outside a React SPA context?
