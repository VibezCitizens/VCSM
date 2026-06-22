---
title: Identity Module — Behavior
status: STUB
feature: identity
module: identity
source: architect-derived
created: 2026-06-05
---

# identity / modules / identity — BEHAVIOR

## Status

STUB. Feature-level BEHAVIOR.md is a PLACEHOLDER — no behavior contract has been written at any level (THOR BLOCKER: VEN-IDENTITY-001 / BW-IDENT-009). All entries below are seeded from ARCHITECT and VENOM/BW evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-IDENT-IDENT-001 | Platform Bootstrap | ensureVcsmPlatformBootstrap called on every login; idempotent — provisions 6 identity rows if absent; no-ops if already present | UNVERIFIED |
| BEH-IDENT-IDENT-002 | Provision Identity RPC | dalProvisionVcsmIdentity calls platform.provision_vcsm_identity SECURITY DEFINER RPC with userId + actorId | UNVERIFIED |
| BEH-IDENT-IDENT-003 | Self-Heal Bootstrap | ACCESS_DENIED response from identity engine caught; returns null; triggers re-bootstrap — inadvertently re-provisions revoked users | UNVERIFIED — SECURITY FINDING |
| BEH-IDENT-IDENT-004 | Refresh Actor Directory | refreshActorDirectory.controller.js triggers identity.refresh_actor_directory_row RPC; fire-and-forget (failure is silent) | UNVERIFIED |
| BEH-IDENT-IDENT-005 | Cross-User Guard | identity engine checks _engineMeta.userId against session user before committing identity; null userId silently skips guard | UNVERIFIED — SECURITY FINDING |
| BEH-IDENT-IDENT-006 | Engine Configuration | setup.js registers and configures the identity engine at app initialization | UNVERIFIED |
| BEH-IDENT-IDENT-007 | Ops Refresh (UI) | useIdentityOps.js exposes refreshVcActorDirectory — allows UI components to trigger directory refresh directly | UNVERIFIED |

## Route Entry Points

None. Identity has no screen or route entry points.

## Critical Invariants (unverified — from VENOM/BW finding descriptions)

The following invariants must hold for every bootstrap invocation. These are INFERRED from security findings — none are documented in a formal behavior contract:

1. Bootstrap must only be called for the currently authenticated user's actorId
2. Revoked users must not be able to re-provision via bootstrap self-heal path
3. Cross-user identity commit must be blocked when userId is null — never silently skipped
4. provision_vcsm_identity RPC must be idempotent — safe to call on every login

## TODO

- [ ] Write formal BEHAVIOR.md contract (THOR BLOCKER — no §9 invariants currently exist)
- [ ] Confirm bootstrap entry point — which hook/component calls ensureVcsmPlatformBootstrap?
- [ ] Document the exact 6 rows provisioned by provision_vcsm_identity
- [ ] Document self-heal trigger condition vs block condition for revoked users
- [ ] Confirm whether fire-and-forget failure in refreshActorDirectory has any observability (Sentry, log)
