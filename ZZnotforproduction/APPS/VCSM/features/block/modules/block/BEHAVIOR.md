---
title: Block Module — Behavior
status: STUB
feature: block
module: block
source: architect-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/block/
---

# block / modules / block — BEHAVIOR

## Status

STUB. Behaviors not confirmed at module level. All entries below are seeded from ARCHITECT review and feature-level INDEX.md evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-BLOCK-BLOCK-001 | Block Actor | Invokes moderation.block_actor RPC for target actorId; owned by asserting actor | UNVERIFIED |
| BEH-BLOCK-BLOCK-002 | Unblock Actor | Invokes moderation.unblock_actor RPC to remove block relationship | UNVERIFIED |
| BEH-BLOCK-BLOCK-003 | Toggle Block | blockActor.controller.js routes to block or unblock based on current status | UNVERIFIED |
| BEH-BLOCK-BLOCK-004 | Confirm Before Block | BlockConfirmModal.jsx intercepts action and requires user confirmation before mutation fires | UNVERIFIED |
| BEH-BLOCK-BLOCK-005 | Inline Block Trigger | BlockButton.jsx rendered inline (profile, actor card, menu) dispatches block action | UNVERIFIED |
| BEH-BLOCK-BLOCK-006 | Optimistic Status Update | useBlockActions hook may apply optimistic update to block status cache on mutation | UNVERIFIED |

## Route Entry Points

None. This module is composable — no dedicated routes. Components are mounted within other feature screens (profile, actor card, ActorActionsMenu).

## Behavior Flows (unverified)

### Block Flow
```
BlockButton.jsx (or ActorActionsMenu)
  └── BlockConfirmModal.jsx (confirmation gate)
        └── useBlockActions.js → useBlockActorAction.js
              └── blockActor.controller.js (toggle: checks current status)
                    └── block.write.dal.js
                          └── moderation.block_actor RPC (Supabase)
```

### Unblock Flow
```
BlockButton.jsx (active state) / BlockConfirmModal.jsx
  └── useBlockActions.js
        └── blockActor.controller.js (routes to unblock)
              └── block.write.dal.js
                    └── moderation.unblock_actor RPC (Supabase)
```

## TODO

- [ ] Filter behavior-surface-map.json for feature=block to confirm BEH IDs
- [ ] Confirm toggle logic location — controller or hook layer
- [ ] Confirm whether useBlockStatus.js is read-only in this module or also used for toggle routing
- [ ] Document post-mutation cache invalidation targets (block status, blocked set, feed, inbox?)
- [ ] Confirm BlockConfirmModal props and dismiss behavior
