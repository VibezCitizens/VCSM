---
title: Guards Module — Index
status: STUB
feature: block
module: guards
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
scanner-version: 1.1.0
---

# block / modules / guards

Read and gate layer for the block subsystem. Handles block status reads, blocked actor set retrieval, and UI components that gate access when a block relationship is active.

## Module Summary

| Field | Value |
|---|---|
| Module | guards |
| Feature | block |
| Source Path | apps/VCSM/src/features/block/ |
| Screens | 0 (composable subsystem — no dedicated screens) |
| Routes | 0 |
| Write Surfaces | 0 (read-only module) |
| Hooks | 1 (useBlockStatus — shared with block module) |
| Controllers | 2 |
| DAL Files | 2 |
| Components | 2 |

## Known Source Files (ARCHITECT-verified)

### Controllers
| File | Role |
|---|---|
| getBlockStatus.controller.js | Returns block status for a given actor pair |
| getBlockedActorSet.controller.js | Returns the full set of actors blocked by/from the current actor |

### DAL
| File | Role |
|---|---|
| block.check.dal.js | Point-check — is actorA blocked by actorB? |
| block.read.dal.js | Set read — fetch all blocked actor IDs for an actor |

### Hooks
| File | Role |
|---|---|
| useBlockStatus.js | Shared read hook (also consumed by block mutation module) |

### Components
| File | Role |
|---|---|
| BlockGate.jsx | Guard component — renders null / blocked state when block active |
| BlockedState.jsx | Blocked state UI — displayed when a user visits a blocked actor's profile |

## Write Surfaces

None. This module is read-only.

## Security Flag (ARCHITECT-derived)

Settings feature contains a parallel DAL path (`dalInsertBlock` / `dalDeleteBlockByTarget`) that bypasses `blockActorController` ownership check. This module is the read layer — it does not perform mutations, but the effectiveness of its gate depends on accurate block data. RLS is the enforcement backstop. See SECURITY.md.

## Engine Dependencies

| Engine | Usage |
|---|---|
| hydration | Actor hydration for blocked actor display |
| identity | Actor identity resolution for block pair lookups |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm full source file list for guards layer
- [ ] Filter behavior-surface-map.json for module=guards
- [ ] Confirm BlockGate.jsx rendering logic (null vs BlockedState, conditional props)
- [ ] Determine if getBlockedActorSet is used for feed filtering or profile gate only
- [ ] Trace block.check.dal.js query — confirm it reads from moderation schema
