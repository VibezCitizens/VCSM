# IRONMAN — Block Feature Ownership Record

_Feature:_ `block`
_Application:_ `VCSM`
_Domain:_ Moderation / Safety
_Primary Code Root:_ `apps/VCSM/src/features/block/`
_File:_ `vcsm.block.owner.md`

---

## Ownership Summary

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | block feature | HIGH | Self-contained, no engine dependency |
| DAL ownership — moderation.blocks reads | block feature | HIGH | No other feature may own a DAL for this table |
| DAL ownership — moderation.blocks writes | block feature (via RPC only) | HIGH | Direct inserts are architecturally forbidden |
| Controller ownership | block feature | HIGH | All three controllers are block-feature-internal |
| UI ownership | block feature | HIGH | All UI files in features/block/ui/ |
| Hook / lifecycle ownership | block feature | HIGH | useBlockActions, useBlockStatus, useBlockActorAction |
| Adapter surface ownership | block feature | HIGH | adapters/hooks/ and adapters/ui/ are approved cross-feature surfaces |
| Data ownership — moderation.blocks | block feature | HIGH | Single canonical owner |
| Data ownership — vc.friend_ranks cleanup | block feature (pending migration) | MEDIUM | Currently unowned at runtime — batch4 not deployed |
| Security ownership (write path) | VENOM | HIGH | Trust boundary review authority |
| Migration ownership (block_actor RPC evolution) | CARNAGE | HIGH | batch4 migration gated by CARNAGE |
| Native parity ownership | FALCON | HIGH | iOS P0 items unresolved; Android not started |
| Documentation ownership | Logan | HIGH | Canonical doc: vcsm.dal.block.md |
| Release gate ownership | THOR | HIGH | Native blocked on FALCON P0 items |

---

## Code Roots

```
Primary path:     apps/VCSM/src/features/block/
Dev consumer:     apps/VCSM/src/dev/diagnostics/groups/block.group.js
Entry files:      apps/VCSM/src/features/block/index.js (barrel)
```

---

## Layer Map (Verified 2026-05-14)

```
DAL:
  block/dal/block.check.dal.js
    → checkBlockStatus()         ACTIVE — bidirectional check, returns { isBlocked, blockedByMe, blockedMe }
    [isBlocked() removed — IF-01 — 2026-05-14]

  block/dal/block.read.dal.js
    → filterBlockedActors()      ACTIVE — bulk OR query, returns Set of blocked actorIds
    [fetchActorsIBlocked(), fetchActorsWhoBlockedMe(), fetchBlockGraph() moved to dev/diagnostics/dal/ — SF-02 — 2026-05-14]

  block/dal/block.write.dal.js
    → blockActor()               ACTIVE — calls moderation.block_actor RPC
    → unblockActor()             ACTIVE — calls moderation.unblock_actor RPC
    [toggleBlockActor() removed — IF-02 — 2026-05-14]

  dev/diagnostics/dal/block.diagnostics.dal.js  (NEW — 2026-05-14)
    → fetchActorsIBlocked()      DEV-ONLY
    → fetchActorsWhoBlockedMe()  DEV-ONLY
    → fetchBlockGraph()          DEV-ONLY

Model:
  None — DAL returns flat primitives.

Controller:
  block/controllers/blockActor.controller.js
    → blockActorController()         ACTIVE
    → unblockActorController()       ACTIVE
    → toggleBlockActorController()   ACTIVE (dev/diagnostics only)
    [invalidateFeedBlockCache moved to hook layer — SF-01 — 2026-05-14]

  block/controllers/getBlockStatus.controller.js
    → ctrlGetBlockStatus()           ACTIVE

  block/controllers/getBlockedActorSet.controller.js
    → ctrlGetBlockedActorSet()       ACTIVE

Hook:
  block/hooks/useBlockActions.js       ACTIVE — now owns feed cache invalidation (SF-01)
  block/hooks/useBlockActorAction.js   ACTIVE
  block/hooks/useBlockStatus.js        ACTIVE

Adapter:
  block/adapters/hooks/useBlockStatus.adapter.js
  block/adapters/hooks/useBlockActorAction.adapter.js
  block/adapters/ui/ActorActionsMenu.jsx
  block/adapters/ui/BlockConfirmModal.adapter.js

Guard:
  block/guards/BlockGate.jsx

Component / UI:
  block/ui/BlockButton.jsx
  block/ui/BlockConfirmModal.jsx
  block/ui/BlockedState.jsx

Helper (dead — HOLD):
  block/helpers/applyBlockSideEffects.js
    → deleteFriendRankRowsBetweenActors()  DEAD — zero callers
    DELETE PATH: batch4 deploys → verify RPC cleanup → Wolverine deletes

Barrel:
  block/index.js
```

---

## Data Ownership Registry

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `moderation.blocks` | block feature | block (check/read DAL), notifications/inbox, settings/privacy, feed pipeline | block feature via RPC only | moderation schema RLS | CARNAGE | Logan — vcsm.dal.block.md |
| `moderation.block_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — `moderation.is_current_vc_actor` guard | CARNAGE | Logan — vcsm.dal.block.md |
| `moderation.unblock_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-guarded | CARNAGE | Logan — vcsm.dal.block.md |
| `vc.friend_ranks` (block cleanup) | social/friend (data) / block (cleanup) | friend suggestions, social scoring | block RPC (PENDING — batch4 not applied) | vc schema RLS | CARNAGE | Logan — vcsm.dal.block.md |
| `vc.actor_follows` (block deactivation) | social/follow (data) / block (deactivation) | follow/friend features | block RPC (one direction live; reverse in batch4) | vc schema RLS | CARNAGE | Logan — vcsm.dal.block.md |

---

## Rule Ownership Registry

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| Block status must be bidirectional | block feature | Controller — checkBlockStatus guard | LOW |
| Block writes must use RPCs only — no direct inserts | block feature | Architecture — no direct insert path exists | LOW |
| All moderation.blocks reads must filter `status = 'active'` | block feature | DAL — all three files enforce this | LOW |
| assertingActorId must match blockerActorId before any write | block feature | Controller — throws on mismatch | LOW |
| Cross-feature block access through barrel or adapters only | Architecture Contract | SENTRY | LOW |
| Dev-only DAL functions restricted to dev/diagnostics/dal/ | block feature | Structural — physical file separation (SF-02 applied) | LOW |
| friend_ranks must be cleaned up atomically on block | block feature (pending) | UNOWNED at runtime — batch4 not deployed | HIGH |
| useBlockStatus is null-safe | block feature | DAL + hook — early return pattern | LOW |

---

## Ownership Decisions Made

| Finding | Decision | Date | Authority |
|---|---|---|---|
| IF-01 — `isBlocked` dead DAL export | DELETED | 2026-05-14 | IRONMAN + THOR |
| IF-02 — `toggleBlockActor` dead DAL export | DELETED | 2026-05-14 | IRONMAN + THOR |
| IF-03 — `applyBlockSideEffects.js` zero callers | HOLD — batch4 gates deletion | 2026-05-11 | IRONMAN + CARNAGE |
| IF-04 — `blockedActorSet.read.dal.js` profiles duplicate | DELETED | 2026-05-14 | IRONMAN + SENTRY SF-03 |
| SF-01 — `invalidateFeedBlockCache` in controller | MOVED TO HOOK | 2026-05-14 | SENTRY + VENOM + THOR |
| SF-02 — dev-only exports in production DAL | MOVED TO dev/diagnostics/dal/ | 2026-05-14 | SENTRY + THOR |

---

## Open Ownership Issues

| Issue | Risk | Owner | Next Step |
|---|---|---|---|
| `vc.friend_ranks` cleanup not happening | HIGH | CARNAGE + block feature | Deploy batch4 → then delete applyBlockSideEffects.js |
| Native follow/friend gate — no native owner confirmed | HIGH | FALCON | Assign native follow gate owner; verify enforcement |
| THOR release gate for native | BLOCKED | THOR | Resolve FALCON P0 items first |

---

## Canonical Logan Doc

`zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md`

---

**IRONMAN Ownership Record Last Updated: 2026-05-14**
**Status: PARTIAL — core layers clean, vc.friend_ranks cleanup ownership pending batch4**
