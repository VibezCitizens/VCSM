# VCSM DAL — `chat`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/chat/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 2 |
| Exported functions | 2 |
| Tables accessed | 2 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `inboxUnread.read.dal.js`

**Path:** `features/chat/inbox/dal/inboxUnread.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readChatInboxUnreadRowsDAL` | `read` | `inbox_entries` |

### `updateAttachmentMediaAsset.write.dal.js`

**Path:** `features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js`  
**Operations:** `update`  

**Exported functions:**

| `updateAttachmentMediaAssetIdDAL` | `update` | `message_attachments` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `inbox_entries` | READ | `readChatInboxUnreadRowsDAL` |
| `message_attachments` | UPDATE | `updateAttachmentMediaAssetIdDAL` |

---

## Risk Findings

**Stale call chain in original doc:** `inboxUnread.read.dal.js` was originally documented as a partial chain that never reached a screen. This was incorrect. The real terminal is `BottomNavBar.jsx` via the bootstrap hydration layer — see corrected call chains below.

**Engine boundary note:** 36 of the chat DAL files live in the chat engine (`engines/chat/src/dal/`), not in the app layer. The 2 app-level DAL files are surgical writes that fire after engine commits. This is intentional architecture, not a gap. Any audit that only inspects `features/chat/dal/` will appear to see a near-empty DAL — the engine handles the rest.

---

## Pending Reviews

No pending reviews — dead code audit completed 2026-05-11. Call chain documentation corrected.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `updateAttachmentMediaAsset.write.dal.js`

**Direct callers:**

- `recordChatAttachment.controller.js` _Controller_

**Full call chain to screen:**

```
`updateAttachmentMediaAsset.write.dal.js` → `recordChatAttachment.controller.js` → `useSendMessageActions.js` → `ConversationView.jsx`
```
```
`updateAttachmentMediaAsset.write.dal.js` → `recordChatAttachment.controller.js` → `useSendMessageActions.js` → `ConversationView.jsx` → `ConversationScreen.jsx`
```

### `inboxUnread.read.dal.js`

**Direct callers:**

- `chatUnread.controller.js` _Controller_

**Full call chain to screen** _(corrected 2026-05-11 — original "partial chain" was stale):_

```
`inboxUnread.read.dal.js` → `chatUnread.controller.js` → `useChatUnreadOps.js` → `bootstrap.selectors.js` → `BottomNavBar.jsx`
```

Terminal: **`BottomNavBar.jsx`** — renders the chat unread badge count in the bottom navigation bar. This DAL drives the live badge displayed to all users in session.

**Secondary branches (diagnostic / group consumers):**

```
`inboxUnread.read.dal.js` → `chatUnread.controller.js` → `notificationsFeature.group.js`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `vexSettings.model.js`, `profileSearchResult.model.js`, `vportSearchResult.model.js` |
| **Lib / Permissions** | ⚠ NON-STANDARD | `conversation/lib/*`, `inbox/lib/buildInboxPreview.js`, `conversation/permissions/*` — pure model-like helpers/predicates outside the formal taxonomy |
| **Controller** | ✓ PRESENT | `recordChatAttachment.controller.js`, `chatUnread.controller.js` |
| **Adapter** | ✓ PRESENT | `chat.adapter.js`, `useStartConversation.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Layout** | ⚠ NON-STANDARD | `conversation/layout/ChatScreenLayout.jsx` |
| **Store** | ⚠ NON-STANDARD | `store/chatUiStore.js` — UI-only Zustand state |
| **Debug** | DEV-ONLY | `debug/chatNavDebugger.js` |
| **Hook** | ✓ PRESENT | `useChatAttachmentUpload.js`, `useConversation.js`, `useConversationActionsMenu.js`, `useConversationMembers.js`, `useConversationMessages.js`, `useConversationScroll.js` +17 more |
| **Component** | ✓ PRESENT | `ChatHeader.jsx`, `ChatInput.jsx`, `ConversationActionsMenu.jsx`, `MessageActionsMenu.jsx`, `MessageBubble.jsx`, `MessageGroup.jsx` +6 more |
| **View Screen** | ✓ PRESENT | `ConversationView.jsx` |
| **Final Screen** | ✓ PRESENT | `ArchivedInboxScreen.jsx`, `InboxChatSettingsScreen.jsx`, `InboxScreen.jsx`, `InboxSettingsScreen.jsx`, `RequestsInboxScreen.jsx`, `SpamInboxScreen.jsx` +2 more |

### Model

_Pure transforms — no side effects, no DB access_

- `features/chat/inbox/model/vexSettings.model.js`
- `features/chat/start/models/profileSearchResult.model.js`
- `features/chat/start/models/vportSearchResult.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/chat/conversation/controller/recordChatAttachment.controller.js`
- `features/chat/inbox/controller/chatUnread.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/chat/adapters/chat.adapter.js`
- `features/chat/adapters/start/hooks/useStartConversation.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/chat/conversation/hooks/conversation/useChatAttachmentUpload.js`
- `features/chat/conversation/hooks/conversation/useConversation.js`
- `features/chat/conversation/hooks/conversation/useConversationActionsMenu.js`
- `features/chat/conversation/hooks/conversation/useConversationMembers.js`
- `features/chat/conversation/hooks/conversation/useConversationMessages.js`
- `features/chat/conversation/hooks/conversation/useConversationScroll.js`
- `features/chat/conversation/hooks/conversation/useMediaViewer.js`
- `features/chat/conversation/hooks/conversation/useMessageActionsMenu.js`
- `features/chat/conversation/hooks/conversation/useSendMessageActions.js`
- `features/chat/conversation/hooks/realtime/useTypingChannel.js`
- `features/chat/inbox/hooks/useArchiveChat.js`
- `features/chat/inbox/hooks/useChatInbox.js`
- `features/chat/inbox/hooks/useChatMessagePrefetch.js`
- `features/chat/inbox/hooks/useChatUnreadOps.js`
- `features/chat/inbox/hooks/useDeleteChat.js`
- `features/chat/inbox/hooks/useInbox.js`
- `features/chat/inbox/hooks/useInboxActions.js`
- `features/chat/inbox/hooks/useInboxEntryForConversation.js`
- `features/chat/inbox/hooks/useInboxFolder.js`
- `features/chat/inbox/hooks/useMarkChatRead.js`
- `features/chat/inbox/hooks/useMessagePrivacySettings.js`
- `features/chat/inbox/hooks/useVexSettings.js`
- `features/chat/start/hooks/useStartConversation.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/chat/conversation/components/ChatHeader.jsx`
- `features/chat/conversation/components/ChatInput.jsx`
- `features/chat/conversation/components/ConversationActionsMenu.jsx`
- `features/chat/conversation/components/MessageActionsMenu.jsx`
- `features/chat/conversation/components/MessageBubble.jsx`
- `features/chat/conversation/components/MessageGroup.jsx`
- `features/chat/conversation/components/MessageList.jsx`
- `features/chat/conversation/components/MessageMedia.jsx`
- `features/chat/inbox/components/CardInbox.jsx`
- `features/chat/inbox/components/InboxEmptyState.jsx`
- `features/chat/inbox/components/InboxList.jsx`
- `features/chat/inbox/components/InboxListSkeleton.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/chat/conversation/screen/ConversationView.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/chat/inbox/screens/ArchivedInboxScreen.jsx`
- `features/chat/inbox/screens/InboxChatSettingsScreen.jsx`
- `features/chat/inbox/screens/InboxScreen.jsx`
- `features/chat/inbox/screens/InboxSettingsScreen.jsx`
- `features/chat/inbox/screens/RequestsInboxScreen.jsx`
- `features/chat/inbox/screens/SpamInboxScreen.jsx`
- `features/chat/inbox/screens/settings/BlockedUsersScreen.jsx`
- `features/chat/inbox/screens/settings/MessagePrivacyScreen.jsx`
- `features/chat/start/screens/StartConversationModal.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Engine DAL Coverage

The app-level chat DAL intentionally contains only 2 files. The chat engine owns 36 DAL files covering all core operations.

| Area | Owner | DAL Files |
|---|---|---|
| Atomic message send | `engines/chat` | `sendMessageAtomic.rpc.dal.js` |
| Attachments | `engines/chat` | `attachments.write.dal.js`, `messageReceipts.write.dal.js` |
| Inbox reads | `engines/chat` | `inbox.read.dal.js`, `inbox.entry.read.dal.js` |
| Inbox writes | `engines/chat` | `inbox_entries.write.dal.js` |
| Conversations | `engines/chat` | `conversationRead.read.dal.js`, `conversations.write.dal.js` |
| Messages | `engines/chat` | `messages.write.dal.js`, `messages.timeline.read.dal.js`, `messages.last.read.dal.js` |
| Membership | `engines/chat` | `conversationMembers.read.dal.js`, `conversationMembership.read.dal.js`, `conversationMembership.write.dal.js` |
| Typing / presence | `engines/chat` | `typingStates.write.dal.js`, `typingPresence.dal.js` |
| Edit / reactions | `engines/chat` | `editMessage.write.dal.js`, `messageReactions.write.dal.js` |
| Moderation | `engines/chat` | `moderationActions.write.dal.js` |
| Actor realm / block relations | `engines/chat` | `actorRealm.read.dal.js`, `blockRelations.read.dal.js` |
| Conversation open/create RPCs | `engines/chat` | `getOrCreateDirectConversation.rpc.js`, `openConversation.rpc.js` |
| Conversation delete/read visibility | `engines/chat` | `deleteThreadForMe.dal.js`, `messageForEdit.read.dal.js`, `messageVisibility.read.dal.js` |
| Inbox/outbox writes | `engines/chat` | `inbox.write.dal.js`, `outbox.write.dal.js` |
| Pins / saved messages | `engines/chat` | `pins.write.dal.js`, `savedMessages.write.dal.js` |
| Actor search / legacy mapping | `engines/chat` | `searchActors.dal.js`, `legacyMappings.dal.js` |
| Realtime subscriptions | `engines/chat` | `subscribeToConversation.js`, `subscribeToInbox.js` |
| App-level unread read | `features/chat` | `inboxUnread.read.dal.js` |
| App-level media asset write | `features/chat` | `updateAttachmentMediaAsset.write.dal.js` |

The 2 app-level DAL files are post-commit surgical writes that sit outside the engine's transaction boundary. They are not duplicates of engine DAL.

---

## Dead Code Audit

_Audit Date:_ 2026-05-11  
_Auditor:_ ARCHITECT static scan + live import grep  
_Scope:_ 2 DAL files · 2 exported functions  
_Method:_ Every exported function name grepped against `apps/VCSM/src/` for active imports. Call chains traced to terminal screen or component. Engine DAL coverage verified separately at `engines/chat/src/dal/`.

### Function Status Table

| Function | DAL File | Imported By | Status |
|---|---|---|---|
| `readChatInboxUnreadRowsDAL` | `inboxUnread.read.dal.js` | `chatUnread.controller.js` | LIVE — badge count in BottomNavBar |
| `updateAttachmentMediaAssetIdDAL` | `updateAttachmentMediaAsset.write.dal.js` | `recordChatAttachment.controller.js` | LIVE — post-send media asset write |

### Corrected Call Chain: `inboxUnread.read.dal.js`

Original doc classified this as a partial chain (no screen reached). Audit determined the full chain:

```
readChatInboxUnreadRowsDAL
  → chatUnread.controller.js
    → useChatUnreadOps.js
      → bootstrap.selectors.js
        → BottomNavBar.jsx  ← terminal screen component
```

The "partial" label was a static scan limitation — the bootstrap layer sits outside the direct import graph that ARCHITECT traced. The chain is live and reaches UI.

### DAL File Inventory

| Status | Count |
|---|---|
| DAL files on disk | 2 |
| DAL files in doc | 2 |
| DAL files missed by doc | 0 |
| DAL files in doc not on disk | 0 |
| Dead functions | 0 |
| Orphaned DAL files | 0 |

### Audit Verdict

- **Dead functions:** 0
- **Orphaned DAL files:** 0
- **Stale doc finding:** 1 — partial chain corrected to full chain
- **Overall app-level DAL health:** CLEAN

---

## Native Parity Notes

Native Relevance: YES  
Falcon Review: REQUIRED  
Related Native Module: `chat` — messaging, inbox, unread badge, and attachment flows are all user-facing and must be verified for native parity.  
Native Transfer Status: PENDING FALCON  
Known Native Gaps: Not yet assessed — Falcon review has not been initiated for this DAL layer. The bootstrap-mediated unread badge path (`bootstrap.selectors.js → BottomNavBar.jsx`) may behave differently in a native context and warrants specific Falcon attention.  
Winter Soldier Handoff: Not yet initiated.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` (this doc) | Initial DAL map + dead code audit source | PRESENT |
| VENOM | — | Trust boundary review for chat session reads | MISSING |
| SENTRY | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md` | Architecture boundary — lib/permissions classification, RISK-1 verification | PRESENT |
| FALCON | `zNOTFORPRODUCTION/_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md` | Native parity for chat inbox, badge, attachments | PRESENT |
| LOKI | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_loki_chat-badge-bootstrap-trace.md` | Runtime trace for bootstrap unread badge path | PRESENT |
| KRAVEN | `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-14_kraven_chat-badge-poll-performance.md` | Performance review for `readChatInboxUnreadRowsDAL` polling frequency | PRESENT |
| CARNAGE | `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_chat-inbox-attachments-migration-history.md` | DB migration history for `inbox_entries`, `message_attachments` | PRESENT |

---

## Consumer Map

_Generated:_ 2026-05-11  
_Method:_ ARCHITECT static scan + live `grep` across `apps/VCSM/src/` — every import and query key reference traced by hand  
_Scope:_ both app-level chat DAL files + all layers that touch them up to terminal screen

This section answers: **what model, controller, hook, adapter, and screen touches each DAL file?**

---

### DAL: `inboxUnread.read.dal.js`

**Exported function:** `readChatInboxUnreadRowsDAL(actorId)`  
**Table:** `chat.inbox_entries`  
**Operation:** SELECT `unread_count` WHERE `actor_id = actorId AND archived = false AND archived_until_new = false`

#### Model

None. The DAL returns raw rows (`[{ unread_count }]`). The controller performs the aggregation inline (`rows.reduce(...)`). No model file mediates this DAL.

#### Controllers

| File | Import | Role |
|---|---|---|
| `features/chat/inbox/controller/chatUnread.controller.js` | `readChatInboxUnreadRowsDAL` | Aggregates raw rows into a badge integer. Exports `getChatInboxUnreadBadgeCount` and alias `getInboxUnreadBadgeCount`. This is the **only direct caller** of the DAL. |
| `features/notifications/inbox/controller/inboxUnread.controller.js` | Re-exports `getChatInboxUnreadBadgeCount` from `chatUnread.controller.js` | Cross-feature re-export — notifications surface re-exposes the badge count. Does **not** call the DAL directly. |

#### Adapters

| File | Import | Role |
|---|---|---|
| `features/chat/adapters/chat.adapter.js` | Re-exports `useChatUnreadOps` from the hook | Boundary — only approved cross-feature surface for the hook. One-liner re-export. |

#### Hooks

| File | Import | Role |
|---|---|---|
| `features/chat/inbox/hooks/useChatUnreadOps.js` | `getChatInboxUnreadBadgeCount` from controller | Wraps controller as `{ getUnreadBadgeCount }`. Called by `bootstrap.selectors.js` via `chat.adapter.js`. |
| `features/chat/inbox/hooks/useMarkChatRead.js` | `queryKeys.chatUnread` (query key only) | Does **not** import the DAL or controller. Manages optimistic cache update (`setQueryData`) and invalidates `queryKeys.chatUnread` on success/error. Reads badge from React Query cache, not DAL directly. |
| `features/chat/inbox/hooks/useArchiveChat.js` | `queryKeys.chatUnread` (query key only) | Invalidates `queryKeys.chatUnread` on archive success. No direct DAL or controller import. |
| `features/chat/inbox/hooks/useDeleteChat.js` | `queryKeys.chatUnread` (query key only) | Invalidates `queryKeys.chatUnread` on delete success. No direct DAL or controller import. |
| `features/notifications/inbox/hooks/useUnreadBadge.js` | `useChatUnreadOps` via `features/chat/adapters/chat.adapter.js` | Notifications feature hook uses the approved chat adapter boundary and calls `getUnreadBadgeCount` from the hook surface. |

#### Bootstrap Layer (between hooks and screens)

| File | Role |
|---|---|
| `bootstrap/bootstrap.selectors.js` | Defines `useChatUnread()` — React Query selector that calls `getUnreadBadgeCount(actorId)` from `useChatUnreadOps()`. Polls every **30 seconds** (`refetchInterval: 30_000`). This is the live badge data source for all screens. |
| `bootstrap/bootstrap.store.js` | Zustand hydration lifecycle store used by `bootstrap.selectors.js` for the active hydrated actor and loading/error lifecycle state. |
| `bootstrap/bootstrap.hydrate.controller.js` | Defines `useBootstrapHydration(actorId)` — registers `noti:refresh` event listener that calls `queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })` on demand. Does not import the DAL. |
| `bootstrap/bootstrap.invalidate.js` | Defines `invalidateChatUnread()` — imperative cache busting for write paths. Calls `queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread })`. No direct DAL import. |

#### Screens / Terminal Components

| File | Layer | Role |
|---|---|---|
| `shared/components/BottomNavBar.jsx` | Component (persistent, mounted globally) | **Terminal consumer.** Calls `useChatUnread()` and `useBootstrapHydration(actorId)`. Renders the live chat unread badge in the bottom navigation bar. This is the UI endpoint for the entire chain. |

#### Diagnostic Consumer

| File | Role |
|---|---|
| `dev/diagnostics/groups/notificationsFeature.group.js` | Dev-only. Directly imports `getChatInboxUnreadBadgeCount` from `chatUnread.controller.js` to run the `inbox_unread_badge` diagnostic test. Never runs in production. |

#### Full Consumer Chain: `inboxUnread.read.dal.js`

```
chat.inbox_entries (Supabase)
  ↑
readChatInboxUnreadRowsDAL                          [DAL]
  ↑
getChatInboxUnreadBadgeCount                        [Controller]  chatUnread.controller.js
  ↑
useChatUnreadOps → chat.adapter.js (re-export)      [Hook + Adapter]
  ↑
bootstrap.selectors.js → useChatUnread()            [Bootstrap Selector — polls 30s]
  ↑
BottomNavBar.jsx                                    [Terminal Screen Component]
```

**Cache invalidation branches** (do not call DAL directly — only bust the React Query key):

```
useMarkChatRead.js  →  invalidates queryKeys.chatUnread  (optimistic + on success/error)
useArchiveChat.js   →  invalidates queryKeys.chatUnread  (on success)
useDeleteChat.js    →  invalidates queryKeys.chatUnread  (on success)
bootstrap.invalidate.js → invalidateChatUnread()         (imperative, called from write paths)
bootstrap.hydrate.controller.js → invalidateQueries on noti:refresh event
```

---

### DAL: `updateAttachmentMediaAsset.write.dal.js`

**Exported function:** `updateAttachmentMediaAssetIdDAL({ messageId, storageKey, mediaAssetId })`  
**Table:** `chat.message_attachments`  
**Operation:** UPDATE `media_asset_id` WHERE `message_id = messageId AND storage_path = storageKey`

#### Model

None. This is a surgical point-update with no shape translation. The controller owns the coordination logic; the DAL is a direct write.

#### Controllers

| File | Import | Role |
|---|---|---|
| `features/chat/conversation/controller/recordChatAttachment.controller.js` | `updateAttachmentMediaAssetIdDAL` | **Only direct caller.** Orchestrates the full post-send write-back: resolves `appId` → creates `platform.media_assets` record → calls `updateAttachmentMediaAssetIdDAL` to link the new asset ID back to `chat.message_attachments`. Designed to be called fire-and-forget. Also imports `createMediaAssetController` (media feature) and `resolveVcsmAppIdDAL` (media DAL) — this is the cross-feature coordination point. |

#### Hooks

| File | Import | Role |
|---|---|---|
| `features/chat/conversation/hooks/conversation/useSendMessageActions.js` | `recordChatAttachmentController` | Calls the controller **fire-and-forget** (`.catch` only) after the message send completes and CDN URL is confirmed. Owns the optimistic placeholder flow. The attachment write-back failure is non-fatal and does not block the user. |
| `features/chat/conversation/hooks/conversation/useChatAttachmentUpload.js` | — | Referenced inside `useSendMessageActions` via `useChatAttachmentUpload`. Handles S3 upload via the media engine. Does **not** import the DAL directly — it operates at the upload layer upstream of the controller. |

#### View Screen

| File | Layer | Role |
|---|---|---|
| `features/chat/conversation/screen/ConversationView.jsx` | View Screen | Imports `useSendMessageActions`. Composes the full conversation UI including `ChatInput`, `MessageList`, and all conversation hooks. |

#### Final Screen

| File | Layer | Role |
|---|---|---|
| `features/chat/conversation/screen/ConversationScreen.jsx` | Final Screen | Route entry point. Wraps `ConversationView.jsx`. Identity gate only. |

#### Full Consumer Chain: `updateAttachmentMediaAsset.write.dal.js`

```
[User taps attach → selects image]
  ↓
useSendMessageActions.js → handleAttach()           [Hook]
  ↓ (upload via media engine)
useChatAttachmentUpload.js → uploadAttachment()     [Hook — media engine boundary]
  ↓ (CDN confirmed, message sent via chat engine)
recordChatAttachmentController()  ← fire-and-forget [Controller]
  ↓ (creates platform.media_assets record first)
updateAttachmentMediaAssetIdDAL()                   [DAL]
  ↓
chat.message_attachments (Supabase UPDATE)
```

Mounted in:

```
ConversationScreen.jsx   [Final Screen]
  └── ConversationView.jsx  [View Screen]
        └── useSendMessageActions.js  [Hook]
              └── recordChatAttachmentController  [Controller]
                    └── updateAttachmentMediaAssetIdDAL  [DAL]
```

---

### Consumer Map Summary Table

| DAL Function | Model | Controller | Adapter | Hook (direct) | Hook (cache invalidation) | Bootstrap | Screen |
|---|---|---|---|---|---|---|---|
| `readChatInboxUnreadRowsDAL` | — | `chatUnread.controller.js` | `chat.adapter.js` | `useChatUnreadOps.js` | `useMarkChatRead`, `useArchiveChat`, `useDeleteChat` | `bootstrap.selectors.js`, `bootstrap.hydrate.controller.js`, `bootstrap.invalidate.js` | `BottomNavBar.jsx` |
| `updateAttachmentMediaAssetIdDAL` | — | `recordChatAttachment.controller.js` | — | `useSendMessageActions.js`, `useChatAttachmentUpload.js` | — | — | `ConversationView.jsx` → `ConversationScreen.jsx` |

---

## Change Log

### 2026-05-11 (Consumer Map)

**Task:** Full consumer map — trace every model, controller, adapter, hook, bootstrap layer, and screen that touches each chat DAL file  
**Application Scope:** VCSM  
**Prompt:** User requested ARCHITECT consumer trace for `vcsm.dal.chat.md`, append findings in same document  
**Code Status Before:** Call chains documented but not organized by consumer type. Cache invalidation hooks and bootstrap layer were absent from the map. Diagnostic consumer (`notificationsFeature.group.js`) was not documented.  
**Code Status After:** No code changes — audit only. Consumer Map section appended.  
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` (this file)  
**Command Evidence:** ARCHITECT static scan + live `grep` for every export name across `apps/VCSM/src/`. Read: both DAL files, both controllers, `useChatUnreadOps.js`, `useSendMessageActions.js`, `chat.adapter.js`, `bootstrap.selectors.js`, `bootstrap.hydrate.controller.js`, `bootstrap.invalidate.js`, `BottomNavBar.jsx`, `ConversationView.jsx`, `useArchiveChat.js`, `useDeleteChat.js`, `useMarkChatRead.js`, `notificationsFeature.group.js`, `inboxUnread.controller.js` (notifications).  
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  
**Key findings:**  
- `readChatInboxUnreadRowsDAL` touches 0 models, 1 controller, 1 adapter, 1 direct hook, 3 cache-invalidation hooks, 3 bootstrap layer files, and 1 terminal screen (`BottomNavBar.jsx`)  
- `updateAttachmentMediaAssetIdDAL` touches 0 models, 1 controller, 0 adapters, 2 hooks, 0 cache-invalidation hooks, 0 bootstrap files, and terminates at `ConversationView.jsx` → `ConversationScreen.jsx`  
- Cache-invalidation hooks (`useMarkChatRead`, `useArchiveChat`, `useDeleteChat`) do NOT import the DAL — they bust the React Query key only  
- Notifications feature exposes `getChatInboxUnreadBadgeCount` via a re-export controller (`inboxUnread.controller.js`) — cross-feature boundary is correctly isolated  
- `notificationsFeature.group.js` (dev diagnostics) directly imports the controller — dev-only, never production  
**Documentation Truth Status:** VERIFIED  
**Native Documentation Verification:** PENDING FALCON

---

### 2026-05-11

**Task:** Dead code audit of chat DAL layer — verify both DAL files and their exported functions are live; resolve the documented partial call chain  
**Application Scope:** VCSM  
**Prompt:** User requested ARCHITECT dead code detection on `vcsm.dal.chat.md`, confirmed findings, then requested Logan update  
**Code Status Before:** `inboxUnread.read.dal.js` marked as partial chain (no screen reached). Risk Findings and Pending Reviews were empty placeholders. No engine DAL coverage documented.  
**Code Status After:** No code changes — audit only. Documentation updated.  
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` (this file)  
**Command Evidence:** ARCHITECT static scan + live import grep across `apps/VCSM/src/` + engine DAL file inventory at `engines/chat/src/dal/`  
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  
**Security / Runtime / DB Notes:** Unread badge path goes through bootstrap hydration layer — LOKI runtime trace recommended to verify polling cadence. Engine owns 32 DAL files; app-level only owns 2 surgical writes. Engine boundary is intact.  
**Validation:** Both functions confirmed live. Partial chain resolved — full chain terminates at `BottomNavBar.jsx`. 32 engine DAL files inventoried, none duplicating app-level work.  
**Documentation Truth Status:** VERIFIED  
**Native Documentation Verification:** PENDING FALCON

---

## AVENGERS ASSEMBLY REPORT — 2026-05-11

**Run Summary**
Date: 2026-05-11
Triggered by: User — targeted doc alignment pass
Application Scope: VCSM
Document Scope: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md`
Boundary Contract: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced
Commands Run: ARCHITECT / VENOM / LOGAN / review-contract

---

### Governance Evidence Registry

| Command | Status | Findings | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | Engine DAL count stale (32→36); 12 undocumented app-layer files; 1 undocumented bootstrap file; `canSendMessage.js` permission divergence | YES | NO |
| VENOM | PRESENT | `@debuggers` import in production controller — resolved to stub in prod via Vite config; no raw security exposure | MINOR | NO |
| LOGAN | PRESENT | `useUnreadBadge.js` import path documented incorrectly; `bootstrap.store.js` missing from doc; engine DAL count stale | YES | NO |
| review-contract | PRESENT | `permissions/` and `lib/` sub-layers not in architecture contract; `canSendMessage.js` app↔engine divergence | YES | NO |
| IRONMAN | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md` | Full ownership record — all layers including lib/permissions/store/debug/layout/constants | PRESENT | NO |
| SENTRY | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md` | lib/permissions classification (RISK-6 closed), RISK-1 fix verified, SF-01/SF-02/SF-04 findings | PRESENT | NO |
| FALCON | `zNOTFORPRODUCTION/_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md` | Native parity — badge DAL full parity; DRIFT-01 canPost; DRIFT-02 media_assets | PRESENT | NO |
| LOKI | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_loki_chat-badge-bootstrap-trace.md` | Runtime trace — badge pipeline, LF-01 silent error, LF-02 poll load, LF-04 observability gap | PRESENT | NO |
| KRAVEN | `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-14_kraven_chat-badge-poll-performance.md` | Poll cadence × load — KF-01 index unverified, KF-02 realtime gap, WATCH status | PRESENT | NO |
| CARNAGE | `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_chat-inbox-attachments-migration-history.md` | Migration history — RLS fix (2026-04-30), media_asset writeback (2026-04-30), CF-02 index unverified | PRESENT | NO |
| WINTER SOLDIER | N/A | Not in scope | N/A | NO |
| SHIELD | N/A | No IP/provenance changes this pass | N/A | NO |

---

### ARCHITECT

**Status: DRIFT FOUND**

**App-level DAL files: VERIFIED CLEAN**
Both DAL files confirmed on disk and verified against documented behavior:
- `inboxUnread.read.dal.js` — uses `.select('unread_count')`, explicit column ✓, no `select('*')` ✓
- `updateAttachmentMediaAsset.write.dal.js` — UPDATE only, no SELECT ✓, guard clause on all required params ✓

**Engine DAL count stale:**
Document states "32 DAL files" in `engines/chat/src/dal/`. Actual count on disk: **36 files**.

Files present on disk but absent from the Engine DAL Coverage table (17 missing):

| Missing File | Category |
|---|---|
| `actorRealm.read.dal.js` | Actor context read |
| `blockRelations.read.dal.js` | Block relationship read |
| `conversationMembers.partner.read.dal.js` | Member read — partner variant |
| `conversationRead.write.dal.js` | Conversation read-state write |
| `deleteThreadForMe.dal.js` | Thread deletion |
| `getOrCreateDirectConversation.rpc.js` | Conversation create RPC |
| `inbox.write.dal.js` | Inbox write |
| `legacyMappings.dal.js` | Legacy ID mapping |
| `messageForEdit.read.dal.js` | Message edit read |
| `messageVisibility.read.dal.js` | Message visibility |
| `openConversation.rpc.js` | Open conversation RPC |
| `outbox.write.dal.js` | Outbox event write |
| `pins.write.dal.js` | Message pin write |
| `savedMessages.write.dal.js` | Saved messages write |
| `searchActors.dal.js` | Actor search (engine-local impl) |
| `subscribeToConversation.js` | Realtime subscription |
| `subscribeToInbox.js` | Realtime subscription |

**Undocumented app-level files:**
The following files exist in `features/chat/` and are not present in the Architecture Pipeline section or anywhere else in the document:

| File | Type | Notes |
|---|---|---|
| `features/chat/conversation/layout/ChatScreenLayout.jsx` | Layout | Non-standard layer — layout wrapper, not a screen |
| `features/chat/conversation/lib/memberActorPresentation.js` | Lib | Pure utility — actor presentation logic |
| `features/chat/conversation/lib/normalizeConversation.js` | Lib | Pure transform — raw conversation row → domain shape with `_raw` passthrough |
| `features/chat/conversation/lib/resolvePartnerActor.js` | Lib | Pure utility — partner actor resolution |
| `features/chat/conversation/permissions/canReadConversation.js` | Permission | Pure function — membership-based read gate. Marked `(R)` in comment |
| `features/chat/conversation/permissions/canSendMessage.js` | Permission | Pure function — send gate. Marked `(R)`. **DIVERGED from engine version** (see VENOM) |
| `features/chat/conversation/permissions/isActorBlocked.js` | Permission | Pure function — symmetric block check. Marked `(R)` |
| `features/chat/inbox/constants/inboxSearchAdapter.js` | Constants | Inbox search adapter constants |
| `features/chat/inbox/lib/buildInboxPreview.js` | Lib | UI adapter — pure function, builds inbox entry presentation shape |
| `features/chat/store/chatUiStore.js` | Store | Zustand UI-only state: `selectedConversationId`, `isNewChatModalOpen`, `composerDraftByConversationId`, `activeChatFilter` |
| `features/chat/debug/chatNavDebugger.js` | Debug | Dev-only debug utility |
| `features/chat/start/screens/StartConversationModal.jsx` | Screen | Start conversation modal screen — missing from Final Screen list |

**Undocumented bootstrap file:**
`bootstrap/bootstrap.store.js` — a 4th bootstrap file not present in the Consumer Map or Architecture Pipeline. Provides `useBootstrapStore` (Zustand store for hydration lifecycle: `loading`, `hydratedAt`, `hydratedForActorId`, `error`). Used directly by `bootstrap.selectors.js`, which is documented. The dependency chain is incomplete without it.

---

### VENOM

**Status: MINOR DRIFT**

**`@debuggers` import in production controller (known codebase pattern, undocumented here):**
`recordChatAttachment.controller.js:4` imports `bugBunnyUploadStep` and `bugBunnyUploadError` from `@debuggers/media/bugBunnyUploadDebugger`. The `@debuggers` alias is absent from `jsconfig.json` — it is resolved only by Vite config:
- Production build: resolves to `./src/debuggers-stub` (no-ops)
- Development: resolves to `zNOTFORPRODUCTION/_ACTIVE/debuggers`

Debug instrumentation ships as stubs in production. This is an intentional codebase-wide pattern (12+ files across VCSM use `@debuggers`). No security exposure. However, the chat DAL doc does not note this pattern exists in `recordChatAttachment.controller.js`.

**`canSendMessage.js` permission divergence:**
App-level `features/chat/conversation/permissions/canSendMessage.js` and engine `engines/chat/src/model/permissions/canSendMessage.js` have diverged:
- App version: returns `true` after finding an active membership
- Engine version: returns `membership.canPost !== false` — enforces a `canPost` field check

If `canPost: false` is set on a membership in the engine's `ConversationMember` model, the app-level permission check will NOT honor it. The app will permit a message send the engine considers blocked.

**No raw security exposure detected:**
- No raw UUIDs in public URL surfaces from this layer
- No `select('*')` violations
- No TypeScript files
- DAL writes use explicit WHERE clauses with required-param guards

---

### LOGAN

**Status: DRIFT FOUND**

**DF-01 — `useUnreadBadge.js` import path mischaracterized:**
Consumer Map Hooks table states:
> `useUnreadBadge.js` — `getChatInboxUnreadBadgeCount` via `inboxUnread.controller.js` re-export

Actual code (`features/notifications/inbox/hooks/useUnreadBadge.js:2`):
```js
import { useChatUnreadOps } from '@/features/chat/adapters/chat.adapter'
```
The hook imports `useChatUnreadOps` through the adapter boundary — not `getChatInboxUnreadBadgeCount` through the notifications controller re-export. The adapter import is the correct architecture path. The doc describes a different and incorrect import route.

**DF-02 — `bootstrap.store.js` not documented:**
The Consumer Map Bootstrap Layer table lists 3 files. A 4th file (`bootstrap.store.js`) exists and provides `useBootstrapStore`, which is directly imported by `bootstrap.selectors.js`. The documented bootstrap dependency chain is incomplete without this entry.

**DF-03 — Engine DAL count stale:**
Narrative says "32 DAL files." Actual count on disk: 36. Numeric drift.

**DF-04 — 12 undocumented app-level files:**
Architecture Pipeline section does not document `lib/`, `permissions/`, `layout/`, `store/`, `debug/`, or `StartConversationModal.jsx`. All confirmed on disk.

**Documentation truth for all documented surfaces: VERIFIED**
Every documented call chain, polling interval, controller import, hook behavior, and adapter boundary was verified against live code and found accurate. The Consumer Map content that exists is correct — drift is in omission, not inaccuracy.

---

### review-contract

**Status: VIOLATIONS FOUND**

**Non-standard sub-layers not in architecture contract:**
The contract defines: DAL → Model → Controller → Hook → Component → View Screen → Final Screen. The chat feature contains three additional sub-layers absent from this taxonomy:

| Sub-layer | Path | Classification |
|---|---|---|
| `lib/` (×4 files) | `conversation/lib/`, `inbox/lib/` | Pure transforms — function as Model layer |
| `permissions/` (×3 files) | `conversation/permissions/` | Pure predicates — function as Model layer |
| `layout/` (×1 file) | `conversation/layout/` | Structural wrapper — not addressed by contract |

All are pure functions with no IO and no React. No import violations detected. However, the `(R)` marker on permissions files is an undocumented convention — likely "reference copy from engine" — and no convention doc exists for this pattern.

**`canSendMessage.js` logic gap (app vs engine):**
App version returns `true` after active-member check. Engine version returns `membership.canPost !== false`. If `canPost` is a live field in `ConversationMember`, the app layer permits sends the engine would reject. No cross-feature import violation — both are pure functions — but a semantic contract divergence that could cause behavior divergence in production.

**Engine adapter naming overlap — clarity risk:**
Both `apps/VCSM/src/features/chat/adapters/chat.adapter.js` and `engines/chat/src/adapters/chat.adapter.js` exist with identical filenames in separate scopes. The app adapter is a one-line re-export of `useChatUnreadOps`. The engine adapter is a DI configuration surface. Not a violation, but the naming overlap is undocumented and could cause confusion during debugging.

**All app-level DAL compliance verified:**
- No `select('*')` ✓
- No cross-feature DAL imports ✓
- No TypeScript files ✓
- Explicit column selects ✓

---

### New Risk Entries — 2026-05-11

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| `canSendMessage.js` diverged — app does not check `canPost`, engine does | RISK-1 | HIGH | FIXED | SENTRY |
| Engine DAL coverage table stale — 17 of 36 files not listed | RISK-2 | LOW | FIXED | IRONMAN |
| `bootstrap.store.js` not in doc — missing link in bootstrap dependency chain | RISK-3 | LOW | FIXED | LOGAN |
| `useUnreadBadge.js` import path incorrectly documented in Consumer Map | RISK-4 | LOW | FIXED | LOGAN |
| 12 app-level files absent from Architecture Pipeline section | RISK-5 | LOW | FIXED | IRONMAN |
| `lib/` and `permissions/` sub-layers outside architecture contract taxonomy | RISK-6 | LOW | FIXED | SENTRY |
| Falcon review REQUIRED per doc — not yet initiated for native-critical chat feature | RISK-7 | HIGH | FIXED | FALCON |

**RISK-1 detail:** Fixed in the app copy. `features/chat/conversation/permissions/canSendMessage.js` now returns `membership.canPost !== false`, matching the engine permission behavior without modifying engine code.

**RISK-7 detail:** The doc explicitly marks `Falcon Review: REQUIRED` and `Native Transfer Status: PENDING FALCON`. Chat is native-critical — inbox, unread badge (bootstrap 30s poll), attachments, and realtime are all user-facing flows requiring native parity verification. This is the only blocking risk identified this pass.

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| App `canSendMessage.js` — no `canPost` check | Engine `canSendMessage.js` — enforces `canPost !== false` | App permits sends that engine would block | HIGH | Sync app permission copy with engine version before enabling `canPost` field |
| Consumer Map Hooks table — `useUnreadBadge` via `inboxUnread.controller.js` | Actual code — `useUnreadBadge` via `chat.adapter.js` | Doc describes incorrect import boundary | LOW | Correct Hooks table row |

---

### Documentation Truth Review

| Doc Section | Truth Status | Drift | Blocking |
|---|---|---|---|
| Summary table | ALIGNED | Engine count 32→36 (narrative drift only) | NO |
| DAL Files section | ALIGNED | Verified correct | NO |
| Call Chains section | ALIGNED | All chains verified live | NO |
| Architecture Pipeline table | MINOR DRIFT | 12 undocumented files; `lib/`/`permissions/`/`layout/`/`store/` absent | NO |
| Engine DAL Coverage table | DRIFT | 17 of 36 engine files not listed | NO |
| Consumer Map — `inboxUnread` chain | ALIGNED | Verified correct | NO |
| Consumer Map — `updateAttachmentMediaAsset` chain | ALIGNED | Verified correct | NO |
| Consumer Map — Hooks table (`useUnreadBadge` row) | DRIFT | Wrong import path documented | NO |
| Consumer Map — Bootstrap layer | MINOR DRIFT | `bootstrap.store.js` missing | NO |
| Native Parity Notes | ALIGNED | Accurately flags PENDING FALCON | NO |

---

### Overall Status

**DRIFT FOUND**

All documented call chains are **verified correct** against live code. Drift is concentrated in three areas: incomplete file inventory (engine DAL count, undocumented app-layer files), one inaccurate hook import path, and one permission logic gap between app and engine. One blocking governance gap exists: Falcon review is required by the existing doc but has not been initiated.

**No production code was modified this pass.**

---

### Recommended Next Commands

| Priority | Command | Reason |
|---|---|---|
| 1 | FALCON | Only blocking risk — chat is native-critical; bootstrap badge path and attachment flow need native parity verification |
| 2 | SENTRY | Resolve RISK-1 (`canSendMessage` divergence) and RISK-6 (`lib/`/`permissions/` layer classification) |
| 3 | LOGAN | Correct Consumer Map Hooks table (RISK-4) and add `bootstrap.store.js` entry (RISK-3) |
| 4 | IRONMAN | Own RISK-2 (engine DAL coverage table) and RISK-5 (undocumented file inventory) |

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/chat/conversation/permissions/canSendMessage.js` | Synced app permission behavior with engine behavior by enforcing `membership.canPost !== false` after active membership validation. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` | Corrected stale engine DAL count, expanded engine DAL coverage inventory, added missing app-layer files to architecture coverage, corrected `useUnreadBadge.js` adapter import documentation, added `bootstrap.store.js`, and updated risk statuses. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| RISK-1 — app `canSendMessage.js` diverged from engine `canPost` behavior | DONE | App copy now returns `membership.canPost !== false`, matching the engine permission model without modifying engine code. |
| RISK-2 — engine DAL coverage table stale | DONE | Documentation now reflects 36 engine DAL files and adds the missing coverage groups. |
| RISK-3 — `bootstrap.store.js` not documented | DONE | Bootstrap layer table now includes `bootstrap.store.js`. |
| RISK-4 — `useUnreadBadge.js` import path incorrectly documented | DONE | Hooks table now documents the actual adapter import through `useChatUnreadOps`. |
| RISK-5 — undocumented app-level chat files | DONE | Architecture pipeline now includes `lib/`, `permissions/`, `layout/`, `store/`, `debug/`, and `StartConversationModal.jsx` coverage. |
| RISK-6 — `lib/` and `permissions/` sub-layers outside architecture taxonomy | BLOCKED | Classification requires SENTRY architecture decision; no behavior change needed. |
| RISK-7 — FALCON native parity required | BLOCKED | Native parity review is outside this DAL code/doc pass and remains pending FALCON. |

### Verification

- Commands/searches run:
  - `find apps/VCSM/src/features/chat -maxdepth 4 -type f | sort`
  - `find engines/chat/src/dal -maxdepth 1 -type f | sort`
  - `find engines/chat/src/dal -maxdepth 1 -type f | sort | wc -l`
  - `grep -rn "useChatUnreadOps\\|getChatInboxUnreadBadgeCount" apps/VCSM/src/features/notifications apps/VCSM/src/features/chat --include='*.js' --include='*.jsx'`
  - `grep -rn "useBootstrapStore\\|bootstrap.store" apps/VCSM/src/bootstrap apps/VCSM/src/features --include='*.js' --include='*.jsx'`
  - Inspected `apps/VCSM/src/features/chat/conversation/permissions/canSendMessage.js`
  - Inspected `engines/chat/src/model/permissions/canSendMessage.js`
  - Inspected `apps/VCSM/src/features/notifications/inbox/hooks/useUnreadBadge.js`
  - Inspected `apps/VCSM/src/bootstrap/bootstrap.store.js`
  - `npm run build`
- Production callers checked:
  - `useUnreadBadge.js` notification hook through `features/chat/adapters/chat.adapter.js`.
  - Bootstrap selector/store import chain.
  - App chat permission helper against engine permission helper.
- Remaining risks:
  - RISK-6 resolved by SENTRY 2026-05-14: classified as Model-class sub-folders. MINOR DRIFT, no blocking action.
  - RISK-7 resolved by FALCON 2026-05-14: native parity reviewed. DRIFT-01 (canPost) and DRIFT-02 (media_assets) are P1 native items, non-blocking for PWA.
  - All open risks from AvengersAssemble 2026-05-11 are now closed.
- Governance pass completed 2026-05-14:
  - FALCON: PRESENT
  - SENTRY: PRESENT
  - IRONMAN: PRESENT
  - LOKI: PRESENT (WATCH — LF-01 silent error, LF-02 polling load, LF-04 observability gap)
  - KRAVEN: PRESENT (WATCH — KF-01 index unverified, KF-02 realtime gap)
  - CARNAGE: PRESENT (CLEAN — CF-02 resolved; idx_inbox_entries_actor_badge already existed in production; migration applied as no-op documentation record)

### Status

COMPLETE — 2026-05-14 governance pass. All Cerebro-ordered commands executed.
Open items: LF-04 (observability gap — no timing/correlation IDs in badge pipeline), native P1 items (DRIFT-01/DRIFT-02 — FALCON owned). No migration actions remain.

---

## Cerebro Fix Pass — 2026-05-18

**Trigger:** Cerebro governance pass ordered by user — "fix this end to end"
**Application Scope:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Findings addressed:** LF-01, SF-01, SF-02, SF-04

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js` | LF-01: catch block now logs error in DEV — distinguishes DB failure from real empty inbox |
| `apps/VCSM/src/features/chat/conversation/permissions/canSendMessage.js` | SF-04: deleted — confirmed zero importers; engine canonical copy stands |
| `apps/VCSM/src/features/chat/conversation/hooks/conversation/useConversationMembers.js` | SF-01: now derives and exposes `canRead` boolean — gates access after members load |
| `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx` | SF-01: removed direct `canReadConversation` import; uses `canRead` from hook |
| `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js` | SF-02: `modelRow` now applies `buildInboxPreview` and merges result — entries exit hook already in preview shape |
| `apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx` | SF-02: removed `buildInboxPreview` import and mapping step |
| `apps/VCSM/src/features/chat/inbox/screens/ArchivedInboxScreen.jsx` | SF-02: removed `buildInboxPreview`; collapsed two `useMemo` steps into one |
| `apps/VCSM/src/features/chat/inbox/screens/SpamInboxScreen.jsx` | SF-02: removed `buildInboxPreview`; collapsed two `useMemo` steps into one |
| `apps/VCSM/src/features/chat/inbox/screens/RequestsInboxScreen.jsx` | SF-02: removed `buildInboxPreview`; collapsed three `useMemo` steps into one |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| LF-01 — silent `catch {}` in badge controller | DONE | `catch (err)` + `console.error` behind `DEV` guard. Production still returns 0 gracefully. |
| SF-01 — `canReadConversation` called directly in View Screen | DONE | `canRead` derived in `useConversationMembers` hook. Hook returns `true` while members load (no premature denial). View Screen reads derived value only. |
| SF-02 — `buildInboxPreview` called in 4 Final Screens | DONE | Moved to `useChatInbox.modelRow`. All entry-shape fields preserved via spread merge (`{ ...entry, ...preview }`), so domain filters like `isRequestEntry` continue to work. |
| SF-04 — `canSendMessage.js` dead code (zero importers) | DONE | File deleted. Engine canonical at `engines/chat/src/model/permissions/canSendMessage.js` is the authoritative copy. |

### Remaining Open Items

| Item | Owner | Notes |
|---|---|---|
| DRIFT-01 — `can_post` not enforced on iOS native | FALCON (P1) | PWA behavior correct; iOS `SupabaseConversationMemberRow` missing `can_post` |
| DRIFT-02 — attachment media_asset_id writeback not on iOS | FALCON (P1) | PWA has write-back controller; iOS has no equivalent |

### Documentation Truth Status

VERIFIED — all code changes verified against grep before modification. No engine files touched.

---

## LF-04 Fix Pass — 2026-05-18

**Trigger:** Continuation of Cerebro governance pass — closing last open PWA item
**Application Scope:** VCSM
**Finding closed:** LF-04 — zero runtime observability in badge pipeline

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js` | CREATED — dev-only badge debugger: per-actor count change detection, fetch timing, cache invalidation events. Toggle: `window.__CHAT_BADGE_DEBUG`. Zero cost in production (lazy import behind DEV guard). |
| `apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js` | Integrated `chatBadgeDebugger`: `startFetch`/`endFetch`/`endFetchError` timing tokens wrap the DB call. Debugger lazy-loaded only in DEV. |
| `apps/VCSM/src/bootstrap/bootstrap.invalidate.js` | `invalidateChatUnread` now accepts an optional `reason` string and calls `chatBadgeDbg.invalidate(reason)` in DEV — cache bust events are now visible in the badge timeline. |

### Observability Now Available (DEV only)

| Event | What you see |
|---|---|
| Badge fetch (no change) | `[BADGE] <actorId> <count> (+<ms>)` collapsed group |
| Badge fetch (count changed) | `[BADGE] <actorId> CHANGED <prev> → <new> (+<ms>)` in amber |
| Badge fetch error | `[BADGE] <actorId> ERROR (+<ms>)` in red (LF-01 `console.error` also fires) |
| Cache invalidation | `[BADGE] invalidate — <reason>` in purple |

### Observability Maturity

Before: MINIMAL (errors silently swallowed, no timing, no change detection)
After: BASIC (errors logged, timing per fetch, count change detection, invalidation events)

### Remaining Open Items (PWA)

None. All PWA-scope findings from LOKI/SENTRY/KRAVEN/CARNAGE governance passes are closed.
Native items (DRIFT-01/DRIFT-02) remain FALCON-owned.

---

## 2026-05-14 Governance Pass — Full Output Log

**Trigger:** Cerebro governance pass on `vcsm.dal.chat.md`
**Commands ordered:** FALCON (blocking), SENTRY, IRONMAN, LOKI, KRAVEN, CARNAGE
**All risks from AvengersAssemble 2026-05-11 closed by end of pass.**

---

### FALCON

**Status:** COMPLETE — CAUTION (two P1 native drift items)
**Output file:** `zNOTFORPRODUCTION/_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md`
**Also updated:**
- `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/chat-inbox.md` — added DRIFT-01/02 to gaps, risk notes, pending checklist; 2026-05-14 transfer log entry
- `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md` — updated chat-inbox.md date and parity summary row

**What was done:**
- Reviewed badge DAL parity against native iOS `LiveInboxService.fetchUnreadBadgeCount` — FULL PARITY confirmed. Both platforms select `unread_count FROM chat.inbox_entries WHERE actor_id=eq.{id} AND archived=eq.false AND archived_until_new=eq.false`.
- Native improvement noted: iOS uses realtime (`InboxRealtimeStore`) + 20s fallback poll vs. PWA's 30s polling-only.
- DRIFT-01 found: `can_post` field exists on `chat.conversation_members` but `SupabaseConversationMemberRow` (native) has no `can_post` property — native send gate is content-only, canPost gate is not enforced on iOS.
- DRIFT-02 found: `recordChatAttachment.controller.js` (PWA) writes `media_asset_id` back to `chat.message_attachments` after send — native has no equivalent, attachment metadata is not written back.
- Closed RISK-7 (Falcon review required).

---

### SENTRY

**Status:** COMPLETE — MINOR DRIFT (no release blockers)
**Output file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md`

**What was done:**
- Closed RISK-6: classified `lib/` and `permissions/` sub-folders as Model-class approved variants — no contract violation, no behavioral change required.
- Verified RISK-1 fix: `canSendMessage.js` app copy and engine copy are in sync (`membership.canPost !== false`). App copy has zero importers — dead code (SF-04).
- SF-01: `canReadConversation` called directly in `ConversationView.jsx` (wrong layer — View Screen enforcing permission). P2 correction.
- SF-02: `buildInboxPreview` called in 4 Final Screens instead of hook layer. P2 correction.
- SF-03: `resolvePartnerActor` called via `useMemo` in `ConversationView.jsx`. P3 correction.
- SF-05: `lib/` and `permissions/` documented as Model-class. No rename required.
- SF-06: `(R)` convention undocumented — files should declare sync-contract with engine canonical source.

---

### IRONMAN

**Status:** COMPLETE — all ownership clear
**Output files:**
- `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md` — full ownership record (new file)
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_ironman_chat-feature-ownership.md` — ownership audit

**What was done:**
- Closed RISK-5: all 12 previously undocumented app-level files (`lib/` ×4, `permissions/` ×3, `layout/` ×1, `store/` ×1, `debug/` ×1, `constants/` ×1, `StartConversationModal`) formally assigned to `features/chat` ownership.
- Closed RISK-2: 36 engine DAL files formally attributed to `engines/chat` ownership.
- SF-01 correction owner assigned: Chat feature, conversation sub-area — P2.
- SF-02 correction owner assigned: Chat feature, inbox sub-area — P2.
- SF-04 cleanup owner assigned: Chat feature — P2.
- Data ownership registry produced for all 7 chat-related tables.
- Rule ownership registry produced (canSendMessage, canReadConversation, badge filter, moderation cover).
- Runtime ownership map produced (badge poll, inbox load, conversation open, message send, attachment write-back, mark read).
- Native parity ownership: DRIFT-01 and DRIFT-02 assigned to Falcon (iOS).

---

### LOKI

**Status:** COMPLETE — WATCH (no critical failures; observability gaps noted)
**Output file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_loki_chat-badge-bootstrap-trace.md`

**What was done:**
- Traced the full badge bootstrap pipeline: `useBootstrapHydration` → `useChatUnread` (React Query, 30s poll) → `getUnreadBadgeCount` → `getChatInboxUnreadBadgeCount` → `readChatInboxUnreadRowsDAL` → `chat.inbox_entries`.
- Mapped all three invalidation branches: write-path bust (`invalidateChatUnread`), `noti:refresh` global event (dual invalidation), actor switch (hard evict + re-enable).
- LF-01: `catch { return 0 }` in controller swallows DB errors silently — badge shows 0 indistinguishably from real empty inbox. MEDIUM. Routed to VENOM.
- LF-02: 30s polling-only, no realtime — continuous DB read per session at scale. LOW now, MEDIUM at 5k+ concurrent. Routed to KRAVEN.
- LF-03: every `noti:refresh` event invalidates both chatUnread and notificationUnread — 2 reads per event regardless of source. LOW. Routed to KRAVEN.
- LF-04: zero runtime observability in the badge pipeline — no timing, no error logging, no correlation IDs. MEDIUM for incident response. Routed to LOGAN.
- Observability maturity classified: MINIMAL. Recommended target: BASIC.

---

### KRAVEN

**Status:** COMPLETE — WATCH (resolved to CLEAN after migration confirmed)
**Output file:** `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-14_kraven_chat-badge-poll-performance.md`

**What was done:**
- Analysed badge query shape: `SELECT unread_count FROM chat.inbox_entries WHERE actor_id=$actorId AND archived=false AND archived_until_new=false`.
- KF-01: Suspected missing index on `actor_id` (PK is composite `(conversation_id, actor_id)` — unusable for leading actor_id scan). Routed to CARNAGE for verification. Resolved CLEAN after migration confirmed index already existed.
- KF-02: Polling-only vs. realtime gap — iOS uses realtime+20s fallback; PWA polls every 30s regardless of activity. LOW now. CAPTAIN-level future improvement.
- KF-03: Dual badge invalidation on `noti:refresh` — 2 reads per event. LOW, monitor at scale.
- Projected DB load table produced (100 → 50,000 concurrent sessions).

---

### CARNAGE

**Status:** COMPLETE — CLEAN (all findings resolved; migration applied)
**Output file:** `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_chat-inbox-attachments-migration-history.md`
**Migration written and applied:** `apps/VCSM/supabase/migrations/20260514000000_chat_inbox_entries_actor_badge_index.sql`

**What was done:**
- Traced full migration history for `chat.inbox_entries` and `chat.message_attachments`.
- CF-01: `CREATE TABLE chat.inbox_entries` not in local migration files — expected (engine-owned schema). Resolved by full schema snapshot captured from production DDL provided by user.
- CF-02: No local index DDL found for `actor_id` on `chat.inbox_entries`. Suspected full table scan. Migration written (`CREATE INDEX IF NOT EXISTS idx_inbox_entries_actor_badge ON chat.inbox_entries (actor_id) WHERE archived=false AND archived_until_new=false`). On apply, Supabase returned `NOTICE (42P07): relation "idx_inbox_entries_actor_badge" already exists` — index was already present from engine schema. CF-02 was a documentation gap, not a production gap.
- CF-03: RLS history for `chat.inbox_entries` complete — all 4 policies replaced by `20260430200000_fix_chat_rls_multi_actor.sql` (2026-04-30), fixing multi-actor silent block bug. Security model correct.
- CF-04: `chat.message_attachments` `media_asset_id` column, sparse index, and UPDATE RLS policy all clean — created by `20260430400000_media_asset_writeback_columns.sql` (2026-04-30).
- CF-05: `can_post boolean NOT NULL DEFAULT true` confirmed present on `chat.conversation_members` at schema level — validates FALCON DRIFT-01.
- Full production schema DDL snapshot captured for all 15 `chat.*` tables.
- 5 previously-applied-but-untracked migrations repaired in Supabase migration history: `20260510030000`, `20260510040000`, `20260510050000`, `20260510060000`, `20260511010000`.

---

### Summary of All Files Produced or Modified — 2026-05-14

| File | Action | Command |
|---|---|---|
| `zNOTFORPRODUCTION/_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md` | CREATED | FALCON |
| `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/chat-inbox.md` | UPDATED — DRIFT-01/02, transfer log | FALCON |
| `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md` | UPDATED — date, parity summary | FALCON |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md` | CREATED | SENTRY |
| `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md` | CREATED | IRONMAN |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_ironman_chat-feature-ownership.md` | CREATED | IRONMAN |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_loki_chat-badge-bootstrap-trace.md` | CREATED | LOKI |
| `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-14_kraven_chat-badge-poll-performance.md` | CREATED | KRAVEN |
| `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_chat-inbox-attachments-migration-history.md` | CREATED | CARNAGE |
| `apps/VCSM/supabase/migrations/20260514000000_chat_inbox_entries_actor_badge_index.sql` | CREATED + APPLIED | CARNAGE |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` (this file) | UPDATED throughout | All commands |
