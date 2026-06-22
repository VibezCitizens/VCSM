---
name: vcsm.chat.index
description: VCSM chat feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / chat

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 3 | recordChatAttachment.controller.js, chatUnread.controller.js; engine controllers delegated via @chat |
| DAL files | 2 | updateAttachmentMediaAsset.write.dal.js (chat schema), inboxUnread.read.dal.js (chat schema) |
| Hooks | 37 | Inbox hooks (useInbox, useChatInbox, useMarkChatRead, useChatMessagePrefetch, useInboxActions, useVexSettings, etc.), conversation hooks (useConversation, useConversationMessages, useConversationMembers, useSendMessageActions, useTypingChannel, useConversationScroll, etc.) |
| Models | 3 | vexSettings.model.js, normalizeConversation.js (lib), resolvePartnerActor.js (lib) |
| Screens | 24 | InboxScreen, ConversationScreen, ConversationView, ArchivedInboxScreen, RequestsInboxScreen, SpamInboxScreen, InboxSettingsScreen, InboxChatSettingsScreen, StartConversationModal, BlockedUsersScreen, MessagePrivacyScreen + layout/ChatScreenLayout |
| Components | 28 | ChatHeader, ChatInput, MessageBubble, MessageGroup, MessageList, MessageMedia, CardInbox, InboxList, InboxEmptyState, InboxListSkeleton, MessageActionsMenu, ConversationActionsMenu |
| Adapters | 3 | chat.adapter.js (public API — exposes useChatUnreadOps), useStartConversation.adapter.js, inboxSearchAdapter.js (constants) |
| Barrels | 3 | index.js (feature root — exports InboxScreen + ConversationScreen), chat.adapter.js, adapters/start barrel |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No file-level route markers detected; routes registered in app/router via InboxScreen + ConversationScreen imports |
| Total source files | 66 | Includes screens, hooks, controllers, DAL, models, adapters, store, setup, styles, debug |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| UPDATE | chat | message_attachments | updateAttachmentMediaAssetIdDAL |
| RPC | identity | (search_actor_directory) | searchActors (injected into @chat engine via setup.js) |

## Security-Sensitive Surfaces

- `identity.search_actor_directory` RPC: actor search surface injected into the chat engine. The search includes a `p_viewer_actor_id` param (viewer scoping) and a `p_viewer_domain` param. Risk level: LOW — read-only directory search with viewer scoping.
- `chat.message_attachments` UPDATE: narrows by `message_id` + `storage_path` to avoid broad updates. Risk level: LOW — writeback is called only after a successful Supabase storage upload and media_assets insert.
- Block relation check in `setup.js` (`moderation.blocks` read): checks bidirectional block in either direction. Risk level: LOW — read-only, no mutations.

## Engine Dependencies

- chat (primary — owns all conversation/message/inbox DB reads and realtime subscriptions)
- directory (actor search for new conversation start)
- hydration (actor summary hydration)
- identity (actor resolution, identity selection store)
- media (media asset creation for chat attachments)
- menu (declared)
- notification (declared)
- review (declared)

## Routes

No routes in route-map for this feature (scanner limitation — React Router routes are registered in apps/VCSM/src/app/router, not as file-level markers within the feature). Known runtime routes:

- `/inbox` — InboxScreen
- `/chat/:conversationId` — ConversationScreen
- `/chat/settings` — InboxSettingsScreen
- `/chat/archived` — ArchivedInboxScreen
- `/chat/requests` — RequestsInboxScreen
- `/chat/spam` — SpamInboxScreen

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no real contract authored) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
