---
title: Cover Module — Index
status: STUB
feature: moderation
module: cover
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / cover

Conversation spam cover. Hides chat conversations flagged as spam. Separate from report/visibility — covers the conversation UI with a warning overlay; user can dismiss (undo cover).

## Source Files

| File | Layer |
|---|---|
| controllers/getConversationCoverStatus.controller.js | controller |
| controllers/undoConversationCover.controller.js | controller |
| dal/conversationCover.read.dal.js | read DAL |
| dal/conversationCover.write.dal.js | write DAL |
| hooks/useConversationCover.js | hook |
| components/ChatSpamCover.jsx | UI |
| adapters/hooks/useConversationCover.adapter.js | adapter |
| adapters/components/ChatSpamCover.adapter.js | adapter |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

No dedicated THOR blockers scoped to cover module. Module inherits TOCTOU hardening note (VEN-MODERATION-008 LOW).
