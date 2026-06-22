# MODULE ARCHITECTURE REPORT

**Module:** chat
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Real-Time Messaging (Engine Wrapper + Extensions)
**Primary Root:** `apps/VCSM/src/features/chat/`
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the full messaging experience: inbox (conversation list), conversation view (messages, typing, media), conversation start flow, archived/spam/request inboxes, and inbox settings. Wraps the `@chat` engine for core messaging operations and extends it with VCSM-specific features: chat attachment upload with media asset recording, unread badge counting, block-aware filtering, and VEX (message privacy) settings.

---

## OWNERSHIP

Chat owns: inbox display, conversation screen, message send/delete/action menus, attachment upload, unread badge, block filtering in inbox, VEX settings, archive/delete, and start-conversation flow. The `@chat` engine owns: message storage, realtime subscriptions, delivery, read receipts.

---

## ENTRY POINTS

- `/messages` → `InboxScreen.jsx`
- `/messages/archived` → `ArchivedInboxScreen.jsx`
- `/messages/requests` → `RequestsInboxScreen.jsx`
- `/messages/spam` → `SpamInboxScreen.jsx`
- `/messages/settings` → `InboxSettingsScreen.jsx`
- `/messages/settings/chat/:id` → `InboxChatSettingsScreen.jsx`
- `/messages/settings/blocked` → `BlockedUsersScreen.jsx`
- `/messages/settings/privacy` → `MessagePrivacyScreen.jsx`
- `/messages/:conversationId` → `ConversationScreen.jsx`

---

## LAYER MAP

**inbox/ sub-module:**
DAL: `inboxUnread.read.dal.js`
Controller: `chatUnread.controller.js`
Hooks: `useArchiveChat.js`, `useChatInbox.js`, `useChatMessagePrefetch.js`, `useChatUnreadOps.js`, `useDeleteChat.js`, `useInbox.js`, `useInboxActions.js`, `useInboxEntryForConversation.js`, `useInboxFolder.js`, `useMarkChatRead.js`, `useMessagePrivacySettings.js`, `useVexSettings.js`
Model: `vexSettings.model.js`
Components: `CardInbox.jsx`, `InboxEmptyState.jsx`, `InboxList.jsx`, `InboxListSkeleton.jsx`
Screens: `ArchivedInboxScreen.jsx`, `InboxChatSettingsScreen.jsx`, `InboxScreen.jsx`, `InboxSettingsScreen.jsx`, `RequestsInboxScreen.jsx`, `SpamInboxScreen.jsx`, `settings/BlockedUsersScreen.jsx`, `settings/MessagePrivacyScreen.jsx`
Lib: `buildInboxPreview.js`
Constants: `inboxSearchAdapter.js`

**conversation/ sub-module:**
DAL: `updateAttachmentMediaAsset.write.dal.js`
Controller: `recordChatAttachment.controller.js`
Hooks: `useChatAttachmentUpload.js`, `useConversation.js`, `useConversationActionsMenu.js`, `useConversationMembers.js`, `useConversationMessages.js`, `useConversationScroll.js`, `useMediaViewer.js`, `useMessageActionsMenu.js`, `useSendMessageActions.js`, `useTypingChannel.js` (realtime)
Components: `ChatHeader.jsx`, `ChatInput.jsx`, `ConversationActionsMenu.jsx`, `MessageActionsMenu.jsx`, `MessageBubble.jsx`, `MessageGroup.jsx`, `MessageList.jsx`, `MessageMedia.jsx`
Screen: `ConversationScreen.jsx`, `ConversationView.jsx`
Layout: `ChatScreenLayout.jsx`
Lib: `memberActorPresentation.js`, `normalizeConversation.js`, `resolvePartnerActor.js`
Permissions: `canReadConversation.js`, `canSendMessage.js`, `isActorBlocked.js`

**start/ sub-module:**
Hooks: `useStartConversation.js`
Models: `profileSearchResult.model.js`, `vportSearchResult.model.js`
Screen: `StartConversationModal.jsx`

**notifications/ sub-module:**
DAL: `inbox/dal/blocks.read.dal.js`, `senders.read.dal.js`
Controllers: `inboxUnread.controller.js`, `notificationsCount.controller.js` (in notifications inbox — NOTE: these belong in notifications, not chat)

**Store:** `chatUiStore.js` — Zustand store (media viewer, message action menu state)

**Engine Consumers:** `@chat` engine (via setup.js and direct import for inbox/conversation hooks)

**Adapters:**
- `chat.adapter.js` — main adapter
- `start/hooks/useStartConversation.adapter.js`

**Debug:** `chatNavDebugger.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear chat ownership | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | 9 screens routed | — |
| Controllers present/delegated | PARTIAL | 2 local controllers, rest in @chat engine | Boundary between engine and feature controllers unclear |
| DAL/repository present/delegated | PARTIAL | 2 local DALs, rest in @chat engine | — |
| Models/transformers present | PARTIAL | 3 models | — |
| Hooks/view models present | PASS | 20+ hooks | — |
| Screens/components present | PASS | 9 screens, 8+ components | — |
| Services/adapters present | PASS | 2 adapters | — |
| Database objects mapped | PARTIAL | chat schema (engine) + vc.blocks (local) | Engine schema not mapped |
| Authorization path mapped | PARTIAL | canReadConversation, canSendMessage, isActorBlocked | Block check not centralized |
| Cache/runtime behavior mapped | PARTIAL | chatUiStore for UI state | Message cache in engine |
| Error/loading/empty states mapped | PARTIAL | InboxEmptyState, InboxListSkeleton | Conversation error state unclear |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PARTIAL | @chat engine dependency present | Engine boundary not documented |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@chat` engine | engine | chat → @chat | YES | Core messaging via engine |
| `block` feature | feature | chat → block | PARTIAL | isActorBlocked.js in conversation/permissions |
| `media` feature | feature | chat → media | PARTIAL | attachment upload uses media asset |
| `notifications` feature | feature | chat inbox → notifications | WARNING | Some notification controllers appear inside chat/inbox |
| `chat` schema | database | @chat engine | YES (via engine) | Engine-managed |
| `vc.blocks` | database | chat reads | YES | Block-aware inbox |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Inbox conversation list | read | @chat engine | InboxScreen | — |
| Messages list | read | @chat engine | ConversationScreen | — |
| Unread count | derived | chat (chatUnread.controller) | Notifications badge | Duplicated with notifications feature |
| VEX settings | read/write | chat | InboxSettingsScreen | — |
| Attachment media asset | write | chat (recordChatAttachment) | Conversation | — |
| Block state | read | block feature | chat (inbox filter) | Stale blocks = spam appears |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | 9 screens routed | — |
| Loading state | PASS | InboxListSkeleton | — |
| Empty state | PASS | InboxEmptyState | — |
| Error state | PARTIAL | Not fully confirmed | — |
| Auth/owner gates | PARTIAL | canReadConversation exists | Not wired to route guard |
| Cache behavior | PARTIAL | chatUiStore | Engine-level cache not visible |
| Runtime dependencies | PASS | @chat engine initialized | — |
| Hot paths | HIGH | Inbox on every app open | Must be fast |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `inbox/dal/blocks.read.dal.js` in chat | Block reads belong to block feature | MEDIUM | SENTRY |
| `inbox/dal/senders.read.dal.js` in chat | Sender reads could be actor hydration | MEDIUM | SENTRY |
| Notification-adjacent controllers inside chat/inbox | `inboxUnread.controller.js` in chat - ambiguous ownership | HIGH | IRONMAN |
| `chatNavDebugger.js` in debug/ | Debug file in production feature tree | LOW | IRONMAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | @chat | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Engine/feature controller boundary | HIGH | Unclear what chat feature vs @chat engine owns | IRONMAN |
| Block DAL ownership | HIGH | `vc.blocks` read in chat should go through block feature | SENTRY |
| Unread count ownership | HIGH | Overlap with notifications feature | IRONMAN |
| Logan documentation | HIGH | No canonical chat architecture | LOGAN |
| Conversation error state | MEDIUM | Broken conversation = silent blank screen | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- IRONMAN (ownership: unread count, engine vs feature boundary)
- SENTRY (boundary: block reads in chat, notification overlap)
- LOGAN (documentation)
- LOKI (runtime: message delivery trace)
- VENOM (security: canReadConversation gate coverage)
