---
title: Cover Module — Architecture
status: STUB
feature: moderation
module: cover
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / cover — ARCHITECTURE

## Read Path

```
useConversationCover.js
  └── getConversationCoverStatus.controller.js
        └── conversationCover.read.dal.js → moderation.* SELECT
              └── RLS (UNVERIFIED)
```

## Undo Cover Path

```
[actor dismisses ChatSpamCover UI]
  └── useConversationCover → undoConversationCover.controller.js
        └── conversationCover.write.dal.js → moderation.* UPDATE/DELETE
              ├── actor ownership check (UNVERIFIED)
              └── dalDeleteConversationHideAction — missing .eq('actor_id', actorId) re-check ← VEN-MODERATION-008
```

## TODO

- [ ] Confirm conversationCover table name and schema
- [ ] Confirm whether undoConversationCover enforces actor_id ownership
