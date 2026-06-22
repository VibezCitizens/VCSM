---
title: Conversation Module — Behavior
status: STUB
feature: chat
module: conversation
source: scanner-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/chat/conversation/
---

# chat / modules / conversation — BEHAVIOR

## Status

STUB. Behaviors not yet extracted from scanner behavior-surface-map for this specific module.

## Confirmed Route Behaviors (scanner HIGH confidence)

| Route | Screen | Access |
|---|---|---|
| /chat/:conversationId | ConversationScreen | protected |

## Expected Behaviors (unverified)

- Load conversation by ID
- Display message thread
- Send message
- Mark messages as read
- Handle typing indicator
- Handle real-time message delivery

## TODO

- [ ] Filter behavior-surface-map.json for module=conversation to get confirmed behavior list
- [ ] Document message send flow: UI → Hook → Controller → DAL → Supabase
- [ ] Confirm read-receipt behavior
- [ ] Document realtime subscription lifecycle (subscribe on mount, unsubscribe on unmount)
