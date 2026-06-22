---
title: Identity Module — Security
status: STUB
feature: identity
module: identity
source: venom-bw-derived
created: 2026-06-05
---

# identity / modules / identity — SECURITY

## Status

STUB. Findings below are extracted from feature-level VENOM and BlackWidow reviews (2026-06-04). This is the highest-severity security posture of any feature reviewed to date.

## Active Security Reviews

| Review | Status | Report |
|---|---|---|
| VENOM | COMPLETE (2026-06-04) | `features/identity/outputs/2026/06/04/Venom/` |
| BlackWidow | COMPLETE (2026-06-04) | `features/identity/outputs/2026/06/04/BlackWidow/` |
| ELEKTRA | NEVER RUN | — |

## THOR BLOCKERS

### IDENT-SEC-001 — BW-IDENT-001

| Field | Value |
|---|---|
| Finding ID | BW-IDENT-001 |
| Severity | HIGH — THOR BLOCKER |
| Status | PARTIAL (open) |
| Surface | controller/ensureVcsmPlatformBootstrap.controller.js + adapters/identity.adapter.js |
| Description | Bootstrap RPC ownership pre-check absent. ensureVcsmPlatformBootstrap accepts arbitrary actorId without verifying caller owns it before calling provision_vcsm_identity. identity.adapter.js exposes this controller directly to UI callers. |
| Risk | Any authenticated caller can trigger SECURITY DEFINER provisioning for an actorId they do not own |
| Backstop | DB RPC may enforce ownership — not verified |

### IDENT-SEC-002 — BW-IDENT-002 / VEN-IDENTITY-003

| Field | Value |
|---|---|
| Finding IDs | BW-IDENT-002, VEN-IDENTITY-003 |
| Severity | HIGH — THOR BLOCKER |
| Status | BYPASSED (open) |
| Surface | controller/ensureVcsmPlatformBootstrap.controller.js (identity engine _engineMeta path) |
| Description | null engineMeta.userId silently skips the cross-user identity commit guard. Identity can be committed for the wrong session user if engine returns null userId in context. |

### IDENT-SEC-003 — BW-IDENT-006 / VEN-IDENTITY-002

| Field | Value |
|---|---|
| Finding IDs | BW-IDENT-006, VEN-IDENTITY-002 |
| Severity | HIGH — THOR BLOCKER |
| Status | PARTIAL (open) |
| Surface | controller/ensureVcsmPlatformBootstrap.controller.js (ACCESS_DENIED handler) |
| Description | Self-heal replay path for revoked users. ACCESS_DENIED from identity engine is caught and returns null, which re-triggers bootstrap — re-provisioning a user whose access was deliberately revoked. |
| Risk | Access revocation can be bypassed via normal login flow |

## Other Open Findings

### IDENT-SEC-004 — BW-IDENT-004

| Field | Value |
|---|---|
| Finding ID | BW-IDENT-004 |
| Severity | MEDIUM |
| Status | PARTIAL (open) |
| Surface | controller/refreshActorDirectory.controller.js + dal/refreshActorDirectory.dal.js |
| Description | refreshActorDirectoryRow accepts arbitrary actorId without ownership check — any authenticated caller can trigger directory refresh for any actor |

### IDENT-SEC-005 — BW-IDENT-007

| Field | Value |
|---|---|
| Finding ID | BW-IDENT-007 |
| Severity | LOW |
| Status | PARTIAL (open) |
| Surface | hooks/useIdentityOps.js |
| Description | refreshVcActorDirectory exposed via useIdentityOps with no ownership guard — UI component can trigger refresh for arbitrary actorId |

### IDENT-SEC-006 — VEN-IDENTITY-004

| Field | Value |
|---|---|
| Finding ID | VEN-IDENTITY-004 |
| Severity | MEDIUM |
| Status | OPEN |
| Surface | engines/identity (120s cache — consumed via setup.js) |
| Description | 120s result cache is SPA-safe only. If identity engine is ever used in SSR context, stale identity data returned |

## TODO

- [ ] Run ELEKTRA on identity feature (never run — SECURITY DEFINER path is high priority target)
- [ ] Verify provision_vcsm_identity RPC — does it enforce caller ownership at the DB layer?
- [ ] Trace ACCESS_DENIED handling — confirm whether revoked user check exists before self-heal path
- [ ] Confirm null userId guard — is there a code path that sets _engineMeta.userId to null in normal operation?
- [ ] Document what "revoked" means in platform terms — which table/flag controls access revocation?
