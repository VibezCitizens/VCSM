---
title: Conversation Module — Index
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: conversation
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/conversation/
---

# chat / modules / conversation

Single-conversation view module. Covers thread, composer, presence (typing), and attachments.
Sprint items satisfied: chat/composer, chat/thread, chat/presence, chat/attachments.

## Module Summary

| Field | Value |
|---|---|
| Module | conversation |
| Feature | chat |
| Source Path | apps/VCSM/src/features/chat/conversation/ |
| Route | /chat/:conversationId |

## Key Architecture

- ConversationScreen.jsx: routing + guard only
- ConversationView.jsx: orchestrates 15+ hooks; all DB reads via @chat engine
- Thread: MIGRATED (useConversation, useConversationMessages, useConversationMembers → @chat)
- Composer: useSendMessageActions (text→engine; image→@media upload + optimistic + engine send)
- Presence: useTypingChannel → pure @chat engine pass-through
- Attachments: 3-stage pipeline (upload → send_message_atomic → media_assets fire-and-forget)
- React Query warm-cache: useConversationMessages adds 90s/5min cache over engine hook

## Source Files (30 files in conversation/)

screens(2), components(8), layout(1), hooks(10), controller(1), dal(1), lib(3), permissions(2)

## Governance Files

| File | Status |
|------|--------|
| INDEX.md | ARCHITECT COMPLETE (2026-06-05) |
| ARCHITECTURE.md | ARCHITECT COMPLETE (2026-06-05) |
| CURRENT_STATUS.md | ARCHITECT COMPLETE (2026-06-05) |
| BEHAVIOR.md | STUB (scanner 2026-06-04) |
| SECURITY.md | STUB (scanner 2026-06-04) |

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/chat.conversation.architecture.md`
