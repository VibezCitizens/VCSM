---
title: Conversation Module — Architecture
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: conversation
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/conversation/
---

# chat / modules / conversation — ARCHITECTURE

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found

## Sub-Modules Covered

This report covers all 4 sprint items: composer, thread, presence, attachments.

## Entry Points

- `/chat/:conversationId` → ConversationScreen.jsx (guard only) → ConversationView.jsx (orchestrator)

## Thread (timeline + hooks)

All DB reads delegated to `@chat` engine. VCSM adds:
- **React Query warm-cache layer** in useConversationMessages (seed from queryKeys.chatMessages, write-back on engine resolve, 90s stale / 5min GC)
- **Inbox seed** via navigation state (inboxPreview) — renders shell instantly before server hooks resolve
- **Block check gating** — useBlockStatus; composer hidden while block status pending

## Composer

- ChatInput.jsx + useSendMessageActions.js
- Text send: thin delegate to onSendMessage → @chat engine
- Image send: MIME pre-check → optimistic placeholder → @media upload → show image → sendMessage → recordChatAttachment (fire-and-forget)

## Presence

- useTypingChannel.js: pure pass-through to @chat engine useEngineTyping
- Notified via ChatInput onTyping prop → notifyTyping

## Attachments (3-stage pipeline)

```
Stage 1 (blocking): @media upload → R2 (chat_attachment scope, maxDim 1600 / q0.82)
Stage 2 (blocking): @chat send_message_atomic RPC (creates message + attachment row; media_asset_id=NULL)
Stage 3 (fire-and-forget): recordChatAttachmentController
  → platform.media_assets INSERT
  → chat.message_attachments UPDATE SET media_asset_id WHERE message_id + storage_path
```

Stage 3 is fire-and-forget (.catch in caller). Failure leaves media_asset_id NULL.

## DB Write Surface

| Op | Schema | Table | Function |
|----|--------|-------|----------|
| UPDATE | chat | message_attachments | updateAttachmentMediaAssetIdDAL |

All other writes via @chat engine or @media engine.

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-CHAT-APP-001 | console.log in useConversationMessages (DEV-gated) | LOW |
| ANOM-CHAT-APP-002 | console.warn in useSendMessageActions (DEV-gated) | LOW |
| ANOM-CHAT-APP-003 | recordChatAttachment fire-and-forget — media_asset_id may stay NULL | MEDIUM |
| ANOM-CHAT-APP-004 | updateAttachmentMediaAsset.write.dal.js bypasses @chat engine boundary | LOW |

## Full Report

`outputs/2026/06/05/ARCHITECT/chat.conversation.architecture.md`
