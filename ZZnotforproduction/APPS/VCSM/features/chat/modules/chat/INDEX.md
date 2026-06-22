---
title: Chat Module — Index
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: chat
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/ (root-level files)
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / chat

Chat feature root. DI configuration, feature entry barrel, and Zustand UI store.

## Module Summary

| Field | Value |
|---|---|
| Module | chat |
| Feature | chat |
| Source Path | apps/VCSM/src/features/chat/ (root-level files) |
| Source Path Correction | Stub path chat/chat/ does not exist — corrected to feature root |
| Routes | None — entry barrel only (InboxScreen + ConversationScreen exported) |

## Source Files (5)

| File | Purpose |
|---|---|
| index.js | Entry barrel — exports InboxScreen, ConversationScreen |
| setup.js | setupVcsmChatEngine() — DI config for @chat engine |
| store/chatUiStore.js | Zustand UI state (4 fields) |
| adapters/chat.adapter.js | Adapter — exports useChatUnreadOps |
| styles/chat-modern.css | Chat theme CSS |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | ARCHITECT COMPLETE (2026-06-05) |
| ARCHITECTURE.md | ARCHITECT COMPLETE (2026-06-05) |
| CURRENT_STATUS.md | NOT PRESENT |
| BEHAVIOR.md | STUB (scanner 2026-06-04) |
| SECURITY.md | STUB (scanner 2026-06-04) |

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/chat.chat.architecture.md`
