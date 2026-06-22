---
title: Cover Module — Behavior
status: STUB
feature: moderation
module: cover
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / cover — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder.

## Expected Behaviors (UNVERIFIED)

- Chat inbox checks conversation cover status via getConversationCoverStatus.controller
- Covered conversations display ChatSpamCover overlay instead of message preview
- Actor can dismiss cover via undoConversationCover.controller (writes to conversationCover table)
- useConversationCover hook drives cover state in chat inbox

## TODO

- [ ] Confirm cover status read table and column shape
- [ ] Confirm undo cover write path and actor ownership enforcement
- [ ] Confirm whether cover is global (moderator-set) or per-actor
