---
title: Start Module — Architecture
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: start
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/start/
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / start — ARCHITECTURE

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Architecture State:** SOURCE_VERIFIED — COMPLETE

## Module Role

New conversation initiation. 3 files: useStartConversation hook, StartConversationModal dumb UI, adapter re-export.
No DAL, no controller, no DB access. Fully delegates to @chat engine.

## Layer Map

| File | Layer | Purpose |
|---|---|---|
| start/screens/StartConversationModal.jsx | Dumb UI | Actor search modal; all behavior prop-injected |
| start/hooks/useStartConversation.js | Hook | Identity guard + engine delegate + navigate |
| adapters/start/hooks/useStartConversation.adapter.js | Adapter | Re-export barrel |

## Call Graph

```
InboxScreen / useProfileHeaderMessaging → isNewChatModalOpen (chatUiStore)
  └── StartConversationModal [dumb UI]
        └── onPick → useStartConversation.start(picked)
              └── startDirectConversation(@chat engine)
                    └── navigate('/chat/${conversationId}')
```

## Route Map Correction

Scanner reported `/chat/new` → NewChatScreen (HIGH confidence).
[SOURCE_VERIFIED] StartConversationModal is a fixed overlay controlled by chatUiStore.
Not route-mounted. HAWKEYE should confirm no /chat/new route registration exists.

## Architecture Anomalies

| ID | Severity | Summary |
|----|---------|---------|
| ANOM-CHAT-START-001 | LOW | console.error not DEV-gated in useStartConversation |
| ANOM-CHAT-START-002 | INFO | @RefactorBatch 2025-11 legacy annotation block |
| ANOM-CHAT-START-003 | MEDIUM | pickDirect() passes raw query string as actor ID — engine must validate |

## Independence

MOSTLY INDEPENDENT — depends on @chat engine, identity.adapter, @i18n, chatUiStore.

## Full Report

`outputs/2026/06/05/ARCHITECT/chat.start.architecture.md`
