---
name: vcsm.block.index
description: VCSM block feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / block

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 5 | blockActor.controller.js (block/unblock/toggle), getBlockStatus.controller.js, getBlockedActorSet.controller.js |
| DAL files | 4 | block.check.dal.js, block.read.dal.js, block.write.dal.js (scanner: 4 per cg) |
| Hooks | 3 | useBlockActions.js, useBlockStatus.js, useBlockActorAction.js |
| Models | 0 | None — no model/transformer layer present |
| Screens | 0 | No dedicated screen; block is a composable subsystem |
| Components | 4 | BlockButton.jsx, BlockConfirmModal.jsx, BlockedState.jsx, BlockGate.jsx (guard) |
| Adapters | 1 | useBlockStatus.adapter.js, useBlockActorAction.adapter.js, BlockConfirmModal.adapter.js, ActorActionsMenu.jsx (scanner cg: 1; fm: 4) |
| Barrels | 11 | index.js (primary) + adapter re-export barrels |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No registered routes — consumed as component/hook system |
| Total source files | 18 | Per scanner sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | moderation | — | blockActor → block_actor |
| rpc | moderation | — | unblockActor → unblock_actor |

## Security-Sensitive Surfaces

Both write surfaces are high-sensitivity:

- `moderation.block_actor` — writes to `moderation.blocks`, inserts block events, deactivates `vc.actor_follows` server-side. Actor identity assertion (`assertingActorId === blockerActorId`) enforced in `blockActorController`. RLS enforces ultimate ownership server-side.
- `moderation.unblock_actor` — releases block status, inserts unblock event. Same ownership assertion pattern.

**Risk flag:** The `settings` feature contains a parallel DAL path (`dalInsertBlock`, `dalDeleteBlockByTarget`) that calls these same RPCs directly without routing through `blockActorController`. The `assertingActorId` ownership check is skipped on the settings path. Server-side RLS remains the enforcement backstop, but the client-side guard is absent. VENOM review recommended.

## Engine Dependencies

- **hydration** — `invalidateFeedBlockCache` called via feed adapter post-mutation
- **identity** — `useIdentity()` consumed in `useBlockActions` to resolve `sessionActorId`

## Routes

No routes in route-map for this feature. The block module has no dedicated screen or URL — it is consumed inline by profiles, settings, and feed surfaces.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no behavioral spec content) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | MISSING (no dedicated screens; N/A) |
