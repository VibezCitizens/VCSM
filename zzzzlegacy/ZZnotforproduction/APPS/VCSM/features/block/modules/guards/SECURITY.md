---
title: Guards Module — Security
status: STUB
feature: block
module: guards
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
---

# block / modules / guards — SECURITY

## Status

STUB. No module-scoped security review completed for this module.

## Existing Review Coverage

Parent feature has active security reviews:
- VENOM: see `features/block/outputs/`
- ELEKTRA: see `features/block/outputs/`
- BlackWidow: see `features/block/outputs/`

Reviews were completed 2026-06-04. Module-level attribution not yet extracted.

## Known Security Flag (ARCHITECT-derived — UNVERIFIED)

### GUARDS-SEC-001 — Settings Parallel DAL Bypass (upstream impact)

| Field | Value |
|---|---|
| Severity | UNVERIFIED |
| Surface | Settings feature DAL (not this module) — but impacts gate correctness |
| Flag | If `dalInsertBlock` / `dalDeleteBlockByTarget` in settings feature bypass ownership checks and successfully mutate the block table, `block.check.dal.js` and `block.read.dal.js` will read the (possibly incorrect) state and serve it to BlockGate.jsx |
| Impact | If RLS is the only enforcement backstop and it is misconfigured, a spoofed block entry could cause BlockGate to incorrectly gate a non-blocked actor |

This module is read-only — it does not create the vulnerability. The upstream mutation path determines the integrity of this module's gate output.

## Risk Surfaces (unverified)

| Surface | Risk | Confidence |
|---|---|---|
| block.check.dal.js | Must filter by asserting actor only — must not leak block relationships of other actors | UNVERIFIED |
| block.read.dal.js | Set query must be scoped to authenticated actor — no unauthorized enumeration of another actor's block list | UNVERIFIED |
| getBlockedActorSet.controller.js | Return value used in feed/inbox filtering — must be actor-scoped to prevent cross-actor leakage | UNVERIFIED |
| BlockGate.jsx | Client-side gate only — must not be the sole enforcement layer for access control | UNVERIFIED |

## TODO

- [ ] Extract guards-module-specific findings from existing feature-level VENOM/ELEKTRA/BW reviews
- [ ] Confirm block.check.dal.js query scopes to authenticated actor pair only
- [ ] Confirm block.read.dal.js query cannot enumerate another actor's block list (auth scope)
- [ ] Assess BlockGate.jsx — confirm it is a UI convenience gate only, not a security boundary
- [ ] Confirm RLS on moderation schema for read operations (block.check / block.read)
