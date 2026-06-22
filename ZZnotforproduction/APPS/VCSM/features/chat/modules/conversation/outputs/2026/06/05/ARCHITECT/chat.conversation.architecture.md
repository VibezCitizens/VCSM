# MODULE ARCHITECTURE REPORT

**Module:** chat/conversation
**Application Scope:** VCSM — apps/VCSM/src/features/chat/conversation/
**Module Type:** VCSM App Feature — Conversation Thread, Composer, Presence, Attachments
**Coverage Note:** Covers all 4 sprint items: chat/composer, chat/thread, chat/presence, chat/attachments
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The chat/conversation module owns the single-conversation view experience in VCSM. It orchestrates:
1. **Thread** — conversation metadata, member list, and message timeline
2. **Composer** — text input and image attachment send
3. **Presence** — typing indicator (Supabase Realtime channel)
4. **Attachments** — image upload, media_assets record, message_attachments writeback

The module delegates all DB operations to the `@chat` and `@media` engines via thin wrapper hooks. VCSM-specific additions are layered on top: React Query warm-cache, inbox seed, block status gating, and media_assets recording.

---

## SCREEN COMPOSITION

**Entry points:**
- `/chat/:conversationId` → `ConversationScreen.jsx` (routing guard only)
- `ConversationScreen` → `ConversationView.jsx` (full orchestration)

**ConversationView.jsx orchestrates (15+ hooks):**

```
useConversation          → @chat engine (openConversation, realtime subscription)
useConversationMembers   → @chat engine (member list, canRead guard)
useConversationMessages  → @chat engine + React Query warm-cache layer
useTypingChannel         → @chat engine (Supabase Realtime typing channel)
useSendMessageActions    → VCSM composer (handleSend + handleAttach)
useConversationScroll    → VCSM scroll state (jump-to-bottom)
useMarkChatRead          → inbox hook (mark on mount)
useInboxActions          → inbox hook (archive, spam, report)
useInboxEntryForConversation → inbox hook (folder, archived flag)
useBlockStatus           → block adapter (bidirectional check)
useMessageActionsMenu    → VCSM message menu (copy, edit, delete, unsend, report)
useConversationActionsMenu → VCSM conv menu (archive, spam, report)
useMediaViewer           → VCSM image/video overlay
useConversationCover     → moderation adapter (spam cover)
useReportFlow            → moderation adapter
```

---

## SUB-MODULE MAP

### 1. Thread (conversation timeline)

**Files:**
- `screen/ConversationScreen.jsx` — routing + guard (useParams, Navigate)
- `screen/ConversationView.jsx` — full orchestration
- `hooks/conversation/useConversation.js` — MIGRATED: delegates to `@chat`
- `hooks/conversation/useConversationMessages.js` — MIGRATED + warm-cache layer
- `hooks/conversation/useConversationMembers.js` — delegates to `@chat`
- `hooks/conversation/useConversationScroll.js` — scroll state, jump-to-bottom
- `hooks/conversation/useMessageActionsMenu.js` — message actions (edit, delete, report)
- `hooks/conversation/useConversationActionsMenu.js` — conversation actions (archive, spam)
- `hooks/conversation/useMediaViewer.js` — media overlay state
- `components/ChatHeader.jsx` — header: partner name, back, conv actions
- `components/MessageList.jsx` — virtualized message list
- `components/MessageBubble.jsx` — single message bubble
- `components/MessageGroup.jsx` — grouped messages by actor
- `components/MessageMedia.jsx` — image/video in message
- `components/MessageActionsMenu.jsx` — press-hold menu
- `components/ConversationActionsMenu.jsx` — header menu
- `layout/ChatScreenLayout.jsx` — header + scroll area + input layout
- `lib/normalizeConversation.js` — conversation row → domain shape
- `lib/resolvePartnerActor.js` — resolve non-self member in direct chat
- `lib/memberActorPresentation.js` — member display fields
- `permissions/canReadConversation.js` — local read guard
- `permissions/isActorBlocked.js` — local block check helper

**React Query warm-cache layer (useConversationMessages):**
```
On mount:  queryClient.getQueryData(queryKeys.chatMessages(conversationId)) → seed messages[]
On load:   queryClient.setQueryData(...) → write engine messages to cache
TTL:       staleTime 90s (set by useChatMessagePrefetch in InboxScreen)
GC:        gcTime ~5min (React Query default)
Effective: while engine loading + cache exists → show cache; once engine delivers → use engine
Loading:   true only when engine.loading AND cached.length === 0 AND engine.messages.length === 0
```

**Inbox seed (optimistic shell):**
```
InboxScreen passes navigate(conversationPath, { state: { inboxPreview: {...} } })
ConversationView reads location.state.inboxPreview
Provides: conversationId, conversationKind, partnerDisplayName, partnerActorId, partnerPhotoUrl
Used to render shell immediately before server hooks resolve
Reconciles with server truth once useConversation + useConversationMembers complete
```

**Block check gating:**
```
useBlockStatus(actorId, partnerActorId) → { isBlocked, blockedMe, loading }
Composer hidden when: partnerIsBlocked OR partnerBlockedMe
Composer hidden during pending: isDirectChat AND (no partnerActorId yet OR blockStatusLoading)
Group chats: never gated (isDirectChat = false)
```

---

### 2. Composer

**Files:**
- `components/ChatInput.jsx` — text field + send + attach button
- `hooks/conversation/useSendMessageActions.js` — handleSend + handleAttach

**Text send pipeline:**
```
ChatInput.onSend(text) → useSendMessageActions.handleSend(text)
  → onSendMessage({ body: text, type: 'text' })
  → @chat engine sendMessage controller (send_message_atomic RPC)
```

**Image attach pipeline:**
```
ChatInput.onAttach(files) → useSendMessageActions.handleAttach(files)
  1. Validate: images only (client-side MIME check before upload; engine also validates)
  2. addOptimistic({ kind: 'image', __uploading: true }) → placeholder message
  3. uploadAttachment(file, { extraPath: conversationId }) → @media engine → R2
  4. updateOptimistic(placeholderClientId, { mediaUrl, __uploading: false }) → show image
  5. onSendMessage({ type: 'image', attachments: [...], prebuiltClientId })
     → @chat engine sendMessage controller (send_message_atomic RPC)
  6. recordChatAttachmentController(...).catch() → FIRE-AND-FORGET (ANOM-CHAT-APP-003)
```

**Edit mode:**
```
ConversationView passes editing prop to ChatInput
ChatInput renders in edit mode with initialValue and onSaveEdit / onCancelEdit
handleSaveEdit → onEditMessage → @chat engine
```

---

### 3. Presence (typing indicator)

**Files:**
- `hooks/realtime/useTypingChannel.js` — pure pass-through wrapper

**Architecture:**
```
useTypingChannel({ conversationId, actorId, actorPresentation, timeoutMs })
  → useEngineTyping(@chat) — Supabase Realtime channel ('typing:{conversationId}')
  → returns { typingActors, notifyTyping }
```

This is the most minimal sub-module in the sprint — the app wrapper exists only to maintain a stable local import path. All logic lives in the `@chat` engine.

notifyTyping is called by ChatInput's `onTyping` prop (passed from ConversationView).

---

### 4. Attachments

**Files:**
- `hooks/conversation/useChatAttachmentUpload.js` — @media wrapper
- `controller/recordChatAttachment.controller.js` — media_assets record + writeback
- `dal/updateAttachmentMediaAsset.write.dal.js` — chat.message_attachments UPDATE

**Attachment write pipeline (3-stage):**
```
Stage 1 — Upload (blocking, user-facing):
  useChatAttachmentUpload → useMediaUpload(@media, scope='chat_attachment')
  → validates (MIME, size) → compresses (maxDim 1600, q0.82) → R2 upload
  → returns { publicUrl, storageKey, mimeType, sizeBytes }

Stage 2 — Chat send (blocking, user-facing):
  onSendMessage({ type:'image', attachments:[...] })
  → @chat engine send_message_atomic RPC (6-op atomic: message + attachment row + ...)
  → chat.message_attachments row created (media_asset_id = NULL at this point)

Stage 3 — Platform record writeback (FIRE-AND-FORGET):
  recordChatAttachmentController({ mediaUploadResult, ownerActorId, messageId, storageKey })
  → resolveVcsmAppId() → createMediaAssetController()
     → platform.media_assets INSERT (ownerActorId, scope='chat_attachment', scopeId=messageId)
  → updateAttachmentMediaAssetIdDAL({ messageId, storageKey, mediaAssetId })
     → chat.message_attachments UPDATE SET media_asset_id = mediaAssetId
        WHERE message_id = messageId AND storage_path = storageKey
```

**Fire-and-forget risk (ANOM-CHAT-APP-003):**
Stage 3 is called with `.catch()` in useSendMessageActions — failures are non-fatal and swallowed in production. If Stage 3 fails:
- Message is already sent (Stage 2 complete)
- Media is on CDN (Stage 1 complete)
- platform.media_assets has no record for this upload
- chat.message_attachments.media_asset_id remains NULL

This is intentional UX design (send should succeed even if asset registration fails) but creates a data integrity gap for media governance and analytics.

---

## DB WRITE SURFACE

| Operation | Schema | Table | Function | Notes |
|-----------|--------|-------|----------|-------|
| UPDATE | chat | message_attachments | updateAttachmentMediaAssetIdDAL | Filter: message_id + storage_path |

All other chat DB writes go through `@chat` engine (send_message_atomic RPC, archive, etc.).
All media writes go through `@media` engine (R2 upload) and `platform.media_assets` (via createMediaAssetController).

---

## ENGINE DEPENDENCIES

| Engine | Usage |
|--------|-------|
| @chat | useConversation, useConversationMessages, useConversationMembers, useTypingChannel (pass-through), sendMessage, editMessage, deleteMessage |
| @media | useChatAttachmentUpload (useMediaUpload wrapper), uploadMediaController |
| @hydration | actor summaries for members (via @chat engine DI) |
| @identity | useIdentity for actorId |

---

## ARCHITECTURE ANOMALIES

### ANOM-CHAT-APP-001: console.log in useConversationMessages

**Location:** `hooks/conversation/useConversationMessages.js`
**Finding:** Two `console.log` calls DEV-gated behind `if (!DEV) return`. Log entries: `[chat:messages:cache:rendered]` and `[chat:messages:server:reconciled]`. Per platform debug logging rule: debug output must render on screen, not to console, even in DEV.
**Risk:** LOW — not visible in production; violates platform debug logging rule.

### ANOM-CHAT-APP-002: console.warn in useSendMessageActions

**Location:** `hooks/conversation/useSendMessageActions.js`
**Finding:** `console.warn('[useSendMessageActions] media_assets record failed...')` DEV-gated. Same rule violation.
**Risk:** LOW.

### ANOM-CHAT-APP-003: recordChatAttachment Is Fire-and-Forget

**Location:** `hooks/conversation/useSendMessageActions.js` — line calling `recordChatAttachmentController(...).catch(...)`
**Finding:** Stage 3 of the attachment pipeline (platform.media_assets record + message_attachments writeback) is called without await. Failures are caught and logged in DEV but silently swallowed in production. chat.message_attachments.media_asset_id remains NULL if Stage 3 fails.
**Risk:** MEDIUM — data integrity gap for media governance. Intentional UX design (send succeeds even on registration failure), but no retry mechanism and no alerting.

### ANOM-CHAT-APP-004: updateAttachmentMediaAsset.write.dal.js Is App-Level DAL Hitting chat Schema

**Location:** `conversation/dal/updateAttachmentMediaAsset.write.dal.js`
**Finding:** This DAL file imports the VCSM supabase singleton directly and writes to `chat.message_attachments`. It bypasses the `@chat` engine's DAL layer. This is acceptable for the writeback-only use case (linking media_asset_id after the attachment row is already created by the engine), but creates a direct VCSM→chat.schema dependency that is invisible to the engine's ARCHITECT surface.
**Risk:** LOW — write is narrow (single column update, filtered by message_id + storage_path); no ownership bypass.

---

## SECURITY SURFACE

| Control | Mechanism | Risk |
|---------|-----------|------|
| Block check gating | useBlockStatus before composer render | PASS |
| Pending block guard | Composer hidden while block status loading | PASS |
| Attachment MIME validation | @media engine validates before upload (app pre-checks images only) | PASS |
| message_attachments update | Filtered by message_id + storage_path | PASS |
| Actor identity | actorId from useIdentity (never from URL params) | PASS |

---

## MODULE COMPLETENESS MATRIX

| Sub-Module | Status | Evidence | Gap |
|------------|--------|----------|-----|
| Thread (timeline + hooks) | PASS | Delegates to @chat engine; warm-cache layer present | console.log violations |
| Composer | PASS | Text send + image attach with optimistic | Fire-and-forget writeback (ANOM-CHAT-APP-003) |
| Presence | PASS | Pure pass-through to @chat engine | None — intentionally thin |
| Attachments | PARTIAL | Upload + send complete; media_assets writeback fire-and-forget | ANOM-CHAT-APP-003 |
| Zero tests | NONE | No test files | Full coverage gap |

---

## RECOMMENDED HANDOFFS

- **VENOM** — Fire-and-forget media_assets writeback (ANOM-CHAT-APP-003); message_attachments direct UPDATE (ANOM-CHAT-APP-004)
- **ELEKTRA** — recordChatAttachmentController failure modes; platform.media_assets missing record policy
- **SPIDER-MAN** — useSendMessageActions attachment pipeline tests (optimistic, upload fail, send fail, writeback fail); useConversationMessages warm-cache tests
- **WOLVERINE** — console.log → on-screen debug migration (ANOM-CHAT-APP-001/002); fire-and-forget retry strategy (ANOM-CHAT-APP-003)
