---
title: Chat Module — Architecture
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: chat
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/ (root-level files)
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / chat — ARCHITECTURE

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Architecture State:** SOURCE_VERIFIED — COMPLETE

## Source Path Correction

Stub recorded `apps/VCSM/src/features/chat/chat/` — **directory does not exist.**
Actual root: `apps/VCSM/src/features/chat/` (5 root-level files).

## Module Role

Three functions: (1) DI setup for @chat engine, (2) feature entry barrel, (3) client UI state.

## Layer Map

| File | Layer | Purpose |
|---|---|---|
| index.js | Entry barrel | Exports InboxScreen + ConversationScreen |
| setup.js | DI config | setupVcsmChatEngine() — _configured guard — injects 9 DI deps |
| store/chatUiStore.js | Zustand UI state | 4 fields: selectedConversationId, isNewChatModalOpen, composerDraft, activeChatFilter |
| adapters/chat.adapter.js | Adapter | Exports useChatUnreadOps only |
| styles/chat-modern.css | CSS | Chat theme |

## DI Surface (setup.js → @chat engine)

searchActors → identity.search_actor_directory RPC (READ)
resolveActorRealmContext → vc.actors SELECT (id, is_void) (READ)
checkBlockRelation → moderation.blocks SELECT (bidirectional OR, fails closed) (READ)

## Architecture Anomalies

| ID | Severity | Summary |
|----|---------|---------|
| ANOM-CHAT-ROOT-001 | INFO | chat.adapter.js exports only 1 hook |
| ANOM-CHAT-ROOT-002 | INFO | resolveActorRealmContext reads vc.actors inline — intentional DI bridge |

## Independence

FULLY INDEPENDENT — no cross-feature imports beyond adapter boundaries.

## Full Report

`outputs/2026/06/05/ARCHITECT/chat.chat.architecture.md`
