---
title: Inbox Module — Behavior
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

# chat / modules / inbox — BEHAVIOR

All behaviors sourced from behavior-surface-map.json (scanner MEDIUM confidence) and verified against source files under apps/VCSM/src/features/chat/inbox/. No behavior is speculated. Unconfirmed names are marked NOT VERIFIED.

## Behavior Inventory [behavior-surface-map.json MEDIUM confidence]

Scanner found 25 behaviors (BEH-CHAT-INBOX-001 — BEH-CHAT-INBOX-025) for module=inbox. 10 names confirmed from scanner grep output. 15 additional names not returned in scanner excerpt — marked NOT VERIFIED.

| ID | Name | Source File | Controller | DAL |
|---|---|---|---|---|
| BEH-CHAT-INBOX-001 | Archive Chat | hooks/useArchiveChat.js | — (mutation via engine) | chat.inbox_entries UPDATE |
| BEH-CHAT-INBOX-002 | Build Query Key | hooks/useChatInbox.js#buildQueryKey | — | — |
| BEH-CHAT-INBOX-003 | Build Storage Key | hooks/useVexSettings.js#buildStorageKey | — | — |
| BEH-CHAT-INBOX-004 | Chat Inbox | hooks/useChatInbox.js | — | chat.inbox_entries SELECT (via engine) |
| BEH-CHAT-INBOX-005 | Chat Message Prefetch | hooks/useChatMessagePrefetch.js | — | — (prefetch) |
| BEH-CHAT-INBOX-006 | Chat Unread Ops | hooks/useChatUnreadOps.js | chatUnread.controller.js | inboxUnread.read.dal.js |
| BEH-CHAT-INBOX-007 | Delete Chat | hooks/useDeleteChat.js | — (mutation via engine) | chat.inbox_entries DELETE |
| BEH-CHAT-INBOX-008 | Emit Settings Changed | hooks/useVexSettings.js#emitSettingsChanged | — | — (localStorage event) |
| BEH-CHAT-INBOX-009 | Get Chat Inbox Unread Badge Count | controller/chatUnread.controller.js | chatUnread.controller.js | inboxUnread.read.dal.js |
| BEH-CHAT-INBOX-010 | Inbox | hooks/useInbox.js | — | — (delegates to useChatInbox) |
| BEH-CHAT-INBOX-011 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-012 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-013 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-014 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-015 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-016 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-017 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-018 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-019 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-020 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-021 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-022 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-023 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-024 | UNKNOWN — NOT VERIFIED | — | — | — |
| BEH-CHAT-INBOX-025 | UNKNOWN — NOT VERIFIED | — | — | — |

## Route-Linked Entry Points [route-map.json HIGH confidence + source-verified]

| Route | Entry Screen | Folder Filter | Server-Side | Notes |
|---|---|---|---|---|
| /chat | InboxScreen.jsx | folder=inbox | YES | chat.inbox_entries WHERE folder='inbox' |
| /chat/archived | ArchivedInboxScreen.jsx | folder=archived | YES | chat.inbox_entries WHERE folder='archived' |
| /chat/requests | RequestsInboxScreen.jsx | folder=requests | YES | chat.inbox_entries WHERE folder='requests' |
| /chat/spam | SpamInboxScreen.jsx | folder=spam | YES | chat.inbox_entries WHERE folder='spam' |
| /chat/settings | InboxChatSettingsScreen.jsx | — | N/A | Inbox settings root |
| /chat/settings/inbox | InboxSettingsScreen.jsx | — | NO | localStorage-only (vex settings) |
| /chat/settings/blocked | BlockedUsersScreen.jsx | — | YES | Blocked users from DB |
| /chat/settings/privacy | MessagePrivacyScreen.jsx | — | NO | localStorage-only (privacy settings) |

Server-side folder filtering confirmed via useInboxFolder.js — delegates to useInbox with folder parameter mapping to chat.inbox_entries.folder column. [SOURCE_VERIFIED]

## Key Behavior Flows [SOURCE_VERIFIED]

### Inbox List Render
1. InboxScreen.jsx renders useInbox({ actorId, folder='inbox' })
2. useInbox delegates to useChatInbox({ actorId }) with folder filter
3. useChatInbox hits React Query (key: chatInbox) — staleTime 30s
4. Engine call: getInboxEntries — reads chat.inbox_entries filtered by actor_id + folder
5. Response mapped through InboxList.jsx — one CardInbox.jsx per entry

### Unread Badge Count
1. useChatUnreadOps calls getChatInboxUnreadBadgeCount(actorId) [chatUnread.controller.js]
2. Controller calls readChatInboxUnreadRowsDAL(actorId) [inboxUnread.read.dal.js]
3. DAL: SELECT unread_count FROM chat.inbox_entries WHERE actor_id=:actorId AND archived=false AND archived_until_new=false
4. Returns summed unread_count

### Mark Read (optimistic)
1. useMarkChatRead issues React Query mutation
2. Optimistic: zeroes unread_count in chatInbox cache, subtracts from chatUnreadCount immediately
3. On error: snapshot rollback to pre-mutation state
4. On settle: invalidates chatUnreadCount, chatUnread

### Archive Conversation
1. useArchiveChat issues React Query mutation via engine
2. Optimistic: removes entry from current folder view
3. Invalidates: chatInbox, chatUnreadCount, chatUnread

### Vex Settings (display preferences)
1. useVexSettings({ actorId }) reads/writes localStorage at vc.vex_settings:{actorId}
2. Settings: hideEmptyConversations, showThreadPreview
3. emitSettingsChanged dispatches custom event vc.vex_settings.changed
4. No server sync — client-only [SOURCE_VERIFIED]

### Message Privacy Settings
1. useMessagePrivacySettings reads/writes localStorage at vc.message_privacy_settings
2. Fields: whoCanMessage ('everyone'|'following'|'nobody'), allowNewMessageRequests
3. No server enforcement — client-only [SOURCE_VERIFIED — SECURITY FINDING: VEN-CHAT-003]
