# BW V2 Adversarial Review — chat
# BLACKWIDOW V2 — VCSM Chat Feature

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | chat |
| App | VCSM |
| Run Date | 2026-06-04 |
| Reviewer | BLACKWIDOW V2 |
| Report Version | BW2.9 |
| Scanner Version | 1.1.0 |
| Scanner Freshness | FRESH — 2026-06-04T19:48:25.152Z (~7h old) |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Cross-Ref | VEN-CHAT-001 through VEN-CHAT-005 (from 2026-06-04) |

---

## 2. Scanner Preflight

- Scanner Version: 1.1.0
- Maps Generated: 2026-06-04T19:48:25.152Z (FRESH)
- Security paths attributed to chat (scanner): 3
- Total platform security paths: 598
- Callgraph nodes for chat: 386
- Callgraph edges for chat: 486
- Write execution map hits for chat: 0 (no confirmed route paths)
- RPC execution map hits for chat: 0 (no confirmed route paths)

Scanner confidence assessment: ALL THREE scanner security paths are LOW confidence (no route-confirmed paths). This makes chat a PRIMARY ATTACK TARGET per Rule BW-002 — unresolved paths receive maximum adversarial scrutiny.

---

## 3. Scanner Inputs Block

### Security Paths (3 total — all LOW confidence)

| Path | Write/RPC | Table | Confidence | Reason |
|---|---|---|---|---|
| chat-updateAttachment | updateAttachmentMediaAssetIdDAL | chat.message_attachments | LOW | no route-confirmed path |
| chat-searchActors | searchActors RPC | identity.search_actor_directory | LOW | no route-confirmed path |
| chat-searchActorsRPC | search_actor_directory | identity (RPC) | LOW | RPC without route path |

### Callgraph Layer Distribution

| Layer | Count |
|---|---|
| module | 105 |
| dal | 94 |
| model | 43 |
| hook | 46 |
| controller | 41 |
| component | 28 |
| screen | 24 |
| adapter | 2 |
| barrel | 3 |

---

## 4. Attack Surface Inventory

### HIGH confidence (source-verified) write surfaces

| Surface | File | Table | Operation |
|---|---|---|---|
| editMessageDAL | engines/chat/src/dal/editMessage.write.dal.js | chat.messages | UPDATE (no sender filter in DAL) |
| editMessageDAL (duplicate) | engines/chat/src/dal/messages.write.dal.js | chat.messages | UPDATE (no sender filter in DAL) |
| softDeleteMessageDAL | engines/chat/src/dal/messages.write.dal.js | chat.messages | UPDATE (deleted_at) |
| hardDeleteMessageDAL | engines/chat/src/dal/messages.write.dal.js | chat.messages | DELETE |
| updateInboxFlags | engines/chat/src/dal/inbox.write.dal.js | chat.inbox_entries | UPDATE |
| archiveConversationForActor | engines/chat/src/dal/inbox.write.dal.js | chat.inbox_entries | UPDATE |
| moveConversationToFolder | engines/chat/src/dal/inbox.write.dal.js | chat.inbox_entries | UPSERT |
| upsertInboxEntry | engines/chat/src/dal/inbox.write.dal.js | chat.inbox_entries | UPSERT |
| incrementUnread | engines/chat/src/dal/inbox.write.dal.js | chat.inbox_entries | UPDATE |
| resetUnread | engines/chat/src/dal/inbox.write.dal.js | chat.inbox_entries | UPDATE |
| deleteThreadForMeDAL | engines/chat/src/dal/deleteThreadForMe.dal.js | chat.inbox_entries | UPDATE |
| upsertMessageReceiptDAL | engines/chat/src/dal/messageReceipts.write.dal.js | chat.message_receipts | UPSERT |
| deleteMessageForMeDAL | engines/chat/src/dal/messageReceipts.write.dal.js | chat.message_receipts | UPSERT (hidden_at) |
| conversationMembershipWrite | engines/chat/src/dal/conversationMembership.write.dal.js | chat.conversation_members | INSERT/UPSERT/UPDATE |
| setConversationMembershipStatusDAL | engines/chat/src/dal/conversationMembership.write.dal.js | chat.conversation_members | UPDATE (reactivation path) |
| openConversation (RPC file, inline) | engines/chat/src/dal/openConversation.rpc.js | chat.conversation_members, chat.inbox_entries | UPDATE + INSERT |
| dalUpdateConversationMemberReadPointer | engines/chat/src/dal/conversationRead.write.dal.js | chat.conversation_members | UPDATE |
| dalResetInboxUnreadCount | engines/chat/src/dal/conversationRead.write.dal.js | chat.inbox_entries | UPDATE |
| updateAttachmentMediaAssetIdDAL | apps/VCSM/src/features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js | chat.message_attachments | UPDATE |
| insertSavedMessageDAL | engines/chat/src/dal/savedMessages.write.dal.js | chat.saved_messages | UPSERT |
| deleteSavedMessageDAL | engines/chat/src/dal/savedMessages.write.dal.js | chat.saved_messages | DELETE |
| insertAttachmentDAL | engines/chat/src/dal/attachments.write.dal.js | chat.message_attachments | INSERT |
| insertConversationHideModerationActionDAL | engines/chat/src/dal/moderationActions.write.dal.js | moderation.actions | INSERT |
| createConversation | engines/chat/src/dal/conversations.write.dal.js | chat.conversations | INSERT |
| addConversationMembers | engines/chat/src/dal/conversations.write.dal.js | chat.conversation_members | INSERT |

### Hook entry points (UI-accessible)

Primary write-triggering hooks:
- useInboxActions (pin/mute/archive/folder-move/leave/deleteThreadForMe)
- useSendMessageActions (send, attach)
- useMessageActionsMenu (edit, unsend, deleteForMe)
- useStartConversation (create direct conversation)
- useMarkChatRead / useChatUnreadOps
- useArchiveChat
- useDeleteChat

---

## 5. Scanner Signals Block

All three scanner paths are LOW confidence. The scanner missed the majority of the write surface because the chat engine operates as a library injected at setup time, and callgraph edge traversal does not reach a discoverable route entry point. This is a known scanner gap for dependency-injected engine patterns.

Write execution map: 0 confirmed paths — scanner cannot trace routes through engine DI boundary.

PRIMARY ATTACK TARGET status confirmed per BW-002 for all unresolved paths.

---

## 6. Adversarial Path Analysis

---

### A. OWNERSHIP BYPASS — inbox_entries (pin/mute/archive/folder-move)

**Attack scenario:** Actor A calls `ctrlUpdateInboxFlags({ actorId: B_ID, conversationId })` — i.e., passes another actor's ID in the actorId field to mutate B's inbox state.

**Chain:** `useInboxActions(actorId)` → `ctrlUpdateInboxFlags({ actorId, conversationId, flags })` → `updateInboxFlags({ actorId, conversationId, flags })` → SQL UPDATE WHERE actor_id = actorId AND conversation_id = conversationId

**Controller source (engines/chat/src/controller/inboxActions.controller.js:7-9):**
```
export async function ctrlUpdateInboxFlags({ actorId, conversationId, flags }) {
  return updateInboxFlags({ actorId, conversationId, flags })
}
```

**Finding:** The controller performs ZERO ownership verification. `actorId` is passed directly from the caller without any assertion that the caller IS that actor. The `isReady` guard in `useInboxActions` (line 22: `const isReady = Boolean(actorId)`) only checks that actorId is truthy — it does not verify it matches the viewer's session identity. The actorId accepted by the hook comes from the caller of `useInboxActions({ actorId })` — if a compromised or misconfigured caller passes a foreign actorId, the write proceeds.

**Membership check status:** ABSENT. None of `ctrlUpdateInboxFlags`, `ctrlArchiveConversationForActor`, or `ctrlMoveConversationToFolder` perform a membership check before mutating. This is the VEN-CHAT-001 finding (former members can mutate their own inbox state after leaving), but the attack surface is wider: any actor who can invoke the hook with an arbitrary actorId parameter can write to that actorId's inbox_entries row.

**Defense status:** RLS is the ONLY barrier. No application-layer ownership assertion exists in the controller. RLS must enforce that the session actor_id matches the row's actor_id. If RLS is misconfigured or absent (as reported in VEN-CHAT-001's companion investigation), this is fully BYPASSED at the application layer.

**Result:** PARTIAL — RLS-dependent. Controller-layer ownership: ABSENT. DAL-layer ownership: ABSENT. RLS status: UNVERIFIED in this scan.

---

### A2. OWNERSHIP BYPASS — deleteThreadForMe

**Attack scenario:** Actor A calls `deleteThreadForMeController({ actorId: B_ID, conversationId })`.

**Controller source (engines/chat/src/controller/deleteThreadForMe.controller.js:37-41):**
```
if (!actorId || !conversationId) {
  throw new Error('[deleteThreadForMeController] missing params')
}
```

**Finding:** Identical pattern. The controller validates presence but not ownership. No membership check before writing the patch. The DAL writes `WHERE conversation_id = conversationId AND actor_id = actorId` — entirely dependent on RLS.

**Result:** PARTIAL — RLS-dependent. Same class as finding above.

---

### A3. OWNERSHIP BYPASS — editMessage

**Attack scenario:** Actor A calls `editMessageController({ actorId: A_ID, messageId: B_MESSAGE_ID, body: ... })`.

**Controller source (engines/chat/src/controller/editMessage.controller.js:51-53):**
```
if (msg.sender_actor_id !== actorId) {
  throw new Error('[editMessageController] only sender may edit')
}
```

**Finding:** The controller DOES perform ownership verification. It reads `sender_actor_id` from the DB via `fetchMessageForEditDAL` (which has no actorId filter — it reads the raw row), then compares against the provided actorId. The `editMessageDAL` (engines/chat/src/dal/editMessage.write.dal.js:8-37) and the copy in messages.write.dal.js BOTH update without a `sender_actor_id` filter, but the controller gate at line 51 prevents a non-owner from reaching the DAL.

**However**: VEN-CHAT-002 reported that `chat.messages UPDATE RLS policy is not in VCSM-tracked migrations`. If the controller gate is bypassed (e.g., through a different code path that calls `editMessageDAL` directly), RLS is the only remaining barrier.

**Result:** BLOCKED at controller layer [SOURCE_VERIFIED: engines/chat/src/controller/editMessage.controller.js:51-53]. RLS gap documented in VEN-CHAT-002.

---

### A4. OWNERSHIP BYPASS — unsendMessage

**Attack scenario:** Actor A calls `unsendMessageController({ actorId: A_ID, messageId: B_MESSAGE_ID })`.

**Controller source (engines/chat/src/controller/unsendMessage.controller.js:47-49):**
```
if (msg.sender_actor_id !== actorId) {
  throw new Error('[unsendMessageController] only sender may unsend')
}
```

**Finding:** Ownership check present and source-verified.

**Result:** BLOCKED at controller layer [SOURCE_VERIFIED: engines/chat/src/controller/unsendMessage.controller.js:47-49].

---

### A5. ATTACHMENT MEDIA_ASSET_ID WRITE — NO OWNERSHIP CHECK

**Attack scenario:** Actor A calls `updateAttachmentMediaAssetIdDAL({ messageId: B_MESSAGE_ID, storageKey: any, mediaAssetId: any })`.

**DAL source (apps/VCSM/src/features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js:13-24):**
```
export async function updateAttachmentMediaAssetIdDAL({ messageId, storageKey, mediaAssetId }) {
  if (!messageId || !storageKey || !mediaAssetId) return
  // ... UPDATE WHERE message_id = messageId AND storage_path = storageKey
```

**Controller source (apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js:18-54):** The controller creates a `media_asset` record for `ownerActorId` and then writes back to the attachment row. It does NOT verify that `ownerActorId` is the sender of the message identified by `messageId`. If an attacker can invoke `recordChatAttachmentController` with a victim's `messageId` and a matching `storageKey`, they can overwrite the `media_asset_id` on an attachment they don't own.

**Practical reach:** The controller is called fire-and-forget from `useSendMessageActions.handleAttach` (line 84-90). At this call site, `actorId` is the hook's `actorId` prop (from the viewer), and `messageId` is `sendResult?.message?.id`. The message ID comes from the send operation just completed. A normal UI user cannot easily supply a foreign `messageId` here. However, the controller has no ownership assertion — a direct programmatic call is not protected.

**Result:** PARTIAL — no controller-layer ownership verification. Exploitable via direct programmatic invocation. Low practical UI exposure. [SOURCE_VERIFIED: apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js:18-54]

---

### B. SESSION MUTATION — viewerActorId sourcing

**B1. useStartConversation actorId sourcing:**

**Source (apps/VCSM/src/features/chat/start/hooks/useStartConversation.js:29-44):**
```
if (!identity?.actorId) {
  toast.error(...)
  return
}
const { conversationId } = await startDirectConversation({
  fromActorId: identity.actorId, ...
})
```

`identity.actorId` comes from `useIdentity()` which wraps the `identitySelection.store`. This is a session-derived value — not from client payload. Identity store is the authoritative source.

**Result:** BLOCKED — actorId is sourced from the session identity store, not client payload. [SOURCE_VERIFIED: apps/VCSM/src/features/chat/start/hooks/useStartConversation.js:29-31]

**B2. useInboxActions actorId sourcing:**

**Source (engines/chat/src/hooks/useInboxActions.js:21-22):**
```
export default function useInboxActions({ actorId }) {
  const isReady = Boolean(actorId)
```

The hook receives `actorId` as a prop from its caller. The guard is only a truthy check. If the caller passes a stale or incorrect `actorId` (e.g., due to a race during actor switching), the hook will use it without further validation.

**Source (apps/VCSM/src/features/chat/inbox/hooks/useInboxActions.js):**
```
export default function useInboxActions({ actorId }) {
  return useEngineInboxActions({ actorId })
}
```

The VCSM adapter forwards `actorId` directly. The caller is responsible for sourcing it from the session.

**B3. Null actorId bypass test:**

If `actorId` is null/undefined, `isReady = Boolean(null) = false`, and all callbacks return early (`if (!isReady) return`). This is a valid null guard.

However, `ctrlUpdateInboxFlags`, `ctrlArchiveConversationForActor`, `ctrlMoveConversationToFolder` all throw on missing params at line 161, 188, 224 of inbox.write.dal.js respectively. So null actorId cannot reach a write.

**Result:** BLOCKED for null actorId (early-return guard + DAL param validation). Session sourcing is hook-caller responsibility, not internally enforced. [SOURCE_VERIFIED: engines/chat/src/hooks/useInboxActions.js:21-22; engines/chat/src/dal/inbox.write.dal.js:161, 188, 224]

---

### C. RUNTIME ABUSE — privileged path access

**C1. deleteMessage (admin/moderator/system):**

**Controller source (engines/chat/src/controller/deleteMessage.controller.js:57-63):**
```
if (
  reason !== 'admin' &&
  reason !== 'moderator' &&
  reason !== 'system'
) {
  throw new Error('[deleteMessageController] invalid delete reason')
}
```

The `canModerateConversation` function (config.js:68-94) checks:
- If no custom resolver: requires `membership_status === 'active'` AND `role === 'owner' OR 'admin'`
- If reason is 'system': returns false (system cannot be impersonated by a member)

A non-owner member who calls `deleteMessageController` with `reason: 'admin'` will pass the reason validation but fail at `canModerateConversation` because their `role` is `'member'`.

**Attack:** Can a member forge `reason: 'admin'`? Yes — the controller accepts any string and validates it against the allowlist. But then `canModerateConversation` checks the actual membership `role`. The `membership` is fetched from the DB via `readConversationMembershipDAL`. Assuming RLS allows reading own membership, the role check is DB-sourced and not injectable.

**Result:** BLOCKED — reason allowlist enforced + role check from DB-sourced membership. [SOURCE_VERIFIED: engines/chat/src/controller/deleteMessage.controller.js:57-93; engines/chat/src/config.js:68-94]

**C2. createAnnouncementConversation privileged path:**

**Controller source (engines/chat/src/controller/createAnnouncementConversation.controller.js:6-12):**
```
if (!actorId || !realmId) {
  throw new Error('[createAnnouncementConversation] actorId and realmId are required')
}
```

The controller creates an announcement conversation (where only specified posting actors can post). There is NO check that the calling `actorId` has any platform-level permission to create announcement channels. Any actor can create an announcement conversation as long as actorId and realmId are provided.

**Result:** PARTIAL — actor kind/role not verified before creating privileged conversation type. [SOURCE_VERIFIED: engines/chat/src/controller/createAnnouncementConversation.controller.js:6-12]

**C3. ensureConversationMembership — automatic re-activation:**

**Controller source (engines/chat/src/controller/ensureConversationMembership.controller.js:16-23):**
```
// Row exists but inactive — re-activate
if (membership && membership.membership_status !== 'active') {
  await setConversationMembershipStatusDAL({
    conversationId, actorId, membershipStatus: 'active',
  })
  return
}
```

This controller is called from `sendMessageController` and `deleteMessageForMeController`. An actor who previously left a conversation (status: 'left') will be silently re-activated as 'active' when they attempt to send a message. This is a state-machine bypass — the membership state 'left' is overwritten back to 'active' without any policy check.

**Attack chain:** Actor leaves group → membership_status = 'left' → actor directly calls sendMessageController → ensureConversationMembership re-activates → message is sent. The actor bypasses the "you left this conversation" state.

**Note:** For direct conversations (non-group), `sendMessageController` calls `fetchConversationMember` after `ensureConversationMembership` and checks `membership_status !== 'active'`, but `ensureConversationMembership` already re-activated it, so this check passes.

**Result:** BYPASSED — 'left' membership status can be silently auto-upgraded to 'active' by calling sendMessage. [SOURCE_VERIFIED: engines/chat/src/controller/ensureConversationMembership.controller.js:16-23]

---

### D. RLS VERIFICATION

**D1. chat.messages UPDATE (edit/delete):**

VEN-CHAT-002 reported: `editMessage.write.dal.js has no sender_actor_id SQL filter; chat.messages UPDATE RLS policy not in VCSM-tracked migrations`.

BW verification: Confirmed that `editMessageDAL` (engines/chat/src/dal/editMessage.write.dal.js:8-37) and the copy in `messages.write.dal.js:35-52` both UPDATE without `sender_actor_id` filter. The controller checks ownership (line 51) but the DAL doesn't. RLS policy status remains UNVERIFIED.

**D2. chat.inbox_entries:**

All inbox mutations (updateInboxFlags, archive, move, deleteThread, resetUnread) use `WHERE actor_id = actorId AND conversation_id = conversationId`. If RLS enforces that the session actor can only update their own rows, this is adequate. But VEN-CHAT-001 indicates no membership check — former members can still update their own inbox_entries rows (which still exist after leaving).

**D3. chat.message_attachments:**

`updateAttachmentMediaAssetIdDAL` updates `WHERE message_id = messageId AND storage_path = storageKey`. No ownership assertion at application layer. Entirely RLS-dependent.

**D4. chat.conversation_members UPDATE (re-activation in openConversation.rpc.js):**

The `openConversation` function (engines/chat/src/dal/openConversation.rpc.js:41-56) directly UPDATEs `conversation_members` WHERE `conversation_id = conversationId AND actor_id = actorId` to set status 'active'. This is a raw Supabase write. If the session actor can update any membership row where actor_id matches their session, this is RLS-safe. But if RLS is absent or overly permissive, any actor can reactivate any actor's membership by calling this with a foreign actorId.

**D5. Production console.log in openConversation.rpc.js:**

**Source (engines/chat/src/dal/openConversation.rpc.js:16, 28-33, 49-54, 93-99):** Multiple `console.log` statements log `conversationId` and `actorId` to the browser console unconditionally. This is a production information leakage — no DEV guard. Chat IDs and actor IDs are logged on every conversation open.

**Result:** PARTIAL for all DAL writes — RLS unverified, application layer has no ownership assertions on inbox_entries writes.

---

### E. VIEWER CONTEXT FUZZING

**E1. null actorId to editMessageController:**
Source (line 21-23): `if (!actorId) { throw new Error('[editMessageController] actorId required') }` — BLOCKED.

**E2. null actorId to sendMessageController:**
Source (line 37-39): `if (!conversationId || !actorId) { throw new Error('[sendMessage] missing params') }` — BLOCKED.

**E3. null actorId to inboxActions controllers:**
Source inbox.write.dal.js lines 161, 188, 224: all throw on missing params — BLOCKED.

**E4. undefined actorId to useInboxActions:**
Source (engines/chat/src/hooks/useInboxActions.js:22): `const isReady = Boolean(actorId)` — all callbacks check `if (!isReady) return` — BLOCKED at hook layer.

**E5. actorId from stale actor-switch state:**
The `useInboxActions` hook memoizes `actorId` in callbacks via `[actorId, isReady]` deps. If `actorId` changes mid-mutation (actor switch), there is a race window where callbacks close over the old actorId. This is a timing issue, not a validation gap. Mutations in flight would complete against the old actor's inbox. LOW severity.

**Result:** All explicit null/undefined cases BLOCKED. Actor-switch race: LOW risk. [SOURCE_VERIFIED: multiple controller files]

---

### F. MUTATION REPLAY

**F1. unsendMessage replay (already-deleted message):**
Source (engines/chat/src/controller/unsendMessage.controller.js:43-45):
```
if (msg.deleted_at) {
  return { ok: true, alreadyUnsent: true }
}
```
Idempotent — already-deleted messages return success without re-mutating. BLOCKED.

**F2. editMessage replay on deleted message:**
Source (engines/chat/src/controller/editMessage.controller.js:47-49):
```
if (msg.deleted_at) {
  throw new Error('[editMessageController] cannot edit deleted message')
}
```
BLOCKED.

**F3. softDeleteMessageDAL — dual filter:**
Source (engines/chat/src/dal/messages.write.dal.js:63-65):
```
.update({ deleted_at: new Date().toISOString() })
.eq('id', messageId)
.is('deleted_at', null)
```
The `.is('deleted_at', null)` filter ensures only non-deleted messages can be soft-deleted. BLOCKED.

**F4. saveMessage replay:**
`insertSavedMessageDAL` uses `UPSERT onConflict: 'actor_id,message_id'` — idempotent. BLOCKED.

**F5. markConversationRead replay on already-read conversation:**
Source (engines/chat/src/controller/markConversationRead.controller.js:32-36):
```
if (member.last_read_message_id === lastMessage.id) {
  await dalResetInboxUnreadCount(...)
  return { success: true, lastReadMessageId: lastMessage.id }
}
```
Re-read always resets unread_count — safe and idempotent. INFO.

**Result:** All tested replay paths BLOCKED or safely idempotent. [SOURCE_VERIFIED: multiple controller/DAL files]

---

### G. HYDRATION POISONING

The chat engine uses `hydrateAndReturnSummaries` (via DI in setup.js) to populate actor summaries. The `getActorSummariesByIds` function (setup.js:31-37) delegates to `@hydration`. Chat does not write to the hydration store — it only reads from it. The `readConversationMembersController` fetches members and hydrates them, but this is a read-only operation feeding the UI.

No chat controller writes to hydration. Actor summaries are cached in a Zustand store (hydration engine responsibility). The chat feature does not have a write surface into the hydration system.

**Result:** NOT APPLICABLE — chat feature has no write path to hydration store. INFO.

---

### H. URL SURFACE (raw UUIDs in navigation)

**H1. navigate with conversationId:**
Source (apps/VCSM/src/features/chat/start/hooks/useStartConversation.js:46):
```
navigate(`/chat/${conversationId}`)
```

This exposes the raw conversation UUID in the URL. Conversations are internal UUIDs, not human-readable slugs. Per platform policy (Memory: "No raw IDs in public URLs"), this is a violation.

**Attack surface:** A user's conversation ID is visible in the browser address bar and browser history. If the conversation ID leaks (e.g., through browser history sync, referrer headers, or shared screenshots), an attacker knowing the UUID can attempt to access that conversation. However, actual access is gated by RLS on `chat.conversations` and membership checks.

**Severity:** MEDIUM — policy violation + indirect information disclosure. Not directly exploitable for data exfiltration without a corresponding RLS failure, but violates the "No raw IDs in public URLs" platform contract.

**H2. Notification link paths:**
No notification link construction found in chat controllers/engine. The `publishDomainEvent` and `publishMessageSentEvent` functions are outbox events — their payload consumers are not in scope for this feature's source. No raw UUIDs in notification linkPaths were found within the scanned chat source.

**Result for H1:** RAW UUID in navigate path — policy violation confirmed. [SOURCE_VERIFIED: apps/VCSM/src/features/chat/start/hooks/useStartConversation.js:46]

---

### I. §9 INVARIANT ATTACK (BEHAVIOR.md is PLACEHOLDER)

BEHAVIOR.md has Status: PLACEHOLDER — no §4 Failure Paths or §9 Must Never Happen sections exist.

All §9 invariants are UNANCHORED. BW performed source-inferred invariant attacks based on expected chat domain invariants:

**Inferred Invariant 1: A user must never read messages in a conversation they are not a member of.**
Attack: Call `openConversationController({ conversationId: VICTIM_ID, actorId: ATTACKER_ID })`.
Source (engines/chat/src/dal/openConversation.rpc.js:37-39):
```
if (!member) {
  throw new Error('[openConversation] actor is not a member of this conversation')
}
```
Result: BLOCKED. [SOURCE_VERIFIED: openConversation.rpc.js:37-39]

**Inferred Invariant 2: An actor must never be able to send messages in a conversation they left.**
Attack: Described in C3 above. `ensureConversationMembership` silently re-activates 'left' status.
Result: BYPASSED. [SOURCE_VERIFIED: engines/chat/src/controller/ensureConversationMembership.controller.js:16-23]

**Inferred Invariant 3: Only the sender can edit or unsend their own messages.**
Attack: Pass foreign messageId to editMessageController.
Result: BLOCKED. [SOURCE_VERIFIED: editMessage.controller.js:51-53, unsendMessage.controller.js:47-49]

**Inferred Invariant 4: A blocked actor must not be able to send messages to the blocking actor.**
Attack: Verify block check in sendMessageController.
Source (engines/chat/src/controller/sendMessage.controller.js:56-67): Block check present for direct conversations. Group conversations excluded.
Result: BLOCKED for direct conversations. INFO gap for group conversation block scenarios.

**Inferred Invariant 5: Chat privacy settings must be server-enforced.**
Attack: Skip `whoCanMessage = 'nobody'` setting and call `startDirectConversation` directly.
Source: `useMessagePrivacySettings` is localStorage-only (VEN-CHAT-003). `startDirectConversation` does NOT read target actor's privacy settings.
Result: BYPASSED — privacy settings are client-side only and not enforced on the server path. [SOURCE_VERIFIED: apps/VCSM/src/features/chat/inbox/hooks/useMessagePrivacySettings.js + engines/chat/src/controller/startDirectConversation.controller.js]

**Inferred Invariant 6: Debug tooling must not be active in production.**
Attack: Activate `chatNavDebugger` in production by setting `window.__CHAT_NAV_DEBUG = true`.
Source (apps/VCSM/src/features/chat/debug/chatNavDebugger.js:42-47):
```
function isEnabled() {
  if (typeof window === 'undefined') return true  // SSR: always enabled
  if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
  return true  // DEFAULT: ON if not set
}
```
Result: BYPASSED — chatNavDebugger defaults to ON if `window.__CHAT_NAV_DEBUG` is not explicitly set. Any production user can activate it. chatBadgeDebugger defaults to ON similarly.
[SOURCE_VERIFIED: apps/VCSM/src/features/chat/debug/chatNavDebugger.js:42-47, chatBadgeDebugger.js:17-21]

---

## 7. Exploitability Assessment

| Finding ID | Severity | Exploit Chain | Practical Exploitability |
|---|---|---|---|
| BW-CHAT-001 | HIGH | Multi-step: actor-switch race or compromised caller supplies foreign actorId to inbox mutations | MEDIUM — requires caller misconfiguration or compromised actor-switch state; RLS may block at DB layer |
| BW-CHAT-002 | HIGH | Single-step: call sendMessage after leaving conversation to auto-reactivate membership | HIGH — direct programmatic bypass of leave semantics |
| BW-CHAT-003 | MEDIUM | Single-step: navigate to /chat/[UUID] — URL exposes raw conversation UUID | LOW practical risk (RLS still gates access), HIGH policy violation |
| BW-CHAT-004 | MEDIUM | Single-step: call startDirectConversation with actorId of actor with whoCanMessage='nobody' | HIGH — privacy setting fully bypassable |
| BW-CHAT-005 | MEDIUM | Single-step: set window.__CHAT_NAV_DEBUG = true in production | HIGH — no production guard, always-ON default |
| BW-CHAT-006 | LOW | Multi-step: invoke recordChatAttachmentController with foreign messageId | LOW — fire-and-forget, no direct data exfiltration |
| BW-CHAT-007 | LOW | INFO: production console.log in openConversation.rpc.js leaks conversationId + actorId | MEDIUM — always active in production, logs sensitive IDs |
| BW-CHAT-008 | INFO | Actor-switch race in useInboxActions memoized callbacks | VERY LOW — timing-dependent |

---

## 8. Source Verification Summary

| Claim | File | Lines | Status |
|---|---|---|---|
| inboxActions has no membership/ownership check | engines/chat/src/controller/inboxActions.controller.js | 7-33 | SOURCE_VERIFIED |
| updateInboxFlags has no ownership filter in DAL | engines/chat/src/dal/inbox.write.dal.js | 155-176 | SOURCE_VERIFIED |
| editMessage ownership check present | engines/chat/src/controller/editMessage.controller.js | 51-53 | SOURCE_VERIFIED |
| unsendMessage ownership check present | engines/chat/src/controller/unsendMessage.controller.js | 47-49 | SOURCE_VERIFIED |
| ensureConversationMembership silently reactivates | engines/chat/src/controller/ensureConversationMembership.controller.js | 16-23 | SOURCE_VERIFIED |
| sendMessage calls ensureConversationMembership | engines/chat/src/controller/sendMessage.controller.js | 72 | SOURCE_VERIFIED |
| chatNavDebugger defaults ON | apps/VCSM/src/features/chat/debug/chatNavDebugger.js | 42-47 | SOURCE_VERIFIED |
| chatBadgeDebugger defaults ON | apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js | 17-21 | SOURCE_VERIFIED |
| messagePrivacySettings is localStorage-only | apps/VCSM/src/features/chat/inbox/hooks/useMessagePrivacySettings.js | 53-65 | SOURCE_VERIFIED |
| startDirectConversation does not read target privacy | engines/chat/src/controller/startDirectConversation.controller.js | 25-79 | SOURCE_VERIFIED |
| navigate uses raw conversationId UUID | apps/VCSM/src/features/chat/start/hooks/useStartConversation.js | 46 | SOURCE_VERIFIED |
| useStartConversation sources actorId from identity session | apps/VCSM/src/features/chat/start/hooks/useStartConversation.js | 29-31 | SOURCE_VERIFIED |
| recordChatAttachmentController no ownership check | apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js | 18-54 | SOURCE_VERIFIED |
| Production console.log in openConversation | engines/chat/src/dal/openConversation.rpc.js | 16, 28-33, 49-54, 93-99 | SOURCE_VERIFIED |
| canModerateConversation role check present | engines/chat/src/config.js | 68-94 | SOURCE_VERIFIED |
| deleteMessage reason allowlist present | engines/chat/src/controller/deleteMessage.controller.js | 57-63 | SOURCE_VERIFIED |
| createAnnouncementConversation no actor-kind check | engines/chat/src/controller/createAnnouncementConversation.controller.js | 6-12 | SOURCE_VERIFIED |

---

## 9. Confidence Summary

| Finding ID | Confidence | Provenance |
|---|---|---|
| BW-CHAT-001 | HIGH | [SOURCE_VERIFIED] — controller source read, no ownership assertion confirmed |
| BW-CHAT-002 | HIGH | [SOURCE_VERIFIED] — ensureConversationMembership source confirmed bypass |
| BW-CHAT-003 | HIGH | [SOURCE_VERIFIED] — navigate call with raw UUID confirmed |
| BW-CHAT-004 | HIGH | [SOURCE_VERIFIED] — localStorage-only privacy + server path confirmed no check |
| BW-CHAT-005 | HIGH | [SOURCE_VERIFIED] — isEnabled() default return true confirmed |
| BW-CHAT-006 | MEDIUM | [SOURCE_VERIFIED] — controller source read, attack vector low practical reach |
| BW-CHAT-007 | HIGH | [SOURCE_VERIFIED] — console.log calls confirmed in production file, no DEV guard |
| BW-CHAT-008 | LOW | [SCANNER_LEAD] — hook pattern analysis, not directly exploitable |

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack Vector | Result | Finding |
|---|---|---|---|
| Non-members cannot read conversations | Direct openConversation call with non-member actorId | BLOCKED | N/A |
| Actor who left cannot re-send messages | Call sendMessage → ensureConversationMembership re-activates 'left' | BYPASSED | BW-CHAT-002 |
| Only sender can edit/unsend | Pass foreign messageId to controllers | BLOCKED | N/A |
| Blocked actors cannot start new conversations | Block check in startDirectConversation | BLOCKED | N/A |
| Privacy settings (whoCanMessage='nobody') must be enforced | Call startDirectConversation without server-side check | BYPASSED | BW-CHAT-004 |
| Debug tools must not run in production | window.__CHAT_NAV_DEBUG not set — defaults ON | BYPASSED | BW-CHAT-005 |
| Actor inbox entries protected from cross-actor mutation | inboxActions passes actorId without ownership assertion | PARTIAL (RLS-dependent) | BW-CHAT-001 |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: PLACEHOLDER

Impact of unanchored invariants:
- §9 Must Never Happen section does not exist. All invariants were inferred from source review.
- 2 of 6 inferred invariants were BYPASSED.
- The absence of a formal contract means future changes to controllers or DALs will not be checked against documented invariants.

Recommended actions:
1. Write BEHAVIOR.md for chat with at minimum §4 Failure Paths and §9 Must Never Happen.
2. Explicitly document the ensureConversationMembership re-activation policy.
3. Document whether the privacy settings system is intended to be client-only or server-enforced.

---

## 12. THOR Impact

THOR RELEASE BLOCKERS (newly confirmed by BW):

| Finding ID | Severity | Blocker Reason |
|---|---|---|
| BW-CHAT-002 | HIGH | Active membership state-machine bypass — 'left' actors can re-enter conversations silently. Direct exploit path confirmed. |
| BW-CHAT-004 | MEDIUM | Privacy setting (whoCanMessage) is entirely client-side. Server does not enforce it. User expectation of blocking new messages not met. |

Existing THOR blockers from VENOM (carry forward):
- VEN-CHAT-001: HIGH — former members can mutate inbox_entries
- VEN-CHAT-002: HIGH — messages UPDATE RLS not in tracked migrations

TOTAL THOR RELEASE BLOCKERS: VEN-CHAT-001, VEN-CHAT-002, BW-CHAT-002

BW-CHAT-004 is a THOR gate candidate pending product decision on whether server-side enforcement of privacy settings is required for release.

---

## 13. SPIDER-MAN Test Requirements

The following regression test cases are required before marking any of these findings RESOLVED:

**BW-CHAT-002 — Membership re-activation bypass**
- Test: Actor leaves a group conversation → attempts sendMessage → verify message is REJECTED (not re-admitted silently)
- Expected: ensureConversationMembership must check if status is 'left' and throw, not re-activate
- Current behavior (BYPASSED): message is accepted and actor is silently re-activated

**BW-CHAT-004 — Privacy setting bypass**
- Test: Actor B sets whoCanMessage = 'nobody' → Actor A calls startDirectConversation targeting B → verify conversation is REJECTED
- Expected: server-side check on target actor's privacy setting before creating conversation
- Current behavior (BYPASSED): no server-side check, conversation created regardless

**BW-CHAT-001 — Inbox ownership via RLS**
- Test: Actor A calls ctrlUpdateInboxFlags with actorId = B's ID → verify DB write is rejected
- Expected: RLS policy on chat.inbox_entries rejects cross-actor write
- Must verify: RLS policy exists and is active on chat.inbox_entries for UPDATE

**BW-CHAT-005 — Debug tool production guard**
- Test: Load app in production build (import.meta.env.PROD = true) → verify chatNavDebugger.isEnabled() returns false
- Current behavior (BYPASSED): defaults to true when window.__CHAT_NAV_DEBUG is not set

**BW-CHAT-007 — Production console.log removal**
- Test: Load openConversation in production build → verify no console.log output
- File: engines/chat/src/dal/openConversation.rpc.js lines 16, 28-33, 49-54, 93-99

---

*Report generated by BLACKWIDOW V2 — VCSM Chat Adversarial Review*
*Date: 2026-06-04*
*Scanner: 1.1.0 (FRESH)*
*Status: COMPLETE*
