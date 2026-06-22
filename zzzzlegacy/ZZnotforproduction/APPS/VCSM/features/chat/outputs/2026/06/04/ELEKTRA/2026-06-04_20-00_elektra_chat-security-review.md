# ELEKTRA Security Report

**Date:** 2026-06-04
**Scope:** VCSM + ENGINE
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — first ELEKTRA pass on chat feature; cross-references VEN-CHAT-001–005 and BW-CHAT-001–008
**Areas Covered:** 01 Actor Ownership/IDOR, 02 Controller Input Trust, 03 Supabase RLS (partial), 06 Auth and Session
**Findings Summary:** 1 HIGH | 4 MEDIUM | 3 LOW | 1 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 9
**THOR Release Blocker:** YES — ELEK-2026-06-04-001

---

## Executive Summary

ELEKTRA completed a code-level precision scan of the VCSM chat feature and its primary engine dependency (`engines/chat`). All findings are grounded in traced source→sink chains with direct evidence from source files.

**One HIGH finding confirmed:** `ensureConversationMembership` silently re-activates `membership_status = 'left'` when `sendMessage` is called — an actor who left a conversation can force-rejoin the conversation by sending a message. The UI gate (ChatInput hidden behind `canRead`) is a client-side-only defense and is bypassed by direct API calls. This is a THOR release blocker.

**Four MEDIUM findings:** inbox actions controller has no membership pre-check (actors who left can ghost-mutate their inbox entries); `editMessageDAL` has no `sender_actor_id` SQL filter (single-point-of-failure controller check); `recordChatAttachment` has no message sender assertion; message privacy settings are localStorage-only with zero server enforcement.

**Three prior VENOM/BW findings corrected by source inspection:** chatBadgeDebugger and chatNavDebugger call sites are all properly DEV-guarded — the `isEnabled()` default-true issue is a defense-in-depth gap (INFO), not an active production exploit. The `editMessage` controller DOES check `sender_actor_id !== actorId` at line 51 — the VEN-CHAT-002 HIGH concern is downgraded to MEDIUM (DAL-layer binding absent, but controller defense confirmed present).

---

## Scan Target Declaration

```
ELEKTRA SCAN TARGET
Feature / Route / Engine: chat (apps/VCSM/src/features/chat + engines/chat/src)
Application Scope: VCSM + ENGINE
Reason for scan: First ELEKTRA pass; VENOM + BLACKWIDOW prior findings require code-level chain verification
Scan trigger: MANUAL
```

---

## Entry Point Map

```
ENTRY POINT MAP
Routes / API:
  /inbox              → InboxScreen → useInbox → @chat engine
  /chat/:conversationId → ConversationScreen → ConversationView
  /chat/settings      → InboxSettingsScreen
  /chat/archived      → ArchivedInboxScreen
  /chat/requests      → RequestsInboxScreen
  /chat/spam          → SpamInboxScreen
  StartConversationModal → startDirectConversation.controller.js

Input sources (user-controlled):
  - conversationId from URL param (:conversationId)
  - actorId from useIdentity() / identity store (session-derived — SAFE source)
  - message body from ChatInput
  - attachment file from ChatInput
  - folder target from inbox action buttons
  - whoCanMessage setting from MessagePrivacyScreen

Trusted input boundary:
  - actorId: SAFE — all primary paths derive from useIdentity() → identity.adapter → Supabase session
  - conversationId: UNTRUSTED — sourced from URL param; membership must be validated server-side
  - message body: UNTRUSTED — user-supplied string; validated for content presence only
  - folder: PARTIALLY TRUSTED — hardcoded in hook constants; no allowlist in controller

Validation present at boundary: PARTIAL
  - actorId: session-derived throughout feature layer ✓
  - conversationId membership: validated in sendMessage path; NOT validated in inboxActions path ✗
  - message sender ownership: validated at controller layer for edit; NOT at DAL layer ✗
```

---

## HIGH Findings

---

### ELEK-2026-06-04-001

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-001
- Title:              ensureConversationMembership silently re-activates 'left' membership — actor who left can force-rejoin via sendMessage
- Category:           Auth Bypass / IDOR
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM + ENGINE
- Location:           engines/chat/src/controller/ensureConversationMembership.controller.js:17-22
                      engines/chat/src/controller/sendMessage.controller.js:72
- Source:             actorId + conversationId from sendMessage caller (session-derived actorId; conversationId from URL or client payload)
- Sink:               setConversationMembershipStatusDAL → UPDATE chat.conversation_members SET membership_status = 'active'
- Trust Boundary:     ensureConversationMembership.controller.js — should validate membership_status before re-activating
- Impact:             An actor who explicitly left (or was removed from) a conversation can silently re-activate
                      their active membership by calling sendMessage on that conversationId. After ensureConversationMembership
                      runs, fetchConversationMember returns membership_status = 'active' and the send proceeds.
                      The actor is now a full conversation member again with no re-invite.
- Evidence:
    // ensureConversationMembership.controller.js:17-22
    if (membership && membership.membership_status !== 'active') {
      await setConversationMembershipStatusDAL({
        conversationId,
        actorId,
        membershipStatus: 'active',  // ← re-activates ANY non-active status, including 'left' and 'removed'
      })
      return
    }

    // sendMessage.controller.js:72
    await ensureConversationMembership({ conversationId, actorId })
    // → re-activates if 'left' → then proceeds to:
    const member = await fetchConversationMember({ conversationId, actorId })
    if (!member || member.membership_status !== 'active') { throw } // ← now passes because just re-activated

- Reproduction Steps:
    1. Actor A and Actor B are in a direct conversation (conversationId = X)
    2. Actor A calls leaveConversation — sets membership_status = 'left' for Actor A in conversation X
    3. Actor A programmatically calls sendMessageController({ conversationId: X, actorId: A, body: '...' })
    4. ensureConversationMembership finds membership_status = 'left' (not 'active') → re-activates to 'active'
    5. fetchConversationMember now returns active membership → send proceeds
    6. Actor A is now a full member of conversation X again without an invite
    (No production exploitation — reproduction is code-path analysis only)

- Existing Defense:   UI gate: ConversationView.jsx only renders ChatInput when canRead = true.
                      canRead is derived from useConversationMembers → checks membership status client-side.
- Why Defense Is Insufficient:
    The UI gate is client-side only. An actor with a valid session can call the sendMessage API path
    directly (browser console, scripted fetch, or by manipulating the React state) without going through
    ConversationView.jsx. The server-side logic itself has no protection against this re-join.
- Recommended Fix:    Distinguish 'left' and 'removed' from other non-active statuses. Do not auto-re-activate
                      a membership that was deliberately ended. Only auto-create a new row if no row exists
                      (first join). Throw if the row exists with status 'left' or 'removed'.
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/controller/ensureConversationMembership.controller.js
    // BEFORE:
    if (membership && membership.membership_status !== 'active') {
      await setConversationMembershipStatusDAL({ conversationId, actorId, membershipStatus: 'active' })
      return
    }

    // AFTER:
    if (membership) {
      if (membership.membership_status === 'active') return  // already active — nothing to do

      // 'left' and 'removed' are terminal — do not silently re-activate
      if (membership.membership_status === 'left' || membership.membership_status === 'removed') {
        throw new Error('[ensureConversationMembership] actor has left or been removed from this conversation')
      }

      // Other non-active statuses (e.g. 'inactive') may be re-activated
      await setConversationMembershipStatusDAL({ conversationId, actorId, membershipStatus: 'active' })
      return
    }

- Follow-up Command:  BLACKWIDOW (runtime re-verify after patch), DB (confirm conversation_members status enum values)
```

---

## Medium Findings

---

### ELEK-2026-06-04-002

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-002
- Title:              inboxActions.controller.js — no membership check; archiveConversationForActor upserts ghost inbox_entries for non-members
- Category:           IDOR / Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              ENGINE
- Location:           engines/chat/src/controller/inboxActions.controller.js:7-33
                      engines/chat/src/dal/inbox.write.dal.js:182-212 (archiveConversationForActor)
                      engines/chat/src/dal/inbox.write.dal.js:155-176 (updateInboxFlags)
- Source:             actorId + conversationId passed by caller (session-derived actorId is safe; conversationId unverified)
- Sink:               inbox.write.dal.js → UPDATE/UPSERT chat.inbox_entries WHERE actor_id = actorId AND conversation_id = conversationId
- Trust Boundary:     inboxActions.controller.js — should verify active membership before any inbox mutation
- Impact:
    (a) Former member: An actor with membership_status = 'left' can still call ctrlUpdateInboxFlags,
        ctrlArchiveConversationForActor, or ctrlMoveConversationToFolder. The controller passes
        actorId + conversationId directly to the DAL with no membership check. The DAL mutates
        chat.inbox_entries for that actor.
    (b) Ghost entry creation: archiveConversationForActor calls upsertInboxEntry() before the
        archive update. upsertInboxEntry will INSERT a new inbox_entries row if none exists.
        An actor who was never a member of a conversation — but knows the conversationId — can
        cause an inbox_entries row to be inserted for that actor+conversation pair.
    (c) Application layer has zero membership defense. Protection relies entirely on RLS policies
        on chat.inbox_entries (unconfirmed state for UPDATE operations).
- Evidence:
    // inboxActions.controller.js — no membership check before ANY of these:
    export async function ctrlUpdateInboxFlags({ actorId, conversationId, flags }) {
      return updateInboxFlags({ actorId, conversationId, flags })
    }
    export async function ctrlArchiveConversationForActor({ actorId, conversationId, untilNew = true }) {
      return archiveConversationForActor({ actorId, conversationId, untilNew })
    }
    export async function ctrlMoveConversationToFolder({ actorId, conversationId, folder }) {
      return moveConversationToFolder({ actorId, conversationId, folder })
    }

    // inbox.write.dal.js:191-196 — upsert creates row if missing:
    await upsertInboxEntry({ actorId, conversationId, defaults: { folder: 'inbox', ... } })

- Existing Defense:   RLS on chat.inbox_entries scopes mutations to auth.uid() = actor_id (assumed; unconfirmed for UPDATE).
- Why Defense Is Insufficient:
    Single-layer defense. No application-layer membership assertion. If RLS policy has any gap
    or if actorId !== auth.uid() in edge cases, no backstop exists. Ghost entry creation via
    archiveConversationForActor is a schema integrity risk regardless of RLS.
- Recommended Fix:    Add a membership pre-check in each inbox action controller. Read conversation_members
                      for (actorId, conversationId) and throw if no active membership row exists.
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/controller/inboxActions.controller.js
    import { readConversationMembershipDAL } from '../dal/conversationMembership.read.dal.js'

    async function assertActiveMembership(actorId, conversationId) {
      const membership = await readConversationMembershipDAL({ conversationId, actorId })
      if (!membership || membership.membership_status !== 'active') {
        throw new Error('[inboxActions] actor is not an active member of this conversation')
      }
    }

    export async function ctrlUpdateInboxFlags({ actorId, conversationId, flags }) {
      await assertActiveMembership(actorId, conversationId)
      return updateInboxFlags({ actorId, conversationId, flags })
    }
    // Apply same pattern to ctrlArchiveConversationForActor and ctrlMoveConversationToFolder

- Follow-up Command:  DB (confirm RLS policy on chat.inbox_entries UPDATE), BLACKWIDOW (verify after patch)
```

---

### ELEK-2026-06-04-003

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-003
- Title:              editMessageDAL has no sender_actor_id SQL filter — single-layer defense (controller-only check, DAL unguarded, RLS unconfirmed)
- Category:           IDOR / Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              ENGINE
- Location:           engines/chat/src/dal/editMessage.write.dal.js:8-37
                      engines/chat/src/controller/editMessage.controller.js:41-58
- Source:             messageId from caller; actorId session-derived
- Sink:               supabase UPDATE chat.messages SET body, edited_at WHERE id = messageId (no sender_actor_id filter)
- Trust Boundary:     editMessage.controller.js:41-58 (pre-check fetch + sender comparison)
- Impact:
    The controller correctly reads the message (fetchMessageForEditDAL) and compares
    msg.sender_actor_id !== actorId (line 51). If this check fails, an error is thrown.
    However, editMessageDAL at the SQL level issues:
      UPDATE chat.messages SET body = ?, edited_at = ? WHERE id = ?
    There is no SQL-layer sender_actor_id = actorId filter. The protection depends entirely on:
    (a) the controller path always being exercised (no bypasses)
    (b) a confirmed RLS UPDATE policy on chat.messages enforcing sender_actor_id = auth.uid()
    VEN-CHAT-002 explicitly states "chat.messages UPDATE RLS policy not in VCSM-tracked migrations."
    If RLS is absent, a race condition or internal bypass (future direct DAL call) would allow
    any actor to overwrite another actor's message body.
- Evidence:
    // editMessage.write.dal.js:11-17 — no sender filter:
    const { data, error } = await supabase
      .schema('chat').from('messages')
      .update({ body, edited_at: new Date().toISOString() })
      .eq('id', messageId)   // ← messageId only — no .eq('sender_actor_id', actorId)
      .select(...)
      .single()

    // editMessage.controller.js:51 — controller check is present but DAL is unbound:
    if (msg.sender_actor_id !== actorId) {
      throw new Error('[editMessageController] only sender may edit')
    }
    // Then calls editMessageDAL({ messageId, body }) — actorId NOT passed to DAL

- Existing Defense:   Application-layer ownership check at editMessageController:51 (confirmed present).
- Why Defense Is Insufficient:
    Defense is a single point of failure. DAL does not bind the ownership constraint in SQL.
    RLS policy for chat.messages UPDATE is unconfirmed. If controller is bypassed (direct DAL call
    in future code, or if fetchMessageForEditDAL returns null causing unhandled edge), the sink
    has no protection.
- Recommended Fix:
    (1) Add .eq('sender_actor_id', actorId) to the editMessageDAL UPDATE clause.
    (2) Pass actorId to editMessageDAL and include it in the SQL filter.
    (3) DB: confirm or create RLS policy on chat.messages UPDATE enforcing sender_actor_id = auth.uid().
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/dal/editMessage.write.dal.js
    export async function editMessageDAL({ messageId, actorId, body }) {  // ← add actorId param
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .schema('chat').from('messages')
        .update({ body, edited_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_actor_id', actorId)  // ← bind sender at SQL layer
        .select('id, conversation_id, sender_actor_id, message_kind, body, ...')
        .single()
      if (error) throw error
      return data
    }

    // engines/chat/src/controller/editMessage.controller.js — pass actorId to DAL:
    const row = await editMessageDAL({ messageId, actorId, body: normalizedBody })

- Follow-up Command:  DB (confirm/create RLS policy on chat.messages UPDATE)
```

---

### ELEK-2026-06-04-004

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-004
- Title:              recordChatAttachment.controller.js — no message sender assertion; ownerActorId not verified against message's sender_actor_id before attachment writeback
- Category:           IDOR
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js:18-54
                      apps/VCSM/src/features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js:13-24
- Source:             { ownerActorId, messageId, storageKey } — all caller-provided
- Sink:               updateAttachmentMediaAsset.write.dal.js → UPDATE chat.message_attachments SET media_asset_id WHERE message_id = ? AND storage_path = ?
- Trust Boundary:     recordChatAttachmentController — should verify ownerActorId = sender_actor_id of messageId before writeback
- Impact:
    An actor supplying a valid (messageId, storageKey) pair can write any mediaAssetId into
    the chat.message_attachments row for that message — even if they are not the sender.
    In practice, storageKey is generated during a successful Supabase storage upload and
    is caller-specific, providing a practical barrier. However, there is no principled assertion
    that ownerActorId sent the message identified by messageId. If storageKey is predictable,
    shared, or obtained through a separate leak, another actor could replace the attachment
    media_asset_id reference on another actor's message.
- Evidence:
    // recordChatAttachment.controller.js — ownerActorId used for media_asset creation only:
    const mediaAsset = await createMediaAssetController({
      mediaUploadResult, ownerActorId, createdByActorId: ownerActorId,
      scope: 'chat_attachment', scopeId: messageId ?? null, ...
    })
    // Then writeback — no sender check:
    await updateAttachmentMediaAssetIdDAL({ messageId, storageKey, mediaAssetId: mediaAsset.id })

    // updateAttachmentMediaAsset.write.dal.js — no actor ownership filter:
    await supabase.schema('chat').from('message_attachments')
      .update({ media_asset_id: mediaAssetId })
      .eq('message_id', messageId)
      .eq('storage_path', storageKey)  // storageKey is the practical guard — not an ownership assertion

- Existing Defense:   storage_path filter in the DAL UPDATE reduces the practical attack surface.
                      ownerActorId is used as the media_asset owner (platform.media_assets record).
- Why Defense Is Insufficient:
    storageKey is a file path, not a cryptographic binding of actor to message. No explicit
    assertion that ownerActorId === messages.sender_actor_id for messageId is performed.
    The controller never reads the message to verify sender identity.
- Recommended Fix:    Before calling updateAttachmentMediaAssetIdDAL, fetch the message and assert
                      sender_actor_id === ownerActorId. Throw if mismatch.
- Suggested Patch:    [human review — do not auto-apply]

    // apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js
    import { fetchMessageForAttachmentVerificationDAL } from '../dal/fetchMessageForAttachmentVerification.read.dal'
    // (new DAL — selects id, sender_actor_id from chat.messages where id = messageId)

    if (messageId && storageKey) {
      const msg = await fetchMessageForAttachmentVerificationDAL({ messageId })
      if (!msg || msg.sender_actor_id !== ownerActorId) {
        throw new Error('[recordChatAttachment] ownerActorId does not match message sender')
      }
      await updateAttachmentMediaAssetIdDAL({ messageId, storageKey, mediaAssetId: mediaAsset.id })
    }

- Follow-up Command:  DB (confirm RLS on chat.message_attachments UPDATE)
```

---

### ELEK-2026-06-04-005

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-005
- Title:              Message privacy settings (whoCanMessage / allowNewMessageRequests) are localStorage-only — zero server enforcement; any actor can message any other actor
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM + ENGINE
- Location:           apps/VCSM/src/features/chat/inbox/hooks/useMessagePrivacySettings.js:53-96
                      engines/chat/src/controller/startDirectConversation.controller.js:25-79
- Source:             whoCanMessage, allowNewMessageRequests — stored in and read from localStorage only
- Sink:               startDirectConversation.controller.js — creates/opens conversation without reading target actor's privacy preference
- Trust Boundary:     startDirectConversation.controller.js — should check target actor's message privacy settings before creating the conversation
- Impact:
    An actor with whoCanMessage = 'nobody' or whoCanMessage = 'following' receives no server-side
    protection. Any other actor can call startDirectConversation({ fromActorId, picked: { actorId: targetId } })
    and the conversation will be created. The target actor's privacy preference is never consulted
    server-side. The setting only affects the local UI of the actor who set it — an attacker can
    bypass it entirely by making a direct API call or using a different client.
- Evidence:
    // useMessagePrivacySettings.js — reads and writes localStorage only:
    const STORAGE_KEY = 'vc.message_privacy_settings'
    const raw = window.localStorage.getItem(STORAGE_KEY)
    // No server read. No server write. No actor profile column read.

    // startDirectConversation.controller.js — block check present, privacy check absent:
    const isBlocked = (await listUserBlockRowsBetweenActorsDAL({ actorA: fromActorId, actorB: toActorId })).length > 0
    if (isBlocked) { throw }  // ← block IS enforced server-side
    // No corresponding: await readTargetActorPrivacySetting(toActorId) — ABSENT

- Existing Defense:   Block relationship IS enforced server-side (confirmed in startDirectConversation.controller.js:45-51).
                      whoCanMessage is validated client-side in the UI — prevents the UI from showing the
                      start conversation button. No server-side enforcement.
- Why Defense Is Insufficient:
    Client-side UI gate is trivially bypassed. localStorage is client-controlled state.
    Privacy preferences stored only in localStorage are not persisted across devices, not enforced
    by the server, and have no RLS backing.
- Recommended Fix:
    (1) Persist whoCanMessage and allowNewMessageRequests to the actor's DB record (actor profile or
        a separate actor_settings table).
    (2) In startDirectConversation.controller.js, read the target actor's privacy settings from the
        DB and throw if toActorId.whoCanMessage = 'nobody' (or 'following' and fromActor is not
        following toActor).
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/controller/startDirectConversation.controller.js
    // After block check, before getOrCreateDirectConversation:
    const targetPrivacy = await readActorMessagePrivacyDAL({ actorId: toActorId })
    if (targetPrivacy?.who_can_message === 'nobody') {
      throw new Error('[chat/start] target actor does not accept messages')
    }
    if (targetPrivacy?.who_can_message === 'following') {
      const isFollowing = await checkFollowRelationDAL({ followerId: fromActorId, followeeId: toActorId })
      if (!isFollowing) throw new Error('[chat/start] target actor only accepts messages from people they follow')
    }

- Follow-up Command:  DB (design actor_settings schema for privacy columns), Carnage (migration for new column)
```

---

## Low Findings

---

### ELEK-2026-06-04-006

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-006
- Title:              openConversation.rpc.js — unconditional production console.log of actorId, conversationId, and conversation metadata
- Category:           Secrets Exposure (information disclosure)
- Severity:           LOW
- Status:             Open
- Scope:              ENGINE
- Location:           engines/chat/src/dal/openConversation.rpc.js:15, 28-33, 49-54, 93-99
- Source:             actorId, conversationId, membership row, conversation row — all DB-sourced
- Sink:               console.log — browser console output (no DEV guard)
- Trust Boundary:     openConversation.rpc.js module top-level — no import.meta.env.DEV check
- Impact:
    In production, every call to openConversation (triggered on every ConversationScreen load)
    emits actorId, conversationId, memberRow details, and conversation metadata including realm_id
    to the browser console. This data can be captured by:
    - Browser extensions with console access
    - Error monitoring tools forwarding console output (e.g. Sentry breadcrumbs)
    - Developer tools screenshots or session recordings
    These logs expose internal correlation data (actor↔conversation mapping) for every user session.
- Evidence:
    console.log('[openConversation] START', { conversationId, actorId })                    // line 15
    console.log('[openConversation] MEMBER CHECK', { conversationId, actorId, memberRow })  // lines 28-33
    console.log('[openConversation] REACTIVATE RESULT', { conversationId, actorId, ... })   // lines 49-54
    console.log('[openConversation] CONVERSATION FETCH', { conversationId, actorId, convo }) // lines 93-99
- Existing Defense:   None — no DEV guard at module or call level.
- Why Defense Is Insufficient:
    The engine runs in a client-side context (React app). console.log in engine DAL files is not
    filtered or stripped at build time unless explicit tree-shaking is applied.
- Recommended Fix:    Remove all console.log calls from openConversation.rpc.js, or wrap each in
                      if (import.meta.env?.DEV) before logging.
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/dal/openConversation.rpc.js
    // Wrap each log:
    if (import.meta.env?.DEV) {
      console.log('[openConversation] START', { conversationId, actorId })
    }
    // Apply same pattern to all 4 console.log blocks.

- Follow-up Command:  Deadpool (verify no other engine DAL files have unguarded console.logs)
```

---

### ELEK-2026-06-04-007

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-007
- Title:              updateInboxFlags DAL accepts arbitrary flags object spread directly into UPDATE — no column allowlist at controller or DAL layer
- Category:           Controller Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              ENGINE
- Location:           engines/chat/src/dal/inbox.write.dal.js:155-176
                      engines/chat/src/controller/inboxActions.controller.js:7-9
- Source:             flags object from controller caller
- Sink:               supabase UPDATE chat.inbox_entries SET ...flags WHERE actor_id = ? AND conversation_id = ?
- Trust Boundary:     ctrlUpdateInboxFlags — does not restrict which keys are allowed in flags
- Impact:
    The flags object is passed directly to .update(flags) in the DAL. Any key present in the
    flags object is written to the inbox_entries row. Current callers (useInboxActions hook)
    pass only { pinned: true/false } or { muted: true/false } — hardcoded constants, not user input.
    If a future caller passes user-controlled content in flags, arbitrary inbox_entries columns
    could be overwritten (e.g., folder, unread_count, archived, last_message_at).
- Evidence:
    // inbox.write.dal.js:166-173
    const { error } = await supabase
      .schema('chat').from('inbox_entries')
      .update(flags)  // ← arbitrary object spread — no allowlist
      .eq('actor_id', actorId)
      .eq('conversation_id', conversationId)
- Existing Defense:   Current callers use hardcoded flag objects (not user-supplied). Supabase
                      rejects columns that don't exist in the table schema.
- Why Defense Is Insufficient:
    Structural risk: the pattern will permit column injection if flags is ever sourced from
    user-controlled input. Supabase schema rejection is not a security control — it catches
    typos, not malicious keys.
- Recommended Fix:    Extract explicit allowed columns in the DAL. Accept pinned and muted only,
                      not an arbitrary flags object.
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/dal/inbox.write.dal.js
    const ALLOWED_FLAG_COLUMNS = new Set(['pinned', 'muted'])
    export async function updateInboxFlags({ actorId, conversationId, flags = {} }) {
      const safeFlags = Object.fromEntries(
        Object.entries(flags).filter(([k]) => ALLOWED_FLAG_COLUMNS.has(k))
      )
      if (Object.keys(safeFlags).length === 0) return
      // ... rest of function using safeFlags
    }

- Follow-up Command:  None — hygiene patch
```

---

### ELEK-2026-06-04-008

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-008
- Title:              moveConversationToFolder — folder value not validated against allowlist before DB upsert
- Category:           Controller Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              ENGINE
- Location:           engines/chat/src/controller/inboxActions.controller.js:23-33
                      engines/chat/src/dal/inbox.write.dal.js:218-255
- Source:             folder string from controller caller
- Sink:               supabase UPSERT chat.inbox_entries SET folder = ? WHERE actor_id = ? AND conversation_id = ?
- Trust Boundary:     ctrlMoveConversationToFolder — accepts folder without allowlist validation
- Impact:
    An arbitrary folder string can be written to inbox_entries.folder. Current callers pass
    hardcoded values ('inbox', 'spam'). If the folder column is a text type (not DB enum),
    an arbitrary string can be injected — potentially breaking inbox filter queries that rely
    on known folder values, or creating ghost folder buckets with no UI path.
- Evidence:
    // inboxActions.controller.js:23-27
    export async function ctrlMoveConversationToFolder({ actorId, conversationId, folder }) {
      return moveConversationToFolder({ actorId, conversationId, folder })  // no validation
    }

    // inbox.write.dal.js:227 — folder upserted directly:
    const patch = { folder }
- Existing Defense:   Current callers use hardcoded folder strings. DB schema type unknown.
- Why Defense Is Insufficient:
    If folder column is text (not an enum), arbitrary values pass through. No allowlist exists
    at controller or DAL layer.
- Recommended Fix:    Add allowlist in ctrlMoveConversationToFolder before calling DAL.
- Suggested Patch:    [human review — do not auto-apply]

    // engines/chat/src/controller/inboxActions.controller.js
    const VALID_FOLDERS = new Set(['inbox', 'spam', 'archived', 'requests'])
    export async function ctrlMoveConversationToFolder({ actorId, conversationId, folder }) {
      if (!VALID_FOLDERS.has(folder)) {
        throw new Error(`[ctrlMoveConversationToFolder] invalid folder: ${folder}`)
      }
      return moveConversationToFolder({ actorId, conversationId, folder })
    }

- Follow-up Command:  DB (confirm folder column type — if DB enum, this is INFO-only)
```

---

## Info Findings

---

### ELEK-2026-06-04-009

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-009
- Title:              chatBadgeDebugger.js and chatNavDebugger.js isEnabled() defaults to true — no module-level DEV guard (defense-in-depth gap)
- Category:           Secrets Exposure (information disclosure — partial)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js:17-21
                      apps/VCSM/src/features/chat/debug/chatNavDebugger.js:42-47
- Source:             actorId, conversationId — passed to debugger methods
- Sink:               console.log — would emit in production if module imported without DEV guard
- Trust Boundary:     isEnabled() function — defaults true when window flag not set
- Impact:
    CURRENT CODE: call sites are all properly DEV-guarded.
    - chatBadgeDebugger.js: both call sites (chatUnread.controller.js:3-10, bootstrap.invalidate.js:12-17)
      use `if (!DEV) return null` — module never imported in production. SAFE.
    - chatNavDebugger.js: ConversationView.jsx uses `if (!DEV) return` before all chatNavDbg calls. SAFE.
    RISK: any future call site that imports these debugger modules without a DEV guard will activate
    console.log output of actorId and conversationId in production, with no module-level safeguard to prevent it.
- Evidence:
    // chatBadgeDebugger.js:17-21
    function isEnabled() {
      if (typeof window === 'undefined') return false
      if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
      return true  // ← default ON — no DEV check
    }

    // chatNavDebugger.js:42-47
    function isEnabled() {
      if (typeof window === 'undefined') return true  // ← SSR path also returns true
      if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
      return true  // ← default ON — no DEV check
    }
- Existing Defense:   All current call sites have DEV guards before importing or calling these modules.
- Recommended Fix:    Add `if (typeof import.meta.env?.DEV === 'undefined' || !import.meta.env.DEV) return false`
                      as the first line in isEnabled() in both debugger files.
- Suggested Patch:    [human review — do not auto-apply]

    function isEnabled() {
      if (!import.meta.env?.DEV) return false  // ← module-level DEV guard
      if (typeof window === 'undefined') return false
      if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
      return true
    }

- Follow-up Command:  None — INFO-level hardening
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:       chatBadgeDebugger / chatNavDebugger production activation at MEDIUM severity (VEN-CHAT-004, BW-CHAT-005)
- Location:        apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js
                   apps/VCSM/src/features/chat/debug/chatNavDebugger.js
- Rejection reason: Chain broken at import — both modules are guarded at their call sites
- Chain gap:        Sink (console.log) — never reached in production because module is never imported without DEV guard
- Notes:           Retained as INFO-level defense-in-depth gap (ELEK-2026-06-04-009).
                   VEN-CHAT-004 and BW-CHAT-005 are valid architectural concerns but the specific
                   HIGH/MEDIUM claim is not supported by the full source trace.
```

```
FALSE POSITIVE REJECTED

- Candidate:       editMessage sender check completely absent at HIGH severity (VEN-CHAT-002 partial)
- Location:        engines/chat/src/controller/editMessage.controller.js:41-58
- Rejection reason: Application-layer sender ownership check IS present at controller level
- Chain gap:        Trust Boundary — defense is present (confirmed at line 51: msg.sender_actor_id !== actorId throws)
- Notes:           Retained as MEDIUM (ELEK-2026-06-04-003) — the DAL sink lacks the SQL-layer sender
                   filter and RLS is unconfirmed. The single-layer defense concern from VEN-CHAT-002 is valid
                   but the severity is MEDIUM (controller defense present), not HIGH.
```

```
FALSE POSITIVE REJECTED

- Candidate:       actorId from client payload / identity spoofing in inbox actions at HIGH severity
- Location:        engines/chat/src/hooks/useInboxActions.js
- Rejection reason: actorId is session-derived in all call paths
- Chain gap:        Source — actorId flows from useIdentity() → Supabase session (not a client-provided payload)
- Notes:           The concern is that actorId is passed as a parameter through the hook→controller chain,
                   which looks like "actorId from prop." However, the source in ConversationView.jsx is
                   `const actorId = identity?.actorId ?? null` from useIdentity() (session-derived).
                   The IDOR risk is at the conversationId input, not the actorId input. Retained as MEDIUM
                   (ELEK-2026-06-04-002) for the missing membership check — not as an actorId spoofing path.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | ensureConversationMembership silent re-join | HIGH | Engine / Controller | SIMPLE | NO (behavior-only; confirm status enum with DB) |
| 2 | ELEK-2026-06-04-002 | inboxActions no membership check | MEDIUM | Engine / Controller | SIMPLE | NO |
| 3 | ELEK-2026-06-04-003 | editMessageDAL no sender_actor_id filter | MEDIUM | Engine / DAL + RLS | SIMPLE | YES (RLS policy on chat.messages UPDATE) |
| 4 | ELEK-2026-06-04-004 | recordChatAttachment no sender assertion | MEDIUM | VCSM / Controller + new DAL | MODERATE | NO |
| 5 | ELEK-2026-06-04-005 | whoCanMessage localStorage-only | MEDIUM | VCSM + Engine / Controller + DB | COMPLEX | YES (new actor_settings or profile column) |
| 6 | ELEK-2026-06-04-006 | openConversation production console.log | LOW | Engine / DAL | SIMPLE | NO |
| 7 | ELEK-2026-06-04-007 | updateInboxFlags flags spread no allowlist | LOW | Engine / DAL | SIMPLE | NO |
| 8 | ELEK-2026-06-04-008 | moveConversationToFolder no folder allowlist | LOW | Engine / Controller | SIMPLE | NO (confirm DB enum) |
| 9 | ELEK-2026-06-04-009 | Debugger isEnabled() no DEV guard | INFO | VCSM / Debug modules | SIMPLE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime re-verification of ELEK-001 (ensureConversationMembership) after patch | PENDING |
| DB | Confirm RLS policy on chat.inbox_entries UPDATE (ELEK-002) | PENDING |
| DB | Confirm or create RLS policy on chat.messages UPDATE scoped to sender_actor_id (ELEK-003) | PENDING |
| DB | Confirm RLS on chat.message_attachments UPDATE (ELEK-004) | PENDING |
| DB | Confirm inbox_entries.folder column type — text or enum (ELEK-008) | PENDING |
| Carnage | Migration for actor privacy settings DB column if not present (ELEK-005) | PENDING |
| Deadpool | Audit remaining engine DAL files for unguarded console.log patterns (ELEK-006 scope) | PENDING |
| Thor | ELEK-2026-06-04-001 is a release blocker — gate evaluation required | PENDING |

---

## THOR Release Blockers

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-2026-06-04-001 | HIGH | ensureConversationMembership silent re-join via sendMessage | OPEN — BLOCKER |

MEDIUM findings (ELEK-002 through ELEK-005) are THOR CAUTION — require mitigation plan before release but do not hard-block.

---

## Cross-Reference to Prior VENOM and BLACKWIDOW Findings

| VENOM/BW ID | ELEKTRA Verdict | ELEK ID |
|---|---|---|
| VEN-CHAT-001 / BW-CHAT-001 | CONFIRMED — code-level chain complete; application-layer defense absent | ELEK-2026-06-04-002 |
| VEN-CHAT-002 | PARTIALLY CONFIRMED — controller check present (severity downgraded to MEDIUM); DAL unguarded; RLS unconfirmed | ELEK-2026-06-04-003 |
| VEN-CHAT-003 / BW-CHAT-004 | CONFIRMED — localStorage-only; server enforcement absent | ELEK-2026-06-04-005 |
| VEN-CHAT-004 / BW-CHAT-005 | PARTIALLY REJECTED — call sites DEV-guarded; downgraded to INFO | ELEK-2026-06-04-009 |
| VEN-CHAT-005 | OUT OF SCOPE — BEHAVIOR.md governance gap; not a code vulnerability |  |
| BW-CHAT-002 | CONFIRMED and ESCALATED — code-level chain now fully traced; confirmed HIGH | ELEK-2026-06-04-001 |
| BW-CHAT-006 | CONFIRMED | ELEK-2026-06-04-004 |
| BW-CHAT-007 | CONFIRMED | ELEK-2026-06-04-006 |
| BW-CHAT-008 | OUT OF SCOPE for this ELEKTRA pass — race condition in React hook; requires BLACKWIDOW runtime analysis | — |
| BW-CHAT-003 | OUT OF SCOPE (Area 07 — URL/Redirect) — not covered in this pass | — |
