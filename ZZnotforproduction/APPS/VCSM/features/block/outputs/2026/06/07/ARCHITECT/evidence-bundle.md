---
name: vcsm.block.evidence-bundle
description: ARCHITECT V2 evidence bundle — VCSM:block — 2026-06-07
metadata:
  type: evidence-bundle
  owner: ARCHITECT
  generated: 2026-06-07T10:00:00Z
  scanner-version: 1.1.0
---

# ARCHITECT Evidence Bundle — VCSM:block
**Generated:** 2026-06-07T10:00:00Z
**Scanner Version:** 1.1.0
**Scope:** VCSM:block
**Confidence:** HIGH (security surfaces)

---

## Source Files Read

| Path | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/block/dal/block.write.dal.js | dal | 1-61 |
| apps/VCSM/src/features/block/dal/block.check.dal.js | dal | 1-62 |
| apps/VCSM/src/features/block/dal/block.read.dal.js | dal | 1-52 |
| apps/VCSM/src/features/block/controllers/blockActor.controller.js | controller | 1-85 |
| apps/VCSM/src/features/block/controllers/getBlockStatus.controller.js | controller | 1-12 |
| apps/VCSM/src/features/block/controllers/getBlockedActorSet.controller.js | controller | 1-5 |
| apps/VCSM/src/features/block/hooks/useBlockActorAction.js | hook | 1-22 |
| apps/VCSM/src/features/block/adapters/hooks/useBlockActorAction.adapter.js | adapter | 1-N |
| apps/VCSM/src/features/block/adapters/hooks/useBlockStatus.adapter.js | adapter | 1-N |

**Total source files validated:** 7 of 18 (all security-sensitive files read)

---

## Layer Counts (VCSM:block module)

| Layer | Count | Files |
|---|---|---|
| controller | 3 | blockActor, getBlockStatus, getBlockedActorSet |
| dal | 3 | block.write, block.check, block.read |
| hook | 3 | useBlockActions, useBlockActorAction, useBlockStatus |
| adapter | 4 | useBlockActorAction.adapter, useBlockStatus.adapter, ActorActionsMenu, BlockConfirmModal.adapter |
| component | 3 | BlockButton, BlockConfirmModal, BlockedState |
| model | 0 | ABSENT — plain object returns from DAL |
| module | 2 | index.js, BlockGate.jsx |

---

## Write Surfaces (RPCs)

| Surface | Operation | RPC | Schema | Ownership Check | Priority |
|---|---|---|---|---|---|
| blockActor (DAL) | rpc | block_actor | moderation | PRESENT (controller asserts assertingActorId=blockerActorId) | MEDIUM |
| unblockActor (DAL) | rpc | unblock_actor | moderation | PRESENT (controller asserts + checks blockedByMe) | MEDIUM |

## Read Surfaces

| Surface | Operation | Table | Schema | Ownership Check | Priority |
|---|---|---|---|---|---|
| checkBlockStatus | select | blocks | moderation | ABSENT at controller level for ctrlGetBlockStatus | HIGH |
| filterBlockedActors | select | blocks | moderation | ABSENT at controller level for ctrlGetBlockedActorSet | HIGH |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| ctrlGetBlockStatus | controllers/getBlockStatus.controller.js | No caller ownership assertion — any actor pair queryable | HIGH |
| ctrlGetBlockedActorSet | controllers/getBlockedActorSet.controller.js | No caller ownership assertion — any actorId's block set enumerable | HIGH |
| filterBlockedActors | dal/block.read.dal.js:22-27 | Unbounded candidateActorIds — no array length cap | MEDIUM |
| console.error (block.write.dal.js) | dal/block.write.dal.js:34,51 | Logs actor IDs to browser console in production | MEDIUM |
| console.error (block.check.dal.js) | dal/block.check.dal.js:34 | Logs actor IDs to browser console in production | MEDIUM |
| console.error (block.read.dal.js) | dal/block.read.dal.js:36 | Logs actor IDs to browser console in production | MEDIUM |

---

## Security Guards Confirmed Present [SOURCE_VERIFIED]

| Guard | Location | Status |
|---|---|---|
| assertingActorId === blockerActorId | blockActor.controller.js:28 | VERIFIED PRESENT |
| assertingActorId === blockerActorId (unblock) | blockActor.controller.js:49 | VERIFIED PRESENT |
| blockedByMe check before unblock | blockActor.controller.js:55 | VERIFIED PRESENT |
| isUuid() validation on both actorIds | block.check.dal.js:14 | VERIFIED PRESENT |
| isUuid() validation on actorId + candidates | block.read.dal.js:18-22 | VERIFIED PRESENT |
| cannot block self guard | block.write.dal.js:22 | VERIFIED PRESENT |
| sessionActorId from useIdentity() | hooks/useBlockActorAction.js:7 | VERIFIED PRESENT |

---

## Missing Guards [SOURCE_VERIFIED]

| Guard | Location | Risk |
|---|---|---|
| session assertion for ctrlGetBlockStatus | controllers/getBlockStatus.controller.js | Any caller can query block status between any two actors |
| session assertion for ctrlGetBlockedActorSet | controllers/getBlockedActorSet.controller.js | Any caller can enumerate any actorId's block set |
| candidateActorIds length cap | dal/block.read.dal.js | Unbounded array → massive PostgREST .or() filter |

---

## Call Chains Summary

| Chain | Path | Ownership Checked | Confidence |
|---|---|---|---|
| CHAIN-block-001 | useBlockActorAction → blockActorController(blockerActorId, blockedActorId, sessionActorId) → checkBlockStatus + blockActorDAL → moderation.block_actor RPC | YES | HIGH |
| CHAIN-block-002 | useBlockStatus → useBlockStatus.adapter → ctrlGetBlockStatus(actorId, targetActorId) → checkBlockStatus → moderation.blocks SELECT | NO | HIGH |
| CHAIN-block-003 | [consumer] → ctrlGetBlockedActorSet(actorId, candidateActorIds) → filterBlockedActors → moderation.blocks SELECT | NO | HIGH |

---

## Behavior IDs
None — BEHAVIOR.md is PLACEHOLDER.

---

## Architecture State

- Write path is well-guarded (block/unblock controllers enforce session match)
- Read path is unguarded (getBlockStatus, getBlockedActorSet lack session assertion)
- No model layer — block status returned as plain JS object
- console.error in all 3 DALs leaks actor IDs to production console
- 0 tests
- moderation schema RLS audit not performed in this pass — DB AUDIT NOTE required
- Scanner maps FRESH: generated 2026-06-07T08:11:09Z

---

## DB AUDIT NOTES (deferred)

| DB Object | Risk | Suggested Later SQL Review |
|---|---|---|
| moderation.block_actor RPC | App-layer asserts caller, but RPC must also verify blocker_actor_id ownership | Verify RPC enforces: blocker_actor_id IN (SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid()) |
| moderation.blocks SELECT RLS | checkBlockStatus reads blocks table directly — RLS must restrict visibility | Verify: policy restricts rows to where blocker_actor_id or blocked_actor_id is owned by caller |
