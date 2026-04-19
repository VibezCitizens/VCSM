# Chat Engine Architecture Audit

Audited: 2026-03-31
Scope: engines/chat/src/ verified against actual chat.* schema

---

## A. Current Architecture Summary

The chat engine has **111 files** across DAL, model, service, controller, hook, adapter, rule, util, and type layers. It queries 3 schemas: `chat` (primary), `vc` (actor identity/blocking), and `public` (implicit via schemaless RPC).

The engine was originally built against the VC/Vibez schema, then migrated to a `chat` schema target. During migration, code was written against an **intended future schema** (with `actor_source` columns, `is_group`/`is_stealth`/`is_announcement` boolean flags) that was never applied to the live database. The live schema uses `conversation_kind` and `access_mode` enums instead of boolean flags, and has no `actor_source` columns.

---

## B. Active Runtime Ownership Map

| Layer | Owner | Status |
|-------|-------|--------|
| DAL (chat schema queries) | Engine | Mostly clean after recent fixes |
| DAL (vc schema queries) | Engine — VC-coupled | 3 files hardcode vc schema |
| DAL (RPC calls) | Engine | 3 RPCs, 1 is VC-specific name |
| Models | Engine | 4 models read non-existent columns |
| Services | Engine | actorSource references harmless but misleading |
| Controllers | Engine | actorSource params accepted but unused at DAL |
| Hooks | Engine | Clean — zero coupling |
| Adapters | Engine | Clean |
| Rules | Engine | Clean — domain-agnostic |
| Config | Engine (DI) | Clean pattern, actorSource config unused |

---

## C. Confirmed Shared-Safe Engine Surfaces

These files query only `chat.*` tables using columns that exist in the real schema:

**DAL (33 of 38 files clean):**
- conversationMembers.read.dal.js
- conversationMembers.partner.read.dal.js
- conversationMembership.read.dal.js
- conversationMembership.write.dal.js
- conversationRead.read.dal.js
- conversationRead.write.dal.js
- deleteThreadForMe.dal.js
- editMessage.write.dal.js
- inbox.entry.read.dal.js
- inbox.read.dal.js
- inbox_entries.write.dal.js
- legacyMappings.dal.js
- messageForEdit.read.dal.js
- messageReactions.write.dal.js
- messageReceipts.write.dal.js
- messageVisibility.read.dal.js
- messages.last.read.dal.js
- messages.timeline.read.dal.js
- messages.write.dal.js
- moderationActions.write.dal.js
- openConversation.rpc.js
- outbox.write.dal.js
- pins.write.dal.js
- savedMessages.write.dal.js
- subscribeToConversation.js
- subscribeToInbox.js
- typingPresence.dal.js
- typingStates.write.dal.js
- attachments.write.dal.js

**All hooks (9 files):** Zero VC or learning coupling.
**All rules (2 files):** Domain-agnostic.
**Adapters (2 files):** Clean.
**Events (1 file):** Clean.
**Config (1 file):** Clean DI pattern.

---

## D. Confirmed VC/Vibez Coupling Inside the Engine

### Direct VC Schema Access (4 files — CRITICAL)

| File | Table/RPC | Purpose | Wentrex Impact |
|------|-----------|---------|----------------|
| `dal/searchActors.dal.js` | `vc.actor_presentation` | Actor search by name | Fails if vc.actor_presentation doesn't exist |
| `dal/actorRealm.read.dal.js` | `vc.actors` | Realm context via `is_void` | VC-specific concept |
| `dal/blockRelations.read.dal.js` | `vc.user_blocks` | Block relationship check | VC-specific table |
| `dal/getOrCreateDirectConversation.rpc.js` | `chat.vc_get_or_create_one_to_one` RPC | Direct conversation creation | RPC doesn't exist in chat schema |

### VC Actor Kind Concepts (3 files)

| File | Concept | Details |
|------|---------|---------|
| `model/lib/memberActorPresentation.js` | `kind === 'vport'` | Vport-specific display name/avatar resolution |
| `model/lib/resolvePartnerActor.js` | `kind === 'vport'` | Vport-aware partner display |
| `controller/startDirectConversation.controller.js` | `actor.is_void` | VC realm context |

### Cosmetic VC References (3 files — LOW)

| File | Reference | Impact |
|------|-----------|--------|
| `dal/subscribeToInbox.js` | Channel name `vc-inbox-{actorId}` | Cosmetic only |
| `dal/subscribeToConversation.js` | Channel name `vc-conversation-{id}` | Cosmetic only |
| `dal/typingPresence.dal.js` | Channel name `vc-typing-{id}` | Cosmetic only |

---

## E. Confirmed Wentrex/Learning Coupling Inside the Engine

None in the engine code itself. The engine is learning-unaware. Wentrex coupling exists only in:
- `apps/wentrex/src/features/communication/setup.js` — configures engine with `defaultActorSource: 'learning'`
- `apps/wentrex/src/features/communication/policy/wentrexMessagingPolicy.js` — injected policy

---

## F. Broken or Unsafe Schema Assumptions

### CRITICAL: Non-Existent Columns Written or Read

| Column | Table | Referenced In | Real Status |
|--------|-------|---------------|-------------|
| `is_group` | conversations | `conversations.write.dal.js:57,177` | **Does NOT exist** — use `conversation_kind` |
| `is_active` | conversation_members | `conversations.write.dal.js:249` | **Does NOT exist** — use `membership_status` |
| `is_stealth` | conversations | `Conversation.model.js:27` | **Does NOT exist** |
| `is_announcement` | conversations | `Conversation.model.js:34`, `InboxEntry.model.js:64` | **Does NOT exist** — use `access_mode = 'announcement'` |
| `created_by_actor_source` | conversations | `Conversation.model.js:35` | **Does NOT exist** |
| `sender_actor_source` | messages | `Message.model.js:21` | **Does NOT exist** |
| `actor_source` | conversation_members | `ConversationMember.model.js:14` | **Does NOT exist** |
| `actor_source` | inbox_entries | `InboxEntry.model.js:45` | **Does NOT exist** |

### CRITICAL: Non-Existent Table

| Table | Referenced In | Real Status |
|-------|---------------|-------------|
| `chat.reports` | `dal/reports.write.dal.js:34` | **Does NOT exist** in schema |

### CRITICAL: Non-Existent RPC

| RPC | Referenced In | Real Status |
|-----|---------------|-------------|
| `vc_get_or_create_one_to_one` | `dal/getOrCreateDirectConversation.rpc.js:18` | **Does NOT exist** in chat schema |

### WARNING: RPC Without Schema Prefix

| RPC | Referenced In | Issue |
|-----|---------------|-------|
| `increment_inbox_unread` | `dal/inbox.write.dal.js:69` | Called without `.schema('chat')` — may hit wrong schema |

---

## G. RPC Usage Audit

| RPC Name | File | Schema | Status |
|----------|------|--------|--------|
| `vc_get_or_create_one_to_one` | getOrCreateDirectConversation.rpc.js:18 | chat | **BROKEN** — VC-named RPC doesn't exist in chat schema |
| `open_conversation` | openConversation.rpc.js:85 | chat | **UNCERTAIN** — need to verify this function exists |
| `next_message_seq` | messages.write.dal.js:40 | chat | **UNCERTAIN** — need to verify this function exists |
| `increment_inbox_unread` | inbox.write.dal.js:69 | (none specified) | **WARNING** — no schema prefix, may fail |

---

## H. Query/Embed Audit

### Inbox Load Query (inbox.read.dal.js)

```
inbox_entries → last_message:messages!chat_inbox_entries_last_message_fk(...)
             → conversation:conversations(
                 members:conversation_members(...)
               )
```

**Status:** Clean after recent fixes. FK hint matches real constraint name.

### Conversation Members Query (conversationMembers.read.dal.js)

```
conversation_members → actor_id, role, membership_status, can_post, can_manage, can_moderate
```

**Status:** Clean — all columns exist.

### Conversation Open (openConversation.rpc.js fallback)

```
conversations → id, conversation_kind, access_mode, visibility, scope_kind, scope_id, created_by_actor_id, title, avatar_url, ...
```

**Status:** Clean — all columns exist.

---

## I. Realtime Subscription Audit

| File | Schema | Table | Filter | Status |
|------|--------|-------|--------|--------|
| subscribeToInbox.js | chat | inbox_entries | actor_id | Clean |
| subscribeToConversation.js | chat | messages | conversation_id | Clean |
| subscribeToConversation.js | chat | conversations | id | Clean |
| typingPresence.dal.js | N/A | N/A (presence) | N/A | Clean |

All subscriptions use `schema: 'chat'`. Channel names use `vc-` prefix (cosmetic, not functional).

---

## J. Dead, Duplicate, or Partially Migrated Files

### Confirmed Dead

| File | Reason |
|------|--------|
| `dal/reports.write.dal.js` | References `chat.reports` table that doesn't exist |

### Partially Migrated (Code vs Schema Mismatch)

| File | Issue |
|------|-------|
| `dal/conversations.write.dal.js` | Writes `is_group` and `is_active` — columns don't exist |
| `model/Conversation.model.js` | Reads `is_stealth`, `is_announcement`, `created_by_actor_source` — don't exist |
| `model/Message.model.js` | Reads `sender_actor_source` — doesn't exist |
| `model/ConversationMember.model.js` | Reads `actor_source` — doesn't exist |
| `model/InboxEntry.model.js` | Reads `actor_source`, `is_announcement` — don't exist |

### VC-Coupled (Not Dead, But Not Wentrex-Safe)

| File | VC Dependency |
|------|---------------|
| `dal/searchActors.dal.js` | Queries `vc.actor_presentation` |
| `dal/actorRealm.read.dal.js` | Queries `vc.actors` |
| `dal/blockRelations.read.dal.js` | Queries `vc.user_blocks` |
| `dal/getOrCreateDirectConversation.rpc.js` | Calls VC RPC |
| `model/lib/memberActorPresentation.js` | Vport kind logic |
| `model/lib/resolvePartnerActor.js` | Vport kind logic |

### Harmless But Misleading (actorSource Plumbing)

12+ service/controller files accept `actorSource` parameters and call `getDefaultActorSource()`. These values flow through to DAL functions that now silently ignore them. Not broken, but misleading.

---

## K. Wentrex-Safe vs VC-Safe Flow Matrix

| Flow | Wentrex | VC | Shared | Notes |
|------|---------|-----|--------|-------|
| Inbox load | SAFE | Uncertain | Yes | Clean query path |
| Conversation open | SAFE | Uncertain | Yes | Fallback path clean |
| Message timeline load | SAFE | Uncertain | Yes | Clean query |
| Message send | SAFE | Uncertain | Yes | Clean write path |
| Direct conversation create | **BROKEN** | Uncertain | No | `vc_get_or_create_one_to_one` RPC doesn't exist |
| Announcement create | **BROKEN** | Uncertain | No | Uses `materializeConversation` which calls `is_group` write |
| Conversation create (policy) | **BROKEN** | Uncertain | No | `conversations.write.dal.js` writes `is_group` |
| Mark read | SAFE | Uncertain | Yes | Clean write |
| Archive/move folder | SAFE | Uncertain | Yes | Clean write |
| Actor search | **BROKEN** | Likely works | No | Requires `vc.actor_presentation` |
| Block check | **BROKEN** | Likely works | No | Requires `vc.user_blocks` |
| Reactions | SAFE | Uncertain | Yes | Clean |
| Pins | SAFE | Uncertain | Yes | Clean |
| Typing | SAFE | Uncertain | Yes | Clean |
| Receipts | SAFE | Uncertain | Yes | Clean |
| Mark spam | SAFE | Uncertain | Yes | Clean |

---

## L. Risks and Hidden Coupling

1. **conversations.write.dal.js writes `is_group`** — every conversation creation will fail at the database level
2. **conversations.write.dal.js writes `is_active: false`** — deactivateMember will fail
3. **`vc_get_or_create_one_to_one` RPC** — direct conversation creation is completely broken for Wentrex
4. **Models silently produce null/false for non-existent columns** — `isStealth: false`, `senderActorSource: null`, `actorSource: null` — not broken but semantically wrong
5. **`increment_inbox_unread` RPC has no schema prefix** — may silently fail or hit wrong schema
6. **`chat.reports` table doesn't exist** — any spam report flow that reaches this DAL will fail
7. **`vc.actor_presentation` required by searchActors** — Wentrex contact search may fail if this view doesn't exist in the shared DB

---

## M. Required Cleanup Order

### P0 — Blocking Wentrex Runtime (fix now)

1. **`conversations.write.dal.js`** — Remove `is_group` writes (lines 57, 177) and `is_active` write (line 249). Use `conversation_kind` and `membership_status` instead.
2. **`getOrCreateDirectConversation.rpc.js`** — Replace `vc_get_or_create_one_to_one` RPC with standard DAL calls (find by `dedupe_key` or create with `createConversation` + `addConversationMembers`).
3. **`inbox.write.dal.js`** — Add `.schema('chat')` to the `increment_inbox_unread` RPC call.

### P1 — Should Fix Soon

4. **Models** — Remove reads of non-existent columns (`is_stealth`, `is_announcement`, `created_by_actor_source`, `sender_actor_source`, `actor_source`). Derive `isAnnouncement` from `access_mode === 'announcement'` only.
5. **`reports.write.dal.js`** — Delete (table doesn't exist) or quarantine.
6. **`searchActors.dal.js`** — Make the actor search provider injectable via config instead of hardcoding `vc.actor_presentation`.

### P2 — Important But Can Wait

7. **Channel name prefixes** — Rename `vc-inbox-`, `vc-conversation-`, `vc-typing-` to `chat-`.
8. **Vport presentation logic** — Make vport-aware display resolution optional.
9. **actorSource plumbing** — Remove misleading parameters from services/controllers that flow nowhere.

### P3 — Future

10. **Extract VC DALs into injectable adapters** — `actorRealm`, `blockRelations`, `searchActors` should be configurable per app.
11. **`is_void` realm resolution** — Abstract into config rather than hardcoding VC concept.

---

## N. What Should Be Frozen vs What Should Still Evolve

### Frozen — Do Not Touch

| Surface | Reason |
|---------|--------|
| Hooks (9 files) | Zero coupling, clean abstractions |
| Rules (2 files) | Domain-agnostic, well-structured |
| Adapters (2 files) | Clean public API |
| Events (1 file) | Generic event system |
| Config DI pattern | Correct architecture |
| Realtime subscriptions (schema: chat) | Correct after recent fix |

### Must Evolve (P0/P1)

| Surface | Issue |
|---------|-------|
| `conversations.write.dal.js` | Writes non-existent columns |
| `getOrCreateDirectConversation.rpc.js` | Calls non-existent RPC |
| `inbox.write.dal.js` | Missing schema on RPC |
| 4 model files | Read non-existent columns |
| `reports.write.dal.js` | References non-existent table |

### Should Evolve (P2/P3)

| Surface | Direction |
|---------|-----------|
| VC DAL files (3) | Extract into injectable adapters |
| Vport presentation | Make optional |
| actorSource plumbing | Remove when confirmed unnecessary |
| Channel name prefixes | Rename from `vc-` to `chat-` |
