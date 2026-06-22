---
title: Block Module — Security
status: STUB
feature: block
module: block
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
---

# block / modules / block — SECURITY

## Status

STUB. No module-scoped security review completed for this module.

## Existing Review Coverage

Parent feature has active security reviews:
- VENOM: see `features/block/outputs/`
- ELEKTRA: see `features/block/outputs/`
- BlackWidow: see `features/block/outputs/`

Reviews were completed 2026-06-04. Module-level attribution not yet extracted.

## Known Security Flag (ARCHITECT-derived — UNVERIFIED)

### BLOCK-SEC-001 — Settings Parallel DAL Bypass

| Field | Value |
|---|---|
| Severity | UNVERIFIED — likely HIGH |
| Surface | Settings feature DAL (not this module) |
| Flag | `dalInsertBlock` / `dalDeleteBlockByTarget` in settings feature call block write operations directly, bypassing `blockActorController` ownership check |
| Enforcement Backstop | RLS on moderation schema |
| Impact | If RLS is misconfigured, a settings-routed block operation could be performed without ownership assertion |

This module (`blockActor.controller.js`) performs ownership verification before invoking the RPC. The parallel path in settings does not. This is a cross-module trust boundary issue — the settings feature should route through this controller, not directly to DAL.

## Risk Surfaces (unverified)

| Surface | Risk | Confidence |
|---|---|---|
| moderation.block_actor RPC | Must validate invoking actor owns the `actorId` — no spoofing target identity | UNVERIFIED |
| moderation.unblock_actor RPC | Same ownership assertion required | UNVERIFIED |
| blockActor.controller.js toggle routing | Toggle reads current status before deciding block vs unblock — TOCTOU risk if status read and write are not atomic | UNVERIFIED |
| BlockConfirmModal.jsx | Client-side confirmation gate only — server must not rely on modal having been shown | UNVERIFIED |

## TODO

- [ ] Extract block-module-specific findings from existing feature-level VENOM/ELEKTRA/BW reviews
- [ ] Confirm RPC parameter ownership assertion — does blockActor.controller.js explicitly assert actorId === session actor?
- [ ] Confirm RLS policy on moderation schema for block_actor RPC
- [ ] Verify settings parallel path (dalInsertBlock) — does it hit the same RLS, and is that sufficient?
- [ ] Assess TOCTOU risk on toggle — is there a unique constraint or atomic RPC that prevents race condition?
