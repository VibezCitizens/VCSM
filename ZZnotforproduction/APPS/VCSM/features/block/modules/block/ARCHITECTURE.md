---
title: Block Module — Architecture
status: STUB
feature: block
module: block
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
---

# block / modules / block — ARCHITECTURE

## Status

STUB. Architecture not traced at module level. All layer information below is seeded from ARCHITECT review evidence. Verification required.

## Layer Stack (unverified)

### Block / Unblock Mutation Flow
```
BlockButton.jsx / ActorActionsMenu.jsx
  └── BlockConfirmModal.jsx (confirmation gate)
        └── useBlockActions.js
              └── useBlockActorAction.js (adapter)
                    └── blockActor.controller.js
                          ├── [toggle: read status first via guards module]
                          ├── block path → block.write.dal.js → moderation.block_actor RPC
                          └── unblock path → block.write.dal.js → moderation.unblock_actor RPC
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| BlockButton.jsx | Component / UI trigger | ARCHITECT-derived |
| BlockConfirmModal.jsx | Component / confirmation modal | ARCHITECT-derived |
| useBlockActions.js | Hook / mutation actions | ARCHITECT-derived |
| useBlockActorAction.js | Hook / action adapter | ARCHITECT-derived |
| useBlockStatus.js | Hook / status read (shared) | ARCHITECT-derived |
| blockActor.controller.js | Controller / block toggle | ARCHITECT-derived |
| block.write.dal.js | DAL / RPC invocation | ARCHITECT-derived |

## Write Surfaces

| Surface | RPC | Schema | Confidence |
|---|---|---|---|
| Block | moderation.block_actor | moderation | ARCHITECT-derived |
| Unblock | moderation.unblock_actor | moderation | ARCHITECT-derived |

## Module Boundaries

- This module owns the mutation path only
- Block status reads are delegated to the guards module (getBlockStatus.controller.js, block.check.dal.js, useBlockStatus.js)
- useBlockStatus.js is shared between mutation (toggle routing) and guards (gate render) modules
- No screen ownership — BlockButton.jsx and BlockConfirmModal.jsx are composable components embedded in other features

## External Dependencies

| Dependency | Purpose |
|---|---|
| engines/hydration | Actor hydration for block target display |
| engines/identity | Actor ownership — asserting actor resolution |
| moderation schema (Supabase) | Block RPC execution |

## TODO

- [ ] Trace blockActor.controller.js source file — confirm toggle routing logic
- [ ] Confirm block.write.dal.js RPC call signatures and parameter names
- [ ] Confirm whether BlockConfirmModal.jsx is rendered conditionally or always mounted
- [ ] Determine cache invalidation targets post-mutation (React Query keys invalidated)
- [ ] Read callgraph.json for block feature to verify hook → controller → DAL chain
