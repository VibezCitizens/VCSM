---
title: Inbox Module — Index
status: ACTIVE
feature: chat
module: inbox
source: scanner-verified + source-verified
created: 2026-06-04
updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/inbox/
scanner-version: 1.1.0
scanner-timestamp: 2026-06-05T03:29:11Z
---

# chat / modules / inbox

Inbox module. Manages the conversation list, settings, filters (archived, requests, spam), blocked users, and message privacy settings.

## FEATURE_INDEX_RUNTIME

| Metric | Value | Source |
|---|---|---|
| Behaviors | 25 | behavior-surface-map.json (MEDIUM confidence) |
| Screens | 8 | screen-map.json (HIGH confidence) |
| Routes owned | 8 | route-map.json (HIGH confidence) |
| Source files | 29 | source-verified |
| Hooks | 12 | source-verified |
| Controllers | 1 | source-verified |
| DAL files | 1 | source-verified |
| THOR blockers | 1 | VENOM review 2026-06-04 |
| Security findings | 4 inbox-attributable | VENOM + ELEKTRA + BW 2026-06-04 |

## Module Summary

| Field | Value | Source |
|---|---|---|
| Module | inbox | behavior-map.json |
| Feature | chat | behavior-map.json |
| Source Path | apps/VCSM/src/features/chat/inbox/ | source-verified |
| Source Files | 29 | source-verified |
| Scanner Confidence | HIGH (screens) / MEDIUM (behaviors) | screen-map.json / behavior-map.json |
| Behavior Count | 25 (BEH-CHAT-INBOX-001 — BEH-CHAT-INBOX-025) | behavior-surface-map.json |
| Primary DB Table | chat.inbox_entries | source-verified |

## Screens [screen-map.json — HIGH confidence]

| Screen | File | Route |
|---|---|---|
| InboxScreen | screens/InboxScreen.jsx | /chat |
| ArchivedInboxScreen | screens/ArchivedInboxScreen.jsx | /chat/archived |
| RequestsInboxScreen | screens/RequestsInboxScreen.jsx | /chat/requests |
| SpamInboxScreen | screens/SpamInboxScreen.jsx | /chat/spam |
| InboxChatSettingsScreen | screens/InboxChatSettingsScreen.jsx | /chat/settings |
| InboxSettingsScreen | screens/InboxSettingsScreen.jsx | /chat/settings/inbox |
| BlockedUsersScreen | screens/settings/BlockedUsersScreen.jsx | /chat/settings/blocked |
| MessagePrivacyScreen | screens/settings/MessagePrivacyScreen.jsx | /chat/settings/privacy |

## Routes [route-map.json — HIGH confidence]

| Route | Type | Element | Notes |
|---|---|---|---|
| /chat | static | InboxScreen | Main inbox — folder=inbox |
| /chat/archived | static | ArchivedInboxScreen | folder=archived |
| /chat/requests | static | RequestsInboxScreen | folder=requests |
| /chat/spam | static | SpamInboxScreen | folder=spam |
| /chat/settings | static | InboxChatSettingsScreen | Inbox-level settings root |
| /chat/settings/inbox | static | InboxSettingsScreen | Vex display prefs |
| /chat/settings/blocked | static | BlockedUsersScreen | Blocked users management |
| /chat/settings/privacy | static | MessagePrivacyScreen | messagePrivacySettings |

All routes registered in apps/VCSM/src/app/routes/protected/app.routes.jsx [route-map.json]

## Source File Inventory [source-verified — 29 files]

| Layer | Files |
|---|---|
| screens/ | InboxScreen.jsx, ArchivedInboxScreen.jsx, RequestsInboxScreen.jsx, SpamInboxScreen.jsx, InboxSettingsScreen.jsx, InboxChatSettingsScreen.jsx |
| screens/settings/ | BlockedUsersScreen.jsx, MessagePrivacyScreen.jsx |
| components/ | CardInbox.jsx, InboxEmptyState.jsx, InboxList.jsx, InboxListSkeleton.jsx |
| hooks/ | useArchiveChat.js, useChatInbox.js, useChatMessagePrefetch.js, useChatUnreadOps.js, useDeleteChat.js, useInbox.js, useInboxActions.js, useInboxEntryForConversation.js, useInboxFolder.js, useMarkChatRead.js, useMessagePrivacySettings.js, useVexSettings.js |
| controller/ | chatUnread.controller.js |
| dal/ | inboxUnread.read.dal.js |
| model/ | vexSettings.model.js |
| constants/ | inboxSearchAdapter.js |
| lib/ | buildInboxPreview.js |

## Ownership [ownership-map.json — LOW confidence]

| Role | Owner |
|---|---|
| Feature Owner | VCSM:chat |
| Module Owner | VCSM:chat/inbox |
| Code Owner | apps/VCSM/src/features/chat |
| Decision Owner | null — not set |
| Security Owner | null — not set |
| Data Owner | null — not set |
| Documentation Owner | null — not set |

## Feature Dependencies [dependency-map.json — HIGH confidence]

| Dependency | Kind |
|---|---|
| VCSM:block | Feature |
| VCSM:identity | Feature |
| VCSM:notifications | Feature |
| VCSM:shared | Feature |
| VCSM:state | Feature |
| VCSM:ui | Feature |
| engine:hydration | Engine |
| engine:reviews | Engine |

## State Management [source-verified]

| Type | Cache Key | Used By |
|---|---|---|
| React Query | chatInbox | useChatInbox, useInbox |
| React Query | chatUnreadCount | useArchiveChat, useDeleteChat, useMarkChatRead |
| React Query | chatUnread | useArchiveChat, useDeleteChat, useMarkChatRead |
| localStorage | vc.vex_settings:{actorId} | useVexSettings |
| localStorage | vc.message_privacy_settings | useMessagePrivacySettings |

React Query config: staleTime=30s, gcTime=10min [source-verified: useChatInbox.js]

## Governance Files

| File | Status |
|---|---|
| INDEX.md | ACTIVE |
| BEHAVIOR.md | ACTIVE |
| ARCHITECTURE.md | ACTIVE |
| SECURITY.md | ACTIVE |

## Related Documents

- Feature-level: features/chat/INDEX.md
- Security reviews: features/chat/outputs/2026/06/04/
- Population report: features/chat/modules/inbox/outputs/2026/06/05/MODULE_POPULATION_REPORT.md
