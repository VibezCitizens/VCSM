---
title: Start Module — Index
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: start
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/start/
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / start

New conversation initiation module. Dumb modal UI + thin hook delegating to @chat engine.

## Module Summary

| Field | Value |
|---|---|
| Module | start |
| Feature | chat |
| Source Path | apps/VCSM/src/features/chat/start/ |
| Route | /chat/new — UNCONFIRMED; modal is UI-controlled (chatUiStore), not route-mounted |
| DB Writes | None — engine handles all writes |

## Source Files (3)

| File | Purpose |
|---|---|
| start/screens/StartConversationModal.jsx | Dumb UI modal — prop-injected onSearch/onPick/onClose |
| start/hooks/useStartConversation.js | Hook — identity guard + startDirectConversation engine delegate |
| adapters/start/hooks/useStartConversation.adapter.js | Re-export barrel |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | ARCHITECT COMPLETE (2026-06-05) |
| ARCHITECTURE.md | ARCHITECT COMPLETE (2026-06-05) |
| CURRENT_STATUS.md | NOT PRESENT |
| BEHAVIOR.md | STUB (scanner 2026-06-04) |
| SECURITY.md | STUB (scanner 2026-06-04) |

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/chat.start.architecture.md`
