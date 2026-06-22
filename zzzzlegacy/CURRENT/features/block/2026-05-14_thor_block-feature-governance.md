---
scope: VCSM
feature: block
date: 2026-05-14
decision: BLOCKED (native) / CAUTION (PWA)
---

# THOR Release Gate — Block Feature Governance Pass

Full report appended to canonical Logan doc:
`zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md`

## Decision Summary

| Platform | Decision | Reason |
|---|---|---|
| PWA | CAUTION | All architecture violations resolved. batch4 pending deployment. No CRITICAL risks. |
| iOS Native | BLOCKED | 3 FALCON P0 gaps: chat compose disable unverified, fail-closed not runtime-tested, follow gate has no native owner. |
| Android | BLOCKED | NOT STARTED. |

## Release Blockers

1. FALCON P0-1 — chat compose disable at controller level not verified (NTB-03)
2. FALCON P0-2 — fail-closed behavior not runtime-tested on all four surfaces (NTB-02)
3. FALCON P0-3 — native follow/friend gate has no owner and no transfer evidence (NDF-01)

## Code Changes This Session (all RESOLVED)

- SF-01: `invalidateFeedBlockCache` moved from controller to hook layer
- SF-02: dev-only DAL exports moved to `dev/diagnostics/dal/block.diagnostics.dal.js`
- SF-03/IF-04: `profiles/dal/friends/blockedActorSet.read.dal.js` deleted
- IF-01: dead `isBlocked` export deleted from `block.check.dal.js`
- IF-02: dead `toggleBlockActor` export deleted from `block.write.dal.js`

## Pending Deployment Actions

- batch4 migration (`20260510100000_fix_block_actor_bidirectional_follows.sql`) — staging → production
- Historical orphan backfill (actor_follows + friend_ranks) after batch4
- step2 section 2D — `vc.friend_ranks` SELECT policy
- Delete `applyBlockSideEffects.js` after batch4 deploys
