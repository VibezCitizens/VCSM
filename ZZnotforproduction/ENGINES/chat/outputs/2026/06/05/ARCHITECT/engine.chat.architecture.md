# MODULE ARCHITECTURE REPORT

**Module:** engines/chat
**Application Scope:** VCSM + ENGINE
**Module Type:** Shared Domain Engine — Real-Time Messaging
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/chat/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The chat engine owns the full real-time messaging lifecycle: conversation creation, membership management, message send/edit/delete, inbox projection, typing state, reactions, attachments, pins, saved messages, moderation, and outbox event publishing.

The engine is neutral — it operates exclusively on the `chat` schema and delegates all app-specific identity, block checks, realm routing, and actor enrichment to injected dependencies.

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM (confirmed: `apps/VCSM/src/features/chat/setup.js`)
**CLAUDE.md references:** apps/vibez and apps/wentrex — legacy naming; VCSM is confirmed consumer. No Wentrex chat engine setup found.
**DI configured by:** `apps/VCSM/src/features/chat/setup.js`

---

## ENTRY POINTS

**Public API:** `engines/chat/index.js` → `src/adapters/index.js` → `src/adapters/chat.adapter.js`
**Alias:** `@chat` (used in setup.js)

**Exported surface (90+ symbols) — categories:**

| Category | Exports |
|----------|---------|
| Config | configureChatEngine |
| Events | EVENTS (16 constants), on, emit, createEventEnvelope, removeAllListeners |
| React Hooks | useInbox, useConversation, useConversationMessages, useConversationMembers, useInboxActions, useInboxEntryForConversation, useInboxFolder, useTypingChannel, useConversationGuards |
| Controllers | openConversation, getConversationMessages, getConversationMembers, readConversationMembers, ensureConversationMembership, evaluateConversationPolicy, createAllowedConversation, createAnnouncementConversation, createConversation, startDirectConversation, getOrCreateDirectConversation, sendMessage, editMessage, unsendMessage, markConversationRead, markConversationSpam, leaveConversation, searchDirectory, getInboxEntries, getInboxEntryForConversation, getUnreadCount, archiveConversationForActor, moveConversationToFolder, updateInboxFlags, getPermissionSnapshot, hideMessage, deleteInboxThread, deleteMessageForSelf, deleteMessage, hardDeleteMessage, deleteMessageAdmin |
| Services | addReaction, removeReaction, groupReactionsForMessage, markDelivered, markRead, attachFileToMessage, getAttachmentsForMessage, validateAttachment, startTyping, stopTyping, pruneStaleTypingStates, fetchPendingOutboxEvents, markOutboxEventPublished, markOutboxEventFailed |
| Models | MessageModel, ConversationMemberModel, InboxEntryModel, ConversationModel, createPermissionSnapshot |
| Model helpers | resolvePartnerActor, buildInboxPreview, generateClientId, generateMessageClientId |
| Constants | CONVERSATION_ROLES, MESSAGE_TYPES, INBOX_FLAGS, CONVERSATION_ACCESS_MODES |
| Permission predicates | canReadConversation, canSendMessage, isActorBlocked |
| Inbox utilities | DEFAULT_INBOX_VISIBILITY_SETTINGS, normalizeInboxVisibilitySettings, shouldShowInboxEntry, DEFAULT_VEX_SETTINGS, normalizeVexSettings, shouldHideFromInbox, isMuted, isArchived, isPinned, shouldHighlight |
| Pagination | encodeCursor, decodeCursor, buildPageInfo, resolveLimit, DEFAULT_PAGE_SIZE |
| Rules | isAnnouncementConversation, normalizeConversationAccessMode |

---

## LAYER MAP

```
config.js             — DI (10 injection points, no freeze guard)
events.js             — event bus (Map-based, Set per event) + 16 EVENTS constants
types/index.js        — JSDoc typedefs (no runtime code)

dal/ (31 files):
  actorRealm.read.dal.js                  — delegates to resolveActorRealmContext DI
  attachments.write.dal.js                — chat.message_attachments
  blockRelations.read.dal.js              — delegates to checkBlockRelation DI (fail-closed)
  conversationMembers.partner.read.dal.js — chat.conversation_members (direct partner lookup)
  conversationMembers.read.dal.js         — chat.conversation_members
  conversationMembership.read.dal.js      — chat.conversation_members (membership check)
  conversationMembership.write.dal.js     — chat.conversation_members (add/remove/update)
  conversationRead.read.dal.js            — chat.conversation_members (unread counts)
  conversationRead.write.dal.js           — chat.conversation_members + inbox_entries (read state)
  conversations.write.dal.js              — chat.conversations
  deleteThreadForMe.dal.js                — chat.message_visibility (soft delete for actor)
  editMessage.write.dal.js                — chat.messages (edit)
  getOrCreateDirectConversation.rpc.js    — chat RPC (get_or_create_direct_conversation)
  inbox.entry.read.dal.js                 — chat.inbox_entries (single entry)
  inbox.read.dal.js                       — chat.inbox_entries (list)
  inbox.write.dal.js                      — chat.inbox_entries
  inbox_entries.write.dal.js              — chat.inbox_entries (fan-out related)
  legacyMappings.dal.js                   — chat.legacy_mappings (R/W)
  messageForEdit.read.dal.js              — chat.messages (fetch for edit)
  messageReactions.write.dal.js           — chat.message_reactions
  messageReceipts.write.dal.js            — chat.message_receipts
  messageVisibility.read.dal.js           — chat.message_visibility
  messages.last.read.dal.js               — chat.messages (last message lookup)
  messages.timeline.read.dal.js           — chat.messages (timeline + unsend fields)
  messages.write.dal.js                   — chat.messages (write)
  moderationActions.write.dal.js          — chat.moderation_actions
  openConversation.rpc.js                 — chat RPC (open_conversation)
  outbox.write.dal.js                     — chat.outbox_events
  pins.write.dal.js                       — chat.conversation_pins
  savedMessages.write.dal.js              — chat.saved_messages
  searchActors.dal.js                     — delegates to searchActors DI
  sendMessageAtomic.rpc.dal.js            — chat RPC (send_message_atomic)
  subscribeToConversation.js              — Supabase Realtime channel subscription
  subscribeToInbox.js                     — Supabase Realtime channel subscription
  typingPresence.dal.js                   — delegates to typingStates
  typingStates.write.dal.js               — chat.typing_states

model/ (13 files):
  Conversation.model.js
  ConversationMember.model.js
  DirectorySearchResult.model.js
  InboxEntry.model.js
  Message.model.js
  PermissionSnapshot.model.js
  vexSettings.model.js
  constants/conversationRoles.js          — CONVERSATION_ROLES enum + predicates
  constants/inboxFlags.js                 — INBOX_FLAGS + predicates
  constants/messageTypes.js               — MESSAGE_TYPES + predicates
  lib/buildInboxPreview.js
  lib/generateClientId.js
  lib/memberActorPresentation.js
  lib/normalizeMessage.js
  lib/resolvePartnerActor.js
  permissions/canReadConversation.js
  permissions/canSendMessage.js
  permissions/isActorBlocked.js

services/ (10 files):
  attachmentService.js
  conversationLifecycleService.js
  conversationPolicyService.js
  domainEventService.js
  legacyMappings.service.js
  messageService.js                       — idempotentSendMessage, assertMessageHasContent
  outboxService.js
  reactionService.js
  receiptService.js
  typingService.js

hooks/ (9 files — REACT in engine):
  useConversation.js
  useConversationGuards.js
  useConversationMembers.js
  useConversationMessages.js
  useInbox.js
  useInboxActions.js
  useInboxEntryForConversation.js
  useInboxFolder.js
  useTypingChannel.js

controller/ (21 files):
  createAllowedConversation.controller.js
  createAnnouncementConversation.controller.js
  deleteMessage.controller.js
  deleteMessageForMe.controller.js
  deleteThreadForMe.controller.js
  editMessage.controller.js
  ensureConversationMembership.controller.js
  evaluateConversationPolicy.controller.js
  getConversationMembers.controller.js
  getConversationMessages.controller.js
  getInboxEntries.controller.js
  getInboxEntryForConversation.controller.js
  getOrCreateDirectConversation.controller.js
  inboxActions.controller.js
  leaveConversation.controller.js
  markConversationRead.controller.js
  markConversationSpam.controller.js
  openConversation.controller.js
  permissions.controller.js
  resolvePickedToActorId.controller.js
  searchDirectory.controller.js
  sendMessage.controller.js
  startDirectConversation.controller.js
  typingPresence.controller.js
  unsendMessage.controller.js

rules/ (2 files):
  conversationAccess.rules.js
  conversationPolicy.rules.js

utils/ (4 files):
  actorRefs.js
  idempotency.js
  pagination.js
  transaction.js

adapters/ (2 files):
  chat.adapter.js    — all exports + wrapper functions
  index.js           — re-exports chat.adapter.js
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md, adapter header | — |
| Owner defined | PASS | VCSM setup.js | — |
| Entry points mapped | PASS | adapters/chat.adapter.js, 90+ exports | — |
| Controllers present | PASS | 21 controllers, comprehensive coverage | — |
| DAL/repository present | PASS | 31 DAL files, chat schema exclusively (+ 2 realtime subscriptions) | — |
| Models/transformers present | PASS | 13 model files + constants + permission predicates | — |
| Services present | PASS | 10 services | — |
| Hooks/view models present | ANOMALY | 9 React hooks in engine (src/hooks/) | CLAUDE.md says "DO NOT Implement: UI logic" — React hooks in engine violate scope boundary |
| Database objects mapped | PASS | 15 tables per CLAUDE.md + 3 RPCs confirmed | — |
| Authorization path mapped | PASS | sendMessage: block check → membership check → can_post. createAllowed: policy gate. Permission snapshot model. | Block check delegates to DI; fails closed if not configured |
| Cache/runtime behavior mapped | N/A | No in-memory cache in engine; Realtime via Supabase channels | — |
| Error/loading/empty states mapped | PARTIAL | Throws on critical failures; RPC errors propagate up | No retry logic |
| Documentation linked | PARTIAL | CLAUDE.md comprehensive; no BEHAVIOR.md or SECURITY.md | BEHAVIOR_CONTRACT_ABSENT |
| Tests/validation noted | PARTIAL | No test files found in engine directory | Full test gap |
| Native parity noted | N/A | Chat is platform-level | — |
| `note` file at engine root | ANOMALY | Planning document left in production code path | Must be removed before Blue Team |

---

## DEPENDENCY INJECTION — 10 INJECTION POINTS

| Point | Required | VCSM Value | Fail Behavior |
|-------|----------|------------|--------------|
| supabaseClient | REQUIRED | VCSM default supabase client | Throws on any DAL call |
| getActorSummariesByIds | REQUIRED | → @hydration engine | Throws if not configured |
| resolveRealm | REQUIRED | resolveRealm from VCSM shared utils | Throws if not configured |
| canModerateConversation | OPTIONAL | NOT INJECTED | Defaults: system=false; owner/admin=true |
| resolveConversationPolicy | OPTIONAL | NOT INJECTED | Falls back to conversationPolicy.rules.js default |
| normalizeHandleTerm | OPTIONAL | postgrestSafe.normalizeHandleTerm | Falls back to trim().toLowerCase() |
| toContainsPattern | OPTIONAL | postgrestSafe.toContainsPattern | Falls back to `%${q}%` |
| isUuid | OPTIONAL | postgrestSafe.isUuid | Falls back to regex |
| defaultActorSource | OPTIONAL | 'vc' | null |
| searchActors | OPTIONAL | identity.search_actor_directory RPC | Falls back to internal searchActors.dal.js (no-op without injector) |
| resolveActorRealmContext | OPTIONAL | vc.actors lookup | Falls back to null (uses resolveRealm(false)) |
| checkBlockRelation | OPTIONAL | moderation.blocks lookup | Fails CLOSED — returns synthetic blocked row + console.warn |
| legacyChatBridge | OPTIONAL | NOT INJECTED | null; legacy path skipped |

**No freeze guard:** `configureChatEngine()` merges on every call — same pattern as other engines.

---

## SEND MESSAGE — CRITICAL PATH

```
sendMessageController({ conversationId, actorId, body, ... })
│
├─ 1. Block check (direct conversations only)
│     → fetchDirectPartner (chat.conversation_members)
│     → listUserBlockRowsBetweenActorsDAL → checkBlockRelation DI
│         → No DI configured: FAIL CLOSED (synthetic blocked row)
│
├─ 2. Ensure membership (ensureConversationMembership)
│     → Chat.conversation_members upsert if not already member
│
├─ 3. Membership validation
│     → fetchConversationMember (chat.conversation_members)
│     → membership_status must be 'active', can_post must not be false
│
└─ 4. Atomic send (idempotentSendMessage → sendMessageAtomicDAL)
      → chat RPC: send_message_atomic
      → Atomically: message INSERT + attachments + conversation last_message
        + inbox_entries fan-out for all members + audit_log + outbox event
      → Idempotent on client_id (duplicate returns existing message)
      → publishMessageSentEvent (in-memory event, outbox handled by RPC)
```

---

## DATABASE SCHEMA: chat (exclusively)

All engine DAL files use `.schema('chat')`. No vc, vport, learning, platform, or notification queries inside the engine itself.
Cross-schema queries are delegated to injectors.

### Tables Accessed

| Table | Access | DAL File(s) |
|-------|--------|-------------|
| chat.conversations | READ/WRITE | conversations.write.dal.js, various reads |
| chat.conversation_members | READ/WRITE | conversationMembers.*.dal.js, conversationMembership.*.dal.js, conversationRead.*.dal.js |
| chat.messages | READ/WRITE | messages.timeline.read.dal.js, messages.write.dal.js, editMessage.write.dal.js, messageForEdit.read.dal.js |
| chat.message_attachments | READ/WRITE | attachments.write.dal.js, messages.timeline.read.dal.js (inner select) |
| chat.message_receipts | WRITE | messageReceipts.write.dal.js |
| chat.inbox_entries | READ/WRITE | inbox.read.dal.js, inbox.write.dal.js, inbox_entries.write.dal.js, inbox.entry.read.dal.js |
| chat.conversation_keys | UNKNOWN | referenced in CLAUDE.md, no DAL file found |
| chat.moderation_actions | WRITE | moderationActions.write.dal.js |
| chat.message_reactions | WRITE | messageReactions.write.dal.js |
| chat.typing_states | READ/WRITE | typingStates.write.dal.js |
| chat.participant_snapshots | UNKNOWN | referenced in CLAUDE.md, no DAL file found |
| chat.saved_messages | WRITE | savedMessages.write.dal.js |
| chat.conversation_pins | WRITE | pins.write.dal.js |
| chat.outbox_events | READ/WRITE | outbox.write.dal.js, outboxService.js |
| chat.audit_log | WRITE | via send_message_atomic RPC (not directly in DAL) |
| chat.legacy_mappings | READ/WRITE | legacyMappings.dal.js |
| chat.message_visibility | READ | messageVisibility.read.dal.js, deleteThreadForMe.dal.js |

**NOTE:** `chat.conversation_keys` and `chat.participant_snapshots` appear in CLAUDE.md schema list but no corresponding DAL files exist. These tables may be unused or were planned and not implemented.

### Database RPCs

| RPC | File | Operations |
|-----|------|-----------|
| chat.send_message_atomic | sendMessageAtomic.rpc.dal.js | Message + attachments + conversation update + inbox fan-out + audit_log + outbox event (6 operations atomically) |
| chat.get_or_create_direct_conversation | getOrCreateDirectConversation.rpc.js | Atomic direct conversation creation or retrieval |
| chat.open_conversation | openConversation.rpc.js | Opens conversation for actor (membership + inbox state) |

### Supabase Realtime (subscriptions)

| Channel | File | Purpose |
|---------|------|---------|
| subscribeToConversation | subscribeToConversation.js | Real-time message + member events for a conversation |
| subscribeToInbox | subscribeToInbox.js | Real-time inbox entry updates |

---

## CROSS-SCHEMA IN APP LAYER (DI injectors — not inside engine)

| Schema | Access | File | Purpose |
|--------|--------|------|---------|
| vc.actors | READ | setup.js (resolveActorRealmContext) | is_void check for realm routing |
| moderation.blocks | READ | setup.js (checkBlockRelation) | active block check (2-way) |
| identity.search_actor_directory | RPC | setup.js (searchActors) | Actor search for chat directory |
| @hydration engine | ENGINE-via-app | setup.js (getActorSummariesByIds) | Actor summary enrichment |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|------------|------|-----------|-------------------|-------|
| @supabase/supabase-js | external | ENGINE ← DI | YES | injected |
| @hydration | cross-engine via app | APP → ENGINE → DI | YES | VCSM's getActorSummariesByIds bridges to hydration |
| VCSM: features/chat/setup.js | app config | APP → ENGINE | YES | DI wiring |
| VCSM: features/chat/* | app consumer | APP → ENGINE | YES | hooks, controllers, etc. |
| apps/vibez, apps/wentrex | mentioned in CLAUDE.md | UNKNOWN | N/A | No Wentrex setup found — CLAUDE.md outdated |

---

## ARCHITECTURE ANOMALIES

### ANOM-CHAT-001: React Hooks in Engine (SCOPE VIOLATION)

**Location:** `engines/chat/src/hooks/` (9 hooks)
**Exported via:** `src/adapters/chat.adapter.js`
**CLAUDE.md rule:** "DO NOT Implement: UI logic / React hooks (app responsibility)"
**Finding:** The engine ships 9 React hooks (useConversation, useInbox, etc.). These are framework-specific (React) and couple the engine to the React runtime, violating the engine-agnostic rule in CLAUDE.md.
**Risk:** The engine cannot be used outside a React app without removing these hooks. The engine's neutrality claim is undermined.
**Mitigation path:** Move hooks to a VCSM-side `features/chat/hooks/` directory, consuming engine controllers. BEHAVIOR.md should document whether this move is planned.

### ANOM-CHAT-002: `note` File at Engine Root

**Location:** `engines/chat/note`
**Content:** Architecture planning notes about RLS design (not executable code)
**Risk:** Planning document living in production-deployed code path. Does not affect runtime but should not ship.
**Action:** Remove before Blue Team pass.

### ANOM-CHAT-003: `conversation_keys` and `participant_snapshots` Tables Unreferenced

**Location:** CLAUDE.md schema list vs DAL files
**Finding:** Two tables listed in the canonical schema (chat.conversation_keys, chat.participant_snapshots) have no corresponding DAL files. Either the tables were planned but not implemented, or they are managed outside the engine.
**Action:** Confirm whether these tables exist in DB; update CLAUDE.md if they are dropped.

### ANOM-CHAT-004: No DI Freeze Guard

**Pattern:** Same as identity and notifications engines. `configureChatEngine()` merges on every call.
**Risk:** Post-startup reconfiguration possible.

### ANOM-CHAT-005: Block Check Fails Closed Without Logging

**File:** `engines/chat/src/dal/blockRelations.read.dal.js`
**Issue:** If `checkBlockRelation` DI is not injected, the engine returns a synthetic blocked row and emits a `console.warn`. This is correct behavior (fail-closed) but uses `console.warn` which violates the no-console-log rule in project guidelines.
**Risk:** LOW (warn, not log). Should use debugReporter or a structured mechanism.

---

## BEHAVIOR CONSISTENCY CHECK — engines/chat

```
Behavior Consistency Check — engines/chat
===========================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 21 controllers, 10 services, 31 DAL files, 9 hooks exist with no BEHAVIOR.md
  → React hooks in engine (ANOM-CHAT-001) cannot be verified for behavior consistency
  → Severity: P0 (real-time messaging is user-facing critical path)

Check B (Behavior without source): SKIPPED — no BEHAVIOR.md
Check C (§13 engine consistency): SKIPPED — no BEHAVIOR.md
Check D (§6 data change consistency): SKIPPED — no BEHAVIOR.md
```

---

## SECURITY SURFACE

| Surface | Risk | Note |
|---------|------|------|
| Block check fail-closed | PASS | listUserBlockRowsBetweenActorsDAL returns synthetic block row when DI absent |
| send_message_atomic RPC | PASS | Server-side atomic operation — no multi-step client write races |
| Membership check in sendMessage | PASS | Active membership + can_post flag verified before RPC |
| No DI freeze guard | MEDIUM | Post-startup reconfiguration possible |
| React hooks in engine | MEDIUM | Engine is not framework-agnostic; hooks may carry security-relevant UI logic |
| console.warn on missing DI | LOW | Block check failure uses console.warn — violates no-console rule |
| No actor authorization inside getConversationMessages | UNKNOWN | Cannot assess without BEHAVIOR.md — whether actor must be a member before reading messages is unclear from source |
| No tests | HIGH | Real-time messaging engine with zero test coverage |

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/chat
Classification: PARTIALLY INDEPENDENT
Reason: Engine correctly uses DI for all cross-app concerns. chat schema exclusively in DAL.
  Atomic RPCs protect against multi-step write races.
Blocking anomalies:
  - React hooks in engine (ANOM-CHAT-001) — scope boundary violated
  - `note` file at engine root (ANOM-CHAT-002) — must be removed
  - No BEHAVIOR.md → Blue Team blocked
  - No SECURITY.md → VENOM/ELEKTRA blocked
  - No tests → zero confidence in real-time critical path
  - conversation_keys + participant_snapshots table references unresolved (ANOM-CHAT-003)
```

---

## MODULE BUILD PRIORITY

| Priority | Work | Reason | Owner |
|----------|------|--------|-------|
| P0 | Remove `engines/chat/note` file | Planning doc in production code path | WOLVERINE |
| P0 | BEHAVIOR.md | Blue Team blocked | WOLVERINE |
| P0 | Document React hooks scope decision | Hooks in engine violates CLAUDE.md; either move to apps/ or document exception | WOLVERINE |
| P1 | SECURITY.md | VENOM/ELEKTRA blocked | VENOM after BEHAVIOR |
| P1 | Add DI freeze guard | Consistency with booking engine ELEK-007 | WOLVERINE |
| P1 | Replace console.warn in blockRelations DAL | Violates no-console rule | WOLVERINE |
| P1 | Confirm conversation_keys + participant_snapshots DB status | Schema/DAL mismatch | CARNAGE |
| P2 | Test coverage | Zero tests on real-time critical path | SPIDER-MAN |
| P2 | CURRENT_STATUS.md | Governance tracking | LOGAN |

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — BEHAVIOR.md; remove note file; React hooks scope decision; DI freeze guard; console.warn fix
- **VENOM** — Security review after BEHAVIOR.md: membership gating on read paths, block check completeness
- **SPIDER-MAN** — sendMessage idempotency tests; block check tests; membership validation tests
- **LOKI** — Runtime trace: send_message_atomic RPC path; Realtime subscription lifecycle; outbox event flow
- **CARNAGE** — DB schema: conversation_keys + participant_snapshots tables (missing DAL); audit_log write path (only via RPC)
- **IRONMAN** — Ownership: React hooks in engine decision; VCSM-only vs multi-app scope declaration
- **LOGAN** — Remove `note` file; ARCHITECTURE.md, BEHAVIOR.md, SECURITY.md, CURRENT_STATUS.md governance artifacts
