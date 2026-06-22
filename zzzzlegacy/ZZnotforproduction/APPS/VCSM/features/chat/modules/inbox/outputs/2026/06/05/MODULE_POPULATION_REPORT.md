---
title: Chat Inbox Module — Population Report
status: SUCCESS
generated: 2026-06-05
module: inbox
feature: chat
pilot: inbox module only
---

# MODULE_POPULATION_REPORT — chat / modules / inbox

## Pre-Flight Safety Check

| Check | Result |
|---|---|
| Target module exists: features/chat/modules/inbox/ | PASS |
| All 4 target files existed as STUBs before population | PASS |
| No application code modified | PASS |
| No scanner code modified | PASS |
| Scope limited to modules/inbox/ only | PASS |
| All other modules (chat, conversation, debug, start) untouched | PASS |

## Files Updated (4)

| File | Previous Status | New Status |
|---|---|---|
| modules/inbox/INDEX.md | STUB | ACTIVE |
| modules/inbox/BEHAVIOR.md | STUB | ACTIVE |
| modules/inbox/ARCHITECTURE.md | STUB | ACTIVE |
| modules/inbox/SECURITY.md | STUB | ACTIVE |

## Scanner Inputs Consumed

| Map | Path | Used For |
|---|---|---|
| feature-map.json | apps/scanner/maps/feature-map.json | Feature/module confirmation (5 chat modules) |
| screen-map.json | apps/scanner/maps/screen-map.json | 8 screens, HIGH confidence |
| route-map.json | apps/scanner/maps/route-map.json | 8 routes, HIGH confidence |
| behavior-map.json | apps/scanner/maps/behavior-map.json | Module behavior count (25 for inbox) |
| behavior-surface-map.json | apps/scanner/maps/behavior-surface-map.json | BEH-CHAT-INBOX-001—025, MEDIUM confidence |
| callgraph.json | apps/scanner/maps/callgraph.json | Layer stack confirmation |
| dependency-map.json | apps/scanner/maps/dependency-map.json | 8 feature dependencies |
| ownership-map.json | apps/scanner/maps/ownership-map.json | Ownership entries (all LOW confidence) |

## Source Files Read (29)

All under apps/VCSM/src/features/chat/inbox/:

screens/: InboxScreen.jsx, ArchivedInboxScreen.jsx, RequestsInboxScreen.jsx, SpamInboxScreen.jsx, InboxSettingsScreen.jsx, InboxChatSettingsScreen.jsx
screens/settings/: BlockedUsersScreen.jsx, MessagePrivacyScreen.jsx
components/: CardInbox.jsx, InboxEmptyState.jsx, InboxList.jsx, InboxListSkeleton.jsx
hooks/: useArchiveChat.js, useChatInbox.js, useChatMessagePrefetch.js, useChatUnreadOps.js, useDeleteChat.js, useInbox.js, useInboxActions.js, useInboxEntryForConversation.js, useInboxFolder.js, useMarkChatRead.js, useMessagePrivacySettings.js, useVexSettings.js
controller/: chatUnread.controller.js
dal/: inboxUnread.read.dal.js
model/: vexSettings.model.js
constants/: inboxSearchAdapter.js
lib/: buildInboxPreview.js

## Security Reviews Read

| Review | Date | Path |
|---|---|---|
| VENOM | 2026-06-04 | features/chat/outputs/2026/06/04/Venom/ |
| ELEKTRA | 2026-06-04 | features/chat/outputs/2026/06/04/ELEKTRA/ |
| BlackWidow | 2026-06-04 | features/chat/outputs/2026/06/04/BlackWidow/ |
| Feature SECURITY.md | 2026-06-04 | features/chat/SECURITY.md |

## Fields Populated by File

### INDEX.md
- FEATURE_INDEX_RUNTIME (9 metrics with sources)
- Module Summary (7 fields with sources)
- Screens table (8 rows — screen-map.json HIGH confidence)
- Routes table (8 rows — route-map.json HIGH confidence)
- Source File Inventory (29 files across 8 layers)
- Ownership table (all LOW confidence — 4 null owners flagged)
- Feature Dependencies (8 entries — dependency-map.json)
- State Management (5 entries — source-verified)

### BEHAVIOR.md
- Behavior Inventory table (25 rows — 10 named, 15 NOT VERIFIED)
- Route-Linked Entry Points (8 routes with server-side filter confirmation)
- 5 key behavior flows with source-traced step chains

### ARCHITECTURE.md
- 4 traced layer stacks (read, unread badge, mutations, folder views)
- 2 local-settings layer stacks
- Full source file map (29 files, 8 layers)
- Database table record (chat.inbox_entries, all key fields)
- External dependencies (9 entries)
- Module boundaries (4 exclusions)

### SECURITY.md
- 4 CONFIRMED_FINDINGS (1 THOR BLOCKER HIGH, 1 MEDIUM, 2 LOW)
- 3 SCANNER_SIGNALS
- 4 UNVERIFIED_SURFACES with priority ratings
- THOR gate status

## Confidence Summary

| Layer | Confidence | Source |
|---|---|---|
| Screens | HIGH | screen-map.json |
| Routes | HIGH | route-map.json |
| Behaviors (named 10/25) | MEDIUM | behavior-surface-map.json |
| Behaviors (unnamed 15/25) | NOT VERIFIED | — |
| Source files | SOURCE_VERIFIED | file system reads |
| Layer stacks | SOURCE_VERIFIED + SCANNER_VERIFIED | source + callgraph |
| Security findings | REVIEW_VERIFIED | VENOM + ELEKTRA + BW |
| Ownership | LOW | ownership-map.json |
| DB table | SOURCE_VERIFIED | inboxUnread.read.dal.js |

## Facts Explicitly Excluded (Not Invented)

- Behavior names for BEH-CHAT-INBOX-011 through -025 (scanner excerpt did not return them)
- engine:reviews dependency purpose (no inbox source file confirmed)
- BlockedUsersScreen RLS (outside inbox module scope)
- InboxChatSettingsScreen write surfaces (not fully traced)
