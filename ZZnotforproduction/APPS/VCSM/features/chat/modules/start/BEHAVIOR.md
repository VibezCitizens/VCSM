---
title: Start Module — Behavior
status: STUB
feature: chat
module: start
source: scanner-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/chat/start/
---

# chat / modules / start — BEHAVIOR

## Status

STUB. Behaviors not yet confirmed for this module.

## Confirmed Route Evidence

| Route | Screen | Access | Confidence |
|---|---|---|---|
| /chat/new | (NewChatScreen via route-map) | protected | HIGH |

Note: route-map shows `/chat/new` maps to `NewChatScreen`, but screen-map identified `StartConversationModal` in the start/ directory. These may be the same component under different names, or the modal renders inside the /chat/new route.

## Expected Behaviors (unverified)

- Search/select recipient actor
- Initiate a new conversation thread
- Navigate to the new conversation on success
- Handle case where conversation already exists (redirect to existing)

## TODO

- [ ] Confirm relationship between NewChatScreen (route-map) and StartConversationModal (screen-map)
- [ ] Filter behavior-surface-map.json for module=start to get confirmed behavior list
- [ ] Document actor search flow within this module
- [ ] Document de-duplication behavior (existing conversation redirect)
