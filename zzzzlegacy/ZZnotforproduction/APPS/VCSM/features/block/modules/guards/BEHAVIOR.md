---
title: Guards Module — Behavior
status: STUB
feature: block
module: guards
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
---

# block / modules / guards — BEHAVIOR

## Status

STUB. Behaviors not confirmed at module level. All entries below are seeded from ARCHITECT review and feature-level INDEX.md evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-BLOCK-GUARDS-001 | Get Block Status | getBlockStatus.controller.js returns current block relationship for actor pair (A blocks B, B blocks A, mutual, none) | UNVERIFIED |
| BEH-BLOCK-GUARDS-002 | Get Blocked Actor Set | getBlockedActorSet.controller.js returns full set of actor IDs blocked by current actor | UNVERIFIED |
| BEH-BLOCK-GUARDS-003 | Gate Content Render | BlockGate.jsx renders children when no active block; renders BlockedState or null when block is active | UNVERIFIED |
| BEH-BLOCK-GUARDS-004 | Blocked Profile State | BlockedState.jsx renders blocked UX on profile screen when viewer is blocked by or has blocked the target actor | UNVERIFIED |
| BEH-BLOCK-GUARDS-005 | Block Status Read | useBlockStatus.js queries block status reactively; used by both block mutation module (toggle routing) and guards module (gate render) | UNVERIFIED |

## Route Entry Points

None. This module is composable — no dedicated routes. BlockGate and BlockedState are mounted within other feature screens (profile, feed, content viewers).

## Behavior Flows (unverified)

### Gate Render Flow
```
BlockGate.jsx
  └── useBlockStatus.js
        └── getBlockStatus.controller.js
              └── block.check.dal.js
                    └── moderation schema (SELECT block relationship)
  → renders children (no block) | renders BlockedState / null (block active)
```

### Blocked Actor Set Flow
```
(Feed filter / search filter / inbox filter)
  └── getBlockedActorSet.controller.js
        └── block.read.dal.js
              └── moderation schema (SELECT all blocked actor IDs for :actorId)
```

## TODO

- [ ] Filter behavior-surface-map.json for feature=block to confirm BEH IDs
- [ ] Confirm BlockGate.jsx render logic — does it null-render or render BlockedState?
- [ ] Confirm BlockedState.jsx consumer screens (profile only, or also feed/chat?)
- [ ] Determine if getBlockedActorSet is called at app load or on-demand
- [ ] Confirm schema target for block.read.dal.js and block.check.dal.js (moderation.blocks? moderation.block_actor?)
