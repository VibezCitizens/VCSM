---
title: Block Module — Index
status: STUB
feature: block
module: block
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
scanner-version: 1.1.0
---

# block / modules / block

Mutation layer for the block subsystem. Handles block/unblock/toggle actions, RPC invocations, and the UI surfaces that trigger them.

## Module Summary

| Field | Value |
|---|---|
| Module | block |
| Feature | block |
| Source Path | apps/VCSM/src/features/block/ |
| Screens | 0 (composable subsystem — no dedicated screens) |
| Routes | 0 |
| Write Surfaces | 2 (moderation.block_actor RPC, moderation.unblock_actor RPC) |
| Hooks | 3 |
| Controllers | 1 |
| DAL Files | 1 |
| Components | 2 |

## Known Source Files (ARCHITECT-verified)

### Controllers
| File | Role |
|---|---|
| blockActor.controller.js | block / unblock / toggle — primary mutation entrypoint |

### DAL
| File | Role |
|---|---|
| block.write.dal.js | Invokes moderation.block_actor / moderation.unblock_actor RPCs |

### Hooks
| File | Role |
|---|---|
| useBlockActions.js | Mutation hook — exposes block/unblock actions to UI |
| useBlockActorAction.js | Action adapter hook |
| useBlockStatus.js | Shared status hook (also consumed by guards module) |

### Components
| File | Role |
|---|---|
| BlockButton.jsx | Trigger UI element — inline block action |
| BlockConfirmModal.jsx | Confirmation modal before block mutation fires |

## Write Surfaces

| Surface | Target | RPC |
|---|---|---|
| Block actor | moderation schema | moderation.block_actor |
| Unblock actor | moderation schema | moderation.unblock_actor |

## Security Flag (ARCHITECT-derived)

Settings feature contains a parallel DAL path (`dalInsertBlock` / `dalDeleteBlockByTarget`) that bypasses `blockActorController` ownership check. RLS is the enforcement backstop for that path. See SECURITY.md.

## Engine Dependencies

| Engine | Usage |
|---|---|
| hydration | Actor hydration for block targets |
| identity | Actor ownership resolution |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm full source file list under block/ mutation layer
- [ ] Filter behavior-surface-map.json for module=block
- [ ] Trace blockActor.controller.js call graph from hook → controller → DAL → RPC
- [ ] Verify RPC parameter signatures (who provides actorId, targetId)
