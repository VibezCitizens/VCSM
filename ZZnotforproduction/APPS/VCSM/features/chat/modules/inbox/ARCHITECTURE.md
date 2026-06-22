---
title: Inbox Module — Architecture
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

# chat / modules / inbox — ARCHITECTURE

All statements tagged [SOURCE_VERIFIED] (read from source file) or [SCANNER_VERIFIED] (from scanner map).

## Layer Stack — Inbox Read (Primary Flow)

    InboxScreen.jsx                              [SOURCE_VERIFIED]
      useInbox({ actorId, folder })              [SOURCE_VERIFIED: useInbox.js]
        useChatInbox({ actorId })                [SOURCE_VERIFIED: useChatInbox.js]
          React Query key: chatInbox             [SOURCE_VERIFIED]
            getInboxEntries (engines/chat)       [SCANNER_VERIFIED: dependency-map.json]
              chat.inbox_entries (Supabase)      [SOURCE_VERIFIED: inboxUnread.read.dal.js]
      InboxList.jsx                              [SOURCE_VERIFIED]
        CardInbox.jsx (per entry)                [SOURCE_VERIFIED]
        InboxEmptyState.jsx (zero state)         [SOURCE_VERIFIED]
        InboxListSkeleton.jsx (loading state)    [SOURCE_VERIFIED]

Polling: staleTime=30s, gcTime=10min [SOURCE_VERIFIED: useChatInbox.js]

## Layer Stack — Unread Badge Count

    useChatUnreadOps.js                          [SOURCE_VERIFIED]
      getChatInboxUnreadBadgeCount(actorId)      [SOURCE_VERIFIED: chatUnread.controller.js]
        readChatInboxUnreadRowsDAL(actorId)      [SOURCE_VERIFIED: inboxUnread.read.dal.js]
          SELECT unread_count
          FROM chat.inbox_entries
          WHERE actor_id = :actorId
            AND archived = false
            AND archived_until_new = false        [SOURCE_VERIFIED: inboxUnread.read.dal.js]

## Layer Stack — Inbox Mutations

    useArchiveChat.js / useDeleteChat.js / useMarkChatRead.js   [SOURCE_VERIFIED]
      React Query useMutation                                    [SOURCE_VERIFIED]
        engine mutation (engines/chat)                          [SCANNER_VERIFIED: dependency-map.json]
          chat.inbox_entries UPDATE                             [SCANNER_VERIFIED]
      Optimistic update — cache mutation on fire               [SOURCE_VERIFIED: useMarkChatRead.js]
      Rollback on error — snapshot restore                     [SOURCE_VERIFIED: useMarkChatRead.js]
      Invalidate: chatUnreadCount, chatUnread, chatInbox        [SOURCE_VERIFIED]

## Layer Stack — Folder Views

    ArchivedInboxScreen / RequestsInboxScreen / SpamInboxScreen  [SOURCE_VERIFIED]
      useInboxFolder({ actorId, folder })                        [SOURCE_VERIFIED: useInboxFolder.js]
        useInbox({ actorId, folder })                            [SOURCE_VERIFIED]
          useChatInbox({ actorId })                              [SOURCE_VERIFIED]

Folder values: 'inbox' | 'spam' | 'requests' | 'archived' [SOURCE_VERIFIED: useInboxFolder.js]
Filter applied server-side: WHERE folder = :folder [SOURCE_VERIFIED]

## Layer Stack — Local Settings (No DB)

    InboxSettingsScreen.jsx — useVexSettings({ actorId })       [SOURCE_VERIFIED]
      vexSettings.model.js                                       [SOURCE_VERIFIED]
      localStorage: vc.vex_settings:{actorId}                   [SOURCE_VERIFIED: useVexSettings.js]
      Custom event: vc.vex_settings.changed                     [SOURCE_VERIFIED: useVexSettings.js]
      Settings: hideEmptyConversations, showThreadPreview        [SOURCE_VERIFIED]

    MessagePrivacyScreen.jsx — useMessagePrivacySettings()      [SOURCE_VERIFIED]
      localStorage: vc.message_privacy_settings                  [SOURCE_VERIFIED: useMessagePrivacySettings.js]
      Fields: whoCanMessage, allowNewMessageRequests             [SOURCE_VERIFIED]
      NO server enforcement                                      [SOURCE_VERIFIED — SECURITY FINDING]

## Source File Map [SOURCE_VERIFIED — 29 files]

### Screens (8)
| File | Route | Confidence |
|---|---|---|
| screens/InboxScreen.jsx | /chat | HIGH [screen-map.json] |
| screens/ArchivedInboxScreen.jsx | /chat/archived | HIGH [screen-map.json] |
| screens/RequestsInboxScreen.jsx | /chat/requests | HIGH [screen-map.json] |
| screens/SpamInboxScreen.jsx | /chat/spam | HIGH [screen-map.json] |
| screens/InboxSettingsScreen.jsx | /chat/settings/inbox | HIGH [screen-map.json] |
| screens/InboxChatSettingsScreen.jsx | /chat/settings | HIGH [screen-map.json] |
| screens/settings/BlockedUsersScreen.jsx | /chat/settings/blocked | HIGH [screen-map.json] |
| screens/settings/MessagePrivacyScreen.jsx | /chat/settings/privacy | HIGH [screen-map.json] |

### Components (4)
| File | Purpose |
|---|---|
| components/CardInbox.jsx | Single inbox entry card |
| components/InboxEmptyState.jsx | Empty state UI |
| components/InboxList.jsx | Scrollable list of CardInbox entries |
| components/InboxListSkeleton.jsx | Loading skeleton |

### Hooks (12)
| File | Purpose |
|---|---|
| hooks/useArchiveChat.js | Archive conversation mutation |
| hooks/useChatInbox.js | Core inbox data fetch (React Query) |
| hooks/useChatMessagePrefetch.js | Prefetch conversation messages |
| hooks/useChatUnreadOps.js | Unread badge count operations |
| hooks/useDeleteChat.js | Delete inbox entry mutation |
| hooks/useInbox.js | Inbox list wrapper (folder-aware) |
| hooks/useInboxActions.js | Combined inbox action handlers |
| hooks/useInboxEntryForConversation.js | Single entry lookup by conversationId |
| hooks/useInboxFolder.js | Folder-specific inbox view |
| hooks/useMarkChatRead.js | Mark conversation read (optimistic) |
| hooks/useMessagePrivacySettings.js | Message privacy prefs (localStorage) |
| hooks/useVexSettings.js | Inbox display prefs (localStorage) |

### Controller (1)
| File | Export | Operation |
|---|---|---|
| controller/chatUnread.controller.js | getChatInboxUnreadBadgeCount(actorId) | SELECT via DAL |

### DAL (1)
| File | Export | Table | Query |
|---|---|---|---|
| dal/inboxUnread.read.dal.js | readChatInboxUnreadRowsDAL(actorId) | chat.inbox_entries | SELECT unread_count WHERE actor_id=:actorId AND archived=false AND archived_until_new=false |

### Model (1)
| File | Purpose |
|---|---|
| model/vexSettings.model.js | VexSettings shape, defaults, normalizer |

### Lib / Constants (2)
| File | Purpose |
|---|---|
| lib/buildInboxPreview.js | Builds preview text for inbox entry display |
| constants/inboxSearchAdapter.js | Search adapter constants for inbox search |

## Database [SOURCE_VERIFIED]

| Table | Schema | Key Fields |
|---|---|---|
| inbox_entries | chat | actor_id, conversation_id, unread_count, archived, archived_until_new, folder, pinned, muted, history_cutoff_at |

Folder enum: 'inbox' | 'spam' | 'requests' | 'archived' [SOURCE_VERIFIED: useInboxFolder.js]

## External Dependencies [SCANNER_VERIFIED: dependency-map.json]

| Dependency | Kind | Purpose |
|---|---|---|
| VCSM:block | Feature | BlockedUsersScreen / useMyBlocks |
| VCSM:identity | Feature | Actor identity resolution |
| VCSM:notifications | Feature | Unread count badge |
| VCSM:shared | Feature | UI primitives |
| VCSM:state | Feature | Global state access |
| VCSM:ui | Feature | UI components |
| engine:hydration | Engine | setup.js hydration pattern |
| engine:reviews | Engine | UNKNOWN — not traced in inbox source reads |
| @tanstack/react-query | Library | Server-state management throughout |

## Module Boundaries [SCANNER_VERIFIED: behavior-map.json]

This module does NOT own:
- /chat/:conversationId — conversation module
- /chat/new — start module
- WebSocket / Realtime connection management — chat module
- Message-level read receipts — conversation module
