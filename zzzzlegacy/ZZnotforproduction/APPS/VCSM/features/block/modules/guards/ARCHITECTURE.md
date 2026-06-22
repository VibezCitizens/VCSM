---
title: Guards Module — Architecture
status: STUB
feature: block
module: guards
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
---

# block / modules / guards — ARCHITECTURE

## Status

STUB. Architecture not traced at module level. All layer information below is seeded from ARCHITECT review evidence. Verification required.

## Layer Stack (unverified)

### Block Status Check (point lookup)
```
BlockGate.jsx
  └── useBlockStatus.js
        └── getBlockStatus.controller.js
              └── block.check.dal.js
                    └── moderation schema SELECT (actor pair block relationship)
```

### Blocked Actor Set (bulk read)
```
(Feed / Search / Inbox consumer)
  └── getBlockedActorSet.controller.js
        └── block.read.dal.js
              └── moderation schema SELECT (all blocks for actorId)
```

### Blocked State Render
```
[Profile screen — blocked actor visit]
  └── BlockedState.jsx
        └── useBlockStatus.js (status input — renders based on block direction)
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| BlockGate.jsx | Component / conditional gate | ARCHITECT-derived |
| BlockedState.jsx | Component / blocked UI state | ARCHITECT-derived |
| useBlockStatus.js | Hook / status read (shared with block module) | ARCHITECT-derived |
| getBlockStatus.controller.js | Controller / point status check | ARCHITECT-derived |
| getBlockedActorSet.controller.js | Controller / bulk set read | ARCHITECT-derived |
| block.check.dal.js | DAL / point check query | ARCHITECT-derived |
| block.read.dal.js | DAL / set read query | ARCHITECT-derived |

## Write Surfaces

None. This module is read-only.

## Module Boundaries

- This module owns the read and gate path only
- Mutations are owned by the block mutation module (blockActor.controller.js, block.write.dal.js)
- useBlockStatus.js is shared — reads from this module feed the toggle routing in the mutation module
- No screen ownership — BlockGate.jsx and BlockedState.jsx are composable, mounted in other features

## External Dependencies

| Dependency | Purpose |
|---|---|
| engines/hydration | Actor hydration for blocked actor display in BlockedState |
| engines/identity | Actor identity resolution for pair lookups |
| moderation schema (Supabase) | Block relationship queries |

## TODO

- [ ] Trace block.check.dal.js query — confirm table name (moderation.blocks? moderation.block_relationships?)
- [ ] Trace block.read.dal.js query — confirm column names and filter
- [ ] Confirm BlockGate.jsx prop interface (actorId? targetActorId? children?)
- [ ] Determine if getBlockedActorSet is cached with React Query and at what key
- [ ] Read callgraph.json for block feature to verify controller → DAL chain
