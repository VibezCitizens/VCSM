# Chat — Ownership Record

**Application Scope:** VCSM + ENGINE
**Last updated:** 2026-05-14
**IRONMAN audit:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_ironman_chat-feature-ownership.md`

---

## 1. Purpose

The chat feature owns all real-time and asynchronous messaging between actors (user ↔ user, user ↔ vport). It manages the inbox, conversation threads, message sending, attachment handling, unread badge state, moderation covers, VexSettings (user inbox preferences), and the start-conversation actor search flow.

The chat engine (`engines/chat/`) owns the app-agnostic transport, data access, and domain logic. The app feature layer owns VCSM-specific adaptation, caching, UI state, and the two surgical post-commit writes that fire outside the engine's transaction boundary.

---

## 2. Application Scope

VCSM + ENGINE

---

## 3. Code Roots

| Root | Ownership |
|---|---|
| `apps/VCSM/src/features/chat/` | App-layer owner — all VCSM-specific adaptation, UI, and post-commit writes |
| `engines/chat/src/` | Engine owner — transport, DAL, domain logic, realtime, send RPC |
| `apps/VCSM/src/bootstrap/` | Shared infrastructure — badge hydration path (not exclusively owned by chat) |
| `shared/components/BottomNavBar.jsx` | Shared UI — terminal consumer of the unread badge; not owned by chat |

**Entry files:**
- `apps/VCSM/src/features/chat/index.js` — public exports
- `apps/VCSM/src/features/chat/setup.js` — feature initialization
- `apps/VCSM/src/features/chat/adapters/chat.adapter.js` — only approved cross-feature surface

---

## 4. Core Layers

### DAL (App-level — 2 files)
Owned by: **chat feature**

| File | Table | Operation |
|---|---|---|
| `inbox/dal/inboxUnread.read.dal.js` | `chat.inbox_entries` | SELECT `unread_count` (badge source) |
| `conversation/dal/updateAttachmentMediaAsset.write.dal.js` | `chat.message_attachments` | UPDATE `media_asset_id` (post-send write-back) |

### DAL (Engine-level — 36 files)
Owned by: **engines/chat**
Located at: `engines/chat/src/dal/`
Covers: message send RPC, inbox reads/writes, conversation CRUD, member management, realtime subscriptions, typing presence, edit/reactions, moderation, actor search, legacy mappings.

### Model
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `inbox/model/vexSettings.model.js` | VexSettings normalization and `shouldShowInboxEntry` predicate |
| `start/models/profileSearchResult.model.js` | Actor search result shape for user actors |
| `start/models/vportSearchResult.model.js` | Actor search result shape for vport actors |

### Model — `lib/` sub-folder (Model-class, SENTRY-classified)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `conversation/lib/normalizeConversation.js` | Maps raw DB conversation row to domain shape |
| `conversation/lib/memberActorPresentation.js` | Normalizes and hydrates member actor presentation rows |
| `conversation/lib/resolvePartnerActor.js` | Derives partner actor from members list for DM conversations |
| `inbox/lib/buildInboxPreview.js` | Builds inbox card display shape from InboxEntry |

### Model — `permissions/` sub-folder (Model-class, SENTRY-classified)
Owned by: **chat feature (app-layer)** with engine canonical source

| File | Canonical | Purpose |
|---|---|---|
| `conversation/permissions/canSendMessage.js` | Engine (`engines/chat/src/model/permissions/canSendMessage.js`) | Domain predicate: can actor send in conversation |
| `conversation/permissions/canReadConversation.js` | App-only | Domain predicate: can actor read conversation |
| `conversation/permissions/isActorBlocked.js` | App-only | Domain predicate: symmetric block check |

> All three are pure functions. No IO. These are `(R)` reference files — must stay in sync with engine canonical.

### Controller
Owned by: **chat feature (app-layer)**

| File | Responsibility |
|---|---|
| `inbox/controller/chatUnread.controller.js` | Aggregates raw unread rows into badge integer. Exports `getChatInboxUnreadBadgeCount`. |
| `conversation/controller/recordChatAttachment.controller.js` | Post-send orchestration: resolves `appId` → creates `platform.media_assets` record → calls `updateAttachmentMediaAssetIdDAL`. Fire-and-forget. |

### Adapter
Owned by: **chat feature (cross-feature boundary)**

| File | Purpose |
|---|---|
| `adapters/chat.adapter.js` | Only approved cross-feature surface. Re-exports `useChatUnreadOps`. Consumed by bootstrap and notifications. |
| `adapters/start/hooks/useStartConversation.adapter.js` | Adapter for start-conversation hook used across feature boundaries |

### Hook (Conversation)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `conversation/hooks/conversation/useChatAttachmentUpload.js` | Manages S3 upload for chat images via media engine |
| `conversation/hooks/conversation/useConversation.js` | Loads conversation via engine `openConversation` RPC |
| `conversation/hooks/conversation/useConversationActionsMenu.js` | Menu open/close state for conversation-level actions |
| `conversation/hooks/conversation/useConversationMembers.js` | Loads and subscribes to conversation members |
| `conversation/hooks/conversation/useConversationMessages.js` | App adapter: seeds React Query cache, delegates to engine hook for realtime |
| `conversation/hooks/conversation/useConversationScroll.js` | Scroll position tracking and jump-to-latest state |
| `conversation/hooks/conversation/useMediaViewer.js` | Media lightbox open/close state |
| `conversation/hooks/conversation/useMessageActionsMenu.js` | Long-press / context menu state for individual messages |
| `conversation/hooks/conversation/useSendMessageActions.js` | Orchestrates optimistic send + fire-and-forget attachment recording |
| `conversation/hooks/realtime/useTypingChannel.js` | Wraps engine typing presence channel |

### Hook (Inbox)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `inbox/hooks/useArchiveChat.js` | Archive/unarchive conversation; invalidates `queryKeys.chatUnread` |
| `inbox/hooks/useChatInbox.js` | React Query inbox fetch (30s poll, staleTime=30s) |
| `inbox/hooks/useChatMessagePrefetch.js` | Warm-cache seeding for messages on inbox card hover |
| `inbox/hooks/useChatUnreadOps.js` | Wraps `getChatInboxUnreadBadgeCount` controller as `{ getUnreadBadgeCount }` |
| `inbox/hooks/useDeleteChat.js` | Delete conversation; invalidates `queryKeys.chatUnread` |
| `inbox/hooks/useInbox.js` | Inbox data fetch wrapper with folder param |
| `inbox/hooks/useInboxActions.js` | Inbox mutation action set |
| `inbox/hooks/useInboxEntryForConversation.js` | Single inbox entry lookup by conversationId |
| `inbox/hooks/useInboxFolder.js` | Folder-scoped inbox hook |
| `inbox/hooks/useMarkChatRead.js` | Optimistic mark-read; invalidates `queryKeys.chatUnread` |
| `inbox/hooks/useMessagePrivacySettings.js` | Reads/writes message privacy settings |
| `inbox/hooks/useVexSettings.js` | Reads VexSettings from DB |

### Hook (Start)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `start/hooks/useStartConversation.js` | Initiates new conversation; resolves actor → creates/opens conversation via engine RPC |

### Component (Conversation)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `conversation/components/ChatHeader.jsx` | Sticky header: back + partner identity + options menu |
| `conversation/components/ChatInput.jsx` | Two-state composer: collapsed T-button → expanded input bar |
| `conversation/components/ConversationActionsMenu.jsx` | Archive / Report / Spam menu |
| `conversation/components/MessageActionsMenu.jsx` | Copy / Edit / Delete / Unsend / Report menu |
| `conversation/components/MessageBubble.jsx` | Own/other/system/deleted/uploading/failed message bubble |
| `conversation/components/MessageGroup.jsx` | Groups consecutive messages from same sender |
| `conversation/components/MessageList.jsx` | Scrollable message list with auto-scroll and iOS viewport anchoring |
| `conversation/components/MessageMedia.jsx` | Inline image/video renderer with lightbox |

### Component (Inbox)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `inbox/components/CardInbox.jsx` | Inbox list card: avatar + name + preview + unread badge + delete |
| `inbox/components/InboxEmptyState.jsx` | Empty inbox folder state |
| `inbox/components/InboxList.jsx` | Scrollable inbox list container |
| `inbox/components/InboxListSkeleton.jsx` | Loading skeleton for inbox list |

### Layout (Non-standard sub-layer, chat-owned)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `conversation/layout/ChatScreenLayout.jsx` | Structural wrapper: header + message list ref + footer slots |

### Store (Non-standard sub-layer, chat-owned)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `store/chatUiStore.js` | Zustand store for UI-only state: `selectedConversationId`, `isNewChatModalOpen`, `composerDraftByConversationId`, `activeChatFilter`. Server data lives in React Query — never here. |

### Constants (Non-standard sub-layer, chat-owned)
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `inbox/constants/inboxSearchAdapter.js` | Actor search adapter constants for StartConversationModal |

### Debug (Dev-only, chat-owned)
Owned by: **chat feature (app-layer)** — dev build only

| File | Purpose |
|---|---|
| `debug/chatNavDebugger.js` | Dev-only diagnostic utility. Never ships in production. |

### View Screen
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `conversation/screen/ConversationView.jsx` | Hooks + component composition for the conversation experience |

### Final Screen
Owned by: **chat feature (app-layer)**

| File | Purpose |
|---|---|
| `inbox/screens/InboxScreen.jsx` | Main inbox (/chat) |
| `inbox/screens/ArchivedInboxScreen.jsx` | Archived folder |
| `inbox/screens/RequestsInboxScreen.jsx` | Requests folder |
| `inbox/screens/SpamInboxScreen.jsx` | Spam folder |
| `inbox/screens/InboxChatSettingsScreen.jsx` | Chat settings hub |
| `inbox/screens/InboxSettingsScreen.jsx` | VexSettings config |
| `inbox/screens/settings/BlockedUsersScreen.jsx` | Blocked actors list |
| `inbox/screens/settings/MessagePrivacyScreen.jsx` | Privacy settings |
| `start/screens/StartConversationModal.jsx` | New conversation picker |

---

## 5. Engines Used

| Engine | Alias | Usage |
|---|---|---|
| `engines/chat` | `@chat` | All core chat operations: send, inbox fetch, realtime, open conversation, mark read, member management, typing presence |
| `engines/hydration` | `@hydration` | Actor hydration for member presentation |
| `engines/media` | (indirect) | Image upload via `useChatAttachmentUpload` |

---

## 6. Database / Schema Ownership

### App-layer owned writes

| Table | Schema | Operation | Owner |
|---|---|---|---|
| `inbox_entries` | `chat` | SELECT `unread_count` (badge only) | `features/chat/inbox/dal/inboxUnread.read.dal.js` |
| `message_attachments` | `chat` | UPDATE `media_asset_id` (post-send linkage) | `features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js` |

### Engine-owned (via `engines/chat/src/dal/`)

| Coverage Area | Tables |
|---|---|
| Core messaging | `chat.messages`, `chat.conversations`, `chat.outbox_events` |
| Inbox management | `chat.inbox_entries` (full read/write) |
| Members | `chat.conversation_members` |
| Attachments | `chat.message_attachments` (create) |
| Realtime | `chat.typing_states` (presence channel, not postgres) |
| Moderation | `chat.moderation_actions` |
| Reactions | `chat.message_reactions` |
| Pins/saves | `chat.conversation_pins`, `chat.saved_messages` |
| Media metadata | `platform.media_assets` (via `recordChatAttachment.controller.js`) |

**RLS owner:** Supabase RLS policies on `chat.*` schema — owned by DB/Carnage governance.
**Migration owner:** Carnage (see `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/`)

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Live? | Notes |
|---|---|---|---|---|
| Can send message (canPost gate) | `engines/chat` | Engine `useConversationGuards.js` → `PermissionSnapshot.model.js` | YES — engine enforces | App-level `canSendMessage.js` exists but is unreferenced (dead code — SF-04) |
| Can read conversation | `features/chat` | App `canReadConversation.js` called in `ConversationView.jsx` | YES — but wrong layer (SF-01) | Should be in a hook |
| Block symmetry | `features/chat` | App `isActorBlocked.js` | PARTIAL — called from diagnostics only; live block check is via `useBlockStatus` hook | |
| Badge excludes archived | `features/chat` | DAL filter: `archived=false AND archived_until_new=false` | YES — both app and native DAL enforce this | |
| Spam/requests included in badge | `features/chat` | By absence of folder filter in badge DAL | YES | |
| Member canPost enforcement | `engines/chat` | Engine `sendMessageController` via RPC | YES — server-side via RPC + client-side in engine guard | |
| Moderation cover gate | `features/chat` | `useConversationCover` adapter + `conversationCovered` state | YES | |

---

## 8. Contracts Touched

| Contract | Relevance |
|---|---|
| `ARCHITECTURE.md` | Layer taxonomy, DAL select ban, import path rules, file size limits |
| `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` | App/engine boundary; no cross-root imports |
| `Actor Ownership Contract` | All chat reads scoped to `actorId`; no `profileId` or `vportId` |
| `Engine Isolation Contract` | Engine must remain app-agnostic; app imports engine via `@chat` alias only |
| `Native Transfer Contract` | Chat is native-critical; Falcon governs iOS parity |

---

## 9. Documentation Links

| Document | Path | Status |
|---|---|---|
| DAL audit | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` | PRESENT — verified 2026-05-11 + 2026-05-14 |
| Native transfer module | `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/chat-inbox.md` | PRESENT — updated 2026-05-14 |
| Native deep audit | `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/chat-inbox-deep-audit.md` | PRESENT — 2026-05-04 |
| Falcon parity report | `zNOTFORPRODUCTION/_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md` | PRESENT |
| SENTRY compliance report | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md` | PRESENT |
| AvengersAssemble report | Inline in `vcsm.dal.chat.md` (2026-05-11 section) | PRESENT |
| IRONMAN ownership | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md` (this file) | PRESENT |
| LOKI runtime trace | — | MISSING |
| KRAVEN performance report | — | MISSING |
| CARNAGE migration audit | — | MISSING |

---

## 10. Runtime Ownership

| Runtime Flow | Entry Point | Owning Layer | Hot Path | Known Risk |
|---|---|---|---|---|
| Unread badge (global) | `bootstrap.selectors.js useChatUnread()` → `BottomNavBar.jsx` | Bootstrap + chat badge hook | YES — polls every 30s for all sessions | KRAVEN review pending |
| Inbox list | `InboxScreen.jsx` → `useInboxFolder` → `useChatInbox` → React Query | Chat inbox hook | MEDIUM | React Query 30s poll |
| Conversation open | `ConversationScreen.jsx` → `ConversationView.jsx` → engine hooks | Chat conversation hook | HIGH | Engine `openConversation` RPC on every open |
| Message send | `ChatInput` → `useSendMessageActions` → engine `sendMessageController` → `send_message_atomic` RPC | Chat send hook → engine controller | HIGH | Atomic RPC + outbox fan-out |
| Attachment send | `ChatInput` → `useChatAttachmentUpload` → CDN → `recordChatAttachmentController` | Chat attachment hook + controller | MEDIUM | Fire-and-forget; non-fatal failure |
| Mark read | `ConversationView` mount → `useMarkChatRead` | Chat inbox hook | MEDIUM | Fires on every conversation open |
| Typing presence | `useTypingChannel` → Supabase Presence channel | Engine typing hook | LOW | Presence, not postgres_changes |

---

## 11. Responsibilities

Chat feature owns:
- All PWA surfaces for messaging (inbox screens, conversation screen, start-conversation modal)
- The two app-level DAL files that write outside the engine transaction boundary
- The badge controller and hook that aggregate inbox unread counts
- The attachment upload hook and post-send controller
- VexSettings model and hook
- The `chat.adapter.js` cross-feature boundary surface
- The UI store (`chatUiStore.js`) for client-only UI state
- The debug utility (`chatNavDebugger.js`)
- The `(R)` permission reference files (must remain in sync with engine)
- Native parity gap tracking (Falcon DRIFT-01, DRIFT-02)

Chat engine owns:
- All core chat transport and domain logic
- 36 DAL files covering full message/inbox/member/realtime/moderation surface
- Canonical `canSendMessage.js` enforcement via `useConversationGuards.js`
- `send_message_atomic` RPC integration
- Realtime subscription lifecycle

---

## 12. Boundaries

Chat feature must NOT:
- Write directly to `chat.*` schema tables outside the two designated app-level DAL files
- Import from notifications, feed, or other features except via the `chat.adapter.js` boundary
- Put domain logic or model transforms in Final Screens (SF-02 — pending cleanup)
- Put permission enforcement in View Screens (SF-01 — pending cleanup)
- Import Supabase directly — all DB access via DAL files

Chat engine must NOT:
- Import VCSM app-specific feature logic
- Know about VCSM routing, React, or UI concerns
- Depend on VCSM bootstrap or identity hooks

---

## 13. Change Impact Rules

| Change | Must Update |
|---|---|
| Any chat DAL file (app or engine) | `vcsm.dal.chat.md`, this ownership file |
| `canSendMessage.js` (either copy) | Other copy must be synced; document in SF-04 tracking |
| `chat.inbox_entries` schema | Badge DAL, engine inbox DAL, native `fetchInboxUnreadCountRows`, Carnage migration audit |
| `chat.message_attachments` schema | `updateAttachmentMediaAsset.write.dal.js`, native chat attachment recording, Carnage |
| `chat.adapter.js` cross-feature surface | All consumers: bootstrap, notifications feature |
| New route added | Native ROADTRIP_INDEX route count, `chat-inbox.md` |
| Native chat code change | `chat-inbox.md` Transfer History, ROADTRIP_INDEX last-updated |

---

## 14. Release Gate Notes

| Item | Status | Owner |
|---|---|---|
| Badge DAL parity (native) | READY | — |
| canPost enforcement (native) | CAUTION — DRIFT-01 | Native chat team (Falcon) |
| media_assets recording (native) | CAUTION — DRIFT-02 | Native chat team (Falcon) |
| SF-01 (canReadConversation in View Screen) | OPEN — P2 | Chat feature |
| SF-02 (buildInboxPreview in Final Screens) | OPEN — P2 | Chat feature |
| SF-04 (canSendMessage dead code) | OPEN — P2 | Chat feature |
| LOKI runtime trace | MISSING | Loki |
| KRAVEN performance (30s badge poll) | MISSING | Kraven |
| CARNAGE migration history | MISSING | Carnage |

---

## 15. Open Ownership Questions

1. **`(R)` convention:** The marker on permission files is undocumented. Owner must either add sync-contract comments or remove app copies in favor of engine imports via `@chat` alias. (SF-06)
2. **`canSendMessage.js` app copy:** Dead code with no importers. Owner must delete or wire it. (SF-04)
3. **`buildInboxPreview` placement:** Called from 4 Final Screens. Owner must move to hook layer. (SF-02)
4. **`canReadConversation` placement:** Called from View Screen. Owner must extract to `useConversationAccess` hook. (SF-01)
